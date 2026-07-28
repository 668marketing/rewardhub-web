"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import MemberLayout from "@/components/layout/MemberLayout";
import { getMemberCommissionSummary } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

type ReferralType = "MEMBER" | "MERCHANT";

type ReferralHistoryItem = {
  id?: string;
  commissionTxId?: string;
  referralId?: string;

  referralType?: ReferralType | string;

  fromMemberId?: string;
  fromMemberName?: string;

  fromMerchantId?: string;
  fromMerchantName?: string;

  memberName?: string;
  merchantName?: string;

  sourceId?: string;
  sourceName?: string;
  sourceSubtitle?: string;
  sourceLogoUrl?: string;

  level?: number;

  transactionId?: string;
  transactionAmount?: number;
  commissionRate?: number;

  amount?: number;
  status?: string;
  createdAt?: string;
  date?: string;
};

type CommissionSummary = {
  totalCommission?: number;
  releasedCommission?: number;
  pendingCommission?: number;

  availableRewardCredits?: number;
  totalEarned?: number;
  totalUsed?: number;

  memberReferralEarned?: number;
  merchantReferralEarned?: number;

  directCount?: number;
  level2Count?: number;
  level3Count?: number;
  totalReferralMembers?: number;

  referredMerchantCount?: number;

  history?: ReferralHistoryItem[];
};

