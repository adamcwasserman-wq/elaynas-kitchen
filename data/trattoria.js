// The Trattoria's kitchen: the same cooking shifts as the bakery (see data/kitchen.js for how they
// work), with Italian food, a wood-fired pizza oven and a gelato case, and its own crew of helpers.
// It keeps its own shifts, tip jar and helpers. Its shifts follow the bakery's difficulty curve
// food for food: a pizza is the bagel, gelato is the coffee, and so on.

import { themedShifts, renamedAppliances } from './kitchen.js';

export const FOODS = {
  pizza: { name: 'Pizza', price: 8, from: 'oven', dough: 'pizzaDough', bake: 6 },
  gelato: { name: 'Gelato', price: 6, from: 'coffee' },
  pepperoniPizza: { name: 'Pepperoni pizza', price: 12, from: 'topping', on: 'pizza', topping: 'pepperoni' },
  lasagna: { name: 'Lasagna', price: 10, from: 'oven', dough: 'lasagnaDough', bake: 8 },
  parmLasagna: { name: 'Lasagna with parmesan', price: 14, from: 'topping', on: 'lasagna', topping: 'parmesan' },
};

export const PANTRY = [
  { id: 'pizzaDough', name: 'Pizza dough', for: 'pizza' },
  { id: 'pepperoni', name: 'Pepperoni', for: 'pepperoniPizza', verb: 'lay' },
  { id: 'lasagnaDough', name: 'Lasagna sheets', for: 'lasagna' },
  { id: 'parmesan', name: 'Parmesan', for: 'parmLasagna', verb: 'grate' },
];

// The bakery's foods, and what stands in for each one here.
const SAME = { bagel: 'pizza', coffee: 'gelato', creamBagel: 'pepperoniPizza', pretzel: 'lasagna', saltPretzel: 'parmLasagna' };

// The Trattoria's own news cards, by the bakery card they stand in for.
const INTROS = {
  bagel: { id: 'pizza', food: 'pizza', title: 'Benvenuti alla Trattoria!', line: 'Tap the pizza dough to bake it in the wood-fired oven. When it turns golden, tap the oven to put it on a plate, then tap the plate to serve it.' },
  coffee: { id: 'gelato', food: 'gelato', title: 'New: gelato!', line: 'Tap the gelato case to scoop a cup. Tap the full cup to serve it.' },
  cream: { id: 'pepperoni', food: 'pepperoniPizza', title: 'New: pepperoni pizza!', line: 'Put a pizza on a plate, then tap the pepperoni to lay it on.' },
  pretzels: { id: 'lasagna', food: 'lasagna', title: 'New: lasagna!', line: 'Tap the lasagna sheets to bake a lasagna. It takes longer than pizza, so start it early.' },
  cold: { id: 'melt', food: 'gelato', art: 'gelatoCold', title: 'New: gelato melts!', line: 'A scoop of gelato only stays frozen for a little while. Scoop one when someone wants it. A melted one has to be tossed.' },
  vips: { id: 'vips', food: 'pizza', art: 'vip', title: 'New: VIP customers!', line: 'Special guests drop in now and then. Zip is in a hurry, Pina orders for a party, Bubbie loves lasagna with parmesan, Penny changes her mind, and the food critic reviews how fast you are. They pay extra!' },
  salt: { id: 'parmesan', food: 'parmLasagna', title: 'New: parmesan!', line: 'Put a lasagna on a plate, then tap the parmesan to grate it on.' },
  finale: { id: 'finale', food: 'parmLasagna', art: 'clock', title: 'The grand finale!', line: 'The busiest night at the Trattoria: three minutes of rush hour, VIPs everywhere, and half the team is out. Andiamo!' },
};

export const SHIFTS = themedShifts(SAME, INTROS);

