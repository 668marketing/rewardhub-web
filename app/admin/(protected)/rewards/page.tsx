"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Gift,
  Loader2,
  PackageCheck,
  RefreshCw,
  TicketCheck,
  Trophy,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getAdminRewardsDashboard,
  type AdminRewardRedemption,
  type AdminRewardsDashboardData,
} from "@/lib/admin-rewards";

export default function AdminRewardsPage() {
  const [dashboard, setDashboard] =
    useState<AdminRewardsDashboardData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadDashboard = useCallback(
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
          await getAdminRewardsDashboard();

        setDashboard(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load rewards dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading && !dashboard) {
    return (
      <RewardsDashboardLoading />
    );
  }

  if (error && !dashboard) {
    return (
      <RewardsDashboardError
        message={error}
        onRetry={() =>
          void loadDashboard()
        }
      />
    );
  }

  if (!dashboard) {
    return null;
  }

  const rewardStats =
    dashboard.stats.rewards;

  const redemptionStats =
    dashboard.stats.redemptions;

  const voucherStats =
    dashboard.stats.vouchers;

  return (
    <div className="space-y-7 pb-12 pt-6 lg:pt-8">
      {/* =====================================================
       * Header
       * =====================================================
       */}

      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <Gift className="h-4 w-4" />

            Rewards management
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Rewards Dashboard
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            Monitor RewardHub rewards,
            member redemptions, points
            usage and voucher inventory.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/rewards/redemptions"
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            View Redemptions

            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              void loadDashboard(true)
            }
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/[0.08] bg-slate-900/60 px-5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </section>

      {/* =====================================================
       * Refresh Error
       * =====================================================
       */}

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {/* =====================================================
       * Primary Statistics
       * =====================================================
       */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RewardStatCard
          icon={Gift}
          title="Active Rewards"
          value={formatNumber(
            rewardStats.active
          )}
          description={`${formatNumber(
            rewardStats.total
          )} total rewards`}
          accent="emerald"
        />

        <RewardStatCard
          icon={Clock3}
          title="Pending Orders"
          value={formatNumber(
            redemptionStats.pending
          )}
          description={`${formatNumber(
            redemptionStats.processing
          )} processing`}
          accent="amber"
        />

        <RewardStatCard
          icon={CheckCircle2}
          title="Completed"
          value={formatNumber(
            redemptionStats.completed
          )}
          description={`${formatNumber(
            redemptionStats.completedToday
          )} completed today`}
          accent="sky"
        />

        <RewardStatCard
          icon={WalletCards}
          title="Points Redeemed"
          value={`${formatNumber(
            redemptionStats.totalPointsRedeemed
          )} pts`}
          description={`${formatNumber(
            redemptionStats.pointsRedeemedToday
          )} points today`}
          accent="violet"
        />
      </section>

      {/* =====================================================
       * Secondary Statistics
       * =====================================================
       */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SmallStatCard
          icon={TicketCheck}
          title="Voucher Codes"
          value={formatNumber(
            voucherStats.available
          )}
          description={`${formatNumber(
            voucherStats.total
          )} total codes`}
        />

        <SmallStatCard
          icon={AlertTriangle}
          title="Low Stock"
          value={formatNumber(
            rewardStats.lowStock
          )}
          description={`${formatNumber(
            rewardStats.outOfStock
          )} out of stock`}
          warning={
            rewardStats.lowStock > 0 ||
            rewardStats.outOfStock > 0
          }
        />

        <SmallStatCard
          icon={PackageCheck}
          title="Shipped"
          value={formatNumber(
            redemptionStats.shipped
          )}
          description={`${formatNumber(
            redemptionStats.total
          )} total redemptions`}
        />

        <SmallStatCard
          icon={Clock3}
          title="Today's Redemptions"
          value={formatNumber(
            redemptionStats.today
          )}
          description={`${formatNumber(
            redemptionStats.cancelled
          )} cancelled overall`}
        />
      </section>

      {/* =====================================================
       * Recent Redemptions / Top Rewards
       * =====================================================
       */}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <RecentRedemptionsSection
          items={
            dashboard.recentRedemptions
          }
        />

        <TopRewardsSection
          items={dashboard.topRewards}
        />
      </section>

      {/* =====================================================
       * Quick Actions
       * =====================================================
       */}

      <section className="grid gap-5 md:grid-cols-3">
        <QuickActionCard
          icon={Gift}
          title="Manage Rewards"
          description="Create, edit and control RewardHub official rewards."
          href="/admin/rewards/list"
        />

        <QuickActionCard
          icon={TicketCheck}
          title="Voucher Codes"
          description={`${formatNumber(
            voucherStats.total
          )} total codes · ${formatNumber(
            voucherStats.available
          )} available`}
          href="/admin/rewards/vouchers"
        />

        <QuickActionCard
          icon={Clock3}
          title="Redemption Orders"
          description="Review and process pending member redemption requests."
          href="/admin/rewards/redemptions"
        />
      </section>
    </div>
  );
}

/* ============================================================
 * Recent Redemptions
 * ============================================================
 */

function RecentRedemptionsSection({
  items,
}: {
  items: AdminRewardRedemption[];
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/50">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-5">
        <div>
          <h2 className="text-base font-semibold text-white">
            Recent Redemptions
          </h2>

          <p className="mt-1 text-xs text-slate-600">
            Latest RewardHub member
            redemption activity.
          </p>
        </div>

        <Link
          href="/admin/rewards/redemptions"
          className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
        >
          View all

          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="divide-y divide-white/[0.055]">
          {items.map((item) => (
            <RecentRedemptionRow
              key={item.redemptionId}
              item={item}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
            <Gift className="h-6 w-6" />
          </div>

          <h3 className="mt-5 text-base font-semibold text-white">
            No redemptions yet
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
            Member reward redemptions
            will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

function RecentRedemptionRow({
  item,
}: {
  item: AdminRewardRedemption;
}) {
  return (
    <Link
      href={`/admin/rewards/redemptions/${encodeURIComponent(
        item.redemptionId
      )}`}
      className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.025] sm:flex-row sm:items-center"
    >
      <RewardThumbnail item={item} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {item.rewardTitle ||
            item.rewardId}
        </p>

        <p className="mt-1 truncate text-xs text-slate-600">
          {item.memberName
            ? `${item.memberName} · `
            : ""}

          {item.memberId}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="text-sm font-semibold text-white">
            {formatNumber(
              item.pointsUsed
            )}{" "}
            pts
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {formatDateTime(
              item.redeemedAt
            )}
          </p>
        </div>

        <RedemptionStatusBadge
          status={item.status}
        />

        <ChevronCircle />
      </div>
    </Link>
  );
}

/* ============================================================
 * Top Rewards
 * ============================================================
 */

function TopRewardsSection({
  items,
}: {
  items: Array<{
    rewardId: string;
    rewardTitle: string;
    redemptionCount: number;
    pointsRedeemed: number;
  }>;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <Trophy className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-white">
            Top Rewards
          </h2>

          <p className="mt-1 text-xs text-slate-600">
            Most redeemed official
            rewards.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.length > 0 ? (
          items.map(
            (
              item,
              index
            ) => (
              <div
                key={item.rewardId}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-slate-950/35 p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.045] text-sm font-semibold text-slate-400">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {item.rewardTitle ||
                      item.rewardId}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {formatNumber(
                      item.pointsRedeemed
                    )}{" "}
                    points used
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-base font-semibold text-emerald-300">
                    {formatNumber(
                      item.redemptionCount
                    )}
                  </p>

                  <p className="text-[10px] uppercase tracking-wide text-slate-600">
                    Redeemed
                  </p>
                </div>
              </div>
            )
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.08] px-5 py-10 text-center">
            <Trophy className="mx-auto h-8 w-8 text-slate-700" />

            <p className="mt-4 text-sm font-medium text-white">
              No ranking yet
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              Top rewards will appear
              after members begin
              redeeming.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
 * Cards
 * ============================================================
 */

function RewardStatCard({
  icon: Icon,
  title,
  value,
  description,
  accent,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  value: string;
  description: string;
  accent:
    | "emerald"
    | "amber"
    | "sky"
    | "violet";
}) {
  const accentClasses = {
    emerald:
      "bg-emerald-400/10 text-emerald-300",

    amber:
      "bg-amber-400/10 text-amber-300",

    sky:
      "bg-sky-400/10 text-sky-300",

    violet:
      "bg-violet-400/10 text-violet-300",
  };

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentClasses[accent]}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 break-words text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

function SmallStatCard({
  icon: Icon,
  title,
  value,
  description,
  warning = false,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  value: string;
  description: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/[0.08] bg-slate-900/40 p-5">
      <div
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",

          warning
            ? "bg-amber-400/10 text-amber-300"
            : "bg-white/[0.045] text-slate-400",
        ].join(" ")}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">
          {title}
        </p>

        <p className="mt-1 text-xl font-semibold text-white">
          {value}
        </p>

        <p className="mt-1 truncate text-[11px] text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  disabled = false,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-5 text-base font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-2 text-sm font-medium">
        {disabled ? (
          <span className="text-slate-700">
            Coming soon
          </span>
        ) : (
          <>
            <span className="text-emerald-400">
              Open
            </span>

            <ArrowRight className="h-4 w-4 text-emerald-400" />
          </>
        )}
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className="cursor-not-allowed rounded-3xl border border-white/[0.06] bg-slate-900/30 p-5 opacity-65">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.035]"
    >
      {content}
    </Link>
  );
}

/* ============================================================
 * Helpers
 * ============================================================
 */

function RewardThumbnail({
  item,
}: {
  item: AdminRewardRedemption;
}) {
  if (item.rewardImageUrl) {
    return (
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}

        <img
          src={item.rewardImageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-xl">
      {getRewardIcon(
        item.rewardType,
        item.deliveryMethod
      )}
    </div>
  );
}

function RedemptionStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    String(
      status || ""
    ).toUpperCase();

  const classes =
    normalized === "COMPLETED"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "PENDING"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : normalized ===
            "PROCESSING"
          ? "border-sky-400/20 bg-sky-400/10 text-sky-300"
          : normalized ===
              "SHIPPED"
            ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
            : normalized ===
                "CANCELLED"
              ? "border-red-400/20 bg-red-400/10 text-red-300"
              : "border-slate-400/15 bg-slate-400/[0.07] text-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {normalized || "UNKNOWN"}
    </span>
  );
}

function ChevronCircle() {
  return (
    <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-slate-600 sm:flex">
      <ArrowRight className="h-3.5 w-3.5" />
    </div>
  );
}

function getRewardIcon(
  rewardType: string,
  deliveryMethod: string
) {
  const value =
    `${rewardType} ${deliveryMethod}`.toUpperCase();

  if (
    value.includes("VOUCHER")
  ) {
    return "🎫";
  }

  if (
    value.includes("DIGITAL")
  ) {
    return "📱";
  }

  if (
    value.includes("SHIPPING")
  ) {
    return "🎁";
  }

  return "⭐";
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

  const normalized =
    value.replace(
      /^(\d{4})-(\d{2})-(\d{2})\s/,
      "$1/$2/$3 "
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
      timeZone:
        "Asia/Kuala_Lumpur",

      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(date);
}

/* ============================================================
 * Loading / Error
 * ============================================================
 */

function RewardsDashboardLoading() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />

        <p className="mt-4 text-sm text-slate-500">
          Loading rewards dashboard…
        </p>
      </div>
    </div>
  );
}

function RewardsDashboardError({
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
          Unable to load rewards
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