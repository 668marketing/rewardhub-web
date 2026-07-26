"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMemberNotifications,
  markAllMemberNotificationsRead,
  markMemberNotificationRead,
  type MemberNotificationItem,
} from "@/lib/api";

type FilterType = "ALL" | "UNREAD" | "READ";
type NotificationKind = "PAYMENT" | "REFERRAL" | "TIER" | "POINTS" | "SYSTEM";

type StoredMember = {
  memberId?: string;
  MEMBER_ID?: string;
  id?: string;
  profile?: StoredMember;
  member?: StoredMember;
  data?: StoredMember;
};

function getMemberIdFromStorage() {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem("member");
    if (!raw) return "";
    const parsed = JSON.parse(raw) as StoredMember;
    return String(
      parsed.memberId ??
        parsed.MEMBER_ID ??
        parsed.id ??
        parsed.profile?.memberId ??
        parsed.profile?.MEMBER_ID ??
        parsed.member?.memberId ??
        parsed.member?.MEMBER_ID ??
        parsed.data?.memberId ??
        parsed.data?.MEMBER_ID ??
        ""
    ).trim();
  } catch {
    return "";
  }
}

function unwrapData(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== "object") return {};
  const root = result as Record<string, unknown>;
  const first =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  return first.data && typeof first.data === "object"
    ? (first.data as Record<string, unknown>)
    : first;
}

function getTimestamp(value: string) {
  if (!value) return 0;
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T")).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateTime(value: string) {
  const timestamp = getTimestamp(value);
  if (!timestamp) return value || "";
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const notificationDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const difference = Math.round((today - notificationDay) / 86400000);
  const time = new Intl.DateTimeFormat("en-MY", { hour: "numeric", minute: "2-digit" }).format(date);
  if (difference === 0) return `Today • ${time}`;
  if (difference === 1) return `Yesterday • ${time}`;
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date).replace(",", " •");
}

function getKind(notification: MemberNotificationItem): NotificationKind {
  const source = [notification.notificationId, notification.title, notification.targetUrl]
    .join(" ")
    .toUpperCase();
  if (source.includes("PAYMENT") || source.includes("/MEMBER/TRANSACTIONS")) return "PAYMENT";
  if (source.includes("REFERRAL") || source.includes("COMMISSION")) return "REFERRAL";
  if (source.includes("TIER") || source.includes("UPGRADE")) return "TIER";
  if (source.includes("POINT")) return "POINTS";
  return "SYSTEM";
}

function getVisual(kind: NotificationKind) {
  switch (kind) {
    case "PAYMENT":
      return { icon: "✓", iconClass: "bg-emerald-100 text-emerald-700 ring-emerald-200", label: "Payment" };
    case "REFERRAL":
      return { icon: "↗", iconClass: "bg-violet-100 text-violet-700 ring-violet-200", label: "Reward" };
    case "TIER":
      return { icon: "★", iconClass: "bg-amber-100 text-amber-700 ring-amber-200", label: "Membership" };
    case "POINTS":
      return { icon: "P", iconClass: "bg-blue-100 text-blue-700 ring-blue-200", label: "Points" };
    default:
      return { icon: "i", iconClass: "bg-slate-100 text-slate-700 ring-slate-200", label: "Update" };
  }
}

function getAmountText(notification: MemberNotificationItem) {
  const message = String(notification.message || "");
  const referralMatch = message.match(/RM\s*([\d,]+(?:\.\d{1,2})?)\s+Reward Credits/i);
  if (referralMatch) return `+RM${referralMatch[1]}`;
  const paymentMatch = message.match(/payment of RM\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (paymentMatch) return `RM${paymentMatch[1]}`;
  return "";
}

function getSummary(notification: MemberNotificationItem) {
  const message = String(notification.message || "").trim();
  if (!message) return "Open this notification to view more information.";
  return message.split(/\n\s*\n|\n/).map((line) => line.trim()).find(Boolean) || message;
}

function dispatchNotificationUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rewardhub-notifications-updated"));
  }
}

