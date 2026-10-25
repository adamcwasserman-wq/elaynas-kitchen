// La Cocina's kitchen: the same cooking shifts as the bakery (see data/kitchen.js for how they work),
// with Mexican food, a stove and a frozen margarita machine, and its own crew of helpers.
// It keeps its own shifts, tip jar and helpers. Its shifts follow the bakery's difficulty curve
// food for food: a taco is the bagel, a frozen margarita is the coffee, and so on.

import { SHIFTS as BAKERY_SHIFTS, APPLIANCES as BAKERY_APPLIANCES } from './kitchen.js';

// Everything a customer can order (same fields as the bakery's FOODS).
export const FOODS = {
  taco: { name: 'Taco', price: 8, from: 'oven', dough: 'tacoDough', bake: 6 },
  margarita: { name: 'Frozen margarita', price: 6, from: 'coffee' },
  salsaTaco: { name: 'Taco with salsa', price: 12, from: 'topping', on: 'taco', topping: 'salsa' },
  churro: { name: 'Churro', price: 10, from: 'oven', dough: 'churroDough', bake: 8 },
  dulceChurro: { name: 'Churro with dulce de leche', price: 14, from: 'topping', on: 'churro', topping: 'dulce' },
};

export const PANTRY = [
  { id: 'tacoDough', name: 'Taco masa', for: 'taco' },
  { id: 'salsa', name: 'Salsa', for: 'salsaTaco', verb: 'spoon' },
  { id: 'churroDough', name: 'Churro dough', for: 'churro' },
  { id: 'dulce', name: 'Dulce de leche', for: 'dulceChurro', verb: 'drizzle' },
];

// The bakery's foods, and what stands in for each one here.
const SAME = { bagel: 'taco', coffee: 'margarita', creamBagel: 'salsaTaco', pretzel: 'churro', saltPretzel: 'dulceChurro' };

// La Cocina's own news cards, by the bakery card they stand in for.
const INTROS = {
  bagel: { id: 'taco', food: 'taco', title: '¡Bienvenidos a La Cocina!', line: 'Tap the taco masa to cook it on the comal. When it turns golden, tap the stove to put it on a plate, then tap the plate to serve it.' },
  coffee: { id: 'margarita', food: 'margarita', title: 'New: frozen margaritas!', line: 'Tap the margarita machine to pour a glass. Tap the full glass to serve it.' },
  cream: { id: 'salsa', food: 'salsaTaco', title: 'New: tacos with salsa!', line: 'Put a taco on a plate, then tap the salsa to spoon it on.' },
  pretzels: { id: 'churros', food: 'churro', title: 'New: churros!', line: 'Tap the churro dough to cook it. Churros take longer than tacos, so start them early.' },
  cold: { id: 'melt', food: 'margarita', art: 'margaritaCold', title: 'New: margaritas melt!', line: 'A frozen margarita only stays frozen for a little while. Pour one when someone wants it. A melted one has to be tossed.' },
  vips: { id: 'vips', food: 'taco', art: 'vip', title: 'New: VIP customers!', line: 'Special guests drop in now and then. Zip is in a hurry, Pina orders for a party, Bubbie loves churros with dulce de leche, Penny changes her mind, and the food critic reviews how fast you are. They pay extra!' },
  salt: { id: 'dulce', food: 'dulceChurro', title: 'New: dulce de leche!', line: 'Put a churro on a plate, then tap the dulce de leche to drizzle it on.' },
  finale: { id: 'finale', food: 'dulceChurro', art: 'clock', title: 'The fiesta finale!', line: 'The busiest night at La Cocina: three minutes of rush hour, VIPs everywhere, and half the team is out. ¡Vamos!' },
};

// The bakery's 25 shifts, with La Cocina's foods and news cards.
export const SHIFTS = BAKERY_SHIFTS.map(sh => {
  const out = { ...sh, menu: sh.menu.map(f => SAME[f] || f) };
  if (sh.intro) out.intro = INTROS[sh.intro.id] || { ...sh.intro, food: SAME[sh.intro.food] || sh.intro.food };
  return out;
});

