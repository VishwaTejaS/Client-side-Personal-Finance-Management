const CACHE_NAME = 'pfm-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/analytics.html',
  '/charts.html',
  '/summary.html',
  '/styles.css',
  '/script.js',
  '/charts.js',
  '/analytics.js',
  '/summary.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
