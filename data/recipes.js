// Mixing: drag one food onto a different food. If they make a recipe, they become a dish.
// If they don't, the food bounces back. Nothing is lost.
// "a" and "b" can be dropped in either order. "value" is what a customer pays for the dish.

export const RECIPES = [
  { id: 'pancakes', name: 'Pancakes', a: { chain: 'bakery', tier: 2 }, b: { chain: 'dairy', tier: 1 }, value: 15 },
  { id: 'buttertart', name: 'Butter tart', a: { chain: 'bakery', tier: 3 }, b: { chain: 'dairy', tier: 2 }, value: 32 },
  { id: 'rugelach', name: 'Rugelach', a: { chain: 'bakery', tier: 3 }, b: { chain: 'dairy', tier: 3 }, value: 44 },
  { id: 'schmear', name: 'Bagel with schmear', a: { chain: 'bakery', tier: 4 }, b: { chain: 'dairy', tier: 3 }, value: 70 },
  { id: 'frenchtoast', name: 'Challah French toast', a: { chain: 'bakery', tier: 5 }, b: { chain: 'dairy', tier: 2 }, value: 110 },
];

// Dollars for finding a recipe for the first time.
export const RECIPE_DISCOVERY_REWARD = 10;

// Once she has served 8 orders, this is the chance a new order asks for a dish.
export const DISH_ORDER_CHANCE = 0.3;
