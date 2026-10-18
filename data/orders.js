// What customers ask for.
// Items are written as { chain, tier }. Tier 1 is what the pantry makes.

// The first orders are set by hand so the opening minutes teach the game.
export const FIRST_ORDERS = [
  [{ chain: 'bakery', tier: 2 }],
  [{ chain: 'dairy', tier: 2 }],
  [{ chain: 'bakery', tier: 3 }],
  [{ chain: 'dairy', tier: 3 }],
  [{ chain: 'bakery', tier: 2 }, { chain: 'dairy', tier: 2 }],
  [{ chain: 'bakery', tier: 4 }],
  [{ chain: 'dairy', tier: 3 }, { chain: 'bakery', tier: 3 }],
  [{ chain: 'dairy', tier: 4 }],
  [{ dish: 'pancakes' }], // the first dish: teaches mixing
];

// After that, orders are made up at random and slowly get harder.
// "upTo" is how many orders she has served. Each step lists the range of
// how many items an order asks for and which levels they can be.
export const ORDER_RAMP = [
  { upTo: 15, items: [1, 2], tiers: [2, 4] },
  { upTo: 35, items: [1, 2], tiers: [3, 5] },
  { upTo: Infinity, items: [1, 2], tiers: [3, 6] },
];

// Orders with two items pay a little extra.
export const TWO_ITEM_BONUS = 1.2;
