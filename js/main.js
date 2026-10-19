// Elayna's Kitchen.
// Phase 1: one city (Toronto), the merge board, the pantry crate, two food chains,
// customer orders, dollars and automatic saving.
// Phase 2: mixing two different foods into dishes, the recipe book, badges,
// and restaurant upgrades.
//
// How a turn works: tap the pantry crate to get ingredients, drag two matching items
// together to merge them, drag two different ones together to try a recipe,
// and serve customers what they ask for.

import { CONFIG } from '../data/config.js';
import { CHAINS, PRODUCERS, ORDER_VALUE, SELL_VALUE } from '../data/items.js';
import { CITIES, COMING_SOON } from '../data/cities.js';
import { RECIPES, RENAMED_DISHES, RECIPE_DISCOVERY_REWARD, recipeLevel, recipeCity } from '../data/recipes.js';
import { BADGES, BADGE_REWARD, BADGE_TIER_NAMES } from '../data/badges.js';
import { UPGRADES, LEVEL_NEEDS, themeFor } from '../data/restaurant.js';
import { CUSTOMERS } from '../data/customers.js';
import { VIPS, VIP_RULES } from '../data/vips.js';
import { ORDER_STAGES, ORDER_STARS, SPEED_TIP, BIG_ORDER_BONUS, COMPLAINTS, MAX_WANTS } from '../data/orders.js';
import { MOODS, DEFAULT_MOOD } from '../data/moods.js';
import { buildSprite, use, ICONS, badgeSvg, restaurantSvg } from './art.js';
import { islandSvg, islandGeom, isoPoint, isoTile, isLand, fromCentre } from './island.js';
import { ISLAND, PIECES, ISLAND_DECOR } from '../data/island.js';
import { HOOD, BIA, IMPROVEMENTS, AMENITIES, EVENTS, HOOD_CHOICES, RESTAURANT_BUZZ, BUZZ_LEVELS, VISITORS_PER_BUZZ } from '../data/neighbourhood.js';
import { MISSIONS } from '../data/missions.js';
import { loadSave, writeSave, clearSave, toCode, fromCode, SAVE_VERSION } from './save.js';
import { createArcade } from './arcade.js';
import { GEMS, TICKETS_PER_GEM, SHOP } from '../data/arcade.js';

const COLS = CONFIG.board.cols;
const ROWS = CONFIG.board.rows;
const CELLS = COLS * ROWS;
const $ = sel => document.querySelector(sel);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const idx = (col, row) => row * COLS + col;
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

// ---------- items ----------
// A board item is one of: { chain, tier }, { dish }, or { producer }.
const recipeOf = id => RECIPES.find(r => r.id === id);
const isChain = it => !!it && !!it.chain;
const tierInfo = it => CHAINS[it.chain].tiers[it.tier - 1];
const artId = it => it.producer ? `art-${it.producer}` : it.wild ? 'art-wild' : it.dish ? `art-${it.dish}` : `art-${tierInfo(it).id}`;
const nameOf = it => it.producer ? PRODUCERS[it.producer].name : it.wild ? 'Wild card' : it.dish ? recipeOf(it.dish).name : tierInfo(it).name;
const keyOf = it => it.producer ? it.producer : it.wild ? 'wild' : it.dish ? `dish:${it.dish}` : `${it.chain}:${it.tier}`;
const familyOf = it => it.producer ? 'producer' : it.wild ? 'wild' : it.dish ? 'dish' : it.chain;
const maxTier = chain => CHAINS[chain].tiers.length;
const sameItem = (a, b) => a.chain === b.chain && a.tier === b.tier;
const canMerge = (a, b) => isChain(a) && isChain(b) && sameItem(a, b) && a.tier < maxTier(a.chain);
const findRecipe = (a, b) => (!isChain(a) || !isChain(b)) ? null :
  RECIPES.find(r => (sameItem(r.a, a) && sameItem(r.b, b)) || (sameItem(r.a, b) && sameItem(r.b, a))) || null;
const itemValue = it => it.dish ? recipeOf(it.dish).value : ORDER_VALUE[it.tier - 1];
const sellValue = it => it.dish ? Math.round(recipeOf(it.dish).value / 4) : SELL_VALUE[it.tier - 1];

// ---------- game state ----------
let S = null;          // everything that gets saved
let sel = -1;          // the selected square on the board
let orderPick = null;  // or: an item tapped inside an order, as { o, k }
let lastSale = null;   // for "Undo" after selling
let lastAction = Date.now();

// ---------- cities ----------
// Each city keeps these for itself; everything else (gems, Island dollars, badges, recipes) is shared.
// "dollars" is the restaurant's own tip jar: tips earned in one restaurant only buy upgrades there.
const CITY_KEYS = ['board', 'orders', 'orderSeq', 'served', 'dollars', 'producers', 'upLv', 'choices', 'decor', 'cityStars', 'starLevel', 'complaints'];
const cityOf = id => CITIES.find(c => c.id === id) || CITIES[0];
const city = () => cityOf(S?.city);

// A city the first time she arrives: its starter blocks and one ingredient to begin with.
function newCityState(id) {
  const c = cityOf(id);
  const board = Array(CELLS).fill(null);
  c.starts.forEach((p, n) => { board[idx(2 + n, 3)] = { producer: p }; });
  const first = PRODUCERS[c.starts[0]].makes[0];
  board[idx(1, 4)] = { chain: first.chain, tier: 1 };
  return { board, orders: [], orderSeq: 0, served: 0, dollars: 0, producers: [...c.starts], upLv: {}, choices: {}, decor: [], cityStars: 0, starLevel: 0, complaints: 0 };
}

function travel(id) {
  if (id === S.city || !S.openCities.includes(id)) return;
  S.cityData[S.city] = Object.fromEntries(CITY_KEYS.map(k => [k, S[k]]));
  Object.assign(S, S.cityData[id] || newCityState(id));
  const firstVisit = !S.cityData[id];
  delete S.cityData[id];
  S.city = id;
  sel = -1; orderPick = null;
  fillOrders();
  for (const it of S.board) if (it && !it.producer) S.seen[keyOf(it)] ??= true;
  closeSheets();
  renderAll();
  const c = city();
  if (firstVisit) {
    const makes = PRODUCERS[c.starts[0]];
    celebrate({ art: restaurantPhoto(), wide: true, title: `Welcome to ${c.name}!`, name: c.restaurant,
      line: `Tap the ${makes.name.toLowerCase()} to start cooking. New foods, new recipes, new customers.` });
  } else toast(`Back at ${c.name}! $${S.dollars.toLocaleString()} in the tip jar.`);
  buzz('serve');
  save();
}

// ---------- the neighbourhood ----------
// Her restaurants share one street. Improvements, amenities, events, restaurant stars and
// upgrades add buzz; buzz levels pay gems and make customers pay more everywhere.
const ALL_HOOD = [...IMPROVEMENTS, ...AMENITIES];
function restaurantBuzz() {
  let b = 0;
  for (const c of CITIES) {
    if (!S.openCities.includes(c.id)) continue;
    const d = c.id === S.city ? S : S.cityData[c.id];
    if (d) b += (d.starLevel || 0) * RESTAURANT_BUZZ.perStar + Object.values(d.upLv || {}).reduce((t, n) => t + n, 0) * RESTAURANT_BUZZ.perUpgrade;
  }
  return b;
}
// Improvements are built in stages (S.hood.stages); amenities are built once (S.hood.built).
const stageOf = id => S.hood.stages[id] || 0;
const stageBuzz = x => x.stages.slice(0, stageOf(x.id)).reduce((t, st) => t + st.buzz, 0);
const hoodBuzz = () => restaurantBuzz() +
  IMPROVEMENTS.reduce((t, x) => t + stageBuzz(x), 0) +
  S.hood.built.reduce((t, id) => t + (AMENITIES.find(x => x.id === id)?.buzz || 0), 0) +
  Object.keys(S.hood.hosted).reduce((t, id) => t + (EVENTS.find(e => e.id === id)?.firstBuzz || 0), 0);
const hoodLevelFor = b => BUZZ_LEVELS.reduce((l, x, i) => (b >= x.at ? i : l), 0);
const hoodBonus = () => BUZZ_LEVELS[S.hood.level]?.bonus || 0;
const activeEvent = () => (S.hood.event ? EVENTS.find(e => e.id === S.hood.event.id) : null);
const eventBonus = () => activeEvent()?.bonus || 0;
// ---------- Island dollars: the neighbourhood's own money ----------
// Visitors spend money on the street; it waits in S.hood.pot until she collects it into S.hood.bia.
const biaPerHour = () => BIA.basePerHour + hoodBuzz() * BIA.perBuzzPerHour;
function accrueBia() {
  const now = Date.now(), hrs = (now - (S.hood.potAt || now)) / 3600000;
  S.hood.potAt = now;
  const cap = biaPerHour() * BIA.maxHours;
  if (S.hood.pot < cap) S.hood.pot = Math.min(cap, S.hood.pot + biaPerHour() * hrs);
}
const potReady = () => Math.floor(S.hood.pot);
function visitorsSpend(pay) { S.hood.pot += Math.max(1, Math.round(pay * BIA.orderShare)); }
function collectBia() {
  accrueBia();
  const n = potReady();
  if (!n) return;
  S.hood.bia += n;
  S.hood.pot -= n;
  buzz('serve');
  toast(`+$${n.toLocaleString()} for the ${S.hood.name} fund!`);
  renderHood(); renderHeader(); save();
}
// Is there something new for her on the neighbourhood screen?
const hoodNews = () => potReady() >= BIA.dotAt || IMPROVEMENTS.some(x => x.stages[stageOf(x.id)] && S.hood.bia >= x.stages[stageOf(x.id)].cost);

const hoodChoice = key => HOOD_CHOICES[key].find(c => c.colour === S.hood.choices[key]) || HOOD_CHOICES[key][0];

// ---------- Tulip Island: the map she builds on ----------
// S.hood.island = { land: how big the island is (0 to 5, see ISLAND.land), pieces: [{ uid, kind, type, x, y }], next: the next uid }
// kind is 'imp' (a landmark: one of the 12 improvements), 'amen' (an amenity) or 'decor' (a decoration).
// A landmark's stage lives in S.hood.stages and an amenity in S.hood.built, as before; the island only adds where they are.
const isl = () => S.hood.island;
const landRadius = (lv = isl().land) => ISLAND.land[lv].radius;
const decorOf = type => ISLAND_DECOR.find(d => d.id === type);
const sizeOf = (kind, type) => kind === 'decor' ? [1, 1] : PIECES[type].size;
const placeOf = (kind, type) => kind === 'decor' ? decorOf(type).on : PIECES[type].on;
const pieceOf = (kind, type) => isl().pieces.find(p => p.kind === kind && p.type === type);
const pieceName = p => p.kind === 'decor' ? decorOf(p.type).name : p.kind === 'amen' ? AMENITIES.find(a => a.id === p.type).name : IMPROVEMENTS.find(x => x.id === p.type).name;
const squaresOf = (x, y, w, d) => { const out = []; for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([x + i, y + j]); return out; };
const lotOf = slot => ISLAND.lots[slot];
// Squares that stay water even as the island grows: under docks, harbours, boats and ducks.
function waterSquares(skip = null) {
  const set = new Set();
  for (const p of isl().pieces) if (p.uid !== skip && ['water', 'sea'].includes(placeOf(p.kind, p.type))) for (const [x, y] of squaresOf(p.x, p.y, ...sizeOf(p.kind, p.type))) set.add(`${x},${y}`);
  return set;
}
function takenSquares(skip = null) {
  const set = new Set();
  for (const [x, y] of Object.values(ISLAND.lots)) for (const [a, b] of squaresOf(x, y, 2, 2)) set.add(`${a},${b}`);
  for (const p of isl().pieces) if (p.uid !== skip) for (const [x, y] of squaresOf(p.x, p.y, ...sizeOf(p.kind, p.type))) set.add(`${x},${y}`);
  return set;
}
// Can this piece go here? Returns { ok } or { ok: false, why } in words for her.
function fits(kind, type, x, y, skip = null) {
  const [w, d] = sizeOf(kind, type), on = placeOf(kind, type), N = ISLAND.size;
  const water = waterSquares(skip), taken = takenSquares(skip), R = landRadius();
  const land = (a, b) => isLand(R, water, a, b);
  let nextToSea = false, nextToLand = false;
  for (const [a, b] of squaresOf(x, y, w, d)) {
    if (a < 0 || b < 0 || a >= N || b >= N) return { ok: false, why: "That's too far out to sea." };
    if (taken.has(`${a},${b}`)) return { ok: false, why: 'Something is already there.' };
    if (on === 'land' || on === 'shore') {
      if (!land(a, b)) return { ok: false, why: 'That goes on the island.' };
      if (b === ISLAND.mainStreet) return { ok: false, why: 'Keep Main Street clear for visitors.' };
    } else if (land(a, b)) return { ok: false, why: 'That goes in the water.' };
    for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (land(a + da, b + db)) nextToLand = true; else nextToSea = true; }
  }
  if (on === 'water' && !nextToLand) return { ok: false, why: 'Put it right next to the island.' };
  if (on === 'shore' && !nextToSea) return { ok: false, why: 'Put it on the shore, next to the water.' };
  return { ok: true };
}
// The best free spot for a piece: as close to the middle of the island as it fits.
function suggestSpot(kind, type, skip = null) {
  const [w, d] = sizeOf(kind, type), spots = [];
  for (let y = 0; y < ISLAND.size; y++) for (let x = 0; x < ISLAND.size; x++) spots.push([x, y, fromCentre(x + (w - 1) / 2, y + (d - 1) / 2)]);
  spots.sort((a, b) => a[2] - b[2]);
  const hit = spots.find(([x, y]) => fits(kind, type, x, y, skip).ok);
  return hit ? { x: hit[0], y: hit[1] } : null;
}
// Older saves: put everything she already built somewhere sensible (growing the island for free if it's full).
function autoPlace(kind, type) {
  for (;;) {
    const spot = suggestSpot(kind, type);
    if (spot) { isl().pieces.push({ uid: isl().next++, kind, type, ...spot }); return; }
    if (isl().land >= ISLAND.land.length - 1) return;
    isl().land++;
  }
}
function ensureIsland() {
  S.hood.island ??= { land: 0, pieces: [], next: 1 };
  if (S.hood.name === 'Tulip Row') S.hood.name = HOOD.defaultName; // the old default name becomes the island's
  for (const x of IMPROVEMENTS) if (stageOf(x.id) && !pieceOf('imp', x.id)) autoPlace('imp', x.id);
  for (const id of S.hood.built) if (!pieceOf('amen', id)) autoPlace('amen', id);
}

let islNight = null; // null: follow the clock
const clockNight = () => { const h = new Date().getHours(); return h >= ISLAND.night.from || h < ISLAND.night.to; };
const isNight = () => islNight ?? clockNight();
const islScale = () => (innerWidth < 600 ? .72 : .9);
function islandScene({ crop = false, focus = null, event = S.hood.event?.id || null, ghost = null } = {}) {
  const lv = isl().land, water = waterSquares();
  const shops = CITIES.map(c => {
    const d = c.id === S.city ? S : S.cityData[c.id] || {}, [x, y] = lotOf(c.slot);
    return { x, y, open: S.openCities.includes(c.id), sign: c.sign, wall: c.look.wall, roof: c.look.awning, awning: c.look.awning,
      stars: d.starLevel || 0, ups: Object.values(d.upLv || {}).reduce((t, n) => t + n, 0), here: c.id === S.city, label: 'For lease' };
  }).concat(COMING_SOON.map(c => ({ x: lotOf(c.slot)[0], y: lotOf(c.slot)[1], open: false, label: 'Coming soon' })));
  const pieces = isl().pieces.map(p => { const [w, d] = sizeOf(p.kind, p.type); return { ...p, w, d, stage: p.kind === 'imp' ? stageOf(p.type) : 1 }; });
  const dock = pieces.find(p => p.type === 'streetcar');
  return islandSvg({
    radius: landRadius(lv), saleRadius: ISLAND.land[lv + 1]?.radius || 0, water,
    paths: new Set(isl().pieces.filter(p => p.type === 'path').map(p => `${p.x},${p.y}`)),
    shops, pieces, focus, ghost, event, crop, name: S.hood.name,
    choices: { trees: hoodChoice('trees').colour, flowers: hoodChoice('flowers').colour, mural: hoodChoice('mural').name },
    people: Math.min(40, 2 + Math.floor(hoodBuzz() / 90)), sailboats: ISLAND.sailboats[S.hood.level] || 1,
    ferry: dock ? { ...dock, stage: dock.stage } : null, night: isNight(),
    scale: crop ? 1 : islScale(), label: `${S.hood.name}, seen from above`,
  });
}

