// Every restaurant with a cooking shift kitchen, by restaurant id (see data/cities.js).
// Each kitchen keeps its own shifts, tip jar and helpers (saved in S.kitchen[restaurant id]).
// Kitchen missions and badges add up every kitchen.

import { BAKERY } from './kitchen.js';
import { COCINA } from './cocina.js';
import { TRATTORIA } from './trattoria.js';

export const KITCHENS = { toronto: BAKERY, mexico: COCINA, rome: TRATTORIA };
export const KITCHEN_CITIES = Object.keys(KITCHENS);
