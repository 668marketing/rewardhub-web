"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  ExternalLink,
  FileImage,
  ImageOff,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  Truck,
  UserRound,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

import {
  confirmMerchantOrderPayment,
  getMerchantOrderDetail,
  rejectMerchantOrderPayment,
  updateMerchantOrderFulfillmentStatus,
  type MerchantOrderFulfillmentStatus,
} from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

type OrderItem = {
  orderItemId: string;
  productId: string;
  productName: string;
  category: string;
  imageUrl: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  subtotal: number;
  totalPoints: number;
};

type MerchantOrder = {
  orderId: string;
  memberId: string;
  merchantId: string;
  transactionId: string;
  orderAmount: number;
  cashback: number;
  rewardCreditsUsed: number;
  payAmount: number;
  pointsEarned: number;
  memberTier: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  receiptUrl: string;
  memberNote: string;
  merchantNote: string;
  deliveryMethod: string;
  fulfillmentStatus: MerchantOrderFulfillmentStatus;
  fulfillmentUpdatedAt: string;
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2: string;
  area: string;
  state: string;
  postcode: string;
  country: string;
  fullAddress: string;
  deliveryNote: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNo: string;
  bankQrUrl: string;
  createdAt: string;
  receiptUploadedAt: string;
  confirmedAt: string;
  completedAt: string;
  updatedAt: string;
};

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const copy = {
  en: {
    back: "Back to orders",
    title: "Order Detail",
    refresh: "Refresh",
    customer: "Customer",
    memberId: "Member ID",
    recipient: "Recipient",
    phone: "Phone",
    fulfilment: "Fulfilment",
    fulfilmentStatus: "Fulfilment status",
    fulfilmentControl: "Update fulfilment",
    currentFulfilment: "Current status",
    nextFulfilment: "Next status",
    updateFulfilment: "Update Status",
    fulfilmentUpdated: "Fulfilment status updated successfully.",
    noFulfilmentAction: "No further fulfilment action is available.",
    selectStatus: "Select status",
    pending: "Pending",
    preparing: "Preparing",
    readyForDelivery: "Ready for delivery",
    outForDelivery: "Out for delivery",
    delivered: "Delivered",
    readyForPickup: "Ready for pickup",
    pickedUp: "Picked up",
    delivery: "Delivery",
    selfPickup: "Self Pickup",
    address: "Delivery Address",
    note: "Delivery Note",
    copyPhone: "Copy phone",
    copyAddress: "Copy address",
    copied: "Copied",
    products: "Products",
    quantity: "Qty",
    payment: "Payment",
    orderAmount: "Order amount",
    cashback: "Cashback",
    rewardCredits: "Reward Credits",
    amountToPay: "Amount to pay",
    method: "Payment method",
    receipt: "Payment Receipt",
    openReceipt: "Open receipt",
    noReceipt: "No payment receipt uploaded.",
    status: "Status",
    timeline: "Order Timeline",
    orderCreated: "Order created",
    receiptUploaded: "Receipt uploaded",
    paymentApproved: "Payment approved",
    orderProcessing: "Order processing",
    orderCompleted: "Order completed",
    fulfillmentUpdatedAt: "Fulfilment updated",
    waiting: "Waiting",
    paymentStatus: "Payment status",
    orderStatus: "Order status",
    createdAt: "Created",
    confirmedAt: "Payment confirmed",
    transactionId: "Transaction ID",
    approve: "Approve Payment",
    reject: "Reject Payment",
    approveConfirm: "Confirm that the payment has been received?",
    rejectTitle: "Reject payment",
    rejectReason: "Rejection reason",
    rejectPlaceholder: "Explain why the receipt or payment was rejected",
    cancel: "Cancel",
    submitReject: "Reject Payment",
    merchantNote: "Merchant note",
    loadError: "Unable to load this order.",
    actionError: "The action could not be completed.",
    approved: "Payment approved successfully.",
    rejected: "Payment rejected successfully.",
    missingAddress: "No delivery address is required for self pickup.",
  },
  zh: {
    back: "返回订单",
    title: "订单详情",
    refresh: "刷新",
    customer: "顾客资料",
    memberId: "会员编号",
    recipient: "收货人",
    phone: "电话号码",
    fulfilment: "履行方式",
    fulfilmentStatus: "配送状态",
    fulfilmentControl: "更新配送状态",
    currentFulfilment: "当前状态",
    nextFulfilment: "下一状态",
    updateFulfilment: "更新状态",
    fulfilmentUpdated: "配送状态已成功更新。",
    noFulfilmentAction: "目前没有下一步配送操作。",
    selectStatus: "选择状态",
    pending: "等待处理",
    preparing: "准备中",
    readyForDelivery: "已准备送货",
    outForDelivery: "配送中",
    delivered: "已送达",
    readyForPickup: "可取货",
    pickedUp: "已取货",
    delivery: "送货",
    selfPickup: "自行取货",
    address: "配送地址",
    note: "配送备注",
    copyPhone: "复制电话",
    copyAddress: "复制地址",
    copied: "已复制",
    products: "商品",
    quantity: "数量",
    payment: "付款资料",
    orderAmount: "订单金额",
    cashback: "Cashback",
    rewardCredits: "Reward Credits",
    amountToPay: "应付金额",
    method: "付款方式",
    receipt: "付款收据",
    openReceipt: "打开收据",
    noReceipt: "会员还未上传付款收据。",
    status: "订单状态",
    timeline: "订单时间线",
    orderCreated: "订单已建立",
    receiptUploaded: "付款收据已上传",
    paymentApproved: "付款已确认",
    orderProcessing: "订单处理中",
    orderCompleted: "订单已完成",
    fulfillmentUpdatedAt: "配送更新时间",
    waiting: "等待中",
    paymentStatus: "付款状态",
    orderStatus: "订单状态",
    createdAt: "建立时间",
    confirmedAt: "确认付款时间",
    transactionId: "交易编号",
    approve: "确认付款",
    reject: "拒绝付款",
    approveConfirm: "确定已经收到这笔付款吗？",
    rejectTitle: "拒绝付款",
    rejectReason: "拒绝原因",
    rejectPlaceholder: "说明收据或付款被拒绝的原因",
    cancel: "取消",
    submitReject: "确认拒绝",
    merchantNote: "商家备注",
    loadError: "无法读取这个订单。",
    actionError: "无法完成操作。",
    approved: "付款已成功确认。",
    rejected: "付款已成功拒绝。",
    missingAddress: "自行取货不需要配送地址。",
  },
  ms: {
    back: "Kembali ke pesanan",
    title: "Butiran Pesanan",
    refresh: "Muat semula",
    customer: "Pelanggan",
    memberId: "ID Ahli",
    recipient: "Penerima",
    phone: "Telefon",
    fulfilment: "Kaedah Pemenuhan",
    fulfilmentStatus: "Status pemenuhan",
    fulfilmentControl: "Kemas kini pemenuhan",
    currentFulfilment: "Status semasa",
    nextFulfilment: "Status seterusnya",
    updateFulfilment: "Kemas Kini Status",
    fulfilmentUpdated: "Status pemenuhan berjaya dikemas kini.",
    noFulfilmentAction: "Tiada tindakan pemenuhan seterusnya.",
    selectStatus: "Pilih status",
    pending: "Menunggu",
    preparing: "Sedang disediakan",
    readyForDelivery: "Sedia untuk dihantar",
    outForDelivery: "Dalam penghantaran",
    delivered: "Telah dihantar",
    readyForPickup: "Sedia untuk diambil",
    pickedUp: "Telah diambil",
    delivery: "Penghantaran",
    selfPickup: "Ambil Sendiri",
    address: "Alamat Penghantaran",
    note: "Nota Penghantaran",
    copyPhone: "Salin telefon",
    copyAddress: "Salin alamat",
    copied: "Disalin",
    products: "Produk",
    quantity: "Kuantiti",
    payment: "Bayaran",
    orderAmount: "Jumlah pesanan",
    cashback: "Cashback",
    rewardCredits: "Reward Credits",
    amountToPay: "Jumlah perlu dibayar",
    method: "Kaedah bayaran",
    receipt: "Resit Bayaran",
    openReceipt: "Buka resit",
    noReceipt: "Tiada resit bayaran dimuat naik.",
    status: "Status",
    timeline: "Garis Masa Pesanan",
    orderCreated: "Pesanan dicipta",
    receiptUploaded: "Resit dimuat naik",
    paymentApproved: "Bayaran disahkan",
    orderProcessing: "Pesanan diproses",
    orderCompleted: "Pesanan selesai",
    fulfillmentUpdatedAt: "Pemenuhan dikemas kini",
    waiting: "Menunggu",
    paymentStatus: "Status bayaran",
    orderStatus: "Status pesanan",
    createdAt: "Dicipta",
    confirmedAt: "Bayaran disahkan",
    transactionId: "ID Transaksi",
    approve: "Sahkan Bayaran",
    reject: "Tolak Bayaran",
    approveConfirm: "Sahkan bahawa bayaran telah diterima?",
    rejectTitle: "Tolak bayaran",
    rejectReason: "Sebab penolakan",
    rejectPlaceholder: "Terangkan sebab resit atau bayaran ditolak",
    cancel: "Batal",
    submitReject: "Tolak Bayaran",
    merchantNote: "Nota peniaga",
    loadError: "Tidak dapat memuatkan pesanan ini.",
    actionError: "Tindakan tidak dapat diselesaikan.",
    approved: "Bayaran berjaya disahkan.",
    rejected: "Bayaran berjaya ditolak.",
    missingAddress: "Alamat penghantaran tidak diperlukan untuk ambil sendiri.",
  },
} satisfies Record<LanguageCode, Record<string, string>>;