// Reaching a new buzz level is a big moment.
function checkHood() {
  const target = hoodLevelFor(hoodBuzz());
  while (S.hood.level < target) {
    const L = BUZZ_LEVELS[++S.hood.level];
    S.gems += L.gems;
    S.hood.bia += L.bia || 0;
    const opens = [...AMENITIES, ...EVENTS].filter(x => x.needs === S.hood.level).map(x => x.name);
    celebrate({
      art: islandScene({ crop: true }), wide: true, title: `${S.hood.name} is a ${L.name}!`, name: `Customers pay ${Math.round(L.bonus * 100)}% more everywhere`,
      line: `${L.bia ? `+$${L.bia.toLocaleString()} for the island fund. ` : ''}${opens.length ? `Now you can build or host: ${opens.join(', ')}.` : 'More boats and visitors come to the island.'}`, gems: L.gems,
    });
  }
}

// ----- what's happening on the island screen -----
let islTab = 'build';
let islMode = null;  // placing or moving a piece: { do: 'place' | 'move', kind, type, uid }
let islGhost = null; // where that piece would go: { x, y }
let islSel = null;   // the piece she tapped (its uid), or 'land' when she tapped the sand
const ghostFor = () => {
  if (!islMode || !islGhost) return null;
  const [w, d] = sizeOf(islMode.kind, islMode.type);
  return { kind: islMode.kind, type: islMode.type, x: islGhost.x, y: islGhost.y, w, d, uid: null,
    stage: islMode.kind === 'imp' ? Math.max(1, stageOf(islMode.type)) : 1, ok: fits(islMode.kind, islMode.type, islGhost.x, islGhost.y, islMode.uid).ok };
};
const costToPlace = (kind, type) => kind === 'decor' ? decorOf(type).cost : kind === 'amen' ? AMENITIES.find(a => a.id === type).cost : IMPROVEMENTS.find(x => x.id === type).stages[0].cost;
const pips = n => `<span class="pips">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;

function improveRow(x) {
  const n = stageOf(x.id), next = x.stages[n], top = !next;
  const can = !top && S.hood.bia >= next.cost;
  const right = top ? `<span class="upg-done">${ICONS.check}</span>`
    : n ? `<button class="btn primary upg-buy" data-isl-up="${x.id}"${can ? '' : ' disabled'}>Upgrade<br>$${next.cost.toLocaleString()}</button>`
    : `<button class="btn primary upg-buy" data-isl-place="imp:${x.id}"${can ? '' : ' disabled'}>Build<br>$${next.cost.toLocaleString()}</button>`;
  const note = top ? `${x.stages[2].name}. ${x.stages[2].about}`
    : `${n ? `Now: ${x.stages[n - 1].name}. Next: ` : ''}${next.name}. ${next.about} +${next.buzz} buzz.`;
  const swatches = n && x.choice ? `<div class="swatches">${HOOD_CHOICES[x.choice].map(c =>
    `<button class="swatch${hoodChoice(x.choice).colour === c.colour ? ' on' : ''}" data-hood-choice="${x.choice}" data-colour="${c.colour}" style="background:${c.colour}" aria-label="${c.name}"></button>`).join('')}</div>` : '';
  const p = pieceOf('imp', x.id);
  return `<li class="upg${top ? ' done' : can ? ' next' : ''}${p && islSel === p.uid ? ' focused' : ''}"${p ? ` data-isl-find="${p.uid}"` : ''}>` +
    `<div class="upg-text"><b>${x.name} ${pips(n)}</b><span>${note}</span>${swatches}</div>${right}</li>`;
}
function amenityRow(x) {
  const built = S.hood.built.includes(x.id), locked = x.needs && S.hood.level < x.needs;
  const can = !built && !locked && S.hood.bia >= x.cost;
  const right = built ? `<span class="upg-done">${ICONS.check}</span>` : locked ? '<span class="upg-cost">Locked</span>'
    : `<button class="btn primary upg-buy" data-isl-place="amen:${x.id}"${can ? '' : ' disabled'}>Build<br>$${x.cost.toLocaleString()}</button>`;
  const note = locked ? `Opens when ${S.hood.name} is a ${BUZZ_LEVELS[x.needs].name}.` : `${x.about} +${x.buzz} buzz.`;
  const p = pieceOf('amen', x.id);
  return `<li class="upg${built ? ' done' : can ? ' next' : locked ? ' later' : ''}${p && islSel === p.uid ? ' focused' : ''}"${p ? ` data-isl-find="${p.uid}"` : ''}>` +
    `<div class="upg-text"><b>${x.name}</b><span>${note}</span></div>${right}</li>`;
}
function growRow() {
  const lv = isl().land, next = ISLAND.land[lv + 1];
  if (!next) return `<li class="upg done"><div class="upg-text"><b>The island is as big as it gets</b><span>Every bit of shoreline is yours.</span></div><span class="upg-done">${ICONS.check}</span></li>`;
  const can = S.hood.bia >= next.cost;
  return `<li class="upg${can ? ' next' : ''}"><div class="upg-text"><b>Grow the island</b><span>More shoreline to build on (size ${lv + 2} of ${ISLAND.land.length}). You can also tap the sand on the map.</span></div>` +
    `<button class="btn primary upg-buy" data-isl-grow${can ? '' : ' disabled'}>Grow<br>$${next.cost.toLocaleString()}</button></li>`;
}

function renderIslandMap() {
  const box = $('#isl-map'), fresh = !box.firstChild, keep = [box.scrollLeft, box.scrollTop];
  box.innerHTML = islandScene({ focus: typeof islSel === 'number' ? islSel : null, ghost: ghostFor() });
  if (fresh) centreMap(ISLAND.centre, ISLAND.centre); else { box.scrollLeft = keep[0]; box.scrollTop = keep[1]; }
  $('#isl-night').textContent = isNight() ? '☀' : '☾';
  $('#isl-night').setAttribute('aria-label', isNight() ? 'Switch to daytime' : 'Switch to night');
}
// Bring the map back into view when she picks something from the lists below it.
const showMap = () => $('.isl-mapwrap').scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
function centreMap(x, y, smooth = false) {
  const box = $('#isl-map'), p = isoPoint(islandGeom(), x, y), s = islScale();
  box.scrollTo({ left: p[0] * s - box.clientWidth / 2, top: p[1] * s - box.clientHeight / 2 - 30 * s, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
}
// The card over the bottom of the map: placing, moving, a tapped piece, or growing the island.
function renderBanner() {
  const el = $('#isl-banner');
  let html = '';
  if (islMode) {
    const name = islMode.do === 'move' ? pieceName(isl().pieces.find(p => p.uid === islMode.uid)) : islMode.kind === 'decor' ? decorOf(islMode.type).name : pieceName({ kind: islMode.kind, type: islMode.type });
    const g = ghostFor(), why = g && !g.ok ? fits(islMode.kind, islMode.type, g.x, g.y, islMode.uid).why : null;
    if (islMode.kind === 'decor' && islMode.do === 'place') {
      const cost = decorOf(islMode.type).cost;
      html = `<div class="isl-b-text"><b>${name} · $${cost}</b><span>${S.hood.bia < cost ? 'Not enough Island dollars yet.' : why || 'Tap the map to place one. Tap again for more.'}</span></div><button class="btn primary" data-isl-done>Done</button>`;
    } else {
      const cost = islMode.do === 'place' ? costToPlace(islMode.kind, islMode.type) : 0;
      const can = g && g.ok && S.hood.bia >= cost;
      html = `<div class="isl-b-text"><b>${name}${cost ? ` · $${cost.toLocaleString()}` : ''}</b><span>${why || (islMode.do === 'move' ? 'Tap where it should go.' : 'Tap the map to choose a spot.')}</span></div>` +
        `<button class="btn primary" data-isl-confirm${can ? '' : ' disabled'}>${islMode.do === 'move' ? 'Move here' : 'Build here'}</button><button class="btn ghost" data-isl-cancel>Cancel</button>`;
    }
  } else if (islSel === 'land') {
    const next = ISLAND.land[isl().land + 1];
    html = next ? `<div class="isl-b-text"><b>Grow the island · $${next.cost.toLocaleString()}</b><span>${S.hood.bia >= next.cost ? 'More shoreline to build on.' : `$${(next.cost - S.hood.bia).toLocaleString()} more Island dollars to go.`}</span></div>` +
      `<button class="btn primary" data-isl-grow${S.hood.bia >= next.cost ? '' : ' disabled'}>Grow</button><button class="btn ghost" data-isl-cancel>×</button>` : '';
  } else if (typeof islSel === 'number') {
    const p = isl().pieces.find(q => q.uid === islSel);
    if (p) {
      let up = '', sub = '';
      if (p.kind === 'imp') {
        const x = IMPROVEMENTS.find(i => i.id === p.type), n = stageOf(p.type), next = x.stages[n];
        sub = `${pips(n)} ${x.stages[n - 1].name}`;
        if (next) up = `<button class="btn primary" data-isl-up="${p.type}"${S.hood.bia >= next.cost ? '' : ' disabled'}>Upgrade $${next.cost.toLocaleString()}</button>`;
      } else if (p.kind === 'amen') sub = AMENITIES.find(a => a.id === p.type).about;
      else sub = `A decoration. Putting it away gives back $${decorOf(p.type).cost}.`;
      html = `<div class="isl-b-text"><b>${pieceName(p)}</b><span>${sub}</span></div>${up}<button class="btn ghost" data-isl-move>Move</button>` +
        (p.kind === 'decor' ? '<button class="btn ghost" data-isl-remove>Put away</button>' : '') + '<button class="btn ghost" data-isl-cancel aria-label="Close">×</button>';
    }
  }
  el.innerHTML = html;
  el.hidden = !html;
}
function renderIslandPanel() {
  document.querySelectorAll('[data-isl-tab]').forEach(b => b.classList.toggle('on', b.dataset.islTab === islTab));
  const panel = $('#isl-panel');
  if (islTab === 'build') {
    panel.innerHTML = `<ul class="list">${growRow()}</ul><h3>Landmarks</h3><ul class="list">${IMPROVEMENTS.map(improveRow).join('')}</ul>` +
      `<h3>Amenities</h3><ul class="list">${AMENITIES.map(amenityRow).join('')}</ul>`;
  } else if (islTab === 'decor') {
    panel.innerHTML = `<p class="muted small">Just for fun: place as many as you like. Put one away to get your money back.</p><div class="isl-decor">` +
      ISLAND_DECOR.map(d => `<button class="isl-deco${islMode?.type === d.id ? ' on' : ''}" data-isl-place="decor:${d.id}"${S.hood.bia >= d.cost ? '' : ' disabled'}>` +
        `<span class="isl-deco-art">${decorPreview(d.id)}</span><b>${d.name}</b><span class="money">$${d.cost}</span></button>`).join('') + '</div>';
  } else if (islTab === 'events') {
    panel.innerHTML = `<ul class="list">${EVENTS.map(e => {
      const locked = S.hood.level < e.needs, on = S.hood.event?.id === e.id, busy = !!S.hood.event;
      const can = !locked && !busy && S.hood.bia >= e.cost;
      const right = on ? '<span class="map-here">On now!</span>' : locked ? '<span class="upg-cost">Locked</span>'
        : `<button class="btn primary upg-buy" data-hood-event="${e.id}"${can ? '' : ' disabled'}>$${e.cost.toLocaleString()}</button>`;
      const perk = `The next ${e.orders} customers pay ${Math.round(e.bonus * 100)}% more${e.stars ? ` and give ${e.stars} extra star${e.stars > 1 ? 's' : ''}` : ''}.`;
      const note = locked ? `Opens when ${S.hood.name} is a ${BUZZ_LEVELS[e.needs].name}.` : `${e.about} ${perk}${S.hood.hosted[e.id] ? '' : ` First time: +${e.firstBuzz} buzz.`}`;
      return `<li class="upg${on ? ' next' : locked ? ' later' : ''}"><div class="upg-text"><b>${e.name}</b><span>${note}</span></div>${right}</li>`;
    }).join('')}</ul>`;
  } else {
    panel.innerHTML = `<ul class="list">${CITIES.map((c, i) => {
      const here = c.id === S.city, open = S.openCities.includes(c.id);
      const lv = here ? S.starLevel : (S.cityData[c.id]?.starLevel || 0), prev = CITIES[i - 1];
      const right = here ? '<span class="map-here">You\'re here</span>' : open ? `<button class="btn primary" data-travel="${c.id}">Go there</button>` : '<span class="upg-cost">For lease</span>';
      const note = open ? `${c.cuisine} · ${'★'.repeat(lv)}${'☆'.repeat(3 - lv)}` : `Opens when ${prev.name} reaches ${prev.opensNextAt} stars.`;
      return `<li class="${here ? 'upg next' : open ? 'upg' : 'upg later'}"><div class="upg-text"><b>${c.name}</b><span>${note}</span></div>${right}</li>`;
    }).join('') + COMING_SOON.map(c => `<li class="upg later"><div class="upg-text"><b>${c.name}</b><span>${c.cuisine} · coming in a later update.</span></div></li>`).join('')}</ul>`;
  }
}
// A small picture of a decoration for the Decorate tab.
const decorPreview = id => {
  const onLand = decorOf(id).on === 'land';
  const svg = islandSvg({ radius: onLand ? .8 : 0, saleRadius: 0, water: new Set(), paths: new Set(id === 'path' ? ['10,10'] : []), shops: [], pieces: [{ uid: 1, kind: 'decor', type: id, x: 10, y: 10, w: 1, d: 1 }], choices: {}, people: 0, sailboats: 0, scale: 1 });
  const p = isoPoint(islandGeom(), 10.5, 10.5);
  return svg.replace(/width="[^"]*" height="[^"]*" viewBox="[^"]*"/, `viewBox="${p[0] - 34} ${p[1] - 52} 68 68"`);
};
function renderHood() {
  accrueBia();
  const pot = potReady(), b = hoodBuzz(), L = BUZZ_LEVELS[S.hood.level], next = BUZZ_LEVELS[S.hood.level + 1];
  if (document.activeElement !== $('#hood-name')) $('#hood-name').value = S.hood.name;
  const pct = next ? Math.max(0, Math.min(100, Math.round((b - L.at) / (next.at - L.at) * 100))) : 100;
  $('#isl-stats').innerHTML = `<div class="isl-fund"><b>$${S.hood.bia.toLocaleString()}</b><span>Island dollars</span></div>` +
    (pot ? `<button class="btn primary" data-collect>Collect $${pot.toLocaleString()}</button>` : '') +
    `<div class="isl-level"><b>${L.name}</b><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>` +
    `<span>${(b * VISITORS_PER_BUZZ).toLocaleString()} visitors a day${next ? ` · ${next.at - b} buzz to ${next.name}` : ''}</span></div>` +
    (activeEvent() ? `<span class="event-on">${activeEvent().name}: ${S.hood.event.left} more customers pay ${Math.round(activeEvent().bonus * 100)}% more!</span>` : '');
  renderIslandMap();
  renderBanner();
  renderIslandPanel();
}
function openHood() { islMode = null; islGhost = null; islSel = null; $('#isl-map').innerHTML = ''; openSheet('#hood'); renderHood(); }

function startPlacing(kind, type) {
  islMode = { do: 'place', kind, type };
  islSel = null;
  islGhost = suggestSpot(kind, type);
  renderHood();
  showMap();
  if (islGhost) centreMap(islGhost.x + .5, islGhost.y + .5, true);
}
// Build a landmark or amenity, or place a decoration, at x, y.
function placePiece(kind, type, x, y) {
  const cost = costToPlace(kind, type);
  if (!fits(kind, type, x, y).ok || S.hood.bia < cost) return false;
  if (kind === 'imp' && stageOf(type)) return false;
  if (kind === 'amen' && S.hood.built.includes(type)) return false;
  S.hood.bia -= cost;
  const uid = isl().next++;
  isl().pieces.push({ uid, kind, type, x, y });
  if (kind === 'decor') { buzz('tap'); renderHood(); save(); return true; }
  if (kind === 'imp') S.hood.stages[type] = 1; else S.hood.built.push(type);
  islMode = null; islGhost = null; islSel = uid;
  buzz('serve');
  renderHood();
  const x0 = kind === 'imp' ? IMPROVEMENTS.find(i => i.id === type) : AMENITIES.find(a => a.id === type);
  const st = kind === 'imp' ? x0.stages[0] : x0;
  celebrate({ art: islandScene({ crop: true, focus: uid }), wide: true, title: `${st.name}!`, name: `+${st.buzz} buzz for ${S.hood.name}`,
    line: st.about + (kind === 'imp' ? (x0.choice ? ' Pick a style in the Build list.' : ' Tap it on the map to upgrade it later.') : '') });
  checkHood(); renderHeader(); save();
  return true;
}
function upgradeLandmark(type) {
  const imp = IMPROVEMENTS.find(i => i.id === type), n = stageOf(type), st = imp?.stages[n];
  if (!st || !n || S.hood.bia < st.cost) return;
  S.hood.bia -= st.cost;
  S.hood.stages[type] = n + 1;
  const p = pieceOf('imp', type);
  islSel = p?.uid ?? null;
  buzz('serve');
  renderHood();
  celebrate({ art: islandScene({ crop: true, focus: islSel }), wide: true, title: `${st.name}!`, name: `+${st.buzz} buzz for ${S.hood.name}`,
    line: st.about + (n < 2 ? ' Upgrade it again any time.' : " That's as amazing as it gets!") });
  checkHood(); renderHeader(); save();
}
function growIsland() {
  const next = ISLAND.land[isl().land + 1];
  if (!next || S.hood.bia < next.cost) return;
  S.hood.bia -= next.cost;
  isl().land++;
  islSel = null;
  buzz('serve');
  renderHood();
  toast(`${S.hood.name} just got bigger!`);
  save();
}

function hostEvent(id) {
  const e = EVENTS.find(x => x.id === id);
  if (!e || S.hood.event || S.hood.level < e.needs || S.hood.bia < e.cost) return;
  S.hood.bia -= e.cost;
  S.hood.event = { id, left: e.orders };
  const first = !S.hood.hosted[id];
  S.hood.hosted[id] = (S.hood.hosted[id] || 0) + 1;
  buzz('serve');
  closeSheets();
  celebrate({ art: islandScene({ crop: true, event: id }), wide: true, title: `${e.name}!`, name: `The next ${e.orders} customers pay ${Math.round(e.bonus * 100)}% more`,
    line: `${e.about}${e.stars ? ` Each one also gives ${e.stars} extra star${e.stars > 1 ? 's' : ''}.` : ''}${first ? ` +${e.firstBuzz} buzz.` : ''}` });
  checkHood();
  renderAll();
  save();
}

// Each customer served during an event uses up one of its turns.
function eventTurn() {
  const e = activeEvent();
  if (!e) return 0;
  if (--S.hood.event.left <= 0) {
    S.hood.event = null;
    setTimeout(() => toast(`That's a wrap on the ${e.name.toLowerCase()}. Host another any time!`), 600);
  }
  return e.stars;
}

