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
import { UPGRADES, CHOICES } from '../data/restaurant.js';
import { CUSTOMERS } from '../data/customers.js';
import { ORDER_STAGES, ORDER_STARS, SPEED_TIP, BIG_ORDER_BONUS } from '../data/orders.js';
import { buildSprite, use, ICONS, badgeSvg, restaurantSvg, mapSvg as drawMap } from './art.js';
import { loadSave, writeSave, clearSave, toCode, fromCode, SAVE_VERSION } from './save.js';
import { createArcade } from './arcade.js';
import { GEMS, TICKETS_PER_GEM } from '../data/arcade.js';

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
// Each city keeps these for itself; everything else (dollars, gems, badges, recipes) is shared.
const CITY_KEYS = ['board', 'orders', 'orderSeq', 'served', 'producers', 'upgrades', 'choices', 'decor', 'cityStars', 'starLevel'];
const cityOf = id => CITIES.find(c => c.id === id) || CITIES[0];
const city = () => cityOf(S?.city);

// A city the first time she arrives: its starter blocks and one ingredient to begin with.
function newCityState(id) {
  const c = cityOf(id);
  const board = Array(CELLS).fill(null);
  c.starts.forEach((p, n) => { board[idx(2 + n, 3)] = { producer: p }; });
  const first = PRODUCERS[c.starts[0]].makes[0];
  board[idx(1, 4)] = { chain: first.chain, tier: 1 };
  return { board, orders: [], orderSeq: 0, served: 0, producers: [...c.starts], upgrades: [], choices: {}, decor: [], cityStars: 0, starLevel: 0 };
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
  } else toast(`Back in ${c.name}!`);
  buzz('serve');
  save();
}

// The world map: every city, where she is now, and what opens next.
function mapPins() {
  const pins = CITIES.map(c => {
    const here = c.id === S.city;
    const stars = here ? S.starLevel : S.cityData[c.id]?.starLevel;
    return { name: c.name, x: c.map.x, y: c.map.y, state: here ? 'here' : S.openCities.includes(c.id) ? 'open' : 'locked', stars: S.openCities.includes(c.id) ? (stars || 0) : undefined };
  });
  return [...pins, ...COMING_SOON.map(c => ({ name: c.name, x: c.map.x, y: c.map.y, state: 'soon' }))];
}
const mapSvg = () => drawMap(mapPins());
function openMap() {
  $('#map-art').innerHTML = mapSvg();
  $('#map-list').innerHTML = CITIES.map((c, i) => {
    const here = c.id === S.city, open = S.openCities.includes(c.id);
    const lv = here ? S.starLevel : (S.cityData[c.id]?.starLevel || 0);
    const prev = CITIES[i - 1];
    const right = here ? '<span class="map-here">You\'re here</span>'
      : open ? `<button class="btn primary" data-travel="${c.id}">Travel</button>` : '<span class="upg-cost">Locked</span>';
    const note = open ? `${c.restaurant} · ${'★'.repeat(lv)}${'☆'.repeat(3 - lv)}` : `Opens when ${prev.name} reaches ${prev.opensNextAt} stars.`;
    return `<li class="${here ? 'upg next' : open ? 'upg' : 'upg later'}"><div class="upg-text"><b>${c.name}</b><span>${note}</span></div>${right}</li>`;
  }).join('') + COMING_SOON.map(c => `<li class="upg later"><div class="upg-text"><b>${c.name}</b><span>Coming in a later update.</span></div></li>`).join('');
  openSheet('#map');
}

// Opening the next city on the map.
function openNextCity() {
  const i = CITIES.findIndex(c => c.id === S.city), next = CITIES[i + 1];
  if (!next || S.openCities.includes(next.id)) return;
  S.openCities.push(next.id);
  celebrate({ art: mapSvg(), wide: true, title: `${next.name} is open!`, name: 'A new city on your map',
    line: 'Tap your city at the top of the screen to see the map and travel there. Your progress here is kept.' });
  checkBadges();
}

