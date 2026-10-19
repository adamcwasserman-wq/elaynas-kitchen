// VIPs: special guests who drop in now and then. Each one plays a little differently
// and pays something extra. Their pictures are drawn in js/art.js (CUSTOMER_ART, same id).
//
// kind says how they play (the game logic for each kind lives in js/main.js):
//   rush     Zip is in a hurry. Serve before his timer runs out or he leaves and takes stars with him.
//   puzzle   Penny can't decide. She names three foods she likes and loves any dish made from two of them.
//   critic   Monsieur Croissant writes a review: one, two or three golden spoons, by how fast he's served.
//   gift     Bubbie wants one of Elayna's own recipes, and leaves a wild card on the board as a thank you.
//   party    Pina orders for a whole party: two things at once, and pays double.
//
// pay: times the normal price. gems: gems on top. stars: extra stars on top of the order's own.
// intro: shown once, the first time each VIP walks in. about: shown when she taps the VIP's picture.

export const VIPS = [
  {
    id: 'zip', name: 'Zip', kind: 'rush', title: 'The delivery driver',
    pay: 2, gems: 2, stars: 3,
    lose: 2,         // stars lost if he leaves
    seconds: 0.6,    // his timer: this share of the stage's speed-tip time (at least 60 seconds)
    intro: "Zip delivers food all over town and he's always in a hurry. Serve him before his timer runs out for double pay. If he leaves, you lose 2 stars!",
    about: 'Zip is in a hurry. Beat the timer for double pay, or lose 2 stars.',
    gone: 'Zip zoomed off without his order.',
  },
  {
    id: 'penny', name: 'Penny', kind: 'puzzle', title: 'The indecisive one',
    pay: 1.5, gems: 3, stars: 2,
    intro: "Penny can never decide! She names three foods she likes. Mix two of them into a dish and she'll love it. Which two make a recipe? That's the puzzle.",
    about: 'Penny likes these three foods. Mix two of them into a dish for her.',
  },
  {
    id: 'critic', name: 'Monsieur Croissant', kind: 'critic', title: 'The food critic',
    pay: 1, gems: 1, stars: 2, // gems and stars are per golden spoon in his review
    intro: 'A famous food critic! He wants something fancy. Serve him fast for a three spoon review: every spoon is worth gems and stars.',
    about: 'The food critic. The faster you serve him, the more golden spoons in his review.',
  },
  {
    id: 'bubbie', name: 'Bubbie', kind: 'gift', title: 'Everyone\'s grandma',
    pay: 1, gems: 2, stars: 2,
    intro: "Bubbie only orders the classics: Elayna's own recipes. She's never in a rush, and she always leaves a little gift.",
    about: "Bubbie wants one of Elayna's own recipes. She leaves a wild card as a thank you.",
  },
  {
    id: 'party', name: 'Pina', kind: 'party', title: 'The party planner',
    pay: 2, gems: 3, stars: 2,
    intro: 'Pina is throwing a party and orders two things at once. Big order, double pay!',
    about: 'Pina orders for a party: two things at once, for double pay.',
  },
];

// When VIPs show up.
// afterStars: no VIPs until the restaurant has this many stars (the second order stage).
// chance: how often a new customer is a VIP once they can show up.
// gap: at least this many regular customers between two VIPs.
// Only one VIP waits at a time.
export const VIP_RULES = { afterStars: 8, chance: 0.2, gap: 3 };
