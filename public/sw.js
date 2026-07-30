const IS_BUSINESS_APP =
  self.location.hostname.includes(
    "rewardhub-business"
  );

const APP_VARIANT = IS_BUSINESS_APP
  ? "business"
  : "member";

const CACHE_NAME =
  "rewardhub-" +
  APP_VARIANT +
  "-v14";

const DEFAULT_START_URL =
  IS_BUSINESS_APP
    ? "/merchant/login"
    : "/member/login";

const DEFAULT_DASHBOARD_URL =
  IS_BUSINESS_APP
    ? "/merchant/dashboard"
    : "/member/dashboard";

const DEFAULT_APP_NAME =
  IS_BUSINESS_APP
    ? "RewardHub Business"
    : "RewardHub";

const DEFAULT_ICON =
  IS_BUSINESS_APP
    ? "/icons/business/icon-192.png"
    : "/icons/member/icon-192.png";

const STATIC_ASSETS = [
  "/",
  DEFAULT_START_URL,
  "/offline",
  "/manifest.webmanifest",
  DEFAULT_ICON,
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

    self.skipWaiting();
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
          .then(function (cacheNames) {
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

    if (
      request.method !== "GET"
    ) {
      return;
    }

    const requestUrl =
      new URL(request.url);

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

    const isPwaMetadata =
      requestUrl.pathname ===
        "/manifest.webmanifest" ||
      requestUrl.pathname ===
        "/manifest.json" ||
      requestUrl.pathname.endsWith(
        "/manifest.webmanifest"
      ) ||
      requestUrl.pathname.startsWith(
        "/icons/"
      ) ||
      requestUrl.pathname ===
        "/icon.png" ||
      requestUrl.pathname ===
        "/apple-icon.png" ||
      requestUrl.pathname ===
        "/favicon.ico";

    if (isPwaMetadata) {
      event.respondWith(
        fetch(request, {
          cache: "no-store",
        }).catch(function () {
          return caches.match(
            request
          );
        })
      );

      return;
    }

    if (
      request.mode ===
      "navigate"
    ) {
      event.respondWith(
        fetch(request)
          .then(function (response) {
            if (
              response &&
              response.ok
            ) {
              const responseClone =
                response.clone();

              caches
                .open(CACHE_NAME)
                .then(function (cache) {
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

self.addEventListener(
  "push",
  function (event) {
    var defaultData = {
      title:
        DEFAULT_APP_NAME,

      body:
        IS_BUSINESS_APP
          ? "You have a new RewardHub Business notification."
          : "You have a new RewardHub notification.",

      icon:
        DEFAULT_ICON,

      badge:
        DEFAULT_ICON,

      url:
        DEFAULT_DASHBOARD_URL,

      tag:
        IS_BUSINESS_APP
          ? "rewardhub-business-notification"
          : "rewardhub-member-notification",
    };

    var notificationData =
      defaultData;

    if (event.data) {
      try {
        var receivedData =
          event.data.json();

        notificationData =
          Object.assign(
            {},
            defaultData,
            receivedData
          );
      } catch (error) {
        notificationData =
          Object.assign(
            {},
            defaultData,
            {
              body:
                event.data.text() ||
                defaultData.body,
            }
          );
      }
    }

    var title =
      notificationData.title ||
      defaultData.title;

    var options = {
      body:
        notificationData.body ||
        defaultData.body,

      icon:
        notificationData.icon ||
        defaultData.icon,

      badge:
        notificationData.badge ||
        defaultData.badge,

      tag:
        notificationData.tag ||
        defaultData.tag,

      renotify:
        Boolean(
          notificationData.renotify
        ),

      requireInteraction:
        Boolean(
          notificationData
            .requireInteraction
        ),

      data: {
        url:
          notificationData.url ||
          defaultData.url,

        notificationId:
          notificationData
            .notificationId ||
          "",
      },
    };

    event.waitUntil(
      self.registration
        .showNotification(
          title,
          options
        )
    );
  }
);

self.addEventListener(
  "notificationclick",
  function (event) {
    event.notification.close();

    var targetUrl =
      event.notification.data &&
      event.notification.data.url
        ? event.notification.data.url
        : DEFAULT_DASHBOARD_URL;

    var absoluteUrl =
      new URL(
        targetUrl,
        self.location.origin
      ).href;

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then(function (
          clientList
        ) {
          for (
            var i = 0;
            i <
            clientList.length;
            i += 1
          ) {
            var client =
              clientList[i];

            if (
              "focus" in client
            ) {
              client.navigate(
                absoluteUrl
              );

              return client.focus();
            }
          }

          if (
            self.clients.openWindow
          ) {
            return self.clients
              .openWindow(
                absoluteUrl
              );
          }

          return undefined;
        })
    );
  }
);