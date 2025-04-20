const CACHE_NAME = 'coffee-fun-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    fetch('/cache-assets.json')
      .then(res => res.json())
      .then(files => {
        return caches.open(CACHE_NAME).then(cache => {
          return cache.addAll(files);
        });
      })
  );
  self.skipWaiting();
});
