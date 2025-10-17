// Cache version - increment this to force cache update
const CACHE_VERSION = 'v2.1.0';
const CACHE_NAME = `devportfolio-${CACHE_VERSION}`;
const CACHE_NAME_DYNAMIC = `devportfolio-dynamic-${CACHE_VERSION}`;
const CACHE_NAME_IMAGES = `devportfolio-images-${CACHE_VERSION}`;

// Static assets to cache immediately (cache-first strategy)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/themes.css',
  '/css/animations.css',
  '/css/style.css',
  '/css/responsive-fixes.css',
  '/js/app.js',
  '/js/i18n.js',
  '/js/animation-controller.js',
  '/js/lazy-loader.js',
  '/js/project-data.js',
  '/js/project-modal.js',
  '/js/form-handler.js',
  '/js/performance-monitor.js',
  '/js/polyfills.js',
  '/js/config.js',
  '/js/analytics.js',
  '/img/favicon.svg',
  '/img/profile.svg'
];

// Dynamic content (network-first strategy)
const DYNAMIC_ASSETS = [
  '/locales/pt-BR.json',
  '/locales/en-US.json',
  '/locales/es-ES.json'
];

// Images to cache on demand
const IMAGE_ASSETS = [
  '/img/about.svg',
  '/img/project1.svg',
  '/img/project2.svg',
  '/img/project3.svg',
  '/img/project4.svg',
  '/img/project5.svg',
  '/img/project6.svg'
];

// External resources (cache-first with network fallback)
const EXTERNAL_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Roboto+Mono:wght@300;400;500;600&display=swap'
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  images: 50,
  dynamic: 30
};

// Helper function to limit cache size
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Delete oldest entries
    const deleteCount = keys.length - maxSize;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache external resources
      caches.open(CACHE_NAME).then(cache => {
        console.log('[Service Worker] Caching external resources');
        return cache.addAll(EXTERNAL_ASSETS).catch(err => {
          console.warn('[Service Worker] Failed to cache some external resources:', err);
        });
      })
    ]).then(() => {
      console.log('[Service Worker] Installation complete');
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');

  const currentCaches = [CACHE_NAME, CACHE_NAME_DYNAMIC, CACHE_NAME_IMAGES];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation complete');
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Strategy 1: Cache-first for static assets
  if (STATIC_ASSETS.some(asset => url.pathname === asset) ||
    EXTERNAL_ASSETS.some(asset => url.href === asset)) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Strategy 2: Network-first for dynamic content (translations)
  if (DYNAMIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(networkFirst(request, CACHE_NAME_DYNAMIC));
    return;
  }

  // Strategy 3: Cache-first for images
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
    event.respondWith(cacheFirst(request, CACHE_NAME_IMAGES));
    return;
  }

  // Strategy 4: Network-only for API calls and form submissions
  if (url.pathname.includes('/api/') || request.method === 'POST') {
    event.respondWith(fetch(request));
    return;
  }

  // Default: Network-first with cache fallback
  event.respondWith(networkFirst(request, CACHE_NAME_DYNAMIC));
});

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, fetch from network
    const networkResponse = await fetch(request);

    // Cache the response if valid
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());

      // Limit cache size for images
      if (cacheName === CACHE_NAME_IMAGES) {
        limitCacheSize(cacheName, MAX_CACHE_SIZE.images);
      }
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache-first strategy failed:', error);

    // Try to return cached version as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    // Return offline page or error response
    return new Response('Offline - content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache the response if valid
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());

      // Limit cache size for dynamic content
      if (cacheName === CACHE_NAME_DYNAMIC) {
        limitCacheSize(cacheName, MAX_CACHE_SIZE.dynamic);
      }
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);

    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    // Return offline response
    return new Response('Offline - content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Message event - handle commands from the page
self.addEventListener('message', event => {
  if (event.data && event.data.action) {
    switch (event.data.action) {
      case 'skipWaiting':
        self.skipWaiting();
        break;

      case 'clearCache':
        event.waitUntil(
          caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          }).then(() => {
            console.log('[Service Worker] All caches cleared');
            return self.clients.matchAll();
          }).then(clients => {
            clients.forEach(client => {
              client.postMessage({ action: 'cacheCleared' });
            });
          })
        );
        break;

      case 'getCacheInfo':
        event.waitUntil(
          Promise.all([
            caches.open(CACHE_NAME).then(cache => cache.keys()),
            caches.open(CACHE_NAME_DYNAMIC).then(cache => cache.keys()),
            caches.open(CACHE_NAME_IMAGES).then(cache => cache.keys())
          ]).then(([staticKeys, dynamicKeys, imageKeys]) => {
            return self.clients.matchAll();
          }).then(clients => {
            clients.forEach(client => {
              client.postMessage({
                action: 'cacheInfo',
                data: {
                  version: CACHE_VERSION,
                  staticCount: staticKeys.length,
                  dynamicCount: dynamicKeys.length,
                  imageCount: imageKeys.length
                }
              });
            });
          })
        );
        break;
    }
  }
});

// Background sync for offline form submissions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    if (event.tag === 'sync-form-submissions') {
      event.waitUntil(syncFormSubmissions());
    }
  });
}

async function syncFormSubmissions() {
  // This would sync any queued form submissions when back online
  console.log('[Service Worker] Syncing form submissions...');
  // Implementation would depend on your form handling strategy
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-content') {
      event.waitUntil(updateDynamicContent());
    }
  });
}

async function updateDynamicContent() {
  // Update dynamic content in the background
  console.log('[Service Worker] Updating dynamic content...');

  try {
    const cache = await caches.open(CACHE_NAME_DYNAMIC);

    // Update translation files
    for (const asset of DYNAMIC_ASSETS) {
      try {
        const response = await fetch(asset);
        if (response.ok) {
          await cache.put(asset, response);
        }
      } catch (error) {
        console.warn('[Service Worker] Failed to update:', asset);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Failed to update dynamic content:', error);
  }
}

// Log service worker version
console.log(`[Service Worker] Version ${CACHE_VERSION} loaded`);