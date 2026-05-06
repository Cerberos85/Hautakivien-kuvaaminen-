const CACHE_NAME = 'hautausmaa-v2'; 
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/storage.js',
  './js/report.js',
  // Vaihda myös tänne uusi luotettavampi linkki:
  'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

// Asennusvaihe: Tallennetaan tiedostot välimuistiin
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Aktivoituminen ja vanhojen välimuistien siivous
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Tiedostojen haku välimuistista (Offline-tuki)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});