function getMerchantId(): string {
  if (typeof window === "undefined") return "";

  try {
    const raw = window.localStorage.getItem("merchant");
    if (!raw) return "";

    const parsed = JSON.parse(raw);
    const value = parsed?.merchant ?? parsed?.data ?? parsed;

    return String(
      value?.merchantId ??
        value?.MERCHANT_ID ??
        value?.id ??
        ""
    ).trim();
  } catch {
    return "";
  }
}

function unwrapData(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== "object") return {};
  const root = result as Record<string, unknown>;
  const first =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  return first.data && typeof first.data === "object"
    ? (first.data as Record<string, unknown>)
    : first;
}

function text(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return "";
}

function number(row: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      const value = Number(row[key]);
      return Number.isFinite(value) ? value : 0;
    }
  }
  return 0;
}

function normalizeOrder(value: unknown): MerchantOrder {
  const row =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    orderId: text(row, "orderId", "ORDER_ID"),
    memberId: text(row, "memberId", "MEMBER_ID"),
    merchantId: text(row, "merchantId", "MERCHANT_ID"),
    transactionId: text(row, "transactionId", "TRANSACTION_ID"),
    orderAmount: number(row, "orderAmount", "ORDER_AMOUNT"),
    cashback: number(row, "cashback", "CASHBACK"),
    rewardCreditsUsed: number(
      row,
      "rewardCreditsUsed",
      "REWARD_CREDITS_USED"
    ),
    payAmount: number(row, "payAmount", "PAY_AMOUNT"),
    pointsEarned: number(row, "pointsEarned", "POINTS_EARNED"),
    memberTier: text(row, "memberTier", "MEMBER_TIER"),
    paymentMethod: text(row, "paymentMethod", "PAYMENT_METHOD"),
    paymentStatus: text(row, "paymentStatus", "PAYMENT_STATUS").toUpperCase(),
    orderStatus: text(row, "orderStatus", "ORDER_STATUS").toUpperCase(),
    receiptUrl: text(row, "receiptUrl", "RECEIPT_URL"),
    memberNote: text(row, "memberNote", "MEMBER_NOTE"),
    merchantNote: text(row, "merchantNote", "MERCHANT_NOTE"),
    deliveryMethod: text(
      row,
      "deliveryMethod",
      "fulfillmentMethod",
      "FULFILLMENT_METHOD"
    ).toUpperCase() || "DELIVERY",
    fulfillmentStatus: (
      text(
        row,
        "fulfillmentStatus",
        "FULFILLMENT_STATUS"
      ).toUpperCase() || "PENDING"
    ) as MerchantOrderFulfillmentStatus,
    fulfillmentUpdatedAt: text(
      row,
      "fulfillmentUpdatedAt",
      "FULFILLMENT_UPDATED_AT"
    ),
    recipientName: text(row, "recipientName", "RECIPIENT_NAME"),
    recipientPhone: text(row, "recipientPhone", "RECIPIENT_PHONE"),
    addressLine1: text(
      row,
      "addressLine1",
      "SHIPPING_ADDRESS_LINE_1"
    ),
    addressLine2: text(
      row,
      "addressLine2",
      "SHIPPING_ADDRESS_LINE_2"
    ),
    area: text(row, "area", "SHIPPING_AREA"),
    state: text(row, "state", "SHIPPING_STATE"),
    postcode: text(row, "postcode", "SHIPPING_POSTCODE"),
    country: text(row, "country", "SHIPPING_COUNTRY"),
    fullAddress: text(row, "fullAddress", "FULL_ADDRESS"),
    deliveryNote: text(
      row,
      "deliveryNote",
      "DELIVERY_NOTE",
      "memberNote",
      "MEMBER_NOTE"
    ),
    bankName: text(row, "bankName", "BANK_NAME"),
    bankAccountName: text(
      row,
      "bankAccountName",
      "BANK_ACCOUNT_NAME"
    ),
    bankAccountNo: text(row, "bankAccountNo", "BANK_ACCOUNT_NO"),
    bankQrUrl: text(row, "bankQrUrl", "BANK_QR_URL"),
    createdAt: text(row, "createdAt", "CREATED_AT"),
    receiptUploadedAt: text(
      row,
      "receiptUploadedAt",
      "RECEIPT_UPLOADED_AT"
    ),
    confirmedAt: text(row, "confirmedAt", "CONFIRMED_AT"),
    completedAt: text(
      row,
      "completedAt",
      "COMPLETED_AT"
    ),
    updatedAt: text(row, "updatedAt", "UPDATED_AT"),
  };
}

