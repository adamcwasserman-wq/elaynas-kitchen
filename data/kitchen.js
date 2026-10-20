// Cooking shifts: the Cooking Fever style kitchen inside each restaurant.
// Grab dough from the pantry, bake it in the oven, plate it, add toppings, pour drinks, and tap
// a finished food to hand it to the customer who wants it.
// Only the bakery (Toronto) has a kitchen so far. Tips go into that restaurant's tip jar, and a
// share goes to Island dollars, the same as serving on the merge board.
// Times are in seconds. Prices are dollars.

// Everything a customer can order in the bakery.
//   price   what the customer pays for it
//   from    where it's made: 'oven' (dough baked into it), 'coffee' (poured), or 'topping' (added to a plate)
//   dough   for oven foods: which dough in the pantry makes it
//   bake    how long it takes in a level 1 oven
//   on      for toppings: the food it goes on top of
export const FOODS = {
  bagel: { name: 'Bagel', price: 8, from: 'oven', dough: 'bagelDough', bake: 6 },
  coffee: { name: 'Coffee', price: 5, from: 'coffee' },
  creamBagel: { name: 'Cream cheese bagel', price: 12, from: 'topping', on: 'bagel', topping: 'creamCheese' },
  challah: { name: 'Challah', price: 16, from: 'oven', dough: 'challahDough', bake: 9 },
};

// Things in the pantry. "for" is the first food on the menu that needs it: it only shows up once
// that food is on the menu.
export const PANTRY = [
  { id: 'bagelDough', name: 'Bagel dough', for: 'bagel' },
  { id: 'creamCheese', name: 'Cream cheese', for: 'creamBagel' },
  { id: 'challahDough', name: 'Challah dough', for: 'challah' },
];

// Shifts, in order. Each has a set number of customers; serving them all ends the shift.
//   menu      what customers can order
//   wantsMax  each customer orders at most this many things (moods can lower it)
//   gap       seconds between customers walking in
//   patience  seconds a customer waits for a one-item order (each extra item adds itemPatience)
//   intro     shown on a card the first time this shift starts (new foods and new rules).
//             The first customer asks for intro.food. "art" picks a picture other than that food.
//   rush      a rush hour shift: customers keep coming until the clock runs out, and stars come
//             from money earned. secs: how long. goals: dollars for 1, 2 and 3 stars at "Just
//             right" (calmer moods get lower goals, busier ones higher).
// After the last shift she can replay any shift she has opened.
export const SHIFTS = [
  { customers: 4, menu: ['bagel'], wantsMax: 1, gap: 7, patience: 40,
    intro: { food: 'bagel', title: 'Your first shift!', line: 'Tap the bagel dough to put it in the oven. When it turns golden, tap the oven to put it on a plate, then tap the plate to serve it.' } },
  { customers: 5, menu: ['bagel', 'coffee'], wantsMax: 1, gap: 6.5, patience: 36,
    intro: { food: 'coffee', title: 'New: coffee!', line: 'Tap the coffee machine to pour a cup. Tap the full cup to serve it.' } },
  { customers: 6, menu: ['bagel', 'coffee'], wantsMax: 2, gap: 6.5, patience: 34,
    intro: { food: 'coffee', art: 'coffeeCold', title: 'New: coffee goes cold!', line: 'A full cup only stays hot for a little while. Pour it when someone wants one. A cold cup has to be tossed.' } },
  { customers: 7, menu: ['bagel', 'coffee', 'creamBagel'], wantsMax: 2, gap: 6.5, patience: 34,
    intro: { food: 'creamBagel', title: 'New: cream cheese bagels!', line: 'Put a baked bagel on a plate, then tap the cream cheese to spread it on.' } },
  { customers: 8, menu: ['bagel', 'coffee', 'creamBagel'], wantsMax: 2, gap: 6, patience: 32,
    intro: { food: 'bagel', art: 'dirty', title: 'New: dirty plates!', line: 'After a customer eats, their plate comes back dirty. Tap a dirty plate to wash it before you use it again.' } },
  { customers: 8, menu: ['bagel', 'coffee', 'creamBagel', 'challah'], wantsMax: 2, gap: 6.5, patience: 36,
    intro: { food: 'challah', title: 'New: challah!', line: 'Tap the challah dough to bake it. It takes longer than bagels, so start it early.' } },
  { customers: 0, menu: ['bagel', 'coffee', 'creamBagel', 'challah'], wantsMax: 2, gap: 6, patience: 34, rush: { secs: 90, goals: [140, 210, 280] },
    intro: { food: 'bagel', art: 'clock', title: 'Rush hour!', line: 'Customers keep coming until the clock runs out. Earn the money goal for a star, and more for three stars.' } },
  { customers: 10, menu: ['bagel', 'coffee', 'creamBagel', 'challah'], wantsMax: 2, gap: 5.5, patience: 32 },
  { customers: 11, menu: ['bagel', 'coffee', 'creamBagel', 'challah'], wantsMax: 2, gap: 5, patience: 30 },
  { customers: 0, menu: ['bagel', 'coffee', 'creamBagel', 'challah'], wantsMax: 2, gap: 4.5, patience: 30, rush: { secs: 120, goals: [190, 285, 375] } },
];

