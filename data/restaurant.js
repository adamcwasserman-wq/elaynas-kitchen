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

// Upgrades for Elayna's restaurant in Toronto. She can buy them in any order she likes.
// Each one adds something you can see on the restaurant and makes play a little better.
//
// Effects:
//   orderBonus           customers pay this much more (0.05 = 5%), adds up
//   refillSeconds        a pantry charge comes back this often
//   producerBonusChance  chance a starter block gives a level 2 item
//   chargesMax           extra pantry charges, adds up (only matters if the energy limit is turned back on)
//   tipBonus             speed tips are this much bigger (0.5 = 50% bigger), adds up

export const UPGRADES = [
  { id: 'paint', name: 'Fresh coat of paint', cost: 40, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 }, choice: 'paint' },
  { id: 'awning', name: 'Striped awning', cost: 80, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 }, choice: 'awning' },
  { id: 'tulips', name: 'Tulip window boxes', cost: 140, perk: 'Starter blocks give bonus items more often.', effect: { producerBonusChance: 0.09 } },
  { id: 'trees', name: 'Potted trees by the door', cost: 200, perk: 'Speed tips are 25% bigger.', effect: { tipBonus: 0.25 } },
  { id: 'oven', name: 'Brick oven', cost: 300, perk: 'Starter blocks give bonus items twice as often.', effect: { producerBonusChance: 0.12 } },
  { id: 'bench', name: 'Bench out front', cost: 400, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
  { id: 'lights', name: 'String lights', cost: 550, perk: 'Speed tips are 25% bigger.', effect: { tipBonus: 0.25 } },
  { id: 'display', name: 'Cake window display', cost: 700, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
  { id: 'patio', name: 'Sidewalk patio', cost: 900, perk: 'Customers pay 10% more.', effect: { orderBonus: 0.10 } },
  { id: 'neon', name: 'Neon OPEN sign', cost: 1100, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
  { id: 'bunting', name: 'Tulip bunting', cost: 1400, perk: 'Starter blocks give bonus items even more often.', effect: { producerBonusChance: 0.18 } },
  { id: 'rooftop', name: 'Rooftop garden', cost: 1800, perk: 'Customers pay 10% more, and speed tips are 50% bigger.', effect: { orderBonus: 0.10, tipBonus: 0.5 } },
];
