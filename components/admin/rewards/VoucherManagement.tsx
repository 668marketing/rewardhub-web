"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminRewardVoucher,
  AdminRewardVoucherRewardOption,
  AdminRewardVoucherStats,
  createAdminRewardVouchers,
  generateAdminRewardVoucherCodes,
  getAdminRewardVouchers,
  updateAdminRewardVoucherStatus,
} from "@/lib/admin-reward-vouchers";

type ModalMode =
  | "AUTO"
  | "IMPORT";

type NoticeState = {
  type: "success" | "error";
  message: string;
} | null;

const EMPTY_STATS: AdminRewardVoucherStats = {
  total: 0,
  available: 0,
  assigned: 0,
  redeemed: 0,
  expired: 0,
  disabled: 0,
};

function formatDateTime(
  value: string
) {
  if (!value) {
    return "—";
  }

  const normalized =
    value.includes("T")
      ? value
      : value.replace(
          " ",
          "T"
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
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function statusClassName(
  status: string
) {
  const base =
    "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold";

  switch (status) {
    case "AVAILABLE":
      return `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-300`;

    case "ASSIGNED":
      return `${base} border-blue-500/30 bg-blue-500/10 text-blue-300`;

    case "REDEEMED":
      return `${base} border-violet-500/30 bg-violet-500/10 text-violet-300`;

    case "EXPIRED":
      return `${base} border-amber-500/30 bg-amber-500/10 text-amber-300`;

    case "DISABLED":
      return `${base} border-slate-500/30 bg-slate-500/10 text-slate-300`;

    default:
      return `${base} border-white/10 bg-white/5 text-slate-300`;
  }
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1428] p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold text-white">
        {value.toLocaleString()}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {helper}
      </p>
    </div>
  );
}

