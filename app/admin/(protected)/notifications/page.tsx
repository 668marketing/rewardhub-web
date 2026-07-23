"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  CheckCircle2,
  History,
  Megaphone,
  RefreshCw,
  Send,
  Smartphone,
  Store,
  Users,
  XCircle,
} from "lucide-react";

import {
  formatNotificationDate,
  getAdminNotificationDashboard,
  getAdminNotificationHistory,
  getNotificationTargetLabel,
  sendAdminNotification,
} from "@/lib/admin-notifications";

import type {
  AdminNotificationDashboard,
  AdminNotificationHistoryItem,
  NotificationTargetType,
} from "@/lib/admin-notifications";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

const TARGET_OPTIONS: Array<{
  value: NotificationTargetType;
  label: string;
}> = [
  {
    value: "ALL_MEMBERS",
    label: "All Members",
  },
  {
    value: "ALL_MERCHANTS",
    label: "All Merchants",
  },
  {
    value: "SPECIFIC_MEMBER",
    label: "Specific Member",
  },
  {
    value: "SPECIFIC_MERCHANT",
    label: "Specific Merchant",
  },
];

export default function AdminNotificationsPage() {
  const [
    dashboard,
    setDashboard,
  ] =
    useState<AdminNotificationDashboard | null>(
      null
    );

  const [
    historyItems,
    setHistoryItems,
  ] =
    useState<
      AdminNotificationHistoryItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    feedback,
    setFeedback,
  ] =
    useState<Feedback>(
      null
    );

  const [
    targetType,
    setTargetType,
  ] =
    useState<NotificationTargetType>(
      "ALL_MEMBERS"
    );

  const [
    targetId,
    setTargetId,
  ] =
    useState("");

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    url,
    setUrl,
  ] =
    useState("");

  const [
    image,
    setImage,
  ] =
    useState("");

  const requiresTargetId =
    useMemo(
      () =>
        targetType ===
          "SPECIFIC_MEMBER" ||
        targetType ===
          "SPECIFIC_MERCHANT",
      [targetType]
    );

  const loadNotificationData =
    useCallback(
      async (
        showRefreshState =
          false
      ) => {
        if (
          showRefreshState
        ) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setFeedback(null);

        try {
          const [
            dashboardData,
            historyData,
          ] =
            await Promise.all([
              getAdminNotificationDashboard(),
              getAdminNotificationHistory(),
            ]);

          setDashboard(
            dashboardData
          );

          setHistoryItems(
            historyData.items ||
              []
          );
        } catch (error) {
          setFeedback({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Unable to load notification data.",
          });
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadNotificationData();
  }, [loadNotificationData]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFeedback(null);

    if (
      requiresTargetId &&
      !targetId.trim()
    ) {
      setFeedback({
        type: "error",
        message:
          targetType ===
          "SPECIFIC_MEMBER"
            ? "Please enter a Member ID."
            : "Please enter a Merchant ID.",
      });

      return;
    }

    if (!title.trim()) {
      setFeedback({
        type: "error",
        message:
          "Please enter a notification title.",
      });

      return;
    }

    if (!message.trim()) {
      setFeedback({
        type: "error",
        message:
          "Please enter a notification message.",
      });

      return;
    }

    setSending(true);

    try {
      const result =
        await sendAdminNotification({
          targetType,

          targetId:
            requiresTargetId
              ? targetId.trim()
              : "",

          title:
            title.trim(),

          message:
            message.trim(),

          url:
            url.trim(),

          image:
            image.trim(),
        });

      setFeedback({
        type: "success",
        message:
          `Notification sent to ${result.sentCount} device(s). ${result.failedCount} failed.`,
      });

      setTitle("");
      setMessage("");
      setUrl("");
      setImage("");

      await loadNotificationData(
        true
      );
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to send notification.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
            <Bell className="h-4 w-4" />
            Communications
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Notification Center
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Send RewardHub push notifications to members and merchants, then review delivery results.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadNotificationData(
              true
            )
          }
          disabled={refreshing}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#071126] px-4 text-sm font-bold text-slate-300 transition hover:border-slate-700 hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            className={[
              "h-4 w-4",
              refreshing
                ? "animate-spin"
                : "",
            ].join(" ")}
          />
          Refresh
        </button>
      </section>

      {feedback ? (
        <div
          className={[
            "rounded-2xl border px-4 py-3 text-sm font-semibold",
            feedback.type ===
            "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-red-400/20 bg-red-400/10 text-red-300",
          ].join(" ")}
        >
          {feedback.message}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Sent Today"
          value={
            dashboard?.todaySent ||
            0
          }
          icon={Send}
          loading={loading}
        />

        <StatCard
          title="Delivered Today"
          value={
            dashboard?.todayDelivered ||
            0
          }
          icon={CheckCircle2}
          loading={loading}
        />

        <StatCard
          title="Failed Today"
          value={
            dashboard?.todayFailed ||
            0
          }
          icon={XCircle}
          loading={loading}
        />

        <StatCard
          title="Active Devices"
          value={
            dashboard?.activeDevices ||
            0
          }
          icon={Smartphone}
          loading={loading}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <SmallStatCard
          title="Member Devices"
          value={
            dashboard?.memberDevices ||
            0
          }
          icon={Users}
        />

        <SmallStatCard
          title="Merchant Devices"
          value={
            dashboard?.merchantDevices ||
            0
          }
          icon={Store}
        />

        <SmallStatCard
          title="Admin Devices"
          value={
            dashboard?.adminDevices ||
            0
          }
          icon={Bell}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <form
          onSubmit={
            handleSubmit
          }
          className="rounded-[1.75rem] border border-slate-800 bg-[#071126] p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Megaphone className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Send Notification
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Send a push notification to active RewardHub devices.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Field label="Target">
              <select
                value={
                  targetType
                }
                onChange={(
                  event
                ) => {
                  setTargetType(
                    event.target
                      .value as NotificationTargetType
                  );

                  setTargetId("");
                }}
                className="h-12 w-full rounded-2xl border border-slate-800 bg-[#050d1e] px-4 text-sm font-semibold text-white outline-none transition focus:border-emerald-400"
              >
                {TARGET_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>
            </Field>

            {requiresTargetId ? (
              <Field
                label={
                  targetType ===
                  "SPECIFIC_MEMBER"
                    ? "Member ID"
                    : "Merchant ID"
                }
              >
                <input
                  value={
                    targetId
                  }
                  onChange={(
                    event
                  ) =>
                    setTargetId(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    targetType ===
                    "SPECIFIC_MEMBER"
                      ? "RHM00000001"
                      : "RHCM00000011"
                  }
                  className="h-12 w-full rounded-2xl border border-slate-800 bg-[#050d1e] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </Field>
            ) : null}

            <Field label="Title">
              <input
                value={title}
                onChange={(
                  event
                ) =>
                  setTitle(
                    event.target
                      .value
                  )
                }
                maxLength={100}
                placeholder="Settlement Approved"
                className="h-12 w-full rounded-2xl border border-slate-800 bg-[#050d1e] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </Field>

            <Field label="Message">
              <textarea
                value={
                  message
                }
                onChange={(
                  event
                ) =>
                  setMessage(
                    event.target
                      .value
                  )
                }
                maxLength={500}
                rows={5}
                placeholder="Your settlement has been approved."
                className="w-full resize-none rounded-2xl border border-slate-800 bg-[#050d1e] px-4 py-3 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />

              <p className="mt-2 text-right text-xs text-slate-600">
                {message.length}/500
              </p>
            </Field>

            <Field label="Target URL">
              <input
                value={url}
                onChange={(
                  event
                ) =>
                  setUrl(
                    event.target
                      .value
                  )
                }
                placeholder="/merchant/settlement"
                className="h-12 w-full rounded-2xl border border-slate-800 bg-[#050d1e] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </Field>

            <Field label="Image URL (Optional)">
              <input
                value={image}
                onChange={(
                  event
                ) =>
                  setImage(
                    event.target
                      .value
                  )
                }
                placeholder="https://..."
                className="h-12 w-full rounded-2xl border border-slate-800 bg-[#050d1e] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
          >
            <Send className="h-4 w-4" />

            {sending
              ? "Sending..."
              : "Send Notification"}
          </button>
        </form>

        <section className="rounded-[1.75rem] border border-slate-800 bg-[#071126] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
              <History className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Recent History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest notification delivery records.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <>
                <HistorySkeleton />
                <HistorySkeleton />
                <HistorySkeleton />
              </>
            ) : null}

            {!loading &&
            historyItems.length ===
              0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-[#050d1e] px-5 py-12 text-center">
                <Bell className="mx-auto h-9 w-9 text-slate-700" />

                <p className="mt-4 font-bold text-white">
                  No notification history yet
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Your sent notifications will appear here.
                </p>
              </div>
            ) : null}

            {historyItems
              .slice(0, 15)
              .map((item) => (
                <article
                  key={
                    item.notificationId
                  }
                  className="rounded-2xl border border-slate-800 bg-[#050d1e] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-white">
                        {item.title ||
                          "Untitled Notification"}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {item.message ||
                          "—"}
                      </p>
                    </div>

                    <StatusBadge
                      status={
                        item.status
                      }
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-500">
                    <span>
                      {getNotificationTargetLabel(
                        item.targetType,
                        item.targetId
                      )}
                    </span>

                    <span>
                      Sent{" "}
                      {item.sentCount}
                    </span>

                    <span>
                      Failed{" "}
                      {item.failedCount}
                    </span>

                    <span>
                      {formatNotificationDate(
                        item.createdAt
                      )}
                    </span>
                  </div>
                </article>
              ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number;
  icon:
    React.ComponentType<{
      className?: string;
    }>;
  loading: boolean;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-[#071126] p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-white">
        {loading
          ? "—"
          : value.toLocaleString()}
      </p>
    </div>
  );
}

function SmallStatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon:
    React.ComponentType<{
      className?: string;
    }>;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[1.5rem] border border-slate-800 bg-[#071126] p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
          {title}
        </p>

        <p className="mt-1 text-xl font-black text-white">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      {children}
    </label>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    String(status || "")
      .trim()
      .toUpperCase();

  const classes =
    normalized ===
    "COMPLETED"
      ? "bg-emerald-400/10 text-emerald-300"
      : normalized ===
          "PARTIAL"
        ? "bg-amber-400/10 text-amber-300"
        : normalized ===
            "NO_TARGETS"
          ? "bg-slate-400/10 text-slate-400"
          : "bg-red-400/10 text-red-300";

  return (
    <span
      className={[
        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
        classes,
      ].join(" ")}
    >
      {normalized ||
        "UNKNOWN"}
    </span>
  );
}

function HistorySkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-800 bg-[#050d1e] p-4">
      <div className="h-4 w-1/2 rounded bg-slate-800" />
      <div className="mt-3 h-3 w-full rounded bg-slate-900" />
      <div className="mt-2 h-3 w-2/3 rounded bg-slate-900" />
    </div>
  );
}