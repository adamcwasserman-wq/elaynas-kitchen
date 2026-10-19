// Mini golf. One hole at a time: flick the ball toward the cup, like a skee ball roll.
// The faster the flick, the harder the putt. A swipe that stops before letting go is cancelled.
// Calls hooks.finish({ strokes, par, holeInOne }) when the ball drops in,
// or hooks.finish({ strokes: null, par }) when the ball is picked up after too many shots.

import { MINIGOLF } from '../data/minigolf.js';

const FW = 100, FH = 160;                 // the course, in course units
const BALL_R = 2, CUP_R = 3.4, RAIL = 1.4;
const PHYS = {
  roll: 55,            // how fast a rolling ball slows down
  drag: 0.55,          // extra slowing for fast balls
  sandRoll: 280,       // slowing in sand
  stopSpeed: 4,        // slower than this for a moment and the ball stops
  restAfter: 0.22,
  maxSpeed: 260,
  flick: 0.3,          // ball speed per unit of finger speed
  minSpeed: 6,         // softer than this and the swipe doesn't count
  wall: 0.72,          // how springy the rails are
  mover: 0.9,
};
const TURF = '#5cbf4a', TURF2 = '#67c955';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TAU = Math.PI * 2;

// ---------- shapes ----------
const rectPoly = ([x, y, w, h]) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
function arcPoints([x, y, r, a0, a1]) {
  const n = Math.max(6, Math.round(Math.abs(a1 - a0) / 9)), pts = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
  return pts;
}
function inPoly(pts, x, y) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
function inside(sh, x, y) {
  if (sh.rect) { const [rx, ry, w, h] = sh.rect; return x >= rx && x <= rx + w && y >= ry && y <= ry + h; }
  if (sh.circle) { const [cx, cy, r] = sh.circle; return Math.hypot(x - cx, y - cy) <= r; }
  if (sh.poly) return inPoly(sh.poly, x, y);
  return false;
}
function shapePath(ctx, sh) {
  ctx.beginPath();
  if (sh.rect) { const [x, y, w, h] = sh.rect; ctx.roundRect(x, y, w, h, 1.2); }
  else if (sh.circle) { const [x, y, r] = sh.circle; ctx.arc(x, y, r, 0, TAU); }
  else if (sh.poly) { sh.poly.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }
}

// Walls the ball bounces off: straight pieces ("segs") and round bumpers ("circles").
function compile(hole) {
  const segs = [], circles = [];
  const addPts = (pts, closed, pad, bounce) => {
    for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      segs.push({ ax: a[0], ay: a[1], bx: b[0], by: b[1], pad, bounce });
    }
  };
  addPts(hole.outline, true, RAIL, PHYS.wall);
  for (const b of hole.blocks || []) {
    const e = b.bounce ?? PHYS.wall;
    if (b.circle) circles.push({ x: b.circle[0], y: b.circle[1], r: b.circle[2], bounce: e });
    else if (b.rect) addPts(rectPoly(b.rect), true, 0, e);
    else if (b.poly) addPts(b.poly, true, 0, e);
    else if (b.arc) addPts(arcPoints(b.arc), false, b.w / 2, e);
  }
  return { segs, circles };
}

