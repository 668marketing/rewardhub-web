"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  Package,
  Receipt,
  RefreshCw,
  Truck,
  Upload,
  XCircle,
} from "lucide-react";

import MemberLayout from "@/components/layout/MemberLayout";
import SafeImage from "@/components/ui/SafeImage";

import {
  cancelMemberOrder,
  getMemberOrderDetail,
  uploadMemberOrderReceipt,
  type MerchantOrderFulfillmentStatus,
} from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

type OrderDetail = {
  orderId: string;
  memberId: string;
  merchantId: string;
  transactionId: string;
  orderAmount: number;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
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

type OrderItem = {
  orderItemId: string;
  productId: string;
  productName: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  shippingType: string;
  shippingFee: number;
};

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const copy = {
  en: {
    back: "Back to Marketplace",
    title: "Order Detail",
    refresh: "Refresh",
    orderAmount: "Order Amount",
    subtotal: "Product Subtotal",
    shippingFee: "Shipping Fee",
    totalAmount: "Order Total",
    cashback: "Cashback",
    rewardCredits: "Reward Credits",
    payMerchant: "Pay Merchant",
    products: "Order Items",
    paymentDetails: "Payment Details",
    bank: "Bank",
    accountName: "Account Name",
    accountNumber: "Account Number",
    paymentReceipt: "Payment Receipt",
    receiptNotUploaded: "Receipt not uploaded",
    uploadReceipt: "Upload Receipt",
    uploadNewReceipt: "Upload New Receipt",
    uploading: "Uploading...",
    receiptSubmitted: "Receipt submitted",
    merchantNote: "Merchant Note",
    cancelOrder: "Cancel Order",
    cancelling: "Cancelling...",
    cancelConfirm: "Are you sure you want to cancel this order?",
    copy: "Copy",
    copied: "Copied",
    status: "Status",
    paymentStatus: "Payment Status",
    orderStatus: "Order Status",
    fulfilmentStatus: "Fulfilment Status",
    fulfilmentMethod: "Fulfilment Method",
    delivery: "Delivery",
    selfPickup: "Self Pickup",
    recipient: "Recipient",
    phone: "Phone",
    address: "Delivery Address",
    deliveryNote: "Delivery Note",
    timeline: "Order Timeline",
    orderCreated: "Order created",
    receiptUploaded: "Receipt uploaded",
    paymentApproved: "Payment approved",
    pending: "Pending",
    preparing: "Preparing",
    readyForDelivery: "Ready for delivery",
    outForDelivery: "Out for delivery",
    delivered: "Delivered",
    readyForPickup: "Ready for pickup",
    pickedUp: "Picked up",
    completed: "Completed",
    waiting: "Waiting",
    createdAt: "Created",
    updatedAt: "Updated",
    noAddress: "No delivery address is required for self pickup.",
    loadError: "Unable to load this order.",
    missingOrder: "Order information is missing.",
    invalidReceipt: "Please select an image receipt.",
    uploadError: "Unable to upload receipt.",
    cancelError: "Unable to cancel order.",
    backButton: "Back",
  },
  zh: {
    back: "返回 Marketplace",
    title: "订单详情",
    refresh: "刷新",
    orderAmount: "订单金额",
    subtotal: "商品小计",
    shippingFee: "运费",
    totalAmount: "订单总额",
    cashback: "Cashback",
    rewardCredits: "Reward Credits",
    payMerchant: "支付商家",
    products: "订单商品",
    paymentDetails: "付款资料",
    bank: "银行",
    accountName: "账户名称",
    accountNumber: "账户号码",
    paymentReceipt: "付款收据",
    receiptNotUploaded: "还未上传付款收据",
    uploadReceipt: "上传收据",
    uploadNewReceipt: "重新上传收据",
    uploading: "上传中...",
    receiptSubmitted: "收据已提交",
    merchantNote: "商家备注",
    cancelOrder: "取消订单",
    cancelling: "取消中...",
    cancelConfirm: "确定要取消这个订单吗？",
    copy: "复制",
    copied: "已复制",
    status: "订单状态",
    paymentStatus: "付款状态",
    orderStatus: "订单状态",
    fulfilmentStatus: "配送状态",
    fulfilmentMethod: "履行方式",
    delivery: "送货",
    selfPickup: "自行取货",
    recipient: "收货人",
    phone: "电话号码",
    address: "配送地址",
    deliveryNote: "配送备注",
    timeline: "订单时间线",
    orderCreated: "订单已建立",
    receiptUploaded: "付款收据已上传",
    paymentApproved: "付款已确认",
    pending: "等待处理",
    preparing: "准备中",
    readyForDelivery: "已准备送货",
    outForDelivery: "配送中",
    delivered: "已送达",
    readyForPickup: "可取货",
    pickedUp: "已取货",
    completed: "已完成",
    waiting: "等待中",
    createdAt: "建立时间",
    updatedAt: "更新时间",
    noAddress: "自行取货不需要配送地址。",
    loadError: "无法读取这个订单。",
    missingOrder: "订单资料不完整。",
    invalidReceipt: "请选择图片格式的付款收据。",
    uploadError: "无法上传付款收据。",
    cancelError: "无法取消订单。",
    backButton: "返回",
  },
  ms: {
    back: "Kembali ke Marketplace",
    title: "Butiran Pesanan",
    refresh: "Muat semula",
    orderAmount: "Jumlah Pesanan",
    subtotal: "Subjumlah Produk",
    shippingFee: "Caj Penghantaran",
    totalAmount: "Jumlah Keseluruhan",
    cashback: "Cashback",
    rewardCredits: "Reward Credits",
    payMerchant: "Bayar Peniaga",
    products: "Item Pesanan",
    paymentDetails: "Butiran Bayaran",
    bank: "Bank",
    accountName: "Nama Akaun",
    accountNumber: "Nombor Akaun",
    paymentReceipt: "Resit Bayaran",
    receiptNotUploaded: "Resit belum dimuat naik",
    uploadReceipt: "Muat Naik Resit",
    uploadNewReceipt: "Muat Naik Resit Baharu",
    uploading: "Sedang memuat naik...",
    receiptSubmitted: "Resit telah dihantar",
    merchantNote: "Nota Peniaga",
    cancelOrder: "Batalkan Pesanan",
    cancelling: "Sedang membatalkan...",
    cancelConfirm: "Adakah anda pasti mahu membatalkan pesanan ini?",
    copy: "Salin",
    copied: "Disalin",
    status: "Status",
    paymentStatus: "Status Bayaran",
    orderStatus: "Status Pesanan",
    fulfilmentStatus: "Status Pemenuhan",
    fulfilmentMethod: "Kaedah Pemenuhan",
    delivery: "Penghantaran",
    selfPickup: "Ambil Sendiri",
    recipient: "Penerima",
    phone: "Telefon",
    address: "Alamat Penghantaran",
    deliveryNote: "Nota Penghantaran",
    timeline: "Garis Masa Pesanan",
    orderCreated: "Pesanan dicipta",
    receiptUploaded: "Resit dimuat naik",
    paymentApproved: "Bayaran disahkan",
    pending: "Menunggu",
    preparing: "Sedang disediakan",
    readyForDelivery: "Sedia untuk dihantar",
    outForDelivery: "Dalam penghantaran",
    delivered: "Telah dihantar",
    readyForPickup: "Sedia untuk diambil",
    pickedUp: "Telah diambil",
    completed: "Selesai",
    waiting: "Menunggu",
    createdAt: "Dicipta",
    updatedAt: "Dikemas kini",
    noAddress: "Alamat penghantaran tidak diperlukan untuk ambil sendiri.",
    loadError: "Tidak dapat memuatkan pesanan ini.",
    missingOrder: "Maklumat pesanan tidak lengkap.",
    invalidReceipt: "Sila pilih resit dalam format imej.",
    uploadError: "Tidak dapat memuat naik resit.",
    cancelError: "Tidak dapat membatalkan pesanan.",
    backButton: "Kembali",
  },
} satisfies Record<LanguageCode, Record<string, string>>;

function getStoredMemberId(): string {
  if (typeof window === "undefined") return "";

  try {
    const parsed = JSON.parse(
      localStorage.getItem("member") || "{}"
    );

    return String(
      parsed?.memberId ??
        parsed?.MEMBER_ID ??
        parsed?.id ??
        parsed?.profile?.memberId ??
        parsed?.member?.memberId ??
        parsed?.data?.memberId ??
        ""
    ).trim();
  } catch {
    return "";
  }
}

function unwrapResponse(
  response: unknown
): Record<string, unknown> {
  if (!response || typeof response !== "object") {
    return {};
  }

  const root = response as Record<string, unknown>;
  const first =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  return first.data && typeof first.data === "object"
    ? (first.data as Record<string, unknown>)
    : first;
}

function text(
  row: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = row[key];
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return String(value);
    }
  }

  return "";
}

