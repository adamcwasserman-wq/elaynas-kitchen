// Tuning numbers for the game. Change these after play testing,
// no game logic lives here. Times are in seconds unless the name says otherwise.

export const CONFIG = {
  // The merge board: 6 squares across, 8 down. Big enough food on a Pixel 9 in portrait.
  board: { cols: 6, rows: 8 },

  // Pantry charges. Every tap on the pantry crate uses one.
  // A full pool of 150 plus the slow refill lasts roughly 30 to 45 minutes of play.
  // unlimited: true means the starter blocks never run out, so she can play as long as she likes.
  // (Set it to false to bring back the old limit and refill timer.)
  charges: {
    unlimited: true,
    max: 150,
    start: 150,
    refillSeconds: 45, // one charge comes back every 45 seconds, even while the game is closed
  },

  // When the pantry runs low she is never stuck.
  refill: {
    buyAmount: 50, // charges you get when you pay dollars
    buyPrice: 100, // dollars
    freeAmount: 20, // a free top-up
    freeWhenBelow: 5, // free top-up shows up when charges drop below this
    freeCooldownMinutes: 20, // wait between free top-ups (skipped if she can't afford to buy)
  },

  // Chance that a pantry tap gives a level 2 item instead of a level 1 item.
  producerBonusChance: 0.06,

  // Seconds of no activity before the game gently wiggles a possible merge.
  hintIdleSeconds: 12,

  // Vibration patterns in milliseconds. She plays with the sound off, so these do the work of sound.
  vibration: {
    tap: 8,
    merge: 22,
    serve: [30, 40, 50],
    nope: [12, 30, 12],
  },

  // Sharing with friends: where "Send feedback" (Settings) writes to.
  feedbackEmail: 'adamcwasserman@gmail.com',

  // The leaderboard and play statistics. "url" is the address of the Google Sheet script that collects them
  // (see backend/SETUP.md). Leave it empty and none of it shows up: nothing is ever sent anywhere.
  cloud: {
    url: 'https://script.google.com/macros/s/AKfycbxC67wfd4HfqetiaEH6LBe25KlTs-Lr-tVOgZP3ZEI-0B8AAgudMj9eAblb2vBo30rd8A/exec',
    boardEveryMinutes: 3, // how often the leaderboard is allowed to refresh while she plays
    minPlayers: 3,        // a board needs this many players before a podium spot counts for badges
  },
};
