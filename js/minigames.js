// The mini games. Each one draws itself into "stage" and calls hooks.finish(result) at the end.
// Leaving early is always fine: the caller just stops the game.

import { use } from './art.js';

// A fair shuffle (every order equally likely).
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- Skee ball: grab a ball from the chute, flick it up the hill, fly it into the rings ----------
// A roll that's too gentle just rolls back to the chute to try again; no ball is used up.
// The last ball is golden and scores double.
export function playSkeeBall(stage, mode, cfg, hooks) {
  stage.innerHTML = `<canvas class="skee" aria-label="Skee ball"></canvas><p class="game-hint" id="skee-hint">Grab a ball from the chute and flick it up the hill!</p>`;
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const W = stage.clientWidth, H = stage.clientHeight - 30;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
  ctx.scale(dpr, dpr);
  const hint = t => { const el = stage.querySelector('#skee-hint'); if (el) el.textContent = t; };

  // ----- the lane, the hill, the rings and the chute (screen pixels) -----
  const lx0 = W * 0.42;                        // lane centre (left of middle, the chute is on the right)
  const top = H * 0.04, bottom = H * 0.985;
  const halfTop = W * 0.27, halfBottom = W * 0.36;
  const laneHalf = y => halfTop + (halfBottom - halfTop) * Math.max(0, Math.min(1, (y - top) / (bottom - top)));
  const hillY = H * 0.5, hillH = H * 0.045;
  const cx = lx0, cy = H * 0.22;
  const rx = Math.min(W * 0.2 * mode.ringScale, W * 0.25), ry = rx * 0.62;
  const ringStops = [1, 0.8, 0.6, 0.4, 0.2];
  const ringScores = [10, 20, 30, 40, 50];
  const ringColours = ['#fff3dc', '#e8475f', '#fff3dc', '#5b2c6f', '#f6b62e'];
  const pocketR = W * 0.045 * mode.ringScale;
  const pockets = [[cx - rx - pocketR * 1.5, cy - ry * 1.15], [cx + rx + pocketR * 1.5, cy - ry * 1.15]];
  const bR = W * 0.05;                          // ball radius near the player
  const radiusAt = y => bR * (0.55 + 0.45 * Math.max(0, Math.min(1, (y - top) / (bottom - top))));
  const chuteX = W * 0.9, chuteTop = H * 0.48, slotY = k => H * 0.93 - k * bR * 2.15;
  const grabZone = H * 0.62;                    // she holds the ball below this line

  // ----- state -----
  let thrown = 0, score = 0, done = false, stopped = false;
  const tray = [];                              // balls waiting in the chute: { y, vy, golden }
  let ball = null;                              // the ball in her hand or in play
  let samples = [];
  const particles = [], popups = [];
  let flash = null;                             // { ring, t0 } a ring lighting up

  // Balls pop out of the chute one after another and bounce into place.
  const spawn = (k, delay) => setTimeout(() => {
    if (stopped) return;
    tray.push({ y: chuteTop, vy: 0, golden: k === cfg.balls - 1 });
    hooks.buzz('tap');
  }, delay);
  for (let k = 0; k < cfg.balls; k++) spawn(k, 250 + k * 180);
  const status = () => hooks.status(`Ball ${Math.min(thrown + 1, cfg.balls)} of ${cfg.balls} · ${score} pts`);
  status();

  function scoreAt(x, y) {
    for (const [px, py] of pockets) if (Math.hypot(x - px, y - py) < pocketR * 1.3) return { pts: 100, ring: 'pocket' };
    const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
    for (let k = ringStops.length - 1; k >= 0; k--) if (d < ringStops[k] * (k === 0 ? 1.12 : 1)) return { pts: ringScores[k], ring: k };
    return { pts: 0, ring: null };
  }

  function burst(x, y, n, colours) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 4;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 1, c: colours[i % colours.length], r: 2 + Math.random() * 3 });
    }
  }

  // ----- throwing -----
  function release(p) {
    const recent = samples.filter(s => p.t - s.t < 130);
    const from = recent[0] || samples[0] || p;
    const dt = Math.max(16, p.t - from.t);
    const vy = (from.y - p.y) / dt, vx = (p.x - from.x) / dt;
    const x0 = ball.x, y0 = ball.y;
    if (vy < 0.35) {                            // not really a flick: the ball rolls back to the chute
      ball.phases = [{ kind: 'back', x0, y0, x1: chuteX, y1: slotY(tray.length), dur: 450 }];
      hint('Flick it upward to send it up the hill!');
      return;
    }
    const pMin = 0.75, pSweet = mode.ringScale > 1 ? 1.55 : 1.7;
    const dxr = Math.max(-0.6, Math.min(0.6, vx / vy));
    const toHill = y0 - hillY;
    let xh = x0 + dxr * toHill * 0.8;
    const rollDur = Math.max(220, Math.min(800, toHill / (vy * 0.85)));
    if (vy < pMin) {                            // too gentle: rolls part way up, then back to her
      const f = 0.35 + 0.55 * (vy / pMin);
      const yTurn = y0 - toHill * f, xTurn = x0 + (xh - x0) * f;
      ball.phases = [
        { kind: 'roll', x0, y0, x1: xTurn, y1: yTurn, dur: rollDur * f, ease: 'out' },
        { kind: 'back', x0: xTurn, y0: yTurn, x1: chuteX, y1: slotY(tray.length), dur: 650 },
      ];
      hint('Almost! Flick a little harder.');
      return;
    }
    const flight = (vy - pMin) * (hillY - cy) / (pSweet - pMin);
    let ly = hillY - flight, lxl = xh + dxr * flight * 0.8;
    if (mode.assist) { lxl += (cx - lxl) * mode.assist; ly += (cy - ly) * mode.assist * 0.5; }
    // Too far: unless it drops into a 100 pocket, it hits the back wall and falls into the 10 ring.
    let bounce = false;
    const inPocket = pockets.some(([px, py]) => Math.hypot(lxl - px, ly - py) < pocketR * 1.3);
    if (!inPocket && ly < cy - ry * 0.9) { ly = cy - ry * 0.95; bounce = true; }
    xh = Math.max(lx0 - laneHalf(hillY) + bR, Math.min(lx0 + laneHalf(hillY) - bR, xh));
    lxl = Math.max(lx0 - laneHalf(ly) + bR * .6, Math.min(lx0 + laneHalf(ly) - bR * .6, lxl));
    const airDur = Math.max(520, Math.min(900, 480 + flight * 1.2));
    ball.phases = [
      { kind: 'roll', x0, y0, x1: xh, y1: hillY, dur: rollDur },
      { kind: 'air', x0: xh, y0: hillY, x1: lxl, y1: bounce ? top + 4 : ly, dur: airDur, h: Math.min(H * 0.16, 30 + flight * 0.45) },
    ];
    if (bounce) ball.phases.push({ kind: 'air', x0: lxl, y0: top + 4, x1: lxl, y1: ly, dur: 380, h: H * 0.03 });
    ball.phases.push({ kind: 'land', x0: lxl, y0: ly, x1: lxl, y1: ly, dur: 220 });
    thrown++;
    hint(' ');
  }

  function landed(b) {
    const { pts: raw, ring } = scoreAt(b.x, b.y);
    const short = b.y > cy + ry * 1.2;
    const pts = short ? 0 : raw * (b.golden ? 2 : 1);
    score += pts;
    if (pts) {
      flash = { ring, t0: performance.now() };
      burst(b.x, b.y, pts >= 100 ? 40 : pts >= 40 ? 24 : 10, ['#f6b62e', '#e8475f', '#5b2c6f', '#3f9b3c', '#fff']);
    }
    const words = pts >= 100 ? 'AMAZING!' : pts >= 80 ? 'WOW!' : pts >= 50 ? 'Bullseye!' : pts >= 30 ? 'Nice!' : pts > 0 ? 'Good!' : short ? 'So close!' : 'Oops!';
    popups.push({ x: b.x, y: b.y, t0: performance.now(), text: pts ? `+${pts}` : '', words });
    hooks.buzz(pts >= 50 ? 'serve' : pts > 0 ? 'merge' : 'nope');
    status();
    if (thrown >= cfg.balls) setTimeout(() => { done = true; if (!stopped) hooks.finish({ score }); }, 1300);
    else hint(tray.length ? 'Grab the next ball!' : ' ');
  }

  // ----- drawing -----
  const ease = { out: t => 1 - Math.pow(1 - t, 3), in: t => t * t, linear: t => t };
  function step(now) {
    // the ball's journey
    if (ball && ball.phases) {
      const ph = ball.phases[0];
      ph.t0 ??= now;
      const t = Math.min(1, (now - ph.t0) / ph.dur);
      const e = ph.kind === 'roll' ? ease[ph.ease || 'linear'](t) : ph.kind === 'back' ? ease.out(t) : ease.linear(t);
      ball.x = ph.x0 + (ph.x1 - ph.x0) * e;
      ball.y = ph.y0 + (ph.y1 - ph.y0) * e;
      ball.lift = ph.kind === 'air' ? Math.sin(t * Math.PI) * ph.h : 0;
      ball.shrink = ph.kind === 'land' ? 1 - t * 0.6 : 1;
      ball.spin = (ball.spin || 0) + (ph.kind === 'land' ? 0 : 0.25);
      if (t >= 1) {
        ball.phases.shift();
        if (ph.kind === 'back') { tray.unshift({ y: ball.y, vy: 0, golden: ball.golden }); ball = null; }
        else if (!ball.phases.length) { landed(ball); ball = null; }
      }
    }
    // balls in the chute fall and bounce into their slots
    tray.forEach((b, k) => {
      const target = slotY(k);
      b.vy += 0.9; b.y += b.vy;
      if (b.y > target) { b.y = target; b.vy = Math.abs(b.vy) > 2 ? -b.vy * 0.35 : 0; }
    });
    for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life -= 0.02; }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
  }

  function drawBall(x, y, r, golden, spin = 0, lift = 0, shrink = 1) {
    ctx.fillStyle = 'rgba(122,59,31,.28)';
    ctx.beginPath(); ctx.ellipse(x + 2, y + r * .55, r * (1 - lift / (H * .4)), r * .38, 0, 0, Math.PI * 2); ctx.fill();
    const by = y - lift, rr = r * (1 + lift / (H * .5)) * shrink;
    ctx.fillStyle = golden ? '#f6b62e' : '#5b2c6f';
    ctx.beginPath(); ctx.arc(x, by, rr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = golden ? '#fff4a8' : '#8b55a6'; ctx.lineWidth = rr * .22;
    ctx.beginPath(); ctx.arc(x, by, rr * .62, spin, spin + 1.6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(x - rr * .35, by - rr * .38, rr * .26, 0, Math.PI * 2); ctx.fill();
  }

  function draw(now) {
    step(now);
    ctx.clearRect(0, 0, W, H);
    // lane
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, '#c98a4a'); g.addColorStop(1, '#e2ae6c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(lx0 - halfTop, top); ctx.lineTo(lx0 + halfTop, top); ctx.lineTo(lx0 + halfBottom, bottom); ctx.lineTo(lx0 - halfBottom, bottom); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(122,59,31,.16)'; ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) { const f = i / 6; ctx.beginPath(); ctx.moveTo(lx0 - halfTop + halfTop * 2 * f, top); ctx.lineTo(lx0 - halfBottom + halfBottom * 2 * f, bottom); ctx.stroke(); }
    // side rails
    ctx.fillStyle = '#5b2c6f';
    ctx.beginPath(); ctx.moveTo(lx0 - halfTop - 8, top); ctx.lineTo(lx0 - halfTop, top); ctx.lineTo(lx0 - halfBottom, bottom); ctx.lineTo(lx0 - halfBottom - 12, bottom); ctx.fill();
    ctx.beginPath(); ctx.moveTo(lx0 + halfTop + 8, top); ctx.lineTo(lx0 + halfTop, top); ctx.lineTo(lx0 + halfBottom, bottom); ctx.lineTo(lx0 + halfBottom + 12, bottom); ctx.fill();
    // the hill
    const hh = laneHalf(hillY);
    const hg = ctx.createLinearGradient(0, hillY - hillH, 0, hillY + hillH);
    hg.addColorStop(0, '#f6d79a'); hg.addColorStop(0.5, '#e8a64e'); hg.addColorStop(1, '#a8692a');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(lx0 - hh, hillY + hillH); ctx.quadraticCurveTo(lx0, hillY - hillH * 2.2, lx0 + hh, hillY + hillH);
    ctx.lineTo(lx0 + hh, hillY + hillH * 1.5); ctx.quadraticCurveTo(lx0, hillY - hillH * 0.6, lx0 - hh, hillY + hillH * 1.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.font = `bold ${Math.round(W * 0.032)}px Righteous, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▲ ▲ ▲', lx0, hillY + hillH * 3.2);
    // back board and rings
    ctx.fillStyle = '#3d2a44';
    ctx.beginPath(); ctx.roundRect(lx0 - halfTop + 4, top + 4, halfTop * 2 - 8, (cy + ry * 1.35) - top, 14); ctx.fill();
    ringStops.forEach((s, k) => {
      const lit = flash && flash.ring === k && now - flash.t0 < 600 && Math.floor((now - flash.t0) / 100) % 2 === 0;
      ctx.fillStyle = lit ? '#fff' : ringColours[k];
      ctx.beginPath(); ctx.ellipse(cx, cy, rx * s, ry * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(58,42,42,.3)'; ctx.lineWidth = 1.5; ctx.stroke();
    });
    ctx.font = `bold ${Math.round(W * 0.032)}px Righteous, sans-serif`;
    ringScores.forEach((v, k) => {
      // labels alternate left and right so they have room
      const side = k % 2 ? 1 : -1;
      const xx = k === 4 ? cx : cx + side * rx * (ringStops[k] + ringStops[k + 1]) / 2;
      ctx.fillStyle = ringColours[k] === '#fff3dc' ? '#3a2a2a' : '#fff';
      ctx.fillText(String(v), xx, cy);
    });
    for (const [px, py] of pockets) {
      const lit = flash && flash.ring === 'pocket' && now - flash.t0 < 700 && Math.floor((now - flash.t0) / 90) % 2 === 0;
      ctx.fillStyle = lit ? '#ffd34d' : '#1f1424'; ctx.beginPath(); ctx.arc(px, py, pocketR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f6b62e'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#ffd34d'; ctx.fillText('100', px, py - pocketR - 9);
    }
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(W * 0.045)}px Righteous, sans-serif`;
    ctx.fillText(`${score}`, lx0, top + 22);
    // the chute on the right, with balls waiting
    ctx.fillStyle = '#b5773a';
    ctx.beginPath(); ctx.roundRect(chuteX - bR * 1.25, chuteTop - bR, bR * 2.5, H * 0.96 - chuteTop + bR * 1.4, bR * 1.25); ctx.fill();
    ctx.fillStyle = '#7a4b3a';
    ctx.beginPath(); ctx.roundRect(chuteX - bR * 1.05, chuteTop - bR * .8, bR * 2.1, H * 0.96 - chuteTop + bR, bR); ctx.fill();
    tray.forEach(b => drawBall(chuteX, b.y, bR * .92, b.golden));
    // particles
    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // the ball in play
    if (ball) drawBall(ball.x, ball.y, radiusAt(ball.y), ball.golden, ball.spin, ball.lift || 0, ball.shrink ?? 1);
    // score popups
    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i], k = (now - p.t0) / 1100;
      if (k >= 1) { popups.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - k;
      ctx.font = `bold ${Math.round(W * 0.075)}px Righteous, sans-serif`;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 5;
      const y = p.y - 26 - 40 * k;
      if (p.text) { ctx.strokeText(p.text, p.x, y); ctx.fillText(p.text, p.x, y); }
      ctx.font = `bold ${Math.round(W * 0.045)}px Righteous, sans-serif`;
      ctx.strokeText(p.words, p.x, y + 30); ctx.fillStyle = '#ffd34d'; ctx.fillText(p.words, p.x, y + 30);
      ctx.globalAlpha = 1;
    }
    if (!stopped && !(done && !particles.length && !popups.length)) raf = requestAnimationFrame(draw);
  }

  // ----- touch: grab the next ball, drag it, flick it -----
  const pt = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
  const clampHold = p => ({
    x: Math.max(lx0 - laneHalf(p.y) + bR, Math.min(lx0 + laneHalf(p.y) - bR, p.x)),
    y: Math.max(grabZone, Math.min(bottom - bR, p.y)),
  });
  canvas.addEventListener('pointerdown', e => {
    if (ball || done || !tray.length || thrown >= cfg.balls) return;
    const p = pt(e);
    if (p.y < grabZone - bR * 2) return;       // touch the lower part of the screen to grab a ball
    const next = tray.shift();
    const h = clampHold(p);
    ball = { x: h.x, y: h.y, golden: next.golden, held: true };
    samples = [p];
    hooks.buzz('tap');
    hint(next.golden ? 'Golden ball: double points! Flick it up the hill.' : 'Now flick it up the hill!');
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!ball || !ball.held) return;
    const p = pt(e);
    samples.push(p);
    if (samples.length > 30) samples.shift();
    const h = clampHold(p);
    ball.x = h.x; ball.y = h.y;
  });
  const up = e => {
    if (!ball || !ball.held) return;
    ball.held = false;
    release(pt(e));
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  let raf = requestAnimationFrame(draw);
  return () => { done = true; stopped = true; cancelAnimationFrame(raf); };
}