function number(
  row: Record<string, unknown>,
  ...keys: string[]
): number {
  for (const key of keys) {
    const value = row[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }

  return 0;
}

function normalizeOrder(value: unknown): OrderDetail {
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
    subtotal: number(
      row,
      "subtotal",
      "orderAmount",
      "ORDER_AMOUNT"
    ),
    shippingFee: number(
      row,
      "shippingFee",
      "SHIPPING_FEE"
    ),
    totalAmount:
      number(
        row,
        "totalAmount",
        "TOTAL_AMOUNT"
      ) ||
      (
        number(
          row,
          "orderAmount",
          "ORDER_AMOUNT"
        ) +
        number(
          row,
          "shippingFee",
          "SHIPPING_FEE"
        )
      ),
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
    paymentStatus: text(
      row,
      "paymentStatus",
      "PAYMENT_STATUS"
    ).toUpperCase(),
    orderStatus: text(
      row,
      "orderStatus",
      "ORDER_STATUS"
    ).toUpperCase(),
    receiptUrl: text(row, "receiptUrl", "RECEIPT_URL"),
    memberNote: text(row, "memberNote", "MEMBER_NOTE"),
    merchantNote: text(row, "merchantNote", "MERCHANT_NOTE"),
    deliveryMethod:
      text(
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
    bankAccountNo: text(
      row,
      "bankAccountNo",
      "BANK_ACCOUNT_NO"
    ),
    bankQrUrl: text(row, "bankQrUrl", "BANK_QR_URL"),
    createdAt: text(row, "createdAt", "CREATED_AT"),
    receiptUploadedAt: text(
      row,
      "receiptUploadedAt",
      "RECEIPT_UPLOADED_AT"
    ),
    confirmedAt: text(row, "confirmedAt", "CONFIRMED_AT"),
    completedAt: text(row, "completedAt", "COMPLETED_AT"),
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
    imageUrl: text(row, "imageUrl", "IMAGE_URL"),
    quantity: number(row, "quantity", "QUANTITY"),
    unitPrice: number(row, "unitPrice", "UNIT_PRICE"),
    subtotal: number(row, "subtotal", "SUBTOTAL"),
    shippingType: text(
      row,
      "shippingType",
      "SHIPPING_TYPE"
    ),
    shippingFee: number(
      row,
      "shippingFee",
      "SHIPPING_FEE"
    ),
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(
        result.includes(",")
          ? result.split(",").pop() || ""
          : result
      );
    };

    reader.onerror = () =>
      reject(new Error("Unable to read receipt."));

    reader.readAsDataURL(file);
  });
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

