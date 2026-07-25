"use client";

import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FilterX,
  Gift,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getAdminRewardRedemptions,
  type AdminRewardRedemption,
  type AdminRewardRedemptionListData,
} from "@/lib/admin-rewards";

const PAGE_SIZES = [
  10,
  25,
  50,
  100,
  200,
];

export default function AdminRewardRedemptionsPage() {
  const [data, setData] =
    useState<AdminRewardRedemptionListData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [rewardType, setRewardType] =
    useState("ALL");

  const [
    deliveryMethod,
    setDeliveryMethod,
  ] = useState("ALL");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(25);

  const loadRedemptions =
    useCallback(
      async (
        showRefreshLoader = false
      ) => {
        try {
          if (showRefreshLoader) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const result =
            await getAdminRewardRedemptions({
              search,
              status,
              rewardType,
              deliveryMethod,
              dateFrom,
              dateTo,
              page,
              pageSize,
            });

          setData(result);

          if (
            result.pagination.page !==
            page
          ) {
            setPage(
              result.pagination.page
            );
          }
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load reward redemptions."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        search,
        status,
        rewardType,
        deliveryMethod,
        dateFrom,
        dateTo,
        page,
        pageSize,
      ]
    );

  useEffect(() => {
    void loadRedemptions();
  }, [loadRedemptions]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setPage(1);
        setSearch(
          searchInput.trim()
        );
      }, 350);

    return () =>
      window.clearTimeout(timer);
  }, [searchInput]);

  const redemptions =
    data?.redemptions || [];

  const summary =
    data?.summary;

  const pagination =
    data?.pagination;

  const options =
    data?.options;

  const hasFilters =
    Boolean(
      search ||
        status !== "ALL" ||
        rewardType !== "ALL" ||
        deliveryMethod !== "ALL" ||
        dateFrom ||
        dateTo
    );

  const pageDescription =
    useMemo(() => {
      if (!pagination) {
        return "Loading redemption orders…";
      }

      if (
        pagination.totalItems === 0
      ) {
        return "No redemption orders match the current filters.";
      }

      return `Showing ${pagination.showingFrom}–${pagination.showingTo} of ${pagination.totalItems} matching redemptions`;
    }, [pagination]);

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("ALL");
    setRewardType("ALL");
    setDeliveryMethod("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  if (loading && !data) {
    return (
      <RedemptionPageLoading />
    );
  }

  if (error && !data) {
    return (
      <RedemptionPageError
        message={error}
        onRetry={() =>
          void loadRedemptions()
        }
      />
    );
  }

  return (
    <div className="min-w-0 space-y-7 overflow-x-hidden pb-12 pt-6 lg:pt-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <Gift className="h-4 w-4" />
            Rewards management
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Redemption Orders
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            Review and process member
            reward redemptions, shipping
            requests and voucher orders.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/rewards"
            className="inline-flex h-12 items-center rounded-2xl border border-white/[0.08] bg-slate-900/60 px-5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
          >
            Back to Dashboard
          </Link>

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              void loadRedemptions(true)
            }
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/[0.08] bg-slate-900/60 px-5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Clock3}
          title="Pending"
          value={summary?.pending || 0}
          description={`${summary?.processing || 0} processing`}
          accent="amber"
        />

        <SummaryCard
          icon={Truck}
          title="Shipped"
          value={summary?.shipped || 0}
          description={`${summary?.completed || 0} completed`}
          accent="violet"
        />

        <SummaryCard
          icon={PackageCheck}
          title="Total Orders"
          value={summary?.total || 0}
          description={`${summary?.cancelled || 0} cancelled`}
          accent="emerald"
        />

        <SummaryCard
          icon={WalletCards}
          title="Points Used"
          value={summary?.pointsUsed || 0}
          suffix=" pts"
          description="Across current filtered results"
          accent="sky"
        />
      </section>

      <section className="min-w-0 rounded-3xl border border-white/[0.08] bg-slate-900/50 p-4 sm:p-5">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <div className="relative min-w-0 sm:col-span-2 xl:col-span-2 2xl:col-span-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search redemption, member, reward, phone or tracking"
              className="h-12 w-full rounded-2xl border border-white/[0.08] bg-slate-950/50 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target.value
              );
              setPage(1);
            }}
            className={filterClass}
          >
            <option value="ALL">
              All statuses
            </option>

            {(options?.statuses || []).map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {formatLabel(item)}
                </option>
              )
            )}
          </select>

          <select
            value={rewardType}
            onChange={(event) => {
              setRewardType(
                event.target.value
              );
              setPage(1);
            }}
            className={filterClass}
          >
            <option value="ALL">
              All reward types
            </option>

            {(options?.rewardTypes || []).map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {formatLabel(item)}
                </option>
              )
            )}
          </select>

          <select
            value={deliveryMethod}
            onChange={(event) => {
              setDeliveryMethod(
                event.target.value
              );
              setPage(1);
            }}
            className={filterClass}
          >
            <option value="ALL">
              All delivery methods
            </option>

            {(options?.deliveryMethods || []).map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {formatLabel(item)}
                </option>
              )
            )}
          </select>

          <DatePickerField
  label="From date"
  value={dateFrom}
  onChange={(value) => {
    setDateFrom(value);
    setPage(1);
  }}
  max={dateTo || undefined}
