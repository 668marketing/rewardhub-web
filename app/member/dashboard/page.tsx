"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemberLayout from "@/components/layout/MemberLayout";
import { QRCodeSVG } from "qrcode.react";
import {
  fetchMarketplaceMerchants,
  getMemberDashboard,
} from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

export default function MemberDashboardPage() {
  const { t, language } = useLanguage();
  const [member, setMember] = useState<any>(null);
  const [origin, setOrigin] = useState("");
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
const [loadingDashboard, setLoadingDashboard] = useState(true);
  
useEffect(() => {
  const stored = localStorage.getItem("member");

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      setMember(parsed);
      loadDashboard(parsed);
    } catch {
      setMember(null);
      setLoadingDashboard(false);
    }
  } else {
    setLoadingDashboard(false);
  }

  setOrigin(window.location.origin);
  loadMerchants();
}, []);

async function loadDashboard(storedMember: any) {
  try {
    const memberId = storedMember?.memberId || storedMember?.MEMBER_ID;

    if (!memberId) {
      setLoadingDashboard(false);
      return;
    }

    const res = await getMemberDashboard({ memberId });

    const result =
      res?.data?.data ||
      res?.data ||
      res?.result ||
      res;

    setDashboard(result);

    if (result?.profile) {
      const updatedMember = {
        ...storedMember,
        ...result.profile,
        tier: result.profile.tier,
        memberId: result.profile.memberId,
        displayName: result.profile.displayName,
        fullName: result.profile.fullName,
      };

      //localStorage.setItem("member", JSON.stringify(updatedMember));
      setMember(updatedMember);
    }
  } catch (err) {
    console.error("Failed to load dashboard:", err);
    setDashboard(null);
  } finally {
    setLoadingDashboard(false);
  }
}

async function loadMerchants() {
  try {
    setLoadingMerchants(true);

    const res = await fetchMarketplaceMerchants();

    const data =
      res?.data?.data ||
      res?.data ||
      res?.result ||
      res;

    setMerchants(data?.merchants || []);
  } catch (err) {
    console.error("Failed to load merchants:", err);
    setMerchants([]);
  } finally {
    setLoadingMerchants(false);
  }
}

const profile = dashboard?.profile || {};
const wallet = dashboard?.wallet || {};
const recentTransactions = dashboard?.recentTransactions || [];

const name =
  profile?.displayName ||
  profile?.fullName ||
  member?.displayName ||
  member?.fullName ||
  t("memberDashboard.fallbackMember");

const memberId =
  profile?.memberId ||
  member?.memberId ||
  member?.MEMBER_ID ||
  "-";

const tier =
  profile?.tier ||
  member?.tier ||
  "Silver";

const email =
  profile?.email ||
  member?.email ||
  "-";

const phone =
  profile?.phone ||
  member?.phone ||
  "-";

const points = Number(wallet?.points || 0);
const rewardCredits = Number(wallet?.rewardCredits || 0);
const cashbackSaved = Number(wallet?.cashbackSaved || 0);
const lifetimeSpending = Number(profile?.lifetimeSpending || 0);

const tierInfo = getTierInfo(tier, lifetimeSpending, t);

  const referralUrl =
    origin && memberId !== "-" ? `${origin}/register?ref=${memberId}` : "";

  const topMerchants = [...merchants]
    .sort((a, b) => {
      const ratingA = Number(a.rating || a.averageRating || 0);
      const ratingB = Number(b.rating || b.averageRating || 0);
      const txA = Number(a.transactionCount || a.totalTransactions || 0);
      const txB = Number(b.transactionCount || b.totalTransactions || 0);

      if (ratingB !== ratingA) return ratingB - ratingA;
      return txB - txA;
    })
    .slice(0, 6);

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-3 py-4 pb-28 sm:px-4 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-7xl">
         <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">
        {t("memberDashboard.rewardHubMember")}
      </p>

      <h1 className="mt-3 text-2xl font-black leading-tight sm:text-4xl lg:text-5xl">
        {t("memberDashboard.greeting", { name })} 👋
      </h1>

      <p className="mt-3 text-sm font-bold text-slate-400">
        {t("memberDashboard.memberTierLine", { tier, memberId })}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
        <Badge text={t("memberDashboard.activeAccount")} />
        <Badge text={t("memberDashboard.lifetimeTier")} />
        <Badge text={t("memberDashboard.rewardCreditsEnabled")} />
      </div>
    </div>
  </div>

  <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
    <StatCard title={t("memberDashboard.currentTier")} value={tier} />
    <StatCard title={t("memberDashboard.points")} value={t("memberDashboard.pointsValue", { points })} />
    <StatCard title={t("memberDashboard.rewardCredits")} value={`RM${money(rewardCredits)}`} />
    <StatCard title={t("memberDashboard.cashbackSaved")} value={`RM${money(cashbackSaved)}`} />
  </div>
