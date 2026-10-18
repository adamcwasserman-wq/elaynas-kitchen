// Dishes. Each one is two foods from the board.
// A customer who wants a dish shows its name and the two foods it needs.
// She can serve it when both foods are on the board, or mix them ahead of time by
// dragging one onto the other (that turns them into the dish and frees a square).
// "a" and "b" can be dropped in either order. "value" is what a customer pays.

export const RECIPES = [
  { id: 'creamofwheat', name: 'Cream of wheat', a: { chain: 'bakery', tier: 1 }, b: { chain: 'dairy', tier: 1 }, value: 9 },
  { id: 'pancakes', name: 'Pancakes', a: { chain: 'bakery', tier: 2 }, b: { chain: 'dairy', tier: 1 }, value: 15 },
  { id: 'shortbread', name: 'Shortbread', a: { chain: 'bakery', tier: 2 }, b: { chain: 'dairy', tier: 2 }, value: 21 },
  { id: 'rugelach', name: 'Rugelach', a: { chain: 'bakery', tier: 2 }, b: { chain: 'dairy', tier: 3 }, value: 34 },
  { id: 'buttertart', name: 'Butter tart', a: { chain: 'bakery', tier: 3 }, b: { chain: 'dairy', tier: 2 }, value: 34 },
  { id: 'cheesedanish', name: 'Cheese danish', a: { chain: 'bakery', tier: 3 }, b: { chain: 'dairy', tier: 3 }, value: 46 },
  { id: 'cheesescones', name: 'Cheese scones', a: { chain: 'bakery', tier: 3 }, b: { chain: 'dairy', tier: 4 }, value: 72 },
  { id: 'schmear', name: 'Bagel with schmear', a: { chain: 'bakery', tier: 4 }, b: { chain: 'dairy', tier: 3 }, value: 72 },
  { id: 'bagelmelt', name: 'Bagel melt', a: { chain: 'bakery', tier: 4 }, b: { chain: 'dairy', tier: 4 }, value: 98 },
  { id: 'frenchtoast', name: 'Challah French toast', a: { chain: 'bakery', tier: 5 }, b: { chain: 'dairy', tier: 2 }, value: 112 },
];

// Dollars for making a dish for the first time.
export const RECIPE_DISCOVERY_REWARD = 10;
