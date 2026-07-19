"use client";

import { useEffect, useRef, useState } from "react";

const RELOAD_FLAG = "rewardhub_sw_refreshing";

export default function PWARegister() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);

  const registrationRef =
    useRef<ServiceWorkerRegistration | null>(null);

  const waitingWorkerRef =
    useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let updateInterval: number | undefined;
    let hasReloaded = false;

    const handleControllerChange = () => {
      if (hasReloaded) {
        return;
      }

      hasReloaded = true;

      const isRefreshing =
        window.sessionStorage.getItem(RELOAD_FLAG) === "true";

      if (isRefreshing) {
        window.sessionStorage.removeItem(RELOAD_FLAG);
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    const showWaitingWorker = (
      worker: ServiceWorker
    ) => {
      waitingWorkerRef.current = worker;
      setShowUpdate(true);
    };

    const watchInstallingWorker = (
      worker: ServiceWorker
    ) => {
      worker.addEventListener("statechange", () => {
        if (
          worker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          showWaitingWorker(worker);
        }
      });
    };

    const registerServiceWorker = async () => {
      try {
        const registration =
          await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
              updateViaCache: "none",
            }
          );

        registrationRef.current = registration;

        console.log(
          "RewardHub service worker registered"
        );

        if (registration.waiting) {
          showWaitingWorker(registration.waiting);
        }

        registration.addEventListener(
          "updatefound",
          () => {
            const installingWorker =
              registration.installing;

            if (installingWorker) {
              watchInstallingWorker(
                installingWorker
              );
            }
          }
        );

        // 每次 App 打开时检查新版
        await registration.update();

        // App 保持开启时，每 30 分钟检查一次
        updateInterval = window.setInterval(
          () => {
            registration.update().catch(
              (error) => {
                console.error(
                  "RewardHub update check failed:",
                  error
                );
              }
            );
          },
          30 * 60 * 1000
        );
      } catch (error) {
        console.error(
          "RewardHub service worker registration failed:",
          error
        );
      }
    };

    registerServiceWorker();

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );

      if (updateInterval) {
        window.clearInterval(updateInterval);
      }
    };
  }, []);

  const updateNow = () => {
    const waitingWorker =
      waitingWorkerRef.current ||
      registrationRef.current?.waiting;

    if (!waitingWorker) {
      window.location.reload();
      return;
    }

    setUpdating(true);

    window.sessionStorage.setItem(
      RELOAD_FLAG,
      "true"
    );

    waitingWorker.postMessage({
      type: "SKIP_WAITING",
    });
  };

  const updateLater = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[99998] px-4"
      style={{
        paddingBottom:
          "max(16px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto max-w-md overflow-hidden rounded-[24px] border border-white/10 bg-[#111111]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="h-1 w-full bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-500" />

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 ring-1 ring-yellow-400/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6 text-yellow-400"
                aria-hidden="true"
              >
                <path
                  d="M20 12a8 8 0 1 1-2.34-5.66"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <path
                  d="M20 4v6h-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-extrabold text-white">
                New version available
              </h2>

              <p className="mt-1 text-sm leading-6 text-white/55">
                A newer version of RewardHub is
                ready. Update now to get the latest
                improvements.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={updateLater}
              disabled={updating}
              className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Later
            </button>

            <button
              type="button"
              onClick={updateNow}
              disabled={updating}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-4 text-sm font-extrabold text-black transition hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-70"
            >
              {updating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                  Updating...
                </>
              ) : (
                "Update Now"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}