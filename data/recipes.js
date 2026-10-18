// Dishes. Each one is two foods from the board.
// A customer who wants a dish shows its name and the two foods it needs.
// She can serve it when both foods are on the board, or mix them ahead of time by
// dragging one onto the other (that turns them into the dish and frees a square).
// "a" and "b" can be dropped in either order. "value" is what a customer pays.
// "hers: true" marks dishes from Elayna's own recipe collection (her "Go-To Recipes" list).

export const RECIPES = [
  { id: 'granola', name: 'Olive oil granola', hers: true, a: { chain: 'bakery', tier: 1 }, b: { chain: 'dairy', tier: 1 }, value: 9 },
  { id: 'pancakes', name: 'Lemon pancakes', hers: true, a: { chain: 'bakery', tier: 2 }, b: { chain: 'dairy', tier: 1 }, value: 15 },
  { id: 'shortbread', name: 'Pecan shortbread squares', hers: true, a: { chain: 'bakery', tier: 2 }, b: { chain: 'dairy', tier: 2 }, value: 21 },
  { id: 'kugel', name: 'Noodle kugel', hers: true, a: { chain: 'bakery', tier: 3 }, b: { chain: 'dairy', tier: 1 }, value: 28 },
  { id: 'muffins', name: 'Cottage cheese muffins', hers: true, a: { chain: 'bakery', tier: 2 }, b: { chain: 'dairy', tier: 3 }, value: 34 },
  { id: 'pecanpie', name: 'Pecan pie', hers: true, a: { chain: 'bakery', tier: 3 }, b: { chain: 'dairy', tier: 2 }, value: 34 },
  { id: 'cheesedanish', name: 'Cream cheese danish', hers: true, a: { chain: 'bakery', tier: 3 }, b: { chain: 'dairy', tier: 3 }, value: 46 },
  { id: 'biscuits', name: 'Cheddar and chive biscuits', hers: true, a: { chain: 'bakery', tier: 2 }, b: { chain: 'dairy', tier: 4 }, value: 60 },
  { id: 'cheesebread', name: 'Cheese bread', hers: true, a: { chain: 'bakery', tier: 3 }, b: { chain: 'dairy', tier: 4 }, value: 72 },
  { id: 'schmear', name: 'Bagel with schmear', a: { chain: 'bakery', tier: 4 }, b: { chain: 'dairy', tier: 3 }, value: 72 },
  { id: 'bagelmelt', name: 'Bagel melt', a: { chain: 'bakery', tier: 4 }, b: { chain: 'dairy', tier: 4 }, value: 98 },
  { id: 'spongecake', name: "Grandma's sponge cake", hers: true, a: { chain: 'bakery', tier: 5 }, b: { chain: 'dairy', tier: 1 }, value: 108 },
  { id: 'frenchtoast', name: 'Stuffed French toast', hers: true, a: { chain: 'bakery', tier: 5 }, b: { chain: 'dairy', tier: 3 }, value: 125 },
  { id: 'maccheese', name: 'Four cheese mac and cheese', hers: true, a: { chain: 'bakery', tier: 3 }, b: { chain: 'dairy', tier: 5 }, value: 125 },
  { id: 'grilledcheese', name: 'Grilled cheese', hers: true, a: { chain: 'bakery', tier: 5 }, b: { chain: 'dairy', tier: 4 }, value: 150 },
  { id: 'chococheesecake', name: "Marie's chocolate cheesecake", hers: true, a: { chain: 'bakery', tier: 6 }, b: { chain: 'dairy', tier: 6 }, value: 450 },
];

// "Simple" recipes use foods up to level 3; "advanced" ones need a level 4 food or higher.
export const recipeLevel = r => Math.max(r.a.tier, r.b.tier) >= 4 ? 'advanced' : 'simple';

// Older saves used some dish names that have since become Elayna's own recipes.
export const RENAMED_DISHES = {
  creamofwheat: 'granola',
  rugelach: 'muffins',
  buttertart: 'pecanpie',
  cheesescones: 'cheesebread',
};

// Dollars for making a dish for the first time.
export const RECIPE_DISCOVERY_REWARD = 10;
