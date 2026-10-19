// The daily routine: a gift, a trivia question, two mini games and the prize counter.
// Nothing here ever runs out for good or punishes a missed day.

export const DAILY = {
  gift: { dollars: 25, gems: 1, wildcards: 1 }, // the first visit each day
  freePlays: 3,                                // free plays of each mini game, per day
  extraPlayGems: 1,                            // after that, one more play costs this many gems
};

// Gems: earned from badges, trivia, the gift and great mini game scores.
export const GEMS = {
  badge: [1, 3, 10],                    // for bronze, silver, gold
  refill: { gems: 3, charges: 60 },     // skip the wait for pantry charges
  wildcard: 2,                          // buy an extra wild card
  skipOrderPer: 25,                     // finishing an order with gems: 1 gem per $25 it pays (at least 2)
};

// Daily trivia rewards.
export const TRIVIA_REWARD = {
  right: { dollars: 20, gems: 1 },
  streakBonus: 5,          // extra dollars per day of a right-answer streak
  streakBonusMax: 25,
  wrong: { dollars: 5 },   // a small "thanks for playing"
};

// Skee ball: grab a ball from the chute and flick it up the hill. The last ball is golden (double points).
// "ringScale" makes the rings bigger (easier) or smaller.
// "assist" gently pulls rolls toward the middle.
// Gems: one for every "pointsPerGem" points, times "gemsTimes". A very high score adds one more.
export const SKEEBALL = {
  balls: 5,
  modes: {
    relaxed: { name: 'Relaxed', ringScale: 1.2, assist: 0.3, gemsTimes: 1, winScore: 150 },
    challenge: { name: 'Challenge', ringScale: 0.9, assist: 0, gemsTimes: 2, winScore: 130 },
  },
  pointsPerGem: 50,
  gemScore: 200,           // a score this high also wins a bonus gem
};

// Matching: flip two cards, find the pairs before the soft timer runs out.
// Running out of time is fine: she keeps everything she found.
export const MATCHING = {
  pairs: 8,
  modes: {
    relaxed: { name: 'Relaxed', seconds: 80, rewardTimes: 1 },
    challenge: { name: 'Challenge', seconds: 45, rewardTimes: 2 },
  },
  dollarsPerPair: 3,
  pairsPerGem: 4,          // one gem for every 4 pairs found (times "rewardTimes")
  allPairsFoods: 2,        // finding every pair also drops this many level 2 foods on the board
  fullBoardDollars: 5,     // ...and pays this many dollars for each one that doesn't fit
};

// The gem shop. Prices are in gems.
export const PRIZES = [
  { id: 'food4', name: 'A level 4 food for your board', cost: 2, give: { foods: { tier: 4, count: 1 } } },
  { id: 'wild', name: 'Wild card', cost: 2, give: { wildcards: 1 } },
  { id: 'basket', name: 'Food basket: 3 level 3 foods', cost: 3, give: { foods: { tier: 3, count: 3 } } },
  { id: 'cat', name: 'Window cat for the restaurant', cost: 6, give: { decor: 'cat' } },
  { id: 'hanging', name: 'Hanging flower baskets', cost: 8, give: { decor: 'hanging' } },
  { id: 'bike', name: 'Bicycle with a tulip basket', cost: 10, give: { decor: 'bike' } },
];

// Older saves had tickets: they turn into gems at this rate (rounded up).
export const TICKETS_PER_GEM = 25;
