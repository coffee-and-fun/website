const CACHE_NAME = 'coffee-fun-cache-v2';

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
			.catch(() => {})
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
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	// HTML: network first so content updates land immediately, cache as fallback.
	if (request.mode === 'navigate' || request.destination === 'document') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					const copy = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
					return response;
				})
				.catch(() => caches.match(request))
		);
		return;
	}

	// Static assets: cache first, populate the cache on first request.
	event.respondWith(
		caches.match(request).then((cached) => {
			if (cached) return cached;
			return fetch(request).then((response) => {
				if (response.ok) {
					const copy = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
				}
				return response;
			});
		})
	);
});
