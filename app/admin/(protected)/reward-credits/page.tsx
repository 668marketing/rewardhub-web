"use client";

import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  Coins,
  Download,
  Eye,
  Gift,
  History,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminRewardCreditDetail,
  AdminRewardCreditHistory,
  AdminRewardCreditMember,
  AdminRewardCreditsListData,
  adjustAdminMemberRewardCredits,
  getAdminMemberRewardCreditDetail,
  getAdminRewardCredits,
} from "@/lib/admin-reward-credits";

type Filters = {
  search: string;
  tier: string;
  status: string;
  balance: string;
  sortBy: string;
  page: number;
  pageSize: number;
};

type AdjustmentForm = {
  adjustmentType:
    | "ADD"
    | "DEDUCT";
  amount: string;
  reason: string;
};

const DEFAULT_FILTERS: Filters = {
  search: "",
  tier: "ALL",
  status: "ALL",
  balance: "ALL",
  sortBy: "AVAILABLE_DESC",
  page: 1,
  pageSize: 25,
};

const DEFAULT_ADJUSTMENT:
  AdjustmentForm = {
    adjustmentType: "ADD",
    amount: "",
    reason: "",
  };

export default function AdminRewardCreditsPage() {
  const [
    filters,
    setFilters,
  ] =
    useState<Filters>(
      DEFAULT_FILTERS
    );

  const [
    data,
    setData,
  ] =
    useState<AdminRewardCreditsListData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    selectedMemberId,
    setSelectedMemberId,
  ] =
    useState("");

  const [
    detail,
    setDetail,
  ] =
    useState<AdminRewardCreditDetail | null>(
      null
    );

  const [
    detailLoading,
    setDetailLoading,
  ] =
    useState(false);

  const [
    adjustmentOpen,
    setAdjustmentOpen,
  ] =
    useState(false);

  const [
    adjustmentForm,
    setAdjustmentForm,
  ] =
    useState<AdjustmentForm>(
      DEFAULT_ADJUSTMENT
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const loadData =
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
            await getAdminRewardCredits(
              filters
            );

          setData(result);
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load Reward Credits."
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
          void loadData();
        },
        filters.search
          ? 350
          : 0
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    loadData,
    filters.search,
  ]);

  useEffect(() => {
    if (!selectedMemberId) {
      setDetail(null);
      setAdjustmentOpen(false);
      setAdjustmentForm(
        DEFAULT_ADJUSTMENT
      );
      return;
    }

    let active = true;

    async function loadDetail() {
      try {
        setDetailLoading(
          true
        );
        setError("");

        const result =
          await getAdminMemberRewardCreditDetail(
            selectedMemberId
          );

        if (active) {
          setDetail(result);
        }
      } catch (
        detailError
      ) {
        if (active) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : "Unable to load Reward Credit details."
          );

          setSelectedMemberId(
            ""
          );
        }
      } finally {
        if (active) {
          setDetailLoading(
            false
          );
        }
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [
    selectedMemberId,
  ]);

  const hasActiveFilters =
    useMemo(
      () =>
        Boolean(
          filters.search ||
          filters.tier !==
            "ALL" ||
          filters.status !==
            "ALL" ||
          filters.balance !==
            "ALL" ||
          filters.sortBy !==
            "AVAILABLE_DESC"
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
        [key]: value,
        page:
          key === "page"
            ? Number(value)
            : 1,
      })
    );
  }

  function resetFilters() {
    setFilters(
      DEFAULT_FILTERS
    );
  }

  async function saveAdjustment() {
    if (
      !detail?.member.memberId
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await adjustAdminMemberRewardCredits(
        detail.member.memberId,
        {
          adjustmentType:
            adjustmentForm
              .adjustmentType,
          amount:
            Number(
              adjustmentForm.amount
            ),
          reason:
            adjustmentForm.reason,
        }
      );

      const [
        updatedDetail,
      ] =
        await Promise.all([
          getAdminMemberRewardCreditDetail(
            detail.member.memberId
          ),
          loadData(true),
        ]);

      setDetail(
        updatedDetail
      );

      setAdjustmentOpen(
        false
      );

      setAdjustmentForm(
        DEFAULT_ADJUSTMENT
      );
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to adjust Reward Credits."
      );
    } finally {
      setSaving(false);
    }
  }

  function exportCurrentPage() {
    const members =
      data?.members || [];

    if (!members.length) {
      return;
    }

    const rows = [
      [
        "Member ID",
        "Full Name",
        "Email",
        "Phone",
        "Tier",
        "Status",
        "Available Reward Credits",
        "Lifetime Earned",
        "Total Used",
        "Pending",
        "Updated At",
      ],

      ...members.map(
        (member) => [
          member.memberId,
          member.fullName,
          member.email,
          member.phone,
          member.tier,
          member.status,
          member.availableCredits,
          member.lifetimeEarned,
          member.totalUsed,
          member.totalPending,
          member.rewardCreditsUpdatedAt,
        ]
      ),
    ];

    const csv =
      rows
        .map(
          (row) =>
            row
              .map(
                (value) =>
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

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href = url;
    anchor.download =
      `rewardhub-reward-credits-page-${data?.pagination.page || 1}.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      url
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-7 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-violet-300">
              <WalletCards className="h-4 w-4" />
              Member value operations
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Reward Credits
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Review member balances, lifetime earnings,
              usage history and controlled admin adjustments.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void loadData(
                  true
                )
              }
              disabled={
                refreshing
              }
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
              onClick={
                exportCurrentPage
              }
              disabled={
                !(data?.members || [])
                  .length
              }
              className="flex h-11 items-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
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
            value={formatNumber(
              data?.summary
                .totalMembers || 0
            )}
            note={`${formatNumber(
              data?.summary
                .membersWithCredits || 0
            )} with a positive balance`}
            icon={Users}
          />

          <SummaryCard
            label="Available Credits"
            value={formatCurrency(
              data?.summary
                .totalAvailableCredits ||
              0
            )}
            note="Combined usable Reward Credits"
            icon={WalletCards}
          />

          <SummaryCard
            label="Lifetime Earned"
            value={formatCurrency(
              data?.summary
                .totalLifetimeEarned ||
              0
            )}
            note="Total credits earned by members"
            icon={Sparkles}
          />

          <SummaryCard
            label="Credits Used"
            value={formatCurrency(
              data?.summary
                .totalUsed || 0
            )}
            note={`${formatNumber(
              data?.summary
                .zeroBalanceMembers || 0
            )} members currently at zero`}
            icon={Coins}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-slate-900/45 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                value={
                  filters.search
                }
                onChange={(
                  event
                ) =>
                  updateFilter(
                    "search",
                    event.target.value
                  )
                }
                placeholder="Search member, ID, email or phone"
                className={
                  inputClass +
                  " pl-11"
                }
              />
            </div>

            <select
              value={
                filters.tier
              }
              onChange={(
                event
              ) =>
                updateFilter(
                  "tier",
                  event.target.value
                )
              }
              className={
                inputClass
              }
            >
              <option value="ALL">
                All tiers
              </option>
              <option value="SILVER">
                Silver
              </option>
              <option value="GOLD">
                Gold
              </option>
              <option value="PLATINUM">
                Platinum
              </option>
            </select>

            <select
              value={
                filters.status
              }
              onChange={(
                event
              ) =>
                updateFilter(
                  "status",
                  event.target.value
                )
              }
              className={
                inputClass
              }
            >
              <option value="ALL">
                All statuses
              </option>
              <option value="ACTIVE">
                Active
              </option>
              <option value="INACTIVE">
                Inactive
              </option>
              <option value="SUSPENDED">
                Suspended
              </option>
            </select>

            <select
              value={
                filters.balance
              }
              onChange={(
                event
              ) =>
                updateFilter(
                  "balance",
                  event.target.value
                )
              }
              className={
                inputClass
              }
            >
              <option value="ALL">
                All balances
              </option>
              <option value="HAS_CREDITS">
                Has credits
              </option>
              <option value="ZERO_BALANCE">
                Zero balance
              </option>
            </select>

            <select
              value={
                filters.sortBy
              }
              onChange={(
                event
              ) =>
                updateFilter(
                  "sortBy",
                  event.target.value
                )
              }
              className={
                inputClass
              }
            >
              <option value="AVAILABLE_DESC">
                Highest balance
              </option>
              <option value="AVAILABLE_ASC">
                Lowest balance
              </option>
              <option value="LIFETIME_DESC">
                Highest lifetime earned
              </option>
              <option value="NAME_ASC">
                Member name
              </option>
              <option value="NEWEST">
                Newest members
              </option>
              <option value="OLDEST">
                Oldest members
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={
              resetFilters
            }
            disabled={
              !hasActiveFilters
            }
            className="mt-3 h-11 rounded-xl border border-white/[0.08] px-5 text-sm text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Reset
          </button>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/35">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold">
                Member Reward Credit Directory
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                {data
                  ? `Showing ${data.pagination.showingFrom}–${data.pagination.showingTo} of ${data.pagination.totalItems}`
                  : "Loading Reward Credit accounts"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600">
                Rows
              </span>

              <select
                value={
                  filters.pageSize
                }
                onChange={(
                  event
                ) =>
                  updateFilter(
                    "pageSize",
                    Number(
                      event.target.value
                    )
                  )
                }
                className="h-10 rounded-xl border border-white/[0.08] bg-slate-950/70 px-3 text-sm text-slate-300 outline-none"
              >
                {[
                  10,
                  25,
                  50,
                  100,
                ].map(
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

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-violet-300" />
            </div>
          ) : !(data?.members || [])
              .length ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <WalletCards className="h-8 w-8 text-slate-700" />

              <h3 className="mt-4 font-medium text-slate-300">
                No Reward Credit accounts found
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
                      <th className="px-6 py-4">
                        Member
                      </th>
                      <th className="px-4 py-4">
                        Tier
                      </th>
                      <th className="px-4 py-4">
                        Available
                      </th>
                      <th className="px-4 py-4">
                        Lifetime Earned
                      </th>
                      <th className="px-4 py-4">
                        Used
                      </th>
                      <th className="px-4 py-4">
                        Status
                      </th>
                      <th className="px-4 py-4">
                        Updated
                      </th>
                      <th className="px-6 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.055]">
                    {(data?.members || []).map(
                      (member) => (
                        <MemberRow
                          key={
                            member.memberId
                          }
                          member={
                            member
                          }
                          onView={() =>
                            setSelectedMemberId(
                              member.memberId
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs text-slate-600">
                  Page{" "}
                  {data?.pagination.page}{" "}
                  of{" "}
                  {data?.pagination.totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      !data?.pagination
                        .hasPrevious
                    }
                    onClick={() =>
                      updateFilter(
                        "page",
                        Math.max(
                          1,
                          filters.page - 1
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
                      !data?.pagination
                        .hasNext
                    }
                    onClick={() =>
                      updateFilter(
                        "page",
                        filters.page + 1
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

      {selectedMemberId ? (
        <RewardCreditDrawer
          detail={
            detail
          }
          loading={
            detailLoading
          }
          adjustmentOpen={
            adjustmentOpen
          }
          adjustmentForm={
            adjustmentForm
          }
          saving={
            saving
          }
          onOpenAdjustment={() => {
            setAdjustmentForm(
              DEFAULT_ADJUSTMENT
            );
            setAdjustmentOpen(
              true
            );
          }}
          onAdjustmentChange={
            setAdjustmentForm
          }
          onCancelAdjustment={() => {
            setAdjustmentOpen(
              false
            );
            setAdjustmentForm(
              DEFAULT_ADJUSTMENT
            );
          }}
          onSaveAdjustment={() =>
            void saveAdjustment()
          }
          onClose={() => {
            setSelectedMemberId(
              ""
            );
            setDetail(null);
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
  member: AdminRewardCreditMember;
  onView: () => void;
}) {
  return (
    <tr className="text-sm transition hover:bg-white/[0.018]">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-400/[0.08] text-sm font-semibold text-violet-300">
            {getInitials(
              member.fullName ||
              member.memberId
            )}
          </div>

          <div>
            <p className="font-medium text-white">
              {member.fullName ||
                member.memberId}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              {member.memberId}
              {member.email
                ? ` · ${member.email}`
                : ""}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <TierBadge
          tier={member.tier}
        />
      </td>

      <td className="px-4 py-4">
        <p className="font-medium text-violet-300">
          {formatCurrency(
            member.availableCredits
          )}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          Available to use
        </p>
      </td>

      <td className="px-4 py-4 text-slate-300">
        {formatCurrency(
          member.lifetimeEarned
        )}
      </td>

      <td className="px-4 py-4 text-slate-400">
        {formatCurrency(
          member.totalUsed
        )}
      </td>

      <td className="px-4 py-4">
        <StatusBadge
          status={member.status}
        />
      </td>

      <td className="px-4 py-4 text-slate-400">
        {formatDateTime(
          member.rewardCreditsUpdatedAt ||
          member.updatedAt
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

function RewardCreditDrawer({
  detail,
  loading,
  adjustmentOpen,
  adjustmentForm,
  saving,
  onOpenAdjustment,
  onAdjustmentChange,
  onCancelAdjustment,
  onSaveAdjustment,
  onClose,
}: {
  detail: AdminRewardCreditDetail | null;
  loading: boolean;
  adjustmentOpen: boolean;
  adjustmentForm: AdjustmentForm;
  saving: boolean;
  onOpenAdjustment: () => void;
  onAdjustmentChange: (
    value: AdjustmentForm
  ) => void;
  onCancelAdjustment: () => void;
  onSaveAdjustment: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close Reward Credit details"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-white/[0.09] bg-slate-950 shadow-2xl shadow-black/60">
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
              <WalletCards className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Reward Credit details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {detail?.member.fullName ||
                "Loading member"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {loading ||
          !detail ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-violet-300" />
            </div>
          ) : adjustmentOpen ? (
            <AdjustmentFormView
              detail={detail}
              form={
                adjustmentForm
              }
              onChange={
                onAdjustmentChange
              }
            />
          ) : (
            <DetailView
              detail={detail}
            />
          )}
        </div>

        {!loading &&
        detail ? (
          <footer className="border-t border-white/[0.08] bg-slate-950 px-5 py-4 sm:px-7">
            {adjustmentOpen ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={
                    onCancelAdjustment
                  }
                  disabled={saving}
                  className="h-12 flex-1 rounded-xl border border-white/[0.08] text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    onSaveAdjustment
                  }
                  disabled={saving}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : adjustmentForm
                      .adjustmentType ===
                    "ADD" ? (
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
                onClick={
                  onOpenAdjustment
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                <Coins className="h-4 w-4" />
                Adjust Reward Credits
              </button>
            )}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function DetailView({
  detail,
}: {
  detail: AdminRewardCreditDetail;
}) {
  return (
    <div className="space-y-5">
      <DetailSection title="Member">
        <DetailGrid>
          <DetailItem
            label="Full Name"
            value={
              detail.member.fullName ||
              "—"
            }
          />
          <DetailItem
            label="Member ID"
            value={
              detail.member.memberId
            }
          />
          <DetailItem
            label="Email"
            value={
              detail.member.email ||
              "—"
            }
          />
          <DetailItem
            label="Phone"
            value={
              detail.member.phone ||
              "—"
            }
          />
          <DetailItem
            label="Tier"
            value={
              detail.member.tier
            }
          />
          <DetailItem
            label="Status"
            value={
              detail.member.status
            }
          />
        </DetailGrid>
      </DetailSection>

      <section className="grid gap-4 sm:grid-cols-2">
        <ValueCard
          label="Available Credits"
          value={formatCurrency(
            detail.wallet
              .availableCredits
          )}
          note="Current usable balance"
          icon={WalletCards}
        />
        <ValueCard
          label="Lifetime Earned"
          value={formatCurrency(
            detail.wallet
              .lifetimeEarned
          )}
          note="Total referral rewards earned"
          icon={Sparkles}
        />
        <ValueCard
          label="Total Used"
          value={formatCurrency(
            detail.wallet.totalUsed
          )}
          note="Credits spent or paid"
          icon={Coins}
        />
        <ValueCard
          label="Pending"
          value={formatCurrency(
            detail.wallet
              .totalPending
          )}
          note="Pending Reward Credits"
          icon={Gift}
        />
      </section>

      <DetailSection title="History Summary">
        <DetailGrid>
          <DetailItem
            label="Records"
            value={formatNumber(
              detail.historySummary
                .totalRecords
            )}
          />
          <DetailItem
            label="Added"
            value={formatCurrency(
              detail.historySummary
                .totalAdded
            )}
          />
          <DetailItem
            label="Deducted"
            value={formatCurrency(
              detail.historySummary
                .totalDeducted
            )}
          />
          <DetailItem
            label="Admin Adjustments"
            value={formatNumber(
              detail.historySummary
                .adminAdjustments
            )}
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Recent History">
        {!detail.history.length ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-5 text-sm text-slate-600">
            No Reward Credit history was found.
          </div>
        ) : (
          <div className="space-y-3">
            {detail.history.map(
              (item) => (
                <HistoryRow
                  key={
                    item.historyId
                  }
                  item={item}
                />
              )
            )}
          </div>
        )}
      </DetailSection>
    </div>
  );
}

function AdjustmentFormView({
  detail,
  form,
  onChange,
}: {
  detail: AdminRewardCreditDetail;
  form: AdjustmentForm;
  onChange: (
    value: AdjustmentForm
  ) => void;
}) {
  function patch(
    value: Partial<AdjustmentForm>
  ) {
    onChange({
      ...form,
      ...value,
    });
  }

  const amount =
    Number(form.amount || 0);

  const projectedBalance =
    form.adjustmentType ===
    "ADD"
      ? detail.wallet
          .availableCredits +
        amount
      : detail.wallet
          .availableCredits -
        amount;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
        <p className="text-sm font-semibold text-white">
          {detail.member.fullName}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {detail.member.memberId}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DetailItem
            label="Current Balance"
            value={formatCurrency(
              detail.wallet
                .availableCredits
            )}
          />
          <DetailItem
            label="Projected Balance"
            value={formatCurrency(
              projectedBalance
            )}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
        <h3 className="font-semibold">
          Adjustment
        </h3>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              patch({
                adjustmentType:
                  "ADD",
              })
            }
            className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
              form.adjustmentType ===
              "ADD"
                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                : "border-white/[0.08] text-slate-500 hover:bg-white/[0.04]"
            }`}
          >
            <ArrowUpCircle className="h-4 w-4" />
            Add
          </button>

          <button
            type="button"
            onClick={() =>
              patch({
                adjustmentType:
                  "DEDUCT",
              })
            }
            className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
              form.adjustmentType ===
              "DEDUCT"
                ? "border-red-400/40 bg-red-400/15 text-red-300"
                : "border-white/[0.08] text-slate-500 hover:bg-white/[0.04]"
            }`}
          >
            <ArrowDownCircle className="h-4 w-4" />
            Deduct
          </button>
        </div>

        <label className="mt-5 block">
          <span className="text-sm text-slate-300">
            Amount (RM)
          </span>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={
              form.amount
            }
            onChange={(
              event
            ) =>
              patch({
                amount:
                  event.target.value,
              })
            }
            placeholder="0.00"
            className={
              inputClass +
              " mt-2"
            }
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm text-slate-300">
            Admin Reason
          </span>

          <textarea
            rows={4}
            value={
              form.reason
            }
            onChange={(
              event
            ) =>
              patch({
                reason:
                  event.target.value,
              })
            }
            placeholder="Example: Approved goodwill credit adjustment"
            className="mt-2 w-full resize-none rounded-xl border border-white/[0.08] bg-slate-950/65 px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10"
          />
        </label>

        {projectedBalance <
        0 ? (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            Deduction exceeds the current available balance.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function HistoryRow({
  item,
}: {
  item: AdminRewardCreditHistory;
}) {
  const added =
    item.signedAmount >= 0;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-slate-950/35 px-4 py-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          added
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-red-400/10 text-red-300"
        }`}
      >
        {added ? (
          <ArrowUpCircle className="h-5 w-5" />
        ) : (
          <ArrowDownCircle className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-200">
            {formatHistoryAction(
              item.action,
              item.type
            )}
          </p>

          <p
            className={`text-sm font-semibold ${
              added
                ? "text-emerald-300"
                : "text-red-300"
            }`}
          >
            {added ? "+" : "-"}
            {formatCurrency(
              Math.abs(
                item.signedAmount
              )
            )}
          </p>
        </div>

        <p className="mt-1 break-words text-xs leading-5 text-slate-500">
          {item.description ||
            item.transactionId ||
            "Reward Credit activity"}
        </p>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-700">
          <span>
            Balance:{" "}
            {formatCurrency(
              item.balanceAfter
            )}
          </span>
          <span>
            {formatDateTime(
              item.createdAt
            )}
          </span>
          {item.adminName ? (
            <span>
              By {item.adminName}
            </span>
          ) : null}
        </div>
      </div>
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
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5 sm:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-slate-400">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {note}
      </p>
    </div>
  );
}

function ValueCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof WalletCards;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.12em] text-slate-700">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-600">
        {note}
      </p>
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
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
      <h3 className="font-semibold">
        {title}
      </h3>
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
    <div className="grid gap-5 sm:grid-cols-2">
      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-700">
        {label}
      </p>
      <p className="mt-2 break-words text-sm text-slate-300">
        {value}
      </p>
    </div>
  );
}

function TierBadge({
  tier,
}: {
  tier: string;
}) {
  const normalized =
    String(tier || "")
      .trim()
      .toUpperCase();

  const className =
    normalized === "PLATINUM"
      ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
      : normalized === "GOLD"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : "border-slate-400/20 bg-slate-400/10 text-slate-300";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {normalized || "SILVER"}
    </span>
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
    normalized === "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "SUSPENDED"
        ? "border-red-400/20 bg-red-400/10 text-red-300"
        : "border-slate-400/20 bg-slate-400/10 text-slate-300";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {normalized || "UNKNOWN"}
    </span>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/65 px-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40";

const pageButtonClass =
  "flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30";

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
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function getInitials(
  value: string
) {
  const parts =
    String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!parts.length) {
    return "M";
  }

  return parts
    .slice(0, 2)
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}

function formatHistoryAction(
  action: string,
  type: string
) {
  const value =
    String(
      action || type || ""
    )
      .trim()
      .replace(/_/g, " ")
      .toLowerCase();

  if (!value) {
    return "Reward Credit activity";
  }

  return value.replace(
    /\b\w/g,
    (letter) =>
      letter.toUpperCase()
  );
}
