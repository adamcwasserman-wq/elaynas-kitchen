// All game art, drawn in code in the "sunny poster" style Elayna picked:
// flat colours, a soft shadow on the side away from the light (light comes from the top left),
// a white shine, and no outlines. Every drawing fits a 100 x 100 box.
//
// The drawings are put on the page once, as a hidden "sprite", and every square on the
// board reuses them. To add an item, add a function to ITEM_ART with the item's id.

// ---------- colours ----------
export const COLOURS = {
  ink: '#3a2a2a',
  shadow: '#7a3b1f',
  eggplant: '#5b2c6f',
  teal: '#2f8a8f',
  tomato: '#e9412f',
  leaf: '#3f9b3c',
  tulip: '#e8475f',
  cream: '#fff3dc',
  white: '#fffaf0',
  blush: '#f28b82',
  gold: '#f6b62e',
  goldDark: '#b97a12',
};
const K = COLOURS;

// ---------- small drawing helpers ----------
let uid = 0;
const attrs = a => Object.entries(a).filter(([, v]) => v !== undefined && v !== null)
  .map(([k, v]) => `${k}="${v}"`).join(' ');
const E = (t, a = {}, c = '') => `<${t} ${attrs(a)}>${c}</${t}>`;
const C = (cx, cy, r) => ({ t: 'circle', a: { cx, cy, r } });
const EL = (cx, cy, rx, ry, rot = 0) => ({ t: 'ellipse', a: { cx, cy, rx, ry, transform: rot ? `rotate(${rot} ${cx} ${cy})` : undefined } });
const R = (x, y, width, height, rx = 0) => ({ t: 'rect', a: { x, y, width, height, rx } });
const P = d => ({ t: 'path', a: { d } });

const fill = (sp, c, extra = {}) => E(sp.t, { ...sp.a, fill: c, ...extra });
const shine = (sp, op = .5) => fill(sp, '#fff', { opacity: op });
const line = (d, c, w, extra = {}) =>
  E('path', { d, fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra });
const ground = (cx, cy, rx, ry) => fill(EL(cx, cy, rx, ry), K.shadow, { opacity: .13 });

// A shape with a darker copy peeking out below right: a cheap, soft-looking edge.
const two = (sp, c, dark, d = 1.6) => E('g', { transform: `translate(${d} ${d})` }, fill(sp, dark)) + fill(sp, c);

// Shadow on the far side of a shape: the shape minus a copy of itself nudged toward the light.
function shade(sp, dx = -7, dy = -7, op = .17) {
  const id = `sh${uid++}`;
  const big = { x: -60, y: -60, width: 480, height: 300 }; // covers item art, badge friends and the wide restaurant
  return E('mask', { id, maskUnits: 'userSpaceOnUse', ...big },
    E('rect', { ...big, fill: '#000' }) + fill(sp, '#fff') +
    E('g', { transform: `translate(${dx} ${dy})` }, fill(sp, '#000'))) +
    E('rect', { ...big, fill: K.shadow, opacity: op, mask: `url(#${id})` });
}
const body = (sp, c, dx, dy, op) => fill(sp, c) + shade(sp, dx, dy, op);

// Move a small path drawn around 0,0 (points written as "x,y") to a spot, at a size.
const sc = (d, cx, cy, s) => d.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g,
  (m, x, y) => `${(cx + +x * s).toFixed(1)},${(cy + +y * s).toFixed(1)}`);

