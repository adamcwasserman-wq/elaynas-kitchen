// What customers ask for.
// A plain item is written { chain, tier }. A dish is written { dish } (see data/recipes.js).
// An order is one plain item, or one dish.

// The first orders are set by hand so the opening minutes teach the game.
// The game starts with only the bakery crate, so the first three are bakery only.
export const FIRST_ORDERS = [
  { chain: 'bakery', tier: 2 },
  { chain: 'bakery', tier: 2 },
  { chain: 'bakery', tier: 3 },
  { chain: 'dairy', tier: 2 },   // the dairy fridge has just arrived
  { dish: 'shortbread' },        // the first dish
  { chain: 'bakery', tier: 4 },
  { dish: 'cheesedanish' },
  { chain: 'dairy', tier: 4 },
  { dish: 'pancakes' },
];

// After that, orders are made up at random and slowly get harder.
// "upTo" is how many orders she has served. "dishChance" is how often the order is a dish.
// "tiers" is the range of levels a plain item, or a dish's ingredients, can be.
export const ORDER_RAMP = [
  { upTo: 15, dishChance: 0.4, tiers: [2, 4] },
  { upTo: 35, dishChance: 0.5, tiers: [2, 5] },
  { upTo: Infinity, dishChance: 0.55, tiers: [3, 6] },
];
