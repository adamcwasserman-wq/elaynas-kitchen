// Badges. Seven food friends, each served under a silver lid and rated one, two or three golden spoons.
// "id" is what the save file remembers, so it stays the same even if the name changes.
// "unit" and "one" are the words used for many and for exactly one.
// "tiers" are the counts needed for one, two and three spoons. Early ones come quickly on purpose.
// Families marked "soon" arrive with later updates (more cities).

export const BADGES = [
  { id: 'chef', name: 'Mixing Whiz', unit: 'dishes made', one: 'dish made', stat: 'mixes', tiers: [1, 10, 40] },
  { id: 'merger', name: 'Combo Cook', unit: 'merges', one: 'merge', stat: 'merges', tiers: [10, 75, 300] },
  { id: 'collector', name: 'Recipe Keeper', unit: 'recipes found', one: 'recipe found', stat: 'recipes', tiers: [1, 6, 16] },
  { id: 'tycoon', name: 'Tip Jar', unit: 'dollars earned', one: 'dollar earned', stat: 'earned', tiers: [100, 1000, 5000] },
  { id: 'traveller', name: 'Food Explorer', unit: 'cities opened', soon: true },
  { id: 'arcade', name: 'Fun Fair', unit: 'mini game wins', one: 'mini game win', stat: 'arcadeWins', tiers: [1, 10, 40] },
  { id: 'scholar', name: 'Smart Cookie', unit: 'trivia answers right', one: 'trivia answer right', stat: 'triviaRight', tiers: [1, 7, 30] },
];

export const BADGE_TIER_NAMES = ['One spoon', 'Two spoons', 'Three spoons'];

// Dollars for earning one, two and three spoons. (Badges also give gems: see data/arcade.js.)
export const BADGE_REWARD = [20, 75, 250];
