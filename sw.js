// KULTAINEN SÄÄNTÖ: Aina kun muutat app.js, index.html tai style.css tiedostoja,
// muuta tätä versionumeroa (esim. v3 -> v4 -> v5).
const CACHE_NAME = 'hautausmaa-v5'; 

const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/storage.js',
  './js/report.js',
  'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

// 1. ASENNUS JA PAKOTETTU KÄYTTÖÖNOTTO
self.addEventListener('install', (event) => {
  // skipWaiting pakottaa uuden version heti asennusjonon ohi
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. AKTIVOINTI JA VANHOJEN VÄLIMUISTIEN TUHOAMINEN
self.addEventListener('activate', (event) => {
  // clients.claim pakottaa uuden version ottamaan sivun heti hallintaan
  event.waitUntil(self.clients.claim());
  
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// 3. TIEDOSTOJEN TARJOILU (Offline-tuki)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Palautetaan välimuistista jos löytyy, muuten haetaan verkosta
      return response || fetch(event.request);
    })
  );
});
