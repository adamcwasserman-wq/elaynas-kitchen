// The daily routine: a gift, a trivia question, two mini games and the prize counter.
// Nothing here ever runs out for good or punishes a missed day.

export const DAILY = {
  gift: { dollars: 25, gems: 1, wildcards: 1 }, // the first visit each day
  freePlays: 3,                                // free plays of each mini game, per day
  extraPlayGems: 1,                            // after that, one more play costs this many gems
};

// Gems: earned from missions, badges, the gift and the side games (trivia, skee ball, food match, mini golf).
// Side games pay gems only, never tips.
export const GEMS = {
  badge: [1, 3, 10],                    // for bronze, silver, gold
  refill: { gems: 3, charges: 60 },     // skip the wait for pantry charges
  wildcard: 2,                          // buy an extra wild card
  skipOrderPer: 25,                     // "Serve now": 1 gem per $25 the order pays (at least 2)
  swap: 1,                              // "Swap": send a customer off and bring a new one
  freshTip: 1,                          // "Fresh tip": refill a customer's speed tip
  levelUp: 2,                           // "Level up": turn a food on the board into the next level
};

// Daily trivia rewards, in gems.
export const TRIVIA_REWARD = {
  right: { gems: 2 },
  streakBonus: 1,          // an extra gem for each day of a right-answer streak...
  streakBonusMax: 3,       // ...up to this many extra
  wrong: { gems: 1 },      // a small "thanks for playing"
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
  pairsPerGem: 2,          // one gem for every 2 pairs found (times "rewardTimes")
  allPairsFoods: 2,        // finding every pair also drops this many level 2 foods on the board
  fullBoardGems: 1,        // ...and pays this many gems for each one that doesn't fit
};

// The gem shop. Prices are in gems. "kind" puts each thing on a shelf:
//   boost   helps with her next few customers or taps (one boost at a time, see "boost")
//   pantry  foods and wild cards for the board
//   decor   a decoration for the restaurant she's in (each restaurant has its own; art in js/art.js)
// "art" is the picture on the tile (an id from the sprite in js/art.js). "names" lets a decoration
// change its name to match the restaurant's style.
//
// Boosts: vip    the next customer who walks in is a VIP (even before VIPs normally start)
//         pay    customers pay this much more (0.5 = 50%) for the next "left" customers
//         stars  each of the next "left" customers gives this many bonus stars
//         taps   the next "taps" taps on a starter block give level 2 foods
export const SHOP = [
  { id: 'vip', kind: 'boost', name: 'Call a VIP', about: 'The next customer who walks in is a VIP.', cost: 3, art: 'cust-critic', boost: { vip: true, left: 1 } },
  { id: 'happy', kind: 'boost', name: 'Happy hour', about: 'Your next 8 customers pay 50% more.', cost: 4, art: 'shop-happy', boost: { pay: 0.5, left: 8 } },
  { id: 'stars', kind: 'boost', name: 'Star power', about: 'Your next 5 customers each give a bonus star.', cost: 4, art: 'shop-stars', boost: { stars: 1, left: 5 } },
  { id: 'lucky', kind: 'boost', name: 'Lucky crates', about: 'Your next 15 taps give level 2 foods.', cost: 3, art: 'shop-lucky', boost: { taps: 15 } },

  { id: 'kit', kind: 'pantry', name: 'Recipe kit', about: 'Both foods for a dish a customer is waiting for.', cost: 3, art: 'shop-kit', give: { kit: true } },
  { id: 'food4', kind: 'pantry', name: 'Level 4 food', about: 'A big head start.', cost: 2, art: 'food4', give: { foods: { tier: 4, count: 1 } } },
  { id: 'food5', kind: 'pantry', name: 'Level 5 food', about: 'One step from the top of its chain.', cost: 5, art: 'food5', give: { foods: { tier: 5, count: 1 } } },
  { id: 'basket', kind: 'pantry', name: 'Food basket', about: 'Three level 3 foods.', cost: 3, art: 'food3', give: { foods: { tier: 3, count: 3 } } },
  { id: 'wild', kind: 'pantry', name: 'Wild card', about: 'Drop it on any food to make a copy.', cost: 2, art: 'art-wild', give: { wildcards: 1 } },
  { id: 'wild3', kind: 'pantry', name: 'Three wild cards', about: 'A gem cheaper than three on their own.', cost: 5, art: 'art-wild', count: 3, give: { wildcards: 3 } },

  { id: 'balloons', kind: 'decor', name: 'Balloons', cost: 5, give: { decor: 'balloons' } },
  { id: 'cat', kind: 'decor', name: 'Window cat', cost: 6, give: { decor: 'cat' } },
  { id: 'hanging', kind: 'decor', name: 'Hanging flower baskets', cost: 8, give: { decor: 'hanging' } },
  { id: 'bike', kind: 'decor', name: 'Bicycle with a flower basket', cost: 10, give: { decor: 'bike' } },
  { id: 'pup', kind: 'decor', name: 'Puppy by the door', cost: 12, give: { decor: 'pup' } },
  { id: 'cart', kind: 'decor', name: 'Snack cart', names: { deli: 'Pretzel cart', mexico: 'Paleta cart', rome: 'Gelato cart' }, cost: 15, give: { decor: 'cart' } },
];

// Today's special: one thing in the shop is cheaper each day (it changes at midnight).
export const SPECIAL = { off: 0.4 }; // 40% off, and always at least 1 gem off

// Older saves had tickets: they turn into gems at this rate (rounded up).
export const TICKETS_PER_GEM = 25;
