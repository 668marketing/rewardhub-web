"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MerchantNav from "@/components/layout/MerchantNav";
import { getMerchantDashboardSummary } from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

type Translation = {
  merchantDashboard: string;
  merchant: string;
  marketingBudget: string;
  boostActive: string;
  todaySales: string;
  cashbackGiven: string;
  transactions: string;
  marketingUsed: string;
  collectPayment: string;
  collectPaymentDescription: string;
  paymentMode: string;
  readyToCollect: string;
  automaticCalculation: string;
  openCollectPayment: string;
  paymentMethodsToday: string;
  cash: string;
  duitNow: string;
  tng: string;
  bankCard: string;
  viewTransactions: string;
  latestTransactions: string;
  recentCustomerPayments: string;
  viewAll: string;
  member: string;
  payment: string;
  cashback: string;
  noTransactions: string;
  onlineOrders: string;
  pendingPayment: string;
  paymentReview: string;
  preparing: string;
  readyDelivery: string;
  outDelivery: string;
  readyPickup: string;
  completedToday: string;
  attention: string;
  totalToday: string;
  autoRefresh: string;
};

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations: Record<LanguageCode, Translation> = {
  en: {
    merchantDashboard: "Merchant Dashboard",
    merchant: "Merchant",
    marketingBudget: "Marketing Budget",
    boostActive: "Boost Active",
    todaySales: "Today Sales",
    cashbackGiven: "Cashback Given",
    transactions: "Transactions",
    marketingUsed: "Marketing Used",
    collectPayment: "Collect Payment",
    collectPaymentDescription:
      "Scan member QR or tap member card to collect payment instantly.",
    paymentMode: "Payment Mode",
    readyToCollect: "Ready to Collect",
    automaticCalculation:
      "Cashback and points will be calculated automatically.",
    openCollectPayment: "Open Collect Payment",
    paymentMethodsToday: "Payment Methods Today",
    cash: "Cash",
    duitNow: "DuitNow",
    tng: "TNG",
    bankCard: "Bank / Card",
    viewTransactions: "View Transactions",
    latestTransactions: "Latest Transactions",
    recentCustomerPayments: "Recent customer payments from your store.",
    viewAll: "View All",
    member: "Member",
    payment: "Payment",
    cashback: "Cashback",
    noTransactions: "No transactions yet.",
    onlineOrders:"Today's Orders",
    pendingPayment:"Pending Payment",
    paymentReview:"Payment Review",
    preparing:"Preparing",
    readyDelivery:"Ready for Delivery",
    outDelivery:"Out for Delivery",
    readyPickup:"Ready for Pickup",
    completedToday:"Completed Today",
    attention:"Attention Required",
    totalToday:"Orders Today",
    autoRefresh:"Auto refresh",
  },
  zh: {
    merchantDashboard: "商家主页",
    merchant: "商家",
    marketingBudget: "营销预算",
    boostActive: "加码活动进行中",
    todaySales: "今日销售额",
    cashbackGiven: "已发放返现",
    transactions: "交易笔数",
    marketingUsed: "已使用营销金额",
    collectPayment: "收款",
    collectPaymentDescription:
      "扫描会员二维码或感应会员卡，即可立即收款。",
    paymentMode: "收款模式",
    readyToCollect: "准备收款",
    automaticCalculation: "系统将自动计算返现和积分。",
    openCollectPayment: "打开收款页面",
    paymentMethodsToday: "今日付款方式",
    cash: "现金",
    duitNow: "DuitNow",
    tng: "Touch 'n Go",
    bankCard: "银行转账 / 银行卡",
    viewTransactions: "查看交易记录",
    latestTransactions: "最新交易",
    recentCustomerPayments: "查看店铺最近收到的顾客付款。",
    viewAll: "查看全部",
    member: "会员",
    payment: "付款",
    cashback: "返现",
    noTransactions: "目前还没有交易记录。",
    onlineOrders:"今日订单",
    pendingPayment:"待付款",
    paymentReview:"付款审核",
    preparing:"准备中",
    readyDelivery:"待配送",
    outDelivery:"配送中",
    readyPickup:"待自取",
    completedToday:"今日完成",
    attention:"需处理",
    totalToday:"今日订单数",
    autoRefresh:"自动刷新",
  },
  ms: {
    merchantDashboard: "Dashboard Pedagang",
    merchant: "Pedagang",
    marketingBudget: "Bajet Pemasaran",
    boostActive: "Boost Aktif",
    todaySales: "Jualan Hari Ini",
    cashbackGiven: "Pulangan Tunai Diberi",
    transactions: "Transaksi",
    marketingUsed: "Pemasaran Digunakan",
    collectPayment: "Terima Bayaran",
    collectPaymentDescription:
      "Imbas kod QR ahli atau sentuh kad ahli untuk menerima bayaran serta-merta.",
    paymentMode: "Mod Bayaran",
    readyToCollect: "Sedia Menerima Bayaran",
    automaticCalculation:
      "Pulangan tunai dan mata ganjaran akan dikira secara automatik.",
    openCollectPayment: "Buka Halaman Bayaran",
    paymentMethodsToday: "Kaedah Bayaran Hari Ini",
    cash: "Tunai",
    duitNow: "DuitNow",
    tng: "Touch 'n Go",
    bankCard: "Bank / Kad",
    viewTransactions: "Lihat Transaksi",
    latestTransactions: "Transaksi Terkini",
    recentCustomerPayments: "Bayaran pelanggan terkini daripada kedai anda.",
    viewAll: "Lihat Semua",
    member: "Ahli",
    payment: "Bayaran",
    cashback: "Pulangan Tunai",
    noTransactions: "Belum ada transaksi.",
    onlineOrders:"Pesanan Hari Ini",
    pendingPayment:"Belum Bayar",
    paymentReview:"Semakan Bayaran",
    preparing:"Sedang Disediakan",
    readyDelivery:"Sedia Dihantar",
    outDelivery:"Dalam Penghantaran",
    readyPickup:"Sedia Diambil",
    completedToday:"Selesai Hari Ini",
    attention:"Perlu Tindakan",
    totalToday:"Pesanan Hari Ini",
    autoRefresh:"Muat semula automatik",
  },
};

