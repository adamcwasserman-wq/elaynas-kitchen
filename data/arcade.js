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

// Skee ball: swipe up to roll. "ringScale" makes the rings bigger (easier) or smaller.
// "assist" gently pulls rolls toward the middle. Tickets = score / 10, times "tickets".
export const SKEEBALL = {
  balls: 5,
  modes: {
    relaxed: { name: 'Relaxed', ringScale: 1.2, assist: 0.3, tickets: 1, winScore: 150 },
    challenge: { name: 'Challenge', ringScale: 0.9, assist: 0, tickets: 2, winScore: 130 },
  },
  gemScore: 200,           // a score this high also wins a gem
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
  ticketsPerPair: 1,
  allPairsFoods: 2,        // finding every pair also drops this many level 2 foods on the board
};

// The prize counter. Prices are in tickets.
export const PRIZES = [
  { id: 'charges', name: '25 pantry charges', cost: 20, give: { charges: 25 } },
  { id: 'gem1', name: '1 gem', cost: 30, give: { gems: 1 } },
  { id: 'wild', name: 'Wild card', cost: 40, give: { wildcards: 1 } },
  { id: 'basket', name: 'Food basket: 3 level 3 foods', cost: 50, give: { foods: { tier: 3, count: 3 } } },
  { id: 'gem5', name: '5 gems', cost: 130, give: { gems: 5 } },
  { id: 'cat', name: 'Window cat for the restaurant', cost: 120, give: { decor: 'cat' } },
  { id: 'hanging', name: 'Hanging flower baskets', cost: 160, give: { decor: 'hanging' } },
  { id: 'bike', name: 'Bicycle with a tulip basket', cost: 200, give: { decor: 'bike' } },
];