// Tapping the map: place or move a piece, pick one up, visit a restaurant, or grow the island.
function tapIsland(e) {
  const svg = $('#isl-map svg');
  if (!svg) return;
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const q = pt.matrixTransform(svg.getScreenCTM().inverse());
  const [tx, ty] = isoTile(islandGeom(), q.x, q.y);
  if (islMode) {
    const [w, d] = sizeOf(islMode.kind, islMode.type);
    const at = { x: tx - Math.floor((w - 1) / 2), y: ty - Math.floor((d - 1) / 2) };
    // Decorations go down with one tap; landmarks show where they'd go first and wait for "Build here".
    islGhost = null;
    if (islMode.do === 'place' && islMode.kind === 'decor' && placePiece('decor', islMode.type, at.x, at.y)) return;
    islGhost = at;
    buzz('tap'); renderIslandMap(); renderBanner();
    return;
  }
  // Tall things stand above their squares, so also look one and two squares further down.
  for (let k = 0; k <= 2; k++) {
    const x = tx + k, y = ty + k;
    const c = CITIES.find(cc => { const [lx, ly] = lotOf(cc.slot); return x >= lx && x < lx + 2 && y >= ly && y < ly + 2; });
    if (c) { if (!S.openCities.includes(c.id)) { toast(`${c.name} opens later.`); return; } if (c.id !== S.city) travel(c.id); else closeSheets(); return; }
    const hits = isl().pieces.filter(p => { const [w, dd] = sizeOf(p.kind, p.type); return x >= p.x && x < p.x + w && y >= p.y && y < p.y + dd; });
    const p = hits.find(h => h.type !== 'path') || hits[0];
    if (p) { islSel = islSel === p.uid ? null : p.uid; buzz('tap'); renderIslandMap(); renderBanner(); renderIslandPanel(); return; }
  }
  const next = ISLAND.land[isl().land + 1];
  islSel = next && !isLand(landRadius(), waterSquares(), tx, ty) && fromCentre(tx, ty) <= next.radius ? 'land' : null;
  renderIslandMap(); renderBanner(); renderIslandPanel();
}
// Drag to look around with a mouse (fingers scroll the map on their own); a drag isn't a tap.
let islDrag = null, islDragged = false;
$('#isl-map').addEventListener('pointerdown', e => { islDragged = false; if (e.pointerType === 'mouse') islDrag = { x: e.clientX, y: e.clientY, l: $('#isl-map').scrollLeft, t: $('#isl-map').scrollTop }; });
addEventListener('pointermove', e => { if (!islDrag) return; const dx = e.clientX - islDrag.x, dy = e.clientY - islDrag.y; if (Math.abs(dx) + Math.abs(dy) > 6) islDragged = true; $('#isl-map').scrollLeft = islDrag.l - dx; $('#isl-map').scrollTop = islDrag.t - dy; });
addEventListener('pointerup', () => { islDrag = null; });
$('#isl-map').addEventListener('click', e => { if (!islDragged) tapIsland(e); });

$('#hood').addEventListener('click', e => {
  if (e.target.closest('#isl-map')) return;
  const sw = e.target.closest('[data-hood-choice]');
  if (sw) {
    S.hood.choices[sw.dataset.hoodChoice] = sw.dataset.colour;
    islSel = pieceOf('imp', IMPROVEMENTS.find(x => x.choice === sw.dataset.hoodChoice)?.id)?.uid ?? null;
    buzz('tap'); renderHood(); save(); return;
  }
  const b = e.target.closest('button');
  const d = b?.dataset || {};
  if (d.islTab) { islTab = d.islTab; if (islMode?.kind === 'decor' && islTab !== 'decor') islMode = null; buzz('tap'); renderHood(); return; }
  if (d.collect !== undefined) { collectBia(); return; }
  if (d.islPlace) { const [kind, type] = d.islPlace.split(':'); startPlacing(kind, type); return; }
  if (d.islUp) { upgradeLandmark(d.islUp); return; }
  if (d.islGrow !== undefined) { growIsland(); return; }
  if (d.hoodEvent) { hostEvent(d.hoodEvent); return; }
  if (d.islConfirm !== undefined && islMode && islGhost) {
    if (islMode.do === 'move') {
      const p = isl().pieces.find(q => q.uid === islMode.uid);
      if (p && fits(p.kind, p.type, islGhost.x, islGhost.y, p.uid).ok) { p.x = islGhost.x; p.y = islGhost.y; islSel = p.uid; islMode = null; islGhost = null; buzz('merge'); renderHood(); save(); }
    } else placePiece(islMode.kind, islMode.type, islGhost.x, islGhost.y);
    return;
  }
  if (d.islCancel !== undefined || d.islDone !== undefined) { islMode = null; islGhost = null; islSel = null; renderHood(); return; }
  if (d.islMove !== undefined && typeof islSel === 'number') { const p = isl().pieces.find(q => q.uid === islSel); islMode = { do: 'move', kind: p.kind, type: p.type, uid: p.uid }; islGhost = { x: p.x, y: p.y }; renderHood(); return; }
  if (d.islRemove !== undefined && typeof islSel === 'number') {
    const p = isl().pieces.find(q => q.uid === islSel);
    if (p?.kind === 'decor') { isl().pieces = isl().pieces.filter(q => q !== p); S.hood.bia += decorOf(p.type).cost; islSel = null; buzz('tap'); renderHood(); save(); }
    return;
  }
  if (b?.id === 'isl-night') { islNight = !isNight(); buzz('tap'); renderIslandMap(); return; }
  if (b) return;
  const li = e.target.closest('[data-isl-find]');
  if (li) { const p = isl().pieces.find(q => q.uid === +li.dataset.islFind); if (p) { islSel = p.uid; islMode = null; buzz('tap'); renderHood(); showMap(); const [w, dd] = sizeOf(p.kind, p.type); centreMap(p.x + w / 2, p.y + dd / 2, true); } }
});
$('#hood-name').addEventListener('change', e => {
  S.hood.name = e.target.value.trim().slice(0, HOOD.nameMax) || HOOD.defaultName;
  renderHood(); save();
  toast(`Welcome to ${S.hood.name}!`);
});

// A new restaurant opens on her street.
function openNextCity() {
  const i = CITIES.findIndex(c => c.id === S.city), next = CITIES[i + 1];
  if (!next || S.openCities.includes(next.id)) return;
  S.openCities.push(next.id);
  celebrate({ art: islandScene({ crop: true }), wide: true, title: `${next.name} opens on ${S.hood.name}!`, name: `A new ${next.cuisine.toLowerCase()} restaurant`,
    line: `Tap your restaurant's name at the top to see your island, then tap the new restaurant to walk over. Each restaurant keeps its own tip jar.` });
  checkBadges();
  checkHood();
}

function newGame() {
  S = {
    v: SAVE_VERSION, city: 'toronto', openCities: ['toronto'], cityData: {}, missions: {},
    hood: { name: HOOD.defaultName, built: [], stages: {}, choices: {}, level: 0, event: null, hosted: {}, bia: 0, pot: 0, potAt: Date.now(), island: { land: 0, pieces: [], next: 1 } },
    charges: CONFIG.charges.start, chargesAt: Date.now(), freeRefillAt: 0,
    tutorial: 0,
    seen: { 'bakery:1': true }, recipes: {}, badges: {},
    ...newCityState('toronto'),
    stats: { produced: 0, merges: 0, mixes: 0, sold: 0, earned: 0, bounces: 0, arcadeWins: 0, triviaRight: 0, vips: 0 },
    vipSeen: {}, sinceVip: 0,
    gems: 0, wildcards: 0, triviaIndex: 0, triviaStreak: 0, triviaLastRight: null,
    settings: { vibrate: true },
    created: Date.now(),
  };
  fillOrders();
}

// Bring an older save up to date.
function migrate(s) {
  s.settings ??= { vibrate: true };
  s.stats ??= {};
  for (const k of ['produced', 'merges', 'mixes', 'sold', 'bounces', 'arcadeWins', 'triviaRight', 'vips']) s.stats[k] ??= 0;
  s.vipSeen ??= {}; s.sinceVip ??= 0;
  if (s.gems === undefined) {
    // Gems arrived in phase 3: pay out gems for badges she already has.
    s.gems = Object.values(s.badges || {}).reduce((t, lv) => t + GEMS.badge.slice(0, lv).reduce((a, b) => a + b, 0), 0);
  }
  // Tickets were replaced by gems: turn any she had into gems.
  if (s.tickets) { s.gems += Math.ceil(s.tickets / TICKETS_PER_GEM); }
  delete s.tickets;
  s.wildcards ??= 0; s.decor ??= []; s.triviaIndex ??= 0; s.triviaStreak ??= 0; s.triviaLastRight ??= null;
  s.stats.earned ??= s.dollars;
  s.seen ??= {};
  s.recipes ??= {};
  s.badges ??= {};
  // The single pantry became separate starter blocks: the bakery crate, then the dairy fridge.
  s.board = s.board.map(it => it && it.producer === 'pantry' ? { producer: 'crate' } : it);
  s.producers ??= s.board.filter(it => it && it.producer).map(it => it.producer);
  // Some dishes became Elayna's own recipes under new names.
  const renamed = id => RENAMED_DISHES[id] || id;
  s.board = s.board.map(it => it && it.dish ? { dish: renamed(it.dish) } : it);
  for (const [old, now] of Object.entries(RENAMED_DISHES)) {
    if (s.recipes[old]) { delete s.recipes[old]; s.recipes[now] = true; }
    if (s.seen[`dish:${old}`]) { delete s.seen[`dish:${old}`]; s.seen[`dish:${now}`] = true; }
  }
  // Stars for winning the restaurant arrived later: credit one per order already served.
  s.cityStars ??= Math.min(s.served || 0, 30);
  s.starLevel ??= 0;
  // Orders now list what they want ("wants"). Older saves had one "want" or a list of "items".
  s.orders = s.orders.map(o => {
    if (o.wants) return o;
    let want = o.want;
    if (!want) {
      const first = o.items[0];
      const r = o.items.length === 2 ? findRecipe(o.items[0], o.items[1]) : null;
      want = first.dish ? { dish: first.dish } : r ? { dish: r.id } : { chain: first.chain, tier: first.tier };
    }
    if (want.dish) want = { dish: renamed(want.dish) };
    return orderFor([want], o);
  });
  // Cities arrived in phase 4: an older save is in Toronto.
  s.city ??= 'toronto';
  s.openCities ??= ['toronto'];
  s.hood ??= { name: HOOD.defaultName, built: [], stages: {}, choices: {}, level: 0, event: null, hosted: {} };
  // Improvements gained stages: anything she already built becomes stage 1.
  if (!s.hood.stages) {
    s.hood.stages = {};
    for (const id of s.hood.built) if (IMPROVEMENTS.some(x => x.id === id)) s.hood.stages[id] = 1;
    s.hood.built = s.hood.built.filter(id => !IMPROVEMENTS.some(x => x.id === id));
  }
  s.cityData ??= {};
  s.missions ??= {};
  // Customers now ask for two things at most: trim any bigger orders already waiting (pay and stars shrink to match).
  for (const d of [s, ...Object.values(s.cityData)]) for (const o of d.orders || []) {
    if (!o.wants || o.wants.length <= MAX_WANTS) continue;
    o.reward = Math.round(o.reward * MAX_WANTS / o.wants.length);
    o.wants = o.wants.slice(0, MAX_WANTS);
  }
  // Stars now grow with how big the foods are: re-count the orders already waiting.
  for (const d of [s, ...Object.values(s.cityData)]) for (const o of d.orders || []) if (o.wants?.length && !o.likes) o.stars = o.wants.reduce((t, w) => t + wantStars(w), 0);
  // Money split in two: each restaurant has its own tip jar, and the neighbourhood has Island dollars.
  // Half of what she had goes to the fund; the rest stays in the tip jar where she is.
  if (s.hood.bia === undefined) {
    s.hood.bia = Math.floor((s.dollars || 0) / 2);
    s.dollars = (s.dollars || 0) - s.hood.bia;
    s.hood.pot = 0; s.hood.potAt = Date.now();
    for (const d of Object.values(s.cityData)) d.dollars ??= 0;
  }
  // Restaurant upgrades gained levels: anything she already bought becomes level 1.
  for (const d of [s, ...Object.values(s.cityData)]) {
    if (d.upLv) continue;
    d.upLv = Object.fromEntries((d.upgrades || []).map(id => [id, 1]));
    delete d.upgrades;
  }
  s.choices ??= {};
  s.served ??= 0;
  s.complaints ??= 0;
  if (s.board.length !== CELLS) {
    // The board changed size: keep everything, moving anything that no longer fits.
    const oldCols = s.board.length === 63 ? 7 : COLS;
    const next = Array(CELLS).fill(null), spill = [];
    s.board.forEach((it, i) => {
      if (!it) return;
      const c = i % oldCols, r = Math.floor(i / oldCols);
      if (c < COLS && r < ROWS && !next[idx(c, r)]) next[idx(c, r)] = it; else spill.push(it);
    });
    for (const it of spill) { const free = next.indexOf(null); if (free >= 0) next[free] = it; }
    s.board = next;
  }
  s.v = SAVE_VERSION;
  return s;
}

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeSave(S), 300);
}

// ---------- restaurant upgrades change the numbers ----------
function perks() {
  const p = {
    refillSeconds: CONFIG.charges.refillSeconds,
    chargesMax: CONFIG.charges.max,
    bonusChance: CONFIG.producerBonusChance,
    orderBonus: 0, patience: 0, doubleDrop: 0, luckyMerge: 0, hearts: 0, tipBonus: 0, dishBonus: 0,
    vipChance: 0, vipGems: 0, starChance: 0, gemChance: 0, wildEvery: 0,
  };
  for (const u of UPGRADES) for (const { effect: e } of u.levels.slice(0, upLevel(u.id))) {
    for (const [k, v] of Object.entries(e)) {
      if (k === 'starterBonus') p.bonusChance += v;
      else if (k === 'wildEvery') p.wildEvery = p.wildEvery ? Math.min(p.wildEvery, v) : v;
      else p[k] += v;
    }
  }
  return p;
}
// Hearts: complaints allowed before the round starts over (the bench adds more).
const maxHearts = () => Math.max(1, COMPLAINTS.max + perks().hearts + (mood().hearts || 0));
// Today's mood (Settings): how busy the restaurants feel. See data/moods.js.
const mood = () => MOODS.find(m => m.id === S.settings.mood) || MOODS.find(m => m.id === DEFAULT_MOOD);
// Each upgrade has three levels, bought one at a time, in any order.
const upLevel = id => S.upLv[id] || 0;
const nextLevel = u => u.levels[upLevel(u.id)];
const upgradeCost = st => Math.round(st.cost * (city().upgradeCost || 1) / 5) * 5;
// The ladder: level 2 opens at a 1-star rating, level 3 at 2 stars.
const levelOpen = u => S.starLevel >= LEVEL_NEEDS[upLevel(u.id)];
// The stars a restaurant needs before level n + 1 opens.
const levelGoal = n => city().starGoals[LEVEL_NEEDS[n] - 1] || 0;
// Each restaurant names (and draws) its upgrades its own way.
const theme = () => themeFor(S.city);
const upName = u => theme().upgrades[u.id]?.name || u.id;
const levelName = (u, n) => theme().upgrades[u.id]?.levels[n] || upName(u);
// Is there an upgrade she can afford right now?
const upgradeAffordable = () => UPGRADES.some(u => nextLevel(u) && levelOpen(u) && S.dollars >= upgradeCost(nextLevel(u)));