function newGame() {
  S = {
    v: SAVE_VERSION, dollars: 0, city: 'toronto', openCities: ['toronto'], cityData: {},
    charges: CONFIG.charges.start, chargesAt: Date.now(), freeRefillAt: 0,
    tutorial: 0,
    seen: { 'bakery:1': true }, recipes: {}, badges: {},
    ...newCityState('toronto'),
    stats: { produced: 0, merges: 0, mixes: 0, sold: 0, earned: 0, bounces: 0, arcadeWins: 0, triviaRight: 0 },
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
  for (const k of ['produced', 'merges', 'mixes', 'sold', 'bounces', 'arcadeWins', 'triviaRight']) s.stats[k] ??= 0;
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
  s.upgrades ??= [];
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
  s.cityData ??= {};
  s.choices ??= {};
  s.served ??= 0;
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
    orderBonus: 0,
    refillSeconds: CONFIG.charges.refillSeconds,
    bonusChance: CONFIG.producerBonusChance,
    chargesMax: CONFIG.charges.max,
    tipBonus: 0,
  };
  for (const u of UPGRADES) {
    if (!S.upgrades.includes(u.id)) continue;
    const e = u.effect;
    if (e.orderBonus) p.orderBonus += e.orderBonus;
    if (e.refillSeconds) p.refillSeconds = Math.min(p.refillSeconds, e.refillSeconds);
    if (e.producerBonusChance) p.bonusChance = Math.max(p.bonusChance, e.producerBonusChance);
    if (e.chargesMax) p.chargesMax += e.chargesMax;
    if (e.tipBonus) p.tipBonus += e.tipBonus;
  }
  return p;
}
// Upgrades can be bought in any order: is there one she can afford right now?
const upgradeCost = u => Math.round(u.cost * (city().upgradeCost || 1) / 5) * 5;
const upgradeAffordable = () => UPGRADES.some(u => !S.upgrades.includes(u.id) && S.dollars >= upgradeCost(u));

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
const currentStage = () => ORDER_STAGES.find(st => cityStars() < st.untilStars) || ORDER_STAGES[ORDER_STAGES.length - 1];

// Stars and price for one thing an order asks for.
const wantStars = w => w.dish ? ORDER_STARS[recipeLevel(recipeOf(w.dish))] : ORDER_STARS.plain;
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
      Math.max(r.a.tier, r.b.tier) <= stage.plainTiers[1] + 1 && !avoid.has(`dish:${r.id}`));
    if (dishes.length) return { dish: dishes[randInt(0, dishes.length - 1)].id };
  }
  const chain = chains[randInt(0, chains.length - 1)];
  return { chain, tier: Math.min(maxTier(chain), randInt(...stage.plainTiers)) };
}

function makeOrder() {
  let wants;
  const firsts = city().firstOrders;
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
  return orderFor(wants, { id: S.orderSeq, customer: pool[randInt(0, pool.length - 1)].id });
}
// Board items that help with a want: the item itself, or a dish and its two foods.
const wantKeys = w => w.dish ? [`dish:${w.dish}`, keyOf(recipeOf(w.dish).a), keyOf(recipeOf(w.dish).b)] : [keyOf(w)];
// More customers arrive as the restaurant grows (never fewer than are already waiting).
function fillOrders() {
  const want = currentStage().customers;
  let added = false;
  while (S.orders.length < want) { S.orders.push(makeOrder()); added = true; }
  return added;
}
const wantName = w => w.dish ? recipeOf(w.dish).name : nameOf(w);
const orderName = o => o.wants.map(wantName).join(' + ');
const payFor = o => Math.round(o.reward * (1 + perks().orderBonus));
// The speed tip: full when the order is new, nothing at twice its fast time.
const tipShare = o => Math.max(0, 1 - o.age / (o.fast * 2000));
const tipFor = o => Math.round(payFor(o) * SPEED_TIP * (1 + perks().tipBonus) * tipShare(o));
const isSpeedy = o => o.age <= o.fast * 1000;
const tipClass = o => { const t = tipShare(o); return t > 0.6 ? 'fresh' : t > 0.25 ? 'waiting' : t > 0 ? 'late' : 'done'; };

