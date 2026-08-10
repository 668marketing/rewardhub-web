"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import MerchantNav from "@/components/layout/MerchantNav";
import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";

import { useLanguage } from "@/hooks/useLanguage";
import {
  cancelMerchantTerminalApplication,
  getMerchantTerminalApplication,
  submitMerchantTerminalApplication,
  uploadMerchantTerminalPaymentReceipt,
  type MerchantTerminalApplication,
  type MerchantTerminalPricing,
} from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

type TerminalPageData = {
  merchantId: string;
  businessName: string;
  pricing: MerchantTerminalPricing;
  canApply: boolean;
  activeApplication: MerchantTerminalApplication | null;
  applications: MerchantTerminalApplication[];
  applicationCount: number;
};

const terminalPayment = {
  bankName: "MAYBANK",
  accountName: "668 MARKETING ENTERPRISE",
  accountNumber: "888111888",
  qrImageUrl: "/rewardhub-bank-qr.png",
};

const pageText = {
  en: {
    back: "Back to Dashboard",
    eyebrow: "RewardHub Merchant Terminal",
    title: "Terminal Application",
    description:
      "Apply for a RewardHub terminal for member card tapping. The terminal will be shipped directly to your business. No installation is required.",
    firstTerminal: "First Terminal",
    replacementTerminal: "Replacement / Additional Terminal",
    firstTerminalDescription:
      "Your first approved terminal receives the special merchant price.",
    replacementDescription:
      "For damaged, lost or additional terminals after your first approved terminal.",
    machine: "Terminal",
    shipping: "Shipping",
    total: "Total",
    specialPrice: "First Terminal Special Price",
    standardPrice: "Replacement / Additional Price",
    applicationForm: "Application Details",
    applicationFormDescription:
      "Confirm the recipient and shipping information below.",
    contactName: "Recipient / Contact Name",
    contactNamePlaceholder: "Enter recipient name",
    phone: "Phone Number",
    phonePlaceholder: "e.g. 0123456789",
    shippingAddress: "Shipping Address",
    shippingAddressPlaceholder:
      "Enter the complete address where RewardHub should ship the terminal",
    reason: "Reason",
    reasonPlaceholder:
      "Example: terminal damaged, lost, or additional terminal required",
    reasonRequired:
      "Please provide a reason for a replacement or additional terminal.",
    contactRequired: "Please enter the recipient name.",
    phoneRequired: "Please enter the phone number.",
    addressRequired: "Please enter the shipping address.",
    submit: "Submit Terminal Application",
    submitting: "Submitting...",
    submitted: "Terminal application submitted successfully.",
    unableToSubmit: "Unable to submit terminal application.",
    unableToLoad: "Unable to load terminal application.",
    merchantSessionMissing:
      "Merchant session not found. Please log in again.",
    loading: "Loading terminal application...",
    currentApplication: "Current Application",
    currentApplicationDescription:
      "Your active application and shipping progress are shown here.",
    applicationId: "Application ID",
    applicationType: "Application Type",
    status: "Status",
    recipient: "Recipient",
    deliveryAddress: "Shipping Address",
    courier: "Courier",
    trackingNumber: "Tracking Number",
    submittedAt: "Submitted At",
    adminNote: "Admin Note",
    trackingPending:
      "Courier and tracking information will appear after RewardHub ships your terminal.",
    cancelApplication: "Cancel Application",
    cancelling: "Cancelling...",
    cancelConfirm:
      "Cancel this terminal application?",
    cancelled: "Terminal application cancelled.",
    unableToCancel: "Unable to cancel terminal application.",
    anotherApplicationBlocked:
      "You already have an active terminal application. A new application can be submitted after the current application is completed, rejected or cancelled.",
    history: "Application History",
    historyDescription:
      "Previous terminal applications are listed here.",
    noHistory: "No previous terminal applications.",
    firstApplication: "First Terminal",
    replacement: "Replacement",
    additional: "Additional Purchase",
    pending: "Pending",
    approved: "Approved",
    shipped: "Shipped",
    completed: "Completed",
    rejected: "Rejected",
    cancelledStatus: "Cancelled",
    policyTitle: "Terminal Policy",
    policy1:
      "Each merchant is entitled to one first-terminal special price only.",
    policy2:
      "First terminal: RM10 + RM10 shipping = RM20.",
    policy3:
      "Replacement or additional terminal: RM38 + RM10 shipping = RM48.",
    policy4:
      "The terminal is shipped directly to the merchant and does not require installation.",
    paymentTitle: "Terminal Payment",
    amountPayable: "Amount Payable",
    paymentStatus: "Payment Status",
    pendingPayment: "Pending Payment",
    paymentReview: "Payment Review",
    paid: "Paid",
    paymentRejected: "Payment Rejected",
    bankName: "Bank Name",
    accountName: "Account Name",
    accountNumber: "Account Number",
    copyBankAccount: "Copy Bank Account",
    bankAccountCopied: "Bank account copied.",
    copyManually: "Please copy the bank account manually:",
    scanToPay: "Scan to Pay",
    paymentInstruction:
      "Pay the exact amount shown above, then upload your payment receipt for verification.",
    uploadPaymentReceipt: "Upload Payment Receipt",
    chooseReceiptImage: "Choose Receipt Image",
    uploadingReceipt: "Uploading receipt...",
    uploadImageOnly: "Please upload an image receipt.",
    receiptMax5Mb: "Receipt image must not exceed 5MB.",
    unableToReadImage: "Unable to read the receipt image.",
    receiptSubmitted: "Payment receipt submitted successfully.",
    unableToUploadReceipt: "Unable to upload payment receipt.",
    receiptUnderReview:
      "Your receipt has been submitted and is waiting for RewardHub verification.",
    viewSubmittedReceipt: "View Submitted Receipt",
    paymentNote: "Payment Note (Optional)",
    paymentNotePlaceholder: "Optional note for RewardHub",
    refresh: "Refresh",
  },
  zh: {
    back: "返回主页",
    eyebrow: "RewardHub 商家感应机",
    title: "感应机申请",
    description:
      "申请 RewardHub 感应机，用于感应会员实体卡。感应机会直接邮寄到商家，无需安装。",
    firstTerminal: "首台感应机",
    replacementTerminal: "补购 / 额外感应机",
    firstTerminalDescription:
      "每个商家的第一台获批准感应机可享首次优惠价。",
    replacementDescription:
      "第一台获批准后，如损坏、遗失或需要额外机器，将使用补购价格。",
    machine: "感应机",
    shipping: "运费",
    total: "总额",
    specialPrice: "首台优惠价",
    standardPrice: "补购 / 额外机器价格",
    applicationForm: "申请资料",
    applicationFormDescription:
      "请确认以下收件人与邮寄资料。",
    contactName: "收件人 / 联系人姓名",
    contactNamePlaceholder: "输入收件人姓名",
    phone: "电话号码",
    phonePlaceholder: "例如：0123456789",
    shippingAddress: "邮寄地址",
    shippingAddressPlaceholder:
      "输入 RewardHub 邮寄感应机的完整地址",
    reason: "申请原因",
    reasonPlaceholder:
      "例如：感应机损坏、遗失或需要额外一台",
    reasonRequired:
      "补购或额外申请感应机时必须填写原因。",
    contactRequired: "请输入收件人姓名。",
    phoneRequired: "请输入电话号码。",
    addressRequired: "请输入邮寄地址。",
    submit: "提交感应机申请",
    submitting: "正在提交……",
    submitted: "感应机申请已成功提交。",
    unableToSubmit: "无法提交感应机申请。",
    unableToLoad: "无法加载感应机申请。",
    merchantSessionMissing:
      "找不到商家登录资料，请重新登录。",
    loading: "正在加载感应机申请……",
    currentApplication: "当前申请",
    currentApplicationDescription:
      "这里会显示当前申请及邮寄进度。",
    applicationId: "申请编号",
    applicationType: "申请类型",
    status: "状态",
    recipient: "收件人",
    deliveryAddress: "邮寄地址",
    courier: "快递公司",
    trackingNumber: "物流追踪号码",
    submittedAt: "提交时间",
    adminNote: "管理员备注",
    trackingPending:
      "RewardHub 寄出感应机后，这里会显示快递公司和物流追踪号码。",
    cancelApplication: "取消申请",
    cancelling: "正在取消……",
    cancelConfirm:
      "确定取消这份感应机申请吗？",
    cancelled: "感应机申请已取消。",
    unableToCancel: "无法取消感应机申请。",
    anotherApplicationBlocked:
      "你目前已有一份进行中的感应机申请。当前申请完成、被拒绝或取消后才能再次申请。",
    history: "申请记录",
    historyDescription:
      "这里会显示之前的感应机申请记录。",
    noHistory: "目前没有之前的感应机申请。",
    firstApplication: "首台感应机",
    replacement: "补购感应机",
    additional: "额外购买",
    pending: "处理中",
    approved: "已批准",
    shipped: "已寄出",
    completed: "已完成",
    rejected: "已拒绝",
    cancelledStatus: "已取消",
    policyTitle: "感应机规则",
    policy1:
      "每个商家只可享有一次首台感应机优惠价。",
    policy2:
      "首台感应机：RM10 + RM10 运费 = RM20。",
    policy3:
      "补购或额外感应机：RM38 + RM10 运费 = RM48。",
    policy4:
      "感应机会直接邮寄给商家，无需安装。",
    paymentTitle: "感应机付款",
    amountPayable: "应付金额",
    paymentStatus: "付款状态",
    pendingPayment: "等待付款",
    paymentReview: "付款审核中",
    paid: "已付款",
    paymentRejected: "付款被拒绝",
    bankName: "银行名称",
    accountName: "账户名称",
    accountNumber: "银行账号",
    copyBankAccount: "复制银行账号",
    bankAccountCopied: "银行账号已复制。",
    copyManually: "请手动复制银行账号：",
    scanToPay: "扫码付款",
    paymentInstruction:
      "请支付上方显示的准确金额，然后上传付款收据给 RewardHub 审核。",
    uploadPaymentReceipt: "上传付款收据",
    chooseReceiptImage: "选择收据图片",
    uploadingReceipt: "正在上传收据……",
    uploadImageOnly: "请上传图片格式的付款收据。",
    receiptMax5Mb: "收据图片不可超过 5MB。",
    unableToReadImage: "无法读取收据图片。",
    receiptSubmitted: "付款收据已成功提交。",
    unableToUploadReceipt: "无法上传付款收据。",
    receiptUnderReview:
      "你的收据已经提交，正在等待 RewardHub 审核付款。",
    viewSubmittedReceipt: "查看已提交收据",
    paymentNote: "付款备注（选填）",
    paymentNotePlaceholder: "可填写给 RewardHub 的备注",
    refresh: "刷新",
  },
  ms: {
    back: "Kembali ke Papan Pemuka",
    eyebrow: "Terminal Peniaga RewardHub",
    title: "Permohonan Terminal",
    description:
      "Mohon terminal RewardHub untuk sentuhan kad ahli. Terminal akan dihantar terus kepada perniagaan anda dan tidak memerlukan pemasangan.",
    firstTerminal: "Terminal Pertama",
    replacementTerminal: "Terminal Gantian / Tambahan",
    firstTerminalDescription:
      "Terminal pertama yang diluluskan menikmati harga khas peniaga.",
    replacementDescription:
      "Selepas terminal pertama diluluskan, terminal rosak, hilang atau tambahan akan menggunakan harga pembelian seterusnya.",
    machine: "Terminal",
    shipping: "Penghantaran",
    total: "Jumlah",
    specialPrice: "Harga Khas Terminal Pertama",
    standardPrice: "Harga Gantian / Tambahan",
    applicationForm: "Maklumat Permohonan",
    applicationFormDescription:
      "Sahkan maklumat penerima dan penghantaran di bawah.",
    contactName: "Nama Penerima / Orang Dihubungi",
    contactNamePlaceholder: "Masukkan nama penerima",
    phone: "Nombor Telefon",
    phonePlaceholder: "cth. 0123456789",
    shippingAddress: "Alamat Penghantaran",
    shippingAddressPlaceholder:
      "Masukkan alamat lengkap untuk penghantaran terminal RewardHub",
    reason: "Sebab",
    reasonPlaceholder:
      "Contoh: terminal rosak, hilang atau perlukan terminal tambahan",
    reasonRequired:
      "Sila nyatakan sebab untuk terminal gantian atau tambahan.",
    contactRequired: "Sila masukkan nama penerima.",
    phoneRequired: "Sila masukkan nombor telefon.",
    addressRequired: "Sila masukkan alamat penghantaran.",
    submit: "Hantar Permohonan Terminal",
    submitting: "Menghantar...",
    submitted: "Permohonan terminal berjaya dihantar.",
    unableToSubmit: "Tidak dapat menghantar permohonan terminal.",
    unableToLoad: "Tidak dapat memuatkan permohonan terminal.",
    merchantSessionMissing:
      "Sesi peniaga tidak dijumpai. Sila log masuk semula.",
    loading: "Memuatkan permohonan terminal...",
    currentApplication: "Permohonan Semasa",
    currentApplicationDescription:
      "Permohonan aktif dan kemajuan penghantaran dipaparkan di sini.",
    applicationId: "ID Permohonan",
    applicationType: "Jenis Permohonan",
    status: "Status",
    recipient: "Penerima",
    deliveryAddress: "Alamat Penghantaran",
    courier: "Kurier",
    trackingNumber: "Nombor Penjejakan",
    submittedAt: "Dihantar Pada",
    adminNote: "Nota Admin",
    trackingPending:
      "Maklumat kurier dan penjejakan akan dipaparkan selepas RewardHub menghantar terminal.",
    cancelApplication: "Batalkan Permohonan",
    cancelling: "Membatalkan...",
    cancelConfirm:
      "Batalkan permohonan terminal ini?",
    cancelled: "Permohonan terminal telah dibatalkan.",
    unableToCancel: "Tidak dapat membatalkan permohonan terminal.",
    anotherApplicationBlocked:
      "Anda sudah mempunyai permohonan terminal yang aktif. Permohonan baharu boleh dibuat selepas permohonan semasa selesai, ditolak atau dibatalkan.",
    history: "Sejarah Permohonan",
    historyDescription:
      "Permohonan terminal terdahulu dipaparkan di sini.",
    noHistory: "Tiada permohonan terminal terdahulu.",
    firstApplication: "Terminal Pertama",
    replacement: "Terminal Gantian",
    additional: "Pembelian Tambahan",
    pending: "Menunggu",
    approved: "Diluluskan",
    shipped: "Dihantar",
    completed: "Selesai",
    rejected: "Ditolak",
    cancelledStatus: "Dibatalkan",
    policyTitle: "Polisi Terminal",
    policy1:
      "Setiap peniaga hanya layak menerima harga khas terminal pertama sekali.",
    policy2:
      "Terminal pertama: RM10 + RM10 penghantaran = RM20.",
    policy3:
      "Terminal gantian atau tambahan: RM38 + RM10 penghantaran = RM48.",
    policy4:
      "Terminal dihantar terus kepada peniaga dan tidak memerlukan pemasangan.",
    paymentTitle: "Bayaran Terminal",
    amountPayable: "Jumlah Perlu Dibayar",
    paymentStatus: "Status Bayaran",
    pendingPayment: "Menunggu Bayaran",
    paymentReview: "Semakan Bayaran",
    paid: "Dibayar",
    paymentRejected: "Bayaran Ditolak",
    bankName: "Nama Bank",
    accountName: "Nama Akaun",
    accountNumber: "Nombor Akaun",
    copyBankAccount: "Salin Nombor Akaun",
    bankAccountCopied: "Nombor akaun telah disalin.",
    copyManually: "Sila salin nombor akaun secara manual:",
    scanToPay: "Imbas untuk Bayar",
    paymentInstruction:
      "Bayar jumlah tepat yang dipaparkan di atas, kemudian muat naik resit pembayaran untuk semakan.",
    uploadPaymentReceipt: "Muat Naik Resit Bayaran",
    chooseReceiptImage: "Pilih Gambar Resit",
    uploadingReceipt: "Memuat naik resit...",
    uploadImageOnly: "Sila muat naik resit dalam format gambar.",
    receiptMax5Mb: "Gambar resit tidak boleh melebihi 5MB.",
    unableToReadImage: "Tidak dapat membaca gambar resit.",
    receiptSubmitted: "Resit pembayaran berjaya dihantar.",
    unableToUploadReceipt: "Tidak dapat memuat naik resit pembayaran.",
    receiptUnderReview:
      "Resit anda telah dihantar dan sedang menunggu pengesahan RewardHub.",
    viewSubmittedReceipt: "Lihat Resit Dihantar",
    paymentNote: "Nota Bayaran (Pilihan)",
    paymentNotePlaceholder: "Nota pilihan untuk RewardHub",
    refresh: "Muat Semula",
  },
} as const;

