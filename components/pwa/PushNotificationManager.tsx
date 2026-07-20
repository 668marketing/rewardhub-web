"use client";

import { useCallback, useEffect, useState } from "react";

import {
  disablePushSubscription,
  savePushSubscription,
} from "@/lib/api";

type UserType = "MEMBER" | "MERCHANT" | "ADMIN";

type PushNotificationManagerProps = {
  userType: UserType;
  userId: string;
  compact?: boolean;
};

type PushStatus =
  | "checking"
  | "unsupported"
  | "ios-browser"
  | "denied"
  | "disabled"
  | "enabled"
  | "enabling"
  | "disabling"
  | "error";

function urlBase64ToUint8Array(
  base64String: string
): Uint8Array<ArrayBuffer> {
  const padding =
    "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  const outputArray = new Uint8Array(
    rawData.length
  );

  for (
    let index = 0;
    index < rawData.length;
    index += 1
  ) {
    outputArray[index] =
      rawData.charCodeAt(index);
  }

  return outputArray;
}

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/.test(
      window.navigator.userAgent
    ) ||
    (
      window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1
    )
  );
}

function isStandaloneMode() {
  const navigatorWithStandalone =
    window.navigator as Navigator & {
      standalone?: boolean;
    };

  return (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    navigatorWithStandalone.standalone === true
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function PushNotificationManager({
  userType,
  userId,
  compact = false,
}: PushNotificationManagerProps) {
  const [status, setStatus] =
    useState<PushStatus>("checking");

  const [message, setMessage] =
    useState("");

  const checkSubscription =
    useCallback(async () => {
      setMessage("");

      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setStatus("unsupported");
        return;
      }

      if (
        isIOSDevice() &&
        !isStandaloneMode()
      ) {
        setStatus("ios-browser");
        return;
      }

      if (
        Notification.permission === "denied"
      ) {
        setStatus("denied");
        return;
      }

      try {
        const registration =
          await navigator.serviceWorker.ready;

        const existingSubscription =
          await registration.pushManager.getSubscription();

        if (existingSubscription) {
          setStatus("enabled");
        } else {
          setStatus("disabled");
        }
      } catch (error) {
        console.error(
          "Unable to check push subscription:",
          error
        );

        setMessage(getErrorMessage(error));
        setStatus("error");
      }
    }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const enableNotifications =
    async () => {
      if (!userId.trim()) {
        setMessage(
          "Missing user ID. Please log in again."
        );
        setStatus("error");
        return;
      }

      const publicKey =
        process.env
          .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        setMessage(
          "Push notification configuration is missing."
        );
        setStatus("error");
        return;
      }

      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setStatus("unsupported");
        return;
      }

      if (
        isIOSDevice() &&
        !isStandaloneMode()
      ) {
        setStatus("ios-browser");
        return;
      }

      setStatus("enabling");
      setMessage("");

      try {
        const permission =
          await Notification.requestPermission();

        if (permission === "denied") {
          setStatus("denied");
          return;
        }

        if (permission !== "granted") {
          setStatus("disabled");
          setMessage(
            "Notification permission was not granted."
          );
          return;
        }

        const registration =
          await navigator.serviceWorker.ready;

        let subscription =
          await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription =
            await registration.pushManager.subscribe(
              {
                userVisibleOnly: true,
                applicationServerKey:
                  urlBase64ToUint8Array(
                    publicKey
                  ),
              }
            );
        }

        const subscriptionJson =
          subscription.toJSON();

        const endpoint =
          subscriptionJson.endpoint ||
          subscription.endpoint;

        const p256dh =
          subscriptionJson.keys?.p256dh;

        const auth =
          subscriptionJson.keys?.auth;

        if (
          !endpoint ||
          !p256dh ||
          !auth
        ) {
          throw new Error(
            "The browser returned an incomplete push subscription."
          );
        }

        await savePushSubscription({
          userType,
          userId: userId.trim(),
          endpoint,
          p256dh,
          auth,
          userAgent:
            window.navigator.userAgent,
        });

        setStatus("enabled");
        setMessage(
          "Notifications have been enabled successfully."
        );
      } catch (error) {
        console.error(
          "Enable push notification failed:",
          error
        );

        setMessage(getErrorMessage(error));
        setStatus("error");
      }
    };

  const disableNotifications =
    async () => {
      setStatus("disabling");
      setMessage("");

      try {
        const registration =
          await navigator.serviceWorker.ready;

        const subscription =
          await registration.pushManager.getSubscription();

        if (!subscription) {
          setStatus("disabled");
          return;
        }

        const endpoint =
          subscription.endpoint;

        await disablePushSubscription({
          endpoint,
        });

        await subscription.unsubscribe();

        setStatus("disabled");
        setMessage(
          "Notifications have been disabled."
        );
      } catch (error) {
        console.error(
          "Disable push notification failed:",
          error
        );

        setMessage(getErrorMessage(error));
        setStatus("error");
      }
    };

  if (status === "checking") {
    return compact ? null : (
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-100" />

          <div className="flex-1">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-56 max-w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <NotificationCard
        icon="unsupported"
        title="Notifications unavailable"
        description="Push notifications are not supported by this browser or device."
        tone="neutral"
      />
    );
  }

  if (status === "ios-browser") {
    return (
      <NotificationCard
        icon="phone"
        title="Install RewardHub first"
        description="On iPhone, add RewardHub to your Home Screen and open it from the RewardHub icon before enabling notifications."
        tone="warning"
      />
    );
  }

  if (status === "denied") {
    return (
      <NotificationCard
        icon="blocked"
        title="Notifications are blocked"
        description="Open your device or browser settings, allow notifications for RewardHub, then return here."
        tone="warning"
      />
    );
  }

  if (compact) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <NotificationIcon
            enabled={status === "enabled"}
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-900">
              Push Notifications
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {status === "enabled"
                ? "Enabled on this device"
                : "Disabled on this device"}
            </p>
          </div>

          <NotificationButton
            status={status}
            onEnable={
              enableNotifications
            }
            onDisable={
              disableNotifications
            }
          />
        </div>

        {message ? (
          <p className="mt-3 text-xs leading-5 text-slate-500">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] sm:p-6">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-200/35 blur-3xl"
      />

      <div className="relative">
        <div className="flex items-start gap-4">
          <NotificationIcon
            enabled={status === "enabled"}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-slate-950">
                Push Notifications
              </h2>

              {status === "enabled" ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                  Enabled
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Receive Reward Credits,
              transaction, membership and
              promotion updates directly on
              this device.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <NotificationButton
            status={status}
            onEnable={
              enableNotifications
            }
            onDisable={
              disableNotifications
            }
            fullWidth
          />
        </div>

        {message ? (
          <div
            className={[
              "mt-4 rounded-2xl px-4 py-3 text-sm leading-5",
              status === "error"
                ? "bg-red-50 text-red-700"
                : "bg-slate-50 text-slate-600",
            ].join(" ")}
          >
            {message}
          </div>
        ) : null}

        <p className="mt-4 text-xs leading-5 text-slate-400">
          You can disable notifications from
          this device at any time.
        </p>
      </div>
    </div>
  );
}

