const CacheName = 'cache-v1'; // Define your cache name

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CacheName).then((cache) => {
            return cache.addAll([
                // List of files to cache
                'index.html', // Update this path if necessary
                'stylesheet.css',
                'pogba.png',
                'main.js',
                'contacts.html', // Add this if you want to cache the contacts page
                // Add any other assets you want to cache
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    // Only keep new version of cache
    const cacheWhitelist = [CacheName];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        // Delete old caches
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
