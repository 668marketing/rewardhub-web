"use client";

import { useEffect, useState } from "react";
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

export default function MerchantCollectPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<any>(null);
  const [marketing, setMarketing] = useState<any>(null);
  const [cardId, setCardId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberTier, setMemberTier] = useState("");
  const [rewardCreditBalance, setRewardCreditBalance] = useState(0);
  const [showCardInput, setShowCardInput] = useState(false);
  const [cardStatus, setCardStatus] = useState("Tap Member Card to start");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [useRewardCredits, setUseRewardCredits] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  useEffect(() => {
    async function loadMerchant() {
      const stored = JSON.parse(localStorage.getItem("merchant") || "{}");
      if (!stored.merchantId) return;

      try {
        const res = await getMerchantDetail(stored.merchantId);
        const data = res.data?.data || res.data || res.result || res;
        setMerchant(data);
        const marketingRes = await getMerchantMarketingSummary(stored.merchantId);

const marketingData =
  marketingRes.data?.data ||
  marketingRes.data ||
  marketingRes.result ||
  marketingRes;

setMarketing(marketingData);
      } catch (e) {
        console.error(e);
      }
    }

    loadMerchant();
  }, []);

  useEffect(() => {
    const scannedCardId = localStorage.getItem("scannedCardId");

    if (!scannedCardId) return;

    localStorage.removeItem("scannedCardId");

    setCardId(scannedCardId);
    setShowCardInput(true);
    setCardStatus("QR scanned. Searching member...");
  }, []);

  useEffect(() => {
    if (!cardId || cardId.length < 4) return;

    const timer = setTimeout(async () => {
      try {
        setCardStatus("Searching member...");

        const res = await getMemberByCardId(cardId);
        const data = res.data?.data || res.data || res.result || res;

        setMemberId(data.memberId);
        setMemberTier(data.tier || data.memberTier || "");
        setRewardCreditBalance(
          Number(
            data.rewardCreditBalance ||
              data.rewardCredits ||
              data.availableRewardCredits ||
              0
          )
        );

        setCardStatus("Member found");
      } catch (err) {
        setMemberId("");
        setMemberTier("");
        setRewardCreditBalance(0);
        setCardStatus("Card ID not found");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cardId]);

  const merchantId = merchant?.merchantId || merchant?.MERCHANT_ID || "-";
  const merchantName =
    merchant?.displayName ||
    merchant?.businessName ||
    merchant?.DISPLAY_NAME ||
    merchant?.BUSINESS_NAME ||
    "Merchant";

  const originalAmount = Number(amount || 0);

  const memberTierRate =
    memberTier === "Platinum" ? 0.3 : memberTier === "Gold" ? 0.2 : 0.1;

  const marketingBudget = Number(
  marketing?.currentBudget || 0
);

  const acceptRewardCredits =
  marketing?.rewardCredits?.acceptRewardCredits === true;

  const redemptionLimit = Number(
  marketing?.rewardCredits?.redemptionLimit || 30
);

  const cashbackPercent = marketingBudget * memberTierRate;
  const cashback = Number((originalAmount * (cashbackPercent / 100)).toFixed(2));
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
            originalAmount
          ).toFixed(2)
        )
      : 0;

  const customerPays = Number(
    Math.max(originalAmount - cashback - rewardCreditsUsed, 0).toFixed(2)
  );

  function startCardTap() {
    setShowCardInput(true);
    setCardId("");
    setMemberId("");
    setMemberTier("");
    setRewardCreditBalance(0);
    setUseRewardCredits(false);
    setCardStatus("Click Card ID box, then let customer tap card");
  }

  async function handlePaymentDone() {
    if (!merchantId || merchantId === "-") return alert("Merchant not found");
    if (!memberId) return alert("Please scan QR or tap card first");
    if (!amount || originalAmount <= 0) return alert("Please enter amount");

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

      setResult(res.data?.data || res.data || res.result || res);
    } catch (err: any) {
      alert(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadPaymentReceipt(file: File) {
  if (!result?.transactionId) return alert("Transaction ID missing");

  const reader = new FileReader();

  reader.onload = async () => {
  setUploadingReceipt(true);   // ← 放这里（开始上传）

  try {
    const base64 = String(reader.result).split(",")[1];

    const res = await uploadTransactionReceipt({
      transactionId: result.transactionId,
      base64,
    });

    const receiptUrl =
      res?.data?.data?.receiptUrl ||
      res?.data?.receiptUrl;

    setResult((old: any) => ({
      ...old,
      receiptUrl,
    }));

    alert("Receipt uploaded successfully");

  } catch (err: any) {

    alert(err.message || "Upload failed");

  } finally {

    setUploadingReceipt(false);   // ← 放这里（成功或失败都会执行）

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
    setCardStatus("Tap Member Card to start");
    setResult(null);
  }

  if (result) {
    return (
      <>
        <MerchantNav />

        <main className="min-h-screen bg-slate-50 px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
          <section className="mx-auto max-w-xl">
            <div className="rounded-[1.75rem] bg-emerald-50 p-5 shadow-sm sm:rounded-[2rem] sm:p-8">
              <p className="text-sm font-black text-emerald-700">
                Payment Recorded
              </p>

              <h1 className="mt-3 text-3xl font-black text-emerald-950 sm:text-4xl">
                RM{Number(result.customerPays || result.payAmount || customerPays).toFixed(2)}
              </h1>

              <div className="mt-5 space-y-2 text-xs font-bold text-emerald-800 sm:mt-6 sm:space-y-3 sm:text-sm">
                <p>Merchant: {merchantName}</p>
                <p>Member ID: {memberId}</p>
                <p>Payment Method: {paymentMethod}</p>
                <p>Original Amount: RM{originalAmount.toFixed(2)}</p>
                <p>Cashback: RM{cashback.toFixed(2)}</p>
                <p>Reward Credits Used: RM{rewardCreditsUsed.toFixed(2)}</p>
                <p>Customer Pays: RM{customerPays.toFixed(2)}</p>
                <p>Points Earned: {points}</p>
              </div>

              <div className="mt-6 rounded-2xl bg-white p-5">
  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 sm:text-xs">Receipt</p >

  <div className="mt-3 flex items-center gap-3">
    {result.receiptUrl ? (
      <a
        href={result.receiptUrl}
        rel="noopener noreferrer"
        className="font-black text-blue-600 no-underline"
      >
        View Receipt
      </a >
    ) : (
      <span className="text-sm font-bold text-slate-400">No receipt uploaded</span>
    )}

    <label
  className={`rounded-xl px-4 py-3 text-xs font-black text-white ${
    uploadingReceipt
      ? "bg-slate-400 cursor-not-allowed"
      : "bg-slate-950 cursor-pointer"
  }`}
>
  {uploadingReceipt ? "Uploading..." : "Upload Receipt"}

  <input
    type="file"
    accept="image/*"
    hidden
    disabled={uploadingReceipt}
    onChange={(e) => {
      if (!e.target.files?.length) return;
      handleUploadPaymentReceipt(e.target.files[0]);
    }}
  />
</label>
  </div>
</div>

              <button
                onClick={resetPayment}
                className="mt-6 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white sm:mt-8 sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                Collect Another Payment
              </button>

              <Link
                href="/merchant/dashboard"
                className="mt-3 block rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-black text-slate-950 no-underline sm:mt-4 sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                Back to Dashboard
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
              Collect Payment
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
                1. Identify Member
              </h2>

              <p className="mt-2 text-[11px] font-bold text-slate-500 sm:text-sm">
                Scan member QR or tap member card.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/merchant/scan")}
                  className="rounded-xl bg-slate-950 py-3 text-xs font-black text-white sm:rounded-2xl sm:py-5 sm:text-sm"
                >
                  Scan Member QR
                </button>

                <button
                  type="button"
                  onClick={startCardTap}
                  className="rounded-xl border border-slate-200 bg-white py-3 text-xs font-black text-slate-950 sm:rounded-2xl sm:py-5 sm:text-sm"
                >
                  Tap Member Card
                </button>
              </div>

              <p className="mt-4 text-[11px] font-bold text-slate-500 sm:text-sm">
                Card Status: {cardStatus}
              </p>

              {showCardInput && !memberId && (
                <input
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value.trim())}
                  className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base font-black outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-lg"
                  placeholder="CARD ID"
                  autoFocus
                />
              )}

              {memberId && (
                <div className="mt-5 rounded-xl bg-emerald-50 p-4 sm:rounded-2xl sm:p-5">
                  <p className="text-sm font-black text-emerald-700">
                    Member Found
                  </p>

                  <p className="mt-2 text-sm font-black text-emerald-700">
                    Member ID
                  </p>

                  <p className="mt-1 text-xl font-black text-emerald-950 sm:text-2xl">
                    {memberId}
                  </p>

                  <p className="mt-3 text-sm font-black text-emerald-700">
                    Member Tier
                  </p>

                  <p className="mt-1 text-base font-black text-emerald-900 sm:text-lg">
                    {memberTier || "-"}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                2. Enter Amount
              </h2>

              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                <Summary title="Cashback" value={`RM${cashback.toFixed(2)}`} />
                <Summary title="Points" value={`${points} pts`} />
                <Summary
                  title="Customer Pays"
                  value={`RM${customerPays.toFixed(2)}`}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              3. Reward Credits
            </h2>

            <p className="mt-2 text-[11px] font-bold text-slate-500 sm:text-sm">
              Reward Credits are redemption credits. Payment method remains separate.
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
                Do Not Use Credits
              </button>

              <button
                type="button"
                disabled={!acceptRewardCredits || !memberId || rewardCreditBalance <= 0}
                onClick={() => setUseRewardCredits(true)}
                className={`rounded-xl border py-3 text-xs font-black sm:rounded-2xl sm:py-5 sm:text-sm ${
                  useRewardCredits
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-950"
                } disabled:opacity-40`}
              >
                Use Reward Credits
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Summary
                title="Credit Balance"
                value={`RM${rewardCreditBalance.toFixed(2)}`}
              />
              <Summary
                title="Merchant Limit"
                value={acceptRewardCredits ? `${redemptionLimit}%` : "Disabled"}
              />
              <Summary
                title="Max Redeem"
                value={`RM${maxRewardCreditsByLimit.toFixed(2)}`}
              />
              <Summary
                title="Credits Used"
                value={`RM${rewardCreditsUsed.toFixed(2)}`}
              />
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              4. Select Payment Method
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
              {[
                ["Cash", "💵"],
                ["DuitNow", "🏦"],
                ["TNG", "📱"],
                ["Bank", "🏧"],
                ["Card", "💳"],
              ].map(([method, icon]) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-xl border py-3 text-xs font-black sm:rounded-2xl sm:py-5 sm:text-sm ${
                    paymentMethod === method
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-950"
                  }`}
                >
                  <div className="text-lg sm:text-2xl">{icon}</div>
                  <div className="mt-1 text-[10px] sm:mt-2 sm:text-sm">{method}</div>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-slate-950 p-4 text-white sm:rounded-[2rem] sm:p-6">
              <p className="text-sm font-black text-slate-400">
                Payment Summary
              </p>

              <div className="mt-4 space-y-3 text-sm font-bold">
                <SummaryLine label="Original Amount" value={`RM${originalAmount.toFixed(2)}`} />
                <SummaryLine label="Cashback" value={`-RM${cashback.toFixed(2)}`} />
                <SummaryLine label="Reward Credits" value={`-RM${rewardCreditsUsed.toFixed(2)}`} />
                <SummaryLine label="Customer Pays" value={`RM${customerPays.toFixed(2)}`} highlight />
                <SummaryLine label="Payment Method" value={paymentMethod} />
              </div>
            </div>

            <button
              onClick={handlePaymentDone}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white disabled:opacity-50 sm:rounded-2xl sm:py-5 sm:text-sm"
            >
              {loading ? "Recording..." : "Payment Received"}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

function Summary({ title, value }: { title: string; value: any }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-5">
      <p className="truncate text-[9px] font-black text-slate-400 sm:text-xs">{title}</p>
      <p className="mt-1 break-words text-sm font-black leading-tight text-slate-950 sm:mt-2 sm:text-xl">{value}</p>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: any;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-xs font-bold sm:text-sm ${highlight ? "text-amber-300" : "text-slate-300"}`}>
        {label}
      </span>
      <span className={`shrink-0 font-black ${highlight ? "text-lg text-amber-300 sm:text-xl" : "text-sm text-white sm:text-base"}`}>
        {value}
      </span>
    </div>
  );
}