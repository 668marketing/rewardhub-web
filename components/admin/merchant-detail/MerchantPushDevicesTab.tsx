"use client";

import {
  useMemo,
  useState,
} from "react";
import {
  Bell,
  CheckCircle2,
  Laptop,
  Power,
  Search,
  Smartphone,
  Trash2,
  WifiOff,
} from "lucide-react";

import {
  removeAdminMerchantPushDevice,
  updateAdminMerchantPushDeviceStatus,
} from "@/lib/admin-merchant-detail";

import type {
  AdminMerchantPushDevice,
  AdminMerchantPushDeviceStatus,
} from "@/lib/admin-merchant-detail";

type MerchantPushDevicesTabProps = {
  merchantId: string;

  pushSubscriptions: {
    total: number;
    active: number;
    items:
      AdminMerchantPushDevice[];
  };

  onUpdated?:
    () => Promise<void> | void;
};

type Feedback = {
  type:
    | "success"
    | "error";
  message: string;
} | null;

export default function MerchantPushDevicesTab({
  merchantId,
  pushSubscriptions,
  onUpdated,
}: MerchantPushDevicesTabProps) {
  const items =
    Array.isArray(
      pushSubscriptions?.items
    )
      ? pushSubscriptions.items
      : [];

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("ALL");

  const [
    busyId,
    setBusyId,
  ] =
    useState("");

  const [
    feedback,
    setFeedback,
  ] =
    useState<Feedback>(
      null
    );

  const summary =
    useMemo(() => {
      return {
        total:
          items.length,

        active:
          items.filter(
            (item) =>
              normalizeStatus(
                item.status
              ) ===
              "ACTIVE"
          ).length,

        inactive:
          items.filter(
            (item) =>
              normalizeStatus(
                item.status
              ) ===
              "INACTIVE"
          ).length,

        removed:
          items.filter(
            (item) =>
              normalizeStatus(
                item.status
              ) ===
              "REMOVED"
          ).length,
      };
    }, [items]);

  const filtered =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return items.filter(
        (item) => {
          const status =
            normalizeStatus(
              item.status
            );

          if (
            statusFilter !==
              "ALL" &&
            status !==
              statusFilter
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          return [
            item.subscriptionId,
            item.browser,
            item.platform,
            item.deviceName,
            item.userAgent,
            item.endpoint,
            item.status,
          ]
            .join(" ")
            .toLowerCase()
            .includes(
              keyword
            );
        }
      );
    }, [
      items,
      search,
      statusFilter,
    ]);

  async function runAction(
    subscriptionId: string,
    action:
      () => Promise<void>,
    successMessage: string
  ) {
    setBusyId(
      subscriptionId
    );

    setFeedback(null);

    try {
      await action();

      setFeedback({
        type: "success",
        message:
          successMessage,
      });

      await onUpdated?.();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update push device.",
      });
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard
          title="Total Devices"
          value={String(
            summary.total
          )}
          icon={Bell}
        />

        <SummaryCard
          title="Active"
          value={String(
            summary.active
          )}
          icon={
            CheckCircle2
          }
        />

        <SummaryCard
          title="Inactive"
          value={String(
            summary.inactive
          )}
          icon={WifiOff}
        />

        <SummaryCard
          title="Removed"
          value={String(
            summary.removed
          )}
          icon={Trash2}
        />
      </div>

      <div className="rounded-[1.5rem] border border-slate-800 bg-[#071126] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_200px]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search browser, platform or device"
              className="h-12 w-full rounded-2xl border border-slate-800 bg-[#050d1e] pl-11 pr-4 text-sm font-semibold text-white outline-none focus:border-emerald-400"
            />
          </label>

          <select
            value={
              statusFilter
            }
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-12 rounded-2xl border border-slate-800 bg-[#050d1e] px-4 text-sm font-semibold text-slate-300 outline-none"
          >
            <option value="ALL">
              All Statuses
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>

            <option value="REMOVED">
              Removed
            </option>
          </select>
        </div>
      </div>

      {feedback ? (
        <div
          className={[
            "rounded-2xl border p-4 text-sm",
            feedback.type ===
            "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-red-400/20 bg-red-400/10 text-red-300",
          ].join(" ")}
        >
          {feedback.message}
        </div>
      ) : null}

      {filtered.length ===
      0 ? (
        <div className="rounded-[1.5rem] border border-slate-800 bg-[#071126] px-6 py-16 text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-700" />

          <h3 className="mt-4 font-bold text-white">
            No push devices found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            This merchant has not registered a push notification device yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map(
            (item) => (
              <DeviceCard
                key={
                  item.subscriptionId
                }
                device={
                  item
                }
                isBusy={
                  busyId ===
                  item.subscriptionId
                }
                onToggleStatus={() => {
                  const currentStatus =
                    normalizeStatus(
                      item.status
                    );

                  const nextStatus =
                    currentStatus ===
                      "ACTIVE"
                      ? "INACTIVE"
                      : "ACTIVE";

                  return runAction(
                    item.subscriptionId,
                    () =>
                      updateAdminMerchantPushDeviceStatus(
                        merchantId,
                        item.subscriptionId,
                        nextStatus
                      ),
                    nextStatus ===
                      "ACTIVE"
                      ? "Push device activated."
                      : "Push device disabled."
                  );
                }}
                onRemove={() => {
                  const reason =
                    window.prompt(
                      "Reason for removing this push device:"
                    );

                  if (
                    !reason ||
                    reason.trim()
                      .length < 3
                  ) {
                    return Promise.resolve();
                  }

                  return runAction(
                    item.subscriptionId,
                    () =>
                      removeAdminMerchantPushDevice(
                        merchantId,
                        item.subscriptionId,
                        reason.trim()
                      ),
                    "Push device removed."
                  );
                }}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

function DeviceCard({
  device,
  isBusy,
  onToggleStatus,
  onRemove,
}: {
  device:
    AdminMerchantPushDevice;
  isBusy: boolean;
  onToggleStatus:
    () => Promise<void>;
  onRemove:
    () => Promise<void>;
}) {
  const status =
    normalizeStatus(
      device.status
    );

  const DeviceIcon =
    /iphone|ipad|android|mobile/i.test(
      [
        device.deviceName,
        device.platform,
        device.userAgent,
      ].join(" ")
    )
      ? Smartphone
      : Laptop;

  return (
    <article className="rounded-[1.5rem] border border-slate-800 bg-[#071126] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <DeviceIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-white">
              {device.deviceName ||
                "Unknown Device"}
            </h3>

            <StatusBadge
              status={status}
            />
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {device.browser ||
              "Unknown Browser"}{" "}
            ·{" "}
            {device.platform ||
              "Unknown Platform"}
          </p>

          <p className="mt-3 break-all text-[11px] leading-5 text-slate-600">
            {device.subscriptionId}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <DetailBox
          label="Created"
          value={formatDateTime(
            device.createdAt
          )}
        />

        <DetailBox
          label="Updated"
          value={formatDateTime(
            device.updatedAt
          )}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
        {status !==
        "REMOVED" ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              void onToggleStatus()
            }
            className={[
              "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold disabled:opacity-50",
              status ===
              "ACTIVE"
                ? "border-amber-400/30 text-amber-300"
                : "border-emerald-400/30 text-emerald-300",
            ].join(" ")}
          >
            <Power className="h-4 w-4" />

            {status ===
            "ACTIVE"
              ? "Disable"
              : "Activate"}
          </button>
        ) : null}

        {status !==
        "REMOVED" ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              void onRemove()
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-400/30 px-4 text-xs font-bold text-red-300 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        ) : null}

        {isBusy ? (
          <span className="inline-flex items-center text-xs text-slate-500">
            Updating…
          </span>
        ) : null}
      </div>
    </article>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon:
    React.ComponentType<{
      className?: string;
    }>;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-[#071126] p-5">
      <Icon className="h-5 w-5 text-emerald-300" />

      <p className="mt-4 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#050d1e] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-300">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status:
    AdminMerchantPushDeviceStatus;
}) {
  const classes =
    status === "ACTIVE"
      ? "bg-emerald-400/10 text-emerald-300"
      : status === "INACTIVE"
        ? "bg-amber-400/10 text-amber-300"
        : "bg-red-400/10 text-red-300";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${classes}`}
    >
      {status}
    </span>
  );
}

function normalizeStatus(
  value: unknown
): AdminMerchantPushDeviceStatus {
  const status =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    status === "ACTIVE" ||
    status === "ENABLED"
  ) {
    return "ACTIVE";
  }

  if (
    status === "REMOVED" ||
    status === "DELETED"
  ) {
    return "REMOVED";
  }

  return "INACTIVE";
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone:
        "Asia/Kuala_Lumpur",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}