// Play statistics and the leaderboard connection.
// Only runs when data/config.js has a cloud address AND the player has said yes ("Join the leaderboard").
// What is sent: her name, her best scores, how long each play session lasted (and in which game),
// and one small note each time a round, shift or mini game ends (how long it took, and how it went).
// A failed send is never a problem: notes wait on the phone and go with the next one.

import { CONFIG } from '../data/config.js';

const KEY = 'tulip-kitchen-track';
const IDLE_MS = 30000;            // no touches for this long and the play clock stops
const NEW_SESSION_MS = 30 * 60000; // away this long and coming back counts as a new session
const FLUSH_EVERY = 45000;
const RETRY_AFTER = 120000;
const QUEUE_MAX = 300;

const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

function load() {
  try {
    const t = JSON.parse(localStorage.getItem(KEY));
    if (t && t.pid) return { consent: null, queue: [], tries: {}, ...t };
  } catch { /* first visit, or storage is blocked */ }
  return { pid: uid(), consent: null, queue: [], tries: {} };
}

export function createTrack(api) {
  // api: name(), version(), scores(), area(), playing(), roundKey()
  const T = load();
  const url = CONFIG.cloud?.url || '';
  let sess = null;           // this play session: { sid, start, active, areas }
  let sessDirty = false;
  let lastTouch = Date.now();
  let lastTick = Date.now();
  let hiddenAt = 0;
  let sending = false;
  let retryAt = 0;
  let flushTimer = 0;
  let boardCache = null, boardAt = 0;

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(T)); } catch { /* fine */ } };
  const enabled = () => !!url;
  const joined = () => enabled() && T.consent === true;

  function newSession() {
    sess = { sid: uid(), start: Date.now(), active: 0, areas: {} };
    sessDirty = false;
  }
  newSession();

  // Touching the screen keeps the play clock running.
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, () => { lastTouch = Date.now(); }, { passive: true, capture: true });

  // The play clock: counts seconds while the game is showing and she's been touching it.
  function tick() {
    const now = Date.now(), dt = Math.min(now - lastTick, 2500);
    lastTick = now;
    if (document.visibilityState !== 'visible' || now - lastTouch > IDLE_MS) return;
    const area = api.area();
    sess.active += dt / 1000;
    sess.areas[area] = (sess.areas[area] || 0) + dt / 1000;
    sessDirty = true;
    // Time spent on one round counts only while the round itself is running (no menus open).
    if (area === 'merge' && api.playing()) {
      const k = api.roundKey();
      T.tries[k] = (T.tries[k] || 0) + dt / 1000;
    }
  }

  // ---------- sending ----------
  const roundedSession = () => ({
    sid: sess.sid, start: sess.start, active: Math.round(sess.active),
    areas: Object.fromEntries(Object.entries(sess.areas).map(([k, v]) => [k, Math.round(v)])),
  });

  async function flush(final = false, force = false) {
    if (!joined() || sending || Date.now() < retryAt) return;
    const events = T.queue.slice(0, 80);
    if (!events.length && !sessDirty && !force) return;
    const body = JSON.stringify({ pid: T.pid, name: api.name(), v: api.version(), scores: api.scores(), session: sess.active >= 1 ? roundedSession() : undefined, events });
    if (final) {
      // The tab is closing: send what we can and don't wait. Anything not received is sent again next time.
      try { fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, keepalive: body.length < 60000 }).catch(() => {}); } catch { /* fine */ }
      return;
    }
    sending = true;
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body });
      const j = await r.json();
      if (!j.ok) throw new Error('rejected');
      const sent = new Set(events.map(e => e.eid));
      T.queue = T.queue.filter(e => !sent.has(e.eid));
      sessDirty = false;
      save();
    } catch {
      retryAt = Date.now() + RETRY_AFTER;
    }
    sending = false;
    if (T.queue.length && Date.now() >= retryAt) schedule(1500);
  }
  function schedule(ms = 3000) {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(() => flush(), ms);
  }

  // A note about one round, shift or mini game.
  //   game: merge | kitchen | skee | match | golf | trivia
  //   level: which one (a round "toronto:3", a shift "S4", a golf hole "pizza", a mini game's mode)
  //   outcome: pass | fail | leave (left before the end)
  //   secs: how long it took. result: stars, score or pairs. extra: anything small that helps explain it.
  function event(game, level, outcome, secs, result, extra) {
    if (!joined() || (outcome === 'leave' && secs < 8)) return; // quitting at once isn't a sign of anything
    T.queue.push({ eid: uid(), t: Date.now(), sid: sess.sid, g: game, l: String(level), o: outcome, s: Math.round(secs || 0), r: result ?? 0, m: api.mood?.() || '', x: extra || undefined });
    if (T.queue.length > QUEUE_MAX) T.queue.splice(0, T.queue.length - QUEUE_MAX);
    save();
    schedule();
  }

  // How long she has spent on this round so far (all sessions). Reading it starts the next try from zero.
  function takeSecs(key) {
    const s = Math.round(T.tries[key] || 0);
    delete T.tries[key];
    save();
    return s;
  }
  const peekSecs = key => Math.round(T.tries[key] || 0);

  // ---------- the leaderboard ----------
  async function boards(force = false) {
    if (!joined()) return null;
    const fresh = Date.now() - boardAt < (CONFIG.cloud.boardEveryMinutes || 3) * 60000;
    if (boardCache && fresh && !force) return boardCache;
    try {
      const r = await fetch(`${url}?a=board&pid=${encodeURIComponent(T.pid)}`);
      const j = await r.json();
      if (!j.ok) return boardCache;
      boardCache = j; boardAt = Date.now();
    } catch { /* offline: show what we had */ }
    return boardCache;
  }

  function setConsent(yes) {
    T.consent = !!yes;
    save();
    if (yes) flush(false, true);
  }

  setInterval(tick, 1000);
  // Play time and any waiting notes go out every so often (and straight after a round ends, see event()).
  setInterval(() => { if (sessDirty || T.queue.length) flush(); }, FLUSH_EVERY);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      flush(true);
    } else {
      lastTick = Date.now(); lastTouch = Date.now();
      if (hiddenAt && Date.now() - hiddenAt > NEW_SESSION_MS) newSession();
      hiddenAt = 0;
    }
  });
  addEventListener('pagehide', () => flush(true));

  return {
    enabled, joined, setConsent, event, takeSecs, peekSecs, boards, flush,
    asked: () => T.consent !== null,
    consent: () => T.consent,
    pid: () => T.pid,
  };
}
