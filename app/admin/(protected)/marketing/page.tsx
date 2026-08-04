"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  Gift,
  Loader2,
  Pencil,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminMarketingDetail,
  AdminMarketingListData,
  AdminMarketingMerchant,
  getAdminMarketingBudgetDetail,
  getAdminMarketingBudgets,
  updateAdminMarketingBudget,
} from "@/lib/admin-marketing";

type Filters = {
  search: string;
  category: string;
  rewardCredits: string;
  boostStatus: string;
  status: string;
  page: number;
  pageSize: number;
};

type EditForm = {
  normalBudget: string;

  acceptRewardCredits: boolean;
  redemptionLimit: string;

  boostEnabled: boolean;
  boostBudget: string;
  boostStart: string;
  boostEnd: string;

  reason: string;
};

const DEFAULT_FILTERS: Filters = {
  search: "",
  category: "ALL",
  rewardCredits: "ALL",
  boostStatus: "ALL",
  status: "ALL",
  page: 1,
  pageSize: 25,
};

export default function AdminMarketingPage() {
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
    useState<AdminMarketingListData | null>(
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
    selectedMerchantId,
    setSelectedMerchantId,
  ] =
    useState("");

  const [
    detail,
    setDetail,
  ] =
    useState<AdminMarketingDetail | null>(
      null
    );

  const [
    detailLoading,
    setDetailLoading,
  ] =
    useState(false);

  const [
    editOpen,
    setEditOpen,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    editForm,
    setEditForm,
  ] =
    useState<EditForm | null>(
      null
    );

  const loadMarketing =
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
            await getAdminMarketingBudgets(
              filters
            );

          setData(result);
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load marketing settings."
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
          loadMarketing();
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
    loadMarketing,
    filters.search,
  ]);

  useEffect(() => {
    if (
      !selectedMerchantId
    ) {
      setDetail(null);
      setEditOpen(false);
      setEditForm(null);
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
          await getAdminMarketingBudgetDetail(
            selectedMerchantId
          );

        if (active) {
          setDetail(
            result
          );
        }
      } catch (
        detailError
      ) {
        if (active) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : "Unable to load merchant marketing settings."
          );

          setSelectedMerchantId(
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

    loadDetail();

    return () => {
      active = false;
    };
  }, [
    selectedMerchantId,
  ]);

  const hasActiveFilters =
    useMemo(
      () =>
        Boolean(
          filters.search ||
          filters.category !==
            "ALL" ||
          filters.rewardCredits !==
            "ALL" ||
          filters.boostStatus !==
            "ALL" ||
          filters.status !==
            "ALL"
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

  function openEdit() {
    const merchant =
      detail?.merchant;

    if (!merchant) {
      return;
    }

    setEditForm({
      normalBudget:
        String(
          merchant.normalBudget
        ),

      acceptRewardCredits:
        merchant.acceptRewardCredits,

      redemptionLimit:
        String(
          merchant.redemptionLimit
        ),

      boostEnabled:
        merchant.boostEnabled,

      boostBudget:
        merchant.boostBudget
          ? String(
              merchant.boostBudget
            )
          : "",

      boostStart:
        toDateTimeInput(
          merchant.boostStart
        ),

      boostEnd:
        toDateTimeInput(
          merchant.boostEnd
        ),

      reason: "",
    });

    setEditOpen(true);
  }

  async function saveChanges() {
    if (
      !detail?.merchant ||
      !editForm
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const updated =
        await updateAdminMarketingBudget(
          detail.merchant
            .merchantId,
          {
            normalBudget:
              Number(
                editForm.normalBudget
              ),

            acceptRewardCredits:
              editForm
                .acceptRewardCredits,

            redemptionLimit:
              editForm
                .acceptRewardCredits
                ? Number(
                    editForm
                      .redemptionLimit
                  )
                : 0,

            boostEnabled:
              editForm.boostEnabled,

            boostBudget:
              editForm.boostEnabled
                ? Number(
                    editForm
                      .boostBudget
                  )
                : 0,

            boostStart:
              editForm.boostEnabled
                ? editForm
                    .boostStart
                : "",

            boostEnd:
              editForm.boostEnabled
                ? editForm
                    .boostEnd
                : "",

            reason:
              editForm.reason,
          }
        );

      setDetail(
        (current) =>
          current
            ? {
                ...current,
                merchant:
                  updated,
              }
            : current
      );

      setEditOpen(false);
      setEditForm(null);

      await loadMarketing(
        true
      );
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update merchant marketing settings."
      );
    } finally {
      setSaving(false);
    }
  }

  function exportCurrentPage() {
    const merchants =
      data?.merchants ||
      [];

    if (
      !merchants.length
    ) {
      return;
    }

    const rows = [
      [
        "Merchant ID",
        "Business Name",
        "Category",
        "Status",
        "Normal Budget %",
        "Current Budget %",
        "Boost Enabled",
        "Boost Active",
        "Boost Budget %",
        "Boost Start",
        "Boost End",
        "Reward Credits",
        "Redemption Limit %",
        "Updated At",
      ],

      ...merchants.map(
        (merchant) => [
          merchant.merchantId,
          merchant.businessName,
          merchant.category,
          merchant.status,
          merchant.normalBudget,
          merchant.currentBudget,
          merchant.boostEnabled
            ? "Yes"
            : "No",
          merchant.boostActive
            ? "Yes"
            : "No",
          merchant.boostBudget,
          merchant.boostStart,
          merchant.boostEnd,
          merchant
            .acceptRewardCredits
            ? "Enabled"
            : "Disabled",
          merchant.redemptionLimit,
          merchant.updatedAt,
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
      `rewardhub-marketing-page-${data?.pagination.page || 1}.csv`;

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
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <BarChart3 className="h-4 w-4" />
              Finance operations
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Marketing Budget
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Review and edit merchant marketing budgets,
              Reward Credit acceptance and temporary boost campaigns.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                loadMarketing(
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
                !(
                  data
                    ?.merchants ||
                  []
                ).length
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
            label="Total Merchants"
            value={formatNumber(
              data?.summary
                .totalMerchants ||
              0
            )}
            note="Marketing settings available"
            icon={Store}
          />

          <SummaryCard
            label="Average Budget"
            value={`${formatPercent(
              data?.summary
                .averageBudget ||
              0
            )}`}
            note="Normal marketing budget"
            icon={BarChart3}
          />

          <SummaryCard
            label="Active Boosts"
            value={formatNumber(
              data?.summary
                .activeBoosts ||
              0
            )}
            note={`${formatNumber(
              data?.summary
                .boostEnabled ||
              0
            )} boost schedules enabled`}
            icon={Rocket}
          />

          <SummaryCard
            label="Reward Credits"
            value={formatNumber(
              data?.summary
                .rewardCreditsEnabled ||
              0
            )}
            note="Merchants accepting credits"
            icon={Gift}
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
                    event.target
                      .value
                  )
                }
                placeholder="Search merchant, email or ID"
                className={
                  inputClass +
                  " pl-11"
                }
              />
            </div>

            <select
              value={
                filters.category
              }
              onChange={(
                event
              ) =>
                updateFilter(
                  "category",
                  event.target.value
                )
              }
              className={
                inputClass
              }
            >
              <option value="ALL">
                All categories
              </option>

              {(data?.categories ||
                []).map(
                (category) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category.toUpperCase()
                    }
                  >
                    {
                      category
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={
                filters
                  .rewardCredits
              }
              onChange={(
                event
              ) =>
                updateFilter(
                  "rewardCredits",
                  event.target.value
                )
              }
              className={
                inputClass
              }
            >
              <option value="ALL">
                All Reward Credit settings
              </option>
              <option value="ENABLED">
                Reward Credits enabled
              </option>
              <option value="DISABLED">
                Reward Credits disabled
              </option>
            </select>

            <select
              value={
                filters
                  .boostStatus
              }
              onChange={(
                event
              ) =>
                updateFilter(
                  "boostStatus",
                  event.target.value
                )
              }
              className={
                inputClass
              }
            >
              <option value="ALL">
                All boost settings
              </option>
              <option value="ACTIVE">
                Active boost
              </option>
              <option value="INACTIVE">
                No active boost
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
                All merchant statuses
              </option>
              <option value="ACTIVE">
                Active
              </option>
              <option value="SUSPENDED">
                Suspended
              </option>
              <option value="INACTIVE">
                Inactive
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
                Merchant Marketing Directory
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                {data
                  ? `Showing ${data.pagination.showingFrom}–${data.pagination.showingTo} of ${data.pagination.totalItems}`
                  : "Loading merchant marketing settings"}
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
                      event.target
                        .value
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
                      key={
                        size
                      }
                      value={
                        size
                      }
                    >
                      {
                        size
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
            </div>
          ) : !(
              data?.merchants ||
              []
            ).length ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <BarChart3 className="h-8 w-8 text-slate-700" />

              <h3 className="mt-4 font-medium text-slate-300">
                No merchants found
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Try changing the current filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.16em] text-slate-700">
                      <th className="px-6 py-4">
                        Merchant
                      </th>
                      <th className="px-4 py-4">
                        Normal Budget
                      </th>
                      <th className="px-4 py-4">
                        Current Budget
                      </th>
                      <th className="px-4 py-4">
                        Boost
                      </th>
                      <th className="px-4 py-4">
                        Reward Credits
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
                    {(data
                      ?.merchants ||
                      []).map(
                      (
                        merchant,
                        index
                      ) => (
                        <MarketingRow
                          key={`${merchant.merchantId}-${index}`}
                          merchant={
                            merchant
                          }
                          onView={() =>
                            setSelectedMerchantId(
                              merchant.merchantId
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
                  {
                    data
                      ?.pagination.page
                  }{" "}
                  of{" "}
                  {
                    data
                      ?.pagination
                      .totalPages
                  }
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      !data
                        ?.pagination
                        .hasPrevious
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
                      !data
                        ?.pagination
                        .hasNext
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

      {selectedMerchantId ? (
        <MarketingDrawer
          detail={
            detail
          }
          loading={
            detailLoading
          }
          editOpen={
            editOpen
          }
          editForm={
            editForm
          }
          saving={
            saving
          }
          onOpenEdit={
            openEdit
          }
          onEditChange={
            (
              next
            ) =>
              setEditForm(
                next
              )
          }
          onCancelEdit={() => {
            setEditOpen(
              false
            );
            setEditForm(
              null
            );
          }}
          onSave={
            saveChanges
          }
          onClose={() => {
            setSelectedMerchantId(
              ""
            );
            setDetail(
              null
            );
          }}
        />
      ) : null}
    </div>
  );
}

function MarketingRow({
  merchant,
  onView,
}: {
  merchant: AdminMarketingMerchant;
  onView: () => void;
}) {
  return (
    <tr className="text-sm transition hover:bg-white/[0.018]">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <MerchantAvatar
            merchant={
              merchant
            }
          />

          <div>
            <p className="font-medium text-white">
              {merchant.businessName ||
                merchant.displayName ||
                merchant.merchantId}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              {merchant.merchantId}
              {merchant.category
                ? ` · ${merchant.category}`
                : ""}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <p className="font-medium text-white">
          {formatPercent(
            merchant.normalBudget
          )}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          Merchant base rate
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="font-medium text-emerald-300">
          {formatPercent(
            merchant.currentBudget
          )}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {merchant.boostActive
            ? "Boost rate active"
            : "Normal rate active"}
        </p>
      </td>

      <td className="px-4 py-4">
        {merchant.boostEnabled ? (
          <>
            <p className="text-amber-300">
              {formatPercent(
                merchant.boostBudget
              )}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              {merchant.boostActive
                ? "Currently active"
                : "Scheduled / ended"}
            </p>
          </>
        ) : (
          <span className="text-slate-600">
            Disabled
          </span>
        )}
      </td>

      <td className="px-4 py-4">
        {merchant.acceptRewardCredits ? (
          <>
            <p className="text-violet-300">
              Enabled
            </p>

            <p className="mt-1 text-xs text-slate-600">
              {formatPercent(
                merchant.redemptionLimit
              )}{" "}
              limit
            </p>
          </>
        ) : (
          <span className="text-slate-600">
            Disabled
          </span>
        )}
      </td>

      <td className="px-4 py-4">
        <StatusBadge
          status={
            merchant.status
          }
        />
      </td>

      <td className="px-4 py-4 text-slate-400">
        {formatDateTime(
          merchant.updatedAt
        )}
      </td>

      <td className="px-6 py-4 text-right">
        <button
          type="button"
          onClick={
            onView
          }
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
      </td>
    </tr>
  );
}

function MarketingDrawer({
  detail,
  loading,
  editOpen,
  editForm,
  saving,
  onOpenEdit,
  onEditChange,
  onCancelEdit,
  onSave,
  onClose,
}: {
  detail: AdminMarketingDetail | null;
  loading: boolean;
  editOpen: boolean;
  editForm: EditForm | null;
  saving: boolean;
  onOpenEdit: () => void;
  onEditChange: (
    value: EditForm
  ) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close merchant marketing details"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-white/[0.09] bg-slate-950 shadow-2xl shadow-black/60">
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <BarChart3 className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Marketing settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {detail?.merchant
                .businessName ||
                "Loading merchant"}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {loading ||
          !detail ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
            </div>
          ) : editOpen &&
            editForm ? (
            <MarketingEditForm
              merchant={
                detail.merchant
              }
              form={
                editForm
              }
              onChange={
                onEditChange
              }
            />
          ) : (
            <MarketingDetailView
              merchant={
                detail.merchant
              }
            />
          )}
        </div>

        {!loading &&
        detail ? (
          <footer className="border-t border-white/[0.08] bg-slate-950 px-5 py-4 sm:px-7">
            {editOpen ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={
                    onCancelEdit
                  }
                  disabled={
                    saving
                  }
                  className="h-12 flex-1 rounded-xl border border-white/[0.08] text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    onSave
                  }
                  disabled={
                    saving
                  }
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  Save changes
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={
                  onOpenEdit
                }
                disabled={
                  !detail.actions
                    .canEdit
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
                Edit marketing settings
              </button>
            )}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function MarketingDetailView({
  merchant,
}: {
  merchant: AdminMarketingMerchant;
}) {
  return (
    <div className="space-y-5">
      <DetailSection title="Merchant">
        <DetailGrid>
          <DetailItem
            label="Business"
            value={
              merchant.businessName ||
              "—"
            }
          />

          <DetailItem
            label="Merchant ID"
            value={
              merchant.merchantId
            }
          />

          <DetailItem
            label="Category"
            value={[
              merchant.category,
              merchant.subCategory,
            ]
              .filter(Boolean)
              .join(" · ") ||
              "—"}
          />

          <DetailItem
            label="Location"
            value={[
              merchant.area,
              merchant.state,
            ]
              .filter(Boolean)
              .join(", ") ||
              "—"}
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Marketing Budget">
        <DetailGrid>
          <DetailItem
            label="Normal Budget"
            value={formatPercent(
              merchant.normalBudget
            )}
          />

          <DetailItem
            label="Current Budget"
            value={formatPercent(
              merchant.currentBudget
            )}
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Boost Budget">
        <DetailGrid>
          <DetailItem
            label="Boost Enabled"
            value={
              merchant.boostEnabled
                ? "Yes"
                : "No"
            }
          />

          <DetailItem
            label="Boost Active"
            value={
              merchant.boostActive
                ? "Yes"
                : "No"
            }
          />

          <DetailItem
            label="Boost Budget"
            value={
              merchant.boostEnabled
                ? formatPercent(
                    merchant.boostBudget
                  )
                : "—"
            }
          />

          <DetailItem
            label="Boost Count"
            value={formatNumber(
              merchant.boostCount
            )}
          />

          <DetailItem
            label="Boost Start"
            value={formatDateTime(
              merchant.boostStart
            )}
          />

          <DetailItem
            label="Boost End"
            value={formatDateTime(
              merchant.boostEnd
            )}
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Reward Credits">
        <DetailGrid>
          <DetailItem
            label="Acceptance"
            value={
              merchant
                .acceptRewardCredits
                ? "Enabled"
                : "Disabled"
            }
          />

          <DetailItem
            label="Redemption Limit"
            value={
              merchant
                .acceptRewardCredits
                ? formatPercent(
                    merchant
                      .redemptionLimit
                  )
                : "0%"
            }
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Last Update">
        <DetailItem
          label="Updated At"
          value={formatDateTime(
            merchant.updatedAt
          )}
        />
      </DetailSection>
    </div>
  );
}

function MarketingEditForm({
  merchant,
  form,
  onChange,
}: {
  merchant: AdminMarketingMerchant;
  form: EditForm;
  onChange: (
    value: EditForm
  ) => void;
}) {
  function patch(
    value: Partial<EditForm>
  ) {
    onChange({
      ...form,
      ...value,
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
        <p className="text-sm font-semibold text-white">
          {merchant.businessName}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {merchant.merchantId}
        </p>
      </div>

      <FormSection
        title="Normal Marketing Budget"
        description="Base marketing percentage used when no boost is active."
      >
        <FormField
          label="Normal Budget %"
          hint="Minimum 5%"
        >
          <input
            type="number"
            min="5"
            max="100"
            step="0.01"
            value={
              form.normalBudget
            }
            onChange={(
              event
            ) =>
              patch({
                normalBudget:
                  event.target
                    .value,
              })
            }
            className={
              inputClass
            }
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Reward Credits"
        description="Control whether members can use Reward Credits at this merchant."
      >
        <ToggleField
          label="Accept Reward Credits"
          checked={
            form.acceptRewardCredits
          }
          onChange={(
            checked
          ) =>
            patch({
              acceptRewardCredits:
                checked,
              redemptionLimit:
                checked &&
                Number(
                  form.redemptionLimit
                ) <= 0
                  ? "30"
                  : form.redemptionLimit,
            })
          }
        />

        <FormField
          label="Redemption Limit %"
          hint="Maximum percentage of the purchase amount"
        >
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            disabled={
              !form
                .acceptRewardCredits
            }
            value={
              form.redemptionLimit
            }
            onChange={(
              event
            ) =>
              patch({
                redemptionLimit:
                  event.target
                    .value,
              })
            }
            className={
              inputClass
            }
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Boost Budget"
        description="Temporarily increase the marketing budget for a selected period."
      >
        <ToggleField
          label="Enable Boost Budget"
          checked={
            form.boostEnabled
          }
          onChange={(
            checked
          ) =>
            patch({
              boostEnabled:
                checked,
              boostBudget:
                checked &&
                !form.boostBudget
                  ? form.normalBudget
                  : form.boostBudget,
            })
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Boost Budget %"
            hint="Must be equal to or higher than normal budget"
          >
            <input
              type="number"
              min="5"
              max="100"
              step="0.01"
              disabled={
                !form.boostEnabled
              }
              value={
                form.boostBudget
              }
              onChange={(
                event
              ) =>
                patch({
                  boostBudget:
                    event.target
                      .value,
                })
              }
              className={
                inputClass
              }
            />
          </FormField>

          <div />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Boost Start"
          >
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="datetime-local"
                disabled={
                  !form.boostEnabled
                }
                value={
                  form.boostStart
                }
                onChange={(
                  event
                ) =>
                  patch({
                    boostStart:
                      event.target
                        .value,
                  })
                }
                className={
                  inputClass +
                  " pl-11"
                }
              />
            </div>
          </FormField>

          <FormField
            label="Boost End"
          >
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="datetime-local"
                disabled={
                  !form.boostEnabled
                }
                value={
                  form.boostEnd
                }
                onChange={(
                  event
                ) =>
                  patch({
                    boostEnd:
                      event.target
                        .value,
                  })
                }
                className={
                  inputClass +
                  " pl-11"
                }
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Admin Update Reason"
        description="Required for every admin marketing change."
      >
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
                event.target
                  .value,
            })
          }
          placeholder="Example: Updated based on approved merchant request"
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-slate-950/65 px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10"
        />
      </FormSection>
    </div>
  );
}

function MerchantAvatar({
  merchant,
}: {
  merchant: AdminMarketingMerchant;
}) {
  const initials =
    getInitials(
      merchant.businessName ||
      merchant.displayName ||
      merchant.merchantId
    );

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.08] text-sm font-semibold text-emerald-300">
      {merchant.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={
            merchant.logoUrl
          }
          alt=""
          className="h-full w-full object-cover"
          onError={(
            event
          ) => {
            event.currentTarget.style.display =
              "none";
          }}
        />
      ) : (
        initials
      )}
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
  icon: typeof Store;
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

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-600">
        {description}
      </p>

      <div className="mt-5 space-y-4">
        {children}
      </div>
    </section>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-300">
        {label}
      </span>

      {hint ? (
        <span className="ml-2 text-xs text-slate-600">
          {hint}
        </span>
      ) : null}

      <div className="mt-2">
        {children}
      </div>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-slate-950/45 px-4 py-4">
      <span className="text-sm text-slate-300">
        {label}
      </span>

      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.checked
          )
        }
        className="h-5 w-5 accent-emerald-400"
      />
    </label>
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
    )
      .trim()
      .toUpperCase();

  const className =
    normalized ===
    "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized ===
          "SUSPENDED"
        ? "border-red-400/20 bg-red-400/10 text-red-300"
        : "border-slate-400/20 bg-slate-400/10 text-slate-300";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {normalized ||
        "UNKNOWN"}
    </span>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/65 px-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40";

const pageButtonClass =
  "flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30";

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(
    Number(
      value || 0
    )
  );
}

function formatPercent(
  value: number
) {
  return `${new Intl.NumberFormat(
    "en-MY",
    {
      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      value || 0
    )
  )}%`;
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
      dateStyle:
        "medium",
      timeStyle:
        "short",
    }
  ).format(date);
}

function toDateTimeInput(
  value: string
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  const local =
    new Date(
      date.getTime() -
      offset * 60000
    );

  return local
    .toISOString()
    .slice(0, 16);
}

function getInitials(
  value: string
) {
  const parts =
    String(
      value || ""
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    !parts.length
  ) {
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
