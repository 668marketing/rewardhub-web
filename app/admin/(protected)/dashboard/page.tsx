"use client";

import {
  ArrowUpRight,
  Building2,
  Clock3,
  CreditCard,
  Loader2,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Store,
  Users,
  WalletCards,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useAdminAuth } from "@/components/admin/AdminRouteGuard";
import {
  AdminDashboardData,
  getAdminDashboardData,
} from "@/lib/admin-dashboard";

export default function AdminDashboardPage() {
  const {
    admin,
    expiresAt,
  } = useAdminAuth();

  const [data, setData] =
    useState<AdminDashboardData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadDashboard =
    useCallback(
      async (
        isManualRefresh = false
      ) => {
        try {
          setError("");

          if (isManualRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const result =
            await getAdminDashboardData();

          setData(result);
        } catch (loadError) {
          console.error(
            "Dashboard load error:",
            loadError
          );

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load dashboard."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <DashboardLoading />
    );
  }

  if (!data) {
    return (
      <DashboardError
        message={
          error ||
          "Dashboard data is unavailable."
        }
        onRetry={() =>
          loadDashboard()
        }
      />
    );
  }

  const summaryCards = [
    {
      label: "Total Members",
      value: formatNumber(
        data.members.total
      ),
      note: `${formatNumber(
        data.members.active
      )} active · ${formatNumber(
        data.members.newToday
      )} new today`,
      icon: Users,
    },
    {
      label: "Active Merchants",
      value: formatNumber(
        data.merchants.active
      ),
      note: `${formatNumber(
        data.merchants.total
      )} total · ${formatNumber(
        data.merchants.pending
      )} pending`,
      icon: Store,
    },
    {
      label: "Transactions Today",
      value: formatNumber(
        data.transactions.today.count
      ),
      note: `${formatCurrency(
        data.transactions.today.sales
      )} sales today`,
      icon: ReceiptText,
    },
    {
      label: "Pending Settlements",
      value: formatNumber(
        data.settlements.pending
      ),
      note: `${formatCurrency(
        data.settlements.pendingAmount
      )} pending amount`,
      icon: WalletCards,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            Secure administration
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Welcome back,{" "}
            {getFirstName(
              admin.fullName
            )}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Monitor RewardHub members,
            merchants, transactions and
            pending operational activity.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Session expires
              </p>

              <p className="mt-0.5 text-sm font-medium text-slate-200">
                {formatDateTime(
                  expiresAt
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              loadDashboard(true)
            }
            disabled={refreshing}
            className="flex h-[66px] items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.065] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={[
                "h-4 w-4",
                refreshing
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />

            {refreshing
              ? "Refreshing…"
              : "Refresh"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(
          (card) => {
            const Icon =
              card.icon;

            return (
              <article
                key={card.label}
                className="group rounded-3xl border border-white/[0.07] bg-white/[0.035] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.045] text-slate-300">
                    <Icon className="h-5 w-5" />
                  </div>

                  <ArrowUpRight className="h-4 w-4 text-slate-700 transition group-hover:text-slate-500" />
                </div>

                <p className="mt-6 text-sm text-slate-500">
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  {card.value}
                </p>

                <p className="mt-3 text-xs text-slate-600">
                  {card.note}
                </p>
              </article>
            );
          }
        )}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label="Sales This Month"
          value={formatCurrency(
            data.transactions.month.sales
          )}
          note={`${formatNumber(
            data.transactions.month.count
          )} completed transactions`}
        />

        <MiniStat
          label="Cashback Today"
          value={formatCurrency(
            data.transactions.today.cashback
          )}
          note="Member cashback issued"
        />

        <MiniStat
          label="Reward Credits Used"
          value={formatCurrency(
            data.transactions.today
              .rewardCreditsUsed
          )}
          note="Credits used today"
        />

        <MiniStat
          label="Points Issued Today"
          value={formatNumber(
            data.transactions.today
              .pointsIssued
          )}
          note="Reward points issued"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.035]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-semibold text-white">
                Recent Transactions
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Latest RewardHub merchant
                transaction activity
              </p>
            </div>

            <CreditCard className="h-5 w-5 text-slate-600" />
          </div>

          {data.recentTransactions
            .length === 0 ? (
            <EmptySection
              icon={ReceiptText}
              title="No transactions yet"
              description="Recent completed transactions will appear here."
            />
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {data.recentTransactions.map(
                (
                  transaction,
                  index
                ) => (
                  <div
                    key={[
  transaction.transactionId || "no-transaction-id",
  transaction.referenceNo || "no-reference",
  transaction.memberId || "no-member",
  transaction.merchantId || "no-merchant",
  transaction.createdAt || "no-date",
  index,
].join("-")}
                    className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.025] sm:flex-row sm:items-center sm:px-6"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                      <ReceiptText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-white">
                          {transaction.merchantName ||
                            transaction.merchantId ||
                            "Merchant"}
                        </p>

                        <StatusBadge
                          status={
                            transaction.status
                          }
                        />
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-600">
                        {transaction.memberName ||
                          transaction.memberId ||
                          "Unknown member"}
                        {" · "}
                        {transaction.paymentMethod ||
                          "Unknown method"}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(
                          transaction.amount
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {formatDateTime(
                          transaction.createdAt
                        )}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </article>

        <div className="space-y-6">
          <article className="rounded-3xl border border-white/[0.07] bg-white/[0.035]">
            <div className="border-b border-white/[0.07] px-5 py-5 sm:px-6">
              <h2 className="font-semibold text-white">
                Pending Actions
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Items requiring admin
                attention
              </p>
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              <PendingAction
                icon={Building2}
                label="Merchant applications"
                value={
                  data.pendingActions
                    .merchantApplications
                }
              />

              <PendingAction
                icon={WalletCards}
                label="Settlement requests"
                value={
                  data.pendingActions
                    .settlementRequests
                }
              />

              <PendingAction
                icon={CreditCard}
                label="Card applications"
                value={
                  data.pendingActions
                    .cardApplications
                }
              />
            </div>
          </article>

          <article className="rounded-3xl border border-white/[0.07] bg-white/[0.035] p-5 sm:p-6">
            <h2 className="font-semibold text-white">
              Member Tiers
            </h2>

            <div className="mt-5 space-y-4">
              <TierRow
                label="Silver"
                value={
                  data.members.tiers
                    .silver
                }
                total={
                  data.members.total
                }
              />

              <TierRow
                label="Gold"
                value={
                  data.members.tiers.gold
                }
                total={
                  data.members.total
                }
              />

              <TierRow
                label="Platinum"
                value={
                  data.members.tiers
                    .platinum
                }
                total={
                  data.members.total
                }
              />
            </div>
          </article>
        </div>
      </section>

      <p className="mt-6 text-right text-xs text-slate-700">
        Last updated{" "}
        {formatDateTime(
          data.generatedAt
        )}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-[11px] text-slate-700">
        {note}
      </p>
    </article>
  );
}

function PendingAction({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-slate-950/40 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.045] text-slate-400">
        <Icon className="h-5 w-5" />
      </div>

      <p className="min-w-0 flex-1 text-sm text-slate-400">
        {label}
      </p>

      <span
        className={[
          "text-lg font-semibold",
          value > 0
            ? "text-amber-300"
            : "text-white",
        ].join(" ")}
      >
        {formatNumber(value)}
      </span>
    </div>
  );
}

function TierRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.min(
          (value / total) * 100,
          100
        )
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {label}
        </p>

        <p className="text-sm font-medium text-white">
          {formatNumber(value)}
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toUpperCase();

  const className =
    normalized === "COMPLETED" ||
    normalized === "SUCCESS" ||
    normalized === "PAID"
      ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
      : normalized === "PENDING"
        ? "border-amber-400/15 bg-amber-400/10 text-amber-300"
        : "border-white/[0.08] bg-white/[0.04] text-slate-400";

  return (
    <span
      className={`rounded-md border px-2 py-1 text-[9px] font-medium uppercase tracking-wide ${className}`}
    >
      {status || "Unknown"}
    </span>
  );
}

function EmptySection({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-slate-600">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="mt-5 text-sm font-medium text-slate-300">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04]">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Loading dashboard data…
        </p>
      </div>
    </div>
  );
}

function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-red-400/10 p-7 text-center">
        <h1 className="text-lg font-semibold text-white">
          Unable to load dashboard
        </h1>

        <p className="mt-3 text-sm leading-6 text-red-200">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-red-200"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  );
}

function getFirstName(
  fullName: string
) {
  return (
    fullName
      .trim()
      .split(/\s+/)[0] ||
    "Administrator"
  );
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(
    Number(value || 0)
  );
}

function formatCurrency(
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
  ).format(
    Number(value || 0)
  );
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}