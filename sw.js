/**
 * IGRIS V7 — Offline-First Service Worker
 * Compatible with GitHub Pages repository subpaths (e.g., https://USERNAME.github.io/IGRIS-V7/)
 */

const CACHE_PREFIX = 'igris-v7-cache';
const CACHE_VERSION = 'v7.0.0';
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/variables.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/screens.css',
  './css/animations.css',
  './css/responsive.css',
  './js/app.js',
  './js/navigation.js',
  './js/storage.js',
  './js/system.js',
  './js/quests.js',
  './js/neet.js',
  './js/mcq.js',
  './js/mocks.js',
  './js/fitness.js',
  './js/charts.js',
  './assets/icons/icon.svg',
  './assets/images/splash.svg',
  './assets/images/home-hero.svg',
  './assets/images/status-hero.svg',
  './assets/images/quests-hero.svg',
  './assets/images/chapters-hero.svg',
  './assets/images/boss-hero.svg',
  './assets/images/achievements-hero.svg',
  './assets/images/background.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache each asset individually so a single optional fetch hiccup never aborts installation
      await Promise.allSettled(
        CORE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response && response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn('[IGRIS SW] Failed to pre-cache asset:', url, err);
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((oldKey) => caches.delete(oldKey))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        // Revalidate in background when online
        fetch(request)
          .then((netRes) => {
            if (netRes && netRes.ok) {
              cache.put(request, netRes.clone());
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch {
        if (request.mode === 'navigate') {
          const fallback = await cache.match('./index.html');
          if (fallback) return fallback;
        }
        return new Response('Offline — Resource unavailable', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
});
