document.addEventListener('DOMContentLoaded', function () {
    // Ensure the task list container exists before trying to use it
    const taskListContainer = document.getElementById('tasks-list');

    // Add this script to automatically highlight the active page in the navbar
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add('active');
        }
    });

    const taskForm = document.getElementById("task-form");
    if (taskForm) {
        taskForm.addEventListener("submit", function (event) {
            event.preventDefault();

            // Get the task details from the form
            const newTask = {
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-desc').value,
                deadline: document.getElementById('task-deadline').value
            };

            // Save the task to IndexedDB
            saveTaskToDB(newTask);

            // Display success message
            const successMessage = document.createElement('p');
            successMessage.classList.add('success-message');
            successMessage.textContent = "Task added successfully!";
            document.body.appendChild(successMessage);

            // Clear form fields
            taskForm.reset();
        });
    } else {
        console.log('Task form not found');
    }

    // Check for notification permission
    if ('Notification' in window && navigator.serviceWorker) {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                console.log("Notification permission granted.");
                // Show a reminder notification to download the app every time the page is loaded
                showDownloadReminder();
            } else {
                console.log("Notification permission denied.");
            }
        });
    }

    // Convert base64 to base64url format without padding
    function base64ToBase64Url(base64) {
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    // Register the Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);

                // VAPID Public Key in base64 format (replace with your actual key)
                const base64VapidKey = 'BJEJg1W0xlMj3q5ONwlZ5U7JSi8uy_OkDGPZjKJik0AYSXPNheNjQQbjkVXoZwQh0IB77PGsPtBSAOJvK-A3tEY';

                // Convert VAPID Key to base64url
                const base64urlVapidKey = base64ToBase64Url(base64VapidKey);
                console.log('Converted base64url VAPID Key:', base64urlVapidKey);

                // After registration, subscribe the user for push notifications
                registration.pushManager.subscribe({
                    userVisibleOnly: true, // Notification will be shown to the user
                    applicationServerKey: base64urlVapidKey // Use the base64url encoded key
                })
                .then((subscription) => {
                    console.log('User is subscribed to push notifications:', subscription);
                })
                .catch((error) => {
                    console.error('Failed to subscribe the user to push notifications:', error);
                });
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    }

    // IndexedDB setup for task manager
    let db;
    const request = indexedDB.open('taskManagerDB', 1);

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("Database opened successfully");
        displayTasks(); // Display tasks after DB is loaded
    };

    request.onerror = function (event) {
        console.error("Error opening database: ", event.target.errorCode);
    };

    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        console.log('Database upgrade triggered');

        if (!db.objectStoreNames.contains('tasks')) {
            const objectStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('title', 'title', { unique: false });
            objectStore.createIndex('deadline', 'deadline', { unique: false });
        }
    };

    // Save a task to IndexedDB
    function saveTaskToDB(task) {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        store.add(task);

        transaction.oncomplete = function () {
            console.log('Task saved to IndexedDB');
            displayTasks(); // Update the task list after saving
        };

        transaction.onerror = function (event) {
            console.log('Error saving task:', event.target.error);
        };
    }

    // Display tasks from IndexedDB
    function displayTasks() {
        if (!taskListContainer) {
            console.error("Task list container is missing.");
            return; // Return early if taskListContainer doesn't exist
        }
        
        // Clear the task list before displaying new ones
        taskListContainer.innerHTML = '';

        const transaction = db.transaction(['tasks'], 'readonly');
        const store = transaction.objectStore('tasks');
        const request = store.getAll(); // Get all tasks

        request.onsuccess = function (event) {
            const tasks = event.target.result;
            console.log("Tasks retrieved from DB:", tasks); // Log retrieved tasks

            if (tasks.length === 0) {
                taskListContainer.innerHTML = '<p>No tasks found.</p>';
            } else {
                tasks.forEach(function (task) {
                    const taskDiv = document.createElement('div');
                    taskDiv.classList.add('task');
                    taskDiv.innerHTML = `    
                        <p><strong>${task.title}</strong><br>${task.description}<br><em>Deadline: ${task.deadline}</em></p>
                    `;
                    taskListContainer.appendChild(taskDiv); // Append the task div to the container
                });
            }
        };

        request.onerror = function (event) {
            console.log('Error retrieving tasks:', event.target.error);
        };
    }

    // Check if IndexedDB is supported
    if (!window.indexedDB) {
        alert("Your browser doesn't support IndexedDB.");
    }

    // Function to show a download reminder notification
    function showDownloadReminder() {
        if (Notification.permission === "granted") {
            const options = {
                body: "Don't forget to download our mobile app for a better experience!",
                icon: '/task_manager.png', // Path to your app icon
                vibrate: [200, 100, 200],
                requireInteraction: true, // Keep the notification until the user dismisses it
            };

            const notification = new Notification("Reminder to Download the App", options);
            notification.onclick = function () {
                // Close the notification
                notification.close();
            };
        }
    }

    // Detect if user is offline and show a notification or message
    if (!navigator.onLine) {
        showOfflineMessage();
    }

    // Listen for online/offline status changes
    window.addEventListener('offline', showOfflineMessage);
    window.addEventListener('online', hideOfflineMessage);

    // Function to show an offline message
    function showOfflineMessage() {
        const offlineMessage = document.createElement('div');
        offlineMessage.classList.add('offline-message');
        offlineMessage.id = 'offline-message';
        offlineMessage.innerHTML = '<p>You are currently offline. Some features may not be available.</p>';
        document.body.appendChild(offlineMessage);
    }

    // Function to hide the offline message when back online
    function hideOfflineMessage() {
        const offlineMessage = document.getElementById('offline-message');
        if (offlineMessage) {
            offlineMessage.remove();
        }
    }

});
