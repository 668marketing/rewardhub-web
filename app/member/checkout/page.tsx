"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Store,
} from "lucide-react";

import MemberLayout from "@/components/layout/MemberLayout";
import SafeImage from "@/components/ui/SafeImage";
import { useLanguage } from "@/hooks/useLanguage";

import {
  createMemberOrder,
  getMemberCheckoutPreview,
} from "@/lib/api";

import {
  clearMemberCart,
  MemberCartItem,
  readMemberCart,
} from "@/lib/memberCart";

type LanguageCode = "en" | "zh" | "ms";

type CheckoutPreviewItem = {
  productId: string;
  merchantId: string;
  productType?: string;
  productName: string;
  category?: string;
  imageUrl?: string;
  originalPrice?: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  shippingType?: string;
  shippingFee?: number;
  pointsPerUnit?: number;
  totalPoints?: number;
};

type CheckoutMerchant = {
  merchantId: string;
  businessName: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNo: string;
  bankQrUrl?: string;
};

type CheckoutDelivery = {
  deliveryMethod:
    | "DELIVERY"
    | "SELF_PICKUP";
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2: string;
  area: string;
  state: string;
  postcode: string;
  country: string;
  fullAddress: string;
  isComplete: boolean;
};

type CheckoutPreview = {
  memberId: string;
  merchantId: string;
  merchant: CheckoutMerchant;
  items: CheckoutPreviewItem[];
  itemCount: number;
  orderAmount: number;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  cashback: number;
  rewardCreditsUsed: number;
  payAmount: number;
  pointsEarned: number;
  memberTier: string;
  cashbackRate: number;
  marketingRate: number;
  marketingAmount: number;
  availableRewardCredits: number;
  rewardCreditEnabled: boolean;
  maxRewardCreditPercent: number;
  maxRewardCredits: number;
  delivery: CheckoutDelivery;
};