function rng(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const pt = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
function blob(cx, cy, rx, ry, n, amp, seed) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < n; i++) {
    const th = i / n * Math.PI * 2, k = 1 + (r() - .5) * 2 * amp;
    pts.push([cx + Math.cos(th) * rx * k, cy + Math.sin(th) * ry * k]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${pt(mid(pts[n - 1], pts[0]))}`;
  for (let i = 0; i < n; i++) d += ` Q${pt(pts[i])} ${pt(mid(pts[i], pts[(i + 1) % n]))}`;
  return d + 'Z';
}
function leaf(x, y, ang, len, wid) {
  const a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
  const tip = [x + dx * len, y + dy * len];
  const c1 = [x + dx * len * .5 + px * wid, y + dy * len * .5 + py * wid];
  const c2 = [x + dx * len * .5 - px * wid, y + dy * len * .5 - py * wid];
  return `M${x},${y} Q${pt(c1)} ${pt(tip)} Q${pt(c2)} ${x},${y} Z`;
}
const ellipsePath = (cx, cy, rx, ry) =>
  `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0 Z`;

const TULIP = 'M-10,-6 L-5,-1 L0,-10 L5,-1 L10,-6 C10,6 6,10 0,10 C-6,10 -10,6 -10,-6 Z';
const tulip = (cx, cy, s, c) => fill(P(sc(TULIP, cx, cy, s)), c);

// A friendly face: dot eyes with a shine, rosy cheeks, a small smile.
function face(x1, x2, y, opts = {}) {
  const r = opts.r ?? 3.6, eye = opts.eye ?? K.ink, mouth = opts.mouth ?? K.ink;
  const mx = (x1 + x2) / 2, my = y + (opts.mouthDrop ?? 9);
  let s = '';
  if (opts.whites) s += fill(C(x1, y, r + 1.8), '#fff') + fill(C(x2, y, r + 1.8), '#fff');
  s += fill(C(x1, y, r), eye) + fill(C(x2, y, r), eye);
  s += fill(C(x1 + r * .35, y - r * .4, r * .32), '#fff') + fill(C(x2 + r * .35, y - r * .4, r * .32), '#fff');
  s += fill(C(x1 - 6, y + 8, 5.5), K.blush, { opacity: .55 }) + fill(C(x2 + 6, y + 8, 5.5), K.blush, { opacity: .55 });
  s += line(`M${mx - 5.5},${my} Q${mx},${my + 5.5} ${mx + 5.5},${my}`, mouth, 2.4);
  return s;
}

// ---------- the food ----------
export const ITEM_ART = {
  wheat() {
    let s = ground(50, 91, 16, 3.5);
    s += line('M50,92 Q48,62 51,24', '#b98a36', 3.5);
    s += fill(P('M50,84 Q33,78 28,60 Q42,66 50,78 Z'), '#8fb84a');
    s += fill(P('M51,74 Q67,68 72,52 Q59,58 51,68 Z'), '#7aa83e');
    for (let i = 0; i < 5; i++) {
      const y = 30 + i * 8.5;
      s += two(EL(44.5, y + 4, 5, 8.5, -28), '#efbb52', '#c98a2a');
      s += two(EL(56.5, y + 1, 5, 8.5, 28), '#efbb52', '#c98a2a');
    }
    s += two(EL(51, 21, 4.6, 8.5), '#efbb52', '#c98a2a');
    return s + shine(EL(43, 30, 1.6, 3.5, -28), .6) + shine(EL(55, 27, 1.6, 3.5, 28), .6);
  },

  flour() {
    let s = ground(50, 90, 26, 4.5);
    s += fill(P('M36,42 Q32,26 40,20 L60,20 Q68,26 64,42 Z'), '#f2e2c2');
    const sack = P('M27,44 Q22,64 27,84 Q50,93 73,84 Q78,64 73,44 Q62,37 50,39 Q38,37 27,44 Z');
    s += body(sack, '#fff4de', -8, -6, .2);
    s += fill(R(35, 35, 30, 7, 3.5), '#c98a4a');
    s += fill(C(50, 65, 13), K.eggplant);
    s += line('M50,75 L50,56', '#f7c873', 2);
    for (const y of [58, 63, 68]) s += fill(EL(46.5, y, 2.4, 4, -30), '#f7c873') + fill(EL(53.5, y, 2.4, 4, 30), '#f7c873');
    s += fill(C(44, 17, 5), '#fff', { opacity: .95 }) + fill(C(52, 13, 6), '#fff', { opacity: .95 }) + fill(C(59, 18, 4.5), '#fff', { opacity: .95 });
    return s;
  },

  // Dough sits in a teal mixing bowl, so it doesn't look like the bagel or challah.
  dough() {
    let s = ground(50, 90, 34, 5);
    const d = P(blob(50, 46, 26, 18, 12, .06, 4));
    s += body(d, '#fbe8c6', -6, -6, .18);
    s += shine(EL(40, 38, 7, 3.5, -25), .7);
    for (const [x, y] of [[56, 36], [62, 44], [44, 50], [35, 44]]) s += fill(C(x, y, 1.6), '#fff', { opacity: .9 });
    const bowl = P('M12,54 L88,54 Q86,86 50,88 Q14,86 12,54 Z');
    s += body(bowl, K.teal, -8, -4, .2);
    s += fill(R(10, 51, 80, 7, 3.5), '#3fa3a8');
    s += fill(P('M20,64 L80,64 L79,68 L21,68 Z'), K.white, { opacity: .8 });
    s += shine(P('M18,60 Q20,76 32,82 Q24,74 23,60 Z'), .3);
    return s;
  },

  bagel() {
    let s = ground(50, 84, 34, 5);
    const bag = { t: 'path', a: { d: ellipsePath(50, 58, 36, 25) + ellipsePath(50, 54, 11, 6.5), 'fill-rule': 'evenodd' } };
    s += fill(bag, '#d9913f') + shade(bag, -6, -8, .24);
    s += shine(P('M22,52 Q30,38 50,36 Q70,38 78,52 Q66,44 50,44 Q34,44 22,52 Z'), .3);
    for (const a of [-165, -140, -115, -90, -65, -40, -15, 160, 20]) {
      const r = a * Math.PI / 180;
      s += fill(EL(50 + Math.cos(r) * 24, 55 + Math.sin(r) * 16, 2.2, 1.1, a + 90), K.cream);
    }
    return s;
  },

  challah() {
    let s = ground(51, 84, 40, 5);
    s += fill(EL(52, 66, 36, 13), '#b8692a');
    const bumps = [[20, 62, 8, 11, -30], [32, 58, 11, 15, 30], [46, 56, 12, 16, -30], [60, 56, 12, 16, 30], [73, 58, 11, 15, -30], [84, 62, 8, 11, 30]];
    for (const b of bumps) s += two(EL(...b), '#e29640', '#a8611e', 2.2);
    for (const [x, y, , , rot] of bumps.slice(1, 5)) s += shine(EL(x - 3, y - 7, 4.5, 2.2, rot), .5);
    const r = rng(7);
    for (let i = 0; i < 14; i++) s += fill(EL(24 + r() * 60, 48 + r() * 14, 1.5, .8, r() * 180), K.cream);
    return s;
  },

  babka() {
    let s = ground(48, 87, 38, 5);
    const loaf = P('M12,50 Q12,36 26,36 L60,36 Q74,36 74,50 L74,82 L12,82 Z');
    s += body(loaf, '#c47a35', -6, -6, .2);
    s += line('M16,46 Q24,40 32,46 T48,46 T64,44 T72,48', '#5a3324', 3.5);
    s += line('M16,62 Q26,56 34,63 T52,61 T70,63', '#5a3324', 3);
    s += line('M16,76 Q26,71 36,77 T56,75', '#5a3324', 2.5);
    s += shine(P('M16,44 Q18,38 26,38 L40,38 Q30,40 20,46 Z'), .4);
    s += E('rect', { x: 56, y: 56, width: 34, height: 32, rx: 9, fill: '#f3c77a', stroke: '#c47a35', 'stroke-width': 3.5 });
    s += E('path', { d: 'M73,72 m-1.5,0 a1.5,1.5 0 1,1 3,0 a5,5 0 1,1 -10,0 a9,9 0 1,1 18,0', fill: 'none', stroke: '#5a3324', 'stroke-width': 3, 'stroke-linecap': 'round' });
    return s;
  },

  milk() {
    let s = ground(50, 91, 24, 4);
    const bottle = P('M39,30 L61,30 L61,38 Q72,46 72,58 L72,84 Q72,90 66,90 L34,90 Q28,90 28,84 L28,58 Q28,46 39,38 Z');
    s += body(bottle, '#ffffff', -8, -5, .2);
    s += fill(R(37, 21, 26, 11, 3), K.teal) + shine(R(40, 23, 9, 3, 1.5), .45);
    s += fill(R(28, 60, 44, 18), K.tulip);
    s += fill(C(50, 69, 6.5), K.white);
    return s;
  },

  // Butter: a pale stick on a blue butter dish, with a knife. Not a yellow block.
  butter() {
    let s = ground(50, 86, 42, 5);
    s += fill(EL(50, 76, 44, 12), '#7cc3d6') + fill(EL(50, 74, 36, 8.5), '#b9e2ec');
    const top = P('M22,58 L34,48 L78,48 L66,58 Z');
    s += fill(R(22, 58, 44, 14, 2), '#ffe9a6') + fill(P('M66,58 L78,48 L78,62 L66,72 Z'), '#f1cf6a') + fill(top, '#fff4c8');
    s += fill(P('M46,48 Q50,54 54,48 Z'), '#f1cf6a', { opacity: .6 });
    s += E('g', { transform: 'rotate(-28 70 40)' },
      fill(R(46, 36, 34, 7, 3.5), '#d5dae3') + fill(R(76, 35, 18, 9, 4.5), K.eggplant) + shine(R(48, 37, 26, 2, 1), .7));
    return s;
  },

  // Cream cheese: a purple-labelled tub with a swirl on top.
  creamcheese() {
    let s = ground(50, 88, 28, 5);
    s += fill(EL(74, 34, 17, 6.5, -35), K.eggplant) + fill(EL(74, 33, 12.5, 4.3, -35), '#7a4a90');
    const tub = P('M24,46 L76,46 L71,84 Q50,91 29,84 Z');
    s += body(tub, '#ffffff', -7, -5, .2);
    s += fill(P('M25.6,58 L74.4,58 L72.6,72 L27.4,72 Z'), K.eggplant);
    s += tulip(50, 65, .5, K.white);
    s += fill(EL(50, 46, 26, 8.5), '#fff8ea') + fill(EL(50, 47, 22, 6.2), '#f1e3c6');
    s += fill(P('M36,47 Q40,34 50,38 Q60,32 64,45 Q54,42 50,48 Q46,42 36,47 Z'), '#fffdf6');
    s += line('M44,42 Q50,38 56,42', '#e8d8b8', 1.6);
    return s;
  },

  cheese() {
    let s = ground(50, 88, 40, 5);
    const front = P('M12,58 L88,58 L88,84 L12,84 Z');
    s += body(front, '#ffcf47', -6, -6, .18);
    s += fill(P('M12,58 L70,26 L88,58 Z'), '#ffe48a');
    for (const [x, y, r] of [[28, 70, 5], [50, 76, 3.5], [71, 68, 6]]) s += fill(C(x, y, r), '#e8b52f');
    s += fill(EL(52, 47, 4, 2.2), '#e8b52f') + fill(EL(68, 53, 3, 1.6), '#e8b52f');
    s += shine(P('M20,56 L66,31 L68,35 L26,57 Z'), .45);
    return s;
  },

  wheel() {
    let s = ground(50, 86, 36, 5);
    s += fill(P('M18,50 L18,70 A32,12 0 0,0 82,70 L82,50 Z'), '#c9372a');
    s += fill(EL(50, 50, 32, 12), '#e2513f');
    s += fill(P('M50,50 L80.1,54.1 L80.1,74.1 L50,70 Z'), '#f2b93a');
    s += fill(P('M50,50 L60.9,61.3 L60.9,81.3 L50,70 Z'), '#ffd45c');
    s += fill(C(70, 64, 2.6), '#e0a628') + fill(C(55, 70, 2), '#e0a628') + fill(C(76, 70, 1.8), '#e0a628');
    s += shine(EL(34, 46, 11, 3.2, -5), .35);
    s += shine(P('M20,55 L20,66 Q22,70 26,71 L26,60 Q22,58 20,55 Z'), .25);
    return s;
  },

  cheesecake() {
    let s = ground(50, 89, 42, 5);
    s += fill(EL(50, 82, 41, 9), K.white) + fill(EL(50, 81, 33, 6), '#f1e3c6');
    const side = P('M20,50 L20,74 A30,9 0 0,0 80,74 L80,50 Z');
    s += body(side, '#fff1cf', -8, 0, .16);
    s += fill(P('M20,69 L20,74 A30,9 0 0,0 80,74 L80,69 A30,9 0 0,1 20,69 Z'), '#c98a4a');
    s += fill(EL(50, 50, 30, 9), '#fff8e4');
    s += fill(EL(50, 49.5, 26, 7), '#d7263d');
    for (const d of ['M28,53 Q27,62 31,62 Q34,62 33,55 Z', 'M46,57 Q45,65 49,65 Q52,65 51,57 Z', 'M66,55 Q66,61 69,61 Q72,61 71,53 Z'])
      s += fill(P(d), '#d7263d');
    for (const [x, y] of [[42, 44], [58, 43]]) {
      s += fill(P(sc('M0,-6 C6,-6 8,0 0,8 C-8,0 -6,-6 0,-6 Z', x, y, 1)), K.tulip);
      s += fill(EL(x, y - 6.5, 4, 1.6), K.leaf) + fill(C(x - 1.5, y - 2, .9), '#ffd34d');
    }
    s += shine(EL(36, 48, 6, 1.8, -10), .55);
    return s;
  },

  // ---------- dishes (made by mixing) ----------
  pancakes() {
    let s = ground(50, 89, 42, 5);
    s += fill(EL(50, 80, 42, 9), K.white) + fill(EL(50, 79, 34, 6), '#f1e3c6');
    for (let i = 0; i < 3; i++) {
      const y = 70 - i * 10;
      s += fill(P(`M14,${y} L14,${y + 6} A36,9 0 0,0 86,${y + 6} L86,${y} Z`), '#c97f35');
      s += fill(EL(50, y, 36, 9), '#f2c272');
    }
    s += fill(EL(50, 49.5, 27, 6.5), '#a8561e');
    for (const d of ['M26,52 Q25,62 28,62 Q31,62 30,54 Z', 'M66,54 Q66,66 69,66 Q72,66 71,53 Z', 'M46,55 Q45,61 48,61 Q51,61 50,55 Z'])
      s += fill(P(d), '#a8561e');
    s += fill(P('M42,46 L52,42 L62,46 L52,50 Z'), '#fff4c8') + fill(P('M42,46 L52,50 L52,54 L42,50 Z'), '#f1cf6a') + fill(P('M52,50 L62,46 L62,50 L52,54 Z'), '#e0b237');
    s += shine(EL(36, 49, 6, 1.6, -8), .55);
    s += fill(EL(70, 47, 8, 4.5, 10), '#ffd84a') + fill(EL(70, 46.5, 6.5, 3.4, 10), '#fff4a8');
    s += line('M64,46 L76,48 M70,43 L70,51', '#ffd84a', 1);
    return s;
  },

  pecanpie() {
    let s = ground(50, 88, 40, 5);
    const side = P('M12,58 L20,78 Q50,92 80,78 L88,58 Z');
    s += body(side, '#c47a35', -8, 0, .2);
    for (let a = 0; a < 360; a += 24) {
      const r = a * Math.PI / 180;
      s += fill(C(50 + Math.cos(r) * 37, 58 + Math.sin(r) * 17, 6), '#e2a04f');
    }
    s += fill(EL(50, 58, 37, 17), '#e2a04f');
    s += fill(EL(50, 57, 29, 12), '#9c4f17');
    s += fill(EL(50, 56, 25, 9.5), '#b8661f');
    for (const [x, y, rot] of [[38, 55, -20], [50, 50, 10], [62, 55, 30], [44, 61, 0], [57, 62, -15]])
      s += fill(EL(x, y, 6, 3.2, rot), '#8a4a22') + fill(EL(x - 1, y - 1, 3.5, 1.2, rot), '#a8612e');
    s += shine(EL(40, 51, 7, 2, -8), .5);
    return s;
  },

  schmear() {
    let s = ground(50, 88, 40, 5);
    const ring = (cx, cy, rx, ry, hx, hy) => ({ t: 'path', a: { d: ellipsePath(cx, cy, rx, ry) + ellipsePath(cx, cy - 2, hx, hy), 'fill-rule': 'evenodd' } });
    const bottom = ring(50, 70, 37, 17, 10, 4.5);
    s += fill(bottom, '#c97a30') + shade(bottom, -6, -8, .22);
    s += fill(P(blob(50, 63, 33, 13, 14, .06, 9)), '#fffaf0');
    s += line('M30,62 Q40,58 50,62 T70,61', '#eadfc6', 2);
    s += fill(EL(50, 61, 7, 3), '#efe3c8');
    const top = ring(56, 40, 32, 14, 8.5, 4);
    s += E('g', { transform: 'rotate(-10 56 40)' }, fill(top, '#e29a45') + shade(top, -5, -6, .18) +
      shine(P('M30,36 Q40,28 56,27 Q70,28 80,34 Q68,31 56,31 Q42,31 30,36 Z'), .35) +
      [[38, 33], [46, 29], [62, 28], [72, 32], [42, 45], [72, 45]].map(([x, y]) => fill(EL(x, y, 2, 1), K.cream)).join(''));
    return s;
  },

  granola() {
    let s = ground(50, 89, 38, 5);
    const bowl = P('M14,52 L86,52 Q84,84 50,86 Q16,84 14,52 Z');
    s += body(bowl, K.teal, -8, -4, .2);
    s += fill(EL(50, 52, 36, 9), '#3fa3a8') + fill(EL(50, 52, 31, 7), '#fff8ea');
    const r = rng(11);
    for (let i = 0; i < 16; i++) s += fill(C(26 + r() * 48, 45 + r() * 10, 3 + r() * 2.5), r() > .5 ? '#c98a3a' : '#a8692a');
    for (const [x, y] of [[36, 46], [58, 44], [66, 52], [44, 54]]) s += fill(C(x, y, 3.2), K.tulip) + fill(C(x - 1, y - 1, .9), '#fff', { opacity: .6 });
    s += fill(P('M20,64 L80,64 L79,68 L21,68 Z'), K.white, { opacity: .7 });
    return s;
  },

  shortbread() {
    let s = ground(50, 88, 40, 5);
    s += fill(EL(50, 80, 42, 9), K.white) + fill(EL(50, 79, 34, 6), '#f1e3c6');
    const piece = (x, y, rot) => E('g', { transform: `rotate(${rot} ${x} ${y})` },
      body(R(x - 18, y - 11, 36, 22, 3), '#f6d79a', -4, -4, .18) +
      [[-10, -4], [0, -4], [10, -4], [-10, 4], [0, 4], [10, 4]].map(([dx, dy]) => fill(C(x + dx, y + dy, 1.3), '#c98a3a')).join('') +
      shine(R(x - 15, y - 9, 18, 2.4, 1.2), .5) +
      fill(EL(x + 3, y + 1, 7, 4), '#8a4a22') + line(`M${x - 3},${y + 1} L${x + 9},${y + 1}`, '#5a3324', 1.2));
    return s + piece(34, 66, -10) + piece(66, 64, 12) + piece(50, 46, -4);
  },

  cheesedanish() {
    let s = ground(50, 88, 40, 5);
    s += body(P(sc('M0,-32 L10,-12 L32,-10 L16,6 L22,30 L0,18 L-22,30 L-16,6 L-32,-10 L-10,-12 Z', 50, 52, 1.05)), '#e29a45', -6, -6, .22);
    s += fill(C(50, 52, 17), '#c97f35') + fill(P(blob(50, 51, 14, 13, 10, .06, 5)), '#fff6dc');
    s += fill(EL(46, 47, 5, 3, -20), '#fff', { opacity: .8 });
    s += line('M28,30 Q50,22 72,32', '#fff', 2.2, { opacity: .8 }) + line('M30,72 Q50,64 70,72', '#fff', 2.2, { opacity: .8 });
    return s;
  },

  biscuits() {
    let s = ground(50, 88, 40, 5);
    s += fill(EL(50, 80, 42, 9), K.white) + fill(EL(50, 79, 34, 6), '#f1e3c6');
    const scone = (x, y) =>
      body(P(sc('M-15,10 L-15,-2 Q-15,-14 0,-14 Q15,-14 15,-2 L15,10 Q0,14 -15,10 Z', x, y, 1)), '#e3a54f', -4, -4, .2) +
      fill(P(sc('M-12,-8 Q-6,-15 2,-12 Q8,-16 12,-8 Q6,-6 0,-8 Q-6,-5 -12,-8 Z', x, y, 1)), '#ffd45c') +
      fill(EL(x - 4, y - 9, 3, 1.4), '#fff4a8') + fill(C(x + 6, y + 2, 1.4), K.leaf) + fill(C(x - 7, y + 4, 1.2), K.leaf);
    return s + scone(32, 66) + scone(68, 66) + scone(50, 46);
  },

  bagelmelt() {
    let s = ground(50, 88, 40, 5);
    const ring = (cx, cy, rx, ry, hx, hy) => ({ t: 'path', a: { d: ellipsePath(cx, cy, rx, ry) + ellipsePath(cx, cy - 2, hx, hy), 'fill-rule': 'evenodd' } });
    const bottom = ring(50, 72, 37, 15, 10, 4);
    s += fill(bottom, '#c97a30') + shade(bottom, -6, -8, .22);
    s += fill(P('M16,64 L84,64 L86,70 Q80,78 74,72 Q70,80 62,73 Q56,82 48,73 Q40,80 34,72 Q28,78 22,71 Q16,74 14,68 Z'), '#ffcf47');
    const top = ring(50, 50, 35, 15, 9, 4);
    s += fill(top, '#e29a45') + shade(top, -5, -6, .18);
    s += shine(P('M22,46 Q32,38 50,37 Q66,38 76,44 Q64,42 50,42 Q36,42 22,46 Z'), .35);
    for (const [x, y] of [[32, 43], [40, 39], [58, 38], [68, 42], [28, 52], [72, 52]]) s += fill(EL(x, y, 2, 1), K.cream);
    return s;
  },

  muffins() {
    let s = ground(50, 89, 40, 5);
    const muffin = (x, y, s1) => {
      const liner = P(sc('M-15,0 L15,0 L11,20 L-11,20 Z', x, y, s1));
      let m = fill(liner, K.tulip) + shade(liner, -4, 0, .2);
      for (let i = -3; i <= 3; i++) m += line(`M${x + i * 4 * s1},${y + 1} L${x + i * 3 * s1},${y + 19 * s1}`, '#c7354b', 1.2);
      const top = P(sc('M-18,2 Q-20,-16 0,-18 Q20,-16 18,2 Q0,6 -18,2 Z', x, y, s1));
      m += body(top, '#e8a64e', -4, -4, .2) + shine(EL(x - 6 * s1, y - 10 * s1, 5 * s1, 2.4 * s1, -20), .5);
      for (const [dx, dy] of [[-8, -6], [4, -11], [9, -3], [-2, -2]]) m += fill(C(x + dx * s1, y + dy * s1, 2 * s1), '#fffaf0');
      for (const [dx, dy] of [[-4, -9], [7, -8], [-10, -1]]) m += fill(R(x + dx * s1, y + dy * s1, 3 * s1, 1.2 * s1, .6), K.leaf);
      return m;
    };
    return s + muffin(64, 54, .9) + muffin(36, 62, 1);
  },

  kugel() {
    let s = ground(50, 88, 42, 5);
    const dish = R(10, 40, 80, 46, 12);
    s += body(dish, '#ffffff', -6, -6, .2);
    s += fill(R(16, 44, 68, 36, 8), '#f2c272');
    for (let i = 0; i < 5; i++) s += line(`M20,${50 + i * 6} Q30,${46 + i * 6} 40,${50 + i * 6} T60,${50 + i * 6} T80,${50 + i * 6}`, '#e0a84f', 2);
    for (const [x, y] of [[28, 50], [52, 56], [70, 48], [40, 70], [64, 70]]) s += fill(EL(x, y, 5, 3), '#c97f35', { opacity: .7 });
    const r = rng(5);
    for (let i = 0; i < 14; i++) s += fill(C(20 + r() * 60, 46 + r() * 30, .9), '#7a4b3a');
    s += fill(R(4, 52, 8, 10, 4), '#ffffff') + fill(R(88, 52, 8, 10, 4), '#ffffff');
    return s + shine(R(16, 44, 30, 3, 1.5), .4);
  },

  cheesebread() {
    let s = ground(50, 88, 40, 5);
    const loaf = P('M14,76 L14,56 Q14,30 50,30 Q86,30 86,56 L86,76 Q50,84 14,76 Z');
    s += body(loaf, '#d9913f', -7, -7, .22);
    for (const x of [32, 50, 68]) {
      s += fill(P(`M${x - 8},${40} L${x + 6},${36} L${x + 8},${46} L${x - 6},${50} Z`), '#f6d79a');
      s += fill(P(`M${x - 6},${46} Q${x - 4},${56} ${x - 1},${54} Q${x + 1},${60} ${x + 4},${50} L${x + 7},${44} Z`), '#ffcf47');
    }
    s += shine(EL(30, 38, 9, 3, -15), .4);
    return s;
  },

  maccheese() {
    let s = ground(50, 89, 38, 5);
    const bowl = P('M12,50 L88,50 Q86,86 50,88 Q14,86 12,50 Z');
    s += body(bowl, K.tulip, -8, -4, .2);
    s += fill(EL(50, 50, 38, 10), '#c7354b') + fill(EL(50, 50, 33, 8), '#ffd45c');
    const r = rng(8);
    for (let i = 0; i < 14; i++) {
      const x = 24 + r() * 52, y = 42 + r() * 12, a = r() * 6.28;
      s += line(`M${x},${y} q${(Math.cos(a) * 5).toFixed(1)},${(Math.sin(a) * 5 - 4).toFixed(1)} ${(Math.cos(a) * 9).toFixed(1)},${(Math.sin(a) * 4).toFixed(1)}`, '#f7b733', 3.6);
    }
    for (let i = 0; i < 10; i++) s += fill(C(26 + r() * 48, 44 + r() * 10, 1.2), '#c97f35');
    return s + fill(P('M18,62 L82,62 L81,66 L19,66 Z'), K.white, { opacity: .5 });
  },

  grilledcheese() {
    let s = ground(50, 88, 42, 5);
    s += fill(EL(50, 80, 42, 9), K.white) + fill(EL(50, 79, 34, 6), '#f1e3c6');
    const half = (pts, rot, cx, cy) => E('g', { transform: `rotate(${rot} ${cx} ${cy})` },
      fill(P(pts), '#b8692a') + fill(P(pts), '#e8a64e', { transform: 'translate(0 -5)' }) +
      fill(P(sc('M-14,2 L14,2 L12,7 Q8,11 6,6 Q2,12 -2,6 Q-6,11 -9,6 Z', cx, cy + 2, 1)), '#ffcf47'));
    s += half('M22,74 L22,46 L62,74 Z', -6, 38, 64) + half('M40,70 L78,44 L78,70 Z', 4, 62, 60);
    s += shine(EL(30, 50, 3, 7, 10), .3) + shine(EL(70, 52, 3, 7, -10), .3);
    return s;
  },

  spongecake() {
    let s = ground(50, 89, 42, 5);
    s += fill(EL(50, 82, 42, 9), K.white) + fill(EL(50, 81, 34, 6), '#f1e3c6');
    const side = P('M16,44 L16,74 A34,10 0 0,0 84,74 L84,44 Z');
    s += body(side, '#fbe3a2', -8, 0, .18);
    s += fill(EL(50, 44, 34, 10), '#e8b45c');
    s += fill(EL(50, 44, 30, 8), '#f2c46e');
    s += fill(EL(50, 44, 8, 3), '#d9a04a');
    const r = rng(4);
    for (let i = 0; i < 20; i++) s += fill(C(22 + r() * 56, 38 + r() * 12, 1), '#fff', { opacity: .9 });
    for (const [x, y] of [[26, 58], [40, 64], [60, 60], [74, 66], [50, 70]]) s += fill(C(x, y, 1.6), '#e8c47a');
    return s + shine(R(20, 48, 4, 20, 2), .35);
  },

  chococheesecake() {
    let s = ground(50, 89, 42, 5);
    s += fill(EL(50, 82, 41, 9), K.white) + fill(EL(50, 81, 33, 6), '#f1e3c6');
    const side = P('M20,50 L20,74 A30,9 0 0,0 80,74 L80,50 Z');
    s += body(side, '#8a5a40', -8, 0, .16);
    s += fill(P('M20,69 L20,74 A30,9 0 0,0 80,74 L80,69 A30,9 0 0,1 20,69 Z'), '#3d2318');
    s += fill(EL(50, 50, 30, 9), '#4a2a1c');
    for (const d of ['M28,53 Q27,62 31,62 Q34,62 33,55 Z', 'M46,57 Q45,65 49,65 Q52,65 51,57 Z', 'M66,55 Q66,61 69,61 Q72,61 71,53 Z'])
      s += fill(P(d), '#4a2a1c');
    for (const [x, y] of [[42, 45], [58, 44]]) {
      s += fill(P(sc('M0,-6 C6,-6 8,0 0,8 C-8,0 -6,-6 0,-6 Z', x, y, 1)), K.tulip);
      s += fill(EL(x, y - 6.5, 4, 1.6), K.leaf);
    }
    for (const [x, y] of [[32, 49], [66, 50], [50, 53]]) s += fill(EL(x, y, 3, 1, 20), '#fff4e0');
    return s + shine(EL(36, 48, 6, 1.6, -10), .3);
  },

  frenchtoast() {
    let s = ground(50, 89, 44, 5);
    s += fill(EL(50, 80, 44, 9.5), K.white) + fill(EL(50, 79, 36, 6.5), '#f1e3c6');
    const SLICE = 'M-20,18 L-20,-8 Q-24,-22 -10,-22 Q0,-30 10,-22 Q24,-22 20,-8 L20,18 Z';
    const slice = (x, y, rot) => E('g', { transform: `rotate(${rot} ${x} ${y})` },
      body(P(sc(SLICE, x, y, 1)), '#b8692a', -4, -4, .2) + fill(P(sc(SLICE, x, y + 1, .8)), '#f2c272') +
      fill(R(x - 20, y + 4, 40, 6, 2), '#fffaf0') +
      shine(EL(x - 6, y - 10, 6, 2.4, -10), .45));
    s += slice(36, 58, -14) + slice(64, 56, 12);
    const r = rng(3);
    for (let i = 0; i < 16; i++) s += fill(C(26 + r() * 50, 40 + r() * 30, 1.2), '#fff', { opacity: .9 });
    s += fill(C(72, 77, 4.2), K.eggplant) + fill(C(80, 74, 4.2), K.eggplant) + fill(C(71.5, 75.5, 1.1), '#fff', { opacity: .6 });
    s += fill(P(sc('M0,-6 C6,-6 8,0 0,8 C-8,0 -6,-6 0,-6 Z', 24, 76, 1)), K.tulip) + fill(EL(24, 69.5, 4, 1.5), K.leaf);
    return s;
  },
  // ================= Mexico City: corn =================
  corn() {
    let s = ground(50, 90, 22, 4);
    s += fill(P('M50,86 Q30,78 26,46 Q36,62 46,70 Z'), '#7aa83e') + fill(P('M50,86 Q70,78 74,46 Q64,62 54,70 Z'), '#8fb84a');
    const cob = EL(50, 46, 14, 34);
    s += body(cob, '#ffd23f', -5, -5, .2);
    for (let r = 0; r < 7; r++) for (let c = -1; c <= 1; c++) s += fill(EL(50 + c * 7.5, 20 + r * 8, 3.2, 3.4), '#f7b928');
    s += shine(EL(44, 34, 3, 12), .45);
    s += fill(P('M50,88 Q34,82 30,58 Q40,70 50,78 Z'), '#8fb84a', { opacity: .9 });
    return s;
  },
  masa() {
    let s = ground(50, 90, 34, 5);
    const bowl = P('M12,54 L88,54 Q86,86 50,88 Q14,86 12,54 Z');
    s += fill(P(blob(50, 46, 25, 17, 12, .06, 3)), '#f8e08e') + shine(EL(40, 40, 7, 3, -20), .6);
    s += body(bowl, '#c96a3a', -8, -4, .2) + fill(R(10, 51, 80, 7, 3.5), '#dd8350');
    s += line('M20,66 L80,66', '#fff3dc', 2.4, { 'stroke-dasharray': '4 4' });
    return s;
  },
  tortilla() {
    let s = ground(50, 86, 40, 5);
    s += fill(EL(50, 74, 42, 11), K.tulip) + line('M14,76 L86,76', '#fff', 2, { 'stroke-dasharray': '3 4', opacity: .7 });
    for (let i = 0; i < 4; i++) s += fill(EL(50, 66 - i * 6, 36, 10), i % 2 ? '#f2cd7c' : '#f6d892') + fill(EL(50, 64.5 - i * 6, 36, 9), i % 2 ? '#f6d892' : '#f9e2a6');
    for (const [x, y] of [[36, 46], [56, 44], [64, 49], [44, 50], [50, 45]]) s += fill(EL(x, y, 3, 1.6), '#c98a3a', { opacity: .7 });
    return s;
  },
  taco() {
    let s = ground(50, 86, 36, 5);
    s += fill(P('M18,72 Q50,6 82,72 Z'), '#f2b33e') + shade(P('M18,72 Q50,6 82,72 Z'), -6, -6, .18);
    s += fill(P(blob(50, 46, 26, 12, 12, .2, 4)), K.leaf) + fill(C(38, 42, 5), K.tomato) + fill(C(56, 38, 5), K.tomato) + fill(C(64, 46, 4), '#ffd45c') + fill(C(46, 36, 3.5), '#ffd45c');
    s += fill(P('M22,72 Q50,20 78,72 Q50,60 22,72 Z'), '#f6c45a');
    s += shine(P('M26,66 Q34,46 46,34 Q36,50 30,68 Z'), .4);
    return s;
  },
  tamales() {
    let s = ground(50, 88, 40, 5);
    const husk = (x, y, rot, open) => E('g', { transform: `rotate(${rot} ${x} ${y})` },
      body(P(sc('M-26,0 Q-20,-12 0,-13 Q20,-12 26,0 Q20,12 0,13 Q-20,12 -26,0 Z', x, y, 1)), '#d9b479', -4, -4, .2) +
      (open ? fill(EL(x + 2, y, 15, 8), '#f8e08e') + fill(EL(x + 2, y - 1, 8, 4), '#e2412f', { opacity: .8 }) : line(`M${x - 6},${y - 12} L${x - 6},${y + 12} M${x + 8},${y - 12} L${x + 8},${y + 12}`, '#a8692a', 2)) +
      line(`M${x - 26},${y} L${x - 32},${y - 4} M${x + 26},${y} L${x + 32},${y - 4}`, '#c9a060', 2.2));
    return s + husk(46, 66, -8, false) + husk(52, 44, 8, true);
  },
  tacoplatter() {
    let s = ground(50, 89, 44, 5);
    s += fill(EL(50, 74, 44, 14), K.teal) + fill(EL(50, 72, 38, 11), '#3fa3a8');
    const mini = (x, y) => fill(P(sc('M-14,10 Q0,-16 14,10 Z', x, y, 1)), '#f2b33e') + fill(EL(x, y + 2, 9, 4), K.leaf) + fill(C(x - 3, y, 2.4), K.tomato) + fill(C(x + 4, y + 1, 2), '#ffd45c');
    s += mini(30, 58) + mini(50, 52) + mini(70, 58);
    s += fill(P('M78,72 L90,66 L88,78 Z'), '#8fd14f') + fill(P('M10,70 L22,66 L20,78 Z'), '#8fd14f');
    return s;
  },

  // ================= Garden (Mexico City and Rome) =================
  sprout() {
    let s = ground(50, 88, 26, 4);
    s += fill(EL(50, 80, 26, 9), '#8a5a3c') + fill(EL(50, 78, 22, 6), '#a8734e');
    s += line('M50,78 Q49,60 50,48', '#5fa84a', 3.5);
    s += fill(P(leaf(50, 52, -150, 22, 9)), '#6cc052') + fill(P(leaf(50, 50, -30, 22, 9)), '#5fb34a');
    s += shine(EL(36, 44, 4, 2, -30), .5);
    return s;
  },
  tomatoveg() {
    const t = P(sc('M0,-26 C24,-30 40,-12 38,8 C36,30 18,40 0,40 C-18,40 -36,30 -38,8 C-40,-12 -24,-30 0,-26 Z', 50, 54, .9));
    return ground(50, 90, 30, 4) + body(t, K.tomato, -7, -7, .2) + shine(EL(32, 44, 8, 4.5, -40), .55) +
      fill(P(sc('M0,-24 L-14,-34 L-4,-24 L-16,-18 L-2,-20 L0,-10 L2,-20 L16,-18 L4,-24 L14,-34 Z', 50, 54, .9)), K.leaf);
  },
  pepper() {
    let s = ground(50, 90, 26, 4);
    const p = P('M50,28 C70,26 80,40 76,62 C72,82 60,88 50,84 C40,88 28,82 24,62 C20,40 30,26 50,28 Z');
    s += body(p, '#e2312f', -7, -6, .2) + line('M50,30 Q46,56 50,84', '#b8211f', 2, { opacity: .5 });
    s += fill(P('M42,30 Q50,22 58,30 Q50,34 42,30 Z'), '#3f9b3c') + line('M50,26 Q52,16 58,14', '#3f9b3c', 4);
    s += shine(EL(36, 44, 4, 10, 10), .5);
    return s;
  },
  eggplantveg() {
    const e = P(sc('M18,-28 C34,-20 38,4 22,26 C6,46 -30,44 -34,20 C-36,2 -18,-6 -2,-14 C6,-18 10,-30 18,-28 Z', 54, 52, 1));
    return ground(48, 92, 30, 4) + line('M73,27 L82,14', K.leaf, 5) + body(e, K.eggplant, -7, -7, .2) +
      shine(EL(30, 64, 4, 9, 35), .45) + fill(P(sc('M0,-14 Q8,-30 26,-26 Q18,-18 14,-8 Q8,-18 0,-14 Z', 54, 52, 1)), K.leaf);
  },
  vegbasket() {
    let s = ground(50, 90, 38, 5);
    s += fill(C(36, 46, 13), K.tomato) + shine(C(32, 42, 3), .5);
    s += fill(EL(62, 40, 9, 16, 30), K.eggplant) + fill(EL(68, 28, 6, 3, 30), K.leaf);
    s += fill(EL(50, 46, 9, 12), '#e2312f') + fill(R(48, 32, 4, 6, 2), K.leaf);
    const basket = P('M14,52 L86,52 L78,86 Q50,92 22,86 Z');
    s += body(basket, '#c98a4a', -6, -4, .2);
    for (const y of [62, 72, 82]) s += line(`M18,${y} L82,${y}`, '#a8692a', 2);
    s += fill(R(12, 48, 76, 7, 3.5), '#b5773a') + line('M24,52 Q50,14 76,52', '#b5773a', 3.5);
    return s;
  },
  marketcrate() {
    let s = ground(50, 91, 42, 5);
    s += fill(R(14, 18, 72, 10, 4), K.tulip) + [0, 1, 2, 3].map(i => fill(P(`M${14 + i * 18},28 L${32 + i * 18},28 L${23 + i * 18},36 Z`), i % 2 ? '#fff3dc' : K.tulip)).join('');
    s += line('M18,28 L18,50 M82,28 L82,50', '#7a4b3a', 2.4);
    s += fill(C(32, 50, 9), K.tomato) + fill(EL(50, 48, 7, 11, 25), K.eggplant) + fill(C(66, 50, 8), '#ffd23f') + fill(C(42, 54, 6), '#e2312f') + fill(C(58, 56, 6), '#8fd14f');
    const crate = R(14, 56, 72, 32, 4);
    s += body(crate, '#d39a5a', -6, -5, .2) + line('M18,68 L82,68 M18,78 L82,78', '#a8692a', 2.2);
    s += tulip(76, 50, .6, '#8b55a6') + line('M76,56 L76,62', K.leaf, 2);
    return s;
  },

  // ================= Rome: pasta =================
  egg() {
    const e = P('M50,18 C68,18 78,46 76,64 C74,82 62,90 50,90 C38,90 26,82 24,64 C22,46 32,18 50,18 Z');
    return ground(50, 92, 22, 4) + body(e, '#fff6e6', -7, -6, .2) + shine(EL(40, 40, 5, 10, 15), .7) + fill(C(60, 58, 2), '#e8d8b8') + fill(C(56, 70, 1.4), '#e8d8b8');
  },
  pastadough() {
    let s = ground(50, 88, 40, 5);
    s += fill(P('M10,70 L72,58 L90,74 L28,86 Z'), '#c98a4a') + fill(P('M10,70 L28,86 L28,90 L10,74 Z'), '#a8692a');
    s += body(P(blob(46, 60, 20, 13, 10, .06, 6)), '#ffd86b', -5, -5, .18) + shine(EL(40, 54, 6, 2.6, -15), .6);
    s += E('g', { transform: 'rotate(-18 72 52)' }, fill(R(56, 46, 34, 9, 4.5), '#e9c38f') + fill(R(50, 48, 8, 5, 2.5), '#c98a4a') + fill(R(88, 48, 8, 5, 2.5), '#c98a4a'));
    for (const [x, y] of [[24, 72], [60, 72], [70, 66]]) s += fill(C(x, y, 1.6), '#fff', { opacity: .8 });
    return s;
  },
  spaghetti() {
    let s = ground(50, 88, 36, 5);
    s += fill(EL(50, 66, 34, 18), '#f2c46e');
    for (let i = 0; i < 6; i++) s += E('ellipse', { cx: 50, cy: 64, rx: 30 - i * 4.5, ry: 15 - i * 2.2, fill: 'none', stroke: i % 2 ? '#e8b04a' : '#ffd86b', 'stroke-width': 3.2 });
    s += line('M26,58 Q50,46 74,58', '#fff', 1.6, { opacity: .6 });
    return s;
  },
  ravioli() {
    let s = ground(50, 88, 40, 5);
    s += fill(EL(50, 74, 42, 12), '#c98a4a') + fill(EL(50, 72, 38, 10), '#e0a96a');
    const rav = (x, y) => fill(R(x - 12, y - 12, 24, 24, 4), '#f6c45a') + E('rect', { x: x - 12, y: y - 12, width: 24, height: 24, rx: 4, fill: 'none', stroke: '#e0a03a', 'stroke-width': 2.4, 'stroke-dasharray': '2 2' }) + fill(EL(x, y, 7, 6), '#ffd86b') + shine(EL(x - 4, y - 5, 4, 1.6), .5);
    return s + rav(36, 56) + rav(64, 56) + rav(50, 38);
  },
  lasagna() {
    let s = ground(50, 89, 42, 5);
    const dish = R(10, 38, 80, 48, 10);
    s += body(dish, '#e8574a', -6, -6, .2);
    s += fill(R(16, 44, 68, 36, 6), '#f2c46e');
    for (const [y, c] of [[52, '#d6402f'], [60, '#fff1cf'], [68, '#d6402f']]) s += fill(R(16, y, 68, 5), c);
    s += fill(R(16, 44, 68, 7, 4), '#ffcf47') + fill(EL(34, 47, 6, 2.4), '#e8a02f') + fill(EL(60, 46, 7, 2.4), '#e8a02f');
    s += fill(P(leaf(70, 46, -40, 9, 3.5)), K.leaf);
    return s;
  },
  pastafeast() {
    let s = ground(50, 90, 44, 5);
    const bowl = P('M8,52 L92,52 Q90,88 50,90 Q10,88 8,52 Z');
    s += body(bowl, '#fffaf0', -8, -4, .2) + line('M14,64 L86,64', '#3f9b3c', 3) + line('M16,70 L84,70', '#e2412f', 3);
    s += fill(EL(50, 52, 42, 11), '#f2c46e');
    for (let i = 0; i < 5; i++) s += E('ellipse', { cx: 50, cy: 48, rx: 34 - i * 6, ry: 9 - i * 1.4, fill: 'none', stroke: i % 2 ? '#e8b04a' : '#ffd86b', 'stroke-width': 3 });
    s += fill(P(blob(50, 42, 18, 7, 10, .12, 2)), '#d6402f') + fill(P(leaf(46, 36, -40, 10, 4)), K.leaf) + fill(P(leaf(54, 36, -140, 10, 4)), K.leaf);
    return s;
  },

  // ================= Mexico City dishes =================
  elote() {
    let s = ground(48, 90, 22, 4);
    s += line('M50,90 L50,74', '#c98a4a', 4);
    s += E('g', { transform: 'rotate(-20 50 46)' }, body(EL(50, 44, 13, 32), '#ffd23f', -5, -5, .2) +
      [0, 1, 2, 3, 4, 5].map(r => fill(EL(50, 20 + r * 9, 11, 3.2), '#f7b928')).join('') +
      line('M38,24 Q50,30 62,22 M38,40 Q50,46 62,38 M38,56 Q50,62 62,54', '#fffaf0', 3) +
      [[44, 30], [56, 44], [46, 52], [54, 26]].map(([x, y]) => fill(C(x, y, 1.6), '#e2412f')).join(''));
    s += fill(P('M66,76 L84,68 L80,84 Z'), '#8fd14f');
    return s;
  },
  cornsalad() {
    let s = ground(50, 89, 38, 5);
    const bowl = P('M12,50 L88,50 Q86,86 50,88 Q14,86 12,50 Z');
    s += body(bowl, K.white, -8, -4, .2) + fill(EL(50, 50, 38, 10), '#fff3dc');
    const r = rng(3);
    for (let i = 0; i < 22; i++) s += fill(C(20 + r() * 60, 44 + r() * 12, 2.6), ['#ffd23f', '#ffd23f', '#e2312f', '#3a2a2a', '#5fb34a'][i % 5]);
    s += line('M20,64 L80,64', K.teal, 3);
    return s;
  },
  chipssalsa() {
    let s = ground(50, 89, 42, 5);
    for (const [x, y, rot] of [[22, 66, -20], [34, 74, 10], [72, 70, 25], [80, 60, -10], [28, 54, 40]])
      s += E('g', { transform: `rotate(${rot} ${x} ${y})` }, fill(P(sc('M0,-12 L12,9 L-12,9 Z', x, y, 1)), '#f2c46e') + fill(C(x - 2, y + 2, 1), '#c98a3a'));
    const bowl = P('M30,46 L70,46 Q68,74 50,76 Q32,74 30,46 Z');
    s += body(bowl, K.teal, -5, -3, .2) + fill(EL(50, 46, 20, 6), '#d6402f');
    for (const [x, y] of [[44, 45], [54, 44], [50, 47]]) s += fill(C(x, y, 1.8), '#5fb34a');
    return s;
  },
  quesadilla() {
    let s = ground(50, 88, 42, 5);
    s += fill(EL(50, 74, 42, 12), K.white) + fill(EL(50, 73, 34, 8), '#f1e3c6');
    const wedge = (x, y, rot) => E('g', { transform: `rotate(${rot} ${x} ${y})` },
      fill(P(sc('M0,12 L-18,-10 Q0,-20 18,-10 Z', x, y, 1)), '#f2c46e') +
      fill(P(sc('M-14,-8 Q0,-12 14,-8 L12,-4 Q8,2 4,-3 Q0,4 -4,-3 Q-8,2 -12,-4 Z', x, y, 1)), '#ffcf47') +
      [[-6, 0], [5, 2], [0, 8]].map(([dx, dy]) => fill(C(x + dx, y + dy, 1.6), '#c98a3a')).join(''));
    return s + wedge(36, 62, -30) + wedge(64, 62, 30) + wedge(50, 46, 180);
  },
  nachos() {
    let s = ground(50, 89, 42, 5);
    s += fill(EL(50, 76, 42, 11), K.tulip) + fill(EL(50, 75, 34, 7), '#f28b97');
    const r = rng(9);
    for (let i = 0; i < 9; i++) {
      const x = 24 + r() * 52, y = 46 + r() * 24, rot = r() * 360;
      s += E('g', { transform: `rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})` }, fill(P(sc('M0,-11 L11,8 L-11,8 Z', x, y, 1)), '#f2c46e'));
    }
    s += fill(P(blob(50, 54, 24, 12, 12, .25, 5)), '#ffcf47', { opacity: .95 });
    for (const [x, y] of [[40, 52], [58, 50], [50, 60]]) s += fill(C(x, y, 3.4), '#5fb34a') + fill(C(x, y, 1.4), '#fff3dc');
    s += fill(C(66, 58, 3), K.tomato);
    return s;
  },
  eggplanttacos() {
    let s = ground(50, 88, 42, 5);
    s += fill(EL(50, 76, 42, 10), K.white) + fill(EL(50, 75, 34, 7), '#f1e3c6');
    const t = x => fill(P(sc('M-20,16 Q0,-22 20,16 Z', x, 56, 1)), '#f2b33e') + fill(P(blob(x, 52, 14, 7, 10, .2, x)), K.leaf) +
      fill(EL(x - 5, 48, 5, 4), K.eggplant) + fill(EL(x + 5, 50, 5, 4), '#7a4a90') + fill(C(x, 44, 2.4), '#fff3dc') +
      fill(P(sc('M-17,16 Q0,-12 17,16 Q0,8 -17,16 Z', x, 56, 1)), '#f6c45a');
    return s + t(32) + t(68);
  },
  burritos() {
    let s = ground(50, 88, 42, 5);
    s += fill(EL(50, 76, 42, 10), K.white) + fill(EL(50, 75, 34, 7), '#f1e3c6');
    const b = (x, y, rot) => E('g', { transform: `rotate(${rot} ${x} ${y})` },
      body(R(x - 30, y - 11, 60, 22, 11), '#f6d892', -4, -4, .2) +
      fill(EL(x + 26, y, 6, 10), '#fff3dc') + fill(EL(x + 26, y, 4.5, 8), '#3a2a2a') + fill(C(x + 25, y - 3, 1.6), '#fffaf0') + fill(C(x + 27, y + 3, 1.6), '#e2312f') + fill(C(x + 24, y + 2, 1.4), '#5fb34a') +
      line(`M${x - 18},${y - 10} Q${x - 14},${y} ${x - 18},${y + 10}`, '#e0b56a', 2));
    return s + b(46, 62, -8) + b(50, 42, 6);
  },
  casserole() {
    let s = ground(50, 89, 44, 5);
    const dish = R(8, 34, 84, 52, 12);
    s += body(dish, K.teal, -6, -6, .2) + fill(R(4, 50, 8, 12, 4), K.teal) + fill(R(88, 50, 8, 12, 4), K.teal);
    s += fill(R(14, 40, 72, 40, 8), '#ffcf47');
    const r = rng(14);
    for (let i = 0; i < 18; i++) s += fill(C(18 + r() * 64, 44 + r() * 32, 2.6), ['#e2312f', '#5fb34a', '#3a2a2a', '#f2b33e'][i % 4]);
    s += fill(EL(36, 54, 8, 3), '#e8a02f', { opacity: .6 }) + fill(EL(64, 66, 8, 3), '#e8a02f', { opacity: .6 });
    return s;
  },

  // ================= Rome dishes =================
  pomodoro() {
    let s = ground(50, 89, 42, 5);
    s += fill(EL(50, 72, 42, 13), K.white) + fill(EL(50, 71, 34, 9), '#f1e3c6');
    for (let i = 0; i < 5; i++) s += E('ellipse', { cx: 50, cy: 62, rx: 26 - i * 4.5, ry: 11 - i * 1.8, fill: 'none', stroke: i % 2 ? '#e8b04a' : '#ffd86b', 'stroke-width': 3 });
    s += fill(P(blob(50, 58, 15, 7, 10, .14, 3)), '#d6402f') + shine(EL(46, 55, 4, 1.6), .5);
    s += fill(P(leaf(48, 52, -40, 11, 4)), K.leaf) + fill(P(leaf(52, 52, -140, 11, 4)), '#5fb34a');
    return s;
  },
  minestrone() {
    let s = ground(50, 89, 38, 5);
    const bowl = P('M12,50 L88,50 Q86,86 50,88 Q14,86 12,50 Z');
    s += body(bowl, '#fffaf0', -8, -4, .2) + line('M18,62 L82,62', K.tulip, 3);
    s += fill(EL(50, 50, 38, 10), '#e8742f') + fill(EL(50, 49, 33, 7.5), '#f08a3e');
    const r = rng(5);
    for (let i = 0; i < 14; i++) s += fill(i % 3 ? C(22 + r() * 56, 45 + r() * 9, 2.4) : R(22 + r() * 56, 45 + r() * 8, 5, 3, 1), ['#ffd86b', '#5fb34a', '#e2312f', '#f6e7c8'][i % 4]);
    s += E('path', { d: 'M40,36 C35,30 45,24 40,16 M58,36 C53,30 63,24 58,16', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .8 });
    return s;
  },
  ziti() {
    let s = ground(50, 89, 44, 5);
    const dish = R(8, 38, 84, 48, 12);
    s += body(dish, '#fffaf0', -6, -6, .2) + fill(R(4, 52, 8, 12, 4), '#fffaf0') + fill(R(88, 52, 8, 12, 4), '#fffaf0');
    s += fill(R(14, 44, 72, 36, 8), '#fbe6c2');
    const r = rng(21);
    for (let i = 0; i < 12; i++) {
      const x = 20 + r() * 58, y = 48 + r() * 26;
      s += E('g', { transform: `rotate(${(r() * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})` }, fill(R(x - 7, y - 2.6, 14, 5.2, 1), '#f2c46e') + fill(EL(x + 7, y, 1.2, 2.6), '#d9a04a'));
    }
    s += fill(EL(36, 54, 7, 3), '#e8a02f', { opacity: .5 }) + fill(EL(62, 68, 8, 3), '#e8a02f', { opacity: .5 }) + fill(P(leaf(66, 50, -30, 9, 3.4)), K.leaf);
    return s;
  },
  pizza() {
    let s = ground(50, 88, 42, 5);
    const crust = C(50, 54, 38);
    s += body(crust, '#e8a24a', -6, -6, .2) + fill(C(50, 54, 32), '#d6402f') + fill(P(blob(50, 54, 29, 29, 14, .06, 7)), '#ffd45c');
    for (const [x, y] of [[38, 44], [62, 48], [44, 66], [64, 64]]) s += fill(C(x, y, 5), '#3f9b3c') + fill(C(x - 2, y - 2, 3), '#5fb34a');
    for (const [x, y] of [[52, 40], [34, 58], [56, 58], [70, 54]]) s += fill(R(x - 4, y - 3.5, 8, 7, 1.5), '#ffe066') + fill(R(x - 2, y - 2, 4, 1.6, .8), '#fff4b8');
    s += shine(EL(32, 36, 8, 3, -40), .45);
    return s;
  },
  raviolisauce() {
    let s = ground(50, 89, 42, 5);
    s += fill(EL(50, 72, 42, 13), K.white) + fill(EL(50, 71, 34, 9), '#f1e3c6') + fill(P(blob(50, 66, 30, 11, 12, .1, 4)), '#d6402f');
    const rav = (x, y) => fill(R(x - 10, y - 9, 20, 18, 4), '#f6c45a') + E('rect', { x: x - 10, y: y - 9, width: 20, height: 18, rx: 4, fill: 'none', stroke: '#e0a03a', 'stroke-width': 2, 'stroke-dasharray': '2 2' });
    s += rav(36, 62) + rav(56, 64) + rav(46, 52) + fill(P(leaf(64, 52, -40, 10, 4)), K.leaf) + fill(C(40, 66, 1.6), '#fff');
    return s;
  },
  parmigiana() {
    let s = ground(50, 89, 42, 5);
    const dish = R(10, 38, 80, 48, 10);
    s += body(dish, '#c96a3a', -6, -6, .2) + fill(R(16, 44, 68, 36, 6), '#d6402f');
    for (const [x, y] of [[28, 56], [50, 54], [72, 56], [38, 70], [62, 70]]) s += fill(EL(x, y, 10, 7), '#7a4a90') + fill(EL(x, y, 7, 5), '#f5d07a');
    s += fill(P(blob(50, 60, 30, 14, 14, .25, 2)), '#fff3c8', { opacity: .7 });
    s += fill(P(leaf(44, 46, -40, 9, 3.5)), K.leaf) + fill(P(leaf(60, 46, -140, 9, 3.5)), K.leaf);
    return s;
  },
  lasagnadish() {
    let s = ground(50, 89, 42, 5);
    s += fill(EL(50, 78, 42, 10), K.white) + fill(EL(50, 77, 34, 7), '#f1e3c6');
    const slice = P('M22,44 L72,40 L78,72 L28,78 Z');
    s += fill(slice, '#f2c46e');
    for (const [y, c] of [[52, '#d6402f'], [59, '#fff1cf'], [66, '#d6402f']]) s += fill(P(`M24,${y} L74,${y - 4} L75,${y + 1} L25,${y + 5} Z`), c);
    s += fill(P('M22,44 L72,40 L74,46 L23,50 Z'), '#ffcf47') + fill(P('M72,40 L84,46 L88,76 L78,72 Z'), '#e8a24a');
    s += fill(P(leaf(48, 42, -40, 10, 4)), K.leaf) + fill(P(leaf(52, 42, -140, 9, 3.5)), '#5fb34a');
    return s;
  },
  familydinner() {
    let s = ground(50, 90, 46, 5);
    s += fill(EL(50, 74, 46, 14), K.tulip) + line('M8,74 Q50,92 92,74', '#fff', 2, { 'stroke-dasharray': '3 3', opacity: .7 });
    s += fill(P('M18,58 L50,58 Q49,76 34,77 Q19,76 18,58 Z'), '#fffaf0') + fill(EL(34, 58, 16, 5), '#f2c46e') + fill(P(blob(34, 56, 7, 3, 8, .1, 1)), '#d6402f');
    s += fill(P('M56,62 L84,62 L80,78 Q70,82 60,78 Z'), '#c98a4a') + fill(EL(64, 58, 7, 4, -20), '#e8a24a') + fill(EL(74, 57, 7, 4, 20), '#d9913f');
    s += fill(R(48, 34, 6, 22, 2), '#fffaf0') + fill(EL(51, 31, 2.6, 4.4), '#ffd34d') + fill(EL(51, 32, 1.2, 2.2), '#ff8a3d');
    s += tulip(84, 46, .55, K.tulip) + line('M84,52 L84,60', K.leaf, 2);
    return s;
  },
};

// ---------- starter blocks (producers) ----------
export const PRODUCER_ART = {
  crate() {
    let s = ground(50, 91, 40, 5);
    s += line('M30,46 L26,14', '#b98a36', 3);
    for (const y of [18, 25, 32]) s += fill(EL(24, y + 2, 3, 5.5, -25), '#efbb52') + fill(EL(30, y, 3, 5.5, 25), '#efbb52');
    s += E('g', { transform: 'rotate(20 50 34)' }, fill(R(44, 14, 11, 38, 5.5), '#de8f3a') +
      line('M46,24 L53,22 M46,32 L53,30 M46,40 L53,38', '#a8611e', 1.6));
    s += line('M68,46 L73,14', '#b98a36', 3);
    for (const y of [18, 25, 32]) s += fill(EL(70, y + 2, 3, 5.5, -25), '#efbb52') + fill(EL(76, y, 3, 5.5, 25), '#efbb52');
    const crate = R(14, 42, 72, 46, 5);
    s += body(crate, '#d39a5a', -7, -6, .22);
    s += line('M18,57 L82,57', '#a8692a', 2.4) + line('M18,72 L82,72', '#a8692a', 2.4);
    s += fill(R(14, 42, 9, 46, 4), '#b5773a') + fill(R(77, 42, 9, 46, 4), '#b5773a');
    s += fill(R(12, 39, 76, 7, 3.5), '#b5773a') + shine(R(16, 40, 30, 2.4, 1.2), .35);
    s += fill(R(36, 51, 28, 17, 4), K.cream) + tulip(50, 59.5, .6, K.tulip);
    return s;
  },

  // The wild card: drop it on any food and it becomes a copy.
  wild() {
    let s = ground(50, 93, 30, 4);
    s += E('g', { transform: 'rotate(-8 50 50)' },
      body(R(20, 8, 60, 82, 10), '#f6b62e', -6, -6, .2) + fill(R(26, 14, 48, 70, 7), K.white) +
      fill(P(sc('M0,-22 L6,-7 L22,-7 L9,3 L14,19 L0,9 L-14,19 L-9,3 L-22,-7 L-6,-7 Z', 50, 48, 1)), K.eggplant) +
      fill(P(sc('M0,-22 L6,-7 L22,-7 L9,3 L0,0 Z', 50, 48, 1)), '#7a4a90') +
      fill(C(32, 24, 3), K.tulip) + fill(C(68, 72, 3), K.teal) + fill(C(66, 24, 2.4), K.leaf) + fill(C(33, 72, 2.4), '#f6b62e'));
    return s;
  },

  cornbasket() {
    let s = ground(50, 91, 40, 5);
    for (const [x, rot] of [[34, -18], [50, 0], [66, 18]]) s += E('g', { transform: `rotate(${rot} ${x} 40)` },
      fill(EL(x, 30, 8, 18), '#ffd23f') + [0, 1, 2, 3].map(r => fill(EL(x, 18 + r * 7, 6, 2.4), '#f7b928')).join('') +
      fill(P(`M${x},50 Q${x - 12},40 ${x - 10},22 Q${x - 4},36 ${x},44 Z`), '#7aa83e'));
    const basket = P('M12,46 L88,46 L80,88 Q50,94 20,88 Z');
    s += body(basket, '#d9b479', -7, -5, .22);
    for (const y of [56, 66, 76]) s += line(`M16,${y} L84,${y}`, '#b58a4f', 2.2);
    for (let x = 22; x < 82; x += 10) s += line(`M${x},48 L${x + 2},86`, '#c9a060', 1.4);
    s += fill(R(10, 42, 80, 8, 4), '#b58a4f') + fill(R(36, 58, 28, 16, 4), K.cream) + tulip(50, 66, .55, K.tulip);
    return s;
  },
  gardenbox() {
    let s = ground(50, 91, 40, 5);
    s += line('M30,46 Q28,30 32,20', '#3f9b3c', 3) + fill(C(30, 30, 7), K.tomato) + fill(C(36, 20, 5.5), K.tomato) + fill(P(leaf(31, 38, -150, 14, 6)), '#5fb34a');
    s += line('M64,46 Q66,32 62,22', '#3f9b3c', 3) + fill(EL(66, 32, 6, 10, 20), K.eggplant) + fill(P(leaf(64, 40, -30, 14, 6)), '#5fb34a');
    s += fill(P(leaf(48, 46, -100, 16, 6)), '#6cc052') + fill(P(leaf(50, 46, -70, 14, 5)), '#5fb34a');
    const box = R(12, 44, 76, 44, 5);
    s += body(box, '#3fa3a8', -7, -6, .22) + line('M16,58 L84,58 M16,72 L84,72', '#2f8a8f', 2.4);
    s += fill(R(10, 40, 80, 8, 4), '#8a5a3c');
    s += fill(R(36, 56, 28, 16, 4), K.cream) + tulip(50, 64, .55, '#8b55a6');
    return s;
  },
  eggbasket() {
    let s = ground(50, 91, 40, 5);
    for (const [x, y] of [[34, 40], [50, 34], [66, 40], [42, 46], [58, 46]]) s += fill(EL(x, y, 9, 12), '#fff6e6') + shine(EL(x - 3, y - 4, 2.4, 4), .7);
    const basket = P('M12,48 L88,48 L80,88 Q50,94 20,88 Z');
    s += body(basket, '#c98a4a', -7, -5, .22);
    for (const y of [58, 68, 78]) s += line(`M16,${y} L84,${y}`, '#a8692a', 2.2);
    s += fill(R(10, 44, 80, 8, 4), '#a8692a') + line('M22,48 Q50,4 78,48', '#a8692a', 3.5);
    s += fill(R(36, 60, 28, 16, 4), K.cream) + fill(R(38, 66, 8, 4), '#3f9b3c') + fill(R(46, 66, 8, 4), '#fff') + fill(R(54, 66, 8, 4), '#e2412f');
    return s;
  },

  // A little retro fridge in pale blue, with a milk bottle on top.
  fridge() {
    let s = ground(50, 93, 32, 5);
    s += fill(R(56, 6, 14, 20, 4), '#ffffff') + fill(R(55, 3, 16, 5, 2), K.tulip);
    const box = R(20, 22, 60, 68, 12);
    s += body(box, '#bfe4ee', -8, -6, .22);
    s += fill(R(22, 47, 56, 3), '#8cc9d9');
    s += fill(R(66, 30, 5, 12, 2.5), '#6aa9bb') + fill(R(66, 56, 5, 18, 2.5), '#6aa9bb');
    s += fill(R(28, 58, 26, 18, 4), K.white) + fill(C(41, 67, 5.5), K.teal);
    s += fill(R(26, 88, 8, 5, 2), '#6aa9bb') + fill(R(66, 88, 8, 5, 2), '#6aa9bb');
    s += shine(R(25, 27, 5, 16, 2.5), .55) + shine(R(25, 54, 5, 26, 2.5), .45);
    return s;
  },
};

// ---------- the food friends ----------
const TOMATO = 'M0,-26 C24,-30 40,-12 38,8 C36,30 18,40 0,40 C-18,40 -36,30 -38,8 C-40,-12 -24,-30 0,-26 Z';
const TOMLEAF = 'M0,-24 L-14,-34 L-4,-24 L-16,-18 L-2,-20 L0,-10 L2,-20 L16,-18 L4,-24 L14,-34 Z';
const EGG = 'M18,-28 C34,-20 38,4 22,26 C6,46 -30,44 -34,20 C-36,2 -18,-6 -2,-14 C6,-18 10,-30 18,-28 Z';
const EGGCAP = 'M0,-14 Q8,-30 26,-26 Q18,-18 14,-8 Q8,-18 0,-14 Z';

export const CUSTOMER_ART = {
  tomato() {
    const t = P(sc(TOMATO, 50, 54, 1));
    return body(t, K.tomato, -7, -7, .18) + shine(EL(28, 46, 8, 4.5, -40), .5) +
      fill(P(sc(TOMLEAF, 50, 54, 1)), K.leaf) + face(40, 60, 60);
  },
  eggplant() {
    const e = P(sc(EGG, 54, 52, 1));
    return line('M73,27 L82,14', K.leaf, 5) + body(e, K.eggplant, -7, -7, .2) +
      shine(EL(30, 64, 4, 9, 35), .4) + fill(P(sc(EGGCAP, 54, 52, 1)), K.leaf) +
      face(36, 54, 64, { whites: true, r: 2.8, mouth: K.cream, mouthDrop: 10 });
  },
  lemon() {
    const b = EL(50, 58, 34, 27);
    return fill(EL(16, 58, 6, 4.5), '#ffd84a') + fill(EL(84, 58, 6, 4.5), '#ffd84a') +
      body(b, '#ffd84a', -7, -7, .16) + shine(EL(35, 45, 9, 4, -20), .55) +
      fill(P(leaf(53, 33, -60, 18, 7)), K.leaf) + face(41, 59, 57);
  },
  mushroom() {
    const stem = P('M36,52 L64,52 Q68,92 50,92 Q32,92 36,52 Z');
    const cap = P('M10,58 Q10,16 50,16 Q90,16 90,58 Q50,65 10,58 Z');
    return body(stem, K.cream, -6, -4, .18) + body(cap, '#e2412f', -7, -7, .18) +
      fill(C(30, 38, 6.5), K.white) + fill(C(55, 28, 7.5), K.white) + fill(C(73, 44, 5), K.white) + fill(C(46, 47, 3.5), K.white) +
      face(44, 56, 69, { r: 2.8, mouthDrop: 8 });
  },

  // ----- VIPs (see data/vips.js) -----
  zip() { // a hot pepper in a delivery helmet, zooming left
    const pep = P('M20,46 C18,30 36,24 50,30 C66,38 76,56 82,74 C86,86 80,93 73,86 C64,75 52,68 38,66 C26,63 21,56 20,46 Z');
    let s = line('M70,30 L90,30', '#f2a03d', 4) + line('M78,44 L94,44', '#f2a03d', 4) + line('M86,58 L96,58', '#f2a03d', 4);
    s += body(pep, K.tomato, -7, -7, .2) + shine(EL(64, 52, 3, 9, -40), .5);
    const helmet = P('M12,42 Q10,14 38,13 Q62,13 64,36 Q40,30 12,42 Z');
    s += body(helmet, K.teal, -6, -5, .22) + line('M22,24 Q36,15 52,20', '#fff', 4, { opacity: .85 });
    s += fill(R(8, 38, 26, 7, 3.5), '#26585b') + shine(EL(28, 20, 5, 2.5, -20), .5);
    return s + face(30, 46, 51, { r: 3.2, mouthDrop: 8 });
  },
  penny() { // a pea pod with a question on her mind
    let s = line('M12,58 Q2,50 6,40', K.leaf, 4);
    s += body(P('M10,58 C20,28 80,28 90,58 C80,86 20,86 10,58 Z'), '#4f9a3a', -7, -7, .2);
    s += fill(P('M18,52 C30,36 70,36 82,52 C70,60 30,60 18,52 Z'), '#cdeaa8');
    for (const x of [33, 50, 67]) s += body(C(x, 49, 8.5), '#8fd05a', -4, -4, .2) + shine(C(x - 3, 46, 2.2), .6);
    s += face(42, 58, 66, { r: 3, mouthDrop: 7, mouth: K.cream });
    s += fill(C(58, 32, 2.2), '#fff') + fill(C(62, 27, 3), '#fff') + fill(C(70, 19, 9), '#fff');
    return s + E('text', { x: 70, y: 24, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 14, fill: K.eggplant }, '?');
  },
  critic() { // a croissant in a beret, with a monocle and a fancy moustache
    const c = P('M8,72 Q8,40 30,30 Q50,20 70,30 Q92,40 92,72 Q84,64 76,67 Q72,58 64,60 Q56,54 50,56 Q44,54 36,60 Q28,58 24,67 Q16,64 8,72 Z');
    let s = body(c, '#d4852c', -7, -7, .22);
    s += line('M30,31 Q34,46 36,60', '#9c5a1c', 2.6) + line('M70,31 Q66,46 64,60', '#9c5a1c', 2.6) + line('M17,46 Q22,56 24,66', '#9c5a1c', 2.2) + line('M83,46 Q78,56 76,66', '#9c5a1c', 2.2);
    s += shine(EL(30, 40, 7, 3, -25), .5);
    s += body(EL(54, 24, 24, 8, -8), K.eggplant, -5, -4, .25) + fill(C(56, 15, 3.5), K.eggplant);
    s += face(42, 58, 42, { r: 3, mouthDrop: 10 });
    s += line('M50,49 Q44,46 40,50 Q38,47 41,45 M50,49 Q56,46 60,50 Q62,47 59,45', '#6b3a1f', 2.4);
    s += E('circle', { cx: 58, cy: 42, r: 6.5, fill: '#fff', 'fill-opacity': .25, stroke: K.gold, 'stroke-width': 2 });
    return s + line('M64,45 Q72,54 68,64', K.gold, 1.3);
  },
  bubbie() { // a round challah in a polka dot kerchief and round glasses
    const loaf = P('M12,76 Q10,30 50,28 Q90,30 88,76 Q50,84 12,76 Z');
    let s = body(loaf, '#d98a3a', -7, -7, .2);
    s += line('M22,72 Q30,60 26,48 M78,72 Q70,60 74,48 M38,78 Q46,70 42,62 M62,78 Q54,70 58,62', '#b56a24', 2.2);
    for (const [x, y, r] of [[30, 64, -30], [70, 66, 30], [50, 74, 0], [20, 58, -50]]) s += fill(EL(x, y, 1.3, 2.4, r), K.cream);
    const scarf = P('M14,50 Q12,22 50,20 Q88,22 86,50 Q50,38 14,50 Z');
    s += body(scarf, K.tulip, -5, -5, .2);
    for (const [x, y] of [[30, 32], [46, 26], [62, 28], [74, 38], [38, 40], [56, 36]]) s += fill(C(x, y, 2.4), '#fff', { opacity: .9 });
    s += fill(EL(90, 50, 6, 4, 30), K.tulip) + fill(EL(88, 58, 4, 6, -20), K.tulip);
    s += face(40, 60, 56, { r: 2.6, mouthDrop: 9 });
    for (const x of [40, 60]) s += E('circle', { cx: x, cy: 56, r: 7, fill: '#fff', 'fill-opacity': .25, stroke: K.ink, 'stroke-width': 1.8 });
    return s + line('M47,55 Q50,53 53,55', K.ink, 1.8);
  },
  party() { // a pineapple in a party hat, with confetti
    let s = '';
    for (const [x, y, c, r] of [[12, 30, K.tulip, 20], [86, 52, K.teal, -30], [14, 70, K.gold, 40], [88, 80, K.eggplant, 10], [24, 14, K.teal, -10]]) {
      s += fill(R(x - 3, y - 1.5, 6, 3, 1), c, { transform: `rotate(${r} ${x} ${y})` });
    }
    s += fill(P(leaf(46, 36, -100, 22, 6)), K.leaf) + fill(P(leaf(46, 36, -135, 20, 6)), '#58b347') + fill(P(leaf(46, 36, -70, 18, 6)), '#58b347');
    const fruit = EL(50, 64, 26, 28);
    s += body(fruit, '#f6b62e', -7, -7, .2);
    for (const [x, y] of [[36, 46], [50, 42], [64, 46], [30, 60], [70, 60], [36, 80], [50, 86], [64, 80]]) s += line(`M${x - 3},${y} L${x},${y + 3} L${x + 3},${y}`, '#c98612', 1.8);
    s += shine(EL(36, 52, 4, 7, 25), .4);
    s += fill(P('M52,40 L64,15 L76,38 Q64,44 52,40 Z'), K.eggplant);
    s += line('M56,33 L72,34 M60,24 L69,25', K.gold, 3);
    s += fill(C(64, 15, 4.5), K.tulip);
    return s + face(41, 59, 62, { r: 3.2 });
  },
};

// ---------- badges: a food friend under a silver lid, rated in golden spoons ----------
// A smaller face than face() above, for the little badge friends: everything scales with r.
function tinyFace(x1, x2, y, r = 2, eye = K.ink) {
  const mx = (x1 + x2) / 2, my = y + r * 2.3;
  return fill(C(x1 - r * 1.5, y + r * 2, r * 1.45), K.blush, { opacity: .6 }) + fill(C(x2 + r * 1.5, y + r * 2, r * 1.45), K.blush, { opacity: .6 }) +
    fill(C(x1, y, r), eye) + fill(C(x2, y, r), eye) +
    fill(C(x1 + r * .35, y - r * .4, r * .36), '#fff') + fill(C(x2 + r * .35, y - r * .4, r * .36), '#fff') +
    line(`M${mx - r * 1.5},${my} Q${mx},${my + r * 1.5} ${mx + r * 1.5},${my}`, eye, r * .65);
}
// One friend per badge, drawn around 0,0 and about 46 wide. Keyed by the badge ids in data/badges.js.
const BADGE_FRIENDS = {
  chef() { // Mixing Whiz: a bowl with a whisk
    let s = line('M15,-27 L7,-9', '#7a4a22', 3.4);
    s += E('ellipse', { cx: 4, cy: -6, rx: 4.5, ry: 9, fill: 'none', stroke: '#b9c2cc', 'stroke-width': 1.6, transform: 'rotate(22 4 -6)' });
    s += E('ellipse', { cx: 4, cy: -6, rx: 1.8, ry: 9, fill: 'none', stroke: '#b9c2cc', 'stroke-width': 1.6, transform: 'rotate(22 4 -6)' });
    s += fill(EL(0, -3, 21, 4.5), '#fff1cf');
    s += body(P('M-22,-3 Q-20,20 0,20 Q20,20 22,-3 Q0,4 -22,-3 Z'), K.teal, -6, -5, .2);
    return s + shine(EL(-13, 4, 2.4, 5, 20), .45) + tinyFace(-6, 6, 6, 2, K.cream);
  },
  merger() { // Combo Cook: a pair of cherries
    let s = line('M-10,-1 Q-8,-14 1,-21', K.leaf, 2.2) + line('M11,-3 Q9,-14 1,-21', K.leaf, 2.2);
    s += fill(P(leaf(1, -21, -25, 15, 5)), K.leaf);
    s += body(C(-10, 8, 11), '#d7263d', -5, -5, .2) + body(C(11, 6, 11), '#e23b4c', -5, -5, .2);
    s += shine(EL(-15, 3, 2.2, 3.5, -30), .55) + shine(EL(6, 1, 2.2, 3.5, -30), .55);
    return s + tinyFace(-13.5, -6.5, 7, 1.6) + tinyFace(7.5, 14.5, 5, 1.6);
  },
  collector() { // Recipe Keeper: a cookbook with a tulip
    let s = fill(R(-15, -19, 35, 40, 4), '#efe2c6');
    s += body(R(-19, -21, 34, 42, 5), K.eggplant, -5, -5, .22);
    s += fill(R(-13, -15, 22, 15, 3), K.cream) + fill(P(sc(TULIP, -2, -7.5, .6)), K.tulip);
    return s + fill(R(-19, -21, 5, 42, 2), '#47215a') + tinyFace(-7, 5, 7, 2, K.cream);
  },
  tycoon() { // Tip Jar: a jar of coins
    let s = fill(R(-14, -23, 28, 7, 3), '#b5773a');
    const glass = P('M-14,-16 L14,-16 Q19,-13 19,-5 L19,15 Q19,21 13,21 L-13,21 Q-19,21 -19,15 L-19,-5 Q-19,-13 -14,-16 Z');
    s += fill(glass, '#cfe8ec');
    for (const [x, y] of [[-10, 15], [2, 16], [12, 13], [-4, 9], [8, 6]]) s += fill(C(x + .8, y + .8, 5.5), K.goldDark) + fill(C(x, y, 5.5), K.gold);
    return s + shade(glass, -6, -5, .14) + shine(R(-15, -12, 3, 22, 1.5), .55) + tinyFace(-6, 6, -6, 2);
  },
  traveller() { // Food Explorer: a suitcase with stickers
    let s = line('M-7,-14 L-7,-21 L7,-21 L7,-14', '#7a4a22', 3);
    s += body(R(-22, -15, 44, 34, 6), '#e98a2f', -6, -5, .18);
    s += fill(R(-14, -15, 4, 34), '#c46d1c') + fill(R(10, -15, 4, 34), '#c46d1c');
    return s + fill(C(-17, 12, 3.5), K.tulip) + fill(R(15, -11, 6, 5, 1), K.cream) + tinyFace(-4, 4, 0, 1.8);
  },
  arcade() { // Fun Fair: an ice cream cone
    let s = fill(P('M-12,1 L12,1 L0,25 Z'), '#e0a95a');
    s += line('M-7,2 L3,19 M0,2 L6,13 M7,2 L-3,19 M0,2 L-6,13', '#c48a3a', 1.2);
    s += body(P('M-15,1 Q-17,-21 0,-21 Q17,-21 15,1 Q11,5 8,1 Q4,6 0,2 Q-4,6 -8,1 Q-11,5 -15,1 Z'), '#f7a8c4', -6, -5, .18);
    s += line('M1,-21 Q3,-27 7,-28', K.leaf, 1.6) + fill(C(1, -22, 4.2), '#d7263d') + shine(C(0, -23.5, 1.2), .7);
    return s + shine(EL(-8, -13, 2, 3.5, -20), .5) + tinyFace(-5, 5, -9, 1.9);
  },
  scholar() { // Smart Cookie: a cookie in glasses
    let s = body(C(0, 0, 21), '#d9a05b', -6, -6, .2);
    for (const [x, y, r] of [[-12, -10, 2.4], [11, -11, 2], [-14, 6, 2.2], [13, 8, 2.6], [2, 15, 2.2], [-4, -15, 1.6]]) s += fill(C(x, y, r), '#6b3a1f');
    for (const x of [-7, 7]) s += E('circle', { cx: x, cy: -2, r: 5.6, fill: '#fff', 'fill-opacity': .35, stroke: K.ink, 'stroke-width': 1.6 });
    return s + line('M-1.4,-2 Q0,-3.4 1.4,-2', K.ink, 1.6) + tinyFace(-7, 7, -2, 2);
  },
  vip() { // VIP Host: a jam thumbprint cookie wearing a crown
    let s = body(C(0, 6, 18), '#e2b26a', -6, -6, .2) + fill(C(0, 14, 5), '#d7263d') + shine(C(-1.5, 12.5, 1.5), .6);
    s += fill(P('M-13,-9 L-14,-25 L-6,-17 L0,-28 L6,-17 L14,-25 L13,-9 Z'), K.gold) + fill(R(-13, -11, 26, 4, 1.5), K.goldDark);
    s += fill(C(0, -19, 2.2), K.tulip) + fill(C(-8, -15, 1.6), K.teal) + fill(C(8, -15, 1.6), K.teal);
    return s + tinyFace(-6, 6, 2, 2);
  },
};

// tier 0: a closed lid with a "?". Tiers 1 to 3: the lid lifted off the friend, with that many golden spoons.
// The plate rim also changes: cream, then teal, then gold.
// The lid's lifted position lives in the CSS (.bdg-lid), so the "badge earned" card can animate it opening.
export function badgeSvg(family, tier) {
  const rim = ['#d9d0c4', '#e3d6c2', K.teal, K.gold][tier];
  let s = fill(EL(50, 80, 42, 10), rim) + fill(EL(50, 79, 33, 7), tier ? K.white : '#ece6dc');
  if (tier) s += E('g', { transform: 'translate(50 56) scale(.95)' }, (BADGE_FRIENDS[family] || BADGE_FRIENDS.chef)());
  const lid = body(P('M14,78 Q14,30 50,30 Q86,30 86,78 Z'), tier ? '#dde2e8' : '#cfd2d6', -9, -7, .2) +
    fill(R(10, 75, 80, 6, 3), tier ? '#c3c9d1' : '#babec4') + fill(C(50, 27, 5.5), tier ? '#c3c9d1' : '#b6bac0') +
    shine(P('M24,64 Q24,44 40,38 L42,42 Q30,48 30,64 Z'), .7);
  if (!tier) return `<svg viewBox="0 0 100 100" aria-hidden="true">${s + lid}<text x="50" y="66" text-anchor="middle" font-family="Righteous, sans-serif" font-size="20" fill="#9ea3aa">?</text></svg>`;
  s += E('g', { class: 'bdg-lid' }, lid);
  for (let i = 0; i < 3; i++) {
    const x = 35 + i * 17, on = i < tier;
    s += E('g', { class: on ? 'bdg-spoon' : '', style: `--i:${i}` },
      E('ellipse', { cx: x - 5, cy: 95, rx: 4.4, ry: 3.1, fill: on ? K.gold : 'none', stroke: on ? K.goldDark : '#cbbfae', 'stroke-width': on ? .8 : 1.2 }) +
      line(`M${x - .5},95 L${x + 8},95`, on ? K.gold : '#cbbfae', 2));
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${s}</svg>`;
}

