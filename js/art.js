// All game art, drawn in code in the "sunny poster" style:
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

// A hard shell taco standing on its fold, seen from the side, drawn in the 100 box.
// "top" draws the fillings poking out of the shell, around y = 40.
function hardTaco(top) {
  let t = fill(P('M12,46 A38,34 0 0,0 88,46 Z'), '#d9952f', { transform: 'translate(3 -6)' }) + top;
  const shell = P('M12,47 A38,33 0 0,0 88,47 Z');
  t += body(shell, '#f2b33e', -7, -6, .2);
  for (const [x, y] of [[30, 60], [48, 70], [64, 58], [72, 66], [40, 54], [56, 62]]) t += fill(C(x, y, 1.6), '#d9952f');
  t += shine(P('M20,54 Q26,68 38,74 Q28,70 24,56 Z'), .4);
  return E('g', { transform: 'rotate(-8 50 60)' }, t);
}
const lettuce = (seed = 6) => fill(P(blob(50, 42, 37, 8, 16, .3, seed)), '#6cc052') + fill(P(blob(46, 40, 26, 5, 12, .3, seed + 3)), '#8fd14f');
const tacoFilling = () => {
  let t = fill(P(blob(50, 46, 34, 7, 14, .2, 2)), '#8a4a22') + lettuce();
  for (const [x, y] of [[30, 38], [52, 35], [70, 39]]) t += fill(R(x - 4.5, y - 4, 9, 8, 2.5), K.tomato) + shine(C(x - 2, y - 2, 1.4), .6);
  for (const [x, y, r] of [[40, 39, 30], [60, 37, -20], [24, 43, -40], [78, 43, 40], [46, 36, 70]]) t += fill(R(x - 4, y - 1.2, 8, 2.4, 1.2), '#ffb52e', { transform: `rotate(${r} ${x} ${y})` });
  return t;
};
// Place a taco (or anything drawn in the 100 box) at x, y, at a size.
const placed = (x, y, k, art) => E('g', { transform: `translate(${x} ${y}) scale(${k}) translate(-50 -55)` }, art);

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

  // Babka: a loaf with a twisted top, chocolate wound through it, and a swirly slice in front.
  babka() {
    let s = ground(48, 87, 38, 5);
    const loaf = P('M10,52 Q10,44 20,44 L64,44 Q74,44 74,52 L74,82 L10,82 Z');
    s += body(loaf, '#c47a35', -6, -6, .2);
    for (let i = 0; i < 7; i++) {
      const x = 15 + i * 9;
      s += fill(EL(x + 1.5, 45.5, 6.5, 9.5, 32), '#5a3324') + fill(EL(x, 44, 5.4, 8.6, 32), '#e09a4c') + shine(EL(x - 1.6, 40, 1.3, 3, 32), .55);
    }
    s += line('M14,62 Q22,56 30,63 T48,62 T70,63', '#5a3324', 3) + line('M14,74 Q24,69 34,75 T56,73 T70,75', '#5a3324', 2.5);
    s += E('rect', { x: 56, y: 56, width: 34, height: 32, rx: 9, fill: '#f3c77a', stroke: '#c47a35', 'stroke-width': 3.5 });
    s += E('path', { d: 'M73,72 m-1.5,0 a1.5,1.5 0 1,1 3,0 a5,5 0 1,1 -10,0 a9,9 0 1,1 18,0', fill: 'none', stroke: '#5a3324', 'stroke-width': 3, 'stroke-linecap': 'round' });
    return s;
  },

  // Milk: a gable-top carton, the shape everyone knows, with a teal band and a milk drop.
  milk() {
    let s = ground(52, 90, 28, 4.5);
    s += fill(P('M58,40 L76,31 L76,80 L58,89 Z'), '#ddd5c7');
    s += fill(P('M42,22 L60,13 L76,31 L58,40 Z'), '#cfc6b6');
    s += fill(P('M42,22 L60,13 L60,7 L42,16 Z'), '#e9e2d6');
    const front = R(26, 40, 32, 49, 1.5);
    s += body(front, '#fffaf0', -6, -4, .14) + fill(P('M26,40 L42,22 L58,40 Z'), '#f1ebe0');
    s += fill(R(26, 55, 32, 20), K.teal) + fill(P('M58,55 L76,46 L76,66 L58,75 Z'), '#25707a');
    s += fill(P('M42,58 Q48,66 48,69 A6,6 0 0,1 36,69 Q36,66 42,58 Z'), K.white);
    return s + shine(R(30, 44, 3.5, 40, 1.75), .5);
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

  // A square bakery danish: corners folded in to the middle, cream cheese in the centre, icing drizzle.
  cheesedanish() {
    let s = ground(50, 88, 42, 5);
    s += fill(EL(50, 80, 42, 9), K.white) + fill(EL(50, 79, 34, 6), '#f1e3c6');
    s += fill(R(16, 30, 68, 46, 20), '#b8692a', { transform: 'translate(0 5)' });
    s += body(R(16, 30, 68, 46, 20), '#e29a45', -6, -5, .2);
    const flaps = P('M50,31 Q53,31 81,53 Q53,77 50,77 Q47,77 19,53 Q47,31 50,31 Z');
    s += fill(flaps, '#f2b862') + line('M50,31 L50,40 M81,53 L64,53 M50,77 L50,66 M19,53 L36,53', '#c97f35', 1.6, { opacity: .7 });
    s += fill(P(blob(50, 53, 14, 10, 10, .08, 5)), '#fff6dc') + fill(EL(46, 50, 5, 2.4, -15), '#fff', { opacity: .9 });
    s += line('M24,46 Q30,60 36,44 T48,46 T60,44 T72,46 Q76,52 78,48', '#fff', 1.6, { opacity: .9 });
    s += line('M26,62 Q34,52 40,62 T54,62 T66,60 T76,60', '#fff', 1.6, { opacity: .9 });
    return s + shine(EL(26, 38, 5, 2.2, -30), .45);
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

  // Noodle kugel: a blue baking dish of golden noodles with crispy curls on top and raisins.
  kugel() {
    let s = ground(50, 88, 44, 5);
    s += fill(R(4, 52, 10, 11, 4), '#5fa9bf') + fill(R(86, 52, 10, 11, 4), '#5fa9bf');
    s += body(R(10, 40, 80, 46, 12), '#7cc3d6', -6, -6, .2) + fill(R(10, 40, 80, 6, 3), '#9fd3e2');
    s += fill(R(16, 45, 68, 35, 8), '#f2c272');
    for (const [x, y, rx] of [[32, 54, 10], [64, 58, 12], [44, 70, 11]]) s += fill(EL(x, y, rx, 4.5), '#d9953f', { opacity: .45 });
    const r = rng(8);
    for (let i = 0; i < 26; i++) {
      const x = 19 + r() * 50, y = 50 + r() * 26;
      s += line(`M${x.toFixed(1)},${y.toFixed(1)} q3.5,-3 7,0 t7,0`, i % 2 ? '#e8a64a' : '#fbe08f', 3);
    }
    for (const [x, y] of [[30, 58], [60, 52], [70, 68], [42, 74]]) s += fill(EL(x, y, 1.8, 1.3, 30), '#5a3324');
    return s + shine(R(18, 47, 26, 2.6, 1.3), .45);
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
    // A sandwich cut corner to corner: two toast triangles, each showing bread, melty cheese, bread.
    const TRI = 'M-16,14 L26,14 L-16,-26 Z';
    const soft = c => ({ stroke: c, 'stroke-width': 5, 'stroke-linejoin': 'round' });
    const drip = (x, y, len) => fill(P(`M${x - 2.6},${y} L${x - 2.6},${y + len} A2.6,2.6 0 0,0 ${x + 2.6},${y + len} L${x + 2.6},${y} Z`), '#ffcf47');
    const half = flip => E('g', { transform: flip },
      fill(P(TRI), '#a65d22', { ...soft('#a65d22'), transform: 'translate(0 12)' }) +
      fill(P(TRI), '#ffcf47', { ...soft('#ffcf47'), transform: 'translate(0 6)' }) +
      drip(-10, 18, 7) + drip(2, 18, 10) + drip(14, 18, 5) + drip(6, 0, 9) + drip(17, 10, 6) +
      fill(P(TRI), '#b8692a', soft('#b8692a')) + fill(P(sc(TRI, -.5, .2, .76)), '#eaa64a') +
      line('M-10,8 L0,8 M-10,0 L-4,0 M2,8 L10,8', '#c47f30', 2.2) + shine(EL(-10, -6, 1.8, 6), .45));
    s += half('translate(34 54)') + half('translate(66 60) scale(-1 1)');
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
    return ground(50, 86, 38, 5) + hardTaco(tacoFilling());
  },
  // Two tamales in their corn husks, opened up to show the masa and the red filling, ends tied.
  tamales() {
    let s = ground(50, 88, 42, 5);
    s += fill(EL(50, 78, 42, 10), K.white) + fill(EL(50, 77, 34, 7), '#f1e3c6');
    const one = (x, y, ang) => {
      const a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a);
      const bx = x - dx * 38, by = y - dy * 38, at = t => [bx + dx * 76 * t, by + dy * 76 * t];
      let h = body(P(leaf(bx, by, ang, 76, 26)), '#e3c27f', -4, -4, .2);
      h += E('path', { d: leaf(bx, by, ang, 76, 12), fill: 'none', stroke: '#c9a060', 'stroke-width': 1.4 });
      h += body(EL(x, y, 23, 7.5, ang), '#f8dc7e', -3, -3, .15) + fill(EL(x, y - .5, 15, 2.6, ang), '#d9472f');
      h += shine(EL(x - dx * 10, y - dy * 10 - 3.5, 6, 1.4, ang), .6);
      for (const t of [.13, .87]) { const [px, py] = at(t); h += line(`M${px + dy * 7},${py - dx * 7} L${px - dy * 7},${py + dx * 7}`, '#b98a4a', 3); }
      return h;
    };
    return s + one(50, 50, -7) + one(51, 68, 5);
  },
  // Three tacos lined up on a teal platter, with lime wedges.
  tacoplatter() {
    let s = ground(50, 89, 46, 5);
    s += fill(EL(50, 72, 46, 15), K.teal) + fill(EL(50, 70, 40, 12), '#3fa3a8');
    s += placed(28, 62, .5, hardTaco(tacoFilling())) + placed(72, 62, .5, hardTaco(tacoFilling())) + placed(50, 58, .54, hardTaco(tacoFilling()));
    const lime = (x, y, rot) => E('g', { transform: `rotate(${rot} ${x} ${y})` },
      fill(P(`M${x - 7},${y} A7,7 0 0,0 ${x + 7},${y} Z`), '#6cb83a') + fill(P(`M${x - 5.5},${y} A5.5,5.5 0 0,0 ${x + 5.5},${y} Z`), '#c6ec8a'));
    return s + lime(14, 74, 20) + lime(86, 76, -20);
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
  // A plate of plain spaghetti with a fork twirling up a bite.
  spaghetti() {
    let s = ground(50, 88, 42, 5);
    s += fill(EL(50, 76, 42, 11), K.white) + fill(EL(50, 75, 34, 8), '#f1e3c6');
    s += fill(P(blob(48, 66, 30, 12, 12, .12, 3)), '#f2c46e');
    const r = rng(11);
    for (let i = 0; i < 14; i++) {
      const x = 24 + r() * 44, y = 60 + r() * 12, w = 6 + r() * 6;
      s += line(`M${x.toFixed(1)},${y.toFixed(1)} q${w / 2},${-(3 + r() * 3).toFixed(1)} ${w},0 t${w},0`, i % 2 ? '#e8b04a' : '#ffd86b', 2.4);
    }
    s += line('M24,70 Q16,76 22,82', '#ffd86b', 2.4) + line('M70,72 Q80,76 76,82', '#e8b04a', 2.4);
    s += line('M58,54 L80,14', '#c3c9d1', 5.5) + line('M57,52 L79,12', '#e3e7ec', 2.4);
    s += fill(EL(80, 13, 4, 6, 30), '#c3c9d1');
    s += fill(EL(57, 55, 13, 9, 29), '#f2c46e');
    for (let i = 0; i < 4; i++) s += fill(EL(57 + i * 1.6, 59 - i * 3, 13 - i * 1.4, 3.4, 29), 'none', { stroke: i % 2 ? '#e8b04a' : '#ffd86b', 'stroke-width': 2.6 });
    return s + shine(EL(50, 54, 3, 1.4, 29), .7);
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
  // Elote: grilled corn on a stick with crema, chili and crumbly cheese, and a lime wedge on the plate.
  elote() {
    let s = ground(50, 89, 42, 5);
    s += fill(EL(50, 80, 42, 9), K.white) + fill(EL(50, 79, 34, 6), '#f1e3c6');
    s += fill(P('M64,80 A10,10 0 0,0 84,80 Z'), '#6cb83a') + fill(P('M66.5,80 A7.5,7.5 0 0,0 81.5,80 Z'), '#c6ec8a');
    s += E('g', { transform: 'rotate(35 48 50)' }, line('M48,78 L48,96', '#c98a4a', 4) + body(EL(48, 48, 13, 31), '#ffd23f', -5, -5, .2) +
      [0, 1, 2, 3, 4, 5].map(r => { const y = 24 + r * 9, w = 13 * Math.sqrt(1 - ((y - 48) / 31) ** 2) - 2.5; return fill(EL(48, y, w.toFixed(1), 3.2), '#f7b928'); }).join('') +
      line('M40,30 Q48,35 56,28 M36,44 Q48,50 60,42 M36,60 Q48,66 60,58', '#fffaf0', 3.2) +
      [[42, 34], [54, 48], [44, 56], [52, 30], [40, 66], [56, 64]].map(([x, y]) => fill(C(x, y, 1.6), '#e2412f')).join('') +
      [[46, 40], [52, 54], [40, 50], [50, 70], [56, 36]].map(([x, y]) => fill(R(x - 1.5, y - 1.5, 3, 3, .8), '#fffaf0')).join(''));
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
  // A folded tortilla cut into three wedges: toasty grill marks on top, cheese melting out the edges.
  quesadilla() {
    let s = ground(50, 88, 42, 5);
    s += fill(EL(50, 78, 42, 11), K.white) + fill(EL(50, 77, 34, 8), '#f1e3c6');
    const cx = 50, cy = 74, rad = 38, pt2 = (a, d) => [cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8];
    const wedge = i => {
      const a1 = Math.PI * (1 + i / 3), a2 = Math.PI * (1 + (i + 1) / 3), am = (a1 + a2) / 2;
      const [ox, oy] = [Math.cos(am) * 3, Math.sin(am) * 3];
      const [x1, y1] = pt2(a1, rad), [x2, y2] = pt2(a2, rad);
      const d = `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${rad},${rad * .8} 0 0,1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
      let w = fill(P(d), '#d99a45', { transform: `translate(${ox} ${oy + 4})` });
      w += fill(P(d), '#ffcf47', { transform: `translate(${ox} ${oy + 2})` });
      for (const t of [.25, .5, .75]) { const [bx, by] = pt2(a1 + (a2 - a1) * t, rad); w += fill(C(bx + ox, by + oy + 2.5, 3), '#ffcf47'); }
      w += fill(P(d), '#f3c46a', { transform: `translate(${ox} ${oy})` });
      for (const t of [.35, .65]) {
        const a = a1 + (a2 - a1) * t, [p1x, p1y] = pt2(a, 10), [p2x, p2y] = pt2(a, rad - 6);
        w += line(`M${(p1x + ox).toFixed(1)},${(p1y + oy).toFixed(1)} L${(p2x + ox).toFixed(1)},${(p2y + oy).toFixed(1)}`, '#c98a3a', 2.4, { opacity: .7 });
      }
      const [gx, gy] = pt2(am, rad * .55);
      return w + fill(C(gx + ox + 2, gy + oy + 4, 1.8), '#5fb34a') + fill(C(gx + ox - 3, gy + oy - 2, 1.6), K.tomato);
    };
    return s + wedge(0) + wedge(1) + wedge(2) + shine(EL(32, 58, 5, 2, -30), .4);
  },
  // Nachos: a pile of tortilla chips with melted cheese, jalapenos, tomato and a spoon of sour cream.
  nachos() {
    let s = ground(50, 89, 44, 5);
    s += fill(EL(50, 76, 44, 11), K.tulip) + fill(EL(50, 75, 36, 7), '#f28b97');
    const soft = c => ({ stroke: c, 'stroke-width': 3, 'stroke-linejoin': 'round' });
    const chip = (x, y, rot) => E('g', { transform: `rotate(${rot} ${x} ${y})` },
      fill(P(sc('M0,-11 L11,8 L-11,8 Z', x + 1.4, y + 1.4, 1)), '#c98a3a', soft('#c98a3a')) +
      fill(P(sc('M0,-11 L11,8 L-11,8 Z', x, y, 1)), '#f6cc72', soft('#f6cc72')) + fill(C(x - 2, y + 2, 1), '#d9a44a'));
    for (const [x, y, rot] of [[22, 68, 20], [36, 70, -10], [52, 71, 15], [66, 69, -25], [80, 67, 10],
      [30, 58, -30], [46, 58, 5], [62, 57, 35], [74, 58, -5], [40, 47, 15], [56, 46, -20]]) s += chip(x, y, rot);
    s += line('M22,62 Q30,54 38,62 T54,60 T70,58 T80,62', '#ffb82e', 4.5) + line('M34,52 Q42,46 50,52 T64,50', '#ffb82e', 4);
    for (const [x, y] of [[30, 64], [56, 54], [70, 64]]) s += fill(C(x, y, 3.6), '#4f9a3a') + fill(C(x, y, 1.6), '#cdeaa8');
    for (const [x, y] of [[44, 64], [62, 66], [36, 54]]) s += fill(R(x - 2.4, y - 2.4, 4.8, 4.8, 1.2), K.tomato);
    return s + fill(P(blob(50, 44, 8, 5, 8, .15, 3)), '#fffaf0') + shine(EL(48, 42, 3, 1.2), .8);
  },
  // Two tacos filled with roasted eggplant, greens and a drizzle of crema.
  eggplanttacos() {
    let s = ground(50, 88, 44, 5);
    s += fill(EL(50, 76, 44, 10), K.white) + fill(EL(50, 75, 36, 7), '#f1e3c6');
    let top = lettuce(4);
    for (const [x, y] of [[26, 38], [40, 34], [54, 36], [68, 34], [78, 40], [34, 42], [62, 41]])
      top += fill(R(x - 5, y - 4.5, 10, 9, 3), K.eggplant) + fill(R(x - 3, y - 3.5, 5, 4, 2), '#e8c98a');
    top += line('M22,36 Q30,30 38,36 T54,34 T70,33 T82,38', '#fffaf0', 2.4);
    return s + placed(31, 60, .64, hardTaco(top)) + placed(69, 60, .64, hardTaco(top));
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
  // Eggplant parmigiana: fried eggplant rounds in red sauce under melted, browned mozzarella, with basil.
  parmigiana() {
    let s = ground(50, 89, 42, 5);
    const dish = R(10, 38, 80, 48, 10);
    s += body(dish, '#c96a3a', -6, -6, .2) + fill(R(16, 44, 68, 36, 6), '#d6402f');
    for (const [x, y] of [[28, 56], [50, 53], [72, 56], [38, 70], [62, 70]]) s += fill(EL(x, y, 10, 7), K.eggplant) + fill(EL(x, y, 7.5, 5), '#e0a050');
    for (const [x, y, rx, ry, seed] of [[38, 58, 14, 7, 3], [64, 60, 13, 7, 7], [50, 70, 15, 6, 9]]) {
      s += fill(P(blob(x, y, rx, ry, 10, .25, seed)), '#fff3d6');
      s += fill(EL(x - 4, y - 1, 2.6, 1.6), '#d9953f', { opacity: .8 }) + fill(EL(x + 5, y + 2, 2, 1.3), '#d9953f', { opacity: .8 });
    }
    s += fill(P(leaf(44, 48, -40, 10, 4)), K.leaf) + fill(P(leaf(58, 48, -140, 10, 4)), K.leaf);
    return s + shine(R(18, 46, 22, 2.4, 1.2), .35);
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
    for (const [x, y, c] of [[34, 40, '#f3d9b0'], [66, 40, '#e8c08f'], [50, 33, '#fbecd2'], [42, 46, '#e8c08f'], [58, 46, '#fbecd2']])
      s += body(EL(x, y, 9, 12), c, -4, -4, .22) + shine(EL(x - 3, y - 4, 2.2, 3.6), .7);
    const basket = P('M12,48 L88,48 L80,88 Q50,94 20,88 Z');
    s += body(basket, '#c98a4a', -7, -5, .22);
    for (const y of [58, 68, 78]) s += line(`M16,${y} L84,${y}`, '#a8692a', 2.2);
    s += fill(R(10, 44, 80, 8, 4), '#a8692a') + line('M22,48 Q50,4 78,48', '#a8692a', 3.5);
    s += fill(R(36, 60, 28, 16, 4), K.cream) + fill(R(38, 66, 8, 4), '#3f9b3c') + fill(R(46, 66, 8, 4), '#fff') + fill(R(54, 66, 8, 4), '#e2412f');
    return s;
  },

  // A little retro fridge in pale blue, with a milk carton on top.
  fridge() {
    let s = ground(50, 93, 32, 5);
    s += fill(P('M66,10 L72,7 L72,22 L66,25 Z'), '#ddd5c7') + body(R(56, 10, 10, 15, 1), '#fffaf0', -3, -2, .16);
    s += fill(P('M56,10 L61,4 L66,10 Z'), '#f1ebe0') + fill(P('M61,4 L67,1 L72,7 L66,10 Z'), '#cfc6b6') + fill(R(56, 14, 10, 6), K.teal);
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
    const seg = (cx, cy, rx, ry, rot, c) => two(EL(cx, cy, rx, ry, rot), c, '#a8611e', 2.4);
    let s = seg(22, 70, 7, 12, -62, '#c9772a') + seg(78, 70, 7, 12, 62, '#c9772a');
    s += seg(33, 61, 12, 19, -32, '#d4852c') + seg(67, 61, 12, 19, 32, '#d4852c');
    s += seg(50, 56, 18, 25, 0, '#e0953a');
    s += shine(EL(40, 46, 3, 8, 15), .45) + shine(EL(28, 56, 2, 5, -32), .4);
    s += body(EL(52, 31, 22, 7.5, -8), K.eggplant, -5, -4, .25) + fill(C(54, 23, 3.5), K.eggplant);
    s += face(43, 57, 50, { r: 3, mouthDrop: 11 });
    s += line('M50,57 Q45,54 41,58 Q39,55 42,53 M50,57 Q55,54 59,58 Q61,55 58,53', '#6b3a1f', 2.4);
    s += E('circle', { cx: 57, cy: 50, r: 6.5, fill: '#fff', 'fill-opacity': .25, stroke: K.gold, 'stroke-width': 2 });
    return s + line('M63,53 Q70,62 66,72', K.gold, 1.3);
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
  vip() { // VIP Host: a cookie wearing a crown and a red bow tie, ready to greet guests
    let s = body(C(0, 4, 18), '#e2b26a', -6, -6, .2);
    for (const [x, y] of [[-11, 4], [11, 8], [-6, 14], [8, -4]]) s += fill(C(x, y, 1.6), '#b97a32');
    s += fill(P('M0,19 L-8,14.5 L-8,23.5 Z M0,19 L8,14.5 L8,23.5 Z'), K.tulip) + fill(C(0, 19, 2.2), '#c22f45');
    s += fill(P('M-13,-11 L-14,-27 L-6,-19 L0,-30 L6,-19 L14,-27 L13,-11 Z'), K.gold) + fill(R(-13, -13, 26, 4, 1.5), K.goldDark);
    s += fill(C(0, -21, 2.2), K.tulip) + fill(C(-8, -17, 1.6), K.teal) + fill(C(8, -17, 1.6), K.teal);
    return s + tinyFace(-6, 6, 0, 2);
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

// ---------- the restaurant ----------
// One building, dressed three ways: a Toronto bakery and deli ("deli"), a Mexican cocina
// ("mexico") and a Roman trattoria ("rome"). Every upgrade sits in the same spot in each, but
// is drawn in that restaurant's style (names in data/restaurant.js, THEMES).
// has: Set of upgrade ids bought. opts: { lv: { id: 1 to 3 }, style, paint, awning, sign, baseWall,
//   colour (0 to 1, how much colour the plain building has), focus, decor }
const sparkle = (x, y, r, c = '#fff') => fill(P(`M${x},${y - r} L${x + r * .25},${y - r * .25} L${x + r},${y} L${x + r * .25},${y + r * .25} L${x},${y + r} L${x - r * .25},${y + r * .25} L${x - r},${y} L${x - r * .25},${y - r * .25} Z`), c);
const glowDot = (x, y, r, c) => fill(C(x, y, r * 2.4), c, { opacity: .3 }) + fill(C(x, y, r), c);
const neonText = (x, y, t, c, size = 13) => E('text', { x, y, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': size, fill: c, style: `filter:drop-shadow(0 0 2px ${c})` }, t);
const neonPath = (d, c, w = 2) => E('path', { d, fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', style: `filter:drop-shadow(0 0 2px ${c})` });
const butterfly = (bx, by, c) => fill(EL(bx - 3, by, 3.4, 2.4, -30), c) + fill(EL(bx + 3, by, 3.4, 2.4, 30), c) + line(`M${bx},${by - 2} L${bx},${by + 2}`, K.ink, 1);
// A swag of wire under the awning, with something hanging at each of its eight dips.
const SWAG_X = [...Array(8)].map((_, i) => 90 + i * 32);
const swag = () => { let w = 'M74,104'; for (let i = 0; i < 8; i++) w += ` Q${80 + i * 32},112 ${106 + i * 32},104`; return line(w, K.ink, 1.2); };
const sideSwags = () => line('M70,104 Q40,118 10,112', K.ink, 1) + line('M330,104 Q350,112 366,104', K.ink, 1);
const SIDE_X = [[60, 109], [44, 113], [26, 114], [342, 107], [356, 107]];
// Pennants along the roof: "row" 1 hangs at the top of the band, row 2 a little lower and smaller.
// "gap" leaves out flags where something (like shop lettering) needs to show.
function pennants(row, cols, shape = 'tri', gap = () => false) {
  const [x0, x1, y0, n, w, h, dip] = row === 1 ? [60, 340, 48, 14, 6, 11, 6] : [70, 330, 56, 13, 4, 7, 5];
  let b = line(`M${x0},${y0} Q${(x0 + 200) / 2},${y0 + 12} 200,${y0 + 2} Q${(x1 + 200) / 2},${y0 + 12} ${x1},${y0}`, K.ink, row === 1 ? 1.2 : .9);
  for (let i = 0; i < n; i++) {
    const x = x0 + (row === 1 ? 6 : 8) + i * 20, y = y0 + 2 + Math.sin((i / (n - 1)) * Math.PI) * dip;
    const c = cols[i % cols.length];
    if (gap(x)) continue;
    b += shape === 'papel'
      ? fill(P(`M${x - w - 1},${y} L${x + w + 1},${y} L${x + w + 1},${y + h} Q${x + w / 2},${y + h - 3} ${x},${y + h} Q${x - w / 2},${y + h - 3} ${x - w - 1},${y + h} Z`), c) +
        fill(C(x, y + h * .45, 1.4), '#fff', { opacity: .7 })
      : fill(P(`M${x - w},${y} L${x + w},${y} L${x},${y + h} Z`), c);
  }
  return b;
}
const roofFlags = (c1, c2, tri = true) => [60, 340].map(x => line(`M${x},44 L${x},16`, '#7a4b3a', 2) + (tri
  ? fill(P(`M${x},16 L${x + (x < 200 ? 18 : -18)},21 L${x},26 Z`), x < 200 ? c1 : c2)
  : (x < 200 ? [0, 1, 2] : [2, 1, 0]).map((k, j) => fill(R(x < 200 ? x + j * 6 : x - 18 + j * 6, 16, 6, 11), ['#3f9b3c', '#fffaf0', '#d7372a'][x < 200 ? j : 2 - j])).join(''))).join('');

export function restaurantSvg(has, opts = {}) {
  const style = DRAW[opts.style] ? opts.style : 'deli';
  const wallColour = has.has('paint') ? (opts.paint || '#ffd9b8') : (opts.baseWall || '#f3ead8');
  const signText = opts.sign || 'Kitchen';
  const signW = Math.max(128, signText.length * 11.5 + 24) + (style === 'deli' ? 0 : 24), signX = 200 - signW / 2;
  const awn = opts.awning || K.eggplant;
  const grey = Math.max(0, 1 - (opts.colour ?? 1));
  const glow = 'filter:drop-shadow(0 0 1.5px #5b2c6f) drop-shadow(0 0 1.5px #5b2c6f) drop-shadow(0 0 6px #b57fd0)';
  const part = (id, inner) => {
    if (!inner) return '';
    if (id === 'base') return grey ? `<g style="filter:grayscale(${grey.toFixed(2)})">${inner}</g>` : inner;
    return opts.focus === id ? `<g style="${glow}">${inner}</g>` : `<g>${inner}</g>`;
  };
  // Each upgrade has three levels (opts.lv); "up" draws an upgrade at its level.
  const L = id => opts.lv?.[id] || (has.has(id) ? 1 : 0);
  const up = (id, fn) => { const n = L(id); return n ? part(id, fn(n)) : ''; };
  const lit = has.has('oven');
  const D = DRAW[style];
  const ctx = { awn, lit, wallColour, has };

  let s = part('base', fill(C(336, 34, 26), '#f7c873'));
  s += up('oven', n => D.chimney(n, ctx));
  s += up('rooftop', n => D.rooftop(n, ctx));
  s += part('base', fill(R(-10, 184, 420, 40), '#e3c79a'));
  // the walls (painted once the paint upgrade is bought)
  const wall = body(R(70, 56, 260, 130), wallColour, -16, 0, .14) + fill(R(70, 176, 260, 10), '#000', { opacity: .06 });
  s += has.has('paint') ? part('paint', wall) : part('base', wall);
  s += part('base', D.wallBase(ctx));
  s += up('paint', n => D.paint(n, ctx));
  s += part('base', D.roof(ctx));
  s += up('bunting', n => D.bunting(n, ctx));
  s += part('base', D.sign(signX, signW, signText));
  s += up('awning', n => D.awning(n, ctx));
  for (const x of [92, 252]) {
    s += part('base', D.window(x, ctx));
    if (x === 92) s += up('display', n => D.display(n, x, ctx));
    if (x === 252) s += up('neon', n => D.neon(n, x, ctx));
    s += part('base', shine(P(`M${x + 8},164 L${x + 30},116 L${x + 40},116 L${x + 18},164 Z`), .35) + D.mullions(x, ctx));
    s += has.has('tulips') ? up('tulips', n => D.boxes(n, x, ctx)) : part('base', fill(R(x - 4, 166, 84, 5, 2), '#e3c79a'));
  }
  s += part('base', D.door(ctx));
  s += up('trees', n => D.trees(n, ctx));
  s += up('lights', n => D.lights(n, ctx));
  s += up('bench', n => D.bench(n, ctx));
  const decor = new Set(opts.decor || []);
  for (const [id, d] of Object.entries(DECOR)) if (decor.has(id)) s += part(`decor-${id}`, d.draw(style));
  s += up('patio', n => D.patio(n, ctx));
  return `<svg viewBox="0 -4 400 204" role="img" aria-label="${(opts.sign || 'Your restaurant').replace(/"/g, '')}">${s}</svg>`;
}

// ----- the three styles -----
const DELI = {
  chimney: n => {
    let c = fill(R(298, 14, 22, 34, 3), '#c9372a') + fill(R(296, 12, 26, 6, 2), '#a92b1d') +
      [22, 30, 38].map((y, i) => line(`M298,${y} L320,${y} M${i % 2 ? 304 : 309},${y} L${i % 2 ? 304 : 309},${y + 8}`, '#a92b1d', .8)).join('') +
      fill(C(306, 6, 6), '#fff', { opacity: .75 }) + fill(C(316, 0, 5), '#fff', { opacity: .6 });
    if (n >= 2) c += fill(R(295, 10, 28, 4, 2), '#b5773a') + fill(C(300, -2, 4), '#fff', { opacity: .55 }) + fill(C(322, -1, 4.5), '#fff', { opacity: .5 });
    if (n >= 3) c += fill(C(309, 30, 8), '#e2a24a') + fill(C(309, 30, 2.8), '#c9372a') + shine(EL(306, 26.5, 3, 1.6, -30), .5) +
      [[304, 31], [312, 26], [313, 33], [307, 35]].map(([x, y]) => fill(EL(x, y, .9, .5), '#fff3dc')).join('') + sparkle(320, 22, 3.5, '#fff7c2');
    return c;
  },
  rooftop: n => {
    let r = '';
    for (const [x0, x1] of [[66, 130], [270, 292]]) {
      r += fill(R(x0, 34, x1 - x0, 10, 3), '#b5773a');
      for (let x = x0 + 6; x < x1 - 2; x += 10) r += fill(C(x, 32, 6), x % 20 < 10 ? K.leaf : '#5fb35a');
      for (let x = x0 + 10; x < x1 - 4; x += 20) r += line(`M${x},34 L${x},24`, K.leaf, 1.6) + tulip(x, 21, .45, K.tulip);
    }
    if (n >= 2) r += E('path', { d: 'M80,34 L80,14 Q98,0 116,14 L116,34', fill: 'none', stroke: '#b5773a', 'stroke-width': 2.4 }) +
      [[80, 26], [80, 18], [86, 10], [98, 6], [110, 10], [116, 18], [116, 26]].map(([x, y], i) => fill(P(leaf(x, y, i * 50, 7, 3)), K.leaf) + (i % 2 ? tulip(x, y - 1, .3, '#8b55a6') : '')).join('');
    if (n >= 3) r += [272, 281, 290].map((x, i) => line(`M${x},34 L${x},${12 - i * 2}`, K.leaf, 1.6) +
      [0, 72, 144, 216, 288].map(a => fill(EL(x + Math.cos(a * Math.PI / 180) * 4, 10 - i * 2 + Math.sin(a * Math.PI / 180) * 4, 3, 1.6, a), '#f6c33e')).join('') + fill(C(x, 10 - i * 2, 2.4), '#7a4b3a')).join('') +
      fill(EL(132, 22, 3, 2), '#8b55a6') + fill(EL(127, 20, 2.4, 1.6), '#e8475f');
    return r;
  },
  // A red brick base below the windows, like an old corner bakery.
  wallBase: () => fill(R(70, 171, 260, 15), '#b8483a') + [176, 181].map(y => line(`M70,${y} L330,${y}`, '#9a3a2e', .8)).join('') +
    [...Array(26)].map((_, i) => line(`M${80 + i * 10 - (i % 2) * 5},171 L${80 + i * 10 - (i % 2) * 5},176 M${75 + i * 10},181 L${75 + i * 10},186`, '#9a3a2e', .7)).join(''),
  paint: n => {
    let p = '';
    if (n >= 2) p += [...Array(23)].map((_, i) => fill(R(64 + i * 12, 63, 6, 4), '#fff3dc')).join('');
    if (n >= 3) p += [...Array(26)].map((_, i) => fill(R(70 + i * 10, 171, 10, 15), [K.teal, '#fff3dc', K.tulip, '#fff3dc'][i % 4], { opacity: .9 })).join('') +
      fill(R(70, 56, 6, 115), K.gold, { opacity: .8 }) + fill(R(324, 56, 6, 115), K.gold, { opacity: .8 });
    return p;
  },
  roof: () => fill(R(58, 44, 284, 20, 4), K.eggplant) +
    E('text', { x: 98, y: 59, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 9, fill: '#f6c33e', 'letter-spacing': 1 }, 'BAKERY') +
    E('text', { x: 302, y: 59, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 9, fill: '#f6c33e', 'letter-spacing': 1 }, 'DELI'),
  // The flags part around the BAKERY and DELI lettering on the roof.
  bunting: n => {
    const letters = x => (x > 70 && x < 126) || (x > 280 && x < 324);
    return pennants(1, [K.tulip, '#fff3dc'], 'tri', letters) + (n >= 2 ? pennants(2, ['#f6b62e', '#6cc6e0', '#8b55a6'], 'tri', letters) : '') + (n >= 3 ? roofFlags(K.tulip, '#f6b62e') : '');
  },
  sign: (x, w, t) => fill(R(x, 8, w, 40, 10), K.eggplant) + E('rect', { x: x + 4, y: 12, width: w - 8, height: 32, rx: 7, fill: 'none', stroke: '#f6c33e', 'stroke-width': 1.2, opacity: .8 }) +
    E('text', { x: 200, y: 36, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': t.length > 10 ? 19 : 23, fill: '#fff3dc' }, t),
  awning: (n, { awn }) => {
    let a = '';
    for (let i = 0; i < 10; i++) {
      const x = 80 + i * 24;
      a += fill(P(`M${x},70 L${x + 24},70 L${x + 24},94 Q${x + 12},108 ${x},94 Z`), i % 2 ? '#fff3dc' : awn);
    }
    a += fill(R(76, 66, 248, 8, 3), awn) + fill(R(70, 100, 260, 7), K.shadow, { opacity: .14 });
    if (n >= 3) a += [...Array(5)].map((_, i) => tulip(80 + (i * 2 + 1) * 24 + 12, 86, .5, K.tulip)).join('');
    if (n >= 2) a += fill(R(74, 64, 252, 4, 2), K.gold) + [...Array(10)].map((_, i) => line(`M${92 + i * 24},101 L${92 + i * 24},106`, K.goldDark, 1) + fill(C(92 + i * 24, 107, 2.2), K.gold)).join('');
    return a;
  },
  window: (x, { lit }) => fill(R(x - 2, 110, 80, 60, 5), '#7a4b3a') + fill(R(x, 112, 76, 56, 4), lit ? '#ffd77a' : '#bfe0e6') +
    (lit ? fill(R(x + 8, 118, 60, 44, 3), '#fff2b8', { opacity: .75 }) : ''),
  mullions: x => line(`M${x + 38},113 L${x + 38},167 M${x + 1},140 L${x + 75},140`, '#fff3dc', 3),
  // Bagels, a braided challah, then a cake stand, then a "fresh today" banner.
  display: (n, x) => {
    let d = fill(R(x + 4, 148, 68, 4, 1), '#b5773a');
    for (const bx of [x + 12, x + 24]) d += fill(EL(bx, 143, 6, 4.6), '#d98d3e') + fill(EL(bx, 142.5, 2, 1.3), '#7a4b3a') + shine(EL(bx - 2, 140.5, 2.4, 1, -10), .45);
    d += [0, 1, 2].map(k => fill(EL(x + 36 + k * 6, 143 - (k === 1 ? 1 : 0), 4.6, 4), '#e6a24a')).join('') + line(`M${x + 33},141 Q${x + 42},138 ${x + 51},141`, '#b5702a', .9);
    if (n >= 2) d += fill(R(x + 61, 142, 4, 6), '#b5773a') + fill(R(x + 55, 136, 16, 6, 2), '#fff1cf') + fill(R(x + 57, 130, 12, 6, 2), '#f9d6e2') +
      fill(R(x + 59, 125, 8, 5, 2), '#fff1cf') + fill(C(x + 63, 124, 2.2), '#d7263d');
    if (n >= 3) d += fill(R(x + 4, 114, 68, 10, 3), K.eggplant) +
      E('text', { x: x + 38, y: 121.5, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 7.5, fill: '#fff3dc' }, 'FRESH TODAY') +
      [[x + 10, 131], [x + 46, 130], [x + 30, 134]].map(([sx, sy]) => sparkle(sx, sy, 4)).join('');
    return d;
  },
  neon: (n, x) => fill(R(x + 12, 118, 52, 18, 9), '#3d2a44') + neonText(x + 38, 132, 'OPEN', '#ff8fb0') +
    (n >= 2 ? E('rect', { x: x + 2, y: 114, width: 72, height: 52, rx: 4, fill: 'none', stroke: '#ff8fb0', 'stroke-width': 2, style: 'filter:drop-shadow(0 0 2px #ff8fb0)' }) : '') +
    (n >= 3 ? fill(R(x + 22, 139, 32, 26, 8), '#3d2a44') + neonPath(`M${x + 38},${144} a9,8 0 1,0 0.1,0 Z`, '#ffb347', 3.2) + neonPath(`M${x + 38},${149} a3,2.6 0 1,0 0.1,0 Z`, '#ffb347', 1.6) : ''),
  boxes: (n, x) => {
    let b = fill(R(x - 4, 166, 84, 14, 3), K.teal) + [0, 1, 2, 3, 4].map(j => {
      const tx = x + 8 + j * 15;
      return line(`M${tx},162 L${tx},170`, K.leaf, 2.2) + tulip(tx, 155, .72, j % 2 ? '#8b55a6' : K.tulip);
    }).join('');
    if (n >= 2) b += [0, 1, 2, 3].map(j => {
      const tx = x + 15 + j * 15;
      return tulip(tx, 160, .55, j % 2 ? '#f6c33e' : '#ff9ab3') + E('path', { d: `M${tx},180 q-3,5 0,9`, fill: 'none', stroke: K.leaf, 'stroke-width': 1.6 }) + fill(C(tx - 1.5, 185, 2), K.leaf);
    }).join('');
    if (n >= 3) b += butterfly(x + 6, 146, '#f6b62e') + butterfly(x + 70, 150, '#6cc6e0') +
      E('rect', { x: x - 4, y: 166, width: 84, height: 14, rx: 3, fill: 'none', stroke: K.gold, 'stroke-width': 1.6 });
    return b;
  },
  door: ({ lit }) => fill(P('M180,186 L180,127 Q180,112 200,112 Q220,112 220,127 L220,186 Z'), '#7a4b3a') +
    fill(P('M182,186 L182,128 Q182,114 200,114 Q218,114 218,128 L218,186 Z'), K.teal) +
    fill(C(200, 131, 7), lit ? '#fff2b8' : '#bfe0e6') + fill(C(211, 156, 2.6), K.gold) + fill(R(188, 160, 24, 18, 2), '#000', { opacity: .08 }),
  trees: n => {
    let t = fill(R(178, 184, 44, 6, 2), K.tulip) + [174, 226].map(tx =>
      fill(P(`M${tx - 7},172 L${tx + 7},172 L${tx + 5},186 L${tx - 5},186 Z`), '#c9772b') +
      line(`M${tx},172 L${tx},160`, '#7a4b3a', 2) + fill(C(tx, 154, 9), K.leaf) + fill(C(tx - 3, 151, 3), '#7cc46e')).join('');
    if (n >= 2) t += [174, 226].map(tx => fill(C(tx, 151, 12), K.leaf) + fill(C(tx - 4, 147, 4), '#7cc46e') +
      [[-6, -4], [5, -7], [7, 3], [-3, 6], [0, -1]].map(([dx, dy]) => fill(C(tx + dx, 151 + dy, 2), '#f6b3c8')).join('')).join('');
    if (n >= 3) t += [174, 226].map(tx => [0, 60, 120, 180, 240, 300].map(a =>
      glowDot(tx + Math.cos(a * Math.PI / 180) * 11, 151 + Math.sin(a * Math.PI / 180) * 11, 1.8, '#ffd34d')).join('') + fill(R(tx - 7, 177, 14, 3), K.gold)).join('');
    return t;
  },
  lights: n => {
    let l = swag() + SWAG_X.map(x => fill(C(x, 109, 6), '#ffd34d', { opacity: .35 }) + fill(C(x, 109, 2.8), '#ffd34d')).join('');
    if (n >= 2) l += SWAG_X.map((x, i) => fill(C(x + 16, 105, 2.4), ['#e8475f', '#6cc6e0', '#8b55a6', '#5fb34a'][i % 4])).join('');
    if (n >= 3) l += sideSwags() + SIDE_X.map(([x, y]) => glowDot(x, y, 2.6, '#ffd34d')).join('') + SWAG_X.map(x => fill(C(x, 109, 10), '#ffd34d', { opacity: .18 })).join('');
    return l;
  },
  bench: n => {
    let b = fill(R(8, 160, 52, 6, 2), '#b5773a') + fill(R(8, 170, 52, 5, 2), '#c98a4a') + fill(R(12, 175, 4, 10), '#7a4b3a') + fill(R(52, 175, 4, 10), '#7a4b3a');
    if (n >= 3) b += line('M34,160 L34,108', '#3a3a3a', 2.6) + fill(R(29, 100, 10, 10, 2), K.eggplant) + glowDot(34, 106, 3.4, '#ffd34d') +
      fill(EL(42, 118, 5, 3.4), '#b5773a') + tulip(40, 114, .35, K.tulip) + tulip(45, 114, .35, '#8b55a6');
    if (n >= 2) b += fill(R(12, 166, 18, 5, 2), K.tulip) + fill(R(36, 166, 18, 5, 2), K.teal) + fill(R(14, 154, 12, 7, 3), '#f6c33e') + fill(R(40, 154, 12, 7, 3), '#ff9ab3');
    return b;
  },
  patio: n => {
    let p = line('M366,118 L366,184', K.ink, 2.4) +
      [0, 1, 2, 3].map(i => fill(P(`M366,100 L${338 + i * 14},124 L${352 + i * 14},124 Z`), i % 2 ? '#fff3dc' : K.tulip)).join('') +
      fill(EL(366, 160, 20, 4.5), K.white) + line('M366,160 L366,184', K.ink, 2) + fill(R(340, 160, 8, 24, 2), K.teal) + fill(R(384, 160, 8, 24, 2), K.teal);
    if (n >= 2) p += fill(R(332, 178, 68, 8, 2), '#b5773a') + [338, 350, 362, 374, 386, 396].map((x, i) => fill(C(x, 176, 4.4), K.leaf) + (i % 2 ? tulip(x, 172, .35, K.tulip) : '')).join('');
    if (n >= 3) p += [338, 345, 352, 359, 366, 373, 380, 387, 394].map((x, i) => glowDot(x, 125, 1.8, ['#ffd34d', '#e8475f', '#6cc6e0'][i % 3])).join('') +
      fill(R(354, 150, 6, 10, 2), '#c96a3a') + tulip(357, 147, .4, '#8b55a6');
    return p;
  },
};

// La Cocina: stucco walls, a clay tile roof, turquoise trim and a bright pink door.
const TERRA = '#c8643a', TURQ = '#1f9e9a', FIESTA = ['#e8475f', '#f39a1e', '#f6c33e', '#1f9e9a', '#7b3fa0', '#5fb34a'];
const marigold = (x, y, r = 4.4) => fill(C(x, y, r), '#f39a1e') + fill(C(x - r * .3, y - r * .3, r * .55), '#f6c33e') + fill(C(x, y, r * .25), '#c8641e');
const cactus = (x, base, h, c = '#4fa64a') => fill(R(x - 4, base - h, 8, h, 4), c) + fill(R(x - 10, base - h + 8, 5, 9, 2.5), c) + fill(R(x - 10, base - h + 14, 8, 4, 2), c) +
  fill(R(x + 5, base - h + 4, 5, 9, 2.5), c) + fill(R(x + 2, base - h + 10, 8, 4, 2), c) + line(`M${x},${base - h + 3} L${x},${base - 2}`, '#3b8a37', .8);
const MEX = {
  chimney: n => {
    let c = fill(R(298, 14, 22, 34, 7), '#d9875a') + fill(R(296, 12, 26, 7, 3.5), '#b86a40') +
      fill(C(306, 6, 6), '#fff', { opacity: .75 }) + fill(C(316, 0, 5), '#fff', { opacity: .6 });
    if (n >= 2) c += [0, 1, 2].map(k => fill(R(300 + k * 6.4, 22, 5.6, 5.6, 1), k % 2 ? '#fffaf0' : '#2c6fb0') + fill(C(302.8 + k * 6.4, 24.8, 1.3), k % 2 ? '#2c6fb0' : '#fffaf0')).join('') +
      fill(C(300, -2, 4), '#fff', { opacity: .55 }) + fill(C(322, -1, 4.5), '#fff', { opacity: .5 });
    if (n >= 3) c += [...Array(10)].map((_, k) => { const a = k * 36 * Math.PI / 180; return line(`M${309 + Math.cos(a) * 7},${37 + Math.sin(a) * 7} L${309 + Math.cos(a) * 10.5},${37 + Math.sin(a) * 10.5}`, K.gold, 1.8); }).join('') +
      fill(C(309, 37, 6.5), K.gold) + fill(C(306.8, 36, .9), K.ink) + fill(C(311.2, 36, .9), K.ink) + line('M306.5,39 Q309,41 311.5,39', K.ink, .8) + sparkle(321, 26, 3.5, '#fff7c2');
    return c;
  },
  rooftop: n => {
    let r = '';
    for (const [x0, x1] of [[66, 130], [270, 292]]) {
      r += fill(R(x0, 34, x1 - x0, 10, 3), TERRA) + line(`M${x0 + 3},39 L${x1 - 3},39`, '#f6c33e', 1.2, { 'stroke-dasharray': '3 3' });
      for (let x = x0 + 6; x < x1 - 2; x += 10) r += fill(C(x, 32, 5.5), x % 20 < 10 ? K.leaf : '#5fb35a');
      for (let x = x0 + 8; x < x1 - 4; x += 10) r += fill(EL(x, 30, 1.4, 3.4, 20), '#d7263d');
    }
    if (n >= 2) r += E('path', { d: 'M80,34 L80,14 Q98,0 116,14 L116,34', fill: 'none', stroke: '#8a5a3a', 'stroke-width': 2.4 }) +
      [[80, 26], [80, 18], [86, 10], [98, 6], [110, 10], [116, 18], [116, 26]].map(([x, y], i) => fill(P(leaf(x, y, i * 50, 7, 3)), K.leaf) +
        fill(C(x + 2, y - 1, 2.6), '#d6338a') + (i % 2 ? fill(C(x - 2, y + 2, 2), '#f06bb3') : '')).join('');
    if (n >= 3) r += [272, 281, 290].map((x, i) => line(`M${x},34 L${x},${10 - i * 2}`, '#5f9e3a', 1.8) + fill(P(leaf(x, 24 - i, -150, 9, 2.4)), '#6db34a') + fill(P(leaf(x, 18 - i, -30, 9, 2.4)), '#6db34a') +
      fill(EL(x + 2.5, 15 - i * 2, 2.4, 5, 10), '#f6c33e') + line(`M${x + 2},${13 - i * 2} L${x + 3},${17 - i * 2}`, '#d9a12a', .7) + line(`M${x},${10 - i * 2} L${x - 2},${5 - i * 2} M${x},${10 - i * 2} L${x + 2},${5 - i * 2}`, '#c9a24a', .9)).join('');
    return r;
  },
  // A turquoise band painted along the bottom of the wall.
  wallBase: () => fill(R(70, 171, 260, 15), TURQ, { opacity: .9 }) + line('M70,171 L330,171', '#fffaf0', 1.4),
  paint: n => {
    let p = '';
    if (n >= 2) for (const x of [76, 324]) {
      p += line(`M${x},70 Q${x + (x < 200 ? 3 : -3)},120 ${x},168`, K.leaf, 1.6);
      for (let y = 76; y < 168; y += 13) p += fill(P(leaf(x, y, x < 200 ? -20 : 200, 6, 2.4)), K.leaf) + fill(C(x + (x < 200 ? 2 : -2), y + 6, 2.6), y % 26 < 13 ? '#e8475f' : '#f6c33e') + fill(C(x + (x < 200 ? 2 : -2), y + 6, .9), '#fff3dc');
    }
    if (n >= 3) {
      p += [...Array(26)].map((_, i) => fill(R(70 + i * 10, 171, 10, 15), '#fffaf0') + E('rect', { x: 70 + i * 10, y: 171, width: 10, height: 15, fill: 'none', stroke: '#2c6fb0', 'stroke-width': .8 }) +
        fill(C(75 + i * 10, 178.5, 2.6), i % 2 ? '#2c6fb0' : '#f39a1e') + fill(C(75 + i * 10, 178.5, 1), '#fffaf0')).join('');
      p += E('path', { d: 'M177,186 L177,126 Q177,108 200,108 Q223,108 223,126 L223,186', fill: 'none', stroke: '#2c6fb0', 'stroke-width': 5, 'stroke-dasharray': '4 3' });
    }
    return p;
  },
  // Clay barrel tiles along the roof.
  roof: () => fill(R(58, 46, 284, 18, 3), TERRA) + fill(R(58, 44, 284, 5, 2), '#a84f2c') +
    [...Array(24)].map((_, i) => fill(EL(64 + i * 12, 61, 6, 4.5), i % 2 ? '#d97b4a' : '#cf6e3f') + line(`M${64 + i * 12},49 L${64 + i * 12},58`, '#a84f2c', .8)).join(''),
  bunting: n => pennants(1, FIESTA, 'papel') + (n >= 2 ? pennants(2, ['#fffaf0', '#f06bb3', '#6cc6e0', '#f6c33e'], 'papel') : '') + (n >= 3 ? roofFlags('#e8475f', '#1f9e9a') : ''),
  sign: (x, w, t) => fill(R(x, 8, w, 40, 10), '#e8475f') + E('rect', { x: x + 3, y: 11, width: w - 6, height: 34, rx: 8, fill: 'none', stroke: '#f6c33e', 'stroke-width': 2, 'stroke-dasharray': '5 3' }) +
    [x + 12, x + w - 12].map(fx => marigold(fx, 28, 4)).join('') +
    E('text', { x: 200, y: 36, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': t.length > 10 ? 19 : 23, fill: '#fff3dc' }, t),
  // A sarape awning: stripes of colour, then a scalloped edge.
  awning: (n, { awn }) => {
    const stripes = [awn, '#f6c33e', '#fffaf0', TURQ, awn, '#f39a1e', '#7b3fa0', awn];
    let a = fill(R(76, 66, 248, 6, 3), awn);
    stripes.forEach((c, i) => { a += fill(R(78, 70 + i * 3.4, 244, 3.6), c); });
    for (let i = 0; i < 10; i++) a += fill(P(`M${80 + i * 24},97 L${104 + i * 24},97 Q${92 + i * 24},110 ${80 + i * 24},97 Z`), i % 2 ? '#f6c33e' : awn);
    a += fill(R(70, 100, 260, 7), K.shadow, { opacity: .12 });
    if (n >= 2) a += [...Array(10)].map((_, i) => line(`M${92 + i * 24},103 L${92 + i * 24},107`, K.ink, .7) + fill(C(92 + i * 24, 109, 3), FIESTA[i % FIESTA.length])).join('');
    if (n >= 3) a += [...Array(12)].map((_, k) => { const g = k * 30 * Math.PI / 180; return line(`M${200 + Math.cos(g) * 9},${83 + Math.sin(g) * 9} L${200 + Math.cos(g) * 14},${83 + Math.sin(g) * 14}`, K.gold, 2); }).join('') +
      fill(C(200, 83, 9), K.gold) + fill(C(200, 83, 6.5), '#ffd34d') + fill(C(197, 82, 1), K.ink) + fill(C(203, 82, 1), K.ink) + line('M197,86 Q200,88.5 203,86', K.ink, .9);
    return a;
  },
  window: (x, { lit }) => fill(P(`M${x - 6},172 L${x - 6},116 Q${x + 38},94 ${x + 82},116 L${x + 82},172 Z`), TURQ) +
    fill(P(`M${x},168 L${x},118 Q${x + 38},102 ${x + 76},118 L${x + 76},168 Z`), lit ? '#ffd77a' : '#bfe0e6') +
    (lit ? fill(R(x + 8, 120, 60, 42, 3), '#fff2b8', { opacity: .75 }) : ''),
  mullions: x => line(`M${x + 38},110 L${x + 38},167 M${x + 1},140 L${x + 75},140`, '#fffaf0', 2.6),
  // Pan dulce (conchas), a jar of churros, then a star piñata.
  display: (n, x) => {
    let d = fill(R(x + 4, 148, 68, 4, 1), '#8a5a3a');
    for (const [bx, c] of [[x + 12, '#f7b6c8'], [x + 27, '#f6d27a'], [x + 42, '#c9874a']]) {
      d += fill(P(`M${bx - 7},148 Q${bx - 7},138 ${bx},138 Q${bx + 7},138 ${bx + 7},148 Z`), '#e2a24a') + fill(P(`M${bx - 6},145 Q${bx - 6},138.5 ${bx},138.5 Q${bx + 6},138.5 ${bx + 6},145 Z`), c) +
        line(`M${bx - 4},142 L${bx},139.5 L${bx + 4},142 M${bx - 5},145 L${bx},141.5 L${bx + 5},145`, '#fff', .7, { opacity: .7 });
    }
    if (n >= 2) d += [x + 59, x + 63, x + 67].map((cx, i) => line(`M${cx},146 L${cx + (i - 1)},${120 - (i % 2) * 3}`, '#c9772b', 2.4) + line(`M${cx},146 L${cx + (i - 1)},${120 - (i % 2) * 3}`, '#e9a35a', .8)).join('') +
      fill(R(x + 56, 128, 14, 20, 3), '#d8f0f6', { opacity: .75 }) + fill(R(x + 55, 126, 16, 4, 2), '#e8475f');
    if (n >= 3) {
      d += line(`M${x + 30},113 L${x + 30},118`, K.ink, .8);
      const sx = x + 30, sy = 125;
      d += fill(C(sx, sy, 5), '#f6c33e') + [0, 72, 144, 216, 288].map((a, k) => { const g = (a - 90) * Math.PI / 180;
        return fill(P(`M${sx + Math.cos(g - .35) * 4},${sy + Math.sin(g - .35) * 4} L${sx + Math.cos(g) * 10},${sy + Math.sin(g) * 10} L${sx + Math.cos(g + .35) * 4},${sy + Math.sin(g + .35) * 4} Z`), FIESTA[k]) +
          line(`M${sx + Math.cos(g) * 10},${sy + Math.sin(g) * 10} l0,4`, FIESTA[(k + 2) % 6], 1.2); }).join('') + fill(C(sx, sy, 2), '#fffaf0');
    }
    return d;
  },
  neon: (n, x) => fill(R(x + 10, 118, 56, 18, 9), '#3d2a44') + neonText(x + 38, 132, 'TACOS', '#ffd34d', 12) +
    (n >= 2 ? E('rect', { x: x + 2, y: 114, width: 72, height: 52, rx: 4, fill: 'none', stroke: '#6cf0e0', 'stroke-width': 2, style: 'filter:drop-shadow(0 0 2px #6cf0e0)' }) : '') +
    (n >= 3 ? fill(R(x + 22, 139, 32, 26, 8), '#3d2a44') + neonPath(`M${x + 31},146 Q${x + 27},158 ${x + 46},161 Q${x + 35},155 ${x + 36},146 Z`, '#ff5a3c', 2.2) + neonPath(`M${x + 33.5},146 Q${x + 33},142 ${x + 38},141`, '#7be07b', 2) : ''),
  boxes: (n, x) => {
    let b = '';
    if (n >= 2) for (const vx of [x - 6, x + 82]) for (let y = 120; y < 166; y += 8) b += fill(P(leaf(vx, y, vx < x ? 110 : 70, 6, 2.4)), K.leaf) + fill(C(vx + (y % 16 ? 2 : -2), y + 2, 2.8), y % 16 ? '#d6338a' : '#f06bb3');
    b += fill(R(x - 4, 166, 84, 14, 3), TERRA) + line(`M${x},173 l6,-4 6,4 6,-4 6,4 6,-4 6,4 6,-4 6,4 6,-4 6,4 6,-4 6,4`, '#f6c33e', 1.2) +
      [0, 1, 2, 3, 4].map(j => { const tx = x + 8 + j * 15; return line(`M${tx},158 L${tx},168`, K.leaf, 2) + fill(P(leaf(tx, 164, -140, 6, 2.2)), K.leaf) + marigold(tx, 157, j % 2 ? 4 : 5); }).join('');
    if (n >= 3) for (const [bx, by, f] of [[x + 4, 146, 1], [x + 72, 138, -1]]) {
      b += fill(EL(bx, by, 4.5, 2.6, f * -15), '#1f9e9a') + fill(EL(bx + f * -1, by - 3, 3.6, 1.6, f * -60), '#6cf0e0', { opacity: .8 }) +
        fill(C(bx + f * 4, by - 1.4, 1.8), '#1f9e9a') + line(`M${bx + f * 5.5},${by - 1.6} L${bx + f * 10},${by - .4}`, K.ink, .8) + fill(P(`M${bx + f * -4},${by + 1} L${bx + f * -8},${by + 3} L${bx + f * -7},${by} Z`), '#7b3fa0') + fill(C(bx + f * 4.6, by - 2, .5), K.ink);
    }
    return b;
  },
  door: ({ lit }) => fill(P('M177,186 L177,126 Q177,108 200,108 Q223,108 223,126 L223,186 Z'), TURQ) +
    fill(P('M182,186 L182,128 Q182,114 200,114 Q218,114 218,128 L218,186 Z'), '#e8475f') +
    line('M200,124 L200,186', '#c93a50', 1.2) + E('rect', { x: 186, y: 140, width: 10, height: 18, rx: 2, fill: 'none', stroke: '#c93a50', 'stroke-width': 1.2 }) +
    E('rect', { x: 204, y: 140, width: 10, height: 18, rx: 2, fill: 'none', stroke: '#c93a50', 'stroke-width': 1.2 }) +
    fill(P('M188,128 Q200,116 212,128 Z'), lit ? '#fff2b8' : '#bfe0e6') + fill(C(197, 166, 2.2), K.gold) + fill(C(203, 166, 2.2), K.gold),
  trees: n => {
    let t = [168, 232].map(tx => cactus(tx, 172, 26) + fill(P(`M${tx - 9},170 L${tx + 9},170 L${tx + 6},186 L${tx - 6},186 Z`), TERRA) + fill(R(tx - 10, 168, 20, 4, 2), '#a84f2c') +
      line(`M${tx - 6},178 l3,-2 3,2 3,-2 3,2`, '#f6c33e', 1)).join('');
    if (n >= 2) t += [168, 232].map(tx => [[tx, 145], [tx - 8, 154], [tx + 8, 150]].map(([fx, fy]) => fill(C(fx, fy - 1, 2.8), '#f06bb3') + fill(C(fx, fy - 1, 1), '#f6c33e')).join('')).join('');
    if (n >= 3) t += [168, 232].map(tx => [[tx - 2, 152], [tx + 2, 160], [tx - 2, 166], [tx - 8, 160], [tx + 8, 156]].map(([lx, ly]) => glowDot(lx, ly, 1.5, '#ffd34d')).join('')).join('');
    return t;
  },
  // Round paper lanterns.
  lights: n => {
    const cols = n >= 2 ? FIESTA : ['#e8475f', '#f39a1e'];
    const lantern = (x, y, c, r = 5) => line(`M${x},${y - r - 3} L${x},${y - r}`, K.ink, .8) + fill(EL(x, y, r, r * 1.15), c) + fill(R(x - r * .6, y - r * 1.2, r * 1.2, 2, 1), '#3a2a2a', { opacity: .6 }) +
      line(`M${x - r},${y} L${x + r},${y}`, '#fff', .6, { opacity: .5 }) + fill(EL(x - r * .35, y - r * .3, r * .3, r * .5), '#fff', { opacity: .35 });
    let l = swag() + SWAG_X.map((x, i) => lantern(x, 114, cols[i % cols.length])).join('');
    if (n >= 3) l += sideSwags() + SIDE_X.map(([x, y], i) => lantern(x, y + 5, FIESTA[(i + 3) % 6], 4)).join('');
    return l;
  },
  bench: n => {
    let b = fill(R(8, 160, 52, 6, 2), TURQ) + fill(R(8, 170, 52, 5, 2), TURQ) + line('M10,163 L58,163 M10,172.5 L58,172.5', '#e8475f', 1.4) +
      fill(R(12, 175, 4, 10), '#167a76') + fill(R(52, 175, 4, 10), '#167a76');
    if (n >= 2) b += ['#e8475f', '#f6c33e', '#fffaf0', TURQ, '#7b3fa0', '#f39a1e'].map((c, i) => fill(R(16 + i * 3, 158, 3, 18), c)).join('') + line('M16,176 l0,3 M22,176 l0,3 M28,176 l0,3 M32,176 l0,3', K.ink, .6);
    if (n >= 3) b += line('M44,176 L36,146', '#7a4b3a', 2.4) + fill(EL(47, 177, 7.5, 6.5, -20), '#d98d3e') + fill(EL(43, 168, 5.5, 4.8, -20), '#d98d3e') +
      fill(C(45, 172.5, 2), '#5a3324') + fill(R(34, 142, 5, 6, 1.5), '#5a3324') + line('M38,147 L46,174', '#fffaf0', .5, { opacity: .7 });
    return b;
  },
  // A palapa: a straw umbrella with a fringe.
  patio: n => {
    let p = line('M366,112 L366,184', '#8a5a3a', 2.6) + fill(P('M366,96 L332,122 L400,122 Z'), '#d9a64a') +
      line('M366,96 L346,122 M366,96 L386,122', '#b8862f', 1) + line('M332,122 l3,5 3,-5 3,5 3,-5 3,5 3,-5 3,5 3,-5 3,5 3,-5 3,5 3,-5 3,5 3,-5 3,5 3,-5 3,5 3,-5 3,5 3,-5 3,5 3,-5', '#b8862f', 1.2) +
      fill(EL(366, 160, 20, 4.5), '#f6c33e') + E('ellipse', { cx: 366, cy: 160, rx: 20, ry: 4.5, fill: 'none', stroke: '#e8475f', 'stroke-width': 1.2, 'stroke-dasharray': '3 2' }) +
      line('M366,160 L366,184', '#8a5a3a', 2) + fill(R(340, 166, 9, 18, 2), '#e8475f') + fill(R(383, 166, 9, 18, 2), TURQ);
    if (n >= 2) p += fill(R(332, 178, 68, 8, 2), TERRA) + [340, 360, 380, 396].map(x => cactus(x, 179, 14, '#5fb34a')).join('');
    if (n >= 3) p += line('M334,124 Q350,132 366,126 Q382,132 398,124', K.ink, .8) + [341, 352, 366, 380, 391].map((x, i) => fill(EL(x, 131, 3, 3.6), FIESTA[i])).join('');
    return p;
  },
};

// The trattoria: warm plaster, a clay tile roof, stone around the windows and a wooden door.
const STONE = '#efe2c4', ITALY = ['#3f9b3c', '#fffaf0', '#d7372a'];
const lemon = (x, y, s = 1) => fill(EL(x, y, 3 * s, 2.2 * s, -20), '#f6d23e') + fill(EL(x - .8 * s, y - .6 * s, 1 * s, .6 * s, -20), '#fff', { opacity: .5 });
const ROME = {
  chimney: n => {
    let c = fill(R(298, 14, 22, 34, 3), '#b8664a') + [20, 28, 36, 44].map((y, i) => fill(R(298, y, 22, 2), STONE, { opacity: i % 2 ? .4 : .7 })).join('') +
      fill(P('M295,15 L323,15 L319,9 L299,9 Z'), '#8f4a33') + fill(C(306, 4, 6), '#fff', { opacity: .75 }) + fill(C(316, -2, 5), '#fff', { opacity: .6 });
    if (n >= 2) c += fill(P('M299,9 Q309,1 319,9 Z'), '#8f4a33') + fill(C(300, -6, 4), '#fff', { opacity: .55 }) + fill(C(322, -5, 4.5), '#fff', { opacity: .5 });
    if (n >= 3) c += fill(C(309, 31, 8.5), K.gold) + fill(C(309, 31, 6.8), '#f6c24a') + fill(C(309, 31, 5.6), '#e2412f', { opacity: .85 }) +
      [[306, 28], [312, 29], [308, 34], [313, 34]].map(([x, y]) => fill(C(x, y, 1.4), '#a92b1d')).join('') + fill(EL(305, 33, 1, 1.6), K.leaf) + line('M309,25 L309,37 M303,31 L315,31', '#f6c24a', .6) + sparkle(321, 22, 3.5, '#fff7c2');
    return c;
  },
  rooftop: n => {
    let r = '';
    for (const [x0, x1] of [[66, 130], [270, 292]]) {
      for (let x = x0 + 6; x < x1 - 2; x += 11) r += fill(P(`M${x - 5},34 L${x + 5},34 L${x + 4},43 L${x - 4},43 Z`), '#c8643a') + fill(C(x - 1.5, 30, 4), '#5fc24a') + fill(C(x + 2, 31, 3.5), '#3f9b3c') + fill(C(x, 27.5, 3), '#7cd65e');
    }
    if (n >= 2) r += E('path', { d: 'M80,34 L80,8 L116,8 L116,34 M80,21 L116,21 M92,8 L92,34 M104,8 L104,34', fill: 'none', stroke: '#b5773a', 'stroke-width': 1.8 }) +
      [[82, 28], [86, 14], [96, 24], [100, 11], [110, 17], [114, 29], [92, 30]].map(([x, y], i) => fill(P(leaf(x, y, i * 70, 6, 2.6)), K.leaf) + (i % 2 ? '' : fill(C(x + 2, y + 2, 2.6), '#e2412f') + shine(C(x + 1.2, y + 1.2, .8), .5))).join('');
    if (n >= 3) r += [272, 282, 292].map((x, i) => line(`M${x},34 L${x},${20 - i}`, '#7a4b3a', 1.8) + fill(C(x, 16 - i, 6), '#3f8a3a') + fill(C(x - 2, 14 - i, 3), '#5fae4a') + lemon(x - 2, 19 - i, .7) + lemon(x + 3, 15 - i, .7)).join('');
    return r;
  },
  // A stone base along the bottom of the wall.
  wallBase: () => fill(R(70, 171, 260, 15), STONE) + line('M70,171 L330,171', '#d9c9a4', 1.2) +
    [...Array(13)].map((_, i) => line(`M${90 + i * 20},171 L${90 + i * 20},186`, '#d9c9a4', .9)).join(''),
  paint: n => {
    let p = '';
    if (n >= 2) for (const x of [70, 320]) for (let k = 0; k < 9; k++) p += fill(R(k % 2 ? x : x + (x < 200 ? 0 : -2), 70 + k * 11.2, k % 2 ? 8 : 10, 10, 1), STONE) + fill(R(k % 2 ? x : x + (x < 200 ? 0 : -2), 79 + k * 11.2, k % 2 ? 8 : 10, 1, .5), '#d9c9a4');
    if (n >= 3) p += [...Array(26)].map((_, i) => fill(R(70 + i * 10, 171, 10, 15), '#fffaf0') + E('rect', { x: 70.5 + i * 10, y: 171.5, width: 9, height: 14, fill: 'none', stroke: '#2b4a7a', 'stroke-width': .8 }) +
      (i % 2 ? lemon(75 + i * 10, 178.5, .9) + fill(P(leaf(73 + i * 10, 176, -60, 3.4, 1.4)), K.leaf) : fill(C(75 + i * 10, 178.5, 2.2), '#2b4a7a') + fill(C(75 + i * 10, 178.5, .9), '#fffaf0'))).join('');
    return p;
  },
  // A stone cornice and curved clay roof tiles.
  roof: () => fill(R(58, 44, 284, 7, 2), STONE) + fill(R(62, 51, 276, 11), '#c8643a') +
    [...Array(35)].map((_, i) => line(`M${66 + i * 8},51 L${66 + i * 8},62`, '#a84f2c', 1.4)).join('') +
    [...Array(35)].map((_, i) => fill(EL(66 + i * 8, 62, 3.6, 2), '#d97b4a')).join('') + fill(R(62, 63, 276, 3), STONE),
  bunting: n => pennants(1, ITALY) + (n >= 2 ? pennants(2, ITALY) : '') + (n >= 3 ? roofFlags(0, 0, false) : ''),
  sign: (x, w, t) => fill(R(x, 8, w, 40, 6), '#2f6e25') + E('rect', { x: x + 3.5, y: 11.5, width: w - 7, height: 33, rx: 4, fill: 'none', stroke: K.gold, 'stroke-width': 1.6 }) +
    [x + 10, x + w - 10].map(lx => lemon(lx, 28, 1.1) + fill(P(leaf(lx - 1, 25, -70, 5, 2)), '#7cd65e')).join('') +
    E('text', { x: 200, y: 36, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': t.length > 10 ? 19 : 22, fill: '#fff3dc' }, t),
  // A striped awning with a round scalloped edge.
  awning: (n, { awn }) => {
    let a = '';
    for (let i = 0; i < 10; i++) {
      const x = 80 + i * 24;
      a += fill(P(`M${x},70 L${x + 24},70 L${x + 24},94 L${x},94 Z`), i % 2 ? '#fffaf0' : awn);
      a += fill(P(`M${x},94 L${x + 24},94 Q${x + 18},104 ${x + 12},94 Q${x + 6},104 ${x},94 Z`), awn);
    }
    a += fill(R(76, 66, 248, 6, 3), awn) + fill(R(78, 92, 244, 3), '#fffaf0', { opacity: .7 }) + fill(R(70, 100, 260, 7), K.shadow, { opacity: .12 });
    if (n >= 2) a += fill(R(74, 64, 252, 4, 2), K.gold) + [...Array(20)].map((_, i) => line(`M${86 + i * 12},${99} L${86 + i * 12},103`, K.goldDark, .8) + fill(C(86 + i * 12, 104, 1.8), K.gold)).join('');
    if (n >= 3) a += [...Array(5)].map((_, i) => { const lx = 80 + (i * 2 + 1) * 24 + 12; return lemon(lx, 82, 1.6) + fill(P(leaf(lx + 2, 78, -50, 6, 2.4)), K.leaf); }).join('');
    return a;
  },
  window: (x, { lit }) => fill(R(x - 5, 108, 86, 64, 3), STONE) + fill(P(`M${x + 32},106 L${x + 44},106 L${x + 42},114 L${x + 34},114 Z`), '#d9c9a4') +
    fill(R(x, 112, 76, 56, 2), lit ? '#ffd77a' : '#bfe0e6') + (lit ? fill(R(x + 8, 118, 60, 44, 3), '#fff2b8', { opacity: .75 }) : '') +
    line(`M${x - 4},171 L${x + 80},171`, '#3a3a3a', 1.6),
  mullions: x => line(`M${x + 38},113 L${x + 38},167 M${x + 1},134 L${x + 75},134`, '#4a6b3a', 2.4),
  // Fresh pasta, a gelato counter, then a "fatto a mano" (handmade) sign.
  display: (n, x) => {
    let d = fill(R(x + 4, 148, 68, 4, 1), '#8a5a3a');
    for (const px of [x + 11, x + 24]) d += fill(C(px, 142, 6), '#f4cf6a') + E('path', { d: `M${px - 4},142 a4,4 0 1,1 4,4 a2.6,2.6 0 1,1 -2.6,-2.6`, fill: 'none', stroke: '#d9a53a', 'stroke-width': .9 });
    d += [...Array(6)].map((_, k) => line(`M${x + 33 + k},146 L${x + 31 + k * 1.6},127`, '#f4cf6a', 1.1)).join('') + fill(R(x + 31, 136, 10, 12, 2), '#d8f0f6', { opacity: .8 }) + fill(R(x + 31, 141, 10, 3), '#d7372a', { opacity: .8 });
    if (n >= 2) d += [[x + 49, '#f9b6c8'], [x + 58, '#b6e39a'], [x + 67, '#fff1cf']].map(([cx, c]) =>
      fill(P(`M${cx - 3.6},137 L${cx + 3.6},137 L${cx},148 Z`), '#e2a24a') + fill(C(cx, 134, 4.4), c) + shine(C(cx - 1.4, 132.6, 1.2), .6)).join('');
    if (n >= 3) d += fill(R(x + 4, 114, 68, 10, 3), '#2f6e25') + fill(R(x + 4, 114, 4, 10, 1), '#3f9b3c') + fill(R(x + 68, 114, 4, 10, 1), '#d7372a') +
      E('text', { x: x + 38, y: 121.5, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 6.6, fill: '#fff3dc' }, 'FATTO A MANO') +
      [[x + 14, 130], [x + 50, 126]].map(([sx, sy]) => sparkle(sx, sy, 4)).join('');
    return d;
  },
  neon: (n, x) => fill(R(x + 10, 118, 56, 18, 9), '#3d2a44') + neonText(x + 38, 132, 'PIZZA', '#ff7a59', 12) +
    (n >= 2 ? E('rect', { x: x + 2, y: 114, width: 72, height: 52, rx: 4, fill: 'none', stroke: '#7be07b', 'stroke-width': 2, style: 'filter:drop-shadow(0 0 2px #7be07b)' }) : '') +
    (n >= 3 ? fill(R(x + 20, 136, 36, 30, 8), '#3d2a44') + neonPath(`M${x + 29},146 L${x + 47},146 L${x + 45},158 Q${x + 38},162 ${x + 31},158 Z M${x + 47},149 Q${x + 53},150 ${x + 46},155 M${x + 25},162 L${x + 51},162`, '#ffe08a', 1.8) +
      neonPath(`M${x + 34},142 q2,-3 0,-6 M${x + 40},142 q2,-3 0,-6`, '#ffe08a', 1.2) : ''),
  // Red geraniums, then trailing ivy, then butterflies.
  boxes: (n, x) => {
    let b = fill(R(x - 4, 166, 84, 14, 3), TERRA) + fill(R(x - 4, 166, 84, 3, 1.5), '#a84f2c');
    for (let j = 0; j < 5; j++) {
      const tx = x + 8 + j * 15;
      b += fill(P(leaf(tx - 2, 166, -150, 7, 3)), K.leaf) + fill(P(leaf(tx + 2, 166, -30, 7, 3)), K.leaf) + line(`M${tx},166 L${tx},158`, K.leaf, 1.4) +
        [[0, -2], [-3, 0], [3, 0], [-1.6, 2.4], [1.6, 2.4]].map(([dx, dy]) => fill(C(tx + dx, 156 + dy, 2.4), j % 2 ? '#e2412f' : '#d7263d')).join('');
    }
    if (n >= 2) b += [x + 2, x + 22, x + 46, x + 70].map((vx, k) => line(`M${vx},180 Q${vx - 3},${186 + k % 2 * 3} ${vx + 1},${192 + k % 2 * 2}`, '#2f6e25', 1.3) +
      [183, 188].map(vy => fill(P(leaf(vx - 1, vy, k % 2 ? 160 : 20, 4.4, 2)), '#4fa64a')).join('')).join('');
    if (n >= 3) b += butterfly(x + 6, 146, '#fffaf0') + butterfly(x + 70, 150, '#f6d23e');
    return b;
  },
  door: ({ lit }) => fill(P('M174,186 L174,124 Q174,104 200,104 Q226,104 226,124 L226,186 Z'), STONE) + fill(P('M196,103 L204,103 L203,111 L197,111 Z'), '#d9c9a4') +
    fill(P('M182,186 L182,128 Q182,112 200,112 Q218,112 218,128 L218,186 Z'), '#6b3a22') +
    fill(P('M184,128 Q184,114 200,114 Q216,114 216,128 Z'), lit ? '#fff2b8' : '#bfe0e6') + line('M200,114 L200,128 M190,117 L195,128 M210,117 L205,128', '#6b3a22', 1) +
    line('M200,129 L200,186', '#4e2a18', 1.4) + E('rect', { x: 186, y: 134, width: 10, height: 20, rx: 1.5, fill: 'none', stroke: '#4e2a18', 'stroke-width': 1.2 }) +
    E('rect', { x: 204, y: 134, width: 10, height: 20, rx: 1.5, fill: 'none', stroke: '#4e2a18', 'stroke-width': 1.2 }) + fill(C(196, 162, 2.2), K.gold) + fill(C(204, 162, 2.2), K.gold),
  trees: n => {
    let t = [166, 234].map(tx => fill(P(`M${tx - 8},172 L${tx + 8},172 L${tx + 6},186 L${tx - 6},186 Z`), TERRA) + fill(R(tx - 9, 172, 18, 3, 1.5), STONE) +
      line(`M${tx},172 L${tx},156`, '#7a4b3a', 2.2) + fill(C(tx, 148, 11), '#3f8a3a') + fill(C(tx - 4, 144, 4.4), '#5fae4a') +
      [[-5, 2], [4, -3], [5, 5]].map(([dx, dy]) => lemon(tx + dx, 148 + dy)).join('')).join('');
    if (n >= 2) t += [166, 234].map(tx => [[-7, -5], [0, 6], [7, 0], [-2, -8]].map(([dx, dy]) => lemon(tx + dx, 148 + dy)).join('') +
      [[-8, 3], [3, -7], [8, -4]].map(([dx, dy]) => fill(C(tx + dx, 148 + dy, 1.4), '#fffaf0')).join('')).join('');
    if (n >= 3) t += [166, 234].map(tx => [0, 60, 120, 180, 240, 300].map(a => glowDot(tx + Math.cos(a * Math.PI / 180) * 12, 148 + Math.sin(a * Math.PI / 180) * 12, 1.6, '#ffe9a8')).join('')).join('');
    return t;
  },
  // Big round café globes.
  lights: n => {
    const cols = n >= 2 ? ['#fffaf0', '#7be07b', '#fffaf0', '#ff8f7a'] : ['#fff7d6'];
    let l = swag() + SWAG_X.map((x, i) => line(`M${x},108 L${x},110`, K.ink, .8) + fill(C(x, 114, 8), '#ffe9a8', { opacity: .3 }) + fill(C(x, 114, 4.2), cols[i % cols.length]) + shine(C(x - 1.4, 112.6, 1.4), .7)).join('');
    if (n >= 3) l += sideSwags() + SIDE_X.map(([x, y]) => fill(C(x, y + 4, 7), '#ffe9a8', { opacity: .3 }) + fill(C(x, y + 4, 3.4), '#fff7d6')).join('');
    return l;
  },
  // A café table for two, a checked tablecloth, then a scooter.
  bench: n => {
    const chair = cx => line(`M${cx - 6},184 L${cx - 5},170 L${cx + 5},170 L${cx + 6},184 M${cx + (cx < 34 ? -5 : 5)},170 L${cx + (cx < 34 ? -6 : 6)},156`, '#3a3a3a', 1.6) +
      E('path', { d: `M${cx + (cx < 34 ? -6 : 6)},156 q${cx < 34 ? 3 : -3},-3 ${cx < 34 ? 6 : -6},0`, fill: 'none', stroke: '#3a3a3a', 'stroke-width': 1.6 }) + fill(EL(cx, 170, 7, 2), '#3a3a3a');
    let b = chair(14) + chair(54) + line('M34,164 L34,184 M28,184 L40,184', '#3a3a3a', 2) + fill(EL(34, 163, 14, 3.4), '#fffaf0') +
      fill(R(30, 155, 4, 7, 1), '#d9f0e6', { opacity: .9 }) + fill(R(36, 157, 5, 5, 1.5), '#fffaf0') + line('M41,158 q2,0 2,2 q0,2 -2,2', '#fffaf0', .8);
    if (n >= 2) b += fill(P('M20,163 L48,163 L47,170 L21,170 Z'), '#fffaf0') + [...Array(7)].map((_, k) => fill(R(21 + k * 4, k % 2 ? 163 : 166.5, 4, 3.5), '#d7372a')).join('') +
      tulip(32, 150, .32, '#d7263d') + line('M32,152 L32,156', K.leaf, 1);
    if (n >= 3) b += fill(P('M6,188 Q4,176 14,174 L30,174 L34,166 L40,166 L38,176 Q50,176 52,188 Z'), '#8fd3c0') + fill(EL(20, 173, 9, 3), '#5a3324') +
      line('M36,166 L34,156 M30,156 L38,155', '#3a3a3a', 1.8) + fill(C(38.6, 158, 2.4), '#fff7c2') + fill(C(12, 189, 5), '#3a3a3a') + fill(C(46, 189, 5), '#3a3a3a') +
      fill(C(12, 189, 2), '#bdbdbd') + fill(C(46, 189, 2), '#bdbdbd') + shine(EL(18, 180, 6, 2, -10), .45);
    return b;
  },
  patio: n => {
    let p = line('M366,112 L366,184', K.ink, 2.2) + [0, 1, 2, 3].map(i => fill(P(`M366,98 L${336 + i * 15},122 L${351 + i * 15},122 Z`), i % 2 ? '#fffaf0' : '#3f9b3c')).join('') +
      [0, 1, 2, 3].map(i => fill(P(`M${336 + i * 15},122 Q${343.5 + i * 15},127 ${351 + i * 15},122 Z`), i % 2 ? '#fffaf0' : '#3f9b3c')).join('') +
      fill(EL(366, 160, 19, 4.5), '#fffaf0') + [...Array(9)].map((_, k) => fill(R(348 + k * 4, 158.5, 4, 3), '#d7372a', { opacity: k % 2 ? 0 : .85 })).join('') +
      line('M366,162 L366,184', K.ink, 2) + line('M340,184 L341,168 L349,168 L350,184 M382,184 L383,168 L391,168 L392,184', '#3a3a3a', 1.6);
    if (n >= 2) p += fill(R(332, 178, 68, 8, 2), TERRA) + [338, 350, 362, 374, 386, 396].map((x, i) => fill(C(x, 176, 4.2), '#4fa64a') + (i % 2 ? fill(C(x, 173, 2.2), '#d7263d') : fill(C(x - 1, 173, 2), '#7cd65e'))).join('');
    if (n >= 3) p += fill(R(334, 96, 4, 88), '#8a5a3a') + fill(R(394, 96, 4, 88), '#8a5a3a') + fill(R(330, 94, 70, 5, 2), '#a0683f') +
      [340, 352, 380, 392].map((x, i) => fill(P(leaf(x, 100, 90 + (i % 2 ? 30 : -30), 7, 3)), K.leaf) +
        [[0, 5], [-2, 8], [2, 8], [0, 11], [-1, 13]].map(([dx, dy]) => fill(C(x + dx, 100 + dy, 1.8), '#7b3fa0')).join('')).join('');
    return p;
  },
};

// Decorations from the gem shop. "box" is the part of the restaurant picture a shop tile shows.
const CART_COL = { deli: '#e8475f', mexico: '#1f9e9a', rome: '#3f9b3c', japan: '#c8323a', brunch: '#f39a1e', dessert: '#e8659a' };
export const DECOR = {
  hanging: { box: [44, 56, 40, 46], draw: () => [62, 338].map(x => line(`M${x},64 L${x},80`, K.ink, 1.2) +
    fill(EL(x, 84, 10, 6), '#b5773a') + fill(C(x - 5, 79, 4), K.leaf) + fill(C(x + 5, 79, 4), K.leaf) +
    tulip(x - 4, 76, .4, K.tulip) + tulip(x + 4, 75, .4, '#8b55a6') + fill(P(`M${x - 8},86 Q${x - 10},94 ${x - 6},96`), 'none', { stroke: K.leaf, 'stroke-width': 1.6 })).join('') },
  cat: { box: [284, 136, 44, 40], draw: () => fill(EL(306, 163, 9, 6), '#e29a45') + fill(C(300, 153, 6), '#e29a45') +
    fill(P('M295,150 L296,143 L300,148 Z'), '#e29a45') + fill(P('M305,150 L304,143 L300,148 Z'), '#e29a45') +
    line('M314,165 Q322,160 318,152', '#e29a45', 2.6) + fill(C(298, 153, .9), K.ink) + fill(C(302, 153, .9), K.ink) + fill(EL(300, 155.5, 1, .7), '#e8475f') },
  bike: { box: [96, 140, 70, 52], draw: () => line('M110,179 L126,166 L148,166 L150,179 M126,166 L132,179 L110,179 M148,166 L144,158 M120,160 L128,160', K.teal, 2.4) +
    [110, 150].map(x => E('circle', { cx: x, cy: 179, r: 9, fill: 'none', stroke: K.ink, 'stroke-width': 2 })).join('') +
    fill(R(146, 150, 14, 9, 2), '#b5773a') + tulip(150, 146, .4, K.tulip) + tulip(156, 147, .4, '#8b55a6') },
  balloons: { box: [14, -6, 56, 54], draw: () => {
    let b = '';
    for (const [x, y, c] of [[30, 8, K.tulip], [44, 1, '#f6c33e'], [52, 14, '#6cc6e0'], [38, 18, '#8b55a6']]) {
      b += line(`M${x},${y + 8} Q${x + 6},${y + 22} 62,44`, K.ink, .7) + fill(EL(x, y, 6.5, 8), c) + fill(P(`M${x - 1.6},${y + 7.6} L${x + 1.6},${y + 7.6} L${x},${y + 10} Z`), c) + shine(EL(x - 2.4, y - 3, 1.6, 2.6, -20), .55);
    }
    return b;
  } },
  pup: { box: [58, 150, 44, 44], draw: () => line('M88,180 Q96,174 93,168', '#c98a4a', 2.6) + fill(EL(80, 181, 10, 7), '#d9a066') + fill(EL(76, 186, 4, 2.6), '#d9a066') + fill(EL(86, 186, 4, 2.6), '#d9a066') +
    fill(C(73, 170, 7.5), '#d9a066') + fill(EL(67, 170, 3, 6, 15), '#a8743f') + fill(EL(79, 170, 3, 6, -15), '#a8743f') + fill(EL(73, 174, 3.6, 2.6), '#f3d9b5') +
    fill(C(73, 172.6, 1.4), K.ink) + fill(C(70.4, 168.4, 1), K.ink) + fill(C(75.6, 168.4, 1), K.ink) + fill(R(68, 176.5, 10, 2.4, 1.2), '#e8475f') + fill(C(73, 179.6, 1.6), K.gold) },
  cart: { box: [248, 140, 66, 60], draw: style => {
    const col = CART_COL[style] || K.tulip;
    let c = line('M260,172 L260,156 M298,172 L298,156', '#7a4b3a', 1.6) + line('M300,175 L311,165', '#7a4b3a', 2.2);
    c += fill(P('M255,158 Q279,143 303,158 Z'), col) + [0, 1, 2].map(k => fill(P(`M${263 + k * 13},158 Q${267.5 + k * 13},${150 - (k === 1 ? 2 : 0)} ${272 + k * 13},158 Z`), '#fffaf0')).join('');
    if (style === 'mexico') c += [0, 1, 2, 3].map(k => line(`M${266 + k * 9},172 L${266 + k * 9},168`, '#e2c08a', 1) + fill(R(263 + k * 9, 160, 6, 9, 2.5), ['#e8475f', '#f6c33e', '#5fb34a', '#f39a1e'][k])).join('');
    else if (style === 'rome') c += [0, 1, 2].map(k => fill(P(`M${268 + k * 11},162 L${274 + k * 11},162 L${271 + k * 11},172 Z`), '#e2a24a') + fill(C(271 + k * 11, 161, 3.6), ['#f9b6c8', '#b6e39a', '#fff1cf'][k])).join('');
    else c += [0, 1, 2].map(k => E('path', { d: `M${267 + k * 11},170 q-4,-7 0,-9 q3,-1 4,3 q1,-4 4,-3 q4,2 0,9 z`, fill: 'none', stroke: '#b5702a', 'stroke-width': 2.2 })).join('');
    c += fill(R(256, 172, 46, 15, 3), col) + fill(R(256, 177, 46, 3), '#fffaf0', { opacity: .8 }) + fill(C(265, 191, 5), K.ink) + fill(C(293, 191, 5), K.ink) + fill(C(265, 191, 1.8), '#bdbdbd') + fill(C(293, 191, 1.8), '#bdbdbd');
    return c;
  } },
};
// One decoration on its own, for a shop tile.
export function decorSvg(id, style = 'deli') {
  const d = DECOR[id];
  if (!d) return '';
  return `<svg viewBox="${d.box.join(' ')}" aria-hidden="true">${d.draw(style)}</svg>`;
}

// Pictures for the gem shop's boosts and the recipe kit (100 x 100, like the foods).
export const SHOP_ART = {
  // Happy hour: a smiling sun clock with coins.
  happy: () => ground(50, 88, 30, 5) + body(C(50, 48, 30), '#ffd34d', -7, -7, .16) + fill(C(50, 48, 23), '#fff3dc') +
    line('M50,48 L50,32 M50,48 L62,54', K.ink, 3.2) + fill(C(50, 48, 3), K.tomato) +
    [0, 1, 2, 3].map(k => { const a = k * Math.PI / 2; return fill(C(50 + Math.cos(a) * 18, 48 + Math.sin(a) * 18, 1.8), K.eggplant); }).join('') +
    two(C(80, 74, 10), K.gold, K.goldDark) + E('text', { x: 80, y: 78.5, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 13, fill: '#fff3dc' }, '$') + shine(EL(30, 30, 6, 4, -40), .5),
  // Star power: a big gold star with a smile.
  stars: () => ground(50, 88, 28, 5) + body(P('M50,12 L60,36 L86,38 L66,55 L72,81 L50,67 L28,81 L34,55 L14,38 L40,36 Z'), K.gold, -7, -7, .18) +
    fill(C(43, 47, 2.4), K.ink) + fill(C(57, 47, 2.4), K.ink) + line('M44,55 Q50,60 56,55', K.ink, 2.2) + fill(C(38, 53, 3), K.blush, { opacity: .6 }) + fill(C(62, 53, 3), K.blush, { opacity: .6 }) +
    shine(EL(40, 30, 4, 7, 25), .5) + sparkle(84, 16, 6, '#f6c33e') + sparkle(16, 20, 4, '#f6c33e'),
  // Lucky crates: a crate with a four-leaf clover and sparkles.
  lucky: () => ground(50, 88, 32, 5) + body(R(18, 44, 64, 40, 6), '#c98a4a', -7, -7, .18) + line('M18,58 L82,58 M18,71 L82,71', '#a8743f', 2.4) +
    [[50, 30, 0], [40, 22, 0], [60, 22, 0], [50, 14, 0]].map(([x, y]) => fill(C(x, y, 8), '#4fb04a')).join('') + fill(C(50, 22, 4), '#3f9b3c') + line('M50,30 Q52,38 56,44', '#3f9b3c', 2.6) +
    sparkle(80, 22, 7, '#f6c33e') + sparkle(18, 30, 5, '#f6c33e') + fill(R(40, 56, 20, 16, 3), '#fff3dc') + E('text', { x: 50, y: 69, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 13, fill: K.eggplant }, '2'),
  // Recipe kit: a little basket with a recipe card.
  kit: () => ground(50, 88, 32, 5) + fill(R(54, 14, 26, 34, 3), '#fffaf0', { transform: 'rotate(12 67 31)' }) + line('M59,24 L75,27 M58,31 L73,34 M57,38 L69,40', '#c9b9a0', 1.6) +
    fill(C(36, 40, 10), K.tomato) + fill(C(52, 42, 9), '#f6c33e') + fill(P(leaf(36, 31, -80, 8, 3)), K.leaf) +
    body(P('M16,46 L84,46 L76,84 L24,84 Z'), '#c98a4a', -7, -7, .18) + line('M20,58 L80,58 M22,70 L78,70', '#a8743f', 2) + E('path', { d: 'M28,46 Q50,22 72,46', fill: 'none', stroke: '#a8743f', 'stroke-width': 3 }),
};


// ----- three more styles, built on the deli: Hana Sushi, Sunny Side and Sugar Tulip -----
const roofWords = (bg, c, left, right) => fill(R(58, 44, 284, 20, 4), bg) +
  [[98, left], [302, right]].map(([x, t]) => E('text', { x, y: 59, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 9, fill: c, 'letter-spacing': 1 }, t)).join('');
const lettersGap = x => (x > 70 && x < 126) || (x > 280 && x < 324);
const paperLantern = (x, y, r, c) => line(`M${x},${y - r - 4} L${x},${y - r}`, K.ink, 1) + fill(EL(x, y, r * .8, r), c) + fill(R(x - r * .5, y - r - 1, r, 2.4, 1), '#3a2a2a') + fill(R(x - r * .5, y + r - 1.4, r, 2.4, 1), '#3a2a2a') +
  [-.4, 0, .4].map(k => line(`M${x + k * r * .8},${y - r * .9} Q${x + k * r * 1.1},${y} ${x + k * r * .8},${y + r * .9}`, '#000', .5, { opacity: .25 })).join('');
const JAPAN = {
  ...DELI,
  roof: () => fill(R(52, 42, 296, 22, 3), '#3b4a6b') + [...Array(29)].map((_, i) => line(`M${58 + i * 10},44 L${58 + i * 10},62`, '#2c3856', 1.2)).join('') +
    fill(P('M52,42 L40,34 L58,42 Z'), '#3b4a6b') + fill(P('M348,42 L360,34 L342,42 Z'), '#3b4a6b') + fill(R(52, 62, 296, 3), '#2c3856'),
  wallBase: () => fill(R(70, 171, 260, 15), '#c98a4a') + [...Array(26)].map((_, i) => line(`M${75 + i * 10},171 L${75 + i * 10},186`, '#a8692a', .8)).join(''),
  paint: n => {
    let p = '';
    if (n >= 2) p += [70, 324].map(x => fill(R(x, 56, 6, 115), '#5a3a28')).join('') + fill(R(70, 106, 260, 5), '#5a3a28');
    if (n >= 3) for (let i = 0; i < 13; i++) for (const r of [9, 6, 3]) p += E('path', { d: `M${70 + i * 20},186 a${r},${r} 0 0,1 ${2 * r + (9 - r) * 2 - (9 - r) * 2},0`, transform: `translate(${10 - r} 0)`, fill: 'none', stroke: r === 9 ? '#2f5fa0' : '#7fb3e0', 'stroke-width': 1.6 });
    return p;
  },
  chimney: n => {
    let c = line('M309,44 L309,10', '#5a3a28', 2.6) + paperLantern(309, 24, 9, '#c8323a') + fill(C(318, 6, 5), '#fff', { opacity: .7 }) + fill(C(324, 0, 4), '#fff', { opacity: .55 });
    if (n >= 2) c += line('M296,44 L296,22', '#5a3a28', 2) + paperLantern(296, 32, 6, '#f6c33e');
    if (n >= 3) c += paperLantern(322, 34, 6, K.gold) + sparkle(330, 20, 3.5, '#fff7c2');
    return c;
  },
  bunting: n => {
    let b = line('M60,48 Q130,60 200,50 Q270,60 340,48', K.ink, 1);
    for (let i = 0; i < 9; i++) { const x = 76 + i * 31, y = 52 + Math.sin(i / 8 * Math.PI) * 6; b += paperLantern(x, y + 6, 5, i % 2 ? '#fffaf0' : '#c8323a'); }
    if (n >= 2) for (let i = 0; i < 8; i++) { const x = 92 + i * 31; b += paperLantern(x, 64, 4, i % 2 ? '#f6c33e' : '#f6a8c4'); }
    if (n >= 3) b += roofFlags('#c8323a', '#2f5fa0');
    return b;
  },
  display: (n, x) => {
    let d = fill(R(x + 4, 148, 68, 4, 1), '#b5773a') + fill(R(x + 8, 141, 30, 7, 2), '#d9a865');
    for (const k of [0, 1, 2]) d += fill(C(x + 14 + k * 9, 141, 4), '#2f3a2c') + fill(C(x + 14 + k * 9, 141, 3), '#fdfaf2') + fill(C(x + 14 + k * 9, 141, 1.2), '#f6a33a');
    d += fill(P(`M${x + 52},132 L${x + 61},148 L${x + 43},148 Z`), '#fdfaf2') + fill(R(x + 48, 142, 8, 6), '#2f3a2c');
    if (n >= 2) d += fill(EL(x + 66, 140, 6, 5), '#5d8a70') + fill(EL(x + 66, 135, 3, 1.4), '#4a7360');
    if (n >= 3) d += fill(R(x + 4, 114, 68, 10, 3), '#c8323a') + E('text', { x: x + 38, y: 121.5, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 7.5, fill: '#fff3dc' }, 'OISHII!') +
      [[x + 10, 131], [x + 46, 130], [x + 30, 134]].map(([sx, sy]) => sparkle(sx, sy, 4)).join('');
    return d;
  },
  neon: (n, x) => fill(R(x + 10, 118, 56, 18, 9), '#2a2440') + neonText(x + 38, 132, 'SUSHI', '#7fe0ff') +
    (n >= 2 ? E('rect', { x: x + 2, y: 114, width: 72, height: 52, rx: 4, fill: 'none', stroke: '#7fe0ff', 'stroke-width': 2, style: 'filter:drop-shadow(0 0 2px #7fe0ff)' }) : '') +
    (n >= 3 ? fill(R(x + 18, 140, 40, 24, 8), '#2a2440') + neonPath(`M${x + 26},152 Q${x + 36},142 ${x + 46},152 Q${x + 36},162 ${x + 26},152 Z M${x + 46},152 L${x + 52},146 L${x + 52},158 Z`, '#ff8fb0', 2) : ''),
  door: ctx => DELI.door(ctx) + fill(R(180, 112, 40, 22, 2), '#2b3a6b') + line('M193,114 L193,134 M207,114 L207,134', '#fffaf0', 1.4) + fill(C(200, 122, 4), '#fffaf0'),
};
const BRUNCH = {
  ...DELI,
  roof: () => roofWords('#f39a1e', '#fff3dc', 'COFFEE', 'BRUNCH'),
  wallBase: () => fill(R(70, 171, 260, 15), '#fffaf0') + [...Array(13)].map((_, i) => fill(R(70 + i * 20, 171, 10, 15), '#f6c33e')).join(''),
  bunting: n => pennants(1, ['#f6c33e', '#fffaf0'], 'tri', lettersGap) + (n >= 2 ? pennants(2, ['#2f8a8f', '#f2726b', '#8cc152'], 'tri', lettersGap) : '') + (n >= 3 ? roofFlags('#f39a1e', '#2f8a8f') : ''),
  chimney: n => {
    const gold = n >= 3;
    let c = fill(P('M296,46 L300,22 L318,22 L322,46 Z'), gold ? K.gold : '#c9c1b3') + fill(R(298, 18, 22, 6, 2), gold ? K.goldDark : '#a9a39b') + fill(C(309, 14, 3), '#3a2a2a') +
      E('path', { d: 'M322,28 q10,2 8,12', fill: 'none', stroke: gold ? K.gold : '#c9c1b3', 'stroke-width': 3 }) + line('M296,30 L288,24', gold ? K.gold : '#c9c1b3', 3) + steam(292, 18, 10);
    if (n >= 2) c += steam(300, 8, 10) + fill(C(316, 4, 4), '#fff', { opacity: .6 });
    if (gold) c += sparkle(330, 14, 3.5, '#fff7c2');
    return c;
  },
  display: (n, x) => {
    let d = fill(R(x + 4, 148, 68, 4, 1), '#b5773a');
    for (const k of [0, 1, 2]) d += fill(P(`M${x + 8 + k * 14},147 Q${x + 14 + k * 14},134 ${x + 20 + k * 14},147 Z`), '#e8b56a') + line(`M${x + 11 + k * 14},144 L${x + 17 + k * 14},139`, '#c98a4a', 1);
    d += fill(P(`M${x + 50},146 L${x + 66},146 Q${x + 64},152 ${x + 58},152 Q${x + 52},152 ${x + 50},146 Z`), '#5fb3c8') + fill(C(x + 54, 143, 3), '#e2343f') + fill(C(x + 60, 142, 3), '#f39a1e') + fill(C(x + 57, 139, 2.6), '#8cc152');
    if (n >= 2) d += fill(R(x + 61, 128, 4, 10), '#b5773a') + fill(EL(x + 63, 128, 9, 2), '#fffaf0') + fill(C(x + 60, 125, 2.4), '#e2343f') + fill(C(x + 66, 125, 2.4), '#4a5fb3');
    if (n >= 3) d += fill(R(x + 4, 114, 68, 10, 3), '#f39a1e') + E('text', { x: x + 38, y: 121.5, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 7, fill: '#fff3dc' }, 'BRUNCH ALL DAY') +
      [[x + 10, 131], [x + 46, 130]].map(([sx, sy]) => sparkle(sx, sy, 4)).join('');
    return d;
  },
  neon: (n, x) => fill(R(x + 12, 118, 52, 18, 9), '#3d2a44') + neonText(x + 38, 132, 'CAFÉ', '#ffd34d') +
    (n >= 2 ? E('rect', { x: x + 2, y: 114, width: 72, height: 52, rx: 4, fill: 'none', stroke: '#ffd34d', 'stroke-width': 2, style: 'filter:drop-shadow(0 0 2px #ffd34d)' }) : '') +
    (n >= 3 ? fill(R(x + 22, 139, 32, 26, 8), '#3d2a44') + neonPath(`M${x + 30},146 L${x + 46},146 L${x + 44},160 L${x + 32},160 Z M${x + 46},149 q6,0 5,5 q-1,4 -6,4`, '#ffd34d', 1.8) : ''),
};
const DESSERT = {
  ...DELI,
  roof: () => roofWords('#e8659a', '#fffaf0', 'SWEETS', 'TREATS') + [...Array(18)].map((_, i) => fill(P(`M${62 + i * 16},62 q4,${i % 2 ? 8 : 5} 8,0 Z`), '#fff6e6')).join(''),
  wallBase: () => fill(R(70, 171, 260, 15), '#fffaf0') + [...Array(14)].map((_, i) => fill(P(`M${66 + i * 20},186 L${76 + i * 20},171 L${84 + i * 20},171 L${74 + i * 20},186 Z`), '#f7a8c4')).join(''),
  paint: n => {
    let p = '';
    if (n >= 2) p += [...Array(23)].map((_, i) => fill(C(70 + i * 12, 66, 2.4), ['#f6c33e', '#6cc6e0', '#e8475f'][i % 3])).join('');
    if (n >= 3) p += [...Array(27)].map((_, i) => fill(R(70 + i * 10, 56, 5, 4), '#f7a8c4')).join('') + fill(R(70, 56, 6, 115), '#f7a8c4', { opacity: .8 }) + fill(R(324, 56, 6, 115), '#f7a8c4', { opacity: .8 });
    return p;
  },
  bunting: n => pennants(1, ['#f7a8c4', '#a8e6c8', '#fff0b3'], 'tri', lettersGap) + (n >= 2 ? pennants(2, ['#c9b2ef', '#ffd1e0'], 'tri', lettersGap) : '') + (n >= 3 ? roofFlags('#e8659a', '#9b7fd1') : ''),
  chimney: n => {
    let c = fill(P('M300,44 L318,44 L309,22 Z'), '#e6a24a') + line('M303,40 L313,30 M306,44 L316,34 M315,40 L305,30', '#c9802e', 1);
    const scoops = [['#f7a8c4', 18], ['#fff6e6', 10], ['#a8e6c8', 3]].slice(0, n);
    for (const [col, y] of scoops) c += fill(C(309, y, 9), col) + fill(P(`M300,${y + 3} q3,6 6,1 q3,5 6,0 q3,5 6,-1`), col) + shine(EL(305, y - 3, 2.4, 1.6, -30), .5);
    if (n >= 3) c += fill(C(311, -7, 3.4), '#c4122f') + sparkle(326, 4, 3.5, '#fff7c2');
    return c;
  },
  trees: n => {
    let t = fill(R(178, 184, 44, 6, 2), '#e8659a');
    for (const tx of [174, 226]) {
      t += fill(P(`M${tx - 7},172 L${tx + 7},172 L${tx + 5},186 L${tx - 5},186 Z`), '#9b7fd1') + line(`M${tx},172 L${tx},156`, '#fffaf0', 2.4);
      t += fill(C(tx, 150, n >= 2 ? 11 : 9), '#f7a8c4') + E('path', { d: `M${tx},150 m-6,0 a6,6 0 1,1 6,6 a3,3 0 1,1 -3,-3`, fill: 'none', stroke: '#fffaf0', 'stroke-width': 1.6 });
      if (n >= 3) t += [0, 90, 180, 270].map(a => glowDot(tx + Math.cos(a * Math.PI / 180) * 13, 150 + Math.sin(a * Math.PI / 180) * 13, 1.8, '#ffd34d')).join('');
    }
    return t;
  },
  display: (n, x) => {
    let d = fill(R(x + 4, 148, 68, 4, 1), '#b5773a');
    for (const k of [0, 1, 2]) d += fill(P(`M${x + 10 + k * 16},147 L${x + 22 + k * 16},147 L${x + 20 + k * 16},140 L${x + 12 + k * 16},140 Z`), ['#8fc8e0', '#f7a8c4', '#fff0b3'][k]) + fill(C(x + 16 + k * 16, 137, 6), ['#fff6e6', '#f7a8c4', '#7a4430'][k]) + fill(C(x + 16 + k * 16, 131.5, 1.8), '#c4122f');
    if (n >= 2) d += fill(R(x + 60, 140, 4, 8), '#b5773a') + fill(R(x + 54, 132, 16, 8, 2), '#f7a8c4') + fill(R(x + 56, 125, 12, 7, 2), '#fff6e6') + fill(C(x + 62, 123, 2.2), '#c4122f');
    if (n >= 3) d += fill(R(x + 4, 114, 68, 10, 3), '#e8659a') + E('text', { x: x + 38, y: 121.5, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 7.5, fill: '#fffaf0' }, 'SWEET TREATS') +
      [[x + 10, 131], [x + 48, 130]].map(([sx, sy]) => sparkle(sx, sy, 4)).join('');
    return d;
  },
  neon: (n, x) => fill(R(x + 10, 118, 56, 18, 9), '#3d2a44') + neonText(x + 38, 132, 'SWEETS', '#ff8fd0', 12) +
    (n >= 2 ? E('rect', { x: x + 2, y: 114, width: 72, height: 52, rx: 4, fill: 'none', stroke: '#ff8fd0', 'stroke-width': 2, style: 'filter:drop-shadow(0 0 2px #ff8fd0)' }) : '') +
    (n >= 3 ? fill(R(x + 22, 139, 32, 26, 8), '#3d2a44') + neonPath(`M${x + 31},152 L${x + 45},152 L${x + 43},161 L${x + 33},161 Z M${x + 30},152 Q${x + 38},140 ${x + 46},152`, '#a8f0d0', 1.8) : ''),
};

const DRAW = { deli: DELI, mexico: MEX, rome: ROME, japan: JAPAN, brunch: BRUNCH, dessert: DESSERT };

// ---------- three more restaurants: Hana Sushi, Sunny Side and Sugar Tulip ----------
const RICE = '#fdfaf2', NORI = '#2f3a2c', MATCHA = '#8cc152', MATCHA_D = '#5f9a2e', COFFEE = '#6b3e26', CREMA = '#d9a066', CHOC = '#5a3020', CHOC2 = '#7a4430', BERRY = '#e2343f', BLUEB = '#4a5fb3', CREAM = '#fff6e6', PINK = '#f7a8c4', MINT = '#a8e6c8';
const plate = (y = 76, rx = 40, ry = 9, col = '#fffaf0') => fill(EL(50, y + 2.5, rx, ry), '#d9d0c4') + fill(EL(50, y, rx, ry), col) + fill(EL(50, y, rx - 8, ry - 3), '#f3ede2');
const steam = (x, y, h = 12) => line(`M${x},${y} q-4,-${h / 2} 0,-${h} q4,-${h / 2} 0,-${h}`, '#fff', 2.4, { opacity: .85 });
function bowl(y, col, rim, w = 36) {
  const b = P(`M${50 - w},${y} L${50 + w},${y} Q${50 + w - 2},${y + 32} 50,${y + 34} Q${50 - w + 2},${y + 32} ${50 - w},${y} Z`);
  return body(b, col, -8, -4, .2) + fill(R(48 - w, y - 3, w * 2 + 4, 6, 3), rim) + shine(P(`M${54 - w},${y + 6} Q${56 - w},${y + 22} ${66 - w},${y + 28} Q${60 - w},${y + 20} ${59 - w},${y + 6} Z`), .3);
}
function mug(col, liquid, x = 46, y = 46, w = 40, h = 38) {
  const m = R(x - w / 2, y, w, h, 7);
  return E('path', { d: `M${x + w / 2 - 2},${y + 9} q15,0 15,12 q0,12 -15,12`, fill: 'none', stroke: col, 'stroke-width': 6 }) +
    body(m, col, -7, -5, .18) + fill(EL(x, y + 2, w / 2 - 2, 5), liquid) + shine(R(x - w / 2 + 5, y + 8, 4, h - 16, 2), .35);
}
function tallGlass(liquid, top, x = 50) {
  const g = P(`M${x - 17},26 L${x + 17},26 L${x + 13},86 L${x - 13},86 Z`);
  return ground(x, 89, 20, 3.5) + fill(g, '#e6f3f6', { opacity: .9 }) + fill(P(`M${x - 15},${top} L${x + 15},${top} L${x + 12.4},84 L${x - 12.4},84 Z`), liquid) +
    shine(P(`M${x - 13},30 L${x - 9},30 L${x - 7},80 L${x - 10},80 Z`), .45);
}
const blueberry = (x, y, r = 3.4) => fill(C(x, y, r), BLUEB) + fill(C(x - r * .3, y - r * .3, r * .3), '#8fa2e6');
function strawberry(x, y, s = 1) {
  const b = P(`M${x - 9 * s},${y - 4 * s} Q${x},${y - 10 * s} ${x + 9 * s},${y - 4 * s} Q${x + 8 * s},${y + 8 * s} ${x},${y + 12 * s} Q${x - 8 * s},${y + 8 * s} ${x - 9 * s},${y - 4 * s} Z`);
  let t = fill(b, BERRY);
  for (const [dx, dy] of [[-4, -1], [3, -2], [0, 3], [-3, 6], [4, 5]]) t += fill(EL(x + dx * s, y + dy * s, .8 * s, 1.2 * s), '#ffe08a');
  return t + fill(P(`M${x - 7 * s},${y - 6 * s} L${x - 2 * s},${y - 5 * s} L${x},${y - 10 * s} L${x + 2 * s},${y - 5 * s} L${x + 7 * s},${y - 6 * s} L${x + 2 * s},${y - 2.6 * s} L${x - 2 * s},${y - 2.6 * s} Z`), K.leaf) + shine(EL(x - 4 * s, y - 1 * s, 1.6 * s, 2.6 * s, 20), .45);
}
const maki = (x, y, r, inside = '#f6a33a') => fill(C(x + 1, y + 1.5, r), '#1d241b') + fill(C(x, y, r), NORI) + fill(C(x, y, r * .78), RICE) + fill(C(x, y, r * .32), inside) + fill(C(x + r * .18, y - r * .12, r * .18), '#7cc46e');
function onigiri(x, y, s = 1) {
  const o = P(`M${x},${y - 22 * s} Q${x + 6 * s},${y - 22 * s} ${x + 22 * s},${y + 8 * s} Q${x + 24 * s},${y + 16 * s} ${x + 14 * s},${y + 16 * s} L${x - 14 * s},${y + 16 * s} Q${x - 24 * s},${y + 16 * s} ${x - 22 * s},${y + 8 * s} Q${x - 6 * s},${y - 22 * s} ${x},${y - 22 * s} Z`);
  return body(o, RICE, -6, -5, .16) + fill(R(x - 10 * s, y + 2 * s, 20 * s, 14 * s, 2), NORI) + shine(EL(x - 6 * s, y - 8 * s, 3 * s, 5 * s, 30), .6) +
    [[-5, -6], [4, -10], [8, -2], [-10, 0]].map(([dx, dy]) => fill(EL(x + dx * s, y + dy * s, 1.6 * s, .9 * s, 30), '#efe6d2')).join('');
}
function scoop(x, y, r, col, drip = true) {
  let s = fill(P(blob(x, y, r, r * .88, 11, .07, Math.round(x + y))), col) + shade(P(blob(x, y, r, r * .88, 11, .07, Math.round(x + y))), -4, -4, .15);
  if (drip) s += fill(P(`M${x - r * .9},${y + r * .4} Q${x - r * .6},${y + r * 1.15} ${x - r * .3},${y + r * .6} Q${x},${y + r} ${x + r * .3},${y + r * .65} Q${x + r * .6},${y + r * 1.2} ${x + r * .9},${y + r * .4} Z`), col);
  return s + shine(EL(x - r * .35, y - r * .4, r * .25, r * .16, -30), .6);
}
const chip = (x, y, s = 1) => fill(P(`M${x},${y - 4 * s} Q${x + 3.4 * s},${y + 1 * s} ${x + 2.4 * s},${y + 2.6 * s} L${x - 2.4 * s},${y + 2.6 * s} Q${x - 3.4 * s},${y + 1 * s} ${x},${y - 4 * s} Z`), CHOC);
const sprinkles = (pts, cols = ['#e8475f', '#6cc6e0', '#f6c33e', '#8b55a6']) => pts.map(([x, y, a], i) => fill(R(x - 2.4, y - .8, 4.8, 1.6, .8), cols[i % cols.length], { transform: `rotate(${a} ${x} ${y})` })).join('');
const whip = (x, y, w = 14) => fill(P(`M${x - w},${y} Q${x - w},${y - w * .7} ${x - w * .4},${y - w * .6} Q${x - w * .3},${y - w * 1.2} ${x},${y - w * 1.1} Q${x + w * .3},${y - w * 1.25} ${x + w * .45},${y - w * .6} Q${x + w},${y - w * .7} ${x + w},${y} Z`), CREAM) + shine(EL(x - w * .35, y - w * .55, w * .18, w * .1, -20), .5);
const cherry = (x, y) => line(`M${x},${y - 4} Q${x + 3},${y - 12} ${x + 8},${y - 14}`, '#4a7a2a', 1.4) + fill(C(x, y, 4.6), '#c4122f') + shine(C(x - 1.4, y - 1.4, 1.3), .6);
function cupSaucer(x, y, w, coffeeCol, foam, cup = '#fffaf0') {
  let s = fill(EL(x, y + 16, w * .75, 5), '#d9d0c4') + fill(EL(x, y + 14, w * .75, 5), '#fffaf0');
  s += E('path', { d: `M${x + w / 2 - 2},${y + 2} q10,0 10,7 q0,7 -10,7`, fill: 'none', stroke: cup, 'stroke-width': 3.6 });
  s += body(P(`M${x - w / 2},${y} L${x + w / 2},${y} Q${x + w / 2 - 2},${y + 15 * w / 34} ${x},${y + 15 * w / 34} Q${x - w / 2 + 2},${y + 15 * w / 34} ${x - w / 2},${y} Z`), cup, -4, -3, .15);
  s += fill(EL(x, y + .5, w / 2 - 1.5, 3.6), coffeeCol);
  if (foam) s += fill(EL(x, y + .3, w / 2 - 5, 2.4), foam);
  return s;
}

const NEW_FOOD = {
  // Hana Sushi: rice
  rice() {
    let s = ground(50, 88, 30, 4.5);
    const front = P('M22,52 L78,52 L74,84 L26,84 Z');
    s += fill(P('M22,52 L50,44 L78,52 L50,60 Z'), '#c99a5e');
    s += fill(P(blob(50, 46, 26, 12, 14, .12, 3)), RICE) + shade(P(blob(50, 46, 26, 12, 14, .12, 3)), -5, -4, .12);
    for (const [x, y, a] of [[40, 42, 20], [52, 38, -30], [60, 45, 60], [46, 49, -10], [34, 47, 50], [64, 40, 10]]) s += fill(EL(x, y, 2.4, 1.2, a), '#efe6d2');
    s += body(front, '#d9a865', -7, -5, .2) + line('M24,62 L76,62', '#b5824a', 1.6) + fill(R(42, 66, 16, 12, 3), '#c8323a') + fill(C(50, 72, 3.6), '#fff3dc');
    return s;
  },
  steamedrice() {
    let s = ground(50, 90, 34, 5) + steam(40, 30) + steam(60, 26);
    s += fill(P(blob(50, 52, 30, 14, 14, .1, 7)), RICE);
    for (const [x, y, a] of [[38, 46, 20], [50, 42, -30], [62, 48, 60], [44, 52, -10], [56, 54, 30]]) s += fill(EL(x, y, 2.4, 1.2, a), '#efe6d2');
    s += bowl(56, '#cfe3f2', '#2f5fa0', 34) + [30, 44, 58, 72].map(x => fill(C(x, 72, 3), '#2f5fa0', { opacity: .8 })).join('');
    return s;
  },
  onigiri() { return ground(50, 88, 26, 4.5) + onigiri(50, 64, 1.15) + fill(EL(43, 62, 2.6, 2), '#f28b82', { opacity: .5 }); },
  makiroll() {
    let s = ground(50, 88, 38, 5) + body(R(12, 66, 76, 14, 4), '#d9a865', -6, -4, .2) + line('M16,73 L84,73', '#b5824a', 1);
    return s + maki(30, 56, 13, '#f6a33a') + maki(52, 54, 13, '#7cc46e') + maki(72, 58, 12, '#f6c33e');
  },
  bento() {
    let s = ground(50, 90, 40, 5);
    s += body(R(12, 34, 76, 52, 6), '#c8323a', -7, -6, .22) + fill(R(17, 39, 66, 42, 4), '#2a1d1d');
    s += fill(R(19, 41, 30, 38, 3), RICE) + fill(C(34, 56, 5), '#c4122f');
    for (const [x, y] of [[26, 48], [42, 50], [28, 68], [40, 70]]) s += fill(EL(x, y, 2, 1, 20), '#efe6d2');
    s += fill(R(52, 41, 29, 17, 3), '#f6d24a') + line('M52,47 L81,47 M52,52 L81,52', '#e6b82e', 1);
    s += fill(R(52, 61, 29, 18, 3), '#5fb34a') + fill(C(60, 70, 5), '#3f9b3c') + fill(C(72, 68, 4.4), '#f08a24') + fill(C(66, 74, 3.4), '#e2412f');
    return s + shine(R(16, 36, 30, 2.4, 1.2), .35);
  },
  sushiboat() {
    let s = ground(50, 90, 42, 5);
    s += line('M50,28 L50,58', '#8a5a3a', 2.4) + fill(P('M51,30 L72,44 L51,50 Z'), '#fffaf0') + fill(C(60, 44, 3), '#c8323a');
    s += body(P('M8,60 L92,60 Q86,84 50,86 Q14,84 8,60 Z'), '#c98a4a', -7, -5, .22) + fill(R(6, 57, 88, 6, 3), '#a8692a');
    s += maki(22, 54, 8, '#f6a33a') + maki(78, 54, 8, '#7cc46e');
    for (const x of [36, 52, 66]) s += fill(EL(x, 55, 8, 4.5), RICE) + fill(EL(x, 51, 8.5, 3.6), x === 52 ? '#f6d24a' : '#6aa84f') + fill(R(x - 1.6, 49, 3.2, 8), NORI);
    return s;
  },
  // Hana Sushi: tea
  tealeaf() {
    let s = ground(50, 88, 20, 4) + line('M50,88 Q48,70 52,40', '#4a7a2a', 3);
    s += body(P(leaf(50, 70, 200, 32, 11)), '#5fb34a', -4, -4, .18) + body(P(leaf(51, 60, -20, 32, 11)), '#6cc052', -4, -4, .18);
    s += body(P(leaf(52, 44, -80, 22, 8)), '#8fd14f', -3, -3, .15);
    return s + line('M50,70 L24,62 M51,60 L78,50', '#3f8a2e', 1.2) + shine(EL(34, 62, 4, 1.6, -15), .45);
  },
  greentea() {
    let s = ground(50, 88, 26, 4.5) + steam(44, 34) + steam(56, 30);
    s += body(P('M28,44 L72,44 L68,82 Q50,88 32,82 Z'), '#5d8a70', -6, -4, .2) + fill(EL(50, 45, 22, 5), '#b7d968') + fill(EL(50, 45, 18, 3.4), '#cfe68a');
    return s + fill(R(30, 60, 40, 5), '#4a7360') + shine(P('M33,50 L37,50 L38,78 L35,78 Z'), .3);
  },
  matcha() {
    let s = ground(46, 90, 34, 5);
    s += body(P('M14,52 L78,52 Q76,84 46,86 Q16,84 14,52 Z'), '#3f4f5a', -7, -5, .22) + fill(EL(46, 52, 32, 7), '#4f6370') + fill(EL(46, 52, 28, 5.4), MATCHA);
    for (const [x, y, r] of [[36, 51, 3], [48, 50, 4], [58, 52, 2.6], [42, 53, 2]]) s += fill(C(x, y, r), '#b6e07a');
    s += line('M76,48 L90,14', '#d9b47a', 4) + fill(P('M84,24 L94,30 L96,18 Z'), '#e6c58e') + [0, 1, 2, 3].map(i => line(`M${70 + i * 2},50 L${86 + i * 2},${22 + i}`, '#e6c58e', .9)).join('');
    return s;
  },
  mochi() {
    let s = ground(50, 86, 36, 5) + plate(76, 38, 9, '#3f4f5a');
    for (const [x, y, c] of [[34, 62, '#bfe39a'], [66, 62, PINK], [50, 52, '#fffaf0']]) s += body(P(blob(x, y, 15, 12, 12, .04, x)), c, -5, -5, .15) + shine(EL(x - 5, y - 5, 4, 2.4, -20), .7);
    return s + fill(P(leaf(66, 50, -60, 9, 3)), K.leaf);
  },
  matchaparfait() {
    let s = tallGlass(MATCHA, 46) + fill(R(37, 58, 26, 6), CREAM) + fill(R(38, 70, 24, 5), '#d9a066');
    s += whip(50, 44, 15) + fill(C(43, 34, 6), '#bfe39a') + fill(C(56, 33, 6), PINK) + fill(C(50, 26, 5.6), '#fffaf0');
    return s + line('M62,40 L74,16', '#e6c58e', 4) + fill(P(leaf(42, 42, 200, 8, 3)), K.leaf);
  },
  teaset() {
    let s = ground(50, 90, 44, 5) + body(R(8, 70, 84, 12, 4), '#c98a4a', -6, -4, .2);
    s += body(P(blob(40, 56, 20, 16, 12, .03, 2)), '#5d8a70', -6, -5, .2) + fill(EL(40, 41, 8, 2.6), '#4a7360') + fill(C(40, 38, 3), '#4a7360');
    s += line('M58,52 L72,44', '#5d8a70', 5) + line('M20,52 Q10,48 14,40', '#5d8a70', 3);
    s += [64, 80].map(x => body(P(`M${x - 8},58 L${x + 8},58 L${x + 6},70 L${x - 6},70 Z`), '#e8e2d6', -3, -3, .15) + fill(EL(x, 58, 7, 2), MATCHA)).join('');
    return s + fill(C(20, 66, 6), '#bfe39a') + fill(C(28, 67, 5.4), PINK);
  },
  // Sunny Side: coffee
  coffeebean() {
    let s = ground(50, 86, 28, 4.5);
    for (const [x, y, a] of [[40, 58, -25], [60, 54, 30]]) {
      const b = EL(x, y, 15, 21, a);
      s += body(b, '#7a4430', -5, -5, .22) + line(`M${x + Math.sin(a * Math.PI / 180) * 14},${y - Math.cos(a * Math.PI / 180) * 16} Q${x - 5},${y} ${x - Math.sin(a * Math.PI / 180) * 14},${y + Math.cos(a * Math.PI / 180) * 16}`, '#4a2618', 2.6) +
        shine(EL(x - 6, y - 8, 3, 6, a), .35);
    }
    return s;
  },
  groundcoffee() {
    let s = ground(50, 90, 30, 5);
    s += body(P('M24,34 L76,34 L80,86 L20,86 Z'), '#c9955a', -7, -5, .22) + fill(P('M24,34 L30,26 L70,26 L76,34 Z'), '#b5824a');
    s += fill(R(32, 50, 36, 26, 4), '#fff3dc') + fill(EL(50, 63, 8, 11, 0), '#7a4430') + line('M50,53 Q46,63 50,73', '#4a2618', 1.8);
    return s + fill(P(blob(50, 31, 18, 5, 10, .2, 4)), '#5a3020');
  },
  espresso() { return ground(50, 86, 32, 4.5) + steam(44, 40, 10) + steam(56, 38, 10) + cupSaucer(50, 52, 40, '#4a2618', '#c98a4a', '#c8323a'); },
  cappuccino() {
    let s = ground(50, 88, 36, 5) + cupSaucer(50, 46, 52, CREMA, null, K.teal);
    s += fill(P('M50,52 Q44,44 40,48 Q38,52 50,58 Q62,52 60,48 Q56,44 50,52 Z'), '#fffaf0');
    return s + steam(42, 34) + steam(58, 30);
  },
  icedmocha() {
    let s = tallGlass('#7a4430', 38);
    for (const [x, y] of [[44, 48], [55, 56], [46, 64]]) s += fill(R(x - 5, y - 5, 10, 10, 2), '#e6f3f6', { opacity: .7 });
    s += line('M40,60 Q50,66 60,60 M41,70 Q50,76 59,70', CHOC, 1.6) + whip(50, 30, 15) + line('M44,22 Q50,26 56,20', CHOC, 1.8);
    return s + line('M58,30 L70,8', '#e8475f', 4);
  },
  coffeeflight() {
    let s = ground(50, 90, 44, 5) + body(R(6, 72, 88, 12, 4), '#c98a4a', -6, -4, .2);
    s += cupSaucer(24, 54, 22, '#4a2618', '#c98a4a') + cupSaucer(50, 50, 26, CREMA, '#fffaf0');
    s += fill(P('M68,38 L84,38 L82,72 L70,72 Z'), '#e6f3f6', { opacity: .9 }) + fill(P('M69,46 L83,46 L81.6,70 L70.4,70 Z'), '#7a4430') + line('M80,40 L86,26', '#e8475f', 2.6);
    return s;
  },
  // Sunny Side: fruit
  strawberry() { return ground(50, 88, 24, 4.5) + strawberry(50, 56, 2.6); },
  berrybowl() {
    let s = ground(50, 90, 34, 5);
    s += strawberry(38, 48, 1.1) + strawberry(58, 44, 1.2) + [[46, 52], [52, 54], [66, 52], [32, 54], [44, 46]].map(([x, y]) => blueberry(x, y)).join('');
    return s + bowl(56, '#fffaf0', '#f6c33e', 32);
  },
  fruitsalad() {
    let s = ground(50, 90, 36, 5);
    s += fill(C(36, 48, 9), '#8cc152') + fill(C(36, 48, 6), '#b6e07a') + [0, 60, 120, 180, 240, 300].map(a => fill(C(36 + Math.cos(a * Math.PI / 180) * 3.6, 48 + Math.sin(a * Math.PI / 180) * 3.6, .8), '#2a1d1d')).join('');
    s += fill(P('M52,52 A12,12 0 0,1 76,52 Z'), '#f39a1e') + fill(P('M55,52 A9,9 0 0,1 73,52 Z'), '#ffc56b');
    s += strawberry(50, 44, 1) + [[60, 42, '#7b3fa0'], [65, 46, '#7b3fa0'], [28, 54, '#7b3fa0']].map(([x, y, c]) => fill(C(x, y, 3.6), c)).join('') + blueberry(44, 54);
    return s + bowl(56, '#5fb3c8', '#7fcadb', 36);
  },
  smoothie() {
    let s = tallGlass(PINK, 32) + fill(R(36, 30, 28, 4, 2), '#f9c2d6');
    return s + strawberry(36, 26, 1) + line('M56,32 L68,8', '#2f8a8f', 4) + [[46, 50], [54, 62], [44, 72]].map(([x, y]) => fill(C(x, y, 1.4), '#e2343f', { opacity: .5 })).join('');
  },
  smoothiebowl() {
    let s = ground(50, 90, 38, 5) + fill(P(blob(50, 52, 32, 10, 14, .06, 9)), PINK);
    for (const [x, y] of [[30, 50], [40, 48], [50, 47]]) s += fill(C(x, y, 5), '#fff3c4') + fill(C(x, y, 2), '#f2e2a8');
    s += strawberry(64, 46, .9) + blueberry(58, 52) + blueberry(70, 52) + [[40, 54], [46, 56], [52, 54], [36, 56]].map(([x, y]) => fill(C(x, y, 1.6), '#c98a4a')).join('');
    return s + bowl(56, '#fffaf0', '#8b55a6', 36);
  },
  fruitplatter() {
    let s = ground(50, 88, 44, 6) + plate(70, 44, 13);
    s += fill(P('M18,66 A16,16 0 0,1 46,66 Z'), '#5fb34a') + fill(P('M20,66 A13,13 0 0,1 44,66 Z'), '#ff6b7a') + [26, 32, 38].map(x => fill(EL(x, 61, .9, 1.4), '#2a1d1d')).join('');
    s += fill(P('M54,70 L66,52 L78,70 Z'), '#ffd23f') + line('M60,62 L72,62', '#e6b82e', 1.2);
    for (const [x, y] of [[50, 74], [56, 76], [44, 76], [62, 76]]) s += fill(C(x, y, 3.8), '#7b3fa0');
    return s + strawberry(80, 66, .9) + strawberry(30, 74, .8) + blueberry(70, 76) + blueberry(76, 74);
  },
  // Sugar Tulip: cocoa
  cocoabean() {
    let s = ground(50, 88, 26, 4.5);
    const pod = EL(50, 54, 20, 28, 15);
    s += body(pod, '#d9822b', -6, -6, .22);
    for (const k of [-10, 0, 10]) s += line(`M${50 + k - 4},30 Q${50 + k + 2},54 ${50 + k + 4},80`, '#b5651d', 1.6);
    s += line('M46,26 Q44,20 48,16', '#6b4a2a', 3) + fill(EL(74, 80, 7, 4.5, -20), '#6b3e26') + shine(EL(42, 40, 3, 8, 15), .4);
    return s;
  },
  chocchips() {
    let s = ground(50, 86, 34, 5) + fill(P(blob(50, 74, 32, 8, 12, .1, 2)), '#e8dccb');
    for (const [x, y, k] of [[34, 66, 1.4], [46, 62, 1.6], [58, 64, 1.5], [68, 68, 1.3], [40, 72, 1.3], [54, 72, 1.4], [28, 72, 1.2], [62, 56, 1.4], [50, 52, 1.5]]) s += chip(x, y, k * 1.6);
    return s + shine(EL(46, 56, 1.4, 2.4), .5);
  },
  chocbar() {
    let s = ground(50, 88, 34, 5);
    s += E('g', { transform: 'rotate(-12 50 56)' }, body(R(20, 30, 60, 52, 4), CHOC2, -6, -5, .22) +
      [0, 1, 2].map(i => [0, 1].map(j => fill(R(24 + i * 18.6, 34 + j * 13, 15, 10, 2), '#8a5240') + shine(R(25 + i * 18.6, 35 + j * 13, 13, 2, 1), .25)).join('')).join('') +
      fill(R(18, 58, 64, 26, 3), '#c8323a') + fill(R(18, 58, 64, 4), '#f6c33e') + fill(R(40, 66, 20, 10, 3), '#fff3dc'));
    return s;
  },
  truffles() {
    let s = ground(50, 86, 38, 5);
    for (const [x, y, c, top] of [[30, 62, CHOC, '#d9a066'], [70, 62, CHOC2, '#fffaf0'], [50, 52, '#4a2618', PINK]]) {
      s += fill(P(`M${x - 13},${y + 2} L${x + 13},${y + 2} L${x + 10},${y + 16} L${x - 10},${y + 16} Z`), '#c8323a') + [0, 1, 2, 3].map(i => line(`M${x - 10 + i * 6.6},${y + 3} L${x - 8 + i * 5.6},${y + 15}`, '#9a1f2a', .8)).join('');
      s += body(C(x, y - 4, 12), c, -4, -4, .2) + line(`M${x - 8},${y - 8} Q${x - 3},${y - 4} ${x},${y - 9} Q${x + 4},${y - 4} ${x + 8},${y - 8}`, top, 2) + shine(EL(x - 4, y - 9, 2.6, 1.6, -20), .45);
    }
    return s;
  },
  choccake() {
    let s = ground(50, 88, 40, 5) + plate(78, 42, 9);
    s += body(R(18, 40, 64, 38, 6), CHOC2, -7, -5, .22) + fill(R(18, 52, 64, 4), '#d9a066') + fill(R(18, 64, 64, 4), '#d9a066');
    s += fill(P('M16,40 Q16,32 26,32 L74,32 Q84,32 84,40 L84,46 Q78,52 74,46 Q70,54 64,46 Q58,52 52,46 Q46,54 40,46 Q34,52 28,46 Q22,54 16,46 Z'), CHOC);
    return s + strawberry(50, 26, 1.1) + [32, 68].map(x => fill(C(x, 30, 4), '#fff3dc')).join('');
  },
  chocfountain() {
    let s = ground(50, 90, 40, 5);
    s += body(EL(50, 80, 36, 8), '#d9d0c4', -5, -3, .2) + fill(EL(50, 78, 30, 6), CHOC);
    s += fill(R(47, 26, 6, 52), '#c9c1b3') + body(EL(50, 58, 22, 5), '#d9d0c4', -3, -2, .2) + body(EL(50, 40, 14, 4), '#d9d0c4', -3, -2, .2);
    s += fill(P('M36,40 Q34,50 30,58 L70,58 Q66,50 64,40 Z'), CHOC, { opacity: .9 }) + fill(P('M28,58 Q24,68 20,78 L80,78 Q76,68 72,58 Z'), CHOC2, { opacity: .85 });
    s += fill(EL(50, 24, 6, 4), CHOC) + strawberry(18, 70, .8) + strawberry(84, 70, .8);
    return s + shine(R(48, 28, 2, 20, 1), .5);
  },
  // Sugar Tulip: ice cream
  vanilla() {
    let s = ground(50, 88, 28, 4.5);
    for (const [a, x] of [[-14, 36], [6, 48]]) s += E('g', { transform: `rotate(${a} ${x} 60)` }, fill(R(x - 3, 26, 6, 60, 3), '#4a2e1c') + line(`M${x},30 L${x},82`, '#2e1b10', 1));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; s += fill(EL(68 + Math.cos(a) * 8, 40 + Math.sin(a) * 8, 7, 4.5, a * 180 / Math.PI), '#fffaf0'); }
    return s + fill(C(68, 40, 4), '#f6c33e') + fill(P(leaf(66, 52, 100, 18, 5)), K.leaf);
  },
  sweetcream() {
    let s = ground(50, 88, 26, 4.5);
    const jug = P('M30,34 L66,34 L70,82 Q50,88 30,82 L32,50 Q20,46 22,34 Z');
    s += body(jug, '#9fd0e6', -6, -5, .18) + fill(P('M33,48 L67,48 L69.6,80 Q50,86 31,80 Z'), CREAM);
    s += E('path', { d: 'M66,44 q14,2 12,16 q-2,12 -10,12', fill: 'none', stroke: '#9fd0e6', 'stroke-width': 5 });
    return s + shine(P('M36,52 L40,52 L41,78 L37,78 Z'), .5) + fill(R(32, 62, 36, 6), '#f9d6e2');
  },
  scoop() {
    let s = ground(50, 88, 26, 4.5) + body(P('M28,58 L72,58 L66,84 L34,84 Z'), '#e8475f', -5, -4, .2) + line('M30,66 L70,66', '#fff', 1.6, { opacity: .7 });
    return s + scoop(50, 48, 20, CREAM) + line('M60,42 L80,22', '#d9d0c4', 4) + fill(EL(82, 20, 4, 6, 45), '#d9d0c4');
  },
  cone() {
    let s = ground(50, 90, 14, 3.5);
    s += body(P('M32,52 L68,52 L50,92 Z'), '#e6a24a', -5, -4, .2) + line('M38,56 L56,84 M46,54 L60,72 M62,56 L44,84 M54,54 L40,72', '#c9802e', 1.4);
    return s + scoop(50, 44, 17, PINK) + scoop(50, 24, 15, CREAM) + cherry(54, 10);
  },
  sundae() {
    let s = ground(50, 92, 22, 4) + fill(P('M42,84 L58,84 L54,74 L46,74 Z'), '#e6f3f6');
    s += fill(P('M24,44 Q26,74 50,76 Q74,74 76,44 Z'), '#e6f3f6', { opacity: .9 }) + fill(P('M27,50 Q30,72 50,73 Q70,72 73,50 Z'), CHOC2);
    s += scoop(38, 42, 13, CREAM) + scoop(62, 42, 13, PINK) + scoop(50, 32, 13, MINT) + whip(50, 24, 11) + cherry(50, 12);
    return s + line('M34,36 Q40,44 46,34', CHOC, 2.4) + sprinkles([[40, 30, 20], [60, 30, -30], [56, 22, 60]]);
  },
  icecreamcake() {
    let s = ground(50, 88, 42, 5) + plate(80, 42, 9);
    s += body(R(14, 48, 72, 32, 6), PINK, -7, -5, .2) + fill(R(14, 60, 72, 6), CREAM) + fill(R(14, 70, 72, 4), CHOC2);
    s += fill(EL(50, 48, 36, 8), '#fff6e6');
    for (const x of [24, 38, 50, 62, 76]) s += whip(x, 46, 6);
    return s + cherry(50, 38) + sprinkles([[30, 52, 20], [44, 54, -40], [58, 52, 30], [70, 54, -10], [36, 50, 70], [64, 50, 50]]);
  },

  // ----- Hana Sushi dishes -----
  senbei() {
    let s = ground(50, 88, 40, 5) + plate(76, 40, 9, '#3f4f5a');
    for (const [x, y] of [[36, 60], [62, 56]]) s += body(C(x, y, 17), '#e6a24a', -5, -5, .2) + line(`M${x - 10},${y - 4} L${x + 10},${y - 4} M${x - 10},${y + 4} L${x + 10},${y + 4}`, '#c9802e', 1.6) + fill(R(x - 4, y - 17, 8, 34), NORI) + shine(EL(x - 7, y - 8, 3, 2, -30), .45);
    return s;
  },
  ochazuke() {
    let s = ground(50, 90, 36, 5) + steam(40, 28) + fill(P(blob(50, 52, 30, 10, 14, .08, 5)), '#cfe68a');
    s += fill(P(blob(48, 50, 18, 6, 10, .12, 2)), RICE) + [[40, 48], [50, 46], [56, 50]].map(([x, y]) => fill(R(x - 3, y - 1, 6, 2, 1), NORI)).join('');
    s += [[44, 52], [52, 54], [60, 50]].map(([x, y]) => fill(EL(x, y, 1, .6), '#fffaf0')).join('');
    return s + bowl(56, '#3f4f5a', '#566a77', 34);
  },
  matchalatte() { return ground(48, 88, 28, 4.5) + mug('#5d8a70', MATCHA) + fill(P(leaf(46, 50, 180, 9, 3)), '#fffaf0') + fill(P(leaf(46, 50, 0, 9, 3)), '#fffaf0') + steam(46, 36); },
  matchacheesecake() {
    let s = ground(50, 86, 38, 5) + plate(76, 40, 9);
    s += body(P('M16,68 L80,68 L84,52 L28,40 Z'), '#fff1cf', -6, -5, .2) + fill(P('M28,40 L84,52 L84,56 L28,44 Z'), MATCHA) + fill(P('M16,68 L80,68 L80,72 L16,72 Z'), '#d9a066');
    return s + fill(P('M16,68 L28,40 L28,44 L18,68 Z'), '#f3e2b8') + fill(C(64, 44, 4), '#fffaf0') + fill(P(leaf(70, 44, -20, 8, 3)), K.leaf);
  },
  mochiicecream() {
    let s = ground(50, 88, 40, 5) + plate(76, 40, 9, '#3f4f5a');
    for (const [x, y, c] of [[30, 62, MATCHA], [70, 62, PINK], [50, 54, '#fffaf0']]) s += fill(P(`M${x - 13},${y + 4} L${x + 13},${y + 4} L${x + 10},${y + 12} L${x - 10},${y + 12} Z`), '#f2e2c2') + body(C(x, y - 2, 12), c, -4, -4, .15) + shine(EL(x - 4, y - 7, 3, 2), .6);
    return s;
  },
  sushiandtea() {
    let s = ground(48, 88, 42, 5) + body(R(8, 66, 64, 12, 4), '#d9a865', -6, -4, .2);
    s += maki(22, 56, 10, '#f6a33a') + maki(42, 54, 10, '#7cc46e') + maki(60, 58, 9, '#f6c33e');
    return s + body(P('M66,52 L90,52 L87,76 Q78,80 69,76 Z'), '#5d8a70', -4, -3, .2) + fill(EL(78, 52, 11, 3), '#b7d968') + steam(78, 42, 10);
  },
  jigglycheesecake() {
    let s = ground(50, 88, 38, 5) + plate(78, 40, 9);
    s += body(P(blob(50, 56, 30, 22, 14, .02, 8)), '#fff1cf', -6, -6, .16) + fill(P('M22,46 Q50,30 78,46 Q78,40 50,32 Q22,40 22,46 Z'), MATCHA);
    s += [0, 1, 2].map(i => line(`M${12 - i * 3},${50 + i * 8} q-4,4 0,8`, '#d9a066', 1.6)).join('') + [0, 1, 2].map(i => line(`M${88 + i * 3},${50 + i * 8} q4,4 0,8`, '#d9a066', 1.6)).join('');
    return s + [[40, 40], [52, 37], [60, 42]].map(([x, y]) => fill(C(x, y, 1.6), '#fffaf0')).join('');
  },
  bentolunch() {
    let s = ground(46, 90, 40, 5) + body(R(8, 38, 64, 46, 6), '#2a1d1d', -6, -5, .22);
    s += onigiri(24, 62, .55) + fill(R(38, 42, 30, 16, 3), '#f6d24a') + fill(R(38, 62, 30, 18, 3), '#5fb34a') + fill(C(46, 70, 4.4), '#f08a24') + fill(C(58, 72, 4.4), '#3f9b3c') + fill(C(52, 66, 3.4), '#e2412f');
    return s + body(P('M72,54 L92,54 L89,78 Q82,82 75,78 Z'), '#5d8a70', -4, -3, .2) + fill(EL(82, 54, 9, 2.6), '#b7d968') + steam(82, 44, 9);
  },
  omakase() {
    let s = ground(50, 90, 46, 5) + body(R(4, 62, 92, 16, 4), '#d9a865', -6, -4, .2);
    for (const [x, c] of [[16, '#f6a33a'], [32, '#7cc46e'], [48, '#f6c33e']]) s += maki(x, 54, 8, c);
    for (const x of [64, 82]) s += fill(EL(x, 56, 8, 4.5), RICE) + fill(EL(x, 52, 8.5, 3.6), x === 64 ? '#f6d24a' : '#6aa84f') + fill(R(x - 1.6, 50, 3.2, 8), NORI);
    s += body(P(blob(70, 30, 14, 11, 12, .03, 3)), '#5d8a70', -4, -4, .2) + fill(C(70, 18, 2.6), '#4a7360') + line('M82,28 L92,22', '#5d8a70', 4);
    return s + fill(C(30, 34, 6), '#bfe39a') + fill(C(40, 32, 5.4), PINK) + fill(C(35, 26, 5), '#fffaf0');
  },
  // ----- Sunny Side dishes -----
  berrymuffin() {
    let s = ground(50, 88, 28, 4.5) + body(P('M28,58 L72,58 L66,86 L34,86 Z'), '#8fc8e0', -5, -4, .2) + [36, 44, 52, 60].map(x => line(`M${x},60 L${x + 2},84`, '#6fb0cc', 1.4)).join('');
    s += body(P(blob(50, 50, 26, 16, 12, .1, 6)), '#e8b56a', -6, -6, .2);
    return s + blueberry(40, 46) + blueberry(56, 44) + blueberry(48, 54) + strawberry(62, 50, .55) + shine(EL(40, 40, 5, 2.4, -20), .45);
  },
  berrybrew() {
    let s = tallGlass('#5a3020', 34);
    for (const [x, y] of [[44, 46], [56, 54]]) s += fill(R(x - 5, y - 5, 10, 10, 2), '#e6f3f6', { opacity: .7 });
    s += fill(R(37, 64, 26, 18), '#e2343f', { opacity: .55 });
    return s + strawberry(66, 30, 1) + line('M42,30 L36,8', '#2f8a8f', 4);
  },
  cafeaulait() {
    let s = ground(50, 88, 38, 5) + steam(44, 32) + steam(56, 28);
    s += fill(EL(50, 50, 32, 8), '#c98a6a') + fill(EL(50, 50, 26, 5.6), CREMA);
    return s + bowl(52, '#f6c33e', '#f39a1e', 34);
  },
  berrypancakes() {
    let s = ground(50, 90, 40, 5) + plate(82, 40, 8);
    for (let i = 0; i < 4; i++) s += body(EL(50, 74 - i * 9, 30, 8), '#e8b56a', -4, -3, .18) + fill(EL(50, 72 - i * 9, 30, 6), '#f2c98a');
    s += whip(50, 44, 12) + fill(P('M30,48 Q26,60 30,66 L34,52 Z'), '#c96a3a', { opacity: .8 });
    return s + strawberry(36, 40, .8) + strawberry(64, 40, .8) + blueberry(50, 30) + blueberry(44, 36) + blueberry(58, 36);
  },
  coffeecake() {
    let s = ground(46, 88, 40, 5) + plate(78, 34, 8);
    s += E('g', { transform: 'translate(-8 0)' }, body(R(22, 48, 44, 28, 3), '#e8b56a', -5, -5, .2) + fill(R(22, 58, 44, 4), '#b5773a') +
      fill(P(blob(44, 46, 23, 6, 14, .25, 3)), '#c98a4a') + [[30, 44], [38, 42], [48, 44], [56, 42], [36, 47]].map(([x, y]) => fill(C(x, y, 2.2), '#a8692a')).join(''));
    return s + cupSaucer(76, 50, 22, '#4a2618', '#c98a4a');
  },
  crepes() {
    let s = ground(50, 88, 40, 5) + plate(76, 40, 9);
    s += body(P('M14,70 Q20,46 50,40 Q80,46 86,70 Z'), '#f2c98a', -5, -5, .18) + line('M20,66 Q50,50 80,66', '#d9a066', 1.4);
    s += line('M22,56 Q34,50 46,56 Q58,50 70,56', CHOC, 2.6);
    return s + strawberry(36, 44, .8) + strawberry(58, 42, .8) + fill(C(48, 46, 3), '#fffaf0') + fill(C(70, 50, 2.6), '#fffaf0');
  },
  brunchboard() {
    let s = ground(50, 90, 44, 5) + body(R(6, 64, 88, 16, 4), '#c98a4a', -6, -4, .2);
    s += E('g', { transform: 'translate(24 58) scale(.42) translate(-50 -58)' }, ITEM_ART.bagel());
    s += fill(R(46, 54, 16, 10, 3), '#fff1cf') + strawberry(72, 52, .8) + blueberry(80, 58) + blueberry(84, 52);
    for (const [x, y] of [[54, 46], [60, 48]]) s += fill(C(x, y, 3.6), '#7b3fa0');
    return s + fill(P('M66,46 A8,8 0 0,1 82,46 Z'), '#f39a1e');
  },
  sunrisebowl() {
    let s = ground(46, 90, 40, 5) + fill(P(blob(44, 52, 28, 9, 14, .06, 4)), '#ffb35c');
    for (let i = 0; i < 7; i++) { const a = Math.PI + i / 6 * Math.PI; s += fill(R(44 + Math.cos(a) * 14 - 1, 52 + Math.sin(a) * 4 - 1, 2, 2), '#fff3c4'); }
    s += [[30, 50], [38, 48], [46, 47]].map(([x, y]) => fill(C(x, y, 4.4), '#fff3c4')).join('') + strawberry(56, 46, .8) + blueberry(62, 52);
    s += bowl(56, '#fffaf0', '#f39a1e', 32);
    return s + E('g', { transform: 'translate(80 50)' }, cupSaucer(0, 0, 18, '#4a2618', '#c98a4a'));
  },
  brunchtower() {
    let s = ground(50, 90, 40, 5) + line('M50,14 L50,84', '#c9c1b3', 3);
    for (const [y, w] of [[82, 40], [58, 32], [36, 24]]) s += fill(EL(50, y + 2, w, 6), '#d9d0c4') + fill(EL(50, y, w, 6), '#fffaf0');
    s += strawberry(30, 74, .7) + strawberry(70, 74, .7) + fill(C(42, 76, 5), '#e8b56a') + fill(C(56, 76, 5), '#e8b56a');
    s += [[36, 52], [50, 50], [64, 52]].map(([x, y], i) => fill(C(x, y, 5), [PINK, '#f6c33e', '#8cc152'][i])).join('');
    s += blueberry(44, 32) + blueberry(56, 32) + strawberry(50, 28, .6);
    return s + E('g', { transform: 'translate(84 30)' }, mug('#f39a1e', COFFEE, 0, 0, 16, 18));
  },
  // ----- Sugar Tulip dishes -----
  hotchocolate() {
    let s = ground(48, 88, 28, 4.5) + mug('#e8475f', CHOC2) + whip(46, 48, 14);
    return s + [[38, 40], [50, 36], [56, 42]].map(([x, y]) => fill(R(x - 4, y - 4, 8, 8, 2), '#fffaf0') + fill(R(x - 4, y - 4, 8, 3, 2), '#ffd6e2')).join('') + line('M40,44 Q46,50 52,44', CHOC, 1.6);
  },
  strawcream() {
    let s = ground(50, 90, 34, 5) + fill(P(blob(50, 52, 28, 9, 14, .08, 3)), CREAM);
    s += strawberry(38, 46, 1) + strawberry(58, 44, 1.1) + strawberry(50, 52, .8);
    return s + bowl(56, PINK, '#e8659a', 32);
  },
  chocstrawberries() {
    let s = ground(50, 88, 40, 5) + plate(76, 40, 9);
    for (const [x, y, r] of [[30, 60, -20], [50, 54, 0], [70, 60, 20]]) {
      s += E('g', { transform: `rotate(${r} ${x} ${y})` }, strawberry(x, y, 1.4) + fill(P(`M${x - 11},${y + 2} Q${x},${y - 1} ${x + 11},${y + 2} Q${x + 10},${y + 12} ${x},${y + 17} Q${x - 10},${y + 12} ${x - 11},${y + 2} Z`), CHOC) +
        line(`M${x - 8},${y + 6} L${x + 8},${y + 8}`, '#fffaf0', 1.2));
    }
    return s;
  },
  mintchip() {
    let s = ground(50, 88, 26, 4.5) + body(P('M28,60 L72,60 L66,84 L34,84 Z'), '#5fb3c8', -5, -4, .2);
    s += scoop(50, 48, 21, MINT);
    return s + [[40, 42], [52, 38], [60, 48], [46, 52], [56, 56], [38, 52]].map(([x, y]) => chip(x, y, .9)).join('') + fill(P(leaf(60, 30, -50, 10, 4)), K.leaf);
  },
  browniesundae() {
    let s = ground(50, 88, 40, 5) + plate(78, 40, 9);
    s += body(R(22, 56, 56, 20, 4), CHOC2, -5, -5, .22) + [32, 46, 60].map(x => fill(C(x, 66, 1.6), '#4a2618')).join('');
    s += scoop(50, 46, 16, CREAM) + line('M36,46 Q42,58 48,44 Q54,58 62,46', CHOC, 3);
    return s + cherry(52, 30);
  },
  bananasplit() {
    let s = ground(50, 88, 44, 5) + body(P('M6,58 L94,58 Q88,80 50,82 Q12,80 6,58 Z'), '#e6f3f6', -6, -4, .18);
    s += fill(P('M8,56 Q50,72 92,56 Q90,62 50,66 Q10,62 8,56 Z'), '#ffd23f');
    s += scoop(30, 46, 12, PINK) + scoop(50, 44, 12, CREAM) + scoop(70, 46, 12, CHOC2);
    return s + whip(50, 36, 8) + cherry(52, 24) + line('M24,40 Q30,48 36,40', CHOC, 2) + sprinkles([[66, 36, 20], [74, 40, -30], [28, 38, 50]]);
  },
  blackforest() {
    let s = ground(50, 88, 38, 5) + plate(78, 40, 9);
    s += body(P('M16,72 L80,72 L84,48 L26,36 Z'), CHOC2, -6, -5, .22) + fill(P('M17,58 L82,58 L82,62 L17,62 Z'), CREAM) + fill(P('M26,36 L84,48 L84,52 L26,40 Z'), CREAM);
    for (const x of [36, 52, 68]) s += whip(x, 42 + (x - 36) * .2, 6);
    return s + cherry(38, 34) + cherry(56, 38) + cherry(72, 42) + [[44, 66], [62, 67]].map(([x, y]) => fill(C(x, y, 2.6), '#c4122f')).join('');
  },
  lavacake() {
    let s = ground(46, 88, 40, 5) + plate(78, 40, 9);
    s += body(P('M20,74 L22,48 Q36,40 50,48 L52,74 Z'), CHOC, -5, -5, .22) + fill(P(blob(36, 50, 14, 5, 10, .1, 4)), '#4a2618');
    s += fill(P('M30,74 Q32,64 36,62 Q40,66 42,74 Z'), '#7a3a1e') + fill(P(blob(38, 78, 16, 3, 10, .2, 2)), '#7a3a1e');
    return s + scoop(72, 60, 14, CREAM, false) + fill(P(leaf(34, 42, -70, 8, 3)), K.leaf) + fill(C(78, 74, 3), BERRY);
  },
  desserttable() {
    let s = ground(50, 90, 46, 5) + body(R(4, 66, 92, 10, 3), '#fffaf0', -5, -3, .18) + fill(R(4, 74, 92, 8), PINK);
    s += body(R(18, 40, 30, 26, 4), CHOC2, -4, -4, .2) + fill(R(18, 40, 30, 6, 3), '#fff6e6') + cherry(33, 34);
    s += fill(P('M58,52 L74,52 L72,66 L60,66 Z'), '#8fc8e0') + whip(66, 52, 9) + fill(P('M78,48 L90,48 L84,66 Z'), '#e6a24a') + scoop(84, 44, 7, PINK, false);
    return s + sprinkles([[22, 70, 20], [40, 72, -20], [56, 70, 40], [72, 72, -10]], ['#fffaf0']) + sparkle(14, 30, 4, '#f6c33e') + sparkle(90, 30, 3.4, '#f6c33e');
  },
};
Object.assign(ITEM_ART, NEW_FOOD);

// The new starter blocks.
Object.assign(PRODUCER_ART, {
  ricecooker() {
    let s = ground(50, 90, 36, 5) + steam(56, 18, 10);
    s += body(R(18, 40, 64, 46, 16), '#fffaf0', -7, -6, .2) + fill(R(18, 58, 64, 5), '#e6dccb');
    s += body(P('M20,42 Q20,26 50,26 Q80,26 80,42 Z'), '#e8e2d6', -5, -4, .18) + fill(R(44, 22, 12, 6, 3), '#c8323a');
    return s + fill(R(36, 68, 28, 10, 4), K.teal) + fill(C(42, 73, 2.4), '#ffd34d') + fill(C(58, 73, 2.4), '#fff');
  },
  teapot() {
    let s = ground(50, 90, 36, 5);
    s += line('M76,50 L92,36', '#5d8a70', 7) + E('path', { d: 'M24,52 q-16,0 -14,14 q2,10 14,8', fill: 'none', stroke: '#5d8a70', 'stroke-width': 6 });
    s += body(P(blob(50, 60, 28, 24, 14, .02, 1)), '#5d8a70', -7, -6, .22) + fill(EL(50, 38, 14, 4), '#4a7360') + fill(C(50, 34, 4), '#4a7360');
    return s + fill(R(26, 60, 48, 5), '#4a7360') + fill(P(leaf(40, 72, -20, 12, 4)), '#8fd14f') + fill(P(leaf(52, 72, -40, 10, 3.6)), '#6cc052') + shine(EL(36, 50, 4, 7, 25), .35);
  },
  grinder() {
    let s = ground(50, 90, 32, 5);
    s += body(R(24, 46, 52, 40, 4), '#c98a4a', -7, -6, .22) + fill(R(40, 66, 20, 8, 2), '#8a5a3a') + fill(C(50, 70, 1.8), K.gold);
    s += body(P('M30,46 L70,46 L64,30 L36,30 Z'), '#b5b0a8', -4, -4, .2) + line('M50,30 L50,20 L72,16', '#7a7a7a', 2.6) + fill(C(74, 16, 4), '#c8323a');
    return s + [[34, 38], [44, 36], [56, 37]].map(([x, y]) => fill(EL(x, y, 3, 4, 20), '#6b3e26')).join('');
  },
  fruitbasket() {
    let s = ground(50, 90, 38, 5);
    s += E('path', { d: 'M20,52 Q50,10 80,52', fill: 'none', stroke: '#b5773a', 'stroke-width': 4 });
    s += strawberry(36, 46, 1) + fill(C(52, 44, 9), '#f39a1e') + fill(C(66, 48, 8), '#8cc152') + blueberry(44, 52, 4) + blueberry(58, 54, 4);
    s += body(P('M14,52 L86,52 L78,86 L22,86 Z'), '#d9a865', -7, -5, .22);
    return s + [62, 72].map(y => line(`M18,${y} L82,${y}`, '#b5824a', 1.6)).join('') + [30, 42, 54, 66].map(x => line(`M${x},54 L${x - 2},84`, '#b5824a', 1.2)).join('');
  },
  cocoatin() {
    let s = ground(50, 90, 30, 5);
    s += body(R(26, 34, 48, 52, 6), '#c8323a', -7, -6, .22) + fill(EL(50, 34, 24, 6), '#9a1f2a') + fill(EL(50, 32, 24, 6), '#d9d0c4');
    s += fill(R(32, 50, 36, 24, 4), '#fff3dc') + fill(EL(50, 62, 7, 10, 15), '#d9822b') + line('M47,54 Q50,62 53,70', '#b5651d', 1.2);
    return s + shine(R(30, 40, 4, 40, 2), .3);
  },
  freezer() {
    let s = ground(50, 90, 40, 5);
    s += body(R(12, 46, 76, 38, 6), '#8fc8e0', -7, -6, .22) + fill(R(12, 46, 76, 7, 3), '#6fb0cc') + fill(R(40, 62, 20, 6, 3), '#fffaf0');
    s += scoop(30, 40, 9, PINK, false) + scoop(50, 36, 9, CREAM, false) + scoop(70, 40, 9, MINT, false);
    return s + fill(C(22, 88, 4.4), K.ink) + fill(C(78, 88, 4.4), K.ink);
  },
});

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
  bin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.3 12.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8z" fill="#3f9b3c"/><rect x="3.5" y="5" width="17" height="3.6" rx="1.4" fill="#2f7a2d"/><rect x="9.5" y="2.6" width="5" height="2.8" rx="1" fill="#2f7a2d"/><path d="M9 15.5c0-2 1.6-3.4 3.4-3.4 0 2-1.4 3.4-3.4 3.4zm3.4-3.4c.6 1.4.2 3-1.2 4" fill="#cdeec0" stroke="#cdeec0" stroke-width=".8"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${K.leaf}"/><path d="M6.5 12.5 L10.5 16.5 L17.5 8.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

// Put every drawing on the page once. Squares on the board then point at them by id.
export function buildSprite() {
  let defs = '';
  const add = (id, fn) => { defs += `<symbol id="${id}" viewBox="0 0 100 100">${fn()}</symbol>`; };
  for (const [id, fn] of Object.entries(ITEM_ART)) add(`art-${id}`, fn);
  for (const [id, fn] of Object.entries(PRODUCER_ART)) add(`art-${id}`, fn);
  for (const [id, fn] of Object.entries(CUSTOMER_ART)) add(`cust-${id}`, fn);
  for (const [id, fn] of Object.entries(SHOP_ART)) add(`shop-${id}`, fn);
  const host = document.createElement('div');
  host.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${defs}</defs></svg>`;
  document.body.prepend(host.firstChild);
}

// The drawings leave a little air around the edge; this crops it so food fills its square.
export const use = (id, label = '') =>
  `<svg viewBox="7 7 86 86"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}><use href="#${id}"/></svg>`;
