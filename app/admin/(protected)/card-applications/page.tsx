"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleX,
  Download,
  Eye,
  IdCard,
  Loader2,
  PackageCheck,
  Save,
  Send,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Truck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminCardApplication,
  AdminCardApplicationDetailData,
  AdminCardApplicationListData,
  CardApplicationAction,
  getAdminCardApplicationDetail,
  getAdminCardApplications,
  updateAdminCardApplication,
} from "@/lib/admin-card-applications";

type Filters = {
  search: string;
  status: string;
  applicationType: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
};

const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "ALL",
  applicationType: "ALL",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: 25,
};

export default function AdminCardApplicationsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [data, setData] = useState<AdminCardApplicationListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<AdminCardApplicationDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadApplications = useCallback(
    async (manual = false) => {
      try {
        setError("");
        manual ? setRefreshing(true) : setLoading(true);
        const result = await getAdminCardApplications(filters);
        setData(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load card applications."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () => loadApplications(),
      filters.search ? 350 : 0
    );
    return () => window.clearTimeout(timer);
  }, [loadApplications, filters.search]);

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
        const result = await getAdminCardApplicationDetail(selectedId);
        if (active) setDetail(result);
      } catch (detailError) {
        if (active) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : "Unable to load card application details."
          );
          setSelectedId("");
        }
      } finally {
        if (active) setDetailLoading(false);
      }
    }

    loadDetail();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const applications = data?.applications || [];
  const pagination = data?.pagination || {
    page: 1,
    pageSize: filters.pageSize,
    totalItems: 0,
    totalPages: 1,
    showingFrom: 0,
    showingTo: 0,
    hasPrevious: false,
    hasNext: false,
  };

  const hasFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
          filters.status !== "ALL" ||
          filters.applicationType !== "ALL" ||
          filters.dateFrom ||
          filters.dateTo
      ),
    [filters]
  );

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  }

  function exportPage() {
    if (!applications.length) return;
    const rows = [
      [
        "Application ID",
        "Member ID",
        "Member Name",
        "Application Type",
        "New Card ID",
        "Status",
        "Fee",
        "Payment Status",
        "Phone",
        "Email",
        "Address",
        "Courier",
        "Tracking Number",
        "Created At",
      ],
      ...applications.map((item) => [
        item.applicationId,
        item.memberId,
        item.fullName,
        item.applicationType,
        (item as any).newCardId || "",
        item.status,
        item.fee,
        item.paymentStatus,
        item.phone,
        item.email,
        item.fullAddress,
        item.courier,
        item.trackingNumber,
        item.createdAt,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `rewardhub-card-applications-page-${pagination.page}.csv`;
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
              <IdCard className="h-4 w-4" />
              Member card operations
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Card Applications
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Review physical card requests, replacement applications, delivery
              information and fulfilment status.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadApplications(true)}
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
              disabled={!applications.length}
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
            label="Total Applications"
            value={formatNumber(data?.summary.total || 0)}
            note={`${formatNumber(data?.summary.replacement || 0)} replacement requests`}
            icon={IdCard}
          />
          <SummaryCard
            label="Pending Review"
            value={formatNumber(data?.summary.pending || 0)}
            note="Applications requiring review"
            icon={CheckCircle2}
          />
          <SummaryCard
            label="In Fulfilment"
            value={formatNumber(
              (data?.summary.approved || 0) +
                (data?.summary.processing || 0) +
                (data?.summary.shipped || 0)
            )}
            note={`${formatNumber(data?.summary.shipped || 0)} shipped`}
            icon={Truck}
          />
          <SummaryCard
            label="Completed"
            value={formatNumber(data?.summary.completed || 0)}
            note={`${formatNumber(data?.summary.rejected || 0)} rejected`}
            icon={PackageCheck}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search application, member, email or phone"
                className={inputClass + " pl-11"}
              />
            </div>

            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              className={inputClass}
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={filters.applicationType}
              onChange={(event) =>
                updateFilter("applicationType", event.target.value)
              }
              className={inputClass}
            >
              <option value="ALL">All card types</option>
              <option value="FIRST_CARD">First Card</option>
              <option value="REPLACEMENT_CARD">Replacement Card</option>
            </select>

            <label className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => updateFilter("dateFrom", event.target.value)}
                className={inputClass + " pl-11"}
              />
            </label>

            <label className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
                className={inputClass + " pl-11"}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            disabled={!hasFilters}
            className="mt-3 h-11 rounded-xl border border-white/[0.08] px-5 text-sm text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
          >
            Reset
          </button>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/35">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Card Application Directory</h2>
              <p className="mt-1 text-xs text-slate-600">
                {data
                  ? `Showing ${pagination.showingFrom}–${pagination.showingTo} of ${pagination.totalItems}`
                  : "Loading card applications"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600">Rows</span>
              <select
                value={filters.pageSize}
                onChange={(event) =>
                  updateFilter("pageSize", Number(event.target.value))
                }
                className="h-10 rounded-xl border border-white/[0.08] bg-slate-950/70 px-3 text-sm text-slate-300 outline-none"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
            </div>
          ) : !applications.length ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <IdCard className="h-9 w-9 text-slate-700" />
              <h3 className="mt-4 font-medium text-slate-300">
                No card applications found
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Try changing the current filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.16em] text-slate-700">
                      <th className="px-6 py-4">Application</th>
                      <th className="px-4 py-4">Member</th>
                      <th className="px-4 py-4">Card Type</th>
                      <th className="px-4 py-4">Delivery</th>
                      <th className="px-4 py-4">Payment</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Applied</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.055]">
                    {applications.map((application, index) => (
                      <ApplicationRow
                        key={`${application.applicationId}-${application.memberId}-${application.createdAt}-${index}`}
                        application={application}
                        onView={() => setSelectedId(application.applicationId)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/[0.07] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-600">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPrevious}
                    onClick={() =>
                      updateFilter("page", Math.max(1, filters.page - 1))
                    }
                    className={pageButtonClass}
                  >
                    <ArrowLeft className="h-4 w-4" /> Previous
                  </button>
                  <button
                    type="button"
                    disabled={!pagination.hasNext}
                    onClick={() => updateFilter("page", filters.page + 1)}
                    className={pageButtonClass}
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {selectedId ? (
        <ApplicationDrawer
          detail={detail}
          loading={detailLoading}
          onClose={() => {
            setSelectedId("");
            setDetail(null);
          }}
          onUpdated={(next) => {
            setDetail(next);
            void loadApplications(true);
          }}
        />
      ) : null}
    </div>
  );
}

function ApplicationRow({
  application,
  onView,
}: {
  application: AdminCardApplication;
  onView: () => void;
}) {
  return (
    <tr className="text-sm transition hover:bg-white/[0.018]">
      <td className="px-6 py-4">
        <p className="font-medium text-white">
          {application.applicationId || "No ID"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {application.phone || "No phone"}
        </p>
      </td>
      <td className="px-4 py-4">
        <p className="text-slate-300">
          {application.fullName || application.memberId}
        </p>
        <p className="mt-1 text-xs text-slate-600">{application.memberId}</p>
      </td>
      <td className="px-4 py-4">
        <p className="text-slate-300">
          {formatType(application.applicationType)}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {application.memberTier || "—"}
        </p>
      </td>
      <td className="px-4 py-4">
        <p className="max-w-[230px] truncate text-slate-300">
          {application.area || application.state || "—"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {application.trackingNumber
            ? `${application.courier || "Courier"} · ${application.trackingNumber}`
            : "Not shipped"}
        </p>
      </td>
      <td className="px-4 py-4">
        <p className="text-slate-300">
          {application.fee > 0 ? formatCurrency(application.fee) : "Free"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {application.paymentStatus ||
            (application.fee > 0 ? "Pending" : "Not required")}
        </p>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={application.status} />
      </td>
      <td className="px-4 py-4 text-slate-400">
        {formatDateTime(application.createdAt)}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Eye className="h-4 w-4" /> View
        </button>
      </td>
    </tr>
  );
}

function ApplicationDrawer({
  detail,
  loading,
  onClose,
  onUpdated,
}: {
  detail: AdminCardApplicationDetailData | null;
  loading: boolean;
  onClose: () => void;
  onUpdated: (next: AdminCardApplicationDetailData) => void;
}) {
  const application = detail?.application;

  const [action, setAction] =
    useState<CardApplicationAction | null>(null);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [cardId, setCardId] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    setAction(null);
    setNote("");
    setReason("");
    setCourier("");
    setTrackingNumber("");
    setCardId("");
    setActionError("");
  }, [application?.applicationId]);

  const availableActions = useMemo(
    () => getAvailableCardActions(application),
    [application]
  );

  async function submitAction() {
    if (!application || !action) return;

    if (
      (action === "REJECT_PAYMENT" || action === "REJECT") &&
      reason.trim().length < 3
    ) {
      setActionError("Please enter a reason with at least 3 characters.");
      return;
    }

    if (action === "MARK_PROCESSING") {
      const normalizedCardId = cardId.trim();

      if (!normalizedCardId) {
        setActionError("Card ID is required before marking this application as Processing.");
        return;
      }

      if (!/^\d{10}$/.test(normalizedCardId)) {
        setActionError("Card ID must contain exactly 10 digits, for example 0000000001.");
        return;
      }
    }

    if (
      action === "SHIP" &&
      (!courier.trim() || !trackingNumber.trim())
    ) {
      setActionError("Courier and tracking number are required.");
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      const next = await updateAdminCardApplication(
        application.applicationId,
       {
  cardAction: action,
  note: note.trim(),
  reason: reason.trim(),
  courier: courier.trim(),
  trackingNumber: trackingNumber.trim(),
  cardId: cardId.trim(),
}
      );

      onUpdated(next);
      setAction(null);
      setNote("");
      setReason("");
      setCourier("");
      setTrackingNumber("");
      setCardId("");
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update card application."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close details"
        onClick={saving ? undefined : onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-white/[0.09] bg-slate-950">
        <header className="flex items-start justify-between border-b border-white/[0.08] px-7 py-5">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <IdCard className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">
              Card application details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {application?.applicationId || "Loading application record"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 transition hover:bg-white/[0.05] disabled:opacity-40"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {loading || !detail || !application ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
            </div>
          ) : (
            <div className="space-y-5">
              <Panel title="Application">
                <Grid>
                  <Item label="Application ID" value={application.applicationId} />
                  <Item label="Status" value={application.status} />
                  <Item label="Application Type" value={formatType(application.applicationType)} />
                  <Item
                    label={
                      (application as any).newCardId
                        ? "Assigned New Card ID"
                        : "Current Member Card ID"
                    }
                    value={(application as any).newCardId || detail.member.cardId}
                  />
                  <Item label="Submitted At" value={formatDateTime(application.createdAt)} />
                  <Item label="Updated At" value={formatDateTime(application.updatedAt)} />
                  <Item
                    label="Payment"
                    value={
                      application.fee > 0
                        ? `${formatCurrency(application.fee)} · ${
                            application.paymentStatus || "Pending"
                          }`
                        : "Free"
                    }
                  />
                </Grid>
              </Panel>

              <Panel title="Member">
                <Grid>
                  <Item label="Name" value={detail.member.fullName || application.fullName} />
                  <Item label="Member ID" value={detail.member.memberId} />
                  <Item label="Tier" value={detail.member.tier || application.memberTier} />
                  <Item label="Status" value={detail.member.status || application.memberStatus} />
                  <Item label="Email" value={detail.member.email || application.email} />
                  <Item label="Phone" value={detail.member.phone || application.phone} />
                  <Item label="Current Card ID" value={detail.member.cardId} />
                  <Item label="Card Status" value={detail.member.cardStatus} />
                </Grid>
              </Panel>

              <Panel title="Delivery">
                <Grid>
                  <Item label="State" value={application.state} />
                  <Item label="Area" value={application.area} />
                  <Item label="Postcode" value={application.postcode} />
                  <Item label="Courier" value={application.courier} />
                  <Item label="Tracking Number" value={application.trackingNumber} />
                  <Item label="Shipped At" value={formatDateTime(application.shippedAt)} />
                </Grid>
                <Item label="Full Address" value={application.fullAddress} full />
                <Item label="Delivery Note" value={application.deliveryNote} full />
              </Panel>

              {formatType(application.applicationType) === "Replacement Card" ? (
                <Panel title="Replacement Information">
                  <Grid>
                    <Item label="Old Card ID" value={application.oldCardId} />
                    <Item
                      label="Old Card Frozen"
                      value={application.freezeOldCard ? "Yes" : "No"}
                    />
                  </Grid>
                  <Item label="Replacement Reason" value={application.lossReason} full />
                </Panel>
              ) : null}

              <Panel title="Review & Fulfilment">
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                      <IdCard className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
                        Physical Card Assignment
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        The card number assigned to this member is stored in tbl_members → CARD_ID.
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {(application as any).newCardId
                            ? "Assigned New Card ID"
                            : "Current Member Card ID"}
                        </span>
                        <span className="rounded-lg border border-white/[0.08] bg-slate-950/70 px-3 py-1.5 font-mono text-sm font-semibold text-white">
                          {(application as any).newCardId ||
                            detail.member.cardId ||
                            "Not assigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Grid>
                  <Item label="Payment Reviewed By" value={application.paymentReviewedBy} />
                  <Item label="Payment Reviewed At" value={formatDateTime(application.paymentReviewedAt)} />
                  <Item label="Reviewed By" value={application.reviewedBy} />
                  <Item label="Reviewed At" value={formatDateTime(application.reviewedAt)} />
                  <Item label="Processing By" value={application.processingBy} />
                  <Item label="Processing At" value={formatDateTime(application.processingAt)} />
                  <Item label="Shipped By" value={application.shippedBy} />
                  <Item label="Completed By" value={application.completedBy} />
                  <Item label="Completed At" value={formatDateTime(application.completedAt)} />
                  <Item
                    label="Receipt"
                    value={application.receiptUrl ? "Uploaded" : "Not uploaded"}
                  />
                </Grid>
                <Item label="Admin Note" value={application.adminNote} full />
                <Item label="Reject Reason" value={application.rejectReason} full />
                {application.receiptUrl ? (
                  <a
                    href={application.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 text-sm text-emerald-300"
                  >
                    <Eye className="h-4 w-4" /> Open payment receipt
                  </a>
                ) : null}
              </Panel>
            </div>
          )}
        </div>

        <footer className="border-t border-white/[0.08] px-7 py-4">
          {actionError ? (
            <div className="mb-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {actionError}
            </div>
          ) : null}

          {!application || loading ? null : action ? (
            <div className="space-y-3">
              {action === "MARK_PROCESSING" ? (
                <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.07] p-4">
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-300">
                      Card ID *
                    </span>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Enter the 10-digit number printed / encoded on the physical card. Leading zeros will be preserved.
                    </p>

                    <input
                      value={cardId}
                      onChange={(event) => {
                        const digits = event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setCardId(digits);
                      }}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0000000001"
                      maxLength={10}
                      className={`${inputClass} mt-3 font-mono tracking-[0.12em]`}
                      autoFocus
                    />
                  </label>

                  <div className="mt-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] px-3 py-2.5 text-xs leading-5 text-amber-200">
                    Saving this action assigns the new physical Card ID for processing only. The member's current Card ID will remain unchanged until the card application is completed. The same Card ID cannot be assigned to another member.
                  </div>
                </div>
              ) : null}

              {action === "SHIP" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={courier}
                    onChange={(event) => setCourier(event.target.value)}
                    placeholder="Courier"
                    className={inputClass}
                  />
                  <input
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                    placeholder="Tracking number"
                    className={inputClass}
                  />
                </div>
              ) : null}

              {action === "REJECT_PAYMENT" || action === "REJECT" ? (
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Reason"
                  rows={3}
                  className={`${inputClass} h-auto py-3`}
                />
              ) : null}

              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Admin note (optional)"
                rows={2}
                className={`${inputClass} h-auto py-3`}
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAction(null);
                    setActionError("");
                  }}
                  disabled={saving}
                  className="h-12 rounded-xl border border-white/[0.08] text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submitAction()}
                  disabled={saving}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save action
                </button>
              </div>
            </div>
          ) : availableActions.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableActions.map((cardAction) => (
                <CardActionButton
                  key={cardAction}
                  action={cardAction}
                  onClick={() => {
                    setAction(cardAction);
                    setActionError("");
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-center text-sm text-slate-500">
              This application has no available actions.
            </div>
          )}
        </footer>
      </aside>
    </div>
  );
}

function getAvailableCardActions(
  application?: AdminCardApplication | null
): CardApplicationAction[] {
  if (!application) {
    return [];
  }

  const normalizedStatus = String(application.status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const normalizedPaymentStatus = String(application.paymentStatus || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const isReplacement =
    formatType(application.applicationType) === "Replacement Card";

  /*
   * ==========================================================
   * REPLACEMENT CARD PAYMENT WORKFLOW
   * ==========================================================
   *
   * Pending Payment
   *   -> member has not completed payment submission yet.
   *
   * Pending + Submitted
   *   -> Admin must Confirm / Reject Payment.
   *
   * Pending + Paid
   *   -> Admin may Approve / Reject Application.
   *
   * We intentionally do NOT depend on receiptUrl here because
   * the current Admin detail payload may expose paymentStatus
   * correctly while receiptUrl is mapped differently.
   * The backend still validates that a receipt exists before
   * CONFIRM_PAYMENT, so this does not weaken validation.
   * ==========================================================
   */

  if (isReplacement) {
    if (
      normalizedPaymentStatus === "SUBMITTED" &&
      ["PENDING_PAYMENT", "PENDING", "PENDING_REVIEW", "SUBMITTED"].includes(
        normalizedStatus
      )
    ) {
      return ["CONFIRM_PAYMENT", "REJECT_PAYMENT"];
    }

    if (
      ["PENDING", "PENDING_REVIEW", "SUBMITTED"].includes(normalizedStatus) &&
      normalizedPaymentStatus === "PAID"
    ) {
      return ["APPROVE", "REJECT"];
    }

    if (
      normalizedStatus === "PENDING_PAYMENT" &&
      normalizedPaymentStatus !== "PAID"
    ) {
      return [];
    }

    if (
      ["PENDING", "PENDING_REVIEW", "SUBMITTED"].includes(normalizedStatus)
    ) {
      return [];
    }
  }

  /*
   * ==========================================================
   * FIRST CARD / GENERAL APPLICATION REVIEW
   * ==========================================================
   */

  if (["PENDING", "PENDING_REVIEW", "SUBMITTED"].includes(normalizedStatus)) {
    return ["APPROVE", "REJECT"];
  }

  if (normalizedStatus === "APPROVED") {
    return ["MARK_PROCESSING"];
  }

  if (normalizedStatus === "PROCESSING") {
    return ["SHIP"];
  }

  if (normalizedStatus === "SHIPPED") {
    return ["COMPLETE"];
  }

  return [];
}

function CardActionButton({
  action,
  onClick,
}: {
  action: CardApplicationAction;
  onClick: () => void;
}) {
  const config = {
    CONFIRM_PAYMENT: {
      label: "Confirm Payment",
      icon: Check,
      className: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
    },
    REJECT_PAYMENT: {
      label: "Reject Payment",
      icon: CircleX,
      className: "border border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/15",
    },
    APPROVE: {
      label: "Approve Application",
      icon: Check,
      className: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
    },
    REJECT: {
      label: "Reject Application",
      icon: CircleX,
      className: "border border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/15",
    },
    MARK_PROCESSING: {
      label: "Mark Processing",
      icon: PackageCheck,
      className: "bg-violet-400 text-slate-950 hover:bg-violet-300",
    },
    SHIP: {
      label: "Ship Card",
      icon: Truck,
      className: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
    },
    COMPLETE: {
      label: "Mark Completed",
      icon: Send,
      className: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
    },
  }[action];

  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${config.className}`}
    >
      <Icon className="h-4 w-4" />
      {config.label}
    </button>
  );
}

function SummaryCard({ label, value, note, icon: Icon }: {
  label: string;
  value: string;
  note: string;
  icon: typeof IdCard;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-slate-400">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-slate-600">{note}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function Item({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-700">
        {label}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-slate-300">
        {value || "—"}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = String(status || "PENDING")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const className =
    normalized === "COMPLETED"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "APPROVED"
        ? "border-sky-400/20 bg-sky-400/10 text-sky-300"
        : normalized === "PROCESSING"
          ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
          : normalized === "SHIPPED"
            ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
            : ["PENDING", "PENDING_PAYMENT", "PENDING_REVIEW", "SUBMITTED"].includes(
                  normalized
                )
              ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
              : normalized === "CANCELLED"
                ? "border-slate-400/20 bg-slate-400/10 text-slate-400"
                : "border-red-400/20 bg-red-400/10 text-red-300";

  const label = normalized
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/65 px-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10";
const pageButtonClass =
  "flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30";

function formatType(value: string) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "REPLACEMENT" || normalized === "REPLACEMENT_CARD") {
    return "Replacement Card";
  }
  return "First Card";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-MY").format(Number(value || 0));
}

function formatDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(date);
}