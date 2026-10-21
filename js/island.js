// Tulip Island, drawn from above at an angle (isometric): every square is a diamond on screen,
// and buildings, trees and boats stand up out of it. This file only draws; the rules for what
// can go where live in js/main.js and the sizes in data/island.js.
//
// Squares: x runs down to the right, y runs down to the left. A square's top corner is isoPoint(x, y).

import { ISLAND } from '../data/island.js';

const TW = 64, TH = 32; // one square on screen, in picture units
const f = n => Math.round(n * 10) / 10;

export function islandGeom(size = ISLAND.size) {
  const pad = 40, OY = 200;
  return { size, OX: size * (TW / 2) + pad, OY, W: size * TW + pad * 2, H: size * TH + OY + 70 };
}
export const isoPoint = (g, x, y) => [(x - y) * (TW / 2) + g.OX, (x + y) * (TH / 2) + g.OY];
export const isoTile = (g, px, py) => {
  const u = (px - g.OX) / (TW / 2), v = (py - g.OY) / (TH / 2);
  return [Math.floor((u + v) / 2), Math.floor((v - u) / 2)];
};
// Distance from the middle of the island to the middle of a square.
export const fromCentre = (x, y) => Math.hypot(x + .5 - ISLAND.centre, y + .5 - ISLAND.centre);
// Is this square land? (Squares under docks and harbours always stay water.)
export const isLand = (radius, water, x, y) => fromCentre(x, y) <= radius && !water.has(`${x},${y}`);

