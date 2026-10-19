// Mini golf: a sunny Florida course where every hole is a different restaurant.
// Flick the ball toward the hole like a skee ball roll: the faster the flick, the harder the putt.
// Get par or better on a hole to open the next one.

export const MINIGOLF = {
  freeHoles: 6,            // free holes per day (after that, one more hole costs DAILY.extraPlayGems)
  unlockStars: 2,          // stars needed on a hole to open the next one (2 = par or better)
  maxOver: 4,              // after par + this many shots the ball is picked up (no stars, try again)
  waterPenalty: 1,         // extra shots for a splash
  // Stars by shots: under par = 3, par = 2, up to par + 2 = 1, more = 0.
  gems: [0, 0, 1, 2],      // gems for 0, 1, 2 and 3 stars (times "gemsTimes"): par earns one, under par two
  holeInOneGems: 2,        // a hole in one adds this many gems
  modes: {
    // guide: how far the aiming dots reach (0 = a short arrow only)
    // cupPull / pullRadius: how strongly the cup draws a slow ball in, and from how far
    // capture: the fastest a ball can be going and still drop in
    relaxed: { name: 'Relaxed', guide: 75, cupPull: 170, pullRadius: 10, capture: 150, gemsTimes: 1 },
    challenge: { name: 'Challenge', guide: 0, cupPull: 60, pullRadius: 6, capture: 110, gemsTimes: 2 },
  },
};

