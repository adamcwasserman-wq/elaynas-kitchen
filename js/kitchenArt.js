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
  mushroom: s => path('M-20,-2 Q-20,-22 0,-22 Q20,-22 20,-2 Z', '#b8321f') + path('M-18,-3 Q-18,-20 0,-20 Q17,-20 17,-3 Z', '#e2412f') +
    circ(-9, -12, 3.2, CREAM) + circ(4, -15, 2.6, CREAM) + circ(11, -7, 2.4, CREAM) + circ(-2, -7, 1.8, CREAM) +
    rect(-12, -3, 24, 23, 9, '#e8dccb') + rect(-12, -3, 22, 21, 9, CREAM) + face(-1, 5, .85, s),
  cinnamon: s => circ(0, 1, 19, '#a8611e') + circ(-1, 0, 17.5, '#d99a5c') +
    line('M0,1 m-4,0 a4,4 0 1,1 8,0 a8,8 0 1,1 -16,0 a12,12 0 1,1 24,0 a15,15 0 0,1 -10,14', '#a8611e', 2, { opacity: .55 }) +
    line('M-12,-9 Q-4,-14 4,-10 Q10,-6 14,-10', CREAM, 3) + shine(-9, -7, 3.5, 2) + face(0, 2, .9, s),
  // La Cocina's helpers.
  chili: s => path('M-4,-14 C10,-16 18,-4 14,8 C10,18 -2,22 -12,16 C-6,12 -10,2 -10,-6 C-10,-11 -8,-13 -4,-14 Z', '#b8321f') +
    path('M-3,-13 C9,-14 16,-4 12,7 C8,16 -2,19 -10,15 C-5,11 -8,2 -8,-6 C-8,-10 -6,-12 -3,-13 Z', '#e2412f') +
    path('M-6,-14 Q-2,-20 4,-18 Q2,-14 -6,-14 Z M-1,-18 Q0,-24 4,-25', '#3f9b3c') + line('M-1,-18 Q0,-24 4,-25', '#3f9b3c', 2.4) + shine(-4, -7, 3, 2) + face(1, 0, .9, s),
  melon: s => path('M-20,-6 A20,20 0 0 0 20,-6 Z', '#2e7a2c') + path('M-18,-6 A18,18 0 0 0 18,-6 Z', '#bfe6a0') + path('M-16,-6 A16,16 0 0 0 16,-6 Z', '#f0566a') +
    [[-9, 0], [-3, 5], [4, 4], [10, -1], [0, 10]].map(([x, y]) => ell(x, y, 1, 1.6, INK)).join('') + rect(-20, -8, 40, 3, 1.5, '#ff8a96') + face(0, -2, .85, s),
  lime: s => circ(0, 0, 17, '#3f8f2c') + circ(-1.5, -1.5, 15.5, '#7cc242') + circ(-1.5, -1.5, 11, '#b9e07a', { opacity: .35 }) +
    path('M12,-12 Q18,-18 22,-14 Q17,-9 12,-12 Z', '#3f9b3c') + shine(-8, -7, 3.5, 2.2) + face(0, 1, 1, s),
  corn: s => path('M-9,-18 Q0,-26 9,-18 L11,12 Q0,20 -11,12 Z', '#d9a400') + path('M-8,-17 Q0,-24 8,-17 L9,11 Q0,17 -9,11 Z', '#f8d23a') +
    [-12, -6, 0, 6].map(y => line(`M-8,${y} L8,${y}`, '#e2b419', 1, { opacity: .6 })).join('') +
    path('M-11,6 Q-20,-2 -16,-16 Q-10,0 -6,12 Z M11,6 Q20,-2 16,-16 Q10,0 6,12 Z', '#5cb85a') + face(0, -2, .85, s),
  cactus: s => rect(-10, -18, 20, 38, 10, '#2e7a2c') + rect(-9, -17, 17, 36, 9, '#4fa84a') +
    rect(-20, -6, 8, 16, 4, '#4fa84a') + rect(-20, -6, 6, 6, 3, '#4fa84a') + rect(12, -12, 8, 14, 4, '#4fa84a') +
    [[-5, -10], [5, -12], [-6, 12], [6, 10], [-17, 2], [16, -6]].map(([x, y]) => circ(x, y, .9, '#d9f2a6')).join('') + face(0, -2, .85, s),
  // Trattoria's helpers.
  garlic: s => path('M0,-20 Q4,-14 12,-8 Q20,2 14,14 Q8,20 0,20 Q-8,20 -14,14 Q-20,2 -12,-8 Q-4,-14 0,-20 Z', '#e3dccd') + path('M0,-18 Q3,-13 10,-7 Q17,2 12,12 Q7,17 0,17 Q-7,17 -12,12 Q-17,2 -10,-7 Q-3,-13 0,-18 Z', '#fbf7ee') +
    line('M-5,-12 Q-9,2 -6,16 M5,-12 Q9,2 6,16', '#e3dccd', 1.4) + path('M-2,-20 L0,-27 L2,-20 Z', '#c9bf9e') + shine(-8, -3, 2.6, 4) + face(0, 3, .9, s),
  olive: s => ell(0, 1, 15, 19, '#3f5a1c') + ell(-1, 0, 13.5, 17.5, '#6e8f2e') + circ(6, -11, 3.5, '#c7413a') + ell(-6, -6, 3, 5, '#fff', { opacity: .35 }) + face(0, 2, .9, s),
  basil: s => path('M0,-20 Q18,-14 16,4 Q12,18 0,20 Q-12,18 -16,4 Q-18,-14 0,-20 Z', '#2e7a2c') + path('M0,-18 Q15,-12 14,4 Q10,16 0,18 Q-10,16 -14,4 Q-15,-12 0,-18 Z', '#4fa84a') +
    line('M0,-18 L0,18 M0,-6 L8,-12 M0,0 L-9,-6 M0,6 L9,2', '#2e7a2c', 1.2, { opacity: .6 }) + face(0, 1, .85, s),
  penne: s => g('rotate(-12)', path('M-11,-18 L9,-21 L12,17 L-8,20 Z', '#e0a43a') + path('M-9,-17 L8,-19 L10,15 L-6,18 Z', '#f3c46a') +
    [-12, -5, 2, 9].map(y => line(`M-8,${y} L9,${y - 2}`, '#e0a43a', 1.2, { opacity: .6 })).join('') + ell(-1, -19.5, 10, 2.5, '#c98a2a')) + face(0, 1, .85, s),
  meatball: s => circ(0, 1, 18, '#7a3d1e') + circ(-1, 0, 16.5, '#9c5230') + [[-8, -8], [6, -10], [10, 4], [-10, 6], [2, 12], [-2, -2]].map(([x, y]) => circ(x, y, 1.6, '#6b3418')).join('') +
    path('M-12,-12 Q0,-20 12,-12 Q8,-8 0,-9 Q-8,-8 -12,-12 Z', '#d7372a') + shine(-8, -4, 3, 2) + face(0, 3, .9, s),
  peach: s => circ(0, 0, 17, '#e0704a') + circ(-2, -2, 15.5, '#f5a06a') + line('M0,-15 Q-4,-2 0,10', '#e0704a', 1.6, { opacity: .6 }) + path('M1,-17 Q8,-24 14,-20 Q8,-15 1,-17 Z', '#3f9b3c') + shine(-8, -6, 3.5, 2.2) + face(0, 2, 1, s),
};
export const CUSTOMER_KINDS = ['eggplant', 'lemon', 'blueberry', 'pear', 'peach'];
export const friend = (kind, x, y, s = 1, extra = '', cls = '', sad = false) =>
  g(`translate(${x} ${y}) scale(${s})`, `<g class="${cls}">${ell(0, 21, 14, 3, INK, { opacity: .12 })}${FRIEND[kind](sad)}${extra}</g>`);

