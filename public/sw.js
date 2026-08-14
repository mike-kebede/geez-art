// Minimal service worker: makes the app shell installable + offline-capable
// (M6). HTML is network-first so updates ship immediately; same-origin assets
// (hashed, immutable) are cache-first. Bump CACHE on a breaking deploy.
const CACHE = 'geez-art-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.json'])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (e.request.mode === 'navigate') {
    // Network-first for the page itself - a new deploy must ship on reload.
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          // F17: only 2xx 'basic' responses - never persist a 502/redirect.
          if (res.ok && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('/')))
    );
    return;
  }
  // Cache-first for same-origin assets (hashed = immutable).
  e.respondWith(
    caches.match(e.request).then(
      (r) =>
        r ||
        fetch(e.request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, clone)).catch(() => {});
          }
          return res;
        })
    )
  );
});
