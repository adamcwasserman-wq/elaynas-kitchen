// Restaurant upgrades. Every restaurant has the same twelve, and each one changes the game in
// its own way. Each has three levels: buy level 1 first, then climb. The look and the names
// change with the restaurant (see THEMES below), but what an upgrade does is the same everywhere.
//
// The ladder: level 2 opens when the restaurant has a 1-star rating, level 3 at 2 stars
// (LEVEL_NEEDS). Level 2 costs about 2.5 times level 1, and level 3 about 5 times, and each
// level does more than the one before, so climbing is always worth it.
// "cost" is the Toronto price (see upgradeCost in data/cities.js for the other restaurants).
//
// Effects (each level adds its own on top of the levels before it):
//   orderBonus    customers pay this much more (0.05 = 5%)
//   patience      customers wait this much longer before their bar runs out (0.15 = 15% longer)
//   starterBonus  extra chance a starter block gives a level 2 food
//   doubleDrop    chance one tap on a starter block gives two foods
//   luckyMerge    chance a merge jumps up two levels instead of one
//   hearts        extra complaints allowed before the round starts over
//   tipBonus      speed tips are this much bigger (0.5 = 50% bigger)
//   dishBonus     dishes pay this much more
//   vipChance     VIPs drop in this much more often (added to VIP_RULES.chance)
//   vipGems       extra gems from every VIP
//   starChance    chance an order gives one bonus star
//   gemChance     chance a happy customer leaves a gem
//   wildEvery     a wild card appears every this many customers served (the smallest number counts)

export const LEVEL_NEEDS = [0, 1, 2];

