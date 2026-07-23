"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Construction,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import MerchantAdminActions from "@/components/admin/merchant-detail/MerchantAdminActions";
import MerchantDetailTabs, {
  type MerchantDetailTab,
} from "@/components/admin/merchant-detail/MerchantDetailTabs";
import MerchantHeader from "@/components/admin/merchant-detail/MerchantHeader";
import MerchantInformation from "@/components/admin/merchant-detail/MerchantInformation";
import MerchantOverviewStats from "@/components/admin/merchant-detail/MerchantOverviewStats";
import MerchantTransactionsTab from "@/components/admin/merchant-detail/MerchantTransactionsTab";
import MerchantMarketingTab from "@/components/admin/merchant-detail/MerchantMarketingTab";
import MerchantSettlementsTab from "@/components/admin/merchant-detail/MerchantSettlementsTab";
import MerchantProductsTab from "@/components/admin/merchant-detail/MerchantProductsTab";
import MerchantReviewsTab from "@/components/admin/merchant-detail/MerchantReviewsTab";
import MerchantPushDevicesTab from "@/components/admin/merchant-detail/MerchantPushDevicesTab";

import {
  type AdminMerchantDetailData,
  getAdminMerchantDetail,
} from "@/lib/admin-merchant-detail";

export default function AdminMerchantDetailPage() {
  const params = useParams<{
    merchantId: string;
  }>();

  const merchantId = decodeURIComponent(
    String(params?.merchantId || "")
  );

  const [data, setData] =
    useState<AdminMerchantDetailData | null>(
      null
    );

  const [activeTab, setActiveTab] =
    useState<MerchantDetailTab>(
      "overview"
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadMerchant = useCallback(
    async (
      showRefreshLoader = false
    ) => {
      if (!merchantId) {
        setError(
          "Merchant ID is missing."
        );
        setLoading(false);
        return;
      }

      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const result =
          await getAdminMerchantDetail(
            merchantId
          );

        setData(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load merchant details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [merchantId]
  );

  useEffect(() => {
    void loadMerchant();
  }, [loadMerchant]);

  if (loading && !data) {
    return (
      <MerchantDetailLoading />
    );
  }

  if (error && !data) {
    return (
      <MerchantDetailError
        message={error}
        onRetry={() =>
          void loadMerchant()
        }
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-7 pb-12 pt-6 lg:pt-8">
      <div className="mb-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/merchants"
          className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-white/[0.08] px-4 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to merchants
        </Link>

        <button
          type="button"
          disabled={refreshing}
          onClick={() =>
            void loadMerchant(true)
          }
          className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-white/[0.08] px-4 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <MerchantHeader
        merchant={data.merchant}
      />

      <MerchantDetailTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        counts={{
          transactions:
            data.transactions.summary
              .total,

          settlements:
            data.settlements.summary
              .total,

          products:
            data.products.total,

          reviews:
            data.reviews.total,

          pushDevices:
            data.pushSubscriptions
              .total,
        }}
      />

      {activeTab === "overview" ? (
        <MerchantOverviewTab
          data={data}
        />
      ) : null}

      {activeTab ===
      "transactions" ? (
        <MerchantTransactionsTab
          transactions={
            data.transactions.recent
          }
          summary={
            data.transactions.summary
          }
        />
      ) : null}

      {activeTab ===
"marketing" ? (
  <MerchantMarketingTab
    merchantId={
      data.merchant.merchantId
    }
    summary={
      data.marketing.summary
    }
    setting={
      data.marketing.setting
    }
    onUpdated={async () => {
      await loadMerchant(true);
    }}
  />
) : null}

      {activeTab ===
"settlements" ? (
  <MerchantSettlementsTab
    settlements={
      data.settlements.recent
    }
    summary={
      data.settlements.summary
    }
    onUpdated={async () => {
      await loadMerchant(true);
    }}
  />
) : null}

      {activeTab === "products" ? (
  <MerchantProductsTab
    products={data.products}
  />
) : null}

      
{activeTab === "reviews" ? (
  <MerchantReviewsTab
    merchantId={
      data.merchant.merchantId
    }
    reviews={data.reviews}
    onUpdated={async () => {
      await loadMerchant(true);
    }}
  />
) : null}

      {activeTab === "push-devices" ? (
  <MerchantPushDevicesTab
    merchantId={
      data.merchant.merchantId
    }
    pushSubscriptions={
      data.pushSubscriptions
    }
    onUpdated={async () => {
      await loadMerchant(true);
    }}
  />
) : null}
    </div>
  );
}

/* ============================================================
 * Overview Tab
 * ============================================================
 */

function MerchantOverviewTab({
  data,
}: {
  data: AdminMerchantDetailData;
}) {
  return (
    <div className="space-y-7">
      <MerchantOverviewStats
        data={data}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <MerchantInformation
          merchant={data.merchant}
        />

        <div className="space-y-5">
          <MerchantAdminActions
            merchant={data.merchant}
          />

          <MerchantActivitySummary
            data={data}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Account Summary
 * ============================================================
 */

function MerchantActivitySummary({
  data,
}: {
  data: AdminMerchantDetailData;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <h2 className="text-base font-semibold text-white">
        Account Summary
      </h2>

      <p className="mt-1 text-xs text-slate-600">
        Current merchant activity
      </p>

      <div className="mt-5 space-y-4">
        <SummaryRow
          label="Products"
          value={`${formatNumber(
            data.products.active
          )} active / ${formatNumber(
            data.products.total
          )} total`}
        />

        <SummaryRow
          label="Reviews"
          value={`${formatDecimal(
            data.reviews.averageRating
          )} rating · ${formatNumber(
            data.reviews.total
          )} reviews`}
        />

        <SummaryRow
          label="Push Devices"
          value={`${formatNumber(
            data.pushSubscriptions.active
          )} active / ${formatNumber(
            data.pushSubscriptions.total
          )} total`}
        />

        <SummaryRow
          label="Cashback Issued"
          value={formatMoney(
            data.transactions.summary
              .cashback
          )}
        />

        <SummaryRow
          label="Reward Credits Used"
          value={formatMoney(
            data.transactions.summary
              .rewardCreditsUsed
          )}
        />

        <SummaryRow
          label="Paid Settlements"
          value={formatMoney(
            data.settlements.summary
              .paidAmount
          )}
        />

        <SummaryRow
          label="Last Transaction"
          value={formatDateTime(
            data.transactions.summary
              .lastTransactionAt
          )}
        />
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-white/[0.06] pb-4 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="max-w-[180px] text-right text-sm font-medium text-slate-300">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
 * Placeholder Tabs
 * ============================================================
 */

function MerchantTabPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-slate-900/50 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
        <Construction className="h-6 w-6" />
      </div>

      <h2 className="mt-5 text-lg font-semibold text-white">
        {title}
      </h2>

      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
        {description}
      </p>
    </section>
  );
}

/* ============================================================
 * Loading / Error
 * ============================================================
 */

function MerchantDetailLoading() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />

        <p className="mt-4 text-sm text-slate-500">
          Loading merchant details…
        </p>
      </div>
    </div>
  );
}

function MerchantDetailError({
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
          Unable to load merchant
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

/* ============================================================
 * Formatters
 * ============================================================
 */

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

function formatDecimal(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString("en-MY", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
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
      hour12: true,
    }
  ).format(date);
}