</div>

            <div className="mt-4 rounded-[1.5rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-7">
  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:items-center sm:gap-5">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">
        {t("memberDashboard.membershipTier")}
      </p>

      <h2 className="mt-1 text-xl font-black leading-tight text-slate-950 sm:mt-2 sm:text-3xl">
        {tierInfo.title}
      </h2>

      <p className="mt-1 text-xs font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">
        {tierInfo.description}
      </p>
    </div>

    <div className="shrink-0 rounded-xl bg-slate-950 px-3 py-3 text-white sm:rounded-2xl sm:px-6 sm:py-4">
      <p className="text-xs font-black text-slate-400">
        {t("memberDashboard.lifetimeSpending")}
      </p>
      <p className="mt-1 whitespace-nowrap text-lg font-black sm:text-2xl">
        RM{money(lifetimeSpending)}
      </p>
    </div>
  </div>

  <div className="mt-4 sm:mt-6">
    <div className="mb-2 flex justify-between text-xs font-black text-slate-500 sm:mb-3 sm:text-sm">
      <span>{tierInfo.startLabel}</span>
      <span>{tierInfo.endLabel}</span>
    </div>

    <div className="h-3 rounded-full bg-slate-100 sm:h-4">
      <div
        className="h-3 rounded-full bg-amber-500 sm:h-4"
        style={{ width: `${tierInfo.progress}%` }}
      />
    </div>

    <p className="mt-2 text-xs font-bold leading-5 text-slate-500 sm:mt-3 sm:text-sm">
      {tierInfo.note}
    </p>
  </div>

 <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-4">
    <TierRate title={t("memberDashboard.silver")} value={t("memberDashboard.marketingBudget10")} active={String(tier).toLowerCase() === "silver"}/>
    <TierRate title={t("memberDashboard.gold")} value={t("memberDashboard.marketingBudget20")} active={String(tier).toLowerCase() === "gold"} />
    <TierRate title={t("memberDashboard.platinum")} value={t("memberDashboard.marketingBudget30")} active={String(tier).toLowerCase() === "platinum"} />
  </div>