// ---------- pantry charges ----------
function tickCharges() {
  const p = perks(), now = Date.now(), ms = p.refillSeconds * 1000;
  if (S.charges >= p.chargesMax) { S.chargesAt = now; return false; }
  const gained = Math.floor((now - S.chargesAt) / ms);
  if (gained <= 0) return false;
  S.charges = Math.min(p.chargesMax, S.charges + gained);
  S.chargesAt = S.charges >= p.chargesMax ? now : S.chargesAt + gained * ms;
  return true;
}
function nextChargeIn() {
  const ms = perks().refillSeconds * 1000;
  return Math.max(0, Math.ceil((S.chargesAt + ms - Date.now()) / 1000));
}
const unlimited = () => !!CONFIG.charges.unlimited;
const mmss = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

// ---------- orders ----------
// Chains she can make right now (from the starter blocks on the board).
function availableChains() {
  const set = new Set();
  for (const p of S.producers) for (const m of PRODUCERS[p].makes) set.add(m.chain);
  return [...set];
}

// How hard customers are right now: set by the stars the restaurant has earned.
const cityStars = () => S.cityStars || 0;
// The stage, adjusted for today's mood (fewer customers, smaller foods, more or fewer things per order).
function currentStage() {
  const st = ORDER_STAGES.find(x => cityStars() < x.untilStars) || ORDER_STAGES[ORDER_STAGES.length - 1], m = mood();
  const shift = m.tierShift || 0, lo = Math.max(1, st.plainTiers[0] + shift), hi = Math.max(lo, st.plainTiers[1] + shift);
  const most = Math.min(MAX_WANTS, m.wantsMax || MAX_WANTS, st.wants[1]);
  const least = Math.min(most, Math.max(st.wants[0], m.wantsMin || 0));
  return { ...st, plainTiers: [lo, hi], wants: [least, most], customers: Math.min(st.customers, m.customersMax || st.customers) };
}

// Stars and price for one thing an order asks for.
const plainStars = tier => ORDER_STARS.plain[Math.min(tier, ORDER_STARS.plain.length) - 1];
const wantStars = w => {
  if (!w.dish) return plainStars(w.tier);
  const r = recipeOf(w.dish);
  return plainStars(Math.max(r.a.tier, r.b.tier)) + ORDER_STARS.dish + (Math.min(r.a.tier, r.b.tier) >= 4 ? ORDER_STARS.bothBig : 0);
};
// Busier moods turn stars up: a share of the stars on top, with the leftover fraction as a chance of one more.
const moodStars = n => { const x = n * (mood().extraStars || 0); return n + Math.floor(x) + (Math.random() < x % 1 ? 1 : 0); };
const wantValue = w => w.dish ? recipeOf(w.dish).value : ORDER_VALUE[w.tier - 1];

// An order asks for one or more things ("wants"). Price, stars and the speed window are fixed when it arrives.
function orderFor(wants, base = {}) {
  const stage = currentStage();
  let reward = wants.reduce((t, w) => t + wantValue(w), 0);
  if (wants.length > 1) reward = Math.round(reward * BIG_ORDER_BONUS);
  return {
    id: base.id, customer: base.customer, wants, reward,
    stars: wants.reduce((t, w) => t + wantStars(w), 0),
    fast: base.fast || stage.fastSeconds, age: base.age || 0,
  };
}

// One random thing a customer might ask for at this stage.
function pickWant(stage, avoid) {
  const chains = availableChains();
  const levels = stage.dishLevels;
  if (levels.length && Math.random() < stage.dishChance) {
    const level = levels[randInt(0, levels.length - 1)];
    const dishes = RECIPES.filter(r => recipeCity(r) === S.city && recipeLevel(r) === level && chains.includes(r.a.chain) && chains.includes(r.b.chain) &&
      Math.max(r.a.tier, r.b.tier) <= stage.plainTiers[1] && !avoid.has(`dish:${r.id}`));
    if (dishes.length) return { dish: dishes[randInt(0, dishes.length - 1)].id };
  }
  const chain = chains[randInt(0, chains.length - 1)];
  return { chain, tier: Math.min(maxTier(chain), randInt(...stage.plainTiers)) };
}

function makeOrder() {
  let wants;
  const firsts = city().firstOrders;
  const vip = S.orderSeq >= firsts.length ? maybeVip() : null;
  if (vip) return vip;
  if (S.orderSeq < firsts.length) {
    wants = firsts[S.orderSeq].map(w => ({ ...w }));
  } else {
    const stage = currentStage();
    const count = randInt(...stage.wants);
    const avoid = new Set();
    wants = [];
    for (let k = 0; k < count; k++) {
      const w = pickWant(stage, avoid);
      avoid.add(keyOf(w));
      wants.push(w);
    }
  }
  const busy = new Set(S.orders.map(o => o.customer));
  const free = CUSTOMERS.filter(c => !busy.has(c.id));
  const pool = free.length ? free : CUSTOMERS;
  S.orderSeq++;
  S.sinceVip = (S.sinceVip || 0) + 1;
  return orderFor(wants, { id: S.orderSeq, customer: pool[randInt(0, pool.length - 1)].id });
}

// ---------- VIPs: special guests (data/vips.js) ----------
const vipOf = o => o && o.vip ? VIPS.find(v => v.id === o.vip) : null;
const custName = o => vipOf(o)?.name || CUSTOMERS.find(c => c.id === o.customer)?.name || '';
const pick = list => list[randInt(0, list.length - 1)];
// Dishes customers here could ask for right now. "hers" limits it to Elayna's own recipes.
function dishChoices(stage, opts = {}) {
  const chains = availableChains();
  return RECIPES.filter(r => recipeCity(r) === S.city && chains.includes(r.a.chain) && chains.includes(r.b.chain) &&
    Math.max(r.a.tier, r.b.tier) <= stage.plainTiers[1] && (!opts.hers || r.hers) && (!opts.level || recipeLevel(r) === opts.level));
}

// Now and then a new customer is a VIP. Only one waits at a time, with a few regulars in between.
function maybeVip() {
  const called = !!boostOf()?.boost.vip; // "Call a VIP" from the gem shop skips the usual wait
  if (!called && (cityStars() < VIP_RULES.afterStars || (S.sinceVip || 0) < VIP_RULES.gap)) return null;
  if (S.orders.some(o => o.vip) || (!called && Math.random() >= VIP_RULES.chance + perks().vipChance)) return null;
  const stage = currentStage();
  const made = VIPS.filter(v => !(mood().calm && v.kind === 'rush')).map(v => [v, vipOrder(v, stage)]).filter(([, o]) => o);
  if (!made.length) return null;
  // She meets every VIP once before any of them comes back.
  const fresh = made.filter(([v]) => !S.vipSeen[v.id]);
  const [v, order] = pick(fresh.length ? fresh : made);
  S.orderSeq++;
  S.sinceVip = 0;
  if (called) useBoost();
  order.id = S.orderSeq;
  if (!S.vipSeen[v.id]) {
    S.vipSeen[v.id] = true;
    celebrate({ art: `<svg viewBox="7 7 86 86" aria-hidden="true"><use href="#cust-${v.id}"/></svg>`, title: 'A VIP is here!',
      name: `${v.name}, ${v.title.toLowerCase()}`, line: v.intro });
  }
  return order;
}

// Builds this VIP's order, or returns null if they can't order anything here yet.
function vipOrder(v, stage) {
  const base = { customer: v.id };
  let o;
  if (v.kind === 'rush') {
    o = orderFor([pickWant({ ...stage, dishLevels: ['simple'] }, new Set())], base);
    o.limit = Math.max(60, Math.round(stage.fastSeconds * v.seconds));
  } else if (v.kind === 'puzzle') {
    // Three foods she likes: two make a recipe, the third is a decoy (it may make another recipe, which is fine).
    const dishes = dishChoices(stage);
    if (!dishes.length) return null;
    const r = pick(dishes);
    const top = Math.max(r.a.tier, r.b.tier), chains = [r.a.chain, r.b.chain];
    let decoy = null;
    for (let tries = 0; tries < 20 && !decoy; tries++) {
      const d = { chain: pick(chains), tier: randInt(1, Math.min(maxTier(r.a.chain), top + 1)) };
      if (!sameItem(d, r.a) && !sameItem(d, r.b)) decoy = d;
    }
    if (!decoy) return null;
    const likes = [{ ...r.a }, { ...r.b }, decoy].sort(() => Math.random() - .5);
    o = orderFor([], base);
    Object.assign(o, { likes, reward: r.value, stars: wantStars({ dish: r.id }) });
  } else if (v.kind === 'critic') {
    const fancy = dishChoices(stage, { level: 'advanced' });
    const chain = pick(availableChains());
    o = orderFor([fancy.length ? { dish: pick(fancy).id } : { chain, tier: Math.min(maxTier(chain), stage.plainTiers[1]) }], base);
  } else if (v.kind === 'gift') {
    const classics = dishChoices(stage, { hers: true });
    if (!classics.length) return null;
    o = orderFor([{ dish: pick(classics).id }], { ...base, fast: stage.fastSeconds * 2 });
  } else if (v.kind === 'party') {
    const avoid = new Set(), wants = [];
    for (let k = 0; k < MAX_WANTS; k++) { const w = pickWant(stage, avoid); avoid.add(keyOf(w)); wants.push(w); }
    o = orderFor(wants, { ...base, fast: stage.fastSeconds * 2 });
    o.reward = wants.reduce((t, w) => t + wantValue(w), 0); // the VIP's double pay replaces the big order bonus
  }
  o.vip = v.id;
  o.reward = Math.round(o.reward * v.pay);
  return o;
}

// Penny (the puzzle VIP): a dish on the board made from two of the foods she likes.
const lovesDish = (o, it) => {
  if (!it || !it.dish) return false;
  const r = recipeOf(it.dish);
  return o.likes.some(l => sameItem(l, r.a)) && o.likes.some(l => sameItem(l, r.b));
};
const pennyDishAt = o => S.board.findIndex(it => lovesDish(o, it));
// The critic's review follows his bar: three golden spoons in its first third, then two, then one.
const reviewSpoons = o => { const t = tipShare(o); return t > 2 / 3 ? 3 : t > 1 / 3 ? 2 : 1; };
// Zip's timer, in seconds left.
const rushLeft = o => Math.max(0, Math.ceil(o.limit - o.age / 1000));
// Stars an order earns: the critic's grow with his review.
const starsFor = o => {
  const v = vipOf(o);
  if (!v) return o.stars;
  return o.stars + (v.kind === 'critic' ? reviewSpoons(o) * v.stars : v.stars);
};
// The line under a VIP's order.
function vipLine(o) {
  const v = vipOf(o);
  if (v.kind === 'rush') return `Hurry! ${mmss(rushLeft(o))}`;
  if (v.kind === 'puzzle') return 'Mix 2 she likes';
  if (v.kind === 'critic') { const n = reviewSpoons(o); return `${n} spoon review`; }
  return orderName(o);
}

// Zip ran out of time: he leaves, and the restaurant loses a few stars (never a star rating it already has).
function vipLeaves(oi) {
  const o = S.orders[oi], v = vipOf(o);
  const floor = S.starLevel > 0 ? city().starGoals[S.starLevel - 1] : 0;
  const lost = Math.min(v.lose, Math.max(0, cityStars() - floor));
  S.cityStars = cityStars() - lost;
  if (orderPick?.o === oi) orderPick = null;
  nextCustomer(oi);
  buzz('nope');
  renderAll();
  toast(`${v.gone}${lost ? ` You lost ${lost} stars.` : ''}`, { icon: `cust-${v.id}`, ms: 4000 });
  if (lost) floatText(`-${lost} ★`, $('#brand'));
  save();
}
// Board items that help with a want: the item itself, or a dish and its two foods.
const wantKeys = w => w.dish ? [`dish:${w.dish}`, keyOf(recipeOf(w.dish).a), keyOf(recipeOf(w.dish).b)] : [keyOf(w)];
// Everything on the board that helps with an order. (Penny's likes count, so they get a tick.)
const orderKeys = o => o.likes ? o.likes.map(keyOf) : o.wants.flatMap(wantKeys);
// More customers arrive as the restaurant grows (never fewer than are already waiting).
function fillOrders() {
  const want = currentStage().customers;
  let added = false;
  while (S.orders.length < want) { S.orders.push(makeOrder()); added = true; }
  return added;
}
// A customer leaves (served, or gave up): someone new steps up, unless there are more customers
// waiting than there should be (after switching to a calmer mood), and then the spot just closes.
function nextCustomer(oi) {
  if (S.orders.length > currentStage().customers) { S.orders.splice(oi, 1); orderPick = null; }
  else S.orders[oi] = makeOrder();
}
const wantName = w => w.dish ? recipeOf(w.dish).name : nameOf(w);
const orderName = o => o.likes ? `Likes ${o.likes.map(nameOf).join(', ')}` : o.wants.map(wantName).join(' + ');
// How much of an order's price is dishes (dishes pay more with the window display upgrade).
const dishShare = o => {
  if (o.likes) return 1;
  const all = o.wants.reduce((t, w) => t + wantValue(w), 0);
  return all ? o.wants.filter(w => w.dish).reduce((t, w) => t + wantValue(w), 0) / all : 0;
};
const payFor = o => { const p = perks(); return Math.round(o.reward * (1 + p.orderBonus + p.dishBonus * dishShare(o) + hoodBonus() + eventBonus() + boostPay() + (mood().pay || 0))); };
// The speed tip: full when the order is new, nothing at twice its fast time.
const tipShare = o => Math.max(0, 1 - o.age / (o.fast * 2000));
// Zip and the critic don't tip: Zip's pay is already doubled, and the critic's reward is his review.
const tipsNormally = o => !['rush', 'critic'].includes(vipOf(o)?.kind);
const tipFor = o => tipsNormally(o) ? Math.round(payFor(o) * SPEED_TIP * (1 + perks().tipBonus) * tipShare(o)) : 0;
// The bar along the bottom of an order card: the speed tip, or Zip's timer.
const barShare = o => o.limit ? Math.max(0, 1 - o.age / (o.limit * 1000)) : tipShare(o);
const barClass = o => {
  const k = vipOf(o)?.kind;
  if (k === 'rush') { const t = barShare(o); return `rush ${t > 0.5 ? 'fresh' : t > 0.25 ? 'waiting' : 'late'}`; }
  return `${k === 'critic' ? 'review ' : ''}${tipClass(o)}`;
};
const isSpeedy = o => o.age <= o.fast * 1000;
const tipClass = o => { const t = tipShare(o); return t > 0.6 ? 'fresh' : t > 0.25 ? 'waiting' : t > 0.1 ? 'late' : 'urgent'; };
// The first few teaching orders in a city never complain.
const canComplain = o => mood().complaints !== false && (o.id || 0) > city().firstOrders.length;

// A customer whose bar ran out complains and leaves; a new one takes their place.
function complain(oi) {
  const o = S.orders[oi];
  const cust = { id: o.customer, name: custName(o) };
  S.complaints = (S.complaints || 0) + 1;
  if (orderPick?.o === oi) orderPick = null;
  nextCustomer(oi);
  buzz('nope');
  if (S.complaints >= maxHearts()) { failRound(cust); return; }
  const left = maxHearts() - S.complaints;
  toast(`${cust.name} waited too long and left. ${left} more complaint${left === 1 ? '' : 's'} and the round starts over.`);
  renderAll();
  shake($('#brand'));
  save();
}

// Too many complaints: this star level starts over. The food on the board stays.
function failRound(cust) {
  const goals = city().starGoals;
  const floor = S.starLevel === 0 ? 0 : goals[S.starLevel - 1];
  const lost = Math.max(0, cityStars() - floor);
  S.cityStars = floor;
  S.complaints = 0;
  orderPick = null;
  S.orders = [];
  fillOrders();
  celebrate({
    art: `<div class="cele-emoji">${use(`cust-${cust.id}`)}</div>`, title: 'Rough shift!',
    name: `${maxHearts()} customers left unhappy`,
    line: `This round starts over${lost ? `, back to ${floor} stars` : ''}. Your food is still on the board. Serve faster to keep your hearts!`,
  });
  renderAll();
  save();
}

// What an order card shows. A single dish shows its two foods; anything else shows each thing.
function slotsOf(o) {
  if (o.likes) return o.likes.map(l => ({ ...l }));
  if (o.wants.length === 1 && o.wants[0].dish) {
    const r = recipeOf(o.wants[0].dish);
    return [{ ...r.a }, { ...r.b }];
  }
  return o.wants.map(w => ({ ...w }));
}

