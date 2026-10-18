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
  const big = { x: -20, y: -20, width: 140, height: 140 };
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
    return s;
  },

  buttertart() {
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
    for (const [x, y] of [[40, 56], [56, 60], [60, 52]]) s += fill(EL(x, y, 3.4, 2.4), '#5a3324');
    s += shine(EL(40, 52, 9, 2.6, -8), .6);
    return s;
  },

  rugelach() {
    let s = ground(50, 87, 42, 5);
    const piece = (cx, cy, rot) => E('g', { transform: `rotate(${rot} ${cx} ${cy})` },
      fill(EL(cx - 14, cy + 3, 6.5, 5.5), '#b8692a') + fill(EL(cx + 14, cy + 3, 6.5, 5.5), '#b8692a') +
      body(EL(cx, cy, 15, 10.5), '#e29a45', -4, -4, .2) +
      line(`M${cx - 8},${cy - 9} Q${cx - 3},${cy} ${cx - 8},${cy + 9}`, '#5a3324', 2.4) +
      line(`M${cx + 2},${cy - 10} Q${cx + 7},${cy} ${cx + 2},${cy + 10}`, '#5a3324', 2.4) +
      shine(EL(cx - 4, cy - 6, 5, 1.6), .5) +
      fill(C(cx - 2, cy - 2, 1.1), '#fff') + fill(C(cx + 6, cy + 3, 1.1), '#fff') + fill(C(cx - 10, cy + 2, 1.1), '#fff'));
    return s + piece(30, 68, -14) + piece(70, 68, 14) + piece(50, 46, 0);
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

  frenchtoast() {
    let s = ground(50, 89, 44, 5);
    s += fill(EL(50, 80, 44, 9.5), K.white) + fill(EL(50, 79, 36, 6.5), '#f1e3c6');
    const SLICE = 'M-20,18 L-20,-8 Q-24,-22 -10,-22 Q0,-30 10,-22 Q24,-22 20,-8 L20,18 Z';
    const slice = (x, y, rot) => E('g', { transform: `rotate(${rot} ${x} ${y})` },
      body(P(sc(SLICE, x, y, 1)), '#b8692a', -4, -4, .2) + fill(P(sc(SLICE, x, y + 1, .8)), '#f2c272') +
      shine(EL(x - 6, y - 10, 6, 2.4, -10), .45));
    s += slice(36, 58, -14) + slice(64, 56, 12);
    const r = rng(3);
    for (let i = 0; i < 16; i++) s += fill(C(26 + r() * 50, 40 + r() * 30, 1.2), '#fff', { opacity: .9 });
    s += fill(C(72, 77, 4.2), K.eggplant) + fill(C(80, 74, 4.2), K.eggplant) + fill(C(71.5, 75.5, 1.1), '#fff', { opacity: .6 });
    s += fill(P(sc('M0,-6 C6,-6 8,0 0,8 C-8,0 -6,-6 0,-6 Z', 24, 76, 1)), K.tulip) + fill(EL(24, 69.5, 4, 1.5), K.leaf);
    return s;
  },
};