// The Trattoria's machines: they work like the bakery's, with their own names.
const NAMES = {
  oven: ['Pizza oven', [['Little brick oven', 'Bakes 2 at a time.'], ['Big brick oven', 'Bakes 3 at a time, and a bit faster.'], ['Tiled dome oven', 'Bakes 4 at a time, faster still, and keeps food warm so nothing burns.']]],
  coffee: ['Gelato case', [['One tub', 'Scoops one cup at a time.'], ['Two tubs', 'Scoops two cups at once.'], ['Three tubs', 'Three cups, and it scoops by itself.']]],
  pantry: ['Pantry', [['Open shelves', 'One tap, one dough.'], ['Full shelves', 'Each tap also starts the food a customer is still waiting for.'], ['Marble larder', 'Dough for whatever customers are waiting for goes in the oven by itself.']]],
  mixer: ['Pasta maker', [['Dough bowl', 'Makes 2 doughs at a time.'], ['Pasta roller', 'Makes 3 doughs at a time, a bit faster.'], ['Pasta machine', 'Makes 4 doughs quickly, and starts by itself when a dough runs low.']]],
  prep: ['Prep counter', [['Wooden board', 'Room for 2 plates.'], ['Long board', 'Room for 3 plates.'], ['Marble counter', 'Room for 4 plates.']]],
};
export const APPLIANCES = renamedAppliances(NAMES);

export const HELPERS = [
  { id: 'garlic', name: 'Garlic', station: 'oven', cost: 150, opens: 8, x: 190,
    job: 'Minds the oven. Puts golden food on a free plate, and tosses anything that burnt.',
    trait: 'A big personality with a fancy moustache.', quips: ['Mamma mia!', 'Hot from the oven!', 'Garlic-ious!', 'Bellissimo!', 'Andiamo!'] },
  { id: 'olive', name: 'Olive', station: 'coffee', cost: 120, opens: 5, x: 300,
    job: 'Scoops gelato. Starts a cup whenever a customer is waiting for one.',
    trait: 'Smooth, classy, and always in a bow tie.', quips: ['Olive you!', 'Scoop scoop!', 'Gelato time!', 'Cool as can be!', 'Ciao!'] },
  { id: 'basil', name: 'Basil', station: 'topping', cost: 180, opens: 9, x: 112,
    job: 'Lays pepperoni on pizzas and grates parmesan on lasagna when customers want them.',
    trait: 'Fresh as a spring morning.', quips: ['Basil-utely!', 'Fresh!', 'Pepperoni party!', 'A little sprinkle!', 'Perfetto!'] },
  { id: 'meatball', name: 'Meatball', station: 'dishes', cost: 160, opens: 7, x: 151,
    job: 'Clears dishes off the counter into the dishwasher, and picks up the tips.',
    trait: 'Round, cheerful, and never without a napkin.', quips: ['Grazie!', 'Squeaky clean!', 'Polpetta power!', "That's a spicy meatball!", 'All done!'] },
  { id: 'penne', name: 'Penne', station: 'mixer', cost: 170, opens: 6, x: 76,
    job: 'Runs the pasta maker. Starts dough when the shelf runs low, and rolls it onto the shelf that needs it.',
    trait: 'Always rolling with it.', quips: ['Pasta la vista!', 'Use your noodle!', 'Al dente!', "Doughn't worry!", 'Roll with it!'] },
];

export const DOUGH_INTRO = { id: 'dough', art: 'dough', title: 'New: the pasta maker!', line: 'Dough can run out now. Tap the pasta maker to make more. When it is ready, drag the dough onto the pizza or lasagna shelf. It takes the right shape on the way!' };

// How the Trattoria looks and talks.
export const TRATTORIA = {
  room: 'rome', wall: 'ochre', ovenArt: 'pizzaOven', drinkArt: 'gelatoCase', pourColour: '#f6b3c8', drink: 'gelato',
  words: { oven: 'oven', machine: 'gelato case', cup: 'cup', pour: 'scoop', pouring: 'Scooping', cold: 'melted', coldTo: 'melts', goCold: 'melt', mixer: 'pasta maker', cook: 'bake', cooking: 'Baking', doughs: 'pizza or lasagna', bread: 'food' },
  blurb: 'Bake pizza and lasagna, scoop gelato, serve customers',
  vipWants: { bubbie: 'parmLasagna' },
  foods: FOODS, pantry: PANTRY, shifts: SHIFTS, appliances: APPLIANCES, helpers: HELPERS, doughIntro: DOUGH_INTRO,
};