// What an order card shows. A single dish shows its two foods; anything else shows each thing.
function slotsOf(o) {
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
  const left = new Map(counts);
  const st = order.wants.map(w => wantReady(w, left));
  if (order.wants.length === 1 && order.wants[0].dish) return st[0].parts;
  return st.map(x => x.ok);
}
const isReady = (o, counts) => orderStatus(o, counts).every(Boolean);

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
  if (!unlimited()) {
    if (S.charges >= perks().chargesMax) S.chargesAt = Date.now();
    S.charges--;
  }
  S.board[spot] = { chain: pick.chain, tier };
  S.stats.produced++;
  buzz('tap');
  discover(S.board[spot], spot);
  renderAll();
  fly(i, spot, true);
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
    S.board[to] = { chain: a.chain, tier: a.tier + 1 };
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
  for (const w of order.wants) {
    if (!w.dish) { grab(keyOf(w)); continue; }
    if (grab(`dish:${w.dish}`)) { learnRecipe(recipeOf(w.dish)); continue; }
    const r = recipeOf(w.dish);
    grab(keyOf(r.a)); grab(keyOf(r.b));
    S.stats.mixes++; // cooked straight from the ingredients
    learnRecipe(r);
  }
  const speedy = isSpeedy(order);
  const tip = tipFor(order);
  const pay = payFor(order) + tip;
  const stars = order.stars + (speedy ? ORDER_STARS.speedy : 0);
  flyAway(taken, $(`.order[data-o="${oi}"]`));
  for (const i of taken) S.board[i] = null;
  if (taken.includes(sel)) sel = -1;
  if (orderPick?.o === oi) orderPick = null;
  S.dollars += pay;
  S.stats.earned += pay;
  S.served++;
  buzz('serve');
  floatText(`+$${pay}${tip ? ' with tip' : ''}`, $('#money'));
  addStars(stars, speedy);
  S.orders[oi] = makeOrder();
  if (fillOrders()) toast('Another customer just walked in!');
  unlockProducers();
  renderAll();
  const fresh = $(`.order[data-o="${oi}"]`);
  if (fresh && !reduceMotion) fresh.animate([{ transform: 'translateY(-12px) scale(.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, delay: 150, fill: 'backwards', easing: 'cubic-bezier(.2,.8,.3,1.2)' });
  bump($('#money'));
  advanceTutorial('serve');
  checkBadges();
  save();
}

// Stars move the restaurant toward winning. Each goal reached is a new star rating.
function addStars(n, speedy) {
  S.cityStars = cityStars() + n;
  floatText(`+${n} ★${speedy ? ' speedy!' : ''}`, $('#brand'));
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
        `Customers love it. Next: ${goals[lv + 1]} stars. Orders will get a little trickier.`,
      reward: r.dollars, gems: r.gems,
    });
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
  for (const w of o.wants) if (w.dish) learnRecipe(recipeOf(w.dish));
  addStars(o.stars, false);
  orderPick = null;
  buzz('serve');
  floatText(`+$${pay}`, $('#money'));
  S.orders[oi] = makeOrder();
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
  const u = UPGRADES.find(x => x.id === id);
  if (!u || S.upgrades.includes(u.id) || S.dollars < upgradeCost(u)) return;
  S.dollars -= upgradeCost(u);
  S.upgrades.push(u.id);
  buzz('serve');
  // Stay on the restaurant, with the new part outlined in purple.
  restFocus = u.id;
  renderRestaurant();
  celebrate({ art: restaurantPhoto(u.id), wide: true, title: 'Restaurant upgrade!', name: u.name,
    line: u.choice ? `${u.perk} Pick a colour below.` : u.perk });
  renderHeader();
  render();
  save();
}

