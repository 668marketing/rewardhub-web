"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import MemberLayout from "@/components/layout/MemberLayout";
import { getMemberCommissionSummary } from "@/lib/api";

export default function CommissionPage() {
  const [summary, setSummary] = useState<any>(null);
  const [member, setMember] = useState<any>(null);
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const storedMember = JSON.parse(localStorage.getItem("member") || "{}");
      setMember(storedMember);
      setOrigin(window.location.origin);

      const memberId = storedMember?.memberId || storedMember?.MEMBER_ID;
      if (!memberId) {
        setLoading(false);
        return;
      }

      const res = await getMemberCommissionSummary({ memberId });
      const data = res?.data?.data || res?.data || res || {};
      setSummary(data);
    } catch (err) {
      console.error("Failed to load referral summary:", err);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }

  const memberId = member?.memberId || member?.MEMBER_ID || "-";
  const memberName =
    member?.displayName || member?.fullName || member?.name || "Member";

  const memberReferralUrl =
    origin && memberId !== "-" ? `${origin}/register?ref=${memberId}` : "";

  const merchantReferralUrl =
    origin && memberId !== "-"
      ? `${origin}/merchantregister?refMember=${memberId}`
      : "";

  const totalEarned = Number(summary?.totalCommission || 0);
  const releasedCredits = Number(summary?.releasedCommission || 0);
  const directCount = Number(summary?.directCount || 0);
  const level2Count = Number(summary?.level2Count || 0);
  const level3Count = Number(summary?.level3Count || 0);
  const totalReferralMembers = directCount + level2Count + level3Count;
  const history = summary?.history || [];

  async function copyLink(value: string, message: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    alert(message);
  }

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-7xl">
          <Link
            href="/member/dashboard"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm sm:px-5 sm:py-3 sm:text-sm"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:mt-6 sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
                  Referral Center
                </p>
                <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
                  Invite & Earn
                </h1>
                <p className="mt-3 max-w-2xl text-xs font-bold leading-5 text-slate-400 sm:text-sm sm:leading-6">
                  Share your referral link. When your referred members spend at
                  RewardHub merchants, your referral commission will be added
                  into your Reward Credits.
                </p>
              </div>

              <div className="shrink-0 rounded-xl bg-white/10 px-3 py-3 sm:rounded-2xl sm:px-6 sm:py-5">
                <p className="text-[9px] font-black text-slate-400 sm:text-xs">
                  Referrer ID
                </p>
                <p className="mt-1 max-w-[110px] truncate text-sm font-black text-amber-300 sm:max-w-none sm:text-2xl">
                  {memberId}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
              <StatCard title="Total Credits Earned" value={`RM${money(totalEarned)}`} />
              <StatCard title="Available Reward Credits" value={`RM${money(releasedCredits)}`} />
              <StatCard title="Direct Referrals" value={directCount} />
              <StatCard title="Total Referral Members" value={totalReferralMembers} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 lg:grid-cols-3 lg:gap-6">
            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">My Referral QR</h2>
              <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                Let new members scan this QR to register under you.
              </p>

              <div className="mt-5 flex justify-center rounded-[1.5rem] bg-slate-50 p-4 sm:mt-6 sm:rounded-[2rem] sm:p-6">
                {memberReferralUrl ? (
                  <QRCodeSVG value={memberReferralUrl} size={200} level="H" includeMargin />
                ) : (
                  <div className="flex h-[200px] w-[200px] items-center justify-center rounded-2xl bg-slate-100 text-xs font-bold text-slate-400">
                    Loading QR...
                  </div>
                )}
              </div>

              <p className="mt-4 text-center text-xs font-black text-slate-500 sm:text-sm">
                {memberName}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-1">
                <button
                  onClick={() => copyLink(memberReferralUrl, "Member referral link copied")}
                  className="w-full rounded-xl bg-slate-950 px-3 py-3 text-[10px] font-black text-white sm:rounded-2xl sm:py-4 sm:text-sm"
                >
                  Copy Member Link
                </button>
                <button
                  onClick={() => copyLink(merchantReferralUrl, "Merchant referral link copied")}
                  className="w-full rounded-xl bg-amber-500 px-3 py-3 text-[10px] font-black text-white sm:rounded-2xl sm:py-4 sm:text-sm"
                >
                  Copy Merchant Link
                </button>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:col-span-2 lg:rounded-[2.5rem] lg:p-7">
              <div className="space-y-4 sm:space-y-5">
                <ReferralLinkCard label="Member Referral Link" value={memberReferralUrl} />
                <ReferralLinkCard label="Merchant Referral Link" value={merchantReferralUrl} amber />
              </div>

              <p className="mt-4 text-[11px] font-bold leading-5 text-slate-500 sm:mt-5 sm:text-sm sm:leading-6">
                Share these links with friends or merchants. Their activity can
                generate Reward Credits for you.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3 sm:mt-6 sm:gap-4">
                <Info title="Level 1" subtitle="Direct referrals" value={directCount} />
                <Info title="Level 2" subtitle="Second level" value={level2Count} />
                <Info title="Level 3" subtitle="Third level" value={level3Count} />
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-amber-50 p-4 sm:mt-6 sm:rounded-[2rem] sm:p-5">
                <p className="text-xs font-black text-amber-800 sm:text-sm">Reward Credits Rule</p>
                <p className="mt-2 text-[11px] font-bold leading-5 text-amber-700 sm:text-sm sm:leading-7">
                  Referral commission is not a separate wallet. Once released,
                  it becomes Reward Credits and can be used to offset spending
                  at supported merchants.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">Referral Credit History</h2>
                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                  Credits generated from your referral network.
                </p>
              </div>
              <Link
                href="/member/points"
                className="shrink-0 rounded-xl bg-slate-950 px-3 py-3 text-[10px] font-black text-white no-underline sm:rounded-2xl sm:px-6 sm:py-4 sm:text-sm"
              >
                View Credits
              </Link>
            </div>

            <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
              {history.map((item: any) => (
                <HistoryRow key={item.commissionTxId || item.id} item={item} />
              ))}

              {!loading && history.length === 0 && (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-10 sm:text-sm">
                  No referral credits yet.
                </div>
              )}

              {loading && (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-10 sm:text-sm">
                  Loading referral history...
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

function ReferralLinkCard({ label, value, amber = false }: { label: string; value: string; amber?: boolean }) {
  return (
    <div className={`rounded-xl p-3 sm:rounded-2xl sm:p-5 ${amber ? "bg-amber-50" : "bg-slate-50"}`}>
      <p className={`mb-2 text-[9px] font-black uppercase tracking-[0.08em] sm:text-xs sm:tracking-wider ${amber ? "text-amber-700" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`break-all text-[10px] font-bold leading-4 sm:text-sm sm:leading-6 ${amber ? "text-amber-900" : "text-slate-700"}`}>
        {value || "Loading referral link..."}
      </p>
    </div>
  );
}

function HistoryRow({ item }: { item: any }) {
  const amount = Number(item.amount || 0);
  const level = item.level || "-";
  const status = item.status || "Pending";

  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950 sm:text-lg">Level {level} Referral Credit</p>
          <div className="mt-2"><StatusBadge status={status} /></div>
          <p className="mt-2 truncate text-[10px] font-bold text-slate-500 sm:text-sm">
            {item.commissionTxId || item.id || "-"}
          </p>
          <p className="mt-1 text-[9px] font-medium text-slate-400 sm:text-xs">
            {formatDate(item.createdAt || item.date)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 sm:text-xs sm:tracking-[0.2em]">Credit Amount</p>
          <p className="mt-1 text-lg font-black text-emerald-700 sm:text-2xl">+RM{money(amount)}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/10 p-4 text-white sm:rounded-[2rem] sm:p-5 lg:p-6">
      <p className="truncate text-[10px] font-black text-slate-300 sm:text-sm">{title}</p>
      <h3 className="mt-2 break-words text-xl font-black leading-tight sm:mt-3 sm:text-2xl lg:text-3xl">{value}</h3>
    </div>
  );
}

function Info({ title, subtitle, value }: { title: string; subtitle: string; value: any }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-5">
      <p className="text-xs font-black text-slate-950 sm:text-sm">{title}</p>
      <p className="mt-1 truncate text-[9px] font-bold text-slate-400 sm:text-xs">{subtitle}</p>
      <p className="mt-2 text-xl font-black text-slate-950 sm:mt-3 sm:text-3xl">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "Released" || status === "Completed"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Pending"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black sm:px-3 sm:text-xs ${style}`}>
      {status}
    </span>
  );
}

function money(value: any) {
  return Number(value || 0).toFixed(2);
}

function formatDate(date: any) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}