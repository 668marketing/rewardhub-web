"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MerchantNav from "@/components/layout/MerchantNav";

import {
  getMerchantSettlementSummary,
  requestMerchantSettlement,
  uploadSettlementReceipt,
} from "@/lib/api";

type LanguageCode =
  | "en"
  | "zh"
  | "ms";

type SettlementDirection =
  | "MERCHANT_TO_REWARDHUB"
  | "REWARDHUB_TO_MERCHANT"
  | "NO_PAYMENT";

const LANGUAGE_STORAGE_KEY =
  "rewardhub-language";

const translations = {
  en: {
    loadFailed:
      "Failed to load settlement summary",
    merchantNotFound:
      "Merchant not found",

    requestSuccess:
      "Settlement requested successfully.",
    requestFailed:
      "Request settlement failed",

    noPendingSettlement:
      "No pending settlement found",
    selectReceipt:
      "Please select receipt image",
    receiptUploaded:
      "Receipt uploaded successfully",
    uploadFailed:
      "Upload receipt failed",

    merchantSettlement:
      "Merchant Settlement",
    settlementCenter:
      "Settlement Center",
    description:
      "Track settlement amounts, Reward Credits, payment direction and settlement status.",

    pendingSettlement:
      "Pending Settlement",
    paidSettlement:
      "Paid Settlement",
    lastSettlement:
      "Last Settlement",

    currentSettlement:
      "Current Settlement",
    settlementAmount:
      "Settlement Amount",

    merchantPaysRewardHub:
      "Merchant Pays RewardHub",
    rewardHubPaysMerchant:
      "RewardHub Pays Merchant",
    noPaymentRequired:
      "No Payment Required",

    merchantPaysDescription:
      "This is the net amount you need to pay RewardHub for this settlement.",
    rewardHubPaysDescription:
      "This is the net amount RewardHub needs to pay your merchant account.",
    noPaymentDescription:
      "Marketing Budget after Cashback is fully offset by Reward Credits and Voucher Discount. No transfer is required.",

    formula:
      "Net Settlement = (Marketing Budget - Cashback) - (Reward Credits Used + Voucher Discount).",

    merchantDue:
      "Merchant Due",
    rewardHubDue:
      "RewardHub Due",
    netAmount:
      "Net Amount",
    rewardCredits:
      "Reward Credits Used",
    voucherDiscount:
      "Voucher Discount",

    payUploadReceipt:
      "Pay / Upload Receipt",
    waitingRewardHubPayment:
      "Waiting for RewardHub Payment",
    waitingAdminConfirmation:
      "Waiting for Admin Confirmation",

    settlementWindow:
      "Settlement available from 1st - 10th",
    requesting:
      "Requesting...",
    noSalesAvailable:
      "No Sales Available",
    requestSettlement:
      "Request Settlement",

    settlementHistory:
      "Settlement History",
    settlementHistoryDescription:
      "View all settlement requests, payment direction and status.",

    allStatus:
      "All Status",
    pending:
      "Pending",
    submitted:
      "Submitted",
    approved:
      "Approved",
    paid:
      "Paid",
    rejected:
      "Rejected",

    noSettlementRecords:
      "No settlement records yet.",
    loadingSettlements:
      "Loading settlements...",

    date:
      "Date",
    settlementId:
      "Settlement ID",
    month:
      "Month",
    totalSales:
      "Total Sales",
    cashback:
      "Cashback",
    marketingBudget:
      "Marketing Budget",
    direction:
      "Direction",
    amountPayable:
      "Settlement Amount",
    bank:
      "Bank",
    status:
      "Status",
    paidAt:
      "Paid At",
    receipt:
      "Receipt",
    view:
      "View",
    settled:
      "Settled",

    settlementPayment:
      "Settlement Payment",
    paymentDescription:
      "Please transfer the amount below to RewardHub and upload your receipt.",
    accountName:
      "Account Name",
    accountNumber:
      "Account Number",
    selected:
      "Selected",
    paymentNote:
      "Payment Note (optional)",
    cancel:
      "Cancel",
    uploading:
      "Uploading...",
    submit:
      "Submit",
  },

  zh: {
    loadFailed:
      "无法加载结算摘要",
    merchantNotFound:
      "找不到商家资料",

    requestSuccess:
      "结算申请成功。",
    requestFailed:
      "结算申请失败",

    noPendingSettlement:
      "找不到待处理的结算",
    selectReceipt:
      "请选择收据图片",
    receiptUploaded:
      "收据上传成功",
    uploadFailed:
      "收据上传失败",

    merchantSettlement:
      "商家结算",
    settlementCenter:
      "结算中心",
    description:
      "查看结算金额、Reward Credits、付款方向及结算状态。",

    pendingSettlement:
      "待处理结算",
    paidSettlement:
      "已支付结算",
    lastSettlement:
      "上次结算",

    currentSettlement:
      "本期结算",
    settlementAmount:
      "结算金额",

    merchantPaysRewardHub:
      "商家支付 RewardHub",
    rewardHubPaysMerchant:
      "RewardHub 支付商家",
    noPaymentRequired:
      "无需付款",

    merchantPaysDescription:
      "这是本期结算后商家需要支付给 RewardHub 的净额。",
    rewardHubPaysDescription:
      "这是本期结算后 RewardHub 需要支付给商家的净额。",
    noPaymentDescription:
      "扣除 Cashback 后的 Marketing Budget 已被 Reward Credits 与 Voucher 抵扣完全抵消，本期无需转账。",

    formula:
      "净结算 =（Marketing Budget - Cashback）-（已使用 Reward Credits + Voucher 抵扣）。",

    merchantDue:
      "商家应付",
    rewardHubDue:
      "RewardHub 应付",
    netAmount:
      "净额",
    rewardCredits:
      "已使用 Reward Credits",
    voucherDiscount:
      "Voucher 抵扣",

    payUploadReceipt:
      "付款 / 上传收据",
    waitingRewardHubPayment:
      "等待 RewardHub 付款",
    waitingAdminConfirmation:
      "等待 Admin 确认",

    settlementWindow:
      "结算开放日期为每月 1 日至 10 日",
    requesting:
      "正在申请……",
    noSalesAvailable:
      "没有可结算销售额",
    requestSettlement:
      "申请结算",

    settlementHistory:
      "结算记录",
    settlementHistoryDescription:
      "查看所有结算申请、付款方向及状态。",

    allStatus:
      "全部状态",
    pending:
      "待处理",
    submitted:
      "已提交",
    approved:
      "已批准",
    paid:
      "已支付",
    rejected:
      "已拒绝",

    noSettlementRecords:
      "暂时没有结算记录。",
    loadingSettlements:
      "正在加载结算记录……",

    date:
      "日期",
    settlementId:
      "结算编号",
    month:
      "月份",
    totalSales:
      "总销售额",
    cashback:
      "Cashback",
    marketingBudget:
      "Marketing Budget",
    direction:
      "付款方向",
    amountPayable:
      "结算金额",
    bank:
      "银行",
    status:
      "状态",
    paidAt:
      "付款时间",
    receipt:
      "单据",
    view:
      "View",
    settled:
      "已结算",

    settlementPayment:
      "结算付款",
    paymentDescription:
      "请将以下金额转账给 RewardHub，然后上传付款收据。",
    accountName:
      "账户名称",
    accountNumber:
      "账户号码",
    selected:
      "已选择",
    paymentNote:
      "付款备注（选填）",
    cancel:
      "取消",
    uploading:
      "正在上传……",
    submit:
      "提交",
  },

  ms: {
    loadFailed:
      "Gagal memuatkan ringkasan penyelesaian",
    merchantNotFound:
      "Pedagang tidak ditemui",

    requestSuccess:
      "Permohonan penyelesaian berjaya.",
    requestFailed:
      "Permohonan penyelesaian gagal",

    noPendingSettlement:
      "Tiada penyelesaian tertunda ditemui",
    selectReceipt:
      "Sila pilih imej resit",
    receiptUploaded:
      "Resit berjaya dimuat naik",
    uploadFailed:
      "Muat naik resit gagal",

    merchantSettlement:
      "Penyelesaian Pedagang",
    settlementCenter:
      "Pusat Penyelesaian",
    description:
      "Jejaki jumlah penyelesaian, Reward Credits, arah bayaran dan status penyelesaian.",

    pendingSettlement:
      "Penyelesaian Tertunda",
    paidSettlement:
      "Penyelesaian Dibayar",
    lastSettlement:
      "Penyelesaian Terakhir",

    currentSettlement:
      "Penyelesaian Semasa",
    settlementAmount:
      "Jumlah Penyelesaian",

    merchantPaysRewardHub:
      "Pedagang Bayar RewardHub",
    rewardHubPaysMerchant:
      "RewardHub Bayar Pedagang",
    noPaymentRequired:
      "Tiada Bayaran Diperlukan",

    merchantPaysDescription:
      "Ini ialah jumlah bersih yang perlu dibayar oleh pedagang kepada RewardHub.",
    rewardHubPaysDescription:
      "Ini ialah jumlah bersih yang perlu dibayar oleh RewardHub kepada akaun pedagang anda.",
    noPaymentDescription:
      "Marketing Budget selepas Cashback telah diimbangi sepenuhnya oleh Reward Credits dan Diskaun Voucher. Tiada pindahan diperlukan.",

    formula:
      "Penyelesaian Bersih = (Marketing Budget - Cashback) - (Reward Credits Digunakan + Diskaun Voucher).",

    merchantDue:
      "Pedagang Perlu Bayar",
    rewardHubDue:
      "RewardHub Perlu Bayar",
    netAmount:
      "Jumlah Bersih",
    rewardCredits:
      "Reward Credits Digunakan",
    voucherDiscount:
      "Diskaun Voucher",

    payUploadReceipt:
      "Bayar / Muat Naik Resit",
    waitingRewardHubPayment:
      "Menunggu Bayaran RewardHub",
    waitingAdminConfirmation:
      "Menunggu Pengesahan Admin",

    settlementWindow:
      "Penyelesaian tersedia dari 1 hingga 10 haribulan setiap bulan",
    requesting:
      "Sedang Memohon...",
    noSalesAvailable:
      "Tiada Jualan untuk Penyelesaian",
    requestSettlement:
      "Mohon Penyelesaian",

    settlementHistory:
      "Sejarah Penyelesaian",
    settlementHistoryDescription:
      "Lihat semua permohonan, arah bayaran dan status penyelesaian.",

    allStatus:
      "Semua Status",
    pending:
      "Tertunda",
    submitted:
      "Dihantar",
    approved:
      "Diluluskan",
    paid:
      "Dibayar",
    rejected:
      "Ditolak",

    noSettlementRecords:
      "Belum ada rekod penyelesaian.",
    loadingSettlements:
      "Memuatkan penyelesaian...",

    date:
      "Tarikh",
    settlementId:
      "ID Penyelesaian",
    month:
      "Bulan",
    totalSales:
      "Jumlah Jualan",
    cashback:
      "Cashback",
    marketingBudget:
      "Marketing Budget",
    direction:
      "Arah Bayaran",
    amountPayable:
      "Jumlah Penyelesaian",
    bank:
      "Bank",
    status:
      "Status",
    paidAt:
      "Dibayar Pada",
    receipt:
      "Resit",
    view:
      "View",
    settled:
      "Selesai",

    settlementPayment:
      "Bayaran Penyelesaian",
    paymentDescription:
      "Sila pindahkan jumlah di bawah kepada RewardHub dan muat naik resit anda.",
    accountName:
      "Nama Akaun",
    accountNumber:
      "Nombor Akaun",
    selected:
      "Dipilih",
    paymentNote:
      "Nota Bayaran (pilihan)",
    cancel:
      "Batal",
    uploading:
      "Sedang Memuat Naik...",
    submit:
      "Hantar",
  },
} as const;

