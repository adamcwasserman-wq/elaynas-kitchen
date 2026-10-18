// The mini games. Each one draws itself into "stage" and calls hooks.finish(result) at the end.
// Leaving early is always fine: the caller just stops the game.

import { use } from './art.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);

// ---------- Skee ball: swipe up to roll a ball into the rings ----------
export function playSkeeBall(stage, mode, cfg, hooks) {
  stage.innerHTML = `<canvas class="skee" aria-label="Skee ball lane"></canvas><p class="game-hint" id="skee-hint">Swipe up to roll the ball</p>`;
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const W = stage.clientWidth, H = stage.clientHeight - 30;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
  ctx.scale(dpr, dpr);

  // Lane and target, in screen pixels.
  const top = H * 0.05, bottom = H * 0.98;
  const halfTop = W * 0.30, halfBottom = W * 0.47;
  const cx = W / 2, cy = H * 0.27;
  const rx = Math.min(W * 0.26 * mode.ringScale, W * 0.33), ry = rx * 0.62;
  const ringStops = [1, 0.84, 0.66, 0.44, 0.22];
  const ringScores = [10, 20, 30, 40, 50];
  const ringColours = ['#fff3dc', '#e8475f', '#fff3dc', '#5b2c6f', '#f6b62e'];
  const pocketR = W * 0.05 * mode.ringScale;
  const pockets = [[cx - rx - pocketR * 1.4, cy - ry * 1.15], [cx + rx + pocketR * 1.4, cy - ry * 1.15]];
  const startY = H * 0.86;
  const radiusAt = y => (W * 0.026) + (W * 0.03) * Math.max(0, Math.min(1, (y - top) / (bottom - top)));
  const laneHalf = y => halfTop + (halfBottom - halfTop) * Math.max(0, Math.min(1, (y - top) / (bottom - top)));

  let ballNo = 0, score = 0, ball = { x: cx, y: startY }, anim = null, done = false, swipe = null, popText = null;
  hooks.status(`Ball 1 of ${cfg.balls} · Score 0`);

  function scoreAt(x, y) {
    for (const [px, py] of pockets) if (Math.hypot(x - px, y - py) < pocketR * 1.25) return 100;
    const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
    for (let k = ringStops.length - 1; k >= 0; k--) if (d < ringStops[k] * (k === 0 ? 1.1 : 1)) return ringScores[k];
    return 0;
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    // lane
    ctx.fillStyle = '#d9a466';
    ctx.beginPath(); ctx.moveTo(cx - halfTop, top); ctx.lineTo(cx + halfTop, top); ctx.lineTo(cx + halfBottom, bottom); ctx.lineTo(cx - halfBottom, bottom); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(122,59,31,.18)'; ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      const f = i / 6;
      ctx.beginPath(); ctx.moveTo(cx - halfTop + (halfTop * 2) * f, top); ctx.lineTo(cx - halfBottom + (halfBottom * 2) * f, bottom); ctx.stroke();
    }
    ctx.fillStyle = '#b5773a';
    ctx.fillRect(cx - halfTop - 10, top - 8, halfTop * 2 + 20, 14);
    // rings
    ringStops.forEach((s, k) => {
      ctx.fillStyle = ringColours[k];
      ctx.beginPath(); ctx.ellipse(cx, cy, rx * s, ry * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(58,42,42,.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    });
    ctx.font = `bold ${Math.round(W * 0.034)}px Righteous, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ringScores.forEach((v, k) => {
      const xx = k === 4 ? cx : cx - rx * (ringStops[k] + ringStops[k + 1]) / 2;
      ctx.fillStyle = ringColours[k] === '#fff3dc' ? '#3a2a2a' : '#fff';
      ctx.fillText(String(v), xx, cy);
    });
    for (const [px, py] of pockets) {
      ctx.fillStyle = '#3d2a44'; ctx.beginPath(); ctx.arc(px, py, pocketR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd34d'; ctx.fillText('100', px, py - pocketR - 10);
    }
    // ball
    let bx = ball.x, by = ball.y;
    if (anim) {
      const t = Math.min(1, (now - anim.t0) / anim.dur);
      const e = easeOut(t);
      bx = anim.x0 + (anim.x1 - anim.x0) * e;
      by = anim.y0 + (anim.y1 - anim.y0) * e - Math.sin(Math.min(1, t * 1.2) * Math.PI) * (anim.hop || 0);
      if (t >= 1) landed(anim);
    }
    const r = radiusAt(by);
    ctx.fillStyle = 'rgba(122,59,31,.25)'; ctx.beginPath(); ctx.ellipse(bx + 2, by + r * .6, r, r * .4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b2c6f'; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(bx - r * .35, by - r * .35, r * .3, 0, Math.PI * 2); ctx.fill();
    if (popText && now - popText.t0 < 900) {
      const k = (now - popText.t0) / 900;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = popText.v ? '#2a6e2a' : '#7a5f52';
      ctx.font = `bold ${Math.round(W * 0.07)}px Righteous, sans-serif`;
      ctx.fillText(popText.v ? `+${popText.v}` : popText.miss, popText.x, popText.y - 30 * k);
      ctx.globalAlpha = 1;
    }
    if (!done) raf = requestAnimationFrame(draw);
  }

  function landed(a) {
    anim = null;
    const v = a.score;
    score += v;
    popText = { v, x: a.x1, y: a.y1, t0: performance.now(), miss: a.short ? 'Too short!' : 'Missed!' };
    hooks.buzz(v >= 50 ? 'serve' : v > 0 ? 'merge' : 'nope');
    ballNo++;
    hooks.status(`Ball ${Math.min(ballNo + 1, cfg.balls)} of ${cfg.balls} · Score ${score}`);
    if (ballNo >= cfg.balls) {
      setTimeout(() => { done = true; hooks.finish({ score }); }, 900);
    } else {
      setTimeout(() => { ball = { x: cx, y: startY }; }, 450);
    }
  }

  function roll(x0, y0, x1, y1, dt) {
    const dy = y0 - y1;
    if (dy < 25) { stage.querySelector('#skee-hint').textContent = 'Swipe upward to roll!'; return; }
    const speed = dy / Math.max(40, dt);
    const travel = Math.max(H * 0.12, Math.min(speed * (startY - cy) / 1.35, startY - top + 30));
    let ly = startY - travel, lx = x0 + (x1 - x0) * (travel / dy) * 0.9;
    let bounce = false, short = false;
    if (ly < top + 12) { ly = cy - ry * 0.92; bounce = true; }
    if (mode.assist) { lx += (cx - lx) * mode.assist; ly += (cy - ly) * mode.assist * 0.6; }
    const half = laneHalf(ly) - radiusAt(ly);
    lx = Math.max(cx - half, Math.min(cx + half, lx));
    let s = scoreAt(lx, ly);
    if (bounce && s === 0) s = 10;
    if (ly > cy + ry * 1.15) { short = true; s = 0; }
    anim = { x0: ball.x, y0: ball.y, x1: lx, y1: ly, t0: performance.now(), dur: 950, hop: H * 0.025, score: s, short };
    stage.querySelector('#skee-hint').textContent = 'Swipe up to roll the ball';
  }

  // A swipe is judged on its last moment: where the finger was about 0.15 seconds before letting go.
  const pt = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
  canvas.addEventListener('pointerdown', e => {
    if (anim || done || ballNo >= cfg.balls) return;
    const p = pt(e);
    swipe = [p];
    ball = { x: Math.max(cx - halfBottom * .8, Math.min(cx + halfBottom * .8, p.x)), y: startY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!swipe || anim) return;
    swipe.push(pt(e));
    if (swipe.length > 40) swipe.shift();
  });
  canvas.addEventListener('pointerup', e => {
    if (!swipe || anim) { swipe = null; return; }
    const end = pt(e);
    let from = swipe.find(p => end.t - p.t < 150) || swipe[0];
    if (from.y - end.y < 25) from = swipe[0]; // a slow push still rolls, just gently
    roll(from.x, from.y, end.x, end.y, end.t - from.t);
    swipe = null;
  });

  let raf = requestAnimationFrame(draw);
  return () => { done = true; cancelAnimationFrame(raf); };
}

// ---------- Matching: flip two cards to find pairs ----------
export function playMatching(stage, mode, cfg, hooks, artIds) {
  const pool = [...artIds].sort(() => Math.random() - .5).slice(0, cfg.pairs);
  const deck = [...pool, ...pool].sort(() => Math.random() - .5);
  stage.innerHTML = `<div class="match-timer"><i id="match-bar"></i></div>
    <div class="match-grid">${deck.map((id, n) => `<button class="card" data-n="${n}" aria-label="Card">
      <span class="card-back"><svg viewBox="-14 -14 28 28" aria-hidden="true"><path d="M-10,-6 L-5,-1 L0,-10 L5,-1 L10,-6 C10,6 6,10 0,10 C-6,10 -10,6 -10,-6 Z" fill="#fff" opacity=".55"/></svg></span><span class="card-front">${use(id)}</span></button>`).join('')}</div>`;
  const cards = [...stage.querySelectorAll('.card')];
  let open = [], found = 0, lock = false, done = false;
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
    setTimeout(() => hooks.finish({ found, all: found === cfg.pairs }), 500);
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

  return () => { done = true; clearInterval(timer); };
}
