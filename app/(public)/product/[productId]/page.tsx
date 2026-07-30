"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import PublicLayout from "@/components/layout/PublicLayout";
import { useLanguage } from "@/hooks/useLanguage";
import { getProductDetail } from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

type ProductImageItem = {
  imageUrl?: string;
  url?: string;
  src?: string;
};

type MerchantInfo = {
  merchantId?: string;
  displayName?: string;
  businessName?: string;
  merchantName?: string;
  category?: string;
  logoUrl?: string;
  merchantLogo?: string;
  imageUrl?: string;
  marketingBudget?: number | string;
  state?: string;
  area?: string;
  address?: string;
  verified?: boolean;
};

type ProductDetail = {
  productId?: string;
  merchantId?: string;
  productName?: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  productType?: string;
  price?: number | string;
  originalPrice?: number | string;
  imageUrl?: string;
  productImage?: string;
  thumbnailUrl?: string;
  images?: Array<string | ProductImageItem>;
  gallery?: Array<string | ProductImageItem>;
  pointsEarned?: number | string;
  points?: number | string;
  stock?: number | string;
  status?: string;
  isActive?: boolean;
  availability?: string;
  merchant?: MerchantInfo;
};

const pageText = {
  en: {
    marketplace: "Marketplace",
    backToMerchant: "Back to Merchant",
    back: "Back",
    productNotFound: "Product not found.",
    productIdMissing: "Product ID is missing.",
    unableToLoadProduct: "Unable to load product.",
    unableToOpenProduct: "Unable to Open Product",
    rewardHubProduct: "RewardHub Product",
    rewardHubMerchant: "RewardHub Merchant",
    product: "Product",
    available: "Available",
    unavailable: "Unavailable",
    outOfStock: "Out of Stock",
    save: "Save",
    earn: "Earn",
    pts: "pts",
    productPrice: "Product Price",
    memberOnlyPurchase: "Member-Only Purchase",
    memberOnlyDescription:
      "This public page is for viewing only. Log in as a RewardHub member to purchase and receive member benefits.",
    loginToPurchase: "Member Login to Purchase",
    registerAsMember: "Register as Member",
    memberBenefits: "Member Benefits",
    cashbackByTier: "Cashback by Membership Tier",
    basedOnMerchantBudget: "Based on merchant budget",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    entryTier: "Entry tier",
    goldMember: "Gold member",
    topTier: "Top tier",
    pointsEarned: "Points Earned",
    paymentToMerchant: "Payment",
    paymentToMerchantValue: "Paid directly to merchant",
    productInformation: "Product Information",
    description: "Description",
    defaultDescription:
      "This product is available from a RewardHub partner merchant.",
    category: "Category",
    general: "General",
    availability: "Availability",
    points: "Points",
    merchant: "Merchant",
    viewMerchantProfile: "View Merchant Profile",
    verifiedMerchant: "Verified Merchant",
    publicViewingOnly: "Public Viewing Only",
    publicViewingNote:
      "Guests cannot purchase here. RewardHub members can log in to continue to the member product page.",
    continueAsMember: "Continue as Member",
    productImage: "Product Image",
    loginRequiredText:
      "Purchases are available only to logged-in RewardHub members.",
  },
  zh: {
    marketplace: "商家市场",
    backToMerchant: "返回商家页面",
    back: "返回",
    productNotFound: "找不到商品。",
    productIdMissing: "缺少商品 ID。",
    unableToLoadProduct: "无法加载商品。",
    unableToOpenProduct: "无法打开商品",
    rewardHubProduct: "RewardHub 商品",
    rewardHubMerchant: "RewardHub 合作商家",
    product: "商品",
    available: "可购买",
    unavailable: "暂不可用",
    outOfStock: "已售罄",
    save: "节省",
    earn: "可获得",
    pts: "积分",
    productPrice: "商品价格",
    memberOnlyPurchase: "仅限会员购买",
    memberOnlyDescription:
      "这个公开页面只供浏览。登录 RewardHub 会员账户后，才可以购买并获得会员福利。",
    loginToPurchase: "会员登录后购买",
    registerAsMember: "注册成为会员",
    memberBenefits: "会员福利",
    cashbackByTier: "不同会员等级现金回扣",
    basedOnMerchantBudget: "根据商家营销预算计算",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    entryTier: "基础会员",
    goldMember: "Gold 会员",
    topTier: "最高等级",
    pointsEarned: "可获得积分",
    paymentToMerchant: "付款方式",
    paymentToMerchantValue: "款项直接支付给商家",
    productInformation: "商品资料",
    description: "商品说明",
    defaultDescription: "此商品由 RewardHub 合作商家提供。",
    category: "分类",
    general: "一般商品",
    availability: "商品状态",
    points: "积分",
    merchant: "商家",
    viewMerchantProfile: "查看商家页面",
    verifiedMerchant: "已认证商家",
    publicViewingOnly: "公开页面仅供浏览",
    publicViewingNote:
      "访客不能在这里购买。RewardHub 会员登录后可前往会员商品页面继续购买。",
    continueAsMember: "以会员身份继续",
    productImage: "商品图片",
    loginRequiredText: "只有已登录的 RewardHub 会员才可以购买。",
  },
  ms: {
    marketplace: "Marketplace",
    backToMerchant: "Kembali ke Peniaga",
    back: "Kembali",
    productNotFound: "Produk tidak ditemui.",
    productIdMissing: "ID produk tiada.",
    unableToLoadProduct: "Tidak dapat memuatkan produk.",
    unableToOpenProduct: "Tidak Dapat Membuka Produk",
    rewardHubProduct: "Produk RewardHub",
    rewardHubMerchant: "Peniaga RewardHub",
    product: "Produk",
    available: "Tersedia",
    unavailable: "Tidak Tersedia",
    outOfStock: "Stok Habis",
    save: "Jimat",
    earn: "Dapat",
    pts: "mata",
    productPrice: "Harga Produk",
    memberOnlyPurchase: "Pembelian Ahli Sahaja",
    memberOnlyDescription:
      "Halaman awam ini untuk paparan sahaja. Log masuk sebagai ahli RewardHub untuk membeli dan menerima manfaat ahli.",
    loginToPurchase: "Log Masuk Ahli untuk Membeli",
    registerAsMember: "Daftar Sebagai Ahli",
    memberBenefits: "Manfaat Ahli",
    cashbackByTier: "Pulangan Tunai Mengikut Tahap",
    basedOnMerchantBudget: "Berdasarkan bajet peniaga",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    entryTier: "Tahap permulaan",
    goldMember: "Ahli Gold",
    topTier: "Tahap tertinggi",
    pointsEarned: "Mata Diperoleh",
    paymentToMerchant: "Pembayaran",
    paymentToMerchantValue: "Dibayar terus kepada peniaga",
    productInformation: "Maklumat Produk",
    description: "Penerangan",
    defaultDescription:
      "Produk ini tersedia daripada peniaga rakan RewardHub.",
    category: "Kategori",
    general: "Umum",
    availability: "Ketersediaan",
    points: "Mata",
    merchant: "Peniaga",
    viewMerchantProfile: "Lihat Profil Peniaga",
    verifiedMerchant: "Peniaga Disahkan",
    publicViewingOnly: "Paparan Awam Sahaja",
    publicViewingNote:
      "Tetamu tidak boleh membeli di sini. Ahli RewardHub boleh log masuk untuk meneruskan ke halaman produk ahli.",
    continueAsMember: "Teruskan Sebagai Ahli",
    productImage: "Imej Produk",
    loginRequiredText:
      "Pembelian hanya tersedia kepada ahli RewardHub yang telah log masuk.",
  },
} as const;

