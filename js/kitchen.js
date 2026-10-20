// Cooking shifts: a Cooking Fever style kitchen inside the restaurant.
// Customers line up at the counter with one or two things they want. She taps dough in the pantry
// to bake it, taps the oven to put baked food on a plate, taps toppings onto plates, pours coffee,
// and taps a finished food to hand it to the first customer who wants it.
// Tuning lives in data/kitchen.js; the drawings in js/kitchenArt.js.

import { FOODS, PANTRY, SHIFTS, SHIFT_RULES, APPLIANCES, HELPERS, HELPER_LEVELS, OLD_HELPER_JOBS, DOUGH_INTRO, KITCHEN_CITIES } from '../data/kitchen.js';
import * as A from './kitchenArt.js';

const $ = sel => document.querySelector(sel);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = list => list[Math.floor(Math.random() * list.length)];
const BOTTOM = 388;                       // where the appliances stand
const CENTRE = { pantry: 64, oven: 190, coffee: 300 };
const PREP_X = 10, PREP_Y = 430;
const BIN = [314, 430];
const DISHWASHER = [248, 452];             // the dishwasher's middle and top, in the right cupboard
const MIXER_X = 246;                      // the mixer's middle, on the counter between the prep board and the bin
const HELPER_Y = 540;                     // helpers stand on the floor, in front of the cupboards
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
    k.helpers ??= [];
    // Helper levels, bought with tips. Older saves earned levels by doing jobs, and keep them.
    if (!k.helperLv) {
      k.helperLv = {};
      for (const [id, n] of Object.entries(k.helperJobs || {})) k.helperLv[id] = OLD_HELPER_JOBS.filter(j => n >= j).length;
      delete k.helperJobs; delete k.team; delete k.bring;
    }
    for (const a of APPLIANCES) k.appl[a.id] ??= 1;
    return k;
  }
  const level = id => data().appl[id];
  const spec = id => APPLIANCES.find(a => a.id === id).levels[level(id) - 1];
  const shiftOpen = i => i === 0 || (data().best[i - 1] || 0) >= SHIFT_RULES.openNext;
  const firstUnbeaten = () => { let i = 0; while (i < SHIFTS.length - 1 && shiftOpen(i + 1) && (data().best[i] || 0) > 0) i++; return i; };
  const hasKitchen = () => KITCHEN_CITIES.includes(api.cityId());
  const hired = id => data().helpers.includes(id);
  const helperLevel = id => data().helperLv[id] || 1;
  // Every hired helper works every shift.
  const team = () => HELPERS.filter(h => hired(h.id));
  // Avocado has nothing to do once the glass fridge spreads cream cheese by itself.

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
    cancelAnimationFrame(frame);
    if (!reduceMotion) frame = requestAnimationFrame(glide);
  }
  function close() {
    clearInterval(loop);
    cancelAnimationFrame(frame);
    run = null; card = null;
    $('#kitchen').hidden = true;
    $('#k-stage .k-scene').innerHTML = '';
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
      coming: sh.rush ? Infinity : sh.customers, first: true, spawnIn: .6, served: 0, lost: 0, earned: 0,
      hearts: Math.max(1, SHIFT_RULES.hearts + (m.hearts || 0)),
      toss: false, say: null, sayUntil: 0, over: false, trash: 0,
      counter: Array(Math.min(SHIFT_RULES.customersMax, m.customersMax || 9)).fill(null), wash: { waiting: 0, load: 0, t: 0 },
      stock: Object.fromEntries(PANTRY.filter(p => FOODS[p.for].from === 'oven').map(p => [p.id, SHIFT_RULES.startDough])),
      mix: null, ready: 0, drag: null,
      team: team(), help: Object.fromEntries(team().map(h => [h.id, { wait: 1.5, trip: null, carry: null, oops: false }])),
    };
    // New things get a card the first time: the shift's own news, then the mixer.
    run.cards = [];
    if (sh.intro && !data().introSeen.includes(i)) run.cards.push([i, sh.intro]);
    if (i + 1 >= SHIFT_RULES.doughFrom && !data().introSeen.includes(DOUGH_INTRO.id)) run.cards.push([DOUGH_INTRO.id, DOUGH_INTRO]);
    if (run.cards.length) { showIntro(run.cards[0][1]); return; }
    card = null;
    hideCard();
    render();
  }
  const gap = () => run.sh.gap * (run.m.patience > 1 ? 1.25 : run.m.patience < 1 ? .85 : 1);
  const noBurn = () => !!spec('oven').noBurn || run.m.complaints === false;
  const keepWarm = () => SHIFT_RULES.keepWarm * Math.max(1, run.m.patience);
  // New rules that switch on partway through the shifts.
  const coldOn = () => run.i + 1 >= SHIFT_RULES.coldFrom && run.m.complaints !== false;
  const hot = () => SHIFT_RULES.hot * Math.max(1, run.m.patience);
  // Dirty dishes: from this shift a served plate leaves the board with the customer. When they go,
  // their dishes (and sometimes a tip) wait on the counter, and nobody new sits there until she taps
  // them. Tapped dishes go in the dishwasher and come back to the board clean.
  const dirtyOn = () => run.i + 1 >= SHIFT_RULES.dirtyFrom;
  const used = () => (dirtyOn() ? 'away' : null); // what a plate slot holds after its food is served
  const doughOn = () => run.i + 1 >= SHIFT_RULES.doughFrom;
  // Doughs on the shelf now (before the mixer shifts, there's always plenty).
  const inStock = id => (doughOn() ? run.stock[id] : Infinity);
  // The green bin holds this much waste; when it's full the shift is over. Calm moods get more room.
  const binMax = () => (run.m.complaints === false ? Infinity : Math.max(3, Math.min(7, SHIFT_RULES.binMax + (run.m.hearts || 0))));
  function trash() {
    run.trash++;
    if (run.trash >= binMax()) { run.binFull = true; api.buzz('nope'); endShift(); }
  }
  // Rush hour money goals, eased for calmer moods and raised for busier ones (they pay more).
  const goals = (sh, m) => { const k = (1 + (m.pay || 0)) * (m.customersMax ? .55 : m.patience > 1 ? .8 : 1); return sh.rush.goals.map(g => Math.round(g * k / 5) * 5); };
  const timeLeft = () => Math.max(0, run.sh.rush.secs - run.t);
  const clock = secs => { const n = Math.ceil(secs); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

  function newCustomer() {
    const { sh, m } = run;
    const max = Math.max(1, Math.min(sh.wantsMax, m.wantsMax ?? 9));
    const min = Math.min(max, m.wantsMin ?? 1);
    const n = min + Math.floor(Math.random() * (max - min + 1));
    const wants = Array.from({ length: n }, () => pick(sh.menu));
    if (run.first && sh.intro) wants[0] = sh.intro.food; // the first customer asks for the new food
    run.first = false;
    const here = run.cust.filter(Boolean).map(c => c.kind);
    const kind = pick(A.CUSTOMER_KINDS.filter(k => !here.includes(k)));
    return { kind, wants: wants.map(f => ({ f, got: false })), wait: 0, patience: (sh.patience + SHIFT_RULES.itemPatience * (n - 1)) * m.patience, leaving: 0, sad: false };
  }

  function tick() {
    const now = performance.now(), dt = Math.min(.25, (now - last) / 1000);
    last = now;
    lastTick = now;
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
      if (x.state === 'pour' && x.t >= x.need) { x.state = 'done'; x.t = 0; changed = true; }
      else if (x.state === 'done' && coldOn() && x.t >= hot()) {
        changed = true;
        // The golden espresso pours a fresh cup by itself; otherwise the cold one waits to be tossed.
        if (c.auto) run.cups[i] = { state: 'pour', t: 0, need: c.pour };
        else { x.state = 'cold'; api.buzz('nope'); say('Oh no, a coffee went cold! Tap it to toss it.'); }
      }
    });
    // The glass fridge puts dough in the oven by itself for bread a customer is waiting for.
    if (spec('pantry').auto && run.oven.includes(null)) {
      const f = mostNeeded();
      if (f && inStock(FOODS[f].dough) > 0) { bake(f); changed = true; }
    }
    // The mixer: a finished batch waits in the bowl until she drags it to a shelf. The dough machine
    // starts a batch by itself when a dough is down to its last one.
    if (doughOn()) {
      const mx = spec('mixer');
      if (run.mix) {
        run.mix.t += dt;
        if (run.mix.t >= run.mix.need) { run.ready = mx.batch; run.mix = null; changed = true; api.buzz('tap'); say('The dough is ready! Drag it onto the bagel or challah shelf.', 3.5); }
      } else if (mx.auto && !run.ready && doughIds().some(id => run.stock[id] <= 1)) { startMix(); changed = true; }
    }
    // The dishwasher washes what's waiting in one load, then the plates go back on the board.
    const w = run.wash;
    if (w.load) {
      w.t += dt;
      if (w.t >= spec('dishwasher').secs) {
        for (let n = 0, j = 0; j < run.plates.length && n < w.load; j++) if (run.plates[j] === 'away') { run.plates[j] = null; n++; }
        w.load = 0; changed = true; api.buzz('tap');
      }
    } else if (w.waiting) { w.load = w.waiting; w.waiting = 0; w.t = 0; changed = true; }
    if (helpers(dt)) changed = true;
    if (run.over) return;
    run.cust.forEach((cu, i) => {
      if (!cu) return;
      if (cu.leaving) {
        cu.leaving -= dt;
        if (cu.leaving <= 0) {
          run.cust[i] = null;
          if (cu.dishes || cu.tipLeft) run.counter[i] = { dishes: cu.dishes || 0, tip: cu.tipLeft || 0 };
          changed = true;
        }
        return;
      }
      cu.wait += dt;
      if (run.m.complaints !== false && cu.wait >= cu.patience) {
        cu.sad = true; cu.leaving = 1; run.lost++; run.hearts--; changed = true;
        api.buzz('nope');
        say('A customer got tired of waiting.');
      }
    });
    if (run.hearts <= 0) { endShift(); return; }
    if (run.sh.rush && timeLeft() <= 0) { endShift(); return; }
    if (run.coming > 0) {
      run.spawnIn -= dt;
      const free = run.cust.findIndex((x, k) => !x && !run.counter[k]);
      if (run.cust.every(x => !x)) run.spawnIn = Math.min(run.spawnIn, .6);
      else if (run.sh.rush && free >= 0) run.spawnIn = Math.min(run.spawnIn, SHIFT_RULES.rushRefill); // rush hour: the counter is always full
      if (run.spawnIn <= 0 && free >= 0) { run.cust[free] = newCustomer(); run.coming--; run.spawnIn = gap(); changed = true; }
    } else if (run.cust.every(x => !x)) { endShift(); return; }
    if (changed) render(); else live();
  }

  // ---------- helpers ----------
  // Every hired helper works the shift. When there's a job, the helper walks (and hops) from their
  // spot on the floor to the station, does the job when they get there, carries things where they
  // go, and walks back. Then they rest. Low level helpers walk slower, rest longer, and sometimes
  // fumble ("oops"); she trains them up with tips on the kitchen card.
  const stillWanted = f => run.cust.reduce((t, cu) => t + (cu && !cu.leaving ? cu.wants.filter(w => !w.got && w.f === f).length : 0), 0);
  const DWELL = .25;                  // seconds a helper pauses at each stop to do their bit
  const home = h => [h.x, HELPER_Y];
  const ovenPt = () => [CENTRE.oven, BOTTOM + 20];
  const binPt = () => [BIN[0], BIN[1] - 8];
  const atPlate = p => { const [x, y] = plateSpot(p); return [x, y + 16]; };
  const atCup = j => { const [x, y] = cupSpot(j); return [x, y + 22]; };
  const atCounter = i => [custX(i), 172];
  const washerPt = () => [DISHWASHER[0], DISHWASHER[1] + 52];
  function creamPt() {
    const pa = A.pantry(level('pantry'), pantryItems()), sp = pa.spots.find(q => q.id === 'creamCheese');
    return sp ? [CENTRE.pantry - pa.W / 2 + sp.x, BOTTOM + sp.y + 22] : [CENTRE.pantry, BOTTOM + 20];
  }
  // Each plan: the stops to walk to, what happens at each stop (return false if it can't be done
  // any more, and the helper heads home), what they carry when they set off, and what to undo if
  // the trip is cut short.
  const PLANS = {
    oven(h) {
      const burnt = run.oven.findIndex(x => x?.state === 'burnt');
      if (burnt >= 0) {
        const f = run.oven[burnt].food;
        return { pts: [home(h), ovenPt(), binPt(), home(h)], acts: {
          1: st => { if (run.oven[burnt]?.state !== 'burnt') return false; run.oven[burnt] = null; st.carry = `${f}Burnt`; return true; },
          2: st => { st.carry = null; trash(); return true; } } };
      }
      const p = run.plates.indexOf(null);
      if (p < 0) return null;
      let j = -1;
      run.oven.forEach((x, k) => { if (x?.state === 'done' && x.t >= .6 && (j < 0 || x.t > run.oven[j].t)) j = k; });
      if (j < 0) return null;
      run.plates[p] = 'held'; // saved for the food she's bringing
      return { pts: [home(h), ovenPt(), atPlate(p), home(h)],
        undo: () => { if (run.plates[p] === 'held') run.plates[p] = null; },
        acts: {
          1: st => { const x = run.oven[j]; if (x?.state !== 'done') return false; run.oven[j] = null; st.carry = x.food; return true; },
          2: st => { run.plates[p] = st.carry; st.carry = null; return true; } } };
    },
    coffee(h) {
      if (!run.sh.menu.includes('coffee')) return null;
      const cold = run.cups.findIndex(x => x?.state === 'cold');
      if (cold >= 0) return { pts: [home(h), atCup(cold), binPt(), home(h)], acts: {
        1: st => { if (run.cups[cold]?.state !== 'cold') return false; run.cups[cold] = null; st.carry = 'coffeeCold'; return true; },
        2: st => { st.carry = null; trash(); return true; } } };
      if (!run.cups.includes(null) || stillWanted('coffee') <= run.cups.filter(Boolean).length) return null;
      return { carry: 'cupEmpty', pts: [home(h), [CENTRE.coffee, BOTTOM + 20], home(h)], acts: {
        1: st => {
          const free = run.cups.indexOf(null);
          if (free < 0 || stillWanted('coffee') <= run.cups.filter(Boolean).length) return false;
          run.cups[free] = { state: 'pour', t: 0, need: spec('coffee').pour };
          st.carry = null;
          return true;
        } } };
    },
    topping(h) {
      const j = run.plates.indexOf('bagel');
      if (j < 0 || stillWanted('creamBagel') <= run.plates.filter(p => p === 'creamBagel').length) return null;
      return { pts: [home(h), creamPt(), atPlate(j), home(h)], acts: {
        1: st => { st.carry = 'creamCheese'; return true; },
        2: st => {
          const k = run.plates[j] === 'bagel' ? j : run.plates.indexOf('bagel');
          if (k < 0 || stillWanted('creamBagel') <= run.plates.filter(p => p === 'creamBagel').length) return false;
          run.plates[k] = 'creamBagel';
          st.carry = null;
          return true;
        } } };
    },
    dishes(h) {
      const i = run.counter.findIndex(Boolean);
      if (i < 0) return null;
      const withDishes = run.counter[i].dishes > 0;
      return { pts: withDishes ? [home(h), atCounter(i), washerPt(), home(h)] : [home(h), atCounter(i), home(h)], acts: {
        1: st => { const d = clearSpot(i, false); if (!d) return false; st.carry = d.dishes ? 'dirtyPlate' : null; st.dishes = d.dishes; return true; },
        2: st => { run.wash.waiting += st.dishes || 0; st.dishes = 0; st.carry = null; return true; } } };
    },
  };
  // Lay a plan out in time: walking legs (quicker for trained helpers) with a short stop at each act.
  function makeTrip(plan, speed) {
    const segs = [], at = {};
    let t = 0;
    for (let k = 1; k < plan.pts.length; k++) {
      const [a, b] = [plan.pts[k - 1], plan.pts[k]], dur = Math.max(.2, Math.hypot(b[0] - a[0], b[1] - a[1]) / speed);
      segs.push({ a, b, t0: t, t1: t + dur });
      t += dur;
      if (plan.acts[k]) { at[k] = t; segs.push({ a: b, b, t0: t, t1: t + DWELL }); t += DWELL; }
    }
    return { ...plan, segs, at, end: t, t: 0, done: {} };
  }
  // Where a helper is t seconds into a trip. Each leg is a little hop.
  function tripPos(tr, t) {
    const sg = tr.segs.find(q => t < q.t1) || tr.segs[tr.segs.length - 1];
    const u = Math.max(0, Math.min(1, (t - sg.t0) / (sg.t1 - sg.t0 || 1)));
    const e = u * u * (3 - 2 * u), len = Math.hypot(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]);
    return [sg.a[0] + (sg.b[0] - sg.a[0]) * e, sg.a[1] + (sg.b[1] - sg.a[1]) * e - Math.sin(Math.PI * u) * Math.min(26, len * .2)];
  }
  const speedOf = id => 300 + 70 * (helperLevel(id) - 1);
  // Cut a trip short from stop k: undo anything saved, and walk home.
  function headHome(h, st, k) {
    st.trip.undo?.();
    st.carry = null;
    st.trip = makeTrip({ pts: [st.trip.pts[k], home(h)], acts: {} }, speedOf(h.id));
  }
  function helpers(dt) {
    let changed = false;
    for (const h of run.team) {
      const st = run.help[h.id], how = HELPER_LEVELS[helperLevel(h.id) - 1];
      if (st.trip) {
        const tr = st.trip;
        tr.t += dt;
        for (const k of Object.keys(tr.at)) {
          if (tr.done[k] || tr.t < tr.at[k]) continue;
          tr.done[k] = true;
          changed = true;
          // The first stop is where a low level helper might fumble.
          if (+k === 1 && Math.random() > how.hit) { st.oops = true; headHome(h, st, 1); break; }
          if (!tr.acts[k](st)) { headHome(h, st, +k); break; }
        }
        if (st.trip.t >= st.trip.end) { st.trip = null; st.oops = false; st.carry = null; st.wait = how.every; changed = true; }
        continue;
      }
      st.wait -= dt;
      if (st.wait > 0) continue;
      const plan = PLANS[h.station](h);
      if (!plan) continue;
      st.trip = makeTrip(plan, speedOf(h.id));
      st.carry = plan.carry || null;
      changed = true;
    }
    return changed;
  }
  // Between game ticks, slide the helpers along so they move smoothly.
  let lastTick = 0, frame = 0;
  function glide() {
    frame = requestAnimationFrame(glide);
    if (!run || run.over || card) return;
    const extra = Math.min(.1, (performance.now() - lastTick) / 1000);
    for (const h of run.team) {
      const tr = run.help[h.id].trip, el = document.getElementById(`kh-${h.id}`);
      if (!tr || !el) continue;
      const [x, y] = tripPos(tr, tr.t + extra);
      el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    }
  }

  // ---------- taps ----------
  $('#k-stage').addEventListener('pointerdown', e => {
    const t = e.target.closest('[data-tap]');
    if (!t || !run || run.over || card) return;
    e.preventDefault();
    if (t.dataset.tap === 'mixer' && run.ready && !run.toss) { startDrag(e); return; }
    tap(t.dataset.tap);
  });

  function say(text, secs = 2.6) { if (!run) return; run.say = text; run.sayUntil = run.t + secs; }
  function nope(text) { api.buzz('nope'); say(text); render(); }

  function tap(what) {
    const [kind, arg] = what.split(':');
    if (run.toss) {
      run.toss = false;
      if (kind === 'plate' && run.plates[arg] && run.plates[arg] !== 'away' && run.plates[arg] !== 'held') {
        run.plates[arg] = used();
        if (dirtyOn()) run.wash.waiting++;
        say('Tossed in the bin.');
        trash();
      }
      else if (kind === 'cup' && run.cups[arg]) { run.cups[arg] = null; say('Tossed in the bin.'); trash(); }
      else if (kind === 'oven') { const j = run.oven.findIndex(x => x && x.state !== 'bake'); if (j >= 0) { run.oven[j] = null; say('Tossed in the bin.'); trash(); } }
      else say(null, 0);
      api.buzz('tap');
      render();
      return;
    }
    if (kind === 'bin') { run.toss = true; api.buzz('tap'); say('Now tap a plate, a cup or the oven to toss it.', 5); render(); return; }
    if (kind === 'dish') collect(+arg);
    else if (kind === 'pantry') grab(arg);
    else if (kind === 'oven') fromOven();
    else if (kind === 'plate') servePlate(+arg);
    else if (kind === 'coffee') coffeeTap();
    else if (kind === 'cup') serveCup(+arg);
    else if (kind === 'mixer') mixerTap();
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
    if (inStock(id) <= 0) { nope(`Out of ${FOODS[f].name.toLowerCase()} dough! ${run.ready ? 'Drag the dough from the mixer onto this shelf.' : 'Tap the mixer to make more.'}`); return; }
    if (!bake(f)) { nope('The oven is full. Take something out first.'); return; }
    // Full shelves and up: the same tap also starts the bread a customer is still waiting for.
    if (spec('pantry').smart) { const more = mostNeeded(); if (more && inStock(FOODS[more].dough) > 0) bake(more); }
    api.buzz('tap');
    render();
  }
  // Put one dough from the shelf in a free oven slot. False if the oven is full.
  function bake(f) {
    const j = run.oven.indexOf(null);
    if (j < 0) return false;
    run.oven[j] = { food: f, state: 'bake', t: 0, need: FOODS[f].bake * spec('oven').speed };
    if (doughOn()) run.stock[FOODS[f].dough]--;
    return true;
  }
  // The doughs on today's menu.
  const doughIds = () => PANTRY.filter(p => run.sh.menu.includes(p.for) && FOODS[p.for].from === 'oven').map(p => p.id);
  function startMix() { run.mix = { t: 0, need: spec('mixer').secs }; }
  function mixerTap() {
    if (run.mix) { say('Mixing... watch the timer.'); render(); return; }
    if (run.ready) { say('Drag the dough onto the bagel or challah shelf.'); render(); return; }
    if (doughIds().every(id => run.stock[id] >= SHIFT_RULES.doughMax)) { nope('The shelf is full of dough.'); return; }
    startMix();
    api.buzz('tap');
    render();
  }

  // ---------- dragging dough from the mixer to a shelf ----------
  // The dough is a plain lump in the mixer. As she drags it toward a shelf it takes that shelf's shape.
  function doughSpots() {
    const pa = A.pantry(level('pantry'), pantryItems()), px = CENTRE.pantry - pa.W / 2;
    return pa.spots.filter(sp => sp.id in run.stock).map(sp => ({ id: sp.id, x: px + sp.x, y: BOTTOM + sp.y }));
  }
  function nearest(p) {
    let best = null, d = Infinity;
    for (const sp of doughSpots()) { const e = Math.hypot(sp.x - p.x, sp.y - p.y); if (e < d) { d = e; best = sp; } }
    return { sp: best, d };
  }
  function dragArt() {
    const { sp, d } = nearest(run.drag), k = sp ? Math.max(0, Math.min(1, (150 - d) / 110)) : 0;
    return `<g opacity="${(1 - k).toFixed(2)}">${A.food('dough', 0, 0, 1.4)}</g>` + (sp ? `<g opacity="${k.toFixed(2)}">${A.food(sp.id, 0, 0, 1.4)}</g>` : '') +
      (run.ready > 1 ? A.badge(18, -16, run.ready) : '');
  }
  function toScene(e) {
    const svg = $('#k-stage .k-svg'), p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y - 14 }; // a little above the finger, so she can see it
  }
  function drawDrag() {
    const el = document.getElementById('k-drag');
    if (!el) { render(); return; }
    el.setAttribute('transform', `translate(${run.drag.x.toFixed(1)} ${run.drag.y.toFixed(1)})`);
    el.innerHTML = dragArt();
  }
  function startDrag(e) {
    run.drag = toScene(e);
    api.buzz('tap');
    render();
    const move = ev => { if (!run?.drag) return; run.drag = toScene(ev); drawDrag(); };
    const up = ev => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      if (!run?.drag) return;
      const { sp, d } = nearest(toScene(ev));
      run.drag = null;
      if (ev.type === 'pointerup') dropDough(sp && d < 46 ? sp.id : null);
      render();
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  }
  function dropDough(id) {
    if (!id) { say('Drag the dough right onto the bagel or challah shelf.'); return; }
    const add = Math.min(run.ready, SHIFT_RULES.doughMax - run.stock[id]);
    if (add <= 0) { api.buzz('nope'); say('That shelf is full.'); return; }
    run.stock[id] += add;
    run.ready -= add;
    api.buzz('serve');
  }
  // The oven bread customers are waiting for that isn't baking, golden or on a plate yet (the one
  // short the most), or null. A cream cheese bagel needs a bagel.
  function mostNeeded() {
    let best = null, short = 0;
    for (const f of run.sh.menu.filter(x => FOODS[x].from === 'oven')) {
      const tops = Object.keys(FOODS).filter(t => FOODS[t].on === f);
      const want = stillWanted(f) + tops.reduce((n, t) => n + stillWanted(t), 0);
      const have = run.oven.filter(x => x && x.food === f && x.state !== 'burnt').length + run.plates.filter(p => p === f || tops.includes(p)).length;
      if (want - have > short) { short = want - have; best = f; }
    }
    return best;
  }

  function fromOven() {
    const burnt = run.oven.findIndex(x => x?.state === 'burnt');
    if (burnt >= 0) { run.oven[burnt] = null; api.buzz('tap'); say('Into the bin with that one.'); trash(); render(); return; }
    // The food that has been waiting longest comes out first.
    let j = -1;
    run.oven.forEach((x, k) => { if (x?.state === 'done' && (j < 0 || x.t > run.oven[j].t)) j = k; });
    if (j < 0) { if (run.oven.some(Boolean)) say('Still baking. Wait for it to turn golden.'); else say('Tap some dough in the pantry to start baking.'); render(); return; }
    const p = run.plates.indexOf(null);
    if (p < 0) { nope(run.plates.includes('away') ? 'No clean plate. Tap the dirty dishes on the counter so they get washed.' : 'No free plate. Serve one, or toss it in the green bin.'); return; }
    run.plates[p] = run.oven[j].food;
    run.oven[j] = null;
    api.buzz('tap');
    render();
  }

  function servePlate(i) {
    const f = run.plates[i];
    if (!f) { say('Empty plate. Tap the oven to put food on it.'); render(); return; }
    if (f === 'away') { say('That plate is out with a customer. It comes back from the dishwasher.'); render(); return; }
    if (f === 'held') { say('A helper is bringing food for that plate.'); render(); return; }
    const cu = deliver(f, plateSpot(i));
    if (cu) { run.plates[i] = used(); if (dirtyOn()) cu.dishes = (cu.dishes || 0) + 1; }
    render();
  }

  function coffeeTap() {
    const ready = run.cups.findIndex(x => x?.state === 'done');
    if (ready >= 0 && wanted('coffee')) { serveCup(ready); return; }
    const free = run.cups.indexOf(null);
    if (free < 0) {
      const cold = run.cups.findIndex(x => x?.state === 'cold');
      if (cold >= 0) { serveCup(cold); return; }
      if (ready >= 0) nope('Nobody wants coffee right now.'); else say('Pouring...');
      render();
      return;
    }
    run.cups[free] = { state: 'pour', t: 0, need: spec('coffee').pour };
    api.buzz('tap');
    render();
  }

  function serveCup(i) {
    const c = run.cups[i];
    if (!c) { coffeeTap(); return; }
    if (c.state === 'cold') { run.cups[i] = null; api.buzz('tap'); say('That one went cold, so it went in the bin.'); trash(); render(); return; }
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
    return cu;
  }
  function pay(cu, i) {
    const price = cu.wants.reduce((t, w) => t + FOODS[w.f].price, 0);
    const quick = 1 - cu.wait / cu.patience > .5 || run.m.complaints === false && cu.wait < cu.patience / 2;
    const more = 1 + (run.m.pay || 0);
    const tip = quick ? Math.round(price * SHIFT_RULES.speedTip * more) : 0;
    let total = Math.round(price * more);
    // Once there are dishes, a quick-service tip is left on the counter for her to pick up.
    if (dirtyOn()) cu.tipLeft = tip; else total += tip;
    run.earned += total;
    run.served++;
    cu.leaving = .8;
    api.earn(total);
    api.buzz('serve');
    floatText(`+$${total}${tip && !dirtyOn() ? ' tip!' : ''}`, custX(i), 60);
  }
  // Tapping dishes on the counter: the tip goes in the jar, the dishes go in the dishwasher.
  function collect(i) {
    if (!clearSpot(i)) return;
    api.buzz('tap');
    render();
  }
  // Clears one counter spot (by her tap or Mushroom). Returns what was there, or null.
  function clearSpot(i, toWasher = true) {
    const d = run.counter[i];
    if (!d) return null;
    run.counter[i] = null;
    if (toWasher) run.wash.waiting += d.dishes;
    if (d.tip) { run.earned += d.tip; api.earn(d.tip); api.buzz('serve'); floatText(`+$${d.tip} tip!`, custX(i), 120); }
    return d;
  }

  function endShift() {
    if (run.over) return;
    run.over = true;
    // Tips still on the counter go in the jar.
    const left = run.counter.reduce((t, d) => t + (d?.tip || 0), 0);
    if (left) { run.earned += left; api.earn(left); }
    const k = data();
    let got;
    if (run.binFull) got = 0;
    else if (run.sh.rush) got = run.hearts <= 0 ? 0 : goals(run.sh, run.m).filter(g => run.earned >= g).length;
    else {
      const share = run.served / run.sh.customers, [one, two] = SHIFT_RULES.stars;
      got = run.hearts <= 0 ? 0 : share >= 1 && run.lost === 0 ? 3 : share >= two ? 2 : share >= one ? 1 : 0;
    }
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
    if (binMax() - run.trash === 1) {
      const w = run.oven.find(x => x?.state === 'done' && !noBurn() && x.t > keepWarm() - 3) || run.cups.find(x => x?.state === 'done' && coldOn() && x.t > hot() - 3.5);
      if (w) return { text: 'The bin is almost full! Don\'t let anything else go to waste.', target: w.food ? 'oven' : null };
    }
    const warm = run.oven.find(x => x?.state === 'done' && !noBurn() && x.t > keepWarm() - 3);
    if (warm) return { text: `Quick! Take the ${FOODS[warm.food].name.toLowerCase()} out before it burns!`, target: 'oven' };
    if (run.oven.some(x => x?.state === 'burnt')) return { text: 'Something burnt. Tap the oven to toss it.', target: 'oven' };
    const cooling = run.cups.findIndex(x => x?.state === 'done' && coldOn() && x.t > hot() - 3.5);
    if (cooling >= 0 && wanted('coffee') >= 0) return { text: 'Quick! Serve the coffee before it goes cold!', target: `cup:${cooling}` };
    const cold = run.cups.findIndex(x => x?.state === 'cold');
    if (cold >= 0) return { text: 'That coffee went cold. Tap it to toss it.', target: `cup:${cold}` };
    const dish = run.counter.findIndex(Boolean);
    if (dish >= 0 && (!run.plates.includes(null) || run.coming > 0 && !run.cust.some((x, k) => !x && !run.counter[k])))
      return { text: run.counter[dish].tip ? 'Tap the dishes on the counter to clear them, and grab the tip!' : 'Tap the dishes on the counter so a new customer can sit there.', target: `dish:${dish}` };
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
    if (inStock(FOODS[base].dough) <= 0) {
      if (run.ready) return { text: `Drag the dough from the mixer onto the ${FOODS[base].name.toLowerCase()} shelf.`, target: 'mixer' };
      return run.mix ? { text: 'Mixing more dough...' } : { text: `Out of ${FOODS[base].name.toLowerCase()} dough! Tap the mixer to make more.`, target: 'mixer' };
    }
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

  function cupRing(x) {
    if (x.state === 'pour') return [x.t / x.need, A.GOLD];
    const left = 1 - x.t / hot();
    return [left, left > .4 ? '#3f9b3c' : '#e2412f'];
  }
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
    // Dishes and tips left on the counter.
    if (run) run.counter.forEach((d, i) => {
      if (!d) return;
      const x = custX(i);
      s += A.dishes(x, 158, d.dishes, d.tip) + tapZone(x - 32, 126, 64, 50, `dish:${i}`);
    });
    // The dishwasher, built into the cupboard, once there are dishes.
    if (run ? dirtyOn() : chosen + 1 >= SHIFT_RULES.dirtyFrom) {
      const w = run?.wash || { load: 0, waiting: 0, t: 0 };
      s += A.dishwasher(level('dishwasher'), DISHWASHER[0], DISHWASHER[1], w.load + w.waiting, w.load ? w.t / spec('dishwasher').secs : null);
    }
    // The pantry.
    let p = pa.art;
    for (const sp of pa.spots) {
      const n = run && sp.id in run.stock && doughOn() ? run.stock[sp.id] : null;
      p += A.circ(sp.x, sp.y, 19, A.CREAM, { stroke: '#e8dccb', 'stroke-width': 1.5 }) + `<g opacity="${n === 0 ? .35 : 1}">${A.food(sp.id, sp.x, sp.y, 1.15)}</g>` +
        (n === null ? '' : A.badge(sp.x + 15, sp.y - 15, n)) + tapZone(sp.x - 22, sp.y - 24, 44, 46, `pantry:${sp.id}`);
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
      if (x.state === 'pour') co += A.line(`M${ux - 2},${cf.spoutY} L${ux - 2},${uy - 4}`, '#6b3a1e', 3) + A.food('cupEmpty', ux, uy, cf.scale) + A.ring(ux + 14, uy - 26, ...cupRing(x), `krc-${i}`, 7);
      else {
        co += A.food(x.state === 'cold' ? 'coffeeCold' : 'coffee', ux, uy, cf.scale);
        if (x.state === 'done' && coldOn()) co += A.ring(ux + 14, uy - 26, ...cupRing(x), `krc-${i}`, 7);
        co += tapZone(ux - 16, uy - 18, 32, 34, `cup:${i}`);
      }
    });
    if (!coffeeOn) co += A.rect(0, -cf.H, cf.W, cf.H, 10, '#fdebd0', { opacity: .55 });
    s += A.g(`translate(${cx} ${BOTTOM})`, co);
    // The prep board and plates.
    let pp = pr.art;
    pr.plates.forEach(([x, y], i) => {
      const pl = run?.plates[i] || null;
      pp += (pl === 'away' ? A.ell(x, y + 5, 15, 5, '#00000014') : A.plate(x, y, pl === 'held' ? null : pl, pr.scale)) + tapZone(x - 20, y - 20, 40, 34, `plate:${i}`);
    });
    s += A.g(`translate(${PREP_X} ${PREP_Y})`, pp);
    // The mixer, once dough can run out.
    const mixerOn = run ? doughOn() : chosen + 1 >= SHIFT_RULES.doughFrom;
    const mx = A.mixer(level('mixer'));
    if (mixerOn) {
      let m = mx.art;
      if (run?.mix) m += A.food('dough', mx.slot[0], mx.slot[1], .9) + A.ring(mx.ring[0], mx.ring[1], run.mix.t / run.mix.need, A.GOLD, 'krm', 8);
      else if (run?.ready && !run.drag) m += `<g class="bob">${A.food('dough', mx.slot[0], mx.slot[1] - 4, 1.2)}</g>` + (run.ready > 1 ? A.badge(mx.slot[0] + 16, mx.slot[1] - 18, run.ready) : '');
      m += tapZone(-4, -mx.H - 4, mx.W + 8, mx.H + 10, 'mixer');
      s += A.g(`translate(${MIXER_X - mx.W / 2} ${PREP_Y})`, m);
    }
    // The green bin, with dots for how full it is.
    const bm = run ? binMax() : Infinity;
    s += A.g(`translate(${BIN[0]} ${BIN[1]})`, A.bin(run?.toss) + (bm < Infinity ? A.binMeter(run.trash, bm) : '') + tapZone(-20, -38, 40, 42, 'bin'));
    // Glow on the station Tomato is pointing at.
    if (gd.target) {
      const [kind, arg] = gd.target.split(':');
      if (kind === 'oven') s += glow(CENTRE.oven, BOTTOM - o.H / 2, Math.max(o.W, o.H) / 2 + 6);
      else if (kind === 'coffee') s += glow(CENTRE.coffee, BOTTOM - cf.H / 2, cf.H / 2 + 6);
      else if (kind === 'cup') { const [x, y] = cupSpot(+arg); s += glow(x, y, 18); }
      else if (kind === 'plate') { const [x, y] = plateSpot(+arg); s += glow(x, y + 2, 22); }
      else if (kind === 'pantry') { const sp = pa.spots.find(q => q.id === arg); if (sp) s += glow(px + sp.x, BOTTOM + sp.y, 24); }
      else if (kind === 'mixer') s += glow(MIXER_X, PREP_Y - 18, mx.W / 2 + 6);
      else if (kind === 'dish') s += glow(custX(+arg), 154, 30);
    }
    // The helpers on this shift, each standing under the station they mind.
    for (const h of run ? run.team : team()) {
      const st = run?.help[h.id], [x, y] = st?.trip ? tripPos(st.trip, st.trip.t) : home(h);
      s += `<g id="kh-${h.id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${A.helper(h.id, 0, 0, st?.carry || null, st?.oops, !!st?.trip)}</g>`;
    }
    // Tomato, the head chef, says what to do next.
    s += A.friend('tomato', 46, 604, 1.2, A.chefHat(), 'bob');
    s += A.rect(84, 572, 250, 64, 16, A.CREAM, { stroke: '#e8dccb', 'stroke-width': 1.5 }) + A.path('M86,596 L74,604 L86,608 Z', A.CREAM);
    s += `<foreignObject x="94" y="576" width="232" height="56"><div xmlns="http://www.w3.org/1999/xhtml" class="k-say" id="k-say">${gd.text}</div></foreignObject>`;
    if (run) {
      s += A.text(172, 664, `${'♥'.repeat(Math.max(0, run.hearts))}`, 16, '#e2412f', { 'text-anchor': 'middle', 'font-family': 'Righteous', id: 'k-hearts' });
    }
    // The dough she is dragging, on top of everything.
    if (run?.drag) s += `<g id="k-drag" transform="translate(${run.drag.x.toFixed(1)} ${run.drag.y.toFixed(1)})" pointer-events="none">${dragArt()}</g>`;
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
      const [share, col] = cupRing(x), c = +el.getAttribute('stroke-dasharray');
      el.setAttribute('stroke-dashoffset', (c * (1 - share)).toFixed(1));
      el.setAttribute('stroke', col);
    });
    const wr = document.getElementById('krw');
    if (wr && run.wash.load) wr.setAttribute('stroke-dashoffset', (+wr.getAttribute('stroke-dasharray') * (1 - run.wash.t / spec('dishwasher').secs)).toFixed(1));
    const mr = document.getElementById('krm');
    if (mr && run.mix) mr.setAttribute('stroke-dashoffset', (+mr.getAttribute('stroke-dasharray') * (1 - run.mix.t / run.mix.need)).toFixed(1));
    run.cust.forEach((cu, i) => {
      const el = document.getElementById(`kb-${i}`);
      if (!el || !cu) return;
      const share = run.m.complaints === false ? Math.max(.6, 1 - cu.wait / cu.patience) : Math.max(0, 1 - cu.wait / cu.patience);
      el.setAttribute('width', (+el.dataset.w * share).toFixed(1));
      el.setAttribute('fill', barColour(share));
    });
    if (run.sh.rush) status();
    const say = document.getElementById('k-say'), t = guide().text;
    if (say && say.textContent !== t) render();
  }
  function status() {
    $('#k-title').textContent = run ? `Shift ${run.i + 1}` : `${api.cityName()} kitchen`;
    let stat = `$${S().dollars.toLocaleString()} in the tip jar`;
    if (run?.sh.rush) {
      const next = goals(run.sh, run.m).find(g => run.earned < g);
      stat = `${clock(timeLeft())} left · $${run.earned}${next ? ` of $${next}` : ''}`;
    } else if (run) stat = `${run.served} of ${run.sh.customers} served · $${run.earned}`;
    $('#k-stat').textContent = stat;
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

  const pips = (n, of) => `<span class="pips">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  function showHome() {
    card = 'home';
    run = null;
    render();
    const k = data(), s = S();
    const shifts = SHIFTS.map((sh, i) => {
      const openNow = shiftOpen(i), b = k.best[i] || 0;
      return `<button class="k-shift${i === chosen ? ' on' : ''}${sh.rush ? ' rush' : ''}" data-shift="${i}"${openNow ? '' : ' disabled'}><b>${i + 1}</b><span>${openNow ? stars(b) : 'Locked'}</span></button>`;
    }).join('');
    const appliances = APPLIANCES.map(a => {
      const n = level(a.id), now = a.levels[n - 1], next = a.levels[n];
      const right = next ? `<button class="btn primary k-buy" data-buy="${a.id}"${s.dollars >= next.cost ? '' : ' disabled'}>Upgrade<br>$${next.cost.toLocaleString()}</button>` : `<span class="k-done">All done!</span>`;
      const note = next ? `Next: <b>${next.name}</b>. ${next.perk}` : now.perk;
      return `<li class="k-appl"><div><b>${a.name}: ${now.name} ${pips(n, a.levels.length)}</b><span>${note}</span></div>${right}</li>`;
    }).join('');
    const helpers = HELPERS.map(h => {
      const art = `<svg class="k-helper" viewBox="-22 -32 44 56" aria-hidden="true">${A.helper(h.id, 0, 0)}</svg>`;
      let right, title = `<b>${h.name}</b>`, note = h.job;
      if (hired(h.id)) {
        const lv = helperLevel(h.id), next = HELPER_LEVELS[lv];
        title = `<b>${h.name} ${pips(lv, HELPER_LEVELS.length)}</b>`;
        if (!next) note = `${h.job} <b>Top level!</b>`;
        right = next ? `<button class="btn primary k-buy" data-train="${h.id}"${s.dollars >= next.cost ? '' : ' disabled'}>Train<br>$${next.cost.toLocaleString()}</button>` : `<span class="k-done">All done!</span>`;
      } else if (!shiftOpen(h.opens - 1)) right = `<span class="k-done k-later">Opens at<br>shift ${h.opens}</span>`;
      else right = `<button class="btn primary k-buy" data-hire="${h.id}"${s.dollars >= h.cost ? '' : ' disabled'}>Hire<br>$${h.cost.toLocaleString()}</button>`;
      return `<li class="k-appl">${art}<div>${title}<span>${note}</span></div>${right}</li>`;
    }).join('');
    const sh = SHIFTS[chosen];
    const menu = sh.menu.map(f => FOODS[f].name).join(', ');
    showCard(`<h2>Cooking shifts</h2>
      <p class="muted small">Pick a shift. Serve every customer for three stars. Tips go in this restaurant's tip jar ($${s.dollars.toLocaleString()} now).</p>
      <div class="k-shifts">${shifts}</div>
      <p class="k-menu"><b>Shift ${chosen + 1}:</b> ${sh.rush ? `Rush hour! ${sh.rush.secs} seconds. Earn $${goals(sh, api.mood()).join(', $')} for 1, 2, 3 stars.` : `${sh.customers} customers.`} Menu: ${menu}.${team().length ? ` Helpers: ${team().map(h => h.name).join(', ')}.` : ''}</p>
      <button class="btn primary k-start" data-start="${chosen}">Start shift ${chosen + 1}</button>
      <h3>Kitchen helpers</h3>
      <p class="muted small">Every helper you hire works every shift. Train them with tips to make them quicker and steadier.</p>
      <ul class="list k-appls">${helpers}</ul>
      <h3>Kitchen upgrades</h3>
      <ul class="list k-appls">${appliances}</ul>`);
  }

  function showIntro(intro) {
    card = 'intro';
    render();
    const art = intro.art === 'dirty' ? A.plate(0, 0, 'dirty', 1.3) : intro.art === 'dough' ? A.g('translate(-17 12) scale(.5)', A.mixer(2).art) : intro.art ? A.food(intro.art, 0, 0, 1.4) : A.plate(0, 0, intro.food, 1.3);
    showCard(`<div class="k-intro"><svg viewBox="-24 -24 48 48" aria-hidden="true">${art}</svg>
      <h2>${intro.title}</h2><p>${intro.line}</p>
      <button class="btn primary" data-go>Let's cook!</button></div>`);
  }

  function showResult(got, gems) {
    card = 'result';
    render();
    const i = run.i, next = i + 1 < SHIFTS.length && shiftOpen(i + 1);
    const out = run.hearts <= 0 || run.binFull;
    const title = out ? 'Shift over' : got === 3 ? 'Perfect shift!' : got ? 'Shift done!' : 'Shift done';
    const g = run.sh.rush ? goals(run.sh, run.m) : null;
    const line = run.binFull ? 'The bin got too full! Try not to let food burn or coffee go cold.'
      : out ? 'Too many customers left. Try again, maybe on a calmer mood?'
      : g ? (got === 3 ? `You earned $${run.earned} before the clock ran out!` : `You earned $${run.earned}. Earn $${g[got]} for ${got + 1} star${got ? 's' : ''}.`)
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
    if (b.dataset.go !== undefined) {
      data().introSeen.push(run.cards.shift()[0]);
      api.save();
      if (run.cards.length) { showIntro(run.cards[0][1]); return; }
      card = null; hideCard(); render();
      return;
    }
    if (b.dataset.hire) {
      const h = HELPERS.find(x => x.id === b.dataset.hire), k = data();
      if (!h || k.helpers.includes(h.id) || S().dollars < h.cost) return;
      S().dollars -= h.cost;
      k.helpers.push(h.id);
      api.buzz('serve');
      api.save();
      showHome();
      return;
    }
    if (b.dataset.train) {
      const k = data(), id = b.dataset.train, next = HELPER_LEVELS[helperLevel(id)];
      if (!next || S().dollars < next.cost) return;
      S().dollars -= next.cost;
      k.helperLv[id] = helperLevel(id) + 1;
      api.buzz('serve');
      api.save();
      showHome();
      return;
    }
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
