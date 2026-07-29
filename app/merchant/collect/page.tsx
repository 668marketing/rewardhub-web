"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  merchantPayment,
  getMemberByCardId,
  getMerchantDetail,
  getMerchantMarketingSummary,
  uploadTransactionReceipt,
} from "@/lib/api";
import MerchantNav from "@/components/layout/MerchantNav";

type LanguageCode = "en" | "zh" | "ms";
type CardStatusKey =
  | "tapMemberCardToStart"
  | "clickCardBox"
  | "qrScanned"
  | "searchingMember"
  | "memberFound"
  | "cardNotFound";
type PaymentMethod = "Cash" | "DuitNow" | "TNG" | "Bank" | "Card";

type Translation = {
  collectPayment: string;
  merchant: string;
  identifyMember: string;
  identifyMemberDescription: string;
  scanMemberQr: string;
  tapMemberCard: string;
  cardStatus: string;
  tapMemberCardToStart: string;
  clickCardBox: string;
  qrScanned: string;
  searchingMember: string;
  memberFound: string;
  cardNotFound: string;
  cardId: string;
  memberId: string;
  memberTier: string;
  enterAmount: string;
  cashback: string;
  points: string;
  pointsUnit: string;
  pointsEarned: string;
  customerPays: string;
  rewardCredits: string;
  rewardCreditsDescription: string;
  doNotUseCredits: string;
  useRewardCredits: string;
  creditBalance: string;
  merchantLimit: string;
  maxRedeem: string;
  creditsUsed: string;
  disabled: string;
  selectPaymentMethod: string;
  cash: string;
  duitNow: string;
  tng: string;
  bank: string;
  card: string;
  paymentSummary: string;
  originalAmount: string;
  paymentMethod: string;
  recording: string;
  paymentReceived: string;
  paymentRecorded: string;
  receipt: string;
  noReceipt: string;
  uploadReceipt: string;
  uploading: string;
  viewReceipt: string;
  collectAnotherPayment: string;
  backToDashboard: string;
  merchantNotFound: string;
  scanOrTapFirst: string;
  enterValidAmount: string;
  paymentFailed: string;
  transactionIdMissing: string;
  receiptUploaded: string;
  uploadFailed: string;
  silver: string;
  gold: string;
  platinum: string;
};

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations: Record<LanguageCode, Translation> = {
  en: {
    collectPayment: "Collect Payment",
    merchant: "Merchant",
    identifyMember: "1. Identify Member",
    identifyMemberDescription: "Scan member QR or tap member card.",
    scanMemberQr: "Scan Member QR",
    tapMemberCard: "Tap Member Card",
    cardStatus: "Card Status",
    tapMemberCardToStart: "Tap Member Card to start",
    clickCardBox: "Click Card ID box, then let customer tap card",
    qrScanned: "QR scanned. Searching member...",
    searchingMember: "Searching member...",
    memberFound: "Member Found",
    cardNotFound: "Card ID not found",
    cardId: "CARD ID",
    memberId: "Member ID",
    memberTier: "Member Tier",
    enterAmount: "2. Enter Amount",
    cashback: "Cashback",
    points: "Points",
    pointsUnit: "pts",
    pointsEarned: "Points Earned",
    customerPays: "Customer Pays",
    rewardCredits: "3. Reward Credits",
    rewardCreditsDescription:
      "Reward Credits are redemption credits. Payment method remains separate.",
    doNotUseCredits: "Do Not Use Credits",
    useRewardCredits: "Use Reward Credits",
    creditBalance: "Credit Balance",
    merchantLimit: "Merchant Limit",
    maxRedeem: "Max Redeem",
    creditsUsed: "Credits Used",
    disabled: "Disabled",
    selectPaymentMethod: "4. Select Payment Method",
    cash: "Cash",
    duitNow: "DuitNow",
    tng: "TNG eWallet",
    bank: "Bank Transfer",
    card: "Credit / Debit Card",
    paymentSummary: "Payment Summary",
    originalAmount: "Original Amount",
    paymentMethod: "Payment Method",
    recording: "Recording...",
    paymentReceived: "Payment Received",
    paymentRecorded: "Payment Recorded",
    receipt: "Receipt",
    noReceipt: "No receipt uploaded",
    uploadReceipt: "Upload Receipt",
    uploading: "Uploading...",
    viewReceipt: "View Receipt",
    collectAnotherPayment: "Collect Another Payment",
    backToDashboard: "Back to Dashboard",
    merchantNotFound: "Merchant not found",
    scanOrTapFirst: "Please scan QR or tap card first",
    enterValidAmount: "Please enter a valid amount",
    paymentFailed: "Payment failed",
    transactionIdMissing: "Transaction ID missing",
    receiptUploaded: "Receipt uploaded successfully",
    uploadFailed: "Upload failed",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
  },
  zh: {
    collectPayment: "收款",
    merchant: "商家",
    identifyMember: "1. 识别会员",
    identifyMemberDescription: "扫描会员二维码或感应会员卡。",
    scanMemberQr: "扫描会员二维码",
    tapMemberCard: "感应会员卡",
    cardStatus: "卡片状态",
    tapMemberCardToStart: "请感应会员卡开始",
    clickCardBox: "点击卡号输入框，然后让会员感应会员卡",
    qrScanned: "二维码已扫描，正在查找会员...",
    searchingMember: "正在查找会员...",
    memberFound: "找到会员",
    cardNotFound: "找不到此会员卡",
    cardId: "会员卡编号",
    memberId: "会员编号",
    memberTier: "会员等级",
    enterAmount: "2. 输入金额",
    cashback: "返现",
    points: "积分",
    pointsUnit: "分",
    pointsEarned: "获得积分",
    customerPays: "顾客需支付",
    rewardCredits: "3. 奖励金",
    rewardCreditsDescription: "奖励金用于消费抵扣，不属于付款方式。",
    doNotUseCredits: "不使用奖励金",
    useRewardCredits: "使用奖励金",
    creditBalance: "奖励金余额",
    merchantLimit: "商家抵扣上限",
    maxRedeem: "最高可抵扣",
    creditsUsed: "已使用奖励金",
    disabled: "未启用",
    selectPaymentMethod: "4. 选择付款方式",
    cash: "现金",
    duitNow: "DuitNow",
    tng: "Touch 'n Go",
    bank: "银行转账",
    card: "银行卡",
    paymentSummary: "付款摘要",
    originalAmount: "原始金额",
    paymentMethod: "付款方式",
    recording: "处理中...",
    paymentReceived: "确认收款",
    paymentRecorded: "付款已记录",
    receipt: "收据",
    noReceipt: "尚未上传收据",
    uploadReceipt: "上传收据",
    uploading: "上传中...",
    viewReceipt: "查看收据",
    collectAnotherPayment: "继续收款",
    backToDashboard: "返回主页",
    merchantNotFound: "找不到商家资料",
    scanOrTapFirst: "请先扫描二维码或感应会员卡",
    enterValidAmount: "请输入有效金额",
    paymentFailed: "付款记录失败",
    transactionIdMissing: "缺少交易编号",
    receiptUploaded: "收据上传成功",
    uploadFailed: "上传失败",
    silver: "银级",
    gold: "金级",
    platinum: "白金级",
  },
  ms: {
    collectPayment: "Terima Bayaran",
    merchant: "Pedagang",
    identifyMember: "1. Kenal Pasti Ahli",
    identifyMemberDescription: "Imbas kod QR ahli atau sentuh kad ahli.",
    scanMemberQr: "Imbas Kod QR Ahli",
    tapMemberCard: "Sentuh Kad Ahli",
    cardStatus: "Status Kad",
    tapMemberCardToStart: "Sentuh kad ahli untuk bermula",
    clickCardBox: "Klik kotak ID Kad, kemudian minta pelanggan sentuh kad",
    qrScanned: "Kod QR diimbas. Sedang mencari ahli...",
    searchingMember: "Sedang mencari ahli...",
    memberFound: "Ahli Dijumpai",
    cardNotFound: "ID Kad tidak dijumpai",
    cardId: "ID KAD",
    memberId: "ID Ahli",
    memberTier: "Tahap Ahli",
    enterAmount: "2. Masukkan Amaun",
    cashback: "Pulangan Tunai",
    points: "Mata Ganjaran",
    pointsUnit: "mata",
    pointsEarned: "Mata Diperoleh",
    customerPays: "Pelanggan Bayar",
    rewardCredits: "3. Kredit Ganjaran",
    rewardCreditsDescription:
      "Kredit Ganjaran digunakan untuk penebusan dan bukan kaedah pembayaran.",
    doNotUseCredits: "Jangan Guna Kredit",
    useRewardCredits: "Guna Kredit Ganjaran",
    creditBalance: "Baki Kredit",
    merchantLimit: "Had Pedagang",
    maxRedeem: "Maksimum Tebus",
    creditsUsed: "Kredit Digunakan",
    disabled: "Tidak Diaktifkan",
    selectPaymentMethod: "4. Pilih Kaedah Bayaran",
    cash: "Tunai",
    duitNow: "DuitNow",
    tng: "Touch 'n Go",
    bank: "Pindahan Bank",
    card: "Kad Kredit / Debit",
    paymentSummary: "Ringkasan Bayaran",
    originalAmount: "Amaun Asal",
    paymentMethod: "Kaedah Bayaran",
    recording: "Sedang Merekod...",
    paymentReceived: "Bayaran Diterima",
    paymentRecorded: "Bayaran Direkodkan",
    receipt: "Resit",
    noReceipt: "Tiada resit dimuat naik",
    uploadReceipt: "Muat Naik Resit",
    uploading: "Sedang Memuat Naik...",
    viewReceipt: "Lihat Resit",
    collectAnotherPayment: "Terima Bayaran Lagi",
    backToDashboard: "Kembali ke Dashboard",
    merchantNotFound: "Pedagang tidak dijumpai",
    scanOrTapFirst: "Sila imbas kod QR atau sentuh kad terlebih dahulu",
    enterValidAmount: "Sila masukkan amaun yang sah",
    paymentFailed: "Bayaran gagal direkodkan",
    transactionIdMissing: "ID transaksi tiada",
    receiptUploaded: "Resit berjaya dimuat naik",
    uploadFailed: "Muat naik gagal",
    silver: "Perak",
    gold: "Emas",
    platinum: "Platinum",
  },
};

function getStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "zh" || stored === "ms" || stored === "en" ? stored : "en";
}

function unwrapResponse(result: any): any {
  return result?.data?.data || result?.data || result?.result || result;
}

export default function MerchantCollectPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [merchant, setMerchant] = useState<any>(null);
  const [marketing, setMarketing] = useState<any>(null);
  const [cardId, setCardId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberTier, setMemberTier] = useState("");
  const [rewardCreditBalance, setRewardCreditBalance] = useState(0);
  const [showCardInput, setShowCardInput] = useState(false);
  const [cardStatusKey, setCardStatusKey] =
    useState<CardStatusKey>("tapMemberCardToStart");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [useRewardCredits, setUseRewardCredits] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const t = translations[language];

  useEffect(() => {
    setLanguage(getStoredLanguage());

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: LanguageCode }>;
      const nextLanguage = customEvent.detail?.language;

      if (nextLanguage === "en" || nextLanguage === "zh" || nextLanguage === "ms") {
        setLanguage(nextLanguage);
      } else {
        setLanguage(getStoredLanguage());
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === LANGUAGE_STORAGE_KEY) {
        setLanguage(getStoredLanguage());
      }
    }

    window.addEventListener("rewardhub-language-change", handleLanguageChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("rewardhub-language-change", handleLanguageChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    async function loadMerchant() {
      let stored: any = {};

      try {
        stored = JSON.parse(localStorage.getItem("merchant") || "{}");
      } catch {
        stored = {};
      }

      const storedMerchant = stored?.merchant ?? stored?.data ?? stored;
      const storedMerchantId =
        storedMerchant?.merchantId ||
        storedMerchant?.MERCHANT_ID ||
        storedMerchant?.id ||
        "";

      if (!storedMerchantId) return;

      try {
        const [merchantRes, marketingRes] = await Promise.all([
          getMerchantDetail(storedMerchantId),
          getMerchantMarketingSummary(storedMerchantId),
        ]);

        setMerchant(unwrapResponse(merchantRes));
        setMarketing(unwrapResponse(marketingRes));
      } catch (error) {
        console.error("Unable to load merchant collect data:", error);
      }
    }

    void loadMerchant();
  }, []);

  useEffect(() => {
    const scannedCardId = localStorage.getItem("scannedCardId");
    if (!scannedCardId) return;

    localStorage.removeItem("scannedCardId");
    setCardId(scannedCardId);
    setShowCardInput(true);
    setCardStatusKey("qrScanned");
  }, []);

  useEffect(() => {
    if (!cardId || cardId.length < 4) return;

    const timer = window.setTimeout(async () => {
      try {
        setCardStatusKey("searchingMember");

        const res = await getMemberByCardId(cardId);
        const data = unwrapResponse(res);

        setMemberId(String(data?.memberId || data?.MEMBER_ID || ""));
        setMemberTier(String(data?.tier || data?.memberTier || data?.TIER || ""));
        setRewardCreditBalance(
          Number(
            data?.rewardCreditBalance ||
              data?.rewardCredits ||
              data?.availableRewardCredits ||
              data?.AVAILABLE_COMMISSION ||
              0
          )
        );
        setCardStatusKey("memberFound");
      } catch {
        setMemberId("");
        setMemberTier("");
        setRewardCreditBalance(0);
        setUseRewardCredits(false);
        setCardStatusKey("cardNotFound");
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [cardId]);

  const merchantId =
    merchant?.merchantId || merchant?.MERCHANT_ID || merchant?.id || "-";

  const merchantName =
    merchant?.displayName ||
    merchant?.businessName ||
    merchant?.DISPLAY_NAME ||
    merchant?.BUSINESS_NAME ||
    t.merchant;

  const originalAmount = Number(amount || 0);

  const memberTierRate =
    memberTier.toLowerCase() === "platinum"
      ? 0.3
      : memberTier.toLowerCase() === "gold"
        ? 0.2
        : 0.1;

  const marketingBudget = Number(marketing?.currentBudget || 0);
  const acceptRewardCredits =
    marketing?.rewardCredits?.acceptRewardCredits === true;
  const redemptionLimit = Number(
    marketing?.rewardCredits?.redemptionLimit || 30
  );

  const cashbackPercent = marketingBudget * memberTierRate;
  const cashback = Number(
    (originalAmount * (cashbackPercent / 100)).toFixed(2)
  );
  const points = Math.floor(originalAmount);

  const maxRewardCreditsByLimit = Number(
    ((originalAmount * redemptionLimit) / 100).toFixed(2)
  );

  const rewardCreditsUsed =
    acceptRewardCredits && useRewardCredits
      ? Number(
          Math.min(
            rewardCreditBalance,
            maxRewardCreditsByLimit,
            Math.max(originalAmount - cashback, 0)
          ).toFixed(2)
        )
      : 0;

  const customerPays = Number(
    Math.max(originalAmount - cashback - rewardCreditsUsed, 0).toFixed(2)
  );

  const paymentMethods = useMemo(
    () => [
      { value: "Cash" as const, icon: "💵", label: t.cash },
      { value: "DuitNow" as const, icon: "🏦", label: t.duitNow },
      { value: "TNG" as const, icon: "📱", label: t.tng },
      { value: "Bank" as const, icon: "🏧", label: t.bank },
      { value: "Card" as const, icon: "💳", label: t.card },
    ],
    [t]
  );

  const paymentMethodLabel =
    paymentMethods.find((item) => item.value === paymentMethod)?.label ||
    paymentMethod;

  const translatedMemberTier = (() => {
    switch (memberTier.toLowerCase()) {
      case "silver":
        return t.silver;
      case "gold":
        return t.gold;
      case "platinum":
        return t.platinum;
      default:
        return memberTier || "-";
    }
  })();

  function startCardTap() {
    setShowCardInput(true);
    setCardId("");
    setMemberId("");
    setMemberTier("");
    setRewardCreditBalance(0);
    setUseRewardCredits(false);
    setCardStatusKey("clickCardBox");
  }

  async function handlePaymentDone() {
    if (!merchantId || merchantId === "-") {
      alert(t.merchantNotFound);
      return;
    }

    if (!memberId) {
      alert(t.scanOrTapFirst);
      return;
    }

    if (!amount || !Number.isFinite(originalAmount) || originalAmount <= 0) {
      alert(t.enterValidAmount);
      return;
    }

    try {
      setLoading(true);

      const res = await merchantPayment({
        memberId,
        merchantId,
        amount: originalAmount,
        paymentMethod,
        cardId,
        rewardCreditsUsed,
      });

      setResult(unwrapResponse(res));
    } catch (error: any) {
      alert(error?.message || t.paymentFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadPaymentReceipt(file: File) {
    if (!result?.transactionId) {
      alert(t.transactionIdMissing);
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      alert(t.uploadFailed);
    };

    reader.onload = async () => {
      setUploadingReceipt(true);

      try {
        const base64 = String(reader.result || "").split(",")[1];
        if (!base64) throw new Error(t.uploadFailed);

        const res = await uploadTransactionReceipt({
          transactionId: result.transactionId,
          base64,
        });

        const receiptData = unwrapResponse(res);
        const receiptUrl = receiptData?.receiptUrl || "";

        setResult((old: any) => ({
          ...old,
          receiptUrl,
        }));

        alert(t.receiptUploaded);
      } catch (error: any) {
        alert(error?.message || t.uploadFailed);
      } finally {
        setUploadingReceipt(false);
      }
    };

    reader.readAsDataURL(file);
  }

  function resetPayment() {
    setCardId("");
    setMemberId("");
    setMemberTier("");
    setRewardCreditBalance(0);
    setAmount("");
    setPaymentMethod("Cash");
    setUseRewardCredits(false);
    setShowCardInput(false);
    setCardStatusKey("tapMemberCardToStart");
    setResult(null);
  }

  if (result) {
    const finalCustomerPays = Number(
      result.customerPays ?? result.payAmount ?? customerPays
    ).toFixed(2);

    return (
      <>
        <MerchantNav />

        <main className="min-h-screen bg-slate-50 px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
          <section className="mx-auto max-w-xl">
            <div className="rounded-[1.75rem] bg-emerald-50 p-5 shadow-sm sm:rounded-[2rem] sm:p-8">
              <p className="text-sm font-black text-emerald-700">
                {t.paymentRecorded}
              </p>

              <h1 className="mt-3 text-3xl font-black text-emerald-950 sm:text-4xl">
                RM{finalCustomerPays}
              </h1>

              <div className="mt-5 space-y-2 text-xs font-bold text-emerald-800 sm:mt-6 sm:space-y-3 sm:text-sm">
                <p>
                  {t.merchant}: {merchantName}
                </p>
                <p>
                  {t.memberId}: {memberId}
                </p>
                <p>
                  {t.paymentMethod}: {paymentMethodLabel}
                </p>
                <p>
                  {t.originalAmount}: RM{originalAmount.toFixed(2)}
                </p>
                <p>
                  {t.cashback}: RM{cashback.toFixed(2)}
                </p>
                <p>
                  {t.creditsUsed}: RM{rewardCreditsUsed.toFixed(2)}
                </p>
                <p>
                  {t.customerPays}: RM{customerPays.toFixed(2)}
                </p>
                <p>
                  {t.pointsEarned}: {points} {t.pointsUnit}
                </p>
              </div>

              <div className="mt-6 rounded-2xl bg-white p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 sm:text-xs">
                  {t.receipt}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {result.receiptUrl ? (
                    <a
                      href={result.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black text-blue-600 no-underline"
                    >
                      {t.viewReceipt}
                    </a>
                  ) : (
                    <span className="text-sm font-bold text-slate-400">
                      {t.noReceipt}
                    </span>
                  )}

                  <label
                    className={`rounded-xl px-4 py-3 text-xs font-black text-white ${
                      uploadingReceipt
                        ? "cursor-not-allowed bg-slate-400"
                        : "cursor-pointer bg-slate-950"
                    }`}
                  >
                    {uploadingReceipt ? t.uploading : t.uploadReceipt}

                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploadingReceipt}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        void handleUploadPaymentReceipt(file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={resetPayment}
                className="mt-6 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white sm:mt-8 sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                {t.collectAnotherPayment}
              </button>

              <Link
                href="/merchant/dashboard"
                className="mt-3 block rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-black text-slate-950 no-underline sm:mt-4 sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                {t.backToDashboard}
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-slate-50 px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-6xl">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 sm:text-xs">
              {t.collectPayment}
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-950 sm:text-4xl md:text-5xl">
              {merchantName}
            </h1>

            <p className="mt-2 text-[11px] font-bold text-slate-500 sm:text-sm">
              {merchantId}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                {t.identifyMember}
              </h2>

              <p className="mt-2 text-[11px] font-bold text-slate-500 sm:text-sm">
                {t.identifyMemberDescription}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/merchant/scan")}
                  className="rounded-xl bg-slate-950 py-3 text-xs font-black text-white sm:rounded-2xl sm:py-5 sm:text-sm"
                >
                  {t.scanMemberQr}
                </button>

                <button
                  type="button"
                  onClick={startCardTap}
                  className="rounded-xl border border-slate-200 bg-white py-3 text-xs font-black text-slate-950 sm:rounded-2xl sm:py-5 sm:text-sm"
                >
                  {t.tapMemberCard}
                </button>
              </div>

              <p className="mt-4 text-[11px] font-bold text-slate-500 sm:text-sm">
                {t.cardStatus}: {t[cardStatusKey]}
              </p>

              {showCardInput && !memberId ? (
                <input
                  value={cardId}
                  onChange={(event) => setCardId(event.target.value.trim())}
                  className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base font-black outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-lg"
                  placeholder={t.cardId}
                  autoFocus
                />
              ) : null}

              {memberId ? (
                <div className="mt-5 rounded-xl bg-emerald-50 p-4 sm:rounded-2xl sm:p-5">
                  <p className="text-sm font-black text-emerald-700">
                    {t.memberFound}
                  </p>

                  <p className="mt-2 text-sm font-black text-emerald-700">
                    {t.memberId}
                  </p>

                  <p className="mt-1 text-xl font-black text-emerald-950 sm:text-2xl">
                    {memberId}
                  </p>

                  <p className="mt-3 text-sm font-black text-emerald-700">
                    {t.memberTier}
                  </p>

                  <p className="mt-1 text-base font-black text-emerald-900 sm:text-lg">
                    {translatedMemberTier}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                {t.enterAmount}
              </h2>

              <input
                value={amount}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (/^\d*(\.\d{0,2})?$/.test(nextValue)) {
                    setAmount(nextValue);
                  }
                }}
                inputMode="decimal"
                className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-4 text-3xl font-black outline-none sm:rounded-2xl sm:px-5 sm:py-5 sm:text-5xl"
                placeholder="RM0.00"
              />

              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                {[10, 20, 50, 100, 200, 500].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(String(quickAmount))}
                    className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-950 hover:text-white sm:rounded-2xl sm:py-3 sm:text-sm"
                  >
                    RM{quickAmount}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
                <Summary title={t.cashback} value={`RM${cashback.toFixed(2)}`} />
                <Summary title={t.points} value={`${points} ${t.pointsUnit}`} />
                <Summary
                  title={t.customerPays}
                  value={`RM${customerPays.toFixed(2)}`}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              {t.rewardCredits}
            </h2>

            <p className="mt-2 text-[11px] font-bold text-slate-500 sm:text-sm">
              {t.rewardCreditsDescription}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                disabled={!acceptRewardCredits || !memberId}
                onClick={() => setUseRewardCredits(false)}
                className={`rounded-xl border py-3 text-xs font-black sm:rounded-2xl sm:py-5 sm:text-sm ${
                  !useRewardCredits
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-950"
                } disabled:opacity-40`}
              >
                {t.doNotUseCredits}
              </button>

              <button
                type="button"
                disabled={
                  !acceptRewardCredits || !memberId || rewardCreditBalance <= 0
                }
                onClick={() => setUseRewardCredits(true)}
                className={`rounded-xl border py-3 text-xs font-black sm:rounded-2xl sm:py-5 sm:text-sm ${
                  useRewardCredits
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-950"
                } disabled:opacity-40`}
              >
                {t.useRewardCredits}
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Summary
                title={t.creditBalance}
                value={`RM${rewardCreditBalance.toFixed(2)}`}
              />
              <Summary
                title={t.merchantLimit}
                value={acceptRewardCredits ? `${redemptionLimit}%` : t.disabled}
              />
              <Summary
                title={t.maxRedeem}
                value={`RM${maxRewardCreditsByLimit.toFixed(2)}`}
              />
              <Summary
                title={t.creditsUsed}
                value={`RM${rewardCreditsUsed.toFixed(2)}`}
              />
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              {t.selectPaymentMethod}
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`rounded-xl border py-3 text-xs font-black sm:rounded-2xl sm:py-5 sm:text-sm ${
                    paymentMethod === method.value
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-950"
                  }`}
                >
                  <div className="text-lg sm:text-2xl">{method.icon}</div>
                  <div className="mt-1 text-[10px] sm:mt-2 sm:text-sm">
                    {method.label}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-slate-950 p-4 text-white sm:rounded-[2rem] sm:p-6">
              <p className="text-sm font-black text-slate-400">
                {t.paymentSummary}
              </p>

              <div className="mt-4 space-y-3 text-sm font-bold">
                <SummaryLine
                  label={t.originalAmount}
                  value={`RM${originalAmount.toFixed(2)}`}
                />
                <SummaryLine
                  label={t.cashback}
                  value={`-RM${cashback.toFixed(2)}`}
                />
                <SummaryLine
                  label={t.rewardCredits.replace(/^3\.\s*/, "")}
                  value={`-RM${rewardCreditsUsed.toFixed(2)}`}
                />
                <SummaryLine
                  label={t.customerPays}
                  value={`RM${customerPays.toFixed(2)}`}
                  highlight
                />
                <SummaryLine
                  label={t.paymentMethod}
                  value={paymentMethodLabel}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handlePaymentDone()}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white disabled:opacity-50 sm:rounded-2xl sm:py-5 sm:text-sm"
            >
              {loading ? t.recording : t.paymentReceived}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

function Summary({ title, value }: { title: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-5">
      <p className="truncate text-[9px] font-black text-slate-400 sm:text-xs">
        {title}
      </p>
      <p className="mt-1 break-words text-sm font-black leading-tight text-slate-950 sm:mt-2 sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={`text-xs font-bold sm:text-sm ${
          highlight ? "text-amber-300" : "text-slate-300"
        }`}
      >
        {label}
      </span>
      <span
        className={`shrink-0 text-right font-black ${
          highlight
            ? "text-lg text-amber-300 sm:text-xl"
            : "text-sm text-white sm:text-base"
        }`}
      >
        {value}
      </span>
    </div>
  );
}