// Push the ball out of something it overlaps and bounce it. Returns how hard it hit (0 if no hit).
function pushOut(b, cx, cy, minD, bounce, mvx = 0, mvy = 0) {
  let nx = b.x - cx, ny = b.y - cy;
  const d = Math.hypot(nx, ny);
  if (d >= minD) return 0;
  if (d < 1e-6) { nx = 0; ny = -1; } else { nx /= d; ny /= d; }
  b.x = cx + nx * minD; b.y = cy + ny * minD;
  const rvx = b.vx - mvx, rvy = b.vy - mvy, vn = rvx * nx + rvy * ny;
  if (vn >= 0) return 0.001;
  let out = -vn * bounce;
  if (bounce > 1) out = Math.max(out, 45);   // bumpers always give a little kick
  b.vx = rvx - vn * nx + out * nx + mvx;
  b.vy = rvy - vn * ny + out * ny + mvy;
  return -vn;
}
const closestOnSeg = (s, x, y) => {
  const dx = s.bx - s.ax, dy = s.by - s.ay;
  const t = clamp(((x - s.ax) * dx + (y - s.ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return [s.ax + dx * t, s.ay + dy * t];
};
function hitStatics(b, W, bounceOverride) {
  let hit = 0;
  for (const s of W.segs) { const [cx, cy] = closestOnSeg(s, b.x, b.y); hit = Math.max(hit, pushOut(b, cx, cy, BALL_R + s.pad, bounceOverride ?? s.bounce)); }
  for (const c of W.circles) hit = Math.max(hit, pushOut(b, c.x, c.y, BALL_R + c.r, bounceOverride ?? c.bounce));
  return hit;
}

// Where the moving things are at time t (seconds), as walls with their own speed.
function moverParts(m, t) {
  if (m.type === 'spin') {
    const a0 = m.speed * t, parts = [{ circle: true, x: m.x, y: m.y, r: m.w * 0.9, vx: 0, vy: 0 }];
    for (let i = 0; i < m.n; i++) {
      const a = a0 + i * TAU / m.n;
      parts.push({ ax: m.x, ay: m.y, bx: m.x + Math.cos(a) * m.len, by: m.y + Math.sin(a) * m.len, pad: m.w / 2, spin: m });
    }
    return parts;
  }
  const w = TAU / m.period, ph = (1 - Math.cos(w * t)) / 2, dph = Math.sin(w * t) * w / 2;
  const x = m.from[0] + (m.to[0] - m.from[0]) * ph, y = m.from[1] + (m.to[1] - m.from[1]) * ph;
  const vx = (m.to[0] - m.from[0]) * dph, vy = (m.to[1] - m.from[1]) * dph;
  if (m.len) return [{ ax: x - m.len / 2, ay: y, bx: x + m.len / 2, by: y, pad: m.r, vx, vy, x, y }];
  return [{ circle: true, x, y, r: m.r, vx, vy }];
}
function hitMovers(b, movers, t) {
  let hit = 0;
  for (const m of movers) for (const p of moverParts(m, t)) {
    if (p.circle) { hit = Math.max(hit, pushOut(b, p.x, p.y, BALL_R + p.r, PHYS.mover, p.vx, p.vy)); continue; }
    const [cx, cy] = closestOnSeg(p, b.x, b.y);
    const vx = p.spin ? -p.spin.speed * (cy - p.spin.y) : p.vx, vy = p.spin ? p.spin.speed * (cx - p.spin.x) : p.vy;
    hit = Math.max(hit, pushOut(b, cx, cy, BALL_R + p.pad, PHYS.mover, vx, vy));
  }
  return hit;
}

// ---------- drawing ----------
// Everything is drawn in course units; the caller sets the scale.
let seed = 1;
const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const circ = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
const ell = (ctx, x, y, rx, ry, c, rot = 0) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill(); };
const shadow = (ctx, x, y, r) => ell(ctx, x + r * .18, y + r * .3, r * 1.02, r * .95, 'rgba(70,40,20,.22)');

// A food friend face: dot eyes, rosy cheeks, a small smile.
function face(ctx, x, y, s) {
  circ(ctx, x - s * .3, y - s * .08, s * .1, '#3a2a2a');
  circ(ctx, x + s * .3, y - s * .08, s * .1, '#3a2a2a');
  ell(ctx, x - s * .5, y + s * .15, s * .14, s * .09, 'rgba(242,107,107,.6)');
  ell(ctx, x + s * .5, y + s * .15, s * .14, s * .09, 'rgba(242,107,107,.6)');
  ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = s * .08; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y + s * .06, s * .17, .2 * Math.PI, .8 * Math.PI); ctx.stroke();
}
const gloss = (ctx, x, y, r) => ell(ctx, x - r * .38, y - r * .42, r * .26, r * .16, 'rgba(255,255,255,.55)', -.6);

const LOOKS = {
  pizza(ctx, x, y, r) {
    circ(ctx, x, y, r, '#e2a35a'); circ(ctx, x + r * .06, y + r * .08, r * .95, '#c98340');
    circ(ctx, x, y, r * .86, '#e2412f'); circ(ctx, x, y, r * .76, '#ffd66b');
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + .3; circ(ctx, x + Math.cos(a) * r * .52, y + Math.sin(a) * r * .52, r * .13, '#b8322a'); }
    ell(ctx, x + r * .3, y - r * .55, r * .12, r * .06, '#3f9b3c', .5);
    face(ctx, x, y + r * .05, r * .55); gloss(ctx, x, y, r);
  },
  taco(ctx, x, y, r) {
    ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.ellipse(x, y, r, r * .8, 0, Math.PI * .95, Math.PI * 2.05); ctx.closePath(); ctx.fill();
    ell(ctx, x, y - r * .05, r * .85, r * .2, '#5cb85c'); circ(ctx, x - r * .4, y - r * .12, r * .12, '#e2412f'); circ(ctx, x + r * .35, y - r * .1, r * .12, '#e2412f');
    ctx.fillStyle = '#f6cf6a'; ctx.beginPath(); ctx.ellipse(x, y + r * .05, r, r * .7, 0, 0, Math.PI); ctx.fill();
    face(ctx, x, y + r * .3, r * .5); gloss(ctx, x, y + r * .2, r * .8);
  },
  cactus(ctx, x, y, r) {
    circ(ctx, x, y, r, '#3f9b3c'); circ(ctx, x + r * .1, y + r * .1, r * .85, '#2f8a3c');
    circ(ctx, x, y, r * .8, '#4fb04a');
    ctx.strokeStyle = '#2c7a33'; ctx.lineWidth = r * .07;
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * .3, y + Math.sin(a) * r * .3); ctx.lineTo(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8); ctx.stroke(); }
    circ(ctx, x + r * .5, y - r * .55, r * .2, '#e8475f');
    face(ctx, x, y, r * .55); gloss(ctx, x, y, r);
  },
  sushi(ctx, x, y, r) {
    circ(ctx, x, y, r, '#1f3b2c'); circ(ctx, x, y, r * .8, '#fdfaf2'); circ(ctx, x, y, r * .42, '#f28a5b');
    face(ctx, x, y + r * .02, r * .5); gloss(ctx, x, y, r);
  },
  burger(ctx, x, y, r) {
    circ(ctx, x, y, r, '#5cb85c');
    circ(ctx, x, y, r * .92, '#d98a3d'); circ(ctx, x + r * .1, y + r * .12, r * .8, '#c97a30'); circ(ctx, x - r * .04, y - r * .04, r * .8, '#e9a14f');
    for (let i = 0; i < 9; i++) { const a = i * 2.4, d = r * (.25 + (i % 3) * .2); ell(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d - r * .1, r * .07, r * .04, '#fff3dc', a); }
    face(ctx, x, y + r * .1, r * .5); gloss(ctx, x, y, r);
  },
  ketchup(ctx, x, y, r) { circ(ctx, x, y, r, '#d9342b'); circ(ctx, x, y, r * .45, '#f4f1ea'); face(ctx, x, y + r * .05, r * .6); gloss(ctx, x, y, r); },
  mustard(ctx, x, y, r) { circ(ctx, x, y, r, '#f2c230'); circ(ctx, x, y, r * .45, '#e2412f'); face(ctx, x, y + r * .05, r * .6); gloss(ctx, x, y, r); },
  dumpling(ctx, x, y, r) {
    circ(ctx, x, y, r, '#fbf2dc'); circ(ctx, x + r * .1, y + r * .12, r * .82, '#efe0bd'); circ(ctx, x - r * .05, y - r * .05, r * .8, '#fff8e6');
    ctx.strokeStyle = '#e2cfa0'; ctx.lineWidth = r * .08;
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * .2, y + Math.sin(a) * r * .2); ctx.lineTo(x + Math.cos(a) * r * .7, y + Math.sin(a) * r * .7); ctx.stroke(); }
    face(ctx, x, y + r * .15, r * .5); gloss(ctx, x, y, r);
  },
  olive(ctx, x, y, r) {
    circ(ctx, x - r * .3, y + r * .1, r * .7, '#4d7a3a'); circ(ctx, x + r * .35, y + r * .15, r * .65, '#4d7a3a'); circ(ctx, x, y - r * .3, r * .7, '#5e8f45');
    circ(ctx, x + r * .05, y - r * .1, r * .55, '#6fa352');
    for (const [dx, dy] of [[-.5, .2], [.4, -.3], [.1, .5], [-.1, -.6]]) ell(ctx, x + dx * r, y + dy * r, r * .13, r * .18, '#4b2d5c');
    gloss(ctx, x, y, r);
  },
  samosa(ctx, x, y, r) {
    ctx.fillStyle = '#d9913a'; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .95, y + r * .7); ctx.lineTo(x - r * .95, y + r * .7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#efb055'; ctx.beginPath(); ctx.moveTo(x, y - r * .7); ctx.lineTo(x + r * .65, y + r * .5); ctx.lineTo(x - r * .65, y + r * .5); ctx.closePath(); ctx.fill();
    face(ctx, x, y + r * .15, r * .45);
  },
  croissant(ctx, x, y, r) {
    for (let i = -2; i <= 2; i++) ell(ctx, x + i * r * .38, y + Math.abs(i) * r * .22, r * (.42 - Math.abs(i) * .06), r * (.62 - Math.abs(i) * .1), i % 2 ? '#d98a3d' : '#e9a14f', i * .5);
    face(ctx, x, y + r * .05, r * .45); gloss(ctx, x, y, r);
  },
  pie(ctx, x, y, r) {
    circ(ctx, x, y, r, '#d9a35a'); circ(ctx, x, y, r * .82, '#c8e07a'); circ(ctx, x - r * .05, y - r * .05, r * .7, '#d8ec8e');
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; circ(ctx, x + Math.cos(a) * r * .62, y + Math.sin(a) * r * .62, r * .15, '#fffaf0'); }
    face(ctx, x, y + r * .05, r * .5); gloss(ctx, x, y, r);
  },
  palmBlock(ctx, x, y, r) { LOOKS.palmTop(ctx, x, y, r * 2.4); circ(ctx, x, y, r * .6, '#8a5a2b'); },
  palmTop(ctx, x, y, s) {
    for (let i = 0; i < 7; i++) {
      const a = i * TAU / 7 + .2;
      ctx.fillStyle = i % 2 ? '#2f8a3c' : '#3fa548';
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a - .35) * s * .7, y + Math.sin(a - .35) * s * .7, x + Math.cos(a) * s, y + Math.sin(a) * s);
      ctx.quadraticCurveTo(x + Math.cos(a + .35) * s * .7, y + Math.sin(a + .35) * s * .7, x, y); ctx.fill();
    }
    circ(ctx, x - s * .1, y + s * .05, s * .1, '#7a4b2b'); circ(ctx, x + s * .1, y + s * .08, s * .1, '#7a4b2b'); circ(ctx, x, y - s * .08, s * .1, '#8a5a2b');
  },
  steamer(ctx, x, y, r) {
    circ(ctx, x, y, r, '#c9a066'); circ(ctx, x, y, r * .85, '#e3c088');
    ctx.strokeStyle = '#b48a52'; ctx.lineWidth = r * .07;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.arc(x, y, r * .2 * i, 0, TAU); ctx.stroke(); }
    face(ctx, x, y + r * .1, r * .5); gloss(ctx, x, y, r);
  },
  gator(ctx, p, m) {
    const { x, y } = p, L = m.len / 2 + m.r, r = m.r;
    ctx.fillStyle = '#3f9b3c'; ctx.beginPath(); ctx.roundRect(x - L, y - r, L * 2, r * 2, r); ctx.fill();
    ctx.fillStyle = '#4fb04a'; ctx.beginPath(); ctx.roundRect(x - L + 1, y - r + .8, L * 2 - 2, r * 1.3, r * .7); ctx.fill();
    for (let i = -2; i <= 2; i++) circ(ctx, x + i * 3, y - r * .6, .8, '#2f7a33');
    const dir = p.vx >= 0 ? 1 : -1, hx = x + dir * (L - r * .9);
    circ(ctx, hx, y - r * .55, 1.3, '#fffaf0'); circ(ctx, hx + dir * .3, y - r * .55, .6, '#3a2a2a');
    circ(ctx, hx - dir * 2.6, y - r * .55, 1.3, '#fffaf0'); circ(ctx, hx - dir * 2.3, y - r * .55, .6, '#3a2a2a');
    ctx.strokeStyle = '#2a5a2a'; ctx.lineWidth = .5; ctx.beginPath(); ctx.arc(hx - dir * 1.3, y + r * .2, 1.8, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
    ell(ctx, hx - dir * 1.3 - 2.2, y + r * .3, .7, .45, 'rgba(242,107,107,.7)'); ell(ctx, hx - dir * 1.3 + 2.2, y + r * .3, .7, .45, 'rgba(242,107,107,.7)');
  },
};

