// Leaderboards. One board per game. "id" is what the server stores scores under, so keep it the same.
// A board with "modes" has one list for Relaxed and one for Challenge (their scores can't be compared).
// Each score is [score, tie-break], higher is better. "fmt" turns them into the words shown beside a name.
// Where each score comes from: restaurant, kitchen and trivia in js/main.js (boardScores), the rest in js/arcade.js (scores).

export const BOARDS = [
  { id: 'restaurant', title: 'Restaurants', about: 'Most restaurant stars. Win rounds to earn them.', fmt: v => `★ ${v}` },
  { id: 'kitchen', title: 'Kitchen', about: 'Most stars from cooking shifts.', fmt: v => `★ ${v}` },
  { id: 'skee', title: 'Skee ball', about: 'Best score in one game.', modes: true, fmt: v => `${v} pts` },
  { id: 'match', title: 'Food match', about: 'Most pairs found, then the fastest time.', modes: true, fmt: (v, t) => `${v} pairs · ${Math.abs(t)}s` },
  { id: 'golf', title: 'Mini golf', about: 'Most stars across all the holes.', fmt: v => `★ ${v}` },
  { id: 'trivia', title: 'Trivia', about: 'Most food trivia answers right.', fmt: v => `${v} right` },
];
export const BOARD_MODES = [['relaxed', 'Relaxed'], ['challenge', 'Challenge']];
export const boardKey = (b, mode) => (b.modes ? `${b.id}_${mode}` : b.id);
export const ALL_BOARD_KEYS = BOARDS.flatMap(b => (b.modes ? BOARD_MODES.map(([m]) => boardKey(b, m)) : [b.id]));

export const TOP_SHOWN = 10;
