"use client";

import { useEffect, useMemo, useState } from "react";
import MerchantNav from "@/components/layout/MerchantNav";
import {
  getMerchantTransactionHistory,
  uploadTransactionReceipt,
} from "@/lib/api";


type LanguageCode = "en" | "zh" | "ms";

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations = {
  en: {
    loadFailed: "Failed to load transactions",
    receiptUploaded: "Receipt uploaded successfully",
    uploadFailed: "Upload failed",
    merchantTransactions: "Merchant Transactions",
    transactionHistory: "Transaction History",
    description:
      "Track customer payments, instant cashback, Reward Credits used, and points issued.",
    customerPays: "Customer Pays",
    originalSales: "Original Sales",
    cashbackGiven: "Cashback Given",
    rewardCreditsUsed: "Reward Credits Used",
    pointsIssued: "Points Issued",
    pointsUnit: "pts",
    allTransactions: "All Transactions",
    showingTransactions: "Showing {{count}} transaction(s)",
    searchPlaceholder: "Search TX / Member ID",
    allDates: "All Dates",
    today: "Today",
    yesterday: "Yesterday",
    thisMonth: "This Month",
    allMethods: "All Methods",
    cash: "Cash",
    duitNow: "DuitNow",
    tng: "TNG",
    bank: "Bank",
    card: "Card",
    noTransactions: "No transactions found.",
    loadingTransactions: "Loading transactions...",
    dateTime: "Date / Time",
    transactionId: "Transaction ID",
    member: "Member",
    original: "Original",
    cashback: "Cashback",
    rewardCredit: "Reward Credit",
    points: "Points",
    method: "Method",
    status: "Status",
    receipt: "Receipt",
    view: "View",
    payment: "Payment",
    creditsUsed: "Credits Used",
    viewReceipt: "View Receipt",
    noReceipt: "No Receipt",
    transactionDetail: "Transaction Detail",
    memberId: "Member ID",
    originalAmount: "Original Amount",
    rewardCredits: "Reward Credits",
    pointsEarned: "Points Earned",
    paymentMethod: "Payment Method",
    upload: "Upload",
    close: "Close",
    receiptPreview: "Receipt Preview",
    receiptAlt: "Receipt",
    completed: "Completed",
    pending: "Pending",
    cancelled: "Cancelled",
  },
  zh: {
    loadFailed: "无法加载交易记录",
    receiptUploaded: "收据上传成功",
    uploadFailed: "上传失败",
    merchantTransactions: "商家交易",
    transactionHistory: "交易记录",
    description:
      "查看顾客付款、即时 Cashback、使用的 Reward Credits 和发放的积分。",
    customerPays: "顾客实付",
    originalSales: "原始销售额",
    cashbackGiven: "已发放 Cashback",
    rewardCreditsUsed: "已使用 Reward Credits",
    pointsIssued: "已发放积分",
    pointsUnit: "积分",
    allTransactions: "所有交易",
    showingTransactions: "显示 {{count}} 笔交易",
    searchPlaceholder: "搜索交易编号 / 会员 ID",
    allDates: "全部日期",
    today: "今天",
    yesterday: "昨天",
    thisMonth: "本月",
    allMethods: "全部付款方式",
    cash: "现金",
    duitNow: "DuitNow",
    tng: "TNG",
    bank: "银行转账",
    card: "银行卡",
    noTransactions: "找不到交易记录。",
    loadingTransactions: "正在加载交易记录……",
    dateTime: "日期 / 时间",
    transactionId: "交易编号",
    member: "会员",
    original: "原始金额",
    cashback: "Cashback",
    rewardCredit: "Reward Credit",
    points: "积分",
    method: "付款方式",
    status: "状态",
    receipt: "收据",
    view: "查看",
    payment: "付款",
    creditsUsed: "已使用 Credits",
    viewReceipt: "查看收据",
    noReceipt: "没有收据",
    transactionDetail: "交易详情",
    memberId: "会员 ID",
    originalAmount: "原始金额",
    rewardCredits: "Reward Credits",
    pointsEarned: "获得积分",
    paymentMethod: "付款方式",
    upload: "上传",
    close: "关闭",
    receiptPreview: "收据预览",
    receiptAlt: "收据",
    completed: "已完成",
    pending: "待处理",
    cancelled: "已取消",
  },
  ms: {
    loadFailed: "Gagal memuatkan transaksi",
    receiptUploaded: "Resit berjaya dimuat naik",
    uploadFailed: "Muat naik gagal",
    merchantTransactions: "Transaksi Pedagang",
    transactionHistory: "Sejarah Transaksi",
    description:
      "Jejaki bayaran pelanggan, Cashback segera, Reward Credits digunakan dan mata yang dikeluarkan.",
    customerPays: "Bayaran Pelanggan",
    originalSales: "Jualan Asal",
    cashbackGiven: "Cashback Diberikan",
    rewardCreditsUsed: "Reward Credits Digunakan",
    pointsIssued: "Mata Dikeluarkan",
    pointsUnit: "mata",
    allTransactions: "Semua Transaksi",
    showingTransactions: "Memaparkan {{count}} transaksi",
    searchPlaceholder: "Cari TX / ID Ahli",
    allDates: "Semua Tarikh",
    today: "Hari Ini",
    yesterday: "Semalam",
    thisMonth: "Bulan Ini",
    allMethods: "Semua Kaedah",
    cash: "Tunai",
    duitNow: "DuitNow",
    tng: "TNG",
    bank: "Bank",
    card: "Kad",
    noTransactions: "Tiada transaksi ditemui.",
    loadingTransactions: "Memuatkan transaksi...",
    dateTime: "Tarikh / Masa",
    transactionId: "ID Transaksi",
    member: "Ahli",
    original: "Asal",
    cashback: "Cashback",
    rewardCredit: "Reward Credit",
    points: "Mata",
    method: "Kaedah",
    status: "Status",
    receipt: "Resit",
    view: "Lihat",
    payment: "Bayaran",
    creditsUsed: "Credits Digunakan",
    viewReceipt: "Lihat Resit",
    noReceipt: "Tiada Resit",
    transactionDetail: "Butiran Transaksi",
    memberId: "ID Ahli",
    originalAmount: "Jumlah Asal",
    rewardCredits: "Reward Credits",
    pointsEarned: "Mata Diperoleh",
    paymentMethod: "Kaedah Bayaran",
    upload: "Muat Naik",
    close: "Tutup",
    receiptPreview: "Pratonton Resit",
    receiptAlt: "Resit",
    completed: "Selesai",
    pending: "Tertunda",
    cancelled: "Dibatalkan",
  },
} as const;

