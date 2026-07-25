"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  getMemberNotifications,
  markAllMemberNotificationsRead,
  markMemberNotificationRead,
  type MemberNotificationItem,
} from "@/lib/api";

type StoredMember = {
  memberId?: string;
  MEMBER_ID?: string;
  id?: string;
  profile?: StoredMember;
  member?: StoredMember;
  data?: StoredMember;
};


type FilterType =
  | "ALL"
  | "UNREAD"
  | "READ";

function getMemberIdFromStorage() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const raw =
      window.localStorage.getItem(
        "member"
      );

    if (!raw) {
      return "";
    }

    const parsed: StoredMember =
      JSON.parse(raw);

    return String(
      parsed?.memberId ??
        parsed?.MEMBER_ID ??
        parsed?.id ??
        parsed?.profile?.memberId ??
        parsed?.profile?.MEMBER_ID ??
        parsed?.member?.memberId ??
        parsed?.member?.MEMBER_ID ??
        parsed?.data?.memberId ??
        parsed?.data?.MEMBER_ID ??
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
    result as Record<
      string,
      unknown
    >;

  const first =
    root.data &&
    typeof root.data === "object"
      ? (root.data as Record<
          string,
          unknown
        >)
      : root;

  return first.data &&
    typeof first.data === "object"
    ? (first.data as Record<
        string,
        unknown
      >)
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
      : value.replace(
          " ",
          "T"
        );

  const date =
    new Date(normalized);

  const time =
    date.getTime();

  return Number.isNaN(time)
    ? 0
    : time;
}

function formatDateTime(
  value: string
) {
  const timestamp =
    getNotificationTimestamp(
      value
    );

  if (!timestamp) {
    return value || "";
  }

  const date =
    new Date(timestamp);

  const now =
    new Date();

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

  const timeText =
    new Intl.DateTimeFormat(
      "en-MY",
      {
        hour:
          "numeric",
        minute:
          "2-digit",
      }
    ).format(date);

  if (dayDifference === 0) {
    return `Today • ${timeText}`;
  }

  if (dayDifference === 1) {
    return `Yesterday • ${timeText}`;
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
      hour:
        "numeric",
      minute:
        "2-digit",
    }
  )
    .format(date)
    .replace(
      ",",
      " •"
    );
}

function dispatchNotificationUpdate() {
  window.dispatchEvent(
    new Event(
      "rewardhub-notifications-updated"
    )
  );
}

export default function MemberNotificationsPage() {
  const router = useRouter();

  const [
    memberId,
    setMemberId,
  ] = useState("");

  const [
    notifications,
    setNotifications,
  ] = useState<
    MemberNotificationItem[]
  >([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    filter,
    setFilter,
  ] = useState<FilterType>(
    "ALL"
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const storedMemberId =
      getMemberIdFromStorage();

    if (!storedMemberId) {
      setError(
        "Member session is unavailable. Please return to the dashboard and try again."
      );
      setLoading(false);
      return;
    }

    setMemberId(
      storedMemberId
    );
  }, []);

  const loadNotifications =
    useCallback(async () => {
      if (!memberId) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result =
          await getMemberNotifications(
            {
              memberId,
              limit: 200,
            }
          );

        const data =
          unwrapData(result);

        const items =
          Array.isArray(data.items)
            ? (data.items as MemberNotificationItem[])
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
            : "Unable to load notifications."
        );
      } finally {
        setLoading(false);
      }
    }, [memberId]);

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
          /*
           * Unread notifications stay above read notifications.
           * Within each group, the newest notification appears first.
           */
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
          (item) =>
            !item.isRead
        );
      }

      if (filter === "READ") {
        return sortedNotifications.filter(
          (item) =>
            item.isRead
        );
      }

      return sortedNotifications;
    }, [
      filter,
      sortedNotifications,
    ]);


  async function handleNotificationClick(
    notification: MemberNotificationItem
  ) {
    if (!memberId) {
      return;
    }

    if (!notification.isRead) {
      setActionLoading(
        notification.userNotificationId
      );

      try {
        await markMemberNotificationRead(
          {
            memberId,
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
                      status:
                        "READ",
                      isRead:
                        true,
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
            : "Unable to mark notification as read."
        );
      } finally {
        setActionLoading("");
      }
    }

    router.push(
      `/member/notifications/${encodeURIComponent(
        notification.userNotificationId
      )}`
    );
  }

  async function handleMarkAllRead() {
    if (
      !memberId ||
      unreadCount === 0
    ) {
      return;
    }

    setActionLoading(
      "MARK_ALL"
    );
    setError("");

    try {
      await markAllMemberNotificationsRead(
        {
          memberId,
        }
      );

      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              status:
                "READ",
              isRead:
                true,
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
          : "Unable to mark all notifications as read."
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
                      "/member/dashboard"
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

                  Back
                </button>

                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-300">
                  Member Portal
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Notifications
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-300 sm:text-base">
                  Important RewardHub updates, rewards,
                  referrals and system messages appear here.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs font-bold text-slate-300">
                    Unread
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
                    ? "Updating..."
                    : "Mark all read"}
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
                    ? `All (${notifications.length})`
                    : value ===
                        "UNREAD"
                      ? `Unread (${unreadCount})`
                      : `Read (${Math.max(
                          0,
                          notifications.length -
                            unreadCount
                        )})`}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  void loadNotifications()
                }
                disabled={loading}
                className="ml-auto rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:text-sm"
              >
                {loading
                  ? "Refreshing..."
                  : "Refresh"}
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
                  No notifications
                </h2>

                <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                  New RewardHub notifications will appear here.
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
                        onClick={() =>
                          handleNotificationClick(
                            notification
                          )
                        }
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
                                {
                                  notification.title
                                }
                              </h2>

                              <span className="shrink-0 text-xs font-bold text-slate-400">
                                {formatDateTime(
                                  notification.createdAt
                                )}
                              </span>
                            </div>

                            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-600">
                              {
                                notification.message
                              }
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              {!notification.isRead ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-black text-white">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                  NEW
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                                  READ
                                </span>
                              )}

                              <span className="text-xs font-black text-slate-500 transition group-hover:text-slate-950">
                                View details →
                              </span>

                              {isBusy ? (
                                <span className="text-xs font-bold text-slate-400">
                                  Updating...
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