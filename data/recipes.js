// Dishes. Each one is two foods from the board.
// A customer who wants a dish shows its name and the two foods it needs.
// She can serve it when both foods are on the board, or mix them ahead of time by
// dragging one onto the other (that turns them into the dish and frees a square).
// "a" and "b" can be dropped in either order. "value" is what a customer pays.
// "hers: true" marks dishes from Elayna's own recipe collection (her "Go-To Recipes" list).
// "city" says where customers ask for it.

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

  // ----- Mexico City -----
  { id: 'elote', city: 'mexico', name: 'Elote', a: { chain: 'corn', tier: 1 }, b: { chain: 'dairy', tier: 2 }, value: 15 },
  { id: 'cornsalad', city: 'mexico', name: 'Tex Mex corn salad', hers: true, a: { chain: 'corn', tier: 1 }, b: { chain: 'garden', tier: 3 }, value: 28 },
  { id: 'chipssalsa', city: 'mexico', name: 'Chips and salsa', a: { chain: 'corn', tier: 3 }, b: { chain: 'garden', tier: 2 }, value: 34 },
  { id: 'quesadilla', city: 'mexico', name: 'Quesadillas', hers: true, a: { chain: 'corn', tier: 3 }, b: { chain: 'dairy', tier: 4 }, value: 72 },
  { id: 'eggplanttacos', city: 'mexico', name: 'Eggplant tacos', a: { chain: 'corn', tier: 4 }, b: { chain: 'garden', tier: 4 }, value: 98 },
  { id: 'nachos', city: 'mexico', name: 'Nachos', hers: true, a: { chain: 'corn', tier: 3 }, b: { chain: 'dairy', tier: 5 }, value: 125 },
  { id: 'burritos', city: 'mexico', name: 'Black bean burritos', hers: true, a: { chain: 'corn', tier: 4 }, b: { chain: 'garden', tier: 5 }, value: 150 },
  { id: 'casserole', city: 'mexico', name: 'Mexican breakfast casserole', hers: true, a: { chain: 'corn', tier: 6 }, b: { chain: 'garden', tier: 6 }, value: 450 },

  // ----- Rome -----
  { id: 'pomodoro', city: 'rome', name: 'Spaghetti pomodoro', a: { chain: 'pasta', tier: 3 }, b: { chain: 'garden', tier: 2 }, value: 34 },
  { id: 'minestrone', city: 'rome', name: 'Minestrone soup', hers: true, a: { chain: 'pasta', tier: 2 }, b: { chain: 'garden', tier: 3 }, value: 34 },
  { id: 'ziti', city: 'rome', name: 'Creamy ziti', hers: true, a: { chain: 'pasta', tier: 3 }, b: { chain: 'dairy', tier: 3 }, value: 46 },
  { id: 'pizza', city: 'rome', name: 'Broccoli and pineapple pizza', hers: true, a: { chain: 'pasta', tier: 2 }, b: { chain: 'dairy', tier: 4 }, value: 60 },
  { id: 'raviolisauce', city: 'rome', name: 'Ravioli in tomato sauce', a: { chain: 'pasta', tier: 4 }, b: { chain: 'garden', tier: 2 }, value: 60 },
  { id: 'parmigiana', city: 'rome', name: 'Eggplant parmigiana', a: { chain: 'garden', tier: 4 }, b: { chain: 'dairy', tier: 4 }, value: 98 },
  { id: 'lasagnadish', city: 'rome', name: 'Easiest ever lasagna', hers: true, a: { chain: 'pasta', tier: 5 }, b: { chain: 'garden', tier: 5 }, value: 210 },
  { id: 'familydinner', city: 'rome', name: 'Sunday family dinner', a: { chain: 'pasta', tier: 6 }, b: { chain: 'garden', tier: 6 }, value: 450 },
];

// Which city a recipe belongs to (customers there ask for it). Recipes without one are Toronto's.
export const recipeCity = r => r.city || 'toronto';

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
