"use client";

import {
  ExternalLink,
  ReceiptText,
  Search,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import type {
  AdminMerchantTransaction,
  MerchantTransactionSummary,
} from "@/lib/admin-merchant-detail";

type MerchantTransactionsTabProps = {
  transactions:
    AdminMerchantTransaction[];

  summary:
    MerchantTransactionSummary;
};

export default function MerchantTransactionsTab({
  transactions,
  summary,
}: MerchantTransactionsTabProps) {
  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const filteredTransactions =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {
          const transactionStatus =
            normalizeStatus(
              transaction.status
            );

          if (
            status !== "ALL" &&
            transactionStatus !== status
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const searchable = [
            transaction.transactionId,
            transaction.memberId,
            transaction.paymentMethod,
            transaction.status,
            transaction.amount,
            transaction.payAmount,
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            normalizedSearch
          );
        }
      );
    }, [
      transactions,
      search,
      status,
    ]);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TransactionSummaryCard
          label="Total Transactions"
          value={formatNumber(
            summary.total
          )}
          description={`${formatNumber(
            summary.completed
          )} completed`}
        />

        <TransactionSummaryCard
          label="Total Sales"
          value={formatMoney(
            summary.sales
          )}
          description="Completed transaction value"
        />

        <TransactionSummaryCard
          label="Cashback Issued"
          value={formatMoney(
            summary.cashback
          )}
          description="Instant member discounts"
        />

        <TransactionSummaryCard
          label="Reward Credits Used"
          value={formatMoney(
            summary.rewardCreditsUsed
          )}
          description="Credits redeemed at payment"
        />
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_210px]">
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
              placeholder="Search transaction ID, member ID or payment method"
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

            <option value="COMPLETED">
              Completed
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="FAILED">
              Failed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/50">
        <div className="border-b border-white/[0.07] px-5 py-5">
          <h2 className="text-base font-semibold text-white">
            Merchant Transactions
          </h2>

          <p className="mt-1 text-xs text-slate-600">
            Showing{" "}
            {filteredTransactions.length}{" "}
            of {transactions.length}{" "}
            transactions
          </p>
        </div>

        {filteredTransactions.length >
        0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-[0.15em] text-slate-600">
                  <th className="px-5 py-4">
                    Transaction
                  </th>

                  <th className="px-5 py-4">
                    Member
                  </th>

                  <th className="px-5 py-4">
                    Gross Amount
                  </th>

                  <th className="px-5 py-4">
                    Reward Credits
                  </th>

                  <th className="px-5 py-4">
                    Pay Amount
                  </th>

                  <th className="px-5 py-4">
                    Payment
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Date
                  </th>

                  <th className="px-5 py-4 text-right">
                    Receipt
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map(
                  (
                    transaction,
                    index
                  ) => (
                    <TransactionRow
                      key={`${transaction.transactionId}-${transaction.memberId}-${index}`}
                      transaction={
                        transaction
                      }
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
              <ReceiptText className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-base font-semibold text-white">
              No transactions found
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              No transaction records
              match the current search
              and status filter.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function TransactionRow({
  transaction,
}: {
  transaction:
    AdminMerchantTransaction;
}) {
  return (
    <tr className="border-b border-white/[0.055] text-sm transition last:border-b-0 hover:bg-white/[0.025]">
      <td className="px-5 py-4">
        <p className="font-medium text-white">
          {transaction.transactionId ||
            "—"}
        </p>
      </td>

      <td className="px-5 py-4 text-slate-400">
        {transaction.memberId ||
          "—"}
      </td>

      <td className="px-5 py-4">
        <p className="font-medium text-white">
          {formatMoney(
            transaction.amount
          )}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {formatMoney(
            transaction.cashback
          )}{" "}
          cashback
        </p>
      </td>

      <td className="px-5 py-4 text-slate-300">
        {formatMoney(
          transaction.rewardCreditsUsed
        )}
      </td>

      <td className="px-5 py-4 font-medium text-emerald-300">
        {formatMoney(
          transaction.payAmount
        )}
      </td>

      <td className="px-5 py-4 text-slate-400">
        {transaction.paymentMethod ||
          "—"}
      </td>

      <td className="px-5 py-4">
        <TransactionStatusBadge
          status={transaction.status}
        />
      </td>

      <td className="px-5 py-4 text-slate-500">
        {formatDateTime(
          transaction.createdAt
        )}
      </td>

      <td className="px-5 py-4 text-right">
        {transaction.receiptUrl ? (
          <a
            href={
              transaction.receiptUrl
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-xs font-medium text-slate-400 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.06] hover:text-emerald-300"
          >
            View
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs text-slate-700">
            No receipt
          </span>
        )}
      </td>
    </tr>
  );
}

function TransactionStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    normalizeStatus(status);

  const classes =
    normalized === "COMPLETED"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "PENDING"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : normalized === "FAILED"
          ? "border-red-400/20 bg-red-400/10 text-red-300"
          : normalized ===
              "CANCELLED"
            ? "border-slate-400/15 bg-slate-400/[0.07] text-slate-400"
            : "border-slate-400/15 bg-slate-400/[0.07] text-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {normalized}
    </span>
  );
}

function TransactionSummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

function normalizeStatus(
  value: string
) {
  const status = String(
    value || ""
  )
    .trim()
    .toUpperCase();

  if (
    status === "SUCCESS" ||
    status === "PAID" ||
    status === "APPROVED"
  ) {
    return "COMPLETED";
  }

  if (
    status === "CANCELED" ||
    status === "VOID"
  ) {
    return "CANCELLED";
  }

  return status || "PENDING";
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
  ).format(Number(value || 0));
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(Number(value || 0));
}

function formatDateTime(
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
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);
}