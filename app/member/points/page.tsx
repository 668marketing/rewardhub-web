"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemberLayout from "@/components/layout/MemberLayout";
import { getMemberWalletSummary, getMemberPointsHistory } from "@/lib/api";

export default function PointsPage() {
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const member = JSON.parse(localStorage.getItem("member") || "{}");
      const memberId = member?.memberId || member?.MEMBER_ID;

      if (!memberId) {
        setLoading(false);
        return;
      }

      const res = await getMemberWalletSummary({ memberId });
      const summary = res?.data?.data || res?.data || res?.result || res;

      setData(summary);

      const historyRes = await getMemberPointsHistory({
        memberId,
        limit: 50,
      });

      const historyData =
        historyRes?.data?.data ||
        historyRes?.data ||
        historyRes?.result ||
        historyRes;

      setHistory(historyData?.history || []);
    } catch (err) {
      console.error("Failed to load points page:", err);
      setData({});
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  const currentPoints = Number(data?.currentPoints || data?.points || 0);
  const totalEarned = Number(data?.totalPointsEarned || currentPoints || 0);
  const redeemed = Number(data?.pointsRedeemed || 0);

  const rewardCredits = Number(
    data?.rewardCredits || data?.rewardCreditBalance || 0
  );

  const cashbackSaved = Number(
    data?.cashbackSaved || data?.totalCashback || 0
  );

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
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
              Rewards Wallet
            </p>

            <h1 className="mt-3 text-2xl font-black leading-tight sm:text-4xl md:text-5xl">
              Points & Reward Credits
            </h1>

            <p className="mt-3 max-w-2xl text-xs font-bold leading-5 text-slate-400 sm:text-sm">
              Track your points, Reward Credits, redemption activity and total
              cashback saved.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
              <StatCard
                title="Reward Credits"
                value={`RM${money(rewardCredits)}`}
                highlight
              />
              <StatCard title="Current Points" value={`${currentPoints} pts`} />
              <StatCard title="Total Earned" value={`${totalEarned} pts`} />
              <StatCard
                title="Cashback Saved"
                value={`RM${money(cashbackSaved)}`}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 lg:grid-cols-2 lg:gap-6">
            <div className="min-w-0 rounded-[1.5rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem]">
              <h2 className="text-lg font-black text-slate-950 sm:text-2xl">
                Reward Credits
              </h2>

              <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500 sm:text-sm">
                Reward Credits are your spendable balance. They can be used to
                offset payments at supported merchants.
              </p>

              <div className="mt-4 rounded-[1.25rem] bg-slate-950 p-4 text-white sm:mt-6 sm:rounded-[2rem] sm:p-7">
                <p className="text-[10px] font-black text-amber-300 sm:text-sm">
                  Available to Spend
                </p>

                <h3 className="mt-2 break-words text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  RM{money(rewardCredits)}
                </h3>

                <p className="mt-2 text-[10px] font-bold leading-4 text-slate-400 sm:mt-3 sm:text-sm sm:leading-6">
                  Credits may come from referral commission, admin bonus,
                  promotions or other RewardHub rewards.
                </p>
              </div>

              <Link
                href="/member/pay"
                className="mt-4 block rounded-xl bg-slate-950 px-3 py-3 text-center text-xs font-black text-white no-underline sm:mt-6 sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                Use Reward Credits
              </Link>
            </div>

            <div className="min-w-0 rounded-[1.5rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem]">
              <h2 className="text-lg font-black text-slate-950 sm:text-2xl">
                Points Information
              </h2>

              <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500 sm:text-sm">
                Points are your loyalty score and can be used for future
                rewards.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
                <InfoRow title="Earn Rate" detail="RM1 spending = 1 point." />
                <InfoRow
                  title="Redeem Rewards"
                  detail="Use points to exchange vouchers, products or merchant rewards."
                />
                <InfoRow
                  title="Non-transferable"
                  detail="Points cannot be transferred to another member."
                />
                <InfoRow
                  title="Redeemed"
                  detail={`${redeemed} points redeemed so far.`}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Redeem Rewards
                </h2>

                <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">
                  Use your points to redeem products, vouchers or merchant
                  rewards.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-700 sm:px-4 sm:py-2 sm:text-sm">
                Coming Soon
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-4">
              <RewardItem
                icon="☕"
                title="Free Drink Voucher"
                points={300}
                tag="Merchant Reward"
                disabled={currentPoints < 300}
              />

              <RewardItem
                icon="🎟️"
                title="RM5 Discount Voucher"
                points={500}
                tag="RewardHub Voucher"
                disabled={currentPoints < 500}
              />

              <RewardItem
                icon="🎁"
                title="Premium Member Gift"
                points={1000}
                tag="Special Gift"
                disabled={currentPoints < 1000}
              />
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7">
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              Points History
            </h2>

            <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
              Your earned and redeemed points activity.
            </p>

            <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
              {history.map((item) => (
                <HistoryRow
                  key={
                    item.pointId ||
                    item.pointsTxId ||
                    item.id ||
                    item.transactionId
                  }
                  title={
                    item.type === "Earn"
                      ? "Points Earned"
                      : "Points Redeemed"
                  }
                  detail={item.description || item.source || "-"}
                  points={`${Number(item.points) > 0 ? "+" : ""}${
                    item.points
                  } pts`}
                  negative={Number(item.points) < 0}
                />
              ))}

              {!loading && history.length === 0 && (
                <div className="rounded-2xl bg-slate-50 p-5 text-center sm:rounded-3xl sm:p-8">
                  <p className="text-base font-black text-slate-950 sm:text-lg">
                    No points history yet.
                  </p>
                  <p className="mt-2 text-xs font-bold text-slate-500 sm:text-sm">
                    Your earned and redeemed points will appear here.
                  </p>
                </div>
              )}

              {loading && (
                <div className="rounded-2xl bg-slate-50 p-5 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-8 sm:text-sm">
                  Loading points history...
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

function StatCard({
  title,
  value,
  highlight = false,
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl p-4 sm:rounded-[2rem] sm:p-5 lg:p-6 ${
        highlight ? "bg-white text-slate-950" : "bg-white/10 text-white"
      }`}
    >
      <p
        className={`truncate text-[10px] font-black sm:text-sm ${
          highlight ? "text-slate-500" : "text-slate-300"
        }`}
      >
        {title}
      </p>

      <h2 className="mt-2 break-words text-xl font-black leading-tight sm:mt-3 sm:text-2xl lg:text-3xl">
        {value}
      </h2>
    </div>
  );
}

function InfoRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-3 sm:rounded-3xl sm:p-5">
      <p className="text-xs font-black text-slate-950 sm:text-base">
        {title}
      </p>
      <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500 sm:text-sm sm:leading-5">
        {detail}
      </p>
    </div>
  );
}

function RewardItem({
  icon,
  title,
  points,
  tag,
  disabled,
}: {
  icon: string;
  title: string;
  points: number;
  tag: string;
  disabled: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 sm:rounded-[2rem] sm:p-5">
      <div className="flex h-14 items-center justify-center rounded-xl bg-white text-2xl sm:h-24 sm:rounded-2xl sm:text-4xl">
        {icon}
      </div>

      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs font-black leading-5 text-slate-950 sm:mt-4 sm:min-h-0 sm:text-lg">
        {title}
      </p>

      <p className="mt-1 truncate text-[9px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
        {tag}
      </p>

      <button
        disabled={disabled}
        className="mt-3 w-full rounded-xl bg-slate-950 px-2 py-2.5 text-center text-[9px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40 sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm"
      >
        {disabled ? `Need ${points}` : `Redeem ${points}`}
      </button>
    </div>
  );
}

function HistoryRow({
  title,
  detail,
  points,
  negative = false,
}: {
  title: string;
  detail: string;
  points: string;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 sm:rounded-3xl sm:p-5">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-950 sm:text-base">
          {title}
        </p>
        <p className="mt-1 truncate text-[10px] font-bold text-slate-500 sm:text-sm">
          {detail}
        </p>
      </div>

      <p
        className={`shrink-0 text-sm font-black sm:text-xl ${
          negative ? "text-red-600" : "text-emerald-700"
        }`}
      >
        {points}
      </p>
    </div>
  );
}

function money(value: any) {
  return Number(value || 0).toFixed(2);
}