// The course is 100 wide and 160 tall. y = 0 is the top of the screen.
// Shapes: { rect: [x, y, w, h] }, { circle: [x, y, r] }, { poly: [[x, y], ...] },
//         { arc: [x, y, r, fromDeg, toDeg], w } (a curved wall; 0 degrees points right, 90 points down).
// outline: the edge of the green (a wall all the way round).
// blocks: things the ball bounces off. "bounce" above 1 is a springy bumper.
// water: splash, one extra shot, back to where you hit from. bridges cross the water safely.
// sand: slows the ball right down. slopes: push the ball (force [x, y]).
// mounds: round hills (k above 0 pushes away, below 0 pulls in). belts: carry the ball along (v [x, y]).
// movers: "spin" (turning blades), "slide" (glides back and forth; "turn" spins its picture) and
//         "orbit" (things riding round a turning tray). tunnels: in one end, out the other.
// decor: just for looks ("over" draws it on top of the course, like a flamingo in the water).
export const HOLES = [
  {
    id: 'pizza', name: 'Pizzeria', cuisine: 'Italian', par: 2,
    tip: 'Swipe toward the hole. Mind the sliding pizza!',
    theme: { ground: 'check', c1: '#fdf3e3', c2: '#e2564a', rail: '#b5402f', flag: '#3f9b3c' },
    outline: [[38, 14], [62, 14], [86, 148], [14, 148]],
    tee: [50, 136], cup: [50, 28],
    movers: [{ type: 'slide', from: [37, 84], to: [63, 84], period: 5, r: 9, look: 'pizza', bounce: 1.1, turn: .6 }],
    decor: [{ look: 'basil', x: 14, y: 30, s: 1 }, { look: 'basil', x: 86, y: 52, s: .8 }, { look: 'palm', x: 9, y: 96, s: 1 }, { look: 'palm', x: 91, y: 128, s: 1.1 }],
  },
  {
    id: 'taco', name: 'Taco Stand', cuisine: 'Mexican', par: 3,
    tip: 'Turn the corner. Dodge the dancing pinata!',
    theme: { ground: 'dots', c1: '#f6d39a', c2: '#e9b56c', rail: '#e8742f', flag: '#e8475f' },
    outline: [[52, 148], [88, 148], [88, 16], [12, 16], [12, 58], [52, 58]],
    tee: [70, 136], cup: [24, 36],
    blocks: [
      { circle: [70, 96, 5], look: 'cactus' },
      { circle: [81, 24, 6], look: 'taco', bounce: 1.15 },
    ],
    mounds: [{ x: 50, y: 37, r: 11, k: 160, look: 'sombrero' }],
    movers: [{ type: 'slide', from: [37, 23], to: [37, 51], period: 2.8, r: 4.5, look: 'pinata', bounce: 1.1 }],
    decor: [{ look: 'cactusPot', x: 30, y: 80, s: 1 }, { look: 'cactusPot', x: 40, y: 120, s: .8 }, { look: 'palm', x: 20, y: 140, s: 1.1 }, { look: 'pepper', x: 40, y: 98, s: 1 }],
  },
  {
    id: 'sushi', name: 'Sushi Bar', cuisine: 'Japanese', par: 3,
    tip: 'The sushi belt pulls the ball left. Aim right!',
    theme: { ground: 'planks', c1: '#8a5a3c', c2: '#7a4b31', rail: '#2a2a33', flag: '#e8475f' },
    outline: [[12, 14], [88, 14], [88, 148], [12, 148]],
    tee: [70, 136], cup: [28, 30],
    belts: [{ rect: [12, 76, 76, 16], v: [-55, 0] }],
    water: [{ circle: [70, 38, 11], look: 'koi' }],
    blocks: [{ rect: [12, 53, 34, 4], look: 'bamboo' }, { circle: [26, 118, 5], look: 'sushi', bounce: 1.1 }],
    movers: [{ type: 'spin', x: 62, y: 112, len: 10, n: 2, speed: 1.2, w: 1.8, look: 'chopsticks' }],
    decor: [{ look: 'lantern', x: 6, y: 40, s: 1 }, { look: 'lantern', x: 94, y: 110, s: 1 }, { look: 'blossom', x: 94, y: 30, s: 1 }],
  },
  {
    id: 'burger', name: 'Burger Diner', cuisine: 'American', par: 3,
    tip: 'Time it! Slip past the spinning straws.',
    theme: { ground: 'check', c1: '#f4f1ea', c2: '#2b3b4a', rail: '#2fb3b0', flag: '#e8475f' },
    outline: [[14, 14], [86, 14], [86, 60], [62, 74], [62, 96], [86, 110], [86, 148], [14, 148], [14, 110], [38, 96], [38, 74], [14, 60]],
    tee: [50, 136], cup: [50, 24],
    movers: [
      { type: 'spin', x: 50, y: 85, len: 11.5, n: 2, speed: 1.5, w: 2.6, look: 'straw' },
      { type: 'slide', from: [40, 44], to: [60, 44], period: 2.6, r: 7, look: 'burger', bounce: 1.1 },
    ],
    blocks: [
      { circle: [25, 36, 3.6], look: 'ketchup', bounce: 1.1 },
      { circle: [75, 36, 3.6], look: 'mustard', bounce: 1.1 },
    ],
    decor: [{ look: 'shake', x: 14, y: 85, s: 1 }, { look: 'shake', x: 86, y: 85, s: 1 }, { look: 'palm', x: 7, y: 150, s: 1 }],
  },
  {
    id: 'dimsum', name: 'Dim Sum House', cuisine: 'Chinese', par: 3,
    tip: 'Over the bridge, then dodge the steamer!',
    theme: { ground: 'dots', c1: '#c8372d', c2: '#e2a63b', rail: '#f6b62e', flag: '#3f9b3c' },
    outline: [[12, 14], [88, 14], [88, 148], [12, 148]],
    tee: [50, 136], cup: [50, 26],
    water: [{ rect: [12, 66, 76, 20] }],
    bridges: [{ rect: [40, 64, 20, 24] }],
    blocks: [
      { rect: [37.5, 64, 2.5, 24], look: 'rail' }, { rect: [60, 64, 2.5, 24], look: 'rail' },
    ],
    movers: [
      { type: 'slide', from: [24, 44], to: [76, 44], period: 3.4, r: 6.5, look: 'steamer' },
      { type: 'orbit', x: 50, y: 110, R: 15, n: 3, speed: .9, r: 4.5, look: 'dumpling', bounce: 1.1 },
    ],
    decor: [{ look: 'lantern', x: 6, y: 30, s: 1 }, { look: 'lantern', x: 94, y: 30, s: 1 }, { look: 'lantern', x: 6, y: 120, s: 1 }, { look: 'lantern', x: 94, y: 120, s: 1 }],
  },
  {
    id: 'greek', name: 'Greek Taverna', cuisine: 'Greek', par: 3,
    tip: 'Past the windmill, then hit it hard uphill!',
    theme: { ground: 'tiles', c1: '#ffffff', c2: '#2c6fb5', rail: '#2c6fb5', flag: '#f6b62e' },
    outline: [[12, 24], [22, 14], [88, 14], [88, 148], [12, 148]],
    tee: [50, 136], cup: [74, 28],
    slopes: [{ rect: [12, 66, 76, 30], f: [0, 85] }],
    sand: [{ circle: [56, 26, 7], look: 'feta' }],
    blocks: [{ circle: [32, 42, 5.5], look: 'olive' }, { circle: [64, 50, 5.5], look: 'olive' }],
    movers: [{ type: 'spin', x: 50, y: 112, len: 11, n: 4, speed: .9, w: 2, look: 'windmill' }],
    decor: [{ look: 'dome', x: 6, y: 140, s: 1 }, { look: 'umbrella', x: 94, y: 110, s: 1 }, { look: 'palm', x: 6, y: 60, s: 1 }],
  },
  {
    id: 'curry', name: 'Curry House', cuisine: 'Indian', par: 3,
    tip: 'Try the tandoor oven. It is a shortcut!',
    theme: { ground: 'dots', c1: '#f4a62a', c2: '#e2412f', rail: '#7a2f6f', flag: '#2f8a8f' },
    outline: [[12, 14], [88, 14], [88, 72], [32, 72], [32, 92], [88, 92], [88, 148], [12, 148]],
    tee: [64, 136], cup: [38, 28],
    tunnels: [{ from: [78, 106], to: [78, 60], dir: [-0.55, -1], r: 5 }],
    mounds: [{ x: 60, y: 38, r: 10, k: 150, look: 'chili' }],
    sand: [{ rect: [14, 16, 20, 18], look: 'turmeric' }],
    blocks: [{ circle: [36, 124, 5], look: 'samosa', bounce: 1.1 }],
    movers: [{ type: 'slide', from: [48, 106], to: [68, 106], period: 3, r: 4, look: 'lassi', bounce: 1.1 }],
    decor: [{ look: 'spices', x: 60, y: 82, s: 1 }, { look: 'palm', x: 94, y: 82, s: 1 }],
  },
  {
    id: 'crepe', name: 'Creperie', cuisine: 'French', par: 3,
    tip: 'Sneak past the whisks into the crepe pan.',
    theme: { ground: 'stripes', c1: '#f3e6f0', c2: '#a8c8e8', rail: '#3a4a7a', flag: '#e8475f' },
    outline: [[30, 14], [70, 14], [88, 32], [88, 130], [70, 148], [30, 148], [12, 130], [12, 32]],
    tee: [50, 136], cup: [50, 38],
    blocks: [
      { arc: [50, 38, 14, 116, 424], w: 3, look: 'pan' },
      { circle: [50, 112, 6], look: 'croissant', bounce: 1.1 },
    ],
    mounds: [{ x: 50, y: 38, r: 12, k: -60 }],
    movers: [
      { type: 'spin', x: 34, y: 80, len: 12, n: 3, speed: 1.3, w: 2.2, look: 'whisk' },
      { type: 'spin', x: 66, y: 80, len: 12, n: 3, speed: -1.3, w: 2.2, look: 'whisk' },
    ],
    decor: [{ look: 'umbrella', x: 8, y: 150, s: .9 }, { look: 'umbrella', x: 92, y: 150, s: .9 }, { look: 'palm', x: 6, y: 16, s: .9 }, { look: 'palm', x: 94, y: 16, s: .9 }],
  },
  {
    id: 'tiki', name: 'Tiki Shack', cuisine: 'Florida', par: 4,
    tip: 'Cross the lagoon, dodge Gus the Gator!',
    theme: { ground: 'sand', c1: '#f5dca0', c2: '#e8c47a', rail: '#8a5a2b', flag: '#e8475f' },
    outline: [[10, 14], [90, 14], [90, 148], [10, 148]],
    tee: [50, 138], cup: [50, 30],
    water: [{ rect: [10, 66, 80, 28] }],
    bridges: [{ rect: [16, 64, 14, 32] }, { rect: [70, 64, 14, 32] }],
    blocks: [
      { rect: [13.5, 64, 2.5, 32], look: 'rail' }, { rect: [30, 64, 2.5, 32], look: 'rail' },
      { rect: [67.5, 64, 2.5, 32], look: 'rail' }, { rect: [84, 64, 2.5, 32], look: 'rail' },
      { arc: [50, 30, 15, 130, 410], w: 4, look: 'volcano' },
      { circle: [50, 114, 4.5], look: 'palmBlock' },
      { circle: [24, 124, 5], look: 'pie', bounce: 1.1 }, { circle: [76, 124, 5], look: 'pie', bounce: 1.1 },
    ],
    mounds: [{ x: 50, y: 30, r: 13, k: -90 }],
    movers: [{ type: 'slide', from: [24, 54], to: [76, 54], period: 4.2, r: 3.6, len: 12, look: 'gator' }],
    decor: [{ look: 'flamingo', x: 50, y: 80, s: 1, over: true }, { look: 'flamingo', x: 40, y: 86, s: .8, over: true },
      { look: 'torch', x: 5, y: 40, s: 1 }, { look: 'torch', x: 95, y: 40, s: 1 }, { look: 'torch', x: 5, y: 120, s: 1 }, { look: 'torch', x: 95, y: 120, s: 1 }],
  },
];
