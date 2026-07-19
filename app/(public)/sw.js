const CACHE_NAME = "rewardhub-v1";

const STATIC_ASSETS = [
  "/",
  "/login",
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (cacheName) {
            return cacheName !== CACHE_NAME;
          })
          .map(function (cacheName) {
            return caches.delete(cacheName);
          })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (
    requestUrl.pathname.startsWith("/api/") ||
    requestUrl.pathname.startsWith("/_next/")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cachedResponse) {
          return cachedResponse || caches.match("/offline");
        });
      })
  );
});