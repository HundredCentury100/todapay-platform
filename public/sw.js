const CACHE_NAME = 'fulticket-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/favicon.svg',
];

// Dynamic cache for API responses and other resources
const DYNAMIC_CACHE = 'fulticket-dynamic-v1';
const API_CACHE = 'fulticket-api-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, DYNAMIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - enhanced caching strategies
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Supabase API calls - network first, cache as backup
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Static assets - cache first
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached and update in background
          fetch(event.request).then((response) => {
            if (response.status === 200) {
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(event.request, response);
              });
            }
          });
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests - network first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return cached index.html for SPA routing
            return caches.match('/index.html').then((indexResponse) => {
              if (indexResponse) {
                return indexResponse;
              }
              // Offline page as last resort
              return new Response(
                '<!DOCTYPE html><html><head><title>Offline</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5;}.content{text-align:center;padding:2rem;}.icon{font-size:4rem;margin-bottom:1rem;}.btn{background:#2563eb;color:white;padding:0.75rem 1.5rem;border:none;border-radius:0.5rem;cursor:pointer;margin-top:1rem;}</style></head><body><div class="content"><div class="icon">📡</div><h1>You\'re Offline</h1><p>Please check your internet connection and try again.</p><button class="btn" onclick="location.reload()">Retry</button></div></body></html>',
                {
                  headers: { 'Content-Type': 'text/html' },
                }
              );
            });
          });
        })
    );
    return;
  }

  // Default - network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
      })
  );
});

// Background sync for offline bookings
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncOfflineBookings());
  }
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncPendingNotifications());
  }
});

async function syncOfflineBookings() {
  try {
    const cache = await caches.open('offline-bookings');
    const keys = await cache.keys();
    
    for (const request of keys) {
      const cachedData = await cache.match(request);
      if (cachedData) {
        const bookingData = await cachedData.json();
        // Attempt to sync with server
        try {
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
          });
          if (response.ok) {
            await cache.delete(request);
          }
        } catch (err) {
          // Will retry on next sync
        }
      }
    }
  } catch (err) {
    // Sync failed
  }
}

async function syncPendingNotifications() {
  // Sync any pending notification preferences
}

// Push notification handling with rich notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  const notificationType = data.notification_type || data.type || 'general';
  const iconMap = {
    booking_confirmed: '/favicon.png',
    booking_confirmation: '/favicon.png',
    payment_received: '/favicon.png',
    payment_success: '/favicon.png',
    schedule_change: '/favicon.png',
    price_alert: '/favicon.png',
    price_drop: '/favicon.png',
    check_in_reminder: '/favicon.png',
    travel_reminder: '/favicon.png',
    general: '/favicon.png',
  };
  
  const options = {
    body: data.body || data.message || 'New notification from fulticket',
    icon: iconMap[notificationType] || '/favicon.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    tag: data.tag || notificationType,
    renotify: true,
    requireInteraction: data.requireInteraction || notificationType === 'booking_confirmed',
    data: {
      url: data.url || '/',
      notificationType,
      bookingId: data.bookingId || data.booking_id,
      timestamp: Date.now(),
      ...data.data,
    },
    actions: getNotificationActions(notificationType),
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'fulticket', options)
  );
});

// Get context-specific notification actions
function getNotificationActions(type) {
  const actionMap = {
    booking_confirmed: [
      { action: 'view_ticket', title: '🎫 View Ticket' },
      { action: 'share', title: '📤 Share' },
    ],
    booking_confirmation: [
      { action: 'view_ticket', title: '🎫 View Ticket' },
      { action: 'share', title: '📤 Share' },
    ],
    payment_received: [
      { action: 'view_receipt', title: '🧾 View Receipt' },
      { action: 'close', title: 'Close' },
    ],
    payment_success: [
      { action: 'view_receipt', title: '🧾 View Receipt' },
      { action: 'close', title: 'Close' },
    ],
    schedule_change: [
      { action: 'view_details', title: '📋 View Details' },
      { action: 'contact_support', title: '💬 Support' },
    ],
    price_alert: [
      { action: 'book_now', title: '🎯 Book Now' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    price_drop: [
      { action: 'book_now', title: '🎯 Book Now' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    check_in_reminder: [
      { action: 'check_in', title: '✅ Check In' },
      { action: 'view_ticket', title: '🎫 View' },
    ],
    travel_reminder: [
      { action: 'view_ticket', title: '🎫 View Ticket' },
      { action: 'directions', title: '🗺️ Directions' },
    ],
  };
  
  return actionMap[type] || [
    { action: 'view', title: 'View' },
    { action: 'close', title: 'Close' },
  ];
}

// Notification click handling with deep linking
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let urlToOpen = data.url || '/';
  
  // Handle specific actions
  switch (event.action) {
    case 'view_ticket':
    case 'view_details':
      urlToOpen = data.bookingId ? `/orders?id=${data.bookingId}` : '/orders';
      break;
    case 'view_receipt':
      urlToOpen = data.bookingId ? `/orders?id=${data.bookingId}&tab=receipt` : '/orders';
      break;
    case 'check_in':
      urlToOpen = '/check-in';
      break;
    case 'book_now':
      urlToOpen = data.searchUrl || '/';
      break;
    case 'contact_support':
      urlToOpen = '/help';
      break;
    case 'share':
      urlToOpen = data.bookingId ? `/orders?id=${data.bookingId}&action=share` : '/orders';
      break;
    case 'directions':
      urlToOpen = data.bookingId ? `/orders?id=${data.bookingId}&action=directions` : '/orders';
      break;
    case 'close':
    case 'dismiss':
      return; // Just close the notification
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', data, action: event.action });
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.urls || [];
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(urlsToCache);
      })
    );
  }
});

// Periodic sync for background updates (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-bookings') {
    event.waitUntil(updateCachedBookings());
  }
  if (event.tag === 'check-price-alerts') {
    event.waitUntil(checkPriceAlerts());
  }
});

async function updateCachedBookings() {
  // Background update of cached booking data
}

async function checkPriceAlerts() {
  // Check for price alerts and notify user
}