export default function MemberNotificationsPage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [notifications, setNotifications] = useState<MemberNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedMemberId = getMemberIdFromStorage();
    if (!storedMemberId) {
      setError("Member session is unavailable. Return to the dashboard and try again.");
      setLoading(false);
      return;
    }
    setMemberId(storedMemberId);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    setError("");
    try {
      const result = await getMemberNotifications({ memberId, limit: 200 });
      const data = unwrapData(result);
      const items = Array.isArray(data.items) ? (data.items as MemberNotificationItem[]) : [];
      setNotifications(items);
      setUnreadCount(Number(data.unreadCount || 0));
      dispatchNotificationUpdate();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((first, second) => {
      if (first.isRead !== second.isRead) return first.isRead ? 1 : -1;
      return getTimestamp(second.createdAt) - getTimestamp(first.createdAt);
    });
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "UNREAD") return sortedNotifications.filter((item) => !item.isRead);
    if (filter === "READ") return sortedNotifications.filter((item) => item.isRead);
    return sortedNotifications;
  }, [filter, sortedNotifications]);

  async function handleNotificationClick(notification: MemberNotificationItem) {
    if (!memberId) return;
    if (!notification.isRead) {
      setActionLoading(notification.userNotificationId);
      try {
        await markMemberNotificationRead({ memberId, userNotificationId: notification.userNotificationId });
        setNotifications((current) => current.map((item) =>
          item.userNotificationId === notification.userNotificationId
            ? { ...item, status: "READ", isRead: true, readAt: new Date().toISOString() }
            : item
        ));
        setUnreadCount((current) => Math.max(0, current - 1));
        dispatchNotificationUpdate();
      } catch (readError) {
        setError(readError instanceof Error ? readError.message : "Unable to mark notification as read.");
      } finally {
        setActionLoading("");
      }
    }
    router.push(`/member/notifications/${encodeURIComponent(notification.userNotificationId)}`);
  }

  async function handleMarkAllRead() {
    if (!memberId || unreadCount === 0) return;
    setActionLoading("MARK_ALL");
    setError("");
    try {
      await markAllMemberNotificationsRead({ memberId });
      setNotifications((current) => current.map((item) => ({
        ...item,
        status: "READ",
        isRead: true,
        readAt: item.readAt || new Date().toISOString(),
      })));
      setUnreadCount(0);
      dispatchNotificationUpdate();
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Unable to mark all notifications as read.");
    } finally {
      setActionLoading("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
      <div className="mx-auto w-full max-w-5xl">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-7 text-white sm:px-8 sm:py-9">
            <button type="button" onClick={() => router.push("/member/dashboard")} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black transition hover:bg-white/20">
              <span aria-hidden="true">←</span> Back
            </button>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-300">Member Portal</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Notifications</h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-300 sm:text-base">Payments, rewards, membership upgrades and important RewardHub updates.</p>
              </div>
              <div className="flex items-stretch gap-3">
                <div className="min-w-24 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs font-bold text-slate-300">Unread</p>
                  <p className="mt-1 text-2xl font-black">{unreadCount}</p>
                </div>
                <button type="button" onClick={handleMarkAllRead} disabled={unreadCount === 0 || actionLoading === "MARK_ALL"} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
                  {actionLoading === "MARK_ALL" ? "Updating..." : "Mark all read"}
                </button>
              </div>
            </div>
          </header>

          <div className="border-b border-slate-200 px-4 py-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-2">
              {(["ALL", "UNREAD", "READ"] as FilterType[]).map((value) => (
                <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-xs font-black transition sm:text-sm ${filter === value ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {value === "ALL" ? `All (${notifications.length})` : value === "UNREAD" ? `Unread (${unreadCount})` : `Read (${Math.max(0, notifications.length - unreadCount)})`}
                </button>
              ))}
              <button type="button" onClick={() => void loadNotifications()} disabled={loading} className="ml-auto rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:text-sm">
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
            {loading ? (
              <div className="space-y-4">{[1,2,3].map((item) => <div key={item} className="h-40 animate-pulse rounded-3xl bg-slate-100" />)}</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl shadow-sm">🔔</div>
                <h2 className="mt-5 text-xl font-black text-slate-950">No notifications</h2>
                <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">New RewardHub activity will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => {
                  const kind = getKind(notification);
                  const visual = getVisual(kind);
                  const amountText = getAmountText(notification);
                  const summary = getSummary(notification);
                  const isBusy = actionLoading === notification.userNotificationId;
                  return (
                    <button key={notification.userNotificationId} type="button" onClick={() => void handleNotificationClick(notification)} disabled={isBusy} className={`group relative w-full overflow-hidden rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-wait sm:p-6 ${notification.isRead ? "border-slate-200 bg-white" : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm"}`}>
                      {!notification.isRead ? <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-[80px] bg-emerald-100/80" /> : null}
                      <div className="relative flex gap-4 sm:gap-5">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black ring-1 ${visual.iconClass}`}>{visual.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{visual.label}</span>
                                {!notification.isRead ? <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">New</span> : null}
                              </div>
                              <h2 className="mt-3 text-lg font-black leading-6 text-slate-950 sm:text-xl">{notification.title}</h2>
                            </div>
                            <span className="shrink-0 text-xs font-bold text-slate-400">{formatDateTime(notification.createdAt)}</span>
                          </div>
                          {amountText ? <p className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{amountText}</p> : null}
                          <p className="mt-3 line-clamp-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-600">{summary}</p>
                          <div className="mt-5 flex items-center justify-between gap-3">
                            <span className="text-xs font-black text-slate-500 transition group-hover:text-slate-950">View details →</span>
                            {isBusy ? <span className="text-xs font-bold text-slate-400">Updating...</span> : notification.isRead ? <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Read</span> : <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
