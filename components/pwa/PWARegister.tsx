"use client";

import { useEffect } from "react";

const UPDATE_INTERVAL =
  30 * 60 * 1000;

const RELOAD_GUARD_KEY =
  "rewardhub_sw_reload_guard";

export default function PWARegister() {
  useEffect(() => {
    if (
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let cancelled = false;

    let refreshing = false;

    let updateInterval:
      | ReturnType<typeof setInterval>
      | undefined;

    let registration:
      | ServiceWorkerRegistration
      | undefined;

    const checkForUpdate =
      async () => {
        if (
          cancelled ||
          !registration ||
          !navigator.onLine
        ) {
          return;
        }

        try {
          await registration.update();

          console.log(
            "RewardHub checked for app updates."
          );
        } catch (error) {
          console.error(
            "RewardHub service worker update check failed:",
            error
          );
        }
      };

    const handleControllerChange =
      () => {
        if (
          cancelled ||
          refreshing
        ) {
          return;
        }

        refreshing = true;

        const lastReload =
          Number(
            sessionStorage.getItem(
              RELOAD_GUARD_KEY
            ) || "0"
          );

        const now = Date.now();

        /*
         * Prevent an accidental reload loop.
         * A Service Worker-triggered reload is
         * allowed only once within 10 seconds.
         */
        if (
          now - lastReload <
          10_000
        ) {
          console.warn(
            "RewardHub skipped duplicate Service Worker reload."
          );

          return;
        }

        sessionStorage.setItem(
          RELOAD_GUARD_KEY,
          String(now)
        );

        console.log(
          "A new RewardHub version is active. Reloading..."
        );

        window.location.reload();
      };

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void checkForUpdate();
        }
      };

    const handleWindowFocus =
      () => {
        void checkForUpdate();
      };

    const handleOnline =
      () => {
        void checkForUpdate();
      };

    async function registerServiceWorker() {
      try {
        registration =
          await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
              updateViaCache:
                "none",
            }
          );

        if (cancelled) {
          return;
        }

        console.log(
          "RewardHub service worker registered:",
          registration.scope
        );

        /*
         * Check immediately whenever the app
         * or website is opened.
         */
        await checkForUpdate();

        /*
         * Check again every 30 minutes while
         * the app remains open.
         */
        updateInterval =
          setInterval(
            () => {
              void checkForUpdate();
            },
            UPDATE_INTERVAL
          );
      } catch (error) {
        console.error(
          "RewardHub service worker registration failed:",
          error
        );
      }
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    window.addEventListener(
      "online",
      handleOnline
    );

    void registerServiceWorker();

    return () => {
      cancelled = true;

      if (updateInterval) {
        clearInterval(
          updateInterval
        );
      }

      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );

      window.removeEventListener(
        "online",
        handleOnline
      );
    };
  }, []);

  return null;
}