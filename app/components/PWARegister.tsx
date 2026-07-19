"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("RewardHub service worker registered");
      } catch (error) {
        console.error(
          "RewardHub service worker registration failed:",
          error
        );
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}