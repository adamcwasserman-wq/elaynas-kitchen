// The cities on the world map, in the order they open.
// Each city keeps its own board, customers, upgrades and stars. Dollars, gems and badges are shared.
//
// starts: starter blocks on the board when she first arrives.
// unlocks: starter blocks that arrive after she has served this many orders in that city.
// firstOrders: the first few orders, set by hand (later ones are made up; see data/orders.js).
// starGoals: stars needed for 1, 2 and 3 star ratings. opensNextAt: the star rating that opens the next city.
// upgradeCost: upgrades cost this many times the Toronto price.
// look: the restaurant's colours, sign and a touch of local style.
// map: where the pin sits on the world map (0 to 400 across, 0 to 240 down).

export const CITIES = [
  {
    id: 'toronto', name: 'Toronto', restaurant: "Elayna's", sign: "Elayna's",
    starts: ['crate'], unlocks: [{ producer: 'fridge', afterServed: 2 }],
    firstOrders: [
      [{ chain: 'bakery', tier: 2 }],
      [{ chain: 'bakery', tier: 2 }],
      [{ chain: 'bakery', tier: 3 }],
      [{ chain: 'dairy', tier: 1 }],
      [{ chain: 'dairy', tier: 2 }],
    ],
    starGoals: [40, 100, 180], opensNextAt: 2,
    starRewards: [{ gems: 3, dollars: 50 }, { gems: 5, dollars: 150 }, { gems: 15, dollars: 400 }],
    upgradeCost: 1,
    look: { wall: '#f3ead8', awning: '#5b2c6f', flair: null },
    map: { x: 104, y: 64 },
  },
  {
    id: 'mexico', name: 'Mexico City', restaurant: 'La Cocina de Elayna', sign: 'Cocina Elayna',
    starts: ['cornbasket'], unlocks: [{ producer: 'gardenbox', afterServed: 2 }, { producer: 'fridge', afterServed: 6 }],
    firstOrders: [
      [{ chain: 'corn', tier: 2 }],
      [{ chain: 'corn', tier: 2 }],
      [{ chain: 'corn', tier: 3 }],
      [{ chain: 'garden', tier: 2 }],
      [{ dish: 'chipssalsa' }],
    ],
    starGoals: [50, 130, 220], opensNextAt: 2,
    starRewards: [{ gems: 4, dollars: 80 }, { gems: 6, dollars: 220 }, { gems: 18, dollars: 600 }],
    upgradeCost: 1.5,
    look: { wall: '#f8d2b4', awning: '#e8475f', flair: 'papel' },
    map: { x: 82, y: 140 },
  },
  {
    id: 'rome', name: 'Rome', restaurant: 'Trattoria Elayna', sign: 'Trattoria Elayna',
    starts: ['eggbasket'], unlocks: [{ producer: 'gardenbox', afterServed: 2 }, { producer: 'fridge', afterServed: 6 }],
    firstOrders: [
      [{ chain: 'pasta', tier: 2 }],
      [{ chain: 'pasta', tier: 2 }],
      [{ chain: 'pasta', tier: 3 }],
      [{ chain: 'garden', tier: 2 }],
      [{ dish: 'pomodoro' }],
    ],
    starGoals: [60, 150, 250], opensNextAt: 2,
    starRewards: [{ gems: 5, dollars: 120 }, { gems: 8, dollars: 300 }, { gems: 20, dollars: 800 }],
    upgradeCost: 2,
    look: { wall: '#f5dfae', awning: '#3f9b3c', flair: 'vines' },
    map: { x: 262, y: 82 },
  },
];

// Shown on the map as a city that's coming later.
export const COMING_SOON = [
  { name: 'Israel', map: { x: 318, y: 120 } },
];
