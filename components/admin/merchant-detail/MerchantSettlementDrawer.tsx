"use client";

import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  FileText,
  Landmark,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Store,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  approveMerchantSettlement,
  rejectMerchantSettlement,
  type AdminMerchantSettlement,
} from "@/lib/admin-merchant-detail";

type MerchantSettlementDrawerProps = {
  settlement:
    AdminMerchantSettlement | null;

  open: boolean;

  onClose: () => void;

  onUpdated: () => Promise<void>;
};

export default function MerchantSettlementDrawer({
  settlement,
  open,
  onClose,
  onUpdated,
}: MerchantSettlementDrawerProps) {
  const [actionLoading, setActionLoading] =
    useState<
      "approve" | "reject" | null
    >(null);

  const [rejecting, setRejecting] =
    useState(false);

  const [rejectReason, setRejectReason] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        !actionLoading
      ) {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    open,
    onClose,
    actionLoading,
  ]);

  useEffect(() => {
    if (open) {
      setRejecting(false);
      setRejectReason("");
      setError("");
      setActionLoading(null);
    }
  }, [
    open,
    settlement?.settlementId,
  ]);

  if (!open || !settlement) {
    return null;
  }

  const status =
    normalizeStatus(
      settlement.status
    );

  const canReview =
    status === "PENDING" ||
    status === "SUBMITTED";

  async function handleApprove() {
    if (!settlement) {
      return;
    }

    const confirmed =
      window.confirm(
        `Approve settlement ${settlement.settlementId}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setActionLoading(
        "approve"
      );

      await approveMerchantSettlement(
  settlement.merchantId,
  settlement.settlementId
);

// 操作成功后先关闭旧 Drawer
onClose();

// 再重新读取最新资料
await onUpdated();
    } catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : "Unable to approve settlement."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!settlement) {
      return;
    }

    const normalizedReason =
      rejectReason.trim();

    if (!normalizedReason) {
      setError(
        "Rejection reason is required."
      );
      return;
    }

    if (
      normalizedReason.length < 3
    ) {
      setError(
        "Rejection reason must contain at least 3 characters."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Reject settlement ${settlement.settlementId}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setActionLoading(
        "reject"
      );

      await rejectMerchantSettlement(
  settlement.merchantId,
  settlement.settlementId,
  normalizedReason
);

// 操作成功后先关闭旧 Drawer
onClose();

// 再重新读取最新资料
await onUpdated();
    } catch (rejectError) {
      setError(
        rejectError instanceof Error
          ? rejectError.message
          : "Unable to reject settlement."
      );
    } finally {
      setActionLoading(null);
    }
  }

  function handleClose() {
    if (actionLoading) {
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close settlement details"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col border-l border-white/[0.08] bg-[#071022] shadow-2xl">
        <header className="flex items-start justify-between gap-5 border-b border-white/[0.08] px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <WalletCards className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white">
                Settlement Details
              </h2>

              <p className="mt-1 truncate text-xs text-slate-500">
                {settlement.settlementId ||
                  "Settlement"}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={
              Boolean(actionLoading)
            }
            onClick={handleClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-5 sm:p-6">
            {error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                <span>{error}</span>
              </div>
            ) : null}

            <section className="rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.11] to-slate-900/50 p-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-sm text-slate-400">
                    Amount Payable
                  </p>

                  <p className="mt-2 text-3xl font-semibold text-white">
                    {formatMoney(
                      settlement.amountPayable
                    )}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Settlement month:{" "}
                    {formatMonth(
                      settlement.month
                    )}
                  </p>
                </div>

                <SettlementStatusBadge
                  status={status}
                />
              </div>
            </section>

            <DrawerSection
              icon={Store}
              title="Settlement Information"
              description="Basic request information"
            >
              <DetailGrid>
                <DetailField
                  label="Settlement ID"
                  value={
                    settlement.settlementId ||
                    "—"
                  }
                />

                <DetailField
                  label="Month"
                  value={formatMonth(
                    settlement.month
                  )}
                />

                <DetailField
                  label="Merchant"
                  value={
                    settlement.merchantName ||
                    "—"
                  }
                />

                <DetailField
                  label="Merchant ID"
                  value={
                    settlement.merchantId ||
                    "—"
                  }
                />

                <DetailField
                  label="Requested At"
                  value={formatDateTime(
                    settlement.createdAt
                  )}
                />

                <DetailField
                  label="Status"
                  value={status}
                />
              </DetailGrid>
            </DrawerSection>

            <DrawerSection
              icon={CircleDollarSign}
              title="Financial Breakdown"
              description="Settlement calculation"
            >
              <div className="space-y-1">
                <MoneyRow
                  label="Total Sales"
                  value={
                    settlement.totalSales
                  }
                />

                <MoneyRow
                  label="Total Marketing Budget"
                  value={
                    settlement.totalMarketingBudget
                  }
                />

                <MoneyRow
                  label="Cashback Issued"
                  value={
                    settlement.totalCashback
                  }
                  negative
                />

                <MoneyRow
                  label="Reward Credits Used"
                  value={
                    settlement.totalRewardCredits
                  }
                />

                <div className="mt-4 border-t border-white/[0.08] pt-4">
                  <MoneyRow
                    label="Amount Payable"
                    value={
                      settlement.amountPayable
                    }
                    highlight
                  />
                </div>
              </div>
            </DrawerSection>

            <DrawerSection
              icon={Landmark}
              title="Bank Information"
              description="Merchant settlement account"
            >
              <DetailGrid>
                <DetailField
                  label="Bank Name"
                  value={
                    settlement.bankName ||
                    "—"
                  }
                />

                <DetailField
                  label="Bank Account"
                  value={
                    settlement.bankAccount ||
                    "—"
                  }
                />

                <DetailField
                  label="Payment Method"
                  value={
                    settlement.paymentMethod ||
                    "—"
                  }
                />

                <DetailField
                  label="Paid At"
                  value={formatDateTime(
                    settlement.paidAt
                  )}
                />
              </DetailGrid>
            </DrawerSection>

            <DrawerSection
              icon={ReceiptText}
              title="Payment Receipt"
              description="Submitted payment evidence"
            >
              {settlement.receiptUrl ? (
                <div className="rounded-2xl border border-white/[0.07] bg-slate-950/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">
                          Settlement Receipt
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-600">
                          Open receipt in a new tab
                        </p>
                      </div>
                    </div>

                    <a
                      href={
                        settlement.receiptUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-400 px-4 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
                    >
                      View

                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <EmptyInformation
                  icon={ReceiptText}
                  title="No receipt uploaded"
                  description="No receipt is currently attached to this settlement."
                />
              )}
            </DrawerSection>

            <DrawerSection
              icon={Clock3}
              title="Settlement Timeline"
              description="Current processing progress"
            >
              <SettlementTimeline
                settlement={
                  settlement
                }
              />
            </DrawerSection>

            <DrawerSection
              icon={FileText}
              title="Notes"
              description="Payment and rejection information"
            >
              <NoteBlock
                label="Payment Note"
                value={
                  settlement.paymentNote
                }
              />

              <div className="mt-4">
                <NoteBlock
                  label="Rejection Reason"
                  value={
                    settlement.rejectReason
                  }
                  danger={
                    Boolean(
                      settlement.rejectReason
                    )
                  }
                />
              </div>
            </DrawerSection>

            {rejecting &&
            canReview ? (
              <section className="rounded-3xl border border-red-400/20 bg-red-400/[0.05] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                    <XCircle className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-red-100">
                      Reject Settlement
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-red-200/60">
                      Enter a clear reason. The reason will be stored in the settlement record.
                    </p>
                  </div>
                </div>

                <label className="mt-5 block">
                  <span className="text-xs font-medium text-red-100">
                    Rejection reason
                  </span>

                  <textarea
                    value={
                      rejectReason
                    }
                    disabled={
                      Boolean(
                        actionLoading
                      )
                    }
                    maxLength={1000}
                    rows={5}
                    onChange={(
                      event
                    ) => {
                      setRejectReason(
                        event.target.value
                      );

                      setError("");
                    }}
                    placeholder="Example: Bank account details do not match the merchant profile."
                    className="mt-2 w-full resize-none rounded-2xl border border-red-400/20 bg-slate-950/45 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-red-400/40 focus:ring-4 focus:ring-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="text-xs text-red-200/50">
                      Minimum 3 characters
                    </span>

                    <span className="text-xs text-red-200/50">
                      {
                        rejectReason.length
                      }
                      /1000
                    </span>
                  </div>
                </label>
              </section>
            ) : null}
          </div>
        </div>

        <footer className="border-t border-white/[0.08] bg-[#071022]/95 px-5 py-4 backdrop-blur sm:px-6">
          {canReview ? (
            rejecting ? (
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    Boolean(
                      actionLoading
                    )
                  }
                  onClick={() => {
                    setRejecting(
                      false
                    );

                    setRejectReason(
                      ""
                    );

                    setError("");
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.09] px-5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    Boolean(
                      actionLoading
                    ) ||
                    rejectReason
                      .trim()
                      .length < 3
                  }
                  onClick={() =>
                    void handleReject()
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ===
                  "reject" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}

                  {actionLoading ===
                  "reject"
                    ? "Rejecting..."
                    : "Confirm Rejection"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={
                    Boolean(
                      actionLoading
                    )
                  }
                  onClick={() => {
                    setRejecting(
                      true
                    );

                    setError("");
                  }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-400/20 px-5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />

                  Reject
                </button>

                <button
                  type="button"
                  disabled={
                    Boolean(
                      actionLoading
                    )
                  }
                  onClick={() =>
                    void handleApprove()
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ===
                  "approve" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  {actionLoading ===
                  "approve"
                    ? "Approving..."
                    : "Approve Settlement"}
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-slate-600">
                No review action is available for this status.
              </p>

              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.09] px-5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                Close
              </button>
            </div>
          )}
        </footer>
      </aside>
    </div>
  );
}

/* ============================================================
 * Timeline
 * ============================================================
 */

function SettlementTimeline({
  settlement,
}: {
  settlement:
    AdminMerchantSettlement;
}) {
  const status =
    normalizeStatus(
      settlement.status
    );

  const requestedComplete =
    Boolean(
      settlement.createdAt
    );

  const submittedComplete =
    [
      "SUBMITTED",
      "APPROVED",
      "PAID",
    ].includes(status);

  const approvedComplete =
    [
      "APPROVED",
      "PAID",
    ].includes(status);

  const paidComplete =
    status === "PAID";

  const rejected =
    status === "REJECTED";

  return (
    <div className="space-y-1">
      <TimelineItem
        icon={CalendarDays}
        label="Requested"
        value={formatDateTime(
          settlement.createdAt
        )}
        complete={
          requestedComplete
        }
      />

      <TimelineItem
        icon={ReceiptText}
        label="Submitted"
        value={
          submittedComplete
            ? settlement.paymentMethod ||
              "Submitted"
            : "Not submitted"
        }
        complete={
          submittedComplete
        }
      />

      <TimelineItem
        icon={ShieldCheck}
        label="Approved"
        value={
          approvedComplete
            ? formatDateTime(
                settlement.approvedAt
              )
            : "Not approved"
        }
        complete={
          approvedComplete
        }
      />

      <TimelineItem
        icon={Banknote}
        label="Paid"
        value={
          paidComplete
            ? formatDateTime(
                settlement.paidAt
              )
            : "Not paid"
        }
        complete={
          paidComplete
        }
        last={!rejected}
      />

      {rejected ? (
        <TimelineItem
          icon={XCircle}
          label="Rejected"
          value={
            settlement.rejectedAt
              ? formatDateTime(
                  settlement.rejectedAt
                )
              : settlement.rejectReason ||
                "Settlement rejected"
          }
          complete
          danger
          last
        />
      ) : null}
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  label,
  value,
  complete,
  danger = false,
  last = false,
}: {
  icon: ComponentType<{
    className?: string;
  }>;

  label: string;
  value: string;
  complete: boolean;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!last ? (
        <div className="absolute left-[19px] top-10 h-[calc(100%-20px)] w-px bg-white/[0.08]" />
      ) : null}

      <div
        className={[
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          danger
            ? "border-red-400/20 bg-red-400/10 text-red-300"
            : complete
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-white/[0.07] bg-slate-950/40 text-slate-600",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 pb-6">
        <p
          className={[
            "text-sm font-medium",
            danger
              ? "text-red-200"
              : complete
                ? "text-white"
                : "text-slate-500",
          ].join(" ")}
        >
          {label}
        </p>

        <p className="mt-1 break-words text-xs leading-5 text-slate-600">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
 * Shared Components
 * ============================================================
 */

function DrawerSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{
    className?: string;
  }>;

  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950/50 text-emerald-300">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">
            {title}
          </h3>

          <p className="mt-1 text-xs text-slate-600">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

function DetailGrid({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {children}
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-slate-950/25 p-4">
      <p className="text-[10px] uppercase tracking-[0.13em] text-slate-700">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  negative = false,
  highlight = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-white/[0.055] py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span
        className={
          highlight
            ? "text-sm font-semibold text-white"
            : "text-sm text-slate-500"
        }
      >
        {label}
      </span>

      <span
        className={[
          "text-sm font-semibold",
          highlight
            ? "text-emerald-300"
            : negative
              ? "text-red-300"
              : "text-slate-300",
        ].join(" ")}
      >
        {negative ? "− " : ""}
        {formatMoney(value)}
      </span>
    </div>
  );
}

function NoteBlock({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        danger
          ? "border-red-400/15 bg-red-400/[0.05]"
          : "border-white/[0.06] bg-slate-950/25",
      ].join(" ")}
    >
      <p
        className={[
          "text-[10px] uppercase tracking-[0.13em]",
          danger
            ? "text-red-300/70"
            : "text-slate-700",
        ].join(" ")}
      >
        {label}
      </p>

      <p
        className={[
          "mt-2 whitespace-pre-wrap break-words text-sm leading-6",
          danger
            ? "text-red-200"
            : "text-slate-400",
        ].join(" ")}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function EmptyInformation({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{
    className?: string;
  }>;

  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] px-5 py-9 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950/40 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-medium text-slate-300">
        {title}
      </p>

      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function SettlementStatusBadge({
  status,
}: {
  status: string;
}) {
  const classes =
    status === "PAID"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : status === "APPROVED"
        ? "border-blue-400/20 bg-blue-400/10 text-blue-300"
        : status === "SUBMITTED"
          ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
          : status === "REJECTED"
            ? "border-red-400/20 bg-red-400/10 text-red-300"
            : "border-amber-400/20 bg-amber-400/10 text-amber-300";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {status}
    </span>
  );
}

/* ============================================================
 * Formatters
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

function formatMonth(
  value: string
) {
  const match =
    String(value || "").match(
      /^(\d{4})-(\d{2})/
    );

  if (!match) {
    return value || "—";
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
      month: "long",
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