function unwrapData(result: any): any {
  return (
    result?.data?.data ??
    result?.data ??
    result?.result ??
    result ??
    {}
  );
}

function readMerchantFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw =
      window.localStorage.getItem(
        "merchant"
      );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return (
      parsed?.merchant ??
      parsed?.data ??
      parsed
    );
  } catch {
    return null;
  }
}

function formatMoney(value: number) {
  return `RM${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function statusClass(status: string) {
  const normalized =
    String(status || "")
      .trim()
      .toUpperCase();

  if (normalized === "APPROVED") {
    return "bg-blue-100 text-blue-700";
  }

  if (normalized === "SHIPPED") {
    return "bg-violet-100 text-violet-700";
  }

  if (normalized === "COMPLETED") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalized === "REJECTED") {
    return "bg-red-100 text-red-700";
  }

  if (normalized === "CANCELLED") {
    return "bg-slate-200 text-slate-700";
  }

  return "bg-amber-100 text-amber-700";
}

export default function MerchantTerminalPage() {
  const { language } = useLanguage();

  const lang: LanguageCode =
    language === "zh" ||
    language === "ms"
      ? language
      : "en";

  const copy = pageText[lang];

  const [merchantId, setMerchantId] =
    useState("");

  const [data, setData] =
    useState<TerminalPageData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [cancelling, setCancelling] =
    useState(false);

  const [
    uploadingReceipt,
    setUploadingReceipt,
  ] = useState(false);

  const [paymentNote, setPaymentNote] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [contactName, setContactName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [
    shippingAddress,
    setShippingAddress,
  ] = useState("");

  const [reason, setReason] =
    useState("");

  const loadApplication =
    useCallback(async (
      resolvedMerchantId?: string
    ) => {
      const id =
        resolvedMerchantId ||
        merchantId;

      if (!id) {
        setLoading(false);
        setError(
          copy.merchantSessionMissing
        );
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result =
          await getMerchantTerminalApplication(
            {
              merchantId: id,
            }
          );

        const payload =
          unwrapData(
            result
          ) as TerminalPageData;

        setData(payload);

        const stored =
          readMerchantFromStorage();

        setContactName(
          (
            payload?.activeApplication
              ?.contactName ||
            stored?.ownerName ||
            stored?.OWNER_NAME ||
            stored?.displayName ||
            stored?.businessName ||
            ""
          ).toString()
        );

        setPhone(
          (
            payload?.activeApplication
              ?.phone ||
            stored?.ownerPhone ||
            stored?.phone ||
            stored?.PHONE ||
            ""
          ).toString()
        );

        setShippingAddress(
          (
            payload?.activeApplication
              ?.shippingAddress ||
            stored?.address ||
            stored?.ADDRESS ||
            ""
          ).toString()
        );
      } catch (err: any) {
        setError(
          err?.message ||
          copy.unableToLoad
        );
      } finally {
        setLoading(false);
      }
    }, [merchantId, copy]);

  useEffect(() => {
    const stored =
      readMerchantFromStorage();

    const id = String(
      stored?.merchantId ??
        stored?.MERCHANT_ID ??
        stored?.id ??
        ""
    ).trim();

    setMerchantId(id);

    if (id) {
      void loadApplication(id);
    } else {
      setLoading(false);
      setError(
        copy.merchantSessionMissing
      );
    }
  }, []);

  const pricing =
    data?.pricing ?? {
      applicationType:
        "FIRST_APPLICATION",
      machinePrice: 10,
      shippingFee: 10,
      totalAmount: 20,
      isFirstTerminal: true,
    };

  const activeApplication =
    data?.activeApplication ??
    null;

  const isFirstTerminal =
    Boolean(
      pricing.isFirstTerminal
    );

  const history =
    useMemo(() => {
      const list =
        data?.applications || [];

      if (!activeApplication) {
        return list;
      }

      return list.filter(
        (item) =>
          item.applicationId !==
          activeApplication.applicationId
      );
    }, [
      data?.applications,
      activeApplication,
    ]);

  function applicationTypeLabel(
    type: string
  ) {
    const normalized =
      String(type || "")
        .trim()
        .toUpperCase();

    if (
      normalized === "REPLACEMENT"
    ) {
      return copy.replacement;
    }

    if (
      normalized ===
      "ADDITIONAL_PURCHASE"
    ) {
      return copy.additional;
    }

    return copy.firstApplication;
  }

  function statusLabel(
    status: string
  ) {
    const normalized =
      String(status || "")
        .trim()
        .toUpperCase();

    if (
      normalized === "APPROVED"
    ) {
      return copy.approved;
    }

    if (
      normalized === "SHIPPED"
    ) {
      return copy.shipped;
    }

    if (
      normalized === "COMPLETED"
    ) {
      return copy.completed;
    }

    if (
      normalized === "REJECTED"
    ) {
      return copy.rejected;
    }

    if (
      normalized === "CANCELLED"
    ) {
      return copy.cancelledStatus;
    }

    return copy.pending;
  }

  function paymentStatusLabel(
    status: string
  ) {
    const normalized =
      String(status || "")
        .trim()
        .toUpperCase();

    if (
      normalized === "PAYMENT REVIEW" ||
      normalized === "SUBMITTED"
    ) {
      return copy.paymentReview;
    }

    if (normalized === "PAID") {
      return copy.paid;
    }

    if (
      normalized === "REJECTED" ||
      normalized === "PAYMENT REJECTED"
    ) {
      return copy.paymentRejected;
    }

    return copy.pendingPayment;
  }

  function fileToBase64(file: File) {
    return new Promise<string>(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          const result = String(
            reader.result || ""
          );

          resolve(
            result.includes(",")
              ? result.split(",")[1]
              : result
          );
        };

        reader.onerror = () => {
          reject(
            new Error(
              copy.unableToReadImage
            )
          );
        };

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  async function handleReceiptUpload(
    file: File
  ) {
    if (
      !merchantId ||
      !activeApplication
    ) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        copy.uploadImageOnly
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        copy.receiptMax5Mb
      );
      return;
    }

    try {
      setUploadingReceipt(
        true
      );
      setError("");
      setSuccess("");

      const base64 =
        await fileToBase64(
          file
        );

      await uploadMerchantTerminalPaymentReceipt(
        {
          merchantId,
          applicationId:
            activeApplication.applicationId,
          fileName:
            file.name,
          mimeType:
            file.type,
          base64,
          paymentNote:
            paymentNote.trim(),
        }
      );

      setSuccess(
        copy.receiptSubmitted
      );
      setPaymentNote("");

      await loadApplication(
        merchantId
      );
    } catch (err: any) {
      setError(
        err?.message ||
        copy.unableToUploadReceipt
      );
    } finally {
      setUploadingReceipt(
        false
      );
    }
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanContactName =
      contactName.trim();

    const cleanPhone =
      phone.trim();

    const cleanAddress =
      shippingAddress.trim();

    const cleanReason =
      reason.trim();

    if (!merchantId) {
      setError(
        copy.merchantSessionMissing
      );
      return;
    }

    if (!cleanContactName) {
      setError(
        copy.contactRequired
      );
      return;
    }

    if (!cleanPhone) {
      setError(
        copy.phoneRequired
      );
      return;
    }

    if (!cleanAddress) {
      setError(
        copy.addressRequired
      );
      return;
    }

    if (
      !isFirstTerminal &&
      !cleanReason
    ) {
      setError(
        copy.reasonRequired
      );
      return;
    }

    try {
      setSubmitting(true);

      await submitMerchantTerminalApplication(
        {
          merchantId,
          contactName:
            cleanContactName,
          phone: cleanPhone,
          shippingAddress:
            cleanAddress,
          reason: cleanReason,
        }
      );

      setSuccess(copy.submitted);
      setReason("");

      await loadApplication(
        merchantId
      );
    } catch (err: any) {
      setError(
        err?.message ||
        copy.unableToSubmit
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (
      !merchantId ||
      !activeApplication
    ) {
      return;
    }

    if (
      !window.confirm(
        copy.cancelConfirm
      )
    ) {
      return;
    }

    try {
      setCancelling(true);
      setError("");
      setSuccess("");

      await cancelMerchantTerminalApplication(
        {
          merchantId,
          applicationId:
            activeApplication.applicationId,
        }
      );

      setSuccess(copy.cancelled);

      await loadApplication(
        merchantId
      );
    } catch (err: any) {
      setError(
        err?.message ||
        copy.unableToCancel
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-12 pb-32 text-center text-sm font-black text-slate-500">
        {copy.loading}
      </main>
    );
  }

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f2fe,transparent_32%),#f8fafc] px-4 py-5 pb-32 sm:px-6 sm:py-8 md:px-8 xl:px-12">
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/merchant/dashboard"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm transition hover:bg-slate-50 sm:px-5 sm:py-3 sm:text-sm"
          >
            ← {copy.back}
          </Link>

          <button
            type="button"
            onClick={() =>
              void loadApplication(
                merchantId
              )
            }
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:px-5 sm:py-3 sm:text-sm"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />
            {copy.refresh}
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl sm:mt-6 sm:rounded-[2.5rem]">
          <div className="grid gap-7 p-6 sm:p-8 md:grid-cols-[1.4fr_0.8fr] md:p-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300 sm:text-xs">
                {copy.eyebrow}
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                {copy.title}
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300 sm:text-base">
                {copy.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black">
                  {isFirstTerminal
                    ? copy.firstTerminal
                    : copy.replacementTerminal}
                </span>

                <span className="rounded-full bg-cyan-400/15 px-4 py-2 text-xs font-black text-cyan-200">
                  {isFirstTerminal
                    ? copy.specialPrice
                    : copy.standardPrice}
                </span>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                {isFirstTerminal
                  ? copy.firstTerminal
                  : copy.replacementTerminal}
              </p>

              <div className="mt-5 space-y-3">
                <PriceRow
                  label={copy.machine}
                  value={formatMoney(
                    pricing.machinePrice
                  )}
                />

                <PriceRow
                  label={copy.shipping}
                  value={formatMoney(
                    pricing.shippingFee
                  )}
                />

                <div className="border-t border-white/15 pt-4">
                  <PriceRow
                    label={copy.total}
                    value={formatMoney(
                      pricing.totalAmount
                    )}
                    strong
                  />
                </div>
              </div>

              <p className="mt-5 text-xs font-semibold leading-5 text-slate-300">
                {isFirstTerminal
                  ? copy.firstTerminalDescription
                  : copy.replacementDescription}
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {success}
          </div>
        ) : null}

        {activeApplication ? (
          <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {copy.currentApplication}
                </p>

                <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
                  {
                    activeApplication.applicationId
                  }
                </h2>

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {
                    copy.currentApplicationDescription
                  }
                </p>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-xs font-black ${statusClass(
                  activeApplication.status
                )}`}
              >
                {statusLabel(
                  activeApplication.status
                )}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard
                label={
                  copy.applicationType
                }
                value={applicationTypeLabel(
                  activeApplication.applicationType
                )}
              />

              <InfoCard
                label={copy.recipient}
                value={
                  activeApplication.contactName
                }
              />

              <InfoCard
                label={copy.phone}
                value={
                  activeApplication.phone
                }
              />

              <InfoCard
                label={
                  copy.deliveryAddress
                }
                value={
                  activeApplication.shippingAddress
                }
              />

              <InfoCard
                label={copy.total}
                value={formatMoney(
                  activeApplication.totalAmount
                )}
              />

              <InfoCard
                label={
                  copy.submittedAt
                }
                value={formatDate(
                  activeApplication.createdAt
                )}
              />
            </div>

            <TerminalPaymentCard
              application={
                activeApplication
              }
              copy={copy}
              paymentNote={
                paymentNote
              }
              setPaymentNote={
                setPaymentNote
              }
              uploading={
                uploadingReceipt
              }
              onUpload={
                handleReceiptUpload
              }
              paymentStatusLabel={
                paymentStatusLabel
              }
            />

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                {String(
                  activeApplication.status
                )
                  .toUpperCase() ===
                "SHIPPED" ? (
                  <Truck className="h-5 w-5 text-violet-600" />
                ) : (
                  <PackageCheck className="h-5 w-5 text-slate-700" />
                )}

                <p className="font-black text-slate-950">
                  {copy.shipping}
                </p>
              </div>

              {activeApplication.courier ||
              activeApplication.trackingNumber ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InfoCard
                    label={copy.courier}
                    value={
                      activeApplication.courier ||
                      "-"
                    }
                    compact
                  />

                  <InfoCard
                    label={
                      copy.trackingNumber
                    }
                    value={
                      activeApplication.trackingNumber ||
                      "-"
                    }
                    compact
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                  {copy.trackingPending}
                </p>
              )}
            </div>

            {activeApplication.adminNote ? (
              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {copy.adminNote}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  {
                    activeApplication.adminNote
                  }
                </p>
              </div>
            ) : null}

            {String(
              activeApplication.status
            )
              .trim()
              .toUpperCase() ===
            "PENDING" ? (
              <button
                type="button"
                onClick={
                  handleCancel
                }
                disabled={
                  cancelling
                }
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50 sm:w-auto"
              >
                <XCircle className="h-4 w-4" />
                {cancelling
                  ? copy.cancelling
                  : copy.cancelApplication}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.72fr]">
            <form
              onSubmit={
                handleSubmit
              }
              className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {
                  copy.applicationForm
                }
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {isFirstTerminal
                  ? copy.firstTerminal
                  : copy.replacementTerminal}
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {
                  copy.applicationFormDescription
                }
              </p>

              <div className="mt-6 space-y-5">
                <Field
                  label={
                    copy.contactName
                  }
                >
                  <input
                    value={
                      contactName
                    }
                    onChange={(event) =>
                      setContactName(
                        event.target.value
                      )
                    }
                    placeholder={
                      copy.contactNamePlaceholder
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </Field>

                <Field
                  label={copy.phone}
                >
                  <input
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                      )
                    }
                    inputMode="tel"
                    placeholder={
                      copy.phonePlaceholder
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </Field>

                <Field
                  label={
                    copy.shippingAddress
                  }
                >
                  <textarea
                    value={
                      shippingAddress
                    }
                    onChange={(event) =>
                      setShippingAddress(
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder={
                      copy.shippingAddressPlaceholder
                    }
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold leading-6 text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </Field>

                {!isFirstTerminal ? (
                  <Field
                    label={
                      copy.reason
                    }
                  >
                    <textarea
                      value={reason}
                      onChange={(
                        event
                      ) =>
                        setReason(
                          event.target
                            .value
                        )
                      }
                      rows={3}
                      placeholder={
                        copy.reasonPlaceholder
                      }
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold leading-6 text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
                    />
                  </Field>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-5 w-5" />
                {submitting
                  ? copy.submitting
                  : copy.submit}
              </button>
            </form>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-2xl text-white">
                📟
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-950">
                {copy.policyTitle}
              </h2>

              <div className="mt-5 space-y-4">
                {[
                  copy.policy1,
                  copy.policy2,
                  copy.policy3,
                  copy.policy4,
                ].map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={item}
                      className="flex gap-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-700">
                        {index + 1}
                      </div>
                      <p className="pt-0.5 text-sm font-semibold leading-6 text-slate-600">
                        {item}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {data &&
        !data.canApply &&
        !activeApplication ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold leading-6 text-amber-800">
            {
              copy.anotherApplicationBlocked
            }
          </div>
        ) : null}

        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-slate-500" />
            <div>
              <h2 className="text-xl font-black text-slate-950">
                {copy.history}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {
                  copy.historyDescription
                }
              </p>
            </div>
          </div>

          {history.length ? (
            <div className="mt-5 space-y-3">
              {history.map(
                (item) => (
                  <div
                    key={
                      item.applicationId
                    }
                    className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {
                            item.applicationId
                          }
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {applicationTypeLabel(
                            item.applicationType
                          )}{" "}
                          •{" "}
                          {formatDate(
                            item.createdAt
                          )}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-black ${statusClass(
                          item.status
                        )}`}
                      >
                        {statusLabel(
                          item.status
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <MiniValue
                        label={
                          copy.machine
                        }
                        value={formatMoney(
                          item.machinePrice
                        )}
                      />

                      <MiniValue
                        label={
                          copy.shipping
                        }
                        value={formatMoney(
                          item.shippingFee
                        )}
                      />

                      <MiniValue
                        label={
                          copy.total
                        }
                        value={formatMoney(
                          item.totalAmount
                        )}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-bold text-slate-500">
                {copy.noHistory}
              </p>
            </div>
          )}
        </div>
      </section>
      </main>
    </>
  );
}

function TerminalPaymentCard({
  application,
  copy,
  paymentNote,
  setPaymentNote,
  uploading,
  onUpload,
  paymentStatusLabel,
}: {
  application: MerchantTerminalApplication;
  copy: (typeof pageText)[LanguageCode];
  paymentNote: string;
  setPaymentNote: (
    value: string
  ) => void;
  uploading: boolean;
  onUpload: (
    file: File
  ) => void;
  paymentStatusLabel: (
    status: string
  ) => string;
}) {
  const normalized =
    String(
      application.paymentStatus ||
      "Pending Payment"
    )
      .trim()
      .toUpperCase();

  const submitted =
    normalized ===
      "PAYMENT REVIEW" ||
    normalized ===
      "SUBMITTED" ||
    normalized ===
      "PAID";

  return (
    <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-amber-200 bg-amber-50 sm:rounded-[2rem]">
      <div className="bg-slate-950 p-5 text-white sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 sm:text-xs">
          {copy.paymentTitle}
        </p>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-400">
              {copy.amountPayable}
            </p>

            <p className="mt-1 text-4xl font-black">
              {formatMoney(
                application.totalAmount
              )}
            </p>
          </div>

          <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-700">
            {paymentStatusLabel(
              application.paymentStatus
            )}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-sm font-bold leading-6 text-amber-900">
          {copy.paymentInstruction}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <PaymentInfo
              label={copy.bankName}
              value={terminalPayment.bankName}
            />

            <PaymentInfo
              label={copy.accountName}
              value={terminalPayment.accountName}
            />

            <PaymentInfo
              label={copy.accountNumber}
              value={terminalPayment.accountNumber}
            />

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    terminalPayment.accountNumber
                  );

                  alert(
                    copy.bankAccountCopied
                  );
                } catch {
                  alert(
                    copy.copyManually +
                      "\n" +
                      terminalPayment.accountNumber
                  );
                }
              }}
              className="w-full rounded-xl bg-white py-3 text-xs font-black text-slate-950 shadow-sm"
            >
              {copy.copyBankAccount}
            </button>
          </div>

          <div className="rounded-[1.5rem] bg-white p-4 text-center">
            <p className="text-xs font-black text-slate-950">
              {copy.scanToPay}
            </p>

            <img
              src={
                terminalPayment.qrImageUrl
              }
              alt="RewardHub payment QR"
              className="mx-auto mt-3 aspect-square w-full max-w-[220px] object-contain"
            />
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] bg-white p-4 sm:p-5">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">
                ✓
              </div>

              <p className="mt-3 text-sm font-black text-emerald-700">
                {paymentStatusLabel(
                  application.paymentStatus
                )}
              </p>

              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                {normalized === "PAID"
                  ? copy.paid
                  : copy.receiptUnderReview}
              </p>

              {application.paymentReceiptUrl ? (
                <a
                  href={
                    application.paymentReceiptUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-xs font-black text-slate-950"
                >
                  {copy.viewSubmittedReceipt}
                </a>
              ) : null}
            </div>
          ) : (
            <>
              <p className="text-sm font-black text-slate-950">
                {copy.uploadPaymentReceipt}
              </p>

              <div className="mt-4">
                <label className="block text-xs font-black text-slate-700">
                  {copy.paymentNote}
                </label>

                <textarea
                  rows={2}
                  maxLength={500}
                  value={
                    paymentNote
                  }
                  onChange={(
                    event
                  ) =>
                    setPaymentNote(
                      event.target.value
                    )
                  }
                  placeholder={
                    copy.paymentNotePlaceholder
                  }
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white">
                {uploading
                  ? copy.uploadingReceipt
                  : copy.chooseReceiptImage}

                <input
                  type="file"
                  accept="image/*"
                  disabled={
                    uploading
                  }
                  className="hidden"
                  onChange={(
                    event
                  ) => {
                    const file =
                      event.target
                        .files?.[0];

                    if (file) {
                      onUpload(
                        file
                      );
                    }

                    event.target.value =
                      "";
                  }}
                />
              </label>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function PaymentInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function PriceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "text-base font-black text-white"
            : "text-sm font-bold text-slate-300"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-2xl font-black text-cyan-300"
            : "text-base font-black text-white"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoCard({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "rounded-xl bg-white p-3"
          : "rounded-2xl bg-slate-50 p-4"
      }
    >
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black leading-6 text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

function MiniValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}