// La Cocina's machines: they work like the bakery's, with their own names.
const NAMES = {
  oven: ['Stove', [['Little comal', 'Cooks 2 at a time.'], ['Big comal', 'Cooks 3 at a time, and a bit faster.'], ['Talavera stove', 'Cooks 4 at a time, faster still, and keeps food warm so nothing burns.']]],
  coffee: ['Margarita machine', [['One tank', 'Pours one glass at a time.'], ['Two tanks', 'Pours two glasses at once.'], ['Three tanks', 'Three glasses, and it pours by itself.']]],
  pantry: ['Pantry', [['Open shelves', 'One tap, one dough.'], ['Full shelves', 'Each tap also starts the food a customer is still waiting for.'], ['Painted cupboard', 'Dough for whatever customers are waiting for goes on the stove by itself.']]],
  mixer: ['Masa maker', [['Masa bowl', 'Makes 2 doughs at a time.'], ['Tortilla press', 'Makes 3 doughs at a time, a bit faster.'], ['Masa machine', 'Makes 4 doughs quickly, and starts by itself when a dough runs low.']]],
  prep: ['Prep counter', [['Wooden board', 'Room for 2 plates.'], ['Long board', 'Room for 3 plates.'], ['Tile counter', 'Room for 4 plates.']]],
};
export const APPLIANCES = BAKERY_APPLIANCES.map(a => {
  const n = NAMES[a.id];
  return n ? { ...a, name: n[0], levels: a.levels.map((l, i) => ({ ...l, name: n[1][i][0], perk: n[1][i][1] })) } : a;
});

// La Cocina's crew (same fields as the bakery's HELPERS).
export const HELPERS = [
  { id: 'chili', name: 'Chili', station: 'oven', cost: 150, opens: 8, x: 190,
    job: 'Minds the stove. Puts golden food on a free plate, and tosses anything that burnt.',
    trait: 'Spicy and full of energy.', quips: ['¡Caliente!', 'Hot stuff!', 'Sizzle sizzle!', 'Too spicy? Never!', '¡Vámonos!'] },
  { id: 'melon', name: 'Melon', station: 'coffee', cost: 120, opens: 5, x: 300,
    job: 'Pours margaritas. Starts a glass whenever a customer is waiting for one.',
    trait: 'Cool as ice and sweet as summer.', quips: ['One in a melon!', 'Brain freeze!', 'So refreshing!', 'Salt on the rim!', '¡Salud!'] },
  { id: 'lime', name: 'Lime', station: 'topping', cost: 180, opens: 9, x: 112,
    job: 'Spoons salsa on tacos and drizzles dulce de leche on churros when customers want them.',
    trait: 'A little sour, and a lot of fun.', quips: ['Lime to shine!', 'Zest for life!', 'Squeeze the day!', 'Salsa time!', '¡Olé!'] },
  { id: 'cactus', name: 'Cactus', station: 'dishes', cost: 160, opens: 7, x: 151,
    job: 'Clears dishes off the counter into the dishwasher, and picks up the tips.',
    trait: 'Looks prickly, gives the gentlest hugs.', quips: ['Looking sharp!', 'Stuck on you!', 'Prickly clean!', "Don't desert me!", 'All tidy!'] },
  { id: 'corn', name: 'Corn', station: 'mixer', cost: 170, opens: 6, x: 76,
    job: 'Runs the masa maker. Starts dough when the shelf runs low, and rolls it onto the shelf that needs it.',
    trait: 'Corny jokes, all day long.', quips: ['That is a-maize-ing!', 'Aw, shucks!', 'Corn-gratulations!', 'Ear we go!', 'Pop pop!'] },
];

export const DOUGH_INTRO = { id: 'dough', art: 'dough', title: 'New: the masa maker!', line: 'Dough can run out now. Tap the masa maker to make more. When it is ready, drag the dough onto the taco or churro shelf. It takes the right shape on the way!' };

// How La Cocina looks and talks.
export const COCINA = {
  room: 'mexico', wall: 'pink', ovenArt: 'stove', drinkArt: 'slushie', pourColour: '#8fd05a', drink: 'margarita',
  words: { oven: 'stove', machine: 'margarita machine', cup: 'glass', pour: 'pour', pouring: 'Pouring', cold: 'melted', coldTo: 'melts', mixer: 'masa maker', cook: 'cook', cooking: 'Cooking', doughs: 'taco or churro', bread: 'food' },
  blurb: 'Cook tacos and churros, pour frozen margaritas, serve customers',
  vipWants: { bubbie: 'dulceChurro' },
  foods: FOODS, pantry: PANTRY, shifts: SHIFTS, appliances: APPLIANCES, helpers: HELPERS, doughIntro: DOUGH_INTRO,
};
