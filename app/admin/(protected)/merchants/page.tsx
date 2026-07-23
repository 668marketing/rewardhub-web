"use client";

import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Store,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminMerchant,
  AdminMerchantListData,
  getAdminMerchants,
} from "@/lib/admin-merchants";

const PAGE_SIZES = [
  10,
  25,
  50,
  100,
  200,
];

export default function AdminMerchantsPage() {
  const [data, setData] =
    useState<AdminMerchantListData | null>(
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

  const [category, setCategory] =
    useState("ALL");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(25);

  const loadMerchants =
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
            await getAdminMerchants({
              search,
              status,
              category,
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
              : "Unable to load merchants."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        search,
        status,
        category,
        dateFrom,
        dateTo,
        page,
        pageSize,
      ]
    );

  useEffect(() => {
    void loadMerchants();
  }, [loadMerchants]);

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

  const merchants =
    data?.merchants || [];

  const categories =
    data?.categories || [];

  const stats = data?.stats;

  const pagination =
    data?.pagination;

  const hasFilters =
    Boolean(
      search ||
        status !== "ALL" ||
        category !== "ALL" ||
        dateFrom ||
        dateTo
    );

  const pageDescription =
    useMemo(() => {
      if (!pagination) {
        return "Loading merchant directory…";
      }

      if (
        pagination.totalItems === 0
      ) {
        return "No merchants match the current filters.";
      }

      return `Showing ${pagination.showingFrom}–${pagination.showingTo} of ${pagination.totalItems} matching merchants`;
    }, [pagination]);

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("ALL");
    setCategory("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  function exportCurrentPage() {
    if (!merchants.length) {
      return;
    }

    const headers = [
      "Merchant ID",
      "Merchant Name",
      "Legal Name",
      "Email",
      "Phone",
      "Category",
      "Status",
      "SSM Number",
      "Marketing Budget %",
      "Monthly Marketing Budget",
      "Marketing Budget Used",
      "Marketing Budget Remaining",
      "Transactions",
      "Completed Transactions",
      "Total Sales",
      "Pending Settlements",
      "Pending Settlement Amount",
      "Registered At",
    ];

    const rows =
      merchants.map((merchant) => [
        merchant.merchantId,
        merchant.merchantName,
        merchant.legalName,
        merchant.email,
        merchant.phone,
        merchant.category,
        merchant.status,
        merchant.ssmNumber,
        merchant.marketingBudgetPercent,
        merchant.monthlyMarketingBudget,
        merchant.marketingBudgetUsed,
        merchant.marketingBudgetRemaining,
        merchant.transactionCount,
        merchant.completedTransactions,
        merchant.totalSales,
        merchant.pendingSettlements,
        merchant.pendingSettlementAmount,
        merchant.joinedAt,
      ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            escapeCsvValue(value)
          )
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob([csv], {
        type:
          "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `rewardhub-merchants-page-${page}.csv`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  if (loading && !data) {
    return (
      <MerchantPageLoading />
    );
  }

  if (error && !data) {
    return (
      <MerchantPageError
        message={error}
        onRetry={() =>
          void loadMerchants()
        }
      />
    );
  }

  return (
    <div className="space-y-7 pb-12">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <Store className="h-4 w-4" />
            Merchant management
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Merchants
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            Search, review and manage
            RewardHub merchants,
            marketing budgets,
            transactions and settlement
            activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              void loadMerchants(true)
            }
            className="flex h-12 items-center gap-2 rounded-2xl border border-white/[0.08] bg-slate-900/60 px-5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh
          </button>

          <button
            type="button"
            onClick={exportCurrentPage}
            disabled={
              merchants.length === 0
            }
            className="flex h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export page
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MerchantStatCard
          icon={Building2}
          label="Total Merchants"
          value={formatNumber(
            stats?.total || 0
          )}
          description={`${formatNumber(
            stats?.active || 0
          )} active · ${formatNumber(
            stats?.newToday || 0
          )} new today`}
        />

        <MerchantStatCard
          icon={Store}
          label="Active"
          value={formatNumber(
            stats?.active || 0
          )}
          description={`${formatNumber(
            stats?.pending || 0
          )} pending · ${formatNumber(
            stats?.suspended || 0
          )} suspended`}
        />

        <MerchantStatCard
          icon={WalletCards}
          label="Total Sales"
          value={formatMoney(
            stats?.totalSales || 0
          )}
          description={`${formatNumber(
            stats?.totalTransactions ||
              0
          )} recorded transactions`}
        />

        <MerchantStatCard
          icon={AlertTriangle}
          label="Pending Settlements"
          value={formatNumber(
            stats?.pendingSettlements ||
              0
          )}
          description={`${formatMoney(
            stats?.pendingSettlementAmount ||
              0
          )} pending amount`}
        />
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.5fr)_190px_220px_170px_170px_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search ID, name, email, phone, SSM or category"
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
            <option value="ACTIVE">
              Active
            </option>
            <option value="PENDING">
              Pending
            </option>
            <option value="SUSPENDED">
              Suspended
            </option>
            <option value="REJECTED">
              Rejected
            </option>
            <option value="INACTIVE">
              Inactive
            </option>
          </select>

          <select
            value={category}
            onChange={(event) => {
              setCategory(
                event.target.value
              );
              setPage(1);
            }}
            className={filterClass}
          >
            <option value="ALL">
              All categories
            </option>

            {categories.map(
              (categoryName) => (
                <option
                  key={categoryName}
                  value={categoryName}
                >
                  {categoryName}
                </option>
              )
            )}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(
                event.target.value
              );
              setPage(1);
            }}
            className={filterClass}
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(
                event.target.value
              );
              setPage(1);
            }}
            className={filterClass}
          />

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="h-12 rounded-2xl border border-white/[0.08] px-4 text-sm font-medium text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/50">
        <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Merchant Directory
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

        {merchants.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1320px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-[0.16em] text-slate-600">
                  <th className="px-5 py-4">
                    Merchant
                  </th>

                  <th className="px-5 py-4">
                    Category
                  </th>

                  <th className="px-5 py-4">
                    Marketing Budget
                  </th>

                  <th className="px-5 py-4">
                    Transactions
                  </th>

                  <th className="px-5 py-4">
                    Total Sales
                  </th>

                  <th className="px-5 py-4">
                    Settlement
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Registered
                  </th>

                  <th className="px-5 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {merchants.map(
                  (merchant) => (
                    <MerchantTableRow
                      key={
                        merchant.merchantId
                      }
                      merchant={
                        merchant
                      }
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
              <Store className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-base font-semibold text-white">
              No merchants found
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              No merchant records match
              the current search and
              filters.
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

function MerchantTableRow({
  merchant,
}: {
  merchant: AdminMerchant;
}) {
  return (
    <tr className="border-b border-white/[0.055] text-sm transition last:border-b-0 hover:bg-white/[0.025]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <MerchantAvatar
            merchant={merchant}
          />

          <div className="min-w-0">
            <p className="max-w-64 truncate font-medium text-white">
              {merchant.merchantName ||
                merchant.merchantId}
            </p>

            <p className="mt-1 max-w-64 truncate text-xs text-slate-600">
              {merchant.merchantId}
              {merchant.email
                ? ` · ${merchant.email}`
                : ""}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-slate-400">
        {merchant.category ||
          "Uncategorized"}
      </td>

      <td className="px-5 py-4">
        <p className="font-medium text-slate-200">
          {formatPercent(
            merchant.marketingBudgetPercent
          )}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {formatMoney(
            merchant.monthlyMarketingBudget
          )}{" "}
          monthly
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="font-medium text-slate-200">
          {formatNumber(
            merchant.transactionCount
          )}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {formatNumber(
            merchant.completedTransactions
          )}{" "}
          completed
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="font-medium text-white">
          {formatMoney(
            merchant.totalSales
          )}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {formatMoney(
            merchant.cashbackIssued
          )}{" "}
          cashback
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="font-medium text-slate-200">
          {formatNumber(
            merchant.pendingSettlements
          )}{" "}
          pending
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {formatMoney(
            merchant.pendingSettlementAmount
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <MerchantStatusBadge
          status={merchant.status}
        />
      </td>

      <td className="px-5 py-4 text-sm text-slate-500">
        {formatDate(
          merchant.joinedAt
        )}
      </td>

      <td className="px-5 py-4 text-right">
        <Link
          href={`/admin/merchants/${encodeURIComponent(
            merchant.merchantId
          )}`}
          className="inline-flex h-10 items-center rounded-xl border border-white/[0.08] px-4 text-sm font-medium text-slate-300 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.06] hover:text-emerald-300"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

function MerchantAvatar({
  merchant,
}: {
  merchant: AdminMerchant;
}) {
  const initials =
    getInitials(
      merchant.merchantName ||
        merchant.merchantId
    );

  if (merchant.logoUrl) {
    return (
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={merchant.logoUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.08] text-sm font-semibold text-emerald-300">
      {initials}
    </div>
  );
}

function MerchantStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    String(status || "")
      .trim()
      .toUpperCase();

  const classes =
    normalized === "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "PENDING"
      ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
      : normalized ===
        "SUSPENDED"
      ? "border-red-400/20 bg-red-400/10 text-red-300"
      : normalized === "REJECTED"
      ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
      : "border-slate-400/15 bg-slate-400/[0.07] text-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized || "INACTIVE"}
    </span>
  );
}

function MerchantStatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-slate-950/40 text-slate-400">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

function MerchantPageLoading() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />

        <p className="mt-4 text-sm text-slate-500">
          Loading merchants…
        </p>
      </div>
    </div>
  );
}

function MerchantPageError({
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
          Unable to load merchants
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

const filterClass =
  "h-12 w-full rounded-2xl border border-white/[0.08] bg-slate-950/50 px-4 text-sm text-slate-300 outline-none focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10";

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY",
    {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(Number(value || 0));
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(Number(value || 0));
}

function formatPercent(
  value: number
) {
  const number =
    Number(value || 0);

  return `${number.toLocaleString(
    "en-MY",
    {
      maximumFractionDigits: 2,
    }
  )}%`;
}

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

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
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function getInitials(
  value: string
) {
  const words =
    String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!words.length) {
    return "M";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}

function escapeCsvValue(
  value: unknown
) {
  const text =
    String(value ?? "");

  return `"${text.replace(
    /"/g,
    '""'
  )}"`;
}