function normalizeLanguage(value: unknown): LanguageCode {
  return value === "zh" || value === "ms" ? value : "en";
}

function unwrapProductResponse(response: unknown): ProductDetail | null {
  if (!response || typeof response !== "object") return null;

  const root = response as Record<string, unknown>;
  const first =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const second =
    first.data && typeof first.data === "object"
      ? (first.data as Record<string, unknown>)
      : first;
  const result =
    second.result && typeof second.result === "object"
      ? (second.result as Record<string, unknown>)
      : second;
  const product =
    result.product && typeof result.product === "object"
      ? (result.product as ProductDetail)
      : (result as ProductDetail);

  return product && typeof product === "object" ? product : null;
}

function getProductImages(product: ProductDetail): string[] {
  const images: string[] = [];

  function addImage(value: unknown) {
    const image = String(value || "").trim();
    if (image && !images.includes(image)) images.push(image);
  }

  addImage(product.imageUrl);
  addImage(product.productImage);
  addImage(product.thumbnailUrl);

  [product.images, product.gallery].forEach((gallery) => {
    if (!Array.isArray(gallery)) return;

    gallery.forEach((item) => {
      if (typeof item === "string") {
        addImage(item);
      } else if (item && typeof item === "object") {
        addImage(item.imageUrl || item.url || item.src);
      }
    });
  });

  return images;
}

