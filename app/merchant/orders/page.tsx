"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  CheckCircle2,
  Clock3,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  WalletCards,
  XCircle,
} from "lucide-react";

import { getMerchantOrders } from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

type MerchantOrder = {
  orderId: string;
  memberId: string;
  orderAmount: number;
  payAmount: number;
  itemCount?: number;
  paymentStatus: string;
  orderStatus: string;
  deliveryMethod: string;
  recipientName: string;
  recipientPhone: string;
  createdAt: string;
};

type StatusFilter =
  | "ALL"
  | "PENDING_PAYMENT"
  | "PAYMENT_REVIEW"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const copy = {
  en: {
    back: "Back to dashboard",
    title: "Online Orders",
    subtitle: "Review payments, process orders and manage fulfilment.",
    search: "Search order ID, member or recipient",
    all: "All",
    pendingPayment: "Pending Payment",
    paymentReview: "Payment Review",
    processing: "Processing",
    completed: "Completed",
    cancelled: "Cancelled",
    noOrders: "No orders found",
    noOrdersText: "Orders matching this filter will appear here.",
    refresh: "Refresh",
    order: "Order",
    member: "Member",
    recipient: "Recipient",
    total: "Total",
    created: "Created",
    delivery: "Delivery",
    selfPickup: "Self Pickup",
    viewDetails: "View details",
    loadError: "Unable to load online orders.",
  },
  zh: {
    back: "返回商家主页",
    title: "线上订单",
    subtitle: "审核付款、处理订单并管理配送。",
    search: "搜索订单编号、会员或收货人",
    all: "全部",
    pendingPayment: "等待付款",
    paymentReview: "付款审核",
    processing: "处理中",
    completed: "已完成",
    cancelled: "已取消",
    noOrders: "没有找到订单",
    noOrdersText: "符合当前筛选条件的订单会显示在这里。",
    refresh: "刷新",
    order: "订单",
    member: "会员",
    recipient: "收货人",
    total: "总额",
    created: "建立时间",
    delivery: "送货",
    selfPickup: "自行取货",
    viewDetails: "查看详情",
    loadError: "无法读取线上订单。",
  },
  ms: {
    back: "Kembali ke papan pemuka",
    title: "Pesanan Dalam Talian",
    subtitle: "Semak bayaran, proses pesanan dan urus pemenuhan.",
    search: "Cari ID pesanan, ahli atau penerima",
    all: "Semua",
    pendingPayment: "Menunggu Bayaran",
    paymentReview: "Semakan Bayaran",
    processing: "Diproses",
    completed: "Selesai",
    cancelled: "Dibatalkan",
    noOrders: "Tiada pesanan ditemui",
    noOrdersText: "Pesanan yang sepadan dengan penapis akan dipaparkan di sini.",
    refresh: "Muat semula",
    order: "Pesanan",
    member: "Ahli",
    recipient: "Penerima",
    total: "Jumlah",
    created: "Dicipta",
    delivery: "Penghantaran",
    selfPickup: "Ambil Sendiri",
    viewDetails: "Lihat butiran",
    loadError: "Tidak dapat memuatkan pesanan dalam talian.",
  },
} satisfies Record<LanguageCode, Record<string, string>>;

const filters: Array<{
  value: StatusFilter;
  key:
    | "all"
    | "pendingPayment"
    | "paymentReview"
    | "processing"
    | "completed"
    | "cancelled";
}> = [
  { value: "ALL", key: "all" },
  { value: "PENDING_PAYMENT", key: "pendingPayment" },
  { value: "PAYMENT_REVIEW", key: "paymentReview" },
  { value: "PROCESSING", key: "processing" },
  { value: "COMPLETED", key: "completed" },
  { value: "CANCELLED", key: "cancelled" },
];

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

function normalizeOrder(value: unknown): MerchantOrder {
  const row =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    orderId: String(row.orderId ?? row.ORDER_ID ?? ""),
    memberId: String(row.memberId ?? row.MEMBER_ID ?? ""),
    orderAmount: Number(row.orderAmount ?? row.ORDER_AMOUNT ?? 0),
    payAmount: Number(row.payAmount ?? row.PAY_AMOUNT ?? 0),
    itemCount: Number(row.itemCount ?? row.ITEM_COUNT ?? 0),
    paymentStatus: String(
      row.paymentStatus ?? row.PAYMENT_STATUS ?? ""
    ).toUpperCase(),
    orderStatus: String(
      row.orderStatus ?? row.ORDER_STATUS ?? ""
    ).toUpperCase(),
    deliveryMethod: String(
      row.deliveryMethod ??
        row.fulfillmentMethod ??
        row.FULFILLMENT_METHOD ??
        "DELIVERY"
    ).toUpperCase(),
    recipientName: String(
      row.recipientName ?? row.RECIPIENT_NAME ?? ""
    ),
    recipientPhone: String(
      row.recipientPhone ?? row.RECIPIENT_PHONE ?? ""
    ),
    createdAt: String(row.createdAt ?? row.CREATED_AT ?? ""),
  };
}

