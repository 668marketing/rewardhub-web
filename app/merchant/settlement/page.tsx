"use client";

import { useEffect, useMemo, useState } from "react";
import MerchantNav from "@/components/layout/MerchantNav";
import {
  getMerchantSettlementSummary,
  requestMerchantSettlement,
  uploadSettlementReceipt,
} from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations = {
  en: {
    loadFailed: "Failed to load settlement summary",
    merchantNotFound: "Merchant not found",
    requestSuccess:
      "Settlement requested successfully.\nAmount Payable: RM{{amount}}",
    requestFailed: "Request settlement failed",
    noPendingSettlement: "No pending settlement found",
    selectReceipt: "Please select receipt image",
    receiptUploaded: "Receipt uploaded successfully",
    uploadFailed: "Upload receipt failed",

    merchantSettlement: "Merchant Settlement",
    settlementCenter: "Settlement Center",
    description:
      "Track your payable amount, settlement requests and payment status.",

    pendingSettlement: "Pending Settlement",
    paidSettlement: "Paid Settlement",
    lastSettlement: "Last Settlement",
    availablePayable: "Available Payable",
    formula:
      "Formula: Marketing Budget - Cashback already given to members.",

    payUploadReceipt: "Pay / Upload Receipt",
    settlementWindow: "Settlement available from 1st - 10th",
    requesting: "Requesting...",
    noAmountAvailable: "No Amount Available",
    requestSettlement: "Request Settlement",

    settlementHistory: "Settlement History",
    settlementHistoryDescription:
      "View all settlement requests and payment status.",

    allStatus: "All Status",
    pending: "Pending",
    submitted: "Submitted",
    approved: "Approved",
    paid: "Paid",
    rejected: "Rejected",

    noSettlementRecords: "No settlement records yet.",
    loadingSettlements: "Loading settlements...",

    date: "Date",
    settlementId: "Settlement ID",
    month: "Month",
    totalSales: "Total Sales",
    cashback: "Cashback",
    marketingBudget: "Marketing Budget",
    amountPayable: "Amount Payable",
    bank: "Bank",
    status: "Status",
    paidAt: "Paid At",

    settlementPayment: "Settlement Payment",
    paymentDescription:
      "Please transfer the amount below and upload your receipt.",
    accountName: "Account Name",
    accountNumber: "Account Number",
    selected: "Selected",
    paymentNote: "Payment Note (optional)",
    cancel: "Cancel",
    uploading: "Uploading...",
    submit: "Submit",
  },

  zh: {
    loadFailed: "无法加载结算摘要",
    merchantNotFound: "找不到商家资料",
    requestSuccess: "结算申请成功。\n应付金额：RM{{amount}}",
    requestFailed: "结算申请失败",
    noPendingSettlement: "找不到待处理的结算",
    selectReceipt: "请选择收据图片",
    receiptUploaded: "收据上传成功",
    uploadFailed: "收据上传失败",

    merchantSettlement: "商家结算",
    settlementCenter: "结算中心",
    description: "查看应付金额、结算申请和付款状态。",

    pendingSettlement: "待处理结算",
    paidSettlement: "已支付结算",
    lastSettlement: "上次结算",
    availablePayable: "可结算金额",
    formula: "计算方式：Marketing Budget - 已给予会员的 Cashback。",

    payUploadReceipt: "付款 / 上传收据",
    settlementWindow: "结算开放日期为每月 1 日至 10 日",
    requesting: "正在申请……",
    noAmountAvailable: "没有可结算金额",
    requestSettlement: "申请结算",

    settlementHistory: "结算记录",
    settlementHistoryDescription: "查看所有结算申请及付款状态。",

    allStatus: "全部状态",
    pending: "待处理",
    submitted: "已提交",
    approved: "已批准",
    paid: "已支付",
    rejected: "已拒绝",

    noSettlementRecords: "暂时没有结算记录。",
    loadingSettlements: "正在加载结算记录……",

    date: "日期",
    settlementId: "结算编号",
    month: "月份",
    totalSales: "总销售额",
    cashback: "Cashback",
    marketingBudget: "Marketing Budget",
    amountPayable: "应付金额",
    bank: "银行",
    status: "状态",
    paidAt: "付款时间",

    settlementPayment: "结算付款",
    paymentDescription: "请转账以下金额并上传收据。",
    accountName: "账户名称",
    accountNumber: "账户号码",
    selected: "已选择",
    paymentNote: "付款备注（选填）",
    cancel: "取消",
    uploading: "正在上传……",
    submit: "提交",
  },

  ms: {
    loadFailed: "Gagal memuatkan ringkasan penyelesaian",
    merchantNotFound: "Pedagang tidak ditemui",
    requestSuccess:
      "Permohonan penyelesaian berjaya.\nJumlah Perlu Dibayar: RM{{amount}}",
    requestFailed: "Permohonan penyelesaian gagal",
    noPendingSettlement: "Tiada penyelesaian tertunda ditemui",
    selectReceipt: "Sila pilih imej resit",
    receiptUploaded: "Resit berjaya dimuat naik",
    uploadFailed: "Muat naik resit gagal",

    merchantSettlement: "Penyelesaian Pedagang",
    settlementCenter: "Pusat Penyelesaian",
    description:
      "Jejaki jumlah perlu dibayar, permohonan penyelesaian dan status bayaran.",

    pendingSettlement: "Penyelesaian Tertunda",
    paidSettlement: "Penyelesaian Dibayar",
    lastSettlement: "Penyelesaian Terakhir",
    availablePayable: "Jumlah Boleh Dibayar",
    formula:
      "Formula: Marketing Budget - Cashback yang telah diberikan kepada ahli.",

    payUploadReceipt: "Bayar / Muat Naik Resit",
    settlementWindow:
      "Penyelesaian tersedia dari 1 hingga 10 haribulan",
    requesting: "Sedang Memohon...",
    noAmountAvailable: "Tiada Jumlah Tersedia",
    requestSettlement: "Mohon Penyelesaian",

    settlementHistory: "Sejarah Penyelesaian",
    settlementHistoryDescription:
      "Lihat semua permohonan penyelesaian dan status bayaran.",

    allStatus: "Semua Status",
    pending: "Tertunda",
    submitted: "Dihantar",
    approved: "Diluluskan",
    paid: "Dibayar",
    rejected: "Ditolak",

    noSettlementRecords: "Belum ada rekod penyelesaian.",
    loadingSettlements: "Memuatkan penyelesaian...",

    date: "Tarikh",
    settlementId: "ID Penyelesaian",
    month: "Bulan",
    totalSales: "Jumlah Jualan",
    cashback: "Cashback",
    marketingBudget: "Marketing Budget",
    amountPayable: "Jumlah Perlu Dibayar",
    bank: "Bank",
    status: "Status",
    paidAt: "Dibayar Pada",

    settlementPayment: "Bayaran Penyelesaian",
    paymentDescription:
      "Sila pindahkan jumlah di bawah dan muat naik resit anda.",
    accountName: "Nama Akaun",
    accountNumber: "Nombor Akaun",
    selected: "Dipilih",
    paymentNote: "Nota Bayaran (pilihan)",
    cancel: "Batal",
    uploading: "Sedang Memuat Naik...",
    submit: "Hantar",
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

export default function MerchantSettlementPage() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const [showPayment, setShowPayment] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  const t = useMemo(() => translations[language], [language]);

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

  async function load() {
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
      const res = await getMerchantSettlementSummary({ merchantId });
      const result = res?.data?.data || res?.data || res;

      setData(result);
    } catch (err) {
      console.error("Failed to load settlement summary:", err);
      alert(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [language]);

  async function handleRequestSettlement() {
    let merchant: any = {};

    try {
      merchant = JSON.parse(localStorage.getItem("merchant") || "{}");
    } catch {
      merchant = {};
    }

    const merchantId = merchant?.merchantId || merchant?.MERCHANT_ID;

    if (!merchantId) {
      alert(t.merchantNotFound);
      return;
    }

    try {
      setRequesting(true);

      const res = await requestMerchantSettlement({ merchantId });
      const result = res?.data?.data || res?.data || res;

      alert(
        fillText(t.requestSuccess, {
          amount: money(result.amountPayable),
        })
      );

      await load();
    } catch (err: any) {
      alert(err?.message || t.requestFailed);
    } finally {
      setRequesting(false);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.split(",")[1]);
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleUploadReceipt() {
    const pendingSettlement = history.find(
      (item: any) => item.status === "Pending"
    );

    if (!pendingSettlement) {
      alert(t.noPendingSettlement);
      return;
    }

    if (!receiptFile) {
      alert(t.selectReceipt);
      return;
    }

    try {
      setSubmittingReceipt(true);

      const base64 = await fileToBase64(receiptFile);

      await uploadSettlementReceipt({
        settlementId: pendingSettlement.settlementId,
        base64,
        fileName: receiptFile.name,
        paymentNote: paymentNote.trim(),
      });

      alert(t.receiptUploaded);

      setShowPayment(false);
      setReceiptFile(null);
      setPaymentNote("");

      await load();
    } catch (err: any) {
      alert(err?.message || t.uploadFailed);
    } finally {
      setSubmittingReceipt(false);
    }
  }

  const history = data?.history || [];
  const todayDate = new Date().getDate();
  const canPaySettlement = todayDate >= 1 && todayDate <= 10;

  const pendingSettlement = history.find(
    (item: any) => item.status === "Pending"
  );

  const filteredHistory = useMemo(() => {
    if (statusFilter === "All") return history;
    return history.filter((item: any) => item.status === statusFilter);
  }, [history, statusFilter]);

  const pendingAmount = Number(data?.pendingAmount || 0);
  const availablePayable = Number(data?.availablePayable || 0);
  const hasPending = pendingAmount > 0;
  const paidAmount = Number(data?.paidAmount || 0);
  const lastSettlement = Number(data?.lastSettlement || 0);

  const labels = {
    amountPayable: t.amountPayable,
    totalSales: t.totalSales,
    cashback: t.cashback,
    marketingBudget: t.marketingBudget,
    paidAt: t.paidAt,
    bank: t.bank,
    pending: t.pending,
    submitted: t.submitted,
    approved: t.approved,
    paid: t.paid,
    rejected: t.rejected,
  };

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-7xl">
          <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
              {t.merchantSettlement}
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
              {t.settlementCenter}
            </h1>

            <p className="mt-3 max-w-2xl text-[11px] font-bold leading-5 text-slate-400 sm:text-sm sm:leading-6">
              {t.description}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 sm:mt-8 sm:gap-4">
              <StatCard
                title={t.pendingSettlement}
                value={`RM${money(pendingAmount)}`}
              />
              <StatCard
                title={t.paidSettlement}
                value={`RM${money(paidAmount)}`}
              />
              <StatCard
                title={t.lastSettlement}
                value={`RM${money(lastSettlement)}`}
              />
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal">
                  {t.availablePayable}
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-5xl">
                  RM{money(availablePayable)}
                </h2>

                <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  {t.formula}
                </p>
              </div>

              {hasPending ? (
                <button
                  onClick={() => canPaySettlement && setShowPayment(true)}
                  disabled={!canPaySettlement}
                  className="w-full rounded-xl bg-slate-950 px-5 py-3 text-xs font-black text-white disabled:opacity-40 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4 sm:text-sm"
                >
                  {canPaySettlement
                    ? t.payUploadReceipt
                    : t.settlementWindow}
                </button>
              ) : (
                <button
                  onClick={handleRequestSettlement}
                  disabled={
                    requesting || availablePayable <= 0 || !canPaySettlement
                  }
                  className="w-full rounded-xl bg-slate-950 px-5 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4 sm:text-sm"
                >
                  {requesting
                    ? t.requesting
                    : !canPaySettlement
                      ? t.settlementWindow
                      : availablePayable <= 0
                        ? t.noAmountAvailable
                        : t.requestSettlement}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  {t.settlementHistory}
                </h2>

                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                  {t.settlementHistoryDescription}
                </p>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 outline-none sm:w-auto sm:rounded-2xl sm:px-5 sm:text-sm"
              >
                <option value="All">{t.allStatus}</option>
                <option value="Pending">{t.pending}</option>
                <option value="Submitted">{t.submitted}</option>
                <option value="Approved">{t.approved}</option>
                <option value="Paid">{t.paid}</option>
                <option value="Rejected">{t.rejected}</option>
              </select>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              {filteredHistory.map((item: any) => (
                <SettlementCard
                  key={item.settlementId}
                  item={item}
                  language={language}
                  labels={labels}
                />
              ))}

              {!loading && filteredHistory.length === 0 && (
                <EmptyState text={t.noSettlementRecords} />
              )}

              {loading && <EmptyState text={t.loadingSettlements} />}
            </div>

            <div className="mt-6 hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-4">{t.date}</th>
                    <th className="px-4 py-4">{t.settlementId}</th>
                    <th className="px-4 py-4">{t.month}</th>
                    <th className="px-4 py-4">{t.totalSales}</th>
                    <th className="px-4 py-4">{t.cashback}</th>
                    <th className="px-4 py-4">{t.marketingBudget}</th>
                    <th className="px-4 py-4">{t.amountPayable}</th>
                    <th className="px-4 py-4">{t.bank}</th>
                    <th className="px-4 py-4">{t.status}</th>
                    <th className="px-4 py-4">{t.paidAt}</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHistory.map((item: any) => (
                    <tr
                      key={item.settlementId}
                      className="border-b border-slate-100 text-sm font-bold text-slate-700"
                    >
                      <td className="px-4 py-5">
                        {formatDate(item.createdAt, language)}
                      </td>
                      <td className="px-4 py-5 font-black text-slate-950">
                        {item.settlementId}
                      </td>
                      <td className="px-4 py-5">
                        {formatMonth(item.month, language)}
                      </td>
                      <td className="px-4 py-5">
                        RM{money(item.totalSales)}
                      </td>
                      <td className="px-4 py-5">
                        RM{money(item.totalCashback)}
                      </td>
                      <td className="px-4 py-5">
                        RM{money(item.totalMarketingBudget)}
                      </td>
                      <td className="px-4 py-5 font-black text-emerald-700">
                        RM{money(item.amountPayable)}
                      </td>
                      <td className="px-4 py-5">
                        {item.bankName || "-"}
                        {item.bankAccount ? ` / ${item.bankAccount}` : ""}
                      </td>
                      <td className="px-4 py-5">
                        <StatusBadge
                          status={item.status}
                          labels={labels}
                        />
                      </td>
                      <td className="px-4 py-5">
                        {formatDate(item.paidAt, language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredHistory.length === 0 && (
                <EmptyState text={t.noSettlementRecords} />
              )}

              {loading && <EmptyState text={t.loadingSettlements} />}
            </div>
          </div>
        </section>
      </main>

      {showPayment && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 px-3 py-3 sm:items-center sm:px-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                {t.settlementPayment}
              </h2>

              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 sm:hidden"
                aria-label={t.cancel}
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500 sm:mt-3 sm:text-sm sm:leading-6">
              {t.paymentDescription}
            </p>

            <div className="mt-5 rounded-xl border border-slate-200 p-4 sm:mt-6 sm:rounded-2xl sm:p-5">
              <p className="text-[10px] font-black text-slate-500 sm:text-sm">
                {t.amountPayable}
              </p>

              <p className="mt-1 text-3xl font-black text-slate-950 sm:mt-2 sm:text-4xl">
                RM{money(pendingSettlement?.amountPayable || 0)}
              </p>

              <hr className="my-4 sm:my-5" />

              <BankDetail label={t.bank} value="Maybank" />
              <BankDetail label={t.accountName} value="RewardHub" />
              <BankDetail label={t.accountNumber} value="123456789012" />
            </div>

            <input
              type="file"
              accept="image/*"
              className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none sm:mt-6 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
              onChange={(e) =>
                setReceiptFile(e.target.files?.[0] || null)
              }
            />

            {receiptFile && (
              <p className="mt-2 break-all text-[10px] font-bold text-emerald-700 sm:text-sm">
                {t.selected}: {receiptFile.name}
              </p>
            )}

            <textarea
              className="mt-4 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
              placeholder={t.paymentNote}
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />

            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6">
              <button
                className="rounded-xl border border-slate-200 py-3 text-xs font-black text-slate-950 sm:rounded-2xl sm:py-4 sm:text-sm"
                onClick={() => setShowPayment(false)}
              >
                {t.cancel}
              </button>

              <button
                className="rounded-xl bg-slate-950 py-3 text-xs font-black text-white disabled:opacity-50 sm:rounded-2xl sm:py-4 sm:text-sm"
                disabled={submittingReceipt}
                onClick={handleUploadReceipt}
              >
                {submittingReceipt ? t.uploading : t.submit}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SettlementCard({
  item,
  language,
  labels,
}: {
  item: any;
  language: LanguageCode;
  labels: {
    amountPayable: string;
    totalSales: string;
    cashback: string;
    marketingBudget: string;
    paidAt: string;
    bank: string;
    pending: string;
    submitted: string;
    approved: string;
    paid: string;
    rejected: string;
  };
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">
            {formatMonth(item.month, language)}
          </p>

          <div className="mt-2">
            <StatusBadge status={item.status} labels={labels} />
          </div>

          <p className="mt-2 truncate text-[9px] font-bold text-slate-400">
            {item.settlementId}
          </p>

          <p className="mt-1 text-[9px] font-medium text-slate-400">
            {formatDate(item.createdAt, language)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
            {labels.amountPayable}
          </p>
          <p className="mt-1 text-lg font-black text-emerald-700">
            RM{money(item.amountPayable)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniInfo
          title={labels.totalSales}
          value={`RM${money(item.totalSales)}`}
        />
        <MiniInfo
          title={labels.cashback}
          value={`RM${money(item.totalCashback)}`}
        />
        <MiniInfo
          title={labels.marketingBudget}
          value={`RM${money(item.totalMarketingBudget)}`}
        />
        <MiniInfo
          title={labels.paidAt}
          value={formatDate(item.paidAt, language)}
        />
      </div>

      <div className="mt-3 rounded-xl bg-white p-3">
        <p className="text-[9px] font-black text-slate-400">
          {labels.bank}
        </p>
        <p className="mt-1 break-words text-xs font-black text-slate-950">
          {item.bankName || "-"}
          {item.bankAccount ? ` / ${item.bankAccount}` : ""}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-white/10 p-3 text-white sm:rounded-[2rem] sm:p-6">
      <p className="truncate text-[9px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>
      <h3 className="mt-1 break-words text-sm font-black leading-tight sm:mt-3 sm:text-3xl">
        {value}
      </h3>
    </div>
  );
}

function MiniInfo({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-white p-3">
      <p className="truncate text-[9px] font-black text-slate-400">
        {title}
      </p>
      <p className="mt-1 break-words text-xs font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function BankDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-black text-slate-500 sm:text-sm">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  labels,
}: {
  status: string;
  labels: {
    pending: string;
    submitted: string;
    approved: string;
    paid: string;
    rejected: string;
  };
}) {
  const normalizedStatus = status || "Pending";

  const style =
    normalizedStatus === "Paid"
      ? "bg-emerald-100 text-emerald-700"
      : normalizedStatus === "Approved"
        ? "bg-blue-100 text-blue-700"
        : normalizedStatus === "Rejected"
          ? "bg-red-100 text-red-700"
          : normalizedStatus === "Submitted"
            ? "bg-purple-100 text-purple-700"
            : "bg-amber-100 text-amber-700";

  const label =
    normalizedStatus === "Paid"
      ? labels.paid
      : normalizedStatus === "Approved"
        ? labels.approved
        : normalizedStatus === "Rejected"
          ? labels.rejected
          : normalizedStatus === "Submitted"
            ? labels.submitted
            : labels.pending;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black sm:px-3 sm:text-xs ${style}`}
    >
      {label}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:p-10 sm:text-sm">
      {text}
    </div>
  );
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
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );
}

function formatMonth(value: any, language: LanguageCode) {
  if (!value) return "-";

  const raw = String(value);
  const parts = raw.split("-");

  if (parts.length !== 2) return raw;

  const year = Number(parts[0]);
  const month = Number(parts[1]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12
  ) {
    return raw;
  }

  return new Date(year, month - 1, 1).toLocaleDateString(
    language === "zh"
      ? "zh-CN"
      : language === "ms"
        ? "ms-MY"
        : "en-GB",
    {
      month: "short",
      year: "numeric",
    }
  );
}