function normalizeLanguage(value: string | null): LanguageCode {
  if (value === "zh" || value === "ms") return value;
  return "en";
}

export default function MerchantDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<LanguageCode>("en");

  const t = useMemo(() => translations[language], [language]);

  function getApiData(res: any) {
    let nextData = res;

    while (nextData?.data && !nextData?.merchant && !nextData?.today) {
      nextData = nextData.data;
    }

    return nextData;
  }

  useEffect(() => {
    const storedLanguage = normalizeLanguage(
      window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    );

    setLanguage(storedLanguage);

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: string }>;
      const eventLanguage = customEvent.detail?.language;
      const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

      setLanguage(normalizeLanguage(eventLanguage || savedLanguage));
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
    let isMounted = true;
    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    async function loadDashboard(showLoading = false) {
      let stored: any = {};

      try {
        stored = JSON.parse(localStorage.getItem("merchant") || "{}");
      } catch {
        stored = {};
      }

      const merchantId = stored?.merchantId || stored?.MERCHANT_ID || "";

      if (!merchantId) {
        if (isMounted) setLoading(false);
        return;
      }

      if (showLoading && isMounted) {
        setLoading(true);
      }

      try {
        const res = await getMerchantDashboardSummary(merchantId);

        if (isMounted) {
          setData(getApiData(res));
        }
      } catch (err) {
        console.error("Unable to load merchant dashboard:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard(true);

    refreshTimer = setInterval(() => {
      void loadDashboard(false);
    }, 30000);

    return () => {
      isMounted = false;

      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, []);

  const merchant = data?.merchant || {};
  const today = data?.today || {};
  const latest = [...(data?.latestTransactions || [])]
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const merchantName =
    merchant?.displayName ||
    merchant?.businessName ||
    data?.displayName ||
    data?.businessName ||
    t.merchant;

  const merchantId = merchant?.merchantId || "-";

  const onlineOrders = data?.onlineOrders || {};


  const activeBudget = Number(
    data?.marketing?.currentBudget || merchant?.marketingBudget || 0
  );

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300 sm:text-xs">
                  {t.merchantDashboard}
                </p>

                <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
                  {merchantName}
                </h1>

                <p className="mt-2 text-[11px] font-bold text-slate-400 sm:text-sm">
                  {merchantId}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                  <Badge text={`${t.marketingBudget}: ${activeBudget}%`} />

                  {data?.marketing?.boost?.active ? (
                    <Badge
                      text={`${t.boostActive}: ${data.marketing.boost.boostBudget}%`}
                      green
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-4">
              <Stat title={t.todaySales} value={`RM${money(today.todaySales)}`} />
              <Stat
                title={t.cashbackGiven}
                value={`RM${money(today.cashbackGiven)}`}
              />
              <Stat title={t.transactions} value={today.transactionCount || 0} />
              <Stat
                title={t.marketingUsed}
                value={`RM${money(today.marketingUsed)}`}
              />
            </div>
          </div>


          <div className="mt-6 rounded-[1.75rem] bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {t.onlineOrders}
                </h2>
              </div>

              <div className="rounded-2xl bg-slate-950 px-5 py-3 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {t.totalToday}
                </p>
                <p className="mt-1 text-2xl font-black">
                  {onlineOrders.totalToday || 0}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <OrderStat
                href="/merchant/orders?status=PENDING_PAYMENT"
                title={t.pendingPayment}
                value={onlineOrders.pendingPayment || 0}
                tone="rose"
              />
              <OrderStat
                href="/merchant/orders?status=PAYMENT_REVIEW"
                title={t.paymentReview}
                value={onlineOrders.paymentReview || 0}
                tone="amber"
              />
              <OrderStat
                href="/merchant/orders?status=PROCESSING&fulfillment=PREPARING"
                title={t.preparing}
                value={onlineOrders.preparing || 0}
                tone="yellow"
              />
              <OrderStat
                href="/merchant/orders?fulfillment=READY_FOR_DELIVERY"
                title={t.readyDelivery}
                value={onlineOrders.readyForDelivery || 0}
                tone="sky"
              />
              <OrderStat
                href="/merchant/orders?fulfillment=OUT_FOR_DELIVERY"
                title={t.outDelivery}
                value={onlineOrders.outForDelivery || 0}
                tone="blue"
              />
              <OrderStat
                href="/merchant/orders?fulfillment=READY_FOR_PICKUP"
                title={t.readyPickup}
                value={onlineOrders.readyForPickup || 0}
                tone="violet"
              />
              <OrderStat
                href="/merchant/orders?status=COMPLETED"
                title={t.completedToday}
                value={onlineOrders.completedToday || 0}
                tone="emerald"
              />
              <OrderStat
                href="/merchant/orders"
                title={t.attention}
                value={onlineOrders.attentionRequired || 0}
                tone="slate"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-7">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                {t.collectPayment}
              </h2>

              <p className="mt-2 text-sm font-bold text-slate-500">
                {t.collectPaymentDescription}
              </p>

              <div className="mt-6 rounded-[1.5rem] bg-slate-950 p-4 text-white sm:rounded-[2rem] sm:p-7">
                <p className="text-sm font-black text-slate-400">
                  {t.paymentMode}
                </p>

                <h3 className="mt-3 text-2xl font-black sm:text-3xl">
                  {t.readyToCollect}
                </h3>

                <p className="mt-3 text-sm font-bold text-slate-300">
                  {t.automaticCalculation}
                </p>
              </div>

              <Link
                href="/merchant/collect"
                className="mt-6 block rounded-xl bg-slate-950 py-3 text-center text-xs font-black text-white no-underline sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                {t.openCollectPayment}
              </Link>
            </div>

            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-7">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                {t.paymentMethodsToday}
              </h2>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <MiniStat
                  title={t.cash}
                  value={`RM${money(today.paymentMethods?.Cash)}`}
                />
                <MiniStat
                  title={t.duitNow}
                  value={`RM${money(today.paymentMethods?.DuitNow)}`}
                />
                <MiniStat
                  title={t.tng}
                  value={`RM${money(today.paymentMethods?.TNG)}`}
                />
                <MiniStat
                  title={t.bankCard}
                  value={`RM${money(
                    Number(today.paymentMethods?.Bank || 0) +
                      Number(today.paymentMethods?.Card || 0)
                  )}`}
                />
              </div>

              <Link
                href="/merchant/transactions"
                className="mt-6 block rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-black text-slate-950 no-underline sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                {t.viewTransactions}
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  {t.latestTransactions}
                </h2>
                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                  {t.recentCustomerPayments}
                </p>
              </div>

              <Link
                href="/merchant/transactions"
                className="shrink-0 text-xs font-black text-slate-950 no-underline sm:text-sm"
              >
                {t.viewAll} →
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {latest.map((tx: any) => (
                <div
                  key={tx.transactionId}
                  className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl"
                >
                  <div>
                    <p className="text-base font-black text-slate-950 sm:text-lg">
                      {tx.memberId || t.member}
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-slate-500 sm:text-sm">
                      {translatePaymentMethod(tx.paymentMethod, t)} •{" "}
                      {formatDate(tx.createdAt, language)}
                    </p>

                    <p className="mt-1 text-[9px] font-bold text-slate-400 sm:text-xs">
                      {tx.transactionId}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-slate-950 sm:text-2xl">
                      RM{money(tx.netAmount)}
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-emerald-700 sm:text-sm">
                      {t.cashback} RM{money(tx.cashbackAmount)}
                    </p>
                  </div>
                </div>
              ))}

              {!loading && latest.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  {t.noTransactions}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function OrderStat({
  href,
  title,
  value,
  tone,
}: {
  href: string;
  title: string;
  value: number;
  tone:
    | "rose"
    | "amber"
    | "yellow"
    | "sky"
    | "blue"
    | "violet"
    | "emerald"
    | "slate";
}) {
  const toneClass: Record<string, string> = {
    rose: "border-rose-100 bg-rose-50 text-rose-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    yellow: "border-yellow-100 bg-yellow-50 text-yellow-700",
    sky: "border-sky-100 bg-sky-50 text-sky-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-100 text-slate-800",
  };

  return (
    <Link
      href={href}
      className={`rounded-2xl border p-4 no-underline transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${toneClass[tone]}`}
    >
      <p className="text-[10px] font-black sm:text-xs">{title}</p>
      <p className="mt-2 text-2xl font-black sm:text-3xl">{value}</p>
    </Link>
  );
}

function Stat({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 text-white sm:rounded-[2rem] sm:p-6">
      <p className="truncate text-[9px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>

      <h3 className="mt-1 break-words text-sm font-black leading-tight sm:mt-3 sm:text-3xl">
        {value}
      </h3>
    </div>
  );
}

function MiniStat({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-5">
      <p className="text-[9px] font-black text-slate-400 sm:text-xs">
        {title}
      </p>

      <h3 className="mt-1 text-sm font-black text-slate-950 sm:mt-2 sm:text-2xl">
        {value}
      </h3>
    </div>
  );
}

function Badge({ text, green = false }: { text: string; green?: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[10px] font-black sm:px-4 sm:py-2 sm:text-xs ${
        green
          ? "bg-emerald-400/15 text-emerald-300"
          : "bg-white/10 text-slate-300"
      }`}
    >
      {text}
    </span>
  );
}

function money(value: any) {
  return Number(value || 0).toFixed(2);
}

function formatDate(date: any, language: LanguageCode) {
  if (!date) return "-";

  const locale = language === "zh" ? "zh-CN" : language === "ms" ? "ms-MY" : "en-GB";

  return new Date(date).toLocaleString(locale, {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: language !== "zh",
  });
}

function translatePaymentMethod(method: any, t: Translation) {
  const value = String(method || "");

  if (value === "Cash") return t.cash;
  if (value === "DuitNow") return t.duitNow;
  if (value === "TNG") return t.tng;
  if (value === "Bank") return t.bankCard;
  if (value === "Card") return t.bankCard;

  return value || t.payment;
}