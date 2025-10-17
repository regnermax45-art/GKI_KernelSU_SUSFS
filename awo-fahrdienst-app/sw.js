// Service Worker für AWO OPR Fahrdienst App
const CACHE_NAME = 'awo-fahrdienst-v1.0.0';
const STATIC_CACHE = 'awo-static-v1.0.0';
const DYNAMIC_CACHE = 'awo-dynamic-v1.0.0';

// Dateien, die immer gecacht werden sollen
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/css/components.css',
  '/app.js',
  '/js/database.js',
  '/js/models.js',
  '/js/gps.js',
  '/js/map.js',
  '/js/trip-tracker.js',
  '/js/timer.js',
  '/js/person-manager.js',
  '/js/pdf-generator.js',
  '/js/navigation.js',
  // Externe Bibliotheken
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// OpenStreetMap Tiles (begrenzte Anzahl für Offline-Nutzung)
const MAP_TILES_CACHE = 'awo-map-tiles-v1.0.0';

// Installation des Service Workers
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Statische Dateien cachen
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES.filter(url => !url.startsWith('http')));
      }),
      
      // Externe Ressourcen separat cachen
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('Service Worker: Caching external resources');
        const externalResources = STATIC_FILES.filter(url => url.startsWith('http'));
        return Promise.allSettled(
          externalResources.map(url => 
            cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Aktivierung des Service Workers
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Alte Caches löschen
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== MAP_TILES_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch-Events abfangen
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Verschiedene Caching-Strategien je nach Ressourcentyp
  if (request.method === 'GET') {
    // OpenStreetMap Tiles
    if (url.hostname.includes('openstreetmap.org') || 
        url.hostname.includes('tile.openstreetmap.org')) {
      event.respondWith(handleMapTiles(request));
      return;
    }
    
    // API-Anfragen (falls später Backend hinzugefügt wird)
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleApiRequest(request));
      return;
    }
    
    // Statische Ressourcen
    if (STATIC_FILES.some(file => request.url.includes(file.replace('/', '')))) {
      event.respondWith(handleStaticFiles(request));
      return;
    }
    
    // Alle anderen Anfragen
    event.respondWith(handleOtherRequests(request));
  }
});

// Karten-Tiles handhaben (Cache-First mit Fallback)
async function handleMapTiles(request) {
  try {
    const cache = await caches.open(MAP_TILES_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Im Hintergrund aktualisieren
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {});
      
      return cachedResponse;
    }
    
    // Aus dem Netzwerk laden und cachen
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.warn('Map tile fetch failed:', error);
    // Fallback: Platzhalter-Tile oder Offline-Nachricht
    return new Response('Offline - Karte nicht verfügbar', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Statische Dateien handhaben (Cache-First)
async function handleStaticFiles(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.warn('Static file fetch failed:', error);
    
    // Fallback für HTML-Dateien
    if (request.headers.get('accept').includes('text/html')) {
      const cache = await caches.open(STATIC_CACHE);
      return cache.match('/index.html');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// API-Anfragen handhaben (Network-First mit Cache-Fallback)
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('API request failed, trying cache:', error);
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({
      error: 'Offline - Daten nicht verfügbar',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Andere Anfragen handhaben
async function handleOtherRequests(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Background Sync für Datenübertragung (falls später benötigt)
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-trip-data') {
    event.waitUntil(syncTripData());
  }
  
  if (event.tag === 'sync-person-data') {
    event.waitUntil(syncPersonData());
  }
});

// Hilfsfunktionen für Background Sync
async function syncTripData() {
  try {
    // Hier würde die Synchronisation der Fahrtdaten implementiert
    console.log('Syncing trip data...');
    // Implementation folgt bei Backend-Integration
  } catch (error) {
    console.error('Trip data sync failed:', error);
  }
}

async function syncPersonData() {
  try {
    // Hier würde die Synchronisation der Personendaten implementiert
    console.log('Syncing person data...');
    // Implementation folgt bei Backend-Integration
  } catch (error) {
    console.error('Person data sync failed:', error);
  }
}

// Push-Benachrichtigungen (für zukünftige Erweiterungen)
self.addEventListener('push', event => {
  console.log('Service Worker: Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'Neue Nachricht von AWO Fahrdienst',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'App öffnen',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Schließen',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('AWO Fahrdienst', options)
  );
});

// Benachrichtigungs-Klicks handhaben
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Fehlerbehandlung
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker: Script loaded');

