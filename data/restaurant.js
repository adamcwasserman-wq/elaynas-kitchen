// Upgrades for Elayna's restaurant in Toronto. They are bought in this order.
// Each one adds something you can see on the restaurant and makes play a little better.
//
// Effects:
//   orderBonus           customers pay this much more (0.05 = 5%), adds up
//   refillSeconds        a pantry charge comes back this often
//   producerBonusChance  chance a starter block gives a level 2 item
//   chargesMax           extra pantry charges, adds up

export const UPGRADES = [
  { id: 'paint', name: 'Fresh coat of paint', cost: 40, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
  { id: 'awning', name: 'Striped awning', cost: 80, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
  { id: 'tulips', name: 'Tulip window boxes', cost: 140, perk: 'Pantry charges come back faster, every 40 seconds.', effect: { refillSeconds: 40 } },
  { id: 'trees', name: 'Potted trees by the door', cost: 200, perk: 'The pantry holds 25 more charges.', effect: { chargesMax: 25 } },
  { id: 'oven', name: 'Brick oven', cost: 300, perk: 'Starter blocks give bonus items twice as often.', effect: { producerBonusChance: 0.12 } },
  { id: 'bench', name: 'Bench out front', cost: 400, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
  { id: 'lights', name: 'String lights', cost: 550, perk: 'Pantry charges come back every 35 seconds.', effect: { refillSeconds: 35 } },
  { id: 'display', name: 'Cake window display', cost: 700, perk: 'Customers pay 5% more.', effect: { orderBonus: 0.05 } },
  { id: 'patio', name: 'Sidewalk patio', cost: 900, perk: 'Customers pay 10% more.', effect: { orderBonus: 0.10 } },
  { id: 'neon', name: 'Neon OPEN sign', cost: 1100, perk: 'The pantry holds 50 more charges.', effect: { chargesMax: 50 } },
  { id: 'bunting', name: 'Tulip bunting', cost: 1400, perk: 'Starter blocks give bonus items even more often.', effect: { producerBonusChance: 0.18 } },
  { id: 'rooftop', name: 'Rooftop garden', cost: 1800, perk: 'Customers pay 10% more, and charges come back every 30 seconds.', effect: { orderBonus: 0.10, refillSeconds: 30 } },
];
