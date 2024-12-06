self.addEventListener('install', (event) => {
    // Dynamically create the base URL based on the service worker's location
    const BASE_URL = `${self.location.origin}/TypeScriptPartFinalCMPM121`;
  
    event.waitUntil(
      caches.open('v1').then((cache) => {
        return cache.addAll([
          // Cache the resources using the dynamically generated base URL
          `${BASE_URL}/`,
          `${BASE_URL}/index.html`,
          `${BASE_URL}/assets/icons/icon-192x192.png`,
          `${BASE_URL}/assets/icons/icon-512x512.png`,
          `${BASE_URL}/manifest.json`,
        ]);
      })
    );
  });
  
  // Fetch event to serve cached resources
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached response if available, otherwise fetch from network
        return cachedResponse || fetch(event.request);
      })
    );
  });
  
  // Activate event to clean up old caches if necessary
  self.addEventListener('activate', (event) => {
    const cacheWhitelist = ['v1']; // Set the current cache version
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches not in the whitelist
            if (!cacheWhitelist.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });
  