function boardCounts() {
  const m = new Map();
  for (const it of S.board) if (it && !it.producer) m.set(keyOf(it), (m.get(keyOf(it)) || 0) + 1);
  return m;
}
// Can one want be made from what's left on the board? A ready-made dish counts, or both its foods.
function wantReady(w, left) {
  const take = k => { const n = left.get(k) || 0; if (n > 0) { left.set(k, n - 1); return true; } return false; };
  if (!w.dish) return { ok: take(keyOf(w)), parts: null };
  if (take(`dish:${w.dish}`)) return { ok: true, parts: [true, true] };
  const r = recipeOf(w.dish), ka = keyOf(r.a), kb = keyOf(r.b);
  const ha = take(ka), hb = take(kb);
  if (!(ha && hb)) { if (ha) left.set(ka, left.get(ka) + 1); if (hb) left.set(kb, left.get(kb) + 1); }
  return { ok: ha && hb, parts: [ha, hb] };
}
// For each slot on the order card: is it ready?
function orderStatus(order, counts) {
  if (order.likes) return order.likes.map(l => (counts.get(keyOf(l)) || 0) > 0);
  const left = new Map(counts);
  const st = order.wants.map(w => wantReady(w, left));
  if (order.wants.length === 1 && order.wants[0].dish) return st[0].parts;
  return st.map(x => x.ok);
}
const isReady = (o, counts) => o.likes ? pennyDishAt(o) >= 0 : orderStatus(o, counts).every(Boolean);

// ---------- board helpers ----------
function nearestEmpty(from) {
  const fc = from % COLS, fr = Math.floor(from / COLS);
  let best = -1, bestD = Infinity;
  for (let i = 0; i < CELLS; i++) {
    if (S.board[i]) continue;
    const dc = i % COLS - fc, dr = Math.floor(i / COLS) - fr, d = dc * dc + dr * dr;
    if (d < bestD) { best = i; bestD = d; }
  }
  return best;
}
const producerIndex = () => S.board.findIndex(it => it && it.producer);
const cellEl = i => i >= 0 ? $(`#board .cell[data-i="${i}"]`) : null;

// ---------- actions ----------
function produce(i) {
  tickCharges();
  if (!unlimited() && S.charges <= 0) { buzz('nope'); openRefill(); return; }
  const spot = nearestEmpty(i);
  if (spot < 0) {
    buzz('nope');
    toast('The board is full. Merge or sell something to make room.');
    hint(false);
    return;
  }
  const makes = PRODUCERS[S.board[i].producer].makes;
  let roll = Math.random() * makes.reduce((t, m) => t + m.weight, 0);
  const pick = makes.find(m => (roll -= m.weight) < 0) || makes[0];
  let tier = pick.tier;
  if (Math.random() < perks().bonusChance) tier = Math.min(tier + 1, maxTier(pick.chain));
  if (boostOf()?.boost.taps) { tier = Math.max(tier, Math.min(2, maxTier(pick.chain))); useBoost(); }
  if (!unlimited()) {
    if (S.charges >= perks().chargesMax) S.chargesAt = Date.now();
    S.charges--;
  }
  S.board[spot] = { chain: pick.chain, tier };
  S.stats.produced++;
  // Two for one: now and then a tap gives a second food.
  let spot2 = -1;
  if (Math.random() < perks().doubleDrop) {
    spot2 = nearestEmpty(i);
    if (spot2 >= 0) { S.board[spot2] = { chain: pick.chain, tier: pick.tier }; S.stats.produced++; }
  }
  buzz('tap');
  discover(S.board[spot], spot);
  renderAll();
  fly(i, spot, true);
  if (spot2 >= 0) { fly(i, spot2, true); floatText('Two for one!', cellEl(spot2)); }
  advanceTutorial('produce');
  save();
}

function dropOn(from, to) {
  if (from === to) { renderAll(); return; }
  const a = S.board[from], b = S.board[to];
  if (!b) {
    S.board[to] = a; S.board[from] = null;
    if (sel === from) sel = to;
    renderAll();
    save();
    return;
  }
  // A wild card turns into a copy of the food it touches.
  if ((a.wild || b.wild) && !(a.wild && b.wild)) {
    const food = a.wild ? b : a, wildAt = a.wild ? from : to;
    if (!food.producer) {
      S.board[wildAt] = { ...food };
      sel = wildAt;
      buzz('merge');
      renderAll();
      pop(wildAt);
      toast(`Wild card became ${nameOf(food)}!`);
      save();
      return;
    }
  }
  if (canMerge(a, b)) {
    // A lucky merge jumps up two levels.
    const lucky = a.tier + 2 <= maxTier(a.chain) && Math.random() < perks().luckyMerge;
    S.board[to] = { chain: a.chain, tier: a.tier + (lucky ? 2 : 1) };
    if (lucky) setTimeout(() => floatText('Lucky merge!', cellEl(to)), 50);
    S.board[from] = null;
    S.stats.merges++;
    sel = to;
    buzz('merge');
    discover(S.board[to], to);
    renderAll();
    pop(to);
    advanceTutorial('merge');
    checkBadges();
    save();
    return;
  }
  const recipe = findRecipe(a, b);
  if (recipe) { mix(from, to, recipe); return; }
  // No match: the item slides back home. Nothing is lost.
  S.stats.bounces++;
  buzz('nope');
  renderAll();
  fly(to, from, false);
  shake(cellEl(to));
  if (S.stats.bounces <= 3) {
    toast(isChain(a) && isChain(b) ? "Those two don't make a recipe. Try another pair!" : "That one can't be mixed with anything.");
  }
  save();
}

function mix(from, to, recipe) {
  S.board[to] = { dish: recipe.id };
  S.board[from] = null;
  S.stats.mixes++;
  sel = to;
  buzz('merge');
  learnRecipe(recipe);
  renderAll();
  pop(to);
  checkBadges();
  save();
}

function learnRecipe(recipe) {
  if (S.recipes[recipe.id]) return;
  S.recipes[recipe.id] = true;
  S.dollars += RECIPE_DISCOVERY_REWARD;
  S.seen[`dish:${recipe.id}`] = true;
  celebrate({
    art: use(`art-${recipe.id}`), title: 'New recipe!', name: recipe.name,
    line: `${recipe.hers ? 'One of your own recipes! ' : ''}${nameOf(recipe.a)} + ${nameOf(recipe.b)}.`, reward: RECIPE_DISCOVERY_REWARD,
  });
}

// New starter blocks arrive as she serves more orders.
function unlockProducers() {
  for (const u of city().unlocks) {
    if (S.producers.includes(u.producer) || S.served < u.afterServed) continue;
    const near = producerIndex();
    const spot = nearestEmpty(near >= 0 ? near : idx(2, 3));
    if (spot < 0) continue; // no room yet; try again after the next order
    S.board[spot] = { producer: u.producer };
    S.producers.push(u.producer);
    const made = PRODUCERS[u.producer].makes.map(m => CHAINS[m.chain].tiers[m.tier - 1].name).join(' and ');
    celebrate({ art: use(`art-${u.producer}`), title: 'New starter block!', name: PRODUCERS[u.producer].name, line: `Tap it to get ${made}.` });
  }
}

// The first time she makes something, a little "New!" tag sits on that square for a moment.
// (No pop-up: nothing covers the board.)
let mark = null;
function discover(it, i) {
  const k = keyOf(it);
  const top = isChain(it) && it.tier === maxTier(it.chain);
  if (S.seen[k] && !top) return false;
  const isNew = !S.seen[k];
  S.seen[k] = true;
  mark = { i, text: isNew ? 'New!' : 'Top!' };
  setTimeout(() => { if (mark?.i === i) { mark = null; render(); } }, 2200);
  return isNew;
}