const DECOR = {
  palm(ctx, x, y, s) { ell(ctx, x + 3 * s, y + 3 * s, 7 * s, 5 * s, 'rgba(70,40,20,.15)'); LOOKS.palmTop(ctx, x, y, 8 * s); },
  basil(ctx, x, y, s) { for (let i = 0; i < 5; i++) { const a = i * TAU / 5; ell(ctx, x + Math.cos(a) * 2.2 * s, y + Math.sin(a) * 2.2 * s, 2.4 * s, 1.3 * s, i % 2 ? '#3f9b3c' : '#4fb04a', a); } },
  cactusPot(ctx, x, y, s) { circ(ctx, x, y, 4 * s, '#c8643b'); circ(ctx, x, y, 3.2 * s, '#4fb04a'); circ(ctx, x + 1.2 * s, y - 1.2 * s, .7 * s, '#e8475f'); },
  pepper(ctx, x, y, s) { ell(ctx, x, y, 4 * s, 1.6 * s, '#e2412f', .4); ell(ctx, x - 3.4 * s, y - 1.6 * s, 1 * s, .6 * s, '#3f9b3c', .4); },
  lantern(ctx, x, y, s) { ell(ctx, x, y, 4 * s, 4.6 * s, '#d9342b'); ctx.fillStyle = '#f6b62e'; ctx.fillRect(x - 2.4 * s, y - 4.8 * s, 4.8 * s, 1.2 * s); ctx.fillRect(x - 2.4 * s, y + 3.6 * s, 4.8 * s, 1.2 * s); ell(ctx, x - 1.4 * s, y - 1.4 * s, .9 * s, 1.6 * s, 'rgba(255,255,255,.35)'); },
  blossom(ctx, x, y, s) { for (let i = 0; i < 5; i++) { const a = i * TAU / 5; circ(ctx, x + Math.cos(a) * 2.2 * s, y + Math.sin(a) * 2.2 * s, 1.8 * s, '#f7a8c4'); } circ(ctx, x, y, 1.2 * s, '#f6b62e'); },
  shake(ctx, x, y, s) { circ(ctx, x, y, 4 * s, '#d8eef0'); circ(ctx, x, y, 3.2 * s, '#f7a8c4'); circ(ctx, x, y - .4 * s, 1.8 * s, '#fffaf0'); circ(ctx, x + .3 * s, y - 1.6 * s, .9 * s, '#d9342b'); },
  dome(ctx, x, y, s) { circ(ctx, x, y, 5 * s, '#fffaf0'); circ(ctx, x, y, 3.8 * s, '#2c6fb5'); ell(ctx, x - 1.2 * s, y - 1.3 * s, 1.1 * s, .7 * s, 'rgba(255,255,255,.45)'); },
  umbrella(ctx, x, y, s) {
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#fffaf0' : '#e8475f'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 6 * s, i * TAU / 8, (i + 1) * TAU / 8); ctx.closePath(); ctx.fill(); }
    circ(ctx, x, y, .8 * s, '#3a2a2a');
  },
  spices(ctx, x, y, s) { [['#f2c230', -5], ['#e2412f', 0], ['#7a4b2b', 5]].forEach(([c, dx]) => { circ(ctx, x + dx * s, y, 2.4 * s, '#c8a26b'); circ(ctx, x + dx * s, y, 1.8 * s, c); }); },
  flamingo(ctx, x, y, s) {
    ell(ctx, x + 1 * s, y + 4 * s, 3.5 * s, 1.2 * s, 'rgba(255,255,255,.35)');
    ell(ctx, x, y, 3.2 * s, 2.2 * s, '#f48fb1'); ell(ctx, x - .8 * s, y - .3 * s, 2 * s, 1.2 * s, '#f7a8c4');
    ctx.strokeStyle = '#f48fb1'; ctx.lineWidth = 1 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 2.2 * s, y - .8 * s); ctx.quadraticCurveTo(x + 4.5 * s, y - 4 * s, x + 2.6 * s, y - 5.6 * s); ctx.stroke();
    circ(ctx, x + 2.4 * s, y - 5.8 * s, 1.1 * s, '#f48fb1'); circ(ctx, x + 2.7 * s, y - 6 * s, .25 * s, '#3a2a2a');
    ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = .6 * s; ctx.beginPath(); ctx.moveTo(x + 1.6 * s, y - 5.6 * s); ctx.lineTo(x + .9 * s, y - 5 * s); ctx.stroke();
  },
};

