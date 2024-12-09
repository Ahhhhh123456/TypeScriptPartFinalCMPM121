const CACHE_NAME = 'v1'; // Cache version
const BASE_URL = self.location.origin + `/TypeScriptPartFinalCMPM121`; // Base URL of the app

// List of resources to cache
const OFFLINE_URL = `${BASE_URL}/index.html`; // Offline fallback page
const ASSETS_TO_CACHE = [
    `${BASE_URL}/`, // Root index
    `${BASE_URL}/index.html`, // Main page
    `${BASE_URL}/manifest.json`, // Web app manifest
    `${BASE_URL}/assets/icons/icon-192x192.png`, // Icons
    `${BASE_URL}/assets/icons/icon-512x512.png`,
    `${BASE_URL}/assets/ar.json`, // Example sprite
    `${BASE_URL}/assets/ch.json`, // Example sprite
    `${BASE_URL}/assets/down.png`, // Example sprite
    `${BASE_URL}/assets/en.json`, // Example sprite
    `${BASE_URL}/assets/events.yaml`, // Example sprite
    `${BASE_URL}/assets/kenny-tiny-town-tilemap-packed.png`, // Example sprite
    `${BASE_URL}/assets/L.png`, // Example sprite
    `${BASE_URL}/assets/left.png`, // Example sprite
    `${BASE_URL}/assets/n.png`, // Example sprite
    `${BASE_URL}/assets/one.png`, // Example sprite
    `${BASE_URL}/assets/right.png`, // Example sprite
    `${BASE_URL}/assets/scythe.png`, // Example sprite
    `${BASE_URL}/assets/tilemap-characters-packed.json`, // Example sprite
    `${BASE_URL}/assets/tilemap-characters-packed.png`, // Example sprite
    `${BASE_URL}/assets/Tiny Town.tiled-project`, // Example sprite
    `${BASE_URL}/assets/Tiny Town.tiled-session`, // Example sprite
    `${BASE_URL}/assets/Tiny Town.tmx`, // Example sprite
    `${BASE_URL}/assets/TinyTownMap.json`, // Example sprite
    `${BASE_URL}/assets/two.png`, // Example sprite
    `${BASE_URL}/assets/up.png`, // Example sprite
    `${BASE_URL}/assets/y.png`, // Example sprite
    `${BASE_URL}/assets/z.png`, // Example sprite

    OFFLINE_URL, // Offline fallback file
];

// Install event - Cache only essential resources
caches.open(CACHE_NAME).then((cache) => {
    const fetchPromises = ASSETS_TO_CACHE.map((url) => {
        return fetch(url).then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status}`);
            }
            return cache.add(url);
        });
    });
    return Promise.all(fetchPromises);
}).catch((error) => {
    console.error('Failed to cache resources:', error);
});

// Fetch event - Serve cached resources or fallback to offline for navigation
self.addEventListener('fetch', (event) => {
  event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
          // Return cached response if available
          if (cachedResponse) {
              return cachedResponse;
          }

          // If the resource is not in cache, fetch it from the network
          return fetch(event.request).then((networkResponse) => {
              // Cache the response for future use if it's a game asset
              if (event.request.url.startsWith(BASE_URL + '/assets/')) {
                  caches.open(CACHE_NAME).then((cache) => {
                      cache.put(event.request, networkResponse.clone());
                  });
              }
              return networkResponse;
          }).catch(() => {
              // Serve offline.html for navigation requests if network fails
              if (event.request.mode === 'navigate') {
                  return caches.match(`${BASE_URL}/offline.html`);
              }
          });
      })
  );
});

// Activate event - Cleanup old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]; // List of valid cache versions
  event.waitUntil(
      caches.keys().then((cacheNames) => {
          return Promise.all(
              cacheNames.map((cacheName) => {
                  if (!cacheWhitelist.includes(cacheName)) {
                      console.log(`Deleting old cache: ${cacheName}`);
                      return caches.delete(cacheName);
                  }
              })
          );
      })
  );
});