function NotificationButton({
  status,
  onEnable,
  onDisable,
  fullWidth = false,
}: {
  status: PushStatus;
  onEnable: () => void;
  onDisable: () => void;
  fullWidth?: boolean;
}) {
  const loading =
    status === "enabling" ||
    status === "disabling";

  const enabled = status === "enabled";

  return (
    <button
      type="button"
      onClick={
        enabled
          ? onDisable
          : onEnable
      }
      disabled={loading}
      className={[
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold transition",
        "disabled:cursor-wait disabled:opacity-70",
        fullWidth ? "w-full" : "",
        enabled
          ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          : "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800",
      ].join(" ")}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

          {status === "enabling"
            ? "Enabling..."
            : "Disabling..."}
        </>
      ) : enabled ? (
        "Disable"
      ) : (
        <>
          <BellIcon />
          Enable Notifications
        </>
      )}
    </button>
  );
}

function NotificationIcon({
  enabled,
}: {
  enabled: boolean;
}) {
  return (
    <div
      className={[
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
        enabled
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      ].join(" ")}
    >
      <BellIcon />
    </div>
  );
}

function NotificationCard({
  title,
  description,
  tone,
}: {
  icon:
    | "unsupported"
    | "phone"
    | "blocked";
  title: string;
  description: string;
  tone: "neutral" | "warning";
}) {
  return (
    <div
      className={[
        "rounded-[24px] border p-5",
        tone === "warning"
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            tone === "warning"
              ? "bg-amber-100 text-amber-700"
              : "bg-white text-slate-500",
          ].join(" ")}
        >
          <BellIcon />
        </div>

        <div>
          <h2 className="text-sm font-extrabold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10 21h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}