export default function CommissionPage() {
  const { t } = useLanguage();
  const [summary, setSummary] =
    useState<CommissionSummary | null>(null);

  const [member, setMember] =
    useState<any>(null);

  const [origin, setOrigin] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const storedMember = JSON.parse(
        localStorage.getItem("member") ||
        "{}"
      );

      setMember(storedMember);
      setOrigin(window.location.origin);

      const memberId =
        storedMember?.memberId ||
        storedMember?.MEMBER_ID;

      if (!memberId) {
        setSummary({});
        return;
      }

      const response =
        await getMemberCommissionSummary({
          memberId
        });

      const data =
        response?.data?.data ||
        response?.data ||
        response ||
        {};

      setSummary(data);
    } catch (error) {
      console.error(
        "Failed to load referral summary:",
        error
      );

      setSummary({});
    } finally {
      setLoading(false);
    }
  }

  const memberId =
    member?.memberId ||
    member?.MEMBER_ID ||
    "-";

  const memberName =
    member?.displayName ||
    member?.fullName ||
    member?.name ||
    t("memberCommission.member");

  const memberReferralUrl =
    origin && memberId !== "-"
      ? `${origin}/register?ref=${encodeURIComponent(
          memberId
        )}`
      : "";

  const merchantReferralUrl =
    origin && memberId !== "-"
      ? `${origin}/merchantregister?refMember=${encodeURIComponent(
          memberId
        )}`
      : "";

  const totalEarned = Number(
    summary?.totalEarned ??
    summary?.totalCommission ??
    0
  );

  const availableRewardCredits = Number(
    summary?.availableRewardCredits || 0
  );

  const memberReferralEarned = Number(
    summary?.memberReferralEarned || 0
  );

  const merchantReferralEarned = Number(
    summary?.merchantReferralEarned || 0
  );

  const directCount = Number(
    summary?.directCount || 0
  );

  const level2Count = Number(
    summary?.level2Count || 0
  );

  const level3Count = Number(
    summary?.level3Count || 0
  );

  const totalReferralMembers = Number(
    summary?.totalReferralMembers ??
    directCount +
      level2Count +
      level3Count
  );

  const referredMerchantCount = Number(
    summary?.referredMerchantCount || 0
  );

  const history =
    Array.isArray(summary?.history)
      ? summary.history
      : [];

  async function copyLink(
    value: string,
    message: string
  ) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(
        value
      );

      alert(message);
    } catch (error) {
      console.error(
        "Failed to copy link:",
        error
      );

      alert(
        t("memberCommission.unableToCopy")
      );
    }
  }

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-32 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-7xl">
          <Link
            href="/member/dashboard"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm transition hover:bg-slate-50 sm:px-5 sm:py-3 sm:text-sm"
          >
            ← {t("memberCommission.backToDashboard")}
          </Link>

          <div className="mt-5 overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:mt-6 sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
                  {t("memberCommission.referralCenter")}
                </p>

                <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
                  {t("memberCommission.inviteAndEarn")}
                </h1>

                <p className="mt-3 max-w-2xl text-xs font-bold leading-5 text-slate-400 sm:text-sm sm:leading-6">
                  {t("memberCommission.heroDescription")}
                </p>
              </div>

              <div className="shrink-0 rounded-xl bg-white/10 px-3 py-3 sm:rounded-2xl sm:px-6 sm:py-5">
                <p className="text-[9px] font-black text-slate-400 sm:text-xs">
                  {t("memberCommission.referrerId")}
                </p>

                <p className="mt-1 max-w-[110px] truncate text-sm font-black text-amber-300 sm:max-w-none sm:text-2xl">
                  {memberId}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
              <StatCard
                title={t("memberCommission.totalCreditsEarned")}
                value={`RM${money(
                  totalEarned
                )}`}
              />

              <StatCard
                title={t("memberCommission.availableRewardCredits")}
                value={`RM${money(
                  availableRewardCredits
                )}`}
              />

              <StatCard
                title={t("memberCommission.referralMembers")}
                value={totalReferralMembers}
              />

              <StatCard
                title={t("memberCommission.referredMerchants")}
                value={referredMerchantCount}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 lg:grid-cols-3 lg:gap-6">
            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                {t("memberCommission.myReferralQr")}
              </h2>

              <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                {t("memberCommission.qrDescription")}
              </p>

              <div className="mt-5 flex justify-center rounded-[1.5rem] bg-slate-50 p-4 sm:mt-6 sm:rounded-[2rem] sm:p-6">
                {memberReferralUrl ? (
                  <QRCodeSVG
                    value={memberReferralUrl}
                    size={200}
                    level="H"
                    includeMargin
                  />
                ) : (
                  <div className="flex h-[200px] w-[200px] items-center justify-center rounded-2xl bg-slate-100 text-xs font-bold text-slate-400">
                    {t("memberCommission.loadingQr")}
                  </div>
                )}
              </div>

              <p className="mt-4 text-center text-xs font-black text-slate-500 sm:text-sm">
                {memberName}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-1">
                <button
                  type="button"
                  onClick={() =>
                    copyLink(
                      memberReferralUrl,
                      t("memberCommission.memberLinkCopied")
                    )
                  }
                  className="w-full rounded-xl bg-slate-950 px-3 py-3 text-[10px] font-black text-white transition hover:bg-slate-800 sm:rounded-2xl sm:py-4 sm:text-sm"
                >
                  {t("memberCommission.copyMemberLink")}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyLink(
                      merchantReferralUrl,
                      t("memberCommission.merchantLinkCopied")
                    )
                  }
                  className="w-full rounded-xl bg-amber-500 px-3 py-3 text-[10px] font-black text-white transition hover:bg-amber-600 sm:rounded-2xl sm:py-4 sm:text-sm"
                >
                  {t("memberCommission.copyMerchantLink")}
                </button>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:col-span-2 lg:rounded-[2.5rem] lg:p-7">
              <div className="space-y-4 sm:space-y-5">
                <ReferralLinkCard
                  label={t("memberCommission.memberReferralLink")}
                  value={memberReferralUrl}
                />

                <ReferralLinkCard
                  label={t("memberCommission.merchantReferralLink")}
                  value={merchantReferralUrl}
                  amber
                />
              </div>

              <p className="mt-4 text-[11px] font-bold leading-5 text-slate-500 sm:mt-5 sm:text-sm sm:leading-6">
                {t("memberCommission.shareDescription")}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3 sm:mt-6 sm:gap-4">
                <Info
                  title={t("memberCommission.level1")}
                  subtitle={t("memberCommission.directReferrals")}
                  value={directCount}
                />

                <Info
                  title={t("memberCommission.level2")}
                  subtitle={t("memberCommission.secondLevel")}
                  value={level2Count}
                />

                <Info
                  title={t("memberCommission.level3")}
                  subtitle={t("memberCommission.thirdLevel")}
                  value={level3Count}
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                <EarningCard
                  icon="👥"
                  title={t("memberCommission.memberReferralCredits")}
                  description={t("memberCommission.memberReferralCreditsDescription")}
                  value={memberReferralEarned}
                />

                <EarningCard
                  icon="🏪"
                  title={t("memberCommission.merchantReferralCredits")}
                  description={t("memberCommission.merchantReferralCreditsDescription")}
                  value={merchantReferralEarned}
                  amber
                />
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-amber-50 p-4 sm:mt-6 sm:rounded-[2rem] sm:p-5">
                <p className="text-xs font-black text-amber-800 sm:text-sm">
                  {t("memberCommission.rewardCreditsRule")}
                </p>

                <p className="mt-2 text-[11px] font-bold leading-5 text-amber-700 sm:text-sm sm:leading-7">
                  {t("memberCommission.rewardCreditsRuleDescription")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  {t("memberCommission.referralCreditHistory")}
                </h2>

                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                  {t("memberCommission.historyDescription")}
                </p>
              </div>

              <Link
                href="/member/points"
                className="shrink-0 rounded-xl bg-slate-950 px-3 py-3 text-[10px] font-black text-white no-underline transition hover:bg-slate-800 sm:rounded-2xl sm:px-6 sm:py-4 sm:text-sm"
              >
                {t("memberCommission.viewCredits")}
              </Link>
            </div>

            <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
              {history.map(
                (
                  item: ReferralHistoryItem,
                  index: number
                ) => (
                  <HistoryRow
                    key={
                      item.commissionTxId ||
                      item.id ||
                      item.referralId ||
                      `${item.transactionId}-${index}`
                    }
                    item={item}
                  />
                )
              )}

              {!loading &&
                history.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-10 sm:text-sm">
                    {t("memberCommission.noReferralCredits")}
                  </div>
                )}

              {loading && (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-10 sm:text-sm">
                  {t("memberCommission.loadingReferralHistory")}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

function ReferralLinkCard({
  label,
  value,
  amber = false
}: {
  label: string;
  value: string;
  amber?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div
      className={`rounded-xl p-3 sm:rounded-2xl sm:p-5 ${
        amber
          ? "bg-amber-50"
          : "bg-slate-50"
      }`}
    >
      <p
        className={`mb-2 text-[9px] font-black uppercase tracking-[0.08em] sm:text-xs sm:tracking-wider ${
          amber
            ? "text-amber-700"
            : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p
        className={`break-all text-[10px] font-bold leading-4 sm:text-sm sm:leading-6 ${
          amber
            ? "text-amber-900"
            : "text-slate-700"
        }`}
      >
        {value ||
          t("memberCommission.loadingReferralLink")}
      </p>
    </div>
  );
}

function HistoryRow({
  item
}: {
  item: ReferralHistoryItem;
}) {
  const { t } = useLanguage();
  const amount = Number(
    item.amount || 0
  );

  const referralType = String(
    item.referralType || "MEMBER"
  ).toUpperCase();

  const isMerchant =
    referralType === "MERCHANT";

  const level = Number(
    item.level || 0
  );

  const status =
    item.status || "Pending";

  const sourceName =
    item.sourceName ||
    (isMerchant
      ? item.fromMerchantName ||
        item.merchantName ||
        item.fromMerchantId
      : item.fromMemberName ||
        item.memberName ||
        item.fromMemberId) ||
    (isMerchant
      ? t("memberCommission.referredMerchant")
      : t("memberCommission.referredMember"));

  const sourceId =
    item.sourceId ||
    (isMerchant
      ? item.fromMerchantId
      : item.fromMemberId) ||
    "";

  const title = isMerchant
    ? t("memberCommission.merchantReferralCredit")
    : `${t("memberCommission.level")} ${
        level || "-"
      } ${t("memberCommission.referralCredit")}`;

  const description = isMerchant
    ? t("memberCommission.permanentMerchantReward")
    : `${t("memberCommission.memberReferralRewardFromLevel")} ${
        level || "-"
      }`;

  const icon = isMerchant
    ? "🏪"
    : "👤";

  const transactionAmount = Number(
    item.transactionAmount || 0
  );

  const commissionRate = Number(
    item.commissionRate || 0
  );

  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200 hover:shadow-md sm:rounded-[2rem] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl sm:h-14 sm:w-14 sm:text-2xl ${
              isMerchant
                ? "bg-amber-100"
                : "bg-slate-100"
            }`}
          >
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black text-slate-950 sm:text-lg">
                {title}
              </p>

              <ReferralTypeBadge
                isMerchant={isMerchant}
                label={
                  isMerchant
                    ? t("memberCommission.merchant")
                    : t("memberCommission.member")
                }
              />
            </div>

            <p className="mt-1 truncate text-xs font-black text-slate-700 sm:text-base">
              {sourceName}
            </p>

            <p className="mt-1 text-[10px] font-bold text-slate-400 sm:text-xs">
              {description}
            </p>

            <div className="mt-2">
              <StatusBadge
                status={status}
                label={getStatusLabel(status, t)}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-bold text-slate-400 sm:text-xs">
              {sourceId && (
                <span>
                  {t("memberCommission.source")}: {sourceId}
                </span>
              )}

              {item.transactionId && (
                <span>
                  {t("memberCommission.transaction")}:{" "}
                  {item.transactionId}
                </span>
              )}

              {transactionAmount > 0 && (
                <span>
                  {t("memberCommission.spending")}: RM
                  {money(
                    transactionAmount
                  )}
                </span>
              )}

              {commissionRate > 0 && (
                <span>
                  {t("memberCommission.rate")}:{" "}
                  {formatRate(
                    commissionRate
                  )}
                </span>
              )}
            </div>

            <p className="mt-2 text-[9px] font-medium text-slate-400 sm:text-xs">
              {formatDate(
                item.createdAt ||
                item.date
              )}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 sm:text-xs sm:tracking-[0.2em]">
            {t("memberCommission.creditAmount")}
          </p>

          <p className="mt-1 text-lg font-black text-emerald-700 sm:text-2xl">
            +RM{money(amount)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReferralTypeBadge({
  isMerchant,
  label
}: {
  isMerchant: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide sm:text-[10px] ${
        isMerchant
          ? "bg-amber-100 text-amber-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      {label}
    </span>
  );
}

function EarningCard({
  icon,
  title,
  description,
  value,
  amber = false
}: {
  icon: string;
  title: string;
  description: string;
  value: number;
  amber?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] p-4 sm:rounded-[2rem] sm:p-5 ${
        amber
          ? "bg-amber-50"
          : "bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-2xl">
            {icon}
          </div>

          <p
            className={`mt-3 text-xs font-black sm:text-sm ${
              amber
                ? "text-amber-900"
                : "text-slate-950"
            }`}
          >
            {title}
          </p>

          <p
            className={`mt-1 text-[10px] font-bold leading-5 sm:text-xs ${
              amber
                ? "text-amber-700"
                : "text-slate-500"
            }`}
          >
            {description}
          </p>
        </div>

        <p
          className={`shrink-0 text-lg font-black sm:text-2xl ${
            amber
              ? "text-amber-700"
              : "text-emerald-700"
          }`}
        >
          RM{money(value)}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/10 p-4 text-white sm:rounded-[2rem] sm:p-5 lg:p-6">
      <p className="text-[10px] font-black leading-4 text-slate-300 sm:text-sm">
        {title}
      </p>

      <h3 className="mt-2 break-words text-xl font-black leading-tight sm:mt-3 sm:text-2xl lg:text-3xl">
        {value}
      </h3>
    </div>
  );
}

function Info({
  title,
  subtitle,
  value
}: {
  title: string;
  subtitle: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-5">
      <p className="text-xs font-black text-slate-950 sm:text-sm">
        {title}
      </p>

      <p className="mt-1 truncate text-[9px] font-bold text-slate-400 sm:text-xs">
        {subtitle}
      </p>

      <p className="mt-2 text-xl font-black text-slate-950 sm:mt-3 sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  label
}: {
  status: string;
  label: string;
}) {
  const normalizedStatus =
    String(
      status || ""
    ).toLowerCase();

  const style =
    normalizedStatus === "released" ||
    normalizedStatus === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : normalizedStatus === "pending"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black sm:px-3 sm:text-xs ${style}`}
    >
      {label}
    </span>
  );
}

function getStatusLabel(
  status: string,
  t: (key: string) => string
) {
  const normalizedStatus = String(
    status || ""
  ).toLowerCase();

  if (normalizedStatus === "released") {
    return t("memberCommission.released");
  }

  if (normalizedStatus === "completed") {
    return t("memberCommission.completed");
  }

  if (normalizedStatus === "pending") {
    return t("memberCommission.pending");
  }

  return status;
}

function money(value: unknown) {
  return Number(
    value || 0
  ).toFixed(2);
}

function formatRate(value: unknown) {
  const rate = Number(value || 0);

  if (!rate) {
    return "0%";
  }

  return Number.isInteger(rate)
    ? `${rate}%`
    : `${rate.toFixed(2)}%`;
}

function formatDate(date: unknown) {
  if (!date) {
    return "-";
  }

  const parsedDate =
    new Date(String(date));

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return String(date);
  }

  return parsedDate.toLocaleString(
    "en-GB",
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

      hour12:
        true
    }
  );
}