const textMap = {
  en: {
    title: "Checkout",
    subtitle: "Confirm your order and pay the merchant directly.",
    back: "Back to Cart",
    emptyTitle: "Your cart is empty",
    emptyText: "Add products before continuing to checkout.",
    browse: "Browse Marketplace",
    loading: "Calculating your member benefits...",
    orderItems: "Order Items",
    quantity: "Qty",
    orderSummary: "Order Summary",
    subtotal: "Product Subtotal",
    shippingFee: "Shipping Fee",
    freeShipping: "Free Shipping",
    totalAmount: "Order Total",
    cashback: "Member Cashback",
    rewardCredits: "Reward Credits",
    availableCredits: "Available",
    maximumCredits: "Maximum for this order",
    amountToPay: "Amount to Pay Merchant",
    points: "Points Earned",
    tier: "Membership Tier",
    merchantPayment: "Merchant Payment Details",
    bank: "Bank",
    accountName: "Account Name",
    accountNo: "Account Number",
    paymentNote:
      "After creating the order, transfer the displayed amount directly to this merchant and upload your receipt.",
    deliveryTitle:
      "Delivery Information",
    deliverySubtitle:
      "Your saved profile details will be locked into this order.",
    delivery: "Delivery",
    selfPickup: "Self Pickup",
    recipient: "Recipient",
    phone: "Phone",
    address: "Delivery Address",
    savedProfile:
      "Saved from Member Profile",
    editProfile: "Edit Profile",
    incompleteAddress:
      "Please complete your delivery address in Member Profile before creating this order.",
    pickupInfo:
      "The merchant will contact you with the pickup location and collection instructions.",
    memberNote:
      "Special Instructions",
    memberNotePlaceholder:
      "Optional: call before delivery, leave at guard house, fragile item, gift wrapping...",
    createOrder: "Create Order",
    creating: "Creating Order...",
    terms:
      "By creating this order, product prices, benefits and merchant payment details will be locked.",
    errorTitle: "Unable to prepare checkout",
    retry: "Retry",
    creditDisabled:
      "This merchant does not accept Reward Credits.",
    noQr: "Bank QR is not available.",
  },
  zh: {
    title: "确认订单",
    subtitle: "确认商品后，直接付款给商家。",
    back: "返回购物车",
    emptyTitle: "购物车是空的",
    emptyText: "请先把商品加入购物车，再继续结账。",
    browse: "浏览商家市场",
    loading: "正在计算会员福利...",
    orderItems: "订单商品",
    quantity: "数量",
    orderSummary: "订单结算",
    subtotal: "商品小计",
    shippingFee: "运费",
    freeShipping: "包邮",
    totalAmount: "订单总额",
    cashback: "会员现金回扣",
    rewardCredits: "Reward Credits",
    availableCredits: "可用余额",
    maximumCredits: "本订单最多可用",
    amountToPay: "需要付款给商家",
    points: "可获得积分",
    tier: "会员等级",
    merchantPayment: "商家收款资料",
    bank: "银行",
    accountName: "账户名称",
    accountNo: "银行账号",
    paymentNote:
      "建立订单后，请把页面显示的金额直接转账给商家，然后上传付款单据。",
    deliveryTitle: "配送资料",
    deliverySubtitle:
      "会员资料中保存的收货信息会作为订单快照保存。",
    delivery: "送货",
    selfPickup: "自行取货",
    recipient: "收货人",
    phone: "联系电话",
    address: "收货地址",
    savedProfile:
      "来自会员资料",
    editProfile: "编辑会员资料",
    incompleteAddress:
      "请先在会员资料中填写完整收货地址，再建立订单。",
    pickupInfo:
      "商家会联系你并提供取货地点和取货说明。",
    memberNote: "特别说明",
    memberNotePlaceholder:
      "选填：送货前致电、放在警卫亭、易碎物品、礼物包装等...",
    createOrder: "建立订单",
    creating: "正在建立订单...",
    terms:
      "建立订单后，商品价格、会员福利和商家收款资料都会被锁定。",
    errorTitle: "无法准备结账资料",
    retry: "重新加载",
    creditDisabled:
      "这位商家不接受 Reward Credits。",
    noQr: "商家暂时没有提供银行二维码。",
  },
  ms: {
    title: "Pengesahan Pesanan",
    subtitle:
      "Sahkan produk dan bayar terus kepada peniaga.",
    back: "Kembali ke Troli",
    emptyTitle: "Troli anda kosong",
    emptyText:
      "Tambah produk sebelum meneruskan pembayaran.",
    browse: "Lihat Marketplace",
    loading: "Mengira manfaat ahli...",
    orderItems: "Item Pesanan",
    quantity: "Kuantiti",
    orderSummary: "Ringkasan Pesanan",
    subtotal: "Subjumlah Produk",
    shippingFee: "Caj Penghantaran",
    freeShipping: "Penghantaran Percuma",
    totalAmount: "Jumlah Pesanan",
    cashback: "Pulangan Tunai Ahli",
    rewardCredits: "Reward Credits",
    availableCredits: "Baki Tersedia",
    maximumCredits: "Maksimum untuk pesanan ini",
    amountToPay: "Bayaran kepada Peniaga",
    points: "Mata Diperoleh",
    tier: "Tahap Keahlian",
    merchantPayment: "Maklumat Bayaran Peniaga",
    bank: "Bank",
    accountName: "Nama Akaun",
    accountNo: "Nombor Akaun",
    paymentNote:
      "Selepas pesanan dibuat, pindahkan jumlah yang dipaparkan terus kepada peniaga dan muat naik resit.",
    deliveryTitle:
      "Maklumat Penghantaran",
    deliverySubtitle:
      "Maklumat profil yang disimpan akan dikunci sebagai salinan dalam pesanan ini.",
    delivery: "Penghantaran",
    selfPickup: "Ambil Sendiri",
    recipient: "Penerima",
    phone: "Telefon",
    address:
      "Alamat Penghantaran",
    savedProfile:
      "Disimpan daripada Profil Ahli",
    editProfile: "Edit Profil",
    incompleteAddress:
      "Sila lengkapkan alamat penghantaran dalam Profil Ahli sebelum membuat pesanan.",
    pickupInfo:
      "Peniaga akan menghubungi anda dengan lokasi dan arahan pengambilan.",
    memberNote: "Arahan Khas",
    memberNotePlaceholder:
      "Pilihan: hubungi sebelum penghantaran, tinggalkan di pondok pengawal, barang mudah pecah, pembalut hadiah...",
    createOrder: "Buat Pesanan",
    creating: "Membuat Pesanan...",
    terms:
      "Selepas pesanan dibuat, harga, manfaat dan maklumat pembayaran akan dikunci.",
    errorTitle: "Tidak dapat menyediakan checkout",
    retry: "Cuba Lagi",
    creditDisabled:
      "Peniaga ini tidak menerima Reward Credits.",
    noQr: "Kod QR bank tidak tersedia.",
  },
} as const;

