"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MerchantNav from "@/components/layout/MerchantNav";
import {
  getMerchantMarketingSummary,
  updateMerchantMarketingBudget,
  updateMerchantRewardCreditSettings,
  createMerchantBudgetBoost,
  cancelMerchantBudgetBoost,
} from "@/lib/api";

export default function MarketingFundPage() {
  const [merchantId, setMerchantId] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [normalBudget, setNormalBudget] = useState(5);
  const [boostBudget, setBoostBudget] = useState(30);
  const [boostDays, setBoostDays] = useState(1);
  const [boostMode, setBoostMode] = useState<"now" | "schedule">("now");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [loading, setLoading] = useState(true);
  const [savingNormal, setSavingNormal] = useState(false);
  const [savingBoost, setSavingBoost] = useState(false);
  const [acceptRewardCredits, setAcceptRewardCredits] = useState(true);
const [redemptionLimit, setRedemptionLimit] = useState(30);
const [savingRewardCredit, setSavingRewardCredit] = useState(false);

  function getStoredMerchantId() {
    const raw = localStorage.getItem("merchant");
    const stored = raw ? JSON.parse(raw) : {};

    return (
      merchantId ||
      summary?.merchantId ||
      summary?.data?.merchantId ||
      stored?.merchantId ||
      stored?.MERCHANT_ID ||
      ""
    );
  }

  function getApiData(res: any) {
    return res?.data?.data || res?.data || res?.result?.data || res?.result || res;
  }

  async function load() {
    try {
      setLoading(true);

      const id = getStoredMerchantId();

      if (!id) {
        setLoading(false);
        return;
      }

      setMerchantId(id);

      const res = await getMerchantMarketingSummary(id);
      const data = getApiData(res);

      console.log("BOOST ACTIVE:", data?.boost?.active);
console.log("BOOST BUDGET:", data?.boost?.boostBudget);
console.log("CURRENT BUDGET:", data?.currentBudget);
console.log("BOOST REMAINING:", data?.boostRemainingThisMonth);

      setSummary(data);
      setNormalBudget(Number(data.normalBudget || 5));
      setBoostBudget(Number(data.boost?.boostBudget || 30));
      setAcceptRewardCredits(data?.rewardCredits?.acceptRewardCredits === true);
setRedemptionLimit(Number(data?.rewardCredits?.redemptionLimit || 30));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const today = new Date();
    setStartDate(today.toISOString().slice(0, 10));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentBudget = Number(summary?.currentBudget || normalBudget || 0);
  const isBoostActive = summary?.boost?.active === true;
  const boostRemaining = Number(summary?.boostRemainingThisMonth ?? 2);
  const nextChangeAt = summary?.nextBudgetChangeAt || "";

  const canChangeNormal = useMemo(() => {
    if (!nextChangeAt) return true;
    return new Date() >= new Date(nextChangeAt);
  }, [nextChangeAt]);

  const normalPreviewBudget = normalBudget;

const normalPlatinum = normalPreviewBudget * 0.3;
const normalGold = normalPreviewBudget * 0.2;
const normalSilver = normalPreviewBudget * 0.1;
const normalL1 = normalPreviewBudget * 0.1;
const normalL2 = normalPreviewBudget * 0.08;
const normalL3 = normalPreviewBudget * 0.06;
  normalPreviewBudget -
  normalPlatinum -
  normalGold -
  normalSilver -
  normalL1 -
  normalL2 -
  normalL3;

const boostPreviewBudget = boostBudget;

const boostPlatinum = boostPreviewBudget * 0.3;
const boostGold = boostPreviewBudget * 0.2;
const boostSilver = boostPreviewBudget * 0.1;
const boostL1 = boostPreviewBudget * 0.1;
const boostL2 = boostPreviewBudget * 0.08;
const boostL3 = boostPreviewBudget * 0.06;
  boostPreviewBudget -
  boostPlatinum -
  boostGold -
  boostSilver -
  boostL1 -
  boostL2 -
  boostL3;

const rewardCreditTransaction = 100;
const rewardCreditUsed = acceptRewardCredits
  ? (rewardCreditTransaction * redemptionLimit) / 100
  : 0;
const rewardCreditCustomerPays =
  rewardCreditTransaction - rewardCreditUsed;

  function setSafeNormal(value: number) {
    setNormalBudget(Math.min(100, Math.max(5, value)));
  }

  function setSafeBoost(value: number) {
    setBoostBudget(Math.min(100, Math.max(5, value)));
  }

  async function handleUpdateNormal() {
    const id = getStoredMerchantId();

    if (!id) return alert("Merchant ID missing");

    try {
      setSavingNormal(true);

      const res = await updateMerchantMarketingBudget({
        merchantId: id,
        marketingBudget: normalBudget,
      });

      alert(res?.message || res?.data?.message || "Marketing Budget updated successfully");
      await load();
    } catch (err: any) {
      alert(err.message || "Unable to update Marketing Budget");
    } finally {
      setSavingNormal(false);
    }
  }

  async function handleActivateBoost() {
    const id = getStoredMerchantId();

    if (!id) return alert("Merchant ID missing");

    let startAt = "";

    if (boostMode === "schedule") {
      if (!startDate || !startTime) {
        alert("Please select start date and time");
        return;
      }

      startAt = `${startDate}T${startTime}:00`;
    }

    try {
      setSavingBoost(true);

      const res = await createMerchantBudgetBoost({
        merchantId: id,
        boostBudget,
        days: boostDays,
        startAt,
      });

      alert(res?.message || res?.data?.message || "Boost activated successfully");
      await load();
    } catch (err: any) {
      alert(err.message || "Unable to activate Boost");
    } finally {
      setSavingBoost(false);
    }
  }

  async function handleCancelBoost() {
    const id = getStoredMerchantId();

    if (!id) return alert("Merchant ID missing");
    if (!summary?.boost?.boostId) return alert("Boost ID missing");

    if (!confirm("Cancel active Boost?")) return;

    try {
      setSavingBoost(true);

      const res = await cancelMerchantBudgetBoost({
        merchantId: id,
        boostId: summary.boost.boostId,
      });

      alert(res?.message || res?.data?.message || "Boost cancelled successfully");
      await load();
    } catch (err: any) {
      alert(err.message || "Unable to cancel Boost");
    } finally {
      setSavingBoost(false);
    }
  }

  async function handleUpdateRewardCredits() {
  const id = getStoredMerchantId();

  if (!id) return alert("Merchant ID missing");

  try {
    setSavingRewardCredit(true);

    const res = await updateMerchantRewardCreditSettings({
      merchantId: id,
      acceptRewardCredits,
      redemptionLimit,
    });

    alert(res?.message || res?.data?.message || "Reward Credits settings updated");
    await load();
  } catch (err: any) {
    alert(err.message || "Unable to update Reward Credits settings");
  } finally {
    setSavingRewardCredit(false);
  }
}

  if (loading) {
    return (
      <>
        <MerchantNav />
        <main className="min-h-screen bg-[#f5f5f3] px-4 py-8 text-center text-sm font-black text-slate-500 sm:px-8">
          Loading Marketing Fund...
        </main>
      </>
    );
  }

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f5f5f3] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-10">
            <Link href="/merchant/dashboard" className="text-xs font-black text-slate-300 no-underline sm:text-sm">
              ← Back to Dashboard
            </Link>

            <div className="mt-6 grid gap-5 sm:mt-8 sm:gap-6 xl:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-sm sm:tracking-[0.25em]">
                  Marketing Fund
                </p>

                <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl md:text-6xl">
                  Manage Marketing Budget
                </h1>

                <p className="mt-3 max-w-xl text-xs font-bold leading-5 text-slate-300 sm:mt-4 sm:text-sm sm:leading-6">
                  Control your normal cashback budget and activate short-term Special Boosts.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <HeroCard title="Current Budget" value={`${currentBudget}%`} />
                <HeroCard title="Special Boost" value={isBoostActive ? "ON" : "OFF"} active={isBoostActive} />
                <HeroCard
  title="Reward Credits"
  value={acceptRewardCredits ? `${redemptionLimit}%` : "0%"}
  active={acceptRewardCredits}
/>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-8">
                <TopTitle
                  title="Normal Marketing Budget"
                  subtitle="Permanent budget. Can be updated once every 30 days."
                  badge={canChangeNormal ? "Available" : "Locked"}
                  tone={canChangeNormal ? "green" : "amber"}
                />

                <BudgetControl value={normalBudget} disabled={!canChangeNormal} onChange={setSafeNormal} />
                <QuickButtons value={normalBudget} disabled={!canChangeNormal} onChange={setSafeNormal} />

                <InfoBox>
                  {canChangeNormal ? (
                    <>You can update your Normal Budget now.</>
                  ) : (
                    <>
                      Next Normal Budget change available after{" "}
                      <span className="font-black">{formatDate(nextChangeAt)}</span>.
                    </>
                  )}
                </InfoBox>

                <button
                  onClick={handleUpdateNormal}
                  disabled={!canChangeNormal || savingNormal || normalBudget === Number(summary?.normalBudget || 0)}
                  className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-40 sm:mt-6 sm:rounded-2xl sm:py-5 sm:text-sm"
                >
                  {savingNormal ? "Updating..." : "Update Normal Budget →"}
                </button>

                <div className="mt-10 xl:hidden">
                  <PreviewCard
                    title="Normal Marketing Budget Preview"
                    subtitle={`Based on normal budget of ${normalPreviewBudget}%.`}
                  >
                    <Breakdown title="Platinum Cashback" value={normalPlatinum} max={normalPreviewBudget} />
                    <Breakdown title="Gold Cashback" value={normalGold} max={normalPreviewBudget} />
                    <Breakdown title="Silver Cashback" value={normalSilver} max={normalPreviewBudget} />
                  </PreviewCard>
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-8">
                <TopTitle
                  title="Special Budget Boost"
                  subtitle="Temporary campaign budget. Max 5 days each time. Max 2 times per month."
                  badge={isBoostActive ? "Active" : `${boostRemaining} left`}
                  tone={isBoostActive ? "green" : "slate"}
                />

                {isBoostActive ? (
                  <div className="mt-5 rounded-[1.5rem] bg-slate-950 p-4 text-white sm:mt-6 sm:rounded-[2rem] sm:p-7">
                    <p className="text-sm font-black text-amber-300">Active Boost Running</p>
                    <h3 className="mt-2 text-3xl font-black sm:mt-3 sm:text-5xl">{summary.boost.boostBudget}%</h3>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4">
                      <MiniDark title="Start" value={formatDateTime(summary.boost.startAt)} />
                      <MiniDark title="End" value={formatDateTime(summary.boost.endAt)} />
                    </div>

                    <button
                      onClick={handleCancelBoost}
                      disabled={savingBoost}
                      className="mt-5 w-full rounded-xl bg-white py-3 text-xs font-black text-slate-950 disabled:opacity-50 sm:mt-6 sm:rounded-2xl sm:py-4 sm:text-sm"
                    >
                      {savingBoost ? "Cancelling..." : "Cancel Boost"}
                    </button>

                    <div className="mt-10 xl:hidden">
                      <PreviewCard
                        title="Special Budget Boost Preview"
                        subtitle={`Active boost budget of ${currentBudget}%.`}
                      >
                        <Breakdown title="Platinum Cashback" value={boostPlatinum} max={boostPreviewBudget} />
                        <Breakdown title="Gold Cashback" value={boostGold} max={boostPreviewBudget} />
                        <Breakdown title="Silver Cashback" value={boostSilver} max={boostPreviewBudget} />
                      </PreviewCard>
                    </div>
                  </div>
                ) : (
                  <>
                    <BudgetControl value={boostBudget} disabled={boostRemaining <= 0} onChange={setSafeBoost} />
                    <QuickButtons value={boostBudget} disabled={boostRemaining <= 0} onChange={setSafeBoost} />

                    <div className="mt-6">
                      <p className="text-sm font-black text-slate-500">Boost Start Mode</p>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <ModeButton active={boostMode === "now"} onClick={() => setBoostMode("now")}>
                          Start Now
                        </ModeButton>
                        <ModeButton active={boostMode === "schedule"} onClick={() => setBoostMode("schedule")}>
                          Schedule Later
                        </ModeButton>
                      </div>
                    </div>

                    {boostMode === "schedule" && (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4">
                        <InputBox
                          label="Start Date"
                          type="date"
                          value={startDate}
                          onChange={setStartDate}
                        />
                        <InputBox
                          label="Start Time"
                          type="time"
                          value={startTime}
                          onChange={setStartTime}
                        />
                      </div>
                    )}

                    <div className="mt-6">
                      <p className="text-sm font-black text-slate-500">Boost Duration</p>

                      <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
                        {[1, 2, 3, 4, 5].map((day) => (
                          <button
                            key={day}
                            disabled={boostRemaining <= 0}
                            onClick={() => setBoostDays(day)}
                            className={`rounded-xl border py-3 text-xs font-black sm:rounded-2xl sm:py-4 sm:text-sm ${
                              boostDays === day
                                ? "border-slate-950 bg-slate-950 text-white"
                                : "border-slate-200 bg-white text-slate-950"
                            } disabled:opacity-40`}
                          >
                            {day}D
                          </button>
                        ))}
                      </div>
                    </div>

                    <InfoBox green>
                      {boostRemaining > 0
                        ? `You can activate ${boostRemaining} more Boost(s) this month.`
                        : "Monthly Boost limit reached."}
                    </InfoBox>


                    <button
                      onClick={handleActivateBoost}
                      disabled={boostRemaining <= 0 || savingBoost}
                      className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-40 sm:mt-6 sm:rounded-2xl sm:py-5 sm:text-sm"
                    >
                        
                      {savingBoost
                        ? "Activating..."
                        : boostMode === "now"
                        ? `Activate ${boostBudget}% Boost Now →`
                        : `Schedule ${boostBudget}% Boost →`}
                    </button>

                    <div className="mt-10 xl:hidden">
                      <PreviewCard
                        title="Special Budget Boost Preview"
                        subtitle={`Preview based on selected boost budget of ${boostPreviewBudget}%.`}
                      >
                        <Breakdown title="Platinum Cashback" value={boostPlatinum} max={boostPreviewBudget} />
                        <Breakdown title="Gold Cashback" value={boostGold} max={boostPreviewBudget} />
                        <Breakdown title="Silver Cashback" value={boostSilver} max={boostPreviewBudget} />
                      </PreviewCard>
                    </div>
                  </>
                )}
              </div>
              <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-8">
  <TopTitle
    title="Reward Credits"
    subtitle="Allow members to redeem Reward Credits when paying at your store."
    badge={acceptRewardCredits ? "Enabled" : "Disabled"}
    tone={acceptRewardCredits ? "green" : "slate"}
  />

  <div className="mt-6 grid grid-cols-2 gap-3">
    <ModeButton
      active={acceptRewardCredits}
      onClick={() => setAcceptRewardCredits(true)}
    >
      Accept Credits
    </ModeButton>

    <ModeButton
      active={!acceptRewardCredits}
      onClick={() => setAcceptRewardCredits(false)}
    >
      Disable Credits
    </ModeButton>
  </div>

  <div className="mt-8">
    <p className="text-sm font-black text-slate-500">
      Maximum Redemption Per Transaction
    </p >

    <div className="mt-6 flex items-center justify-center gap-6">
      <button
        disabled={!acceptRewardCredits}
        onClick={() => setRedemptionLimit(Math.max(10, redemptionLimit - 10))}
        className="h-11 w-11 rounded-full border border-slate-200 bg-white text-2xl font-black shadow-sm disabled:opacity-40 sm:h-14 sm:w-14 sm:text-3xl"
      >
        −
      </button>

      <div className="text-center">
        <div className="text-4xl font-black text-slate-950 sm:text-7xl">
          {redemptionLimit}%
        </div>
        <div className="mt-2 text-[9px] font-black uppercase tracking-[0.16em] text-amber-600 sm:text-sm sm:tracking-[0.25em]">
          Redemption Limit
        </div>
      </div>

      <button
        disabled={!acceptRewardCredits}
        onClick={() => setRedemptionLimit(Math.min(100, redemptionLimit + 10))}
        className="h-11 w-11 rounded-full border border-slate-200 bg-white text-2xl font-black text-amber-600 shadow-sm disabled:opacity-40 sm:h-14 sm:w-14 sm:text-3xl"
      >
        +
      </button>
    </div>

    <div className="mt-5 grid grid-cols-5 gap-2 sm:mt-6 sm:gap-3">
      {[10, 20, 30, 50, 100].map((value) => (
        <button
          key={value}
          disabled={!acceptRewardCredits}
          onClick={() => setRedemptionLimit(value)}
          className={`rounded-xl border py-3 text-xs font-black sm:rounded-2xl sm:py-4 sm:text-sm ${
            redemptionLimit === value
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-slate-200 bg-white text-slate-950"
          } disabled:opacity-40`}
        >
          {value}%
        </button>
      ))}
    </div>
  </div>

  <InfoBox green>
    {acceptRewardCredits
      ? `Members can redeem up to ${redemptionLimit}% of each transaction using Reward Credits.`
      : "Reward Credits redemption is disabled for your store."}
  </InfoBox>

  <button
    onClick={handleUpdateRewardCredits}
    disabled={savingRewardCredit}
    className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white shadow-xl disabled:opacity-40 sm:mt-6 sm:rounded-2xl sm:py-5 sm:text-sm"
  >
    {savingRewardCredit ? "Saving..." : "Save Reward Credits Settings →"}
  </button>

  <div className="pt-10 xl:hidden">
    <PreviewCard
      title="Reward Credits Preview"
      subtitle="Live preview based on RM100 transaction."
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <MiniPreview title="Transaction" value="RM100.00" />
        <MiniPreview
          title="Credits Used"
          value={`RM${rewardCreditUsed.toFixed(2)}`}
        />
        <MiniPreview
          title="Customer Pays"
          value={`RM${rewardCreditCustomerPays.toFixed(2)}`}
        />
        <MiniPreview
          title="Limit"
          value={acceptRewardCredits ? `${redemptionLimit}%` : "Disabled"}
        />
      </div>

      <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white sm:rounded-3xl sm:p-5">
        <p className="text-[10px] font-black text-slate-300 sm:text-sm">Status</p>
        <p className="mt-1 text-lg font-black sm:mt-2 sm:text-2xl">
          {acceptRewardCredits ? "Enabled" : "Disabled"}
        </p>
      </div>
    </PreviewCard>
  </div>
</div>
            </div>


            <div className="hidden space-y-6 xl:block">
  <PreviewCard
    title="Normal Marketing Budget"
    subtitle={`Based on normal budget of ${normalPreviewBudget}%.`}
  >
    <Breakdown title="Platinum Cashback" value={normalPlatinum} max={normalPreviewBudget} />
    <Breakdown title="Gold Cashback" value={normalGold} max={normalPreviewBudget} />
    <Breakdown title="Silver Cashback" value={normalSilver} max={normalPreviewBudget} />
  </PreviewCard>
<div className="mt-60"></div>
  <PreviewCard
    title="Special Budget Boost"
    subtitle={
      isBoostActive
        ? `Active boost budget of ${currentBudget}%.`
        : `Preview based on selected boost budget of ${boostPreviewBudget}%.`
    }
  >
    <Breakdown title="Platinum Cashback" value={boostPlatinum} max={boostPreviewBudget} />
    <Breakdown title="Gold Cashback" value={boostGold} max={boostPreviewBudget} />
    <Breakdown title="Silver Cashback" value={boostSilver} max={boostPreviewBudget} />

  </PreviewCard>


  <div className="mt-115">
  <PreviewCard
    title="Reward Credits"
    subtitle="Live preview based on RM100 transaction."
  >
    <div className="grid grid-cols-2 gap-4">
      <MiniPreview title="Transaction" value="RM100.00" />

      <MiniPreview
        title="Credits Used"
        value={`RM${rewardCreditUsed.toFixed(2)}`}
      />

      <MiniPreview
        title="Customer Pays"
        value={`RM${rewardCreditCustomerPays.toFixed(2)}`}
      />

      <MiniPreview
        title="Limit"
        value={acceptRewardCredits ? `${redemptionLimit}%` : "Disabled"}
      />
    </div>

    <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white">
      <p className="text-sm font-black text-slate-300">Status</p>

      <p className="mt-2 text-2xl font-black">
        {acceptRewardCredits ? "Enabled" : "Disabled"}
      </p>
    </div>
  </PreviewCard>
</div>

</div>
</div>
        </section>
      </main>
    </>
  );
}