function normalizeItem(value: unknown): OrderItem {
  const row =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    orderItemId: text(row, "orderItemId", "ORDER_ITEM_ID"),
    productId: text(row, "productId", "PRODUCT_ID"),
    productName: text(row, "productName", "PRODUCT_NAME"),
    category: text(row, "category", "CATEGORY"),
    imageUrl: text(row, "imageUrl", "IMAGE_URL"),
    unitPrice: number(row, "unitPrice", "UNIT_PRICE"),
    originalPrice: number(row, "originalPrice", "ORIGINAL_PRICE"),
    quantity: number(row, "quantity", "QUANTITY"),
    subtotal: number(row, "subtotal", "SUBTOTAL"),
    totalPoints: number(row, "totalPoints", "TOTAL_POINTS"),
  };
}


function extractGoogleDriveFileId(value: string): string {
  const url = String(value || "").trim();
  if (!url) return "";

  const idQuery = url.match(/[?&]id=([^&]+)/i);
  if (idQuery?.[1]) {
    return decodeURIComponent(idQuery[1]);
  }

  const filePath = url.match(/\/file\/d\/([^/]+)/i);
  if (filePath?.[1]) {
    return filePath[1];
  }

  const openQuery = url.match(/\/open\?id=([^&]+)/i);
  if (openQuery?.[1]) {
    return decodeURIComponent(openQuery[1]);
  }

  return "";
}

