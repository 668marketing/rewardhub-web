"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  disablePushSubscription,
  savePushSubscription,
} from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

type UserType =
  | "MEMBER"
  | "MERCHANT"
  | "ADMIN";

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

type LanguageCode =
  | "en"
  | "zh"
  | "ms";

type PushCopy = {
  title: string;
  description: string;
  enabled: string;
  disabled: string;
  enabledOnDevice: string;
  disabledOnDevice: string;
  enableNotifications: string;
  disable: string;
  enabling: string;
  disabling: string;
  disableAnytime: string;

  unavailableTitle: string;
  unavailableDescription: string;

  installTitle: string;
  installDescription: string;

  blockedTitle: string;
  blockedDescription: string;

  missingUserId: string;
  missingConfiguration: string;
  permissionNotGranted: string;
  incompleteSubscription: string;

  enabledSuccess: string;
  disabledSuccess: string;
  genericError: string;
};

const COPY: Record<
  LanguageCode,
  PushCopy
> = {
  en: {
    title:
      "Push Notifications",

    description:
      "Receive Reward Credits, transaction, membership and promotion updates directly on this device.",

    enabled:
      "Enabled",

    disabled:
      "Disabled",

    enabledOnDevice:
      "Enabled on this device",

    disabledOnDevice:
      "Disabled on this device",

    enableNotifications:
      "Enable Notifications",

    disable:
      "Disable",

    enabling:
      "Enabling...",

    disabling:
      "Disabling...",

    disableAnytime:
      "You can disable notifications from this device at any time.",

    unavailableTitle:
      "Notifications unavailable",

    unavailableDescription:
      "Push notifications are not supported by this browser or device.",

    installTitle:
      "Install RewardHub first",

    installDescription:
      "On iPhone, add RewardHub to your Home Screen and open it from the RewardHub icon before enabling notifications.",

    blockedTitle:
      "Notifications are blocked",

    blockedDescription:
      "Open your device or browser settings, allow notifications for RewardHub, then return here.",

    missingUserId:
      "Missing user ID. Please log in again.",

    missingConfiguration:
      "Push notification configuration is missing.",

    permissionNotGranted:
      "Notification permission was not granted.",

    incompleteSubscription:
      "The browser returned an incomplete push subscription.",

    enabledSuccess:
      "Notifications have been enabled successfully.",

    disabledSuccess:
      "Notifications have been disabled.",

    genericError:
      "Something went wrong. Please try again.",
  },

  zh: {
    title:
      "推送通知",

    description:
      "在此设备即时接收 Reward Credits、交易记录、会员等级和优惠活动通知。",

    enabled:
      "已启用",

    disabled:
      "未启用",

    enabledOnDevice:
      "此设备已启用",

    disabledOnDevice:
      "此设备未启用",

    enableNotifications:
      "启用推送通知",

    disable:
      "关闭通知",

    enabling:
      "正在启用...",

    disabling:
      "正在关闭...",

    disableAnytime:
      "你可以随时在此设备关闭推送通知。",

    unavailableTitle:
      "无法使用推送通知",

    unavailableDescription:
      "此浏览器或设备不支持推送通知。",

    installTitle:
      "请先安装 RewardHub",

    installDescription:
      "在 iPhone 上，请先将 RewardHub 添加到主画面，然后从 RewardHub 图标打开应用，再启用推送通知。",

    blockedTitle:
      "推送通知已被阻止",

    blockedDescription:
      "请打开设备或浏览器设置，允许 RewardHub 发送通知，然后返回此页面。",

    missingUserId:
      "找不到会员资料，请重新登录。",

    missingConfiguration:
      "推送通知设置尚未完成。",

    permissionNotGranted:
      "尚未取得通知权限。",

    incompleteSubscription:
      "浏览器返回的推送订阅资料不完整。",

    enabledSuccess:
      "推送通知已成功启用。",

    disabledSuccess:
      "推送通知已关闭。",

    genericError:
      "发生错误，请稍后再试。",
  },

  ms: {
    title:
      "Pemberitahuan Tolakan",

    description:
      "Terima kemas kini Reward Credits, transaksi, keahlian dan promosi terus pada peranti ini.",

    enabled:
      "Diaktifkan",

    disabled:
      "Tidak Diaktifkan",

    enabledOnDevice:
      "Diaktifkan pada peranti ini",

    disabledOnDevice:
      "Tidak diaktifkan pada peranti ini",

    enableNotifications:
      "Aktifkan Pemberitahuan",

    disable:
      "Nyahaktifkan",

    enabling:
      "Sedang mengaktifkan...",

    disabling:
      "Sedang menyahaktifkan...",

    disableAnytime:
      "Anda boleh menyahaktifkan pemberitahuan pada peranti ini pada bila-bila masa.",

    unavailableTitle:
      "Pemberitahuan tidak tersedia",

    unavailableDescription:
      "Pemberitahuan tolakan tidak disokong oleh pelayar atau peranti ini.",

    installTitle:
      "Pasang RewardHub terlebih dahulu",

    installDescription:
      "Pada iPhone, tambah RewardHub ke Skrin Utama dan buka melalui ikon RewardHub sebelum mengaktifkan pemberitahuan.",

    blockedTitle:
      "Pemberitahuan disekat",

    blockedDescription:
      "Buka tetapan peranti atau pelayar, benarkan pemberitahuan untuk RewardHub, kemudian kembali ke halaman ini.",

    missingUserId:
      "ID pengguna tidak ditemui. Sila log masuk semula.",

    missingConfiguration:
      "Konfigurasi pemberitahuan tolakan belum lengkap.",

    permissionNotGranted:
      "Kebenaran pemberitahuan tidak diberikan.",

    incompleteSubscription:
      "Pelayar memberikan langganan pemberitahuan yang tidak lengkap.",

    enabledSuccess:
      "Pemberitahuan berjaya diaktifkan.",

    disabledSuccess:
      "Pemberitahuan telah dinyahaktifkan.",

    genericError:
      "Sesuatu telah berlaku. Sila cuba lagi.",
  },
};

