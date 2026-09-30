const CACHE_NAME = 'oficios-ahome-v5.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './sobre-nosotros.html',
  './terminos-y-privacidad.html',
  './app.js',
  './qrcode.min.js',
  './oficios.json',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './images/hero_oficio_1.jpg',
  './images/hero_oficio_2.jpg',
  './images/hero_oficio_3.jpg',
  './images/hero_oficio_4.jpg',
  './images/juan_referencia.png',
  './images/herreria_porton.jpg',
  './images/herreria_taller.jpg',
  './images/plomeria_instalacion.jpg',
  './images/climas_minisplit.jpg',
  './images/polylab-logo.png'
];

// Install event - precache core static assets and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching core assets for Oficios Ahome (v5.0)');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event - clean up previous outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for messages from client app
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Manual skipWaiting on update
  if (event.data.type === 'SKIP_WAITING' || event.data.action === 'skipWaiting') {
    console.log('[SW] skipWaiting invocado por el usuario.');
    self.skipWaiting();
    return;
  }

  // Explicit database caching
  if (event.data.type === 'CACHE_DATABASE' && Array.isArray(event.data.payload)) {
    const oficiosList = event.data.payload;
    caches.open(CACHE_NAME).then((cache) => {
      const jsonString = JSON.stringify(oficiosList);
      const response = new Response(jsonString, {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Database-Count': String(oficiosList.length),
          'X-Offline-Timestamp': new Date().toISOString()
        }
      });
      cache.put('./oficios.json', response);
      console.log(`[SW] Base de datos guardada en caché offline garantizado (${oficiosList.length} oficios)`);
    }).catch((err) => {
      console.warn('[SW] Error al guardar base de datos en caché:', err);
    });
  }
});

// Fetch event - Stale-While-Revalidate for oficios.json, Network-First for core scripts/HTML
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 1. oficios.json -> Stale-While-Revalidate (devuelve caché rápido y actualiza en segundo plano)
  if (url.pathname.endsWith('oficios.json') || url.searchParams.has('oficios')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. HTML y Scripts Core (app.js, index.html) -> Network-First con fallback a caché
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html').then(res => res || caches.match('./'));
          }
          return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // 3. Imágenes y assets estáticos -> Cache-First con Network Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return new Response('Asset no disponible sin conexión', { status: 503 });
      });
    })
  );
});
