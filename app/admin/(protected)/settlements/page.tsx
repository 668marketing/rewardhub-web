"use client";

import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileClock,
  FileX2,
  Loader2,
  ReceiptText,
  RefreshCw,
  Search,
  SlidersHorizontal,
  WalletCards,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminSettlement,
  AdminSettlementDetailData,
  AdminSettlementListData,
  approveAdminSettlement,
  getAdminSettlementDetail,
  getAdminSettlements,
  markAdminSettlementPaid,
  rejectAdminSettlement,
} from "@/lib/admin-settlements";

type Filters = {
  search: string;
  status: string;
  month: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
};

const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "ALL",
  month: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: 25,
};

const REJECT_REASONS = [
  "Payment not received",
  "Invalid receipt",
  "Blurry receipt",
  "Wrong bank transfer",
  "Incorrect settlement",
  "Other",
];

export default function AdminSettlementsPage() {
  const [filters, setFilters] =
    useState<Filters>(
      DEFAULT_FILTERS
    );

  const [data, setData] =
    useState<AdminSettlementListData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    selectedSettlementId,
    setSelectedSettlementId,
  ] = useState("");

  const [detail, setDetail] =
    useState<AdminSettlementDetailData | null>(
      null
    );

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [showReject, setShowReject] =
    useState(false);

  const [
    selectedRejectReason,
    setSelectedRejectReason,
  ] = useState(
    REJECT_REASONS[0]
  );

  const [
    customRejectReason,
    setCustomRejectReason,
  ] = useState("");

  const loadSettlements =
    useCallback(
      async (
        manual = false
      ) => {
        try {
          setError("");

          if (manual) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const result =
            await getAdminSettlements(
              filters
            );

          setData(result);
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load settlements."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [filters]
    );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          loadSettlements();
        },
        filters.search
          ? 350
          : 0
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    loadSettlements,
    filters.search,
  ]);

  useEffect(() => {
    if (
      !selectedSettlementId
    ) {
      setDetail(null);
      return;
    }

    let active = true;

    async function loadDetail() {
      try {
        setDetailLoading(true);
        setError("");

        const result =
          await getAdminSettlementDetail(
            selectedSettlementId
          );

        if (active) {
          setDetail(result);
        }
      } catch (
        detailError
      ) {
        if (active) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : "Unable to load settlement details."
          );

          setSelectedSettlementId(
            ""
          );
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
  }, [selectedSettlementId]);

  const settlements =
    data?.settlements || [];

  const pagination =
    data?.pagination || {
      page: 1,
      pageSize:
        filters.pageSize,
      totalItems: 0,
      totalPages: 1,
      showingFrom: 0,
      showingTo: 0,
      hasPrevious: false,
      hasNext: false,
    };

  const hasActiveFilters =
    useMemo(
      () =>
        Boolean(
          filters.search ||
          filters.status !==
            "ALL" ||
          filters.month ||
          filters.dateFrom ||
          filters.dateTo
        ),
      [filters]
    );

  function updateFilter<
    K extends keyof Filters
  >(
    key: K,
    value: Filters[K]
  ) {
    setFilters(
      (current) => ({
        ...current,
        [key]: value,
        page:
          key === "page"
            ? Number(
                value
              )
            : 1,
      })
    );
  }

  function resetFilters() {
    setFilters(
      DEFAULT_FILTERS
    );
  }

  function closeDrawer() {
    setSelectedSettlementId(
      ""
    );
    setDetail(null);
    setShowReject(false);
    setSelectedRejectReason(
      REJECT_REASONS[0]
    );
    setCustomRejectReason(
      ""
    );
  }

  async function handleApprove() {
    if (
      !detail?.settlement
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await approveAdminSettlement(
        detail.settlement
      );

      await Promise.all([
        loadSettlements(
          true
        ),
        getAdminSettlementDetail(
          detail.settlement
            .settlementId
        ).then(
          setDetail
        ),
      ]);
    } catch (
      actionError
    ) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to approve settlement."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkPaid() {
    if (
      !detail?.settlement
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Mark ${detail.settlement.settlementId} as paid?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await markAdminSettlementPaid(
        detail.settlement,
        "Bank Transfer",
        "Settlement payment completed."
      );

      await Promise.all([
        loadSettlements(
          true
        ),
        getAdminSettlementDetail(
          detail.settlement
            .settlementId
        ).then(
          setDetail
        ),
      ]);
    } catch (
      actionError
    ) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to mark settlement as paid."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (
      !detail?.settlement
    ) {
      return;
    }

    const reason =
      selectedRejectReason ===
      "Other"
        ? customRejectReason.trim()
        : selectedRejectReason;

    if (
      reason.length < 3
    ) {
      setError(
        "Please enter a valid reject reason."
      );
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await rejectAdminSettlement(
        detail.settlement,
        reason
      );

      setShowReject(false);

      await Promise.all([
        loadSettlements(
          true
        ),
        getAdminSettlementDetail(
          detail.settlement
            .settlementId
        ).then(
          setDetail
        ),
      ]);
    } catch (
      actionError
    ) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to reject settlement."
      );
    } finally {
      setActionLoading(false);
    }
  }

  function exportCurrentPage() {
    if (
      !settlements.length
    ) {
      return;
    }

    const rows = [
      [
        "Settlement ID",
        "Merchant ID",
        "Merchant Name",
        "Month",
        "Total Sales",
        "Total Cashback",
        "Total Reward Credits",
        "Marketing Budget",
        "Amount Payable",
        "Status",
        "Payment Method",
        "Receipt URL",
        "Payment Note",
        "Reject Reason",
        "Created At",
        "Approved At",
        "Approved By",
        "Rejected At",
        "Rejected By",
        "Paid At",
        "Updated At",
      ],
      ...settlements.map(
        (
          settlement
        ) => [
          settlement.settlementId,
          settlement.merchantId,
          settlement.merchantName,
          settlement.month,
          settlement.totalSales,
          settlement.totalCashback,
          settlement.totalRewardCredits,
          settlement.totalMarketingBudget,
          settlement.amountPayable,
          settlement.status,
          settlement.paymentMethod,
          settlement.receiptUrl,
          settlement.paymentNote,
          settlement.rejectReason,
          settlement.createdAt,
          settlement.approvedAt,
          settlement.approvedBy,
          settlement.rejectedAt,
          settlement.rejectedBy,
          settlement.paidAt,
          settlement.updatedAt,
        ]
      ),
    ];

    const csv =
      rows
        .map(
          (row) =>
            row
              .map(
                (
                  value
                ) =>
                  `"${String(
                    value ??
                      ""
                  ).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(
                ","
              )
        )
        .join(
          "\n"
        );

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      url;

    anchor.download =
      `rewardhub-settlements-page-${pagination.page}.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      url
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-7 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <WalletCards className="h-4 w-4" />
              Finance operations
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Settlements
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Review merchant settlement submissions, payment receipts, payable amounts and approval status.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                loadSettlements(
                  true
                )
              }
              disabled={
                refreshing
              }
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
              onClick={
                exportCurrentPage
              }
              disabled={
                !settlements.length
              }
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
            label="Total Settlements"
            value={formatNumber(
              data?.summary.total ||
                0
            )}
            note={`${formatCurrency(
              data?.summary.totalAmount ||
                0
            )} total payable`}
            icon={ReceiptText}
          />

          <SummaryCard
            label="Requires Review"
            value={formatNumber(
              (data?.summary.pending ||
                0) +
                (data?.summary.submitted ||
                  0)
            )}
            note={formatCurrency(
              (data?.summary.pendingAmount ||
                0) +
                (data?.summary.submittedAmount ||
                  0)
            )}
            icon={FileClock}
          />

          <SummaryCard
            label="Approved"
            value={formatNumber(
              data?.summary.approved ||
                0
            )}
            note={formatCurrency(
              data?.summary.approvedAmount ||
                0
            )}
            icon={FileCheck2}
          />

          <SummaryCard
            label="Paid"
            value={formatNumber(
              data?.summary.paid ||
                0
            )}
            note={formatCurrency(
              data?.summary.paidAmount ||
                0
            )}
            icon={Banknote}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-slate-900/45 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                value={
                  filters.search
                }
                onChange={(
                  event
                ) =>
                  updateFilter(
                    "search",
                    event.target
                      .value
                  )
                }
                placeholder="Search settlement, merchant or bank"
                className={
                  inputClass +
                  " pl-11"
                }
              />
            </div>

            <select
              value={
                filters.status
              }
              onChange={(
                event
              ) =>
                updateFilter(
                  "status",
                  event.target
                    .value
                )
              }
              className={
                inputClass
              }
            >
              <option value="ALL">
                All statuses
              </option>
              <option value="PENDING">
                Pending
              </option>
              <option value="SUBMITTED">
                Submitted
              </option>
              <option value="APPROVED">
                Approved
              </option>
              <option value="PAID">
                Paid
              </option>
              <option value="REJECTED">
                Rejected
              </option>
            </select>

            <select
              value={
                filters.month
              }
              onChange={(
                event
              ) =>
                updateFilter(
                  "month",
                  event.target
                    .value
                )
              }
              className={
                inputClass
              }
            >
              <option value="">
                All months
              </option>

              {(data?.months ||
                []).map(
                (
                  month
                ) => (
                  <option
                    key={
                      month
                    }
                    value={
                      month
                    }
                  >
                    {formatMonth(
                      month
                    )}
                  </option>
                )
              )}
            </select>

            <label className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="date"
                value={
                  filters.dateFrom
                }
                onChange={(
                  event
                ) =>
                  updateFilter(
                    "dateFrom",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass +
                  " pl-11"
                }
              />
            </label>

            <label className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="date"
                value={
                  filters.dateTo
                }
                onChange={(
                  event
                ) =>
                  updateFilter(
                    "dateTo",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass +
                  " pl-11"
                }
              />
            </label>

            <button
              type="button"
              onClick={
                resetFilters
              }
              disabled={
                !hasActiveFilters
              }
              className="h-12 rounded-xl border border-white/[0.08] text-sm text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/35">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold">
                Settlement Directory
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                {data
                  ? `Showing ${pagination.showingFrom}–${pagination.showingTo} of ${pagination.totalItems}`
                  : "Loading settlement records"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600">
                Rows
              </span>

              <select
                value={
                  filters.pageSize
                }
                onChange={(
                  event
                ) =>
                  updateFilter(
                    "pageSize",
                    Number(
                      event.target
                        .value
                    )
                  )
                }
                className="h-10 rounded-xl border border-white/[0.08] bg-slate-950/70 px-3 text-sm text-slate-300 outline-none"
              >
                {[10, 25, 50, 100].map(
                  (
                    size
                  ) => (
                    <option
                      key={
                        size
                      }
                      value={
                        size
                      }
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
          ) : !settlements.length ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <WalletCards className="h-8 w-8 text-slate-700" />

              <h3 className="mt-4 font-medium text-slate-300">
                No settlements found
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Try changing the current filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[1350px] w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.16em] text-slate-700">
                      <th className="px-6 py-4">
                        Settlement
                      </th>
                      <th className="px-4 py-4">
                        Merchant
                      </th>
                      <th className="px-4 py-4">
                        Month
                      </th>
                      <th className="px-4 py-4">
                        Sales
                      </th>
                      <th className="px-4 py-4">
                        Marketing
                      </th>
                      <th className="px-4 py-4">
                        Payable
                      </th>
                      <th className="px-4 py-4">
                        Payment
                      </th>
                      <th className="px-4 py-4">
                        Status
                      </th>
                      <th className="px-4 py-4">
                        Submitted
                      </th>
                      <th className="px-6 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.055]">
                    {settlements.map(
                      (
                        settlement,
                        index
                      ) => (
                        <SettlementRow
                          key={`${settlement.settlementId}-${settlement.merchantId}-${index}`}
                          settlement={
                            settlement
                          }
                          onView={() =>
                            setSelectedSettlementId(
                              settlement.settlementId
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
                          filters.page -
                            1
                        )
                      )
                    }
                    className={
                      pageButtonClass
                    }
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
                        filters.page +
                          1
                      )
                    }
                    className={
                      pageButtonClass
                    }
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

      {selectedSettlementId ? (
        <SettlementDrawer
          detail={
            detail
          }
          loading={
            detailLoading
          }
          actionLoading={
            actionLoading
          }
          showReject={
            showReject
          }
          selectedRejectReason={
            selectedRejectReason
          }
          customRejectReason={
            customRejectReason
          }
          onSelectedRejectReasonChange={
            setSelectedRejectReason
          }
          onCustomRejectReasonChange={
            setCustomRejectReason
          }
          onOpenReject={() =>
            setShowReject(
              true
            )
          }
          onCancelReject={() =>
            setShowReject(
              false
            )
          }
          onApprove={
            handleApprove
          }
          onMarkPaid={
            handleMarkPaid
          }
          onReject={
            handleReject
          }
          onClose={
            closeDrawer
          }
        />
      ) : null}
    </div>
  );
}

function SettlementRow({
  settlement,
  onView,
}: {
  settlement: AdminSettlement;
  onView: () => void;
}) {
  return (
    <tr className="text-sm transition hover:bg-white/[0.018]">
      <td className="px-6 py-4">
        <p className="font-medium text-white">
          {settlement.settlementId}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {settlement.bankName ||
            "No bank"}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="text-slate-300">
          {settlement.merchantName ||
            settlement.merchantId}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {settlement.merchantId}
        </p>
      </td>

      <td className="px-4 py-4 text-slate-300">
        {formatMonth(
          settlement.month
        )}
      </td>

      <td className="px-4 py-4">
        <p className="font-medium text-white">
          {formatCurrency(
            settlement.totalSales
          )}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {formatCurrency(
            settlement.totalCashback
          )}{" "}
          cashback
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="text-slate-300">
          {formatCurrency(
            settlement.totalMarketingBudget
          )}
        </p>

        <p className="mt-1 text-xs text-violet-300">
          {formatCurrency(
            settlement.totalRewardCredits
          )}{" "}
          credits
        </p>
      </td>

      <td className="px-4 py-4 font-semibold text-white">
        {formatCurrency(
          settlement.amountPayable
        )}
      </td>

      <td className="px-4 py-4">
        <p className="text-slate-300">
          {settlement.paymentMethod ||
            "—"}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {settlement.receiptUrl
            ? "Receipt uploaded"
            : "No receipt"}
        </p>
      </td>

      <td className="px-4 py-4">
        <StatusBadge
          status={
            settlement.status
          }
        />
      </td>

      <td className="px-4 py-4 text-slate-400">
        {formatDateTime(
          settlement.createdAt
        )}
      </td>

      <td className="px-6 py-4 text-right">
        <button
          type="button"
          onClick={
            onView
          }
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
      </td>
    </tr>
  );
}

function SettlementDrawer({
  detail,
  loading,
  actionLoading,
  showReject,
  selectedRejectReason,
  customRejectReason,
  onSelectedRejectReasonChange,
  onCustomRejectReasonChange,
  onOpenReject,
  onCancelReject,
  onApprove,
  onMarkPaid,
  onReject,
  onClose,
}: {
  detail: AdminSettlementDetailData | null;
  loading: boolean;
  actionLoading: boolean;
  showReject: boolean;
  selectedRejectReason: string;
  customRejectReason: string;
  onSelectedRejectReasonChange: (
    value: string
  ) => void;
  onCustomRejectReasonChange: (
    value: string
  ) => void;
  onOpenReject: () => void;
  onCancelReject: () => void;
  onApprove: () => void;
  onMarkPaid: () => void;
  onReject: () => void;
  onClose: () => void;
}) {
  const settlement =
    detail?.settlement;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close settlement details"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-white/[0.09] bg-slate-950 shadow-2xl shadow-black/60">
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <WalletCards className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Settlement details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {settlement?.settlementId ||
                "Loading settlement record"}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {loading ||
          !detail ||
          !settlement ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  status={
                    settlement.status
                  }
                />

                <span className="text-sm text-slate-600">
                  {formatMonth(
                    settlement.month
                  )}
                </span>
              </div>

              <DetailSection title="Settlement">
                <DetailGrid>
                  <DetailItem
                    label="Settlement ID"
                    value={
                      settlement.settlementId
                    }
                  />

                  <DetailItem
                    label="Status"
                    value={
                      settlement.status
                    }
                  />

                  <DetailItem
                    label="Created At"
                    value={formatDateTime(
                      settlement.createdAt
                    )}
                  />

                  <DetailItem
                    label="Updated At"
                    value={formatDateTime(
                      settlement.updatedAt
                    )}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection title="Merchant">
                <DetailGrid>
                  <DetailItem
                    label="Business"
                    value={
                      detail.merchant.displayName ||
                      detail.merchant.businessName ||
                      settlement.merchantName ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Merchant ID"
                    value={
                      settlement.merchantId
                    }
                  />

                  <DetailItem
                    label="Email"
                    value={
                      detail.merchant.email ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Phone"
                    value={
                      detail.merchant.phone ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Category"
                    value={[
                      detail.merchant.category,
                      detail.merchant.subCategory,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " · "
                      ) || "—"}
                  />

                  <DetailItem
                    label="Location"
                    value={[
                      detail.merchant.area,
                      detail.merchant.state,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        ", "
                      ) || "—"}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection title="Financial Breakdown">
                <DetailGrid>
                  <DetailItem
                    label="Total Sales"
                    value={formatCurrency(
                      settlement.totalSales
                    )}
                  />

                  <DetailItem
                    label="Total Marketing Budget"
                    value={formatCurrency(
                      settlement.totalMarketingBudget
                    )}
                  />

                  <DetailItem
                    label="Total Cashback"
                    value={formatCurrency(
                      settlement.totalCashback
                    )}
                  />

                  <DetailItem
                    label="Reward Credits"
                    value={formatCurrency(
                      settlement.totalRewardCredits
                    )}
                  />

                  <DetailItem
                    label="Amount Payable"
                    value={formatCurrency(
                      settlement.amountPayable
                    )}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection title="Bank & Payment">
                <DetailGrid>
                  <DetailItem
                    label="Bank Name"
                    value={
                      settlement.bankName ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Bank Account"
                    value={
                      settlement.bankAccount ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Payment Method"
                    value={
                      settlement.paymentMethod ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Paid At"
                    value={formatDateTime(
                      settlement.paidAt
                    )}
                  />
                </DetailGrid>

                {settlement.paymentNote ? (
                  <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-700">
                      Payment Note
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {settlement.paymentNote}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5">
                  {settlement.receiptUrl ? (
                    <a
                      href={
                        settlement.receiptUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-4 text-sm text-emerald-300 transition hover:bg-emerald-400/[0.1]"
                    >
                      <span className="flex items-center gap-3">
                        <ReceiptText className="h-5 w-5" />
                        Open uploaded receipt
                      </span>

                      <Eye className="h-4 w-4" />
                    </a>
                  ) : (
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-5 text-sm text-slate-600">
                      No payment receipt has been uploaded.
                    </div>
                  )}
                </div>
              </DetailSection>

              {(settlement.approvedAt ||
                settlement.approvedBy ||
                settlement.rejectedAt ||
                settlement.rejectedBy ||
                settlement.rejectReason) ? (
                <DetailSection title="Review History">
                  <DetailGrid>
                    <DetailItem
                      label="Approved At"
                      value={formatDateTime(
                        settlement.approvedAt
                      )}
                    />

                    <DetailItem
                      label="Approved By"
                      value={
                        settlement.approvedBy ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Rejected At"
                      value={formatDateTime(
                        settlement.rejectedAt
                      )}
                    />

                    <DetailItem
                      label="Rejected By"
                      value={
                        settlement.rejectedBy ||
                        "—"
                      }
                    />
                  </DetailGrid>

                  {settlement.rejectReason ? (
                    <div className="mt-5 rounded-2xl border border-red-400/15 bg-red-400/[0.06] p-4">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-red-300/70">
                        Reject Reason
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-200">
                        {settlement.rejectReason}
                      </p>
                    </div>
                  ) : null}
                </DetailSection>
              ) : null}

              {showReject ? (
                <DetailSection title="Reject Settlement">
                  <label className="block text-sm text-slate-400">
                    Reject reason
                  </label>

                  <select
                    value={
                      selectedRejectReason
                    }
                    onChange={(
                      event
                    ) =>
                      onSelectedRejectReasonChange(
                        event.target.value
                      )
                    }
                    className={`${inputClass} mt-3`}
                  >
                    {REJECT_REASONS.map(
                      (
                        reason
                      ) => (
                        <option
                          key={
                            reason
                          }
                          value={
                            reason
                          }
                        >
                          {reason}
                        </option>
                      )
                    )}
                  </select>

                  {selectedRejectReason ===
                  "Other" ? (
                    <textarea
                      value={
                        customRejectReason
                      }
                      onChange={(
                        event
                      ) =>
                        onCustomRejectReasonChange(
                          event.target.value
                        )
                      }
                      placeholder="Enter reject reason"
                      maxLength={
                        1000
                      }
                      className="mt-3 min-h-28 w-full resize-none rounded-xl border border-white/[0.08] bg-slate-950/65 px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-red-400/35 focus:ring-4 focus:ring-red-400/10"
                    />
                  ) : null}

                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={
                        onCancelReject
                      }
                      disabled={
                        actionLoading
                      }
                      className="h-11 flex-1 rounded-xl border border-white/[0.08] text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={
                        onReject
                      }
                      disabled={
                        actionLoading
                      }
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 text-sm font-semibold text-red-200 transition hover:bg-red-400/15 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileX2 className="h-4 w-4" />
                      )}

                      Confirm reject
                    </button>
                  </div>
                </DetailSection>
              ) : null}
            </div>
          )}
        </div>

        {!loading &&
        detail &&
        settlement ? (
          <footer className="border-t border-white/[0.08] bg-slate-950 px-5 py-4 sm:px-7">
            {detail.actions.canApprove ||
            detail.actions.canReject ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={
                    onOpenReject
                  }
                  disabled={
                    actionLoading ||
                    showReject
                  }
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 text-sm font-semibold text-red-200 transition hover:bg-red-400/15 disabled:opacity-40"
                >
                  <FileX2 className="h-4 w-4" />
                  Reject
                </button>

                <button
                  type="button"
                  onClick={
                    onApprove
                  }
                  disabled={
                    actionLoading
                  }
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  Approve
                </button>
              </div>
            ) : detail.actions.canMarkPaid ? (
              <button
                type="button"
                onClick={
                  onMarkPaid
                }
                disabled={
                  actionLoading
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Banknote className="h-4 w-4" />
                )}

                Mark as Paid
              </button>
            ) : (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-center text-sm text-slate-500">
                This settlement has been completed.
              </div>
            )}
          </footer>
        ) : null}
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
  icon: typeof WalletCards;
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
    String(
      status || ""
    )
      .trim()
      .toUpperCase();

  const className =
    normalized === "PAID"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "APPROVED"
        ? "border-sky-400/20 bg-sky-400/10 text-sky-300"
        : normalized === "SUBMITTED"
          ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
          : normalized === "PENDING"
            ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
            : "border-red-400/20 bg-red-400/10 text-red-300";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {normalized ||
        "UNKNOWN"}
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
  ).format(
    Number(
      value || 0
    )
  );
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(
    Number(
      value || 0
    )
  );
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
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
      dateStyle:
        "medium",
      timeStyle:
        "short",
      timeZone:
        "Asia/Kuala_Lumpur",
    }
  ).format(
    date
  );
}

function formatMonth(
  value: string
) {
  const match =
    String(
      value || ""
    ).match(
      /^(\d{4})-(\d{2})$/
    );

  if (!match) {
    return value ||
      "—";
  }

  const date =
    new Date(
      Number(
        match[1]
      ),
      Number(
        match[2]
      ) - 1,
      1
    );

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      month: "long",
      year: "numeric",
    }
  ).format(
    date
  );
}
