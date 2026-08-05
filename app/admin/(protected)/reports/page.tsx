"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  Coins,
  CreditCard,
  Download,
  Gift,
  Loader2,
  RefreshCw,
  Store,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import {
  AdminReportsDashboard,
  formatReportCurrency,
  formatReportNumber,
  getAdminReportsDashboard,
} from "@/lib/admin-reports";

function dateInputValue(
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

function defaultStartDate() {
  const date =
    new Date();

  date.setDate(
    date.getDate() - 29
  );

  return dateInputValue(
    date
  );
}

function defaultEndDate() {
  return dateInputValue(
    new Date()
  );
}

export default function AdminReportsPage() {
  const [
    report,
    setReport,
  ] =
    useState<
      AdminReportsDashboard | null
    >(null);

  const [
    startDate,
    setStartDate,
  ] =
    useState(
      defaultStartDate
    );

  const [
    endDate,
    setEndDate,
  ] =
    useState(
      defaultEndDate
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    feedback,
    setFeedback,
  ] =
    useState("");

  const loadReport =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setFeedback("");

          const result =
            await getAdminReportsDashboard({
              startDate,
              endDate,
            });

          setReport(
            result
          );
        } catch (error) {
          setFeedback(
            error instanceof Error
              ? error.message
              : "Unable to load reports."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        startDate,
        endDate,
      ]
    );

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const maximumTrend =
    useMemo(
      () =>
        Math.max(
          1,
          ...(
            report?.dailyTrend ||
            []
          ).map(
            (item) =>
              item.grossSales
          )
        ),
      [report]
    );

  function exportCsv() {
    if (!report) {
      return;
    }

    const rows = [
      [
        "Date",
        "Transactions",
        "Gross Sales",
        "Customer Paid",
        "Cashback",
        "Reward Credits Used",
      ],
      ...report.dailyTrend.map(
        (item) => [
          item.date,
          String(
            item.transactions
          ),
          String(
            item.grossSales
          ),
          String(
            item.customerPaid
          ),
          String(
            item.cashback
          ),
          String(
            item.rewardCreditsUsed
          ),
        ]
      ),
    ];

    const csv =
      rows
        .map((row) =>
          row
            .map((value) =>
              `"${String(
                value
              ).replace(
                /"/g,
                '""'
              )}"`
            )
            .join(",")
        )
        .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8",
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

    anchor.href = url;
    anchor.download =
      `rewardhub-report-${startDate}-to-${endDate}.csv`;

    anchor.click();

    URL.revokeObjectURL(
      url
    );
  }

  const overview =
    report?.overview;

  return (
    <main className="min-h-full bg-slate-950 px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
              <BarChart3 className="h-4 w-4" />
              Business intelligence
            </div>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Reports
            </h1>

            <p className="mt-2 text-slate-400">
              Review RewardHub sales, members, merchants, rewards and settlement performance.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={
                loading
              }
              onClick={() =>
                void loadReport()
              }
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 px-5 font-bold transition hover:bg-white/[0.04] disabled:cursor-wait disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              disabled={
                !report ||
                loading
              }
              onClick={
                exportCsv
              }
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-5 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-white/[0.08] bg-slate-900/60 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <label className="flex-1">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Start date
              </span>

              <input
                type="date"
                value={
                  startDate
                }
                max={
                  endDate
                }
                onChange={(
                  event
                ) =>
                  setStartDate(
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 text-white outline-none transition focus:border-emerald-400/50"
              />
            </label>

            <label className="flex-1">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                End date
              </span>

              <input
                type="date"
                value={
                  endDate
                }
                min={
                  startDate
                }
                max={
                  defaultEndDate()
                }
                onChange={(
                  event
                ) =>
                  setEndDate(
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 text-white outline-none transition focus:border-emerald-400/50"
              />
            </label>

            <div className="flex h-12 items-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] px-4 text-sm text-emerald-200">
              <CalendarDays className="h-4 w-4" />
              Asia/Kuala_Lumpur
            </div>
          </div>
        </section>

        {feedback ? (
          <div className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
            {feedback}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Gross Sales"
            value={
              formatReportCurrency(
                overview?.grossSales ||
                0
              )
            }
            detail="Transaction amount before deductions"
            icon={
              TrendingUp
            }
            loading={
              loading &&
              !report
            }
          />

          <MetricCard
            title="Customer Paid"
            value={
              formatReportCurrency(
                overview?.customerPaid ||
                0
              )
            }
            detail="Amount paid after cashback and credits"
            icon={
              CreditCard
            }
            loading={
              loading &&
              !report
            }
          />

          <MetricCard
            title="Transactions"
            value={
              formatReportNumber(
                overview?.transactionCount ||
                0
              )
            }
            detail={`Average ${formatReportCurrency(
              overview?.averageTransactionValue ||
              0
            )}`}
            icon={
              Activity
            }
            loading={
              loading &&
              !report
            }
          />

          <MetricCard
            title="Marketing Amount"
            value={
              formatReportCurrency(
                overview?.marketingAmount ||
                0
              )
            }
            detail="Frozen transaction marketing allocation"
            icon={
              WalletCards
            }
            loading={
              loading &&
              !report
            }
          />

          <MetricCard
            title="Cashback"
            value={
              formatReportCurrency(
                overview?.cashback ||
                0
              )
            }
            detail="Instant discount given"
            icon={
              Gift
            }
            loading={
              loading &&
              !report
            }
          />

          <MetricCard
            title="Reward Credits Used"
            value={
              formatReportCurrency(
                overview?.rewardCreditsUsed ||
                0
              )
            }
            detail="Credits redeemed in selected range"
            icon={
              Coins
            }
            loading={
              loading &&
              !report
            }
          />

          <MetricCard
            title="Active Members"
            value={
              formatReportNumber(
                report?.members.active ||
                0
              )
            }
            detail={`${formatReportNumber(
              report?.members.newInRange ||
              0
            )} new in range`}
            icon={
              Users
            }
            loading={
              loading &&
              !report
            }
          />

          <MetricCard
            title="Active Merchants"
            value={
              formatReportNumber(
                report?.merchants.active ||
                0
              )
            }
            detail={`${formatReportNumber(
              report?.merchants.sellingInRange ||
              0
            )} selling in range`}
            icon={
              Store
            }
            loading={
              loading &&
              !report
            }
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <ReportPanel
            title="Sales Trend"
            subtitle="Daily gross sales for the selected date range."
          >
            <div className="mt-6 space-y-3">
              {(report?.dailyTrend || [])
                .slice(-31)
                .map(
                  (item) => (
                    <div
                      key={
                        item.date
                      }
                      className="grid grid-cols-[92px_1fr_110px] items-center gap-3"
                    >
                      <span className="text-xs text-slate-500">
                        {
                          item.date
                        }
                      </span>

                      <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{
                            width:
                              `${Math.max(
                                item.grossSales >
                                  0
                                  ? 3
                                  : 0,
                                (
                                  item.grossSales /
                                  maximumTrend
                                ) *
                                  100
                              )}%`,
                          }}
                        />
                      </div>

                      <span className="text-right text-sm font-bold">
                        {formatReportCurrency(
                          item.grossSales
                        )}
                      </span>
                    </div>
                  )
                )}

              {!loading &&
              (
                report?.dailyTrend
                  .length || 0
              ) === 0 ? (
                <EmptyState text="No sales in this date range." />
              ) : null}
            </div>
          </ReportPanel>

          <ReportPanel
            title="Network Snapshot"
            subtitle="Current platform membership and merchant status."
          >
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <SnapshotRow
                icon={
                  Users
                }
                label="Total members"
                value={
                  report?.members.total ||
                  0
                }
              />

              <SnapshotRow
                icon={
                  Building2
                }
                label="Total merchants"
                value={
                  report?.merchants.total ||
                  0
                }
              />

              <SnapshotRow
                icon={
                  Coins
                }
                label="Points balance"
                value={
                  report?.points.currentBalance ||
                  0
                }
              />

              <SnapshotRow
                icon={
                  Gift
                }
                label="Reward Credits balance"
                value={
                  report?.rewardCredits.availableBalance ||
                  0
                }
                currency
              />
            </div>
          </ReportPanel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <ReportTable
            title="Top Merchants"
            subtitle="Ranked by gross sales in the selected range."
            headers={[
              "Merchant",
              "Transactions",
              "Gross Sales",
            ]}
            empty={
              !loading &&
              (
                report?.topMerchants
                  .length || 0
              ) === 0
            }
          >
            {(report?.topMerchants || [])
              .map(
                (item) => (
                  <tr
                    key={
                      item.merchantId
                    }
                    className="border-t border-white/[0.06]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-white">
                        {
                          item.merchantName
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          item.merchantId
                        }
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {
                        item.transactionCount
                      }
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-emerald-300">
                      {formatReportCurrency(
                        item.grossSales
                      )}
                    </td>
                  </tr>
                )
              )}
          </ReportTable>

          <ReportTable
            title="Top Members"
            subtitle="Highest spending members in the selected range."
            headers={[
              "Member",
              "Transactions",
              "Gross Sales",
            ]}
            empty={
              !loading &&
              (
                report?.topMembers
                  .length || 0
              ) === 0
            }
          >
            {(report?.topMembers || [])
              .map(
                (item) => (
                  <tr
                    key={
                      item.memberId
                    }
                    className="border-t border-white/[0.06]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-white">
                        {
                          item.memberName
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.memberId} · {item.tier}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {
                        item.transactionCount
                      }
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-emerald-300">
                      {formatReportCurrency(
                        item.grossSales
                      )}
                    </td>
                  </tr>
                )
              )}
          </ReportTable>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof TrendingUp;
  loading: boolean;
}) {
  return (
    <article className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-400">
        {title}
      </p>

      {loading ? (
        <div className="mt-3 h-9 w-32 animate-pulse rounded-xl bg-white/[0.06]" />
      ) : (
        <p className="mt-2 text-3xl font-black tracking-tight">
          {value}
        </p>
      )}

      <p className="mt-2 text-xs text-slate-600">
        {detail}
      </p>
    </article>
  );
}

function ReportPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6">
      <h2 className="text-lg font-black">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {subtitle}
      </p>

      {children}
    </section>
  );
}

function SnapshotRow({
  icon: Icon,
  label,
  value,
  currency = false,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  currency?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-slate-950/60 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <Icon className="h-4 w-4" />
        </div>

        <span className="text-sm text-slate-400">
          {label}
        </span>
      </div>

      <strong>
        {currency
          ? formatReportCurrency(
              value
            )
          : formatReportNumber(
              value
            )}
      </strong>
    </div>
  );
}

function ReportTable({
  title,
  subtitle,
  headers,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  headers: string[];
  empty: boolean;
  children:
    React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/60">
      <div className="p-6">
        <h2 className="text-lg font-black">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-t border-white/[0.06] bg-slate-950/40">
            <tr>
              {headers.map(
                (
                  header,
                  index
                ) => (
                  <th
                    key={
                      header
                    }
                    className={[
                      "px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-600",
                      index ===
                      headers.length -
                        1
                        ? "text-right"
                        : "",
                    ].join(
                      " "
                    )}
                  >
                    {
                      header
                    }
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {children}
          </tbody>
        </table>

        {empty ? (
          <EmptyState text="No report records found." />
        ) : null}
      </div>
    </section>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="px-6 py-12 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}