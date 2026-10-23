// Saving and loading.
// The game saves to the phone after every change. Because a browser can clear its storage,
// Settings also offers a backup code (or file) that can be pasted back in later.

// The game lives at two addresses on the same website: the testing copy (elaynas-kitchen), where new
// changes go first, and the real game (tulip-kitchen), which only changes on a release. The browser
// treats them as one site, so the testing copy keeps its own save: trying things out never touches the
// real game. Its first visit starts from a copy of the real save, so there's progress to test with.
export const TESTING = /\/elaynas-kitchen\//.test(location.pathname);
const REAL_KEY = 'elayna-kitchen-save';
const KEY = TESTING ? `${REAL_KEY}-testing` : REAL_KEY;
const CODE_PREFIX = 'EK1.';
export const SAVE_VERSION = 2;

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY) ?? (TESTING ? localStorage.getItem(REAL_KEY) : null);
    const data = raw ? JSON.parse(raw) : null;
    return isValid(data) ? data : null;
  } catch {
    return null;
  }
}

export function writeSave(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}

// A backup code is the save, packed into one line of letters and numbers.
export function toCode(state) {
  return CODE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

// Accepts a backup code, or the contents of a backup file. Returns null if it isn't a save.
export function fromCode(text) {
  const t = String(text || '').trim();
  let data = null;
  try {
    data = JSON.parse(decodeURIComponent(escape(atob(t.startsWith(CODE_PREFIX) ? t.slice(CODE_PREFIX.length) : t))));
  } catch {
    try { data = JSON.parse(t); } catch { data = null; }
  }
  return isValid(data) ? data : null;
}

function isValid(s) {
  return !!s && Array.isArray(s.board) && typeof s.dollars === 'number' && Array.isArray(s.orders);
}
