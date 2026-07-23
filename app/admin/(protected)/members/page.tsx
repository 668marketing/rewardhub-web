"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Star,
  UserCheck,
  UserRound,
  Users,
  UserX,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminMember,
  AdminMembersData,
  getAdminMembers,
} from "@/lib/admin-members";

const DEFAULT_LIMIT = 25;

type SortDirection =
  | "ASC"
  | "DESC";

export default function AdminMembersPage() {
  const [data, setData] =
    useState<AdminMembersData | null>(
      null
    );

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [tier, setTier] =
    useState("");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(DEFAULT_LIMIT);

  const [sortBy, setSortBy] =
    useState("CREATED_AT");

  const [
    sortDirection,
    setSortDirection,
  ] = useState<SortDirection>(
    "DESC"
  );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const loadMembers =
    useCallback(
      async (
        isManualRefresh = false
      ) => {
        try {
          setError("");

          if (isManualRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const result =
            await getAdminMembers({
              search,
              status,
              tier,
              dateFrom,
              dateTo,
              page,
              limit,
              sortBy,
              sortDirection,
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
          console.error(
            "Admin members load error:",
            loadError
          );

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load members."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        search,
        status,
        tier,
        dateFrom,
        dateTo,
        page,
        limit,
        sortBy,
        sortDirection,
      ]
    );

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        const normalized =
          searchInput.trim();

        setSearch((current) => {
          if (
            current === normalized
          ) {
            return current;
          }

          setPage(1);
          return normalized;
        });
      }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  const hasFilters =
    Boolean(
      search ||
        status ||
        tier ||
        dateFrom ||
        dateTo
    );

  const displayedRange =
    useMemo(() => {
      if (!data) {
        return {
          start: 0,
          end: 0,
        };
      }

      const total =
        data.pagination.total;

      if (total === 0) {
        return {
          start: 0,
          end: 0,
        };
      }

      const start =
        (data.pagination.page - 1) *
          data.pagination.limit +
        1;

      const end =
        Math.min(
          start +
            data.members.length -
            1,
          total
        );

      return {
        start,
        end,
      };
    }, [data]);

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setTier("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setSortBy("CREATED_AT");
    setSortDirection("DESC");
  }

  function changeFilter(
    setter: (
      value: string
    ) => void,
    value: string
  ) {
    setter(value);
    setPage(1);
  }

  function handleSort(
    field: string
  ) {
    setPage(1);

    if (sortBy === field) {
      setSortDirection(
        (current) =>
          current === "ASC"
            ? "DESC"
            : "ASC"
      );

      return;
    }

    setSortBy(field);
    setSortDirection("DESC");
  }

  function exportCsv() {
    if (
      !data ||
      data.members.length === 0
    ) {
      return;
    }

    const headers = [
      "Member ID",
      "Card ID",
      "Full Name",
      "Email",
      "Phone",
      "Tier",
      "Status",
      "Points",
      "Reward Credits",
      "Total Spend",
      "Total Transactions",
      "Referral Code",
      "Referred By Member",
      "Referred By Merchant",
      "Created At",
    ];

    const rows =
      data.members.map(
        (member) => [
          member.memberId,
          member.cardId,
          member.fullName,
          member.email,
          member.phone,
          member.tier,
          member.status,
          member.points,
          member.rewardCredits,
          member.totalSpend,
          member.totalTransactions,
          member.referralCode,
          member.referredByMemberId,
          member.referredByMerchantId,
          member.createdAt,
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

    const blob = new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      `rewardhub-members-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  if (loading && !data) {
    return <MembersLoading />;
  }

  if (!data) {
    return (
      <MembersError
        message={
          error ||
          "Member information is unavailable."
        }
        onRetry={() =>
          loadMembers()
        }
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <Users className="h-4 w-4" />
            Member management
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Members
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Search, review and manage
            RewardHub member accounts,
            tiers, balances and activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              setFiltersOpen(
                (current) => !current
              )
            }
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white lg:hidden"
          >
            <Filter className="h-4 w-4" />
            Filters

            {hasFilters ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-slate-950">
                {
                  [
                    search,
                    status,
                    tier,
                    dateFrom,
                    dateTo,
                  ].filter(Boolean).length
                }
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() =>
              loadMembers(true)
            }
            disabled={refreshing}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={[
                "h-4 w-4",
                refreshing
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />

            {refreshing
              ? "Refreshing…"
              : "Refresh"}
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={
              data.members.length === 0
            }
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export page
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Members"
          value={data.summary.total}
          description={`${formatNumber(
            data.summary.active
          )} active members`}
          icon={Users}
        />

        <SummaryCard
          label="Active"
          value={data.summary.active}
          description={`${formatNumber(
            data.summary.suspended
          )} suspended`}
          icon={UserCheck}
        />

        <SummaryCard
          label="Gold Members"
          value={data.summary.gold}
          description={`${formatNumber(
            data.summary.silver
          )} Silver members`}
          icon={Star}
        />

        <SummaryCard
          label="Platinum"
          value={
            data.summary.platinum
          }
          description={`${formatNumber(
            data.summary.inactive
          )} inactive`}
          icon={CircleDollarSign}
        />
      </section>

      <section
        className={[
          "mt-6 rounded-3xl border border-white/[0.07] bg-white/[0.03] p-4 sm:p-5",
          filtersOpen
            ? "block"
            : "hidden lg:block",
        ].join(" ")}
      >
        <div className="flex items-center justify-between lg:hidden">
          <h2 className="text-sm font-medium text-white">
            Filters
          </h2>

          <button
            type="button"
            onClick={() =>
              setFiltersOpen(false)
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:mt-0 lg:grid-cols-[minmax(260px,1.6fr)_repeat(4,minmax(140px,0.7fr))_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-600" />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search ID, name, email, phone or referral code"
              className="h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/55 pl-11 pr-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
            />

            {searchInput ? (
              <button
                type="button"
                onClick={() =>
                  setSearchInput("")
                }
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <select
            value={tier}
            onChange={(event) =>
              changeFilter(
                setTier,
                event.target.value
              )
            }
            className="h-12 rounded-xl border border-white/[0.08] bg-slate-950/55 px-4 text-sm text-slate-300 outline-none transition focus:border-emerald-400/40"
          >
            <option value="">
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
            value={status}
            onChange={(event) =>
              changeFilter(
                setStatus,
                event.target.value
              )
            }
            className="h-12 rounded-xl border border-white/[0.08] bg-slate-950/55 px-4 text-sm text-slate-300 outline-none transition focus:border-emerald-400/40"
          >
            <option value="">
              All statuses
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

          <input
            type="date"
            value={dateFrom}
            onChange={(event) =>
              changeFilter(
                setDateFrom,
                event.target.value
              )
            }
            aria-label="Registration date from"
            className="h-12 rounded-xl border border-white/[0.08] bg-slate-950/55 px-4 text-sm text-slate-300 outline-none transition focus:border-emerald-400/40"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) =>
              changeFilter(
                setDateTo,
                event.target.value
              )
            }
            aria-label="Registration date to"
            className="h-12 rounded-xl border border-white/[0.08] bg-slate-950/55 px-4 text-sm text-slate-300 outline-none transition focus:border-emerald-400/40"
          />

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-4 text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </section>

      {error ? (
        <div className="mt-5 flex items-start justify-between gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              loadMembers(true)
            }
            className="shrink-0 font-semibold text-amber-100 underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-white">
              Member Directory
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              Showing{" "}
              {formatNumber(
                displayedRange.start
              )}
              –{" "}
              {formatNumber(
                displayedRange.end
              )}{" "}
              of{" "}
              {formatNumber(
                data.pagination.total
              )}{" "}
              matching members
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-600">
              Rows
            </label>

            <select
              value={limit}
              onChange={(event) => {
                setLimit(
                  Number(
                    event.target.value
                  )
                );
                setPage(1);
              }}
              className="h-9 rounded-lg border border-white/[0.08] bg-slate-950/70 px-3 text-xs text-slate-300 outline-none"
            >
              <option value={10}>
                10
              </option>
              <option value={25}>
                25
              </option>
              <option value={50}>
                50
              </option>
              <option value={100}>
                100
              </option>
            </select>
          </div>
        </div>

        {refreshing ? (
          <div className="h-0.5 overflow-hidden bg-white/[0.03]">
            <div className="h-full w-1/3 animate-pulse bg-emerald-500" />
          </div>
        ) : null}

        {data.members.length === 0 ? (
          <MembersEmpty
            hasFilters={
              hasFilters
            }
            onReset={
              resetFilters
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1200px] border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-slate-950/30">
                    <TableHeader
                      label="Member"
                      field="FULL_NAME"
                      sortBy={sortBy}
                      direction={
                        sortDirection
                      }
                      onSort={
                        handleSort
                      }
                    />

                    <TableHeader
                      label="Tier"
                      field="TIER"
                      sortBy={sortBy}
                      direction={
                        sortDirection
                      }
                      onSort={
                        handleSort
                      }
                    />

                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      Reward Credits
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      Points
                    </th>

                    <TableHeader
                      label="Total Spend"
                      field="TOTAL_SPEND"
                      sortBy={sortBy}
                      direction={
                        sortDirection
                      }
                      onSort={
                        handleSort
                      }
                    />

                    <TableHeader
                      label="Transactions"
                      field="TOTAL_TRANSACTIONS"
                      sortBy={sortBy}
                      direction={
                        sortDirection
                      }
                      onSort={
                        handleSort
                      }
                    />

                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      Status
                    </th>

                    <TableHeader
                      label="Registered"
                      field="CREATED_AT"
                      sortBy={sortBy}
                      direction={
                        sortDirection
                      }
                      onSort={
                        handleSort
                      }
                    />

                    <th className="w-16 px-5 py-4" />
                  </tr>
                </thead>

                <tbody>
                  {data.members.map(
                    (member) => (
                      <MemberTableRow
                        key={
                          member.memberId
                        }
                        member={
                          member
                        }
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-white/[0.06] lg:hidden">
              {data.members.map(
                (member) => (
                  <MemberMobileCard
                    key={
                      member.memberId
                    }
                    member={member}
                  />
                )
              )}
            </div>
          </>
        )}

        <Pagination
          page={
            data.pagination.page
          }
          totalPages={
            data.pagination
              .totalPages
          }
          hasPrevious={
            data.pagination
              .hasPrevious
          }
          hasNext={
            data.pagination.hasNext
          }
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <article className="rounded-3xl border border-white/[0.07] bg-white/[0.035] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.04] text-slate-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {formatNumber(value)}
      </p>

      <p className="mt-3 text-xs text-slate-650">
        {description}
      </p>
    </article>
  );
}

function TableHeader({
  label,
  field,
  sortBy,
  direction,
  onSort,
}: {
  label: string;
  field: string;
  sortBy: string;
  direction: SortDirection;
  onSort: (field: string) => void;
}) {
  const active =
    sortBy === field;

  return (
    <th className="px-5 py-4 text-left">
      <button
        type="button"
        onClick={() =>
          onSort(field)
        }
        className={[
          "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition",
          active
            ? "text-emerald-300"
            : "text-slate-600 hover:text-slate-400",
        ].join(" ")}
      >
        {label}

        {active ? (
          direction === "ASC" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : null}
      </button>
    </th>
  );
}

function MemberTableRow({
  member,
}: {
  member: AdminMember;
}) {
  return (
    <tr className="group border-b border-white/[0.055] transition last:border-b-0 hover:bg-white/[0.025]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <MemberAvatar
            fullName={
              member.fullName
            }
            tier={member.tier}
          />

          <div className="min-w-0">
            <Link
              href={`/admin/members/${encodeURIComponent(
                member.memberId
              )}`}
              className="block max-w-[230px] truncate text-sm font-medium text-white transition hover:text-emerald-300"
            >
              {member.fullName ||
                "Unnamed member"}
            </Link>

            <p className="mt-1 max-w-[250px] truncate text-xs text-slate-600">
              {member.memberId}
              {member.email
                ? ` · ${member.email}`
                : ""}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <TierBadge
          tier={member.tier}
        />
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-medium text-white">
          {formatCurrency(
            member.rewardCredits
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-medium text-slate-300">
          {formatNumber(
            member.points
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-medium text-white">
          {formatCurrency(
            member.totalSpend
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm text-slate-300">
          {formatNumber(
            member.totalTransactions
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          status={member.status}
        />
      </td>

      <td className="px-5 py-4">
        <p className="text-sm text-slate-400">
          {formatDate(
            member.createdAt
          )}
        </p>
      </td>

      <td className="px-5 py-4 text-right">
        <Link
          href={`/admin/members/${encodeURIComponent(
            member.memberId
          )}`}
          aria-label={`View ${member.fullName}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] text-slate-500 transition hover:border-emerald-400/20 hover:bg-emerald-400/10 hover:text-emerald-300"
        >
          <Eye className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

function MemberMobileCard({
  member,
}: {
  member: AdminMember;
}) {
  return (
    <Link
      href={`/admin/members/${encodeURIComponent(
        member.memberId
      )}`}
      className="block p-5 transition hover:bg-white/[0.025]"
    >
      <div className="flex items-start gap-3">
        <MemberAvatar
          fullName={
            member.fullName
          }
          tier={member.tier}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-white">
              {member.fullName ||
                "Unnamed member"}
            </p>

            <TierBadge
              tier={member.tier}
            />

            <StatusBadge
              status={
                member.status
              }
            />
          </div>

          <p className="mt-1 truncate text-xs text-slate-600">
            {member.memberId}
          </p>

          <p className="mt-1 truncate text-xs text-slate-600">
            {member.email ||
              member.phone ||
              "No contact information"}
          </p>
        </div>

        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-700" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MobileStat
          label="Reward Credits"
          value={formatCurrency(
            member.rewardCredits
          )}
        />

        <MobileStat
          label="Points"
          value={formatNumber(
            member.points
          )}
        />

        <MobileStat
          label="Total Spend"
          value={formatCurrency(
            member.totalSpend
          )}
        />

        <MobileStat
          label="Transactions"
          value={formatNumber(
            member.totalTransactions
          )}
        />
      </div>
    </Link>
  );
}

function MemberAvatar({
  fullName,
  tier,
}: {
  fullName: string;
  tier: string;
}) {
  const normalizedTier =
    tier.toUpperCase();

  const className =
    normalizedTier === "PLATINUM"
      ? "border-violet-400/15 bg-violet-400/10 text-violet-300"
      : normalizedTier === "GOLD"
        ? "border-amber-400/15 bg-amber-400/10 text-amber-300"
        : "border-slate-400/10 bg-slate-400/10 text-slate-300";

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-xs font-semibold uppercase ${className}`}
    >
      {getInitials(fullName)}
    </div>
  );
}

function TierBadge({
  tier,
}: {
  tier: string;
}) {
  const normalized =
    tier.toUpperCase();

  const className =
    normalized === "PLATINUM"
      ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
      : normalized === "GOLD"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : "border-slate-400/10 bg-slate-400/10 text-slate-400";

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${className}`}
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
    status.toUpperCase();

  const className =
    normalized === "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized ===
          "SUSPENDED"
        ? "border-red-400/20 bg-red-400/10 text-red-300"
        : "border-slate-400/10 bg-slate-400/10 text-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${className}`}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          normalized === "ACTIVE"
            ? "bg-emerald-400"
            : normalized ===
                "SUSPENDED"
              ? "bg-red-400"
              : "bg-slate-500",
        ].join(" ")}
      />

      {normalized || "UNKNOWN"}
    </span>
  );
}

function MobileStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-slate-950/35 p-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-700">
        {label}
      </p>

      <p className="mt-1.5 truncate text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (
    page: number
  ) => void;
}) {
  const pages =
    buildPaginationPages(
      page,
      totalPages
    );

  return (
    <div className="flex flex-col gap-4 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-slate-600">
        Page{" "}
        <span className="font-medium text-slate-400">
          {page}
        </span>{" "}
        of{" "}
        <span className="font-medium text-slate-400">
          {totalPages}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={() =>
            onPageChange(page - 1)
          }
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] px-3 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map(
            (item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-10 w-8 items-center justify-center text-xs text-slate-700"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    onPageChange(
                      item
                    )
                  }
                  className={[
                    "flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-xs font-medium transition",
                    item === page
                      ? "bg-emerald-500 text-slate-950"
                      : "border border-white/[0.07] text-slate-500 hover:bg-white/[0.06] hover:text-white",
                  ].join(" ")}
                >
                  {item}
                </button>
              )
          )}
        </div>

        <button
          type="button"
          disabled={!hasNext}
          onClick={() =>
            onPageChange(page + 1)
          }
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] px-3 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MembersEmpty({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/[0.07] bg-white/[0.035] text-slate-600">
        {hasFilters ? (
          <Search className="h-7 w-7" />
        ) : (
          <Users className="h-7 w-7" />
        )}
      </div>

      <h3 className="mt-5 text-base font-medium text-white">
        {hasFilters
          ? "No matching members"
          : "No members found"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
        {hasFilters
          ? "Try changing or clearing the current search and filter criteria."
          : "Registered RewardHub members will appear here."}
      </p>

      {hasFilters ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          <RotateCcw className="h-4 w-4" />
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function MembersLoading() {
  return (
    <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="animate-pulse">
        <div className="h-4 w-40 rounded bg-white/[0.06]" />
        <div className="mt-4 h-10 w-64 rounded bg-white/[0.07]" />
        <div className="mt-4 h-4 w-96 max-w-full rounded bg-white/[0.05]" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-44 rounded-3xl border border-white/[0.06] bg-white/[0.025]"
            />
          ))}
        </div>

        <div className="mt-6 h-20 rounded-3xl border border-white/[0.06] bg-white/[0.025]" />

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/[0.06]">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="h-20 border-b border-white/[0.05] bg-white/[0.02] last:border-b-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MembersError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-red-400/10 p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <h1 className="mt-5 text-lg font-semibold text-white">
          Unable to load members
        </h1>

        <p className="mt-3 text-sm leading-6 text-red-200">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-red-200"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  );
}

function buildPaginationPages(
  currentPage: number,
  totalPages: number
): Array<number | "ellipsis"> {
  if (totalPages <= 5) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) => index + 1
    );
  }

  if (currentPage <= 3) {
    return [
      1,
      2,
      3,
      4,
      "ellipsis",
      totalPages,
    ];
  }

  if (
    currentPage >=
    totalPages - 2
  ) {
    return [
      1,
      "ellipsis",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

function getInitials(
  fullName: string
) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "MB";
  }

  return parts
    .slice(0, 2)
    .map((part) =>
      part.charAt(0)
    )
    .join("")
    .toUpperCase();
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
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value || 0)
  );
}

function formatDate(
  value: string
) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      dateStyle: "medium",
    }
  ).format(date);
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