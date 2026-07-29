"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  getMerchantNotifications,
  markAllMerchantNotificationsRead,
  markMerchantNotificationRead,
  type MerchantNotificationItem,
} from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

type FilterType =
  | "ALL"
  | "UNREAD"
  | "READ";

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations = {
  en: {
    unableLoad: "Unable to load notifications.",
    unableMarkRead: "Unable to mark notification as read.",
    unableMarkAllRead: "Unable to mark all notifications as read.",
    today: "Today",
    yesterday: "Yesterday",
    back: "Back",
    merchantPortal: "Merchant Portal",
    notifications: "Notifications",
    description:
      "Important RewardHub updates, settlements, campaigns and system messages appear here.",
    unread: "Unread",
    updating: "Updating...",
    markAllRead: "Mark all read",
    all: "All",
    read: "Read",
    refreshing: "Refreshing...",
    refresh: "Refresh",
    noNotifications: "No notifications",
    emptyDescription:
      "New RewardHub notifications will appear here.",
    new: "NEW",
    readUpper: "READ",
    viewDetails: "View details →",
  },
  zh: {
    unableLoad: "无法加载通知。",
    unableMarkRead: "无法将通知标记为已读。",
    unableMarkAllRead: "无法将所有通知标记为已读。",
    today: "今天",
    yesterday: "昨天",
    back: "返回",
    merchantPortal: "商家端",
    notifications: "通知",
    description:
      "重要的 RewardHub 更新、结算、活动和系统消息会显示在这里。",
    unread: "未读",
    updating: "正在更新……",
    markAllRead: "全部标记为已读",
    all: "全部",
    read: "已读",
    refreshing: "正在刷新……",
    refresh: "刷新",
    noNotifications: "暂无通知",
    emptyDescription: "新的 RewardHub 通知会显示在这里。",
    new: "新通知",
    readUpper: "已读",
    viewDetails: "查看详情 →",
  },
  ms: {
    unableLoad: "Tidak dapat memuatkan notifikasi.",
    unableMarkRead: "Tidak dapat menandakan notifikasi sebagai dibaca.",
    unableMarkAllRead:
      "Tidak dapat menandakan semua notifikasi sebagai dibaca.",
    today: "Hari Ini",
    yesterday: "Semalam",
    back: "Kembali",
    merchantPortal: "Portal Pedagang",
    notifications: "Notifikasi",
    description:
      "Kemas kini penting RewardHub, penyelesaian, kempen dan mesej sistem dipaparkan di sini.",
    unread: "Belum Dibaca",
    updating: "Sedang Mengemas Kini...",
    markAllRead: "Tandakan Semua Dibaca",
    all: "Semua",
    read: "Dibaca",
    refreshing: "Sedang Menyegar...",
    refresh: "Segar Semula",
    noNotifications: "Tiada notifikasi",
    emptyDescription:
      "Notifikasi RewardHub baharu akan dipaparkan di sini.",
    new: "BAHARU",
    readUpper: "DIBACA",
    viewDetails: "Lihat butiran →",
  },
} as const;

function normalizeLanguage(value: string | null): LanguageCode {
  return value === "zh" || value === "ms" ? value : "en";
}

function getMerchantIdFromStorage() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const raw = window.localStorage.getItem("merchant");

    if (!raw) {
      return "";
    }

    const parsed: any = JSON.parse(raw);

    const candidate =
      parsed?.merchant ??
      parsed?.data ??
      parsed;

    return String(
      candidate?.merchantId ??
        candidate?.MERCHANT_ID ??
        candidate?.id ??
        ""
    ).trim();
  } catch {
    return "";
  }
}

function unwrapData(
  result: unknown
): Record<string, unknown> {
  if (
    !result ||
    typeof result !== "object"
  ) {
    return {};
  }

  const root =
    result as Record<string, unknown>;

  const first =
    root.data &&
    typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  return first.data &&
    typeof first.data === "object"
    ? (first.data as Record<string, unknown>)
    : first;
}

function getNotificationTimestamp(
  value: string
) {
  if (!value) {
    return 0;
  }

  const normalized =
    value.includes("T")
      ? value
      : value.replace(" ", "T");

  const date = new Date(normalized);
  const time = date.getTime();

  return Number.isNaN(time)
    ? 0
    : time;
}