function TopTitle({ title, subtitle, badge, tone }: any) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-950 sm:text-2xl">{title}</h2>
        <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">{subtitle}</p>
      </div>
      <Badge text={badge} tone={tone} />
    </div>
  );
}

function BudgetControl({ value, disabled, onChange }: any) {
  return (
    <>
      <div className="mt-7 flex items-center justify-center gap-4 sm:mt-10 sm:gap-6">
        <button disabled={disabled} onClick={() => onChange(value - 1)} className="h-11 w-11 rounded-full border border-slate-200 bg-white text-2xl font-black shadow-sm disabled:opacity-40 sm:h-14 sm:w-14 sm:text-3xl">
          −
        </button>

        <div className="text-center">
          <div className="text-4xl font-black text-slate-950 sm:text-7xl">{value}%</div>
          <div className="mt-2 text-[9px] font-black uppercase tracking-[0.16em] text-amber-600 sm:text-sm sm:tracking-[0.3em]">
            Marketing Budget
          </div>
        </div>

        <button disabled={disabled} onClick={() => onChange(value + 1)} className="h-11 w-11 rounded-full border border-slate-200 bg-white text-2xl font-black text-amber-600 shadow-sm disabled:opacity-40 sm:h-14 sm:w-14 sm:text-3xl">
          +
        </button>
      </div>

      <div className="mt-7 sm:mt-10">
        <div className="mb-3 flex justify-between text-sm font-black text-slate-700">
          <span>5%</span>
          <span>100%</span>
        </div>

        <input type="range" min={5} max={100} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-amber-500" />
      </div>
    </>
  );
}