// The restaurant picture: the original building starts black and white and fills with
// colour as she upgrades; "focus" outlines one upgrade in purple (a preview if not bought yet).
const choiceColour = key => CHOICES[key].find(c => c.colour === S.choices?.[key])?.colour ||
  (key === 'awning' ? city().look.awning : CHOICES[key][0].colour);
function restaurantPhoto(focus = null) {
  const has = new Set(S.upgrades);
  if (focus) has.add(focus);
  return restaurantSvg(has, {
    paint: choiceColour('paint'), awning: choiceColour('awning'),
    sign: city().sign, baseWall: city().look.wall, flair: city().look.flair,
    colour: .25 + .75 * S.upgrades.length / UPGRADES.length, focus, decor: S.decor,
  });
}

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
  const wanted = new Set(S.orders.flatMap(o => o.wants.flatMap(wantKeys)));
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
  if (step && step.on === event) S.tutorial++;
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
  $('#brand-next').textContent = lv >= goals.length ? `${cityStars()} stars. You won ${CITY.name}!` : `${cityStars()} of ${goal} stars`;
  $('#brand-fill').style.width = `${lv >= goals.length ? 100 : Math.min(100, Math.round((cityStars() - prev) / (goal - prev) * 100))}%`;
  $('#brand-dot').hidden = !can;
  $('#nav-restaurant .dot').hidden = !can;
}

function renderOrders() {
  const counts = boardCounts();
  $('#orders').style.gridTemplateColumns = `repeat(${S.orders.length}, minmax(0, 1fr))`;
  $('#orders').innerHTML = S.orders.map((o, oi) => {
    const have = orderStatus(o, counts);
    const ready = have.every(Boolean);
    const cust = CUSTOMERS.find(c => c.id === o.customer);
    const slots = slotsOf(o);
    const need = slots.map((it, k) => {
      const picked = orderPick && orderPick.o === oi && orderPick.k === k;
      return `<button class="need-item fam-${familyOf(it)}${have[k] ? ' have' : ''}${picked ? ' picked' : ''}" data-o="${oi}" data-k="${k}" aria-label="${nameOf(it)}">` +
        `${use(artId(it))}${have[k] ? `<span class="tick">${ICONS.check}</span>` : ''}</button>`;
    }).join('');
    return `<div class="order${ready ? ' ready' : ''}" data-o="${oi}">
      <div class="cust">${use(`cust-${o.customer}`, cust.name)}</div>
      <div class="reward"><span class="pay">${ICONS.coin}<b class="pay-n">${payFor(o) + tipFor(o)}</b></span><span class="stars">★${o.stars}</span></div>
      <div class="need${slots.length > 2 ? ' many' : ''}">${need}</div>
      ${ready ? `<button class="serve" data-serve="${oi}">Serve</button>` : `<div class="cust-name">${orderName(o)}</div>`}
      <div class="tipbar ${tipClass(o)}" title="Pay drops as the customer waits"><i style="width:${Math.round(tipShare(o) * 100)}%"></i></div>
    </div>`;
  }).join('');
}

