// Elayna's neighbourhood: the food district she builds up, like a BIA (business improvement area).
// Each improvement shows up on the street. Improvements, restaurant stars and restaurant upgrades
// all add "buzz". More buzz brings more people to the neighbourhood, and every buzz level
// pays gems and makes customers pay a little more in all of her restaurants.

export const HOOD = { defaultName: 'Tulip Row', nameMax: 22 };

// Bought in any order, with dollars. "buzz" is what each adds. "choice" lets her pick a style.
export const IMPROVEMENTS = [
  { id: 'trees', name: 'Street trees', cost: 150, buzz: 30, about: 'Shade, birdsong and colour.', choice: 'trees' },
  { id: 'lamps', name: 'Old-fashioned lamp posts', cost: 250, buzz: 40, about: 'A warm glow after dark.' },
  { id: 'benches', name: 'Benches and planters', cost: 350, buzz: 50, about: 'Somewhere to sit and stay a while.' },
  { id: 'garden', name: 'Tulip garden', cost: 500, buzz: 70, about: 'The empty lot becomes a garden.', choice: 'flowers' },
  { id: 'mural', name: 'Neighbourhood mural', cost: 650, buzz: 80, about: 'A big painting on the side of a building.', choice: 'mural' },
  { id: 'bikes', name: 'Bike lane and racks', cost: 800, buzz: 90, about: 'Easy to get here on two wheels.' },
  { id: 'streetcar', name: 'Streetcar stop', cost: 1000, buzz: 110, about: 'Visitors arrive from all over the city.' },
  { id: 'market', name: 'Weekend farmers market', cost: 1300, buzz: 140, about: 'Stalls full of fresh food.' },
  { id: 'lights', name: 'Lights over the street', cost: 1600, buzz: 160, about: 'The street sparkles at night.' },
  { id: 'fountain', name: 'Fountain plaza', cost: 2000, buzz: 190, about: 'A place to meet friends.' },
  { id: 'stage', name: 'Music stage', cost: 2500, buzz: 220, about: 'Live music on summer nights.' },
  { id: 'arch', name: 'Welcome arch with your neighbourhood name', cost: 3200, buzz: 300, about: 'Everyone knows where they are.' },
];

// Amenities open up as the neighbourhood grows. "needs" is the buzz level (see BUZZ_LEVELS, 1 = Friendly block).
export const AMENITIES = [
  { id: 'washrooms', name: 'Public washrooms', cost: 400, buzz: 50, needs: 1, about: 'Families can stay all afternoon.' },
  { id: 'park', name: 'Neighbourhood park', cost: 900, buzz: 100, needs: 2, about: 'Grass, trees and picnic tables.' },
  { id: 'splash', name: 'Splash pad', cost: 1400, buzz: 130, needs: 3, about: 'Kids run through the fountains.' },
  { id: 'pool', name: 'Community pool', cost: 2200, buzz: 180, needs: 4, about: 'A summer favourite.' },
  { id: 'zoo', name: 'Petting zoo', cost: 3500, buzz: 250, needs: 5, about: 'Goats, bunnies and a very friendly duck.' },
];

// Events she can host once they unlock. One at a time. Each boosts the next few customers:
// "orders" customers pay "bonus" more (and earn "stars" extra stars each). The first time adds buzz.
export const EVENTS = [
  { id: 'trucks', name: 'Food truck rally', cost: 200, needs: 1, orders: 6, bonus: 0.25, stars: 0, firstBuzz: 40, about: 'Food trucks line the street.' },
  { id: 'festival', name: 'Street festival', cost: 400, needs: 2, orders: 8, bonus: 0.30, stars: 1, firstBuzz: 60, about: 'Bunting, music and crowds.' },
  { id: 'parade', name: 'Parade', cost: 700, needs: 3, orders: 10, bonus: 0.35, stars: 1, firstBuzz: 80, about: 'Food friends march down the street.' },
  { id: 'tulipfest', name: 'Tulip festival', cost: 1000, needs: 4, orders: 10, bonus: 0.40, stars: 1, firstBuzz: 100, about: 'Tulips everywhere you look.' },
  { id: 'fireworks', name: 'Fireworks night', cost: 1500, needs: 5, orders: 12, bonus: 0.50, stars: 2, firstBuzz: 150, about: 'The sky lights up over the neighbourhood.' },
];

// Style choices. The first option is the one she starts with.
export const HOOD_CHOICES = {
  trees: [{ name: 'Maple', colour: '#e8742f' }, { name: 'Cherry blossom', colour: '#f6b3c8' }, { name: 'Leafy green', colour: '#5fb34a' }],
  flowers: [{ name: 'Pink tulips', colour: '#e8475f' }, { name: 'Purple tulips', colour: '#8b55a6' }, { name: 'Yellow tulips', colour: '#f6c33e' }],
  mural: [{ name: 'Tulips', colour: '#e8475f' }, { name: 'Eggplants', colour: '#5b2c6f' }, { name: 'Food friends', colour: '#e9412f' }],
};

// Buzz from her restaurants, in every city.
export const RESTAURANT_BUZZ = { perStar: 40, perUpgrade: 6 };

// Neighbourhood levels. "bonus": customers in all restaurants pay this much more. "gems": the reward for reaching it.
export const BUZZ_LEVELS = [
  { at: 0, name: 'Quiet street', bonus: 0, gems: 0 },
  { at: 100, name: 'Friendly block', bonus: 0.05, gems: 2 },
  { at: 250, name: 'Local favourite', bonus: 0.10, gems: 3 },
  { at: 500, name: 'Busy food street', bonus: 0.15, gems: 5 },
  { at: 850, name: 'Destination', bonus: 0.20, gems: 8 },
  { at: 1300, name: 'Famous food district', bonus: 0.25, gems: 15 },
];

// Visitors a day for each point of buzz (just for show).
export const VISITORS_PER_BUZZ = 3;
