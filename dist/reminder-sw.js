// Service Worker for reminder notifications
// The main thread (useReminderPoller) handles all notification firing.
// This SW only handles notification click actions (Dismiss / Open App).

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open' || event.action === '') {
    // Focus existing tab or open a new one
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          if ('focus' in client) return client.focus()
        }
        return self.clients.openWindow('/')
      })
    )
  }
  // 'dismiss' action — notification is already closed, nothing else needed
})

// Activate immediately
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())
