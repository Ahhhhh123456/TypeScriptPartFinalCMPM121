const CACHE_NAME = 'v1'; // Cache version
const BASE_URL = `${self.location.origin}`; // Base URL of the app

// List of resources to cache
const OFFLINE_URL = `${BASE_URL}/offline.html`; // Offline fallback page
const ASSETS_TO_CACHE = [
    `${BASE_URL}/`, // Root index
    `${BASE_URL}/index.html`, // Main page
    `${BASE_URL}/manifest.json`, // Web app manifest
    `${BASE_URL}/assets/icons/icon-192x192.png`, // Icons
    `${BASE_URL}/assets/icons/icon-512x512.png`,
    `${BASE_URL}/assets/sprites/sprite.png`, // Example sprite
    `${BASE_URL}/assets/audio/music.mp3`, // Example audio
    `${BASE_URL}/assets/backgrounds/bg.jpg`, // Example background
    OFFLINE_URL, // Offline fallback file
];

// Install event - Cache specified resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
                console.error('Failed to cache resources:', error);
            });
        })
    );
});

// Fetch event - Serve cached resources or fallback to offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response if available, otherwise fetch
            return (
                cachedResponse ||
                fetch(event.request).catch(() => {
                    // Serve offline.html for navigation requests if network fails
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                })
            );
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