export const UPGRADES = [
  { id: 'paint', choice: 'paint', what: 'Customers pay more', levels: [
    { cost: 40, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
    { cost: 100, perk: 'Customers pay another 5% more.', effect: { orderBonus: 0.05 } },
    { cost: 200, perk: 'Customers pay another 10% more.', effect: { orderBonus: 0.10 } }] },
  { id: 'awning', choice: 'awning', what: 'Customers wait longer', levels: [
    { cost: 80, perk: 'Customers wait 15% longer before they get upset.', effect: { patience: 0.15 } },
    { cost: 200, perk: 'Customers wait another 15% longer.', effect: { patience: 0.15 } },
    { cost: 400, perk: 'Customers wait another 20% longer.', effect: { patience: 0.20 } }] },
  { id: 'tulips', what: 'Better starter foods', levels: [
    { cost: 140, perk: 'Starter blocks give a level 2 food more often.', effect: { starterBonus: 0.06 } },
    { cost: 350, perk: 'Level 2 foods even more often.', effect: { starterBonus: 0.06 } },
    { cost: 700, perk: 'Level 2 foods about one tap in four.', effect: { starterBonus: 0.08 } }] },
  { id: 'trees', what: 'Two for one taps', levels: [
    { cost: 200, perk: 'Sometimes one tap gives you two foods.', effect: { doubleDrop: 0.08 } },
    { cost: 500, perk: 'Two foods from one tap more often.', effect: { doubleDrop: 0.08 } },
    { cost: 1000, perk: 'Two foods about one tap in four.', effect: { doubleDrop: 0.09 } }] },
  { id: 'oven', what: 'Lucky merges', levels: [
    { cost: 300, perk: 'Sometimes a merge jumps up two levels!', effect: { luckyMerge: 0.04 } },
    { cost: 750, perk: 'Lucky merges happen more often.', effect: { luckyMerge: 0.04 } },
    { cost: 1500, perk: 'Lucky merges about one in eight.', effect: { luckyMerge: 0.05 } }] },
  { id: 'display', what: 'Dishes pay more', levels: [
    { cost: 400, perk: 'Dishes pay 10% more.', effect: { dishBonus: 0.10 } },
    { cost: 1000, perk: 'Dishes pay another 10% more.', effect: { dishBonus: 0.10 } },
    { cost: 2000, perk: 'Dishes pay another 15% more.', effect: { dishBonus: 0.15 } }] },
  { id: 'bench', what: 'More hearts', levels: [
    { cost: 550, perk: 'One more heart: customers forgive one more wait.', effect: { hearts: 1 } },
    { cost: 1375, perk: 'Customers also wait 10% longer.', effect: { patience: 0.10 } },
    { cost: 2750, perk: 'One more heart again.', effect: { hearts: 1 } }] },
  { id: 'lights', what: 'Bigger speed tips', levels: [
    { cost: 700, perk: 'Speed tips are 25% bigger.', effect: { tipBonus: 0.25 } },
    { cost: 1750, perk: 'Speed tips another 25% bigger.', effect: { tipBonus: 0.25 } },
    { cost: 3500, perk: 'Speed tips another 50% bigger.', effect: { tipBonus: 0.50 } }] },
  { id: 'neon', what: 'Bonus stars', levels: [
    { cost: 900, perk: 'Some customers give a bonus star.', effect: { starChance: 0.15 } },
    { cost: 2250, perk: 'Bonus stars more often.', effect: { starChance: 0.15 } },
    { cost: 4500, perk: 'Bonus stars from half your customers.', effect: { starChance: 0.20 } }] },
  { id: 'patio', what: 'More VIPs', levels: [
    { cost: 1100, perk: 'VIPs drop in more often.', effect: { vipChance: 0.10 } },
    { cost: 2750, perk: 'Every VIP gives 1 extra gem.', effect: { vipGems: 1 } },
    { cost: 5500, perk: 'VIPs come even more often, and give another extra gem.', effect: { vipChance: 0.10, vipGems: 1 } }] },
  { id: 'bunting', what: 'Gem tips', levels: [
    { cost: 1400, perk: 'Now and then a happy customer leaves a gem.', effect: { gemChance: 0.04 } },
    { cost: 3500, perk: 'Gems more often.', effect: { gemChance: 0.03 } },
    { cost: 7000, perk: 'Gems from about one customer in eight.', effect: { gemChance: 0.05 } }] },
  { id: 'rooftop', what: 'Free wild cards', levels: [
    { cost: 1800, perk: 'A wild card for every 20 customers you serve.', effect: { wildEvery: 20 } },
    { cost: 4500, perk: 'A wild card every 15 customers.', effect: { wildEvery: 15 } },
    { cost: 9000, perk: 'A wild card every 10 customers.', effect: { wildEvery: 10 } }] },
];

// Each restaurant dresses its upgrades in its own style. The names show in the list and on the
// celebration card, and js/art.js draws each one to match (restaurantSvg, by theme).
// "choices": colours she can pick for the paint and awning. The first one is where she starts.
export const THEMES = {
  toronto: {
    style: 'deli',
    choices: {
      paint: [
        { name: 'Peach', colour: '#ffd9b8' },
        { name: 'Mint', colour: '#cdeedb' },
        { name: 'Lilac', colour: '#e6d6f3' },
        { name: 'Butter', colour: '#fff0b3' },
        { name: 'Sky', colour: '#d3ecf6' },
      ],
      awning: [
        { name: 'Eggplant', colour: '#5b2c6f' },
        { name: 'Tulip pink', colour: '#e8475f' },
        { name: 'Tomato', colour: '#e2412f' },
        { name: 'Teal', colour: '#2f8a8f' },
      ],
    },
    upgrades: {
      paint: { name: 'Paint', levels: ['Fresh coat of paint', 'Painted trim', 'Hand-painted tiles'] },
      awning: { name: 'Awning', levels: ['Striped awning', 'Awning with gold tassels', 'Tulip-print awning'] },
      tulips: { name: 'Window boxes', levels: ['Tulip window boxes', 'Overflowing flower boxes', 'Butterfly garden boxes'] },
      trees: { name: 'Potted trees', levels: ['Potted trees by the door', 'Blossoming trees', 'Twinkling topiaries'] },
      oven: { name: 'Bagel oven', levels: ['Brick bagel oven', 'Oven puffing fresh bread smell', 'Famous golden bagel chimney'] },
      display: { name: 'Bakery window', levels: ['Bagels and challah in the window', 'Tiered cake stand', '"Fresh today" showcase'] },
      bench: { name: 'Bench', levels: ['Bench out front', 'Comfy cushioned bench', 'Bench under a lamp post'] },
      lights: { name: 'String lights', levels: ['String lights', 'Rainbow lights', 'Glowing lights everywhere'] },
      neon: { name: 'Neon sign', levels: ['Neon OPEN sign', 'Neon window frame', 'Neon bagel'] },
      patio: { name: 'Patio', levels: ['Sidewalk patio', 'Patio with planters', 'Twinkly patio'] },
      bunting: { name: 'Bunting', levels: ['Tulip bunting', 'Double bunting', 'Bunting and rooftop flags'] },
      rooftop: { name: 'Rooftop garden', levels: ['Rooftop garden', 'Garden with a trellis', 'Sunflower roof'] },
    },
  },
  mexico: {
    style: 'mexico',
    choices: {
      paint: [
        { name: 'Bubblegum', colour: '#ffc6d9' },
        { name: 'Mango', colour: '#ffd27a' },
        { name: 'Turquoise', colour: '#a8e3dc' },
        { name: 'Lime', colour: '#d6ef9a' },
        { name: 'Papaya', colour: '#ffb58a' },
      ],
      awning: [
        { name: 'Fiesta pink', colour: '#e8475f' },
        { name: 'Marigold', colour: '#f39a1e' },
        { name: 'Turquoise', colour: '#1f9e9a' },
        { name: 'Purple', colour: '#7b3fa0' },
      ],
    },
    upgrades: {
      paint: { name: 'Bright paint', levels: ['Bright stucco paint', 'Painted flower border', 'Talavera tiles'] },
      awning: { name: 'Sarape awning', levels: ['Sarape-striped awning', 'Awning with pom-poms', 'Awning with a painted sun'] },
      tulips: { name: 'Marigold pots', levels: ['Marigold pots', 'Marigolds and bougainvillea', 'Hummingbird visitors'] },
      trees: { name: 'Potted cacti', levels: ['Cacti in clay pots', 'Blooming cacti', 'Cacti wrapped in lights'] },
      oven: { name: 'Tortilla comal', levels: ['Clay chimney for the comal', 'Chimney puffing warm tortilla smell', 'Golden sun chimney'] },
      display: { name: 'Pan dulce window', levels: ['Pan dulce in the window', 'Jar of churros', 'Star piñata'] },
      bench: { name: 'Painted bench', levels: ['Painted wooden bench', 'Bench with a sarape blanket', 'Bench with a guitar'] },
      lights: { name: 'Paper lanterns', levels: ['Paper lanterns', 'Rainbow lanterns', 'Lanterns down the street'] },
      neon: { name: 'Neon sign', levels: ['Neon TACOS sign', 'Neon window frame', 'Neon chili pepper'] },
      patio: { name: 'Palapa patio', levels: ['Patio with a straw umbrella', 'Patio with cactus planters', 'Patio under lanterns'] },
      bunting: { name: 'Papel picado', levels: ['Papel picado', 'Double papel picado', 'Papel picado and rooftop flags'] },
      rooftop: { name: 'Rooftop garden', levels: ['Rooftop chili garden', 'Bougainvillea trellis', 'Rooftop corn field'] },
    },
  },
  rome: {
    style: 'rome',
    choices: {
      paint: [
        { name: 'Ochre', colour: '#f2c46d' },
        { name: 'Terracotta', colour: '#eaa07a' },
        { name: 'Lemon', colour: '#fbe48a' },
        { name: 'Sage', colour: '#cfe0b8' },
        { name: 'Rose', colour: '#f6c9c0' },
      ],
      awning: [
        { name: 'Basil green', colour: '#3f9b3c' },
        { name: 'Tomato red', colour: '#d7372a' },
        { name: 'Navy', colour: '#2b4a7a' },
        { name: 'Eggplant', colour: '#5b2c6f' },
      ],
    },
    upgrades: {
      paint: { name: 'Plaster', levels: ['Warm plaster walls', 'Stone corners', 'Lemon tiles'] },
      awning: { name: 'Awning', levels: ['Scalloped awning', 'Awning with gold tassels', 'Lemon-print awning'] },
      tulips: { name: 'Window boxes', levels: ['Geranium window boxes', 'Trailing ivy', 'Butterflies in the geraniums'] },
      trees: { name: 'Lemon trees', levels: ['Lemon trees in pots', 'Trees full of lemons', 'Lemon trees with fairy lights'] },
      oven: { name: 'Pizza oven', levels: ['Wood-fired pizza oven', 'Chimney puffing pizza smell', 'Golden pizza chimney'] },
      display: { name: 'Pasta window', levels: ['Fresh pasta in the window', 'Gelato counter', '"Fatto a mano" sign'] },
      bench: { name: 'Café table', levels: ['Café table for two', 'Checkered tablecloth', 'Scooter parked out front'] },
      lights: { name: 'Globe lights', levels: ['Café globe lights', 'Coloured globes', 'Globes down the street'] },
      neon: { name: 'Neon sign', levels: ['Neon PIZZA sign', 'Neon window frame', 'Neon espresso cup'] },
      patio: { name: 'Piazza patio', levels: ['Patio with a market umbrella', 'Patio with planters', 'Grapevine pergola'] },
      bunting: { name: 'Flag bunting', levels: ['Green, white and red bunting', 'Double bunting', 'Bunting and rooftop flags'] },
      rooftop: { name: 'Rooftop garden', levels: ['Rooftop basil pots', 'Tomato vine trellis', 'Rooftop lemon grove'] },
    },
  },
  japan: {
    style: 'japan',
    choices: {
      paint: [
        { name: 'Rice white', colour: '#f6f0e4' },
        { name: 'Sakura', colour: '#f6d3dc' },
        { name: 'Matcha', colour: '#d6e6c0' },
        { name: 'Sky', colour: '#d3ecf6' },
        { name: 'Sand', colour: '#eadbc0' },
      ],
      awning: [
        { name: 'Red', colour: '#c8323a' },
        { name: 'Indigo', colour: '#2b3a6b' },
        { name: 'Ink black', colour: '#3a2a2a' },
        { name: 'Teal', colour: '#2f8a8f' },
      ],
    },
    upgrades: {
      paint: { name: 'Walls', levels: ['Fresh white plaster', 'Dark wood beams', 'Painted wave pattern'] },
      awning: { name: 'Awning', levels: ['Red awning', 'Awning with gold tassels', 'Awning with flowers'] },
      tulips: { name: 'Window boxes', levels: ['Window flower boxes', 'Overflowing flower boxes', 'Butterfly garden boxes'] },
      trees: { name: 'Cherry trees', levels: ['Cherry trees in pots', 'Cherry trees in bloom', 'Cherry trees with fairy lights'] },
      oven: { name: 'Rice steamer', levels: ['Lantern over the rice steamer', 'Two lanterns and warm steam', 'Golden lantern'] },
      display: { name: 'Sushi window', levels: ['Sushi in the window', 'Teapot on display', '"Oishii!" banner'] },
      bench: { name: 'Bench', levels: ['Wooden bench', 'Bench with cushions', 'Bench under a lamp'] },
      lights: { name: 'String lights', levels: ['String lights', 'Rainbow lights', 'Lights everywhere'] },
      neon: { name: 'Neon sign', levels: ['Neon SUSHI sign', 'Neon window frame', 'Neon fish'] },
      patio: { name: 'Garden patio', levels: ['Patio with an umbrella', 'Patio with planters', 'Twinkly patio'] },
      bunting: { name: 'Paper lanterns', levels: ['Paper lanterns', 'Two rows of lanterns', 'Lanterns and rooftop flags'] },
      rooftop: { name: 'Rooftop garden', levels: ['Rooftop garden', 'Garden with a trellis', 'Sunflower roof'] },
    },
  },
  brunch: {
    style: 'brunch',
    choices: {
      paint: [
        { name: 'Butter', colour: '#fff0b3' },
        { name: 'Peach', colour: '#ffd9b8' },
        { name: 'Mint', colour: '#cdeedb' },
        { name: 'Sky', colour: '#d3ecf6' },
        { name: 'Lilac', colour: '#e6d6f3' },
      ],
      awning: [
        { name: 'Orange', colour: '#f39a1e' },
        { name: 'Sunny yellow', colour: '#f6c33e' },
        { name: 'Coral', colour: '#f2726b' },
        { name: 'Teal', colour: '#2f8a8f' },
      ],
    },
    upgrades: {
      paint: { name: 'Paint', levels: ['Sunny fresh paint', 'Painted trim', 'Hand-painted tiles'] },
      awning: { name: 'Awning', levels: ['Striped awning', 'Awning with gold tassels', 'Awning with flowers'] },
      tulips: { name: 'Window boxes', levels: ['Window flower boxes', 'Overflowing flower boxes', 'Butterfly garden boxes'] },
      trees: { name: 'Potted trees', levels: ['Potted orange trees', 'Blossoming trees', 'Twinkling trees'] },
      oven: { name: 'Coffee pot', levels: ['Coffee pot on the roof', 'Coffee pot puffing steam', 'Golden coffee pot'] },
      display: { name: 'Pastry window', levels: ['Croissants in the window', 'Cake stand with berries', '"Brunch all day" banner'] },
      bench: { name: 'Bench', levels: ['Bench out front', 'Comfy cushioned bench', 'Bench under a lamp post'] },
      lights: { name: 'String lights', levels: ['String lights', 'Rainbow lights', 'Glowing lights everywhere'] },
      neon: { name: 'Neon sign', levels: ['Neon CAFÉ sign', 'Neon window frame', 'Neon coffee cup'] },
      patio: { name: 'Patio', levels: ['Sunny patio', 'Patio with planters', 'Twinkly patio'] },
      bunting: { name: 'Bunting', levels: ['Sunny bunting', 'Double bunting', 'Bunting and rooftop flags'] },
      rooftop: { name: 'Rooftop garden', levels: ['Rooftop garden', 'Garden with a trellis', 'Sunflower roof'] },
    },
  },
  dessert: {
    style: 'dessert',
    choices: {
      paint: [
        { name: 'Bubblegum', colour: '#ffd1e0' },
        { name: 'Mint', colour: '#cdeedb' },
        { name: 'Lavender', colour: '#e6d6f3' },
        { name: 'Lemon', colour: '#fff0b3' },
        { name: 'Vanilla', colour: '#fff6e6' },
      ],
      awning: [
        { name: 'Pink', colour: '#e8659a' },
        { name: 'Mint', colour: '#4fbf9f' },
        { name: 'Lavender', colour: '#9b7fd1' },
        { name: 'Cherry', colour: '#d7263d' },
      ],
    },
    upgrades: {
      paint: { name: 'Paint', levels: ['Pink paint', 'Sprinkle trim', 'Candy-stripe trim'] },
      awning: { name: 'Awning', levels: ['Candy-striped awning', 'Awning with gold tassels', 'Awning with flowers'] },
      tulips: { name: 'Window boxes', levels: ['Window flower boxes', 'Overflowing flower boxes', 'Butterfly garden boxes'] },
      trees: { name: 'Lollipop trees', levels: ['Lollipop trees', 'Giant lollipops', 'Twinkling lollipops'] },
      oven: { name: 'Giant cone', levels: ['Ice cream cone on the roof', 'Two-scoop cone', 'Three scoops and a cherry'] },
      display: { name: 'Cake window', levels: ['Cupcakes in the window', 'Tiered cake stand', '"Sweet treats" banner'] },
      bench: { name: 'Bench', levels: ['Bench out front', 'Comfy cushioned bench', 'Bench under a lamp post'] },
      lights: { name: 'String lights', levels: ['String lights', 'Rainbow lights', 'Glowing lights everywhere'] },
      neon: { name: 'Neon sign', levels: ['Neon SWEETS sign', 'Neon window frame', 'Neon cupcake'] },
      patio: { name: 'Patio', levels: ['Ice cream patio', 'Patio with planters', 'Twinkly patio'] },
      bunting: { name: 'Bunting', levels: ['Pastel bunting', 'Double bunting', 'Bunting and rooftop flags'] },
      rooftop: { name: 'Rooftop garden', levels: ['Rooftop garden', 'Garden with a trellis', 'Sunflower roof'] },
    },
  },
};

// The theme for a restaurant (a new restaurant without one borrows Toronto's).
export const themeFor = cityId => THEMES[cityId] || THEMES.toronto;