function statusClasses(status: string): string {
  switch (status) {
    case "PAYMENT_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "PROCESSING":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
    case "PAYMENT_REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
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

function getStatusIcon(status: string) {
  switch (status) {
    case "PAYMENT_REVIEW":
      return WalletCards;
    case "PROCESSING":
      return Truck;
    case "COMPLETED":
      return CheckCircle2;
    case "CANCELLED":
    case "PAYMENT_REJECTED":
      return XCircle;
    default:
      return Clock3;
  }
}

export default function MerchantOrdersPage() {
  const [language, setLanguage] =
    useState<LanguageCode>("en");
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const t = copy[language];

  useEffect(() => {
    const stored =
      window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (stored === "zh" || stored === "ms" || stored === "en") {
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

  const loadOrders = useCallback(async (silent = false) => {
    const merchantId = getMerchantId();

    if (!merchantId) {
      setError("Merchant session not found.");
      setLoading(false);
      return;
    }

    if (silent) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const result = await getMerchantOrders({
        merchantId,
        limit: 200,
      });

      const data = unwrapData(result);
      const list = Array.isArray(data.orders) ? data.orders : [];

      setOrders(list.map(normalizeOrder));
    } catch (loadError) {
      console.error(loadError);
      setError(t.loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      ALL: orders.length,
      PENDING_PAYMENT: 0,
      PAYMENT_REVIEW: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    orders.forEach((order) => {
      const status =
        order.orderStatus === "PAYMENT_REJECTED"
          ? "PENDING_PAYMENT"
          : order.orderStatus;

      if (status in result) {
        result[status as StatusFilter] += 1;
      }
    });

    return result;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const search = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter =
        filter === "ALL" ||
        order.orderStatus === filter ||
        (filter === "PENDING_PAYMENT" &&
          order.orderStatus === "PAYMENT_REJECTED");

      const matchesSearch =
        !search ||
        [
          order.orderId,
          order.memberId,
          order.recipientName,
          order.recipientPhone,
        ].some((value) => value.toLowerCase().includes(search));

      return matchesFilter && matchesSearch;
    });
  }, [filter, orders, query]);

  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            href="/merchant/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 no-underline shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-xl sm:px-8 sm:py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-slate-200">
                <ShoppingBag className="h-4 w-4" />
                Merchant
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                {t.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-slate-300 sm:text-base">
                {t.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadOrders(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              {t.refresh}
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {filters.slice(1).map((item) => {
            const Icon =
              item.value === "PAYMENT_REVIEW"
                ? WalletCards
                : item.value === "PROCESSING"
                  ? Truck
                  : item.value === "COMPLETED"
                    ? CheckCircle2
                    : item.value === "CANCELLED"
                      ? XCircle
                      : Clock3;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                  filter === item.value
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-950 hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5" />
                  <span className="text-2xl font-black">
                    {counts[item.value]}
                  </span>
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] opacity-75">
                  {t[item.key]}
                </p>
              </button>
            );
          })}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black transition ${
                    filter === item.value
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t[item.key]} ({counts[item.value]})
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
                <PackageSearch className="h-8 w-8 text-slate-500" />
              </div>
              <h2 className="mt-5 text-lg font-black text-slate-950">
                {t.noOrders}
              </h2>
              <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
                {t.noOrdersText}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {visibleOrders.map((order) => {
                const Icon = getStatusIcon(order.orderStatus);

                return (
                  <Link
                    key={order.orderId}
                    href={`/merchant/orders/${encodeURIComponent(
                      order.orderId
                    )}`}
                    className="group rounded-2xl border border-slate-200 bg-white p-4 no-underline transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg sm:p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-all text-base font-black text-slate-950">
                              {order.orderId}
                            </h3>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusClasses(
                                order.orderStatus
                              )}`}
                            >
                              {order.orderStatus.replaceAll("_", " ")}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {t.created}: {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="grid flex-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                            {t.member}
                          </p>
                          <p className="mt-1 truncate font-black text-slate-800">
                            {order.memberId || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                            {t.recipient}
                          </p>
                          <p className="mt-1 truncate font-black text-slate-800">
                            {order.recipientName || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                            {order.deliveryMethod === "SELF_PICKUP"
                              ? t.selfPickup
                              : t.delivery}
                          </p>
                          <p className="mt-1 truncate font-semibold text-slate-600">
                            {order.recipientPhone || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                            {t.total}
                          </p>
                          <p className="mt-1 text-base font-black text-slate-950">
                            {formatMoney(order.payAmount || order.orderAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="inline-flex items-center justify-end gap-2 text-sm font-black text-slate-950">
                        {t.viewDetails}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}