"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let cancelled = false;
    let updateInterval:
      | ReturnType<typeof setInterval>
      | undefined;

    async function registerServiceWorker() {
      try {
        const registration =
          await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
              updateViaCache: "none",
            }
          );

        if (cancelled) {
          return;
        }

        console.log(
          "RewardHub service worker registered:",
          registration.scope
        );

        await registration.update();

        updateInterval = setInterval(
          () => {
            registration
              .update()
              .catch((error) => {
                console.error(
                  "RewardHub service worker update failed:",
                  error
                );
              });
          },
          30 * 60 * 1000
        );
      } catch (error) {
        console.error(
          "RewardHub service worker registration failed:",
          error
        );
      }
    }

    void registerServiceWorker();

    return () => {
      cancelled = true;

      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, []);

  return null;
}