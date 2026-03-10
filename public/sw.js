const CACHE_NAME = 'energy-dashboard-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests and API requests
  if (event.request.method !== 'GET' || event.request.url.includes(':1881')) {
    return;
  }

  // Network-first strategy to ensure Vite dev server works correctly
  // while still satisfying PWA installability requirements
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses from our origin
        if (response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request);
      })
  );
});