function normalizeLanguage(
  value: unknown
): LanguageCode {
  return value === "zh" || value === "ms"
    ? value
    : "en";
}

function getStoredMemberId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const raw =
      window.localStorage.getItem("member");

    if (!raw) {
      return "";
    }

    const parsed = JSON.parse(raw);

    return String(
      parsed?.memberId ??
        parsed?.MEMBER_ID ??
        parsed?.id ??
        parsed?.profile?.memberId ??
        parsed?.profile?.MEMBER_ID ??
        parsed?.member?.memberId ??
        parsed?.member?.MEMBER_ID ??
        parsed?.data?.memberId ??
        parsed?.data?.MEMBER_ID ??
        ""
    ).trim();
  } catch {
    return "";
  }
}

function unwrapResponse(
  response: unknown
): Record<string, any> {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return {};
  }

  const root =
    response as Record<string, any>;

  const first =
    root.data &&
    typeof root.data === "object"
      ? root.data
      : root;

  const second =
    first.data &&
    typeof first.data === "object"
      ? first.data
      : first;

  return second;
}

export default function MemberCheckoutPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy =
    textMap[
      normalizeLanguage(language)
    ];

  const [cartItems, setCartItems] =
    useState<MemberCartItem[]>([]);

  const [preview, setPreview] =
    useState<CheckoutPreview | null>(
      null
    );

  const [rewardCredits, setRewardCredits] =
    useState(0);

  const [memberNote, setMemberNote] =
    useState("");

  const [
    deliveryMethod,
    setDeliveryMethod,
  ] = useState<
    "DELIVERY" | "SELF_PICKUP"
  >("DELIVERY");

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const requestItems = useMemo(
    () =>
      cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    [cartItems]
  );

  async function loadPreview(
    credits: number,
    nextDeliveryMethod:
      | "DELIVERY"
      | "SELF_PICKUP" =
      deliveryMethod
  ) {
    const memberId =
      getStoredMemberId();

    const items =
      readMemberCart();

    setCartItems(items);

    if (!memberId) {
      setError(
        "Member session not found."
      );
      setLoading(false);
      return;
    }

    if (items.length === 0) {
      setPreview(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await getMemberCheckoutPreview({
          memberId,
          items: items.map(
            (item) => ({
              productId:
                item.productId,
              quantity:
                item.quantity,
            })
          ),
          rewardCreditsUsed:
            credits,
          deliveryMethod:
            nextDeliveryMethod,
        });

      const data =
        unwrapResponse(response);

      const nextPreview =
        data as CheckoutPreview;

      setPreview(nextPreview);

      if (
        nextPreview.delivery
          ?.deliveryMethod
      ) {
        setDeliveryMethod(
          nextPreview.delivery
            .deliveryMethod
        );
      }
    } catch (loadError) {
      setPreview(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load checkout."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPreview(
      0,
      "DELIVERY"
    );
  }, []);

  async function applyRewardCredits(
    nextValue: number
  ) {
    const safeValue = Math.max(
      0,
      nextValue
    );

    setRewardCredits(safeValue);
    await loadPreview(safeValue);
  }

  async function handleDeliveryMethodChange(
    nextMethod:
      | "DELIVERY"
      | "SELF_PICKUP"
  ) {
    setDeliveryMethod(
      nextMethod
    );

    await loadPreview(
      rewardCredits,
      nextMethod
    );
  }

  async function handleCreateOrder() {
    if (
      !preview ||
      creating ||
      requestItems.length === 0
    ) {
      return;
    }

    const memberId =
      getStoredMemberId();

    if (!memberId) {
      setError(
        "Member session not found."
      );
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response =
        await createMemberOrder({
          memberId,
          items: requestItems,
          rewardCreditsUsed:
            rewardCredits,
          paymentMethod:
            "Bank Transfer",
          deliveryMethod,
          memberNote,
        });

      const data =
        unwrapResponse(response);

      const orderId =
        String(
          data.orderId || ""
        ).trim();

      if (!orderId) {
        throw new Error(
          "Order ID was not returned."
        );
      }

      clearMemberCart();

      router.replace(
        `/member/orders/${encodeURIComponent(
          orderId
        )}`
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create order."
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <MemberLayout>
        <main className="min-h-screen bg-[#f4f6fa] px-4 py-8">
          <section className="mx-auto max-w-5xl">
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-amber-500" />

              <p className="mt-4 text-sm font-black text-slate-600">
                {copy.loading}
              </p>
            </div>
          </section>
        </main>
      </MemberLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <MemberLayout>
        <main className="min-h-screen bg-[#f4f6fa] px-4 py-8">
          <section className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-amber-500" />

            <h1 className="mt-5 text-2xl font-black">
              {copy.emptyTitle}
            </h1>

            <p className="mt-2 text-sm font-bold text-slate-500">
              {copy.emptyText}
            </p>

            <Link
              href="/member/marketplace"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-black text-white no-underline"
            >
              {copy.browse}
            </Link>
          </section>
        </main>
      </MemberLayout>
    );
  }

  if (error || !preview) {
    return (
      <MemberLayout>
        <main className="min-h-screen bg-[#f4f6fa] px-4 py-8">
          <section className="mx-auto max-w-3xl rounded-[32px] border border-rose-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black">
              {copy.errorTitle}
            </h1>

            <p className="mt-3 text-sm font-bold leading-6 text-rose-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadPreview(
                  rewardCredits,
                  deliveryMethod
                )
              }
              className="mt-6 min-h-12 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white"
            >
              {copy.retry}
            </button>
          </section>
        </main>
      </MemberLayout>
    );
  }

  const maxUsableCredits =
    Math.min(
      preview.availableRewardCredits,
      preview.maxRewardCredits
    );

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f4f6fa] px-4 py-6 text-slate-950 sm:px-6 sm:py-9 lg:px-8">
        <section className="mx-auto w-full max-w-6xl">
          <Link
            href="/member/cart"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 no-underline shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Link>

          <div className="mt-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
              RewardHub Member
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              {copy.title}
            </h1>

            <p className="mt-2 text-sm font-bold text-slate-500">
              {copy.subtitle}
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-xl font-black">
                  {copy.orderItems}
                </h2>

                <div className="mt-5 space-y-4">
                  {preview.items.map(
                    (item) => (
                      <article
                        key={
                          item.productId
                        }
                        className="flex gap-4 rounded-2xl bg-slate-50 p-3"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                          <SafeImage
                            src={
                              item.imageUrl ||
                              ""
                            }
                            alt={
                              item.productName
                            }
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-black">
                            {item.productName}
                          </p>

                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {copy.quantity}:{" "}
                            {item.quantity}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black">
                              RM
                              {money(
                                item.subtotal
                              )}
                            </p>

                            {String(
                              item.shippingType || ""
                            ).toUpperCase() === "FIXED" ? (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700 ring-1 ring-inset ring-blue-200">
                                {copy.shippingFee}: RM
                                {money(
                                  item.shippingFee
                                )}
                              </span>
                            ) : String(
                                item.shippingType || ""
                              ).toUpperCase() === "FREE" ? (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                {copy.freeShipping}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                      <MapPin className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-xl font-black">
                        {copy.deliveryTitle}
                      </h2>

                      <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                        {copy.deliverySubtitle}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/member/profile"
                    className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 no-underline transition hover:bg-slate-50"
                  >
                    {copy.editProfile}
                  </Link>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-2">
                  <button
                    type="button"
                    onClick={() =>
                      void handleDeliveryMethodChange(
                        "DELIVERY"
                      )
                    }
                    className={[
                      "flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition",
                      deliveryMethod ===
                      "DELIVERY"
                        ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-500 hover:bg-white/70",
                    ].join(" ")}
                  >
                    <PackageCheck className="h-4 w-4" />
                    {copy.delivery}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleDeliveryMethodChange(
                        "SELF_PICKUP"
                      )
                    }
                    className={[
                      "flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition",
                      deliveryMethod ===
                      "SELF_PICKUP"
                        ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-500 hover:bg-white/70",
                    ].join(" ")}
                  >
                    <Store className="h-4 w-4" />
                    {copy.selfPickup}
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      {copy.savedProfile}
                    </p>

                    {preview.delivery
                      .isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <InfoBox
                      label={copy.recipient}
                      value={
                        preview.delivery
                          .recipientName
                      }
                    />

                    <InfoBox
                      label={copy.phone}
                      value={
                        preview.delivery
                          .recipientPhone
                      }
                    />
                  </div>

                  {deliveryMethod ===
                  "DELIVERY" ? (
                    <div className="mt-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                        {copy.address}
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm font-black leading-6 text-slate-800">
                        {preview.delivery
                          .fullAddress ||
                          "-"}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
                      <p className="text-sm font-bold leading-6 text-sky-800">
                        {copy.pickupInfo}
                      </p>
                    </div>
                  )}
                </div>

                {!preview.delivery
                  .isComplete ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm font-black leading-6 text-rose-700">
                      {
                        copy.incompleteAddress
                      }
                    </p>
                  </div>
                ) : null}
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-amber-600" />

                  <h2 className="text-xl font-black">
                    {copy.merchantPayment}
                  </h2>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <InfoBox
                    label={copy.bank}
                    value={
                      preview.merchant
                        .bankName
                    }
                  />

                  <InfoBox
                    label={
                      copy.accountName
                    }
                    value={
                      preview.merchant
                        .bankAccountName
                    }
                  />

                  <InfoBox
                    label={
                      copy.accountNo
                    }
                    value={
                      preview.merchant
                        .bankAccountNo
                    }
                  />
                </div>

                {preview.merchant
                  .bankQrUrl ? (
                  <div className="mt-5 h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <SafeImage
                      src={
                        preview.merchant
                          .bankQrUrl
                      }
                      alt="Bank QR"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                    {copy.noQr}
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold leading-6 text-amber-900">
                    {copy.paymentNote}
                  </p>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <label className="text-sm font-black">
                  {copy.memberNote}
                </label>

                <textarea
                  value={memberNote}
                  onChange={(event) =>
                    setMemberNote(
                      event.target.value
                    )
                  }
                  maxLength={500}
                  placeholder={
                    copy.memberNotePlaceholder
                  }
                  className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none focus:border-slate-400"
                />
              </section>
            </div>

            <aside className="h-fit rounded-[28px] bg-[#08111f] p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)] lg:sticky lg:top-28">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-amber-300" />

                <h2 className="text-xl font-black">
                  {copy.orderSummary}
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                <SummaryRow
                  label={copy.subtotal}
                  value={`RM${money(
                    preview.subtotal ??
                      preview.orderAmount
                  )}`}
                />

                <SummaryRow
                  label={copy.shippingFee}
                  value={
                    preview.shippingFee > 0
                      ? `RM${money(
                          preview.shippingFee
                        )}`
                      : copy.freeShipping
                  }
                />

                <SummaryRow
                  label={copy.totalAmount}
                  value={`RM${money(
                    preview.totalAmount ??
                      (
                        Number(
                          preview.orderAmount || 0
                        ) +
                        Number(
                          preview.shippingFee || 0
                        )
                      )
                  )}`}
                />

                <div className="border-t border-white/10 pt-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    RewardHub Benefits
                  </p>

                  <SummaryRow
                    label={copy.cashback}
                    value={`- RM${money(
                      preview.cashback
                    )}`}
                    accent
                  />
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <label className="text-xs font-black text-slate-300">
                    {copy.rewardCredits}
                  </label>

                  <input
                    type="number"
                    min={0}
                    max={
                      maxUsableCredits
                    }
                    step="0.01"
                    disabled={
                      !preview.rewardCreditEnabled
                    }
                    value={
                      rewardCredits
                    }
                    onChange={(event) =>
                      setRewardCredits(
                        Math.max(
                          0,
                          Number(
                            event.target
                              .value || 0
                          )
                        )
                      )
                    }
                    onBlur={() =>
                      void applyRewardCredits(
                        Math.min(
                          rewardCredits,
                          maxUsableCredits
                        )
                      )
                    }
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white outline-none disabled:cursor-not-allowed disabled:opacity-40"
                  />

                  <div className="mt-3 space-y-1 text-[10px] font-bold text-slate-400">
                    <p>
                      {copy.availableCredits}:{" "}
                      {money(
                        preview.availableRewardCredits
                      )}
                    </p>

                    <p>
                      {copy.maximumCredits}:{" "}
                      {money(
                        preview.maxRewardCredits
                      )}
                    </p>
                  </div>

                  {!preview.rewardCreditEnabled ? (
                    <p className="mt-3 text-xs font-bold text-amber-300">
                      {copy.creditDisabled}
                    </p>
                  ) : null}
                </div>

                <SummaryRow
                  label={copy.rewardCredits}
                  value={`- RM${money(
                    preview.rewardCreditsUsed
                  )}`}
                  accent
                />

                <SummaryRow
                  label={copy.points}
                  value={`${formatNumber(
                    preview.pointsEarned
                  )} pts`}
                />

                <SummaryRow
                  label={copy.tier}
                  value={
                    preview.memberTier
                  }
                />

                <div className="border-t border-white/10 pt-4">
                  <SummaryRow
                    label={copy.amountToPay}
                    value={`RM${money(
                      preview.payAmount
                    )}`}
                    large
                  />
                </div>
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl bg-rose-500/15 p-4 text-sm font-bold text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={
                  handleCreateOrder
                }
                disabled={
                  creating ||
                  !preview.delivery
                    .isComplete
                }
                className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 px-5 text-sm font-black text-slate-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {copy.creating}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    {copy.createOrder}
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[10px] font-bold leading-4 text-slate-500">
                {copy.terms}
              </p>
            </aside>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent = false,
  large = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          large
            ? "text-sm font-black text-white"
            : "text-sm font-bold text-slate-400"
        }
      >
        {label}
      </span>

      <span
        className={
          large
            ? "text-2xl font-black text-amber-300"
            : accent
              ? "text-sm font-black text-emerald-300"
              : "text-sm font-black text-white"
        }
      >
        {value}
      </span>
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

function formatNumber(value: unknown) {
  const amount =
    Number(value || 0);

  return Number.isFinite(amount)
    ? new Intl.NumberFormat(
        "en-US",
        {
          maximumFractionDigits: 0,
        }
      ).format(amount)
    : "0";
}