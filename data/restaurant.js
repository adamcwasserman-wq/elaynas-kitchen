// Upgrades for Elayna's restaurant in Toronto. They are bought in this order.
// Each one changes how the restaurant looks and makes play a little better.
//
// Effects:
//   orderBonus           customers pay this much more (0.1 = 10%)
//   refillSeconds        a pantry charge comes back this often
//   producerBonusChance  chance the pantry gives a level 2 item
//   chargesMax           extra pantry charges the pantry can hold

export const UPGRADES = [
  { id: 'awning', name: 'Striped awning', cost: 60, perk: 'Customers pay 10% more.', effect: { orderBonus: 0.10 } },
  { id: 'tulips', name: 'Tulip window boxes', cost: 150, perk: 'Pantry charges come back faster, every 35 seconds.', effect: { refillSeconds: 35 } },
  { id: 'oven', name: 'Brick oven', cost: 300, perk: 'The pantry gives bonus items twice as often.', effect: { producerBonusChance: 0.12 } },
  { id: 'lights', name: 'String lights', cost: 500, perk: 'The pantry holds 50 more charges.', effect: { chargesMax: 50 } },
  { id: 'patio', name: 'Sidewalk patio', cost: 800, perk: 'Customers pay 15% more.', effect: { orderBonus: 0.15 } },
];