function drawGround(ctx, th, x0, y0, w, h) {
  ctx.fillStyle = th.c1; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = th.c2;
  const xs = Math.floor(x0 / 8) * 8, ys = Math.floor(y0 / 8) * 8;
  if (th.ground === 'check') {
    for (let y = ys; y < y0 + h; y += 8) for (let x = xs; x < x0 + w; x += 8) if (((x + y) / 8) % 2 === 0) ctx.fillRect(x, y, 8, 8);
  } else if (th.ground === 'dots') {
    for (let y = ys; y < y0 + h; y += 6) for (let x = xs + ((y / 6) % 2) * 3; x < x0 + w; x += 6) { ctx.beginPath(); ctx.arc(x, y, .9, 0, TAU); ctx.fill(); }
  } else if (th.ground === 'planks') {
    for (let y = ys; y < y0 + h; y += 7) { ctx.fillRect(x0, y, w, .5); for (let x = xs + ((y / 7) % 3) * 9; x < x0 + w; x += 27) ctx.fillRect(x, y, .5, 7); }
  } else if (th.ground === 'tiles') {
    for (let y = ys; y < y0 + h; y += 10) for (let x = xs; x < x0 + w; x += 10) { ctx.beginPath(); ctx.moveTo(x + 5, y + 2); ctx.lineTo(x + 8, y + 5); ctx.lineTo(x + 5, y + 8); ctx.lineTo(x + 2, y + 5); ctx.closePath(); ctx.fill(); }
  } else if (th.ground === 'stripes') {
    for (let x = Math.floor(x0 / 12) * 12; x < x0 + w; x += 12) ctx.fillRect(x, y0, 6, h);
  } else if (th.ground === 'sand') {
    seed = 7;
    for (let i = 0; i < w * h / 14; i++) { ctx.beginPath(); ctx.arc(x0 + rnd() * w, y0 + rnd() * h, .3 + rnd() * .5, 0, TAU); ctx.fill(); }
  }
}

function outlinePath(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }

