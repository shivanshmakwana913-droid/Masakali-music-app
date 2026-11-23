// Masakali Lightweight Service Worker
const CACHE_NAME = 'masakali-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let network handle API requests & audio streams dynamically (preserve Range requests & mobile background streaming)
  if (
    event.request.url.includes('/api/') ||
    event.request.headers.get('range') ||
    event.request.destination === 'audio' ||
    event.request.url.endsWith('.mp3')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache static image assets (e.g. /logo.png)
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.endsWith('.png') || event.request.url.endsWith('.svg') || event.request.url.endsWith('.ico'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
