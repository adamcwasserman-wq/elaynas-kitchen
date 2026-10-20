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
  pretzel: { name: 'Pretzel', price: 8, from: 'oven', dough: 'pretzelDough', bake: 6 },
  coffee: { name: 'Coffee', price: 5, from: 'coffee' },
  saltPretzel: { name: 'Salted pretzel', price: 12, from: 'topping', on: 'pretzel', topping: 'salt' },
  challah: { name: 'Challah', price: 16, from: 'oven', dough: 'challahDough', bake: 9 },
};

// Things in the pantry. "for" is the first food on the menu that needs it: it only shows up once
// that food is on the menu.
export const PANTRY = [
  { id: 'pretzelDough', name: 'Pretzel dough', for: 'pretzel' },
  { id: 'salt', name: 'Pretzel salt', for: 'saltPretzel' },
  { id: 'challahDough', name: 'Challah dough', for: 'challah' },
];

// Shifts, in order, in five parts that get harder:
//   1 to 4    just her: one new food at a time, no extra chores
//   5 to 8    new chores (cold coffee, the mixer, dirty dishes, a rush) and helpers she can hire
//   9 to 11   everyone's working, it's busy, and VIPs drop in
//   12 to 13  a helper calls in sick each shift
//   14 to 15  two helpers call in sick, more VIPs, and a big rush to finish
// Each has a set number of customers; serving them all ends the shift.
//   menu      what customers can order
//   wantsMax  each customer orders at most this many things (moods can lower it)
//   gap       seconds between customers walking in
//   patience  seconds a customer waits for a one-item order (each extra item adds itemPatience)
//   intro     shown on a card the first time she plays a shift with it (new foods and new rules).
//             The first customer asks for intro.food. "art" picks a picture other than that food.
//   away      how many hired helpers call in sick (picked at random when the shift starts)
//   vip       the chance a new customer is a VIP (see KITCHEN_VIPS)
//   rush      a rush hour shift: customers keep coming until the clock runs out, and stars come
//             from money earned. secs: how long. goals: dollars for 1, 2 and 3 stars at "Just
//             right" (calmer moods get lower goals, busier ones higher).
// After the last shift she can replay any shift she has opened.
const ALL = ['pretzel', 'coffee', 'saltPretzel', 'challah'];
export const SHIFTS = [
  // Part 1: just her.
  { customers: 4, menu: ['pretzel'], wantsMax: 1, gap: 7, patience: 40,
    intro: { id: 'pretzel', food: 'pretzel', title: 'Your first shift!', line: 'Tap the pretzel dough to put it in the oven. When it turns golden, tap the oven to put it on a plate, then tap the plate to serve it.' } },
  { customers: 5, menu: ['pretzel', 'coffee'], wantsMax: 1, gap: 6.5, patience: 38,
    intro: { id: 'coffee', food: 'coffee', title: 'New: coffee!', line: 'Tap the coffee machine to pour a cup. Tap the full cup to serve it.' } },
  { customers: 6, menu: ['pretzel', 'coffee', 'saltPretzel'], wantsMax: 2, gap: 6.5, patience: 36,
    intro: { id: 'salt', food: 'saltPretzel', title: 'New: salted pretzels!', line: 'Put a baked pretzel on a plate, then tap the salt to sprinkle it on.' } },
  { customers: 7, menu: ALL, wantsMax: 2, gap: 6.5, patience: 38,
    intro: { id: 'challah', food: 'challah', title: 'New: challah!', line: 'Tap the challah dough to bake it. It takes longer than pretzels, so start it early.' } },
  // Part 2: more chores, and helpers to hire.
  { customers: 7, menu: ALL, wantsMax: 2, gap: 6.5, patience: 36,
    intro: { id: 'cold', food: 'coffee', art: 'coffeeCold', title: 'New: coffee goes cold!', line: 'A full cup only stays hot for a little while. Pour it when someone wants one. A cold cup has to be tossed.' } },
  { customers: 8, menu: ALL, wantsMax: 2, gap: 6.5, patience: 36 },
  { customers: 8, menu: ALL, wantsMax: 2, gap: 6, patience: 34,
    intro: { id: 'dishes', food: 'pretzel', art: 'dirty', title: 'New: dirty dishes!', line: 'Customers leave their dishes on the counter, and quick service gets a tip there too. Tap the dishes to clear them: nobody new can sit there until you do. They go in the dishwasher and come back clean.' } },
  { customers: 0, menu: ALL, wantsMax: 2, gap: 6, patience: 34, rush: { secs: 90, goals: [120, 180, 240] },
    intro: { id: 'rush', food: 'pretzel', art: 'clock', title: 'Rush hour!', line: 'Customers keep coming until the clock runs out. Earn the money goal for a star, and more for three stars.' } },
  // Part 3: everyone's working, it's busy, and VIPs drop in.
  { customers: 9, menu: ALL, wantsMax: 2, gap: 5.5, patience: 32, vip: .2,
    intro: { id: 'vips', food: 'pretzel', art: 'vip', title: 'New: VIP customers!', line: 'Special guests drop in now and then. Zip is in a hurry, Pina orders for a party, Bubbie loves challah, Penny changes her mind, and the food critic reviews how fast you are. They pay extra!' } },
  { customers: 10, menu: ALL, wantsMax: 2, gap: 5.5, patience: 32, vip: .2 },
  { customers: 0, menu: ALL, wantsMax: 2, gap: 5, patience: 30, vip: .2, rush: { secs: 100, goals: [160, 240, 310] } },
  // Part 4: helpers start calling in sick.
  { away: 1, customers: 10, menu: ALL, wantsMax: 2, gap: 5.5, patience: 32, vip: .25 },
  { away: 1, customers: 11, menu: ALL, wantsMax: 2, gap: 5, patience: 30, vip: .25 },
  // Part 5: the big finish.
  { away: 2, customers: 12, menu: ALL, wantsMax: 2, gap: 5, patience: 30, vip: .3 },
  { away: 2, customers: 0, menu: ALL, wantsMax: 2, gap: 4.5, patience: 30, vip: .3, rush: { secs: 120, goals: [200, 300, 390] } },
];

