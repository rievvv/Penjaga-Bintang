// Service worker: jaringan dulu (agar update langsung terpakai), cache sebagai cadangan offline.
const V = 'pb-v12';
const FILES = ['./', './index.html', './css/base.css', './css/game.css', './css/extras.css', './css/clay.css', './css/saklar.css', './css/portal.css', './css/games-otak.css', './css/games-math.css', './css/games-lang.css',
  './app.js', './games2.js', './games3.js', './games4.js', './games5.js', './portal.js', './cloud.js', './sky.js', './firebase-config.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // satu per satu: file yang belum ada tidak menggagalkan pemasangan
  e.waitUntil(caches.open(V).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => { })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});