function render() {
  const wanted = new Set();
  const counts = boardCounts();
  for (const o of S.orders) for (const w of o.wants) for (const k of wantKeys(w)) wanted.add(k);
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
  const o = orderPick ? S.orders[orderPick.o] : null;
  bar.hidden = !o;
  if (!o) { bar.innerHTML = ''; return; }
  bar.innerHTML = `<span class="abilities-title">Gem abilities</span>` +
    gemButton('serve', orderPick.o, 'Serve now', skipCost(o)) +
    gemButton('swap', orderPick.o, 'Swap', GEMS.swap) +
    (tipShare(o) < 1 ? gemButton('tip', orderPick.o, 'Fresh tip', GEMS.freshTip) : '');
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
  toastTimer = setTimeout(() => { el.hidden = true; }, opts.action ? 4500 : 1800);
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
  if (it?.producer) { sel = i; produce(i); return; }
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
  else if (t.id === 'nav-today' || t.id === 'gems') arcade.open();
  else if (t.dataset.upg !== undefined) buyUpgrade(t.dataset.upg);
  else if (t.id === 'hint-btn') hint(true);
  else if (t.id === 'charges') openRefill();
  else if (t.id === 'brand') openMap();
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
let restFocus = null;
function renderRestaurant() {
  $('#rest-title').textContent = `${city().restaurant}, ${city().name}`;
  $('#rest-art').innerHTML = restaurantPhoto(restFocus);
  const fu = UPGRADES.find(u => u.id === restFocus);
  $('#rest-caption').textContent = !fu ? 'Tap an upgrade to see where it goes.'
    : S.upgrades.includes(fu.id) ? `${fu.name}, outlined in purple.` : `Preview: ${fu.name}, outlined in purple.`;
  $('#rest-count').textContent = `${S.upgrades.length} of ${UPGRADES.length} upgrades`;
  $('#rest-list').innerHTML = UPGRADES.map(u => {
    const done = S.upgrades.includes(u.id), can = !done && S.dollars >= upgradeCost(u);
    const right = done ? `<span class="upg-done">${ICONS.check}</span>`
      : `<button class="btn primary upg-buy" data-upg="${u.id}"${can ? '' : ' disabled'}>$${upgradeCost(u).toLocaleString()}</button>`;
    const short = !done && !can ? `<em>$${(upgradeCost(u) - S.dollars).toLocaleString()} more to go</em>` : '';
    const swatches = done && u.choice ? `<div class="swatches">${CHOICES[u.choice].map(c =>
      `<button class="swatch${choiceColour(u.choice) === c.colour ? ' on' : ''}" data-choice="${u.choice}" data-colour="${c.colour}" style="background:${c.colour}" aria-label="${c.name}"></button>`).join('')}</div>` : '';
    return `<li class="upg${done ? ' done' : can ? ' next' : ''}${restFocus === u.id ? ' focused' : ''}" data-focus="${u.id}">` +
      `<div class="upg-text"><b>${u.name}</b><span>${u.perk}</span>${short}${swatches}</div>${right}</li>`;
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
    restFocus = sw.dataset.choice;
    buzz('tap');
    renderRestaurant();
    save();
    return;
  }
  if (e.target.closest('button')) return;
  const li = e.target.closest('li[data-focus]');
  if (!li) return;
  restFocus = restFocus === li.dataset.focus ? null : li.dataset.focus;
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
          `<span>${known ? `${nameOf(r.a)} + ${nameOf(r.b)}` : open ? 'Mix two different foods to find it.' : `Cook in ${c.name} to find it.`}</span></div></li>`;
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
  $('#bk-text').value = '';
  openSheet('#settings');
}
$('#set-vibrate').addEventListener('change', e => {
  S.settings.vibrate = e.target.checked;
  if (S.settings.vibrate) buzz('merge');
  save();
});
$('#set-nudge').addEventListener('change', e => { S.settings.nudge = e.target.checked; save(); });
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
    placeFoods, placeWild, freeCells, artPool, checkBadges,
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
  unlockProducers();
  fillOrders();
  // An older save that already reached 2 stars in Toronto opens Mexico City now.
  if (S.starLevel >= city().opensNextAt) openNextCity();
  checkBadges();
  renderAll();

  setInterval(() => {
    if (document.visibilityState === 'visible' && $('#game').hidden) {
      // Customers wait: the bar drops and the amount they'll pay counts down toward the normal price.
      S.orders.forEach((o, oi) => {
        const before = payFor(o) + tipFor(o);
        o.age += 1000;
        const card = $(`.order[data-o="${oi}"]`);
        if (!card) return;
        const bar = card.querySelector('.tipbar');
        bar.className = `tipbar ${tipClass(o)}`;
        bar.querySelector('i').style.width = `${Math.round(tipShare(o) * 100)}%`;
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
