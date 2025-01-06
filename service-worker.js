const CacheName = 'cache-v1'; // Define your cache name

// Cache files during the install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CacheName).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/about.html',
                '/contacts.html',
                '/task.html',
                '/stylesheet.css',
                '/main.js',
                '/task_manager.png',
                '/images/icon-192x192.png', // Ensure all required images are cached
                '/images/badge.png' // Ensure badge is cached
            ]);
        })
    );
});

// Clean up old caches during the activate event
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CacheName];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Handle push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: 'images/icon-192x192.png',
        badge: 'images/badge.png'
    };
    event.waitUntil(
        self.registration.showNotification('New Task Reminder', options)
    );
});

// Handle sync event
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-tasks') {
        event.waitUntil(syncTasks());
    }
});

// Sync tasks (example for syncing tasks if required)
function syncTasks() {
    return fetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(tasksToSync), // Assuming you have tasks saved in memory
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then((response) => response.json())
    .then((data) => {
        console.log('Tasks synced successfully:', data);
    })
    .catch((error) => {
        console.error('Failed to sync tasks:', error);
    });
}

// Intercept network requests to serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response if available, else fetch from the network
            if (cachedResponse) {
                return cachedResponse;
            }

            // Fallback for requests not cached: fetch from the network
            return fetch(event.request).catch(() => {
                // If offline and no network response, serve an offline message
                return new Response('<h1>You are offline. Please check your connection.</h1>', {
                    headers: { 'Content-Type': 'text/html' }
                });
            });
        })
    );
});
