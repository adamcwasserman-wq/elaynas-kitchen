// Keeps a copy of the game on the phone so it works with no connection.
// When you change any game file, bump VERSION so phones pick up the new copy.

const VERSION = 'ek-0.35.0';
const FILES = [
  './',
  'index.html',
  'install.html',
  'manifest.webmanifest',
  'css/game.css',
  'js/main.js',
  'js/art.js',
  'js/save.js',
  'data/config.js',
  'data/items.js',
  'data/customers.js',
  'data/vips.js',
  'data/orders.js',
  'data/recipes.js',
  'data/badges.js',
  'data/restaurant.js',
  'data/arcade.js',
  'data/trivia.js',
  'data/cities.js',
  'data/neighbourhood.js',
  'data/missions.js',
  'data/island.js',
  'data/moods.js',
  'js/island.js',
  'js/arcade.js',
  'js/minigames.js',
  'data/minigolf.js',
  'js/minigolf.js',
  'data/kitchen.js',
  'js/kitchen.js',
  'js/kitchenArt.js',
  'js/track.js',
  'js/board.js',
  'data/leaderboard.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-48.png',
];

self.addEventListener('install', event => {
  // "reload" skips the browser's own short-term copy, so the new version really is new.
  event.waitUntil(caches.open(VERSION)
    .then(cache => cache.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The game asks which version is running (shown at the bottom of Settings).
self.addEventListener('message', event => {
  if (event.data === 'version') event.source?.postMessage({ version: VERSION });
});

// Serve from the saved copy first, and refresh that copy in the background when online.
// Fonts from Google are saved the first time they load.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;

  event.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
