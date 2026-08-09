"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clipboard,
  Copy,
  Gift,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Truck,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
} from "next/navigation";

import {
  getAdminRewardRedemptionDetail,
  updateAdminRewardRedemption,
  type AdminRewardRedemption,
} from "@/lib/admin-rewards";

export default function AdminRewardRedemptionDetailPage() {
  const params =
    useParams<{
      redemptionId: string;
    }>();

  const redemptionId =
    decodeURIComponent(
      String(
        params?.redemptionId || ""
      )
    );

  const [item, setItem] =
    useState<AdminRewardRedemption | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState("");

  const [trackingNo, setTrackingNo] =
    useState("");

  const [adminNote, setAdminNote] =
    useState("");

  const [courier, setCourier] =
    useState("");

  const [cancelReason, setCancelReason] =
    useState("");

  const loadDetail =
    useCallback(
      async (
        showRefreshLoader = false
      ) => {
        if (!redemptionId) {
          setError(
            "Redemption ID is missing."
          );
          setLoading(false);
          return;
        }

        try {
          if (showRefreshLoader) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const result =
            await getAdminRewardRedemptionDetail(
              redemptionId
            );

          const exactMatch =
            result.redemption;

          if (!exactMatch) {
            throw new Error(
              "Redemption order not found."
            );
          }

          setItem(
            exactMatch
          );

          setTrackingNo(
            exactMatch.trackingNo ||
            ""
          );

          setAdminNote(
            exactMatch.adminNote ||
            ""
          );
        } catch (loadError) {
          setItem(null);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load redemption details."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [redemptionId]
    );

  useEffect(
    function () {
      void loadDetail();
    },
    [loadDetail]
  );

  async function copyValue(
    label: string,
    value: string
  ) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopied(label);

      window.setTimeout(
        function () {
          setCopied("");
        },
        1600
      );
    } catch {
      setError(
        "Unable to copy value."
      );
    }
  }

  async function runAction(
    nextStatus:
      | "PROCESSING"
      | "SHIPPED"
      | "COMPLETED"
      | "CANCELLED"
  ) {
    if (!item || actionLoading) {
      return;
    }

    if (
      nextStatus ===
        "SHIPPED" &&
      !trackingNo.trim()
    ) {
      setError(
        "Tracking number is required before marking this order as shipped."
      );
      return;
    }

    if (
      nextStatus ===
        "SHIPPED" &&
      !courier.trim()
    ) {
      setError(
        "Please select a courier before marking this order as shipped."
      );
      return;
    }

    if (
      nextStatus ===
        "CANCELLED" &&
      !cancelReason.trim()
    ) {
      setError(
        "Please select a cancel reason."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Change this redemption from ${item.status} to ${nextStatus}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setActionMessage("");

      const result =
        await updateAdminRewardRedemption({
          redemptionId:
            item.redemptionId,
          status:
            nextStatus,
          trackingNo:
            trackingNo.trim(),
          courier:
            courier.trim(),
          cancelReason:
            cancelReason.trim(),
          adminNote:
            adminNote.trim(),
        });

      setItem(
        result.redemption
      );

      setTrackingNo(
        result.redemption
          .trackingNo || ""
      );

      setAdminNote(
        result.redemption
          .adminNote || ""
      );

      const refundMessage =
        result.refund?.applied
          ? [
              `${formatNumber(
                result.refund.pointsRefunded
              )} points refunded`,
              result.refund.stockRestored > 0
                ? `${formatNumber(
                    result.refund.stockRestored
                  )} stock restored`
                : "",
              result.refund.voucherRestored
                ? "Voucher restored"
                : "",
            ]
              .filter(Boolean)
              .join(" · ")
          : "";

      setActionMessage(
        [
          result.message ||
            "Redemption updated successfully.",
          refundMessage,
        ]
          .filter(Boolean)
          .join(" ")
      );

      setCancelReason("");
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update redemption."
      );
    } finally {
      setActionLoading(false);
    }
  }

  const status =
    String(
      item?.status || ""
    ).toUpperCase();

  const isPhysical =
    String(
      item?.deliveryMethod ||
      ""
    ).toUpperCase() ===
      "SHIPPING";

  const title =
    item?.rewardTitle ||
    item?.rewardId ||
    "Reward Redemption";

  const rewardImageSrc =
    useMemo(
      function () {
        return getImageSrc(
          item?.rewardImageUrl ||
          ""
        );
      },
      [
        item?.rewardImageUrl,
      ]
    );

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-400" />

            <p className="mt-4 text-sm font-medium text-slate-400">
              Loading redemption details...
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error && !item) {
    return (
      <PageShell>
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
          <div className="w-full rounded-3xl border border-red-400/20 bg-red-500/5 p-7 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />

            <h1 className="mt-4 text-xl font-semibold text-white">
              Unable to open redemption
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {error}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/admin/rewards/redemptions"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Orders
              </Link>

              <button
                type="button"
                onClick={() =>
                  void loadDetail()
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <PageShell>
      <div className="min-w-0 space-y-7 overflow-x-hidden pb-12 pt-6 lg:pt-8">
        <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Link
              href="/admin/rewards/redemptions"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Redemption Orders
            </Link>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Redemption Details
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Review the member, reward,
              voucher, delivery and
              processing information for
              this redemption order.
            </p>
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              void loadDetail(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0b1428] px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-[#0f1a31] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </button>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b1428]">
              <div className="flex flex-col gap-5 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:p-6">
                <RewardImage
                  src={rewardImageSrc}
                  title={title}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={item.status}
                    />

                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {item.deliveryMethod ||
                        "Unknown Delivery"}
                    </span>
                  </div>

                  <h2 className="mt-3 truncate text-xl font-semibold text-white sm:text-2xl">
                    {title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {item.rewardId}
                  </p>
                </div>
              </div>

              <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2">
                <Metric
                  icon={WalletCards}
                  label="Points Used"
                  value={`${formatNumber(
                    item.pointsUsed
                  )} pts`}
                />

                <Metric
                  icon={PackageCheck}
                  label="Quantity"
                  value={String(
                    item.quantity || 1
                  )}
                />

                <Metric
                  icon={CalendarClock}
                  label="Redeemed At"
                  value={formatDateTime(
                    item.redeemedAt
                  )}
                />

                <Metric
                  icon={
                    isPhysical
                      ? Truck
                      : Gift
                  }
                  label="Reward Type"
                  value={
                    item.rewardType ||
                    item.deliveryMethod ||
                    "-"
                  }
                />
              </div>
            </section>

            <DetailSection
              title="Member Information"
              icon={UserRound}
            >
              <DetailGrid>
                <DetailField
                  label="Member Name"
                  value={
                    item.memberName ||
                    "-"
                  }
                />

                <DetailField
                  label="Member ID"
                  value={
                    item.memberId ||
                    "-"
                  }
                  copyable
                  copied={
                    copied ===
                    "memberId"
                  }
                  onCopy={() =>
                    copyValue(
                      "memberId",
                      item.memberId ||
                        ""
                    )
                  }
                />

                <DetailField
                  label="Phone"
                  value={
                    item.phone ||
                    item.memberPhone ||
                    "-"
                  }
                  icon={Phone}
                  copyable={
                    Boolean(
                      item.phone ||
                      item.memberPhone
                    )
                  }
                  copied={
                    copied === "phone"
                  }
                  onCopy={() =>
                    copyValue(
                      "phone",
                      item.phone ||
                        item.memberPhone ||
                        ""
                    )
                  }
                />

                <DetailField
                  label="Recipient"
                  value={
                    item.recipientName ||
                    "-"
                  }
                />
              </DetailGrid>

              {item.address && (
                <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                    {item.address}
                  </p>
                </div>
              )}
            </DetailSection>

            <DetailSection
              title="Fulfilment Information"
              icon={Truck}
            >
              <DetailGrid>
                <DetailField
                  label="Delivery Method"
                  value={
                    item.deliveryMethod ||
                    "-"
                  }
                />

                <DetailField
                  label="Tracking Number"
                  value={
                    item.trackingNo ||
                    "-"
                  }
                  copyable={
                    Boolean(
                      item.trackingNo
                    )
                  }
                  copied={
                    copied ===
                    "trackingNo"
                  }
                  onCopy={() =>
                    copyValue(
                      "trackingNo",
                      item.trackingNo ||
                        ""
                    )
                  }
                />

                <DetailField
                  label="Processed At"
                  value={formatDateTime(
                    item.processedAt
                  )}
                />

                <DetailField
                  label="Completed At"
                  value={formatDateTime(
                    item.completedAt
                  )}
                />
              </DetailGrid>

              {item.adminNote && (
                <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Admin Note
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                    {item.adminNote}
                  </p>
                </div>
              )}
            </DetailSection>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/[0.08] bg-[#0b1428] p-5 sm:p-6">
              <h3 className="text-base font-semibold text-white">
                Order Reference
              </h3>

              <CopyCard
                label="Redemption ID"
                value={
                  item.redemptionId
                }
                copied={
                  copied ===
                  "redemptionId"
                }
                onCopy={() =>
                  copyValue(
                    "redemptionId",
                    item.redemptionId
                  )
                }
              />

              {item.voucherCode && (
                <CopyCard
                  label="Voucher Code"
                  value={
                    item.voucherCode
                  }
                  copied={
                    copied ===
                    "voucherCode"
                  }
                  onCopy={() =>
                    copyValue(
                      "voucherCode",
                      item.voucherCode ||
                        ""
                    )
                  }
                />
              )}
            </section>


            <section className="rounded-3xl border border-white/[0.08] bg-[#0b1428] p-5 sm:p-6">
              <h3 className="text-base font-semibold text-white">
                Customer Service Actions
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Update the fulfilment status without editing Google Sheets manually.
              </p>

              <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Current Workflow
                </p>

                <p className="mt-2 text-xs font-medium leading-5 text-slate-300">
                  {isPhysical
                    ? "Pending → Processing → Shipped → Completed"
                    : "Pending → Processing → Completed"}
                </p>
              </div>

              {actionMessage && (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                  {actionMessage}
                </div>
              )}

              {isPhysical &&
                status !== "COMPLETED" &&
                status !== "CANCELLED" && (
                  <div className="mt-5 grid gap-4">
                    <label className="block">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Courier
                      </span>

                      <select
                        value={courier}
                        onChange={(event) =>
                          setCourier(
                            event.target.value
                          )
                        }
                        disabled={actionLoading}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#081124] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50 disabled:opacity-60"
                      >
                        <option value="">
                          Select courier
                        </option>
                        <option value="J&T Express">
                          J&T Express
                        </option>
                        <option value="Pos Laju">
                          Pos Laju
                        </option>
                        <option value="Ninja Van">
                          Ninja Van
                        </option>
                        <option value="DHL eCommerce">
                          DHL eCommerce
                        </option>
                        <option value="City-Link Express">
                          City-Link Express
                        </option>
                        <option value="GDEX">
                          GDEX
                        </option>
                        <option value="Other">
                          Other
                        </option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Tracking Number
                      </span>

                      <input
                        value={trackingNo}
                        onChange={(event) =>
                          setTrackingNo(
                            event.target.value
                          )
                        }
                        disabled={actionLoading}
                        placeholder="Enter tracking number"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 disabled:opacity-60"
                      />
                    </label>
                  </div>
                )}

              {status !== "COMPLETED" &&
                status !== "CANCELLED" && (
                  <label className="mt-4 block">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Admin Note
                    </span>

                    <textarea
                      value={adminNote}
                      onChange={(event) =>
                        setAdminNote(
                          event.target.value
                        )
                      }
                      disabled={actionLoading}
                      rows={4}
                      placeholder="Internal processing note"
                      className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 disabled:opacity-60"
                    />
                  </label>
                )}

              {(status === "PENDING" ||
                status === "PROCESSING" ||
                status === "SHIPPED") && (
                  <label className="mt-4 block">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Cancel Reason
                    </span>

                    <select
                      value={cancelReason}
                      onChange={(event) =>
                        setCancelReason(
                          event.target.value
                        )
                      }
                      disabled={actionLoading}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#081124] px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/50 disabled:opacity-60"
                    >
                      <option value="">
                        Select only when cancelling
                      </option>
                      <option value="Customer request">
                        Customer request
                      </option>
                      <option value="Out of stock">
                        Out of stock
                      </option>
                      <option value="Invalid delivery details">
                        Invalid delivery details
                      </option>
                      <option value="Duplicate redemption">
                        Duplicate redemption
                      </option>
                      <option value="Unable to fulfil">
                        Unable to fulfil
                      </option>
                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </label>
                )}

              <div className="mt-5 grid gap-3">
                {status === "PENDING" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      void runAction(
                        "PROCESSING"
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PackageCheck className="h-4 w-4" />
                    )}
                    Start Processing
                  </button>
                )}

                {status === "PROCESSING" &&
                  isPhysical && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        void runAction(
                          "SHIPPED"
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                      Mark as Shipped
                    </button>
                  )}

                {status === "PENDING" &&
                  !isPhysical && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        void runAction(
                          "COMPLETED"
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Complete Digital Order
                    </button>
                  )}

                {status === "PROCESSING" &&
                  !isPhysical && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        void runAction(
                          "COMPLETED"
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Mark as Completed
                    </button>
                  )}

                {status === "SHIPPED" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      void runAction(
                        "COMPLETED"
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Mark as Completed
                  </button>
                )}

                {(status === "PENDING" ||
                  status === "PROCESSING" ||
                  status === "SHIPPED") && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      void runAction(
                        "CANCELLED"
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/20 disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Order
                  </button>
                )}

                {(status === "COMPLETED" ||
                  status === "CANCELLED") && (
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-center text-sm text-slate-500">
                    This order is locked and cannot be changed.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-[#0b1428] p-5 sm:p-6">
              <h3 className="text-base font-semibold text-white">
                Timeline
              </h3>

              <div className="mt-5 space-y-5">
                <TimelineItem
                  title="Redeemed"
                  value={formatDateTime(
                    item.redeemedAt
                  )}
                  active
                />

                <TimelineItem
                  title="Processed"
                  value={formatDateTime(
                    item.processedAt
                  )}
                  active={
                    Boolean(
                      item.processedAt
                    )
                  }
                />

                {isPhysical && (
                  <TimelineItem
                    title="Shipped"
                    value={formatDateTime(
                      item.shippedAt
                    )}
                    active={
                      status ===
                        "SHIPPED" ||
                      status ===
                        "COMPLETED" ||
                      Boolean(
                        item.shippedAt
                      )
                    }
                  />
                )}

                <TimelineItem
                  title="Completed"
                  value={formatDateTime(
                    item.completedAt
                  )}
                  active={
                    status ===
                      "COMPLETED" ||
                    Boolean(
                      item.completedAt
                    )
                  }
                />
              </div>
            </section>
          </aside>
        </section>
      </div>
    </PageShell>
  );
}

function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#020817] px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px]">
        {children}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-[#0b1428] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
          <Icon className="h-5 w-5" />
        </div>

        <h3 className="text-base font-semibold text-white">
          {title}
        </h3>
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
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {children}
    </div>
  );
}

function DetailField({
  label,
  value,
  icon: Icon,
  copyable = false,
  copied = false,
  onCopy,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{
    className?: string;
  }>;
  copyable?: boolean;
  copied?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && (
            <Icon className="h-4 w-4 shrink-0 text-slate-500" />
          )}

          <p className="break-all text-sm font-medium text-slate-100">
            {value}
          </p>
        </div>

        {copyable &&
          value !== "-" &&
          onCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label={`Copy ${label}`}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          )}
      </div>
    </div>
  );
}

function CopyCard({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/10 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="min-w-0 break-all text-sm font-semibold text-white">
          {value || "-"}
        </p>

        {value && (
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 rounded-xl border border-white/10 p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#0b1428] p-5">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />

        <p className="text-xs font-medium uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="mt-3 break-words text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function TimelineItem({
  title,
  value,
  active = false,
}: {
  title: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`h-3 w-3 rounded-full ${
            active
              ? "bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.08)]"
              : "bg-slate-700"
          }`}
        />

        <div className="mt-2 h-full w-px bg-white/[0.08]" />
      </div>

      <div className="min-w-0 pb-3">
        <p
          className={`text-sm font-medium ${
            active
              ? "text-white"
              : "text-slate-600"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {value}
        </p>
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
    String(
      status || ""
    ).toUpperCase();

  let classes =
    "border-slate-600/30 bg-slate-600/10 text-slate-300";

  if (
    normalized === "COMPLETED"
  ) {
    classes =
      "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  } else if (
    normalized === "PENDING"
  ) {
    classes =
      "border-amber-400/30 bg-amber-400/10 text-amber-300";
  } else if (
    normalized === "PROCESSING"
  ) {
    classes =
      "border-blue-400/30 bg-blue-400/10 text-blue-300";
  } else if (
    normalized === "SHIPPED"
  ) {
    classes =
      "border-violet-400/30 bg-violet-400/10 text-violet-300";
  } else if (
    normalized === "CANCELLED"
  ) {
    classes =
      "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${classes}`}
    >
      {normalized || "UNKNOWN"}
    </span>
  );
}

function RewardImage({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const [failed, setFailed] =
    useState(false);

  useEffect(
    function () {
      setFailed(false);
    },
    [src]
  );

  if (!src || failed) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-3xl">
        🎁
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 bg-slate-900 object-cover"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() =>
        setFailed(true)
      }
    />
  );
}

function extractDriveFileId(
  value: string
) {
  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/i,
    /\/file\/d\/([a-zA-Z0-9_-]+)/i,
    /\/d\/([a-zA-Z0-9_-]+)/i,
    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      value.match(pattern);

    if (
      match &&
      match[1]
    ) {
      return match[1];
    }
  }

  return "";
}

function getImageSrc(
  value: string
) {
  const source =
    String(
      value || ""
    ).trim();

  if (!source) {
    return "";
  }

  if (
    source.startsWith(
      "/api/drive-image"
    )
  ) {
    return source;
  }

  const fileId =
    extractDriveFileId(
      source
    );

  if (fileId) {
    return (
      "/api/drive-image?id=" +
      encodeURIComponent(
        fileId
      )
    );
  }

  return source;
}

function formatDateTime(
  value?: string
) {
  if (!value) {
    return "-";
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
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatNumber(
  value: unknown
) {
  return Number(
    value || 0
  ).toLocaleString("en-MY");
}