// Drawings for the cooking shift kitchen (the "big kitchen stage" look Adam picked on 2026-10-19).
// Everything is SVG text in one 344 x 672 scene. Appliances are drawn with their bottom-left
// corner at 0,0, growing upward, and report where their slots are so the kitchen can draw
// what's inside and know what was tapped.

export const INK = '#3a2a2a', CREAM = '#fffaf0', WOOD = '#b5774a', WOODL = '#e7b77c', WOODM = '#c98a5a', GOLD = '#f6b62e', CHROME = '#e9e2d8';
const BLUSH = '#ff8a8a';

const at = a => Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ');
export const rect = (x, y, w, h, r, f, a = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}" ${at(a)}/>`;
export const circ = (x, y, r, f, a = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${at(a)}/>`;
export const ell = (x, y, rx, ry, f, a = {}) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${at(a)}/>`;
export const path = (d, f, a = {}) => `<path d="${d}" fill="${f}" ${at(a)}/>`;
export const line = (d, c, w, a = {}) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${at(a)}/>`;
export const g = (t, inner, a = {}) => `<g transform="${t}" ${at(a)}>${inner}</g>`;
export const text = (x, y, s, size, f, a = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${f}" ${at(a)}>${s}</text>`;

// A friendly face: dot eyes with a shine, rosy cheeks, a small smile (or a frown when upset).
function face(cx, cy, s = 1, sad = false) {
  const r = 2.3 * s, dx = 5 * s;
  const mouth = sad ? `M${cx - 3.5 * s},${cy + 8 * s} Q${cx},${cy + 4.5 * s} ${cx + 3.5 * s},${cy + 8 * s}` : `M${cx - 3.5 * s},${cy + 5 * s} Q${cx},${cy + 8.5 * s} ${cx + 3.5 * s},${cy + 5 * s}`;
  return circ(cx - dx - 4 * s, cy + 5 * s, 3.2 * s, BLUSH, { opacity: .55 }) + circ(cx + dx + 4 * s, cy + 5 * s, 3.2 * s, BLUSH, { opacity: .55 }) +
    circ(cx - dx, cy, r, INK) + circ(cx + dx, cy, r, INK) +
    circ(cx - dx + r * .35, cy - r * .4, r * .35, '#fff') + circ(cx + dx + r * .35, cy - r * .4, r * .35, '#fff') +
    line(mouth, INK, 1.6 * s);
}
const shine = (x, y, rx, ry) => ell(x, y, rx, ry, '#fff', { opacity: .55, transform: `rotate(-30 ${x} ${y})` });
export const chefHat = () => rect(-10, -30, 20, 8, 2, '#fff') + circ(-7, -34, 6, '#fff') + circ(0, -37, 7, '#fff') + circ(7, -34, 6, '#fff') + rect(-10, -24, 20, 2.5, 1, '#e8dccb');

// Food friends, drawn around 0,0 at about 36 across.
const FRIEND = {
  tomato: s => circ(0, 0, 18, '#b8321f') + circ(-2, -2, 16.5, '#e2412f') + path('M0,-17 L-7,-21 L-3,-15 L-9,-12 L0,-14 L9,-12 L3,-15 L7,-21 Z', '#3f9b3c') + shine(-8, -7, 4, 2.4) + face(0, 1, 1, s),
  eggplant: s => ell(0, 3, 15, 20, '#43204f') + ell(-1.5, 1.5, 13.5, 18.5, '#6d3a82') + path('M-9,-14 Q0,-22 9,-14 Q4,-12 0,-16 Q-4,-12 -9,-14 Z M-2,-19 L-1,-26 L2,-26 L2,-19 Z', '#3f9b3c') + shine(-7, -6, 3.5, 2.2) + face(0, 4, 1, s),
  lemon: s => ell(0, 0, 20, 15, '#d9a400') + ell(-1.5, -1.5, 18.5, 13.5, '#f8d23a') + ell(-20, 0, 3, 2.4, '#d9a400') + ell(20, 0, 3, 2.4, '#d9a400') + shine(-9, -6, 4, 2.2) + face(0, 0, 1, s),
  blueberry: s => circ(0, 0, 16, '#2f3f9a') + circ(-2, -2, 14.5, '#4a63c9') + path('M0,-17 L-4,-12 L-1,-13 L0,-10 L1,-13 L4,-12 Z', '#2a2f6b') + shine(-7, -6, 3.5, 2.2) + face(0, 1, 1, s),
  pear: s => path('M0,-20 C8,-20 9,-10 10,-4 C18,0 18,20 0,20 C-18,20 -18,0 -10,-4 C-9,-10 -8,-20 0,-20 Z', '#7da82e') + path('M-1,-18 C6,-18 7,-9 8,-4 C15,0 15,17 -1,17 C-16,17 -16,0 -10,-4 C-9,-10 -8,-18 -1,-18 Z', '#a8cf45') + line('M0,-20 L2,-26', '#6b3a1e', 2.4) + shine(-7, 2, 3.5, 2.2) + face(0, 5, 1, s),
  // The kitchen helpers.
  strawberry: s => path('M0,-13 C10,-18 19,-9 17,2 C15,13 6,19 0,20 C-6,19 -15,13 -17,2 C-19,-9 -10,-18 0,-13 Z', '#b8243a') + path('M-1,-12 C8,-16 16,-8 15,2 C13,12 5,17 -1,18 C-7,17 -14,11 -16,1 C-17,-8 -9,-16 -1,-12 Z', '#e83f55') +
    [[-10, -4], [10, -4], [-12, 6], [12, 6], [-6, 14], [6, 14], [0, 16]].map(([x, y]) => ell(x, y, 1.1, 1.6, '#ffe08a')).join('') +
    path('M0,-13 L-9,-18 L-4,-12 L-11,-9 L0,-11 L11,-9 L4,-12 L9,-18 Z', '#3f9b3c') + shine(-9, -4, 3.5, 2) + face(0, 2, 1, s),
  bean: s => ell(0, 1, 15, 19, '#5a321c') + ell(-1.5, -.5, 13.5, 17.5, '#a8673a') + line('M3,-17 Q-3,-12 1,-6', '#5a321c', 2.2) + shine(-7, -7, 3.5, 2) + face(0, 4, 1, s),
  avocado: s => path('M0,-20 C9,-20 11,-10 12,-3 C17,5 16,20 0,20 C-16,20 -17,5 -12,-3 C-11,-10 -9,-20 0,-20 Z', '#2f6b2a') +
    path('M-1,-18 C7,-18 9,-9 10,-3 C15,5 13,17 -1,17 C-14,17 -15,5 -11,-3 C-10,-9 -8,-18 -1,-18 Z', '#d6e89a') + circ(-1, 9, 6, '#8a5a2e') + circ(-2.5, 7.5, 2, '#b07a46') + face(-1, -6, .85, s),
  peach: s => circ(0, 0, 17, '#e0704a') + circ(-2, -2, 15.5, '#f5a06a') + line('M0,-15 Q-4,-2 0,10', '#e0704a', 1.6, { opacity: .6 }) + path('M1,-17 Q8,-24 14,-20 Q8,-15 1,-17 Z', '#3f9b3c') + shine(-8, -6, 3.5, 2.2) + face(0, 2, 1, s),
};
export const CUSTOMER_KINDS = ['eggplant', 'lemon', 'blueberry', 'pear', 'peach'];
export const friend = (kind, x, y, s = 1, extra = '', cls = '', sad = false) =>
  g(`translate(${x} ${y}) scale(${s})`, `<g class="${cls}">${ell(0, 21, 14, 3, INK, { opacity: .12 })}${FRIEND[kind](sad)}${extra}</g>`);

// A kitchen helper standing on the floor: a small chef's hat, and when "busy" a hop and the thing
// they just handled floating over their head ('oops' when they fumbled).
export const helper = (kind, x, y, busy = null, oops = false) => friend(kind, x, y - (busy && !oops ? 6 : 0), .9, g('translate(0 -1) scale(.62)', chefHat()) +
  (busy ? g('translate(0 -42)', circ(0, 0, 15, CREAM, { stroke: oops ? '#e2412f' : GOLD, 'stroke-width': 2 }) +
    (oops ? text(0, 6, '?', 18, '#e2412f', { 'text-anchor': 'middle', 'font-family': 'Righteous' }) : FOOD[busy]())) : ''), busy ? '' : 'bob b', oops);

// ---------- food, drawn around 0,0 at about 24 across ----------
const RING = (r, h) => `M${-r},0 a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z M${-h},0 a${h},${h} 0 1,0 ${2 * h},0 a${h},${h} 0 1,0 ${-2 * h},0 Z`;
const bagelArt = (dark, light, seeds) => g('scale(1 .8)', path(RING(12, 4), dark, { 'fill-rule': 'evenodd' }) + g('translate(-1 -1.5)', path(RING(11, 4.2), light, { 'fill-rule': 'evenodd' })) +
  (seeds ? [[-6, -6], [3, -8], [7, -2], [-8, 2], [5, 5]].map(([x, y]) => ell(x, y, 1.4, .8, CREAM)).join('') : '') + shine(-6, -5, 3, 1.4));
const challahArt = (dark, light) => ell(0, 3, 15, 8, dark) + [-8, 0, 8].map(x => ell(x, -.5, 6.5, 7.5, light, { transform: `rotate(-25 ${x} 0)` })).join('') + [-8, 0, 8].map(x => shine(x - 2, -3, 2.2, 1.2)).join('');
const cupArt = (full, cold) => line('M7,-1 Q13,-1 13,4 Q13,9 7,8', '#226a6e', 3) + rect(-10, -6, 18, 17, 4, '#226a6e') + rect(-10, -6, 16, 16, 4, '#2f8a8f') +
  ell(-1, -5.5, 8, 2.4, cold ? '#a8876a' : full ? '#6b3a1e' : '#1d5558') + shine(-6, 1, 1.6, 4) +
  (cold ? line('M-13,-12 l3,3 M-13,-9 l3,-3 M10,-14 l3,3 M10,-11 l3,-3', '#7fb6e6', 1.6) : full ? line('M-4,-10 q-2,-3 0,-6', '#c9b8a8', 1.8, { class: 'steam' }) + line('M2,-10 q2,-3 0,-6', '#c9b8a8', 1.8, { class: 'steam b' }) : '');
export const FOOD = {
  bagel: () => bagelArt('#b8732f', '#e3a24f', true),
  bagelDough: () => bagelArt('#d9bf94', '#f3e2c2', false),
  bagelBurnt: () => bagelArt('#2e1d16', '#57382a', false),
  creamBagel: () => FOOD.bagel() + path('M-9,-3 Q-7,-8 0,-8 Q8,-8 9,-3 Q4,1 0,-1 Q-5,2 -9,-3 Z', CREAM) + path('M-3,-2 Q0,-6 4,-4 Q1,-2 -3,-2 Z', '#e8dccb'),
  challah: () => challahArt('#a8622a', '#e9a443'),
  challahDough: () => challahArt('#d9bf94', '#f3e2c2'),
  challahBurnt: () => challahArt('#2e1d16', '#57382a'),
  coffee: () => cupArt(true),
  cupEmpty: () => cupArt(false),
  coffeeCold: () => cupArt(true, true),
  // A used plate's leftovers (drawn on a plate): a smear and some crumbs.
  dirty: () => path('M-11,4 Q-7,-2 1,0 Q10,1 9,6 Q2,10 -7,9 Z', '#b8875a', { opacity: .85 }) + path('M-4,3 Q0,1 4,3', '#8a5a2e', { opacity: .6 }) + [[-12, 0], [5, -2], [11, 2], [-2, 8], [2, 4], [-7, 5]].map(([x, y]) => circ(x, y, 1.6, '#8a5a2e')).join(''),
  clock: () => circ(0, 0, 13, '#e2412f') + circ(0, 0, 10, CREAM) + line('M0,-6 L0,0 L5,3', INK, 2) + rect(-3, -18, 6, 4, 1.5, '#e2412f') + circ(0, 0, 1.5, INK),
  creamCheese: () => rect(-9, -3, 18, 13, 3, '#e8dccb') + rect(-9, -3, 16, 12, 3, CREAM) + rect(-10, -7, 20, 5, 2, '#4a7fd0') + shine(-5, 2, 1.4, 3),
  flour: () => path('M-10,12 L-11,-4 Q-11,-10 -5,-11 L5,-11 Q11,-10 11,-4 L10,12 Z', '#d8c39d') + path('M-9,11 L-10,-4 Q-10,-9 -5,-10 L5,-10 Q9,-9 9,-4 L8,11 Z', '#efe1c3') + rect(-7, -1, 14, 6, 2, '#5b2c6f') + path('M-5,-11 L0,-15 L5,-11 Z', '#d8c39d'),
  beans: () => rect(-8, -8, 16, 20, 4, '#e8dccb', { opacity: .9 }) + rect(-7, -4, 14, 15, 3, '#7a4524') + [[-3, 0], [3, 3], [-2, 7], [3, -2]].map(([x, y]) => ell(x, y, 2.4, 1.6, '#4a2512')).join('') + rect(-9, -11, 18, 4, 2, '#2f8a8f'),
  dough: () => ell(0, 2, 12, 8, '#d9b98a') + ell(-1, 0, 11, 7, '#f7e6c6') + shine(-4, -3, 3, 1.4),
};
export const food = (kind, x, y, s = 1) => g(`translate(${x} ${y}) scale(${s})`, FOOD[kind]());
export const plate = (x, y, kind, s = 1) => g(`translate(${x} ${y}) scale(${s})`, ell(0, 6, 17, 6, '#e8dccb') + ell(0, 5, 16, 5.5, CREAM) + ell(0, 5, 11, 3.5, '#f3ead8') + (kind ? FOOD[kind]() : ''));
export const heartPath = 'M0,4 C-7,-3 -12,3 -7,8 L0,14 L7,8 C12,3 7,-3 0,4 Z';

// A timer ring. share: how far round it has gone (0 to 1). id lets the kitchen update it without redrawing.
export function ring(x, y, share, colour, id = '', r = 9) {
  const c = 2 * Math.PI * r;
  return circ(x, y, r + 1, CREAM) + circ(x, y, r, 'none', { stroke: '#e8dccb', 'stroke-width': 3 }) +
    circ(x, y, r, 'none', { stroke: colour, 'stroke-width': 3, 'stroke-dasharray': c.toFixed(1), 'stroke-dashoffset': (c * (1 - share)).toFixed(1), transform: `rotate(-90 ${x} ${y})`, ...(id ? { id } : {}) });
}

// ---------- appliances ----------
export const SIZE = {
  oven: [[96, 130], [110, 150], [130, 186]],
  coffee: [[60, 110], [76, 124], [84, 140]],
  pantry: [[120, 110], [120, 140], [116, 170]],
  prep: [[120, 24], [150, 24], [170, 26]],
};

// The oven body. Returns the art plus where each slot's food and timer ring go.
export function oven(level) {
  const [W, H] = SIZE.oven[level - 1];
  let s = '', slots = [], rings = [];
  if (level < 3) {
    s += rect(0, -H, W, H, 12, '#a8402c') + rect(0, -H, W - 6, H - 4, 12, '#c8553d');
    if (level === 2) s += rect(0, -H, W - 6, 26, 12, CHROME) + rect(0, -H + 14, W - 6, 12, 0, CHROME);
    const n = level + 1, wy = level === 1 ? -96 : -114, wh = level === 1 ? 50 : 58, ww = W - 26;
    s += rect(10, wy, ww, wh, 9, INK) + rect(14, wy + 4, ww - 8, wh - 8, 7, GOLD, { opacity: .3 });
    for (let i = 0; i < n; i++) { const x = 10 + ww * (i + .5) / n; slots.push([x, wy + wh / 2 + 2]); rings.push([x, level === 1 ? -113 : -H + 13]); }
    s += rect(14, -(level === 1 ? 36 : 44), ww - 4, 7, 3.5, '#fdebd0');
    if (level === 2) s += rect(8, -6, 12, 8, 2, INK) + rect(W - 26, -6, 12, 8, 2, INK);
  } else {
    const arch = (x0, x1, top, mid) => `M${x0},0 L${x0},${mid} Q${x0},${top} ${(x0 + x1) / 2},${top} Q${x1},${top} ${x1},${mid} L${x1},0 Z`;
    s += path(arch(0, W, -H, -H + 46), '#9a3a28') + path(arch(0, W - 6, -H + 3, -H + 48), '#c8553d');
    for (let r = 1; r < 10; r++) { const y = -r * 17; s += line(`M6,${y} L${W - 12},${y}`, '#b04a34', 2); for (let c = (r % 2) * 14 + 10; c < W - 12; c += 28) s += line(`M${c},${y} L${c},${y + 17}`, '#b04a34', 2); }
    s += path(arch(20, W - 26, -134, -102), GOLD) + path(arch(26, W - 32, -128, -100), INK);
    s += ell((W - 6) / 2, -18, 36, 9, GOLD, { opacity: .45 }) +
      `<g class="flame">${path(`M${W / 2 - 22},-12 Q${W / 2 - 18},-34 ${W / 2 - 8},-24 Q${W / 2 - 4},-44 ${W / 2 + 4},-26 Q${W / 2 + 14},-38 ${W / 2 + 16},-12 Z`, '#f08a2a')}</g>`;
    slots = [[40, -50], [80, -50], [48, -84], [72, -84]];
    rings = [[29, -H + 22], [51, -H + 22], [73, -H + 22], [95, -H + 22]];
    s += rect(-4, -14, W + 2, 14, 4, '#8f3a2a') + rect(-4, -14, W + 2, 4, 2, GOLD);
    s += g(`translate(${(W - 6) / 2} -9) scale(.45)`, path('M-10,-6 L-5,-1 L0,-10 L5,-1 L10,-6 C10,6 6,10 0,10 C-6,10 -10,6 -10,-6 Z', GOLD));
  }
  return { art: s, W, H, slots, rings, scale: level === 3 ? .8 : level === 2 ? .78 : .85 };
}

// The coffee machine body, and where each cup sits.
export function coffee(level) {
  const [W, H] = SIZE.coffee[level - 1];
  let s = '', cups = [], cs = 1;
  if (level < 3) {
    s += rect(0, -H, W, H, 10, '#226a6e') + rect(0, -H, W - 4, H - 4, 10, '#2f8a8f');
    if (level === 2) s += rect(0, -H, W - 4, 18, 10, CHROME) + rect(0, -H + 10, W - 4, 8, 0, CHROME);
    s += rect(8, -H + (level === 2 ? 24 : 12), W - 20, 18, 5, '#bfe3e0');
    const xs = level === 1 ? [W / 2 - 2] : [20, W - 24];
    xs.forEach(x => { s += rect(x - 6, -70, 12, 10, 3, INK); cups.push([x + 2, -22]); });
    cs = level === 1 ? .95 : .8;
  } else {
    s += rect(0, -112, W, 112, 12, '#d9c9ab') + rect(0, -112, W - 5, 108, 12, CREAM);
    s += path(`M8,-112 Q8,-${H} ${W / 2},-${H} Q${W - 8},-${H} ${W - 8},-112 Z`, '#d99a12') + path(`M8,-112 Q8,-${H - 2} ${W / 2 - 3},-${H - 2} Q${W - 14},-${H - 2} ${W - 14},-112 Z`, GOLD);
    s += circ(W / 2, -H - 4, 5, GOLD) + rect(4, -114, W - 8, 6, 3, '#d99a12');
    s += circ(W / 2, -90, 11, '#2f8a8f') + circ(W / 2, -90, 8.5, '#fff') + line(`M${W / 2},-90 L${W / 2 + 5},-94`, INK, 2);
    [16, W / 2, W - 16].forEach(x => { s += rect(x - 5, -70, 10, 9, 3, INK); cups.push([x + 2, -24]); });
    s += rect(4, -10, W - 8, 6, 3, '#c9b8a8');
    cs = .7;
  }
  return { art: s, W, H, cups, scale: cs, spoutY: -60 };
}

// The pantry. "items" are the pantry ids on today's menu; they sit in the front row, big enough to tap.
export function pantry(level, items) {
  const [W, H] = SIZE.pantry[level - 1];
  let s = '';
  const decor = [];
  let rowY;
  if (level === 1) {
    s += rect(0, -58, W, 8, 2, WOOD) + rect(0, -4, W, 8, 2, WOOD);
    rowY = -74;
    decor.push(['flour', 26, -20], ['beans', 60, -20], ['dough', 96, -14]);
  } else if (level === 2) {
    s += rect(-4, -H, W + 8, H, 10, '#c98a5a') + rect(2, -H + 6, W - 4, H - 10, 6, '#f3dcb8');
    [-H + 48, -H + 92, -6].forEach(y => { s += rect(2, y, W - 4, 7, 2, WOOD); });
    rowY = -H + 74;
    decor.push(['flour', 24, -H + 30], ['flour', 50, -H + 30], ['beans', 80, -H + 30], ['beans', 102, -H + 30], ['dough', 30, -22], ['dough', 62, -22], ['creamCheese', 96, -20]);
  } else {
    s += rect(0, -H, W, H, 12, '#c9c2b8') + rect(0, -H, W - 5, H - 4, 12, '#f2eee8') + rect(0, -H, W - 5, 18, 12, '#5b2c6f') + rect(0, -H + 10, W - 5, 8, 0, '#5b2c6f');
    s += rect(8, -H + 26, W - 30, H - 40, 8, '#cfeeea') + rect(12, -H + 30, 6, H - 48, 3, '#fff', { opacity: .6 });
    [-H + 64, -H + 112].forEach(y => { s += rect(8, y, W - 30, 4, 2, '#9fc9c6'); });
    s += rect(W - 18, -H + 50, 6, 64, 3, GOLD);
    rowY = -H + 92;
    decor.push(['creamCheese', 30, -H + 48], ['creamCheese', 54, -H + 48], ['flour', 78, -H + 48], ['dough', 34, -30], ['beans', 66, -28]);
  }
  s += decor.map(([k, x, y]) => food(k, x, y, .85)).join('');
  // Tappable spots, spread across the front row.
  const usable = level === 3 ? W - 30 : W;
  const x0 = level === 3 ? 8 : 0;
  const spots = items.map((id, i) => ({ id, x: x0 + usable * (i + .5) / Math.max(3, items.length), y: rowY }));
  return { art: s, W, H, spots };
}

// The prep counter: the board and where each plate goes.
export function prep(level) {
  const [W] = SIZE.prep[level - 1];
  const s = level === 3
    ? rect(0, -26, W, 26, 8, '#ddd6cc') + rect(0, -26, W - 3, 23, 8, '#f4f0ea') + line('M14,-18 Q40,-10 60,-20 M90,-8 Q120,-20 150,-12', '#d6cfc6', 1.6) + rect(0, -4, W, 4, 2, GOLD)
    : rect(0, -24, W, 24, 8, '#c4824a') + rect(0, -24, W - 3, 21, 8, '#d99a5c');
  const n = level + 1, plates = [];
  for (let i = 0; i < n; i++) plates.push([W * (i + .5) / n, -24]);
  return { art: s, W, plates, scale: level === 3 ? .85 : .9 };
}

// The mixer, on the counter between the prep board and the bin. Kept low so it stays under the oven.
// Returns the art plus where the dough being made sits and where its timer ring goes.
export function mixer(level) {
  const bowl = (x0, w, d, c, cd) => path(`M${x0},${-d} L${x0 + w},${-d} Q${x0 + w - 3},0 ${x0 + w / 2},0 Q${x0 + 3},0 ${x0},${-d} Z`, cd) +
    path(`M${x0 + 2},${-d} L${x0 + w - 4},${-d} Q${x0 + w - 6},-3 ${x0 + w / 2 - 1},-3 Q${x0 + 4},-3 ${x0 + 2},${-d} Z`, c) + ell(x0 + w / 2, -d, w / 2, 4, CREAM) + ell(x0 + w / 2, -d, w / 2 - 4, 2.6, '#e8dccb');
  let s, W, slot, rg;
  if (level === 1) {
    W = 70;
    s = bowl(0, 70, 26, '#2f8a8f', '#226a6e') + line('M50,-24 L66,-40', WOOD, 4) + ell(67, -41, 4, 6, WOODL, { transform: 'rotate(40 67 -41)' });
    slot = [35, -30]; rg = [10, -36];
  } else if (level === 2) {
    W = 82;
    s = rect(0, -6, 82, 6, 3, '#43204f') + rect(60, -38, 14, 34, 5, '#5b2c6f') + rect(18, -40, 60, 12, 6, '#5b2c6f') + rect(18, -40, 58, 5, 3, '#7a4a8f') +
      line('M38,-28 L38,-20', CHROME, 3) + bowl(8, 54, 20, CHROME, '#c9c2b8');
    slot = [35, -24]; rg = [10, -32];
  } else {
    W = 90;
    s = rect(0, -40, 90, 40, 8, '#c9c2b8') + rect(0, -40, 87, 37, 8, CHROME) + rect(0, -40, 87, 6, 3, GOLD) +
      rect(8, -31, 52, 24, 6, INK) + rect(11, -28, 46, 18, 4, '#fdebd0') + circ(74, -22, 7, '#2f8a8f') + circ(74, -22, 5, '#fff') + line('M74,-22 L77,-25', INK, 1.6) + rect(66, -10, 16, 4, 2, GOLD);
    slot = [34, -18]; rg = [74, -46];
  }
  return { art: s, W, H: 42, slot, ring: rg };
}
// How full the bin is: a row of dots under it, red when nearly full.
export function binMeter(used, max) {
  let s = '';
  const gap = 9, x0 = -(max - 1) * gap / 2, warn = max - used <= 1;
  for (let i = 0; i < max; i++) s += circ(x0 + i * gap, 10, 3.6, i < used ? (warn ? '#e2412f' : '#3a2a2a') : CREAM, { stroke: warn ? '#e2412f' : '#b5774a', 'stroke-width': 1 });
  return s;
}
// A stock count on a pantry dough.
export const badge = (x, y, n) => circ(x, y, 8, n ? '#5b2c6f' : '#e2412f') + text(x, y + 4, n, 11, '#fff', { 'text-anchor': 'middle', 'font-family': 'Righteous' });

// ---------- the room ----------
const ferry = (x, y, s = 1) => g(`translate(${x} ${y}) scale(${s})`, path('M-26,8 L26,8 L20,16 L-20,16 Z', CREAM) + rect(-14, -2, 26, 10, 2, '#e2412f') + rect(-10, -8, 6, 8, 1, INK));
function awning() {
  let s = '';
  for (let i = 0; i < 8; i++) { const c = i % 2 ? CREAM : '#5b2c6f', w = 43; s += rect(i * w, 0, w, 22, 0, c) + circ(i * w + w / 2, 22, w / 2, c); }
  return s + rect(0, 0, 344, 3, 0, '#43204f');
}
// The parts of the room that never change during a shift: harbour, awning, counter, tiles, cupboards, floor.
export function roomBack() {
  const tiles = `<defs><pattern id="ktiles" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#fdebd0"/><path d="M24 0 L0 0 0 24" fill="none" stroke="#f1d7b2" stroke-width="2"/></pattern></defs>`;
  return rect(0, 0, 344, 672, 0, '#fdebd0') +
    rect(0, 0, 344, 150, 0, '#cfeeea') + rect(0, 84, 344, 66, 0, '#7cc6c2') +
    line('M30,98 q8,-4 16,0 M150,106 q8,-4 16,0 M250,96 q8,-4 16,0', '#fff', 2, { opacity: .7 }) +
    circ(300, 46, 16, '#ffe08a') + ferry(214, 74, .55) + awning() +
    tiles + rect(0, 178, 344, 210, 0, 'url(#ktiles)');
}
export function roomFront() {
  const cupboards = [[10, 154], [178, 156]].map(([x, w]) => rect(x, 448, w, 92, 8, 'none', { stroke: '#b5774a', 'stroke-width': 3 }) + circ(x + w / 2, 494, 4, '#b5774a')).join('');
  return rect(0, 144, 344, 12, 0, WOODL) + rect(0, 156, 344, 22, 0, WOOD) +
    rect(0, 388, 344, 50, 0, WOODL) + rect(0, 388, 344, 3, 0, '#d9a066') +
    rect(0, 438, 344, 112, 0, WOODM) + cupboards +
    rect(0, 550, 344, 122, 0, '#e7c49a') + line('M0,550 L344,550', '#c98a5a', 3);
}
// The green bin on the counter, for tossing food nobody wants. "on" when she has picked it up.
export const bin = on => rect(-15, -30, 30, 30, 6, on ? '#2e7a2c' : '#3f9b3c') + rect(-17, -34, 34, 7, 3, on ? '#3f9b3c' : '#5cb85a') +
  line('M-6,-22 L-6,-6 M0,-22 L0,-6 M6,-22 L6,-6', '#2e7a2c', 2.2, { opacity: on ? 0 : 1 }) + (on ? line('M-7,-16 L-2,-10 L8,-22', '#fff', 3) : '');

// For the "New: cooking shifts!" card: Tomato in a chef's hat with a fresh bagel.
export const newsArt = () => `<svg viewBox="-60 -50 120 80" aria-hidden="true">${friend('tomato', -22, 0, 1.3, chefHat())}${plate(26, 4, 'bagel', 1.4)}</svg>`;