// A kitchen helper: a small chef's hat, whatever they're carrying held up over their head, and a
// red question mark when they fumbled. "moving" stops the idle bob while they walk.
// Each helper's own look and idle dance (see .h-* in the CSS):
//   Strawberry wears a pink bow and bounces. Bean has sleepy eyelids and a curl of steam and sways slowly.
//   Avocado wears sunglasses up on the hat and leans back. Mushroom wears a teal scarf and wiggles shyly.
//   Cinnamon Roll has a floating heart and gently breathes.
const LOOK = {
  strawberry: { anim: 'h-hop', extra: () => path('M-13,-20 L-7,-17 L-13,-13 Z M-1,-20 L-7,-17 L-1,-13 Z', '#ff7eb6') + circ(-7, -17, 1.8, '#e2508f') },
  bean: { anim: 'h-sway', extra: () => line('M11,-22 q3,-4 0,-8 q-3,-4 0,-8', '#c9b8a8', 1.6, { class: 'steam' }) +
    path('M-7.6,4 a2.6,2.6 0 0 1 5.2,0 Z M2.4,4 a2.6,2.6 0 0 1 5.2,0 Z', '#a8673a') },
  avocado: { anim: 'h-lean', extra: () => ell(-4.5, -16, 3.6, 2.6, INK) + ell(4.5, -16, 3.6, 2.6, INK) + line('M-1,-16.5 L1,-16.5', INK, 1.2) + circ(-5.5, -17, .9, '#fff', { opacity: .7 }) },
  mushroom: { anim: 'h-shy', extra: () => path('M-11,13 Q0,17 11,13 L11,17 Q0,21 -11,17 Z', '#2f8a8f') + path('M6,17 L10,23 L4,20 Z', '#2f8a8f') },
  // La Cocina: Chili wears a tiny bandana, Cocoa has a marshmallow, Lime a flower, Corn a straw hat band, Cactus a pink bloom.
  chili: { anim: 'h-hop', extra: () => path('M-12,-4 Q0,0 12,-6 L12,-2 Q0,4 -12,0 Z', '#1f9e9a') + path('M10,-4 L16,0 L11,1 Z', '#1f9e9a') },
  melon: { anim: 'h-sway', extra: () => line('M9,-14 L13,-28', '#5a2a14', 1.2) + path('M5,-28 Q13,-36 21,-28 Z', '#1f9e9a') + path('M9,-28 Q13,-33 17,-28 Z', '#f6b62e') },
  lime: { anim: 'h-lean', extra: () => [0, 72, 144, 216, 288].map(a => ell(12, -16, 2.2, 4, '#ff7eb6', { transform: `rotate(${a} 12 -12)` })).join('') + circ(12, -12, 1.8, GOLD) },
  corn: { anim: 'h-shy', extra: () => rect(-10, -19, 20, 3, 1.5, '#e8475f') },
  cactus: { anim: 'h-breathe', extra: () => [0, 72, 144, 216, 288].map(a => ell(0, -24, 2.4, 4.2, '#ff7eb6', { transform: `rotate(${a} 0 -20)` })).join('') + circ(0, -20, 2, GOLD) },
  // Trattoria: Garlic twirls a moustache, Olive wears a little bow tie, Basil a flower, Penne a striped scarf, Meatball a napkin.
  garlic: { anim: 'h-hop', extra: () => path('M-1,9 q-5,-3 -9,1 q4,-1 6,2 Z M1,9 q5,-3 9,1 q-4,-1 -6,2 Z', '#5a3a2a') },
  olive: { anim: 'h-sway', extra: () => path('M0,15 L-6,12 L-6,18 Z M0,15 L6,12 L6,18 Z', '#d7372a') + circ(0, 15, 1.6, '#a82a22') },
  basil: { anim: 'h-lean', extra: () => [0, 72, 144, 216, 288].map(a => ell(12, -18, 2, 3.6, '#fff', { transform: `rotate(${a} 12 -14)` })).join('') + circ(12, -14, 1.6, GOLD) },
  penne: { anim: 'h-shy', extra: () => path('M-11,10 Q0,14 11,10 L11,14 Q0,18 -11,14 Z', '#fff') + rect(-4, 10, 3, 6, 0, '#3f9b3c') + rect(2, 10, 3, 6, 0, '#d7372a') },
  meatball: { anim: 'h-breathe', extra: () => path('M-8,12 L8,12 L4,20 L-4,20 Z', '#fff', { stroke: '#e8dccb', 'stroke-width': .8 }) + line('M-4,15 L4,15', '#d7372a', 1) },
  cinnamon: { anim: 'h-breathe', extra: () => `<g class="kheart">${path('M0,2 C-3,-1 -6,1 -4,4 L0,7 L4,4 C6,1 3,-1 0,2 Z', '#ff7eb6', { transform: 'translate(15 -24)' })}</g>` },
};
// "quip" is something they're saying; "atX" is where they really are on the floor (when x is 0 inside
// a moving group), so the speech bubble stays on screen.
export const helper = (kind, x, y, carry = null, oops = false, moving = false, quip = null, atX = x) => friend(kind, x, y, .9, g('translate(0 -1) scale(.62)', chefHat()) +
  (LOOK[kind]?.extra() || '') +
  (carry ? g('translate(0 -38) scale(.9)', FOOD[carry]()) : '') +
  (oops ? g('translate(0 -42)', circ(0, 0, 13, CREAM, { stroke: '#e2412f', 'stroke-width': 2 }) + text(0, 6, '?', 17, '#e2412f', { 'text-anchor': 'middle', 'font-family': 'Righteous' })) : ''),
  moving || oops ? '' : (LOOK[kind]?.anim || 'bob b'), oops) + (quip ? speech(x, y, quip, atX) : '');
// A little speech bubble over a helper's head, nudged sideways to stay on screen near the edges.
function speech(x, y, words, atX) {
  const w = words.length * 5.2 + 14, shift = Math.min(0, 340 - (atX + w / 2)) + Math.max(0, 4 - (atX - w / 2));
  return g(`translate(${x + shift} ${y - 50})`, rect(-w / 2, -11, w, 18, 9, '#fff', { stroke: '#e8dccb', 'stroke-width': 1 }) +
    path(`M${-shift - 4},7 L${-shift},12 L${-shift + 3},7 Z`, '#fff') +
    text(0, 2.5, words, 9.5, INK, { 'text-anchor': 'middle', 'font-family': 'Righteous' }));
}

// A VIP from the merge game's pictures (on the page as #cust-<art>), with a gold star.
export const vip = (art, x, y, cls = '') => g(`translate(${x} ${y})`, `<g class="${cls}">${ell(0, 21, 15, 3, INK, { opacity: .12 })}<use href="#cust-${art}" x="-29" y="-33" width="58" height="58"/></g>` +
  text(17, -14, '★', 14, GOLD, { stroke: '#d99a12', 'stroke-width': .6 }));

// ---------- food, drawn around 0,0 at about 24 across ----------
const RING = (r, h) => `M${-r},0 a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z M${-h},0 a${h},${h} 0 1,0 ${2 * h},0 a${h},${h} 0 1,0 ${-2 * h},0 Z`;
const bagelArt = (dark, light, seeds) => g('scale(1 .8)', path(RING(12, 4), dark, { 'fill-rule': 'evenodd' }) + g('translate(-1 -1.5)', path(RING(11, 4.2), light, { 'fill-rule': 'evenodd' })) +
  (seeds ? [[-6, -6], [3, -8], [7, -2], [-8, 2], [5, 5]].map(([x, y]) => ell(x, y, 1.4, .8, CREAM)).join('') : '') + shine(-6, -5, 3, 1.4));