function QuickButtons({ value, disabled, onChange }: any) {
  return (
    <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3 md:grid-cols-6">
      {[5, 10, 15, 20, 30, 50].map((quick) => (
        <button
          key={quick}
          disabled={disabled}
          onClick={() => onChange(quick)}
          className={`rounded-xl border py-3 text-xs font-black sm:rounded-2xl sm:py-4 sm:text-sm ${
            value === quick ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-950"
          } disabled:opacity-40`}
        >
          {quick}%
        </button>
      ))}
    </div>
  );
}

function ModeButton({ active, onClick, children }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border py-3 text-xs font-black sm:rounded-2xl sm:py-4 sm:text-sm ${
        active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      {children}
    </button>
  );
}

function InputBox({ label, type, value, onChange }: any) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:p-4">
      <p className="text-[9px] font-black text-slate-400 sm:text-xs">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full bg-transparent text-sm font-black text-slate-950 outline-none sm:text-lg"
      />
    </div>
  );
}

function InfoBox({ children, green = false }: any) {
  return (
    <div className={`mt-5 rounded-2xl p-4 text-[11px] font-bold leading-5 sm:mt-6 sm:rounded-3xl sm:p-5 sm:text-sm ${green ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
      {children}
    </div>
  );
}

function HeroCard({ title, value, active = false }: any) {
  return (
    <div className={`min-w-0 rounded-xl border p-3 sm:rounded-[2rem] sm:p-5 ${active ? "border-emerald-400 bg-emerald-400/10" : "border-white/10 bg-white/5"}`}>
      <p className="truncate text-[9px] font-black text-slate-300 sm:text-sm">{title}</p>
      <h2 className="mt-1 break-words text-sm font-black text-white sm:mt-3 sm:text-2xl">{value}</h2>
    </div>
  );
}

function MiniDark({ title, value }: any) {
  return (
    <div className="rounded-xl bg-white/10 p-3 sm:rounded-2xl sm:p-4">
      <p className="text-[9px] font-black text-slate-400 sm:text-xs">{title}</p>
      <p className="mt-1 text-xs font-black text-white sm:mt-2 sm:text-sm">{value}</p>
    </div>
  );
}

function Badge({ text, tone }: any) {
  const style: any = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return <div className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black sm:px-4 sm:py-2 sm:text-sm ${style[tone]}`}>{text}</div>;
}

function Breakdown({ title, value, max, strong = false }: any) {
  const percent = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className={`rounded-xl p-3 sm:rounded-2xl sm:p-4 ${strong ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-950"}`}>
      <div className="flex justify-between">
        <p className="text-xs font-black sm:text-sm">{title}</p>
        <p className="text-xs font-black sm:text-sm">{value.toFixed(2)}%</p>
      </div>

      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-amber-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function PreviewCard({ title, subtitle, children }: any) {
  return (
    <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
      <h2 className="text-xl font-black text-slate-950 sm:text-2xl">{title}</h2>
      <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">{subtitle}</p >

      <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">{children}</div>
    </div>
  );
}

function formatDate(date: any) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: any) {
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

function MiniPreview({ title, value }: any) {
  return (
    <div className="rounded-xl bg-white p-3 sm:rounded-2xl sm:p-4">
      <p className="text-[9px] font-black text-slate-400 sm:text-xs">{title}</p >
      <p className="mt-1 text-sm font-black text-slate-950 sm:mt-2 sm:text-lg">{value}</p >
    </div>
  );
}