function normalizeLanguage(
  value: string | null
): LanguageCode {
  return value === "zh" ||
    value === "ms"
    ? value
    : "en";
}

function normalizeDirection(
  value: unknown,
  netAmount = 0
): SettlementDirection {
  const direction =
    String(value || "")
      .trim()
      .toUpperCase()
      .replace(
        /[\s-]+/g,
        "_"
      );

  if (
    direction ===
      "MERCHANT_TO_REWARDHUB" ||
    direction ===
      "REWARDHUB_TO_MERCHANT" ||
    direction ===
      "NO_PAYMENT"
  ) {
    return direction;
  }

  if (netAmount > 0) {
    return "MERCHANT_TO_REWARDHUB";
  }

  if (netAmount < 0) {
    return "REWARDHUB_TO_MERCHANT";
  }

  return "NO_PAYMENT";
}

export default function MerchantSettlementPage() {
  const [
    language,
    setLanguage,
  ] =
    useState<LanguageCode>(
      "en"
    );

  const [data, setData] =
    useState<any>(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    requesting,
    setRequesting,
  ] =
    useState(false);

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("All");

  const [
    showPayment,
    setShowPayment,
  ] =
    useState(false);

  const [
    paymentNote,
    setPaymentNote,
  ] =
    useState("");

  const [
    receiptFile,
    setReceiptFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    submittingReceipt,
    setSubmittingReceipt,
  ] =
    useState(false);

  const t =
    useMemo(
      () =>
        translations[
          language
        ],
      [language]
    );

  useEffect(() => {
    setLanguage(
      normalizeLanguage(
        localStorage.getItem(
          LANGUAGE_STORAGE_KEY
        )
      )
    );

    function handleLanguageChange(
      event: Event
    ) {
      const customEvent =
        event as CustomEvent<{
          language?: string;
        }>;

      setLanguage(
        normalizeLanguage(
          customEvent.detail
            ?.language ||
            localStorage.getItem(
              LANGUAGE_STORAGE_KEY
            )
        )
      );
    }

    window.addEventListener(
      "rewardhub-language-change",
      handleLanguageChange as EventListener
    );

    window.addEventListener(
      "storage",
      handleLanguageChange as EventListener
    );

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
      merchant =
        JSON.parse(
          localStorage.getItem(
            "merchant"
          ) || "{}"
        );
    } catch {
      merchant = {};
    }

    const merchantId =
      merchant?.merchantId ||
      merchant?.MERCHANT_ID;

    if (!merchantId) {
      setLoading(false);
      return;
    }

    try {
      const res =
        await getMerchantSettlementSummary({
          merchantId,
        });

      const result =
        res?.data?.data ||
        res?.data ||
        res;

      setData(result);
    } catch (err) {
      console.error(
        "Failed to load settlement summary:",
        err
      );

      alert(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [language]);

  const history =
    Array.isArray(
      data?.history
    )
      ? data.history
      : [];

  const currentMonth =
    String(
      data?.currentMonth || ""
    );

  const currentMonthSettlement =
    history.find(
      (item: any) => {
        const itemStatus =
          String(
            item?.status || ""
          )
            .trim()
            .toUpperCase();

        const itemMonth =
          String(
            item?.month || ""
          ).slice(0, 7);

        return (
          itemMonth ===
            currentMonth &&
          [
            "PENDING",
            "SUBMITTED",
            "APPROVED",
            "PAID",
          ].includes(
            itemStatus
          )
        );
      }
    );

  const activeSettlement =
    history.find(
      (item: any) => {
        const itemStatus =
          String(
            item?.status || ""
          )
            .trim()
            .toUpperCase();

        const itemMonth =
          String(
            item?.month || ""
          ).slice(0, 7);

        return (
          itemMonth ===
            currentMonth &&
          [
            "PENDING",
            "SUBMITTED",
            "APPROVED",
          ].includes(
            itemStatus
          )
        );
      }
    );

  const currentMonthPaidSettlement =
    history.find(
      (item: any) =>
        String(
          item?.month || ""
        ).slice(0, 7) ===
          currentMonth &&
        String(
          item?.status || ""
        )
          .trim()
          .toUpperCase() ===
          "PAID"
    );

  const pendingSettlement =
    history.find(
      (item: any) => {
        const itemStatus =
          String(
            item?.status || ""
          )
            .trim()
            .toUpperCase();

        const itemMonth =
          String(
            item?.month || ""
          ).slice(0, 7);

        return (
          itemMonth ===
            currentMonth &&
          itemStatus ===
            "PENDING"
        );
      }
    );

  /*
   * IMPORTANT:
   * When a settlement already exists, use that exact settlement row
   * as the source of truth for direction and payable amount.
   * This prevents the page from falling back to older summary fields
   * such as availablePayable.
   */
  const currentMonthIsPaid =
    Boolean(
      currentMonthPaidSettlement
    ) &&
    !activeSettlement;

  const currentSettlementSource =
    activeSettlement ||
    data ||
    {};

  const currentNetAmount =
    currentMonthIsPaid
      ? 0
      : Number(
          currentSettlementSource
            ?.netAmount ??
            data?.netAmount ??
            0
        );

  const currentDirection =
    currentMonthIsPaid
      ? "NO_PAYMENT"
      : normalizeDirection(
          currentSettlementSource
            ?.settlementDirection ??
            data?.settlementDirection,
          currentNetAmount
        );

  const currentAmount =
    currentMonthIsPaid
      ? 0
      : Number(
          currentSettlementSource
            ?.amountPayable ??
            data?.amountPayable ??
            data?.currentAmountPayable ??
            data?.availablePayable ??
            Math.abs(
              currentNetAmount
            ) ??
            0
        );

  const merchantDue =
    currentMonthIsPaid
      ? 0
      : Number(
          currentSettlementSource
            ?.merchantDue ??
            data?.merchantDue ??
            0
        );

  const totalRewardCredits =
    currentMonthIsPaid
      ? 0
      : Number(
          currentSettlementSource
            ?.totalRewardCredits ??
            data?.totalRewardCredits ??
            0
        );

  const totalVoucherDiscount =
    currentMonthIsPaid
      ? 0
      : Number(
          currentSettlementSource
            ?.totalVoucherDiscount ??
            data?.totalVoucherDiscount ??
            0
        );

  const rewardHubDue =
    currentMonthIsPaid
      ? 0
      : Number(
          currentSettlementSource
            ?.rewardHubDue ??
            data?.rewardHubDue ??
            (
              totalRewardCredits +
              totalVoucherDiscount
            )
        );

  const totalSales =
    Number(
      data?.totalSales || 0
    );

  const todayDate =
    new Date().getDate();

  const canPaySettlement =
    todayDate >= 1 &&
    todayDate <= 10;

  const pendingDirection =
    pendingSettlement
      ? normalizeDirection(
          pendingSettlement
            ?.settlementDirection,
          Number(
            pendingSettlement
              ?.netAmount ?? 0
          )
        )
      : null;

  const hasActiveSettlement =
    Boolean(
      currentMonthSettlement
    );

  async function handleRequestSettlement() {
    let merchant: any = {};

    try {
      merchant =
        JSON.parse(
          localStorage.getItem(
            "merchant"
          ) || "{}"
        );
    } catch {
      merchant = {};
    }

    const merchantId =
      merchant?.merchantId ||
      merchant?.MERCHANT_ID;

    if (!merchantId) {
      alert(
        t.merchantNotFound
      );
      return;
    }

    try {
      setRequesting(true);

      const res =
        await requestMerchantSettlement({
          merchantId,
        });

      const result =
        res?.data?.data ||
        res?.data ||
        res;

      const direction =
        normalizeDirection(
          result
            ?.settlementDirection,
          Number(
            result?.netAmount ||
              0
          )
        );

      alert(
        `${t.requestSuccess}\n${directionLabel(
          direction,
          t
        )}: RM${money(
          result?.amountPayable ||
            0
        )}`
      );

      await load();
    } catch (err: any) {
      alert(
        err?.message ||
          t.requestFailed
      );
    } finally {
      setRequesting(
        false
      );
    }
  }

  function fileToBase64(
    file: File
  ): Promise<string> {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onload =
          () => {
            const result =
              String(
                reader.result ||
                  ""
              );

            resolve(
              result.split(
                ","
              )[1]
            );
          };

        reader.onerror =
          reject;

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  async function handleUploadReceipt() {
    if (!pendingSettlement) {
      alert(
        t.noPendingSettlement
      );
      return;
    }

    if (
      pendingDirection !==
      "MERCHANT_TO_REWARDHUB"
    ) {
      alert(
        pendingDirection ===
          "REWARDHUB_TO_MERCHANT"
          ? t.waitingRewardHubPayment
          : t.waitingAdminConfirmation
      );
      return;
    }

    if (!receiptFile) {
      alert(
        t.selectReceipt
      );
      return;
    }

    try {
      setSubmittingReceipt(
        true
      );

      const base64 =
        await fileToBase64(
          receiptFile
        );

      await uploadSettlementReceipt({
        settlementId:
          pendingSettlement
            .settlementId,
        base64,
        fileName:
          receiptFile.name,
        mimeType:
          receiptFile.type,
        paymentNote:
          paymentNote.trim(),
      });

      alert(
        t.receiptUploaded
      );

      setShowPayment(
        false
      );

      setReceiptFile(
        null
      );

      setPaymentNote("");

      await load();
    } catch (err: any) {
      alert(
        err?.message ||
          t.uploadFailed
      );
    } finally {
      setSubmittingReceipt(
        false
      );
    }
  }

  const filteredHistory =
    useMemo(() => {
      if (
        statusFilter ===
        "All"
      ) {
        return history;
      }

      return history.filter(
        (item: any) =>
          String(
            item?.status || ""
          )
            .trim()
            .toUpperCase() ===
          statusFilter
            .trim()
            .toUpperCase()
      );
    }, [
      history,
      statusFilter,
    ]);

  const pendingAmount =
    Number(
      data?.pendingAmount ||
        0
    );

  const paidAmount =
    Number(
      data?.paidAmount ||
        0
    );

  const lastSettlement =
    Number(
      data?.lastSettlement ||
        0
    );

  const labels = {
    amountPayable:
      t.amountPayable,
    totalSales:
      t.totalSales,
    cashback:
      t.cashback,
    marketingBudget:
      t.marketingBudget,
    rewardCredits:
      t.rewardCredits,
    voucherDiscount:
      t.voucherDiscount,
    direction:
      t.direction,
    paidAt:
      t.paidAt,
    view:
      t.view,
    bank:
      t.bank,
    pending:
      t.pending,
    submitted:
      t.submitted,
    approved:
      t.approved,
    paid:
      t.paid,
    rejected:
      t.rejected,
  };

  const currentDirectionTitle =
    directionLabel(
      currentDirection,
      t
    );

  const currentDirectionDescription =
    directionDescription(
      currentDirection,
      t
    );

  useEffect(() => {
    if (
      pendingDirection !==
      "MERCHANT_TO_REWARDHUB"
    ) {
      setShowPayment(false);
      setReceiptFile(null);
      setPaymentNote("");
    }
  }, [
    pendingDirection,
  ]);

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
                title={
                  t.pendingSettlement
                }
                value={`RM${money(
                  pendingAmount
                )}`}
              />

              <StatCard
                title={
                  t.paidSettlement
                }
                value={`RM${money(
                  paidAmount
                )}`}
              />

              <StatCard
                title={
                  t.lastSettlement
                }
                value={`RM${money(
                  lastSettlement
                )}`}
              />
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal">
                  {t.currentSettlement}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-black text-slate-950 sm:text-5xl">
                    RM{money(
                      currentAmount
                    )}
                  </h2>

                  <DirectionBadge
                    direction={
                      currentDirection
                    }
                    label={
                      currentDirectionTitle
                    }
                  />
                </div>

                <p className="mt-3 max-w-2xl text-[11px] font-bold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  {
                    currentDirectionDescription
                  }
                </p>

                <p className="mt-2 text-[10px] font-bold leading-5 text-slate-400 sm:text-xs">
                  {t.formula}
                </p>
              </div>

              {pendingSettlement ? (
                pendingDirection ===
                "MERCHANT_TO_REWARDHUB" ? (
                  <button
                    onClick={() =>
                      canPaySettlement &&
                      setShowPayment(
                        true
                      )
                    }
                    disabled={
                      !canPaySettlement
                    }
                    className="w-full rounded-xl bg-slate-950 px-5 py-3 text-xs font-black text-white disabled:opacity-40 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4 sm:text-sm"
                  >
                    {canPaySettlement
                      ? t.payUploadReceipt
                      : t.settlementWindow}
                  </button>
                ) : (
                  <div className="w-full rounded-xl bg-slate-100 px-5 py-3 text-center text-xs font-black text-slate-700 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4 sm:text-sm">
                    {pendingDirection ===
                    "REWARDHUB_TO_MERCHANT"
                      ? t.waitingRewardHubPayment
                      : t.waitingAdminConfirmation}
                  </div>
                )
              ) : hasActiveSettlement ? (
                <div className="w-full rounded-xl bg-slate-100 px-5 py-3 text-center text-xs font-black text-slate-700 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4 sm:text-sm">
                  {currentMonthIsPaid
                    ? t.settled
                    : currentDirection ===
                        "REWARDHUB_TO_MERCHANT"
                      ? t.waitingRewardHubPayment
                      : currentDirection ===
                          "NO_PAYMENT"
                        ? t.waitingAdminConfirmation
                        : activeSettlement?.status ||
                          t.waitingAdminConfirmation}
                </div>
              ) : (
                <button
                  onClick={
                    handleRequestSettlement
                  }
                  disabled={
                    requesting ||
                    totalSales <= 0 ||
                    !canPaySettlement
                  }
                  className="w-full rounded-xl bg-slate-950 px-5 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4 sm:text-sm"
                >
                  {requesting
                    ? t.requesting
                    : !canPaySettlement
                      ? t.settlementWindow
                      : totalSales <= 0
                        ? t.noSalesAvailable
                        : t.requestSettlement}
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MiniInfo
                title={
                  t.marketingBudget
                }
                value={`RM${money(
                  currentMonthIsPaid
                    ? 0
                    : currentSettlementSource
                        ?.totalMarketingBudget ??
                      data?.totalMarketingBudget ??
                      0
                )}`}
              />

              <MiniInfo
                title={
                  t.cashback
                }
                value={`RM${money(
                  currentMonthIsPaid
                    ? 0
                    : currentSettlementSource
                        ?.totalCashback ??
                      data?.totalCashback ??
                      0
                )}`}
              />

              <MiniInfo
                title={
                  t.rewardCredits
                }
                value={`RM${money(
                  totalRewardCredits
                )}`}
              />

              <MiniInfo
                title={
                  t.voucherDiscount
                }
                value={`RM${money(
                  totalVoucherDiscount
                )}`}
              />

              <MiniInfo
                title={
                  t.merchantDue
                }
                value={`RM${money(
                  merchantDue
                )}`}
              />

              <MiniInfo
                title={
                  t.rewardHubDue
                }
                value={`RM${money(
                  rewardHubDue
                )}`}
              />
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  {
                    t.settlementHistory
                  }
                </h2>

                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                  {
                    t.settlementHistoryDescription
                  }
                </p>
              </div>

              <select
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 outline-none sm:w-auto sm:rounded-2xl sm:px-5 sm:text-sm"
              >
                <option value="All">
                  {t.allStatus}
                </option>

                <option value="Pending">
                  {t.pending}
                </option>

                <option value="Submitted">
                  {t.submitted}
                </option>

                <option value="Approved">
                  {t.approved}
                </option>

                <option value="Paid">
                  {t.paid}
                </option>

                <option value="Rejected">
                  {t.rejected}
                </option>
              </select>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              {filteredHistory.map(
                (item: any) => (
                  <SettlementCard
                    key={
                      item.settlementId
                    }
                    item={item}
                    language={
                      language
                    }
                    labels={
                      labels
                    }
                    translations={
                      t
                    }
                  />
                )
              )}

              {!loading &&
                filteredHistory.length ===
                  0 && (
                  <EmptyState
                    text={
                      t.noSettlementRecords
                    }
                  />
                )}

              {loading && (
                <EmptyState
                  text={
                    t.loadingSettlements
                  }
                />
              )}
            </div>

            <div className="mt-6 hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1450px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-4">
                      {t.date}
                    </th>

                    <th className="px-4 py-4">
                      {t.settlementId}
                    </th>

                    <th className="px-4 py-4">
                      {t.month}
                    </th>

                    <th className="px-4 py-4">
                      {t.totalSales}
                    </th>

                    <th className="px-4 py-4">
                      {t.cashback}
                    </th>

                    <th className="px-4 py-4">
                      {
                        t.marketingBudget
                      }
                    </th>

                    <th className="px-4 py-4">
                      {t.rewardCredits}
                    </th>

                    <th className="px-4 py-4">
                      {t.voucherDiscount}
                    </th>

                    <th className="px-4 py-4">
                      {t.direction}
                    </th>

                    <th className="px-4 py-4">
                      {
                        t.amountPayable
                      }
                    </th>

                    <th className="px-4 py-4">
                      {t.bank}
                    </th>

                    <th className="px-4 py-4">
                      {t.status}
                    </th>

                    <th className="px-4 py-4">
                      {t.paidAt}
                    </th>

                    <th className="px-4 py-4">
  {t.receipt}
</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHistory.map(
                    (item: any) => {
                      const direction =
                        normalizeDirection(
                          item.settlementDirection,
                          Number(
                            item.netAmount ||
                              0
                          )
                        );

                      return (
                        <tr
                          key={
                            item.settlementId
                          }
                          className="border-b border-slate-100 text-sm font-bold text-slate-700"
                        >
                          <td className="px-4 py-5">
                            {formatDate(
                              item.createdAt,
                              language
                            )}
                          </td>

                          <td className="px-4 py-5 font-black text-slate-950">
                            {
                              item.settlementId
                            }
                          </td>

                          <td className="px-4 py-5">
                            {formatMonth(
                              item.month,
                              language
                            )}
                          </td>

                          <td className="px-4 py-5">
                            RM
                            {money(
                              item.totalSales
                            )}
                          </td>

                          <td className="px-4 py-5">
                            RM
                            {money(
                              item.totalCashback
                            )}
                          </td>

                          <td className="px-4 py-5">
                            RM
                            {money(
                              item.totalMarketingBudget
                            )}
                          </td>

                          <td className="px-4 py-5">
                            RM
                            {money(
                              item.totalRewardCredits
                            )}
                          </td>

                          <td className="px-4 py-5">
                            RM
                            {money(
                              item.totalVoucherDiscount
                            )}
                          </td>

                          <td className="px-4 py-5">
                            <DirectionBadge
                              direction={
                                direction
                              }
                              label={directionLabel(
                                direction,
                                t
                              )}
                              compact
                            />
                          </td>

                          <td className="px-4 py-5 font-black text-slate-950">
                            RM
                            {money(
                              item.amountPayable
                            )}
                          </td>

                          <td className="px-4 py-5">
                            {item.bankName ||
                              "-"}

                            {item.bankAccount
                              ? ` / ${item.bankAccount}`
                              : ""}
                          </td>

                          <td className="px-4 py-5">
                            <StatusBadge
                              status={
                                item.status
                              }
                              labels={
                                labels
                              }
                            />
                          </td>

                          <td className="px-4 py-5">
                            {formatDate(
                              item.paidAt,
                              language
                            )}
                          </td>

                          <td className="px-4 py-5">
                            {item.receiptUrl ? (
                              <a
                                href={
                                  item.receiptUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-black text-white transition hover:bg-slate-800"
                              >
                                {t.view}
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>

              {!loading &&
                filteredHistory.length ===
                  0 && (
                  <EmptyState
                    text={
                      t.noSettlementRecords
                    }
                  />
                )}

              {loading && (
                <EmptyState
                  text={
                    t.loadingSettlements
                  }
                />
              )}
            </div>
          </div>
        </section>
      </main>

      {showPayment &&
        pendingSettlement &&
        pendingDirection ===
          "MERCHANT_TO_REWARDHUB" && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 px-3 py-3 sm:items-center sm:px-4">
            <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  {
                    t.settlementPayment
                  }
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setShowPayment(
                      false
                    )
                  }
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 sm:hidden"
                  aria-label={
                    t.cancel
                  }
                >
                  ✕
                </button>
              </div>

              <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500 sm:mt-3 sm:text-sm sm:leading-6">
                {
                  t.paymentDescription
                }
              </p>

              <div className="mt-5 rounded-xl border border-slate-200 p-4 sm:mt-6 sm:rounded-2xl sm:p-5">
                <p className="text-[10px] font-black text-slate-500 sm:text-sm">
                  {
                    t.amountPayable
                  }
                </p>

                <p className="mt-1 text-3xl font-black text-slate-950 sm:mt-2 sm:text-4xl">
                  RM
                  {money(
                    pendingSettlement
                      ?.amountPayable ||
                      0
                  )}
                </p>

                <hr className="my-4 sm:my-5" />

                <BankDetail
                  label={t.bank}
                  value="Maybank"
                />

                <BankDetail
                  label={
                    t.accountName
                  }
                  value="RewardHub"
                />

                <BankDetail
                  label={
                    t.accountNumber
                  }
                  value="123456789012"
                />
              </div>

              <input
                type="file"
                accept="image/*"
                className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none sm:mt-6 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                onChange={(e) =>
                  setReceiptFile(
                    e.target
                      .files?.[0] ||
                      null
                  )
                }
              />

              {receiptFile && (
                <p className="mt-2 break-all text-[10px] font-bold text-emerald-700 sm:text-sm">
                  {t.selected}:{" "}
                  {
                    receiptFile.name
                  }
                </p>
              )}

              <textarea
                className="mt-4 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                placeholder={
                  t.paymentNote
                }
                value={
                  paymentNote
                }
                onChange={(e) =>
                  setPaymentNote(
                    e.target.value
                  )
                }
              />

              <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6">
                <button
                  className="rounded-xl border border-slate-200 py-3 text-xs font-black text-slate-950 sm:rounded-2xl sm:py-4 sm:text-sm"
                  onClick={() =>
                    setShowPayment(
                      false
                    )
                  }
                >
                  {t.cancel}
                </button>

                <button
                  className="rounded-xl bg-slate-950 py-3 text-xs font-black text-white disabled:opacity-50 sm:rounded-2xl sm:py-4 sm:text-sm"
                  disabled={
                    submittingReceipt
                  }
                  onClick={
                    handleUploadReceipt
                  }
                >
                  {submittingReceipt
                    ? t.uploading
                    : t.submit}
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
  translations: t,
}: {
  item: any;
  language:
    LanguageCode;
  labels: {
    amountPayable: string;
    totalSales: string;
    cashback: string;
    marketingBudget: string;
    rewardCredits: string;
    voucherDiscount: string;
    direction: string;
    paidAt: string;
    view: string;
    bank: string;
    pending: string;
    submitted: string;
    approved: string;
    paid: string;
    rejected: string;
  };
  translations:
    (typeof translations)[LanguageCode];
}) {
  const direction =
    normalizeDirection(
      item.settlementDirection,
      Number(
        item.netAmount || 0
      )
    );

  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">
            {formatMonth(
              item.month,
              language
            )}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge
              status={
                item.status
              }
              labels={
                labels
              }
            />

            <DirectionBadge
              direction={
                direction
              }
              label={directionLabel(
                direction,
                t
              )}
              compact
            />
          </div>

          <p className="mt-2 truncate text-[9px] font-bold text-slate-400">
            {
              item.settlementId
            }
          </p>

          <p className="mt-1 text-[9px] font-medium text-slate-400">
            {formatDate(
              item.createdAt,
              language
            )}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
            {
              labels.amountPayable
            }
          </p>

          <p className="mt-1 text-lg font-black text-slate-950">
            RM
            {money(
              item.amountPayable
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniInfo
          title={
            labels.totalSales
          }
          value={`RM${money(
            item.totalSales
          )}`}
        />

        <MiniInfo
          title={
            labels.cashback
          }
          value={`RM${money(
            item.totalCashback
          )}`}
        />

        <MiniInfo
          title={
            labels.marketingBudget
          }
          value={`RM${money(
            item.totalMarketingBudget
          )}`}
        />

        <MiniInfo
          title={
            labels.rewardCredits
          }
          value={`RM${money(
            item.totalRewardCredits
          )}`}
        />

        <MiniInfo
          title={
            labels.voucherDiscount
          }
          value={`RM${money(
            item.totalVoucherDiscount
          )}`}
        />
      </div>

      <div className="mt-3 rounded-xl bg-white p-3">
        <p className="text-[9px] font-black text-slate-400">
          {labels.bank}
        </p>

        <p className="mt-1 break-words text-xs font-black text-slate-950">
          {item.bankName ||
            "-"}

          {item.bankAccount
            ? ` / ${item.bankAccount}`
            : ""}
        </p>
      </div>

      <div className="mt-3 rounded-xl bg-white p-3">
        <p className="text-[9px] font-black text-slate-400">
          {labels.paidAt}
        </p>

        <p className="mt-1 break-words text-xs font-black text-slate-950">
          {formatDate(
            item.paidAt,
            language
          )}
        </p>
      </div>

      {item.receiptUrl ? (
        <a
          href={
            item.receiptUrl
          }
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white"
        >
          {labels.view}
        </a>
      ) : null}
    </div>
  );
}

function DirectionBadge({
  direction,
  label,
  compact = false,
}: {
  direction:
    SettlementDirection;
  label: string;
  compact?: boolean;
}) {
  const style =
    direction ===
    "REWARDHUB_TO_MERCHANT"
      ? "bg-blue-100 text-blue-700"
      : direction ===
          "NO_PAYMENT"
        ? "bg-slate-100 text-slate-700"
        : "bg-amber-100 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full font-black ${style} ${
        compact
          ? "px-2.5 py-1 text-[9px] sm:text-[10px]"
          : "px-3 py-1.5 text-[10px] sm:px-4 sm:text-xs"
      }`}
    >
      {label}
    </span>
  );
}

function directionLabel(
  direction:
    SettlementDirection,
  t:
    (typeof translations)[LanguageCode]
) {
  if (
    direction ===
    "REWARDHUB_TO_MERCHANT"
  ) {
    return t.rewardHubPaysMerchant;
  }

  if (
    direction ===
    "NO_PAYMENT"
  ) {
    return t.noPaymentRequired;
  }

  return t.merchantPaysRewardHub;
}

function directionDescription(
  direction:
    SettlementDirection,
  t:
    (typeof translations)[LanguageCode]
) {
  if (
    direction ===
    "REWARDHUB_TO_MERCHANT"
  ) {
    return t.rewardHubPaysDescription;
  }

  if (
    direction ===
    "NO_PAYMENT"
  ) {
    return t.noPaymentDescription;
  }

  return t.merchantPaysDescription;
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
    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
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
  const normalizedStatus =
    status ||
    "Pending";

  const style =
    normalizedStatus ===
    "Paid"
      ? "bg-emerald-100 text-emerald-700"
      : normalizedStatus ===
          "Approved"
        ? "bg-blue-100 text-blue-700"
        : normalizedStatus ===
            "Rejected"
          ? "bg-red-100 text-red-700"
          : normalizedStatus ===
              "Submitted"
            ? "bg-purple-100 text-purple-700"
            : "bg-amber-100 text-amber-700";

  const label =
    normalizedStatus ===
    "Paid"
      ? labels.paid
      : normalizedStatus ===
          "Approved"
        ? labels.approved
        : normalizedStatus ===
            "Rejected"
          ? labels.rejected
          : normalizedStatus ===
              "Submitted"
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

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:p-10 sm:text-sm">
      {text}
    </div>
  );
}

function money(
  value: any
) {
  return Number(
    value || 0
  ).toFixed(2);
}

function formatDate(
  date: any,
  language:
    LanguageCode
) {
  if (!date) {
    return "-";
  }

  return new Date(
    date
  ).toLocaleString(
    language === "zh"
      ? "zh-CN"
      : language === "ms"
        ? "ms-MY"
        : "en-GB",
    {
      timeZone:
        "Asia/Kuala_Lumpur",
      day:
        "2-digit",
      month:
        "short",
      year:
        "2-digit",
      hour:
        "2-digit",
      minute:
        "2-digit",
      hour12:
        true,
    }
  );
}

function formatMonth(
  value: any,
  language:
    LanguageCode
) {
  if (!value) {
    return "-";
  }

  const raw =
    String(value);

  const parts =
    raw.split("-");

  if (
    parts.length !== 2
  ) {
    return raw;
  }

  const year =
    Number(
      parts[0]
    );

  const month =
    Number(
      parts[1]
    );

  if (
    !Number.isFinite(
      year
    ) ||
    !Number.isFinite(
      month
    ) ||
    month < 1 ||
    month > 12
  ) {
    return raw;
  }

  return new Date(
    year,
    month - 1,
    1
  ).toLocaleDateString(
    language === "zh"
      ? "zh-CN"
      : language === "ms"
        ? "ms-MY"
        : "en-GB",
    {
      month:
        "short",
      year:
        "numeric",
    }
  );
}