function normalizeLanguage(value: string | null): LanguageCode {
  return value === "zh" || value === "ms" ? value : "en";
}

function fillText(
  value: string,
  replacements: Record<string, string | number>
) {
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{{${key}}}`, String(replacement)),
    value
  );
}

function usePageLanguage() {
  const [language, setLanguage] = useState<LanguageCode>("en");

  useEffect(() => {
    setLanguage(
      normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))
    );

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

  const t = useMemo(() => translations[language], [language]);

  return { language, t };
}

export default function MerchantTransactionsPage() {
  const { language, t } = usePageLanguage();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [previewReceipt, setPreviewReceipt] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    let merchant: any = {};

    try {
      merchant = JSON.parse(localStorage.getItem("merchant") || "{}");
    } catch {
      merchant = {};
    }

    const merchantId = merchant?.merchantId || merchant?.MERCHANT_ID;

    if (!merchantId) {
      setLoading(false);
      return;
    }

    try {
      const res = await getMerchantTransactionHistory({
        merchantId,
        limit: 200,
      });

      setTransactions(res?.data?.data?.transactions || []);
    } catch (err) {
      console.error(err);
      alert(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadReceipt(transactionId: string, file: File) {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64 = String(reader.result).split(",")[1];

        const res = await uploadTransactionReceipt({
          transactionId,
          base64,
        });

        const receiptUrl =
          res?.data?.data?.receiptUrl || res?.data?.receiptUrl;

        setTransactions((old) =>
          old.map((tx) =>
            tx.transactionId === transactionId
              ? { ...tx, receiptUrl }
              : tx
          )
        );

        setSelectedTx((old: any) =>
          old?.transactionId === transactionId
            ? { ...old, receiptUrl }
            : old
        );

        alert(t.receiptUploaded);
      } catch (err: any) {
        alert(err?.message || t.uploadFailed);
      }
    };

    reader.readAsDataURL(file);
  }

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const keyword = search.toLowerCase();

      const matchSearch =
        !keyword ||
        String(tx.transactionId || "").toLowerCase().includes(keyword) ||
        String(tx.memberId || "").toLowerCase().includes(keyword);

      const matchMethod =
        method === "All" || String(tx.paymentMethod || "") === method;

      const txDate = new Date(tx.createdAt);
      const today = new Date();

      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const isToday = txDate.toDateString() === today.toDateString();
      const isYesterday =
        txDate.toDateString() === yesterday.toDateString();

      const isThisMonth =
        txDate.getFullYear() === today.getFullYear() &&
        txDate.getMonth() === today.getMonth();

      const matchDate =
        dateFilter === "All" ||
        (dateFilter === "Today" && isToday) ||
        (dateFilter === "Yesterday" && isYesterday) ||
        (dateFilter === "This Month" && isThisMonth);

      return matchSearch && matchMethod && matchDate;
    });
  }, [transactions, search, method, dateFilter]);

  const totalOriginal = sum(filtered, "amount");
  const totalPayAmount = sum(filtered, "payAmount");
  const totalCashback = sum(filtered, "cashback");
  const totalRewardCredits = sum(filtered, "rewardCreditsUsed");
  const totalPoints = sum(filtered, "pointsEarned");

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-7xl">
          <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
              {t.merchantTransactions}
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
              {t.transactionHistory}
            </h1>

            <p className="mt-3 max-w-2xl text-xs font-bold leading-5 text-slate-400 sm:text-sm sm:leading-6">
              {t.description}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-5">
              <Stat title={t.customerPays} value={`RM${money(totalPayAmount)}`} />
              <Stat title={t.originalSales} value={`RM${money(totalOriginal)}`} />
              <Stat title={t.cashbackGiven} value={`RM${money(totalCashback)}`} />
              <Stat
                title={t.rewardCreditsUsed}
                value={`RM${money(totalRewardCredits)}`}
              />
              <Stat
                title={t.pointsIssued}
                value={`${totalPoints} ${t.pointsUnit}`}
                wideOnMobile
              />
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  {t.allTransactions}
                </h2>
                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                  {fillText(t.showingTransactions, { count: filtered.length })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-row">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm lg:col-span-1"
                />

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                >
                  <option value="All">{t.allDates}</option>
                  <option value="Today">{t.today}</option>
                  <option value="Yesterday">{t.yesterday}</option>
                  <option value="This Month">{t.thisMonth}</option>
                </select>

                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                >
                  <option value="All">{t.allMethods}</option>
                  <option value="Cash">{t.cash}</option>
                  <option value="DuitNow">{t.duitNow}</option>
                  <option value="TNG">{t.tng}</option>
                  <option value="Bank">{t.bank}</option>
                  <option value="Card">{t.card}</option>
                </select>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="mt-5 space-y-3 lg:hidden">
              {filtered.map((tx) => (
                <MobileTransactionCard
                  key={tx.transactionId}
                  tx={tx}
                  onOpen={() => setSelectedTx(tx)}
                  onPreviewReceipt={(url) => setPreviewReceipt(url)}
                  language={language}
                />
              ))}

              {!loading && filtered.length === 0 && (
                <EmptyState text={t.noTransactions} />
              )}

              {loading && <EmptyState text={t.loadingTransactions} />}
            </div>

            {/* Desktop table */}
            <div className="mt-6 hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1150px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-4">{t.dateTime}</th>
                    <th className="px-4 py-4">{t.transactionId}</th>
                    <th className="px-4 py-4">{t.member}</th>
                    <th className="px-4 py-4 text-right">{t.original}</th>
                    <th className="px-4 py-4 text-right">{t.cashback}</th>
                    <th className="px-4 py-4 text-right">{t.rewardCredit}</th>
                    <th className="px-4 py-4 text-right">{t.customerPays}</th>
                    <th className="px-4 py-4 text-right">{t.points}</th>
                    <th className="px-4 py-4">{t.method}</th>
                    <th className="px-4 py-4">{t.status}</th>
                    <th className="px-4 py-4">{t.receipt}</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((tx) => (
                    <tr
                      key={tx.transactionId}
                      onClick={() => setSelectedTx(tx)}
                      className="cursor-pointer border-b border-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-5">
                        {formatDate(tx.createdAt, language)}
                      </td>

                      <td className="px-4 py-5 font-black text-slate-950">
                        {tx.transactionId}
                      </td>

                      <td className="px-4 py-5">{tx.memberId || "-"}</td>

                      <td className="px-4 py-5 text-right">
                        RM{money(tx.amount)}
                      </td>

                      <td className="px-4 py-5 text-right text-emerald-700">
                        RM{money(tx.cashback)}
                      </td>

                      <td className="px-4 py-5 text-right">
                        RM{money(tx.rewardCreditsUsed)}
                      </td>

                      <td className="px-4 py-5 text-right text-lg font-black text-slate-950">
                        RM{money(tx.payAmount)}
                      </td>

                      <td className="px-4 py-5 text-right">
                        {Number(tx.pointsEarned || 0)} {t.pointsUnit}
                      </td>

                      <td className="px-4 py-5">{tx.paymentMethod || "-"}</td>

                      <td className="px-4 py-5">
                        <StatusBadge status={tx.status || "Completed"} />
                      </td>

                      <td className="px-4 py-5">
                        {tx.receiptUrl ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewReceipt(tx.receiptUrl);
                            }}
                            className="font-black text-blue-600"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filtered.length === 0 && (
                <EmptyState text={t.noTransactions} />
              )}

              {loading && <EmptyState text={t.loadingTransactions} />}
            </div>
          </div>
        </section>

        {selectedTx && (
          <TransactionDetailModal
            tx={selectedTx}
            onClose={() => setSelectedTx(null)}
            onPreviewReceipt={(url: string) => setPreviewReceipt(url)}
            onUploadReceipt={handleUploadReceipt}
            language={language}
          />
        )}

        {previewReceipt && (
          <ReceiptPreviewModal
            url={previewReceipt}
            onClose={() => setPreviewReceipt("")}
            language={language}
          />
        )}
      </main>
    </>
  );
}

function MobileTransactionCard({
  tx,
  onOpen,
  onPreviewReceipt,
  language,
}: {
  tx: any;
  onOpen: () => void;
  onPreviewReceipt: (url: string) => void;
  language: LanguageCode;
}) {
  const t = translations[language];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 text-left transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">
            {tx.memberId || t.member}
          </p>

          <div className="mt-2">
            <StatusBadge status={tx.status || "Completed"} />
          </div>

          <p className="mt-2 text-[10px] font-bold text-slate-500">
            {tx.paymentMethod || t.payment} • {formatDate(tx.createdAt, language)}
          </p>

          <p className="mt-1 truncate text-[9px] font-bold text-slate-400">
            {tx.transactionId}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
            {t.customerPays}
          </p>
          <p className="mt-1 text-lg font-black text-slate-950">
            RM{money(tx.payAmount)}
          </p>
          <p className="mt-1 text-[10px] font-bold text-emerald-700">
            {t.cashback} RM{money(tx.cashback)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniInfo title={t.original} value={`RM${money(tx.amount)}`} />
        <MiniInfo
          title={t.creditsUsed}
          value={`RM${money(tx.rewardCreditsUsed)}`}
        />
        <MiniInfo
          title={t.points}
          value={`${Number(tx.pointsEarned || 0)} ${t.pointsUnit}`}
        />

        <div className="rounded-xl bg-white p-3">
          <p className="text-[9px] font-black text-slate-400">{t.receipt}</p>
          {tx.receiptUrl ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onPreviewReceipt(tx.receiptUrl);
              }}
              className="mt-1 inline-block text-xs font-black text-blue-600"
            >
              {t.viewReceipt}
            </span>
          ) : (
            <p className="mt-1 text-xs font-black text-slate-400">{t.noReceipt}</p>
          )}
        </div>
      </div>
    </button>
  );
}

function TransactionDetailModal({
  tx,
  onClose,
  onPreviewReceipt,
  onUploadReceipt,
  language,
}: {
  tx: any;
  onClose: () => void;
  onPreviewReceipt: (url: string) => void;
  onUploadReceipt: (transactionId: string, file: File) => void;
  language: LanguageCode;
}) {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 px-3 py-3 sm:items-center sm:px-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
            {t.transactionDetail}
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 sm:hidden"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3 text-xs font-bold text-slate-700 sm:mt-6 sm:space-y-4 sm:text-sm">
          <Detail label={t.transactionId} value={tx.transactionId} />
          <Detail label={t.memberId} value={tx.memberId || "-"} />
          <Detail label={t.dateTime} value={formatDate(tx.createdAt, language)} />
          <Detail label={t.originalAmount} value={`RM${money(tx.amount)}`} />
          <Detail label={t.cashback} value={`RM${money(tx.cashback)}`} />
          <Detail
            label={t.rewardCredits}
            value={`RM${money(tx.rewardCreditsUsed)}`}
          />
          <Detail label={t.customerPays} value={`RM${money(tx.payAmount)}`} />
          <Detail
            label={t.pointsEarned}
            value={`${Number(tx.pointsEarned || 0)} ${t.pointsUnit}`}
          />
          <Detail label={t.paymentMethod} value={tx.paymentMethod || "-"} />
          <Detail label={t.status} value={tx.status || "Completed"} />

          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <span className="text-slate-400">{t.receipt}</span>

            <div className="flex items-center gap-2">
              {tx.receiptUrl ? (
                <button
                  onClick={() => onPreviewReceipt(tx.receiptUrl)}
                  className="font-black text-blue-600"
                >
                  View
                </button>
              ) : (
                <span className="text-slate-400">-</span>
              )}

              <label className="cursor-pointer rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black text-white sm:text-xs">
                {t.upload}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    onUploadReceipt(tx.transactionId, file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 hidden w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white sm:block"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}

function ReceiptPreviewModal({
  url,
  onClose,
  language,
}: {
  url: string;
  onClose: () => void;
  language: LanguageCode;
}) {
  const t = translations[language];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-3 py-3 sm:px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-[1.75rem] bg-white p-4 shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
            {t.receiptPreview}
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white sm:px-4 sm:text-sm"
          >
            {t.close}
          </button>
        </div>

        <div className="mt-4 max-h-[78vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:mt-5 sm:p-3">
          <img
            src={getReceiptImageUrl(url)}
            alt={t.receiptAlt}
            className="mx-auto max-h-[72vh] w-auto rounded-xl object-contain"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  wideOnMobile = false,
}: {
  title: string;
  value: any;
  wideOnMobile?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl bg-white/10 p-3 sm:rounded-[2rem] sm:p-6 ${
        wideOnMobile ? "col-span-2 xl:col-span-1" : ""
      }`}
    >
      <p className="truncate text-[9px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>
      <h3 className="mt-1 break-words text-sm font-black leading-tight text-white sm:mt-3 sm:text-3xl">
        {value}
      </h3>
    </div>
  );
}

