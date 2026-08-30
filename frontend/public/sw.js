// Service Worker for NotifyWork Web Push Notifications

self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      
      const title = payload.title || 'Order Update';
      const options = {
        body: payload.body,
        icon: '/bell-icon.png', // placeholder for application badge
        badge: '/bell-icon.png',
        data: {
          url: payload.url ? `http://localhost:5173${payload.url}` : 'http://localhost:5173'
        },
        vibrate: [100, 50, 100],
        actions: [
          { action: 'open', title: 'View Status' }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      // Fallback for text payloads
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('NotifyWork', {
          body: text,
          vibrate: [100, 50, 100]
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data ? event.notification.data.url : 'http://localhost:5173';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      // Try to find if window is already open and focus it
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
