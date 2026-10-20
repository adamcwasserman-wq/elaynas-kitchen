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
  // Hana Sushi
  rice: {
    name: 'Rice',
    tiers: [
      { id: 'rice', name: 'Rice' },
      { id: 'steamedrice', name: 'Steamed rice' },
      { id: 'onigiri', name: 'Onigiri' },
      { id: 'makiroll', name: 'Maki rolls' },
      { id: 'bento', name: 'Bento box' },
      { id: 'sushiboat', name: 'Sushi boat' },
    ],
  },
  // Hana Sushi
  tea: {
    name: 'Tea',
    tiers: [
      { id: 'tealeaf', name: 'Tea leaf' },
      { id: 'greentea', name: 'Green tea' },
      { id: 'matcha', name: 'Matcha' },
      { id: 'mochi', name: 'Mochi' },
      { id: 'matchaparfait', name: 'Matcha parfait' },
      { id: 'teaset', name: 'Tea ceremony set', short: 'Tea set' },
    ],
  },
  // Sunny Side
  coffee: {
    name: 'Coffee',
    tiers: [
      { id: 'coffeebean', name: 'Coffee beans' },
      { id: 'groundcoffee', name: 'Ground coffee' },
      { id: 'espresso', name: 'Espresso' },
      { id: 'cappuccino', name: 'Cappuccino' },
      { id: 'icedmocha', name: 'Iced mocha' },
      { id: 'coffeeflight', name: 'Coffee flight' },
    ],
  },
  // Sunny Side and Sugar Tulip
  fruit: {
    name: 'Fruit',
    tiers: [
      { id: 'strawberry', name: 'Strawberry' },
      { id: 'berrybowl', name: 'Berry bowl' },
      { id: 'fruitsalad', name: 'Fruit salad' },
      { id: 'smoothie', name: 'Smoothie' },
      { id: 'smoothiebowl', name: 'Smoothie bowl' },
      { id: 'fruitplatter', name: 'Fruit platter' },
    ],
  },
  // Sugar Tulip
  cocoa: {
    name: 'Cocoa',
    tiers: [
      { id: 'cocoabean', name: 'Cocoa pod' },
      { id: 'chocchips', name: 'Chocolate chips' },
      { id: 'chocbar', name: 'Chocolate bar' },
      { id: 'truffles', name: 'Truffles' },
      { id: 'choccake', name: 'Chocolate cake' },
      { id: 'chocfountain', name: 'Chocolate fountain', short: 'Choco fountain' },
    ],
  },
  // Sugar Tulip
  icecream: {
    name: 'Ice cream',
    tiers: [
      { id: 'vanilla', name: 'Vanilla' },
      { id: 'sweetcream', name: 'Sweet cream' },
      { id: 'scoop', name: 'Ice cream scoop' },
      { id: 'cone', name: 'Ice cream cone' },
      { id: 'sundae', name: 'Sundae' },
      { id: 'icecreamcake', name: 'Ice cream cake' },
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
  ricecooker: { name: 'Rice cooker', makes: [{ chain: 'rice', tier: 1, weight: 1 }] },
  teapot: { name: 'Teapot', makes: [{ chain: 'tea', tier: 1, weight: 1 }] },
  grinder: { name: 'Coffee grinder', makes: [{ chain: 'coffee', tier: 1, weight: 1 }] },
  fruitbasket: { name: 'Fruit basket', makes: [{ chain: 'fruit', tier: 1, weight: 1 }] },
  cocoatin: { name: 'Cocoa tin', makes: [{ chain: 'cocoa', tier: 1, weight: 1 }] },
  freezer: { name: 'Ice cream freezer', makes: [{ chain: 'icecream', tier: 1, weight: 1 }] },
};
// Which starter blocks each city starts with, and which arrive later, are in data/cities.js.

// Dollars a customer pays for one item, by level (level 1 is the first number).
export const ORDER_VALUE = [2, 5, 11, 24, 50, 105];