</div>

          <div className="mt-4 rounded-[1.5rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7 md:p-8">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 lg:gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">
                  {t("memberDashboard.marketplace")}
                </p>

                <h2 className="mt-1 text-xl font-black leading-tight text-slate-950 sm:mt-2 sm:text-3xl lg:text-4xl">
                  {t("memberDashboard.topRatedMerchants")}
                </h2>

                <p className="mt-1 max-w-2xl text-xs font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">
                  {t("memberDashboard.marketplaceDescription")}
                </p>
              </div>

              <Link
                href="/member/marketplace"
                className="shrink-0 rounded-xl bg-slate-950 px-3 py-2.5 text-center text-[11px] font-black text-white no-underline sm:rounded-2xl sm:px-6 sm:py-4 sm:text-sm"
              >
                {t("memberDashboard.viewFullMarketplace")} →
              </Link>
            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-8 sm:mt-6 sm:gap-4 sm:pb-10">
              {topMerchants.length > 0 ? (
                topMerchants.map((merchant: any) => (
                  <MerchantCard
                    key={merchant.merchantId || merchant.businessName}
                    merchant={merchant}
                  />
                ))
              ) : (
                <div className="w-full rounded-3xl bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">
                  {loadingMerchants
                    ? t("memberDashboard.loadingMarketplace")
                    : t("memberDashboard.noMerchants")}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 xl:grid-cols-4">
            <ActionCard
              title={t("memberDashboard.payQr")}
              desc={t("memberDashboard.payQrDescription")}
              href="/member/pay"
              dark
            />

            <ActionCard
              title={t("memberDashboard.favourite")}
              desc={t("memberDashboard.favouriteDescription")}
              href="/member/favourites"
            />

            <ActionCard
  title={t("memberDashboard.physicalCard")}
  desc={t("memberDashboard.physicalCardDescription")}
  href="/member/card-application"
/>

            <ActionCard
              title={t("memberDashboard.referralCenter")}
              desc={t("memberDashboard.referralCenterDescription")}
              href="/member/commission"
            />
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7">
  <div className="flex items-center justify-between gap-3 sm:gap-4">
    <div>
      <h2 className="text-lg font-black leading-tight text-slate-950 sm:text-2xl">
        {t("memberDashboard.recentTransactions")}
      </h2>
      <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
        {t("memberDashboard.latestPayments")}
      </p>
    </div>

    <Link
      href="/member/transactions"
      className="shrink-0 rounded-xl bg-slate-950 px-3 py-2.5 text-center text-[11px] font-black text-white no-underline sm:rounded-2xl sm:px-6 sm:py-4 sm:text-sm"
    >
      {t("common.viewAll")}
    </Link>
  </div>

  <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
    {recentTransactions.map((tx: any) => (
      <div
        key={tx.transactionId}
        className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 sm:rounded-3xl sm:p-5"
      >
        <div>
          <p className="line-clamp-1 text-sm font-black text-slate-950 sm:text-base lg:text-lg">
            {tx.merchantName || tx.merchantId}
          </p>

          <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
            {formatDate(tx.createdAt, language)} • {tx.paymentMethod || "-"}
          </p>

          <p className="mt-1 max-w-[180px] truncate text-[10px] font-bold text-slate-400 sm:max-w-none sm:text-xs">
            {tx.transactionId}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="whitespace-nowrap text-base font-black text-slate-950 sm:text-xl">
            RM{money(tx.payAmount)}
          </p>

          <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-emerald-700 sm:text-sm">
            {t("memberDashboard.cashbackAmount", { amount: money(tx.cashback) })}
          </p>
        </div>
      </div>
    ))}

    {!loadingDashboard && recentTransactions.length === 0 && (
      <div className="rounded-3xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
        {t("memberDashboard.noTransactions")}
      </div>
    )}

    {loadingDashboard && (
      <div className="rounded-3xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
        {t("memberDashboard.loadingDashboard")}
      </div>
    )}
  </div>
</div>

          <div className="mt-4 grid grid-cols-[minmax(0,1.7fr)_minmax(145px,0.8fr)] gap-3 sm:mt-6 sm:gap-6 lg:grid-cols-3">
            <div className="min-w-0 rounded-[1.5rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-7 lg:col-span-2">
              <h2 className="text-lg font-black leading-tight text-slate-950 sm:text-2xl">
                {t("memberDashboard.accountOverview")}
              </h2>

              <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">
                {t("memberDashboard.accountOverviewDescription")}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-4">
                <DetailCard label={t("memberDashboard.name")} value={name} />
                <DetailCard label={t("memberDashboard.tier")} value={tier} />
                <DetailCard label={t("memberDashboard.email")} value={email} />
                <DetailCard label={t("memberDashboard.phone")} value={phone} />
              </div>

              <Link
                href="/member/profile"
                className="mt-4 block rounded-xl border border-slate-200 py-2.5 text-center text-xs font-black text-slate-950 no-underline sm:mt-6 sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                {t("memberDashboard.viewProfile")}
              </Link>
            </div>

            <div className="min-w-0 rounded-[1.5rem] bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-7">
              <h2 className="text-lg font-black leading-tight text-slate-950 sm:text-2xl">
                {t("memberDashboard.referralQr")}
              </h2>

              <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm">
                {t("memberDashboard.referralQrDescription")}
              </p>

              <div className="mt-3 flex justify-center rounded-xl bg-slate-50 p-2 sm:mt-6 sm:rounded-[2rem] sm:p-6">
                {referralUrl ? (
                  <QRCodeSVG
                    value={referralUrl}
                    size={190}
                    className="h-auto w-full max-w-[110px] sm:max-w-[190px]"
                  />
                ) : (
                  <div className="flex aspect-square w-full max-w-[110px] items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-400 sm:max-w-[190px] sm:rounded-2xl sm:text-xs">
                    {t("memberDashboard.loadingQr")}
                  </div>
                )}
              </div>

              <p className="mt-2 truncate text-center text-[9px] font-black text-slate-500 sm:mt-4 sm:text-sm">
                {t("memberDashboard.referrerId", { memberId })}
              </p>

              <Link
                href="/member/commission"
                className="mt-3 block rounded-xl bg-slate-950 py-2.5 text-center text-[10px] font-black text-white no-underline sm:mt-5 sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                {t("memberDashboard.referralCenter")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

function MerchantCard({ merchant }: { merchant: any }) {
  const { t } = useLanguage();
  const [logoFailed, setLogoFailed] = useState(false);

  const merchantName =
    merchant.storeName ||
    merchant.businessName ||
    merchant.displayName ||
    merchant.name ||
    t("memberDashboard.fallbackMerchant");

  const merchantId = merchant.merchantId || merchant.MERCHANT_ID || "";
  const category = merchant.category || t("memberDashboard.merchant");
  const location = merchant.location || merchant.city || t("memberDashboard.malaysia");
 const rating = Number(
  merchant.averageRating ||
  merchant.rating ||
  0
);
  const reviews = Number(merchant.reviewCount || merchant.reviews || 0);
  const cashback =
    merchant.goldCashback ||
    merchant.cashback ||
    merchant.memberCashback ||
    merchant.marketingBudget ||
    5;

  const acceptsCredits =
    merchant.acceptRewardCredits !== false &&
    merchant.rewardCreditsAccepted !== false;

  const logoUrl =
  String(
    merchant?.logoUrl ||
    merchant?.LOGO_URL ||
    merchant?.merchantLogo ||
    merchant?.MERCHANT_LOGO ||
    ""
  ).trim();

  const showLogo =
    Boolean(logoUrl) &&
    !logoFailed;

  return (
    <Link
      href={`/member/merchant/${merchantId}`}
      className="flex min-h-[420px] min-w-[230px] flex-col rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 no-underline transition hover:-translate-y-1 hover:bg-white hover:shadow-xl sm:min-h-[450px] sm:min-w-[270px] sm:rounded-[2rem] sm:p-5 lg:min-w-[290px]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-base font-black text-white sm:h-16 sm:w-16 sm:rounded-2xl sm:text-xl">
          {showLogo ? (
            <img
  src={getDisplayImageUrl(
    logoUrl
  )}
  alt={merchantName}
  loading="lazy"
  decoding="async"
  referrerPolicy="no-referrer"
  onError={() => {
    setLogoFailed(true);
  }}
  className="h-full w-full rounded-xl object-cover sm:rounded-2xl"
/>
          ) : (
            merchantName
              .slice(0, 2)
              .toUpperCase()
          )}
        </div>

        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
  {reviews > 0 ? `★ ${rating.toFixed(1)}` : t("memberDashboard.new")}
</span>
      </div>

      <h3 className="mt-4 line-clamp-1 text-base font-black text-slate-950 sm:mt-5 sm:text-xl">
        {merchantName}
      </h3>

      <p className="mt-1 min-h-10 line-clamp-2 text-xs font-bold leading-5 text-slate-500 sm:min-h-11 sm:text-sm">
        {category} • {location}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
        <div className="rounded-xl bg-white p-3 sm:rounded-2xl sm:p-4">
          <p className="min-h-8 text-[11px] font-black leading-4 text-slate-400 sm:text-xs">
            {t("memberDashboard.cashback")}
          </p>
          <p className="mt-1 text-sm font-black text-emerald-700 sm:text-base lg:text-lg">
            {cashback}%
          </p>
        </div>

        <div className="rounded-xl bg-white p-3 sm:rounded-2xl sm:p-4">
          <p className="min-h-8 text-[11px] font-black leading-4 text-slate-400 sm:text-xs">
            {t("memberDashboard.reviews")}
          </p>
          <p className="mt-1 text-sm font-black text-slate-950 sm:text-base lg:text-lg">
            {reviews || t("memberDashboard.new")}
          </p>
        </div>
      </div>

      <div className="mt-3 flex min-h-16 flex-wrap content-start gap-1.5 sm:mt-4 sm:gap-2">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          {t("memberDashboard.memberRewards")}
        </span>

        {acceptsCredits && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            {t("memberDashboard.creditsAccepted")}
          </span>
        )}
      </div>

      <p className="mt-auto pt-4 text-xs font-black text-slate-950 sm:pt-5 sm:text-sm">
        {t("memberDashboard.viewStore")} →
      </p>
    </Link>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/10 p-4 text-white sm:rounded-[2rem] sm:p-5 lg:p-6">
      <p className="truncate text-xs font-black text-slate-300 sm:text-sm">
        {title}
      </p>

      <h3 className="mt-2 break-words text-xl font-black leading-tight sm:mt-3 sm:text-2xl lg:text-3xl">
        {value}
      </h3>
    </div>
  );
}

function ActionCard({
  title,
  desc,
  href,
  dark = false,
}: {
  title: string;
  desc: string;
  href: string;
  dark?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <Link
      href={href}
      className={`rounded-[1.5rem] p-4 shadow-sm no-underline transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[2rem] sm:p-7 ${
        dark ? "bg-slate-950 text-white" : "bg-white"
      }`}
    >
      <h3 className={`text-base font-black sm:text-xl ${dark ? "text-white" : "text-slate-950"}`}>
        {title}
      </h3>

      <p className={`mt-1 line-clamp-3 text-[11px] font-bold leading-5 sm:mt-2 sm:text-sm ${dark ? "text-slate-300" : "text-slate-500"}`}>
        {desc}
      </p>

      <p className={`mt-3 text-xs font-black sm:mt-5 sm:text-sm ${dark ? "text-amber-300" : "text-slate-950"}`}>
        {t("memberDashboard.open")} →
      </p>
    </Link>
  );
}

function DetailCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-5">
      <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-xs sm:tracking-[0.2em]">
        {label}
      </p>
      <p className="mt-1 break-all text-xs font-black leading-5 text-slate-950 sm:mt-2 sm:text-base lg:text-lg">
        {value}
      </p>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black text-slate-300 sm:px-4 sm:py-2 sm:text-xs">
      {text}
    </span>
  );
}

