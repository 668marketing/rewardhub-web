import {
  BarChart3,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import type {
  AdminMerchantDetailData,
} from "@/lib/admin-merchant-detail";

type MerchantOverviewStatsProps = {
  data: AdminMerchantDetailData;
};

export default function MerchantOverviewStats({
  data,
}: MerchantOverviewStatsProps) {
  const transactions =
    data.transactions.summary;

  const marketing =
    data.marketing.summary;

  const settlements =
    data.settlements.summary;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={TrendingUp}
        label="Total Sales"
        value={formatMoney(
          transactions.sales
        )}
        description={`${formatNumber(
          transactions.completed
        )} completed transactions`}
      />

      <StatCard
        icon={ReceiptText}
        label="Transactions"
        value={formatNumber(
          transactions.total
        )}
        description={`${formatNumber(
          transactions.failed
        )} failed · ${formatNumber(
          transactions.cancelled
        )} cancelled`}
      />

      <StatCard
  icon={BarChart3}
  label="Marketing Budget"
  value={formatPercent(
    marketing.currentBudget
  )}
  description={
    marketing.boostActive
      ? `Boost active · Normal ${formatPercent(
          marketing.normalBudget
        )}`
      : `Normal budget · ${formatPercent(
          marketing.normalBudget
        )}`
  }
/>

      <StatCard
        icon={WalletCards}
        label="Pending Settlement"
        value={formatMoney(
          settlements.pendingAmount
        )}
        description={`${formatNumber(
          settlements.pending
        )} pending requests`}
      />
    </section>
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
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-slate-950/40 text-emerald-300">
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

function formatMoney(
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
  ).format(Number(value || 0));
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(Number(value || 0));
}

function formatPercent(
  value: number
) {
  return `${Number(
    value || 0
  ).toLocaleString("en-MY", {
    maximumFractionDigits: 2,
  })}%`;
}