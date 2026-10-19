// Dishes. Each one is two foods from the board.
// A customer who wants a dish shows its name and the two foods it needs.
// She can serve it when both foods are on the board, or mix them ahead of time by
// dragging one onto the other (that turns them into the dish and frees a square).
// "a" and "b" can be dropped in either order. "value" is what a customer pays.
// "hers: true" marks family recipes (shown as "Family recipe" in the recipe book).
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
  { id: 'chococheesecake', name: 'Double chocolate cheesecake', hers: true, a: { chain: 'bakery', tier: 6 }, b: { chain: 'dairy', tier: 6 }, value: 450 },

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

  // Hana Sushi (Japanese)
  { id: 'senbei', city: 'japan', name: 'Rice crackers', a: { chain: 'rice', tier: 2 }, b: { chain: 'tea', tier: 1 }, value: 15 },
  { id: 'ochazuke', city: 'japan', name: 'Ochazuke (tea over rice)', a: { chain: 'rice', tier: 2 }, b: { chain: 'tea', tier: 2 }, value: 21 },
  { id: 'matchalatte', city: 'japan', name: 'Matcha latte', a: { chain: 'tea', tier: 3 }, b: { chain: 'dairy', tier: 1 }, value: 28 },
  { id: 'matchacheesecake', city: 'japan', name: 'Matcha cheesecake', a: { chain: 'tea', tier: 3 }, b: { chain: 'dairy', tier: 3 }, value: 46 },
  { id: 'mochiicecream', city: 'japan', name: 'Mochi ice cream', a: { chain: 'tea', tier: 4 }, b: { chain: 'dairy', tier: 2 }, value: 60 },
  { id: 'sushiandtea', city: 'japan', name: 'Maki and green tea', a: { chain: 'rice', tier: 4 }, b: { chain: 'tea', tier: 3 }, value: 72 },
  { id: 'jigglycheesecake', city: 'japan', name: 'Jiggly matcha cheesecake', a: { chain: 'dairy', tier: 4 }, b: { chain: 'tea', tier: 3 }, value: 72 },
  { id: 'bentolunch', city: 'japan', name: 'Bento lunch', a: { chain: 'rice', tier: 5 }, b: { chain: 'tea', tier: 3 }, value: 125 },
  { id: 'omakase', city: 'japan', name: 'Chef\'s sushi feast', a: { chain: 'rice', tier: 6 }, b: { chain: 'tea', tier: 6 }, value: 450 },

  // Sunny Side (brunch)
  { id: 'berrymuffin', city: 'brunch', name: 'Berry muffins', a: { chain: 'bakery', tier: 2 }, b: { chain: 'fruit', tier: 1 }, value: 15 },
  { id: 'berrybrew', city: 'brunch', name: 'Strawberry cold brew', a: { chain: 'coffee', tier: 2 }, b: { chain: 'fruit', tier: 1 }, value: 15 },
  { id: 'cafeaulait', city: 'brunch', name: 'Café au lait', a: { chain: 'coffee', tier: 3 }, b: { chain: 'dairy', tier: 1 }, value: 28 },
  { id: 'berrypancakes', city: 'brunch', name: 'Berry pancakes', a: { chain: 'bakery', tier: 3 }, b: { chain: 'fruit', tier: 2 }, value: 34 },
  { id: 'coffeecake', city: 'brunch', name: 'Coffee cake', a: { chain: 'coffee', tier: 3 }, b: { chain: 'bakery', tier: 3 }, value: 46 },
  { id: 'crepes', city: 'brunch', name: 'Strawberry crêpes', a: { chain: 'bakery', tier: 3 }, b: { chain: 'fruit', tier: 4 }, value: 72 },
  { id: 'brunchboard', city: 'brunch', name: 'Bagel brunch board', a: { chain: 'bakery', tier: 4 }, b: { chain: 'fruit', tier: 3 }, value: 72 },
  { id: 'sunrisebowl', city: 'brunch', name: 'Sunrise smoothie bowl', a: { chain: 'fruit', tier: 5 }, b: { chain: 'coffee', tier: 4 }, value: 150 },
  { id: 'brunchtower', city: 'brunch', name: 'Grand brunch tower', a: { chain: 'coffee', tier: 6 }, b: { chain: 'fruit', tier: 6 }, value: 450 },

  // Sugar Tulip (desserts)
  { id: 'hotchocolate', city: 'dessert', name: 'Hot chocolate', a: { chain: 'cocoa', tier: 2 }, b: { chain: 'icecream', tier: 2 }, value: 21 },
  { id: 'strawcream', city: 'dessert', name: 'Strawberries and cream', a: { chain: 'icecream', tier: 2 }, b: { chain: 'fruit', tier: 2 }, value: 21 },
  { id: 'chocstrawberries', city: 'dessert', name: 'Chocolate strawberries', a: { chain: 'cocoa', tier: 3 }, b: { chain: 'fruit', tier: 1 }, value: 28 },
  { id: 'mintchip', city: 'dessert', name: 'Mint chocolate chip', a: { chain: 'icecream', tier: 3 }, b: { chain: 'cocoa', tier: 2 }, value: 34 },
  { id: 'browniesundae', city: 'dessert', name: 'Brownie sundae', a: { chain: 'cocoa', tier: 4 }, b: { chain: 'icecream', tier: 3 }, value: 72 },
  { id: 'bananasplit', city: 'dessert', name: 'Banana split boat', a: { chain: 'icecream', tier: 4 }, b: { chain: 'fruit', tier: 3 }, value: 72 },
  { id: 'blackforest', city: 'dessert', name: 'Black forest cake', a: { chain: 'cocoa', tier: 5 }, b: { chain: 'fruit', tier: 3 }, value: 125 },
  { id: 'lavacake', city: 'dessert', name: 'Chocolate lava cake', a: { chain: 'cocoa', tier: 5 }, b: { chain: 'icecream', tier: 4 }, value: 150 },
  { id: 'desserttable', city: 'dessert', name: 'Grand dessert table', a: { chain: 'cocoa', tier: 6 }, b: { chain: 'icecream', tier: 6 }, value: 450 },
];

// Which city a recipe belongs to (customers there ask for it). Recipes without one are Toronto's.
export const recipeCity = r => r.city || 'toronto';

// "Simple" recipes use foods up to level 3; "advanced" ones need a level 4 food or higher.
export const recipeLevel = r => Math.max(r.a.tier, r.b.tier) >= 4 ? 'advanced' : 'simple';

// Older saves used some dish names that have since become family recipes.
export const RENAMED_DISHES = {
  creamofwheat: 'granola',
  rugelach: 'muffins',
  buttertart: 'pecanpie',
  cheesescones: 'cheesebread',
};

// Dollars for making a dish for the first time.
export const RECIPE_DISCOVERY_REWARD = 10;
