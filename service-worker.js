const CacheName = 'cache-v1'; // Define your cache name

// Install event - Cache necessary files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CacheName).then((cache) => {
            return cache.addAll([
                'index.html',
                'stylesheet.css',
                'pogba.png',
                'main.js',
                'contacts.html',
                'first.html',
                'second.html',
                'third.html',
                'about.html',
            ]);
        }).catch((err) => {
            console.error('Failed to cache files:', err);
        })
    );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CacheName];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - Serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Return cached response
            }

            // Fetch from network if not in cache
            return fetch(event.request);
        })
    );
});
