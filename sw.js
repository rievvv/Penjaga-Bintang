// Service worker sederhana: cache-first agar aplikasi bisa dibuka offline.
const V = 'pb-v9';
const FILES = ['./', './index.html', './css/base.css', './css/game.css', './css/extras.css', './css/clay.css', './css/saklar.css', './css/portal.css', './css/games-otak.css', './css/games-math.css', './app.js', './games2.js', './games3.js', './games4.js', './portal.js', './cloud.js', './sky.js', './firebase-config.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});