export default function VoucherManagement() {
  const [vouchers, setVouchers] =
    useState<AdminRewardVoucher[]>(
      []
    );

  const [
    rewardOptions,
    setRewardOptions,
  ] = useState<
    AdminRewardVoucherRewardOption[]
  >([]);

  const [stats, setStats] =
    useState<AdminRewardVoucherStats>(
      EMPTY_STATS
    );

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [rewardId, setRewardId] =
    useState("ALL");

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(25);

  const [totalItems, setTotalItems] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);

  const [
    showingFrom,
    setShowingFrom,
  ] = useState(0);

  const [showingTo, setShowingTo] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [
    actionVoucherId,
    setActionVoucherId,
  ] = useState("");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [modalMode, setModalMode] =
    useState<ModalMode>("AUTO");

  const [notice, setNotice] =
    useState<NoticeState>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    selectedRewardId,
    setSelectedRewardId,
  ] = useState("");

  const [quantity, setQuantity] =
    useState("10");

  const [prefix, setPrefix] =
    useState("RH-");

  const [digits, setDigits] =
    useState("6");

  const [
    voucherCodesText,
    setVoucherCodesText,
  ] = useState("");

  const [expiredAt, setExpiredAt] =
    useState("");

  const [note, setNote] =
    useState("");

  const selectedReward =
    useMemo(
      function () {
        return rewardOptions.find(
          function (reward) {
            return (
              reward.rewardId ===
              selectedRewardId
            );
          }
        );
      },
      [
        rewardOptions,
        selectedRewardId,
      ]
    );

  const loadVouchers =
    useCallback(
      async function () {
        setLoading(true);

        try {
          const result =
            await getAdminRewardVouchers(
              {
                search,
                status,
                rewardId,
                page,
                pageSize,
              }
            );

            console.log(
  "Voucher API result:",
  result
);  

          setVouchers(
            result.vouchers || []
          );

          setRewardOptions(
            result.rewards || []
          );

          setStats(
            result.stats ||
              EMPTY_STATS
          );

          setTotalItems(
            result.pagination
              ?.totalItems || 0
          );

          setTotalPages(
            result.pagination
              ?.totalPages || 1
          );

          setShowingFrom(
            result.pagination
              ?.showingFrom || 0
          );

          setShowingTo(
            result.pagination
              ?.showingTo || 0
          );
        } catch (error) {
          setNotice({
            type: "error",

            message:
              error instanceof Error
                ? error.message
                : "Unable to load voucher codes.",
          });
        } finally {
          setLoading(false);
        }
      },
      [
        page,
        pageSize,
        rewardId,
        search,
        status,
      ]
    );

  useEffect(
    function () {
      void loadVouchers();
    },
    [loadVouchers]
  );

  useEffect(
    function () {
      if (
        !selectedRewardId &&
        rewardOptions.length > 0
      ) {
        setSelectedRewardId(
          rewardOptions[0]
            .rewardId
        );
      }
    },
    [
      rewardOptions,
      selectedRewardId,
    ]
  );

  function resetModal() {
    setModalMode("AUTO");

    setQuantity("10");

    setPrefix("RH-");

    setDigits("6");

    setVoucherCodesText("");

    setExpiredAt("");

    setNote("");

    if (
      rewardOptions.length > 0
    ) {
      setSelectedRewardId(
        rewardOptions[0]
          .rewardId
      );
    }
  }

  function openGenerateModal() {
    setNotice(null);

    resetModal();

    setModalOpen(true);
  }

  function closeGenerateModal() {
    if (submitting) {
      return;
    }

    setModalOpen(false);
  }

  function handleSearchSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPage(1);

    setSearch(
      searchInput.trim()
    );
  }

  async function handleGenerateSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setNotice(null);

    if (!selectedRewardId) {
      setNotice({
        type: "error",
        message:
          "Please select a reward.",
      });

      return;
    }

    setSubmitting(true);

    try {
      if (
        modalMode ===
        "AUTO"
      ) {
        const parsedQuantity =
          Math.floor(
            Number(quantity)
          );

        const parsedDigits =
          Math.floor(
            Number(digits)
          );

        if (
          !Number.isFinite(
            parsedQuantity
          ) ||
          parsedQuantity < 1
        ) {
          throw new Error(
            "Quantity must be at least 1."
          );
        }

        if (
          parsedQuantity > 500
        ) {
          throw new Error(
            "A maximum of 500 voucher codes can be generated at one time."
          );
        }

        const result =
          await generateAdminRewardVoucherCodes(
            {
              rewardId:
                selectedRewardId,

              quantity:
                parsedQuantity,

              prefix:
                prefix.trim(),

              digits:
                parsedDigits,

              expiredAt,

              note:
                note.trim(),
            }
          );

        setNotice({
          type: "success",

          message:
            `${result.createdCount} voucher code(s) generated successfully. ` +
            `${result.firstVoucherCode} to ${result.lastVoucherCode}`,
        });
      } else {
        const codes =
          voucherCodesText
            .split(
              /[\n,\r]+/
            )
            .map(function (code) {
              return code.trim();
            })
            .filter(Boolean);

        if (
          codes.length === 0
        ) {
          throw new Error(
            "Please enter at least one voucher code."
          );
        }

        const result =
          await createAdminRewardVouchers(
            {
              rewardId:
                selectedRewardId,

              voucherCodes:
                codes,

              expiredAt,

              note:
                note.trim(),
            }
          );

        setNotice({
          type: "success",

          message:
            `${result.createdCount} voucher code(s) imported. ` +
            `${result.skippedCount} duplicate code(s) skipped.`,
        });
      }

      setModalOpen(false);

      setPage(1);

      await loadVouchers();
    } catch (error) {
      setNotice({
        type: "error",

        message:
          error instanceof Error
            ? error.message
            : "Unable to process voucher codes.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVoucherStatus(
    voucher: AdminRewardVoucher
  ) {
    const newStatus =
      voucher.status ===
      "DISABLED"
        ? "AVAILABLE"
        : "DISABLED";

    const confirmationText =
      newStatus ===
      "DISABLED"
        ? `Disable voucher ${voucher.voucherCode}?`
        : `Enable voucher ${voucher.voucherCode}?`;

    const confirmed =
      window.confirm(
        confirmationText
      );

    if (!confirmed) {
      return;
    }

    setActionVoucherId(
      voucher.voucherId
    );

    setNotice(null);

    try {
      await updateAdminRewardVoucherStatus(
        {
          voucherId:
            voucher.voucherId,

          status:
            newStatus,

          note:
            newStatus ===
            "DISABLED"
              ? "Disabled by administrator"
              : "Enabled by administrator",
        }
      );

      setNotice({
        type: "success",

        message:
          newStatus ===
          "DISABLED"
            ? "Voucher disabled successfully."
            : "Voucher enabled successfully.",
      });

      await loadVouchers();
    } catch (error) {
      setNotice({
        type: "error",

        message:
          error instanceof Error
            ? error.message
            : "Unable to update voucher status.",
      });
    } finally {
      setActionVoucherId(
        ""
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#050b18] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400">
              Rewards management
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Voucher Codes
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Generate, import and manage
              RewardHub voucher inventory.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={function () {
                void loadVouchers();
              }}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={
                openGenerateModal
              }
              className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              + Add Voucher Codes
            </button>
          </div>
        </div>

        {notice ? (
          <div
            className={
              notice.type ===
              "success"
                ? "mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
                : "mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            }
          >
            {notice.message}
          </div>
        ) : null}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryCard
            label="Total"
            value={stats.total}
            helper="All voucher codes"
          />

          <SummaryCard
            label="Available"
            value={
              stats.available
            }
            helper="Ready to allocate"
          />

          <SummaryCard
            label="Assigned"
            value={stats.assigned}
            helper="Allocated to members"
          />

          <SummaryCard
            label="Redeemed"
            value={stats.redeemed}
            helper="Successfully claimed"
          />

          <SummaryCard
            label="Expired"
            value={stats.expired}
            helper="No longer valid"
          />

          <SummaryCard
            label="Disabled"
            value={stats.disabled}
            helper="Manually disabled"
          />
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-[#0b1428]">
          <div className="border-b border-white/10 p-5">
            <form
              onSubmit={
                handleSearchSubmit
              }
              className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_260px_auto]"
            >
              <input
                value={searchInput}
                onChange={function (
                  event
                ) {
                  setSearchInput(
                    event.target.value
                  );
                }}
                placeholder="Search voucher code, member or reward"
                className="h-11 rounded-xl border border-white/10 bg-[#071020] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50"
              />

              <select
                value={status}
                onChange={function (
                  event
                ) {
                  setPage(1);

                  setStatus(
                    event.target.value
                  );
                }}
                className="h-11 rounded-xl border border-white/10 bg-[#071020] px-4 text-sm text-white outline-none"
              >
                <option value="ALL">
                  All statuses
                </option>

                <option value="AVAILABLE">
                  Available
                </option>

                <option value="ASSIGNED">
                  Assigned
                </option>

                <option value="REDEEMED">
                  Redeemed
                </option>

                <option value="EXPIRED">
                  Expired
                </option>

                <option value="DISABLED">
                  Disabled
                </option>
              </select>

              <select
                value={rewardId}
                onChange={function (
                  event
                ) {
                  setPage(1);

                  setRewardId(
                    event.target.value
                  );
                }}
                className="h-11 rounded-xl border border-white/10 bg-[#071020] px-4 text-sm text-white outline-none"
              >
                <option value="ALL">
                  All rewards
                </option>

                {rewardOptions.map(
                  function (reward) {
                    return (
                      <option
                        key={
                          reward.rewardId
                        }
                        value={
                          reward.rewardId
                        }
                      >
                        {reward.title}
                      </option>
                    );
                  }
                )}
              </select>

              <button
                type="submit"
                className="h-11 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Search
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">
                    Voucher code
                  </th>

                  <th className="px-5 py-4">
                    Reward
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Member
                  </th>

                  <th className="px-5 py-4">
                    Assigned
                  </th>

                  <th className="px-5 py-4">
                    Redeemed
                  </th>

                  <th className="px-5 py-4">
                    Expiry
                  </th>

                  <th className="px-5 py-4">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center text-sm text-slate-400"
                    >
                      Loading voucher
                      codes...
                    </td>
                  </tr>
                ) : vouchers.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <p className="text-base font-medium text-white">
                        No voucher codes
                        found
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Generate or import
                        voucher codes to
                        begin.
                      </p>
                    </td>
                  </tr>
                ) : (
                  vouchers.map(
                    function (voucher) {
                      const canToggle =
                        voucher.status ===
                          "AVAILABLE" ||
                        voucher.status ===
                          "DISABLED";

                      const processing =
                        actionVoucherId ===
                        voucher.voucherId;

                      return (
                        <tr
                          key={
                            voucher.voucherId
                          }
                          className="border-b border-white/5 text-sm transition hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-4">
                            <p className="font-mono font-medium text-white">
                              {
                                voucher.voucherCode
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                voucher.voucherId
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-200">
                              {voucher.rewardTitle ||
                                "Unknown reward"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                voucher.rewardId
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={statusClassName(
                                voucher.status
                              )}
                            >
                              {
                                voucher.status
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-300">
                            {voucher.memberId ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-slate-400">
                            {formatDateTime(
                              voucher.assignedAt
                            )}
                          </td>

                          <td className="px-5 py-4 text-slate-400">
                            {formatDateTime(
                              voucher.redeemedAt
                            )}
                          </td>

                          <td className="px-5 py-4 text-slate-400">
                            {formatDateTime(
                              voucher.expiredAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {canToggle ? (
                              <button
                                type="button"
                                disabled={
                                  processing
                                }
                                onClick={function () {
                                  void handleVoucherStatus(
                                    voucher
                                  );
                                }}
                                className={
                                  voucher.status ===
                                  "DISABLED"
                                    ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                                    : "rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                                }
                              >
                                {processing
                                  ? "Updating..."
                                  : voucher.status ===
                                      "DISABLED"
                                    ? "Enable"
                                    : "Disable"}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-600">
                                View only
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {showingFrom} to{" "}
              {showingTo} of{" "}
              {totalItems.toLocaleString()}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={pageSize}
                onChange={function (
                  event
                ) {
                  setPage(1);

                  setPageSize(
                    Number(
                      event.target.value
                    )
                  );
                }}
                className="h-10 rounded-lg border border-white/10 bg-[#071020] px-3 text-sm text-white"
              >
                <option value={10}>
                  10 per page
                </option>

                <option value={25}>
                  25 per page
                </option>

                <option value={50}>
                  50 per page
                </option>

                <option value={100}>
                  100 per page
                </option>

                <option value={200}>
                  200 per page
                </option>
              </select>

              <button
                type="button"
                disabled={
                  page <= 1 ||
                  loading
                }
                onClick={function () {
                  setPage(function (
                    currentPage
                  ) {
                    return Math.max(
                      1,
                      currentPage - 1
                    );
                  });
                }}
                className="h-10 rounded-lg border border-white/10 px-4 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-slate-400">
                Page {page} of{" "}
                {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  page >= totalPages ||
                  loading
                }
                onClick={function () {
                  setPage(function (
                    currentPage
                  ) {
                    return Math.min(
                      totalPages,
                      currentPage + 1
                    );
                  });
                }}
                className="h-10 rounded-lg border border-white/10 px-4 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1428] shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Add Voucher Codes
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Automatically generate
                  codes or import codes
                  supplied by a merchant.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeGenerateModal
                }
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={
                handleGenerateSubmit
              }
            >
              <div className="space-y-5 p-6">
                <div className="grid grid-cols-2 rounded-xl bg-[#071020] p-1">
                  <button
                    type="button"
                    onClick={function () {
                      setModalMode(
                        "AUTO"
                      );
                    }}
                    className={
                      modalMode ===
                      "AUTO"
                        ? "rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950"
                        : "rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400"
                    }
                  >
                    Auto Generate
                  </button>

                  <button
                    type="button"
                    onClick={function () {
                      setModalMode(
                        "IMPORT"
                      );
                    }}
                    className={
                      modalMode ===
                      "IMPORT"
                        ? "rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950"
                        : "rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400"
                    }
                  >
                    Bulk Import
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Reward
                  </label>

                  <select
                    value={
                      selectedRewardId
                    }
                    onChange={function (
                      event
                    ) {
                      setSelectedRewardId(
                        event.target.value
                      );
                    }}
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#071020] px-4 text-sm text-white outline-none focus:border-emerald-400/50"
                  >
                    {rewardOptions.length ===
                    0 ? (
                      <option value="">
                        No Voucher or
                        Digital rewards
                      </option>
                    ) : (
                      rewardOptions.map(
                        function (
                          reward
                        ) {
                          return (
                            <option
                              key={
                                reward.rewardId
                              }
                              value={
                                reward.rewardId
                              }
                            >
                              {
                                reward.title
                              }{" "}
                              —{" "}
                              {
                                reward.rewardType
                              }
                            </option>
                          );
                        }
                      )
                    )}
                  </select>

                  {selectedReward ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Reward ID:{" "}
                      {
                        selectedReward.rewardId
                      }
                    </p>
                  ) : null}
                </div>

                {modalMode ===
                "AUTO" ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Quantity
                        </label>

                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={
                            quantity
                          }
                          onChange={function (
                            event
                          ) {
                            setQuantity(
                              event.target
                                .value
                            );
                          }}
                          required
                          className="h-12 w-full rounded-xl border border-white/10 bg-[#071020] px-4 text-sm text-white outline-none focus:border-emerald-400/50"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Number digits
                        </label>

                        <select
                          value={digits}
                          onChange={function (
                            event
                          ) {
                            setDigits(
                              event.target
                                .value
                            );
                          }}
                          className="h-12 w-full rounded-xl border border-white/10 bg-[#071020] px-4 text-sm text-white outline-none"
                        >
                          <option value="4">
                            4 digits
                          </option>

                          <option value="5">
                            5 digits
                          </option>

                          <option value="6">
                            6 digits
                          </option>

                          <option value="7">
                            7 digits
                          </option>

                          <option value="8">
                            8 digits
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Voucher prefix
                      </label>

                      <input
                        value={prefix}
                        onChange={function (
                          event
                        ) {
                          setPrefix(
                            event.target
                              .value
                          );
                        }}
                        placeholder="RH-RM5-"
                        required
                        className="h-12 w-full rounded-xl border border-white/10 bg-[#071020] px-4 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/50"
                      />

                      <p className="mt-2 text-xs text-slate-500">
                        Example result:{" "}
                        {prefix || "RH-"}
                        {String(1).padStart(
                          Number(
                            digits || 6
                          ),
                          "0"
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Voucher codes
                    </label>

                    <textarea
                      value={
                        voucherCodesText
                      }
                      onChange={function (
                        event
                      ) {
                        setVoucherCodesText(
                          event.target.value
                        );
                      }}
                      rows={10}
                      placeholder={
                        "GRAB-X7K29\nGRAB-P82LA\nGRAB-M19QZ"
                      }
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#071020] px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/50"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Enter one voucher
                      code per line. Commas
                      are also supported.
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Expiry date
                  </label>

                  <input
                    type="date"
                    value={expiredAt}
                    onChange={function (
                      event
                    ) {
                      setExpiredAt(
                        event.target.value
                      );
                    }}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#071020] px-4 text-sm text-white outline-none focus:border-emerald-400/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Internal note
                  </label>

                  <textarea
                    value={note}
                    onChange={function (
                      event
                    ) {
                      setNote(
                        event.target.value
                      );
                    }}
                    rows={3}
                    placeholder="Campaign name or merchant reference"
                    className="w-full rounded-xl border border-white/10 bg-[#071020] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/50"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeGenerateModal
                  }
                  disabled={
                    submitting
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    rewardOptions.length ===
                      0
                  }
                  className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Processing..."
                    : modalMode ===
                        "AUTO"
                      ? "Generate Voucher Codes"
                      : "Import Voucher Codes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}