// VIPs in the kitchen: the same special guests as on the merge board, with kitchen rules.
// Drawn from the merge game's pictures (art is the picture's id).
//   patience  times a normal customer's patience
//   pay       times the normal price
//   items     orders this many things
//   wants     always orders this food
//   tip       always leaves this share of the price as a tip
//   hearts    hearts lost if they leave unhappy (instead of 1)
//   changes   changes one thing in the order partway through the wait
//   review    dollars per golden spoon in the critic's review (3 spoons for very fast, down to 0)
export const KITCHEN_VIPS = [
  { id: 'zip', name: 'Zip', art: 'zip', patience: .5, pay: 2, hearts: 2, hello: 'Zip is here and he is in a hurry! Serve him fast for double pay.' },
  { id: 'party', name: 'Pina', art: 'party', items: 3, pay: 2, hello: 'Pina is ordering for a party: three things, for double pay!' },
  { id: 'bubbie', name: 'Bubbie', art: 'bubbie', wants: 'challah', patience: 2, tip: .5, hello: 'Bubbie came for challah. She is patient, and she tips well.' },
  { id: 'penny', name: 'Penny', art: 'penny', pay: 1.5, changes: true, hello: 'Penny is here. Watch out, she might change her mind!' },
  { id: 'critic', name: 'Monsieur Croissant', art: 'critic', review: 6, hello: 'The food critic! Serve him fast for a three spoon review.' },
];

// Shown the first time she plays a shift where helpers can be hired.
export const HELPERS_INTRO = { id: 'helpers', art: 'helpers', title: 'Helpers can join you now!', line: 'Use your tips to hire food friend helpers. Look under Kitchen helpers on the kitchen card. Each one takes care of a station for you.' };

export const SHIFT_RULES = {
  hearts: 3,            // customers who can leave unhappy before the shift ends (moods add or take away)
  itemPatience: 12,     // extra seconds of waiting for each extra item in an order
  customersMax: 3,      // spots at the counter
  keepWarm: 7,          // seconds a baked food stays golden in the oven before it burns
  pour: 4,              // seconds to pour a coffee at level 1
  hot: 10,              // seconds a full cup stays hot before it goes cold (moods stretch it)
  coldFrom: 5,          // coffee goes cold from this shift on
  dirtyFrom: 7,         // from this shift on, customers leave dirty dishes (and quick-service tips) on the counter
  rushRefill: 1.5,      // rush hour: seconds before an empty spot at the counter fills again
  doughFrom: 6,         // from this shift on, dough runs out and is made at the mixer
  startDough: 2,        // doughs of each kind on the pantry shelf when a shift starts
  doughMax: 6,
  helpersFrom: 5,       // helpers can be hired from this shift on
  vipGap: 2,            // at least this many regular customers between two VIPs          // the most of each dough the shelf holds
  speedTip: 0.25,       // served while the bar is still more than half full: a tip this share of the price
  stars: [0.5, 0.8, 1], // share of customers served happily for 1, 2 and 3 stars (3 also means nobody left)
  openNext: 1,          // stars needed on a shift to open the next one
};