// A pizza: tomato, melted cheese and basil, with pepperoni slices when "pepperoni".
const pizzaArt = pep => circ(0, 1, 12.5, '#c98a2a') + circ(-.5, .5, 11.5, '#e9a640') + circ(-.5, .5, 9.5, '#d7372a') + circ(-.5, .5, 8.5, '#f6d27a') +
  [[-4, -3], [3, -4], [4, 3], [-3, 4], [0, 0]].map(([x, y]) => circ(x, y, 1.6, '#fff3dc', { opacity: .9 })).join('') +
  (pep ? [[-4, -2], [3, -3], [4, 3], [-3, 4]].map(([x, y]) => circ(x, y, 2.6, '#c7413a') + circ(x - .8, y - .8, .9, '#e86a5a')).join('') : ell(-3, -1, 2, 1.2, '#3f9b3c') + ell(3, 3, 2, 1.2, '#3f9b3c'));
// A slice of lasagna: layers of pasta and sauce, with grated parmesan when "parm".
const lasagnaArt = (dark, light, parm) => rect(-12, -7, 24, 15, 3, dark) + rect(-12, -7, 23, 14, 3, light) +
  [-3, 2].map(y => rect(-12, y, 23, 2.4, 0, '#d7372a', { opacity: .85 })).join('') + rect(-12, -7, 23, 3, 2, '#f6d27a') +
  (parm ? [[-8, -7], [-4, -8], [0, -7], [4, -8], [8, -7], [-6, -9], [2, -9], [6, -9]].map(([x, y]) => rect(x, y, 2, 1.4, .4, '#fff3c4')).join('') : '');
// A scoop of gelato in a cup: "melted" when it waited too long, "empty" while it's being scooped.
const gelatoArt = state => rect(-9, -2, 18, 13, 3, '#5b8fd0') + rect(-9, -2, 17, 12, 3, '#7ab0ea') + rect(-9, 2, 17, 2, 0, '#fff', { opacity: .6 }) +
  (state === 'full' ? circ(-3, -4, 6, '#f6b3c8') + circ(4, -5, 6, '#c9e88a') + circ(0, -9, 5, '#fff3dc') + line('M6,-12 L10,-17', '#c98a2a', 2) + rect(7, -19, 6, 3, 1, '#c98a2a') : '') +
  (state === 'melted' ? path('M-10,-2 Q-6,-6 0,-3 Q6,-6 10,-2 L10,0 Q0,-1 -10,0 Z', '#f6b3c8', { opacity: .85 }) + path('M-6,0 q-1,4 0,7 M3,0 q1,3 0,5', '#f6b3c8') : '');
// A taco: a folded tortilla with meat, lettuce and tomato.
const tacoArt = (dark, light, filled) => (filled ? ell(0, -3, 11, 3.5, '#7a4524') + path('M-11,-4 q3,-4 5,-1 q3,-4 5,-1 q3,-4 5,-1 q3,-4 5,-1 L11,-2 L-11,-2 Z', '#5cb85a') + circ(-4, -6, 1.6, '#e2412f') + circ(4, -6, 1.6, '#e2412f') : '') +
  path('M-13,-3 Q0,20 13,-3 Q0,4 -13,-3 Z', dark) + path('M-12,-3 Q0,17 12,-3 Q0,3 -12,-3 Z', light) + shine(-6, 3, 2.5, 1.2);
// A churro: a ridged golden stick, with cinnamon sugar when "sugar".
const churroArt = (dark, light, sugar) => g('rotate(-25)', rect(-14, -4, 28, 8, 4, dark) + rect(-14, -4.5, 27, 7, 3.5, light) +
  [-9, -4, 1, 6, 11].map(x => line(`M${x},-3.5 L${x},2.5`, dark, .9, { opacity: .6 })).join('') +
  (sugar ? [[-10, -2], [-5, 1], [0, -2], [5, 1], [10, -1], [-8, 2], [3, -3]].map(([x, y]) => circ(x, y, .9, (x + y) % 2 ? '#fff' : '#8a5a2e')).join('') : ''));
// A frozen margarita (tequila, lime and ice): a margarita glass with a salted rim, a lime wedge and a
// straw. "melted" when it waited too long, "empty" while it's being poured.
const glassArt = state => {
  const slush = state === 'full' ? path('M-11,-8 Q-12,-15 -6,-14 Q-4,-19 1,-16 Q5,-20 8,-15 Q13,-15 11,-8 Z', '#a6e07a') + [[-6, -11], [0, -13], [5, -11]].map(([x, y]) => circ(x, y, 1.4, '#e6f7c9')).join('') : '';
  const top = state === 'melted' ? ell(0, -6, 10, 2.2, '#cfe8b8') : state === 'full' ? '' : '';
  return path('M-12,-8 L12,-8 L3,3 L3,10 L7,12 L-7,12 L-3,10 L-3,3 Z', '#dff2f2', { stroke: '#9fc9c6', 'stroke-width': 1 }) +
    (state !== 'empty' ? path('M-11,-7 L11,-7 L2.5,2.5 L-2.5,2.5 Z', state === 'melted' ? '#cfe8b8' : '#8fd05a') : '') + slush + top +
    line('M-12,-8 L12,-8', '#fff', 2) + [-11, -8, -5, -2, 1, 4, 7, 10].map((x, i) => rect(x - .7, -9.6 - (i % 2) * .8, 1.6, 1.6, .3, '#fff', { stroke: '#cfe0e0', 'stroke-width': .3 })).join('') + (state === 'full' ? circ(10, -10, 4.5, '#3f8f2c') + circ(10, -10, 3.2, '#c9e88a') + line('M-4,-12 L-9,-22', '#e8475f', 2) : '') +
    (state === 'melted' ? line('M-13,-12 l3,3 M-13,-9 l3,-3', '#e2412f', 1.4, { opacity: 0 }) + path('M-8,-3 q-2,4 0,6', '#8fd05a') : '');
};
// A pretzel: two loops and crossed arms, drawn as a thick rope. Salt grains on top when salted.
const KNOT = 'M0,-1 C-4,-9 -13,-9 -13,-1 C-13,7 -6,10 0,10 C6,10 13,7 13,-1 C13,-9 4,-9 0,-1 M-7,8 Q0,2 4,-6 M7,8 Q0,2 -4,-6';
const pretzelArt = (dark, light, salt) => line(KNOT, dark, 6.4) + line(KNOT, light, 4) + shine(-9, -4, 2.2, 1.1) +
  (salt ? [[-10, -5], [9, -6], [-12, 3], [12, 2], [-4, 9], [5, 9], [-1, 4], [2, -4]].map(([x, y]) => rect(x - 1.1, y - 1.1, 2.4, 2.4, .6, '#fff')).join('') : '');
const challahArt = (dark, light) => ell(0, 3, 15, 8, dark) + [-8, 0, 8].map(x => ell(x, -.5, 6.5, 7.5, light, { transform: `rotate(-25 ${x} 0)` })).join('') + [-8, 0, 8].map(x => shine(x - 2, -3, 2.2, 1.2)).join('');
const cupArt = (full, cold) => line('M7,-1 Q13,-1 13,4 Q13,9 7,8', '#226a6e', 3) + rect(-10, -6, 18, 17, 4, '#226a6e') + rect(-10, -6, 16, 16, 4, '#2f8a8f') +
  ell(-1, -5.5, 8, 2.4, cold ? '#a8876a' : full ? '#6b3a1e' : '#1d5558') + shine(-6, 1, 1.6, 4) +
  (cold ? line('M-13,-12 l3,3 M-13,-9 l3,-3 M10,-14 l3,3 M10,-11 l3,-3', '#7fb6e6', 1.6) : full ? line('M-4,-10 q-2,-3 0,-6', '#c9b8a8', 1.8, { class: 'steam' }) + line('M2,-10 q2,-3 0,-6', '#c9b8a8', 1.8, { class: 'steam b' }) : '');
