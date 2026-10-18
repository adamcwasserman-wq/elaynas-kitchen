// Badges. Seven families, each with bronze, silver and gold.
// "unit" and "one" are the words used for many and for exactly one.
// "tiers" are the counts needed for bronze, silver and gold. Early ones come quickly on purpose.
// Families marked "soon" arrive with later updates (mini games, trivia, more cities).

export const BADGES = [
  { id: 'chef', name: 'Chef', unit: 'dishes made', one: 'dish made', stat: 'mixes', tiers: [1, 10, 40] },
  { id: 'merger', name: 'Merger', unit: 'merges', one: 'merge', stat: 'merges', tiers: [10, 75, 300] },
  { id: 'collector', name: 'Collector', unit: 'recipes found', one: 'recipe found', stat: 'recipes', tiers: [1, 6, 16] },
  { id: 'tycoon', name: 'Tycoon', unit: 'dollars earned', one: 'dollar earned', stat: 'earned', tiers: [100, 1000, 5000] },
  { id: 'traveller', name: 'Traveller', unit: 'cities opened', soon: true },
  { id: 'arcade', name: 'Arcade', unit: 'mini game wins', one: 'mini game win', stat: 'arcadeWins', tiers: [1, 10, 40] },
  { id: 'scholar', name: 'Scholar', unit: 'trivia answers right', one: 'trivia answer right', stat: 'triviaRight', tiers: [1, 7, 30] },
];

export const BADGE_TIER_NAMES = ['Bronze', 'Silver', 'Gold'];

// Dollars for earning bronze, silver and gold. (Badges also give gems: see data/arcade.js.)
export const BADGE_REWARD = [20, 75, 250];