function money(value: any) {
  return Number(value || 0).toFixed(2);
}

function formatDate(
  date: any,
  language: "en" | "zh" | "ms"
) {
  if (!date) return "-";

  const locale =
    language === "zh"
      ? "zh-CN"
      : language === "ms"
        ? "ms-MY"
        : "en-GB";

  return new Date(date).toLocaleString(locale, {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function TierRate({
  title,
  value,
  active = false,
}: {
  title: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl p-2.5 sm:rounded-2xl sm:p-5 ${
        active
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-950"
      }`}
    >
      <p className="truncate text-[11px] font-black sm:text-sm">{title}</p>
      <p
        className={`mt-1 text-[9px] font-bold leading-4 sm:mt-2 sm:text-sm ${
          active ? "text-amber-300" : "text-slate-500"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function getTierInfo(
  tier: string,
  spending: number,
  t: (
    key: string,
    variables?: Record<string, string | number>
  ) => string
) {
  const currentTier = String(tier || "Silver").toLowerCase();

  if (currentTier === "platinum" || spending >= 15000) {
    return {
      title: t("memberDashboard.platinumTierUnlocked"),
      description: t("memberDashboard.highestTierReached"),
      startLabel: "RM15,000",
      endLabel: t("memberDashboard.highestTier"),
      progress: 100,
      note: t("memberDashboard.platinumCashbackNote"),
    };
  }

  if (currentTier === "gold" || spending >= 5000) {
    const progress = Math.min(100, ((spending - 5000) / 10000) * 100);
    const remaining = Math.max(0, 15000 - spending);

    return {
      title: t("memberDashboard.goldMember"),
      description: t("memberDashboard.unlockPlatinumDescription"),
      startLabel: "RM5,000",
      endLabel: "RM15,000",
      progress,
      note: t("memberDashboard.spendMorePlatinum", { amount: money(remaining) }),
    };
  }

  const progress = Math.min(100, (spending / 5000) * 100);
  const remaining = Math.max(0, 5000 - spending);

  return {
    title: t("memberDashboard.silverMember"),
    description: t("memberDashboard.unlockGoldDescription"),
    startLabel: "RM0",
    endLabel: "RM5,000",
    progress,
    note: t("memberDashboard.spendMoreGold", { amount: money(remaining) }),
  };
}

function getDriveFileId(
  value: string
) {
  const url = String(
    value || ""
  ).trim();

  if (!url) {
    return "";
  }

  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/i,
    /\/file\/d\/([a-zA-Z0-9_-]+)/i,
    /\/d\/([a-zA-Z0-9_-]+)/i,
    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match =
      url.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function getDisplayImageUrl(
  value: string
) {
  const url = String(
    value || ""
  ).trim();

  if (!url) {
    return "";
  }

  if (
    url.startsWith(
      "/api/drive-image"
    )
  ) {
    return url;
  }

  const fileId =
    getDriveFileId(url);

  if (fileId) {
    return (
      "/api/drive-image?id=" +
      encodeURIComponent(
        fileId
      )
    );
  }

  return url;
}