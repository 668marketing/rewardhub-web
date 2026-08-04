"use client";

import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  Award,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminPointsDetail,
  AdminPointsListData,
  AdminPointsMember,
  adjustAdminMemberPoints,
  getAdminMemberPointsDetail,
  getAdminPoints,
} from "@/lib/admin-points";

type Filters = {
  search: string;
  tier: string;
  status: string;
  balance: string;
  sortBy: string;
  page: number;
  pageSize: number;
};

const DEFAULT_FILTERS: Filters = {
  search: "",
  tier: "ALL",
  status: "ALL",
  balance: "ALL",
  sortBy: "CURRENT_DESC",
  page: 1,
  pageSize: 25,
};

export default function AdminPointsPage() {
  const [filters, setFilters] =
    useState(DEFAULT_FILTERS);

  const [data, setData] =
    useState<AdminPointsListData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedMemberId, setSelectedMemberId] =
    useState("");

  const [detail, setDetail] =
    useState<AdminPointsDetail | null>(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [adjusting, setAdjusting] =
    useState(false);

  const [adjustmentType, setAdjustmentType] =
    useState<"ADD" | "DEDUCT">("ADD");

  const [amount, setAmount] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const loadData = useCallback(
    async (manual = false) => {
      try {
        setError("");

        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setData(
          await getAdminPoints(filters)
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load points."
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
        () => void loadData(),
        filters.search ? 350 : 0
      );

    return () =>
      window.clearTimeout(timer);
  }, [loadData, filters.search]);

  useEffect(() => {
    if (!selectedMemberId) {
      setDetail(null);
      return;
    }

    let active = true;

    (async () => {
      try {
        setDetailLoading(true);

        const result =
          await getAdminMemberPointsDetail(
            selectedMemberId
          );

        if (active) {
          setDetail(result);
        }
      } catch (error) {
        if (active) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load point details."
          );
          setSelectedMemberId("");
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedMemberId]);

  const hasFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
        filters.tier !== "ALL" ||
        filters.status !== "ALL" ||
        filters.balance !== "ALL" ||
        filters.sortBy !== "CURRENT_DESC"
      ),
    [filters]
  );

  function updateFilter<K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page:
        key === "page"
          ? Number(value)
          : 1,
    }));
  }

  async function saveAdjustment() {
    if (!detail) return;

    try {
      setSaving(true);
      setError("");

      await adjustAdminMemberPoints(
        detail.member.memberId,
        {
          adjustmentType,
          amount: Number(amount),
          reason,
        }
      );

      const updated =
        await getAdminMemberPointsDetail(
          detail.member.memberId
        );

      setDetail(updated);
      setAdjusting(false);
      setAmount("");
      setReason("");
      await loadData(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to adjust points."
      );
    } finally {
      setSaving(false);
    }
  }

  function exportPage() {
    const members =
      data?.members || [];

    if (!members.length) return;

    const rows = [
      [
        "Member ID",
        "Name",
        "Email",
        "Tier",
        "Status",
        "Current Points",
        "Total Earned",
        "Total Redeemed",
        "Updated At",
      ],
      ...members.map((member) => [
        member.memberId,
        member.fullName,
        member.email,
        member.tier,
        member.status,
        member.currentPoints,
        member.totalEarned,
        member.totalRedeemed,
        member.pointsUpdatedAt,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      `rewardhub-points-page-${data?.pagination.page || 1}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-7 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-amber-300">
              <Star className="h-4 w-4" />
              Member value operations
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Points
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Review member point balances, lifetime earnings,
              redemptions and controlled admin adjustments.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadData(true)}
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
              disabled={!(data?.members || []).length}
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
            label="Total Members"
            value={formatNumber(data?.summary.totalMembers || 0)}
            note={`${formatNumber(data?.summary.membersWithPoints || 0)} with points`}
            icon={Users}
          />
          <SummaryCard
            label="Current Points"
            value={formatNumber(data?.summary.totalCurrentPoints || 0)}
            note="Combined available points"
            icon={Star}
          />
          <SummaryCard
            label="Lifetime Earned"
            value={formatNumber(data?.summary.totalEarned || 0)}
            note="All points earned"
            icon={Trophy}
          />
          <SummaryCard
            label="Redeemed"
            value={formatNumber(data?.summary.totalRedeemed || 0)}
            note={`${formatNumber(data?.summary.zeroBalanceMembers || 0)} members at zero`}
            icon={Award}
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
                onChange={(event) =>
                  updateFilter("search", event.target.value)
                }
                placeholder="Search member, ID, email or phone"
                className={inputClass + " pl-11"}
              />
            </div>

            <select
              value={filters.tier}
              onChange={(event) =>
                updateFilter("tier", event.target.value)
              }
              className={inputClass}
            >
              <option value="ALL">All tiers</option>
              <option value="SILVER">Silver</option>
              <option value="GOLD">Gold</option>
              <option value="PLATINUM">Platinum</option>
            </select>

            <select
              value={filters.status}
              onChange={(event) =>
                updateFilter("status", event.target.value)
              }
              className={inputClass}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              value={filters.balance}
              onChange={(event) =>
                updateFilter("balance", event.target.value)
              }
              className={inputClass}
            >
              <option value="ALL">All balances</option>
              <option value="HAS_POINTS">Has points</option>
              <option value="ZERO_BALANCE">Zero balance</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(event) =>
                updateFilter("sortBy", event.target.value)
              }
              className={inputClass}
            >
              <option value="CURRENT_DESC">Highest balance</option>
              <option value="CURRENT_ASC">Lowest balance</option>
              <option value="EARNED_DESC">Highest earned</option>
              <option value="REDEEMED_DESC">Highest redeemed</option>
              <option value="NAME_ASC">Member name</option>
              <option value="NEWEST">Newest members</option>
            </select>
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
          <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
            <div>
              <h2 className="font-semibold">Member Points Directory</h2>
              <p className="mt-1 text-xs text-slate-600">
                {data
                  ? `Showing ${data.pagination.showingFrom}–${data.pagination.showingTo} of ${data.pagination.totalItems}`
                  : "Loading point accounts"}
              </p>
            </div>

            <select
              value={filters.pageSize}
              onChange={(event) =>
                updateFilter("pageSize", Number(event.target.value))
              }
              className="h-10 rounded-xl border border-white/[0.08] bg-slate-950/70 px-3 text-sm text-slate-300"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-amber-300" />
            </div>
          ) : !(data?.members || []).length ? (
            <div className="flex min-h-[360px] items-center justify-center text-slate-600">
              No point accounts found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.16em] text-slate-700">
                      <th className="px-6 py-4">Member</th>
                      <th className="px-4 py-4">Tier</th>
                      <th className="px-4 py-4">Current</th>
                      <th className="px-4 py-4">Earned</th>
                      <th className="px-4 py-4">Redeemed</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Updated</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.055]">
                    {(data?.members || []).map((member) => (
                      <MemberRow
                        key={member.memberId}
                        member={member}
                        onView={() => setSelectedMemberId(member.memberId)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.07] px-6 py-4">
                <p className="text-xs text-slate-600">
                  Page {data?.pagination.page} of {data?.pagination.totalPages}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!data?.pagination.hasPrevious}
                    onClick={() =>
                      updateFilter("page", Math.max(1, filters.page - 1))
                    }
                    className={pageButtonClass}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={!data?.pagination.hasNext}
                    onClick={() =>
                      updateFilter("page", filters.page + 1)
                    }
                    className={pageButtonClass}
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

      {selectedMemberId ? (
        <Drawer
          detail={detail}
          loading={detailLoading}
          adjusting={adjusting}
          adjustmentType={adjustmentType}
          amount={amount}
          reason={reason}
          saving={saving}
          setAdjustmentType={setAdjustmentType}
          setAmount={setAmount}
          setReason={setReason}
          onAdjust={() => setAdjusting(true)}
          onCancel={() => setAdjusting(false)}
          onSave={() => void saveAdjustment()}
          onClose={() => {
            setSelectedMemberId("");
            setDetail(null);
            setAdjusting(false);
          }}
        />
      ) : null}
    </div>
  );
}

function MemberRow({
  member,
  onView,
}: {
  member: AdminPointsMember;
  onView: () => void;
}) {
  return (
    <tr className="text-sm transition hover:bg-white/[0.018]">
      <td className="px-6 py-4">
        <p className="font-medium text-white">
          {member.fullName || member.memberId}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {member.memberId} · {member.email}
        </p>
      </td>
      <td className="px-4 py-4">{member.tier}</td>
      <td className="px-4 py-4 font-semibold text-amber-300">
        {formatNumber(member.currentPoints)}
      </td>
      <td className="px-4 py-4 text-slate-300">
        {formatNumber(member.totalEarned)}
      </td>
      <td className="px-4 py-4 text-slate-400">
        {formatNumber(member.totalRedeemed)}
      </td>
      <td className="px-4 py-4">{member.status}</td>
      <td className="px-4 py-4 text-slate-400">
        {formatDateTime(member.pointsUpdatedAt || member.updatedAt)}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-slate-400 hover:bg-white/[0.05] hover:text-white"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
      </td>
    </tr>
  );
}

function Drawer(props: {
  detail: AdminPointsDetail | null;
  loading: boolean;
  adjusting: boolean;
  adjustmentType: "ADD" | "DEDUCT";
  amount: string;
  reason: string;
  saving: boolean;
  setAdjustmentType: (value: "ADD" | "DEDUCT") => void;
  setAmount: (value: string) => void;
  setReason: (value: string) => void;
  onAdjust: () => void;
  onCancel: () => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const {
    detail,
    loading,
    adjusting,
    adjustmentType,
    amount,
    reason,
    saving,
  } = props;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close point details"
        onClick={props.onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-white/[0.09] bg-slate-950">
        <header className="flex items-start justify-between border-b border-white/[0.08] px-7 py-5">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
              <Star className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Point details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {detail?.member.fullName || "Loading member"}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close point details"
            onClick={props.onClose}
            className="rounded-xl p-2 transition hover:bg-white/[0.05]"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {loading || !detail ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-amber-300" />
            </div>
          ) : adjusting ? (
            <div className="space-y-5">
              <Panel title="Adjustment">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      props.setAdjustmentType("ADD")
                    }
                    className={`flex h-12 items-center justify-center gap-2 rounded-xl border ${
                      adjustmentType === "ADD"
                        ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                        : "border-white/[0.08] text-slate-500"
                    }`}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    Add
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      props.setAdjustmentType("DEDUCT")
                    }
                    className={`flex h-12 items-center justify-center gap-2 rounded-xl border ${
                      adjustmentType === "DEDUCT"
                        ? "border-red-400/40 bg-red-400/15 text-red-300"
                        : "border-white/[0.08] text-slate-500"
                    }`}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    Deduct
                  </button>
                </div>

                <label className="mt-5 block">
                  <span className="text-xs font-medium text-slate-400">
                    Points
                  </span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(event) =>
                      props.setAmount(event.target.value)
                    }
                    placeholder="Enter points"
                    className={inputClass + " mt-2"}
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-xs font-medium text-slate-400">
                    Admin reason
                  </span>

                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(event) =>
                      props.setReason(event.target.value)
                    }
                    placeholder="Enter the reason for this adjustment"
                    className="mt-2 w-full rounded-xl border border-white/[0.08] bg-slate-950/65 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-700 focus:border-emerald-400/35"
                  />
                </label>
              </Panel>
            </div>
          ) : (
            <div className="space-y-5">
              <Panel title="Member">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Item
                    label="Name"
                    value={detail.member.fullName}
                  />
                  <Item
                    label="Member ID"
                    value={detail.member.memberId}
                  />
                  <Item
                    label="Tier"
                    value={detail.member.tier}
                  />
                  <Item
                    label="Status"
                    value={detail.member.status}
                  />
                </div>
              </Panel>

              <div className="grid gap-4 sm:grid-cols-3">
                <Value
                  label="Current Points"
                  value={formatNumber(
                    detail.wallet.currentPoints
                  )}
                />
                <Value
                  label="Lifetime Earned"
                  value={formatNumber(
                    detail.wallet.totalEarned
                  )}
                />
                <Value
                  label="Redeemed"
                  value={formatNumber(
                    detail.wallet.totalRedeemed
                  )}
                />
              </div>

              <Panel title="Recent History">
                {!detail.history.length ? (
                  <p className="text-sm text-slate-600">
                    No point history found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {detail.history.map((item, index) => {
                      const isPositive =
                        item.signedPoints >= 0;

                      const reference =
                        item.transactionId ||
                        item.sourceId ||
                        item.pointId ||
                        "—";

                      const sourceLabel =
                        item.source ||
                        item.type ||
                        "Point activity";

                      return (
                        <article
                          key={`${item.pointId || reference}-${item.createdAt || index}`}
                          className="rounded-2xl border border-white/[0.07] bg-slate-950/35 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-white">
                                  {sourceLabel}
                                </p>

                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    isPositive
                                      ? "bg-emerald-500/10 text-emerald-300"
                                      : "bg-red-500/10 text-red-300"
                                  }`}
                                >
                                  {isPositive ? "ADD" : "DEDUCT"}
                                </span>
                              </div>

                              <p className="mt-2 text-xs leading-5 text-slate-400">
                                {item.description ||
                                  "Point activity recorded by RewardHub."}
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p
                                className={`text-lg font-semibold ${
                                  isPositive
                                    ? "text-emerald-300"
                                    : "text-red-300"
                                }`}
                              >
                                {isPositive ? "+" : ""}
                                {formatNumber(
                                  item.signedPoints
                                )}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-600">
                                points
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-2">
                            <HistoryDetail
                              label="Reference"
                              value={reference}
                            />

                            <HistoryDetail
                              label="Date & Time"
                              value={formatDateTime(
                                item.createdAt
                              )}
                            />

                            <HistoryDetail
                              label="Balance After"
                              value={`${formatNumber(
                                item.balanceAfter
                              )} points`}
                            />

                            <HistoryDetail
                              label="Source ID"
                              value={item.sourceId || "—"}
                            />

                            {(item.adminName ||
                              item.adminId) && (
                              <HistoryDetail
                                label="Processed By"
                                value={
                                  item.adminName ||
                                  item.adminId ||
                                  "—"
                                }
                              />
                            )}

                            {item.adminId &&
                            item.adminName ? (
                              <HistoryDetail
                                label="Admin ID"
                                value={item.adminId}
                              />
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </div>
          )}
        </div>

        {!loading && detail ? (
          <footer className="border-t border-white/[0.08] px-7 py-4">
            {adjusting ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={props.onCancel}
                  disabled={saving}
                  className="h-12 flex-1 rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={props.onSave}
                  disabled={
                    saving ||
                    Number(amount) <= 0 ||
                    reason.trim().length < 5
                  }
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : adjustmentType === "ADD" ? (
                    <ArrowUpCircle className="h-4 w-4" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4" />
                  )}

                  Save adjustment
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={props.onAdjust}
                className="h-12 w-full rounded-xl bg-emerald-400 font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Adjust Points
              </button>
            )}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function HistoryDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-700">
        {label}
      </p>

      <p className="mt-1 break-all text-xs text-slate-300">
        {value || "—"}
      </p>
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
  icon: typeof Users;
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

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Item({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-700">{label}</p>
      <p className="mt-2 text-sm text-slate-300">{value || "—"}</p>
    </div>
  );
}

function Value({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-700">{label}</p>
      <p className="mt-2 text-xl font-semibold text-amber-300">{value}</p>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/65 px-4 text-sm text-slate-200 outline-none placeholder:text-slate-700 focus:border-emerald-400/35";

const pageButtonClass =
  "flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 disabled:opacity-30";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-MY").format(Number(value || 0));
}

function formatDateTime(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}