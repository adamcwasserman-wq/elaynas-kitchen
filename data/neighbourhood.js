// Elayna's neighbourhood: Tulip Island, the food district she builds up, like a BIA (business improvement area).
// She places each improvement on the island map (see data/island.js). Improvements, restaurant stars and restaurant upgrades
// all add "buzz". More buzz brings more people to the neighbourhood, and every buzz level
// pays gems and makes customers pay a little more in all of her restaurants.

export const HOOD = { defaultName: 'Tulip Island', nameMax: 22 };

// Island dollars: the neighbourhood's own money, separate from each restaurant's tips.
// Visitors spend money on the street, and it piles up for her to collect on the neighbourhood screen:
//   orderShare      every customer served (in any restaurant) adds this share of what they paid
//   basePerHour     visitors spend this much an hour, even on a quiet street
//   perBuzzPerHour  plus this much an hour for each point of buzz
//   maxHours        the hourly part stops piling up after this many hours away (customers still add)
//   dotAt           the neighbourhood button shows a dot once this much is waiting
// (In the code this money is still called "bia", and these settings "BIA".)
export const BIA = { orderShare: 0.3, basePerHour: 30, perBuzzPerHour: 0.5, maxHours: 8, dotAt: 25 };

// Bought in any order, with Island dollars (see BIA below). Each improvement has three stages, from basic to amazing:
// build stage 1 first, then upgrade. Every stage shows up on the street and adds buzz.
// "choice" lets her pick a style once it's built.
export const IMPROVEMENTS = [
  { id: 'trees', name: 'Street trees', choice: 'trees', stages: [
    { name: 'Young saplings', cost: 150, buzz: 30, about: 'Little trees along the sidewalk.' },
    { name: 'Leafy street trees', cost: 375, buzz: 24, about: 'Shade, birdsong and colour.' },
    { name: 'Grand tree canopy', cost: 750, buzz: 36, about: 'Big trees with flower beds underneath.' }] },
  { id: 'lamps', name: 'Lamp posts', stages: [
    { name: 'Simple lamp posts', cost: 250, buzz: 40, about: 'The street is lit at night.' },
    { name: 'Old-fashioned lamps', cost: 625, buzz: 32, about: 'A warm glow, with hanging flower baskets.' },
    { name: 'Glowing lanterns everywhere', cost: 1250, buzz: 48, about: 'Lanterns all along the street.' }] },
  { id: 'benches', name: 'Places to sit', stages: [
    { name: 'A wooden bench', cost: 350, buzz: 50, about: 'Somewhere to rest.' },
    { name: 'Benches and planters', cost: 875, buzz: 40, about: 'Somewhere to sit and stay a while.' },
    { name: 'Cozy seating nooks', cost: 1750, buzz: 60, about: 'Benches under bright umbrellas.' }] },
  { id: 'garden', name: 'Tulip garden', choice: 'flowers', stages: [
    { name: 'A tulip patch', cost: 500, buzz: 70, about: 'A few tulips in the empty lot.' },
    { name: 'Tulip garden', cost: 1250, buzz: 56, about: 'Rows and rows of tulips.' },
    { name: 'Blooming garden with an arbour', cost: 2500, buzz: 84, about: 'An arch of flowers to walk under.' }] },
  { id: 'mural', name: 'Neighbourhood mural', choice: 'mural', stages: [
    { name: 'A small painting', cost: 650, buzz: 80, about: 'Art on the brick wall.' },
    { name: 'A big mural', cost: 1625, buzz: 64, about: 'A painting people stop to look at.' },
    { name: 'A glowing wall-sized mural', cost: 3250, buzz: 96, about: 'It covers the wall, framed in lights.' }] },
  { id: 'bikes', name: 'Bikes', stages: [
    { name: 'Bike racks', cost: 800, buzz: 90, about: 'A place to park bikes.' },
    { name: 'Bike lane', cost: 2000, buzz: 72, about: 'Easy to get here on two wheels.' },
    { name: 'Bike lane and bike-share station', cost: 4000, buzz: 108, about: 'Bikes to borrow, right on the street.' }] },
  { id: 'streetcar', name: 'Ferry dock', stages: [
    { name: 'A rowboat dock', cost: 1000, buzz: 110, about: 'Visitors can row over to the island.' },
    { name: 'Ferry dock', cost: 2500, buzz: 88, about: 'A ferry brings visitors across the water.' },
    { name: 'Ferry terminal', cost: 5000, buzz: 132, about: 'Two ferries and a terminal with a flag on top.' }] },
  { id: 'market', name: 'Farmers market', stages: [
    { name: 'One market stall', cost: 1300, buzz: 140, about: 'Fresh food on weekends.' },
    { name: 'Weekend farmers market', cost: 3250, buzz: 112, about: 'Stalls full of fresh food.' },
    { name: 'Big market with a flower stand', cost: 6500, buzz: 168, about: 'Bunting, flowers and crowds.' }] },
  { id: 'lights', name: 'Street lights', stages: [
    { name: 'A string of lights', cost: 1600, buzz: 160, about: 'A little sparkle overhead.' },
    { name: 'Lights over the street', cost: 4000, buzz: 128, about: 'The street sparkles at night.' },
    { name: 'Twinkling lights everywhere', cost: 8000, buzz: 192, about: 'Two strings of glowing lights.' }] },
  { id: 'fountain', name: 'Fountain', stages: [
    { name: 'A drinking fountain', cost: 2000, buzz: 190, about: 'Fresh water for everyone.' },
    { name: 'Fountain plaza', cost: 5000, buzz: 152, about: 'A place to meet friends.' },
    { name: 'Grand dancing fountain', cost: 10000, buzz: 228, about: 'Water jets that dance.' }] },
  { id: 'stage', name: 'Music', stages: [
    { name: "Busker's corner", cost: 2500, buzz: 220, about: 'Someone playing music on the corner.' },
    { name: 'Music stage', cost: 6250, buzz: 176, about: 'Live music on summer nights.' },
    { name: 'Big stage with lights', cost: 12500, buzz: 264, about: 'Concerts with lights and speakers.' }] },
  { id: 'arch', name: 'Welcome sign', stages: [
    { name: 'A welcome sign', cost: 3200, buzz: 300, about: "Your island's name on a post." },
    { name: 'Welcome arch', cost: 8000, buzz: 240, about: 'An arch with your name for visitors to walk under.' },
    { name: 'Grand glowing arch', cost: 16000, buzz: 360, about: 'Lights, flags and tulips.' }] },
];