/>

          <DatePickerField
  label="To date"
  value={dateTo}
  onChange={(value) => {
    setDateTo(value);
    setPage(1);
  }}
  min={dateFrom || undefined}
/>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-4 text-sm font-medium text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <FilterX className="h-4 w-4" />
            Reset
          </button>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/50">
        <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Redemption Directory
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              {pageDescription}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">
              Rows
            </span>

            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(
                  Number(
                    event.target.value
                  )
                );
                setPage(1);
              }}
              className="h-10 rounded-xl border border-white/[0.08] bg-slate-950/55 px-3 text-sm text-slate-300 outline-none"
            >
              {PAGE_SIZES.map(
                (size) => (
                  <option
                    key={size}
                    value={size}
                  >
                    {size}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {redemptions.length ? (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-[0.16em] text-slate-600">
                  <th className="px-5 py-4">
                    Redemption
                  </th>

                  <th className="px-5 py-4">
                    Member
                  </th>

                  <th className="px-5 py-4">
                    Reward
                  </th>

                  <th className="px-5 py-4">
                    Points
                  </th>

                  <th className="px-5 py-4">
                    Delivery
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Redeemed At
                  </th>

                  <th className="px-5 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {redemptions.map(
                  (item) => (
                    <RedemptionTableRow
                      key={
                        item.redemptionId
                      }
                      item={item}
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
              <Gift className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-base font-semibold text-white">
              No redemptions found
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              No reward redemption records
              match the current filters.
            </p>

            {hasFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        )}

        {pagination &&
        pagination.totalItems > 0 ? (
          <div className="flex flex-col gap-4 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600">
              Page {pagination.page} of{" "}
              {pagination.totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous page"
                disabled={
                  pagination.page <= 1
                }
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex h-10 min-w-28 items-center justify-center rounded-xl bg-slate-950/45 px-4 text-sm text-slate-300">
                {pagination.page} /{" "}
                {pagination.totalPages}
              </div>

              <button
                type="button"
                aria-label="Next page"
                disabled={
                  pagination.page >=
                  pagination.totalPages
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      pagination.totalPages,
                      current + 1
                    )
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function RedemptionTableRow({
  item,
}: {
  item: AdminRewardRedemption;
}) {
  return (
    <tr className="border-b border-white/[0.055] text-sm transition last:border-b-0 hover:bg-white/[0.025]">
      <td className="px-5 py-4">
        <div>
          <p className="font-medium text-white">
            {item.redemptionId}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {item.redemptionSource ||
              "Points"}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="font-medium text-slate-200">
          {item.memberName ||
            item.memberId}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {item.memberId}
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <RewardAvatar item={item} />

          <div className="min-w-0">
            <p className="max-w-64 truncate font-medium text-white">
              {item.rewardTitle ||
                item.rewardId}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              {formatLabel(
                item.rewardType
              )}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="font-medium text-white">
          {formatNumber(
            item.pointsUsed
          )}{" "}
          pts
        </p>

        <p className="mt-1 text-xs text-slate-600">
          Qty {item.quantity}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="font-medium text-slate-200">
          {formatLabel(
            item.deliveryMethod
          )}
        </p>

        <p className="mt-1 max-w-56 truncate text-xs text-slate-600">
          {item.trackingNo ||
            item.phone ||
            item.voucherCode ||
            "—"}
        </p>
      </td>

      <td className="px-5 py-4">
        <RedemptionStatusBadge
          status={item.status}
        />
      </td>

      <td className="px-5 py-4 text-sm text-slate-500">
        {formatDateTime(
          item.redeemedAt
        )}
      </td>

      <td className="px-5 py-4 text-right">
        <Link
          href={`/admin/rewards/redemptions/${encodeURIComponent(
            item.redemptionId
          )}`}
          className="inline-flex h-10 items-center rounded-xl border border-white/[0.08] px-4 text-sm font-medium text-slate-300 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.06] hover:text-emerald-300"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

function RewardAvatar({
  item,
}: {
  item: AdminRewardRedemption;
}) {
  if (item.rewardImageUrl) {
    return (
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.rewardImageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-xl">
      {getRewardIcon(
        item.rewardType,
        item.deliveryMethod
      )}
    </div>
  );
}

function RedemptionStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    String(status || "")
      .trim()
      .toUpperCase();

  const classes =
    normalized === "COMPLETED"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "PENDING"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : normalized === "PROCESSING"
          ? "border-sky-400/20 bg-sky-400/10 text-sky-300"
          : normalized === "SHIPPED"
            ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
            : normalized === "CANCELLED"
              ? "border-red-400/20 bg-red-400/10 text-red-300"
              : "border-slate-400/15 bg-slate-400/[0.07] text-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized || "UNKNOWN"}
    </span>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  suffix = "",
  description,
  accent,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  value: number;
  suffix?: string;
  description: string;
  accent:
    | "amber"
    | "violet"
    | "emerald"
    | "sky";
}) {
  const accentClasses = {
    amber:
      "bg-amber-400/10 text-amber-300",
    violet:
      "bg-violet-400/10 text-violet-300",
    emerald:
      "bg-emerald-400/10 text-emerald-300",
    sky:
      "bg-sky-400/10 text-sky-300",
  };

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentClasses[accent]}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {formatNumber(value)}
        {suffix}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

function getRewardIcon(
  rewardType: string,
  deliveryMethod: string
) {
  const value =
    `${rewardType} ${deliveryMethod}`.toUpperCase();

  if (
    value.includes("VOUCHER")
  ) {
    return "🎫";
  }

  if (
    value.includes("DIGITAL")
  ) {
    return "📱";
  }

  if (
    value.includes("SHIPPING")
  ) {
    return "🎁";
  }

  return "⭐";
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(Number(value || 0));
}

function formatLabel(
  value: string
) {
  if (!value) {
    return "—";
  }

  return String(value)
    .toLowerCase()
    .split("_")
    .map(
      (item) =>
        item.charAt(0).toUpperCase() +
        item.slice(1)
    )
    .join(" ");
}

function formatSelectedDate(
  value: string
) {
  if (!value) {
    return "";
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "—";
  }

  const normalized =
    value.replace(
      /^(\d{4})-(\d{2})-(\d{2})\s/,
      "$1/$2/$3 "
    );

  const date =
    new Date(normalized);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
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

const filterClass =
  "h-12 min-w-0 w-full rounded-2xl border border-white/[0.08] bg-slate-950/50 px-4 text-sm text-slate-300 outline-none focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10";

function DatePickerField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}) {
  const wrapperRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const selectedDate =
    parseDateOnly(value);

  const [open, setOpen] =
    useState(false);

  const [visibleMonth, setVisibleMonth] =
    useState<Date>(() => {
      const initial =
        selectedDate ||
        new Date();

      return new Date(
        initial.getFullYear(),
        initial.getMonth(),
        1
      );
    });

  useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        )
      );
    }
  }, [value]);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const days =
    buildCalendarDays(
      visibleMonth
    );

  const minDate =
    parseDateOnly(min || "");

  const maxDate =
    parseDateOnly(max || "");

  function selectDate(date: Date) {
    if (
      (minDate &&
        date.getTime() <
          minDate.getTime()) ||
      (maxDate &&
        date.getTime() >
          maxDate.getTime())
    ) {
      return;
    }

    onChange(
      formatDateOnly(date)
    );

    setOpen(false);
  }

  function moveMonth(offset: number) {
    setVisibleMonth(
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() +
          offset,
        1
      )
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative min-w-0"
    >
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) => !current
          )
        }
        className="flex h-12 w-full min-w-0 items-center rounded-2xl border border-white/[0.08] bg-slate-950/50 px-4 text-left transition hover:border-white/[0.14] focus:border-emerald-400/35 focus:outline-none focus:ring-4 focus:ring-emerald-400/10"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-600" />

        <span
          className={[
            "ml-3 min-w-0 flex-1 truncate text-sm",
            value
              ? "text-slate-300"
              : "text-slate-600",
          ].join(" ")}
        >
          {value
            ? formatSelectedDate(
                value
              )
            : label}
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-[300px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/[0.1] bg-slate-900 p-4 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                moveMonth(-1)
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <p className="text-sm font-semibold text-white">
              {new Intl.DateTimeFormat(
                "en-MY",
                {
                  month: "long",
                  year: "numeric",
                }
              ).format(
                visibleMonth
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                moveMonth(1)
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {[
              "Su",
              "Mo",
              "Tu",
              "We",
              "Th",
              "Fr",
              "Sa",
            ].map((day) => (
              <div
                key={day}
                className="py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
              >
                {day}
              </div>
            ))}

            {days.map(
              ({
                date,
                currentMonth,
              }) => {
                const disabled =
                  Boolean(
                    (minDate &&
                      date.getTime() <
                        minDate.getTime()) ||
                      (maxDate &&
                        date.getTime() >
                          maxDate.getTime())
                  );

                const selected =
                  selectedDate
                    ? isSameDate(
                        date,
                        selectedDate
                      )
                    : false;

                const today =
                  isSameDate(
                    date,
                    new Date()
                  );

                return (
                  <button
                    key={formatDateOnly(
                      date
                    )}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      selectDate(date)
                    }
                    className={[
                      "flex h-9 items-center justify-center rounded-xl text-xs font-medium transition",
                      selected
                        ? "bg-emerald-400 text-slate-950"
                        : today
                          ? "border border-emerald-400/35 text-emerald-300"
                          : currentMonth
                            ? "text-slate-300 hover:bg-white/[0.06]"
                            : "text-slate-700 hover:bg-white/[0.04]",
                      disabled
                        ? "cursor-not-allowed opacity-25"
                        : "",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </button>
                );
              }
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs font-medium text-slate-500 transition hover:text-white"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() =>
                selectDate(
                  new Date()
                )
              }
              className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function parseDateOnly(
  value: string
) {
  if (!value) {
    return null;
  }

  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return null;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function formatDateOnly(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSameDate(
  first: Date,
  second: Date
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function buildCalendarDays(
  month: Date
) {
  const year =
    month.getFullYear();

  const monthIndex =
    month.getMonth();

  const firstDay =
    new Date(
      year,
      monthIndex,
      1
    );

  const start =
    new Date(
      year,
      monthIndex,
      1 - firstDay.getDay()
    );

  return Array.from(
    { length: 42 },
    (_, index) => {
      const date =
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() +
            index
        );

      return {
        date,
        currentMonth:
          date.getMonth() ===
            monthIndex &&
          date.getFullYear() ===
            year,
      };
    }
  );
}

function RedemptionPageLoading() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />

        <p className="mt-4 text-sm text-slate-500">
          Loading redemption orders…
        </p>
      </div>
    </div>
  );
}

function RedemptionPageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-400/10 p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-lg font-semibold text-white">
          Unable to load redemptions
        </h2>

        <p className="mt-3 break-words text-sm leading-6 text-red-200/80">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-red-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-red-200"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  );
}