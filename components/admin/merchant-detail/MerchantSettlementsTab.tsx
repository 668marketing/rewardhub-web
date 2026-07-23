"use client";

import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Eye,
  FileSearch,
  Search,
  WalletCards,
  XCircle,
} from "lucide-react";
import {
  useMemo,
  useState,
  type ComponentType,
} from "react";

import MerchantSettlementDrawer from "@/components/admin/merchant-detail/MerchantSettlementDrawer";

import type {
  AdminMerchantSettlement,
  MerchantSettlementSummary,
} from "@/lib/admin-merchant-detail";

type MerchantSettlementsTabProps = {
  settlements:
    AdminMerchantSettlement[];

  summary:
    MerchantSettlementSummary;

  onUpdated: () => Promise<void>;
};

export default function MerchantSettlementsTab({
  settlements,
  summary,
  onUpdated,
}: MerchantSettlementsTabProps) {
  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [month, setMonth] =
    useState("ALL");

  const [
    selectedSettlement,
    setSelectedSettlement,
  ] =
    useState<AdminMerchantSettlement | null>(
      null
    );

  const months =
    useMemo(() => {
      const values =
        settlements
          .map(
            (settlement) =>
              normalizeMonth(
                settlement.month
              )
          )
          .filter(Boolean);

      return Array.from(
        new Set(values)
      ).sort(
        (first, second) =>
          second.localeCompare(first)
      );
    }, [settlements]);

  const filteredSettlements =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return settlements.filter(
        (settlement) => {
          const settlementStatus =
            normalizeStatus(
              settlement.status
            );

          const settlementMonth =
            normalizeMonth(
              settlement.month
            );

          if (
            status !== "ALL" &&
            settlementStatus !== status
          ) {
            return false;
          }

          if (
            month !== "ALL" &&
            settlementMonth !== month
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const searchable = [
            settlement.settlementId,
            settlement.merchantId,
            settlement.merchantName,
            settlement.month,
            settlement.status,
            settlement.bankName,
            settlement.bankAccount,
            settlement.paymentMethod,
            settlement.amountPayable,
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            normalizedSearch
          );
        }
      );
    }, [
      settlements,
      search,
      status,
      month,
    ]);

  const displayedTotal =
    filteredSettlements.reduce(
      (
        total,
        settlement
      ) =>
        total +
        Number(
          settlement.amountPayable ||
            0
        ),
      0
    );

  return (
    <>
      <div className="space-y-5">
        <SettlementSummaryCards
          summary={summary}
        />

        <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search settlement ID, bank or payment method"
                className="h-12 w-full rounded-2xl border border-white/[0.08] bg-slate-950/45 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-emerald-400/30 focus:ring-4 focus:ring-emerald-400/10"
              />
            </div>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              className="h-12 rounded-2xl border border-white/[0.08] bg-slate-950/45 px-4 text-sm text-slate-300 outline-none focus:border-emerald-400/30 focus:ring-4 focus:ring-emerald-400/10"
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
              value={month}
              onChange={(event) =>
                setMonth(
                  event.target.value
                )
              }
              className="h-12 rounded-2xl border border-white/[0.08] bg-slate-950/45 px-4 text-sm text-slate-300 outline-none focus:border-emerald-400/30 focus:ring-4 focus:ring-emerald-400/10"
            >
              <option value="ALL">
                All months
              </option>

              {months.map(
                (monthValue) => (
                  <option
                    key={monthValue}
                    value={monthValue}
                  >
                    {formatMonth(
                      monthValue
                    )}
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/50">
          <div className="flex flex-col gap-2 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Merchant Settlements
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Showing{" "}
                {
                  filteredSettlements.length
                }{" "}
                of {settlements.length}{" "}
                settlement records
              </p>
            </div>

            <p className="text-xs text-slate-600">
              Displayed total:{" "}
              <span className="font-semibold text-slate-300">
                {formatMoney(
                  displayedTotal
                )}
              </span>
            </p>
          </div>

          {filteredSettlements.length >
          0 ? (
            <>
              <div className="space-y-3 p-4 lg:hidden">
                {filteredSettlements.map(
  (settlement, index) => (
    <SettlementMobileCard
      key={`${settlement.settlementId}-${settlement.merchantId}-${settlement.createdAt}-${index}`}
      settlement={
        settlement
      }
      onView={() =>
        setSelectedSettlement(
          settlement
        )
      }
    />
  )
)}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1480px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-[0.15em] text-slate-600">
                      <th className="px-5 py-4">
                        Settlement
                      </th>

                      <th className="px-5 py-4">
                        Month
                      </th>

                      <th className="px-5 py-4">
                        Sales
                      </th>

                      <th className="px-5 py-4">
                        Cashback
                      </th>

                      <th className="px-5 py-4">
                        Marketing
                      </th>

                      <th className="px-5 py-4">
                        Payable
                      </th>

                      <th className="px-5 py-4">
                        Bank
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Requested
                      </th>

                      <th className="px-5 py-4">
                        Paid
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSettlements.map(
  (settlement, index) => (
    <SettlementTableRow
      key={`${settlement.settlementId}-${settlement.merchantId}-${settlement.createdAt}-${index}`}
      settlement={
        settlement
      }
      onView={() =>
        setSelectedSettlement(
          settlement
        )
      }
    />
  )
)}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <SettlementEmptyState
              filtered={
                settlements.length > 0
              }
            />
          )}
        </section>
      </div>

     <MerchantSettlementDrawer
  settlement={
    selectedSettlement
  }
  open={
    Boolean(
      selectedSettlement
    )
  }
  onClose={() =>
    setSelectedSettlement(
      null
    )
  }
  onUpdated={
    onUpdated
  }
/>
    </>
  );
}

/* ============================================================
 * Summary Cards
 * ============================================================
 */

function SettlementSummaryCards({
  summary,
}: {
  summary:
    MerchantSettlementSummary;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SettlementStatCard
        icon={WalletCards}
        label="Total Requests"
        value={formatNumber(
          summary.total
        )}
        description={`${formatNumber(
          summary.pending +
            summary.submitted
        )} awaiting action`}
      />

      <SettlementStatCard
        icon={CalendarDays}
        label="Pending"
        value={formatMoney(
          summary.pendingAmount
        )}
        description={`${formatNumber(
          summary.pending
        )} requests`}
      />

      <SettlementStatCard
        icon={FileSearch}
        label="Submitted"
        value={formatMoney(
          summary.submittedAmount
        )}
        description={`${formatNumber(
          summary.submitted
        )} requests`}
      />

      <SettlementStatCard
        icon={CheckCircle2}
        label="Approved"
        value={formatMoney(
          summary.approvedAmount
        )}
        description={`${formatNumber(
          summary.approved
        )} requests`}
      />

      <SettlementStatCard
        icon={CircleDollarSign}
        label="Paid"
        value={formatMoney(
          summary.paidAmount
        )}
        description={`${formatNumber(
          summary.paid
        )} requests`}
      />
    </section>
  );
}

function SettlementStatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: ComponentType<{
    className?: string;
  }>;

  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-slate-950/40 text-emerald-300">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
 * Desktop Row
 * ============================================================
 */

function SettlementTableRow({
  settlement,
  onView,
}: {
  settlement:
    AdminMerchantSettlement;

  onView: () => void;
}) {
  return (
    <tr className="border-b border-white/[0.055] text-sm transition last:border-b-0 hover:bg-white/[0.025]">
      <td className="px-5 py-4">
        <p className="font-medium text-white">
          {settlement.settlementId ||
            "—"}
        </p>

        <p className="mt-1 text-xs text-slate-700">
          {settlement.paymentMethod ||
            "No payment method"}
        </p>
      </td>

      <td className="px-5 py-4 text-slate-300">
        {formatMonth(
          settlement.month
        )}
      </td>

      <td className="px-5 py-4 text-slate-300">
        {formatMoney(
          settlement.totalSales
        )}
      </td>

      <td className="px-5 py-4 text-slate-400">
        {formatMoney(
          settlement.totalCashback
        )}
      </td>

      <td className="px-5 py-4 text-slate-400">
        {formatMoney(
          settlement.totalMarketingBudget
        )}
      </td>

      <td className="px-5 py-4 font-semibold text-emerald-300">
        {formatMoney(
          settlement.amountPayable
        )}
      </td>

      <td className="px-5 py-4">
        <p className="text-slate-300">
          {settlement.bankName ||
            "—"}
        </p>

        <p className="mt-1 max-w-[180px] truncate text-xs text-slate-700">
          {settlement.bankAccount ||
            "No account"}
        </p>
      </td>

      <td className="px-5 py-4">
        <SettlementStatusBadge
          status={settlement.status}
        />
      </td>

      <td className="px-5 py-4 text-slate-500">
        {formatDateTime(
          settlement.createdAt
        )}
      </td>

      <td className="px-5 py-4 text-slate-500">
        {formatDateTime(
          settlement.paidAt
        )}
      </td>

      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {settlement.receiptUrl ? (
            <a
              href={
                settlement.receiptUrl
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-xs font-medium text-slate-400 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.06] hover:text-emerald-300"
            >
              Receipt

              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}

          <button
            type="button"
            onClick={onView}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-400 px-3 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            <Eye className="h-3.5 w-3.5" />

            View
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ============================================================
 * Mobile Card
 * ============================================================
 */

function SettlementMobileCard({
  settlement,
  onView,
}: {
  settlement:
    AdminMerchantSettlement;

  onView: () => void;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-slate-950/25 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {settlement.settlementId ||
              "Settlement"}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {formatMonth(
              settlement.month
            )}
          </p>
        </div>

        <SettlementStatusBadge
          status={settlement.status}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MobileValue
          label="Total Sales"
          value={formatMoney(
            settlement.totalSales
          )}
        />

        <MobileValue
          label="Cashback"
          value={formatMoney(
            settlement.totalCashback
          )}
        />

        <MobileValue
          label="Marketing"
          value={formatMoney(
            settlement.totalMarketingBudget
          )}
        />

        <MobileValue
          label="Payable"
          value={formatMoney(
            settlement.amountPayable
          )}
          highlight
        />
      </div>

      <div className="mt-4 border-t border-white/[0.06] pt-4">
        <p className="text-xs text-slate-600">
          Bank
        </p>

        <p className="mt-1 break-words text-sm text-slate-300">
          {settlement.bankName ||
            "—"}

          {settlement.bankAccount
            ? ` · ${settlement.bankAccount}`
            : ""}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-600">
          {formatDateTime(
            settlement.createdAt
          )}
        </p>

        {settlement.receiptUrl ? (
          <a
            href={
              settlement.receiptUrl
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-xs font-medium text-slate-400"
          >
            Receipt

            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onView}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
      >
        <Eye className="h-4 w-4" />

        View Settlement
      </button>
    </article>
  );
}

function MobileValue({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-slate-950/35 p-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-700">
        {label}
      </p>

      <p
        className={[
          "mt-2 text-sm font-semibold",
          highlight
            ? "text-emerald-300"
            : "text-slate-300",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

/* ============================================================
 * Status
 * ============================================================
 */

function SettlementStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    normalizeStatus(status);

  const classes =
    normalized === "PAID"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "APPROVED"
        ? "border-blue-400/20 bg-blue-400/10 text-blue-300"
        : normalized === "SUBMITTED"
          ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
          : normalized === "REJECTED"
            ? "border-red-400/20 bg-red-400/10 text-red-300"
            : "border-amber-400/20 bg-amber-400/10 text-amber-300";

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {normalized}
    </span>
  );
}

/* ============================================================
 * Empty State
 * ============================================================
 */

function SettlementEmptyState({
  filtered,
}: {
  filtered: boolean;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
        {filtered ? (
          <Search className="h-6 w-6" />
        ) : (
          <XCircle className="h-6 w-6" />
        )}
      </div>

      <h3 className="mt-5 text-base font-semibold text-white">
        {filtered
          ? "No matching settlements"
          : "No settlement records"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        {filtered
          ? "No settlement records match the selected search and filters."
          : "This merchant has not submitted any settlement requests yet."}
      </p>
    </div>
  );
}

/* ============================================================
 * Helpers
 * ============================================================
 */

function normalizeStatus(
  value: string
) {
  const status =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    status === "REQUESTED" ||
    status === "PROCESSING"
  ) {
    return "PENDING";
  }

  if (
    status === "PAYMENT_SUBMITTED" ||
    status === "SUBMIT"
  ) {
    return "SUBMITTED";
  }

  if (
    status === "COMPLETED"
  ) {
    return "PAID";
  }

  if (
    status === "DECLINED"
  ) {
    return "REJECTED";
  }

  return status || "PENDING";
}

function normalizeMonth(
  value: string
) {
  if (!value) {
    return "";
  }

  const match =
    String(value).match(
      /^(\d{4})-(\d{2})/
    );

  return match
    ? `${match[1]}-${match[2]}`
    : String(value)
        .trim()
        .slice(0, 7);
}

function formatMonth(
  value: string
) {
  const normalized =
    normalizeMonth(value);

  const match =
    normalized.match(
      /^(\d{4})-(\d{2})$/
    );

  if (!match) {
    return normalized || "—";
  }

  const date =
    new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      1
    );

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

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
  ).format(
    Number(value || 0)
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
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);
}