// Draws the whole hole (everything but the ball). t is seconds, for things that move.
// view: the visible area in course units, so the ground fills the whole screen.
export function drawCourse(ctx, hole, t, view = { x: 0, y: 0, w: FW, h: FH }) {
  const th = hole.theme;
  drawGround(ctx, th, view.x, view.y, view.w, view.h);
  for (const d of hole.decor || []) if (!d.over) DECOR[d.look]?.(ctx, d.x, d.y, d.s || 1);

  // the green, its shadow and its mowing stripes
  ctx.save(); ctx.translate(.8, 1.4); outlinePath(ctx, hole.outline); ctx.fillStyle = 'rgba(70,40,20,.22)'; ctx.fill(); ctx.restore();
  outlinePath(ctx, hole.outline); ctx.fillStyle = TURF; ctx.fill();
  ctx.save(); outlinePath(ctx, hole.outline); ctx.clip();
  ctx.fillStyle = TURF2;
  for (let k = -FH; k < FW + FH; k += 16) { ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + 8, 0); ctx.lineTo(k + 8 - FH * .5, FH); ctx.lineTo(k - FH * .5, FH); ctx.closePath(); ctx.fill(); }

  // slopes, with arrows showing which way they push
  for (const sl of hole.slopes || []) {
    shapePath(ctx, sl); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill();
    const [x, y, w, h] = sl.rect, ang = Math.atan2(sl.f[1], sl.f[0]);
    ctx.save(); shapePath(ctx, sl); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const off = (t * 6) % 10;
    for (let yy = y - 10 + off; yy < y + h + 10; yy += 10) for (let xx = x + 8; xx < x + w; xx += 16) {
      ctx.save(); ctx.translate(xx, yy); ctx.rotate(ang - Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(-3, -1.5); ctx.lineTo(0, 1.5); ctx.lineTo(3, -1.5); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }
  // hills and bowls
  for (const m of hole.mounds || []) {
    const g = ctx.createRadialGradient(m.x - m.r * .3, m.y - m.r * .3, m.r * .1, m.x, m.y, m.r);
    if (m.k > 0) { g.addColorStop(0, '#9be285'); g.addColorStop(.7, '#6fcc5c'); g.addColorStop(1, 'rgba(92,191,74,0)'); }
    else { g.addColorStop(0, 'rgba(40,90,40,.45)'); g.addColorStop(1, 'rgba(92,191,74,0)'); }
    circ(ctx, m.x, m.y, m.r, g);
    if (m.look === 'sombrero') {
      circ(ctx, m.x, m.y, m.r * .92, 'rgba(233,196,106,.85)'); circ(ctx, m.x, m.y, m.r * .5, '#e2412f'); circ(ctx, m.x, m.y, m.r * .4, '#f2d27a');
      ctx.strokeStyle = '#3f9b3c'; ctx.lineWidth = .7; ctx.setLineDash([1.4, 1.4]); ctx.beginPath(); ctx.arc(m.x, m.y, m.r * .75, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      gloss(ctx, m.x, m.y, m.r * .5);
    } else if (m.look === 'chili') {
      ell(ctx, m.x, m.y, m.r * .8, m.r * .32, '#e2412f', -.5); ell(ctx, m.x - m.r * .1, m.y - m.r * .05, m.r * .55, m.r * .12, 'rgba(255,255,255,.35)', -.5);
      ell(ctx, m.x - m.r * .72, m.y + m.r * .42, m.r * .2, m.r * .12, '#3f9b3c', -.5);
      face(ctx, m.x + m.r * .1, m.y - m.r * .02, m.r * .28);
    }
  }
  // sand
  for (const s of hole.sand || []) {
    shapePath(ctx, s); ctx.fillStyle = s.look === 'feta' ? '#fbf7ec' : s.look === 'turmeric' ? '#f2c230' : '#f1d58f'; ctx.fill();
    ctx.save(); shapePath(ctx, s); ctx.clip(); seed = 3;
    ctx.fillStyle = s.look === 'feta' ? '#e6dcc4' : 'rgba(150,100,30,.25)';
    for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(rnd() * FW, rnd() * FH, .4 + rnd() * .6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // water: ripples, and koi in a pond
  for (const w of hole.water || []) {
    shapePath(ctx, w); ctx.fillStyle = '#3fb8c9'; ctx.fill();
    ctx.save(); shapePath(ctx, w); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = .7; ctx.lineCap = 'round';
    for (let y = 0; y < FH; y += 6) for (let x = ((y / 6) % 2) * 7 - 14 + (t * 3) % 14; x < FW; x += 14) { ctx.beginPath(); ctx.arc(x, y, 2.4, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
    if (w.look === 'koi') {
      const [cx, cy, r] = w.circle;
      for (let k = 0; k < 2; k++) {
        const a = t * .6 + k * Math.PI, fx = cx + Math.cos(a) * r * .55, fy = cy + Math.sin(a) * r * .55;
        ell(ctx, fx, fy, 2.4, 1.1, k ? '#fffaf0' : '#f28a3b', a + Math.PI / 2);
        circ(ctx, fx + Math.cos(a + Math.PI / 2) * .4, fy + Math.sin(a + Math.PI / 2) * .4, .5, '#e2412f');
      }
    }
    ctx.restore();
    shapePath(ctx, w); ctx.strokeStyle = 'rgba(30,110,130,.45)'; ctx.lineWidth = .8; ctx.stroke();
  }
  // bridges
  for (const b of hole.bridges || []) {
    const [x, y, w, h] = b.rect;
    ctx.fillStyle = '#c08a52'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#a8743f'; for (let yy = y + 3; yy < y + h; yy += 3.5) ctx.fillRect(x, yy, w, .5);
  }
  // decorations that sit on the course (flamingos in the lagoon)
  for (const d of hole.decor || []) if (d.over) DECOR[d.look]?.(ctx, d.x, d.y, d.s || 1);
  // conveyor belts with sushi plates riding along
  for (const b of hole.belts || []) {
    const [x, y, w, h] = b.rect, sp = Math.hypot(...b.v), dx = b.v[0] / sp;
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5a5a66'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const off = ((t * sp) % 18) * dx;
    for (let xx = x - 18 + off; xx < x + w + 18; xx += 18) {
      circ(ctx, xx, y + h / 2, 4.2, '#fffaf0'); circ(ctx, xx, y + h / 2, 3.4, '#e8475f');
      ell(ctx, xx, y + h / 2, 2.4, 1.3, '#fdfaf2'); ell(ctx, xx, y + h / 2 - .4, 2.2, .9, '#f28a5b');
    }
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    for (let xx = x + 9; xx < x + w; xx += 18) { ctx.beginPath(); ctx.moveTo(xx + dx * 2, y + 2); ctx.lineTo(xx - dx * 1, y + 3.5); ctx.lineTo(xx + dx * 2, y + 5); ctx.fill(); }
    ctx.restore();
  }
  // tandoor ovens (tunnels)
  for (const tn of hole.tunnels || []) {
    for (const [[x, y], isIn] of [[tn.from, true], [tn.to, false]]) {
      circ(ctx, x, y, tn.r + 2.4, '#a8552f'); circ(ctx, x, y, tn.r + 1.4, '#c8693b');
      const g = ctx.createRadialGradient(x, y, 0, x, y, tn.r);
      g.addColorStop(0, isIn ? '#ffb347' : '#3a1a10'); g.addColorStop(1, '#2a120a');
      circ(ctx, x, y, tn.r, g);
    }
    // a dotted line shows where the shortcut comes out
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = .6; ctx.setLineDash([1.2, 2]);
    ctx.beginPath(); ctx.moveTo(tn.from[0], tn.from[1] - tn.r - 3); ctx.lineTo(tn.to[0], tn.to[1] + tn.r + 3); ctx.stroke(); ctx.setLineDash([]);
  }
  // tee mat
  const [tx, ty] = hole.tee;
  ctx.fillStyle = '#3f8a3a'; ctx.beginPath(); ctx.roundRect(tx - 6, ty - 3, 12, 6, 1.5); ctx.fill();
  circ(ctx, tx - 4.6, ty, .9, th.rail); circ(ctx, tx + 4.6, ty, .9, th.rail);
  ctx.restore();

  // the rail all the way round
  outlinePath(ctx, hole.outline); ctx.lineJoin = 'round';
  ctx.strokeStyle = th.rail; ctx.lineWidth = RAIL * 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = .5; ctx.stroke();

  // the cup
  const [cx, cy] = hole.cup;
  circ(ctx, cx, cy, CUP_R + .5, '#4a9e3c'); circ(ctx, cx, cy, CUP_R, '#2b2420');
  ell(ctx, cx, cy + CUP_R * .35, CUP_R * .75, CUP_R * .45, '#1a1412');

  // blocks
  for (const b of hole.blocks || []) {
    if (b.circle) { const [x, y, r] = b.circle; shadow(ctx, x, y, r); (LOOKS[b.look] || ((c, xx, yy, rr) => circ(c, xx, yy, rr, '#8a7a6a')))(ctx, x, y, r); }
    else if (b.rect) {
      const [x, y, w, h] = b.rect;
      ctx.fillStyle = 'rgba(70,40,20,.22)'; ctx.fillRect(x + .5, y + .8, w, h);
      if (b.look === 'bamboo') {
        ctx.fillStyle = '#7fb84a'; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
        ctx.fillStyle = '#5e9a36'; for (let xx = x + 6; xx < x + w; xx += 7) ctx.fillRect(xx, y, .7, h);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 1, y + .6, w - 2, .6);
      } else {
        ctx.fillStyle = th.rail; ctx.beginPath(); ctx.roundRect(x, y, w, h, .8); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + .4, y + .4, .5, h - .8);
      }
    } else if (b.arc) {
      const [x, y, r, a0, a1] = b.arc, A0 = a0 * Math.PI / 180, A1 = a1 * Math.PI / 180;
      if (b.look === 'volcano') {
        circ(ctx, x, y, r, '#b0603a'); circ(ctx, x, y, r * .8, '#c8774a');
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * .7); g.addColorStop(0, 'rgba(255,140,40,.9)'); g.addColorStop(1, 'rgba(255,140,40,0)');
        circ(ctx, x, y, r * .7, g);
        // lava trickles down the back of the volcano
        ctx.fillStyle = '#ff7b2f';
        for (const [dx, len] of [[-6, 7], [1, 10], [7, 6]]) { ctx.beginPath(); ctx.roundRect(x + dx - .9, y - r - len + 1, 1.8, len, .9); ctx.fill(); }
      } else if (b.look === 'pan') {
        circ(ctx, x, y, r, '#f3cf7a'); circ(ctx, x - 2, y - 2, r * .6, '#f7dc94');
        ctx.fillStyle = '#e6b45e'; for (let i = 0; i < 6; i++) { const a = i * 1.1; circ(ctx, x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, .9, '#e2a44a'); }
        ctx.fillStyle = '#2a2a33'; ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 4); ctx.beginPath(); ctx.roundRect(r - 1, -1.6, 13, 3.2, 1.6); ctx.fill(); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(x, y, r, A0, A1); ctx.lineCap = 'round';
      ctx.strokeStyle = b.look === 'volcano' ? '#7a3f24' : '#2a2a33'; ctx.lineWidth = b.w; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = b.w * .25; ctx.stroke();
    }
  }
  // the cup again inside a pan or volcano, so it sits on top
  if ((hole.blocks || []).some(b => b.arc)) { circ(ctx, cx, cy, CUP_R + .5, 'rgba(0,0,0,.25)'); circ(ctx, cx, cy, CUP_R, '#2b2420'); ell(ctx, cx, cy + CUP_R * .35, CUP_R * .75, CUP_R * .45, '#1a1412'); }

  // movers
  for (const m of hole.movers || []) {
    const parts = moverParts(m, t);
    if (m.type === 'spin') {
      for (const p of parts.slice(1)) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(70,40,20,.22)'; ctx.lineWidth = m.w; ctx.beginPath(); ctx.moveTo(p.ax + .6, p.ay + 1); ctx.lineTo(p.bx + .6, p.by + 1); ctx.stroke();
        if (m.look === 'straw') {
          ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = m.w; ctx.beginPath(); ctx.moveTo(p.ax, p.ay); ctx.lineTo(p.bx, p.by); ctx.stroke();
          ctx.strokeStyle = '#e8475f'; ctx.setLineDash([1.6, 1.6]); ctx.stroke(); ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = '#b9c3cc'; ctx.lineWidth = m.w * .5; ctx.beginPath(); ctx.moveTo(p.ax, p.ay); ctx.lineTo(p.bx, p.by); ctx.stroke();
          const a = Math.atan2(p.by - p.ay, p.bx - p.ax);
          ell(ctx, p.ax + (p.bx - p.ax) * .75, p.ay + (p.by - p.ay) * .75, m.len * .28, m.w * .7, '#d9dfe5', a);
          ell(ctx, p.ax + (p.bx - p.ax) * .75, p.ay + (p.by - p.ay) * .75, m.len * .2, m.w * .35, TURF, a);
        }
      }
      circ(ctx, m.x, m.y, m.w * 1.1, m.look === 'straw' ? '#d9342b' : '#8a95a0');
      gloss(ctx, m.x, m.y, m.w * 1.1);
    } else if (m.look === 'gator') {
      ell(ctx, parts[0].x + .6, parts[0].y + 1, m.len / 2 + m.r, m.r, 'rgba(70,40,20,.22)');
      LOOKS.gator(ctx, parts[0], m);
    } else {
      const p = parts[0]; shadow(ctx, p.x, p.y, p.r); (LOOKS[m.look] || LOOKS.steamer)(ctx, p.x, p.y, p.r);
    }
  }

  // the flag
  const wave = Math.sin(t * 4) * .8;
  ctx.strokeStyle = 'rgba(70,40,20,.25)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 6, cy - 2); ctx.stroke();
  ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 15); ctx.stroke();
  ctx.fillStyle = th.flag; ctx.beginPath(); ctx.moveTo(cx, cy - 15); ctx.quadraticCurveTo(cx + 4, cy - 15 + wave, cx + 8, cy - 12.5 + wave); ctx.lineTo(cx, cy - 10); ctx.closePath(); ctx.fill();
}

function drawBall(ctx, x, y, s = 1) {
  const r = BALL_R * s;
  ell(ctx, x + r * .35, y + r * .55, r, r * .8, 'rgba(50,30,15,.3)');
  circ(ctx, x, y, r, '#fffdf8');
  ctx.fillStyle = '#e6e0d2'; ctx.beginPath(); ctx.arc(x, y, r, -.2 * Math.PI, .8 * Math.PI); ctx.arc(x - r * .25, y - r * .25, r * .9, .8 * Math.PI, -.2 * Math.PI, true); ctx.fill();
  circ(ctx, x - r * .35, y - r * .38, r * .3, '#fff');
}

// A small picture of a hole, for the course map.
export function drawHolePreview(canvas, hole) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 90, h = canvas.clientHeight || 144;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  const s = Math.min(w / FW, h / FH), ox = (w - FW * s) / 2, oy = (h - FH * s) / 2;
  ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
  drawCourse(ctx, hole, 0, { x: -ox / s, y: -oy / s, w: w / s, h: h / s });
  drawBall(ctx, hole.tee[0], hole.tee[1], 1.2);
}

