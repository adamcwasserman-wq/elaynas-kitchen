// Tulip Island: Elayna's neighbourhood as an island she builds on, seen from above at an angle.
// The map is a square of squares (mostly sea at first). The island is a circle of land in the middle
// that grows when she buys more shoreline with Island dollars. Her restaurants sit on Main Street.
// Everything else (landmarks, amenities, decorations, boats) she places herself.
// Squares are counted from the top corner: x runs down to the right, y runs down to the left.

export const ISLAND = {
  size: 22,               // the map is 22 x 22 squares
  centre: 10.5,           // the middle of the island
  mainStreet: 11,         // the row of squares that is Main Street
  // Land she owns: the island's radius, in squares, and what each bigger island costs in Island dollars.
  land: [
    { radius: 4.7, cost: 0 },
    { radius: 5.7, cost: 400 },
    { radius: 6.7, cost: 900 },
    { radius: 7.7, cost: 1800 },
    { radius: 8.7, cost: 3000 },
    { radius: 9.7, cost: 4500 },
  ],
  // Where each restaurant lot sits (its top square). Matches "slot" in data/cities.js.
  lots: { 0: [7, 9], 1: [9, 9], 2: [11, 9], 4: [9, 12] },
  // Sailboats out on the water, by buzz level (see BUZZ_LEVELS).
  sailboats: [1, 2, 3, 4, 5, 6],
  // It's night on the island between these hours (she can switch it by hand too).
  night: { from: 19, to: 7 },
};

// The size of each landmark and amenity on the map, in squares (across, down), and where it can go:
//   land   on the island
//   water  in the sea, touching the island (docks and harbours)
//   shore  on the island, touching the sea
export const PIECES = {
  // landmarks (the 12 improvements in data/neighbourhood.js)
  trees: { size: [2, 2], on: 'land' },
  lamps: { size: [2, 1], on: 'land' },
  benches: { size: [2, 1], on: 'land' },
  garden: { size: [2, 2], on: 'land' },
  mural: { size: [2, 1], on: 'land' },
  bikes: { size: [2, 1], on: 'land' },
  streetcar: { size: [2, 2], on: 'water' }, // the ferry dock
  market: { size: [2, 2], on: 'land' },
  lights: { size: [3, 1], on: 'land' },
  fountain: { size: [2, 2], on: 'land' },
  stage: { size: [2, 2], on: 'land' },
  arch: { size: [2, 1], on: 'land' },
  // amenities
  washrooms: { size: [1, 1], on: 'land' },
  park: { size: [3, 2], on: 'land' },
  splash: { size: [2, 2], on: 'land' },
  pool: { size: [3, 2], on: 'land' },
  zoo: { size: [3, 3], on: 'land' },
  lighthouse: { size: [1, 1], on: 'shore' },
  marina: { size: [3, 2], on: 'water' },
};

// Decorations: little things she can place as many of as she likes, just for looks (no buzz).
// Moving one is free, and putting one away gives the money back.
export const ISLAND_DECOR = [
  { id: 'maple', name: 'Maple tree', cost: 40, on: 'land' },
  { id: 'cherry', name: 'Cherry tree', cost: 40, on: 'land' },
  { id: 'leafy', name: 'Leafy tree', cost: 40, on: 'land' },
  { id: 'flowers', name: 'Tulip bed', cost: 30, on: 'land' },
  { id: 'bench', name: 'Bench', cost: 50, on: 'land' },
  { id: 'lamp', name: 'Lamp post', cost: 60, on: 'land' },
  { id: 'path', name: 'Path', cost: 10, on: 'land' },
  { id: 'rowboat', name: 'Rowboat', cost: 80, on: 'sea' },
  { id: 'sailboat', name: 'Sailboat', cost: 150, on: 'sea' },
  { id: 'duck', name: 'Duck', cost: 25, on: 'sea' },
];