// ---------- the pantry crate (Toronto's producer) ----------
export const PRODUCER_ART = {
  pantry() {
    let s = ground(50, 91, 40, 5);
    s += fill(R(25, 26, 15, 22, 4), '#ffffff') + fill(R(24, 22, 17, 6, 2), K.teal);
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
};

// ---------- badge medals ----------
const METALS = [
  ['#e6dfd6', '#bdb4a9'], // not earned yet
  ['#df9258', '#a8612e'], // bronze
  ['#e1e5ec', '#98a2b3'], // silver
  ['#f8c840', '#c48a12'], // gold
];
const GLYPHS = {
  chef: c => fill(P('M-10,4 C-16,-2 -13,-14 -5,-11 C-3,-18 5,-18 7,-11 C14,-14 17,-2 10,4 Z'), c) + fill(R(-10, 3, 20, 7, 2), c),
  merger: c => fill(P('M0,-15 Q2,-2 15,0 Q2,2 0,15 Q-2,2 -15,0 Q-2,-2 0,-15 Z'), c),
  collector: c => fill(P(sc(TULIP, 0, -1, 1.3)), c) + line('M0,11 L0,16', c, 3),
  tycoon: c => E('text', { x: 0, y: 9, 'text-anchor': 'middle', 'font-size': 26, 'font-family': 'Righteous, sans-serif', fill: c }, '$'),
  traveller: c => fill(P('M0,15 C-6,7 -11,2 -11,-3 A11,11 0 1,1 11,-3 C11,2 6,7 0,15 Z'), c),
  arcade: c => fill(C(0, 0, 11), c) + fill(C(-4, -4, 3), '#fff', { opacity: .5 }),
  scholar: c => fill(P('M-14,-8 Q-6,-12 0,-7 Q6,-12 14,-8 L14,10 Q6,6 0,11 Q-6,6 -14,10 Z'), c),
};
export function medalSvg(family, tier) {
  const [light, dark] = METALS[tier];
  const locked = tier === 0;
  let s = fill(P('M38,58 L30,95 L41,88 L47,97 L52,62 Z'), locked ? '#d9d2c8' : K.tulip);
  s += fill(P('M62,58 L70,95 L59,88 L53,97 L48,62 Z'), locked ? '#cfc7bc' : K.eggplant);
  s += fill(C(50, 44, 31), dark) + fill(C(50, 42, 30), light);
  s += E('circle', { cx: 50, cy: 42, r: 23, fill: 'none', stroke: dark, 'stroke-width': 2, opacity: .45 });
  if (!locked) s += shine(P('M27,36 A24,24 0 0,1 45,18 L46,23 A19,19 0 0,0 32,37 Z'), .5);
  s += E('g', { transform: 'translate(50 42)' }, (GLYPHS[family] || GLYPHS.merger)(dark));
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${s}</svg>`;
}

// ---------- Elayna's restaurant, which changes as it is upgraded ----------
export function restaurantSvg(has) {
  let s = fill(C(336, 34, 26), '#f7c873');
  if (has.has('oven')) {
    s += fill(R(298, 14, 22, 34, 3), '#c9372a') + fill(R(296, 12, 26, 6, 2), '#a92b1d');
    s += fill(C(306, 6, 6), '#fff', { opacity: .75 }) + fill(C(316, 0, 5), '#fff', { opacity: .6 });
  }
  s += fill(R(-10, 184, 420, 40), '#e3c79a');
  const wall = R(70, 56, 260, 130);
  s += body(wall, '#fff3dc', -16, 0, .14);
  s += fill(R(58, 44, 284, 20, 4), K.eggplant);
  s += fill(R(136, 8, 128, 40, 10), K.eggplant);
  s += E('text', { x: 200, y: 36, 'text-anchor': 'middle', 'font-family': 'Righteous, sans-serif', 'font-size': 23, fill: '#fff3dc' }, "Elayna's");
  if (has.has('awning')) {
    for (let i = 0; i < 10; i++) {
      const x = 80 + i * 24;
      s += fill(P(`M${x},70 L${x + 24},70 L${x + 24},94 Q${x + 12},108 ${x},94 Z`), i % 2 ? '#fff3dc' : K.eggplant);
    }
    s += fill(R(76, 66, 248, 8, 3), K.eggplant) + fill(R(70, 100, 260, 7), K.shadow, { opacity: .14 });
  }
  const lit = has.has('oven');
  for (const x of [92, 252]) {
    s += fill(R(x, 112, 76, 56, 4), lit ? '#ffd77a' : '#bfe0e6');
    if (lit) {
      s += fill(R(x + 8, 118, 60, 44, 3), '#fff2b8', { opacity: .75 });
      for (const px of [x + 22, x + 54]) {
        s += fill(P(`M${px - 9},168 Q${px - 9},148 ${px},148 Q${px + 9},148 ${px + 9},168 Z`), K.eggplant, { opacity: .28 });
        s += fill(C(px, 140, 6.5), K.eggplant, { opacity: .28 });
      }
    }
    s += shine(P(`M${x + 8},164 L${x + 30},116 L${x + 40},116 L${x + 18},164 Z`), .4);
    s += line(`M${x + 38},113 L${x + 38},167 M${x + 1},140 L${x + 75},140`, '#fff3dc', 3);
    if (has.has('tulips')) {
      s += fill(R(x - 4, 166, 84, 14, 3), K.teal);
      for (let j = 0; j < 5; j++) {
        const tx = x + 8 + j * 15;
        s += line(`M${tx},162 L${tx},170`, K.leaf, 2.2) + tulip(tx, 155, .72, j % 2 ? '#8b55a6' : K.tulip);
      }
    } else {
      s += fill(R(x - 4, 166, 84, 5, 2), '#e3c79a');
    }
  }
  s += fill(P('M182,186 L182,128 Q182,114 200,114 Q218,114 218,128 L218,186 Z'), K.teal);
  s += fill(C(200, 131, 7), lit ? '#fff2b8' : '#bfe0e6') + fill(C(211, 156, 2.6), K.gold);
  if (has.has('lights')) {
    let wire = 'M74,104';
    for (let i = 0; i < 8; i++) wire += ` Q${80 + i * 32},112 ${106 + i * 32},104`;
    s += line(wire, K.ink, 1.2);
    for (let i = 0; i < 8; i++) s += fill(C(90 + i * 32, 109, 6), '#ffd34d', { opacity: .35 }) + fill(C(90 + i * 32, 109, 2.8), '#ffd34d');
  }
  if (has.has('patio')) {
    s += fill(R(22, 146, 32, 40, 3), '#3d3a3a');
    for (const y of [156, 164, 172]) s += fill(R(28, y, 20, 2.4, 1.2), '#fff', { opacity: .8 });
    s += line('M366,118 L366,184', K.ink, 2.4);
    for (let i = 0; i < 4; i++) {
      const x0 = 338 + i * 14;
      s += fill(P(`M366,100 L${x0},124 L${x0 + 14},124 Z`), i % 2 ? '#fff3dc' : K.tulip);
    }
    s += fill(EL(366, 160, 20, 4.5), K.white) + line('M366,160 L366,184', K.ink, 2);
    s += fill(R(340, 160, 8, 24, 2), K.teal) + fill(R(384, 160, 8, 24, 2), K.teal);
  }
  return `<svg viewBox="0 0 400 200" role="img" aria-label="Elayna's restaurant">${s}</svg>`;
}

// ---------- small interface icons (24 x 24) ----------
export const ICONS = {
  coin: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${K.gold}"/><circle cx="12" cy="12" r="8" fill="none" stroke="${K.goldDark}" stroke-width="1.6"/><text x="12" y="16.4" text-anchor="middle" font-size="12" font-weight="700" font-family="Righteous, sans-serif" fill="${K.goldDark}">$</text></svg>`,
  bolt: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${K.eggplant}"/><path d="M13.5 4 L7 13.5 L11.5 13.5 L10.5 20 L17 10.5 L12.5 10.5 Z" fill="#ffd34d"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9L2 13.7v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2zm-3 18h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/></svg>`,
  house: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 11.2 12 3.5l9 7.7V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>`,
  book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5.2C5.5 4 8.5 4 11 5.6V20c-2.5-1.4-5.5-1.4-8-.3zm10 .4C15.5 4 18.5 4 21 5.2v14.5c-2.5-1.1-5.5-1.1-8 .3z"/></svg>`,
  medal: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h4l1.5 4L14 2h3l-3 7.2A6.5 6.5 0 1 1 9.9 9.2zM12 11a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"/></svg>`,
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
  `<svg viewBox="5 5 90 90"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}><use href="#${id}"/></svg>`;
