"use client";

import {
  AlertTriangle,
  Gift,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getAdminRewards,
  type AdminRewardCatalogItem,
  type AdminRewardCatalogListData,
} from "@/lib/admin-rewards";

export default function AdminRewardListPage() {
  const [data, setData] =
    useState<AdminRewardCatalogListData | null>(
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
    useState("ALL");

  const [category, setCategory] =
    useState("ALL");

  const [rewardType, setRewardType] =
    useState("ALL");

  const loadRewards =
    useCallback(
      async (
        showRefresh = false
      ) => {
        try {
          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const result =
            await getAdminRewards({
              search,
              status,
              category,
              rewardType,
              page: 1,
              pageSize: 100,
            });

          setData(result);
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load rewards."
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
        rewardType,
      ]
    );

  useEffect(() => {
    void loadRewards();
  }, [loadRewards]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setSearch(
          searchInput.trim()
        );
      }, 350);

    return () =>
      window.clearTimeout(timer);
  }, [searchInput]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center px-5">
        <div className="max-w-lg rounded-3xl border border-red-400/20 bg-red-400/10 p-7 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-red-300" />

          <h2 className="mt-4 text-lg font-semibold text-white">
            Unable to load rewards
          </h2>

          <p className="mt-3 text-sm text-red-200">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadRewards()
            }
            className="mt-5 rounded-xl bg-red-300 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const rewards =
    data?.rewards || [];

  return (
    <div className="space-y-7 pb-12 pt-6 lg:pt-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <Gift className="h-4 w-4" />
            Rewards management
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Manage Rewards
          </h1>

          <p className="mt-3 text-sm text-slate-500 sm:text-base">
            Create and manage official
            RewardHub rewards.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/rewards"
            className="inline-flex h-12 items-center rounded-2xl border border-white/[0.08] px-5 text-sm text-slate-300"
          >
            Back to Dashboard
          </Link>

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              void loadRewards(true)
            }
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/[0.08] px-5 text-sm text-slate-300"
          >
            <RefreshCw
              className={[
                "h-4 w-4",
                refreshing
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />
            Refresh
          </button>

          <Link
            href="/admin/rewards/new"
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950"
          >
            <Plus className="h-4 w-4" />
            Add Reward
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Rewards"
          value={data?.summary.total || 0}
          note={`${data?.summary.active || 0} active`}
        />

        <StatCard
          label="Low Stock"
          value={data?.summary.lowStock || 0}
          note={`${data?.summary.outOfStock || 0} out of stock`}
        />

        <StatCard
          label="Featured"
          value={data?.summary.featured || 0}
          note={`${data?.summary.unlimitedStock || 0} unlimited`}
        />

        <StatCard
          label="Draft / Hidden"
          value={
            (data?.summary.draft || 0) +
            (data?.summary.hidden || 0)
          }
          note={`${data?.summary.draft || 0} drafts`}
        />
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search rewards"
              className={inputClass + " pl-11"}
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            className={inputClass}
          >
            <option value="ALL">
              All statuses
            </option>

            {data?.options.statuses.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value
              )
            }
            className={inputClass}
          >
            <option value="ALL">
              All categories
            </option>

            {data?.options.categories.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          <select
            value={rewardType}
            onChange={(event) =>
              setRewardType(
                event.target.value
              )
            }
            className={inputClass}
          >
            <option value="ALL">
              All reward types
            </option>

            {data?.options.rewardTypes.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/50">
        <div className="border-b border-white/[0.07] px-5 py-5">
          <h2 className="font-semibold text-white">
            Reward Catalog
          </h2>

          <p className="mt-1 text-xs text-slate-600">
            {rewards.length} rewards
          </p>
        </div>

        {rewards.length ? (
          <div className="divide-y divide-white/[0.06]">
            {rewards.map((reward) => (
              <RewardRow
                key={reward.rewardId}
                reward={reward}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Gift className="mx-auto h-8 w-8 text-slate-700" />

            <p className="mt-4 text-sm text-slate-500">
              No rewards found.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function RewardRow({
  reward,
}: {
  reward: AdminRewardCatalogItem;
}) {
  const image =
    reward.thumbnailUrl ||
    reward.imageUrl;

  return (
    <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center">
      {image ? (
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl">
          {reward.rewardType ===
          "PHYSICAL"
            ? "🎁"
            : reward.rewardType ===
                "VOUCHER"
              ? "🎫"
              : "📱"}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-white">
            {reward.title}
          </h3>

          {reward.featured ? (
            <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
          ) : null}
        </div>

        <p className="mt-1 text-xs text-slate-600">
          {reward.rewardId} ·{" "}
          {reward.category} ·{" "}
          {reward.rewardType}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 text-sm sm:grid-cols-4 lg:min-w-[570px]">
        <Info
          label="Points"
          value={`${reward.pointsRequired.toLocaleString()} pts`}
        />

        <Info
          label="Stock"
          value={reward.stockLabel}
        />

        <Info
          label="Redeemed"
          value={String(
            reward.redemptionCount
          )}
        />

        <Info
          label="Status"
          value={reward.status}
        />
      </div>

      <Link
  href={`/admin/rewards/${encodeURIComponent(
    reward.rewardId
  )}/edit`}
  className="inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.08] px-4 text-sm font-medium text-slate-300 transition hover:border-emerald-400/25 hover:bg-emerald-400/[0.07] hover:text-emerald-300"
>
  Edit
</Link>
    </div>
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
      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p className="mt-1 font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <Gift className="h-5 w-5 text-emerald-300" />

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {note}
      </p>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-white/[0.08] bg-slate-950/50 px-4 text-sm text-white outline-none";