function serve(oi) {
  const order = S.orders[oi];
  if (!isReady(order, boardCounts())) return;
  const taken = [];
  // Find a square holding this key that isn't already used (leave the selected one if there's another).
  const grab = k => {
    let pickI = -1;
    for (let i = 0; i < CELLS; i++) {
      const b = S.board[i];
      if (b && !b.producer && keyOf(b) === k && !taken.includes(i)) { pickI = i; if (i !== sel) break; }
    }
    if (pickI >= 0) taken.push(pickI);
    return pickI >= 0;
  };
  if (order.likes) {
    const at = pennyDishAt(order);
    taken.push(at);
    learnRecipe(recipeOf(S.board[at].dish));
  }
  for (const w of order.wants) {
    if (!w.dish) { grab(keyOf(w)); continue; }
    if (grab(`dish:${w.dish}`)) { learnRecipe(recipeOf(w.dish)); continue; }
    const r = recipeOf(w.dish);
    grab(keyOf(r.a)); grab(keyOf(r.b));
    S.stats.mixes++; // cooked straight from the ingredients
    learnRecipe(r);
  }
  const v = vipOf(order);
  const speedy = !v && isSpeedy(order);
  const tip = tipFor(order);
  const pay = payFor(order) + tip;
  const p = perks();
  const luckyStar = Math.random() < p.starChance ? 1 : 0;
  const stars = moodStars(starsFor(order) + (speedy ? ORDER_STARS.speedy : 0)) + eventTurn() + luckyStar + (boostOf()?.boost.stars || 0);
  flyAway(taken, $(`.order[data-o="${oi}"]`));
  for (const i of taken) S.board[i] = null;
  if (taken.includes(sel)) sel = -1;
  if (orderPick?.o === oi) orderPick = null;
  S.dollars += pay;
  S.stats.earned += pay;
  S.served++;
  visitorsSpend(pay);
  buzz('serve');
  floatText(`+$${pay}${tip ? ' with speed tip' : ''}`, $('#money'));
  addStars(stars, speedy, luckyStar);
  if (v) vipThanks(order, v);
  upgradeGifts(p);
  if (boostOf()?.boost.left && !boostOf().boost.vip) useBoost();
  nextCustomer(oi);
  if (fillOrders() && !v) toast('Another customer just walked in!');
  unlockProducers();
  renderAll();
  const fresh = $(`.order[data-o="${oi}"]`);
  if (fresh && !reduceMotion) fresh.animate([{ transform: 'translateY(-12px) scale(.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, delay: 150, fill: 'backwards', easing: 'cubic-bezier(.2,.8,.3,1.2)' });
  bump($('#money'));
  advanceTutorial('serve');
  checkBadges();
  save();
}

// Gifts from restaurant upgrades after an order: a gem now and then, and a wild card every so often.
function upgradeGifts(p) {
  if (Math.random() < p.gemChance) {
    S.gems++;
    setTimeout(() => floatText('+1 gem tip!', $('#gems')), 500);
  }
  if (p.wildEvery && S.served % p.wildEvery === 0) {
    if (placeWild()) toast('Your rooftop garden grew a wild card! Drop it on any food.', { ms: 3500 });
    else { S.wildcards++; toast('Your rooftop garden grew a wild card. Find it in Today.', { ms: 3500 }); }
  }
}

// What a VIP gives on top of the bill.
function vipThanks(o, v) {
  S.stats.vips++;
  let gems = v.gems + perks().vipGems, line;
  if (v.kind === 'critic') {
    const n = reviewSpoons(o);
    gems = n * v.gems + perks().vipGems;
    line = `${v.name} gave you a ${n} golden spoon review!`;
  } else if (v.kind === 'gift') {
    if (placeWild()) line = 'Bubbie left you a wild card. Drop it on any food!';
    else { S.wildcards++; line = 'Bubbie left you a wild card. Find it in Today.'; }
  } else if (v.kind === 'rush') line = 'Zip made it in time. Zoom!';
  else if (v.kind === 'puzzle') line = 'Penny loves it!';
  else line = 'Pina\'s party is a hit!';
  S.gems += gems;
  setTimeout(() => floatText(`+${gems} gems`, $('#gems')), 250);
  toast(line, { icon: `cust-${v.id}`, ms: 3500 });
}

// Stars move the restaurant toward winning. Each goal reached is a new star rating.
function addStars(n, speedy, lucky = 0) {
  S.cityStars = cityStars() + n;
  floatText(`+${n} ★${speedy ? ' speedy!' : lucky ? ' bonus!' : ''}`, $('#brand'));
  const CITY = city(), goals = CITY.starGoals;
  while (S.starLevel < goals.length && S.cityStars >= goals[S.starLevel]) {
    const lv = S.starLevel++;
    const r = CITY.starRewards[lv];
    S.gems += r.gems;
    S.dollars += r.dollars;
    S.stats.earned += r.dollars;
    const won = S.starLevel === goals.length;
    celebrate({
      art: `<div class="cele-stars">${'★'.repeat(lv + 1)}${'☆'.repeat(goals.length - lv - 1)}</div>`,
      title: won ? `You won ${CITY.name}!` : `${lv + 1}-star restaurant!`,
      name: `${CITY.restaurant}, ${CITY.name}`,
      line: won ? 'Three stars! You can keep cooking here, or travel on.' :
        `Customers love it. Level ${lv + 2} upgrades are open! Next: ${goals[lv + 1]} stars. Orders will get a little trickier.`,
      reward: r.dollars, gems: r.gems,
    });
    S.complaints = 0; // a new star is a fresh round: hearts refill
    setTimeout(checkHood, 50);
    if (S.starLevel >= CITY.opensNextAt) openNextCity();
  }
}

const skipCost = o => Math.max(2, Math.ceil(payFor(o) / GEMS.skipOrderPer));
function skipOrder(oi) {
  const o = S.orders[oi];
  if (!o) return;
  const cost = skipCost(o);
  if (S.gems < cost) return;
  S.gems -= cost;
  const pay = payFor(o);
  S.dollars += pay;
  S.stats.earned += pay;
  S.served++;
  visitorsSpend(pay);
  for (const w of o.wants) if (w.dish) learnRecipe(recipeOf(w.dish));
  addStars(moodStars(o.stars) + eventTurn() + (boostOf()?.boost.stars || 0), false);
  if (boostOf()?.boost.left && !boostOf().boost.vip) useBoost();
  orderPick = null;
  buzz('serve');
  floatText(`+$${pay}`, $('#money'));
  nextCustomer(oi);
  fillOrders();
  unlockProducers();
  advanceTutorial('serve');
  renderAll();
  checkBadges();
  save();
}

function sell(i) {
  const it = S.board[i];
  if (!it || it.producer || it.wild) return;
  const value = sellValue(it);
  S.board[i] = null;
  S.dollars += value;
  S.stats.earned += value;
  S.stats.sold++;
  sel = -1;
  lastSale = { i, it, value };
  buzz('tap');
  toast(`Sold ${nameOf(it)} for $${value}.`, { action: 'Undo', onAction: undoSell });
  renderAll();
  checkBadges();
  save();
}
function undoSell() {
  if (!lastSale) return;
  let { i } = lastSale;
  if (S.board[i]) i = nearestEmpty(i);
  if (i < 0) { toast('No room to put it back.'); return; }
  S.board[i] = lastSale.it;
  S.dollars = Math.max(0, S.dollars - lastSale.value);
  S.stats.earned = Math.max(0, S.stats.earned - lastSale.value);
  sel = i;
  lastSale = null;
  renderAll();
  save();
}

function buyUpgrade(id) {
  const u = UPGRADES.find(x => x.id === id), st = u && nextLevel(u);
  if (!st || !levelOpen(u) || S.dollars < upgradeCost(st)) return;
  const n = upLevel(u.id);
  S.dollars -= upgradeCost(st);
  S.upLv[u.id] = n + 1;
  buzz('serve');
  // Stay on the restaurant, with the new part outlined in purple.
  restFocus = u.id; restFocusPreview = false;
  renderRestaurant();
  setTimeout(checkHood, 50);
  celebrate({ art: restaurantPhoto(u.id), wide: true, title: n ? `Level ${n + 1} upgrade!` : 'Restaurant upgrade!', name: levelName(u, n),
    line: st.perk + (n === 0 && u.choice ? ' Pick a colour below.' : n < 2 ? ' Upgrade it again any time.' : " That's as fancy as it gets!") });
  renderHeader();
  render();
  save();
}

// The restaurant picture: the original building starts black and white and fills with
// colour as she upgrades; "focus" outlines one upgrade in purple (a preview if not bought yet).
const choiceList = key => theme().choices[key];
const choiceColour = key => choiceList(key).find(c => c.colour === S.choices?.[key])?.colour ||
  (key === 'awning' ? city().look.awning : choiceList(key)[0].colour);
// A focused upgrade shows its next level (or its top level once it's fully upgraded).
function restaurantPhoto(focus = null, tryDecor = null) {
  const lv = { ...S.upLv };
  if (focus && UPGRADES.some(u => u.id === focus)) lv[focus] = Math.min(3, upLevel(focus) + (restFocusPreview ? 1 : 0)) || 1;
  const has = new Set(Object.keys(lv).filter(id => lv[id] > 0));
  return restaurantSvg(has, {
    paint: choiceColour('paint'), awning: choiceColour('awning'), lv,
    sign: city().sign, baseWall: city().look.wall, style: theme().style,
    colour: .25 + .75 * Object.keys(S.upLv).length / UPGRADES.length, focus, decor: tryDecor ? [...S.decor, tryDecor] : S.decor,
  });
}

// ---------- boosts and the recipe kit, from the gem shop (data/arcade.js, SHOP) ----------
// One boost runs at a time. S.boost = { id, left }: customers (or taps) it has left.
const boostOf = () => (S.boost ? SHOP.find(x => x.id === S.boost.id) || null : null);
const boostPay = () => boostOf()?.boost.pay || 0;
function startBoost(id) {
  const b = SHOP.find(x => x.id === id);
  if (!b?.boost || S.boost) return false;
  S.boost = { id, left: b.boost.left || b.boost.taps };
  renderAll();
  return true;
}
function useBoost() {
  const b = boostOf();
  if (!b) return;
  if (--S.boost.left > 0) return;
  S.boost = null;
  setTimeout(() => toast(`${b.name} is over. There are more boosts in the gem shop.`), 700);
}
function boostLine() {
  const b = boostOf(), n = S.boost?.left || 0;
  if (!b) return '';
  if (b.boost.vip) return `${b.name}: the next customer is a VIP!`;
  if (b.boost.taps) return `${b.name}: ${n} more tap${n === 1 ? '' : 's'} give level 2 foods.`;
  if (b.boost.stars) return `${b.name}: ${n} more customer${n === 1 ? '' : 's'} give a bonus star!`;
  return `${b.name}: ${n} more customer${n === 1 ? '' : 's'} pay ${Math.round(b.boost.pay * 100)}% more!`;
}
// The recipe kit: both foods for a dish a customer is waiting for (one who isn't ready to serve yet).
// Returns the recipe, or { why: 'none' | 'room' } if it can't help right now.
function placeKit() {
  const counts = boardCounts();
  let r = null;
  for (const o of S.orders) {
    if (isReady(o, counts)) continue;
    if (o.likes) {
      for (const a of o.likes) for (const b of o.likes) r ||= findRecipe(a, b);
    } else {
      const w = o.wants.find(x => x.dish);
      if (w) r = recipeOf(w.dish);
    }
    if (r) break;
  }
  if (!r) return { why: 'none' };
  if (freeCells() < 2) return { why: 'room' };
  for (const f of [r.a, r.b]) {
    const spot = nearestEmpty(producerIndex());
    S.board[spot] = { chain: f.chain, tier: f.tier };
    S.seen[keyOf(f)] = true;
  }
  renderAll();
  return r;
}
// The picture on a shop tile for foods: this restaurant's first food at that level.
const shopFoodArt = tier => { const ch = availableChains()[0]; return `art-${CHAINS[ch].tiers[Math.min(tier, maxTier(ch)) - 1].id}`; };

// ---------- missions: one-time goals that pay gems ----------
const allCities = () => S.openCities.map(id => (id === S.city ? S : S.cityData[id])).filter(Boolean);
const sumCities = f => allCities().reduce((t, d) => t + f(d), 0);
function missionStat(stat) {
  switch (stat) {
    case 'served': return sumCities(d => d.served || 0);
    case 'recipes': return Object.keys(S.recipes).length;
    case 'stars': return sumCities(d => d.starLevel || 0);
    case 'hoodLevels': return Object.values(S.hood.stages).reduce((t, n) => t + n, 0) + S.hood.built.length;
    case 'upgradeLevels': return sumCities(d => Object.values(d.upLv || {}).reduce((t, n) => t + n, 0));
    case 'maxedUpgrades': return sumCities(d => Object.values(d.upLv || {}).filter(n => n >= 3).length);
    case 'maxedImprovements': return Object.values(S.hood.stages).filter(n => n >= 3).length;
    case 'events': return Object.keys(S.hood.hosted).length;
    case 'restaurants': return S.openCities.length;
    case 'buzzLevel': return S.hood.level;
    default: return S.stats[stat] || 0;
  }
}
const missionDone = m => missionStat(m.stat) >= m.n;
const missionReady = () => MISSIONS.some(m => !S.missions[m.id] && missionDone(m));
function renderMissions() {
  // Finished ones she hasn't claimed come first, then the next few to work on.
  const open = MISSIONS.filter(m => !S.missions[m.id]);
  const shown = [...open.filter(missionDone), ...open.filter(m => !missionDone(m)).slice(0, 4)];
  const claimed = MISSIONS.length - open.length;
  $('#mission-count').textContent = `${claimed} of ${MISSIONS.length} missions done.`;
  $('#mission-list').innerHTML = shown.map(m => {
    const have = Math.min(m.n, missionStat(m.stat)), done = have >= m.n;
    return `<li class="upg${done ? ' next' : ''}"><div class="upg-text"><b>${m.name}</b><span>${done ? 'Done!' : `${have} of ${m.n}`} · ${m.gems} gems</span>` +
      `${done ? '' : `<div class="bar-track mission-bar"><div class="bar-fill" style="width:${Math.round(have / m.n * 100)}%"></div></div>`}</div>` +
      (done ? `<button class="btn primary" data-mission="${m.id}">Claim</button>` : '') + '</li>';
  }).join('') || '<li class="upg done"><div class="upg-text"><b>Every mission done!</b><span>Amazing work.</span></div></li>';
}
const openGemShop = () => arcade.openPrizes(); // the gem shop draws the missions too (renderMissions)
$('#mission-list').addEventListener('click', e => {
  const b = e.target.closest('[data-mission]');
  const m = b && MISSIONS.find(x => x.id === b.dataset.mission);
  if (!m || S.missions[m.id] || !missionDone(m)) return;
  S.missions[m.id] = true;
  S.gems += m.gems;
  buzz('serve');
  toast(`Mission done: +${m.gems} gems!`);
  openGemShop();
  renderHeader(); save();
});

// ---------- badges ----------
function statFor(b) {
  if (b.stat === 'cities') return S.openCities.length;
  return b.stat === 'recipes' ? Object.keys(S.recipes).length : (S.stats[b.stat] || 0);
}
function checkBadges() {
  for (const b of BADGES) {
    if (!b.tiers) continue;
    const had = S.badges[b.id] || 0;
    const now = b.tiers.filter(t => statFor(b) >= t).length;
    for (let lv = had + 1; lv <= now; lv++) {
      S.dollars += BADGE_REWARD[lv - 1];
      S.gems += GEMS.badge[lv - 1];
      celebrate({
        art: badgeSvg(b.id, lv), reveal: true, title: 'Badge earned!', name: `${b.name}: ${BADGE_TIER_NAMES[lv - 1]}`,
        line: `${b.tiers[lv - 1].toLocaleString()} ${b.tiers[lv - 1] === 1 ? b.one : b.unit}`, reward: BADGE_REWARD[lv - 1], gems: GEMS.badge[lv - 1],
      });
    }
    if (now > had) S.badges[b.id] = now;
  }
}

// Big moments get a card in the middle of the screen. Tap to carry on.
const celebrations = [];
function celebrate(c) {
  celebrations.push(c);
  if (celebrations.length === 1) showCelebration();
}
function showCelebration() {
  const c = celebrations[0];
  if (!c) return;
  const el = $('#celebrate');
  el.querySelector('.cele-art').innerHTML = c.art;
  el.querySelector('.cele-art').classList.toggle('wide', !!c.wide);
  el.querySelector('.cele-art').classList.toggle('reveal', !!c.reveal); // badges: the lid lifts off
  el.querySelector('.cele-title').textContent = c.title;
  el.querySelector('.cele-name').textContent = c.name;
  el.querySelector('.cele-line').textContent = c.line;
  const reward = el.querySelector('.cele-reward');
  reward.hidden = !(c.reward || c.gems);
  reward.innerHTML = (c.reward ? `${ICONS.coin}<span>+${c.reward}</span>` : '') +
    (c.gems ? `${ICONS.gem}<span>+${c.gems}</span>` : '');
  el.hidden = false;
  buzz('serve');
  if (!reduceMotion) el.querySelector('.cele-card').animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
}
$('#celebrate').addEventListener('click', () => {
  celebrations.shift();
  $('#celebrate').hidden = true;
  renderAll();
  bump($('#money'));
  if (celebrations.length) setTimeout(showCelebration, 180);
});

// ---------- hints: she should never be stuck ----------
function findPair() {
  const groups = new Map();
  S.board.forEach((it, i) => {
    if (isChain(it) && it.tier < maxTier(it.chain)) {
      if (!groups.has(keyOf(it))) groups.set(keyOf(it), []);
      groups.get(keyOf(it)).push(i);
    }
  });
  let best = null;
  for (const [k, list] of groups) {
    if (list.length < 2) continue;
    const tier = +k.split(':')[1];
    if (!best || tier < best.tier) best = { tier, a: list[0], b: list[1] };
  }
  return best;
}
// If a customer wants a dish and both ingredients are on the board, find them.
function findDishPair() {
  for (const o of S.orders) {
    if (o.likes) {
      if (pennyDishAt(o) >= 0) continue;
      for (const a of o.likes) for (const b of o.likes) {
        const r = findRecipe(a, b), ia = S.board.findIndex(x => isChain(x) && sameItem(x, a));
        const ib = S.board.findIndex((x, j) => isChain(x) && sameItem(x, b) && j !== ia);
        if (r && ia >= 0 && ib >= 0) return { r, a: ia, b: ib };
      }
      continue;
    }
    const w = o.wants.find(x => x.dish && !S.board.some(b => b && b.dish === x.dish));
    if (!w) continue;
    const r = recipeOf(w.dish);
    const ia = S.board.findIndex(b => isChain(b) && sameItem(b, r.a));
    const ib = S.board.findIndex((b, j) => isChain(b) && sameItem(b, r.b) && j !== ia);
    if (ia >= 0 && ib >= 0) return { r, a: ia, b: ib };
  }
  return null;
}

function hint(fromButton) {
  const counts = boardCounts();
  const ready = S.orders.findIndex(o => isReady(o, counts));
  if (ready >= 0) {
    wiggle([$(`.order[data-o="${ready}"] .serve`)]);
    if (fromButton) toast('A customer is ready. Tap Serve!');
    return;
  }
  const dish = findDishPair();
  if (dish) {
    wiggle([cellEl(dish.a), cellEl(dish.b)]);
    if (fromButton) toast(`Drag the ${nameOf(dish.r.a)} onto the ${nameOf(dish.r.b)} to make ${dish.r.name}.`);
    return;
  }
  const pair = findPair();
  if (pair) {
    wiggle([cellEl(pair.a), cellEl(pair.b)]);
    if (fromButton) toast('Drag one of these onto the other.');
    return;
  }
  if (fromButton) {
    const wantDish = S.orders.flatMap(o => o.wants).find(w => w.dish);
    if (wantDish) {
      const r = recipeOf(wantDish.dish);
      toast(`${r.name} is ${nameOf(r.a)} mixed with ${nameOf(r.b)}.`);
      return;
    }
  }
  const p = producerIndex();
  if ((unlimited() || S.charges > 0) && nearestEmpty(p) >= 0) {
    wiggle([cellEl(p)]);
    if (fromButton) toast('Tap a starter block for more ingredients.');
    return;
  }
  if (!unlimited() && S.charges <= 0) { if (fromButton) openRefill(); return; }
  // Board is full with nothing to merge: suggest selling the smallest thing.
  const wanted = new Set(S.orders.flatMap(orderKeys));
  const score = it => (it.dish ? 7 : it.tier) + (wanted.has(keyOf(it)) ? 10 : 0);
  let low = -1;
  S.board.forEach((it, i) => {
    if (!it || it.producer || it.wild) return; // only things that can be sold
    if (low < 0 || score(it) < score(S.board[low])) low = i;
  });
  if (low >= 0) {
    sel = low;
    orderPick = null;
    renderAll();
    wiggle([cellEl(low)]);
    toast('The board is full. Sell this to make room.');
  }
}

// ---------- first-time guide: teaches by doing ----------
const TUTORIAL = [
  { text: 'Tap the bakery crate to get ingredients.', on: 'produce' },
  { text: 'Drag two matching ingredients together to merge them.', on: 'merge' },
  { text: 'Make what a customer wants, then tap Serve.', on: 'serve' },
  { text: 'Lovely! Tap a food in an order to see how to make it.', on: 'peek' },
];
function advanceTutorial(event) {
  const step = TUTORIAL[S.tutorial];
  if (step && step.on === event) { S.tutorial++; renderTip(); }
}
function tutorialTarget() {
  if (S.tutorial === 0) return cellEl(producerIndex());
  if (S.tutorial === 1) {
    const pair = findPair();
    return pair ? cellEl(pair.a) : cellEl(producerIndex());
  }
  if (S.tutorial === 2) {
    const counts = boardCounts();
    const ready = S.orders.findIndex(o => isReady(o, counts));
    return ready >= 0 ? $(`.order[data-o="${ready}"] .serve`) : null;
  }
  return null;
}
function renderTip() {
  const tip = $('#tip');
  document.querySelectorAll('.guide').forEach(el => el.classList.remove('guide'));
  const step = TUTORIAL[S.tutorial];
  let text = step?.text;
  if (S.tutorial === 1 && !findPair()) text = 'Tap the crate again until two ingredients match.';
  if (S.tutorial === 2 && !tutorialTarget()) text = 'Keep merging to make what a customer wants.';
  // A one-time tip when the first dish order arrives.
  if (!step && S.stats.mixes === 0 && S.orders.some(o => o.wants.some(w => w.dish))) {
    text = 'Dishes need both of their foods on the board. Then tap Serve!';
  }
  // With nothing to teach, the bar shows a gem shop boost that's running.
  tip.classList.toggle('boost', !text && !!boostOf());
  if (!text && boostOf()) text = boostLine();
  if (!text) { tip.hidden = true; return; }
  tip.textContent = text;
  tip.hidden = false;
  tutorialTarget()?.classList.add('guide');
}

// ---------- drawing the screen ----------
function renderHeader() {
  $('#money-n').textContent = S.dollars.toLocaleString();
  $('#charges').hidden = unlimited();
  $('#charges-n').textContent = S.charges;
  $('#gems-n').textContent = S.gems;
  if (arcade) $('#nav-today .dot').hidden = !arcade.somethingNew();
  $('#charges-t').textContent = S.charges < perks().chargesMax ? `+1 in ${mmss(nextChargeIn())}` : 'Full';
  const can = upgradeAffordable();
  const CITY = city(), goals = CITY.starGoals, lv = S.starLevel, goal = goals[Math.min(lv, goals.length - 1)];
  const prev = lv === 0 ? 0 : goals[lv - 1];
  $('#brand-city').innerHTML = `${CITY.name} <span class="brand-stars">${'★'.repeat(lv)}${'☆'.repeat(goals.length - lv)}</span>`;
  // In the Cozy mood nobody ever leaves, so there are no hearts to show.
  const hearts = mood().complaints === false ? '' : '♥'.repeat(Math.max(0, maxHearts() - (S.complaints || 0))) + '♡'.repeat(Math.min(maxHearts(), S.complaints || 0));
  $('#brand-next').innerHTML = `${lv >= goals.length ? `${cityStars()} stars. You won ${CITY.name}!` : `${cityStars()} of ${goal} stars`} <span class="hearts" title="Complaints left before the round starts over">${hearts}</span>`;
  $('#brand-fill').style.width = `${lv >= goals.length ? 100 : Math.min(100, Math.round((cityStars() - prev) / (goal - prev) * 100))}%`;
  $('#brand-dot').hidden = !hoodNews();
  $('#nav-restaurant .dot').hidden = !can;
  $('#gems .dot').hidden = !missionReady();
}

function renderOrders() {
  const counts = boardCounts();
  $('#orders').style.gridTemplateColumns = `repeat(${S.orders.length}, minmax(0, 1fr))`;
  $('#orders').innerHTML = S.orders.map((o, oi) => {
    const have = orderStatus(o, counts);
    const ready = isReady(o, counts);
    const v = vipOf(o);
    const slots = slotsOf(o);
    const need = slots.map((it, k) => {
      const picked = orderPick && orderPick.o === oi && orderPick.k === k;
      return `<button class="need-item fam-${familyOf(it)}${have[k] ? ' have' : ''}${picked ? ' picked' : ''}${o.likes ? ' like' : ''}" data-o="${oi}" data-k="${k}" aria-label="${nameOf(it)}">` +
        `${use(artId(it))}${have[k] ? `<span class="tick">${ICONS.check}</span>` : ''}</button>`;
    }).join('');
    const cust = v ? `<button class="cust vip-face" data-vip="${oi}" aria-label="${v.name}, VIP">${use(`cust-${o.customer}`)}<span class="vip-tag">VIP</span></button>` :
      `<div class="cust">${use(`cust-${o.customer}`, custName(o))}</div>`;
    return `<div class="order${ready ? ' ready' : ''}${v ? ` vip vip-${v.kind}` : ''}" data-o="${oi}">
      ${cust}
      <div class="reward"><span class="pay">${ICONS.coin}<b class="pay-n">${payFor(o) + tipFor(o)}</b></span><span class="stars">★<b class="stars-n">${starsFor(o)}</b></span></div>
      <div class="need${slots.length > 2 ? ' many' : ''}">${need}</div>
      ${ready ? `<button class="serve" data-serve="${oi}">Serve</button>` : `<div class="cust-name">${v ? vipLine(o) : orderName(o)}</div>`}
      <div class="tipbar ${barClass(o)}" title="${o.limit ? 'Time left before Zip leaves' : 'Pay drops as the customer waits'}"><i style="width:${Math.round(barShare(o) * 100)}%"></i></div>
    </div>`;
  }).join('');
}

function render() {
  const wanted = new Set();
  const counts = boardCounts();
  for (const o of S.orders) for (const k of orderKeys(o)) wanted.add(k);
  $('#board').innerHTML = S.board.map((it, i) => {
    const selCls = i === sel ? ' sel' : '';
    if (!it) return `<div class="cell${selCls}" data-i="${i}"></div>`;
    const cls = ['item'];
    if (it.producer) cls.push('producer');
    if (it.producer && !unlimited() && S.charges <= 0) cls.push('empty');
    return `<div class="cell fam-${familyOf(it)}${selCls}" data-i="${i}"><div class="${cls.join(' ')}">${use(artId(it), nameOf(it))}</div>` +
      `${isChain(it) ? `<span class="lv">${it.tier}</span>` : ''}` +
      `${mark && mark.i === i ? `<span class="new-tag">${mark.text}</span>` : ''}` +
      `${!it.producer && wanted.has(keyOf(it)) ? `<span class="tick">${ICONS.check}</span>` : ''}</div>`;
  }).join('');
}

// The info bar, and the "how do I make this" preview above it.
function picked() {
  if (sel >= 0 && S.board[sel]) return S.board[sel];
  if (orderPick) { const o = S.orders[orderPick.o]; return o ? slotsOf(o)[orderPick.k] || null : null; }
  return null;
}
function renderInfo() {
  const info = $('#info');
  const it = picked();
  info.hidden = !it;
  if (!it) {
    info.innerHTML = '';
  } else if (it.wild) {
    info.innerHTML = `<div class="info-icon fam-wild">${use(artId(it))}</div>
      <div class="info-text"><b>Wild card</b><span>Drop it on any food, or drop a food on it, to make a copy.</span></div>`;
  } else if (it.producer) {
    const names = PRODUCERS[it.producer].makes.map(m => CHAINS[m.chain].tiers[m.tier - 1].name).join(' or ');
    info.innerHTML = `<div class="info-icon">${use(artId(it))}</div>
      <div class="info-text"><b>${nameOf(it)}</b><span>Tap to make ${names}.${unlimited() ? '' : ' Uses 1 charge.'}</span></div>`;
  } else {
    let text;
    if (it.dish) {
      const r = recipeOf(it.dish);
      text = `A dish, made from ${nameOf(r.a)} and ${nameOf(r.b)}. Serve it to a customer who wants it.`;
    } else {
      const max = maxTier(it.chain);
      if (orderPick) {
        const maker = Object.values(PRODUCERS).find(p => p.makes.some(m => m.chain === it.chain))?.name || 'a starter block';
        text = `Level ${it.tier} of ${max}. ` + (it.tier > 1 ? `Make it by merging two ${CHAINS[it.chain].tiers[it.tier - 2].name}.` : `Comes from the ${maker.toLowerCase()}.`);
      } else {
        text = `Level ${it.tier} of ${max}. ` + (it.tier < max ? `Merge 2 to make ${CHAINS[it.chain].tiers[it.tier].name}.` : 'Top of the chain!');
      }
    }
    let buttons = '';
    if (sel >= 0) {
      buttons = `<button class="sell" data-sell="${sel}">Sell $${sellValue(it)}</button>`;
      if (isChain(it) && it.tier < maxTier(it.chain)) buttons += gemButton('levelup', sel, 'Level up', GEMS.levelUp);
    }
    info.innerHTML = `<div class="info-icon fam-${familyOf(it)}">${use(artId(it))}</div>
      <div class="info-text"><b>${nameOf(it)}</b><span>${text}</span></div>${buttons}`;
  }
  renderAbilities();
  renderChainPreview(orderPick ? it : null);
}

// Gem abilities for the customer whose food she tapped.
const gemButton = (ability, target, label, cost) =>
  `<button class="sell gem-skip" data-ability="${ability}" data-target="${target}"${S.gems < cost ? ' disabled' : ''}>${label}<br>${ICONS.gem}${cost}</button>`;
function renderAbilities() {
  const bar = $('#abilities');
  const o = orderPick && S.gems > 0 ? S.orders[orderPick.o] : null; // nothing to show until she has gems
  bar.hidden = !o;
  if (!o) { bar.innerHTML = ''; return; }
  bar.innerHTML = `<span class="abilities-title">Gem abilities</span>` +
    gemButton('serve', orderPick.o, 'Serve now', skipCost(o)) +
    gemButton('swap', orderPick.o, 'Swap', GEMS.swap) +
    (tipShare(o) < 1 ? gemButton('tip', orderPick.o, tipsNormally(o) ? 'Fresh tip' : 'More time', GEMS.freshTip) : '');
}
function useAbility(ability, target) {
  if (ability === 'serve') { skipOrder(target); return; }
  if (ability === 'swap') {
    const o = S.orders[target];
    if (!o || S.gems < GEMS.swap) return;
    S.gems -= GEMS.swap;
    S.orders[target] = makeOrder();
    orderPick = null;
    buzz('merge');
    toast('A new customer stepped up!');
  } else if (ability === 'tip') {
    const o = S.orders[target];
    if (!o || S.gems < GEMS.freshTip) return;
    S.gems -= GEMS.freshTip;
    o.age = 0;
    buzz('merge');
    toast('Speed tip refilled.');
  } else if (ability === 'levelup') {
    const it = S.board[target];
    if (!isChain(it) || it.tier >= maxTier(it.chain) || S.gems < GEMS.levelUp) return;
    S.gems -= GEMS.levelUp;
    S.board[target] = { chain: it.chain, tier: it.tier + 1 };
    buzz('merge');
    discover(S.board[target], target);
    renderAll();
    pop(target);
    checkBadges();
    save();
    return;
  }
  renderAll();
  save();
}

function renderChainPreview(it) {
  const pop = $('#chainpop');
  if (!it) { pop.hidden = true; return; }
  const chip = (x, current, label) => `<div class="step${current ? ' current' : ''} fam-${familyOf(x)}">` +
    `<div class="step-art">${use(artId(x))}</div><span>${label ?? nameOf(x)}</span></div>`;
  const arrow = `<div class="join">${ICONS.arrow}</div>`;
  let title, row;
  if (it.producer) {
    title = 'The pantry crate makes';
    row = PRODUCERS[it.producer].makes.map(m => chip({ chain: m.chain, tier: m.tier }, false)).join('<div class="join or">or</div>');
  } else if (it.dish) {
    const r = recipeOf(it.dish);
    title = 'Recipe: mix these two';
    row = chip(r.a, false) + `<div class="join">${ICONS.plus}</div>` + chip(r.b, false) + arrow + chip(it, true);
  } else {
    const o = S.orders[orderPick.o];
    title = o.wants.length === 1 && o.wants[0].dish ? `${orderName(o)} needs ${nameOf(it)}. Merge two to get the next:` : `Merge two to get the next:`;
    row = CHAINS[it.chain].tiers.map((t, n) => chip({ chain: it.chain, tier: n + 1 }, n + 1 === it.tier)).join(arrow);
  }
  pop.innerHTML = `<p class="pop-title">${title}</p><div class="pop-row">${row}</div>`;
  pop.hidden = false;
}

function renderAll() {
  tickCharges();
  renderHeader();
  renderOrders();
  render();
  renderInfo();
  renderTip();
}

// ---------- little bits of motion and feedback ----------
function buzz(kind) {
  if (S.settings.vibrate && navigator.vibrate) {
    try { navigator.vibrate(CONFIG.vibration[kind]); } catch { /* not supported */ }
  }
}
function pop(i) {
  const el = cellEl(i)?.querySelector('.item');
  if (el && !reduceMotion) el.animate([{ transform: 'scale(1.45)' }, { transform: 'scale(.92)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
}
// Animate the item now sitting in square "to" as if it came from square "from".
function fly(from, to, grow) {
  const a = cellEl(from), b = cellEl(to), el = b?.querySelector('.item');
  if (!a || !el || reduceMotion) return;
  const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
  el.animate([
    { transform: `translate(${ra.left - rb.left}px, ${ra.top - rb.top}px)${grow ? ' scale(.4)' : ''}` },
    { transform: 'none' },
  ], { duration: grow ? 300 : 260, easing: 'cubic-bezier(.2,.8,.3,1.25)' });
}
function shake(el) {
  if (el && !reduceMotion) el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 220 });
}
function flyAway(indices, card) {
  if (!card || reduceMotion) return;
  const rc = card.getBoundingClientRect();
  for (const i of indices) {
    const src = cellEl(i)?.querySelector('.item');
    if (!src) continue;
    const r = src.getBoundingClientRect();
    const ghost = src.cloneNode(true);
    Object.assign(ghost.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, zIndex: 40, pointerEvents: 'none' });
    document.body.append(ghost);
    const dx = rc.left + rc.width / 2 - (r.left + r.width / 2), dy = rc.top + rc.height / 2 - (r.top + r.height / 2);
    ghost.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.35)`, opacity: .2 }],
      { duration: 420, easing: 'cubic-bezier(.5,0,.7,1)' }).onfinish = () => ghost.remove();
  }
}
function floatText(text, near) {
  if (!near) return;
  const r = near.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float';
  el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.bottom + 4}px`;
  document.body.append(el);
  el.animate([{ transform: 'translate(-50%, 6px)', opacity: 0 }, { transform: 'translate(-50%, 0)', opacity: 1, offset: .2 }, { transform: 'translate(-50%, 18px)', opacity: 0 }],
    { duration: reduceMotion ? 900 : 1300, easing: 'ease-out' }).onfinish = () => el.remove();
}
function bump(el) {
  if (el && !reduceMotion) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 300 });
}
function wiggle(els) {
  for (const el of els) {
    if (!el) continue;
    el.classList.remove('wiggle');
    void el.offsetWidth;
    el.classList.add('wiggle');
    setTimeout(() => el.classList.remove('wiggle'), 1600);
  }
}

let toastTimer = 0;
function toast(text, opts = {}) {
  const el = $('#toast');
  el.innerHTML = '';
  if (opts.icon) el.insertAdjacentHTML('beforeend', `<span class="toast-icon">${use(opts.icon)}</span>`);
  el.insertAdjacentHTML('beforeend', `<span class="toast-text"></span>`);
  el.querySelector('.toast-text').textContent = text;
  if (opts.action) {
    const b = document.createElement('button');
    b.textContent = opts.action;
    b.onclick = () => { el.hidden = true; opts.onAction(); };
    el.append(b);
  }
  el.classList.toggle('celebrate', !!opts.celebrate);
  el.classList.toggle('has-action', !!opts.action);
  el.hidden = false;
  if (!reduceMotion) el.animate([{ transform: 'translate(-50%, -6px)', opacity: 0 }, { transform: 'translate(-50%, 0)', opacity: 1 }], { duration: 200, easing: 'ease-out' });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, opts.ms || (opts.action ? 4500 : 1800));
}

