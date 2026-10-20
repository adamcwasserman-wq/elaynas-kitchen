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

// Every restaurant has 10 rounds. A round is passed by earning its goal in stars before too many
// customers leave unhappy (see COMPLAINTS). Each round passed is a star for the restaurant, kept for
// good. Each round asks for a little more, with less time per customer, so upgrades (patience,
// hearts, two-for-one taps) and gem abilities (fresh tip, swap, serve now) start to matter.
//
//   goal          stars to earn in the round (times the restaurant's goalScale in data/cities.js)
//   customers     how many customers wait at once
//   plainTiers    levels a plain food can be
//   dishChance    how often a thing ordered is a dish; dishLevels: which recipes ("simple" uses foods
//                 up to level 3, "advanced" goes higher). A dish's foods are never above the top plain level.
//   wants         how many things one customer asks for (never more than MAX_WANTS)
//   fastSeconds   serve within this for the speed bonus; a customer leaves at twice this
//   reward        for passing the round the first time: tips (times the restaurant's upgradeCost).
//                 Rounds never pay gems (badges and missions do).
// The time limits come from how much work each round's orders take: early rounds leave about
// four times the time needed, round 10 about one and a half.
export const ROUNDS = [
  { goal: 12, customers: 1, plainTiers: [1, 3], dishChance: 0, dishLevels: [], wants: [1, 1], fastSeconds: 50, reward: { dollars: 30 } },
  { goal: 22, customers: 2, plainTiers: [2, 3], dishChance: 0.5, dishLevels: ['simple'], wants: [1, 1], fastSeconds: 35, reward: { dollars: 50 } },
  { goal: 26, customers: 2, plainTiers: [2, 4], dishChance: 0.6, dishLevels: ['simple'], wants: [1, 1], fastSeconds: 40, reward: { dollars: 80 } },
  { goal: 28, customers: 3, plainTiers: [2, 4], dishChance: 0.6, dishLevels: ['simple'], wants: [1, 1], fastSeconds: 50, reward: { dollars: 110 } },
  { goal: 34, customers: 3, plainTiers: [3, 4], dishChance: 0.65, dishLevels: ['simple', 'advanced'], wants: [1, 1], fastSeconds: 75, reward: { dollars: 150 } },
  { goal: 40, customers: 3, plainTiers: [3, 5], dishChance: 0.7, dishLevels: ['simple', 'advanced', 'advanced'], wants: [1, 1], fastSeconds: 100, reward: { dollars: 200 } },
  { goal: 50, customers: 3, plainTiers: [3, 5], dishChance: 0.6, dishLevels: ['simple', 'advanced'], wants: [1, 2], fastSeconds: 120, reward: { dollars: 260 } },
  { goal: 55, customers: 3, plainTiers: [3, 5], dishChance: 0.65, dishLevels: ['simple', 'advanced'], wants: [1, 2], fastSeconds: 110, reward: { dollars: 330 } },
  { goal: 60, customers: 3, plainTiers: [3, 5], dishChance: 0.7, dishLevels: ['advanced', 'simple', 'advanced'], wants: [1, 2], fastSeconds: 110, reward: { dollars: 420 } },
  { goal: 65, customers: 3, plainTiers: [4, 5], dishChance: 0.7, dishLevels: ['simple', 'advanced', 'advanced'], wants: [1, 2], fastSeconds: 105, reward: { dollars: 800 } },
];
// Crazy mode opens once a restaurant has all 10 stars: big orders, short fuses, big rewards (every time it's cleared).
export const CRAZY = { goal: 70, customers: 3, plainTiers: [4, 5], dishChance: 0.75, dishLevels: ['advanced'], wants: [2, 2], fastSeconds: 75, reward: { dollars: 1200 } };
// stars: rounds per restaurant. opensNextAt: stars that open the next restaurant.
// replay: what replaying a round she's already won pays (this share of its tips).
export const ROUND_RULES = { stars: 10, opensNextAt: 6, replay: { dollars: 0.5 } };

// No customer asks for more than this many things (VIPs included). More got too hard to juggle,
// except in the Dinner rush mood from round 7 on (see wantsMax in data/moods.js).
export const MAX_WANTS = 2;

// Stars each thing in an order earns. Bigger foods take more work, so they earn more:
//   plain   a food by its level (level 1 is the first number)
//   dish    a dish earns the stars of its bigger food, plus this for the mixing
//   bothBig plus this when both of a dish's foods are level 4 or higher
//   speedy  the speed bonus for the whole order
export const ORDER_STARS = { plain: [1, 1, 2, 2, 3, 4], dish: 1, bothBig: 1, speedy: 1 };

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