// ---------- Matching: flip two cards to find pairs ----------
export function playMatching(stage, mode, cfg, hooks, artIds) {
  const pool = shuffle(artIds).slice(0, cfg.pairs);
  const deck = shuffle([...pool, ...pool]);
  stage.innerHTML = `<div class="match-timer"><i id="match-bar"></i></div>
    <div class="match-grid">${deck.map((id, n) => `<button class="card" data-n="${n}" aria-label="Card">
      <span class="card-back"><svg viewBox="-14 -14 28 28" aria-hidden="true"><path d="M-10,-6 L-5,-1 L0,-10 L5,-1 L10,-6 C10,6 6,10 0,10 C-6,10 -10,6 -10,-6 Z" fill="#fff" opacity=".55"/></svg></span><span class="card-front">${use(id)}</span></button>`).join('')}</div>`;
  const cards = [...stage.querySelectorAll('.card')];
  let open = [], found = 0, lock = false, done = false, stopped = false;
  const t0 = performance.now(), total = mode.seconds * 1000;
  hooks.status(`Pairs found 0 of ${cfg.pairs}`);

  const timer = setInterval(() => {
    const left = Math.max(0, 1 - (performance.now() - t0) / total);
    stage.querySelector('#match-bar').style.width = `${left * 100}%`;
    if (left <= 0) end();
  }, 200);

  function end() {
    if (done) return;
    done = true;
    clearInterval(timer);
    setTimeout(() => { if (!stopped) hooks.finish({ found, all: found === cfg.pairs }); }, 500);
  }

  stage.querySelector('.match-grid').addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card || lock || done || card.classList.contains('up')) return;
    card.classList.add('up');
    hooks.buzz('tap');
    open.push(card);
    if (open.length < 2) return;
    const [a, b] = open;
    open = [];
    if (deck[+a.dataset.n] === deck[+b.dataset.n]) {
      found++;
      a.classList.add('matched'); b.classList.add('matched');
      hooks.buzz('merge');
      hooks.status(`Pairs found ${found} of ${cfg.pairs}`);
      if (found === cfg.pairs) end();
    } else {
      lock = true;
      setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); lock = false; }, 750);
    }
  });

  return () => { done = true; stopped = true; clearInterval(timer); };
}
