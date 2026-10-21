// The leaderboard: a one-time notice, the board itself, and the podium achievements.
// Needs the cloud address in data/config.js. It is on for everyone and can be switched off in Settings (see js/track.js).

import { CONFIG } from '../data/config.js';
import { BOARDS, BOARD_MODES, boardKey, ALL_BOARD_KEYS } from '../data/leaderboard.js';

const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MEDALS = ['🥇', '🥈', '🥉'];

export function createBoard(api) {
  // api: getS, track, openSheet, closeSheets, checkBadges, save, renderAll, buzz, toast
  const S = () => api.getS();
  const T = api.track;
  let tab = 'restaurant', mode = 'relaxed';
  let podiumTimer = 0;

  const available = () => T.enabled();

  // ---------- the notice ----------
  // Everyone is on the leaderboard from the start. Each player is told once, and can switch it off right there.
  function askJoin() {
    if (!available() || T.noticed() || !S().profile?.name) return false;
    api.openSheet('#board-join');
    return true;
  }
  function answer(keep) {
    T.setNoticed();
    if (!keep) T.setConsent(false);
    api.closeSheets();
    api.buzz(keep ? 'serve' : 'tap');
    if (keep) changed(); else api.toast('Your scores are no longer shared.');
    api.renderAll();
  }
  $('#join-yes').addEventListener('click', () => answer(true));
  $('#join-no').addEventListener('click', () => answer(false));

  // ---------- the board ----------
  async function render() {
    const b = BOARDS.find(x => x.id === tab), key = boardKey(b, mode);
    $('#board-tabs').innerHTML = BOARDS.map(x => `<button class="mode${x.id === tab ? ' on' : ''}" data-tab="${x.id}">${x.title}</button>`).join('');
    $('#board-modes').innerHTML = b.modes ? BOARD_MODES.map(([k, n]) => `<button class="mode${k === mode ? ' on' : ''}" data-bmode="${k}">${n}</button>`).join('') : '';
    $('#board-about').textContent = b.about;
    const list = $('#board-list'), me = $('#board-me');
    if (!T.joined()) {
      list.innerHTML = '';
      me.innerHTML = `<button class="btn primary" id="board-join-now">Join the leaderboard</button>`;
      return;
    }
    list.innerHTML = '<li class="board-wait">Loading...</li>';
    me.textContent = '';
    const data = await T.boards();
    if (tab !== b.id || key !== boardKey(b, mode)) return; // she tapped another tab while it loaded
    const d = data?.boards?.[key];
    if (!data) { list.innerHTML = '<li class="board-wait">Can\'t reach the leaderboard right now. Try again later.</li>'; return; }
    if (!d || !d.top?.length) { list.innerHTML = '<li class="board-wait">Nobody is on this board yet. Be the first!</li>'; return; }
    list.innerHTML = d.top.map((r, i) => `<li class="board-row${r.you ? ' you' : ''}"><span class="board-rank">${MEDALS[i] || i + 1}</span>
      <span class="board-name">${esc(r.n)}${r.you ? ' (you)' : ''}</span><b class="board-score">${b.fmt(r.v, r.t)}</b></li>`).join('');
    me.textContent = d.rank > 0
      ? (d.rank === 1 ? `You're #1 of ${d.of}!` : d.rank <= d.top.length ? `You're #${d.rank} of ${d.of}.` : `You're #${d.rank} of ${d.of}. Keep going!`)
      : 'Play this game to get on the board.';
  }
  function open() {
    if (!available()) return;
    api.openSheet('#leaders');
    render();
  }
  $('#leaders').addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'), m = e.target.closest('[data-bmode]');
    if (t) { tab = t.dataset.tab; api.buzz('tap'); render(); }
    else if (m) { mode = m.dataset.bmode; api.buzz('tap'); render(); }
    else if (e.target.closest('#board-join-now')) { T.setConsent(true); api.renderAll(); render(); changed(); }
  });

  // ---------- the podium ----------
  // Top 3 on a board (with enough players to mean something) counts toward "Top Chef"; first place toward "Champion".
  // Once earned, they are kept, even if someone passes her later.
  async function refreshPodium() {
    if (!T.joined()) return;
    const data = await T.boards(true);
    if (!data?.boards) return;
    let top3 = 0, wins = 0;
    for (const key of ALL_BOARD_KEYS) {
      const d = data.boards[key];
      if (!d || d.of < CONFIG.cloud.minPlayers || !d.rank) continue;
      if (d.rank <= 3) top3++;
      if (d.rank === 1) wins++;
    }
    const s = S(), p = (s.podium ??= { top3: 0, wins: 0 });
    if (top3 > p.top3 || wins > p.wins) {
      p.top3 = Math.max(p.top3, top3); p.wins = Math.max(p.wins, wins);
      api.checkBadges();
      api.save();
      api.renderAll();
    }
  }
  // Her scores changed: send them, then see where she stands.
  function changed() {
    if (!T.joined()) return;
    clearTimeout(podiumTimer);
    podiumTimer = setTimeout(async () => { await T.flush(false, true); refreshPodium(); }, 4000);
  }
  // A look at the board a few seconds after the game opens, so a new podium spot is noticed.
  function startUp() { if (T.joined()) setTimeout(async () => { await T.flush(false, true); refreshPodium(); }, 6000); }

  return { open, askJoin, changed, startUp, available };
}
