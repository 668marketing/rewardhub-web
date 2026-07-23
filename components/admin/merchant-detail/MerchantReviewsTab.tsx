"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  MessageSquareText,
  Pin,
  PinOff,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import {
  useRouter,
} from "next/navigation";

import {
  deleteAdminMerchantReview,
  replyAdminMerchantReview,
  updateAdminMerchantReviewPinned,
  updateAdminMerchantReviewStatus,
} from "@/lib/admin-merchant-detail";

import type {
  AdminMerchantReview,
  AdminMerchantReviewStatus,
} from "@/lib/admin-merchant-detail";

type MerchantReviewsTabProps = {
  merchantId: string;

  reviews: {
    total: number;
    averageRating: number;
    items: AdminMerchantReview[];
  };

  onUpdated?: () => Promise<void> | void;
};

type Feedback = {
  type:
    | "success"
    | "error";
  message: string;
} | null;

export default function MerchantReviewsTab({
  merchantId,
  reviews,
  onUpdated,
}: MerchantReviewsTabProps) {
  const router =
    useRouter();

  const [
    isRefreshing,
    startRefresh,
  ] = useTransition();

  const items =
    Array.isArray(
      reviews?.items
    )
      ? reviews.items
      : [];

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("ALL");

  const [
    ratingFilter,
    setRatingFilter,
  ] =
    useState("ALL");

  const [
    busyReviewId,
    setBusyReviewId,
  ] =
    useState("");

  const [
    feedback,
    setFeedback,
  ] =
    useState<Feedback>(
      null
    );

  const summary =
    useMemo(() => {
      const published =
        items.filter(
          (review) =>
            normalizeStatus(
              review.status
            ) ===
            "PUBLISHED"
        );

      const ratingTotal =
        published.reduce(
          (total, review) =>
            total +
            Number(
              review.rating || 0
            ),
          0
        );

      return {
        total:
          items.length,

        published:
          published.length,

        hidden:
          items.filter(
            (review) =>
              normalizeStatus(
                review.status
              ) ===
              "HIDDEN"
          ).length,

        pinned:
          items.filter(
            (review) =>
              Boolean(
                review.isPinned
              )
          ).length,

        pendingReplies:
          published.filter(
            (review) =>
              !String(
                review.merchantReply ||
                ""
              ).trim()
          ).length,

        averageRating:
          published.length > 0
            ? ratingTotal /
              published.length
            : 0,
      };
    }, [items]);

  const filtered =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return items.filter(
        (review) => {
          const status =
            normalizeStatus(
              review.status
            );

          if (
            statusFilter !==
              "ALL" &&
            status !==
              statusFilter
          ) {
            return false;
          }

          if (
            ratingFilter !==
              "ALL" &&
            Number(
              review.rating || 0
            ) !==
              Number(
                ratingFilter
              )
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          return [
            review.reviewId,
            review.transactionId,
            review.memberId,
            review.memberName,
            review.comment,
            review.merchantReply,
          ]
            .join(" ")
            .toLowerCase()
            .includes(
              keyword
            );
        }
      );
    }, [
      items,
      search,
      statusFilter,
      ratingFilter,
    ]);

  async function runAction(
    reviewId: string,
    action: () => Promise<void>,
    successMessage: string
  ) {
    setBusyReviewId(
      reviewId
    );

    setFeedback(null);

    try {
      await action();

      setFeedback({
        type: "success",
        message:
          successMessage,
      });

      if (onUpdated) {
  await onUpdated();
} else {
  startRefresh(() => {
    router.refresh();
  });
}
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update review.",
      });
    } finally {
      setBusyReviewId("");
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <SummaryCard
          title="Average Rating"
          value={
            summary.averageRating.toFixed(
              1
            )
          }
          icon={Star}
        />

        <SummaryCard
          title="Total Reviews"
          value={String(
            summary.total
          )}
          icon={
            MessageSquareText
          }
        />

        <SummaryCard
          title="Published"
          value={String(
            summary.published
          )}
          icon={
            CheckCircle2
          }
        />

        <SummaryCard
          title="Pending Replies"
          value={String(
            summary.pendingReplies
          )}
          icon={
            MessageSquareText
          }
        />

        <SummaryCard
          title="Pinned"
          value={String(
            summary.pinned
          )}
          icon={Pin}
        />
      </div>

      <div className="rounded-[1.5rem] border border-slate-800 bg-[#071126] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search member, comment or review ID"
              className="h-12 w-full rounded-2xl border border-slate-800 bg-[#050d1e] pl-11 pr-4 text-sm font-semibold text-white outline-none focus:border-emerald-400"
            />
          </label>

          <select
            value={
              statusFilter
            }
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-12 rounded-2xl border border-slate-800 bg-[#050d1e] px-4 text-sm font-semibold text-slate-300 outline-none"
          >
            <option value="ALL">
              All Statuses
            </option>
            <option value="PUBLISHED">
              Published
            </option>
            <option value="HIDDEN">
              Hidden
            </option>
            <option value="DELETED">
              Deleted
            </option>
          </select>

          <select
            value={
              ratingFilter
            }
            onChange={(event) =>
              setRatingFilter(
                event.target.value
              )
            }
            className="h-12 rounded-2xl border border-slate-800 bg-[#050d1e] px-4 text-sm font-semibold text-slate-300 outline-none"
          >
            <option value="ALL">
              All Ratings
            </option>
            {[5, 4, 3, 2, 1].map(
              (rating) => (
                <option
                  key={rating}
                  value={rating}
                >
                  {rating} Star
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {feedback ? (
        <div
          className={[
            "rounded-2xl border p-4 text-sm",
            feedback.type ===
            "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-red-400/20 bg-red-400/10 text-red-300",
          ].join(" ")}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="space-y-4">
        {filtered.length ===
        0 ? (
          <div className="rounded-[1.5rem] border border-slate-800 bg-[#071126] px-6 py-16 text-center">
            <MessageSquareText className="mx-auto h-10 w-10 text-slate-700" />

            <h3 className="mt-4 font-bold text-white">
              No reviews found
            </h3>
          </div>
        ) : (
          filtered.map(
            (review) => (
              <ReviewCard
                key={
                  review.reviewId
                }
                review={
                  review
                }
                isBusy={
                  busyReviewId ===
                    review.reviewId ||
                  isRefreshing
                }
                onReply={(
                  reply
                ) =>
                  runAction(
                    review.reviewId,
                    () =>
                      replyAdminMerchantReview(
                        merchantId,
                        review.reviewId,
                        reply
                      ),
                    "Review reply saved."
                  )
                }
                onTogglePin={() =>
                  runAction(
                    review.reviewId,
                    () =>
                      updateAdminMerchantReviewPinned(
                        merchantId,
                        review.reviewId,
                        !review.isPinned
                      ),
                    review.isPinned
                      ? "Review unpinned."
                      : "Review pinned."
                  )
                }
                onStatus={(
                  status,
                  reason
                ) =>
                  runAction(
                    review.reviewId,
                    () =>
                      updateAdminMerchantReviewStatus(
                        merchantId,
                        review.reviewId,
                        status,
                        reason
                      ),
                    "Review status updated."
                  )
                }
                onDelete={(
                  reason
                ) =>
                  runAction(
                    review.reviewId,
                    () =>
                      deleteAdminMerchantReview(
                        merchantId,
                        review.reviewId,
                        reason
                      ),
                    "Review deleted."
                  )
                }
              />
            )
          )
        )}
      </div>
    </section>
  );
}

function ReviewCard({
  review,
  isBusy,
  onReply,
  onTogglePin,
  onStatus,
  onDelete,
}: {
  review:
    AdminMerchantReview;
  isBusy: boolean;
  onReply: (
    reply: string
  ) => Promise<void>;
  onTogglePin:
    () => Promise<void>;
  onStatus: (
    status:
      AdminMerchantReviewStatus,
    reason: string
  ) => Promise<void>;
  onDelete: (
    reason: string
  ) => Promise<void>;
}) {
  const [
    reply,
    setReply,
  ] =
    useState(
      review.merchantReply ||
      ""
    );

  return (
    <article className="rounded-[1.5rem] border border-slate-800 bg-[#071126] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-white">
              {review.memberName ||
                "Member"}
            </p>

            <ReviewStatusBadge
              status={
                normalizeStatus(
                  review.status
                )
              }
            />

            {review.isPinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex items-center gap-1">
            {Array.from({
              length: 5,
            }).map(
              (_, index) => (
                <Star
                  key={index}
                  className={[
                    "h-4 w-4",
                    index <
                    Number(
                      review.rating ||
                      0
                    )
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-700",
                  ].join(" ")}
                />
              )
            )}
          </div>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            {review.comment ||
              "No written comment."}
          </p>

          <p className="mt-3 text-[11px] text-slate-600">
            {review.reviewId} ·{" "}
            {formatDateTime(
              review.createdAt
            )}
          </p>
        </div>

        <button
          type="button"
          disabled={isBusy}
          onClick={
            onTogglePin
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 text-xs font-bold text-slate-300 disabled:opacity-50"
        >
          {review.isPinned ? (
            <PinOff className="h-4 w-4" />
          ) : (
            <Pin className="h-4 w-4" />
          )}

          {review.isPinned
            ? "Unpin"
            : "Pin"}
        </button>
      </div>

      <div className="mt-5 border-t border-slate-800 pt-5">
        <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
          Merchant Reply
        </label>

        <textarea
          value={reply}
          disabled={isBusy}
          onChange={(event) =>
            setReply(
              event.target.value
            )
          }
          rows={3}
          className="mt-2 w-full resize-none rounded-2xl border border-slate-800 bg-[#050d1e] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:opacity-50"
        />

        <button
  type="button"
  disabled={
    isBusy ||
    !reply.trim()
  }
  onClick={() =>
    onReply(
      reply.trim()
    )
  }
  className="mt-3 h-11 rounded-xl bg-emerald-400 px-5 text-xs font-bold text-slate-950 disabled:opacity-50"
>
  {review.merchantReply
    ? "Update Reply"
    : "Save Reply"}
</button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
        {normalizeStatus(
          review.status
        ) !== "PUBLISHED" ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              onStatus(
                "PUBLISHED",
                ""
              )
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-400/30 px-4 text-xs font-bold text-emerald-300 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Publish
          </button>
        ) : (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              const reason =
                window.prompt(
                  "Reason for hiding this review:"
                );

              if (
                reason &&
                reason.trim()
                  .length >= 3
              ) {
                onStatus(
                  "HIDDEN",
                  reason.trim()
                );
              }
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-400/30 px-4 text-xs font-bold text-amber-300 disabled:opacity-50"
          >
            <EyeOff className="h-4 w-4" />
            Hide
          </button>
        )}

        {normalizeStatus(
          review.status
        ) !== "DELETED" ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              const reason =
                window.prompt(
                  "Reason for deleting this review:"
                );

              if (
                reason &&
                reason.trim()
                  .length >= 3
              ) {
                onDelete(
                  reason.trim()
                );
              }
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-400/30 px-4 text-xs font-bold text-red-300 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        ) : null}

        {isBusy ? (
          <span className="inline-flex items-center gap-2 text-xs text-slate-500">
            <AlertTriangle className="h-4 w-4" />
            Updating…
          </span>
        ) : null}
      </div>
    </article>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon:
    React.ComponentType<{
      className?: string;
    }>;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-[#071126] p-5">
      <Icon className="h-5 w-5 text-emerald-300" />

      <p className="mt-4 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function ReviewStatusBadge({
  status,
}: {
  status:
    AdminMerchantReviewStatus;
}) {
  const classes =
    status === "PUBLISHED"
      ? "bg-emerald-400/10 text-emerald-300"
      : status === "HIDDEN"
        ? "bg-amber-400/10 text-amber-300"
        : "bg-red-400/10 text-red-300";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${classes}`}
    >
      {status}
    </span>
  );
}

function normalizeStatus(
  value: unknown
): AdminMerchantReviewStatus {
  const status =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    status === "HIDDEN" ||
    status === "INACTIVE"
  ) {
    return "HIDDEN";
  }

  if (
    status === "DELETED" ||
    status === "REMOVED"
  ) {
    return "DELETED";
  }

  return "PUBLISHED";
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