export const FOOD = {
  bagel: () => bagelArt('#b8732f', '#e3a24f', true),
  bagelDough: () => bagelArt('#d9bf94', '#f3e2c2', false),
  bagelBurnt: () => bagelArt('#2e1d16', '#57382a', false),
  creamBagel: () => FOOD.bagel() + path('M-9,-3 Q-7,-8 0,-8 Q8,-8 9,-3 Q4,1 0,-1 Q-5,2 -9,-3 Z', CREAM) + path('M-3,-2 Q0,-6 4,-4 Q1,-2 -3,-2 Z', '#e8dccb'),
  // Trattoria
  pizza: () => pizzaArt(false), pizzaDough: () => circ(0, 1, 12, '#e8d2a6') + circ(-.5, .5, 11, '#f6e7c6') + shine(-5, -3, 3, 1.4),
  pizzaBurnt: () => circ(0, 1, 12, '#2e1d16') + circ(-.5, .5, 10, '#57382a'), pepperoniPizza: () => pizzaArt(true),
  lasagna: () => lasagnaArt('#c96a3a', '#e88a4a', false), lasagnaDough: () => lasagnaArt('#e8d2a6', '#f6e7c6', false),
  lasagnaBurnt: () => lasagnaArt('#2e1d16', '#57382a', false), parmLasagna: () => lasagnaArt('#c96a3a', '#e88a4a', true),
  gelato: () => gelatoArt('full'), gelatoEmpty: () => gelatoArt('empty'), gelatoCold: () => gelatoArt('melted'),
  pepperoni: () => ell(0, 4, 12, 5, '#e8dccb') + ell(0, 3, 11, 4.5, '#fffaf0') + [[-5, 2], [1, 0], [6, 3], [-1, 5]].map(([x, y]) => circ(x, y, 3.2, '#c7413a') + circ(x - 1, y - 1, 1, '#e86a5a')).join(''),
  parmesan: () => path('M-11,6 L9,-6 L11,8 Z', '#f3d77a') + path('M-11,6 L9,-6 L9,-3 L-9,7 Z', '#e0b84a') + [[2, 3], [6, 1], [5, 5]].map(([x, y]) => circ(x, y, .9, '#e0b84a')).join('') +
    rect(-12, -12, 9, 5, 2, '#b5ada2') + rect(-11, -11, 7, 3, 1, '#d6cfc6'),
  oliveOil: () => path('M-4,-14 L4,-14 L4,-9 Q8,-6 8,0 L8,12 Q8,14 6,14 L-6,14 Q-8,14 -8,12 L-8,0 Q-8,-6 -4,-9 Z', '#7a8f2e', { opacity: .9 }) + rect(-6, 2, 12, 7, 2, '#f6e7b0') + rect(-3, -18, 6, 5, 1.5, '#3a2a2a'),
  tomatoCan: () => rect(-8, -10, 16, 22, 3, '#d7372a') + rect(-8, -2, 16, 8, 0, '#fff3dc') + circ(0, 2, 3, '#d7372a') + rect(-8, -12, 16, 3, 1.5, '#b5ada2'),
  basilPot: () => path('M-7,4 L7,4 L5,14 L-5,14 Z', '#c96a3a') + [[-4, -2], [0, -6], [4, -2], [-2, 0], [2, 0]].map(([x, y]) => ell(x, y, 3, 4.5, '#4fa84a', { transform: `rotate(${x * 8} ${x} ${y})` })).join(''),
  // La Cocina
  taco: () => tacoArt('#e9a640', '#f3c34a', true),
  tacoDough: () => ell(0, 3, 13, 6, '#e8cf98') + ell(-1, 2, 12, 5, '#f8e7b8') + [[-5, 1], [4, 3], [0, 0], [6, 0]].map(([x, y]) => circ(x, y, .8, '#e2c27a')).join(''),
  tacoBurnt: () => tacoArt('#2e1d16', '#57382a', false),
  salsaTaco: () => tacoArt('#e9a640', '#f3c34a', true) + [[-6, -6], [-1, -8], [4, -6], [8, -7]].map(([x, y]) => circ(x, y, 2.2, '#d7372a')).join('') + [[-3, -9], [6, -9]].map(([x, y]) => circ(x, y, 1.1, '#3f9b3c')).join(''),
  churro: () => churroArt('#b8732f', '#e3a24f', false),
  churroDough: () => churroArt('#d9bf94', '#f3e2c2', false),
  churroBurnt: () => churroArt('#2e1d16', '#57382a', false),
  dulceChurro: () => churroArt('#b8732f', '#e3a24f', false) + line('M-12,-3 q3,4 6,0 q3,-4 6,0 q3,4 6,0 q3,-4 6,0', '#c7741f', 2.6) + line('M-12,-3.6 q3,4 6,0 q3,-4 6,0 q3,4 6,0 q3,-4 6,0', '#e9a03c', 1.2) + circ(-2, 3, 1.4, '#c7741f'),
  // A jar of dulce de leche, with a gingham lid and a spoon.
  dulce: () => rect(-8, -4, 16, 16, 4, '#e8d9bc', { stroke: '#c9a87a', 'stroke-width': .8 }) + rect(-7, 0, 14, 11, 3, '#c7741f') +
    rect(-9, -9, 18, 6, 2, '#e8475f') + [-6, -2, 2, 6].map(x => rect(x - 1, -9, 2, 6, 0, '#fff', { opacity: .5 })).join('') +
    line('M5,-8 L9,-16', '#b5ada2', 1.8) + ell(9.5, -17, 2, 1.4, '#b5ada2') + shine(-4, 4, 1.2, 3),
  // Drinks: each kitchen's drink has a full, an empty (being poured) and a cold or melted look.
  coffeeEmpty: () => cupArt(false),
  margaritaCold: () => glassArt('melted'),
  margarita: () => glassArt('full'),
  margaritaEmpty: () => glassArt('empty'),
  margaritaMelted: () => glassArt('melted'),
  salsa: () => ell(0, 4, 11, 6, '#1f5f9a') + ell(0, 2, 11, 5, '#2f78c0') + ell(0, 0, 9, 3, '#d7372a') + circ(-3, -1, 1, '#3f9b3c') + circ(3, 0, 1, '#3f9b3c') + path('M-8,4 Q0,8 8,4', '#fff', { opacity: .5 }),
  cinnamon: () => rect(-7, -6, 14, 17, 5, '#c9d8d8') + rect(-7, -6, 13, 16, 5, '#eef7f7') + rect(-5, 1, 10, 8, 3, '#a8673a') +
    rect(-7, -11, 14, 6, 2.5, '#9a9088') + [-3, 0, 3].map(x => circ(x, -8, .9, INK)).join('') + shine(-4, -1, 1.2, 3),
  tequila: () => path('M-4,-14 L4,-14 L4,-9 Q8,-7 8,-2 L8,12 Q8,14 6,14 L-6,14 Q-8,14 -8,12 L-8,-2 Q-8,-7 -4,-9 Z', '#e8f2ee', { stroke: '#9fc9c6', 'stroke-width': .8 }) +
    rect(-7, 0, 14, 12, 2, '#f6e7b0', { opacity: .9 }) + rect(-6, 2, 12, 6, 1.5, '#1f9e9a') + path('M0,3 l-2,4 h4 Z', '#7cc242') + rect(-3, -18, 6, 5, 1.5, '#c96a3a'),
  cornCob: () => g('rotate(-30)', ell(0, 0, 5, 11, '#f8d23a') + path('M-6,4 Q-10,-6 -3,-12 Q-4,0 0,10 Z M6,4 Q10,-6 3,-12 Q4,0 0,10 Z', '#5cb85a')),
  chiliPepper: () => path('M-10,-4 Q0,-8 10,2 Q6,8 -2,4 Q-8,2 -10,-4 Z', '#e2412f') + line('M-10,-4 Q-12,-8 -9,-10', '#3f9b3c', 2),
  limeHalf: () => circ(0, 0, 8, '#3f8f2c') + circ(0, 0, 6.5, '#c9e88a') + [0, 60, 120].map(a => line(`M0,0 L${(6 * Math.cos(a * Math.PI / 180)).toFixed(1)},${(6 * Math.sin(a * Math.PI / 180)).toFixed(1)} M0,0 L${(-6 * Math.cos(a * Math.PI / 180)).toFixed(1)},${(-6 * Math.sin(a * Math.PI / 180)).toFixed(1)}`, '#7cc242', .8)).join(''),
  pretzel: () => pretzelArt('#8a4a1e', '#c47a3a', false),
  pretzelDough: () => pretzelArt('#d9bf94', '#f3e2c2', false),
  pretzelBurnt: () => pretzelArt('#2e1d16', '#57382a', false),
  saltPretzel: () => pretzelArt('#8a4a1e', '#c47a3a', true),
  challah: () => challahArt('#a8622a', '#e9a443'),
  challahDough: () => challahArt('#d9bf94', '#f3e2c2'),
  challahBurnt: () => challahArt('#2e1d16', '#57382a'),
  coffee: () => cupArt(true),
  cupEmpty: () => cupArt(false),
  coffeeCold: () => cupArt(true, true),
  // A used plate's leftovers (drawn on a plate): a smear and some crumbs.
  dirty: () => path('M-11,4 Q-7,-2 1,0 Q10,1 9,6 Q2,10 -7,9 Z', '#b8875a', { opacity: .85 }) + path('M-4,3 Q0,1 4,3', '#8a5a2e', { opacity: .6 }) + [[-12, 0], [5, -2], [11, 2], [-2, 8], [2, 4], [-7, 5]].map(([x, y]) => circ(x, y, 1.6, '#8a5a2e')).join(''),
  dirtyPlate: () => ell(0, 4, 13, 5, '#e8dccb') + ell(0, 3, 12, 4.5, CREAM) + g('translate(0 -1) scale(.8)', FOOD.dirty()),
  coin: () => circ(0, 0, 10, '#d99a12') + circ(0, 0, 8.5, GOLD) + text(0, 5, '$', 13, '#8a5a12', { 'text-anchor': 'middle', 'font-family': 'Righteous' }),
  clock: () => circ(0, 0, 13, '#e2412f') + circ(0, 0, 10, CREAM) + line('M0,-6 L0,0 L5,3', INK, 2) + rect(-3, -18, 6, 4, 1.5, '#e2412f') + circ(0, 0, 1.5, INK),
  salt: () => rect(-7, -6, 14, 17, 5, '#c9d8d8') + rect(-7, -6, 13, 16, 5, '#eef7f7') + rect(-5, 2, 10, 7, 3, '#fff') +
    rect(-7, -11, 14, 6, 2.5, '#9a9088') + [-3, 0, 3].map(x => circ(x, -8, .9, INK)).join('') + shine(-4, -1, 1.2, 3),
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

// Trattoria's wood-fired pizza oven (in place of the oven): a brick dome with a fire inside, where the
// food sits while it bakes. Returns the same shape as oven().
export function pizzaOven(level) {
  const W = [104, 120, 136][level - 1], H = [118, 138, 160][level - 1], n = level + 1, cx = W / 2 - 2;
  let s = rect(0, -46, W, 46, 6, '#9c8a7a') + rect(0, -46, W - 4, 42, 6, '#c9b8a8');
  for (let r = 0; r < 2; r++) for (let x = (r % 2) * 10 + 4; x < W - 8; x += 20) s += rect(x, -42 + r * 20, 18, 18, 2, '#d6c7b8');
  const dome = level === 3 ? '#e0703a' : '#c96a3a';
  s += path(`M2,-46 Q2,${-H} ${cx},${-H} Q${W - 6},${-H} ${W - 6},-46 Z`, '#a8562e') + path(`M6,-46 Q6,${-H + 6} ${cx},${-H + 6} Q${W - 10},${-H + 6} ${W - 10},-46 Z`, dome);
  if (level === 3) for (let i = 0; i < 6; i++) s += circ(16 + i * (W - 34) / 5, -52, 3.5, '#2f78c0') + circ(16 + i * (W - 34) / 5, -52, 1.4, GOLD);
  s += path(`M${cx - 30},-46 L${cx - 30},-62 Q${cx},-88 ${cx + 30},-62 L${cx + 30},-46 Z`, '#3a2a2a') + `<g class="flame">${path(`M${cx - 18},-48 Q${cx - 12},-70 ${cx - 4},-58 Q${cx + 2},-78 ${cx + 8},-58 Q${cx + 16},-68 ${cx + 20},-48 Z`, '#f08a2a')}</g>`;
  s += rect(cx - 6, -H - 22, 12, 20, 2, '#a8562e') + (level >= 2 ? rect(cx - 9, -H - 26, 18, 6, 2, '#8a4a1e') : '');
  const slots = [], rings = [];
  for (let i = 0; i < n; i++) { const x = 14 + (W - 32) * (i + .5) / n; slots.push([x, -34]); rings.push([x, -H + 16 + (i % 2) * 2]); }
  return { art: s, W, H, slots, rings, scale: level === 3 ? .8 : .85 };
}
// Trattoria's gelato case (in place of the coffee machine): tubs of gelato under glass, then two,
// then three flavours. Returns the same shape as coffee().
export function gelatoCase(level) {
  const W = [66, 80, 90][level - 1], H = [104, 116, 128][level - 1], n = level;
  const cols = ['#f6b3c8', '#c9e88a', '#fff3dc'];
  let s = rect(0, -60, W, 60, 8, '#4a6fa5') + rect(0, -60, W - 4, 56, 8, '#5b8fd0') + rect(4, -52, W - 12, 6, 3, '#3f5f90');
  s += rect(2, -H, W - 6, H - 62, 8, '#dff2f2', { opacity: .9 }) + rect(2, -H, W - 6, 8, 4, level === 3 ? GOLD : '#d7372a');
  const tw = (W - 10) / n;
  for (let i = 0; i < n; i++) { const x = 5 + i * tw; s += rect(x + 1, -74, tw - 2, 10, 2, '#b5ada2') + path(`M${x + 2},-74 Q${x + tw / 2},-${86 + i % 2 * 2} ${x + tw - 2},-74 Z`, cols[i]); }
  s += shine(10, -H + 20, 1.6, 8);
  const xs = Array.from({ length: n }, (_, i) => 5 + (i + .5) * tw);
  const cups = xs.map(x => [x, -22]);
  return { art: s, W, H, cups, scale: level === 1 ? .95 : level === 2 ? .82 : .74, spoutY: -64 };
}

// La Cocina's stove (in place of the oven): a talavera-tiled stove with a black comal on top,
// where the food sits while it cooks. Returns the same shape as oven().
export function stove(level) {
  const W = [100, 116, 132][level - 1], H = [104, 126, 150][level - 1], n = level + 1, top = -78;
  let s = rect(0, top, W, -top, 10, '#d9cfbe') + rect(0, top, W - 4, -top - 3, 10, '#fbf6ec');
  for (let i = 0; i < Math.floor((W - 16) / 22); i++) s += circ(14 + i * 22, top + 22, 5, '#2f78c0') + circ(14 + i * 22, top + 22, 2, '#f39a1e');
  s += path(`M${W / 2 - 18},0 L${W / 2 - 18},-30 Q${W / 2},-48 ${W / 2 + 18},-30 L${W / 2 + 18},0 Z`, '#5a2a14') +
    `<g class="flame">${path(`M${W / 2 - 12},-4 Q${W / 2 - 8},-24 ${W / 2},-14 Q${W / 2 + 6},-28 ${W / 2 + 12},-4 Z`, '#f08a2a')}</g>`;
  s += rect(-4, top - 10, W + 4, 12, 6, '#2e1d16') + rect(-4, top - 10, W + 4, 4, 3, '#57382a');
  if (level >= 2) s += path(`M10,${-H} L${W - 14},${-H} L${W - 4},${top - 26} L0,${top - 26} Z`, '#b86b3a') + rect(4, top - 30, W - 12, 6, 3, '#d98a52') + rect(W / 2 - 8, -H - 10, 16, 12, 2, '#8a4a1e');
  if (level === 3) s += rect(0, top - 8, W, 3, 1.5, GOLD) + path(`M${W / 2 - 10},${-H + 8} l4,-6 l4,6 l4,-6 l4,6 l4,-6`, GOLD, { opacity: 0 }) + circ(W / 2, -H + 14, 6, GOLD) + circ(W / 2, -H + 14, 3, '#f6d27a');
  const slots = [], rings = [];
  for (let i = 0; i < n; i++) { const x = (W - 4) * (i + .5) / n; slots.push([x, top - 14]); rings.push([x, top - (level >= 2 ? 44 : 38)]); }
  return { art: s, W, H, slots, rings, scale: level === 3 ? .8 : .85 };
}
// La Cocina's frozen margarita station (in place of the coffee machine): a frozen margarita machine
// with swirling tanks, one, two, then three. Returns the same shape as coffee().
export function slushie(level) {
  const W = [64, 80, 92][level - 1], H = [112, 124, 140][level - 1], n = level;
  const cols = ['#8fd05a', '#ff7e9e', '#f6c33e'];
  let s = rect(0, -54, W, 54, 8, '#1f7f7c') + rect(0, -54, W - 4, 50, 8, '#1f9e9a') + rect(4, -46, W - 12, 6, 3, '#167a77');
  const tw = (W - 8) / n;
  for (let i = 0; i < n; i++) {
    const x = 4 + i * tw;
    s += rect(x + 1, -H, tw - 2, H - 56, 8, '#dff2f2') + rect(x + 3, -H + 18, tw - 6, H - 76, 6, cols[i]) +
      `<g class="slosh">${path(`M${x + 6},${-H + 30} q${(tw - 12) / 2},-6 ${tw - 12},0`, '#fff', { opacity: .55 })}</g>` +
      rect(x + 1, -H - 4, tw - 2, 8, 4, level === 3 ? GOLD : '#e8475f') + shine(x + 6, -H + 26, 1.4, 8);
  }
  const xs = Array.from({ length: n }, (_, i) => 4 + (i + .5) * tw);
  const cups = xs.map(x => { s += rect(x - 4, -58, 8, 7, 2, '#5a2a14'); return [x, -22]; });
  return { art: s, W, H, cups, scale: level === 1 ? .95 : level === 2 ? .82 : .74, spoutY: -52 };
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

// The pantry. "items" are the pantry ids on today's menu, big enough to tap: doughs on the top row,
// toppings (cream cheese, salt) on the bottom row. Decorations make room for them.
export function pantry(level, items, theme = 'toronto') {
  const [W, H] = SIZE.pantry[level - 1];
  let s = '';
  const decor = [];
  let rowY, row2Y;
  if (level === 1) {
    s += rect(0, -58, W, 8, 2, WOOD) + rect(0, -4, W, 8, 2, WOOD);
    rowY = -74; row2Y = -22;
    decor.push(['flour', 26, -20], ['beans', 60, -20], ['dough', 96, -14]);
  } else if (level === 2) {
    s += rect(-4, -H, W + 8, H, 10, '#c98a5a') + rect(2, -H + 6, W - 4, H - 10, 6, '#f3dcb8');
    [-H + 48, -H + 92, -6].forEach(y => { s += rect(2, y, W - 4, 7, 2, WOOD); });
    rowY = -H + 74; row2Y = -26;
    decor.push(['flour', 24, -H + 30], ['flour', 50, -H + 30], ['beans', 80, -H + 30], ['beans', 102, -H + 30], ['dough', 30, -22], ['dough', 62, -22], ['creamCheese', 96, -20]);
  } else {
    s += rect(0, -H, W, H, 12, '#c9c2b8') + rect(0, -H, W - 5, H - 4, 12, '#f2eee8') + rect(0, -H, W - 5, 18, 12, '#5b2c6f') + rect(0, -H + 10, W - 5, 8, 0, '#5b2c6f');
    s += rect(8, -H + 26, W - 30, H - 40, 8, '#cfeeea') + rect(12, -H + 30, 6, H - 48, 3, '#fff', { opacity: .6 });
    [-H + 64, -H + 112].forEach(y => { s += rect(8, y, W - 30, 4, 2, '#9fc9c6'); });
    s += rect(W - 18, -H + 50, 6, 64, 3, GOLD);
    rowY = -H + 92; row2Y = -34;
    decor.push(['salt', 30, -H + 48], ['creamCheese', 54, -H + 48], ['flour', 78, -H + 48], ['dough', 34, -30], ['beans', 66, -28]);
  }
  // La Cocina stocks corn, chilies and limes instead of flour and beans.
  if (theme === 'rome') for (const d of decor) d[0] = { flour: 'flour', beans: 'tomatoCan', dough: 'basilPot', salt: 'oliveOil', creamCheese: 'tomatoCan' }[d[0]] || d[0];
  if (theme === 'mexico') for (const d of decor) d[0] = { flour: 'cornCob', beans: 'tequila', dough: 'limeHalf', salt: 'chiliPepper', creamCheese: 'limeHalf' }[d[0]] || d[0];
  // Tappable spots, spread across their row.
  const usable = level === 3 ? W - 30 : W;
  const x0 = level === 3 ? 8 : 0;
  const row = (ids, y) => ids.map((id, i) => ({ id, x: x0 + usable * (i + .5) / Math.max(2, ids.length), y }));
  const spots = [...row(items.filter(id => id.endsWith('Dough')), rowY), ...row(items.filter(id => !id.endsWith('Dough')), row2Y)];
  s += decor.filter(([, x, y]) => !spots.some(sp => Math.hypot(sp.x - x, sp.y - y) < 30)).map(([k, x, y]) => food(k, x, y, .85)).join('');
  return { art: s, W, H, spots };
}

// The prep counter: the board and where each plate goes ("extra" plates on top of the level's own).
export function prep(level, extra = 0) {
  const [W] = SIZE.prep[level - 1];
  const s = level === 3
    ? rect(0, -26, W, 26, 8, '#ddd6cc') + rect(0, -26, W - 3, 23, 8, '#f4f0ea') + line('M14,-18 Q40,-10 60,-20 M90,-8 Q120,-20 150,-12', '#d6cfc6', 1.6) + rect(0, -4, W, 4, 2, GOLD)
    : rect(0, -24, W, 24, 8, '#c4824a') + rect(0, -24, W - 3, 21, 8, '#d99a5c');
  const n = level + 1 + extra, plates = [];
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
// Dirty dishes left on the customer counter: a small stack of used plates, and a coin if they tipped.
export function dishes(x, y, n, tip) {
  let s = '';
  for (let k = 0; k < Math.min(n, 3); k++) s += g(`translate(${x - (tip ? 9 : 0)} ${y - k * 5})`, ell(0, 6, 17, 6, '#e8dccb') + ell(0, 5, 16, 5.5, CREAM) + (k === Math.min(n, 3) - 1 ? FOOD.dirty() : ''));
  if (tip) s += g(`translate(${x + (n ? 20 : 0)} ${y - 2})`, circ(0, 0, 11, '#d99a12') + circ(0, 0, 9, GOLD) + text(0, 5, '$', 14, '#8a5a12', { 'text-anchor': 'middle', 'font-family': 'Righteous' }));
  return s;
}
// The dishwasher, built into a cupboard, at level 1 to 3. "n" plates inside; "share" how far the
// wash has gone (null when idle).
export function dishwasher(level, cx, top, n, share) {
  const W = 64, H = 80, x = cx - W / 2;
  const [edge, body, panel] = level === 3 ? ['#d99a12', '#fff4d6', '#5b2c6f'] : level === 2 ? ['#1d5558', '#cfeeea', '#226a6e'] : ['#c9c2b8', CHROME, '#2f8a8f'];
  let s = rect(x, top, W, H, 8, edge) + rect(x, top, W - 3, H - 3, 8, body) + rect(x + 6, top + 6, W - 15, 10, 4, panel) +
    circ(x + W - 14, top + 11, 3, n ? '#3f9b3c' : '#c9c2b8') + rect(x + 10, top + 22, W - 23, 6, 3, level === 3 ? GOLD : '#b5ada2');
  s += circ(cx - 2, top + 52, level > 1 ? 21 : 19, level === 3 ? GOLD : '#9fc9c6') + circ(cx - 2, top + 52, level > 1 ? 18 : 16, '#cfeeea');
  if (level === 3) s += path(`M${x + 8},${top + 34} l2,-5 l2,5 l5,2 l-5,2 l-2,5 l-2,-5 l-5,-2 Z`, GOLD);
  if (n) {
    s += [0, 1, 2].slice(0, Math.min(n, 3)).map(k => ell(cx - 6 + k * 4, top + 52, 3, 11, CREAM, { stroke: '#e8dccb', 'stroke-width': 1 })).join('');
    if (share !== null) s += [[-10, 44], [6, 60], [2, 42], [-6, 62]].map(([dx, dy], k) => circ(cx - 2 + dx, top + dy, 2 + (k % 2), '#fff', { opacity: .8, class: `steam${k % 2 ? ' b' : ''}` })).join('');
    s += circ(x + W - 8, top + 30, 8, n ? '#5b2c6f' : '#e8dccb') + text(x + W - 8, top + 34, n, 11, '#fff', { 'text-anchor': 'middle', 'font-family': 'Righteous' });
  }
  if (share !== null) s += ring(x + 12, top + 74, share, '#2f8a8f', 'krw', 7);
  return s;
}

// How full the bin is: a row of dots under it, red when nearly full.
export function binMeter(used, max) {
  let s = '';
  const gap = Math.min(9, 52 / Math.max(1, max - 1)), x0 = -(max - 1) * gap / 2, warn = max - used <= 1;
  for (let i = 0; i < max; i++) s += circ(x0 + i * gap, 10, Math.min(3.6, gap / 2.4), i < used ? (warn ? '#e2412f' : '#3a2a2a') : CREAM, { stroke: warn ? '#e2412f' : '#b5774a', 'stroke-width': 1 });
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
// La Cocina's room: a sarape-striped awning, papel picado, a star piñata, talavera tiles,
// terracotta counters, turquoise cupboards and a terracotta floor.
function sarape() {
  const cols = ['#e8475f', '#f39a1e', '#1f9e9a', '#7b3fa0'];
  let s = '';
  for (let i = 0; i < 8; i++) { const c = cols[i % 4], w = 43; s += rect(i * w, 0, w, 22, 0, c) + rect(i * w, 8, w, 3, 0, CREAM, { opacity: .7 }) + circ(i * w + w / 2, 22, w / 2, c); }
  return s + rect(0, 0, 344, 3, 0, '#5a2a14');
}
function papelPicado() {
  const cols = ['#e8475f', '#f6b62e', '#1f9e9a', '#ff7eb6', '#7cc242', '#7b3fa0'];
  let s = line('M0,50 Q172,64 344,50', '#5a2a14', 1.2);
  for (let i = 0; i < 11; i++) {
    const x = 8 + i * 31.5, y = 50 + 14 * Math.sin(Math.PI * x / 344) * .9, c = cols[i % cols.length];
    s += path(`M${x},${y} L${x + 22},${y} L${x + 22},${y + 18} L${x + 19},${y + 21} L${x + 16},${y + 18} L${x + 13},${y + 21} L${x + 10},${y + 18} L${x + 7},${y + 21} L${x + 4},${y + 18} L${x + 1},${y + 21} L${x},${y + 18} Z`, c, { opacity: .95 }) +
      circ(x + 11, y + 8, 3, CREAM, { opacity: .8 }) + path(`M${x + 4},${y + 4} l3,3 l-3,0 Z M${x + 18},${y + 4} l-3,3 l3,0 Z`, CREAM, { opacity: .8 });
  }
  return s;
}
const pinata = (x, y) => g(`translate(${x} ${y})`, line('M0,-30 L0,-12', '#5a2a14', 1.2) +
  [0, 72, 144, 216, 288].map((a, i) => path('M0,0 L-6,-16 L6,-16 Z', ['#e8475f', '#f6b62e', '#1f9e9a', '#ff7eb6', '#7cc242'][i], { transform: `rotate(${a}) translate(0 -6)` })).join('') +
  circ(0, 0, 9, '#fff3dc') + [0, 72, 144, 216, 288].map(a => line('M0,0 L0,14', '#e8475f', 1.4, { transform: `rotate(${a + 36}) translate(0 8)` })).join(''));
const potCactus = (x, y) => g(`translate(${x} ${y})`, rect(-9, -26, 18, 26, 8, '#2e7a2c') + rect(-8, -25, 15, 24, 7, '#4fa84a') + rect(-17, -18, 7, 10, 3.5, '#4fa84a') +
  path('M-11,0 L11,0 L8,12 L-8,12 Z', '#c96a3a') + rect(-12, -2, 24, 4, 2, '#a8562e') + circ(0, -27, 3, '#ff7eb6'));
// Trattoria's room: a scalloped basil-green awning, café globe lights, a lemon tree, warm plaster
// (ochre with a painted lemon border, or sage with a checked band), olive cupboards and a checked floor.
function trattoriaAwning() {
  let s = '';
  for (let i = 0; i < 8; i++) { const c = i % 2 ? '#fff3dc' : '#3f9b3c', w = 43; s += rect(i * w, 0, w, 22, 0, c) + circ(i * w + w / 2, 22, w / 2, c) + (i % 2 ? '' : circ(i * w + w / 2, 40, 3, GOLD)); }
  return s + rect(0, 0, 344, 3, 0, '#2e5a2c');
}
function globeLights() {
  let s = line('M0,56 Q172,72 344,56', '#5a3a2a', 1.2);
  for (let i = 0; i < 12; i++) { const x = 14 + i * 29, y = 56 + 16 * Math.sin(Math.PI * x / 344) * .9; s += line(`M${x},${y} L${x},${y + 5}`, '#5a3a2a', 1) + circ(x, y + 10, 5.5, '#ffe7a3') + circ(x - 1.5, y + 8.5, 1.8, '#fff', { opacity: .8 }); }
  return s;
}
const lemonTree = (x, y) => g(`translate(${x} ${y})`, path('M-9,0 L9,0 L7,12 L-7,12 Z', '#c96a3a') + rect(-10, -2, 20, 4, 2, '#a8562e') + line('M0,0 L0,-18', '#7a4b3a', 2.4) +
  circ(0, -26, 12, '#4fa84a') + circ(-6, -30, 6, '#5cb85a') + [[-6, -24], [5, -28], [2, -20], [-2, -32]].map(([lx, ly]) => ell(lx, ly, 2.6, 2, '#f8d23a')).join(''));
function trattoriaWall(wall) {
  if (wall === 'sage') {
    let s = rect(0, 178, 344, 210, 0, '#dfe8cf');
    for (let x = 0; x < 344; x += 12) s += rect(x, 180, 6, 6, 0, '#d7372a', { opacity: .75 }) + rect(x + 6, 186, 6, 6, 0, '#d7372a', { opacity: .75 });
    return s;
  }
  let s = rect(0, 178, 344, 210, 0, '#f6dfa6') + [[60, 250], [170, 320], [280, 240], [120, 350], [300, 340]].map(([x, y]) => circ(x, y, 1.3, '#ecc87e')).join('');
  for (let x = 14; x < 344; x += 30) s += ell(x, 190, 4, 3, '#f8d23a') + ell(x + 6, 187, 3, 1.6, '#4fa84a', { transform: `rotate(-30 ${x + 6} 187)` });
  return s;
}
// The parts of the room that never change during a shift: harbour, awning, counter, tiles, cupboards, floor.
// "theme" is the restaurant: 'toronto' (the bakery) or 'mexico' (La Cocina).
// La Cocina's wall, three calm choices: warm mango plaster with a tile border, pink stucco with a
// painted flower border, or soft adobe brick.
function cocinaWall(wall) {
  if (wall === 'pink') {
    let s = rect(0, 178, 344, 210, 0, '#f9cfd8') + [[40, 230], [140, 300], [250, 220], [300, 330], [80, 350]].map(([x, y]) => circ(x, y, 1.2, '#efb3c0')).join('');
    for (let x = 12; x < 344; x += 32) s += [0, 90, 180, 270].map(a => ell(x, 190, 2.2, 4, '#f39a1e', { transform: `rotate(${a} ${x} 190) translate(0 -3)` })).join('') + circ(x, 190, 1.8, '#e8475f') + line(`M${x + 6},190 q5,-4 10,0`, '#7cc242', 1.4);
    return s + rect(0, 200, 344, 2, 0, '#e8475f', { opacity: .4 });
  }
  if (wall === 'adobe') {
    let s = rect(0, 178, 344, 210, 0, '#f2c9a0');
    for (let r = 0, y = 182; y < 388; r++, y += 22) for (let x = (r % 2) * -24; x < 344; x += 48) s += rect(x + 2, y, 44, 18, 4, '#f6d5b2');
    return s;
  }
  const band = y => { let b = rect(0, y, 344, 16, 0, '#fbf6ec'); for (let x = 8; x < 344; x += 16) b += circ(x, y + 8, 4, '#2f78c0') + circ(x, y + 8, 1.6, '#f39a1e'); return b + rect(0, y, 344, 1.5, 0, '#c96a3a') + rect(0, y + 14.5, 344, 1.5, 0, '#c96a3a'); };
  return rect(0, 178, 344, 210, 0, '#ffd9a8') + [[60, 240], [170, 300], [280, 250], [110, 340], [310, 200]].map(([x, y]) => circ(x, y, 1.4, '#f6c58a')).join('') + band(180);
}
export function roomBack(theme = 'toronto', wall = 'plaster') {
  const sea = rect(0, 0, 344, 150, 0, '#cfeeea') + rect(0, 84, 344, 66, 0, '#7cc6c2') + line('M30,98 q8,-4 16,0 M150,106 q8,-4 16,0 M250,96 q8,-4 16,0', '#fff', 2, { opacity: .7 }) + ferry(214, 74, .55);
  if (theme === 'rome') return rect(0, 0, 344, 672, 0, '#f6dfa6') + sea + circ(300, 46, 16, '#ffe08a') + trattoriaAwning() + globeLights() + trattoriaWall(wall);
  if (theme === 'mexico') {
    return rect(0, 0, 344, 672, 0, '#fbf6ec') + sea + sarape() + papelPicado() + pinata(304, 86) + cocinaWall(wall);
  }
  const tiles = `<defs><pattern id="ktiles" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#fdebd0"/><path d="M24 0 L0 0 0 24" fill="none" stroke="#f1d7b2" stroke-width="2"/></pattern></defs>`;
  return rect(0, 0, 344, 672, 0, '#fdebd0') + sea + circ(300, 46, 16, '#ffe08a') + awning() + tiles + rect(0, 178, 344, 210, 0, 'url(#ktiles)');
}
export function roomFront(theme = 'toronto') {
  const mx = theme === 'mexico', it = theme === 'rome';
  const [top, edge, low, door, floor, floorLine] = mx ? ['#e3a06a', '#c96a3a', '#1f9e9a', '#167a77', '#e8a56f', '#c96a3a']
    : it ? ['#efe7da', '#b5774a', '#7a8f4e', '#5e7238', '#f3e7d2', '#c98a5a'] : [WOODL, WOOD, WOODM, '#b5774a', '#e7c49a', '#c98a5a'];
  const cupboards = [[10, 154], [178, 156]].map(([x, w]) => rect(x, 448, w, 92, 8, 'none', { stroke: door, 'stroke-width': 3 }) + circ(x + w / 2, 494, 4, mx ? '#f6b62e' : door)).join('');
  const floorTiles = it ? `<defs><pattern id="kcheck" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="${floor}"/><rect width="16" height="16" fill="#c96a3a" opacity=".28"/><rect x="16" y="16" width="16" height="16" fill="#c96a3a" opacity=".28"/></pattern></defs>` : mx ? `<defs><pattern id="kbarro" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="${floor}"/><path d="M32 0 L0 0 0 32" fill="none" stroke="#d98a52" stroke-width="2"/></pattern></defs>` : '';
  return rect(0, 144, 344, 12, 0, top) + rect(0, 156, 344, 22, 0, edge) + (mx ? potCactus(326, 156) : it ? lemonTree(326, 156) : '') +
    rect(0, 388, 344, 50, 0, top) + rect(0, 388, 344, 3, 0, mx ? '#f39a1e' : '#d9a066') +
    rect(0, 438, 344, 112, 0, low) + cupboards +
    floorTiles + rect(0, 550, 344, 122, 0, mx ? 'url(#kbarro)' : it ? 'url(#kcheck)' : floor) + line('M0,550 L344,550', floorLine, 3);
}
// The green bin on the counter, for tossing food nobody wants. "on" when she has picked it up.
// The bin at level 1 to 3: green, a bigger green one, then a wooden compost bin with a leaf.
export function bin(on, level = 1) {
  if (level === 3) return rect(-17, -32, 34, 32, 5, on ? '#6b3a1e' : '#8a5a2e') + rect(-19, -36, 38, 7, 3, on ? '#8a5a2e' : '#a8673a') +
    line('M-17,-22 L17,-22 M-17,-12 L17,-12', '#6b3a1e', 2) + path('M-4,-26 Q4,-34 10,-28 Q4,-22 -4,-26 Z', '#3f9b3c') + (on ? line('M-7,-16 L-2,-10 L8,-22', '#fff', 3) : '');
  const w = level === 2 ? 18 : 15, h = level === 2 ? 34 : 30;
  return rect(-w, -h, 2 * w, h, 6, on ? '#2e7a2c' : '#3f9b3c') + rect(-w - 2, -h - 4, 2 * w + 4, 7, 3, on ? '#3f9b3c' : '#5cb85a') +
    line(`M-6,${-h + 8} L-6,-6 M0,${-h + 8} L0,-6 M6,${-h + 8} L6,-6`, '#2e7a2c', 2.2, { opacity: on ? 0 : 1 }) + (on ? line('M-7,-16 L-2,-10 L8,-22', '#fff', 3) : '');
}

// For the "New: the Trattoria has a kitchen!" card: Garlic with a pizza and a cup of gelato.
export const trattoriaNewsArt = () => `<svg viewBox="-60 -50 120 80" aria-hidden="true">${friend('garlic', -26, 0, 1.3, chefHat())}${plate(18, 4, 'pizza', 1.3)}${food('gelato', 44, 0, 1.2)}</svg>`;
// For the "New: La Cocina has a kitchen!" card: Chili with a taco and a frozen margarita.
export const cocinaNewsArt = () => `<svg viewBox="-60 -50 120 80" aria-hidden="true">${friend('chili', -26, 0, 1.3, chefHat())}${plate(18, 4, 'taco', 1.3)}${food('margarita', 44, 0, 1.2)}</svg>`;
// For the "New: cooking shifts!" card: Tomato in a chef's hat with a fresh bagel.
export const newsArt = () => `<svg viewBox="-60 -50 120 80" aria-hidden="true">${friend('tomato', -22, 0, 1.3, chefHat())}${plate(26, 4, 'bagel', 1.4)}</svg>`;
