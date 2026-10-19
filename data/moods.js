// Moods: Elayna picks how busy her restaurants feel today (Settings, "Today's mood").
// "Just right" is the game as it was made; the others lean easier or harder.
//
//   patience     customers' clocks run this many times slower (2 = they wait twice as long, and speed tips last longer)
//   hearts       extra complaints allowed before the round starts over (can be negative; there's always at least one)
//   complaints   false: customers never leave at all
//   calm         true: Zip (the VIP in a hurry) doesn't come
//   customersMax at most this many customers waiting at once
//   wantsMax     each customer asks for at most this many things (above MAX_WANTS only once orders can be big, past 100 stars)
//   wantsMin     customers ask for at least this many things, once orders can be that big
//   tierShift    foods asked for are this many levels lower (or higher)
//   pay          customers pay this much more (0.2 = 20%)
//   extraStars   orders give this much more in stars (0.5 = half again)

export const MOODS = [
  { id: 'cozy', name: 'Cozy', about: "No rush at all. Customers never leave, orders stay small, and Zip stays home.",
    patience: 2, hearts: 0, complaints: false, calm: true, customersMax: 2, wantsMax: 1, tierShift: -1, pay: 0, extraStars: 0 },
  { id: 'easy', name: 'Easygoing', about: 'Customers wait half again as long, and forgive two more slow orders.',
    patience: 1.5, hearts: 2, pay: 0, extraStars: 0 },
  { id: 'normal', name: 'Just right', about: 'The game as it was made.',
    patience: 1, hearts: 0, pay: 0, extraStars: 0 },
  { id: 'busy', name: 'Busy day', about: 'Customers are in more of a hurry and forgive one fewer slow order. They pay 20% more and give a quarter more stars.',
    patience: .75, hearts: -1, pay: .2, extraStars: .25 },
  { id: 'rush', name: 'Dinner rush', about: 'Quick customers who order two things whenever they can (up to three past 100 stars), and only one slow order allowed. They pay 40% more and give half again as many stars.',
    patience: .55, hearts: -2, wantsMin: 2, wantsMax: 3, pay: .4, extraStars: .5 },
];
export const DEFAULT_MOOD = 'normal';