// ---------- dragging and tapping on the board ----------
let drag = null;
const board = $('#board');

board.addEventListener('contextmenu', e => e.preventDefault());

board.addEventListener('pointerdown', e => {
  const cell = e.target.closest('.cell');
  if (!cell) return;
  lastAction = Date.now();
  const i = +cell.dataset.i;
  if (!S.board[i]) { sel = -1; orderPick = null; renderAll(); return; }
  drag = { i, x0: e.clientX, y0: e.clientY, started: false, ghost: null, hover: -1 };
  board.setPointerCapture(e.pointerId);
});

board.addEventListener('pointermove', e => {
  if (!drag) return;
  if (!drag.started) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
    drag.started = true;
    const cell = cellEl(drag.i), src = cell.querySelector('.item');
    const r = cell.getBoundingClientRect();
    drag.ghost = src.cloneNode(true);
    drag.ghost.classList.add('drag-ghost');
    Object.assign(drag.ghost.style, { width: `${r.width}px`, height: `${r.height}px` });
    document.body.append(drag.ghost);
    document.body.classList.add('dragging');
    src.classList.add('lifted');
    sel = drag.i;
    orderPick = null;
  }
  drag.ghost.style.left = `${e.clientX}px`;
  drag.ghost.style.top = `${e.clientY}px`;
  const over = cellAt(e.clientX, e.clientY);
  if (over !== drag.hover) {
    cellEl(drag.hover)?.classList.remove('drop-merge', 'drop-move', 'drop-no');
    drag.hover = over;
    if (over >= 0 && over !== drag.i) {
      const a = S.board[drag.i], b = S.board[over];
      cellEl(over).classList.add(!b ? 'drop-move' : (canMerge(a, b) || findRecipe(a, b)) ? 'drop-merge' : 'drop-no');
    }
  }
});

function endDrag(e, cancelled) {
  if (!drag) return;
  const d = drag;
  drag = null;
  d.ghost?.remove();
  document.body.classList.remove('dragging');
  if (!d.started) {
    if (!cancelled) tap(d.i);
    return;
  }
  const to = cancelled ? -1 : cellAt(e.clientX, e.clientY);
  if (to >= 0) dropOn(d.i, to); else renderAll();
}
board.addEventListener('pointerup', e => endDrag(e, false));
board.addEventListener('pointercancel', e => endDrag(e, true));

function cellAt(x, y) {
  const el = document.elementFromPoint(x, y)?.closest('#board .cell');
  return el ? +el.dataset.i : -1;
}

function tap(i) {
  const it = S.board[i];
  orderPick = null;
  if (it?.producer) { sel = -1; produce(i); return; }
  sel = sel === i ? -1 : i;
  buzz('tap');
  renderAll();
}

// ---------- buttons ----------
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  lastAction = Date.now();
  if (t.dataset.serve !== undefined) serve(+t.dataset.serve);
  else if (t.dataset.vip !== undefined) {
    const o = S.orders[+t.dataset.vip], v = vipOf(o);
    if (v) { buzz('tap'); toast(v.kind === 'puzzle' ? `${v.about} ${orderName(o)}.` : v.about, { icon: `cust-${v.id}`, ms: 4500 }); }
  }
  else if (t.dataset.k !== undefined) {
    const o = +t.dataset.o, k = +t.dataset.k;
    const same = orderPick && orderPick.o === o && orderPick.k === k;
    orderPick = same ? null : { o, k };
    sel = -1;
    advanceTutorial('peek');
    buzz('tap');
    renderAll();
  }
  else if (t.dataset.sell !== undefined) sell(+t.dataset.sell);
  else if (t.dataset.ability !== undefined) useAbility(t.dataset.ability, +t.dataset.target);
  else if (t.id === 'nav-today') arcade.open();
  else if (t.id === 'gems') openGemShop();
  else if (t.dataset.upg !== undefined) buyUpgrade(t.dataset.upg);
  else if (t.id === 'hint-btn') hint(true);
  else if (t.id === 'charges') openRefill();
  else if (t.id === 'brand') openHood();
  else if (t.id === 'nav-restaurant') openRestaurant();
  else if (t.dataset.travel !== undefined) travel(t.dataset.travel);
  else if (t.id === 'nav-recipes') openRecipes();
  else if (t.id === 'nav-badges') openBadges();
  else if (t.id === 'settings-btn') openSettings();
  else if (t.dataset.close !== undefined) closeSheets();
});

// ---------- sheets ----------
function openSheet(id) {
  closeSheets();
  sel = -1;
  orderPick = null;
  renderAll();
  $(id).hidden = false;
}
function closeSheets() {
  document.querySelectorAll('.sheet').forEach(s => { s.hidden = true; });
  resetTwoTaps();
}
document.querySelectorAll('.sheet').forEach(s => s.addEventListener('click', e => { if (e.target === s) closeSheets(); }));

