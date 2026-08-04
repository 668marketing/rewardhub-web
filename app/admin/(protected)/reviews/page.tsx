"use client";

import {
  ArrowLeft,
  ArrowRight,
  Download,
  Eye,
  Loader2,
  MessageSquareReply,
  Pin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminMerchantReview,
  AdminReviewDetailData,
  AdminReviewFilters,
  AdminReviewsData,
  deleteAdminMerchantReview,
  getAdminMerchantReviewDetail,
  getAdminMerchantReviews,
  replyAdminMerchantReview,
  updateAdminMerchantReviewPinned,
  updateAdminMerchantReviewStatus,
} from "@/lib/admin-reviews";

type Filters = Required<
  Pick<
    AdminReviewFilters,
    | "search"
    | "status"
    | "rating"
    | "merchantId"
    | "replyStatus"
    | "pinned"
    | "sortBy"
    | "sortDirection"
    | "page"
    | "pageSize"
  >
>;

const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "ALL",
  rating: "ALL",
  merchantId: "ALL",
  replyStatus: "ALL",
  pinned: "ALL",
  sortBy: "CREATED_AT",
  sortDirection: "DESC",
  page: 1,
  pageSize: 25,
};

export default function AdminReviewsPage() {
  const [filters, setFilters] =
    useState<Filters>(
      DEFAULT_FILTERS
    );

  const [data, setData] =
    useState<AdminReviewsData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedId, setSelectedId] =
    useState("");

  const [detail, setDetail] =
    useState<AdminReviewDetailData | null>(
      null
    );

  const [detailLoading, setDetailLoading] =
    useState(false);

  const loadReviews =
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
            await getAdminMerchantReviews(
              filters
            );

          setData(result);
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load reviews."
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
          void loadReviews();
        },
        filters.search
          ? 350
          : 0
      );

    return () =>
      window.clearTimeout(timer);
  }, [
    loadReviews,
    filters.search,
  ]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let active = true;

    async function loadDetail() {
      try {
        setDetailLoading(true);
        setError("");

        const result =
          await getAdminMerchantReviewDetail(
            selectedId
          );

        if (active) {
          setDetail(result);
        }
      } catch (detailError) {
        if (active) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : "Unable to load review details."
          );
          setSelectedId("");
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [selectedId]);

  const reviews =
    data?.reviews || [];

  const pagination =
    data?.pagination || {
      page: 1,
      pageSize:
        filters.pageSize,
      total: 0,
      totalPages: 1,
      from: 0,
      to: 0,
    };

  const hasFilters =
    useMemo(
      () =>
        Boolean(
          filters.search ||
          filters.status !== "ALL" ||
          filters.rating !== "ALL" ||
          filters.merchantId !== "ALL" ||
          filters.replyStatus !== "ALL" ||
          filters.pinned !== "ALL"
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
        [key]:
          value,
        page:
          key === "page"
            ? Number(value)
            : 1,
      })
    );
  }

  function exportPage() {
    if (!reviews.length) {
      return;
    }

    const rows = [
      [
        "Review ID",
        "Member",
        "Member ID",
        "Merchant",
        "Merchant ID",
        "Rating",
        "Comment",
        "Merchant Reply",
        "Status",
        "Pinned",
        "Created At",
      ],
      ...reviews.map(
        (review) => [
          review.reviewId,
          review.memberName,
          review.memberId,
          review.merchantName,
          review.merchantId,
          review.rating,
          review.comment,
          review.merchantReply,
          review.status,
          review.isPinned,
          review.createdAt,
        ]
      ),
    ];

    const csv =
      rows
        .map((row) =>
          row
            .map((value) =>
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

    const url =
      URL.createObjectURL(
        new Blob([csv], {
          type:
            "text/csv;charset=utf-8;",
        })
      );

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `rewardhub-reviews-page-${pagination.page}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-7 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <Star className="h-4 w-4" />
              Reputation operations
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Reviews
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Review member feedback,
              merchant replies, visibility
              and featured testimonials.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void loadReviews(
                  true
                )
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
              onClick={exportPage}
              disabled={!reviews.length}
              className="flex h-11 items-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
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
            label="Total Reviews"
            value={formatNumber(
              data?.summary.total ||
                0
            )}
            note={`${formatNumber(
              data?.summary.published ||
                0
            )} published`}
            icon={Star}
          />

          <SummaryCard
            label="Average Rating"
            value={`${Number(
              data?.summary.averageRating ||
                0
            ).toFixed(1)} / 5`}
            note={`${formatNumber(
              data?.summary.fiveStar ||
                0
            )} five-star reviews`}
            icon={Star}
          />

          <SummaryCard
            label="Pending Reply"
            value={formatNumber(
              data?.summary.pendingReply ||
                0
            )}
            note={`${formatNumber(
              data?.summary.replied ||
                0
            )} replied`}
            icon={MessageSquareReply}
          />

          <SummaryCard
            label="Moderation"
            value={formatNumber(
              (data?.summary.hidden ||
                0) +
                (data?.summary.deleted ||
                  0)
            )}
            note={`${formatNumber(
              data?.summary.pinned ||
                0
            )} pinned`}
            icon={Pin}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                placeholder="Search review, member or merchant"
                className={
                  inputClass +
                  " pl-11"
                }
              />
            </div>

            <select
              value={filters.merchantId}
              onChange={(event) =>
                updateFilter(
                  "merchantId",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="ALL">
                All merchants
              </option>

              {(data?.filters.merchants ||
                []).map(
                (merchant) => (
                  <option
                    key={
                      merchant.merchantId
                    }
                    value={
                      merchant.merchantId
                    }
                  >
                    {
                      merchant.businessName
                    }
                  </option>
                )
              )}
            </select>

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
              value={filters.rating}
              onChange={(event) =>
                updateFilter(
                  "rating",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="ALL">
                All ratings
              </option>
              {[5, 4, 3, 2, 1].map(
                (rating) => (
                  <option
                    key={rating}
                    value={String(
                      rating
                    )}
                  >
                    {rating} stars
                  </option>
                )
              )}
            </select>

            <select
              value={
                filters.replyStatus
              }
              onChange={(event) =>
                updateFilter(
                  "replyStatus",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="ALL">
                All reply states
              </option>
              <option value="REPLIED">
                Replied
              </option>
              <option value="PENDING">
                Pending reply
              </option>
            </select>

            <select
              value={filters.pinned}
              onChange={(event) =>
                updateFilter(
                  "pinned",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="ALL">
                All pin states
              </option>
              <option value="PINNED">
                Pinned only
              </option>
              <option value="NOT_PINNED">
                Not pinned
              </option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(event) =>
                updateFilter(
                  "sortBy",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="CREATED_AT">
                Newest
              </option>
              <option value="RATING">
                Rating
              </option>
              <option value="MERCHANT">
                Merchant
              </option>
              <option value="MEMBER">
                Member
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              setFilters(
                DEFAULT_FILTERS
              )
            }
            disabled={!hasFilters}
            className="mt-3 h-11 rounded-xl border border-white/[0.08] px-5 text-sm text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
          >
            Reset
          </button>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/35">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                Review Directory
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                {data
                  ? `Showing ${pagination.from}–${pagination.to} of ${pagination.total}`
                  : "Loading reviews"}
              </p>
            </div>

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
                    {size} rows
                  </option>
                )
              )}
            </select>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
            </div>
          ) : !reviews.length ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <Star className="h-9 w-9 text-slate-700" />

              <h3 className="mt-4 font-medium text-slate-300">
                No reviews found
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Try changing the current
                filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.16em] text-slate-700">
                      <th className="px-6 py-4">
                        Review
                      </th>
                      <th className="px-4 py-4">
                        Member
                      </th>
                      <th className="px-4 py-4">
                        Merchant
                      </th>
                      <th className="px-4 py-4">
                        Rating
                      </th>
                      <th className="px-4 py-4">
                        Reply
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
                    {reviews.map(
                      (review) => (
                        <ReviewRow
                          key={
                            review.reviewId
                          }
                          review={
                            review
                          }
                          onView={() =>
                            setSelectedId(
                              review.reviewId
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/[0.07] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-600">
                  Page{" "}
                  {pagination.page} of{" "}
                  {
                    pagination.totalPages
                  }
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      pagination.page <=
                      1
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
                      pagination.page >=
                      pagination.totalPages
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

      {selectedId ? (
        <ReviewDrawer
          detail={detail}
          loading={detailLoading}
          onClose={() => {
            setSelectedId("");
            setDetail(null);
          }}
          onUpdated={(next) => {
            setDetail(next);
            void loadReviews(
              true
            );
          }}
          onDeleted={() => {
            setSelectedId("");
            setDetail(null);
            void loadReviews(
              true
            );
          }}
        />
      ) : null}
    </div>
  );
}

function ReviewRow({
  review,
  onView,
}: {
  review: AdminMerchantReview;
  onView: () => void;
}) {
  return (
    <tr className="text-sm transition hover:bg-white/[0.018]">
      <td className="max-w-md px-6 py-4">
        <div className="flex items-start gap-3">
          {review.isPinned ? (
            <Pin className="mt-0.5 h-4 w-4 shrink-0 fill-amber-300 text-amber-300" />
          ) : (
            <Star className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
          )}

          <div className="min-w-0">
            <p className="line-clamp-2 text-slate-200">
              {review.comment ||
                "No written comment"}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              {review.reviewId}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <p className="text-slate-300">
          {review.memberName}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {review.memberId}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="text-slate-300">
          {review.merchantName}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {review.merchantId}
        </p>
      </td>

      <td className="px-4 py-4">
        <RatingStars
          rating={review.rating}
        />
      </td>

      <td className="px-4 py-4">
        <span
          className={
            review.merchantReply
              ? "text-emerald-300"
              : "text-amber-300"
          }
        >
          {review.merchantReply
            ? "Replied"
            : "Pending"}
        </span>
      </td>

      <td className="px-4 py-4">
        <StatusBadge
          status={review.status}
        />
      </td>

      <td className="px-4 py-4 text-slate-500">
        {formatDateTime(
          review.createdAt
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

function ReviewDrawer({
  detail,
  loading,
  onClose,
  onUpdated,
  onDeleted,
}: {
  detail: AdminReviewDetailData | null;
  loading: boolean;
  onClose: () => void;
  onUpdated: (
    next: AdminReviewDetailData
  ) => void;
  onDeleted: () => void;
}) {
  const [saving, setSaving] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const [replyMode, setReplyMode] =
    useState(false);

  const [hideMode, setHideMode] =
    useState(false);

  const [deleteMode, setDeleteMode] =
    useState(false);

  const [reply, setReply] =
    useState("");

  const [adminNote, setAdminNote] =
    useState("");

  const review =
    detail?.review;

  useEffect(() => {
    setReply(
      review?.merchantReply ||
        ""
    );
    setAdminNote(
      review?.adminNote || ""
    );
  }, [review]);

  async function saveReply() {
    if (!review) {
      return;
    }

    if (!reply.trim()) {
      setActionError(
        "Reply cannot be empty."
      );
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      const next =
        await replyAdminMerchantReview(
          review.reviewId,
          reply.trim(),
          adminNote.trim()
        );

      onUpdated(next);
      setReplyMode(false);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to save reply."
      );
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(
    status:
      | "Published"
      | "Hidden"
  ) {
    if (!review) {
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      const next =
        await updateAdminMerchantReviewStatus(
          review.reviewId,
          status,
          adminNote.trim()
        );

      onUpdated(next);
      setHideMode(false);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update review status."
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePinned() {
    if (!review) {
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      const next =
        await updateAdminMerchantReviewPinned(
          review.reviewId,
          !review.isPinned
        );

      onUpdated(next);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update pinned status."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeReview() {
    if (!review) {
      return;
    }

    if (
      adminNote.trim().length <
      3
    ) {
      setActionError(
        "Please enter a deletion reason."
      );
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      await deleteAdminMerchantReview(
        review.reviewId,
        adminNote.trim()
      );

      onDeleted();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to delete review."
      );
    } finally {
      setSaving(false);
    }
  }

  const isPublished =
    review?.status ===
    "Published";

  const isHidden =
    review?.status ===
    "Hidden";

  const isDeleted =
    review?.status ===
    "Deleted";

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-white/[0.09] bg-slate-950">
        <header className="flex items-start justify-between border-b border-white/[0.08] px-7 py-5">
          <div>
            <h2 className="text-xl font-semibold">
              Review details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {review?.reviewId ||
                "Loading review"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 transition hover:bg-white/[0.05]"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {loading ||
          !detail ||
          !review ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
            </div>
          ) : (
            <div className="space-y-5">
              <Panel title="Review">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <RatingStars
                    rating={
                      review.rating
                    }
                    large
                  />

                  <StatusBadge
                    status={
                      review.status
                    }
                  />
                </div>

                <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                  {review.comment ||
                    "No written comment"}
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Info
                    label="Created"
                    value={formatDateTime(
                      review.createdAt
                    )}
                  />
                  <Info
                    label="Transaction"
                    value={
                      review.transactionId ||
                      "—"
                    }
                  />
                </div>
              </Panel>

              <div className="grid gap-5 md:grid-cols-2">
                <Panel title="Member">
                  <div className="flex items-center gap-3">
                    <UserRound className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium">
                        {
                          review.memberName
                        }
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {
                          review.memberId
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <Info
                      label="Email"
                      value={
                        review.memberEmail ||
                        "—"
                      }
                    />
                    <Info
                      label="Phone"
                      value={
                        review.memberPhone ||
                        "—"
                      }
                    />
                    <Info
                      label="Tier"
                      value={
                        review.memberTier ||
                        "—"
                      }
                    />
                  </div>
                </Panel>

                <Panel title="Merchant">
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium">
                        {
                          review.merchantName
                        }
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {
                          review.merchantId
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <Info
                      label="Email"
                      value={
                        review.merchantEmail ||
                        "—"
                      }
                    />
                    <Info
                      label="Phone"
                      value={
                        review.merchantPhone ||
                        "—"
                      }
                    />
                    <Info
                      label="Category"
                      value={
                        review.merchantCategory ||
                        "—"
                      }
                    />
                  </div>
                </Panel>
              </div>

              <Panel title="Merchant Reply">
                {review.merchantReply ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                    {
                      review.merchantReply
                    }
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">
                    No reply has been
                    submitted.
                  </p>
                )}
              </Panel>

              {detail.transaction ? (
                <Panel title="Transaction">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Info
                      label="Transaction ID"
                      value={
                        detail.transaction
                          .transactionId
                      }
                    />
                    <Info
                      label="Amount"
                      value={formatCurrency(
                        detail.transaction
                          .amount
                      )}
                    />
                    <Info
                      label="Payment Method"
                      value={
                        detail.transaction
                          .paymentMethod ||
                        "—"
                      }
                    />
                    <Info
                      label="Status"
                      value={
                        detail.transaction
                          .status ||
                        "—"
                      }
                    />
                  </div>
                </Panel>
              ) : null}
            </div>
          )}
        </div>

        {review ? (
          <footer className="border-t border-white/[0.08] bg-slate-950 px-7 py-5">
            {actionError ? (
              <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {actionError}
              </div>
            ) : null}

            {replyMode ? (
              <div className="space-y-3">
                <textarea
                  value={reply}
                  onChange={(event) =>
                    setReply(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Write the merchant reply"
                  className={
                    inputClass +
                    " h-auto py-3"
                  }
                />

                <textarea
                  value={adminNote}
                  onChange={(event) =>
                    setAdminNote(
                      event.target.value
                    )
                  }
                  rows={2}
                  placeholder="Admin note (optional)"
                  className={
                    inputClass +
                    " h-auto py-3"
                  }
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      setReplyMode(
                        false
                      )
                    }
                    className={
                      secondaryButtonClass
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void saveReply()
                    }
                    className={
                      primaryButtonClass
                    }
                  >
                    Save reply
                  </button>
                </div>
              </div>
            ) : hideMode ||
              deleteMode ? (
              <div className="space-y-3">
                <textarea
                  value={adminNote}
                  onChange={(event) =>
                    setAdminNote(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder={
                    deleteMode
                      ? "Deletion reason"
                      : "Admin note (optional)"
                  }
                  className={
                    inputClass +
                    " h-auto py-3"
                  }
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setHideMode(
                        false
                      );
                      setDeleteMode(
                        false
                      );
                    }}
                    className={
                      secondaryButtonClass
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      deleteMode
                        ? void removeReview()
                        : void setStatus(
                            "Hidden"
                          )
                    }
                    className={
                      deleteMode
                        ? dangerButtonClass
                        : primaryButtonClass
                    }
                  >
                    {deleteMode
                      ? "Delete review"
                      : "Hide review"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={
                    saving ||
                    isDeleted
                  }
                  onClick={() =>
                    setReplyMode(
                      true
                    )
                  }
                  className={
                    primaryButtonClass
                  }
                >
                  {review.merchantReply
                    ? "Edit Reply"
                    : "Reply"}
                </button>

                <button
                  type="button"
                  disabled={
                    saving ||
                    !isPublished
                  }
                  onClick={() =>
                    void togglePinned()
                  }
                  className="h-12 rounded-xl border border-amber-400/20 bg-amber-400/10 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {review.isPinned
                    ? "Unpin Review"
                    : "Pin Review"}
                </button>

                {isHidden ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void setStatus(
                        "Published"
                      )
                    }
                    className={
                      secondaryButtonClass
                    }
                  >
                    Restore Review
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={
                      saving ||
                      !isPublished
                    }
                    onClick={() =>
                      setHideMode(
                        true
                      )
                    }
                    className={
                      secondaryButtonClass
                    }
                  >
                    {isPublished
                      ? "Hide Review"
                      : "Hidden"}
                  </button>
                )}

                <button
                  type="button"
                  disabled={
                    saving ||
                    isDeleted
                  }
                  onClick={() =>
                    setDeleteMode(
                      true
                    )
                  }
                  className={
                    dangerButtonClass
                  }
                >
                  <Trash2 className="mr-2 inline h-4 w-4" />
                  {isDeleted
                    ? "Deleted"
                    : "Delete Review"}
                </button>
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
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025]">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {note}
      </p>
    </div>
  );
}

function Panel({
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

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.15em] text-slate-700">
        {label}
      </p>
      <p className="mt-2 break-words text-sm text-slate-300">
        {value}
      </p>
    </div>
  );
}

function RatingStars({
  rating,
  large = false,
}: {
  rating: number;
  large?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(
        (value) => (
          <Star
            key={value}
            className={[
              large
                ? "h-6 w-6"
                : "h-4 w-4",
              value <= rating
                ? "fill-amber-300 text-amber-300"
                : "text-slate-700",
            ].join(" ")}
          />
        )
      )}
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
    normalized === "PUBLISHED"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "HIDDEN"
      ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
      : "border-red-400/20 bg-red-400/10 text-red-300";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {status || "—"}
    </span>
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
    }
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
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone:
        "Asia/Kuala_Lumpur",
    }
  ).format(date);
}

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/65 px-4 text-sm text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-emerald-400/40";

const pageButtonClass =
  "inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30";

const primaryButtonClass =
  "h-12 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButtonClass =
  "h-12 rounded-xl border border-white/[0.08] bg-white/[0.025] text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-35";

const dangerButtonClass =
  "h-12 rounded-xl border border-red-400/20 bg-red-400/10 text-sm font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-35";
