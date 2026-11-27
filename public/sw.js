// Masakali Service Worker Kill-Switch
// Clears any stale v1/v2 caches and unregisters itself so mobile & desktop always load live builds without hard refresh.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) => {
          if (client && 'navigate' in client) {
            client.navigate(client.url).catch(() => {});
          }
        });
      })
      .catch(() => {})
  );
  self.clients.claim();
});