// Amenities open up as the neighbourhood grows. "needs" is the buzz level (see BUZZ_LEVELS, 1 = Friendly block).
export const AMENITIES = [
  { id: 'washrooms', name: 'Public washrooms', cost: 400, buzz: 50, needs: 1, about: 'Families can stay all afternoon.' },
  { id: 'park', name: 'Neighbourhood park', cost: 900, buzz: 100, needs: 2, about: 'Grass, trees and picnic tables.' },
  { id: 'lighthouse', name: 'Lighthouse', cost: 1800, buzz: 150, needs: 2, about: 'It lights the way for boats at night. Goes on the shore.' },
  { id: 'splash', name: 'Splash pad', cost: 1400, buzz: 130, needs: 3, about: 'Kids run through the fountains.' },
  { id: 'pool', name: 'Community pool', cost: 2200, buzz: 180, needs: 4, about: 'A summer favourite.' },
  { id: 'marina', name: 'Marina', cost: 2800, buzz: 200, needs: 4, about: 'A harbour full of sailboats. Goes in the water.' },
  { id: 'zoo', name: 'Petting zoo', cost: 3500, buzz: 250, needs: 5, about: 'Goats, bunnies and a very friendly duck.' },
];

// Events she can host once they unlock. One at a time. Each boosts the next few customers:
// "orders" customers pay "bonus" more (and earn "stars" extra stars each). The first time adds buzz.
export const EVENTS = [
  { id: 'trucks', name: 'Food truck rally', cost: 200, needs: 1, orders: 6, bonus: 0.25, stars: 0, firstBuzz: 40, about: 'Food trucks line Main Street.' },
  { id: 'festival', name: 'Street festival', cost: 400, needs: 2, orders: 8, bonus: 0.30, stars: 1, firstBuzz: 60, about: 'Bunting, music and crowds.' },
  { id: 'parade', name: 'Boat parade', cost: 700, needs: 3, orders: 10, bonus: 0.35, stars: 1, firstBuzz: 80, about: 'Boats with flags sail round the island.' },
  { id: 'tulipfest', name: 'Tulip festival', cost: 1000, needs: 4, orders: 10, bonus: 0.40, stars: 1, firstBuzz: 100, about: 'Tulips everywhere you look.' },
  { id: 'fireworks', name: 'Fireworks night', cost: 1500, needs: 5, orders: 12, bonus: 0.50, stars: 2, firstBuzz: 150, about: 'Fireworks over the water.' },
];

// Style choices. The first option is the one she starts with.
export const HOOD_CHOICES = {
  trees: [{ name: 'Maple', colour: '#e8742f' }, { name: 'Cherry blossom', colour: '#f6b3c8' }, { name: 'Leafy green', colour: '#5fb34a' }],
  flowers: [{ name: 'Pink tulips', colour: '#e8475f' }, { name: 'Purple tulips', colour: '#8b55a6' }, { name: 'Yellow tulips', colour: '#f6c33e' }],
  mural: [{ name: 'Tulips', colour: '#e8475f' }, { name: 'Eggplants', colour: '#5b2c6f' }, { name: 'Food friends', colour: '#e9412f' }],
};

// Buzz from her restaurants, in every city.
export const RESTAURANT_BUZZ = { perStar: 40, perUpgrade: 6 };

// Neighbourhood levels. "bonus": customers in all restaurants pay this much more.
// "gems" and "bia": the reward for reaching it (Island dollars go straight into the neighbourhood fund).
export const BUZZ_LEVELS = [
  { at: 0, name: 'Quiet street', bonus: 0, gems: 0, bia: 0 },
  { at: 100, name: 'Friendly block', bonus: 0.05, gems: 2, bia: 100 },
  { at: 350, name: 'Local favourite', bonus: 0.10, gems: 3, bia: 250 },
  { at: 900, name: 'Busy food street', bonus: 0.15, gems: 5, bia: 500 },
  { at: 1800, name: 'Destination', bonus: 0.20, gems: 8, bia: 1000 },
  { at: 3200, name: 'Famous food district', bonus: 0.25, gems: 15, bia: 2000 },
];

// Visitors a day for each point of buzz (just for show).
export const VISITORS_PER_BUZZ = 3;
