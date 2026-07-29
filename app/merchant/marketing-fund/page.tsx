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


type LanguageCode = "en" | "zh" | "ms";

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations = {
  en: {
    merchantIdMissing: "Merchant ID missing",
    boostIdMissing: "Boost ID missing",
    loading: "Loading Marketing Fund...",
    backDashboard: "← Back to Dashboard",
    marketingFund: "Marketing Fund",
    manageBudget: "Manage Marketing Budget",
    intro: "Control your normal cashback budget and activate short-term Special Boosts.",
    currentBudget: "Current Budget",
    specialBoost: "Special Boost",
    rewardCredits: "Reward Credits",
    on: "ON",
    off: "OFF",
    normalBudget: "Normal Marketing Budget",
    normalSubtitle: "Permanent budget. Can be updated once every 30 days.",
    available: "Available",
    locked: "Locked",
    canUpdateNow: "You can update your Normal Budget now.",
    nextChange: "Next Normal Budget change available after",
    updating: "Updating...",
    updateNormal: "Update Normal Budget →",
    normalPreview: "Normal Marketing Budget Preview",
    basedNormal: "Based on normal budget of {{value}}%.",
    platinumCashback: "Platinum Cashback",
    goldCashback: "Gold Cashback",
    silverCashback: "Silver Cashback",
    specialBudgetBoost: "Special Budget Boost",
    boostSubtitle: "Temporary campaign budget. Max 5 days each time. Max 2 times per month.",
    active: "Active",
    left: "{{value}} left",
    activeBoostRunning: "Active Boost Running",
    start: "Start",
    end: "End",
    cancelling: "Cancelling...",
    cancelBoost: "Cancel Boost",
    boostPreview: "Special Budget Boost Preview",
    activeBoostBudget: "Active boost budget of {{value}}%.",
    selectedBoostBudget: "Preview based on selected boost budget of {{value}}%.",
    boostStartMode: "Boost Start Mode",
    startNow: "Start Now",
    scheduleLater: "Schedule Later",
    startDate: "Start Date",
    startTime: "Start Time",
    boostDuration: "Boost Duration",
    canActivate: "You can activate {{value}} more Boost(s) this month.",
    monthlyLimit: "Monthly Boost limit reached.",
    activating: "Activating...",
    activateNow: "Activate {{value}}% Boost Now →",
    scheduleBoost: "Schedule {{value}}% Boost →",
    rewardSubtitle: "Allow members to redeem Reward Credits when paying at your store.",
    enabled: "Enabled",
    disabled: "Disabled",
    acceptCredits: "Accept Credits",
    disableCredits: "Disable Credits",
    maxRedemption: "Maximum Redemption Per Transaction",
    redemptionLimit: "Redemption Limit",
    membersRedeem: "Members can redeem up to {{value}}% of each transaction using Reward Credits.",
    redemptionDisabled: "Reward Credits redemption is disabled for your store.",
    saving: "Saving...",
    saveRewardSettings: "Save Reward Credits Settings →",
    rewardPreview: "Reward Credits Preview",
    rm100Preview: "Live preview based on RM100 transaction.",
    transaction: "Transaction",
    creditsUsed: "Credits Used",
    customerPays: "Customer Pays",
    limit: "Limit",
    status: "Status",
    marketingBudgetLabel: "Marketing Budget",
    selectStart: "Please select start date and time",
    cancelConfirm: "Cancel active Boost?",
    updatedBudget: "Marketing Budget updated successfully",
    unableBudget: "Unable to update Marketing Budget",
    boostActivated: "Boost activated successfully",
    unableBoost: "Unable to activate Boost",
    boostCancelled: "Boost cancelled successfully",
    unableCancel: "Unable to cancel Boost",
    rewardUpdated: "Reward Credits settings updated",
    unableReward: "Unable to update Reward Credits settings",
  },
  zh: {
    merchantIdMissing: "找不到商家 ID",
    boostIdMissing: "找不到 Boost ID",
    loading: "正在加载营销基金……",
    backDashboard: "← 返回商家主页",
    marketingFund: "营销基金",
    manageBudget: "管理营销预算",
    intro: "管理日常返现预算，并在需要时启动短期特别加码活动。",
    currentBudget: "当前预算",
    specialBoost: "特别加码",
    rewardCredits: "奖励金",
    on: "开启",
    off: "关闭",
    normalBudget: "日常营销预算",
    normalSubtitle: "长期使用的预算，每 30 天可更新一次。",
    available: "可修改",
    locked: "已锁定",
    canUpdateNow: "你现在可以更新日常营销预算。",
    nextChange: "下次可修改日常营销预算的时间：",
    updating: "正在更新……",
    updateNormal: "更新日常预算 →",
    normalPreview: "日常营销预算预览",
    basedNormal: "根据 {{value}}% 的日常预算计算。",
    platinumCashback: "Platinum 返现",
    goldCashback: "Gold 返现",
    silverCashback: "Silver 返现",
    specialBudgetBoost: "特别预算加码",
    boostSubtitle: "短期活动预算。每次最长 5 天，每月最多 2 次。",
    active: "进行中",
    left: "本月剩余 {{value}} 次",
    activeBoostRunning: "特别加码正在进行",
    start: "开始",
    end: "结束",
    cancelling: "正在取消……",
    cancelBoost: "取消 Boost",
    boostPreview: "特别预算加码预览",
    activeBoostBudget: "当前 Boost 预算为 {{value}}%。",
    selectedBoostBudget: "根据已选择的 {{value}}% Boost 预算预览。",
    boostStartMode: "Boost 开始方式",
    startNow: "立即开始",
    scheduleLater: "预约开始",
    startDate: "开始日期",
    startTime: "开始时间",
    boostDuration: "Boost 持续时间",
    canActivate: "本月还可以启动 {{value}} 次 Boost。",
    monthlyLimit: "本月 Boost 次数已用完。",
    activating: "正在启动……",
    activateNow: "立即启动 {{value}}% Boost →",
    scheduleBoost: "预约 {{value}}% Boost →",
    rewardSubtitle: "允许会员在你的店铺付款时使用奖励金抵扣。",
    enabled: "已开启",
    disabled: "已关闭",
    acceptCredits: "接受奖励金",
    disableCredits: "关闭奖励金",
    maxRedemption: "每笔交易最高抵扣比例",
    redemptionLimit: "抵扣上限",
    membersRedeem: "会员每笔交易最多可使用 {{value}}% 的奖励金抵扣。",
    redemptionDisabled: "你的店铺目前不接受奖励金抵扣。",
    saving: "正在保存……",
    saveRewardSettings: "保存奖励金设置 →",
    rewardPreview: "奖励金预览",
    rm100Preview: "以 RM100 交易金额即时预览。",
    transaction: "交易金额",
    creditsUsed: "使用奖励金",
    customerPays: "顾客实付",
    limit: "上限",
    status: "状态",
    marketingBudgetLabel: "营销预算",
    selectStart: "请选择开始日期和时间",
    cancelConfirm: "确定要取消当前 Boost 吗？",
    updatedBudget: "营销预算更新成功",
    unableBudget: "无法更新营销预算",
    boostActivated: "Boost 启动成功",
    unableBoost: "无法启动 Boost",
    boostCancelled: "Boost 已成功取消",
    unableCancel: "无法取消 Boost",
    rewardUpdated: "奖励金设置已更新",
    unableReward: "无法更新奖励金设置",
  },
  ms: {
    merchantIdMissing: "ID pedagang tidak ditemui",
    boostIdMissing: "ID Boost tidak ditemui",
    loading: "Sedang Memuatkan Dana Pemasaran...",
    backDashboard: "← Kembali ke Dashboard",
    marketingFund: "Dana Pemasaran",
    manageBudget: "Urus Bajet Pemasaran",
    intro: "Kawal bajet pulangan tunai biasa dan aktifkan Special Boost jangka pendek.",
    currentBudget: "Bajet Semasa",
    specialBoost: "Special Boost",
    rewardCredits: "Kredit Ganjaran",
    on: "AKTIF",
    off: "TIDAK AKTIF",
    normalBudget: "Bajet Pemasaran Biasa",
    normalSubtitle: "Bajet kekal. Boleh dikemas kini sekali setiap 30 hari.",
    available: "Tersedia",
    locked: "Dikunci",
    canUpdateNow: "Anda boleh mengemas kini Bajet Biasa sekarang.",
    nextChange: "Perubahan Bajet Biasa seterusnya tersedia selepas",
    updating: "Sedang Mengemas Kini...",
    updateNormal: "Kemas Kini Bajet Biasa →",
    normalPreview: "Pratonton Bajet Pemasaran Biasa",
    basedNormal: "Berdasarkan bajet biasa sebanyak {{value}}%.",
    platinumCashback: "Pulangan Tunai Platinum",
    goldCashback: "Pulangan Tunai Gold",
    silverCashback: "Pulangan Tunai Silver",
    specialBudgetBoost: "Special Budget Boost",
    boostSubtitle: "Bajet kempen sementara. Maksimum 5 hari setiap kali dan 2 kali sebulan.",
    active: "Aktif",
    left: "{{value}} lagi",
    activeBoostRunning: "Boost Aktif Sedang Berjalan",
    start: "Mula",
    end: "Tamat",
    cancelling: "Sedang Membatalkan...",
    cancelBoost: "Batalkan Boost",
    boostPreview: "Pratonton Special Budget Boost",
    activeBoostBudget: "Bajet Boost aktif sebanyak {{value}}%.",
    selectedBoostBudget: "Pratonton berdasarkan bajet Boost pilihan sebanyak {{value}}%.",
    boostStartMode: "Mod Mula Boost",
    startNow: "Mula Sekarang",
    scheduleLater: "Jadualkan Kemudian",
    startDate: "Tarikh Mula",
    startTime: "Masa Mula",
    boostDuration: "Tempoh Boost",
    canActivate: "Anda boleh mengaktifkan {{value}} lagi Boost bulan ini.",
    monthlyLimit: "Had Boost bulanan telah dicapai.",
    activating: "Sedang Mengaktifkan...",
    activateNow: "Aktifkan Boost {{value}}% Sekarang →",
    scheduleBoost: "Jadualkan Boost {{value}}% →",
    rewardSubtitle: "Benarkan ahli menebus Kredit Ganjaran semasa membayar di kedai anda.",
    enabled: "Diaktifkan",
    disabled: "Dilumpuhkan",
    acceptCredits: "Terima Kredit",
    disableCredits: "Lumpuhkan Kredit",
    maxRedemption: "Penebusan Maksimum Setiap Transaksi",
    redemptionLimit: "Had Penebusan",
    membersRedeem: "Ahli boleh menebus sehingga {{value}}% bagi setiap transaksi menggunakan Kredit Ganjaran.",
    redemptionDisabled: "Penebusan Kredit Ganjaran dilumpuhkan untuk kedai anda.",
    saving: "Sedang Menyimpan...",
    saveRewardSettings: "Simpan Tetapan Kredit Ganjaran →",
    rewardPreview: "Pratonton Kredit Ganjaran",
    rm100Preview: "Pratonton langsung berdasarkan transaksi RM100.",
    transaction: "Transaksi",
    creditsUsed: "Kredit Digunakan",
    customerPays: "Pelanggan Bayar",
    limit: "Had",
    status: "Status",
    marketingBudgetLabel: "Bajet Pemasaran",
    selectStart: "Sila pilih tarikh dan masa mula",
    cancelConfirm: "Batalkan Boost aktif?",
    updatedBudget: "Bajet Pemasaran berjaya dikemas kini",
    unableBudget: "Tidak dapat mengemas kini Bajet Pemasaran",
    boostActivated: "Boost berjaya diaktifkan",
    unableBoost: "Tidak dapat mengaktifkan Boost",
    boostCancelled: "Boost berjaya dibatalkan",
    unableCancel: "Tidak dapat membatalkan Boost",
    rewardUpdated: "Tetapan Kredit Ganjaran dikemas kini",
    unableReward: "Tidak dapat mengemas kini tetapan Kredit Ganjaran",
  },
} as const;