function MiniInfo({ title, value }: { title: string; value: any }) {
  return (
    <div className="min-w-0 rounded-xl bg-white p-3">
      <p className="truncate text-[9px] font-black text-slate-400">{title}</p>
      <p className="mt-1 break-words text-xs font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = usePageLanguage();

  const color =
    status === "Completed"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Pending"
        ? "bg-amber-100 text-amber-700"
        : status === "Cancelled"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black sm:px-3 sm:text-xs ${color}`}
    >
      {status === "Completed"
        ? t.completed
        : status === "Pending"
          ? t.pending
          : status === "Cancelled"
            ? t.cancelled
            : status}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="break-all text-right font-black text-slate-950">
        {value}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-10 sm:text-sm">
      {text}
    </div>
  );
}

function sum(list: any[], key: string) {
  return list.reduce((total, item) => total + Number(item?.[key] || 0), 0);
}

function money(value: any) {
  return Number(value || 0).toFixed(2);
}

function formatDate(date: any, language: LanguageCode) {
  if (!date) return "-";

  return new Date(date).toLocaleString(
    language === "zh"
      ? "zh-CN"
      : language === "ms"
        ? "ms-MY"
        : "en-GB",
    {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
      hour12: true,
    }
  );
}

function getReceiptImageUrl(url: string) {
  if (!url) return "";

  if (url.includes("drive.google.com/uc?export=view&id=")) {
    const id = url.split("id=")[1];
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }

  if (url.includes("drive.google.com/file/d/")) {
    const id = url.split("/file/d/")[1]?.split("/")[0];
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }

  return url;
}