// Shown the first time she plays a shift with the mixer (from SHIFT_RULES.doughFrom).
export const DOUGH_INTRO = { id: 'dough', art: 'dough', title: 'New: the mixer!', line: 'Dough can run out now. Tap the mixer to make more. When it is ready, drag the dough onto the pretzel or challah shelf. It takes the right shape on the way!' };

// Appliances: three levels each, bought with this restaurant's tips. The art grows with them.
//   oven     slots: things baking at once. speed: bake time multiplier. noBurn: food never burns.
//   coffee   cups: cups at once. pour: seconds. auto: empty cups fill by themselves.
//   pantry   smart: a tap on a dough also starts the bread a customer is still waiting for.
//            auto: dough for bread a customer is waiting for goes in the oven by itself.
//   prep     plates: plates on the board.
//   bin      holds: things she can throw out before it's full and the shift is over (moods add or take away).
//            compost: seconds for the compost bin to free up one space.
//   dishwasher  secs: how long a load of plates takes to wash.
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
  { id: 'bin', name: 'Garbage bin', levels: [
    { name: 'Green bin', perk: 'Holds 5 things before it is full.', holds: 5 },
    { name: 'Big bin', perk: 'Holds 7 things.', cost: 150, holds: 7 },
    { name: 'Compost bin', perk: 'Holds 8, and turns waste into compost: one space frees up every 20 seconds.', cost: 500, holds: 8, compost: 20 }] },
  { id: 'dishwasher', name: 'Dishwasher', levels: [
    { name: 'Little dishwasher', perk: 'Washes a load in 4 seconds.', secs: 4 },
    { name: 'Big dishwasher', perk: 'Washes a load in 2.5 seconds.', cost: 200, secs: 2.5 },
    { name: 'Steam washer', perk: 'Washes a load in just 1 second.', cost: 650, secs: 1 }] },
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
  { id: 'strawberry', name: 'Strawberry', station: 'oven', cost: 150, opens: 5, x: 190,
    job: 'Minds the oven. Puts golden food on a free plate, and tosses anything that burnt.' },
  { id: 'bean', name: 'Bean', station: 'coffee', cost: 120, opens: 5, x: 300,
    job: 'Pours coffee. Starts a cup whenever a customer is waiting for one.' },
  { id: 'avocado', name: 'Avocado', station: 'topping', cost: 180, opens: 5, x: 112,
    job: 'Sprinkles salt on a plated pretzel when a customer wants one.' },
  { id: 'mushroom', name: 'Mushroom', station: 'dishes', cost: 160, opens: 7, x: 151,
    job: 'Clears dishes off the counter into the dishwasher, and picks up the tips.' },
  { id: 'cinnamon', name: 'Cinnamon Roll', station: 'mixer', cost: 170, opens: 6, x: 76,
    job: 'Runs the mixer. Starts dough when the shelf runs low, and rolls it onto the shelf that needs it.' },
];

// Why a helper isn't at work today (shifts with "away"). Just for fun.
export const EXCUSES = [
  'Going to a Backstreet Boys concert!',
  'Has a fever. Too much Tamagotchi care last night.',
  'Low energy. Stayed up all night waiting for the dial-up to connect.',
  'Waiting in line for a Furby.',
  'Taping songs off the radio for a mixtape.',
  'Practicing the Macarena.',
  'Returning tapes to Blockbuster before they are late.',
  'Seeing Titanic at the movies. For the fifth time.',
  'Watching the Spice Girls movie. Again.',
  'Stuck playing Snake on a brick phone.',
  'Learning every NSYNC dance move.',
  'Their pager will not stop beeping.',
  'Rollerblading to the arcade.',
  'Making a homepage with sparkly GIFs.',
  'Trading Pokemon cards at recess.',
  'Feeding their Tamagotchi. It is a full time job.',
  'Getting a new Lisa Frank folder at the mall.',
  'Blowing into a Nintendo cartridge until it works.',
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
