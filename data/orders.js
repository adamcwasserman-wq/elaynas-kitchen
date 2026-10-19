// What customers ask for.
// A plain item is written { chain, tier }. A dish is written { dish } (see data/recipes.js).
// An order asks for one or more of these ("wants").

// The very first orders are set by hand so the opening minutes teach the game.
// The game starts with only the bakery crate, so the first three are bakery only.
export const FIRST_ORDERS = [
  [{ chain: 'bakery', tier: 2 }],
  [{ chain: 'bakery', tier: 2 }],
  [{ chain: 'bakery', tier: 3 }],
  [{ chain: 'dairy', tier: 1 }],   // the dairy fridge has just arrived: a glass of milk
  [{ chain: 'dairy', tier: 2 }],
];

// Customers get harder as the restaurant earns stars.
// untilStars: this stage lasts until the restaurant has this many stars.
// plainTiers: levels a plain item can be. dishChance: how often an order is a dish.
// dishLevels: which recipes can be asked for ("simple" uses foods up to level 3, "advanced" goes higher).
// wants: how many things one order asks for. fastSeconds: serve within this time for the speed bonus.
// customers: how many customers are waiting at once (it starts with one and grows).
export const ORDER_STAGES = [
  { name: 'Basics', untilStars: 8, customers: 1, plainTiers: [1, 3], dishChance: 0, dishLevels: [], wants: [1, 1], fastSeconds: 75 },
  { name: 'Simple recipes', untilStars: 40, customers: 2, plainTiers: [2, 4], dishChance: 0.6, dishLevels: ['simple'], wants: [1, 1], fastSeconds: 150 },
  { name: 'Advanced recipes', untilStars: 100, customers: 3, plainTiers: [3, 5], dishChance: 0.7, dishLevels: ['simple', 'advanced', 'advanced'], wants: [1, 1], fastSeconds: 210 },
  { name: 'Big orders', untilStars: Infinity, customers: 3, plainTiers: [3, 5], dishChance: 0.6, dishLevels: ['simple', 'advanced'], wants: [2, 3], fastSeconds: 300 },
];

// Stars each part of an order earns, and the speed bonus.
export const ORDER_STARS = { plain: 1, simple: 2, advanced: 3, speedy: 1 };

// Speed tip: served right away, a customer adds this share of the bill as a tip (1 = pays double).
// The amount on the order card counts down as the customer waits, and the tip is gone at twice
// the fast time. It never drops below the normal price, and orders never expire.
export const SPEED_TIP = 1;

// Complaints: when a customer's bar runs out (twice their fast time), they complain and leave.
// "max" complaints fails the round: stars go back to where this star level began and the
// customers start fresh (the food on the board stays). Hearts refill at each new star.
// The very first teaching orders never complain, and the bars pause while a panel is open.
export const COMPLAINTS = { max: 3 };

// Orders that ask for several things pay a little extra.
export const BIG_ORDER_BONUS = 1.25;