function normalizeLanguage(value: string | null): LanguageCode {
  return value === "zh" || value === "ms" ? value : "en";
}

function fill(text: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) =>
      result.replaceAll(`{{${key}}}`, String(value)),
    text
  );
}

export default function MarketingFundPage() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const t = translations[language];
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
    setLanguage(normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY)));

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: string }>;
      setLanguage(
        normalizeLanguage(
          customEvent.detail?.language ||
            localStorage.getItem(LANGUAGE_STORAGE_KEY)
        )
      );
    }

    window.addEventListener(
      "rewardhub-language-change",
      handleLanguageChange as EventListener
    );
    window.addEventListener("storage", handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener(
        "rewardhub-language-change",
        handleLanguageChange as EventListener
      );
      window.removeEventListener(
        "storage",
        handleLanguageChange as EventListener
      );
    };
  }, []);

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

    if (!id) return alert(t.merchantIdMissing);

    try {
      setSavingNormal(true);

      const res = await updateMerchantMarketingBudget({
        merchantId: id,
        marketingBudget: normalBudget,
      });

      alert(res?.message || res?.data?.message || t.updatedBudget);
      await load();
    } catch (err: any) {
      alert(err.message || t.unableBudget);
    } finally {
      setSavingNormal(false);
    }
  }

  async function handleActivateBoost() {
    const id = getStoredMerchantId();

    if (!id) return alert(t.merchantIdMissing);

    let startAt = "";

    if (boostMode === "schedule") {
      if (!startDate || !startTime) {
        alert(t.selectStart);
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

      alert(res?.message || res?.data?.message || t.boostActivated);
      await load();
    } catch (err: any) {
      alert(err.message || t.unableBoost);
    } finally {
      setSavingBoost(false);
    }
  }

  async function handleCancelBoost() {
    const id = getStoredMerchantId();

    if (!id) return alert(t.merchantIdMissing);
    if (!summary?.boost?.boostId) return alert(t.boostIdMissing);

    if (!confirm(t.cancelConfirm)) return;

    try {
      setSavingBoost(true);

      const res = await cancelMerchantBudgetBoost({
        merchantId: id,
        boostId: summary.boost.boostId,
      });

      alert(res?.message || res?.data?.message || t.boostCancelled);
      await load();
    } catch (err: any) {
      alert(err.message || t.unableCancel);
    } finally {
      setSavingBoost(false);
    }
  }

  async function handleUpdateRewardCredits() {
  const id = getStoredMerchantId();

  if (!id) return alert(t.merchantIdMissing);

  try {
    setSavingRewardCredit(true);

    const res = await updateMerchantRewardCreditSettings({
      merchantId: id,
      acceptRewardCredits,
      redemptionLimit,
    });

    alert(res?.message || res?.data?.message || t.rewardUpdated);
    await load();
  } catch (err: any) {
    alert(err.message || t.unableReward);
  } finally {
    setSavingRewardCredit(false);
  }
}

  if (loading) {
    return (
      <>
        <MerchantNav />
        <main className="min-h-screen bg-[#f5f5f3] px-4 py-8 text-center text-sm font-black text-slate-500 sm:px-8">
          {t.loading}
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
              {t.backDashboard}
            </Link>

            <div className="mt-6 grid gap-5 sm:mt-8 sm:gap-6 xl:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-sm sm:tracking-[0.25em]">
                  {t.marketingFund}
                </p>

                <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl md:text-6xl">
                  {t.manageBudget}
                </h1>

                <p className="mt-3 max-w-xl text-xs font-bold leading-5 text-slate-300 sm:mt-4 sm:text-sm sm:leading-6">
                  {t.intro}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <HeroCard title={t.currentBudget} value={`${currentBudget}%`} />
                <HeroCard title={t.specialBoost} value={isBoostActive ? t.on : t.off} active={isBoostActive} />
                <HeroCard
  title={t.rewardCredits}
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
                  title={t.normalBudget}
                  subtitle={t.normalSubtitle}
                  badge={canChangeNormal ? t.available : t.locked}
                  tone={canChangeNormal ? "green" : "amber"}
                />

                <BudgetControl value={normalBudget} disabled={!canChangeNormal} onChange={setSafeNormal} label={t.marketingBudgetLabel} />
                <QuickButtons value={normalBudget} disabled={!canChangeNormal} onChange={setSafeNormal} />

                <InfoBox>
                  {canChangeNormal ? (
                    <>{t.canUpdateNow}</>
                  ) : (
                    <>
                      {t.nextChange}{" "}
                      <span className="font-black">{formatDate(nextChangeAt, language)}</span>.
                    </>
                  )}
                </InfoBox>

                <button
                  onClick={handleUpdateNormal}
                  disabled={!canChangeNormal || savingNormal || normalBudget === Number(summary?.normalBudget || 0)}
                  className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-40 sm:mt-6 sm:rounded-2xl sm:py-5 sm:text-sm"
                >
                  {savingNormal ? t.updating : t.updateNormal}
                </button>

                <div className="mt-10 xl:hidden">
                  <PreviewCard
                    title={t.normalPreview}
                    subtitle={fill(t.basedNormal, { value: normalPreviewBudget })}
                  >
                    <Breakdown title={t.platinumCashback} value={normalPlatinum} max={normalPreviewBudget} />
                    <Breakdown title={t.goldCashback} value={normalGold} max={normalPreviewBudget} />
                    <Breakdown title={t.silverCashback} value={normalSilver} max={normalPreviewBudget} />
                  </PreviewCard>
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-8">
                <TopTitle
                  title={t.specialBudgetBoost}
                  subtitle={t.boostSubtitle}
                  badge={isBoostActive ? t.active : fill(t.left, { value: boostRemaining })}
                  tone={isBoostActive ? "green" : "slate"}
                />

                {isBoostActive ? (
                  <div className="mt-5 rounded-[1.5rem] bg-slate-950 p-4 text-white sm:mt-6 sm:rounded-[2rem] sm:p-7">
                    <p className="text-sm font-black text-amber-300">{t.activeBoostRunning}</p>
                    <h3 className="mt-2 text-3xl font-black sm:mt-3 sm:text-5xl">{summary.boost.boostBudget}%</h3>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4">
                      <MiniDark title={t.start} value={formatDateTime(summary.boost.startAt, language)} />
                      <MiniDark title={t.end} value={formatDateTime(summary.boost.endAt, language)} />
                    </div>

                    <button
                      onClick={handleCancelBoost}
                      disabled={savingBoost}
                      className="mt-5 w-full rounded-xl bg-white py-3 text-xs font-black text-slate-950 disabled:opacity-50 sm:mt-6 sm:rounded-2xl sm:py-4 sm:text-sm"
                    >
                      {savingBoost ? t.cancelling : t.cancelBoost}
                    </button>

                    <div className="mt-10 xl:hidden">
                      <PreviewCard
                        title={t.boostPreview}
                        subtitle={fill(t.activeBoostBudget, { value: currentBudget })}
                      >
                        <Breakdown title={t.platinumCashback} value={boostPlatinum} max={boostPreviewBudget} />
                        <Breakdown title={t.goldCashback} value={boostGold} max={boostPreviewBudget} />
                        <Breakdown title={t.silverCashback} value={boostSilver} max={boostPreviewBudget} />
                      </PreviewCard>
                    </div>
                  </div>
                ) : (
                  <>
                    <BudgetControl value={boostBudget} disabled={boostRemaining <= 0} onChange={setSafeBoost} label={t.marketingBudgetLabel} />
                    <QuickButtons value={boostBudget} disabled={boostRemaining <= 0} onChange={setSafeBoost} />

                    <div className="mt-6">
                      <p className="text-sm font-black text-slate-500">{t.boostStartMode}</p>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <ModeButton active={boostMode === "now"} onClick={() => setBoostMode("now")}>
                          {t.startNow}
                        </ModeButton>
                        <ModeButton active={boostMode === "schedule"} onClick={() => setBoostMode("schedule")}>
                          {t.scheduleLater}
                        </ModeButton>
                      </div>
                    </div>

                    {boostMode === "schedule" && (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4">
                        <InputBox
                          label={t.startDate}
                          type="date"
                          value={startDate}
                          onChange={setStartDate}
                        />
                        <InputBox
                          label={t.startTime}
                          type="time"
                          value={startTime}
                          onChange={setStartTime}
                        />
                      </div>
                    )}

                    <div className="mt-6">
                      <p className="text-sm font-black text-slate-500">{t.boostDuration}</p>

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
                        ? fill(t.canActivate, { value: boostRemaining })
                        : t.monthlyLimit}
                    </InfoBox>


                    <button
                      onClick={handleActivateBoost}
                      disabled={boostRemaining <= 0 || savingBoost}
                      className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-40 sm:mt-6 sm:rounded-2xl sm:py-5 sm:text-sm"
                    >
                        
                      {savingBoost
                        ? t.activating
                        : boostMode === "now"
                        ? fill(t.activateNow, { value: boostBudget })
                        : fill(t.scheduleBoost, { value: boostBudget })}
                    </button>

                    <div className="mt-10 xl:hidden">
                      <PreviewCard
                        title={t.boostPreview}
                        subtitle={`${fill(t.selectedBoostBudget, { value: boostPreviewBudget })}`}
                      >
                        <Breakdown title={t.platinumCashback} value={boostPlatinum} max={boostPreviewBudget} />
                        <Breakdown title={t.goldCashback} value={boostGold} max={boostPreviewBudget} />
                        <Breakdown title={t.silverCashback} value={boostSilver} max={boostPreviewBudget} />
                      </PreviewCard>
                    </div>
                  </>
                )}
              </div>
              <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-8">
  <TopTitle
    title={t.rewardCredits}
    subtitle={t.rewardSubtitle}
    badge={acceptRewardCredits ? t.enabled : t.disabled}
    tone={acceptRewardCredits ? "green" : "slate"}
  />

  <div className="mt-6 grid grid-cols-2 gap-3">
    <ModeButton
      active={acceptRewardCredits}
      onClick={() => setAcceptRewardCredits(true)}
    >
      {t.acceptCredits}
    </ModeButton>

    <ModeButton
      active={!acceptRewardCredits}
      onClick={() => setAcceptRewardCredits(false)}
    >
      {t.disableCredits}
    </ModeButton>
  </div>

  <div className="mt-8">
    <p className="text-sm font-black text-slate-500">
      {t.maxRedemption}
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
          {t.redemptionLimit}
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
      ? fill(t.membersRedeem, { value: redemptionLimit })
      : t.redemptionDisabled}
  </InfoBox>

  <button
    onClick={handleUpdateRewardCredits}
    disabled={savingRewardCredit}
    className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white shadow-xl disabled:opacity-40 sm:mt-6 sm:rounded-2xl sm:py-5 sm:text-sm"
  >
    {savingRewardCredit ? t.saving : t.saveRewardSettings}
  </button>

  <div className="pt-10 xl:hidden">
    <PreviewCard
      title={t.rewardPreview}
      subtitle={t.rm100Preview}
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <MiniPreview title={t.transaction} value="RM100.00" />
        <MiniPreview
          title={t.creditsUsed}
          value={`RM${rewardCreditUsed.toFixed(2)}`}
        />
        <MiniPreview
          title={t.customerPays}
          value={`RM${rewardCreditCustomerPays.toFixed(2)}`}
        />
        <MiniPreview
          title={t.limit}
          value={acceptRewardCredits ? `${redemptionLimit}%` : t.disabled}
        />
      </div>

      <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white sm:rounded-3xl sm:p-5">
        <p className="text-[10px] font-black text-slate-300 sm:text-sm">{t.status}</p>
        <p className="mt-1 text-lg font-black sm:mt-2 sm:text-2xl">
          {acceptRewardCredits ? t.enabled : t.disabled}
        </p>
      </div>
    </PreviewCard>
  </div>
</div>
            </div>


            <div className="hidden space-y-6 xl:block">
  <PreviewCard
    title={t.normalBudget}
    subtitle={fill(t.basedNormal, { value: normalPreviewBudget })}
  >
    <Breakdown title={t.platinumCashback} value={normalPlatinum} max={normalPreviewBudget} />
    <Breakdown title={t.goldCashback} value={normalGold} max={normalPreviewBudget} />
    <Breakdown title={t.silverCashback} value={normalSilver} max={normalPreviewBudget} />
  </PreviewCard>
<div className="mt-60"></div>
  <PreviewCard
    title={t.specialBudgetBoost}
    subtitle={
      isBoostActive
        ? `Active boost budget of ${currentBudget}%.`
        : `${fill(t.selectedBoostBudget, { value: boostPreviewBudget })}`
    }
  >
    <Breakdown title={t.platinumCashback} value={boostPlatinum} max={boostPreviewBudget} />
    <Breakdown title={t.goldCashback} value={boostGold} max={boostPreviewBudget} />
    <Breakdown title={t.silverCashback} value={boostSilver} max={boostPreviewBudget} />

  </PreviewCard>


  <div className="mt-115">
  <PreviewCard
    title={t.rewardCredits}
    subtitle={t.rm100Preview}
  >
    <div className="grid grid-cols-2 gap-4">
      <MiniPreview title={t.transaction} value="RM100.00" />

      <MiniPreview
        title={t.creditsUsed}
        value={`RM${rewardCreditUsed.toFixed(2)}`}
      />

      <MiniPreview
        title={t.customerPays}
        value={`RM${rewardCreditCustomerPays.toFixed(2)}`}
      />

      <MiniPreview
        title={t.limit}
        value={acceptRewardCredits ? `${redemptionLimit}%` : t.disabled}
      />
    </div>

    <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white">
      <p className="text-sm font-black text-slate-300">{t.status}</p>

      <p className="mt-2 text-2xl font-black">
        {acceptRewardCredits ? t.enabled : t.disabled}
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

function BudgetControl({ value, disabled, onChange, label }: any) {
  return (
    <>
      <div className="mt-7 flex items-center justify-center gap-4 sm:mt-10 sm:gap-6">
        <button disabled={disabled} onClick={() => onChange(value - 1)} className="h-11 w-11 rounded-full border border-slate-200 bg-white text-2xl font-black shadow-sm disabled:opacity-40 sm:h-14 sm:w-14 sm:text-3xl">
          −
        </button>

        <div className="text-center">
          <div className="text-4xl font-black text-slate-950 sm:text-7xl">{value}%</div>
          <div className="mt-2 text-[9px] font-black uppercase tracking-[0.16em] text-amber-600 sm:text-sm sm:tracking-[0.3em]">
            {label}
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

function formatDate(date: any, language: LanguageCode) {
  if (!date) return "-";

  return new Date(date).toLocaleString(language === "zh" ? "zh-CN" : language === "ms" ? "ms-MY" : "en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: any, language: LanguageCode) {
  if (!date) return "-";

  return new Date(date).toLocaleString(language === "zh" ? "zh-CN" : language === "ms" ? "ms-MY" : "en-GB", {
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