// Masakali Lightweight Service Worker (Network-First for HTML & JS/CSS)
const CACHE_VERSION = 'masakali-v2-20261125';
const CACHE_NAME = CACHE_VERSION;
const STATIC_ASSETS = [
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
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Let network handle API requests, cross-origin requests & audio streams dynamically
  if (
    url.origin !== self.location.origin ||
    url.pathname.includes('/api/') ||
    request.headers.get('range') ||
    request.destination === 'audio' ||
    url.pathname.endsWith('.mp3')
  ) {
    return;
  }

  const isDocument = request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html');
  const isCodeAsset = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.mjs');

  // Network-First strategy for index.html and JS/CSS assets so mobile always gets the latest build
  if (isDocument || isCodeAsset) {
    event.respondWith(
      fetch(isDocument ? new Request(request, { cache: 'no-store' }) : request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            if (isDocument) return caches.match('/index.html');
            return undefined;
          });
        })
    );
    return;
  }

  // Cache-First with network fallback for static images/icons/manifest
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => undefined);
    })
  );
});