function statusClasses(status: string): string {
  const normalized = String(status || "").toUpperCase();

  if (
    ["COMPLETED", "DELIVERED", "PICKED_UP"].includes(
      normalized
    )
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "PROCESSING",
      "PREPARING",
      "READY_FOR_DELIVERY",
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
    ].includes(normalized)
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    [
      "CANCELLED",
      "PAYMENT_REJECTED",
      "REJECTED",
    ].includes(normalized)
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (
    ["PAYMENT_REVIEW", "RECEIPT_UPLOADED"].includes(
      normalized
    )
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default function MemberOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ orderId?: string }>();
  const orderId = decodeURIComponent(
    String(params?.orderId || "")
  );

  const [language, setLanguage] =
    useState<LanguageCode>("en");
  const [order, setOrder] =
    useState<OrderDetail | null>(null);
  const [items, setItems] =
    useState<OrderItem[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [uploading, setUploading] =
    useState(false);
  const [cancelling, setCancelling] =
    useState(false);
  const [error, setError] =
    useState("");
  const [copied, setCopied] =
    useState("");

  const t = copy[language];

  useEffect(() => {
    const stored =
      window.localStorage.getItem(
        LANGUAGE_STORAGE_KEY
      );

    if (
      stored === "en" ||
      stored === "zh" ||
      stored === "ms"
    ) {
      setLanguage(stored);
    }

    const handleLanguage = (event: Event) => {
      const next = (
        event as CustomEvent<{
          language?: LanguageCode;
        }>
      ).detail?.language;

      if (
        next === "en" ||
        next === "zh" ||
        next === "ms"
      ) {
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

  const loadOrder = useCallback(
    async (silent = false) => {
      const memberId =
        getStoredMemberId();

      if (!memberId || !orderId) {
        setError(t.missingOrder);
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response =
          await getMemberOrderDetail({
            memberId,
            orderId,
          });

        const data =
          unwrapResponse(response);

        setOrder(
          normalizeOrder(data.order)
        );

        setItems(
          Array.isArray(data.items)
            ? data.items.map(normalizeItem)
            : []
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : t.loadError
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId, t.loadError, t.missingOrder]
  );

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const fullAddress = useMemo(() => {
    if (!order) return "";

    if (order.fullAddress) {
      return order.fullAddress;
    }

    const cityLine = [
      order.postcode,
      order.area,
    ]
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

  async function handleReceipt(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file || !order) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(t.invalidReceipt);
      return;
    }

    setUploading(true);
    setError("");

    try {
      const base64 =
        await fileToBase64(file);

      await uploadMemberOrderReceipt({
        memberId: getStoredMemberId(),
        orderId: order.orderId,
        fileName: file.name,
        mimeType: file.type,
        base64,
      });

      await loadOrder(true);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : t.uploadError
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleCancel() {
    if (
      !order ||
      !window.confirm(t.cancelConfirm)
    ) {
      return;
    }

    setCancelling(true);
    setError("");

    try {
      await cancelMemberOrder({
        memberId: getStoredMemberId(),
        orderId: order.orderId,
      });

      await loadOrder(true);
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : t.cancelError
      );
    } finally {
      setCancelling(false);
    }
  }

  async function copyValue(
    value: string,
    key: string
  ) {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(key);

    window.setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  if (loading) {
    return (
      <MemberLayout>
        <main className="flex min-h-[70vh] items-center justify-center bg-[#f4f6fa]">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        </main>
      </MemberLayout>
    );
  }

  if (error && !order) {
    return (
      <MemberLayout>
        <main className="min-h-screen bg-[#f4f6fa] px-4 py-8">
          <section className="mx-auto max-w-3xl rounded-[30px] bg-white p-8 text-center shadow-sm">
            <XCircle className="mx-auto h-12 w-12 text-rose-500" />

            <p className="mt-4 font-black text-rose-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => router.back()}
              className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              {t.backButton}
            </button>
          </section>
        </main>
      </MemberLayout>
    );
  }

  if (!order) {
    return null;
  }

  const canUpload = [
    "PENDING_PAYMENT",
    "PAYMENT_REJECTED",
  ].includes(order.orderStatus);

  const canCancel = [
    "PENDING_PAYMENT",
    "PAYMENT_REJECTED",
  ].includes(order.orderStatus);

  const fulfillmentLabelMap: Record<
    MerchantOrderFulfillmentStatus,
    string
  > = {
    PENDING: t.pending,
    PREPARING: t.preparing,
    READY_FOR_DELIVERY:
      t.readyForDelivery,
    OUT_FOR_DELIVERY:
      t.outForDelivery,
    DELIVERED: t.delivered,
    READY_FOR_PICKUP:
      t.readyForPickup,
    PICKED_UP: t.pickedUp,
  };

  const fulfillmentSequence =
    getFulfillmentSequence(
      order.deliveryMethod
    );

  const fulfillmentIndex =
    fulfillmentSequence.indexOf(
      order.fulfillmentStatus
    );

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f4f6fa] px-4 py-6 text-slate-950 sm:px-6 sm:py-9">
        <section className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/member/marketplace"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 no-underline shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Link>

            <button
              type="button"
              onClick={() =>
                void loadOrder(true)
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
              {t.refresh}
            </button>
          </div>

          <div className="mt-6 rounded-[30px] bg-[#08111f] p-6 text-white shadow-xl sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">
                  {t.title}
                </p>

                <h1 className="mt-2 break-all text-2xl font-black sm:text-3xl">
                  {order.orderId}
                </h1>

                <p className="mt-2 text-sm font-bold text-slate-400">
                  {formatDate(order.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  status={order.orderStatus}
                />
                <StatusBadge
                  status={
                    order.fulfillmentStatus
                  }
                  label={
                    fulfillmentLabelMap[
                      order.fulfillmentStatus
                    ]
                  }
                />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <DarkInfo
                label={t.subtotal}
                value={`RM${money(
                  order.subtotal
                )}`}
              />

              <DarkInfo
                label={t.shippingFee}
                value={`RM${money(
                  order.shippingFee
                )}`}
              />

              <DarkInfo
                label={t.totalAmount}
                value={`RM${money(
                  order.totalAmount
                )}`}
              />

              <DarkInfo
                label={t.cashback}
                value={`RM${money(
                  order.cashback
                )}`}
              />

              <DarkInfo
                label={t.rewardCredits}
                value={`RM${money(
                  order.rewardCreditsUsed
                )}`}
              />

              <DarkInfo
                label={t.payMerchant}
                value={`RM${money(
                  order.payAmount
                )}`}
                highlight
              />
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-[1fr_360px]">
            <div className="flex h-full flex-col gap-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                    <Package className="h-5 w-5 text-slate-700" />
                  </div>

                  <h2 className="text-xl font-black">
                    {t.products}
                  </h2>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {items.map((item) => (
                    <article
                      key={
                        item.orderItemId ||
                        item.productId
                      }
                      className="flex gap-4 rounded-2xl bg-slate-50 p-3"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                        <SafeImage
                          src={item.imageUrl || ""}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-black">
                          {item.productName}
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                          Qty: {item.quantity}
                        </p>

                        <p className="mt-2 text-sm font-black">
                          RM{money(item.subtotal)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                    <Truck className="h-5 w-5 text-slate-700" />
                  </div>

                  <h2 className="text-xl font-black">
                    {t.status}
                  </h2>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <LightInfo
                    label={t.paymentStatus}
                    value={order.paymentStatus}
                    badge
                  />

                  <LightInfo
                    label={t.orderStatus}
                    value={order.orderStatus}
                    badge
                  />

                  <LightInfo
                    label={t.fulfilmentStatus}
                    value={
                      fulfillmentLabelMap[
                        order.fulfillmentStatus
                      ]
                    }
                    badge
                  />

                  <LightInfo
                    label={t.fulfilmentMethod}
                    value={
                      order.deliveryMethod ===
                      "SELF_PICKUP"
                        ? t.selfPickup
                        : t.delivery
                    }
                  />

                  <LightInfo
                    label={t.recipient}
                    value={order.recipientName}
                  />

                  <LightInfo
                    label={t.phone}
                    value={order.recipientPhone}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    {t.address}
                  </p>

                  <p className="mt-2 text-sm font-black leading-6 text-slate-800">
                    {order.deliveryMethod ===
                    "SELF_PICKUP"
                      ? t.noAddress
                      : fullAddress || "—"}
                  </p>
                </div>

                {order.deliveryNote ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      {t.deliveryNote}
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                      {order.deliveryNote}
                    </p>
                  </div>
                ) : null}
              </section>

              <section className="flex flex-1 flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-xl font-black">
                  {t.paymentDetails}
                </h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <LightInfo
                    label={t.bank}
                    value={order.bankName}
                  />

                  <LightInfo
                    label={t.accountName}
                    value={order.bankAccountName}
                  />

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      {t.accountNumber}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <p className="min-w-0 flex-1 break-all text-sm font-black">
                        {order.bankAccountNo || "—"}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          void copyValue(
                            order.bankAccountNo,
                            "account"
                          )
                        }
                        className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-white px-3 text-xs font-black shadow-sm"
                      >
                        {copied === "account" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copied === "account"
                          ? t.copied
                          : t.copy}
                      </button>
                    </div>
                  </div>
                </div>

                {order.bankQrUrl ? (
                  <div className="mt-5 flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <SafeImage
                      src={order.bankQrUrl}
                      alt="Bank QR"
                      className="max-h-[320px] w-full object-contain"
                    />
                  </div>
                ) : null}
              </section>
            </div>

            <aside className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Receipt className="h-6 w-6 text-amber-600" />

                <h2 className="text-xl font-black">
                  {t.paymentReceipt}
                </h2>
              </div>

              {order.receiptUrl ? (
                <div className="mt-5 flex min-h-[320px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <SafeImage
                    src={order.receiptUrl}
                    alt={t.paymentReceipt}
                    className="max-h-[520px] w-full object-contain"
                  />
                </div>
              ) : (
                <div className="mt-5 flex min-h-[220px] flex-1 flex-col items-center justify-center rounded-2xl bg-slate-50 p-5 text-center">
                  <Clock3 className="h-8 w-8 text-slate-400" />

                  <p className="mt-3 text-sm font-black">
                    {t.receiptNotUploaded}
                  </p>
                </div>
              )}

              {canUpload ? (
                <label className="mt-5 flex min-h-13 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}

                  {uploading
                    ? t.uploading
                    : order.receiptUrl
                      ? t.uploadNewReceipt
                      : t.uploadReceipt}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceipt}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  {t.receiptSubmitted}
                </div>
              )}

              {order.merchantNote ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black text-amber-900">
                    {t.merchantNote}
                  </p>

                  <p className="mt-2 text-sm font-bold leading-6 text-amber-800">
                    {order.merchantNote}
                  </p>
                </div>
              ) : null}

              {canCancel ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="mt-4 min-h-12 w-full rounded-2xl border border-rose-200 bg-white px-5 text-sm font-black text-rose-600 disabled:opacity-50"
                >
                  {cancelling
                    ? t.cancelling
                    : t.cancelOrder}
                </button>
              ) : null}
            </aside>
          </div>

          <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                <Truck className="h-5 w-5 text-slate-700" />
              </div>

              <h2 className="text-xl font-black">
                {t.timeline}
              </h2>
            </div>

            <div className="mt-7 overflow-x-auto pb-2">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-7">
                  <TimelineStep
                    title={t.orderCreated}
                    time={order.createdAt}
                    complete={Boolean(order.createdAt)}
                    active={false}
                    step={1}
                    first
                  />

                  <TimelineStep
                    title={t.receiptUploaded}
                    time={order.receiptUploadedAt}
                    complete={Boolean(order.receiptUploadedAt)}
                    active={
                      !order.receiptUploadedAt &&
                      ![
                        "CANCELLED",
                        "PAYMENT_REJECTED",
                      ].includes(order.orderStatus)
                    }
                    step={2}
                  />

                  <TimelineStep
                    title={t.paymentApproved}
                    time={order.confirmedAt}
                    complete={Boolean(order.confirmedAt)}
                    active={
                      Boolean(order.receiptUploadedAt) &&
                      !order.confirmedAt &&
                      ![
                        "CANCELLED",
                        "PAYMENT_REJECTED",
                      ].includes(order.orderStatus)
                    }
                    step={3}
                  />

                  {fulfillmentSequence
                    .slice(1)
                    .map((status, index) => {
                      const statusIndex = index + 1;

                      const isComplete =
                        fulfillmentIndex >= statusIndex ||
                        order.orderStatus === "COMPLETED";

                      const isActive =
                        order.orderStatus === "PROCESSING" &&
                        fulfillmentIndex + 1 === statusIndex;

                      return (
                        <TimelineStep
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
                          last={
                            index ===
                            fulfillmentSequence.slice(1).length - 1
                          }
                        />
                      );
                    })}
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </MemberLayout>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] ${statusClasses(
        status
      )}`}
    >
      {label ||
        String(status || "").replaceAll(
          "_",
          " "
        )}
    </span>
  );
}

function DarkInfo({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-black ${
          highlight
            ? "text-amber-300"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function LightInfo({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <div className="mt-2">
        {badge ? (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusClasses(
              value
            )}`}
          >
            {value || "—"}
          </span>
        ) : (
          <p className="break-words text-sm font-black">
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

function TimelineStep({
  title,
  time,
  complete,
  active,
  step,
  first = false,
  last = false,
}: {
  title: string;
  time: string;
  complete: boolean;
  active: boolean;
  step: number;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative px-2 text-center">
      {!first ? (
        <div
          className={`absolute left-0 top-[22px] h-[3px] w-1/2 ${
            complete || active
              ? "bg-emerald-400"
              : "bg-slate-200"
          }`}
        />
      ) : null}

      {!last ? (
        <div
          className={`absolute right-0 top-[22px] h-[3px] w-1/2 ${
            complete
              ? "bg-emerald-400"
              : "bg-slate-200"
          }`}
        />
      ) : null}

      <div
        className={`relative z-10 mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-black shadow-sm ${
          complete
            ? "border-emerald-500 bg-emerald-500 text-white"
            : active
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-slate-200 bg-white text-slate-400"
        }`}
      >
        {complete ? (
          <Check className="h-5 w-5" />
        ) : (
          step
        )}
      </div>

      <p
        className={`mt-4 text-sm font-black leading-5 ${
          active
            ? "text-slate-950"
            : complete
              ? "text-emerald-800"
              : "text-slate-500"
        }`}
      >
        {title}
      </p>

      <p className="mt-1 min-h-[34px] text-xs font-semibold leading-5 text-slate-400">
        {time ? formatDate(time) : "—"}
      </p>
    </div>
  );
}

function money(value: unknown) {
  const amount =
    Number(value || 0);

  return Number.isFinite(amount)
    ? amount.toFixed(2)
    : "0.00";
}

function formatDate(value: unknown) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    String(value)
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    "en-MY"
  );
}