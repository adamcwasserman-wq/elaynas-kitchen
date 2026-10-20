// Cooking shifts: a Cooking Fever style kitchen inside the restaurant.
// Customers line up at the counter with one or two things they want. She taps dough in the pantry
// to bake it, taps the oven to put baked food on a plate, taps toppings onto plates, pours coffee,
// and taps a finished food to hand it to the first customer who wants it.
// Tuning lives in data/kitchen.js; the drawings in js/kitchenArt.js.

import { FOODS, PANTRY, SHIFTS, SHIFT_RULES, APPLIANCES, KITCHEN_CITIES } from '../data/kitchen.js';
import * as A from './kitchenArt.js';

const $ = sel => document.querySelector(sel);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = list => list[Math.floor(Math.random() * list.length)];
const BOTTOM = 388;                       // where the appliances stand
const CENTRE = { pantry: 64, oven: 190, coffee: 300 };
const PREP_X = 10, PREP_Y = 430;
const BIN = [314, 430];
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const article = f => (/^[aeiou]/i.test(FOODS[f].name) ? 'an' : 'a');

export function createKitchen(api) {
  // api: getS, save, buzz, mood, earn(dollars), gems(n), cityId, cityName, renderAll
  const S = () => api.getS();
  let run = null;        // the shift being played (not saved: leaving ends it)
  let card = null;       // 'home' | 'intro' | 'result' while a card covers the kitchen
  let chosen = 0;        // the shift picked on the home card
  let last = 0, loop = 0;

  // ---------- saved progress, per restaurant ----------
  function data() {
    const s = S();
    s.kitchen ??= {};
    const k = (s.kitchen[api.cityId()] ??= { best: [], appl: {}, introSeen: [] });
    k.introSeen ??= [];
    for (const a of APPLIANCES) k.appl[a.id] ??= 1;
    return k;
  }
  const level = id => data().appl[id];
  const spec = id => APPLIANCES.find(a => a.id === id).levels[level(id) - 1];
  const shiftOpen = i => i === 0 || (data().best[i - 1] || 0) >= SHIFT_RULES.openNext;
  const firstUnbeaten = () => { let i = 0; while (i < SHIFTS.length - 1 && shiftOpen(i + 1) && (data().best[i] || 0) > 0) i++; return i; };
  const hasKitchen = () => KITCHEN_CITIES.includes(api.cityId());

  // ---------- opening and closing ----------
  function open() {
    if (!hasKitchen()) return;
    data();
    chosen = firstUnbeaten();
    run = null;
    $('#kitchen').hidden = false;
    showHome();
    last = performance.now();
    clearInterval(loop);
    loop = setInterval(tick, 100);
  }
  function close() {
    clearInterval(loop);
    run = null; card = null;
    $('#kitchen').hidden = true;
    $('#k-stage').innerHTML = '';
    api.save();
    api.renderAll();
  }
  $('#k-leave').addEventListener('click', () => {
    if (run && !run.over) { run = null; showHome(); } else close();
  });

  // ---------- a shift ----------
  function start(i) {
    const sh = SHIFTS[i], m = api.mood();
    chosen = i;
    run = {
      i, sh, m, t: 0,
      oven: Array(spec('oven').slots).fill(null),
      cups: Array(spec('coffee').cups).fill(null),
      plates: Array(spec('prep').plates).fill(null),
      cust: Array(Math.min(SHIFT_RULES.customersMax, m.customersMax || 9)).fill(null),
      coming: sh.customers, spawnIn: .6, served: 0, lost: 0, earned: 0,
      hearts: Math.max(1, SHIFT_RULES.hearts + (m.hearts || 0)),
      toss: false, say: null, sayUntil: 0, over: false,
    };
    if (sh.intro && !data().introSeen.includes(i)) { showIntro(sh.intro); return; }
    card = null;
    hideCard();
    render();
  }
  const gap = () => run.sh.gap * (run.m.patience > 1 ? 1.25 : run.m.patience < 1 ? .85 : 1);
  const noBurn = () => !!spec('oven').noBurn || run.m.complaints === false;
  const keepWarm = () => SHIFT_RULES.keepWarm * Math.max(1, run.m.patience);

  function newCustomer() {
    const { sh, m } = run;
    const max = Math.max(1, Math.min(sh.wantsMax, m.wantsMax ?? 9));
    const min = Math.min(max, m.wantsMin ?? 1);
    const n = min + Math.floor(Math.random() * (max - min + 1));
    const wants = Array.from({ length: n }, () => pick(sh.menu));
    if (run.coming === sh.customers && sh.intro) wants[0] = sh.intro.food; // the first customer asks for the new food
    const here = run.cust.filter(Boolean).map(c => c.kind);
    const kind = pick(A.CUSTOMER_KINDS.filter(k => !here.includes(k)));
    return { kind, wants: wants.map(f => ({ f, got: false })), wait: 0, patience: (sh.patience + SHIFT_RULES.itemPatience * (n - 1)) * m.patience, leaving: 0, sad: false };
  }

  function tick() {
    const now = performance.now(), dt = Math.min(.25, (now - last) / 1000);
    last = now;
    if (!run || run.over || card || document.visibilityState !== 'visible') return;
    run.t += dt;
    let changed = false;
    for (const x of run.oven) {
      if (!x) continue;
      x.t += dt;
      if (x.state === 'bake' && x.t >= x.need) { x.state = 'done'; x.t = 0; changed = true; api.buzz('tap'); }
      else if (x.state === 'done' && !noBurn() && x.t >= keepWarm()) { x.state = 'burnt'; changed = true; api.buzz('nope'); say(`Oh no, the ${FOODS[x.food].name.toLowerCase()} burnt! Tap the oven to toss it.`); }
    }
    const c = spec('coffee');
    run.cups.forEach((x, i) => {
      if (!x) { if (c.auto && run.sh.menu.includes('coffee')) { run.cups[i] = { state: 'pour', t: 0, need: c.pour }; changed = true; } return; }
      x.t += dt;
      if (x.state === 'pour' && x.t >= x.need) { x.state = 'done'; changed = true; }
    });
    // The glass fridge spreads cream cheese by itself on a bagel someone wants it on.
    if (spec('pantry').autoTop) {
      const need = run.cust.reduce((t, cu) => t + (cu && !cu.leaving ? cu.wants.filter(w => !w.got && w.f === 'creamBagel').length : 0), 0);
      const j = run.plates.indexOf('bagel');
      if (j >= 0 && need > run.plates.filter(p => p === 'creamBagel').length) { run.plates[j] = 'creamBagel'; changed = true; }
    }
    run.cust.forEach((cu, i) => {
      if (!cu) return;
      if (cu.leaving) { cu.leaving -= dt; if (cu.leaving <= 0) { run.cust[i] = null; changed = true; } return; }
      cu.wait += dt;
      if (run.m.complaints !== false && cu.wait >= cu.patience) {
        cu.sad = true; cu.leaving = 1; run.lost++; run.hearts--; changed = true;
        api.buzz('nope');
        say('A customer got tired of waiting.');
      }
    });
    if (run.hearts <= 0) { endShift(); return; }
    if (run.coming > 0) {
      run.spawnIn -= dt;
      const free = run.cust.indexOf(null);
      if (run.cust.every(x => !x)) run.spawnIn = Math.min(run.spawnIn, .6);
      if (run.spawnIn <= 0 && free >= 0) { run.cust[free] = newCustomer(); run.coming--; run.spawnIn = gap(); changed = true; }
    } else if (run.cust.every(x => !x)) { endShift(); return; }
    if (changed) render(); else live();
  }

  // ---------- taps ----------
  $('#k-stage').addEventListener('pointerdown', e => {
    const t = e.target.closest('[data-tap]');
    if (!t || !run || run.over || card) return;
    e.preventDefault();
    tap(t.dataset.tap);
  });

  function say(text, secs = 2.6) { if (!run) return; run.say = text; run.sayUntil = run.t + secs; }
  function nope(text) { api.buzz('nope'); say(text); render(); }

  function tap(what) {
    const [kind, arg] = what.split(':');
    if (run.toss) {
      run.toss = false;
      if (kind === 'plate' && run.plates[arg]) { run.plates[arg] = null; say('Tossed in the bin.'); }
      else if (kind === 'cup' && run.cups[arg]) { run.cups[arg] = null; say('Tossed in the bin.'); }
      else if (kind === 'oven') { const j = run.oven.findIndex(x => x && x.state !== 'bake'); if (j >= 0) { run.oven[j] = null; say('Tossed in the bin.'); } }
      else say(null, 0);
      api.buzz('tap');
      render();
      return;
    }
    if (kind === 'bin') { run.toss = true; api.buzz('tap'); say('Now tap a plate, a cup or the oven to toss it.', 5); render(); return; }
    if (kind === 'pantry') grab(arg);
    else if (kind === 'oven') fromOven();
    else if (kind === 'plate') servePlate(+arg);
    else if (kind === 'coffee') coffeeTap();
    else if (kind === 'cup') serveCup(+arg);
  }

  function grab(id) {
    if (id === 'creamCheese') {
      const j = run.plates.indexOf('bagel');
      if (j < 0) { nope('Put a baked bagel on a plate first, then add cream cheese.'); return; }
      run.plates[j] = 'creamBagel';
      api.buzz('tap');
      render();
      return;
    }
    const f = Object.keys(FOODS).find(k => FOODS[k].dough === id);
    let n = 0;
    for (let j = 0; j < run.oven.length && n < spec('pantry').grab; j++) {
      if (run.oven[j]) continue;
      run.oven[j] = { food: f, state: 'bake', t: 0, need: FOODS[f].bake * spec('oven').speed };
      n++;
    }
    if (!n) { nope('The oven is full. Take something out first.'); return; }
    api.buzz('tap');
    render();
  }

  function fromOven() {
    const burnt = run.oven.findIndex(x => x?.state === 'burnt');
    if (burnt >= 0) { run.oven[burnt] = null; api.buzz('tap'); say('Into the bin with that one.'); render(); return; }
    // The food that has been waiting longest comes out first.
    let j = -1;
    run.oven.forEach((x, k) => { if (x?.state === 'done' && (j < 0 || x.t > run.oven[j].t)) j = k; });
    if (j < 0) { if (run.oven.some(Boolean)) say('Still baking. Wait for it to turn golden.'); else say('Tap some dough in the pantry to start baking.'); render(); return; }
    const p = run.plates.indexOf(null);
    if (p < 0) { nope('No free plate. Serve one, or toss it in the green bin.'); return; }
    run.plates[p] = run.oven[j].food;
    run.oven[j] = null;
    api.buzz('tap');
    render();
  }

  function servePlate(i) {
    const f = run.plates[i];
    if (!f) { say('Empty plate. Tap the oven to put food on it.'); render(); return; }
    if (deliver(f, plateSpot(i))) run.plates[i] = null;
    render();
  }

  function coffeeTap() {
    const ready = run.cups.findIndex(x => x?.state === 'done');
    if (ready >= 0 && wanted('coffee')) { serveCup(ready); return; }
    const free = run.cups.indexOf(null);
    if (free < 0) { if (ready >= 0) nope('Nobody wants coffee right now.'); else say('Pouring...'); render(); return; }
    run.cups[free] = { state: 'pour', t: 0, need: spec('coffee').pour };
    api.buzz('tap');
    render();
  }

  function serveCup(i) {
    const c = run.cups[i];
    if (!c) { coffeeTap(); return; }
    if (c.state !== 'done') { say('Still pouring...'); render(); return; }
    if (deliver('coffee', cupSpot(i))) run.cups[i] = null;
    render();
  }

  // Who would take this food? The first customer (from the left) still waiting for one.
  const wanted = f => run.cust.findIndex(cu => cu && !cu.leaving && cu.wants.some(w => !w.got && w.f === f));
  function deliver(f, from) {
    const i = wanted(f);
    if (i < 0) {
      const plain = f === 'bagel' && run.cust.some(cu => cu && !cu.leaving && cu.wants.some(w => !w.got && w.f === 'creamBagel'));
      nope(plain ? 'That customer wants cream cheese on it. Tap the cream cheese first.' : `Nobody wants ${article(f)} ${FOODS[f].name.toLowerCase()} right now.`);
      return false;
    }
    const cu = run.cust[i];
    cu.wants.find(w => !w.got && w.f === f).got = true;
    api.buzz('tap');
    if (cu.wants.every(w => w.got)) pay(cu, i);
    return true;
  }
  function pay(cu, i) {
    const price = cu.wants.reduce((t, w) => t + FOODS[w.f].price, 0);
    const quick = 1 - cu.wait / cu.patience > .5 || run.m.complaints === false && cu.wait < cu.patience / 2;
    const tip = quick ? Math.round(price * SHIFT_RULES.speedTip) : 0;
    const total = Math.round((price + tip) * (1 + (run.m.pay || 0)));
    run.earned += total;
    run.served++;
    cu.leaving = .8;
    api.earn(total);
    api.buzz('serve');
    floatText(`+$${total}${tip ? ' tip!' : ''}`, custX(i), 60);
  }

  function endShift() {
    run.over = true;
    const k = data(), total = run.sh.customers, share = run.served / total;
    const [one, two] = SHIFT_RULES.stars;
    const got = run.hearts <= 0 ? 0 : share >= 1 && run.lost === 0 ? 3 : share >= two ? 2 : share >= one ? 1 : 0;
    const before = k.best[run.i] || 0;
    let gems = 0;
    if (got >= 1 && before < 1) gems += 1;
    if (got >= 3 && before < 3) gems += 2;
    k.best[run.i] = Math.max(before, got);
    if (gems) api.gems(gems);
    api.save();
    showResult(got, gems);
  }

  // ---------- where things are on screen ----------
  const custX = i => (run.cust.length === 2 ? [100, 244] : [62, 172, 282])[i];
  const plateSpot = i => { const p = A.prep(level('prep')).plates[i]; return [PREP_X + p[0], PREP_Y + p[1]]; };
  const cupSpot = i => { const c = A.coffee(level('coffee')); return [CENTRE.coffee - c.W / 2 + c.cups[i][0], BOTTOM + c.cups[i][1]]; };
  const pantryItems = () => PANTRY.filter(p => (run?.sh || SHIFTS[chosen]).menu.includes(p.for)).map(p => p.id);

  // What Tomato says, and which station glows: early shifts and new foods get step-by-step help.
  function guide() {
    if (!run) return { text: 'Pick a shift and tap Start!' };
    if (run.say && run.t < run.sayUntil) return { text: run.say };
    if (run.toss) return { text: 'Now tap a plate, a cup or the oven to toss it.', target: null };
    const warm = run.oven.find(x => x?.state === 'done' && !noBurn() && x.t > keepWarm() - 3);
    if (warm) return { text: `Quick! Take the ${FOODS[warm.food].name.toLowerCase()} out before it burns!`, target: 'oven' };
    if (run.oven.some(x => x?.state === 'burnt')) return { text: 'Something burnt. Tap the oven to toss it.', target: 'oven' };
    const helping = run.i < 2 || run.sh.intro;
    const cu = run.cust.find(c => c && !c.leaving);
    if (!cu) return { text: run.coming ? 'Here comes a customer!' : 'Nice work!' };
    const want = cu.wants.find(w => !w.got)?.f;
    if (!helping || !want || (run.i >= 2 && want !== run.sh.intro?.food)) return { text: run.served ? `${run.served} served. Keep going!` : 'You can do it!' };
    const plateWith = f => run.plates.indexOf(f);
    if (want === 'coffee') {
      const c = run.cups.findIndex(x => x?.state === 'done');
      if (c >= 0) return { text: 'Tap the full cup to serve it.', target: `cup:${c}` };
      if (run.cups.some(Boolean)) return { text: 'Pouring the coffee...' };
      return { text: 'Tap the coffee machine to pour a cup.', target: 'coffee' };
    }
    if (plateWith(want) >= 0) return { text: `Tap the ${FOODS[want].name.toLowerCase()} to serve it.`, target: `plate:${plateWith(want)}` };
    const base = want === 'creamBagel' ? 'bagel' : want;
    if (want === 'creamBagel' && plateWith('bagel') >= 0) return { text: 'Tap the cream cheese to spread it on the bagel.', target: 'pantry:creamCheese' };
    if (run.oven.some(x => x?.food === base && x.state === 'done')) return { text: `Golden! Tap the oven to put the ${FOODS[base].name.toLowerCase()} on a plate.`, target: 'oven' };
    if (run.oven.some(x => x?.food === base)) return { text: 'Baking... watch the timer.' };
    return { text: `Tap the ${FOODS[base].name.toLowerCase()} dough to bake it.`, target: `pantry:${FOODS[base].dough}` };
  }

  // ---------- drawing ----------
  function bubble(x, y, wants, share, id) {
    const w = 16 + wants.length * 30, h = 36, left = x - w / 2;
    let s = A.rect(left, y - h - 7, w, h, 12, A.CREAM, { stroke: '#e8dccb', 'stroke-width': 1.5 }) + A.path(`M${x - 6},${y - 8} L${x},${y} L${x + 6},${y - 8} Z`, A.CREAM);
    wants.forEach((wt, i) => {
      const fx = left + 23 + i * 30, fy = y - h / 2 - 6;
      s += `<g opacity="${wt.got ? .35 : 1}">${A.food(wt.f, fx, fy, .95)}</g>`;
      if (wt.got) s += A.circ(fx + 8, fy + 7, 7, '#3f9b3c') + A.line(`M${fx + 4.5},${fy + 7} L${fx + 7},${fy + 9.5} L${fx + 11.5},${fy + 4.5}`, '#fff', 2);
    });
    s += A.rect(left + 4, y + 4, w - 8, 6, 3, '#00000018') + A.rect(left + 4, y + 4, Math.max(0, (w - 8) * share), 6, 3, barColour(share), { id, 'data-w': w - 8 });
    return s;
  }
  const barColour = share => (share > .5 ? '#3f9b3c' : share > .25 ? '#f6b62e' : '#e2412f');
  const tapZone = (x, y, w, h, what) => A.rect(x, y, w, h, 10, '#000', { 'fill-opacity': 0, 'pointer-events': 'all', 'data-tap': what });
  const glow = (x, y, r) => A.circ(x, y, r, 'none', { stroke: A.GOLD, 'stroke-width': 4, 'stroke-dasharray': '6 6', class: 'kglow' });

  function ovenRing(x) {
    if (x.state === 'bake') return [x.t / x.need, A.GOLD];
    if (x.state === 'burnt') return [1, '#3a2a2a'];
    if (noBurn()) return [1, '#3f9b3c'];
    const left = 1 - x.t / keepWarm();
    return [left, left > .4 ? '#3f9b3c' : '#e2412f'];
  }

  function scene() {
    const items = pantryItems();
    const o = A.oven(level('oven')), cf = A.coffee(level('coffee')), pa = A.pantry(level('pantry'), items), pr = A.prep(level('prep'));
    const ox = CENTRE.oven - o.W / 2, cx = CENTRE.coffee - cf.W / 2, px = CENTRE.pantry - pa.W / 2;
    const gd = guide();
    let s = A.roomBack();
    // Customers wait behind the counter.
    if (run) run.cust.forEach((cu, i) => {
      if (!cu) return;
      const x = custX(i);
      if (!cu.leaving) {
        const share = run.m.complaints === false ? Math.max(.6, 1 - cu.wait / cu.patience) : 1 - cu.wait / cu.patience;
        s += bubble(x, 76, cu.wants, share, `kb-${i}`);
      } else if (cu.sad) s += A.text(x, 60, '...', 22, '#7a5f52', { 'text-anchor': 'middle', 'font-family': 'Righteous' });
      else s += A.g(`translate(${x} 56)`, A.path(A.heartPath, '#e2412f'));
      s += A.friend(cu.kind, x, cu.leaving ? 132 : 124, 1.05, '', cu.leaving ? '' : `bob${i ? ' b' : ''}`, cu.sad);
    });
    s += A.roomFront();
    // The pantry.
    let p = pa.art;
    for (const sp of pa.spots) {
      p += A.circ(sp.x, sp.y, 19, A.CREAM, { stroke: '#e8dccb', 'stroke-width': 1.5 }) + A.food(sp.id, sp.x, sp.y, 1.15) + tapZone(sp.x - 22, sp.y - 24, 44, 46, `pantry:${sp.id}`);
    }
    s += A.g(`translate(${px} ${BOTTOM})`, p);
    // The oven and what's inside.
    let ov = o.art;
    if (run) run.oven.forEach((x, i) => {
      if (!x) return;
      const [sx, sy] = o.slots[i], [rx, ry] = o.rings[i];
      const art = x.state === 'bake' ? `${x.food}Dough` : x.state === 'burnt' ? `${x.food}Burnt` : x.food;
      ov += A.food(art, sx, sy, o.scale);
      const [share, col] = ovenRing(x);
      ov += A.ring(rx, ry, share, col, `kro-${i}`);
    });
    ov += tapZone(-4, -o.H - 26, o.W + 8, o.H + 26, 'oven');
    s += A.g(`translate(${ox} ${BOTTOM})`, ov);
    // The coffee machine and its cups.
    let co = cf.art;
    const coffeeOn = (run?.sh || SHIFTS[chosen]).menu.includes('coffee');
    co += tapZone(-4, -cf.H - 8, cf.W + 8, cf.H + 8, 'coffee');
    if (run && coffeeOn) run.cups.forEach((x, i) => {
      const [ux, uy] = cf.cups[i];
      if (!x) return;
      if (x.state === 'pour') co += A.line(`M${ux - 2},${cf.spoutY} L${ux - 2},${uy - 4}`, '#6b3a1e', 3) + A.food('cupEmpty', ux, uy, cf.scale) + A.ring(ux + 14, uy - 26, x.t / x.need, A.GOLD, `krc-${i}`, 7);
      else co += A.food('coffee', ux, uy, cf.scale) + tapZone(ux - 16, uy - 18, 32, 34, `cup:${i}`);
    });
    if (!coffeeOn) co += A.rect(0, -cf.H, cf.W, cf.H, 10, '#fdebd0', { opacity: .55 });
    s += A.g(`translate(${cx} ${BOTTOM})`, co);
    // The prep board and plates.
    let pp = pr.art;
    pr.plates.forEach(([x, y], i) => {
      pp += A.plate(x, y, run?.plates[i] || null, pr.scale) + tapZone(x - 20, y - 20, 40, 34, `plate:${i}`);
    });
    s += A.g(`translate(${PREP_X} ${PREP_Y})`, pp);
    // The green bin.
    s += A.g(`translate(${BIN[0]} ${BIN[1]})`, A.bin(run?.toss) + tapZone(-20, -38, 40, 42, 'bin'));
    // Glow on the station Tomato is pointing at.
    if (gd.target) {
      const [kind, arg] = gd.target.split(':');
      if (kind === 'oven') s += glow(CENTRE.oven, BOTTOM - o.H / 2, Math.max(o.W, o.H) / 2 + 6);
      else if (kind === 'coffee') s += glow(CENTRE.coffee, BOTTOM - cf.H / 2, cf.H / 2 + 6);
      else if (kind === 'cup') { const [x, y] = cupSpot(+arg); s += glow(x, y, 18); }
      else if (kind === 'plate') { const [x, y] = plateSpot(+arg); s += glow(x, y + 2, 22); }
      else if (kind === 'pantry') { const sp = pa.spots.find(q => q.id === arg); if (sp) s += glow(px + sp.x, BOTTOM + sp.y, 24); }
    }
    // Tomato, the head chef, says what to do next.
    s += A.friend('tomato', 46, 604, 1.2, A.chefHat(), 'bob');
    s += A.rect(84, 572, 250, 64, 16, A.CREAM, { stroke: '#e8dccb', 'stroke-width': 1.5 }) + A.path('M86,596 L74,604 L86,608 Z', A.CREAM);
    s += `<foreignObject x="94" y="576" width="232" height="56"><div xmlns="http://www.w3.org/1999/xhtml" class="k-say" id="k-say">${gd.text}</div></foreignObject>`;
    if (run) {
      s += A.text(172, 664, `${'♥'.repeat(Math.max(0, run.hearts))}`, 16, '#e2412f', { 'text-anchor': 'middle', 'font-family': 'Righteous', id: 'k-hearts' });
    }
    return `<svg class="k-svg" viewBox="0 0 344 672" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Kitchen">${s}</svg>`;
  }

  function render() {
    $('#k-stage .k-scene').innerHTML = scene();
    status();
  }
  // Between redraws, only the timers and bars move.
  function live() {
    run.oven.forEach((x, i) => {
      const el = document.getElementById(`kro-${i}`);
      if (!el || !x) return;
      const [share, col] = ovenRing(x), c = +el.getAttribute('stroke-dasharray');
      el.setAttribute('stroke-dashoffset', (c * (1 - share)).toFixed(1));
      el.setAttribute('stroke', col);
    });
    run.cups.forEach((x, i) => {
      const el = document.getElementById(`krc-${i}`);
      if (!el || !x) return;
      const c = +el.getAttribute('stroke-dasharray');
      el.setAttribute('stroke-dashoffset', (c * (1 - x.t / x.need)).toFixed(1));
    });
    run.cust.forEach((cu, i) => {
      const el = document.getElementById(`kb-${i}`);
      if (!el || !cu) return;
      const share = run.m.complaints === false ? Math.max(.6, 1 - cu.wait / cu.patience) : Math.max(0, 1 - cu.wait / cu.patience);
      el.setAttribute('width', (+el.dataset.w * share).toFixed(1));
      el.setAttribute('fill', barColour(share));
    });
    const say = document.getElementById('k-say'), t = guide().text;
    if (say && say.textContent !== t) render();
  }
  function status() {
    $('#k-title').textContent = run ? `Shift ${run.i + 1}` : `${api.cityName()} kitchen`;
    $('#k-stat').textContent = run ? `${run.served} of ${run.sh.customers} served · $${run.earned}` : `$${S().dollars.toLocaleString()} in the tip jar`;
  }

  // Floating "+$12" over a customer.
  function floatText(t, sx, sy) {
    const svg = $('#k-stage svg'), stage = $('#k-stage');
    if (!svg) return;
    const r = svg.getBoundingClientRect(), st = stage.getBoundingClientRect();
    const k = Math.min(r.width / 344, r.height / 672), ox = r.left - st.left + (r.width - 344 * k) / 2, oy = r.top - st.top + (r.height - 672 * k) / 2;
    const el = document.createElement('div');
    el.className = 'k-float';
    el.textContent = t;
    el.style.left = `${ox + sx * k}px`;
    el.style.top = `${oy + sy * k}px`;
    stage.appendChild(el);
    setTimeout(() => el.remove(), reduceMotion ? 900 : 1200);
  }

  // ---------- cards: the kitchen home, a new food, and the end of a shift ----------
  function showCard(html) { const el = $('#k-card'); el.innerHTML = html; el.hidden = false; el.scrollTop = 0; }
  function hideCard() { $('#k-card').hidden = true; }

  function showHome() {
    card = 'home';
    run = null;
    render();
    const k = data(), s = S();
    const shifts = SHIFTS.map((sh, i) => {
      const openNow = shiftOpen(i), b = k.best[i] || 0;
      return `<button class="k-shift${i === chosen ? ' on' : ''}" data-shift="${i}"${openNow ? '' : ' disabled'}><b>${i + 1}</b><span>${openNow ? stars(b) : 'Locked'}</span></button>`;
    }).join('');
    const appliances = APPLIANCES.map(a => {
      const n = level(a.id), now = a.levels[n - 1], next = a.levels[n];
      const pips = `<span class="pips">${a.levels.map((_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
      const right = next ? `<button class="btn primary k-buy" data-buy="${a.id}"${s.dollars >= next.cost ? '' : ' disabled'}>Upgrade<br>$${next.cost.toLocaleString()}</button>` : `<span class="k-done">All done!</span>`;
      const note = next ? `Next: <b>${next.name}</b>. ${next.perk}` : now.perk;
      return `<li class="k-appl"><div><b>${a.name}: ${now.name} ${pips}</b><span>${note}</span></div>${right}</li>`;
    }).join('');
    const sh = SHIFTS[chosen];
    const menu = sh.menu.map(f => FOODS[f].name).join(', ');
    showCard(`<h2>Cooking shifts</h2>
      <p class="muted small">Pick a shift. Serve every customer for three stars. Tips go in this restaurant's tip jar ($${s.dollars.toLocaleString()} now).</p>
      <div class="k-shifts">${shifts}</div>
      <p class="k-menu"><b>Shift ${chosen + 1}:</b> ${sh.customers} customers. Menu: ${menu}.</p>
      <button class="btn primary k-start" data-start="${chosen}">Start shift ${chosen + 1}</button>
      <h3>Kitchen upgrades</h3>
      <ul class="list k-appls">${appliances}</ul>`);
  }

  function showIntro(intro) {
    card = 'intro';
    render();
    showCard(`<div class="k-intro"><svg viewBox="-24 -24 48 48" aria-hidden="true">${A.plate(0, 0, intro.food, 1.3)}</svg>
      <h2>${intro.title}</h2><p>${intro.line}</p>
      <button class="btn primary" data-go>Let's cook!</button></div>`);
  }

  function showResult(got, gems) {
    card = 'result';
    render();
    const i = run.i, next = i + 1 < SHIFTS.length && shiftOpen(i + 1);
    const out = run.hearts <= 0;
    const title = out ? 'Shift over' : got === 3 ? 'Perfect shift!' : got ? 'Shift done!' : 'Shift done';
    const line = out ? 'Too many customers left. Try again, maybe on a calmer mood?'
      : got ? `You served ${run.served} of ${run.sh.customers} customers.` : `You served ${run.served} of ${run.sh.customers}. Serve at least ${Math.ceil(run.sh.customers * SHIFT_RULES.stars[0])} for a star.`;
    showCard(`<div class="k-result"><p class="k-stars">${stars(got)}</p><h2>${title}</h2><p>${line}</p>
      <p class="k-earned">+$${run.earned} tips${gems ? ` · +${gems} gem${gems > 1 ? 's' : ''}` : ''}</p>
      <div class="k-btns">${next ? `<button class="btn primary" data-start="${i + 1}">Next shift</button>` : ''}
      <button class="btn${next ? '' : ' primary'}" data-start="${i}">Play again</button>
      <button class="btn ghost" data-home>Kitchen</button></div></div>`);
  }

  $('#k-card').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    api.buzz('tap');
    if (b.dataset.shift) { chosen = +b.dataset.shift; showHome(); return; }
    if (b.dataset.start !== undefined) { start(+b.dataset.start); return; }
    if (b.dataset.home !== undefined) { showHome(); return; }
    if (b.dataset.go !== undefined) { data().introSeen.push(run.i); api.save(); card = null; hideCard(); render(); return; }
    if (b.dataset.buy) {
      const a = APPLIANCES.find(x => x.id === b.dataset.buy), next = a.levels[level(a.id)];
      if (!next || S().dollars < next.cost) return;
      S().dollars -= next.cost;
      data().appl[a.id]++;
      api.buzz('serve');
      api.save();
      showHome();
    }
  });

  return { open, close, hasKitchen, isOpen: () => !$('#kitchen').hidden };
}