// ---------- Elayna's restaurant, which changes as it is upgraded ----------
// opts.paint / opts.awning: the colours she picked. opts.colour: 0 to 1, how much colour the
// original building has (it fills in as she upgrades). opts.focus: an upgrade to outline in purple.
export function restaurantSvg(has, opts = {}) {
  const wallColour = has.has('paint') ? (opts.paint || '#ffd9b8') : (opts.baseWall || '#f3ead8');
  const signText = opts.sign || "Elayna's";
  const signW = Math.max(128, signText.length * 11.5 + 24), signX = 200 - signW / 2;
  const awn = opts.awning || K.eggplant;
  const grey = Math.max(0, 1 - (opts.colour ?? 1));
  const glow = 'filter:drop-shadow(0 0 1.5px #5b2c6f) drop-shadow(0 0 1.5px #5b2c6f) drop-shadow(0 0 6px #b57fd0)';
  const part = (id, inner) => {
    if (!inner) return '';
    if (id === 'base') return grey ? `<g style="filter:grayscale(${grey.toFixed(2)})">${inner}</g>` : inner;
    return opts.focus === id ? `<g style="${glow}">${inner}</g>` : `<g>${inner}</g>`;
  };
  const when = (id, fn) => has.has(id) ? part(id, fn()) : '';
  const lit = has.has('oven');
  let s = part('base', fill(C(336, 34, 26), '#f7c873'));
  s += when('oven', () => fill(R(298, 14, 22, 34, 3), '#c9372a') + fill(R(296, 12, 26, 6, 2), '#a92b1d') +
    fill(C(306, 6, 6), '#fff', { opacity: .75 }) + fill(C(316, 0, 5), '#fff', { opacity: .6 }));
  s += when('rooftop', () => {
    let r = '';
    for (const [x0, x1] of [[66, 130], [270, 292]]) {
      r += fill(R(x0, 34, x1 - x0, 10, 3), '#b5773a');
      for (let x = x0 + 6; x < x1 - 2; x += 10) r += fill(C(x, 32, 6), x % 20 < 10 ? K.leaf : '#5fb35a');
      for (let x = x0 + 10; x < x1 - 4; x += 20) r += line(`M${x},34 L${x},24`, K.leaf, 1.6) + tulip(x, 21, .45, K.tulip);
    }
    return r;
  });
  s += part('base', fill(R(-10, 184, 420, 40), '#e3c79a'));
  s += has.has('paint') ? part('paint', body(R(70, 56, 260, 130), wallColour, -16, 0, .14) + fill(R(70, 176, 260, 10), '#000', { opacity: .08 }))
    : part('base', body(R(70, 56, 260, 130), wallColour, -16, 0, .14));
  s += part('base', fill(R(58, 44, 284, 20, 4), K.eggplant));
  s += when('bunting', () => {
    let b = line('M60,48 Q130,60 200,50 Q270,60 340,48', K.ink, 1.2);
    for (let i = 0; i < 14; i++) {
      const x = 66 + i * 20, y = 50 + Math.sin((i / 13) * Math.PI) * 6;
      b += fill(P(`M${x - 6},${y} L${x + 6},${y} L${x},${y + 11} Z`), i % 2 ? '#fff3dc' : K.tulip);
    }
    return b;
  });
  // A local touch: paper flags in Mexico City, vines in Rome.
  if (opts.flair === 'papel') {
    let f = line('M58,42 Q130,52 200,44 Q270,52 342,42', K.ink, 1);
    const cols = ['#e8475f', '#2f8a8f', '#f6b62e', '#8b55a6', '#5fb34a'];
    for (let i = 0; i < 15; i++) {
      const x = 62 + i * 19.5, y = 44 + Math.sin((i / 14) * Math.PI) * 6;
      f += fill(P(`M${x - 7},${y} L${x + 7},${y} L${x + 7},${y + 12} Q${x + 3.5},${y + 9} ${x},${y + 12} Q${x - 3.5},${y + 9} ${x - 7},${y + 12} Z`), cols[i % cols.length]);
    }
    s += part('base', f);
  }
  if (opts.flair === 'vines') {
    let v = '';
    for (let x = 64; x <= 336; x += 14) v += fill(P(leaf(x, 64, 90 + ((x / 14) % 2 ? 30 : -30), 9, 4)), (x / 14) % 2 ? '#3f9b3c' : '#5fb34a');
    for (const x of [72, 328]) for (let y = 70; y < 180; y += 12) v += fill(P(leaf(x, y, x < 200 ? 20 : 160, 8, 3.5)), '#5fb34a');
    s += part('base', line('M60,64 Q200,74 340,64', '#2f6e25', 1.6) + v);
  }
  s += part('base', fill(R(signX, 8, signW, 40, 10), K.eggplant) +
    E('text', { x: 200, y: 36, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': signText.length > 10 ? 19 : 23, fill: '#fff3dc' }, signText));
  s += when('awning', () => {
    let a = '';
    for (let i = 0; i < 10; i++) {
      const x = 80 + i * 24;
      a += fill(P(`M${x},70 L${x + 24},70 L${x + 24},94 Q${x + 12},108 ${x},94 Z`), i % 2 ? '#fff3dc' : awn);
    }
    return a + fill(R(76, 66, 248, 8, 3), awn) + fill(R(70, 100, 260, 7), K.shadow, { opacity: .14 });
  });
  for (const x of [92, 252]) {
    let w = fill(R(x, 112, 76, 56, 4), lit ? '#ffd77a' : '#bfe0e6');
    if (lit) w += fill(R(x + 8, 118, 60, 44, 3), '#fff2b8', { opacity: .75 });
    if (lit && !(x === 92 && has.has('display'))) {
      for (const px of [x + 22, x + 54]) {
        w += fill(P(`M${px - 9},168 Q${px - 9},148 ${px},148 Q${px + 9},148 ${px + 9},168 Z`), K.eggplant, { opacity: .28 });
        w += fill(C(px, 140, 6.5), K.eggplant, { opacity: .28 });
      }
    }
    s += part('base', w);
    if (x === 92) s += when('display', () => fill(R(x + 6, 158, 64, 4, 1), '#b5773a') +
      fill(R(x + 12, 146, 18, 12, 2), '#fff1cf') + fill(R(x + 12, 144, 18, 4, 2), '#d7263d') +
      fill(EL(x + 40, 152, 9, 6), '#e29a45') + fill(EL(x + 40, 149, 7, 3), '#5a3324') +
      fill(R(x + 52, 148, 12, 10, 2), '#f9d6e2') + fill(C(x + 58, 146, 3), K.tulip));
    if (x === 252) s += when('neon', () => fill(R(x + 12, 118, 52, 18, 9), '#3d2a44') +
      E('text', { x: x + 38, y: 132, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 13, fill: '#ff8fb0' }, 'OPEN'));
    s += part('base', shine(P(`M${x + 8},164 L${x + 30},116 L${x + 40},116 L${x + 18},164 Z`), .4) +
      line(`M${x + 38},113 L${x + 38},167 M${x + 1},140 L${x + 75},140`, '#fff3dc', 3));
    if (has.has('tulips')) {
      s += part('tulips', fill(R(x - 4, 166, 84, 14, 3), K.teal) + [0, 1, 2, 3, 4].map(j => {
        const tx = x + 8 + j * 15;
        return line(`M${tx},162 L${tx},170`, K.leaf, 2.2) + tulip(tx, 155, .72, j % 2 ? '#8b55a6' : K.tulip);
      }).join(''));
    } else {
      s += part('base', fill(R(x - 4, 166, 84, 5, 2), '#e3c79a'));
    }
  }
  s += part('base', fill(P('M182,186 L182,128 Q182,114 200,114 Q218,114 218,128 L218,186 Z'), K.teal) +
    fill(C(200, 131, 7), lit ? '#fff2b8' : '#bfe0e6') + fill(C(211, 156, 2.6), K.gold));
  s += when('trees', () => fill(R(178, 184, 44, 6, 2), K.tulip) + [174, 226].map(tx =>
    fill(P(`M${tx - 7},172 L${tx + 7},172 L${tx + 5},186 L${tx - 5},186 Z`), '#c9772b') +
    line(`M${tx},172 L${tx},160`, '#7a4b3a', 2) + fill(C(tx, 154, 9), K.leaf) + fill(C(tx - 3, 151, 3), '#7cc46e')).join(''));
  s += when('lights', () => {
    let wire = 'M74,104';
    for (let i = 0; i < 8; i++) wire += ` Q${80 + i * 32},112 ${106 + i * 32},104`;
    let l = line(wire, K.ink, 1.2);
    for (let i = 0; i < 8; i++) l += fill(C(90 + i * 32, 109, 6), '#ffd34d', { opacity: .35 }) + fill(C(90 + i * 32, 109, 2.8), '#ffd34d');
    return l;
  });
  s += when('bench', () => fill(R(8, 160, 52, 6, 2), '#b5773a') + fill(R(8, 170, 52, 5, 2), '#c98a4a') +
    fill(R(12, 175, 4, 10), '#7a4b3a') + fill(R(52, 175, 4, 10), '#7a4b3a'));
  const decor = new Set(opts.decor || []);
  const deco = (id, fn) => decor.has(id) ? part(`decor-${id}`, fn()) : '';
  s += deco('hanging', () => [62, 338].map(x => line(`M${x},64 L${x},80`, K.ink, 1.2) +
    fill(EL(x, 84, 10, 6), '#b5773a') + fill(C(x - 5, 79, 4), K.leaf) + fill(C(x + 5, 79, 4), K.leaf) +
    tulip(x - 4, 76, .4, K.tulip) + tulip(x + 4, 75, .4, '#8b55a6') + fill(P(`M${x - 8},86 Q${x - 10},94 ${x - 6},96`), 'none', { stroke: K.leaf, 'stroke-width': 1.6 })).join(''));
  s += deco('cat', () => fill(EL(306, 163, 9, 6), '#e29a45') + fill(C(300, 153, 6), '#e29a45') +
    fill(P('M295,150 L296,143 L300,148 Z'), '#e29a45') + fill(P('M305,150 L304,143 L300,148 Z'), '#e29a45') +
    line('M314,165 Q322,160 318,152', '#e29a45', 2.6) + fill(C(298, 153, .9), K.ink) + fill(C(302, 153, .9), K.ink));
  s += deco('bike', () => line('M110,179 L126,166 L148,166 L150,179 M126,166 L132,179 L110,179 M148,166 L144,158 M120,160 L128,160', K.teal, 2.4) +
    [110, 150].map(x => E('circle', { cx: x, cy: 179, r: 9, fill: 'none', stroke: K.ink, 'stroke-width': 2 })).join('') +
    fill(R(146, 150, 14, 9, 2), '#b5773a') + tulip(150, 146, .4, K.tulip) + tulip(156, 147, .4, '#8b55a6'));
  s += when('patio', () => line('M366,118 L366,184', K.ink, 2.4) +
    [0, 1, 2, 3].map(i => fill(P(`M366,100 L${338 + i * 14},124 L${352 + i * 14},124 Z`), i % 2 ? '#fff3dc' : K.tulip)).join('') +
    fill(EL(366, 160, 20, 4.5), K.white) + line('M366,160 L366,184', K.ink, 2) +
    fill(R(340, 160, 8, 24, 2), K.teal) + fill(R(384, 160, 8, 24, 2), K.teal));
  return `<svg viewBox="0 -4 400 204" role="img" aria-label="Elayna's restaurant">${s}</svg>`;
}

// ---------- Elayna's neighbourhood ----------
// o: { name, built: Set of improvement ids, choices, shops: [{ slot, open, sign, wall, awning, stars, here, label }],
//      level (0 to 5), people, focus, event }
export function neighbourhoodSvg(o) {
  const has = o.built, ch = o.choices || {};
  const glow = 'filter:drop-shadow(0 0 1.5px #5b2c6f) drop-shadow(0 0 1.5px #5b2c6f) drop-shadow(0 0 6px #b57fd0)';
  const part = (id, inner) => (o.focus === id ? `<g style="${glow}">${inner}</g>` : inner);
  const when = (id, fn) => (has.has(id) || o.focus === id) ? part(id, fn()) : '';
  const grey = Math.max(0, 0.7 - o.level * 0.14); // the street gets more colourful as it gets busier
  const treeCol = ch.trees || '#e8742f', flowerCol = ch.flowers || '#e8475f', mural = ch.mural || 'Tulips';
  let s = fill(R(0, 0, 400, 300), '#cfeaf2') + fill(C(366, 24, 15), '#f7c873');
  // the skyline behind, with the CN Tower
  s += fill(P('M0,118 L0,96 L18,96 L18,84 L34,84 L34,100 L52,100 L52,78 L66,78 L66,104 L90,104 L90,90 L110,90 L110,118 Z'), '#b9d8e2');
  s += fill(P('M230,118 L230,92 L246,92 L246,80 L262,80 L262,98 L282,98 L282,86 L300,86 L300,118 Z'), '#b9d8e2');
  s += fill(R(341, 18, 4, 100), '#a9cbd6') + fill(EL(343, 58, 8, 4.5), '#a9cbd6') + fill(R(342, 8, 2, 12), '#a9cbd6');
  // ----- the row of shops -----
  const slotX = k => 4 + k * 80;
  let row = '';
  for (const sh of o.shops) {
    const x = slotX(sh.slot), w = 72;
    if (!sh.open) {
      row += fill(R(x, 62, w, 88, 4), '#d8d0c4') + fill(R(x - 2, 56, w + 4, 8, 3), '#a89f93');
      row += fill(R(x + 8, 84, 24, 26, 2), '#bdb3a6') + fill(R(x + 40, 84, 24, 26, 2), '#bdb3a6');
      row += line(`M${x + 8},${90} L${x + 32},${104} M${x + 40},${90} L${x + 64},${104}`, '#8a8076', 2.4);
      row += fill(R(x + 14, 116, 44, 14, 3), '#fffaf0') + E('text', { x: x + 36, y: 126, 'text-anchor': 'middle', 'font-size': 8.5, 'font-family': 'Righteous, sans-serif', fill: K.ink }, sh.label || 'For lease');
      row += fill(R(x + 28, 134, 16, 16, 2), '#a89f93');
      continue;
    }
    row += body(R(x, 62, w, 88, 4), sh.wall, -8, 0, .14) + fill(R(x - 2, 56, w + 4, 8, 3), sh.awning);
    for (let i = 0; i < 6; i++) row += fill(P(`M${x + i * 12},${76} L${x + i * 12 + 12},${76} L${x + i * 12 + 12},${86} Q${x + i * 12 + 6},${92} ${x + i * 12},${86} Z`), i % 2 ? '#fff3dc' : sh.awning);
    row += fill(R(x + 6, 94, 26, 26, 2), '#ffd77a') + fill(R(x + 40, 94, 26, 26, 2), '#ffd77a') + line(`M${x + 19},${94} L${x + 19},${120} M${x + 53},${94} L${x + 53},${120}`, '#fff3dc', 1.6);
    row += fill(P(`M${x + 28},150 L${x + 28},${130} Q${x + 36},${122} ${x + 44},${130} L${x + 44},150 Z`), K.teal);
    const fs = Math.min(10, 120 / Math.max(6, sh.sign.length));
    row += fill(R(x + 4, 63, w - 8, 12, 3), K.eggplant) + E('text', { x: x + w / 2, y: 72, 'text-anchor': 'middle', 'font-size': fs.toFixed(1), 'font-family': 'Righteous, sans-serif', fill: '#fff3dc' }, sh.sign);
    row += fill(R(x + 18, 42, 36, 12, 6), '#fffaf0', { opacity: .9 }) + E('text', { x: x + w / 2, y: 51, 'text-anchor': 'middle', 'font-size': 9, fill: '#f6b62e' }, '★'.repeat(sh.stars) + '☆'.repeat(3 - sh.stars));
    if (sh.here) row += fill(P(`M${x + w / 2},40 l-6,-8 a7,7 0 1,1 12,0 Z`), K.tulip) + fill(C(x + w / 2, 30, 2.6), '#fff');
  }
  // the empty lot (slot 3): a brick wall that can hold the mural, and a garden
  const lx = slotX(3);
  row += fill(R(lx, 92, 72, 58), '#c9836a') + [100, 112, 124, 136].map(y => line(`M${lx},${y} L${lx + 72},${y}`, '#b5705a', 1.2)).join('');
  s += grey ? `<g style="filter:grayscale(${grey.toFixed(2)})">${row}</g>` : row;
  s += when('mural', () => {
    let m = fill(R(lx + 4, 96, 64, 40, 3), '#fff3dc');
    if (mural === 'Eggplants') for (const [x, y] of [[lx + 18, 116], [lx + 36, 112], [lx + 54, 118]]) m += fill(EL(x, y, 7, 11, 20), K.eggplant) + fill(EL(x + 3, y - 10, 4, 2, 20), K.leaf);
    else if (mural === 'Food friends') for (const [id, x] of [['tomato', lx + 6], ['eggplant', lx + 26], ['lemon', lx + 46]]) m += `<use href="#cust-${id}" x="${x}" y="${100}" width="20" height="20"/>`;
    else for (let i = 0; i < 5; i++) m += line(`M${lx + 12 + i * 12},${132} L${lx + 12 + i * 12},${120}`, K.leaf, 1.6) + tulip(lx + 12 + i * 12, 113, .5, i % 2 ? '#8b55a6' : K.tulip);
    return m + E('rect', { x: lx + 4, y: 96, width: 64, height: 40, rx: 3, fill: 'none', stroke: '#f6b62e', 'stroke-width': 2 });
  });
  s += has.has('garden') || o.focus === 'garden'
    ? part('garden', fill(R(lx, 138, 72, 12), '#7a5a3c') + [0, 1, 2, 3, 4, 5, 6].map(i => line(`M${lx + 6 + i * 10},146 L${lx + 6 + i * 10},140`, K.leaf, 1.4) + tulip(lx + 6 + i * 10, 137, .38, i % 2 ? flowerCol : K.tulip)).join(''))
    : fill(R(lx, 140, 72, 10), '#b9a07a') + line(`M${lx},138 L${lx + 72},138`, '#8a8076', 1.4, { 'stroke-dasharray': '3 3' });
  // ----- sidewalk -----
  s += fill(R(0, 150, 400, 18), '#e8dcc6') + fill(R(0, 166, 400, 3), '#cbbfa8');
  // ----- road -----
  s += fill(R(0, 169, 400, 36), '#8f8a86') + line('M0,187 L400,187', '#fff3dc', 2, { 'stroke-dasharray': '12 10' });
  s += when('bikes', () => fill(R(0, 170, 400, 6), '#5fb34a', { opacity: .85 }) + [60, 200, 340].map(x => E('text', { x, y: 175.5, 'text-anchor': 'middle', 'font-size': 6, fill: '#fff' }, 'BIKE')).join('') +
    [346, 356].map(x => E('path', { d: `M${x},165 l0,-8 a3,3 0 0,1 6,0 l0,8`, fill: 'none', stroke: '#5a5a5a', 'stroke-width': 1.4 })).join(''));
  s += when('streetcar', () => fill(R(186, 140, 40, 26, 3), '#bfe0e6', { opacity: .7 }) + fill(R(184, 136, 44, 5, 2), K.ink) + fill(R(192, 156, 28, 4), '#b5773a') +
    fill(R(100, 172, 120, 26, 6), '#e2312f') + fill(R(100, 192, 120, 4), '#fff') + [110, 130, 150, 170, 190].map(x => fill(R(x, 177, 14, 9, 2), '#bfe0e6')).join('') +
    line('M100,170 L90,160 L230,160', '#5a5a5a', 1));
  s += when('trees', () => [30, 130, 270, 370].map(x => fill(R(x - 2, 136, 4, 16), '#7a4b3a') + fill(C(x, 130, 12), treeCol) + fill(C(x - 5, 126, 5), '#fff', { opacity: .25 })).join(''));
  s += when('lamps', () => [80, 320].map(x => line(`M${x},164 L${x},128`, '#3a3a3a', 2.4) + fill(C(x, 126, 4.5), '#ffd34d') + fill(C(x, 126, 9), '#ffd34d', { opacity: .3 })).join(''));
  s += when('benches', () => [104, 294].map(x => fill(R(x - 12, 156, 24, 3, 1), '#b5773a') + fill(R(x - 12, 152, 24, 3, 1), '#c98a4a') + fill(R(x + 14, 152, 9, 10, 2), '#c96a3a') + fill(C(x + 18.5, 150, 4), K.leaf)).join(''));
  s += when('lights', () => {
    let l = line('M0,130 Q50,146 100,132 T200,132 T300,132 T400,130', K.ink, 1);
    for (let x = 10; x < 400; x += 20) l += fill(C(x, 136 + Math.sin(x / 32) * 3, 2.4), ['#ffd34d', '#e8475f', '#8b55a6', '#5fb34a'][Math.floor(x / 20) % 4]);
    return l;
  });
  s += when('arch', () => fill(R(146, 112, 8, 93), '#b5773a') + fill(R(246, 112, 8, 93), '#b5773a') + fill(R(138, 104, 124, 18, 6), K.eggplant) +
    E('text', { x: 200, y: 117, 'text-anchor': 'middle', 'font-size': Math.min(11, 190 / Math.max(8, o.name.length)).toFixed(1), 'font-family': 'Righteous, sans-serif', fill: '#fff3dc' }, o.name) +
    tulip(144, 100, .45, K.tulip) + tulip(256, 100, .45, K.tulip));
  // ----- plaza -----
  s += fill(R(0, 205, 400, 33), '#efe3cc') + [40, 120, 200, 280, 360].map(x => line(`M${x},205 L${x},238`, '#e2d4b8', 1)).join('');
  s += when('market', () => [12, 44, 76].map((x, i) => fill(R(x, 220, 26, 14, 2), '#c98a4a') + fill(P(`M${x - 2},220 L${x + 28},220 L${x + 24},210 L${x + 2},210 Z`), i % 2 ? '#fff3dc' : ['#e8475f', '#2f8a8f', '#f6b62e'][i]) +
    fill(C(x + 7, 219, 3), K.tomato) + fill(C(x + 15, 219, 3), '#ffd23f') + fill(C(x + 21, 219, 3), K.leaf)).join(''));
  s += when('fountain', () => fill(EL(170, 228, 24, 7), '#a9a39b') + fill(EL(170, 226, 20, 5.5), '#7cc3d6') + fill(R(167, 210, 6, 16), '#a9a39b') + fill(EL(170, 210, 9, 3), '#a9a39b') +
    E('path', { d: 'M170,208 Q162,198 156,222 M170,208 Q178,198 184,222', fill: 'none', stroke: '#bfe6f2', 'stroke-width': 2 }));
  s += when('stage', () => fill(R(250, 216, 70, 16, 2), '#b5773a') + fill(P('M246,216 L324,216 L314,198 L256,198 Z'), K.eggplant) + fill(R(250, 198, 3, 18), '#7a4b3a') + fill(R(317, 198, 3, 18), '#7a4b3a') +
    E('text', { x: 285, y: 210, 'text-anchor': 'middle', 'font-size': 9, fill: '#f6b62e' }, '♪ ♫ ♪'));
  s += when('washrooms', () => fill(R(350, 208, 40, 26, 3), '#d6eef4') + fill(R(348, 204, 44, 6, 2), K.teal) + fill(R(356, 216, 10, 18, 1), K.teal) + fill(R(374, 216, 10, 18, 1), K.tulip) +
    fill(C(361, 212, 2), '#fff') + fill(C(379, 212, 2), '#fff'));
  // ----- park strip -----
  const park = has.has('park') || o.focus === 'park';
  s += park ? part('park', fill(R(0, 238, 400, 62), '#a8d88a') + [30, 160, 290].map(x => fill(R(x - 2, 250, 4, 14), '#7a4b3a') + fill(C(x, 246, 10), '#5fb34a')).join('') +
      fill(R(120, 266, 26, 4, 1), '#b5773a') + fill(R(122, 270, 3, 8), '#7a4b3a') + fill(R(141, 270, 3, 8), '#7a4b3a'))
    : fill(R(0, 238, 400, 62), '#d9cfa0') + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => fill(R(10 + i * 46, 244, 3, 14), '#b5a27a')).join('') + line('M0,250 L400,250', '#b5a27a', 1.4);
  s += when('splash', () => fill(EL(88, 278, 34, 12), '#bfe6f2') + [68, 82, 96, 110].map(x => E('path', { d: `M${x},280 Q${x + 4},262 ${x + 8},280`, fill: 'none', stroke: '#6cc6e0', 'stroke-width': 2 })).join('') +
    fill(C(76, 266, 2), '#fff') + fill(C(104, 264, 2), '#fff'));
  s += when('pool', () => fill(R(176, 258, 84, 34, 4), '#fffaf0') + fill(R(180, 262, 76, 26, 3), '#6cc6e0') + [270, 276, 282].map(y => line(`M182,${y} L254,${y}`, '#fff', 1, { 'stroke-dasharray': '4 3' })).join('') +
    line('M252,258 L252,268 M256,258 L256,268', '#a9a39b', 1.4));
  s += when('zoo', () => {
    let z = [290, 310, 330, 350, 370, 390].map(x => fill(R(x, 270, 3, 18), '#b5773a')).join('') + line('M288,274 L394,274 M288,282 L394,282', '#b5773a', 1.6);
    z += fill(EL(312, 262, 10, 6), '#fffaf0') + fill(C(322, 256, 4.5), '#d9d0c4') + line('M306,266 L306,272 M318,266 L318,272', '#7a6a5a', 1.4) + fill(P('M320,252 l2,-4 l1,4 Z'), '#7a6a5a');
    z += fill(EL(346, 266, 6, 5), '#fffaf0') + fill(EL(343, 258, 2, 5, -10), '#fffaf0') + fill(EL(349, 258, 2, 5, 10), '#fffaf0') + fill(C(346, 263, 3), '#fffaf0');
    z += fill(EL(374, 266, 6, 4.5), '#f6c33e') + fill(C(379, 262, 3), '#f6c33e') + fill(P('M381,262 l4,1 l-4,1 Z'), '#e8742f');
    return z;
  });
  // ----- people: more buzz brings more visitors -----
  const spots = [[58, 150], [158, 150], [238, 150], [338, 150], [24, 218], [118, 218], [208, 218], [336, 220], [60, 258], [200, 248], [256, 280], [146, 282], [18, 150], [300, 150], [380, 286], [100, 230]];
  const who = ['tomato', 'eggplant', 'lemon', 'mushroom'];
  for (let i = 0; i < Math.min(o.people, spots.length); i++) s += `<use href="#cust-${who[i % 4]}" x="${spots[i][0] - 8}" y="${spots[i][1] - 16}" width="16" height="16"/>`;
  // ----- events -----
  if (o.event === 'fireworks') {
    s += fill(R(0, 0, 400, 110), '#2a1f44', { opacity: .55 });
    for (const [x, y, c, d] of [[80, 40, '#f6b62e', 0], [200, 28, K.tulip, .5], [320, 46, '#6cc6e0', 1], [140, 60, '#8b55a6', 1.4], [260, 70, '#5fb34a', .8]]) {
      let b = '';
      for (let a = 0; a < 12; a++) { const r = a * Math.PI / 6; b += fill(C(x + Math.cos(r) * 16, y + Math.sin(r) * 16, 2.2), c); }
      s += `<g class="fx-burst" style="animation-delay:${d}s">${b}${fill(C(x, y, 3), '#fff')}</g>`;
    }
  }
  if (o.event === 'parade') {
    let p = '';
    for (let i = 0; i < 6; i++) p += `<use href="#cust-${who[i % 4]}" x="${-40 - i * 34}" y="${172}" width="26" height="26"/>` + fill(C(-28 - i * 34, 160, 6), [K.tulip, '#f6b62e', '#6cc6e0'][i % 3]) + line(`M${-28 - i * 34},166 L${-28 - i * 34},176`, K.ink, .8);
    s += `<g class="fx-parade">${p}</g>`;
  }
  if (o.event === 'trucks') {
    for (const [x, c] of [[20, '#f6b62e'], [150, '#6cc6e0'], [280, K.tulip]]) s += `<g class="fx-bob">${fill(R(x, 174, 70, 24, 5), c)}${fill(R(x + 48, 178, 18, 10, 2), '#bfe0e6')}${fill(R(x + 6, 180, 34, 8, 2), '#fffaf0')}${fill(C(x + 14, 199, 5), K.ink)}${fill(C(x + 56, 199, 5), K.ink)}</g>`;
  }
  if (o.event === 'festival') {
    let b = line('M0,124 Q100,140 200,124 T400,124', K.ink, 1);
    for (let x = 8; x < 400; x += 16) b += fill(P(`M${x - 6},${128 + Math.sin(x / 40) * 4} L${x + 6},${128 + Math.sin(x / 40) * 4} L${x},${138 + Math.sin(x / 40) * 4} Z`), [K.tulip, '#f6b62e', '#6cc6e0', '#8b55a6'][(x / 16 | 0) % 4]);
    s += b;
    for (let i = 0; i < 24; i++) s += `<g class="fx-fall" style="animation-delay:${(i % 8) * .25}s">${fill(R(10 + i * 16, -10, 4, 6, 1), [K.tulip, '#f6b62e', '#6cc6e0', '#5fb34a'][i % 4])}</g>`;
  }
  if (o.event === 'tulipfest') {
    for (let i = 0; i < 16; i++) { const x = 12 + i * 25, y = i % 2 ? 160 : 232; s += `<g class="fx-pop" style="animation-delay:${(i % 6) * .15}s">${line(`M${x},${y} L${x},${y - 8}`, K.leaf, 1.6)}${tulip(x, y - 12, .5, [K.tulip, '#8b55a6', '#f6c33e'][i % 3])}</g>`; }
  }
  return `<svg viewBox="0 0 400 300" role="img" aria-label="Your neighbourhood">${s}</svg>`;
}

// ---------- small interface icons (24 x 24) ----------
export const ICONS = {
  coin: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${K.gold}"/><circle cx="12" cy="12" r="8" fill="none" stroke="${K.goldDark}" stroke-width="1.6"/><text x="12" y="16.4" text-anchor="middle" font-size="12" font-weight="700" font-family="Righteous, sans-serif" fill="${K.goldDark}">$</text></svg>`,
  bolt: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${K.eggplant}"/><path d="M13.5 4 L7 13.5 L11.5 13.5 L10.5 20 L17 10.5 L12.5 10.5 Z" fill="#ffd34d"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9L2 13.7v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2zm-3 18h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/></svg>`,
  gem: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l4 5.5L12 21 3 8.5z" fill="#9b5cc0"/><path d="M7 3h10l4 5.5H3z" fill="#cfa3e6"/><path d="M12 21 8.5 8.5h7z" fill="#7a3fa0"/></svg>`,
  ticket: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-5z" fill="#e8475f"/><path d="M9 6v12" stroke="#fff" stroke-width="1.4" stroke-dasharray="1.6 1.6"/></svg>`,
  gift: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="2" fill="#e8475f"/><rect x="2" y="7" width="20" height="4" rx="1.5" fill="#f28b97"/><rect x="10.5" y="7" width="3" height="14" fill="#f6b62e"/><path d="M12 7C9 2 5 4 7.5 7M12 7c3-5 7-3 4.5 0" fill="none" stroke="#f6b62e" stroke-width="2"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 22s-7-6.6-7-12a7 7 0 0 1 14 0c0 5.4-7 12-7 12zm0-9.2a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z"/></svg>`,
  house: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 11.2 12 3.5l9 7.7V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>`,
  book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5.2C5.5 4 8.5 4 11 5.6V20c-2.5-1.4-5.5-1.4-8-.3zm10 .4C15.5 4 18.5 4 21 5.2v14.5c-2.5-1.1-5.5-1.1-8 .3z"/></svg>`,
  cloche: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 4.5a1 1 0 0 1 2 0v.7A8.5 8.5 0 0 1 20.5 14H3.5A8.5 8.5 0 0 1 11 5.2zM2 15.5h20a1.5 1.5 0 0 1 0 3H2a1.5 1.5 0 0 1 0-3z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12h13M13 6l6 6-6 6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${K.leaf}"/><path d="M6.5 12.5 L10.5 16.5 L17.5 8.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

// Put every drawing on the page once. Squares on the board then point at them by id.
export function buildSprite() {
  let defs = '';
  const add = (id, fn) => { defs += `<symbol id="${id}" viewBox="0 0 100 100">${fn()}</symbol>`; };
  for (const [id, fn] of Object.entries(ITEM_ART)) add(`art-${id}`, fn);
  for (const [id, fn] of Object.entries(PRODUCER_ART)) add(`art-${id}`, fn);
  for (const [id, fn] of Object.entries(CUSTOMER_ART)) add(`cust-${id}`, fn);
  const host = document.createElement('div');
  host.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${defs}</defs></svg>`;
  document.body.prepend(host.firstChild);
}

// The drawings leave a little air around the edge; this crops it so food fills its square.
export const use = (id, label = '') =>
  `<svg viewBox="7 7 86 86"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}><use href="#${id}"/></svg>`;