// The restaurant
let restFocus = null, restFocusPreview = true;
function renderRestaurant() {
  $('#rest-title').textContent = `${city().name} · ${city().cuisine}`;
  $('#rest-art').innerHTML = restaurantPhoto(restFocus);
  const fu = UPGRADES.find(u => u.id === restFocus);
  const fShown = fu && levelName(fu, Math.min(2, Math.max(0, upLevel(fu.id) - (restFocusPreview ? 0 : 1))));
  $('#rest-caption').textContent = !fu ? 'Tap an upgrade to see where it goes.'
    : !restFocusPreview || upLevel(fu.id) >= 3 ? `${fShown}, outlined in purple.` : `Preview: ${fShown}, outlined in purple.`;
  const levels = Object.values(S.upLv).reduce((t, n) => t + n, 0);
  $('#rest-count').textContent = `${levels} of ${UPGRADES.length * 3} upgrade levels`;
  $('#rest-list').innerHTML = UPGRADES.map(u => {
    const n = upLevel(u.id), st = nextLevel(u), top = !st, open = !top && levelOpen(u);
    const can = open && S.dollars >= upgradeCost(st);
    const pips = `<span class="pips">${u.levels.map((_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
    const right = top ? `<span class="upg-done">${ICONS.check}</span>`
      : !open ? `<span class="upg-cost">Level ${n + 1}<br>at ${levelGoal(n)}★</span>`
      : `<button class="btn primary upg-buy" data-upg="${u.id}"${can ? '' : ' disabled'}>${n ? 'Upgrade' : 'Buy'}<br>$${upgradeCost(st).toLocaleString()}</button>`;
    const short = open && !can ? `<em>$${(upgradeCost(st) - S.dollars).toLocaleString()} more to go</em>`
      : !top && !open ? `<em>Level ${n + 1} opens at ${levelGoal(n)} stars (${cityStars()} now).</em>` : '';
    const note = top ? `${levelName(u, 2)}. All 3 levels done!` : `${n ? `Now: ${levelName(u, n - 1)}. Next: ` : ''}${levelName(u, n)}. ${st.perk}`;
    const swatches = n && u.choice ? `<div class="swatches">${choiceList(u.choice).map(c =>
      `<button class="swatch${choiceColour(u.choice) === c.colour ? ' on' : ''}" data-choice="${u.choice}" data-colour="${c.colour}" style="background:${c.colour}" aria-label="${c.name}"></button>`).join('')}</div>` : '';
    return `<li class="upg${top ? ' done' : can ? ' next' : !open ? ' later' : ''}${restFocus === u.id ? ' focused' : ''}" data-focus="${u.id}">` +
      `<div class="upg-text"><b>${upName(u)} ${pips}</b><small class="upg-what">${u.what}</small><span>${note}</span>${short}${swatches}</div>${right}</li>`;
  }).join('');
}
function openRestaurant() {
  restFocus = null;
  renderRestaurant();
  openSheet('#restaurant');
}
$('#rest-list').addEventListener('click', e => {
  const sw = e.target.closest('.swatch');
  if (sw) {
    S.choices ??= {};
    S.choices[sw.dataset.choice] = sw.dataset.colour;
    restFocus = sw.dataset.choice; restFocusPreview = false;
    buzz('tap');
    renderRestaurant();
    save();
    return;
  }
  if (e.target.closest('button')) return;
  const li = e.target.closest('li[data-focus]');
  if (!li) return;
  restFocus = restFocus === li.dataset.focus ? null : li.dataset.focus;
  restFocusPreview = true;
  buzz('tap');
  renderRestaurant();
}); 

// The recipe book
function openRecipes() {
  const found = RECIPES.filter(r => S.recipes[r.id]).length;
  $('#recipe-count').textContent = `${found} of ${RECIPES.length} found`;
  $('#recipe-list').innerHTML = CITIES.map(c => {
    const list = RECIPES.filter(r => recipeCity(r) === c.id);
    const open = S.openCities.includes(c.id);
    return `<li class="recipe-city"><b>${c.name}</b><span>${list.filter(r => S.recipes[r.id]).length} of ${list.length}${open ? '' : ' · opens later'}</span></li>` +
      list.map(r => {
        const known = !!S.recipes[r.id];
        return `<li class="recipe${known ? '' : ' unknown'}"><div class="recipe-art fam-dish">${use(`art-${r.id}`)}</div>` +
          `<div class="recipe-text"><b>${known ? r.name : 'Not found yet'}</b>${r.hers ? '<span class="hers">From your recipe box</span>' : ''}` +
          `<span>${known ? `${nameOf(r.a)} + ${nameOf(r.b)}` : open ? 'Mix two different foods to find it.' : `Cook at ${c.name} to find it.`}</span></div></li>`;
      }).join('');
  }).join('');
  openSheet('#recipes');
}

// The badge shelf
function openBadges() {
  const earned = BADGES.reduce((t, b) => t + (S.badges[b.id] || 0), 0);
  $('#badge-count').textContent = `${earned} of ${BADGES.length * 3} golden spoons earned`;
  $('#badge-list').innerHTML = BADGES.map(b => {
    const lv = S.badges[b.id] || 0;
    let progress;
    if (b.soon) progress = `<span class="soon">Coming in a later update</span>`;
    else if (lv >= 3) progress = `<span>All three spoons!</span>`;
    else {
      const goal = b.tiers[lv], have = Math.min(statFor(b), goal);
      progress = `<span>${have.toLocaleString()} of ${goal.toLocaleString()} ${b.unit} for ${BADGE_TIER_NAMES[lv].toLowerCase()}</span>` +
        `<div class="bar-track"><div class="bar-fill" style="width:${Math.round(have / goal * 100)}%"></div></div>`;
    }
    return `<li class="badge${b.soon ? ' is-soon' : ''}"><div class="plate">${badgeSvg(b.id, lv)}</div><div class="badge-text"><b>${b.name}</b>${progress}</div></li>`;
  }).join('');
  openSheet('#badges');
}

// Pantry refill
function freeRefillAvailable() {
  const r = CONFIG.refill;
  return S.charges < r.freeWhenBelow && (Date.now() >= S.freeRefillAt || S.dollars < r.buyPrice);
}
function renderRefill() {
  const r = CONFIG.refill;
  $('#rf-charges').textContent = S.charges;
  $('#rf-max').textContent = perks().chargesMax;
  $('#rf-timer').textContent = S.charges < perks().chargesMax
    ? `One more in ${mmss(nextChargeIn())}. They come back on their own, even while the game is closed.`
    : 'Your pantry is full.';
  const buy = $('#rf-buy');
  buy.textContent = `Buy ${r.buyAmount} charges for $${r.buyPrice}`;
  buy.disabled = S.dollars < r.buyPrice;
  const gb = $('#rf-gems');
  gb.innerHTML = `Refill ${GEMS.refill.charges} charges for ${GEMS.refill.gems} ${ICONS.gem}`;
  gb.disabled = S.gems < GEMS.refill.gems;
  const free = $('#rf-free');
  free.textContent = `Free top-up: +${r.freeAmount}`;
  free.hidden = !freeRefillAvailable();
  const wait = Math.ceil((S.freeRefillAt - Date.now()) / 60000);
  $('#rf-note').textContent = !free.hidden ? '' :
    S.charges >= r.freeWhenBelow ? `A free top-up appears when you're down to ${r.freeWhenBelow - 1}.` :
    `Next free top-up in ${wait} min.`;
}
function openRefill() { renderRefill(); openSheet('#refill'); }
$('#rf-gems').addEventListener('click', () => {
  if (S.gems < GEMS.refill.gems) return;
  S.gems -= GEMS.refill.gems;
  S.charges += GEMS.refill.charges;
  buzz('serve');
  closeSheets();
  toast(`+${GEMS.refill.charges} pantry charges.`);
  renderAll();
  save();
});
$('#rf-buy').addEventListener('click', () => {
  const r = CONFIG.refill;
  if (S.dollars < r.buyPrice) return;
  S.dollars -= r.buyPrice;
  S.charges += r.buyAmount;
  buzz('serve');
  closeSheets();
  toast(`+${r.buyAmount} pantry charges.`);
  renderAll();
  save();
});
$('#rf-free').addEventListener('click', () => {
  if (!freeRefillAvailable()) return;
  S.charges += CONFIG.refill.freeAmount;
  S.freeRefillAt = Date.now() + CONFIG.refill.freeCooldownMinutes * 60000;
  buzz('serve');
  closeSheets();
  toast(`+${CONFIG.refill.freeAmount} pantry charges. Enjoy!`);
  renderAll();
  save();
});

// Settings and backups
function openSettings() {
  $('#set-vibrate').checked = S.settings.vibrate;
  $('#set-nudge').checked = !!S.settings.nudge;
  renderMoods();
  $('#bk-text').value = '';
  openSheet('#settings');
}
$('#set-vibrate').addEventListener('change', e => {
  S.settings.vibrate = e.target.checked;
  if (S.settings.vibrate) buzz('merge');
  save();
});
$('#set-nudge').addEventListener('change', e => { S.settings.nudge = e.target.checked; save(); });
// Today's mood: five rows, "Just right" in the middle.
function renderMoods() {
  const now = mood().id;
  $('#set-mood').innerHTML = MOODS.map((m, i) => `<button class="mood${m.id === now ? ' on' : ''}" role="radio" aria-checked="${m.id === now}" data-mood="${m.id}">` +
    `<span class="mood-meter" aria-hidden="true">${MOODS.map((_, j) => `<span style="height:${6 + j * 3}px;background:${j <= i ? '#e8475f' : '#e6d3bd'}"></span>`).join('')}</span>` +
    `<span class="mood-text"><b>${m.name}</b><span>${m.about}</span></span></button>`).join('');
}
$('#set-mood').addEventListener('click', e => {
  const b = e.target.closest('[data-mood]');
  if (!b || b.dataset.mood === mood().id) return;
  S.settings.mood = b.dataset.mood;
  buzz('tap');
  renderMoods();
  renderAll();
  save();
  toast(`Today's mood: ${mood().name}.`);
});
$('#bk-copy').addEventListener('click', async () => {
  const code = toCode(S);
  try {
    await navigator.clipboard.writeText(code);
    toast('Backup code copied. Paste it somewhere safe, like a note or an email to yourself.');
  } catch {
    $('#bk-text').value = code;
    $('#bk-text').select();
    $('#restore').open = true;
    toast('Copy the code from the box below.');
  }
});
$('#bk-download').addEventListener('click', () => {
  const blob = new Blob([toCode(S)], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `elaynas-kitchen-backup-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Backup file saved to your downloads.');
});

// Buttons that do something big ask for a second tap first, right on the button.
const twoTaps = new Map();
function twoTap(btn, warning, action) {
  btn.addEventListener('click', () => {
    if (twoTaps.get(btn)) { resetTwoTaps(); action(); return; }
    twoTaps.set(btn, btn.textContent);
    btn.textContent = warning;
    btn.classList.add('armed');
  });
}
function resetTwoTaps() {
  for (const [btn, label] of twoTaps) { if (label) { btn.textContent = label; btn.classList.remove('armed'); } }
  twoTaps.clear();
}
function restore(text) {
  const data = fromCode(text);
  if (!data) { toast("That doesn't look like a backup code."); return; }
  S = migrate(data);
  ensureIsland();
  sel = -1;
  orderPick = null;
  writeSave(S);
  closeSheets();
  renderAll();
  toast('Backup restored. Welcome back!');
}
twoTap($('#bk-restore'), 'Tap again to replace this game', () => restore($('#bk-text').value));
$('#bk-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (file) restore(await file.text());
  e.target.value = '';
});
twoTap($('#reset'), 'Tap again to erase everything', () => {
  clearSave();
  newGame();
  sel = -1;
  orderPick = null;
  writeSave(S);
  closeSheets();
  renderAll();
  toast('A fresh start. Have fun!');
});

// ---------- the Today hub (gift, trivia, mini games, prizes) ----------
function placeFoods(tier, count) {
  const chains = availableChains();
  let placed = 0;
  for (let n = 0; n < count; n++) {
    const spot = nearestEmpty(producerIndex());
    if (spot < 0) break;
    const chain = chains[n % chains.length];
    S.board[spot] = { chain, tier: Math.min(tier, maxTier(chain)) };
    placed++;
  }
  return placed; // callers decide what to do about any that didn't fit
}
const freeCells = () => S.board.filter(x => !x).length;
function placeWild() {
  const spot = nearestEmpty(producerIndex());
  if (spot < 0) return false;
  S.board[spot] = { wild: true };
  return true;
}
function artPool() {
  const ids = [];
  for (const c of Object.keys(CHAINS)) CHAINS[c].tiers.forEach((t, n) => { if (S.seen[`${c}:${n + 1}`]) ids.push(`art-${t.id}`); });
  for (const r of RECIPES) if (S.recipes[r.id]) ids.push(`art-${r.id}`);
  for (const c of Object.keys(CHAINS)) for (const t of CHAINS[c].tiers) if (ids.length < 8 && !ids.includes(`art-${t.id}`)) ids.push(`art-${t.id}`);
  return ids;
}
let arcade = null;

// ---------- start up ----------
function boot() {
  buildSprite();
  $('#board').style.setProperty('--cols', COLS);
  $('#board').style.setProperty('--rows', ROWS);
  $('#money .icon').innerHTML = ICONS.coin;
  $('#gems .icon').innerHTML = ICONS.gem;
  $('#nav-today .nav-icon').innerHTML = ICONS.sun;
  arcade = createArcade({
    getS: () => S, save, renderAll, celebrate, toast, buzz, openSheet, closeSheets,
    placeFoods, placeWild, freeCells, artPool, checkBadges, renderMissions,
    startBoost, boostOf, boostLine, placeKit, restaurantPhoto, shopFoodArt,
    shopStyle: () => theme().style, restaurantName: () => city().name,
  });
  $('#brand-pin').innerHTML = ICONS.pin;
  $('#charges .icon').innerHTML = ICONS.bolt;
  $('#hint-btn .nav-icon').innerHTML = ICONS.bulb;
  $('#nav-restaurant .nav-icon').innerHTML = ICONS.house;
  $('#nav-recipes .nav-icon').innerHTML = ICONS.book;
  $('#nav-badges .nav-icon').innerHTML = ICONS.cloche;
  $('#settings-btn .nav-icon').innerHTML = ICONS.gear;
  S = loadSave();
  if (S) migrate(S); else { newGame(); writeSave(S); }
  ensureIsland(); // older saves get their neighbourhood laid out on the island
  unlockProducers();
  fillOrders();
  // An older save that already reached 2 stars in Toronto opens Mexico City now.
  if (S.starLevel >= city().opensNextAt) openNextCity();
  accrueBia();
  checkHood();
  checkBadges();
  renderAll();

  setInterval(() => {
    accrueBia();
    const paused = !$('#game').hidden || !$('#celebrate').hidden || document.querySelectorAll('.sheet:not([hidden])').length > 0;
    if (document.visibilityState === 'visible' && !paused) {
      // Customers wait: the bar drops and the amount they'll pay counts down toward the normal price.
      // When a bar runs out, that customer complains and leaves.
      // Patient customers (the awning and bench upgrades) wait longer: their clock runs slower.
      const step = Math.round(1000 / ((1 + perks().patience) * mood().patience));
      const done = S.orders.findIndex(o => o.age + step >= o.fast * 2000 && canComplain(o));
      if (done >= 0) { complain(done); return; }
      S.orders.forEach((o, oi) => {
        const before = payFor(o) + tipFor(o), starsBefore = starsFor(o);
        o.age = Math.min(o.age + step, o.fast * 2000);
        // Zip has his own, shorter timer (see vipLeaves).
        if (o.limit && o.age >= o.limit * 1000) { vipLeaves(oi); return; }
        const card = $(`.order[data-o="${oi}"]`);
        if (!card) return;
        const bar = card.querySelector('.tipbar');
        bar.className = `tipbar ${barClass(o)}`;
        bar.querySelector('i').style.width = `${Math.round(barShare(o) * 100)}%`;
        const line = card.querySelector('.cust-name');
        if (line && o.vip) line.textContent = vipLine(o);
        const sn = card.querySelector('.stars-n');
        if (sn && starsFor(o) !== starsBefore) {
          sn.textContent = starsFor(o);
          if (!reduceMotion) sn.animate([{ color: '#e2412f', transform: 'scale(1.3)' }, { color: 'inherit', transform: 'none' }], { duration: 450 });
        }
        const now = payFor(o) + tipFor(o), n = card.querySelector('.pay-n');
        if (n && now !== before) {
          n.textContent = now;
          if (!reduceMotion) n.animate([{ color: '#e2412f', transform: 'scale(1.15)' }, { color: 'inherit', transform: 'none' }], { duration: 450 });
        }
      });
    }
    if (tickCharges()) { renderAll(); save(); } else renderHeader();
    if (!$('#refill').hidden) renderRefill();
    const idle = Date.now() - lastAction > CONFIG.hintIdleSeconds * 1000;
    const busy = drag || !$('#celebrate').hidden || !$('#game').hidden || document.querySelectorAll('.sheet:not([hidden])').length > 0;
    if (idle && S.settings.nudge && S.tutorial >= TUTORIAL.length - 1 && !busy) {
      lastAction = Date.now() + 8000;
      hint(false);
    }
  }, 1000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') writeSave(S);
    else renderAll();
  });

  // Lets the game work offline and be added to the home screen. Fails quietly where unsupported.
  // (Skipped on this computer's local test server so edits show up right away.)
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    // When a new version finishes downloading, save and switch to it straight away.
    const hadOne = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadOne) return;
      writeSave(S);
      location.reload();
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => reg.update()).catch(() => {});
  }
}

boot();
