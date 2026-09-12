// RunJS PWA Service Worker
const CACHE_NAME = 'runjs-pwa-v3';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/RunJS-192.png',
  '/RunJS-512.png',
  '/RunJS-maskable-192.png',
  '/RunJS-maskable-512.png',
  '/apple-touch-icon.png',
  '/runjs.in.webp',
  '/favicon.ico',
  '/favicon.svg',
];

// Install: Cache core application shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Pre-caching partial failure:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old cache versions and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first for navigation, stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests and http/https schemes
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Skip browser extension requests or third-party analytical requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML navigation requests: Network first, fall back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Static assets: Stale-while-revalidate strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