function formatDateTime(
  value: string,
  language: LanguageCode,
  labels: {
    today: string;
    yesterday: string;
  }
) {
  const timestamp =
    getNotificationTimestamp(value);

  if (!timestamp) {
    return value || "";
  }

  const date = new Date(timestamp);
  const now = new Date();

  const startOfToday =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  const startOfNotificationDay =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

  const dayDifference =
    Math.round(
      (
        startOfToday.getTime() -
        startOfNotificationDay.getTime()
      ) /
        86400000
    );

  const locale =
    language === "zh"
      ? "zh-CN"
      : language === "ms"
        ? "ms-MY"
        : "en-MY";

  const timeText =
    new Intl.DateTimeFormat(
      locale,
      {
        hour: "numeric",
        minute: "2-digit",
      }
    ).format(date);

  if (dayDifference === 0) {
    return `${labels.today} • ${timeText}`;
  }

  if (dayDifference === 1) {
    return `${labels.yesterday} • ${timeText}`;
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  )
    .format(date)
    .replace(",", " •");
}

function dispatchNotificationUpdate() {
  window.dispatchEvent(
    new Event(
      "rewardhub-notifications-updated"
    )
  );
}

export default function MerchantNotificationsPage() {
  const router = useRouter();

  const [language, setLanguage] =
    useState<LanguageCode>("en");

  const [merchantId, setMerchantId] =
    useState("");

  const [notifications, setNotifications] =
    useState<MerchantNotificationItem[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [filter, setFilter] =
    useState<FilterType>("ALL");

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState("");

  const [error, setError] =
    useState("");

  const t = useMemo(
    () => translations[language],
    [language]
  );

  useEffect(() => {
    setLanguage(
      normalizeLanguage(
        localStorage.getItem(LANGUAGE_STORAGE_KEY)
      )
    );

    function handleLanguageChange(event: Event) {
      const customEvent =
        event as CustomEvent<{ language?: string }>;

      setLanguage(
        normalizeLanguage(
          customEvent.detail?.language ||
            localStorage.getItem(LANGUAGE_STORAGE_KEY)
        )
      );
    }

    window.addEventListener(
      "rewardhub-language-change",
      handleLanguageChange as EventListener
    );
    window.addEventListener(
      "storage",
      handleLanguageChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "rewardhub-language-change",
        handleLanguageChange as EventListener
      );
      window.removeEventListener(
        "storage",
        handleLanguageChange as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const storedMerchantId =
      getMerchantIdFromStorage();

    if (!storedMerchantId) {
      router.replace(
        "/merchant/login"
      );
      return;
    }

    setMerchantId(
      storedMerchantId
    );
  }, [router]);

  const loadNotifications =
    useCallback(async () => {
      if (!merchantId) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result =
          await getMerchantNotifications(
            {
              merchantId,
              limit: 200,
            }
          );

        const data =
          unwrapData(result);

        const items =
          Array.isArray(data.items)
            ? (data.items as MerchantNotificationItem[])
            : [];

        setNotifications(items);
        setUnreadCount(
          Number(
            data.unreadCount || 0
          )
        );

        dispatchNotificationUpdate();
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : t.unableLoad
        );
      } finally {
        setLoading(false);
      }
    }, [merchantId, t.unableLoad]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const sortedNotifications =
    useMemo(() => {
      return [
        ...notifications,
      ].sort(
        (
          first,
          second
        ) => {
          if (
            first.isRead !==
            second.isRead
          ) {
            return first.isRead
              ? 1
              : -1;
          }

          return (
            getNotificationTimestamp(
              second.createdAt
            ) -
            getNotificationTimestamp(
              first.createdAt
            )
          );
        }
      );
    }, [notifications]);

  const filteredNotifications =
    useMemo(() => {
      if (filter === "UNREAD") {
        return sortedNotifications.filter(
          (item) => !item.isRead
        );
      }

      if (filter === "READ") {
        return sortedNotifications.filter(
          (item) => item.isRead
        );
      }

      return sortedNotifications;
    }, [
      filter,
      sortedNotifications,
    ]);

  async function handleNotificationClick(
    notification: MerchantNotificationItem
  ) {
    if (!merchantId) {
      return;
    }

    if (!notification.isRead) {
      setActionLoading(
        notification.userNotificationId
      );

      try {
        await markMerchantNotificationRead(
          {
            merchantId,
            userNotificationId:
              notification.userNotificationId,
          }
        );

        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item.userNotificationId ===
                notification.userNotificationId
                  ? {
                      ...item,
                      status: "READ",
                      isRead: true,
                      readAt:
                        new Date().toISOString(),
                    }
                  : item
            )
        );

        setUnreadCount(
          (current) =>
            Math.max(
              0,
              current - 1
            )
        );

        dispatchNotificationUpdate();
      } catch (readError) {
        setError(
          readError instanceof Error
            ? readError.message
            : t.unableMarkRead
        );
      } finally {
        setActionLoading("");
      }
    }

    router.push(
      `/merchant/notifications/${encodeURIComponent(
        notification.userNotificationId
      )}`
    );
  }

  async function handleMarkAllRead() {
    if (
      !merchantId ||
      unreadCount === 0
    ) {
      return;
    }

    setActionLoading(
      "MARK_ALL"
    );
    setError("");

    try {
      await markAllMerchantNotificationsRead(
        {
          merchantId,
        }
      );

      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              status: "READ",
              isRead: true,
              readAt:
                item.readAt ||
                new Date().toISOString(),
            })
          )
      );

      setUnreadCount(0);
      dispatchNotificationUpdate();
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : t.unableMarkAllRead
      );
    } finally {
      setActionLoading("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
      <div className="mx-auto w-full max-w-5xl">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-7 text-white sm:px-8 sm:py-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.history.length >
                      1
                    ) {
                      router.back();
                      return;
                    }

                    router.push(
                      "/merchant/dashboard"
                    );
                  }}
                  className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/20"
                >
                  <span
                    aria-hidden="true"
                    className="text-base leading-none"
                  >
                    ←
                  </span>

                  {t.back}
                </button>

                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-300">
                  {t.merchantPortal}
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {t.notifications}
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-300 sm:text-base">
                  {t.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs font-bold text-slate-300">
                    {t.unread}
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {unreadCount}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleMarkAllRead
                  }
                  disabled={
                    unreadCount === 0 ||
                    actionLoading ===
                      "MARK_ALL"
                  }
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ===
                  "MARK_ALL"
                    ? t.updating
                    : t.markAllRead}
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 px-4 py-4 sm:px-8">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "ALL",
                  "UNREAD",
                  "READ",
                ] as FilterType[]
              ).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setFilter(value)
                  }
                  className={`rounded-full px-4 py-2 text-xs font-black transition sm:text-sm ${
                    filter === value
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {value === "ALL"
                    ? `${t.all} (${notifications.length})`
                    : value ===
                        "UNREAD"
                      ? `${t.unread} (${unreadCount})`
                      : `${t.read} (${Math.max(
                          0,
                          notifications.length -
                            unreadCount
                        )})`}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  void loadNotifications();
                }}
                disabled={loading}
                className="ml-auto rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:text-sm"
              >
                {loading
                  ? t.refreshing
                  : t.refresh}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {error ? (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-3xl bg-slate-100"
                    />
                  )
                )}
              </div>
            ) : filteredNotifications.length ===
              0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                <div className="text-5xl">
                  🔔
                </div>

                <h2 className="mt-5 text-xl font-black text-slate-950">
                  {t.noNotifications}
                </h2>

                <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                  {t.emptyDescription}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map(
                  (notification) => {
                    const isBusy =
                      actionLoading ===
                      notification.userNotificationId;

                    return (
                      <button
                        key={
                          notification.userNotificationId
                        }
                        type="button"
                        onClick={() => {
                          void handleNotificationClick(
                            notification
                          );
                        }}
                        disabled={isBusy}
                        className={`group w-full rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait ${
                          notification.isRead
                            ? "border-slate-200 bg-white"
                            : "border-emerald-200 bg-emerald-50/70 shadow-sm"
                        }`}
                      >
                        <div className="flex gap-4">
                          <div
                            className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                              notification.isRead
                                ? "bg-slate-300"
                                : "bg-emerald-600 ring-4 ring-emerald-100"
                            }`}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <h2
                                className={`text-base leading-6 sm:text-lg ${
                                  notification.isRead
                                    ? "font-bold text-slate-800"
                                    : "font-black text-slate-950"
                                }`}
                              >
                                {notification.title}
                              </h2>

                              <span className="shrink-0 text-xs font-bold text-slate-400">
                                {formatDateTime(
                                  notification.createdAt,
                                  language,
                                  {
                                    today: t.today,
                                    yesterday: t.yesterday,
                                  }
                                )}
                              </span>
                            </div>

                            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-600">
                              {notification.message}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              {!notification.isRead ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-black text-white">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                  {t.new}
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                                  {t.readUpper}
                                </span>
                              )}

                              <span className="text-xs font-black text-slate-500 transition group-hover:text-slate-950">
                                {t.viewDetails}
                              </span>

                              {isBusy ? (
                                <span className="text-xs font-bold text-slate-400">
                                  {t.updating}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}