function normalizeLanguage(
  value: unknown
): LanguageCode {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    normalized === "zh" ||
    normalized.startsWith("zh-")
  ) {
    return "zh";
  }

  if (
    normalized === "ms" ||
    normalized.startsWith("ms-")
  ) {
    return "ms";
  }

  return "en";
}

function urlBase64ToUint8Array(
  base64String: string
): Uint8Array<ArrayBuffer> {
  const padding =
    "=".repeat(
      (
        4 -
        (
          base64String.length %
          4
        )
      ) %
        4
    );

  const base64 =
    (
      base64String +
      padding
    )
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );

  const rawData =
    window.atob(
      base64
    );

  const outputArray =
    new Uint8Array(
      rawData.length
    );

  for (
    let index = 0;
    index <
    rawData.length;
    index += 1
  ) {
    outputArray[index] =
      rawData.charCodeAt(
        index
      );
  }

  return outputArray;
}

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/.test(
      window.navigator
        .userAgent
    ) ||
    (
      window.navigator
        .platform ===
        "MacIntel" &&
      window.navigator
        .maxTouchPoints >
        1
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
    navigatorWithStandalone
      .standalone === true
  );
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

export default function PushNotificationManager({
  userType,
  userId,
  compact = false,
}: PushNotificationManagerProps) {
  const {
    language,
  } = useLanguage();

  const copy =
    useMemo(
      () =>
        COPY[
          normalizeLanguage(
            language
          )
        ],
      [language]
    );

  const [
    status,
    setStatus,
  ] =
    useState<PushStatus>(
      "checking"
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  const checkSubscription =
    useCallback(
      async () => {
        setMessage("");

        if (
          !(
            "serviceWorker" in
            navigator
          ) ||
          !(
            "PushManager" in
            window
          ) ||
          !(
            "Notification" in
            window
          )
        ) {
          setStatus(
            "unsupported"
          );
          return;
        }

        if (
          isIOSDevice() &&
          !isStandaloneMode()
        ) {
          setStatus(
            "ios-browser"
          );
          return;
        }

        if (
          Notification.permission ===
          "denied"
        ) {
          setStatus(
            "denied"
          );
          return;
        }

        try {
          const registration =
            await navigator
              .serviceWorker
              .ready;

          const existingSubscription =
            await registration
              .pushManager
              .getSubscription();

          setStatus(
            existingSubscription
              ? "enabled"
              : "disabled"
          );
        } catch (error) {
          console.error(
            "Unable to check push subscription:",
            error
          );

          setMessage(
            getErrorMessage(
              error,
              copy.genericError
            )
          );

          setStatus(
            "error"
          );
        }
      },
      [copy.genericError]
    );

  useEffect(() => {
    void checkSubscription();
  }, [checkSubscription]);

  async function enableNotifications() {
    if (
      !userId.trim()
    ) {
      setMessage(
        copy.missingUserId
      );

      setStatus(
        "error"
      );
      return;
    }

    const publicKey =
      process.env
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      setMessage(
        copy.missingConfiguration
      );

      setStatus(
        "error"
      );
      return;
    }

    if (
      !(
        "serviceWorker" in
        navigator
      ) ||
      !(
        "PushManager" in
        window
      ) ||
      !(
        "Notification" in
        window
      )
    ) {
      setStatus(
        "unsupported"
      );
      return;
    }

    if (
      isIOSDevice() &&
      !isStandaloneMode()
    ) {
      setStatus(
        "ios-browser"
      );
      return;
    }

    setStatus(
      "enabling"
    );

    setMessage("");

    try {
      const permission =
        await Notification
          .requestPermission();

      if (
        permission ===
        "denied"
      ) {
        setStatus(
          "denied"
        );
        return;
      }

      if (
        permission !==
        "granted"
      ) {
        setStatus(
          "disabled"
        );

        setMessage(
          copy.permissionNotGranted
        );
        return;
      }

      const registration =
        await navigator
          .serviceWorker
          .ready;

      let subscription =
        await registration
          .pushManager
          .getSubscription();

      if (
        !subscription
      ) {
        subscription =
          await registration
            .pushManager
            .subscribe({
              userVisibleOnly:
                true,

              applicationServerKey:
                urlBase64ToUint8Array(
                  publicKey
                ),
            });
      }

      const subscriptionJson =
        subscription.toJSON();

      const endpoint =
        subscriptionJson
          .endpoint ||
        subscription
          .endpoint;

      const p256dh =
        subscriptionJson
          .keys?.p256dh;

      const auth =
        subscriptionJson
          .keys?.auth;

      if (
        !endpoint ||
        !p256dh ||
        !auth
      ) {
        throw new Error(
          copy.incompleteSubscription
        );
      }

      await savePushSubscription({
        userType,
        userId:
          userId.trim(),
        endpoint,
        p256dh,
        auth,
        userAgent:
          window.navigator
            .userAgent,
      });

      setStatus(
        "enabled"
      );

      setMessage(
        copy.enabledSuccess
      );
    } catch (error) {
      console.error(
        "Enable push notification failed:",
        error
      );

      setMessage(
        getErrorMessage(
          error,
          copy.genericError
        )
      );

      setStatus(
        "error"
      );
    }
  }

  async function disableNotifications() {
    setStatus(
      "disabling"
    );

    setMessage("");

    try {
      const registration =
        await navigator
          .serviceWorker
          .ready;

      const subscription =
        await registration
          .pushManager
          .getSubscription();

      if (
        !subscription
      ) {
        setStatus(
          "disabled"
        );
        return;
      }

      const endpoint =
        subscription
          .endpoint;

      await disablePushSubscription({
        endpoint,
      });

      await subscription
        .unsubscribe();

      setStatus(
        "disabled"
      );

      setMessage(
        copy.disabledSuccess
      );
    } catch (error) {
      console.error(
        "Disable push notification failed:",
        error
      );

      setMessage(
        getErrorMessage(
          error,
          copy.genericError
        )
      );

      setStatus(
        "error"
      );
    }
  }

  if (
    status ===
    "checking"
  ) {
    return compact
      ? null
      : (
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

  if (
    status ===
    "unsupported"
  ) {
    return (
      <NotificationCard
        title={
          copy.unavailableTitle
        }
        description={
          copy.unavailableDescription
        }
        tone="neutral"
      />
    );
  }

  if (
    status ===
    "ios-browser"
  ) {
    return (
      <NotificationCard
        title={
          copy.installTitle
        }
        description={
          copy.installDescription
        }
        tone="warning"
      />
    );
  }

  if (
    status ===
    "denied"
  ) {
    return (
      <NotificationCard
        title={
          copy.blockedTitle
        }
        description={
          copy.blockedDescription
        }
        tone="warning"
      />
    );
  }

  if (compact) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <NotificationIcon
            enabled={
              status ===
              "enabled"
            }
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-900">
              {copy.title}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {status ===
              "enabled"
                ? copy.enabledOnDevice
                : copy.disabledOnDevice}
            </p>
          </div>

          <NotificationButton
            status={status}
            copy={copy}
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
            enabled={
              status ===
              "enabled"
            }
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-slate-950">
                {copy.title}
              </h2>

              {status ===
              "enabled" ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                  {
                    copy.enabled
                  }
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {
                copy.description
              }
            </p>
          </div>
        </div>

        <div className="mt-5">
          <NotificationButton
            status={status}
            copy={copy}
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
              status ===
              "error"
                ? "bg-red-50 text-red-700"
                : "bg-slate-50 text-slate-600",
            ].join(" ")}
          >
            {message}
          </div>
        ) : null}

        <p className="mt-4 text-xs leading-5 text-slate-400">
          {
            copy.disableAnytime
          }
        </p>
      </div>
    </div>
  );
}

function NotificationButton({
  status,
  copy,
  onEnable,
  onDisable,
  fullWidth = false,
}: {
  status: PushStatus;
  copy: PushCopy;
  onEnable: () => void;
  onDisable: () => void;
  fullWidth?: boolean;
}) {
  const loading =
    status ===
      "enabling" ||
    status ===
      "disabling";

  const enabled =
    status ===
    "enabled";

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
        fullWidth
          ? "w-full"
          : "",
        enabled
          ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          : "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800",
      ].join(" ")}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

          {status ===
          "enabling"
            ? copy.enabling
            : copy.disabling}
        </>
      ) : enabled ? (
        copy.disable
      ) : (
        <>
          <BellIcon />
          {
            copy.enableNotifications
          }
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
  title: string;
  description: string;
  tone:
    | "neutral"
    | "warning";
}) {
  return (
    <div
      className={[
        "rounded-[24px] border p-5",
        tone ===
        "warning"
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            tone ===
            "warning"
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