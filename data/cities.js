// The player's restaurants, all on Main Street on her island, in the order they open.
// (In the code these are still called "cities".) Each keeps its own board, customers, upgrades
// and stars. Dollars, gems, badges and the neighbourhood are shared.
// name: the restaurant's name. cuisine: what it serves. slot: which lot on Main Street it takes.
// {chef} in a name is replaced by the player's name ("{chef}'s" becomes "Sam's").
//
// starts: starter blocks on the board when she first arrives.
// unlocks: starter blocks that arrive after she has served this many orders in that city.
// firstOrders: the first few orders, set by hand (later ones are made up; see data/orders.js).
// starGoals: stars needed for 1, 2 and 3 star ratings. opensNextAt: the star rating that opens the next city.
// upgradeCost: upgrades cost this many times the Toronto price.
// look: the restaurant's starting colours. Its style and upgrade names are in data/restaurant.js (THEMES).


export const CITIES = [
  {
    id: 'toronto', name: "{chef}'s", cuisine: 'Bakery and deli', restaurant: "{chef}'s", sign: "{chef}'s", slot: 0,
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
    look: { wall: '#f3ead8', awning: '#5b2c6f' },
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
    look: { wall: '#f8d2b4', awning: '#e8475f' },
  },
  {
    id: 'rome', name: 'Trattoria {chef}', cuisine: 'Italian', restaurant: 'Trattoria {chef}', sign: 'Trattoria', slot: 4,
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
    look: { wall: '#f5dfae', awning: '#3f9b3c' },
  },
  {
    id: 'japan', name: 'Hana Sushi', cuisine: 'Japanese', restaurant: 'Hana Sushi', sign: 'Hana Sushi', slot: 1,
    starts: ['ricecooker'], unlocks: [{ producer: 'teapot', afterServed: 2 }, { producer: 'fridge', afterServed: 6 }],
    firstOrders: [
      [{ chain: 'rice', tier: 2 }],
      [{ chain: 'rice', tier: 2 }],
      [{ chain: 'rice', tier: 3 }],
      [{ chain: 'tea', tier: 2 }],
      [{ dish: 'ochazuke' }],
    ],
    starGoals: [70, 170, 280], opensNextAt: 2,
    starRewards: [{ gems: 6, dollars: 160 }, { gems: 10, dollars: 400 }, { gems: 22, dollars: 1000 }],
    upgradeCost: 2.5,
    look: { wall: '#fbeee6', awning: '#c8323a' },
  },
  {
    id: 'brunch', name: 'Sunny Side', cuisine: 'Brunch', restaurant: 'Sunny Side Café', sign: 'Sunny Side', slot: 3,
    starts: ['grinder'], unlocks: [{ producer: 'fruitbasket', afterServed: 2 }, { producer: 'crate', afterServed: 6 }, { producer: 'fridge', afterServed: 10 }],
    firstOrders: [
      [{ chain: 'coffee', tier: 2 }],
      [{ chain: 'coffee', tier: 2 }],
      [{ chain: 'coffee', tier: 3 }],
      [{ chain: 'fruit', tier: 2 }],
      [{ dish: 'berrybrew' }],
    ],
    starGoals: [80, 190, 310], opensNextAt: 2,
    starRewards: [{ gems: 7, dollars: 200 }, { gems: 12, dollars: 500 }, { gems: 25, dollars: 1200 }],
    upgradeCost: 3,
    look: { wall: '#fff3c4', awning: '#f39a1e' },
  },
  {
    id: 'dessert', name: 'Sugar Tulip', cuisine: 'Desserts', restaurant: 'Sugar Tulip', sign: 'Sugar Tulip', slot: 5,
    starts: ['cocoatin'], unlocks: [{ producer: 'freezer', afterServed: 2 }, { producer: 'fruitbasket', afterServed: 6 }],
    firstOrders: [
      [{ chain: 'cocoa', tier: 2 }],
      [{ chain: 'cocoa', tier: 2 }],
      [{ chain: 'cocoa', tier: 3 }],
      [{ chain: 'icecream', tier: 2 }],
      [{ dish: 'hotchocolate' }],
    ],
    starGoals: [90, 210, 340], opensNextAt: 2,
    starRewards: [{ gems: 8, dollars: 250 }, { gems: 14, dollars: 600 }, { gems: 30, dollars: 1500 }],
    upgradeCost: 3.5,
    look: { wall: '#ffe1ec', awning: '#e8659a' },
  },
];

// Lots on Main Street saved for restaurants coming in a later update: { name, cuisine, slot }.
export const COMING_SOON = [];
