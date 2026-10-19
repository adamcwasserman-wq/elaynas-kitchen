// Everything that can sit on the merge board.
// Merge two of the same item at the same level to get the next level.
// The art for each item is drawn in js/art.js under the same id.

export const CHAINS = {
  bakery: {
    name: 'Bakery',
    tiers: [
      { id: 'wheat', name: 'Wheat' },
      { id: 'flour', name: 'Flour' },
      { id: 'dough', name: 'Dough' },
      { id: 'bagel', name: 'Bagel' },
      { id: 'challah', name: 'Challah' },
      { id: 'babka', name: 'Babka' },
    ],
  },
  dairy: {
    name: 'Dairy',
    tiers: [
      { id: 'milk', name: 'Milk' },
      { id: 'butter', name: 'Butter' },
      { id: 'creamcheese', name: 'Cream cheese' },
      { id: 'cheese', name: 'Cheese' },
      { id: 'wheel', name: 'Cheese wheel' },
      { id: 'cheesecake', name: 'Cheesecake' },
    ],
  },
  // Mexico City
  corn: {
    name: 'Corn',
    tiers: [
      { id: 'corn', name: 'Corn' },
      { id: 'masa', name: 'Masa' },
      { id: 'tortilla', name: 'Tortillas' },
      { id: 'taco', name: 'Taco' },
      { id: 'tamales', name: 'Tamales' },
      { id: 'tacoplatter', name: 'Taco platter' },
    ],
  },
  // Mexico City and Rome
  garden: {
    name: 'Garden',
    tiers: [
      { id: 'sprout', name: 'Sprout' },
      { id: 'tomatoveg', name: 'Tomato' },
      { id: 'pepper', name: 'Red pepper' },
      { id: 'eggplantveg', name: 'Eggplant' },
      { id: 'vegbasket', name: 'Veggie basket' },
      { id: 'marketcrate', name: 'Market crate' },
    ],
  },
  // Rome
  pasta: {
    name: 'Pasta',
    tiers: [
      { id: 'egg', name: 'Egg' },
      { id: 'pastadough', name: 'Pasta dough' },
      { id: 'spaghetti', name: 'Spaghetti' },
      { id: 'ravioli', name: 'Ravioli' },
      { id: 'lasagna', name: 'Lasagna' },
      { id: 'pastafeast', name: 'Pasta feast' },
    ],
  },
};

// Producers ("starter blocks") make level 1 items when tapped. Each tap uses one pantry charge.
// "weight" is how often each item comes out, compared to the others.
export const PRODUCERS = {
  crate: {
    name: 'Bakery crate',
    makes: [{ chain: 'bakery', tier: 1, weight: 1 }],
  },
  fridge: {
    name: 'Dairy fridge',
    makes: [{ chain: 'dairy', tier: 1, weight: 1 }],
  },
  cornbasket: {
    name: 'Corn basket',
    makes: [{ chain: 'corn', tier: 1, weight: 1 }],
  },
  gardenbox: {
    name: 'Garden box',
    makes: [{ chain: 'garden', tier: 1, weight: 1 }],
  },
  eggbasket: {
    name: 'Egg basket',
    makes: [{ chain: 'pasta', tier: 1, weight: 1 }],
  },
};
// Which starter blocks each city starts with, and which arrive later, are in data/cities.js.

// Dollars a customer pays for one item, by level (level 1 is the first number).
export const ORDER_VALUE = [2, 5, 11, 24, 50, 105];

// Dollars you get for selling one item from the board, by level.
export const SELL_VALUE = [1, 2, 4, 8, 16, 32];
