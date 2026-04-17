// KickMarket Service Worker v1.0
const CACHE_NAME = 'kickmarket-v1';
const STATIC_CACHE = 'kickmarket-static-v1';
const DYNAMIC_CACHE = 'kickmarket-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap'
];

// INSTALL
self.addEventListener('install', event => {
  console.log('[SW] Installing KickMarket Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH — Estrategia: Cache First para estáticos, Network First para dinámicos
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones no GET
  if (request.method !== 'GET') return;

  // Ignorar extensiones de Chrome y peticiones de análisis
  if (url.protocol === 'chrome-extension:') return;

  // Peticiones de imágenes de StockX y CDN — Cache con fallback
  if (url.hostname.includes('stockx.com') || url.hostname.includes('fonts.')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request)
            .then(response => {
              if (response && response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Fallback para imágenes
              if (request.destination === 'image') {
                return new Response(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="60" font-size="60">👟</text></svg>',
                  { headers: { 'Content-Type': 'image/svg+xml' } }
                );
              }
            });
        });
      })
    );
    return;
  }

  // Peticiones a la API de Stripe — Solo Network (nunca caché)
  if (url.hostname.includes('stripe.com') || url.hostname.includes('api.anthropic.com')) {
    event.respondWith(fetch(request));
    return;
  }

  // Archivos del sitio — Cache First
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        console.log('[SW] Serving from cache:', request.url);
        return cached;
      }
      return fetch(request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Fallback a index.html para rutas SPA
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// BACKGROUND SYNC (para órdenes pendientes)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    console.log('[SW] Background sync: syncing pending orders');
    event.waitUntil(syncPendingOrders());
  }
});

async function syncPendingOrders() {
  // En producción: leer IndexedDB y reintentar peticiones fallidas
  console.log('[SW] Syncing orders...');
}

// PUSH NOTIFICATIONS
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Hay nuevas actualizaciones en KickMarket',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'view', title: 'Ver ahora' },
      { action: 'dismiss', title: 'Descartar' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'KickMarket', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'view') {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
