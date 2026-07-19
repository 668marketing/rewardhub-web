const CACHE_NAME = "rewardhub-v3";

const STATIC_ASSETS = [
  "/",
  "/login",
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener(
  "install",
  function (event) {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(function (cache) {
          return cache.addAll(
            STATIC_ASSETS
          );
        })
        .catch(function (error) {
          console.error(
            "RewardHub cache installation failed:",
            error
          );
        })
    );

    /*
      不要在这里调用 self.skipWaiting()。

      新 Service Worker 必须先进入 waiting 状态，
      PWARegister 才能显示“New version available”提示。
    */
  }
);

self.addEventListener(
  "message",
  function (event) {
    if (
      event.data &&
      event.data.type ===
        "SKIP_WAITING"
    ) {
      self.skipWaiting();
    }
  }
);

self.addEventListener(
  "activate",
  function (event) {
    event.waitUntil(
      Promise.all([
        caches
          .keys()
          .then(function (
            cacheNames
          ) {
            return Promise.all(
              cacheNames
                .filter(function (
                  cacheName
                ) {
                  return (
                    cacheName !==
                    CACHE_NAME
                  );
                })
                .map(function (
                  cacheName
                ) {
                  return caches.delete(
                    cacheName
                  );
                })
            );
          }),

        self.clients.claim(),
      ])
    );
  }
);

self.addEventListener(
  "fetch",
  function (event) {
    const request =
      event.request;

    if (request.method !== "GET") {
      return;
    }

    const requestUrl = new URL(
      request.url
    );

    if (
      requestUrl.origin !==
      self.location.origin
    ) {
      return;
    }

    if (
      requestUrl.pathname.startsWith(
        "/api/"
      ) ||
      requestUrl.pathname.startsWith(
        "/_next/"
      )
    ) {
      return;
    }

    // 页面导航：优先网络，失败才使用缓存或离线页
    if (
      request.mode === "navigate"
    ) {
      event.respondWith(
        fetch(request)
          .then(function (
            response
          ) {
            if (
              response &&
              response.ok
            ) {
              const responseClone =
                response.clone();

              caches
                .open(CACHE_NAME)
                .then(function (
                  cache
                ) {
                  cache.put(
                    request,
                    responseClone
                  );
                });
            }

            return response;
          })
          .catch(function () {
            return caches
              .match(request)
              .then(function (
                cachedResponse
              ) {
                return (
                  cachedResponse ||
                  caches.match(
                    "/offline"
                  )
                );
              });
          })
      );

      return;
    }

    // 静态资源：缓存优先，后台获取新版
    event.respondWith(
      caches
        .match(request)
        .then(function (
          cachedResponse
        ) {
          const networkRequest =
            fetch(request)
              .then(function (
                response
              ) {
                if (
                  response &&
                  response.ok
                ) {
                  const responseClone =
                    response.clone();

                  caches
                    .open(
                      CACHE_NAME
                    )
                    .then(function (
                      cache
                    ) {
                      cache.put(
                        request,
                        responseClone
                      );
                    });
                }

                return response;
              })
              .catch(function () {
                return cachedResponse;
              });

          return (
            cachedResponse ||
            networkRequest
          );
        })
    );
  }
);