"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Store,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminMerchantApplication,
  AdminMerchantApplicationListData,
  approveAdminMerchantApplication,
  getAdminMerchantApplicationDetail,
  getAdminMerchantApplications,
  rejectAdminMerchantApplication,
} from "@/lib/admin-merchant-applications";

const PAGE_SIZES = [
  10,
  25,
  50,
  100,
  200,
];

const APPROVE_REVIEW_OPTIONS = [
  "Business information verified",
  "Registration details verified",
  "Approved pending profile completion",
  "Approved with follow-up required",
];

const REJECT_REASON_OPTIONS = [
  "Business information is incomplete",
  "Business information cannot be verified",
  "Required documents are incomplete",
  "Invalid contact information",
  "Duplicate merchant application",
  "Unsupported business category",
  "Bank information is incomplete",
];

const OTHER_OPTION = "OTHER";

export default function AdminMerchantApplicationsPage() {
  const [data, setData] =
    useState<AdminMerchantApplicationListData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("PENDING");

  const [category, setCategory] =
    useState("ALL");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(25);

  const [selected, setSelected] =
    useState<AdminMerchantApplication | null>(
      null
    );

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [dialog, setDialog] =
    useState<"approve" | "reject" | null>(
      null
    );

  const [reviewNote, setReviewNote] =
    useState("");

  const [
    customReviewNote,
    setCustomReviewNote,
  ] = useState("");

  const [rejectReason, setRejectReason] =
    useState("");

  const [
    customRejectReason,
    setCustomRejectReason,
  ] = useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const loadApplications =
    useCallback(
      async (
        showRefreshLoader = false
      ) => {
        try {
          if (showRefreshLoader) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const result =
            await getAdminMerchantApplications({
              search,
              status,
              category,
              dateFrom,
              dateTo,
              page,
              pageSize,
            });

          setData(result);

          if (
            result.pagination.page !==
            page
          ) {
            setPage(
              result.pagination.page
            );
          }
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load merchant applications."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        search,
        status,
        category,
        dateFrom,
        dateTo,
        page,
        pageSize,
      ]
    );

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setPage(1);
        setSearch(
          searchInput.trim()
        );
      }, 350);

    return () =>
      window.clearTimeout(timer);
  }, [searchInput]);

  const applications =
    data?.applications || [];

  const categories =
    data?.categories || [];

  const summary =
    data?.summary;

  const pagination =
    data?.pagination;

  const hasFilters =
    Boolean(
      search ||
        status !== "PENDING" ||
        category !== "ALL" ||
        dateFrom ||
        dateTo
    );

  const pageDescription =
    useMemo(() => {
      if (!pagination) {
        return "Loading merchant applications…";
      }

      if (
        pagination.totalItems === 0
      ) {
        return "No applications match the current filters.";
      }

      return `Showing ${pagination.showingFrom}–${pagination.showingTo} of ${pagination.totalItems} matching applications`;
    }, [pagination]);

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("PENDING");
    setCategory("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  async function openDetail(
    application: AdminMerchantApplication
  ) {
    setSelected(application);
    setDetailLoading(true);
    setActionError("");

    try {
      const detail =
        await getAdminMerchantApplicationDetail(
          application.merchantId
        );

      setSelected(detail);
    } catch (detailError) {
      setActionError(
        detailError instanceof Error
          ? detailError.message
          : "Unable to load merchant application details."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    if (actionLoading) {
      return;
    }

    setSelected(null);
    setDialog(null);
    setReviewNote("");
    setCustomReviewNote("");
    setRejectReason("");
    setCustomRejectReason("");
    setActionError("");
  }

  function openDialog(
    nextDialog: "approve" | "reject"
  ) {
    setReviewNote("");
    setCustomReviewNote("");
    setRejectReason("");
    setCustomRejectReason("");
    setActionError("");
    setDialog(nextDialog);
  }

  async function submitAction() {
    if (!selected || !dialog) {
      return;
    }

    const finalReviewNote =
      reviewNote === OTHER_OPTION
        ? customReviewNote.trim()
        : reviewNote.trim();

    const finalRejectReason =
      rejectReason === OTHER_OPTION
        ? customRejectReason.trim()
        : rejectReason.trim();

    if (
      dialog === "approve" &&
      reviewNote === OTHER_OPTION &&
      finalReviewNote.length < 3
    ) {
      setActionError(
        "Please enter a custom review note."
      );
      return;
    }

    if (
      dialog === "reject" &&
      finalRejectReason.length < 5
    ) {
      setActionError(
        "Please select or enter a reject reason with at least 5 characters."
      );
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");

      const updated =
        dialog === "approve"
          ? await approveAdminMerchantApplication(
              selected.merchantId,
              finalReviewNote
            )
          : await rejectAdminMerchantApplication(
              selected.merchantId,
              finalRejectReason,
              finalReviewNote
            );

      setSelected(updated);
      setDialog(null);
      setReviewNote("");
      setCustomReviewNote("");
      setRejectReason("");
      setCustomRejectReason("");

      await loadApplications(true);
    } catch (actionSubmitError) {
      setActionError(
        actionSubmitError instanceof Error
          ? actionSubmitError.message
          : "Unable to update merchant application."
      );
    } finally {
      setActionLoading(false);
    }
  }

  function exportCurrentPage() {
    if (!applications.length) {
      return;
    }

    const headers = [
      "Merchant ID",
      "Business Name",
      "Owner Name",
      "Login Email",
      "Phone",
      "Category",
      "Sub Category",
      "State",
      "Area",
      "Status",
      "Referred By Member",
      "Submitted At",
      "Reviewed By",
      "Reviewed At",
      "Reject Reason",
    ];

    const rows =
      applications.map(
        (application) => [
          application.merchantId,
          application.businessName,
          application.ownerName,
          application.loginEmail,
          application.phone,
          application.category,
          application.subCategory,
          application.state,
          application.area,
          application.status,
          application.referredByMember,
          application.submittedAt,
          application.reviewedBy,
          application.reviewedAt,
          application.rejectReason,
        ]
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            escapeCsvValue(value)
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

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `rewardhub-merchant-applications-page-${page}.csv`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  if (loading && !data) {
    return (
      <PageLoading />
    );
  }

  if (error && !data) {
    return (
      <PageError
        message={error}
        onRetry={() =>
          void loadApplications()
        }
      />
    );
  }

  return (
    <>
      <div className="space-y-7 pb-12">
        <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Building2 className="h-4 w-4" />
              Merchant onboarding
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Merchant Applications
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Review new merchant registrations,
              verify business information and
              approve or reject applications.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={refreshing}
              onClick={() =>
                void loadApplications(
                  true
                )
              }
              className="flex h-12 items-center gap-2 rounded-2xl border border-white/[0.08] bg-slate-900/60 px-5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
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
              disabled={
                applications.length ===
                0
              }
              className="flex h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Export page
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Building2}
            label="Total Applications"
            value={formatNumber(
              summary?.total || 0
            )}
            description={`${formatNumber(
              summary?.newToday || 0
            )} submitted today`}
          />

          <StatCard
            icon={AlertTriangle}
            label="Pending Review"
            value={formatNumber(
              summary?.pending || 0
            )}
            description="Require admin action"
          />

          <StatCard
            icon={UserCheck}
            label="Approved"
            value={formatNumber(
              summary?.active || 0
            )}
            description="Activated merchant accounts"
          />

          <StatCard
            icon={XCircle}
            label="Rejected"
            value={formatNumber(
              summary?.rejected || 0
            )}
            description={`${formatNumber(
              summary?.other || 0
            )} other statuses`}
          />
        </section>

        <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-4 sm:p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.5fr)_190px_220px_170px_170px_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                placeholder="Search ID, business, owner, email, phone or referrer"
                className="h-12 w-full rounded-2xl border border-white/[0.08] bg-slate-950/50 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value
                );
                setPage(1);
              }}
              className={filterClass}
            >
              <option value="ALL">
                All statuses
              </option>
              <option value="PENDING">
                Pending
              </option>
              <option value="ACTIVE">
                Approved
              </option>
              <option value="REJECTED">
                Rejected
              </option>
              <option value="SUSPENDED">
                Suspended
              </option>
              <option value="INACTIVE">
                Inactive
              </option>
            </select>

            <select
              value={category}
              onChange={(event) => {
                setCategory(
                  event.target.value
                );
                setPage(1);
              }}
              className={filterClass}
            >
              <option value="ALL">
                All categories
              </option>

              {categories.map(
                (categoryName) => (
                  <option
                    key={categoryName}
                    value={categoryName}
                  >
                    {categoryName}
                  </option>
                )
              )}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(
                  event.target.value
                );
                setPage(1);
              }}
              className={filterClass}
            />

            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(
                  event.target.value
                );
                setPage(1);
              }}
              className={filterClass}
            />

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-4 text-sm font-medium text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/50">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Application Queue
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                {pageDescription}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600">
                Rows
              </span>

              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(
                    Number(
                      event.target.value
                    )
                  );
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-white/[0.08] bg-slate-950/55 px-3 text-sm text-slate-300 outline-none"
              >
                {PAGE_SIZES.map(
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

          {applications.length ? (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-[1180px] w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-[0.16em] text-slate-600">
                      <th className="px-5 py-4">
                        Business
                      </th>
                      <th className="px-5 py-4">
                        Owner
                      </th>
                      <th className="px-5 py-4">
                        Category
                      </th>
                      <th className="px-5 py-4">
                        Referrer
                      </th>
                      <th className="px-5 py-4">
                        Status
                      </th>
                      <th className="px-5 py-4">
                        Submitted
                      </th>
                      <th className="px-5 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {applications.map(
                      (application) => (
                        <ApplicationRow
                          key={
                            application.merchantId
                          }
                          application={
                            application
                          }
                          onView={() =>
                            void openDetail(
                              application
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-white/[0.06] lg:hidden">
                {applications.map(
                  (application) => (
                    <ApplicationMobileCard
                      key={
                        application.merchantId
                      }
                      application={
                        application
                      }
                      onView={() =>
                        void openDetail(
                          application
                        )
                      }
                    />
                  )
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                <Building2 className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-base font-semibold text-white">
                No applications found
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                No merchant applications match
                the current search and filters.
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          )}

          {pagination &&
          pagination.totalItems > 0 ? (
            <div className="flex flex-col gap-4 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-600">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={
                    !pagination.hasPrevious
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex h-10 min-w-28 items-center justify-center rounded-xl bg-slate-950/45 px-4 text-sm text-slate-300">
                  {pagination.page} /{" "}
                  {pagination.totalPages}
                </div>

                <button
                  type="button"
                  aria-label="Next page"
                  disabled={
                    !pagination.hasNext
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        pagination.totalPages,
                        current + 1
                      )
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {selected ? (
        <DetailDrawer
          application={selected}
          loading={detailLoading}
          error={actionError}
          onClose={closeDetail}
          onApprove={() =>
            openDialog("approve")
          }
          onReject={() =>
            openDialog("reject")
          }
        />
      ) : null}

      {selected && dialog ? (
        <ActionDialog
          type={dialog}
          businessName={
            selected.businessName
          }
          reviewNote={reviewNote}
          customReviewNote={
            customReviewNote
          }
          rejectReason={rejectReason}
          customRejectReason={
            customRejectReason
          }
          loading={actionLoading}
          error={actionError}
          onReviewNoteChange={
            setReviewNote
          }
          onCustomReviewNoteChange={
            setCustomReviewNote
          }
          onRejectReasonChange={
            setRejectReason
          }
          onCustomRejectReasonChange={
            setCustomRejectReason
          }
          onCancel={() => {
            if (!actionLoading) {
              setDialog(null);
              setActionError("");
            }
          }}
          onConfirm={() =>
            void submitAction()
          }
        />
      ) : null}
    </>
  );
}

function ApplicationRow({
  application,
  onView,
}: {
  application: AdminMerchantApplication;
  onView: () => void;
}) {
  return (
    <tr className="border-b border-white/[0.055] text-sm transition last:border-b-0 hover:bg-white/[0.025]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <MerchantAvatar
            application={application}
          />

          <div className="min-w-0">
            <p className="max-w-64 truncate font-medium text-white">
              {application.businessName ||
                application.merchantId}
            </p>

            <p className="mt-1 max-w-64 truncate text-xs text-slate-600">
              {application.merchantId}
              {application.loginEmail
                ? ` · ${application.loginEmail}`
                : ""}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-slate-300">
          {application.ownerName ||
            "—"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {application.phone ||
            application.ownerPhone ||
            "No phone"}
        </p>
      </td>

      <td className="px-5 py-4 text-slate-400">
        <p>
          {application.category ||
            "Uncategorized"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {application.subCategory ||
            "—"}
        </p>
      </td>

      <td className="px-5 py-4 text-slate-400">
        <p>
          {application.referredByMemberName ||
            "Direct"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {application.referredByMember ||
            "No referrer"}
        </p>
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          status={application.status}
        />
      </td>

      <td className="px-5 py-4 text-slate-500">
        {formatDateTime(
          application.submittedAt
        )}
      </td>

      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-4 text-sm font-medium text-slate-300 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.06] hover:text-emerald-300"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
      </td>
    </tr>
  );
}

function ApplicationMobileCard({
  application,
  onView,
}: {
  application: AdminMerchantApplication;
  onView: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onView}
      className="block w-full p-5 text-left transition hover:bg-white/[0.025]"
    >
      <div className="flex items-start gap-3">
        <MerchantAvatar
          application={application}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-white">
              {application.businessName ||
                application.merchantId}
            </p>

            <StatusBadge
              status={
                application.status
              }
            />
          </div>

          <p className="mt-1 truncate text-xs text-slate-600">
            {application.merchantId}
          </p>

          <p className="mt-2 truncate text-xs text-slate-500">
            {application.ownerName ||
              "No owner name"}{" "}
            ·{" "}
            {application.category ||
              "Uncategorized"}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Submitted{" "}
            {formatDateTime(
              application.submittedAt
            )}
          </p>
        </div>

        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-700" />
      </div>
    </button>
  );
}

function DetailDrawer({
  application,
  loading,
  error,
  onClose,
  onApprove,
  onReject,
}: {
  application: AdminMerchantApplication;
  loading: boolean;
  error: string;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const pending =
    application.status.toUpperCase() ===
    "PENDING";

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-white/[0.08] bg-slate-950 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-400">
              Merchant application
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {application.businessName ||
                application.merchantId}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              {application.merchantId}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  status={
                    application.status
                  }
                />

                <span className="text-xs text-slate-600">
                  Submitted{" "}
                  {formatDateTime(
                    application.submittedAt
                  )}
                </span>
              </div>

              <DetailSection
                title="Business Information"
              >
                <DetailGrid>
                  <DetailItem
                    label="Business Name"
                    value={
                      application.businessName
                    }
                  />
                  <DetailItem
                    label="Display Name"
                    value={
                      application.displayName
                    }
                  />
                  <DetailItem
                    label="Category"
                    value={
                      application.category
                    }
                  />
                  <DetailItem
                    label="Sub Category"
                    value={
                      application.subCategory
                    }
                  />
                  <DetailItem
                    label="Marketing Budget"
                    value={`${Number(
                      application.marketingBudget ||
                        0
                    )}%`}
                  />
                  <DetailItem
                    label="Reward Credits"
                    value={
                      application.rewardCreditEnabled
                        ? `Enabled · ${application.maxRewardCreditPercent}% max`
                        : "Disabled"
                    }
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection
                title="Owner & Contact"
              >
                <DetailGrid>
                  <DetailItem
                    label="Owner Name"
                    value={
                      application.ownerName
                    }
                  />
                  <DetailItem
                    label="Login Email"
                    value={
                      application.loginEmail
                    }
                  />
                  <DetailItem
                    label="Phone"
                    value={
                      application.phone
                    }
                  />
                  <DetailItem
                    label="Owner Phone"
                    value={
                      application.ownerPhone
                    }
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection
                title="Location"
              >
                <DetailGrid>
                  <DetailItem
                    label="State"
                    value={
                      application.state
                    }
                  />
                  <DetailItem
                    label="Area"
                    value={
                      application.area
                    }
                  />
                </DetailGrid>

                <DetailItem
                  label="Address"
                  value={
                    application.address
                  }
                  fullWidth
                />
              </DetailSection>

              <DetailSection
                title="Referral"
              >
                <DetailGrid>
                  <DetailItem
                    label="Member ID"
                    value={
                      application.referredByMember ||
                      "Direct registration"
                    }
                  />
                  <DetailItem
                    label="Member Name"
                    value={
                      application.referredByMemberName ||
                      "—"
                    }
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection
                title="Bank Details"
              >
                <DetailGrid>
                  <DetailItem
                    label="Bank Name"
                    value={
                      application.bankName
                    }
                  />
                  <DetailItem
                    label="Account Name"
                    value={
                      application.bankAccountName
                    }
                  />
                  <DetailItem
                    label="Account Number"
                    value={
                      application.bankAccountNo
                    }
                  />
                  <DetailItem
                    label="Bank QR"
                    value={
                      application.bankQrUrl
                        ? "Uploaded"
                        : "Not uploaded"
                    }
                  />
                </DetailGrid>
              </DetailSection>

              {application.reviewedAt ||
              application.reviewNote ||
              application.rejectReason ? (
                <DetailSection
                  title="Review Record"
                >
                  <DetailGrid>
                    <DetailItem
                      label="Reviewed By"
                      value={
                        application.reviewedBy
                      }
                    />
                    <DetailItem
                      label="Reviewed At"
                      value={formatDateTime(
                        application.reviewedAt
                      )}
                    />
                  </DetailGrid>

                  <DetailItem
                    label="Review Note"
                    value={
                      application.reviewNote
                    }
                    fullWidth
                  />

                  {application.rejectReason ? (
                    <DetailItem
                      label="Reject Reason"
                      value={
                        application.rejectReason
                      }
                      fullWidth
                    />
                  ) : null}
                </DetailSection>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.08] p-5 sm:p-6">
          {pending ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onReject}
                disabled={loading}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 text-sm font-semibold text-red-300 transition hover:bg-red-400/15 disabled:opacity-40"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>

              <button
                type="button"
                onClick={onApprove}
                disabled={loading}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-center text-sm text-slate-500">
              This application has already
              been reviewed.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function ActionDialog({
  type,
  businessName,
  reviewNote,
  customReviewNote,
  rejectReason,
  customRejectReason,
  loading,
  error,
  onReviewNoteChange,
  onCustomReviewNoteChange,
  onRejectReasonChange,
  onCustomRejectReasonChange,
  onCancel,
  onConfirm,
}: {
  type: "approve" | "reject";
  businessName: string;
  reviewNote: string;
  customReviewNote: string;
  rejectReason: string;
  customRejectReason: string;
  loading: boolean;
  error: string;
  onReviewNoteChange: (
    value: string
  ) => void;
  onCustomReviewNoteChange: (
    value: string
  ) => void;
  onRejectReasonChange: (
    value: string
  ) => void;
  onCustomRejectReasonChange: (
    value: string
  ) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const approving =
    type === "approve";

  const finalRejectReason =
    rejectReason === OTHER_OPTION
      ? customRejectReason.trim()
      : rejectReason.trim();

  const confirmDisabled =
    loading ||
    (
      !approving &&
      finalRejectReason.length < 5
    ) ||
    (
      approving &&
      reviewNote === OTHER_OPTION &&
      customReviewNote.trim().length < 3
    );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            approving
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-red-400/10 text-red-300",
          ].join(" ")}
        >
          {approving ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <XCircle className="h-6 w-6" />
          )}
        </div>

        <h2 className="mt-5 text-xl font-semibold text-white">
          {approving
            ? "Approve merchant application?"
            : "Reject merchant application?"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {approving
            ? `${businessName} will be activated and can log in to the Merchant Portal.`
            : `${businessName} will not be able to access the Merchant Portal.`}
        </p>

        {type === "reject" ? (
          <div className="mt-5">
            <label className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Reject Reason *
            </label>

            <select
              value={rejectReason}
              onChange={(event) => {
                onRejectReasonChange(
                  event.target.value
                );

                if (
                  event.target.value !==
                  OTHER_OPTION
                ) {
                  onCustomRejectReasonChange(
                    ""
                  );
                }
              }}
              className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-slate-950/55 px-4 text-sm text-white outline-none focus:border-red-400/35 focus:ring-4 focus:ring-red-400/10"
            >
              <option value="">
                Select reject reason...
              </option>

              {REJECT_REASON_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}

              <option value={OTHER_OPTION}>
                Other...
              </option>
            </select>

            {rejectReason ===
            OTHER_OPTION ? (
              <div className="mt-3">
                <textarea
                  value={
                    customRejectReason
                  }
                  onChange={(event) =>
                    onCustomRejectReasonChange(
                      event.target.value
                    )
                  }
                  rows={4}
                  maxLength={1000}
                  placeholder="Enter the custom reject reason"
                  className="w-full resize-none rounded-2xl border border-white/[0.08] bg-slate-950/55 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-red-400/35 focus:ring-4 focus:ring-red-400/10"
                />

                <p className="mt-1 text-right text-xs text-slate-700">
                  {
                    customRejectReason.length
                  }
                  /1000
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5">
          <label className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Admin Review Note
          </label>

          <select
            value={reviewNote}
            onChange={(event) => {
              onReviewNoteChange(
                event.target.value
              );

              if (
                event.target.value !==
                OTHER_OPTION
              ) {
                onCustomReviewNoteChange(
                  ""
                );
              }
            }}
            className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-slate-950/55 px-4 text-sm text-white outline-none focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10"
          >
            <option value="">
              {approving
                ? "Select review note..."
                : "No internal note"}
            </option>

            {APPROVE_REVIEW_OPTIONS.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}

            <option value={OTHER_OPTION}>
              Other...
            </option>
          </select>

          {reviewNote ===
          OTHER_OPTION ? (
            <div className="mt-3">
              <textarea
                value={customReviewNote}
                onChange={(event) =>
                  onCustomReviewNoteChange(
                    event.target.value
                  )
                }
                rows={3}
                maxLength={1000}
                placeholder="Enter the custom admin review note"
                className="w-full resize-none rounded-2xl border border-white/[0.08] bg-slate-950/55 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10"
              />

              <p className="mt-1 text-right text-xs text-slate-700">
                {customReviewNote.length}
                /1000
              </p>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-12 rounded-2xl border border-white/[0.08] text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={[
              "flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
              approving
                ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                : "bg-red-300 text-slate-950 hover:bg-red-200",
            ].join(" ")}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : approving ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}

            {loading
              ? "Saving…"
              : approving
              ? "Approve"
              : "Reject"}
          </button>
        </div>
      </div>
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
    <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5">
      <h3 className="text-sm font-semibold text-white">
        {title}
      </h3>

      <div className="mt-4 space-y-4">
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

function DetailItem({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={
        fullWidth
          ? "sm:col-span-2"
          : ""
      }
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-700">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm leading-6 text-slate-300">
        {value || "—"}
      </p>
    </div>
  );
}

function MerchantAvatar({
  application,
}: {
  application: AdminMerchantApplication;
}) {
  const [imageError, setImageError] =
    useState(false);

  const normalizedLogoUrl =
    normalizeImageUrl(
      application.logoUrl
    );

  useEffect(() => {
    setImageError(false);
  }, [normalizedLogoUrl]);

  const initials =
    getInitials(
      application.businessName ||
        application.merchantId
    );

  if (
    normalizedLogoUrl &&
    !imageError
  ) {
    return (
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={normalizedLogoUrl}
          alt={
            application.businessName ||
            "Merchant logo"
          }
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() =>
            setImageError(true)
          }
        />
      </div>
    );
  }

  return (
    <div
      title={
        imageError
          ? "Merchant logo unavailable"
          : undefined
      }
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.08] text-sm font-semibold text-emerald-300"
    >
      {initials}
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

  const classes =
    normalized === "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "PENDING"
      ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
      : normalized === "REJECTED"
      ? "border-red-400/20 bg-red-400/10 text-red-300"
      : normalized === "SUSPENDED"
      ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
      : "border-slate-400/15 bg-slate-400/[0.07] text-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized === "ACTIVE"
        ? "APPROVED"
        : normalized || "INACTIVE"}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-slate-950/40 text-slate-400">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />

        <p className="mt-4 text-sm text-slate-500">
          Loading merchant applications…
        </p>
      </div>
    </div>
  );
}

function PageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-400/10 p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-lg font-semibold text-white">
          Unable to load applications
        </h2>

        <p className="mt-3 break-words text-sm leading-6 text-red-200/80">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-red-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-red-200"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  );
}

const filterClass =
  "h-12 w-full rounded-2xl border border-white/[0.08] bg-slate-950/50 px-4 text-sm text-slate-300 outline-none focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10";

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
    }
  ).format(date);
}

function normalizeImageUrl(
  value: string
) {
  const rawValue =
    String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  /*
   * Some Google Sheets cells may contain a formula-like value
   * or an accidental leading "=". Remove it before processing.
   */
  const url =
    rawValue.startsWith("=")
      ? rawValue.slice(1).trim()
      : rawValue;

  /*
   * Google Drive share link:
   * https://drive.google.com/file/d/FILE_ID/view
   */
  const driveFileMatch =
    url.match(
      /drive\.google\.com\/file\/d\/([^/?#]+)/
    );

  if (driveFileMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(
      driveFileMatch[1]
    )}`;
  }

  /*
   * Google Drive thumbnail links are often more reliable
   * for direct browser display.
   */
  const driveThumbnailMatch =
    url.match(
      /drive\.google\.com\/thumbnail\?id=([^&#]+)/
    );

  if (driveThumbnailMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
      driveThumbnailMatch[1]
    )}&sz=w300`;
  }

  try {
    const parsed =
      new URL(url);

    if (
      parsed.hostname.includes(
        "drive.google.com"
      )
    ) {
      const fileId =
        parsed.searchParams.get(
          "id"
        );

      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
          fileId
        )}&sz=w300`;
      }
    }
  } catch {
    /*
     * If the sheet stores only a Google Drive file ID.
     */
    if (
      /^[A-Za-z0-9_-]{20,}$/.test(
        url
      )
    ) {
      return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
        url
      )}&sz=w300`;
    }

    return "";
  }

  return url;
}

function getInitials(
  value: string
) {
  const words =
    String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!words.length) {
    return "M";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}

function escapeCsvValue(
  value: unknown
) {
  const text =
    String(value ?? "");

  return `"${text.replace(
    /"/g,
    '""'
  )}"`;
}