function getDisplayImageUrl(value: string): string {
  const url = String(value || "").trim();
  if (!url) return "";

  const driveFileId = extractGoogleDriveFileId(url);

  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
      driveFileId
    )}&sz=w1600`;
  }

  return url;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClasses(status: string): string {
  switch (status) {
    case "PAYMENT_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "PROCESSING":
    case "PREPARING":
    case "READY_FOR_DELIVERY":
    case "READY_FOR_PICKUP":
    case "OUT_FOR_DELIVERY":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "COMPLETED":
    case "DELIVERED":
    case "PICKED_UP":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
    case "PAYMENT_REJECTED":
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getFulfillmentSequence(
  deliveryMethod: string
): MerchantOrderFulfillmentStatus[] {
  if (deliveryMethod === "SELF_PICKUP") {
    return [
      "PENDING",
      "PREPARING",
      "READY_FOR_PICKUP",
      "PICKED_UP",
    ];
  }

  return [
    "PENDING",
    "PREPARING",
    "READY_FOR_DELIVERY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];
}

function getNextFulfillmentStatus(
  deliveryMethod: string,
  currentStatus: MerchantOrderFulfillmentStatus
): MerchantOrderFulfillmentStatus | "" {
  const sequence = getFulfillmentSequence(deliveryMethod);
  const currentIndex = sequence.indexOf(currentStatus);

  if (currentIndex < 0) {
    return "PREPARING";
  }

  return sequence[currentIndex + 1] ?? "";
}

export default function MerchantOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const orderId = decodeURIComponent(String(params?.orderId ?? ""));

  const [language, setLanguage] = useState<LanguageCode>("en");
  const [order, setOrder] = useState<MerchantOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [copied, setCopied] = useState("");
  const [selectedFulfillmentStatus, setSelectedFulfillmentStatus] =
    useState<MerchantOrderFulfillmentStatus | "">("");

  const t = copy[language];

  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "zh" || stored === "ms") {
      setLanguage(stored);
    }

    const handleLanguage = (event: Event) => {
      const next = (event as CustomEvent<{ language?: LanguageCode }>)
        .detail?.language;
      if (next === "en" || next === "zh" || next === "ms") {
        setLanguage(next);
      }
    };

    window.addEventListener(
      "rewardhub-language-change",
      handleLanguage
    );

    return () => {
      window.removeEventListener(
        "rewardhub-language-change",
        handleLanguage
      );
    };
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [orderId]);

  const loadOrder = useCallback(async (silent = false) => {
    const merchantId = getMerchantId();

    if (!merchantId || !orderId) {
      setError("Merchant session or order ID is missing.");
      setLoading(false);
      return;
    }

    if (silent) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const result = await getMerchantOrderDetail({
        merchantId,
        orderId,
      });

      const data = unwrapData(result);
      const normalizedOrder = normalizeOrder(data.order);
      setOrder(normalizedOrder);
      setSelectedFulfillmentStatus(
        getNextFulfillmentStatus(
          normalizedOrder.deliveryMethod,
          normalizedOrder.fulfillmentStatus
        )
      );

      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(nextItems.map(normalizeItem));
    } catch (loadError) {
      console.error(loadError);
      setError(t.loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, t.loadError]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const fullAddress = useMemo(() => {
    if (!order) return "";

    if (order.fullAddress) return order.fullAddress;

    const cityLine = [order.postcode, order.area]
      .filter(Boolean)
      .join(" ");

    return [
      order.addressLine1,
      order.addressLine2,
      cityLine,
      order.state,
      order.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [order]);

  async function copyValue(value: string, key: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1500);
  }

  async function approvePayment() {
    if (!order || !window.confirm(t.approveConfirm)) return;

    setAction("approve");
    setError("");
    setSuccess("");

    try {
      await confirmMerchantOrderPayment({
        merchantId: getMerchantId(),
        orderId: order.orderId,
      });
      setSuccess(t.approved);
      await loadOrder(true);
    } catch (approveError) {
      console.error(approveError);
      setError(t.actionError);
    } finally {
      setAction("");
    }
  }

  async function rejectPayment() {
    if (!order || !rejectReason.trim()) return;

    setAction("reject");
    setError("");
    setSuccess("");

    try {
      await rejectMerchantOrderPayment({
        merchantId: getMerchantId(),
        orderId: order.orderId,
        merchantNote: rejectReason.trim(),
      });
      setRejectOpen(false);
      setRejectReason("");
      setSuccess(t.rejected);
      await loadOrder(true);
    } catch (rejectError) {
      console.error(rejectError);
      setError(t.actionError);
    } finally {
      setAction("");
    }
  }

  async function updateFulfillment() {
    if (!order || !selectedFulfillmentStatus) return;

    setAction("fulfillment");
    setError("");
    setSuccess("");

    try {
      await updateMerchantOrderFulfillmentStatus({
        merchantId: getMerchantId(),
        orderId: order.orderId,
        fulfillmentStatus: selectedFulfillmentStatus,
      });
      setSuccess(t.fulfilmentUpdated);
      await loadOrder(true);
    } catch (fulfillmentError) {
      console.error(fulfillmentError);
      setError(t.actionError);
    } finally {
      setAction("");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <Loader2 className="h-9 w-9 animate-spin text-slate-500" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 font-black text-slate-950">
            {error || t.loadError}
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            {t.back}
          </button>
        </div>
      </main>
    );
  }

  const canApprove = order.orderStatus === "PAYMENT_REVIEW";
  const canReject = order.orderStatus === "PAYMENT_REVIEW";
  const canUpdateFulfillment =
    order.orderStatus === "PROCESSING" &&
    order.paymentStatus === "CONFIRMED" &&
    Boolean(
      getNextFulfillmentStatus(
        order.deliveryMethod,
        order.fulfillmentStatus
      )
    );

  const fulfillmentLabelMap: Record<
    MerchantOrderFulfillmentStatus,
    string
  > = {
    PENDING: t.pending,
    PREPARING: t.preparing,
    READY_FOR_DELIVERY: t.readyForDelivery,
    OUT_FOR_DELIVERY: t.outForDelivery,
    DELIVERED: t.delivered,
    READY_FOR_PICKUP: t.readyForPickup,
    PICKED_UP: t.pickedUp,
  };

  const fulfillmentSequence = getFulfillmentSequence(
    order.deliveryMethod
  );
  const fulfillmentIndex = fulfillmentSequence.indexOf(
    order.fulfillmentStatus
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/merchant/orders"
            scroll
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 no-underline shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>

          <button
            type="button"
            onClick={() => void loadOrder(true)}
            disabled={refreshing}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            {t.refresh}
          </button>
        </div>

        <section className="overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-xl sm:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-slate-300" />
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                  {t.title}
                </p>
              </div>
              <h1 className="mt-3 break-all text-2xl font-black sm:text-3xl">
                {order.orderId}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-300">
                {t.createdAt}: {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] ${statusClasses(
                  order.paymentStatus
                )}`}
              >
                {order.paymentStatus.replaceAll("_", " ")}
              </span>
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] ${statusClasses(
                  order.orderStatus
                )}`}
              >
                {order.orderStatus.replaceAll("_", " ")}
              </span>
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] ${statusClasses(
                  order.fulfillmentStatus
                )}`}
              >
                {fulfillmentLabelMap[order.fulfillmentStatus]}
              </span>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {success}
          </div>
        ) : null}

        <div className="mt-6 grid items-stretch gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="flex h-full flex-col gap-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <UserRound className="h-5 w-5 text-slate-700" />
                </div>
                <h2 className="text-lg font-black text-slate-950">
                  {t.customer}
                </h2>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Info label={t.memberId} value={order.memberId} />
                <Info label={t.recipient} value={order.recipientName} />
                <Info label={t.phone} value={order.recipientPhone}>
                  <button
                    type="button"
                    onClick={() =>
                      void copyValue(order.recipientPhone, "phone")
                    }
                    className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-950"
                  >
                    {copied === "phone" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied === "phone" ? t.copied : t.copyPhone}
                  </button>
                </Info>
                <Info
                  label={t.fulfilment}
                  value={
                    order.deliveryMethod === "SELF_PICKUP"
                      ? t.selfPickup
                      : t.delivery
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                    {order.deliveryMethod === "SELF_PICKUP" ? (
                      <Package className="h-5 w-5 text-slate-700" />
                    ) : (
                      <MapPin className="h-5 w-5 text-slate-700" />
                    )}
                  </div>
                  <h2 className="text-lg font-black text-slate-950">
                    {t.address}
                  </h2>
                </div>

                {order.deliveryMethod !== "SELF_PICKUP" && fullAddress ? (
                  <button
                    type="button"
                    onClick={() => void copyValue(fullAddress, "address")}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                  >
                    {copied === "address" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                    {copied === "address" ? t.copied : t.copyAddress}
                  </button>
                ) : null}
              </div>

              {order.deliveryMethod === "SELF_PICKUP" ? (
                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-700">
                  {t.missingAddress}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                    {fullAddress || "—"}
                  </p>
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  {t.note}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700">
                  {order.deliveryNote || "—"}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <Package className="h-5 w-5 text-slate-700" />
                </div>
                <h2 className="text-lg font-black text-slate-950">
                  {t.products}
                </h2>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {items.map((item) => (
                  <div
                    key={item.orderItemId || item.productId}
                    className="flex gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      <SafeRemoteImage
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                        fallback={
                          <Package className="h-7 w-7 text-slate-400" />
                        }
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-950">
                        {item.productName || item.productId}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {item.category || "—"}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-600">
                          {formatMoney(item.unitPrice)} × {item.quantity}
                        </p>
                        <p className="text-base font-black text-slate-950">
                          {formatMoney(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-1 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <CheckCircle2 className="h-5 w-5 text-slate-700" />
                </div>
                <h2 className="text-lg font-black text-slate-950">
                  {t.status}
                </h2>
              </div>

              <div className="mt-5 grid flex-1 content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatusInfo
                  label={t.paymentStatus}
                  value={order.paymentStatus}
                />
                <StatusInfo
                  label={t.orderStatus}
                  value={order.orderStatus}
                />
                <StatusInfo
                  label={t.fulfilmentStatus}
                  value={fulfillmentLabelMap[order.fulfillmentStatus]}
                />
                <StatusInfo
                  label={t.createdAt}
                  value={formatDate(order.createdAt)}
                />
                <StatusInfo
                  label={t.confirmedAt}
                  value={formatDate(order.confirmedAt)}
                />
                <StatusInfo
                  label={t.fulfillmentUpdatedAt}
                  value={formatDate(order.fulfillmentUpdatedAt)}
                />

                {order.transactionId ? (
                  <StatusInfo
                    label={t.transactionId}
                    value={order.transactionId}
                    className="sm:col-span-2 xl:col-span-3"
                  />
                ) : null}

                {order.merchantNote ? (
                  <StatusInfo
                    label={t.merchantNote}
                    value={order.merchantNote}
                    className="sm:col-span-2 xl:col-span-3"
                  />
                ) : null}
              </div>
            </section>


          </div>

          <div className="flex h-full flex-col gap-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <Truck className="h-5 w-5 text-slate-700" />
                </div>
                <h2 className="text-lg font-black text-slate-950">
                  {t.fulfilmentControl}
                </h2>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  {t.currentFulfilment}
                </p>
                <p className="mt-2 font-black text-slate-950">
                  {fulfillmentLabelMap[order.fulfillmentStatus]}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {formatDate(order.fulfillmentUpdatedAt)}
                </p>
              </div>

              {canUpdateFulfillment ? (
                <>
                  <label className="mt-5 block text-sm font-black text-slate-700">
                    {t.nextFulfilment}
                  </label>
                  <select
                    value={selectedFulfillmentStatus}
                    onChange={(event) =>
                      setSelectedFulfillmentStatus(
                        event.target.value as MerchantOrderFulfillmentStatus
                      )
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  >
                    <option value="">
                      {t.selectStatus}
                    </option>
                    {getNextFulfillmentStatus(
                      order.deliveryMethod,
                      order.fulfillmentStatus
                    ) ? (
                      <option
                        value={getNextFulfillmentStatus(
                          order.deliveryMethod,
                          order.fulfillmentStatus
                        )}
                      >
                        {
                          fulfillmentLabelMap[
                            getNextFulfillmentStatus(
                              order.deliveryMethod,
                              order.fulfillmentStatus
                            ) as MerchantOrderFulfillmentStatus
                          ]
                        }
                      </option>
                    ) : null}
                  </select>

                  <button
                    type="button"
                    onClick={() => void updateFulfillment()}
                    disabled={
                      !selectedFulfillmentStatus ||
                      action === "fulfillment"
                    }
                    className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {action === "fulfillment" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Truck className="h-5 w-5" />
                    )}
                    {t.updateFulfilment}
                  </button>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  {t.noFulfilmentAction}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <Banknote className="h-5 w-5 text-slate-700" />
                </div>
                <h2 className="text-lg font-black text-slate-950">
                  {t.payment}
                </h2>
              </div>

              <div className="mt-5 space-y-3">
                <MoneyRow label={t.orderAmount} value={order.orderAmount} />
                <MoneyRow label={t.cashback} value={-order.cashback} />
                <MoneyRow
                  label={t.rewardCredits}
                  value={-order.rewardCreditsUsed}
                />
                <div className="my-4 border-t border-dashed border-slate-200" />
                <MoneyRow
                  label={t.amountToPay}
                  value={order.payAmount}
                  strong
                />
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  {t.method}
                </p>
                <p className="mt-2 font-black text-slate-800">
                  {order.paymentMethod || "—"}
                </p>
              </div>
            </section>

            <section className="flex flex-1 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <FileImage className="h-5 w-5 text-slate-700" />
                </div>
                <h2 className="text-lg font-black text-slate-950">
                  {t.receipt}
                </h2>
              </div>

              {order.receiptUrl ? (
                <>
                  <a
                    href={order.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="relative mt-5 block h-[300px] overflow-hidden rounded-2xl bg-slate-100 sm:h-[340px] xl:h-[360px]"
                  >
                    <SafeRemoteImage
                      src={order.receiptUrl}
                      alt={t.receipt}
                      className="h-full w-full object-contain"
                      fallback={
                        <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-5 text-center">
                          <ImageOff className="h-10 w-10 text-slate-400" />
                          <p className="text-sm font-bold text-slate-500">
                            {t.openReceipt}
                          </p>
                        </div>
                      }
                    />
                  </a>

                  <a
                    href={order.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 no-underline transition hover:bg-slate-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t.openReceipt}
                  </a>
                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                  {t.noReceipt}
                </div>
              )}
            </section>

          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
              <Truck className="h-5 w-5 text-slate-700" />
            </div>
            <h2 className="text-lg font-black text-slate-950">
              {t.timeline}
            </h2>
          </div>

          <div className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <HorizontalTimelineCard
                title={t.orderCreated}
                time={order.createdAt}
                complete={Boolean(order.createdAt)}
                active={false}
                step={1}
              />

              <HorizontalTimelineCard
                title={t.receiptUploaded}
                time={order.receiptUploadedAt}
                complete={Boolean(order.receiptUploadedAt)}
                active={
                  !order.receiptUploadedAt &&
                  order.orderStatus !== "CANCELLED"
                }
                step={2}
              />

              <HorizontalTimelineCard
                title={t.paymentApproved}
                time={order.confirmedAt}
                complete={Boolean(order.confirmedAt)}
                active={
                  Boolean(order.receiptUploadedAt) &&
                  !order.confirmedAt &&
                  order.orderStatus !== "PAYMENT_REJECTED" &&
                  order.orderStatus !== "CANCELLED"
                }
                step={3}
              />

              {fulfillmentSequence.slice(1).map(
                (status, index) => {
                  const statusIndex = index + 1;
                  const isComplete =
                    fulfillmentIndex >= statusIndex ||
                    order.orderStatus === "COMPLETED";
                  const isActive =
                    order.orderStatus === "PROCESSING" &&
                    fulfillmentIndex + 1 === statusIndex;

                  return (
                    <HorizontalTimelineCard
                      key={status}
                      title={fulfillmentLabelMap[status]}
                      time={
                        fulfillmentIndex === statusIndex
                          ? order.fulfillmentUpdatedAt
                          : status === "PREPARING"
                            ? order.confirmedAt
                            : status === "DELIVERED" ||
                                status === "PICKED_UP"
                              ? order.completedAt
                              : ""
                      }
                      complete={isComplete}
                      active={isActive}
                      step={index + 4}
                    />
                  );
                }
              )}
            </div>
          </div>
        </section>

        {(canApprove || canReject) ? (
          <div className="fixed inset-x-0 bottom-[78px] z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:bottom-0">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:justify-end">
              {canReject ? (
                <button
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  disabled={Boolean(action)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                >
                  <XCircle className="h-5 w-5" />
                  {t.reject}
                </button>
              ) : null}

              {canApprove ? (
                <button
                  type="button"
                  onClick={() => void approvePayment()}
                  disabled={Boolean(action)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {action === "approve" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <WalletCards className="h-5 w-5" />
                  )}
                  {t.approve}
                </button>
              ) : null}


            </div>
          </div>
        ) : null}
      </div>

      {rejectOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {t.rejectTitle}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {order.orderId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="mt-5 block text-sm font-black text-slate-700">
              {t.rejectReason}
            </label>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder={t.rejectPlaceholder}
              rows={5}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
            />

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                className="h-11 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700 hover:bg-slate-100"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => void rejectPayment()}
                disabled={!rejectReason.trim() || action === "reject"}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {action === "reject" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {t.submitReject}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}


function HorizontalTimelineCard({
  title,
  time,
  complete,
  active,
  step,
}: {
  title: string;
  time: string;
  complete: boolean;
  active: boolean;
  step: number;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 ${
        complete
          ? "border-emerald-200 bg-emerald-50"
          : active
            ? "border-slate-950 bg-slate-950 text-white"
            : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
            complete
              ? "bg-emerald-500 text-white"
              : active
                ? "bg-white text-slate-950"
                : "bg-white text-slate-400 ring-1 ring-slate-200"
          }`}
        >
          {complete ? <Check className="h-5 w-5" /> : step}
        </div>

        <span
          className={`text-[10px] font-black uppercase tracking-[0.14em] ${
            active ? "text-slate-300" : "text-slate-400"
          }`}
        >
          Step {step}
        </span>
      </div>

      <p
        className={`mt-4 text-sm font-black ${
          active
            ? "text-white"
            : complete
              ? "text-emerald-900"
              : "text-slate-500"
        }`}
      >
        {title}
      </p>

      <p
        className={`mt-1 text-xs font-semibold leading-5 ${
          active ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {time ? formatDate(time) : "—"}
      </p>
    </div>
  );
}

function SafeRemoteImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const displayUrl = getDisplayImageUrl(src);

  useEffect(() => {
    setFailed(false);
  }, [displayUrl]);

  if (!displayUrl || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function Info({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="break-words text-sm font-black text-slate-800">
          {value || "—"}
        </p>
        {children}
      </div>
    </div>
  );
}

function StatusInfo({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  const normalized = value.toUpperCase();

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${className}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <div className="mt-2">
        {normalized.includes("PAYMENT") ||
        normalized === "PROCESSING" ||
        normalized === "COMPLETED" ||
        normalized === "CANCELLED" ||
        normalized === "CONFIRMED" ||
        normalized === "REJECTED" ||
        normalized === "RECEIPT_UPLOADED" ||
        normalized === "PENDING" ||
        normalized === "PREPARING" ||
        normalized === "READY FOR DELIVERY" ||
        normalized === "OUT FOR DELIVERY" ||
        normalized === "DELIVERED" ||
        normalized === "READY FOR PICKUP" ||
        normalized === "PICKED UP" ? (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusClasses(
              normalized
            )}`}
          >
            {value.replaceAll("_", " ")}
          </span>
        ) : (
          <p className="break-words text-sm font-black text-slate-800">
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "text-base font-black text-slate-950"
            : "text-sm font-semibold text-slate-500"
        }
      >
        {label}
      </span>
      <span
        className={
          strong
            ? "text-xl font-black text-slate-950"
            : "text-sm font-black text-slate-800"
        }
      >
        {formatMoney(value)}
      </span>
    </div>
  );
}