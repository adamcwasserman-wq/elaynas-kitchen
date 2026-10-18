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
};

// Producers make level 1 items when tapped. Toronto has one: the pantry crate.
// "weight" is how often each item comes out, compared to the others.
export const PRODUCERS = {
  pantry: {
    name: 'Toronto Pantry',
    makes: [
      { chain: 'bakery', tier: 1, weight: 55 },
      { chain: 'dairy', tier: 1, weight: 45 },
    ],
  },
};

// Dollars a customer pays for one item, by level (level 1 is the first number).
export const ORDER_VALUE = [2, 5, 11, 24, 50, 105];

// Dollars you get for selling one item from the board, by level.
export const SELL_VALUE = [1, 2, 4, 8, 16, 32];