// ---------- playing a hole ----------
export function playGolfHole(stage, hole, mode, hooks) {
  stage.innerHTML = `<div class="golf-sign"><b>${hole.name}</b><span>${hole.cuisine} · Par ${hole.par}</span></div>
    <canvas class="skee golf" aria-label="Mini golf hole: ${hole.name}"></canvas><p class="game-hint" id="golf-hint"></p>`;
  const canvas = stage.querySelector('canvas'), ctx = canvas.getContext('2d');
  const W = stage.clientWidth, H = stage.clientHeight - 64;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
  const s = Math.min(W / FW, H / FH), ox = (W - FW * s) / 2, oy = (H - FH * s) / 2;
  const view = { x: -ox / s, y: -oy / s, w: W / s, h: H / s };
  const hint = t => { const el = stage.querySelector('#golf-hint'); if (el) el.textContent = t; };

  const walls = compile(hole);
  const movers = hole.movers || [];
  const maxShots = hole.par + MINIGOLF.maxOver;
  const ball = { x: hole.tee[0], y: hole.tee[1], vx: 0, vy: 0, state: 'rest', slow: 0, scale: 1 };
  let shotFrom = { x: ball.x, y: ball.y };
  let strokes = 0, done = false, stopped = false, aim = null, lipCool = 0, lastBuzz = 0;
  let clock = 0, last = performance.now(), raf = 0, waitUntil = 0, after = null;
  const trail = [], particles = [], popups = [];

  const status = () => hooks.status(`Shots ${strokes} · Par ${hole.par}`);
  status();
  hint(hole.tip);

  function burst(x, y, n, colours, speed = 30) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = speed * (.3 + Math.random());
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, life: 1, c: colours[i % colours.length], r: .5 + Math.random() * .9 });
    }
  }
  const popup = (x, y, words, text = '') => popups.push({ x, y, t0: clock, words, text });

  // ----- physics, a small step at a time -----
  function physics(dt) {
    if (ball.state !== 'roll') {
      // a resting ball can still be bumped by something moving
      if (ball.state === 'rest' && movers.length && hitMovers(ball, movers, clock)) {
        if (Math.hypot(ball.vx, ball.vy) > 2) { ball.state = 'roll'; ball.slow = 0; aim = null; }
        else { ball.vx = ball.vy = 0; }
      }
      return;
    }
    const b = ball;
    let ax = 0, ay = 0;
    for (const sl of hole.slopes || []) if (inside(sl, b.x, b.y)) { ax += sl.f[0]; ay += sl.f[1]; }
    for (const m of hole.mounds || []) {
      const dx = b.x - m.x, dy = b.y - m.y, d = Math.hypot(dx, dy);
      if (d < m.r && d > .01) { const f = m.k * Math.sin(Math.PI * d / m.r); ax += dx / d * f; ay += dy / d * f; }
    }
    for (const bl of hole.belts || []) if (inside(bl, b.x, b.y)) {
      const sp = Math.hypot(...bl.v), ux = bl.v[0] / sp, uy = bl.v[1] / sp;
      const along = b.vx * ux + b.vy * uy, push = (sp - along) * 3;
      ax += ux * push; ay += uy * push;
    }
    let speed = Math.hypot(b.vx, b.vy);
    const [cx, cy] = hole.cup, dc = Math.hypot(cx - b.x, cy - b.y);
    if (dc < mode.pullRadius && dc > .01 && speed < 90) { ax += (cx - b.x) / dc * mode.cupPull; ay += (cy - b.y) / dc * mode.cupPull; }
    // rolling slows the ball down (sand slows it a lot)
    const sandy = (hole.sand || []).some(sh => inside(sh, b.x, b.y));
    if (speed > 0) {
      const slower = Math.max(0, speed - ((sandy ? PHYS.sandRoll : PHYS.roll) + PHYS.drag * speed) * dt);
      b.vx *= slower / speed; b.vy *= slower / speed;
    }
    b.vx += ax * dt; b.vy += ay * dt;
    speed = Math.hypot(b.vx, b.vy);
    if (speed > PHYS.maxSpeed) { b.vx *= PHYS.maxSpeed / speed; b.vy *= PHYS.maxSpeed / speed; }
    b.x += b.vx * dt; b.y += b.vy * dt;

    let hit = hitStatics(b, walls);
    hit = Math.max(hit, hitMovers(b, movers, clock));
    hit = Math.max(hit, hitStatics(b, walls));
    if (hit > 35 && clock - lastBuzz > .12) { lastBuzz = clock; hooks.buzz('tap'); burst(b.x, b.y, 4, ['#fffaf0', '#f6b62e'], 18); }

    // water
    const wet = (hole.water || []).some(w => inside(w, b.x, b.y)) && !(hole.bridges || []).some(br => inside(br, b.x, b.y));
    if (wet) {
      b.state = 'splash'; b.vx = b.vy = 0;
      burst(b.x, b.y, 18, ['#bdeef2', '#3fb8c9', '#fffaf0'], 35);
      strokes += MINIGOLF.waterPenalty; status();
      popup(b.x, b.y, 'Splash!', `+${MINIGOLF.waterPenalty}`);
      hooks.buzz('nope');
      hint('Splash! One extra shot. Back to where you hit from.');
      waitUntil = clock + .9;
      after = () => { b.x = shotFrom.x; b.y = shotFrom.y; settle(); };
      return;
    }
    // tunnels
    for (const tn of hole.tunnels || []) {
      if (Math.hypot(b.x - tn.from[0], b.y - tn.from[1]) < tn.r) {
        b.state = 'tunnel';
        const sp = Math.max(speed * .85, 80), l = Math.hypot(...tn.dir);
        hooks.buzz('merge');
        burst(tn.from[0], tn.from[1], 10, ['#ffb347', '#e2412f'], 20);
        waitUntil = clock + .45;
        after = () => {
          b.x = tn.to[0] + tn.dir[0] / l * (tn.r + BALL_R + .5); b.y = tn.to[1] + tn.dir[1] / l * (tn.r + BALL_R + .5);
          b.vx = tn.dir[0] / l * sp; b.vy = tn.dir[1] / l * sp; b.state = 'roll'; b.slow = 0;
          burst(b.x, b.y, 10, ['#ffb347', '#e2412f'], 20);
          popup(b.x, b.y, 'Zoom!');
        };
        return;
      }
    }
    // the cup
    lipCool = Math.max(0, lipCool - dt);
    const d2 = Math.hypot(cx - b.x, cy - b.y);
    if (d2 < CUP_R) {
      if (speed < mode.capture) { sink(); return; }
      if (d2 < CUP_R * .75 && !lipCool) {
        // too fast: it hops over the cup
        const a = (Math.random() - .5) * .9, c = Math.cos(a), sn = Math.sin(a);
        [b.vx, b.vy] = [(b.vx * c - b.vy * sn) * .7, (b.vx * sn + b.vy * c) * .7];
        lipCool = .25;
        hint('Too fast! Softer near the hole.');
      }
    }
    // resting
    if (Math.hypot(b.vx, b.vy) < PHYS.stopSpeed) { b.slow += dt; if (b.slow > PHYS.restAfter) settle(); }
    else b.slow = 0;
  }

  function settle() {
    ball.vx = ball.vy = 0; ball.state = 'rest'; ball.slow = 0; trail.length = 0;
    if (done) return;
    if (strokes >= maxShots) {
      done = true;
      popup(ball.x, ball.y, 'Out of shots');
      hint('Out of shots this time. Try again!');
      hooks.buzz('nope');
      setTimeout(() => { if (!stopped) hooks.finish({ strokes: null, par: hole.par }); }, 1300);
      return;
    }
    hint(strokes ? 'Your turn. Flick toward the hole!' : hole.tip);
  }

  function sink() {
    done = true;
    ball.state = 'sunk'; ball.vx = ball.vy = 0;
    const [cx, cy] = hole.cup;
    ball.sinkFrom = { x: ball.x, y: ball.y, t0: clock };
    const holeInOne = strokes === 1, diff = strokes - hole.par;
    const words = holeInOne ? 'HOLE IN ONE!' : diff <= -2 ? 'Eagle!' : diff === -1 ? 'Birdie!' : diff === 0 ? 'Par! Nice!' : 'In the cup!';
    setTimeout(() => {
      if (stopped) return;
      burst(cx, cy, holeInOne ? 60 : diff <= 0 ? 36 : 18, ['#f6b62e', '#e8475f', '#5b2c6f', '#3f9b3c', '#fff'], holeInOne ? 55 : 40);
      popup(cx, cy, words);
      hooks.buzz(diff <= 0 ? 'serve' : 'merge');
    }, 280);
    hint(' ');
    setTimeout(() => { if (!stopped) hooks.finish({ strokes, par: hole.par, holeInOne }); }, holeInOne ? 2000 : 1500);
  }

  // ----- the aiming guide: dots that follow the ball's path (with bounces) -----
  function guidePoints(dx, dy, len) {
    const g = { x: ball.x, y: ball.y, vx: dx, vy: dy }, pts = [];
    let bounces = 0;
    for (let k = 0, step = .6; k * step < len; k++) {
      g.x += g.vx * step; g.y += g.vy * step;
      if (hitStatics(g, walls, 1) > 0.01) { bounces++; const l = Math.hypot(g.vx, g.vy); g.vx /= l; g.vy /= l; }
      if (k % 5 === 4) pts.push([g.x, g.y]);
      if (bounces > 2 || Math.hypot(g.x - hole.cup[0], g.y - hole.cup[1]) < CUP_R) break;
    }
    return pts;
  }

  // ----- drawing -----
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const n = 6;
    for (let i = 0; i < n; i++) {
      clock += dt / n;
      if (after && clock >= waitUntil) { const f = after; after = null; f(); }
      if (!after) physics(dt / n);
    }
    if (ball.state === 'roll') { trail.push([ball.x, ball.y]); if (trail.length > 14) trail.shift(); }
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; p.life -= dt * 1.4; }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);

    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
    drawCourse(ctx, hole, clock, view);

    // the aim line
    if (aim && ball.state === 'rest') {
      const dx = aim.cur.x - aim.start.x, dy = aim.cur.y - aim.start.y, l = Math.hypot(dx, dy);
      if (l > 2) {
        const ux = dx / l, uy = dy / l;
        if (mode.guide) {
          const pts = guidePoints(ux, uy, mode.guide);
          pts.forEach(([x, y], i) => { ctx.globalAlpha = 1 - i / (pts.length + 2); circ(ctx, x, y, .9, '#fffaf0'); });
          ctx.globalAlpha = 1;
        }
        const L = 10, ex = ball.x + ux * L, ey = ball.y + uy * L;
        ctx.strokeStyle = '#f6b62e'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ball.x + ux * 3, ball.y + uy * 3); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = '#f6b62e'; ctx.beginPath(); ctx.moveTo(ex + ux * 2.4, ey + uy * 2.4); ctx.lineTo(ex - uy * 2, ey + ux * 2); ctx.lineTo(ex + uy * 2, ey - ux * 2); ctx.closePath(); ctx.fill();
      }
    }
    // a gentle pulse around the ball when it's her turn
    if (ball.state === 'rest' && !done && !aim) {
      const k = (clock % 1.2) / 1.2;
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = .6;
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R + 1 + k * 4, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    }
    // trail and ball
    trail.forEach(([x, y], i) => { ctx.globalAlpha = i / trail.length * .35; circ(ctx, x, y, BALL_R * .7, '#fffaf0'); });
    ctx.globalAlpha = 1;
    if (ball.state === 'sunk') {
      const k = Math.min(1, (clock - ball.sinkFrom.t0) / .28);
      const x = ball.sinkFrom.x + (hole.cup[0] - ball.sinkFrom.x) * k, y = ball.sinkFrom.y + (hole.cup[1] - ball.sinkFrom.y) * k;
      if (k < 1) drawBall(ctx, x, y, 1 - k * .5);
    } else if (ball.state === 'roll' || ball.state === 'rest') drawBall(ctx, ball.x, ball.y);

    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life); circ(ctx, p.x, p.y, p.r, p.c); }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i], k = (clock - p.t0) / 1.4;
      if (k >= 1) { popups.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - k * k;
      const y = clamp(p.y - 8 - 10 * k, 12, FH - 6), x = clamp(p.x, 22, FW - 22);
      ctx.font = `${p.words.length > 10 ? 8 : 9}px Righteous, sans-serif`;
      ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 2;
      ctx.strokeText(p.words, x, y); ctx.fillStyle = '#ffd34d'; ctx.fillText(p.words, x, y);
      if (p.text) { ctx.font = '6px Righteous, sans-serif'; ctx.strokeText(p.text, x, y + 8); ctx.fillStyle = '#fff'; ctx.fillText(p.text, x, y + 8); }
      ctx.globalAlpha = 1;
    }
    if (!stopped) raf = requestAnimationFrame(frame);
  }

  // ----- touch: swipe toward where the ball should go; a quick flick hits harder -----
  const pt = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left - ox) / s, y: (e.clientY - r.top - oy) / s, t: performance.now() }; };
  canvas.addEventListener('pointerdown', e => {
    if (done || ball.state !== 'rest') return;
    const p = pt(e);
    aim = { start: p, cur: p, samples: [p] };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!aim) return;
    const p = pt(e);
    aim.cur = p; aim.samples.push(p);
    if (aim.samples.length > 30) aim.samples.shift();
  });
  const up = e => {
    if (!aim) return;
    const p = pt(e), a = aim;
    aim = null;
    if (done || ball.state !== 'rest') return;
    const dx = p.x - a.start.x, dy = p.y - a.start.y, l = Math.hypot(dx, dy);
    if (l < 3) { hint('Swipe toward where you want the ball to go.'); return; }
    const recent = a.samples.filter(q => p.t - q.t < 120);
    const from = recent[0] || a.samples[0];
    const ms = Math.max(16, p.t - from.t);
    const finger = Math.hypot(p.x - from.x, p.y - from.y) / ms * 1000;   // course units per second
    const speed = Math.min(PHYS.maxSpeed, finger * PHYS.flick);
    if (speed < PHYS.minSpeed) { hint('Flick it! A quick swipe sends the ball rolling.'); return; }
    strokes++; status();
    shotFrom = { x: ball.x, y: ball.y };
    ball.vx = dx / l * speed; ball.vy = dy / l * speed; ball.state = 'roll'; ball.slow = 0;
    hooks.buzz('tap');
    hint(' ');
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', () => { aim = null; });

  raf = requestAnimationFrame(frame);
  return () => { done = true; stopped = true; cancelAnimationFrame(raf); };
}
