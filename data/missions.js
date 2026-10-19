// Missions: one-time goals that pay gems. They tick off by themselves; she taps "Claim" in the gem shop.
// "stat" is what's counted (see missionStat in js/main.js), "n" is the goal.
export const MISSIONS = [
  { id: 'serve10', name: 'Serve 10 customers', stat: 'served', n: 10, gems: 2 },
  { id: 'recipes3', name: 'Discover 3 recipes', stat: 'recipes', n: 3, gems: 2 },
  { id: 'star1', name: 'Earn a 1-star rating', stat: 'stars', n: 1, gems: 2 },
  { id: 'build1', name: 'Build something on your island', stat: 'hoodLevels', n: 1, gems: 2 },
  { id: 'upgrade3', name: 'Buy 3 restaurant upgrades', stat: 'upgradeLevels', n: 3, gems: 3 },
  { id: 'serve50', name: 'Serve 50 customers', stat: 'served', n: 50, gems: 3 },
  { id: 'vip1', name: 'Serve a VIP', stat: 'vips', n: 1, gems: 3 },
  { id: 'event1', name: 'Host a neighbourhood event', stat: 'events', n: 1, gems: 3 },
  { id: 'open2', name: 'Open a second restaurant', stat: 'restaurants', n: 2, gems: 4 },
  { id: 'recipes10', name: 'Discover 10 recipes', stat: 'recipes', n: 10, gems: 4 },
  { id: 'arcade3', name: 'Win 3 side games', stat: 'arcadeWins', n: 3, gems: 4 },
  { id: 'top1', name: 'Take an upgrade to level 3', stat: 'maxedUpgrades', n: 1, gems: 5 },
  { id: 'amazing1', name: 'Take an island landmark to stage 3', stat: 'maxedImprovements', n: 1, gems: 5 },
  { id: 'buzz3', name: 'Make your island a Busy food street', stat: 'buzzLevel', n: 3, gems: 6 },
  { id: 'serve200', name: 'Serve 200 customers', stat: 'served', n: 200, gems: 6 },
  { id: 'stars6', name: 'Earn 6 restaurant stars in all', stat: 'stars', n: 6, gems: 8 },
  { id: 'open3', name: 'Open all three restaurants', stat: 'restaurants', n: 3, gems: 8 },
  { id: 'buzz5', name: 'Become a Famous food district', stat: 'buzzLevel', n: 5, gems: 15 },
];
