// Elayna's restaurants, all on one street in her neighbourhood, in the order they open.
// (In the code these are still called "cities".) Each keeps its own board, customers, upgrades
// and stars. Dollars, gems, badges and the neighbourhood are shared.
// name: the restaurant's name. cuisine: what it serves. slot: which shop on the street it takes.
//
// starts: starter blocks on the board when she first arrives.
// unlocks: starter blocks that arrive after she has served this many orders in that city.
// firstOrders: the first few orders, set by hand (later ones are made up; see data/orders.js).
// starGoals: stars needed for 1, 2 and 3 star ratings. opensNextAt: the star rating that opens the next city.
// upgradeCost: upgrades cost this many times the Toronto price.
// look: the restaurant's colours, sign and a touch of local style.


export const CITIES = [
  {
    id: 'toronto', name: "Elayna's", cuisine: 'Bakery and deli', restaurant: "Elayna's", sign: "Elayna's", slot: 0,
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
  },
  {
    id: 'mexico', name: 'La Cocina', cuisine: 'Mexican', restaurant: 'La Cocina', sign: 'La Cocina', slot: 2,
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
  },
  {
    id: 'rome', name: 'Trattoria Elayna', cuisine: 'Italian', restaurant: 'Trattoria Elayna', sign: 'Trattoria', slot: 4,
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
  },
];

// A shop on the street that becomes a restaurant in a later update.
export const COMING_SOON = [
  { name: 'Israeli café', cuisine: 'Israeli', slot: 1 },
];
