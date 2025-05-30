const CACHE_NAME = 'coffee-fun-cache-v1';

self.addEventListener('install', (event) => {
	event.waitUntil(
		fetch('/cache-assets.json')
			.then((res) => res.json())
			.then((files) => {
				files.push('/cache-assets.json'); // also cache this file itself
				return caches.open(CACHE_NAME).then((cache) => {
					return cache.addAll(files);
				});
			})
			.catch((err) => {
				console.log('[SW] Failed to cache files on install:', err);
			})
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keyList) =>
			Promise.all(
				keyList.map((key) => {
					if (key !== CACHE_NAME) {
						return caches.delete(key);
					}
				})
			)
		)
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			return response || fetch(event.request);
		})
	);
});
