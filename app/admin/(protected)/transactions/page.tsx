"use client";

import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Eye,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  WalletCards,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdminTransaction,
  AdminTransactionDetail,
  AdminTransactionListData,
  getAdminTransactionDetail,
  getAdminTransactions,
} from "@/lib/admin-transactions";

type Filters = {
  search: string;
  status: string;
  paymentMethod: string;
  merchantId: string;
  memberId: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
};

const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "ALL",
  paymentMethod: "ALL",
  merchantId: "",
  memberId: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: 25,
};

const PAYMENT_METHOD_OPTIONS = [
  {
    value: "CASH",
    label: "Cash",
  },
  {
    value: "DUITNOW",
    label: "DuitNow",
  },
  {
    value: "TNG_EWALLET",
    label: "TNG eWallet",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
  },
  {
    value: "CARD",
    label: "Credit/Debit Card",
  },
] as const;

export default function AdminTransactionsPage() {
  const [filters, setFilters] =
    useState<Filters>(DEFAULT_FILTERS);

  const [data, setData] =
    useState<AdminTransactionListData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedTransactionId, setSelectedTransactionId] =
    useState("");

  const [detail, setDetail] =
    useState<AdminTransactionDetail | null>(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const loadTransactions = useCallback(
    async (manual = false) => {
      try {
        setError("");

        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const result =
          await getAdminTransactions({
            search: filters.search,
            status: filters.status,
            paymentMethod:
              filters.paymentMethod,
            merchantId:
              filters.merchantId,
            memberId:
              filters.memberId,
            dateFrom:
              filters.dateFrom,
            dateTo:
              filters.dateTo,
            page:
              filters.page,
            pageSize:
              filters.pageSize,
          });

        setData(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load transactions."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        loadTransactions();
      },
      filters.search ? 350 : 0
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadTransactions, filters.search]);

  useEffect(() => {
    if (!selectedTransactionId) {
      setDetail(null);
      return;
    }

    let active = true;

    async function loadDetail() {
      try {
        setDetailLoading(true);

        const result =
          await getAdminTransactionDetail(
            selectedTransactionId
          );

        if (active) {
          setDetail(result);
        }
      } catch (detailError) {
        if (active) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : "Unable to load transaction details."
          );
          setSelectedTransactionId("");
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [selectedTransactionId]);

  const hasActiveFilters =
    useMemo(
      () =>
        Boolean(
          filters.search ||
            filters.status !== "ALL" ||
            filters.paymentMethod !== "ALL" ||
            filters.merchantId ||
            filters.memberId ||
            filters.dateFrom ||
            filters.dateTo
        ),
      [filters]
    );

  const transactions =
    data?.transactions ?? [];

  const pagination =
    data?.pagination ?? {
      page: 1,
      pageSize: filters.pageSize,
      totalItems: 0,
      totalPages: 1,
      showingFrom: 0,
      showingTo: 0,
      hasPrevious: false,
      hasNext: false,
    };

  function updateFilter<K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page:
        key === "page"
          ? Number(value)
          : 1,
    }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function exportCurrentPage() {
    if (!transactions.length) {
      return;
    }

    const rows = [
      [
        "Transaction ID",
        "Member ID",
        "Member Name",
        "Merchant ID",
        "Merchant Name",
        "Amount",
        "Cashback",
        "Reward Credits Used",
        "Pay Amount",
        "Points Earned",
        "Payment Method",
        "Status",
        "Created At",
        "Receipt URL",
      ],
      ...transactions.map(
        (transaction) => [
          transaction.transactionId,
          transaction.memberId,
          transaction.memberName,
          transaction.merchantId,
          transaction.merchantName,
          transaction.amount,
          transaction.cashback,
          transaction.rewardCreditsUsed,
          transaction.payAmount,
          transaction.pointsEarned,
          transaction.paymentMethod,
          transaction.status,
          transaction.createdAt,
          transaction.receiptUrl,
        ]
      ),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(
                value ?? ""
              ).replace(
                /"/g,
                '""'
              )}"`
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

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      `rewardhub-transactions-page-${pagination.page}.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-7 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <Banknote className="h-4 w-4" />
              Finance operations
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Transactions
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Review completed RewardHub merchant transactions,
              member benefits, payment values and uploaded receipts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                loadTransactions(true)
              }
              disabled={refreshing}
              className="flex h-11 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
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
              disabled={!transactions.length}
              className="flex h-11 items-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Export page
            </button>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Transactions"
            value={formatNumber(
              data?.summary.total || 0
            )}
            note={`${formatNumber(
              data?.summary.completed || 0
            )} completed`}
            icon={CheckCircle2}
          />

          <SummaryCard
            label="Gross Sales"
            value={formatCurrency(
              data?.summary.totalSales || 0
            )}
            note="Original transaction amount"
            icon={CircleDollarSign}
          />

          <SummaryCard
            label="Member Benefits"
            value={formatCurrency(
              (data?.summary.totalCashback || 0) +
                (data?.summary.totalRewardCreditsUsed || 0)
            )}
            note={`${formatCurrency(
              data?.summary.totalCashback || 0
            )} cashback`}
            icon={WalletCards}
          />

          <SummaryCard
            label="Net Paid"
            value={formatCurrency(
              data?.summary.totalPayAmount || 0
            )}
            note={`${formatNumber(
              data?.summary.totalPointsIssued || 0
            )} points issued`}
            icon={Banknote}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-slate-900/45 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                value={filters.search}
                onChange={(event) =>
                  updateFilter(
                    "search",
                    event.target.value
                  )
                }
                placeholder="Search transaction, member or merchant"
                className={inputClass + " pl-11"}
              />
            </div>

            <select
              value={filters.status}
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="ALL">
                All statuses
              </option>
              <option value="COMPLETED">
                Completed
              </option>
              <option value="PENDING">
                Pending
              </option>
              <option value="CANCELLED">
                Cancelled
              </option>
              <option value="FAILED">
                Failed
              </option>
            </select>

            <select
              value={
                filters.paymentMethod
              }
              onChange={(event) =>
                updateFilter(
                  "paymentMethod",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="ALL">
                All payment methods
              </option>

              {PAYMENT_METHOD_OPTIONS.map(
                (method) => (
                  <option
                    key={method.value}
                    value={method.value}
                  >
                    {method.label}
                  </option>
                )
              )}
            </select>

            <input
              value={filters.memberId}
              onChange={(event) =>
                updateFilter(
                  "memberId",
                  event.target.value
                )
              }
              placeholder="Member ID"
              className={inputClass}
            />

            <input
              value={filters.merchantId}
              onChange={(event) =>
                updateFilter(
                  "merchantId",
                  event.target.value
                )
              }
              placeholder="Merchant ID"
              className={inputClass}
            />

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="h-12 rounded-xl border border-white/[0.08] text-sm text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:max-w-2xl">
            <label className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) =>
                  updateFilter(
                    "dateFrom",
                    event.target.value
                  )
                }
                className={inputClass + " pl-11"}
              />
            </label>

            <label className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) =>
                  updateFilter(
                    "dateTo",
                    event.target.value
                  )
                }
                className={inputClass + " pl-11"}
              />
            </label>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/35">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold">
                Transaction Directory
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                {data
                  ? `Showing ${pagination.showingFrom}–${pagination.showingTo} of ${pagination.totalItems}`
                  : "Loading transaction records"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600">
                Rows
              </span>

              <select
                value={filters.pageSize}
                onChange={(event) =>
                  updateFilter(
                    "pageSize",
                    Number(
                      event.target.value
                    )
                  )
                }
                className="h-10 rounded-xl border border-white/[0.08] bg-slate-950/70 px-3 text-sm text-slate-300 outline-none"
              >
                {[10, 25, 50, 100].map(
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

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
            </div>
          ) : !transactions.length ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <Banknote className="h-8 w-8 text-slate-700" />
              <h3 className="mt-4 font-medium text-slate-300">
                No transactions found
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Try changing the current filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[1250px] w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.16em] text-slate-700">
                      <th className="px-6 py-4">
                        Transaction
                      </th>
                      <th className="px-4 py-4">
                        Member
                      </th>
                      <th className="px-4 py-4">
                        Merchant
                      </th>
                      <th className="px-4 py-4">
                        Amount
                      </th>
                      <th className="px-4 py-4">
                        Benefits
                      </th>
                      <th className="px-4 py-4">
                        Net Paid
                      </th>
                      <th className="px-4 py-4">
                        Payment
                      </th>
                      <th className="px-4 py-4">
                        Status
                      </th>
                      <th className="px-4 py-4">
                        Created
                      </th>
                      <th className="px-6 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.055]">
                    {transactions.map(
                      (
                        transaction,
                        index
                      ) => (
                        <TransactionRow
                          key={`${transaction.transactionId}-${transaction.memberId}-${transaction.merchantId}-${transaction.createdAt}-${index}`}
                          transaction={
                            transaction
                          }
                          onView={() =>
                            setSelectedTransactionId(
                              transaction.transactionId
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs text-slate-600">
                  Page{" "}
                  {pagination.page} of{" "}
                  {pagination.totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      !pagination.hasPrevious
                    }
                    onClick={() =>
                      updateFilter(
                        "page",
                        Math.max(
                          1,
                          filters.page - 1
                        )
                      )
                    }
                    className={pageButtonClass}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      !pagination.hasNext
                    }
                    onClick={() =>
                      updateFilter(
                        "page",
                        filters.page + 1
                      )
                    }
                    className={pageButtonClass}
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {selectedTransactionId ? (
        <TransactionDetailDrawer
          detail={detail}
          loading={detailLoading}
          onClose={() => {
            setSelectedTransactionId("");
            setDetail(null);
          }}
        />
      ) : null}
    </div>
  );
}

function TransactionRow({
  transaction,
  onView,
}: {
  transaction: AdminTransaction;
  onView: () => void;
}) {
  return (
    <tr className="text-sm transition hover:bg-white/[0.018]">
      <td className="px-6 py-4">
        <p className="font-medium text-white">
          {transaction.transactionId}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {transaction.pointsEarned} points
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="text-slate-300">
          {transaction.memberName ||
            transaction.memberId}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {transaction.memberId}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="text-slate-300">
          {transaction.merchantName ||
            transaction.merchantId}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {transaction.merchantId}
        </p>
      </td>

      <td className="px-4 py-4 font-medium text-white">
        {formatCurrency(
          transaction.amount
        )}
      </td>

      <td className="px-4 py-4">
        <p className="text-emerald-300">
          {formatCurrency(
            transaction.cashback
          )}{" "}
          cashback
        </p>
        <p className="mt-1 text-xs text-violet-300">
          {formatCurrency(
            transaction.rewardCreditsUsed
          )}{" "}
          credits
        </p>
      </td>

      <td className="px-4 py-4 font-medium text-white">
        {formatCurrency(
          transaction.payAmount
        )}
      </td>

      <td className="px-4 py-4">
        <p className="text-slate-300">
          {formatPaymentMethod(
            transaction.paymentMethod
          )}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {transaction.receiptUrl
            ? "Receipt uploaded"
            : "No receipt"}
        </p>
      </td>

      <td className="px-4 py-4">
        <StatusBadge
          status={transaction.status}
        />
      </td>

      <td className="px-4 py-4 text-slate-400">
        {formatDateTime(
          transaction.createdAt
        )}
      </td>

      <td className="px-6 py-4 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
      </td>
    </tr>
  );
}

function TransactionDetailDrawer({
  detail,
  loading,
  onClose,
}: {
  detail: AdminTransactionDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close transaction details"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-white/[0.09] bg-slate-950 shadow-2xl shadow-black/60">
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Banknote className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Transaction details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {detail?.transaction.transactionId ||
                "Loading transaction record"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {loading || !detail ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
            </div>
          ) : (
            <div className="space-y-5">
              <DetailSection title="Transaction">
                <DetailGrid>
                  <DetailItem
                    label="Transaction ID"
                    value={
                      detail.transaction
                        .transactionId
                    }
                  />

                  <DetailItem
                    label="Status"
                    value={
                      detail.transaction.status
                    }
                  />

                  <DetailItem
                    label="Created At"
                    value={formatDateTime(
                      detail.transaction
                        .createdAt
                    )}
                  />

                  <DetailItem
                    label="Payment Method"
                    value={formatPaymentMethod(
                      detail.transaction
                        .paymentMethod
                    )}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection title="Member">
                <DetailGrid>
                  <DetailItem
                    label="Name"
                    value={
                      detail.member.fullName ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Member ID"
                    value={
                      detail.member.memberId
                    }
                  />

                  <DetailItem
                    label="Tier"
                    value={
                      detail.member.tier || "—"
                    }
                  />

                  <DetailItem
                    label="Email"
                    value={
                      detail.member.email || "—"
                    }
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection title="Merchant">
                <DetailGrid>
                  <DetailItem
                    label="Business"
                    value={
                      detail.merchant
                        .merchantName || "—"
                    }
                  />

                  <DetailItem
                    label="Merchant ID"
                    value={
                      detail.merchant
                        .merchantId
                    }
                  />

                  <DetailItem
                    label="Category"
                    value={
                      detail.merchant
                        .category || "—"
                    }
                  />

                  <DetailItem
                    label="Email"
                    value={
                      detail.merchant.email ||
                      "—"
                    }
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection title="Financial Breakdown">
                <DetailGrid>
                  <DetailItem
                    label="Original Amount"
                    value={formatCurrency(
                      detail.transaction.amount
                    )}
                  />

                  <DetailItem
                    label="Cashback"
                    value={formatCurrency(
                      detail.transaction
                        .cashback
                    )}
                  />

                  <DetailItem
                    label="Reward Credits Used"
                    value={formatCurrency(
                      detail.transaction
                        .rewardCreditsUsed
                    )}
                  />

                  <DetailItem
                    label="Net Paid"
                    value={formatCurrency(
                      detail.transaction
                        .payAmount
                    )}
                  />

                  <DetailItem
                    label="Marketing Rate"
                    value={`${formatNumber(
                      detail.transaction
                        .marketingRate
                    )}%`}
                  />

                  <DetailItem
                    label="Marketing Amount"
                    value={formatCurrency(
                      detail.transaction
                        .marketingAmount
                    )}
                  />

                  <DetailItem
                    label="Cashback Rate"
                    value={`${formatNumber(
                      detail.transaction
                        .cashbackRate
                    )}%`}
                  />

                  <DetailItem
                    label="Points Earned"
                    value={formatNumber(
                      detail.transaction
                        .pointsEarned
                    )}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection title="Receipt">
                {detail.transaction.receiptUrl ? (
                  <a
                    href={
                      detail.transaction
                        .receiptUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-4 text-sm text-emerald-300 transition hover:bg-emerald-400/[0.1]"
                  >
                    <span className="flex items-center gap-3">
                      <ImageIcon className="h-5 w-5" />
                      Open uploaded receipt
                    </span>

                    <Eye className="h-4 w-4" />
                  </a>
                ) : (
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-5 text-sm text-slate-600">
                    No receipt has been uploaded for this transaction.
                  </div>
                )}
              </DetailSection>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Banknote;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5 sm:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-slate-400">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {note}
      </p>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
      <h3 className="font-semibold">
        {title}
      </h3>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

function DetailGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-700">
        {label}
      </p>

      <p className="mt-2 break-words text-sm text-slate-300">
        {value}
      </p>
    </div>
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

  const className =
    normalized === "COMPLETED"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "PENDING"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : "border-red-400/20 bg-red-400/10 text-red-300";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {normalized || "UNKNOWN"}
    </span>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/65 px-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10";

const pageButtonClass =
  "flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30";

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY",
    {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 2,
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

function formatPaymentMethod(
  value: string
) {
  const normalized =
    String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

  const labels:
    Record<string, string> = {
      CASH: "Cash",
      DUITNOW: "DuitNow",
      DUIT_NOW: "DuitNow",
      TNG: "TNG eWallet",
      TNG_EWALLET:
        "TNG eWallet",
      TOUCH_N_GO:
        "TNG eWallet",
      TOUCH_N_GO_EWALLET:
        "TNG eWallet",
      BANK: "Bank Transfer",
      BANK_TRANSFER:
        "Bank Transfer",
      TRANSFER:
        "Bank Transfer",
      CARD:
        "Credit/Debit Card",
      CREDIT_CARD:
        "Credit/Debit Card",
      DEBIT_CARD:
        "Credit/Debit Card",
      CREDIT_DEBIT_CARD:
        "Credit/Debit Card",
    };

  return (
    labels[normalized] ||
    value ||
    "—"
  );
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
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}