const SEA = '#7cc6e0', SEA_DEEP = '#6ab9d6', SHALLOW = '#a6dcea', GRASS = '#9fd486', GRASS2 = '#93cc7a', SAND = '#f1dcaa', SAND2 = '#ead09a';
const ROAD = '#a39d97', PAVE = '#e3d3b4', PAVE2 = '#d9c7a4', WOOD = '#b5773a', WOOD_DARK = '#8f5a2a';
const FRIENDS = ['#e2412f', '#5b2c6f', '#f6c33e', '#c96a3a', '#3f9b3c', '#e8475f'];
const GLOW = 'filter:drop-shadow(0 0 2px #5b2c6f) drop-shadow(0 0 2px #5b2c6f) drop-shadow(0 0 7px #b57fd0)';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const pts = list => list.map(p => `${f(p[0])},${f(p[1])}`).join(' ');
const poly = (list, fill, extra = '') => `<polygon points="${pts(list)}" fill="${fill}" ${extra}/>`;
const circ = (x, y, r, fill, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const ell = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" ${extra}/>`;
const seg = (x1, y1, x2, y2, stroke, w = 2, extra = '') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
const shade = (hex, k = .82) => { const n = parseInt(hex.slice(1), 16); return `rgb(${(n >> 16) * k | 0},${((n >> 8) & 255) * k | 0},${(n & 255) * k | 0})`; };
function label(x, y, text, bg = '#5b2c6f', size = 11) {
  const w = text.length * size * .6 + 14;
  return `<g>${rect(x - w / 2, y - size + 1, w, size + 7, bg, `rx="${(size + 7) / 2}"`)}<text x="${f(x)}" y="${f(y + 3.5)}" text-anchor="middle" font-family="Righteous, sans-serif" font-size="${size}" fill="#fff8ec">${esc(text)}</text></g>`;
}
const friend = (x, y, r, col) => circ(x, y, r, col, 'stroke="#fff" stroke-width="1.3"') + circ(x - r * .3, y - r * .15, r * .26, '#fff') + circ(x + r * .3, y - r * .15, r * .26, '#fff');

// ---------- boats ----------
const sailboat = (col = '#e8475f', flag = '') => `<path d="M-14,0 L14,0 L9,7 L-9,7 Z" fill="#fff"/><path d="M-14,0 L14,0 L13,2 L-13,2 Z" fill="${col}"/>` +
  seg(0, -27, 0, 0, '#5a4636', 1.6) + `<path d="M1.5,-26 L1.5,-2 L15,-3 Z" fill="${col}"/><path d="M-1.5,-22 L-1.5,-3 L-11,-3 Z" fill="#fff3dc"/>` +
  (flag ? `<path d="M0,-27 L9,-30 L0,-33 Z" fill="${flag}"/>` : '');
const rowboat = () => `<path d="M-12,0 Q0,7 12,0 L9,-3 L-9,-3 Z" fill="${WOOD}"/><path d="M-9,-3 L9,-3 L8,-1 L-8,-1 Z" fill="${WOOD_DARK}"/>` + seg(-14, 3, -4, -2, WOOD_DARK, 1.6) + seg(14, 3, 4, -2, WOOD_DARK, 1.6);
const duck = () => ell(0, 0, 7, 4.5, '#ffd23f') + circ(5, -5, 3.6, '#ffd23f') + `<path d="M8,-5 L12,-4 L8,-3 Z" fill="#f08a24"/>` + circ(5.8, -6, .9, '#3a2a2a');
// The Bagel boat café: a floating café with a striped awning and a bagel sign.
const cafeBoat = () => `<path d="M-30,0 L30,0 L24,11 L-24,11 Z" fill="#fff"/>` + rect(-30, -2, 60, 4, '#5b2c6f') +
  rect(-18, -20, 36, 18, '#fff3dc', 'rx="3"') + [0, 1, 2].map(i => rect(-14 + i * 10, -16, 7, 7, '#6cc6e0', 'rx="1.5"')).join('') +
  [0, 1, 2, 3].map(i => rect(-20 + i * 10, -26, 10, 7, i % 2 ? '#fff' : '#e8475f')).join('') +
  circ(0, -34, 7, '#b8732f') + circ(-.6, -34.6, 6, '#e3a24f') + circ(0, -34, 2.3, '#fff3dc');
function ferry(big) {
  const w = big ? 30 : 24;
  return `<path d="M${-w},0 L${w},0 L${w - 6},10 L${-w + 6},10 Z" fill="#fff"/>` + rect(-w, -2, w * 2, 4, '#2f8a8f') +
    rect(-w + 8, -15, w * 2 - 20, 13, '#fff3dc', 'rx="3"') + [0, 1, 2, 3].map(i => rect(-w + 11 + i * (w * 2 - 26) / 4, -12, 5, 5, '#6cc6e0', 'rx="1"')).join('') +
    rect(w - 12, -25, 7, 12, '#e8475f', 'rx="1.5"') + rect(w - 12, -25, 7, 3, '#3a2a2a');
}

// ---------- the drawing ----------
// o: { radius, saleRadius, water: Set, paths: Set, shops, pieces, choices, people, sailboats, night, event,
//      focus (a piece uid), ghost: { kind, type, x, y, w, d, stage, ok }, ferry: { x, y, w, d, stage }, crop, scale, label }
export function islandSvg(o) {
  const g = islandGeom(), N = g.size, C = ISLAND.centre, R = o.radius;
  const P = (x, y) => isoPoint(g, x, y);
  const dia = (x, y, w = 1, d = 1) => [P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d)];
  const land = (x, y) => isLand(R, o.water, x, y);
  const ground = [], objs = [], boats = [], glow = [], top = [], labels = [];
  const add = (depth, svg, uid) => objs.push([depth, uid && o.focus === uid ? `<g style="${GLOW}">${svg}</g>` : svg]);
  const paths = o.paths || new Set();

  // a building: footprint x..x+w, y..y+d, h tall. The front (left) face looks onto the viewer.
  function box(x, y, w, d, h, c) {
    const A = P(x, y), B = P(x + w, y), Cc = P(x + w, y + d), D = P(x, y + d), up = p => [p[0], p[1] - h];
    let s = ell((A[0] + Cc[0]) / 2, (A[1] + Cc[1]) / 2 + 3, w * 30, d * 15, '#000', 'opacity=".09"');
    s += poly([D, Cc, up(Cc), up(D)], c.wall) + poly([Cc, B, up(B), up(Cc)], c.side || shade(c.wall)) + poly([up(A), up(B), up(Cc), up(D)], c.roof);
    const at = t => [D[0] + (Cc[0] - D[0]) * t, D[1] + (Cc[1] - D[1]) * t];
    if (c.awning) for (let i = 0, n = Math.max(4, Math.round(w * 4)); i < n; i++) {
      const p = at(i / n), q = at((i + 1) / n);
      s += poly([[p[0], p[1] - h * .66], [q[0], q[1] - h * .66], [q[0], q[1] - h * .46], [p[0], p[1] - h * .46]], i % 2 ? '#fff3dc' : c.awning);
    }
    for (const t of c.windows || []) {
      const p = at(t), q = at(t + .2), win = [[p[0], p[1] - h * .38], [q[0], q[1] - h * .38], [q[0], q[1] - h * .1], [p[0], p[1] - h * .1]];
      s += poly(win, '#bfe0e6');
      glow.push(poly(win, '#ffd77a') + circ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - h * .24, 16, '#ffd77a', 'opacity=".22"'));
    }
    return s;
  }
  const tree = (x, y, col, k = 1) => { const c = P(x, y); return ell(c[0], c[1], 12 * k, 5 * k, '#000', 'opacity=".12"') + rect(c[0] - 2 * k, c[1] - 16 * k, 4 * k, 16 * k, '#7a4b3a') + circ(c[0], c[1] - 24 * k, 13 * k, col) + circ(c[0] - 4 * k, c[1] - 28 * k, 4 * k, '#fff', 'opacity=".3"'); };
  function lampPost(x, y, kind = 'plain') {
    const c = P(x, y), top = c[1] - 32;
    let s = seg(c[0], c[1], c[0], top, '#3a3a3a', 2.4);
    if (kind === 'basket') s += ell(c[0] + 6, top + 12, 5, 3.5, WOOD) + circ(c[0] + 5, top + 9, 2.6, '#e8475f') + circ(c[0] + 8, top + 10, 2.2, '#8b55a6');
    s += kind === 'lantern' ? rect(c[0] - 5, top - 6, 10, 10, '#5b2c6f', 'rx="2"') + circ(c[0], top - 1, 3.5, '#ffd34d') : circ(c[0], top, 4.2, kind === 'plain' ? '#f4ead2' : '#ffd34d');
    glow.push(circ(c[0], top, kind === 'lantern' ? 26 : 20, '#ffd34d', 'opacity=".28"') + ell(c[0], c[1], 24, 11, '#ffd34d', 'opacity=".16"') + circ(c[0], top, 4, '#fff6c0'));
    return s;
  }
  const benchAt = (x, y) => { const c = P(x, y); return poly([[c[0] - 14, c[1] - 3], [c[0] + 6, c[1] - 13], [c[0] + 12, c[1] - 9], [c[0] - 8, c[1] + 1]], WOOD) + poly([[c[0] - 14, c[1] - 10], [c[0] + 6, c[1] - 20], [c[0] + 6, c[1] - 16], [c[0] - 14, c[1] - 6]], '#c98a4a'); };
  const umbrella = (x, y, col) => { const c = P(x, y); return seg(c[0], c[1], c[0], c[1] - 30, '#7a4b3a', 1.6) + `<path d="M${f(c[0] - 18)},${f(c[1] - 26)} Q${f(c[0])},${f(c[1] - 44)} ${f(c[0] + 18)},${f(c[1] - 26)} Z" fill="${col}"/>`; };
  function bed(x, y, w, d, cols, n = 8, seed = 1) {
    let s = poly(dia(x + .08, y + .08, w - .16, d - .16), '#7a5a3c');
    let r = seed;
    for (let i = 0; i < n; i++) { r = (r * 9301 + 49297) % 233280; const a = r / 233280; r = (r * 9301 + 49297) % 233280; const b = r / 233280; const c = P(x + .2 + a * (w - .4), y + .2 + b * (d - .4)); s += circ(c[0], c[1] - 2, 3.2, cols[i % cols.length]); }
    return s;
  }
  const stall = (x, y, col) => box(x, y, .7, .7, 16, { wall: '#c98a4a', roof: col, awning: col }) + (() => { const c = P(x + .35, y + .7); return circ(c[0] - 6, c[1] - 6, 2.6, '#e2412f') + circ(c[0], c[1] - 5, 2.6, '#ffd23f') + circ(c[0] + 6, c[1] - 6, 2.6, '#3f9b3c'); })();
  function stringLights(a, b, h, dense, colours = ['#ffd34d', '#e8475f', '#6cc6e0']) {
    const p = P(...a), q = P(...b), mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2 - h + 10;
    let s = `<path d="M${f(p[0])},${f(p[1] - h)} Q${f(mx)},${f(my)} ${f(q[0])},${f(q[1] - h)}" fill="none" stroke="#3a3a3a" stroke-width="1"/>`;
    const n = dense ? 12 : 6;
    for (let i = 1; i < n; i++) {
      const t = i / n, x = (1 - t) ** 2 * p[0] + 2 * (1 - t) * t * mx + t * t * q[0], y = (1 - t) ** 2 * (p[1] - h) + 2 * (1 - t) * t * my + t * t * (q[1] - h);
      const col = colours[i % colours.length];
      s += circ(x, y + 2, 2.4, col);
      glow.push(circ(x, y + 2, 7, col, 'opacity=".35"') + circ(x, y + 2, 2.2, '#fff6c0'));
    }
    return s;
  }

  // ----- the sea and the land -----
  let tiles = rect(-300, -300, g.W + 600, g.H + 600, SEA_DEEP);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dc = fromCentre(x, y);
    if (land(x, y)) {
      const beach = dc > R - .9;
      const fill = y === ISLAND.mainStreet ? ROAD : paths.has(`${x},${y}`) ? ((x + y) % 2 ? PAVE : PAVE2) : beach ? ((x + y) % 2 ? SAND : SAND2) : ((x + y) % 2 ? GRASS : GRASS2);
      tiles += poly(dia(x, y), fill, `stroke="${shade(fill.startsWith('#') ? fill : '#999999', .92)}" stroke-width=".7"`);
      if (y === ISLAND.mainStreet) { const c = P(x + .5, y + .5); tiles += ell(c[0], c[1], 6, 3, '#fff3dc', 'opacity=".85"'); }
    } else if (o.saleRadius && dc <= o.saleRadius && !o.water.has(`${x},${y}`)) {
      tiles += poly(dia(x, y), (x + y) % 2 ? SAND : SAND2, 'opacity=".75" stroke="#c9a96a" stroke-width="1" stroke-dasharray="4 3"');
    } else if (dc <= R + 2.2) tiles += poly(dia(x, y), dc <= R + 1 ? SHALLOW : SEA);
    else if ((x * 7 + y * 13) % 11 === 0) { const c = P(x + .5, y + .5); tiles += `<path class="isl-wave" style="animation-delay:-${(x + y) % 5}s" d="M${f(c[0] - 10)},${f(c[1])} q5,-4 10,0 t10,0" fill="none" stroke="#fff" stroke-width="1.6" opacity=".55"/>`; }
  }
  if (o.saleRadius) {
    const k = (o.saleRadius - .4) / Math.SQRT2, c = P(C + k, C + k);
    labels.push(label(c[0], c[1] + 10, 'Tap the sand to grow the island', '#e8475f', 10));
  }

  // ----- restaurants on Main Street -----
  for (const s of o.shops) {
    const [x, y] = [s.x, s.y], dep = x + y + 3;
    if (!s.open) {
      add(dep, box(x + .1, y + .1, 1.8, 1.8, 30, { wall: '#ece6db', roof: '#c9c1b3', awning: '#b9b2a6' }));
      const c = P(x + 1, y + 1); labels.push(label(c[0], c[1] - 46, s.label, '#9c8a7a', 10));
      continue;
    }
    const h = 46 + s.stars * 8;
    let b = box(x, y, 2, 2, h, { wall: s.wall, roof: s.roof, awning: s.awning, windows: [.15, .6] });
    const roof = n => { const c = P(x + .4 + (n % 3) * .55, y + .35 + Math.floor(n / 3) * .55); return circ(c[0], c[1] - h - 4, 5.5, ['#5fb34a', '#e8742f', '#f6b3c8'][n % 3]); };
    for (let n = 0; n < Math.min(6, Math.ceil(s.ups / 3)); n++) b += roof(n);
    add(dep, b);
    const c = P(x + 1, y + 1);
    labels.push(label(c[0], c[1] - h - 26, s.sign) + (s.here ? `<g transform="translate(${f(c[0])} ${f(c[1] - h - 52)})"><path d="M0,10 C-8,0 -9,-4 -9,-7 a9,9 0 0 1 18,0 c0,3 -1,7 -9,17 Z" fill="#e8475f"/>${circ(0, -7, 3.5, '#fff')}</g>` : ''));
  }

  // ----- pieces she placed -----
  const C3 = o.choices || {};
  const treeCol = C3.trees || '#e8742f', flowerCol = C3.flowers || '#e8475f', mural = C3.mural || 'Tulips';
  const DRAW = {
    // landmarks
    trees(p, n) { if (n === 3) ground.push(bed(p.x, p.y, 2, 2, [flowerCol, '#f6c33e', '#8b55a6'], 16, 3)); const spots = n === 3 ? [[.5, .5], [1.5, .5], [.5, 1.5], [1.5, 1.5], [1, 1]] : [[.5, .5], [1.5, .5], [.5, 1.5], [1.5, 1.5]]; for (const [a, b] of spots) add(p.x + a + p.y + b, tree(p.x + a, p.y + b, treeCol, n === 1 ? .55 : n === 2 ? 1 : 1.15), p.uid); },
    lamps(p, n) { ground.push(poly(dia(p.x, p.y, 2, 1), PAVE)); const xs = n === 3 ? [.25, .75, 1.25, 1.75] : n === 2 ? [.3, 1, 1.7] : [.5, 1.5]; for (const a of xs) add(p.x + a + p.y + .5, lampPost(p.x + a, p.y + .5, n === 1 ? 'plain' : n === 2 ? 'basket' : 'lantern'), p.uid); },
    benches(p, n) { const xs = n === 1 ? [1] : [.5, 1.5]; for (const a of xs) { add(p.x + a + p.y + .6, benchAt(p.x + a, p.y + .6), p.uid); if (n === 3) add(p.x + a + p.y + .3, umbrella(p.x + a, p.y + .3, a < 1 ? '#e8475f' : '#2f8a8f'), p.uid); } if (n >= 2) { const c = P(p.x + 1.95, p.y + .2); add(p.x + p.y + 2.1, rect(c[0] - 6, c[1] - 12, 12, 12, '#c96a3a', 'rx="2"') + circ(c[0], c[1] - 14, 6, '#5fb34a'), p.uid); } },
    garden(p, n) { ground.push(bed(p.x, p.y, 2, 2, [flowerCol, '#f6c33e', '#8b55a6', flowerCol], n === 1 ? 7 : 22, 5)); if (n === 3) { const a = P(p.x + .2, p.y + 1), b = P(p.x + 1.8, p.y + 1); add(p.x + p.y + 2, `<path d="M${f(a[0])},${f(a[1])} L${f(a[0])},${f(a[1] - 30)} Q${f((a[0] + b[0]) / 2)},${f(a[1] - 58)} ${f(b[0])},${f(b[1] - 30)} L${f(b[0])},${f(b[1])}" fill="none" stroke="#5fb34a" stroke-width="4"/>` + [0, .25, .5, .75, 1].map(t => circ(a[0] + (b[0] - a[0]) * t, a[1] - 30 - Math.sin(t * Math.PI) * 24, 3.4, flowerCol)).join(''), p.uid); } },
    mural(p, n) { const h = n === 1 ? 24 : n === 2 ? 36 : 42; let s = box(p.x, p.y, 2, .3, h, { wall: '#fff3dc', side: '#e9dcc0', roof: '#c96a3a' }); const D = P(p.x, p.y + .3), Cc = P(p.x + 2, p.y + .3), at = (t, k) => [D[0] + (Cc[0] - D[0]) * t, D[1] + (Cc[1] - D[1]) * t - h * k]; const cols = mural === 'Eggplants' ? ['#5b2c6f', '#7a4a90'] : mural === 'Food friends' ? FRIENDS : [flowerCol, '#8b55a6', '#f6c33e']; const k = n === 1 ? 2 : 4; for (let i = 0; i < k; i++) { const c = at((i + .5) / k, .5); s += mural === 'Tulips' ? `<path d="M${f(c[0])},${f(c[1] - 7)} l-5,4 l2,7 h6 l2,-7 Z" fill="${cols[i % cols.length]}"/>` + seg(c[0], c[1] + 4, c[0], c[1] + 10, '#3f9b3c', 1.6) : circ(c[0], c[1], h * .16, cols[i % cols.length]); } if (n === 3) for (let i = 0; i <= 8; i++) { const c = at(i / 8, 1.05); s += circ(c[0], c[1], 2, ['#ffd34d', '#e8475f', '#8b55a6'][i % 3]); glow.push(circ(c[0], c[1], 6, '#ffd34d', 'opacity=".4"')); } add(p.x + p.y + 1.5, s, p.uid); },
    bikes(p, n) { const bike = (x, y, col) => { const c = P(x, y); return circ(c[0] - 6, c[1] - 6, 5, 'none', `stroke="#3a2a2a" stroke-width="1.6"`) + circ(c[0] + 6, c[1] - 6, 5, 'none', `stroke="#3a2a2a" stroke-width="1.6"`) + `<path d="M${f(c[0] - 6)},${f(c[1] - 6)} L${f(c[0])},${f(c[1] - 13)} L${f(c[0] + 6)},${f(c[1] - 6)} M${f(c[0])},${f(c[1] - 13)} L${f(c[0] + 2)},${f(c[1] - 16)}" stroke="${col}" stroke-width="2" fill="none"/>`; }; const xs = n === 1 ? [.6, 1.1] : n === 2 ? [.4, .8, 1.2] : [.3, .65, 1, 1.35, 1.7]; xs.forEach((a, i) => add(p.x + a + p.y + .7, bike(p.x + a, p.y + .7, ['#2f8a8f', '#e8475f', '#f6c33e'][i % 3]), p.uid)); if (n >= 2) add(p.x + p.y + 1.2, box(p.x + 1.3, p.y, .65, .5, 22, { wall: '#fff3dc', roof: '#2f8a8f', awning: '#2f8a8f' }), p.uid); if (n === 3) { const c = P(p.x + .3, p.y + .1); labels.push(label(c[0], c[1] - 30, 'Bikes', '#2f8a8f', 9)); } },
    streetcar(p, n) { // the ferry dock, out in the water
      ground.push(poly(dia(p.x, p.y, 2, n === 1 ? 1 : 2), WOOD, `stroke="${WOOD_DARK}" stroke-width="1"`) + [.33, .66].map(t => { const a = P(p.x + t * 2, p.y), b = P(p.x + t * 2, p.y + (n === 1 ? 1 : 2)); return seg(a[0], a[1], b[0], b[1], WOOD_DARK, .8); }).join(''));
      if (n === 1) { const c = P(p.x + 1, p.y + 1.6); add(p.x + p.y + 2.6, `<g transform="translate(${f(c[0])} ${f(c[1])})"><g class="fx-bob">${rowboat()}</g></g>`, p.uid); }
      if (n >= 2) { add(p.x + p.y + 1.6, box(p.x + .15, p.y + .15, .7, .7, 22, { wall: '#fff3dc', roof: '#2f8a8f', windows: [.3] }), p.uid); const c = P(p.x + 1.7, p.y + .4); add(p.x + p.y + 2.1, seg(c[0], c[1], c[0], c[1] - 40, '#5a4636', 1.6) + `<path d="M${f(c[0])},${f(c[1] - 40)} l14,4 l-14,4 Z" fill="#e8475f"/>`, p.uid); }
      if (n === 3) { add(p.x + p.y + 2.8, box(p.x + .9, p.y + .9, 1, 1, 30, { wall: '#f3ead8', roof: '#2f6e8f', awning: '#2f8a8f', windows: [.35] }), p.uid); const c = P(p.x + 1.4, p.y + 1.4); labels.push(label(c[0], c[1] - 50, 'Ferry', '#2f8a8f', 10)); }
    },
    market(p, n) { ground.push(poly(dia(p.x, p.y, 2, 2), PAVE)); const spots = n === 1 ? [[.65, .65]] : n === 2 ? [[.15, .2], [1.15, .2], [.65, 1.15]] : [[.15, .15], [1.15, .15], [.15, 1.15], [1.15, 1.15]]; spots.forEach(([a, b], i) => add(p.x + a + p.y + b + 1.4, stall(p.x + a, p.y + b, ['#2f8a8f', '#f6b62e', '#e8475f', '#8b55a6'][i]), p.uid)); if (n === 3) add(p.x + p.y + 2.2, stringLights([p.x, p.y + 1], [p.x + 2, p.y + 1], 30, true, ['#e8475f', '#f6b62e', '#6cc6e0']), p.uid); },
    lights(p, n) { const xs = [.2, 1.5, 2.8]; for (const a of xs) { const c = P(p.x + a, p.y + .5); add(p.x + a + p.y + .5, seg(c[0], c[1], c[0], c[1] - 36, '#5a4636', 2.4), p.uid); } add(p.x + p.y + 2.5, stringLights([p.x + .2, p.y + .5], [p.x + 1.5, p.y + .5], 34, n >= 2) + stringLights([p.x + 1.5, p.y + .5], [p.x + 2.8, p.y + .5], 34, n >= 2) + (n === 3 ? stringLights([p.x + .2, p.y + .5], [p.x + 2.8, p.y + .5], 24, true, ['#f6b62e', '#8b55a6']) : ''), p.uid); },
    fountain(p, n) { const c = P(p.x + 1, p.y + 1); let s; if (n === 1) s = rect(c[0] - 4, c[1] - 18, 8, 18, '#a9a39b', 'rx="2"') + ell(c[0], c[1] - 18, 7, 3, '#a9a39b') + `<path d="M${f(c[0])},${f(c[1] - 20)} q4,-8 8,0" fill="none" stroke="#6cc6e0" stroke-width="1.8"/>`; else { const r = n === 3 ? 34 : 26; s = ell(c[0], c[1], r, r / 2, '#a9a39b') + ell(c[0], c[1] - 2, r - 5, (r - 5) / 2, '#7cc6e0') + rect(c[0] - 3, c[1] - 22, 6, 20, '#a9a39b') + `<path d="M${f(c[0])},${f(c[1] - 24)} Q${f(c[0] - 12)},${f(c[1] - 44)} ${f(c[0] - 18)},${f(c[1] - 4)} M${f(c[0])},${f(c[1] - 24)} Q${f(c[0] + 12)},${f(c[1] - 44)} ${f(c[0] + 18)},${f(c[1] - 4)}" fill="none" stroke="#bfe6f2" stroke-width="2.4"/>`; if (n === 3) s += [-24, 24, 0].map((dx, i) => `<path d="M${f(c[0] + dx)},${f(c[1] - (i === 2 ? 10 : 2))} l0,-${i === 2 ? 46 : 26}" stroke="#6cc6e0" stroke-width="2.4"/>`).join(''); } add(p.x + p.y + 2, s, p.uid); },
    stage(p, n) { if (n === 1) { const c = P(p.x + 1, p.y + 1); add(p.x + p.y + 2, box(p.x + .7, p.y + .7, .6, .6, 10, { wall: WOOD, roof: '#c98a4a' }) + friend(c[0], c[1] - 20, 8, '#c96a3a') + `<text x="${f(c[0] + 14)}" y="${f(c[1] - 30)}" font-size="13" fill="#f6b62e">♪</text>`, p.uid); return; } let s = box(p.x, p.y + .3, 2, 1.5, 9, { wall: WOOD, roof: '#c98a4a' }); const back = [P(p.x, p.y + .3), P(p.x + 2, p.y + .3)]; s += back.map(b => seg(b[0], b[1] - 9, b[0], b[1] - 50, '#3a2a2a', 2.4)).join('') + poly([[back[0][0] - 6, back[0][1] - 50], [back[1][0] + 6, back[1][1] - 50], [back[1][0], back[1][1] - 42], [back[0][0], back[0][1] - 42]], '#5b2c6f'); const c = P(p.x + 1, p.y + 1); s += `<text x="${f(c[0])}" y="${f(c[1] - 24)}" text-anchor="middle" font-size="14" fill="#f6b62e">♪ ♫ ♪</text>`; if (n === 3) { s += [P(p.x - .1, p.y + 1.6), P(p.x + 2, p.y + 1.6)].map(q => rect(q[0] - 6, q[1] - 26, 12, 20, '#3a3a3a', 'rx="2"') + circ(q[0], q[1] - 18, 3, '#777')).join(''); [0, 1, 2, 3].forEach(i => { const t = P(p.x + .3 + i * .45, p.y + .3); s += circ(t[0], t[1] - 46, 3, ['#ffd34d', '#e8475f', '#6cc6e0', '#8b55a6'][i]); glow.push(`<path d="M${f(t[0])},${f(t[1] - 46)} L${f(t[0] - 14)},${f(t[1] + 6)} L${f(t[0] + 14)},${f(t[1] + 6)} Z" fill="#fff6c0" opacity=".18"/>`); }); s += friend(c[0] + 10, c[1] - 22, 7, '#f6c33e'); } add(p.x + p.y + 2.2, s, p.uid); },
    arch(p, n) { const a = P(p.x + .15, p.y + .5), b = P(p.x + 1.85, p.y + .5); if (n === 1) { const c = P(p.x + 1, p.y + .5); add(p.x + p.y + 1.5, seg(c[0], c[1], c[0], c[1] - 30, '#7a4b3a', 3), p.uid); labels.push(label(c[0], c[1] - 36, o.name || 'Welcome', '#5b2c6f', 10)); return; } let s = [a, b].map(q => rect(q[0] - 4, q[1] - 56, 8, 56, WOOD)).join(''); s += poly([[a[0] - 8, a[1] - 60], [b[0] + 8, b[1] - 60], [b[0] + 8, b[1] - 46], [a[0] - 8, a[1] - 46]], '#5b2c6f'); if (n === 3) { for (let i = 0; i <= 10; i++) { const t = i / 10, x = a[0] - 8 + (b[0] - a[0] + 16) * t, y = a[1] - 61 + (b[1] - a[1]) * t; s += circ(x, y, 2, ['#ffd34d', '#e8475f', '#8b55a6'][i % 3]); glow.push(circ(x, y, 6, '#ffd34d', 'opacity=".4"')); } s += [a, b].map(q => seg(q[0], q[1] - 60, q[0], q[1] - 76, '#7a4b3a', 1.4) + `<path d="M${f(q[0])},${f(q[1] - 76)} l12,4 l-12,4 Z" fill="#e8475f"/>`).join(''); } add(p.x + p.y + 1.6, s, p.uid); const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 53]; labels.push(`<text x="${f(m[0])}" y="${f(m[1] + 4)}" text-anchor="middle" font-family="Righteous, sans-serif" font-size="10" fill="#fff8ec" transform="rotate(26.6 ${f(m[0])} ${f(m[1])})">${esc(o.name || 'Welcome')}</text>`); },
    // amenities
    washrooms(p) { add(p.x + p.y + 1, box(p.x + .1, p.y + .1, .8, .8, 24, { wall: '#ffffff', roof: '#2f8a8f', windows: [.4] }), p.uid); const c = P(p.x + .5, p.y + .5); labels.push(label(c[0], c[1] - 34, 'WC', '#2f8a8f', 9)); },
    park(p) { ground.push(poly(dia(p.x, p.y, 3, 2), '#7cc365')); add(p.x + p.y + 1, tree(p.x + .5, p.y + .5, '#5fb34a', 1.1), p.uid); add(p.x + p.y + 3, tree(p.x + 2.5, p.y + .5, '#e8742f', 1.1), p.uid); for (const [a, b] of [[1.2, 1.3], [2.2, 1.4]]) { const c = P(p.x + a, p.y + b); add(p.x + a + p.y + b, poly([[c[0] - 12, c[1] - 6], [c[0] + 4, c[1] - 14], [c[0] + 12, c[1] - 10], [c[0] - 4, c[1] - 2]], '#c98a4a') + friend(c[0] - 12, c[1] - 12, 5, FRIENDS[Math.round(a * 3) % 6]), p.uid); } const k = P(p.x + 1.5, p.y); add(p.x + p.y + 1.5, `<g class="fx-bob">${seg(k[0], k[1], k[0] + 16, k[1] - 50, '#3a2a2a', .8)}<path d="M${f(k[0] + 16)},${f(k[1] - 62)} l8,8 l-8,8 l-8,-8 Z" fill="#e8475f"/></g>`, p.uid); },
    splash(p) { ground.push(poly(dia(p.x, p.y, 2, 2), '#bfe6f2') + poly(dia(p.x + .3, p.y + .3, 1.4, 1.4), '#d8f1f8')); const c = P(p.x + 1, p.y + 1); add(p.x + p.y + 2, [-16, 0, 16].map((dx, i) => `<path d="M${f(c[0] + dx)},${f(c[1])} Q${f(c[0] + dx - 6)},${f(c[1] - 26 - i * 4)} ${f(c[0] + dx - 12)},${f(c[1])}" fill="none" stroke="#6cc6e0" stroke-width="2.4"/>`).join('') + friend(c[0] - 18, c[1] + 6, 6, '#e2412f') + friend(c[0] + 16, c[1] + 4, 6, '#f6c33e'), p.uid); },
    pool(p) { ground.push(poly(dia(p.x, p.y, 3, 2), '#f3ead8') + poly(dia(p.x + .3, p.y + .3, 2.4, 1.4), '#6cc6e0', 'stroke="#fff" stroke-width="3"') + [.8, 1.3].map(b => { const a1 = P(p.x + .35, p.y + b), a2 = P(p.x + 2.65, p.y + b); return seg(a1[0], a1[1], a2[0], a2[1], '#fff', 1, 'stroke-dasharray="4 4" opacity=".8"'); }).join('')); add(p.x + p.y + 1.6, umbrella(p.x + .2, p.y + 1.8, '#e8475f'), p.uid); add(p.x + p.y + 4.6, umbrella(p.x + 2.8, p.y + 1.8, '#f6b62e'), p.uid); const c = P(p.x + 1.4, p.y + 1); add(p.x + p.y + 2.4, friend(c[0], c[1], 6, '#5b2c6f'), p.uid); },
    zoo(p) { ground.push(poly(dia(p.x, p.y, 3, 3), '#c9e3a0')); const corners = [P(p.x, p.y), P(p.x + 3, p.y), P(p.x + 3, p.y + 3), P(p.x, p.y + 3)]; let fence = ''; for (let i = 0; i < 4; i++) { const a = corners[i], b = corners[(i + 1) % 4]; fence += seg(a[0], a[1] - 8, b[0], b[1] - 8, WOOD, 2) + seg(a[0], a[1] - 3, b[0], b[1] - 3, WOOD, 2); } add(p.x + p.y + 5, fence, p.uid); add(p.x + p.y + 1.6, box(p.x + .2, p.y + .2, 1, .9, 24, { wall: '#c0392b', roof: '#8e2b20', windows: [.4] }), p.uid); const goat = (a, b) => { const c = P(p.x + a, p.y + b); return ell(c[0], c[1] - 7, 9, 6, '#fff') + circ(c[0] + 8, c[1] - 12, 4.5, '#fff') + seg(c[0] - 5, c[1] - 2, c[0] - 5, c[1] + 3, '#7a5f52', 1.6) + seg(c[0] + 4, c[1] - 2, c[0] + 4, c[1] + 3, '#7a5f52', 1.6); }; add(p.x + p.y + 3.6, goat(1.9, 1.7), p.uid); add(p.x + p.y + 3.4, goat(1.2, 2.2), p.uid); const pond = P(p.x + 2.2, p.y + 2.4); ground.push(ell(pond[0], pond[1], 18, 8, '#7cc6e0')); add(p.x + p.y + 4.6, `<g transform="translate(${f(pond[0])} ${f(pond[1] - 2)})">${duck()}</g>`, p.uid); },
    lighthouse(p) { const c = P(p.x + .5, p.y + .5); let s = ell(c[0], c[1], 14, 7, '#000', 'opacity=".1"') + poly([[c[0] - 10, c[1]], [c[0] + 10, c[1]], [c[0] + 6, c[1] - 70], [c[0] - 6, c[1] - 70]], '#fff'); for (const t of [.2, .55]) s += poly([[c[0] - 10 + 4 * t, c[1] - 70 * t], [c[0] + 10 - 4 * t, c[1] - 70 * t], [c[0] + 10 - 4 * (t + .15), c[1] - 70 * (t + .15)], [c[0] - 10 + 4 * (t + .15), c[1] - 70 * (t + .15)]], '#e8475f'); s += rect(c[0] - 8, c[1] - 84, 16, 14, '#3a2a2a', 'rx="2"') + rect(c[0] - 5, c[1] - 82, 10, 10, '#ffd34d') + `<path d="M${f(c[0] - 10)},${f(c[1] - 84)} L${f(c[0])},${f(c[1] - 96)} L${f(c[0] + 10)},${f(c[1] - 84)} Z" fill="#e8475f"/>`; add(p.x + p.y + 1, s, p.uid); glow.push(`<g class="isl-beam" style="transform-origin:${f(c[0])}px ${f(c[1] - 77)}px"><path d="M${f(c[0])},${f(c[1] - 77)} L${f(c[0] + 170)},${f(c[1] - 110)} L${f(c[0] + 170)},${f(c[1] - 44)} Z" fill="#fff6c0" opacity=".28"/></g>` + circ(c[0], c[1] - 77, 12, '#ffd34d', 'opacity=".6"')); },
    cart(p) { // the pretzel cart on the beach
      const c = P(p.x + .5, p.y + .5);
      add(p.x + p.y + 1, ell(c[0], c[1], 13, 6, '#000', 'opacity=".1"') + box(p.x + .22, p.y + .3, .56, .42, 13, { wall: '#fff3dc', roof: '#c98a4a' }) +
        circ(c[0] - 8, c[1] + 1, 3, '#5a4636') + circ(c[0] + 8, c[1] + 1, 3, '#5a4636') + umbrella(p.x + .5, p.y + .5, '#e8475f'), p.uid);
      labels.push(label(c[0], c[1] - 52, 'Pretzels', '#c96a3a', 9));
    },
    cafeboat(p) { // the Bagel boat café, tied up at a little pier
      ground.push(poly(dia(p.x, p.y, 2, .45), WOOD, `stroke="${WOOD_DARK}" stroke-width=".8"`));
      const c = P(p.x + 1, p.y + 1.25);
      add(p.x + p.y + 2.3, `<g transform="translate(${f(c[0])} ${f(c[1])})"><g class="fx-bob">${cafeBoat()}</g></g>`, p.uid);
      glow.push(circ(c[0], c[1] - 14, 18, '#ffd77a', 'opacity=".3"'));
      labels.push(label(c[0], c[1] - 50, 'Bagel boat', '#5b2c6f', 9));
    },
    marina(p) { ground.push([0, 1, 2].map(i => poly(dia(p.x + i + .4, p.y, .2, 2), WOOD, `stroke="${WOOD_DARK}" stroke-width=".8"`)).join('') + poly(dia(p.x, p.y, 3, .25), WOOD, `stroke="${WOOD_DARK}" stroke-width=".8"`)); [[.95, 1.2, '#e8475f'], [1.95, 1.4, '#2f8a8f'], [2.75, 1, '#f6b62e']].forEach(([a, b, col], i) => { const c = P(p.x + a, p.y + b); add(p.x + a + p.y + b, `<g transform="translate(${f(c[0])} ${f(c[1])})"><g class="fx-bob" style="animation-delay:-${i * .4}s">${sailboat(col)}</g></g>`, p.uid); glow.push(circ(c[0], c[1] - 27, 5, '#ffd34d', 'opacity=".7"')); }); },
    // decorations
    maple: p => add(p.x + p.y + 1, tree(p.x + .5, p.y + .5, '#e8742f'), p.uid),
    cherry: p => add(p.x + p.y + 1, tree(p.x + .5, p.y + .5, '#f6b3c8'), p.uid),
    leafy: p => add(p.x + p.y + 1, tree(p.x + .5, p.y + .5, '#5fb34a'), p.uid),
    flowers: p => ground.push(bed(p.x, p.y, 1, 1, [flowerCol, '#8b55a6', '#f6c33e'], 7, p.x * 31 + p.y)),
    bench: p => add(p.x + p.y + 1, benchAt(p.x + .5, p.y + .55), p.uid),
    lamp: p => add(p.x + p.y + 1, lampPost(p.x + .5, p.y + .5, 'basket'), p.uid),
    path: () => {},
    rowboat: p => { const c = P(p.x + .5, p.y + .5); add(p.x + p.y + 1, `<g transform="translate(${f(c[0])} ${f(c[1])})"><g class="fx-bob">${rowboat()}</g></g>`, p.uid); },
    sailboat: p => { const c = P(p.x + .5, p.y + .5); add(p.x + p.y + 1, `<g transform="translate(${f(c[0])} ${f(c[1])})"><g class="fx-bob">${sailboat(['#e8475f', '#2f8a8f', '#8b55a6'][(p.x + p.y) % 3])}</g></g>`, p.uid); glow.push(circ(c[0], c[1] - 27, 5, '#ffd34d', 'opacity=".7"')); },
    duck: p => { const c = P(p.x + .5, p.y + .5); add(p.x + p.y + 1, `<g transform="translate(${f(c[0])} ${f(c[1])})"><g class="fx-bob">${duck()}</g></g>`, p.uid); },
  };
  for (const p of o.pieces) { if (p.uid && o.focus === p.uid) ground.push(poly(dia(p.x, p.y, p.w, p.d), '#e9d4f5', 'opacity=".7"')); DRAW[p.type]?.(p, p.stage || 1); }

  // the piece she's placing: its squares glow green (fits) or red (doesn't), with a see-through preview
  if (o.ghost) {
    const q = o.ghost;
    ground.push(poly(dia(q.x, q.y, q.w, q.d), q.ok ? '#fff6a8' : '#f6a8a8', `opacity=".85" stroke="${q.ok ? '#3f9b3c' : '#e2412f'}" stroke-width="2.4"`));
    const before = objs.length;
    DRAW[q.type]?.({ ...q, uid: null }, q.stage || 1);
    for (let i = before; i < objs.length; i++) objs[i][1] = `<g opacity=".6">${objs[i][1]}</g>`;
  }

  // ----- boats out on the water -----
  const ring = (r, n = 32) => 'M' + [...Array(n + 1)].map((_, i) => { const a = i / n * Math.PI * 2; return P(C + Math.cos(a) * r, C + Math.sin(a) * r).map(f).join(','); }).join(' L');
  for (let i = 0; i < (o.sailboats || 0); i++) {
    const r = R + 2.6 + (i % 3) * .9, dur = 46 + i * 9;
    boats.push(`<g class="isl-move"><g class="fx-bob">${sailboat(['#e8475f', '#2f8a8f', '#f6b62e', '#8b55a6'][i % 4])}</g><animateMotion dur="${dur}s" begin="-${(i * 13) % dur}s" repeatCount="indefinite" path="${ring(r)}"/></g>`);
  }
  // the ferry runs from out at sea to the dock and back, and waits at the dock in between
  if (o.ferry && o.ferry.stage >= 2) {
    const fr = o.ferry, mid = [fr.x + fr.w / 2, fr.y + fr.d / 2];
    const dx = mid[0] - C, dy = mid[1] - C, len = Math.hypot(dx, dy) || 1;
    const dockPt = P(mid[0] + dx / len * 1.4, mid[1] + dy / len * 1.4), far = P(mid[0] + dx / len * 12, mid[1] + dy / len * 12);
    for (let i = 0; i < (fr.stage === 3 ? 2 : 1); i++) {
      boats.push(`<g class="isl-move"><g class="fx-bob">${ferry(fr.stage === 3)}</g><animateMotion dur="24s" begin="-${i * 12}s" repeatCount="indefinite" calcMode="linear" keyPoints="1;0;0;1;1" keyTimes="0;.35;.55;.9;1" path="M${f(dockPt[0])},${f(dockPt[1])} L${f(far[0])},${f(far[1])}"/></g>`);
      glow.push(`<g class="isl-move">${circ(0, -8, 22, '#ffd77a', 'opacity=".25"')}<animateMotion dur="24s" begin="-${i * 12}s" repeatCount="indefinite" calcMode="linear" keyPoints="1;0;0;1;1" keyTimes="0;.35;.55;.9;1" path="M${f(dockPt[0])},${f(dockPt[1])} L${f(far[0])},${f(far[1])}"/></g>`);
    }
  }

  // ----- visitors -----
  const xs = [...Array(N).keys()].filter(x => land(x, ISLAND.mainStreet));
  let walkers = '';
  if (xs.length) {
    const lo = Math.min(...xs), hi = Math.max(...xs) + 1, y = ISLAND.mainStreet;
    const street = [`M${P(lo, y + .3).map(f)} L${P(hi, y + .3).map(f)}`, `M${P(hi, y + .7).map(f)} L${P(lo, y + .7).map(f)}`];
    const shore = R >= 5.6 ? ring(R - .6, 40) : null;
    for (let i = 0; i < (o.people || 0); i++) {
      const path = shore && i % 3 === 2 ? shore : street[i % 2], dur = (path === shore ? 70 : 14) + (i * 7) % 10;
      walkers += `<g class="isl-move">${friend(0, -5, 5, FRIENDS[i % 6])}<animateMotion dur="${dur}s" begin="-${(i * 5.3) % dur}s" repeatCount="indefinite" path="${path}"/></g>`;
    }
  }

  // ----- events -----
  let fx = '', fxTop = '';
  const ev = o.event;
  if (ev && xs.length) {
    const lo = Math.min(...xs), hi = Math.max(...xs) + 1, y = ISLAND.mainStreet;
    if (ev === 'trucks') [lo + 1, (lo + hi) / 2, hi - 1.5].forEach((x, i) => add(x + y + 1, box(x - .4, y + .1, .9, .55, 20, { wall: ['#e8475f', '#f6b62e', '#2f8a8f'][i], roof: '#fff3dc', awning: '#fff3dc' })));
    if (ev === 'festival' || ev === 'tulipfest') add(y + hi, stringLights([lo, y + .5], [hi, y + .5], 44, true, ev === 'tulipfest' ? ['#e8475f', '#8b55a6', '#f6c33e'] : ['#e8475f', '#2f8a8f', '#f6b62e']));
    if (ev === 'festival' || ev === 'tulipfest') {
      const c = P(C, C);
      for (let i = 0; i < 26; i++) {
        const x = c[0] - 300 + (i * 97) % 600, y0 = c[1] - 260 + (i * 53) % 120;
        fxTop += ev === 'tulipfest' ? `<path class="fx-fall" style="animation-delay:-${(i % 7) * .4}s" d="M${x},${y0} q4,-6 8,0 q-4,6 -8,0" fill="${['#e8475f', '#8b55a6', '#f6c33e'][i % 3]}"/>` : `<rect class="fx-fall" style="animation-delay:-${(i % 7) * .4}s" x="${x}" y="${y0}" width="5" height="3" fill="${FRIENDS[i % 6]}"/>`;
      }
    }
    if (ev === 'parade') for (let i = 0; i < 7; i++) boats.push(`<g class="isl-move"><g class="fx-bob">${sailboat(FRIENDS[i % 6], ['#f6c33e', '#6cc6e0', '#fff'][i % 3])}</g><animateMotion dur="40s" begin="-${i * 2.6}s" repeatCount="indefinite" path="${ring(R + 1.5, 40)}"/></g>`);
    if (ev === 'fireworks') {
      const c = P(C, C);
      [[-220, -330, '#ffd34d'], [-60, -400, '#e8475f'], [120, -350, '#6cc6e0'], [260, -300, '#8b55a6'], [30, -290, '#5fb34a']].forEach(([dx, dy, col], i) => {
        let b = '';
        for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; b += seg(c[0] + dx + Math.cos(a) * 8, c[1] + dy + Math.sin(a) * 8, c[0] + dx + Math.cos(a) * 30, c[1] + dy + Math.sin(a) * 30, col, 2.4, 'stroke-linecap="round"'); }
        fxTop += `<g class="fx-burst" style="animation-delay:-${i * .35}s">${b}${circ(c[0] + dx, c[1] + dy, 4, '#fff')}</g>`;
      });
    }
  }

  // ----- put it together -----
  objs.sort((a, b) => a[0] - b[0]);
  const night = o.night || ev === 'fireworks';
  let vb = `0 0 ${g.W} ${g.H}`, W = g.W, H = g.H;
  if (o.crop) {
    const s = R + 2.2, l = P(C - s, C + s)[0], r = P(C + s, C - s)[0], t = P(C - s, C - s)[1] - 120, b = P(C + s, C + s)[1] + 6;
    vb = `${f(l)} ${f(t)} ${f(r - l)} ${f(b - t)}`; W = r - l; H = b - t;
  }
  const sc = o.scale || 1;
  return `<svg width="${f(W * sc)}" height="${f(H * sc)}" viewBox="${vb}" role="img" aria-label="${esc(o.label || 'Your island')}">` +
    tiles + ground.join('') + boats.join('') + objs.map(x => x[1]).join('') + fx + walkers +
    (night ? rect(-300, -300, g.W + 600, g.H + 600, '#241b4a', 'opacity=".52"') + glow.join('') : '') + fxTop + labels.join('') + '</svg>';
}
