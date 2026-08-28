/* Service worker : rend l'appli utilisable sans réseau.
   À chaque modification de index.html, incrémente VERSION pour forcer la mise à jour. */
const VERSION = 'v7';
const SHELL = [
  './', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Les appels au serveur Apps Script passent toujours par le réseau
  if (url.includes('script.google.com') || url.includes('googleusercontent.com')) return;
  // Le reste (appli, lib, polices) : cache d'abord, réseau en secours, puis mise en cache
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') caches.open(VERSION).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
