// Wales Trip Companion — offline-first service worker
// Strategy: network-first, falling back to cache. This means:
//  - When you have signal, you always get the latest version (auto-refresh).
//  - When you don't, you get whatever was last successfully cached.
// Every successful online load re-caches the newest version automatically.

const CACHE_NAME = 'wales-trip-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Got a fresh copy over the network — update the offline cache with it.
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        // No network — serve the last cached copy. Fall back to the cached
        // index.html for any navigation request so the app still opens.
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