function getProductStatus(
  product: ProductDetail,
  labels: { unavailable: string; outOfStock: string; available: string }
) {
  const status = String(product.status || product.availability || "")
    .trim()
    .toUpperCase();
  const stock = Number(product.stock);

  if (
    product.isActive === false ||
    status === "INACTIVE" ||
    status === "UNAVAILABLE" ||
    status === "DRAFT"
  ) {
    return { label: labels.unavailable, available: false };
  }

  if (
    status === "OUT_OF_STOCK" ||
    (!Number.isNaN(stock) && stock === 0)
  ) {
    return { label: labels.outOfStock, available: false };
  }

  return { label: labels.available, available: true };
}

export default function PublicProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ productId?: string }>();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const currentLanguage = normalizeLanguage(language);
  const copy = pageText[currentLanguage];
  const productId = decodeURIComponent(String(params?.productId || ""));
  const refCode = String(searchParams.get("ref") || "").trim();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (refCode) localStorage.setItem("rewardhub_ref", refCode);
  }, [refCode]);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      if (!productId) {
        setError(copy.productIdMissing);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await getProductDetail(productId);
        const productData = unwrapProductResponse(response);

        if (!productData) throw new Error(copy.productNotFound);

        if (!cancelled) {
          setProduct(productData);
          setSelectedImageIndex(0);
        }
      } catch (loadError) {
        console.error("Failed to load public product:", loadError);

        if (!cancelled) {
          setProduct(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : copy.unableToLoadProduct
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [
    productId,
    copy.productIdMissing,
    copy.productNotFound,
    copy.unableToLoadProduct,
  ]);

  const images = useMemo(
    () => (product ? getProductImages(product) : []),
    [product]
  );

  if (loading) {
    return (
      <PublicLayout>
        <ProductLoadingPage />
      </PublicLayout>
    );
  }

  if (error || !product) {
    return (
      <PublicLayout>
        <ProductErrorPage
          message={error || copy.productNotFound}
          backLabel={copy.back}
          title={copy.unableToOpenProduct}
          onBack={() => router.back()}
        />
      </PublicLayout>
    );
  }

  const merchant = product.merchant || {};
  const merchantId = String(
    product.merchantId || merchant.merchantId || ""
  ).trim();
  const merchantName = String(
    merchant.displayName ||
      merchant.businessName ||
      merchant.merchantName ||
      copy.rewardHubMerchant
  ).trim();
  const productName = String(
    product.productName || product.name || product.title || copy.product
  ).trim();
  const merchantLogo = String(
    merchant.logoUrl || merchant.merchantLogo || merchant.imageUrl || ""
  ).trim();
  const marketingBudget = Number(merchant.marketingBudget || 5);
  const silverRate = marketingBudget * 0.1;
  const goldRate = marketingBudget * 0.2;
  const platinumRate = marketingBudget * 0.3;
  const price = Number(product.price || 0);
  const originalPrice = Number(product.originalPrice || 0);
  const hasDiscount = originalPrice > price && originalPrice > 0;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const pointsEarned = Number(
    product.pointsEarned ?? product.points ?? price
  );
  const productStatus = getProductStatus(product, {
    unavailable: copy.unavailable,
    outOfStock: copy.outOfStock,
    available: copy.available,
  });
  const activeImage = images[selectedImageIndex] || "";

  const merchantHref = merchantId
    ? refCode
      ? `/merchant/${encodeURIComponent(merchantId)}?ref=${encodeURIComponent(refCode)}`
      : `/merchant/${encodeURIComponent(merchantId)}`
    : refCode
      ? `/marketplace?ref=${encodeURIComponent(refCode)}`
      : "/marketplace";

  const memberProductHref = refCode
    ? `/member/product/${encodeURIComponent(productId)}?ref=${encodeURIComponent(refCode)}`
    : `/member/product/${encodeURIComponent(productId)}`;

  const loginHref = refCode
    ? `/login?redirect=${encodeURIComponent(memberProductHref)}&ref=${encodeURIComponent(refCode)}`
    : `/login?redirect=${encodeURIComponent(memberProductHref)}`;

  const registerHref = refCode
    ? `/register?ref=${encodeURIComponent(refCode)}`
    : "/register";

  return (
    <PublicLayout>
      <main className="min-h-screen bg-[#f4f6fa] pb-32 text-slate-950 lg:pb-14">
        <section className="mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Link
              href={merchantHref}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <span aria-hidden="true">←</span>
              {copy.backToMerchant}
            </Link>

            <div className="hidden items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400 sm:flex">
              <span>{copy.marketplace}</span>
              <span>/</span>
              <span className="max-w-[240px] truncate text-slate-600">
                {productName}
              </span>
            </div>
          </div>

          <div className="mb-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-lg">
                🔒
              </div>

              <div>
                <p className="text-sm font-black text-amber-950">
                  {copy.publicViewingOnly}
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-amber-800 sm:text-sm">
                  {copy.publicViewingNote}
                </p>
              </div>
            </div>
          </div>

          <article className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:rounded-[36px]">
            <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
              <div className="border-b border-slate-200 bg-[#0a1220] p-3 sm:p-5 lg:border-b-0 lg:border-r">
                <div className="relative overflow-hidden rounded-[22px] bg-[#101a2b] sm:rounded-[28px]">
                  <div className="relative aspect-[4/3] w-full">
                    {activeImage ? (
                      <img
                        src={getDisplayImageUrl(activeImage)}
                        alt={productName}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ProductPlaceholder label={copy.productImage} />
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <StatusBadge
                        available={productStatus.available}
                        text={productStatus.label}
                      />

                      {hasDiscount ? (
                        <span className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-950 shadow-lg">
                          {copy.save} {discountPercentage}%
                        </span>
                      ) : null}
                    </div>

                    <div className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-lg">
                      {copy.rewardHubProduct}
                    </div>
                  </div>
                </div>

                {images.length > 1 ? (
                  <div className="mt-3 grid grid-cols-5 gap-2 sm:mt-4 sm:gap-3">
                    {images.slice(0, 5).map((image, index) => {
                      const selected = index === selectedImageIndex;

                      return (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative aspect-square overflow-hidden rounded-xl border-2 transition sm:rounded-2xl ${
                            selected
                              ? "border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.15)]"
                              : "border-white/10 opacity-65 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={getDisplayImageUrl(image)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col p-5 sm:p-8 lg:p-9 xl:p-11">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-amber-700 ring-1 ring-inset ring-amber-200">
                      {product.category || copy.rewardHubProduct}
                    </span>

                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      {copy.earn} {formatNumber(pointsEarned)} {copy.pts}
                    </span>
                  </div>

                  <h1 className="mt-5 break-words text-[2rem] font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-[2.7rem] lg:text-[3rem]">
                    {productName}
                  </h1>

                  <MerchantMiniProfile
                    href={merchantHref}
                    name={merchantName}
                    category={merchant.category || copy.rewardHubMerchant}
                    logoUrl={merchantLogo}
                    verified={merchant.verified !== false}
                    verifiedLabel={copy.verifiedMerchant}
                  />
                </div>

                <div className="mt-7 rounded-[24px] border border-slate-800 bg-gradient-to-br from-[#08111f] via-[#0b1728] to-[#111e31] p-5 text-white shadow-[0_22px_50px_rgba(15,23,42,0.18)] sm:rounded-[28px] sm:p-6">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        {copy.productPrice}
                      </p>

                      <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                        <span className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                          RM{money(price)}
                        </span>

                        {hasDiscount ? (
                          <span className="pb-1 text-sm font-bold text-slate-500 line-through">
                            RM{money(originalPrice)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/8 px-3 py-2 text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        {copy.points}
                      </p>
                      <p className="mt-1 text-lg font-black text-amber-300">
                        {formatNumber(pointsEarned)} {copy.pts}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                    <PriceBenefit
                      label={copy.pointsEarned}
                      value={`${formatNumber(pointsEarned)} ${copy.pts}`}
                    />
                    <PriceBenefit
                      label={copy.paymentToMerchant}
                      value={copy.paymentToMerchantValue}
                    />
                  </div>
                </div>

                <div className="mt-7">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        {copy.memberBenefits}
                      </p>
                      <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                        {copy.cashbackByTier}
                      </h2>
                    </div>

                    <span className="text-right text-xs font-bold text-slate-400">
                      {copy.basedOnMerchantBudget}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
                    <TierBenefitCard
                      tier={copy.silver}
                      value={`${money(silverRate)}%`}
                      subtitle={copy.entryTier}
                      tone="silver"
                    />
                    <TierBenefitCard
                      tier={copy.gold}
                      value={`${money(goldRate)}%`}
                      subtitle={copy.goldMember}
                      tone="gold"
                    />
                    <TierBenefitCard
                      tier={copy.platinum}
                      value={`${money(platinumRate)}%`}
                      subtitle={copy.topTier}
                      tone="platinum"
                    />
                  </div>
                </div>

                <div className="mt-auto hidden pt-8 lg:block">
                  <MemberOnlyActions
                    loginHref={loginHref}
                    registerHref={registerHref}
                    copy={copy}
                    available={productStatus.available}
                  />
                </div>
              </div>
            </div>
          </article>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
            <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  📄
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    {copy.productInformation}
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    {copy.description}
                  </h2>
                </div>
              </div>

              <div className="mt-6 rounded-[22px] bg-slate-50 p-5 sm:p-6">
                <p className="whitespace-pre-line text-sm font-semibold leading-7 text-slate-600 sm:text-base sm:leading-8">
                  {product.description || copy.defaultDescription}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <ProductInfoItem
                  label={copy.category}
                  value={product.category || copy.general}
                />
                <ProductInfoItem
                  label={copy.availability}
                  value={productStatus.label}
                />
                <ProductInfoItem
                  label={copy.points}
                  value={`${formatNumber(pointsEarned)} ${copy.pts}`}
                />
              </div>
            </section>

            <Link
              href={merchantHref}
              className="group relative overflow-hidden rounded-[28px] bg-[#08111f] p-6 text-white no-underline shadow-[0_20px_50px_rgba(15,23,42,0.16)] sm:p-7"
            >
              <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-amber-400/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                    {copy.merchant}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 transition group-hover:translate-x-1">
                    →
                  </span>
                </div>

                <div className="mt-7 flex items-center gap-4">
                  <MerchantLogo name={merchantName} logoUrl={merchantLogo} size="large" />
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-black">{merchantName}</h2>
                    <p className="mt-1 truncate text-sm font-bold text-slate-400">
                      {merchant.category || copy.rewardHubMerchant}
                    </p>
                  </div>
                </div>

                {(merchant.area || merchant.state) && (
                  <p className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-400">
                    <span>📍</span>
                    {[merchant.area, merchant.state].filter(Boolean).join(", ")}
                  </p>
                )}

                <div className="mt-7 border-t border-white/10 pt-5">
                  <p className="text-sm font-black text-amber-300">
                    {copy.viewMerchantProfile}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_35px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                {copy.memberOnlyPurchase}
              </p>
              <p className="mt-0.5 truncate text-xl font-black text-slate-950">
                RM{money(price)}
              </p>
            </div>

            <Link
              href={loginHref}
              className="inline-flex min-h-13 items-center justify-center rounded-2xl bg-slate-950 px-5 text-center text-xs font-black text-white no-underline shadow-lg shadow-slate-950/15 transition active:scale-[0.98] sm:text-sm"
            >
              {copy.continueAsMember}
            </Link>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}

function MemberOnlyActions({
  loginHref,
  registerHref,
  copy,
  available,
}: {
  loginHref: string;
  registerHref: string;
  copy: (typeof pageText)[LanguageCode];
  available: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
        {copy.memberOnlyPurchase}
      </p>
      <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
        {available ? copy.memberOnlyDescription : copy.loginRequiredText}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link
          href={loginHref}
          className="flex min-h-13 items-center justify-center rounded-2xl bg-slate-950 px-4 text-center text-sm font-black text-white no-underline transition hover:bg-slate-800"
        >
          {copy.loginToPurchase}
        </Link>
        <Link
          href={registerHref}
          className="flex min-h-13 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-center text-sm font-black text-slate-800 no-underline transition hover:bg-slate-50"
        >
          {copy.registerAsMember}
        </Link>
      </div>
    </div>
  );
}

function MerchantMiniProfile({
  href,
  name,
  category,
  logoUrl,
  verified,
  verifiedLabel,
}: {
  href: string;
  name: string;
  category: string;
  logoUrl: string;
  verified: boolean;
  verifiedLabel: string;
}) {
  return (
    <Link
      href={href}
      className="mt-5 flex w-fit max-w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 pr-4 text-slate-950 no-underline transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
    >
      <MerchantLogo name={name} logoUrl={logoUrl} size="small" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-black">{name}</p>
          {verified ? (
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white"
              title={verifiedLabel}
            >
              ✓
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs font-bold text-slate-500">
          {category}
        </p>
      </div>
      <span className="ml-1 text-sm font-black text-slate-400">→</span>
    </Link>
  );
}

function MerchantLogo({
  name,
  logoUrl,
  size,
}: {
  name: string;
  logoUrl: string;
  size: "small" | "large";
}) {
  const sizeClass =
    size === "large"
      ? "h-14 w-14 rounded-2xl text-lg"
      : "h-11 w-11 rounded-xl text-sm";

  if (logoUrl) {
    return (
      <img
        src={getDisplayImageUrl(logoUrl)}
        alt={name}
        className={`${sizeClass} shrink-0 border border-slate-200 bg-white object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center bg-gradient-to-br from-amber-300 to-amber-500 font-black text-slate-950`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function TierBenefitCard({
  tier,
  value,
  subtitle,
  tone,
}: {
  tier: string;
  value: string;
  subtitle: string;
  tone: "silver" | "gold" | "platinum";
}) {
  const styles = {
    silver:
      "border-slate-200 bg-gradient-to-br from-white to-slate-100 text-slate-800",
    gold:
      "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-900",
    platinum:
      "border-slate-300 bg-gradient-to-br from-slate-900 to-slate-700 text-white",
  };

  const valueStyles = {
    silver: "text-emerald-700",
    gold: "text-amber-700",
    platinum: "text-emerald-300",
  };

  return (
    <div className={`min-w-0 rounded-[20px] border p-3.5 sm:p-4 ${styles[tone]}`}>
      <p className="truncate text-[11px] font-black uppercase tracking-[0.1em] opacity-65">
        {tier}
      </p>
      <p className={`mt-2 text-xl font-black tracking-tight sm:text-2xl ${valueStyles[tone]}`}>
        {value}
      </p>
      <p className="mt-1 truncate text-[10px] font-bold opacity-55">
        {subtitle}
      </p>
    </div>
  );
}

function PriceBenefit({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-200">{value}</p>
    </div>
  );
}

function ProductInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

function StatusBadge({ available, text }: { available: boolean; text: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-black shadow-lg ${
        available ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
      }`}
    >
      {text}
    </span>
  );
}

function ProductPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#111d30] to-[#07101c] text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/10 bg-white/5 text-5xl shadow-2xl">
        🛍️
      </div>
      <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function ProductLoadingPage() {
  return (
    <main className="min-h-screen bg-[#f4f6fa] px-4 py-6 pb-28 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1380px]">
        <div className="h-11 w-44 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-2">
            <div className="aspect-square animate-pulse bg-slate-900" />
            <div className="space-y-5 p-7 sm:p-10">
              <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200" />
              <div className="h-14 w-4/5 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-14 w-56 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-48 animate-pulse rounded-[28px] bg-slate-900" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProductErrorPage({
  message,
  onBack,
  backLabel,
  title,
}: {
  message: string;
  onBack: () => void;
  backLabel: string;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-[#f4f6fa] px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          ← {backLabel}
        </button>
        <div className="mt-8 rounded-[26px] border border-rose-200 bg-rose-50 p-7 text-center">
          <div className="text-4xl">⚠️</div>
          <h1 className="mt-4 text-2xl font-black text-slate-950">{title}</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-rose-700">
            {message}
          </p>
        </div>
      </section>
    </main>
  );
}

function money(value: unknown) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function formatNumber(value: unknown) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(number);
}

function getDriveFileId(value: string) {
  const url = String(value || "").trim();
  if (!url) return "";

  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/i,
    /\/file\/d\/([a-zA-Z0-9_-]+)/i,
    /\/d\/([a-zA-Z0-9_-]+)/i,
    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

function getDisplayImageUrl(value: string) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("/api/drive-image")) return url;

  const fileId = getDriveFileId(url);
  if (fileId) {
    return `/api/drive-image?id=${encodeURIComponent(fileId)}`;
  }

  return url;
}