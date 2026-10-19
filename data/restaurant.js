// Where Elayna is cooking right now. More cities and restaurants come later.
// Winning a restaurant: every order earns stars. Reaching each goal gives the restaurant
// another star rating (up to three) and some gems. Three stars wins the city.
export const CITY = {
  name: 'Toronto', restaurant: "Elayna's",
  starGoals: [40, 100, 180],
  starRewards: [{ gems: 3, dollars: 50 }, { gems: 5, dollars: 150 }, { gems: 15, dollars: 400 }],
};

// Some upgrades let her pick a colour. The first option is the one she starts with.
export const CHOICES = {
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
};

// Upgrades for each restaurant. She can buy them in any order she likes. Each one has three levels:
// buy level 1 first, then upgrade it when she's ready. Every level adds something you can see on
// the restaurant and makes play a little better. "cost" is the Toronto price (see upgradeCost in data/cities.js).
//
// Effects (each level adds its own on top of the levels before it):
//   orderBonus           customers pay this much more (0.05 = 5%), adds up
//   refillSeconds        a pantry charge comes back this often
//   producerBonusChance  chance a starter block gives a level 2 item (the best one counts)
//   chargesMax           extra pantry charges, adds up (only matters if the energy limit is turned back on)
//   tipBonus             speed tips are this much bigger (0.5 = 50% bigger), adds up

export const UPGRADES = [
  { id: 'paint', name: 'Paint', choice: 'paint', levels: [
    { name: 'Fresh coat of paint', cost: 40, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
    { name: 'Painted trim', cost: 100, perk: 'Customers pay 3% more.', effect: { orderBonus: 0.03 } },
    { name: 'Hand-painted tiles', cost: 200, perk: 'Customers pay 4% more.', effect: { orderBonus: 0.04 } }] },
  { id: 'awning', name: 'Awning', choice: 'awning', levels: [
    { name: 'Striped awning', cost: 80, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
    { name: 'Awning with gold tassels', cost: 200, perk: 'Customers pay 3% more.', effect: { orderBonus: 0.03 } },
    { name: 'Tulip-print awning', cost: 400, perk: 'Customers pay 4% more.', effect: { orderBonus: 0.04 } }] },
  { id: 'tulips', name: 'Window boxes', levels: [
    { name: 'Tulip window boxes', cost: 140, perk: 'Starter blocks give bonus items more often.', effect: { producerBonusChance: 0.09 } },
    { name: 'Overflowing flower boxes', cost: 350, perk: 'Bonus items a little more often.', effect: { producerBonusChance: 0.10 } },
    { name: 'Butterfly garden boxes', cost: 700, perk: 'Bonus items more often again.', effect: { producerBonusChance: 0.11 } }] },
  { id: 'trees', name: 'Potted trees', levels: [
    { name: 'Potted trees by the door', cost: 200, perk: 'Speed tips are 25% bigger.', effect: { tipBonus: 0.25 } },
    { name: 'Blossoming trees', cost: 500, perk: 'Speed tips are 15% bigger.', effect: { tipBonus: 0.15 } },
    { name: 'Twinkling topiaries', cost: 1000, perk: 'Speed tips are 25% bigger.', effect: { tipBonus: 0.25 } }] },
  { id: 'oven', name: 'Oven', levels: [
    { name: 'Brick oven', cost: 300, perk: 'Starter blocks give bonus items twice as often.', effect: { producerBonusChance: 0.12 } },
    { name: 'Wood-fired oven', cost: 750, perk: 'Bonus items even more often.', effect: { producerBonusChance: 0.14 } },
    { name: 'Famous golden oven', cost: 1500, perk: 'Bonus items more often again.', effect: { producerBonusChance: 0.16 } }] },
  { id: 'bench', name: 'Bench', levels: [
    { name: 'Bench out front', cost: 400, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
    { name: 'Comfy cushioned bench', cost: 1000, perk: 'Customers pay 3% more.', effect: { orderBonus: 0.03 } },
    { name: 'Bench under a lamp post', cost: 2000, perk: 'Customers pay 4% more.', effect: { orderBonus: 0.04 } }] },
  { id: 'lights', name: 'String lights', levels: [
    { name: 'String lights', cost: 550, perk: 'Speed tips are 25% bigger.', effect: { tipBonus: 0.25 } },
    { name: 'Rainbow lights', cost: 1375, perk: 'Speed tips are 15% bigger.', effect: { tipBonus: 0.15 } },
    { name: 'Glowing lights everywhere', cost: 2750, perk: 'Speed tips are 25% bigger.', effect: { tipBonus: 0.25 } }] },
  { id: 'display', name: 'Window display', levels: [
    { name: 'Cake window display', cost: 700, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
    { name: 'Tiered cake stand', cost: 1750, perk: 'Customers pay 3% more.', effect: { orderBonus: 0.03 } },
    { name: '"Fresh today" showcase', cost: 3500, perk: 'Customers pay 4% more.', effect: { orderBonus: 0.04 } }] },
  { id: 'patio', name: 'Patio', levels: [
    { name: 'Sidewalk patio', cost: 900, perk: 'Customers pay 10% more.', effect: { orderBonus: 0.10 } },
    { name: 'Patio with planters', cost: 2250, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
    { name: 'Twinkly patio', cost: 4500, perk: 'Customers pay 8% more.', effect: { orderBonus: 0.08 } }] },
  { id: 'neon', name: 'Neon sign', levels: [
    { name: 'Neon OPEN sign', cost: 1100, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
    { name: 'Neon window frame', cost: 2750, perk: 'Customers pay 3% more.', effect: { orderBonus: 0.03 } },
    { name: 'Neon heart', cost: 5500, perk: 'Customers pay 4% more.', effect: { orderBonus: 0.04 } }] },
  { id: 'bunting', name: 'Bunting', levels: [
    { name: 'Tulip bunting', cost: 1400, perk: 'Starter blocks give bonus items even more often.', effect: { producerBonusChance: 0.18 } },
    { name: 'Double bunting', cost: 3500, perk: 'Bonus items more often again.', effect: { producerBonusChance: 0.20 } },
    { name: 'Bunting and rooftop flags', cost: 7000, perk: 'Bonus items most often of all.', effect: { producerBonusChance: 0.22 } }] },
  { id: 'rooftop', name: 'Rooftop garden', levels: [
    { name: 'Rooftop garden', cost: 1800, perk: 'Customers pay 10% more, and speed tips are 50% bigger.', effect: { orderBonus: 0.10, tipBonus: 0.5 } },
    { name: 'Garden with a trellis', cost: 4500, perk: 'Customers pay 5% more, and speed tips are 25% bigger.', effect: { orderBonus: 0.05, tipBonus: 0.25 } },
    { name: 'Sunflower roof', cost: 9000, perk: 'Customers pay 8% more, and speed tips are 50% bigger.', effect: { orderBonus: 0.08, tipBonus: 0.5 } }] },
];