export const SHIFT_RULES = {
  hearts: 3,            // customers who can leave unhappy before the shift ends (moods add or take away)
  itemPatience: 12,     // extra seconds of waiting for each extra item in an order
  customersMax: 3,      // spots at the counter
  keepWarm: 7,          // seconds a baked food stays golden in the oven before it burns
  pour: 4,              // seconds to pour a coffee at level 1
  hot: 10,              // seconds a full cup stays hot before it goes cold (moods stretch it)
  coldFrom: 3,          // coffee goes cold from this shift on
  dirtyFrom: 5,         // plates come back dirty from this shift on
  rushRefill: 1.5,      // rush hour: seconds before an empty spot at the counter fills again
  doughFrom: 3,         // from this shift on, dough runs out and is made at the mixer
  startDough: 2,        // doughs of each kind on the pantry shelf when a shift starts
  doughMax: 6,          // the most of each dough the shelf holds
  binMax: 5,            // things she can throw out (burnt, cold, tossed) before the bin is full and the shift is over (moods add or take away)
  speedTip: 0.25,       // served while the bar is still more than half full: a tip this share of the price
  stars: [0.5, 0.8, 1], // share of customers served happily for 1, 2 and 3 stars (3 also means nobody left)
  openNext: 1,          // stars needed on a shift to open the next one
};

// Shown the first time she plays a shift with the mixer (from SHIFT_RULES.doughFrom).
export const DOUGH_INTRO = { id: 'dough', art: 'dough', title: 'New: the mixer!', line: 'Dough can run out now. Tap the mixer to make more. When it is ready, drag the dough onto the bagel or challah shelf. It takes the right shape on the way!' };

// Appliances: three levels each, bought with this restaurant's tips. The art grows with them.
//   oven     slots: things baking at once. speed: bake time multiplier. noBurn: food never burns.
//   coffee   cups: cups at once. pour: seconds. auto: empty cups fill by themselves.
//   pantry   smart: a tap on a dough also starts the bread a customer is still waiting for.
//            auto: dough for bread a customer is waiting for goes in the oven by itself.
//   prep     plates: plates on the board.
//   mixer    batch: doughs made at a time. secs: how long a batch takes. auto: starts a batch by itself when a dough runs low.
//            The finished dough waits in the mixer until she drags it onto a shelf.
export const APPLIANCES = [
  { id: 'oven', name: 'Oven', levels: [
    { name: 'Little oven', perk: 'Bakes 2 at a time.', slots: 2, speed: 1 },
    { name: 'Big oven', perk: 'Bakes 3 at a time, and a bit faster.', cost: 250, slots: 3, speed: 0.85 },
    { name: 'Brick hearth', perk: 'Bakes 4 at a time, faster still, and keeps food warm so nothing burns.', cost: 900, slots: 4, speed: 0.7, noBurn: true }] },
  { id: 'coffee', name: 'Coffee', levels: [
    { name: 'Drip machine', perk: 'Pours one cup at a time.', cups: 1, pour: 4 },
    { name: 'Double brewer', perk: 'Pours two cups at once.', cost: 200, cups: 2, pour: 3.5 },
    { name: 'Golden espresso', perk: 'Three cups, and it pours by itself.', cost: 750, cups: 3, pour: 3, auto: true }] },
  { id: 'pantry', name: 'Pantry', levels: [
    { name: 'Open shelves', perk: 'One tap, one dough.' },
    { name: 'Full shelves', perk: 'Each tap also starts the bread a customer is still waiting for.', cost: 150, smart: true },
    { name: 'Glass fridge', perk: 'Dough for whatever customers are waiting for goes in the oven by itself.', cost: 600, smart: true, auto: true }] },
  { id: 'mixer', name: 'Mixer', levels: [
    { name: 'Mixing bowl', perk: 'Makes 2 doughs at a time.', batch: 2, secs: 5 },
    { name: 'Stand mixer', perk: 'Makes 3 doughs at a time, a bit faster.', cost: 220, batch: 3, secs: 4 },
    { name: 'Dough machine', perk: 'Makes 4 doughs quickly, and starts by itself when a dough runs low.', cost: 800, batch: 4, secs: 3, auto: true }] },
  { id: 'prep', name: 'Prep counter', levels: [
    { name: 'Small board', perk: 'Room for 2 plates.', plates: 2 },
    { name: 'Long board', perk: 'Room for 3 plates.', cost: 200, plates: 3 },
    { name: 'Marble counter', perk: 'Room for 4 plates.', cost: 750, plates: 4 }] },
];

// Which restaurants have a kitchen. More arrive one at a time.
export const KITCHEN_CITIES = ['toronto'];

// Helpers: food friends hired once with this restaurant's tips. Every hired helper works every
// shift, minding one station and standing on the kitchen floor under it.
//   station  which station they mind: 'oven', 'coffee' or 'topping'
//   opens    the shift number (1 to 10) that has to be open before she can hire them
//   x        where they stand on the kitchen floor
export const HELPERS = [
  { id: 'strawberry', name: 'Strawberry', station: 'oven', cost: 150, opens: 1, x: 190,
    job: 'Minds the oven. Puts golden food on a free plate, and tosses anything that burnt.' },
  { id: 'bean', name: 'Bean', station: 'coffee', cost: 120, opens: 2, x: 300,
    job: 'Pours coffee. Starts a cup whenever a customer is waiting for one.' },
  { id: 'avocado', name: 'Avocado', station: 'topping', cost: 180, opens: 4, x: 112,
    job: 'Spreads cream cheese on a plated bagel when a customer wants one.' },
];

// Helpers get better when she trains them with tips. Level 1 is where they start when hired.
//   cost   tips to train a helper up to this level
//   every  seconds a helper rests between jobs
//   hit    chance a job goes right (a miss is an "oops" and a rest)
export const HELPER_LEVELS = [
  { every: 3.2, hit: .65 },
  { cost: 120, every: 2.6, hit: .75 },
  { cost: 250, every: 2, hit: .85 },
  { cost: 450, every: 1.5, hit: .93 },
  { cost: 700, every: 1, hit: 1 },
];
// Before training cost tips, helpers levelled up by doing jobs. Older saves keep the level they earned.
export const OLD_HELPER_JOBS = [0, 12, 35, 80, 150];
