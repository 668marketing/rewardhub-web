"use client";

import {
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
  Check,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";

import MemberLayout from "@/components/layout/MemberLayout";
import SafeImage from "@/components/ui/SafeImage";
import { useLanguage } from "@/hooks/useLanguage";
import { getProductDetail } from "@/lib/api";
import {
  addMemberCartItem,
} from "@/lib/memberCart";

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

function unwrapProductResponse(
  response: unknown
): ProductDetail | null {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return null;
  }

  const root =
    response as Record<
      string,
      unknown
    >;

  const first =
    root.data &&
    typeof root.data ===
      "object"
      ? (root.data as Record<
          string,
          unknown
        >)
      : root;

  const second =
    first.data &&
    typeof first.data ===
      "object"
      ? (first.data as Record<
          string,
          unknown
        >)
      : first;

  const result =
    second.result &&
    typeof second.result ===
      "object"
      ? (second.result as Record<
          string,
          unknown
        >)
      : second;

  const product =
    result.product &&
    typeof result.product ===
      "object"
      ? (result.product as ProductDetail)
      : (result as ProductDetail);

  if (
    !product ||
    typeof product !== "object"
  ) {
    return null;
  }

  return product;
}

function getProductImages(
  product: ProductDetail
): string[] {
  const images: string[] = [];

  const addImage = (
    value: unknown
  ) => {
    const image =
      String(value || "").trim();

    if (
      image &&
      !images.includes(image)
    ) {
      images.push(image);
    }
  };

  addImage(product.imageUrl);
  addImage(product.productImage);
  addImage(product.thumbnailUrl);

  const possibleGalleries = [
    product.images,
    product.gallery,
  ];

  possibleGalleries.forEach(
    (gallery) => {
      if (!Array.isArray(gallery)) {
        return;
      }

      gallery.forEach((item) => {
        if (
          typeof item ===
          "string"
        ) {
          addImage(item);
          return;
        }

        if (
          item &&
          typeof item ===
            "object"
        ) {
          addImage(
            item.imageUrl ||
              item.url ||
              item.src
          );
        }
      });
    }
  );

  return images;
}

function getProductStatus(
  product: ProductDetail,
  labels: {
    unavailable: string;
    outOfStock: string;
    available: string;
  }
) {
  const status =
    String(
      product.status ||
        product.availability ||
        ""
    )
      .trim()
      .toUpperCase();

  const stock =
    Number(product.stock);

  if (
    product.isActive === false ||
    status === "INACTIVE" ||
    status === "UNAVAILABLE"
  ) {
    return {
      label: labels.unavailable,
      available: false,
    };
  }

  if (
    status === "OUT_OF_STOCK" ||
    (!Number.isNaN(stock) &&
      stock === 0)
  ) {
    return {
      label: labels.outOfStock,
      available: false,
    };
  }

  return {
    label: labels.available,
    available: true,
  };
}

export default function ProductDetailPage() {
  const router =
    useRouter();

  const { t } =
    useLanguage();

  const params =
    useParams<{
      productId?: string;
    }>();

  const productId =
    decodeURIComponent(
      String(
        params?.productId ||
          ""
      )
    );

  const [
    product,
    setProduct,
  ] =
    useState<ProductDetail | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedImageIndex,
    setSelectedImageIndex,
  ] = useState(0);

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    cartMessage,
    setCartMessage,
  ] = useState("");

  const [
    cartMessageType,
    setCartMessageType,
  ] = useState<
    "success" | "error" | ""
  >("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      if (!productId) {
        setError(
          t("memberProductDetail.productIdMissing")
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await getProductDetail(
            productId
          );

        const productData =
          unwrapProductResponse(
            response
          );

        if (!productData) {
          throw new Error(
            t("memberProductDetail.productNotFound")
          );
        }

        if (!cancelled) {
          setProduct(
            productData
          );
          setSelectedImageIndex(
            0
          );
          setQuantity(1);
          setCartMessage("");
          setCartMessageType("");
        }
      } catch (loadError) {
        console.error(
          "Failed to load product:",
          loadError
        );

        if (!cancelled) {
          setProduct(null);
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : t("memberProductDetail.unableToLoadProduct")
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId, t]);

  const images = useMemo(
    () =>
      product
        ? getProductImages(
            product
          )
        : [],
    [product]
  );

  if (loading) {
    return (
      <MemberLayout>
        <ProductLoadingPage />
      </MemberLayout>
    );
  }

  if (
    error ||
    !product
  ) {
    return (
      <MemberLayout>
        <ProductErrorPage
          message={
            error ||
            t("memberProductDetail.productNotFound")
          }
          onBack={() =>
            router.back()
          }
        />
      </MemberLayout>
    );
  }

  const merchant =
    product.merchant || {};

  const merchantId =
    String(
      product.merchantId ||
        merchant.merchantId ||
        ""
    ).trim();

  const merchantName =
    String(
      merchant.displayName ||
        merchant.businessName ||
        merchant.merchantName ||
        t("memberProductDetail.rewardHubMerchant")
    ).trim();

  const productName =
    String(
      product.productName ||
        product.name ||
        product.title ||
        t("memberProductDetail.product")
    ).trim();

  const merchantLogo =
    String(
      merchant.logoUrl ||
        merchant.merchantLogo ||
        merchant.imageUrl ||
        ""
    ).trim();

  const marketingBudget =
    Number(
      merchant.marketingBudget ||
        5
    );

  const silverRate =
    marketingBudget * 0.1;

  const goldRate =
    marketingBudget * 0.2;

  const platinumRate =
    marketingBudget * 0.3;

  const price =
    Number(product.price || 0);

  const originalPrice =
    Number(
      product.originalPrice ||
        0
    );

  const hasDiscount =
    originalPrice > price &&
    originalPrice > 0;

  const discountPercentage =
    hasDiscount
      ? Math.round(
          ((originalPrice -
            price) /
            originalPrice) *
            100
        )
      : 0;

  const pointsEarned =
    Number(
      product.pointsEarned ??
        product.points ??
        price
    );

  const productStatus =
    getProductStatus(
      product,
      {
        unavailable: t(
          "memberProductDetail.unavailable"
        ),
        outOfStock: t(
          "memberProductDetail.outOfStock"
        ),
        available: t(
          "memberProductDetail.available"
        ),
      }
    );

  const activeImage =
    images[
      selectedImageIndex
    ] || "";

  const merchantHref =
    merchantId
      ? `/member/merchant/${encodeURIComponent(
          merchantId
        )}`
      : "/member/marketplace";

  const rawStock =
    Number(product.stock);

  const stock =
    product.stock === undefined ||
    product.stock === null ||
    product.stock === ""
      ? null
      : Number.isFinite(rawStock)
        ? Math.max(
            0,
            Math.floor(rawStock)
          )
        : null;

  /*
   * Store the already-narrowed product in a stable constant.
   * This prevents TypeScript from treating product as possibly null
   * inside nested event handlers.
   */
  const currentProduct: ProductDetail =
    product;

  function addToCart(
    goToCart: boolean
  ) {
    if (
      !productStatus.available ||
      !merchantId
    ) {
      return;
    }

    const result =
      addMemberCartItem({
        productId,
        merchantId,
        merchantName,
        productName,
        imageUrl:
          getDisplayImageUrl(
            images[0] || ""
          ),
        price,
        originalPrice,
        quantity,
        stock,
        pointsEarned,
        category:
          String(
            currentProduct.category ||
              ""
          ),
      });

    if (!result.ok) {
      setCartMessageType(
        "error"
      );

      setCartMessage(
        `Your cart already contains products from ${result.existingMerchantName}. Please complete or clear that cart first.`
      );

      return;
    }

    setCartMessageType(
      "success"
    );
    setCartMessage(
      "Added to cart."
    );

    if (goToCart) {
      router.push(
        "/member/cart"
      );
    }
  }

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f4f6fa] pb-56 text-slate-950 lg:pb-14">
        <section className="mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
          {/* Breadcrumb / Back */}
          <div className="mb-5 flex items-center justify-between gap-4">
            <Link
              href={merchantHref}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                aria-hidden="true"
              >
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {t("memberProductDetail.backToMerchant")}
            </Link>

            <div className="hidden items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400 sm:flex">
              <span>{t("memberProductDetail.marketplace")}</span>
              <span>/</span>
              <span className="max-w-[240px] truncate text-slate-600">
                {productName}
              </span>
            </div>
          </div>

          {/* Main product card */}
          <article className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:rounded-[36px]">
            <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
              {/* Product gallery */}
              <div className="border-b border-slate-200 bg-[#0a1220] p-3 sm:p-5 lg:border-b-0 lg:border-r">
                <div className="relative overflow-hidden rounded-[22px] bg-[#101a2b] sm:rounded-[28px]">
                  <div className="relative aspect-[4/3] w-full">
                    <SafeImage
                      src={
                        activeImage
                          ? getDisplayImageUrl(
                              activeImage
                            )
                          : ""
                      }
                      alt={productName}
                      className="h-full w-full object-contain"
                      fallback={
                        <ProductPlaceholder />
                      }
                    />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <StatusBadge
                        available={
                          productStatus.available
                        }
                        text={
                          productStatus.label
                        }
                      />

                      {hasDiscount ? (
                        <span className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-950 shadow-lg">
                          {t("memberProductDetail.save")}{" "}
                          {
                            discountPercentage
                          }
                          %
                        </span>
                      ) : null}
                    </div>

                    <div className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-lg">
                      {t("memberProductDetail.rewardHubProduct")}
                    </div>
                  </div>
                </div>

                {images.length >
                1 ? (
                  <div className="mt-3 grid grid-cols-5 gap-2 sm:mt-4 sm:gap-3">
                    {images
                      .slice(0, 5)
                      .map(
                        (
                          image,
                          index
                        ) => {
                          const selected =
                            index ===
                            selectedImageIndex;

                          return (
                            <button
                              key={`${image}-${index}`}
                              type="button"
                              onClick={() =>
                                setSelectedImageIndex(
                                  index
                                )
                              }
                              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition sm:rounded-2xl ${
                                selected
                                  ? "border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.15)]"
                                  : "border-white/10 opacity-65 hover:opacity-100"
                              }`}
                            >
                              <SafeImage
                                src={getDisplayImageUrl(
                                  image
                                )}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </button>
                          );
                        }
                      )}
                  </div>
                ) : null}
              </div>

              {/* Product information */}
              <div className="flex flex-col p-5 sm:p-8 lg:p-9 xl:p-11">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-amber-700 ring-1 ring-inset ring-amber-200">
                      {product.category ||
                        t("memberProductDetail.rewardHubProduct")}
                    </span>

                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      {t("memberProductDetail.earn")}{" "}
                      {formatNumber(
                        pointsEarned
                      )}{" "}
                      {t("memberProductDetail.pts")}
                    </span>
                  </div>

                  <h1 className="mt-5 break-words text-[2rem] font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-[2.7rem] lg:text-[3rem]">
                    {productName}
                  </h1>

                </div>

                {/* Price */}
                <div className="mt-7 rounded-[24px] border border-slate-800 bg-gradient-to-br from-[#08111f] via-[#0b1728] to-[#111e31] p-5 text-white shadow-[0_22px_50px_rgba(15,23,42,0.18)] sm:rounded-[28px] sm:p-6">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        {t("memberProductDetail.productPrice")}
                      </p>

                      <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                        <span className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                          RM
                          {money(
                            price
                          )}
                        </span>

                        {hasDiscount ? (
                          <span className="pb-1 text-sm font-bold text-slate-500 line-through">
                            RM
                            {money(
                              originalPrice
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/8 px-3 py-2 text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        {t("memberProductDetail.marketing")}
                      </p>

                      <p className="mt-1 text-lg font-black text-amber-300">
                        {money(
                          marketingBudget
                        )}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                    <PriceBenefit
                      label={t("memberProductDetail.pointsEarned")}
                      value={`${formatNumber(
                        pointsEarned
                      )} ${t("memberProductDetail.pts")}`}
                    />

                    <PriceBenefit
                      label={t("memberProductDetail.paymentMethod")}
                      value={t("memberProductDetail.rewardHubPay")}
                    />
                  </div>
                </div>

                {/* Quantity and cart actions */}
                <div className="mt-7">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Quantity
                  </p>

                  <div className="mt-3 inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          (current) =>
                            Math.max(
                              1,
                              current - 1
                            )
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <span className="min-w-14 text-center text-base font-black">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          (current) =>
                            stock !== null
                              ? Math.min(
                                  stock,
                                  current + 1
                                )
                              : current + 1
                        )
                      }
                      disabled={
                        stock !== null &&
                        quantity >= stock
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {stock !== null ? (
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      Stock: {stock}
                    </p>
                  ) : null}
                </div>

                {cartMessage ? (
                  <div
                    className={`mt-5 rounded-2xl p-4 text-sm font-black ${
                      cartMessageType ===
                      "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {cartMessageType ===
                      "success" ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : null}

                      <span>
                        {cartMessage}
                      </span>
                    </div>
                  </div>
                ) : null}

                <div className="mt-7 hidden grid-cols-2 gap-3 lg:grid">
                  <button
                    type="button"
                    onClick={() =>
                      addToCart(false)
                    }
                    disabled={
                      !productStatus.available
                    }
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      addToCart(true)
                    }
                    disabled={
                      !productStatus.available
                    }
                    className="flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 px-5 text-sm font-black text-slate-950 shadow-lg disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Tier cashback */}
                <div className="mt-7">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        {t("memberProductDetail.memberBenefits")}
                      </p>

                      <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                        {t("memberProductDetail.cashbackByTier")}
                      </h2>
                    </div>

                    <span className="text-xs font-bold text-slate-400">
                      {t("memberProductDetail.basedOnMerchantBudget")}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
                    <TierBenefitCard
                      tier={t("memberProductDetail.silver")}
                      value={`${money(
                        silverRate
                      )}%`}
                      subtitle={t("memberProductDetail.entryTier")}
                      tone="silver"
                    />

                    <TierBenefitCard
                      tier={t("memberProductDetail.gold")}
                      value={`${money(
                        goldRate
                      )}%`}
                      subtitle={t("memberProductDetail.goldMember")}
                      tone="gold"
                    />

                    <TierBenefitCard
                      tier={t("memberProductDetail.platinum")}
                      value={`${money(
                        platinumRate
                      )}%`}
                      subtitle={t("memberProductDetail.topTier")}
                      tone="platinum"
                    />
                  </div>
                </div>


              </div>
            </div>
          </article>

          {/* Lower information */}
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
            <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                  >
                    <path
                      d="M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M8 9h8M8 13h8M8 17h5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    {t("memberProductDetail.productInformation")}
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    {t("memberProductDetail.description")}
                  </h2>
                </div>
              </div>

              <div className="mt-6 rounded-[22px] bg-slate-50 p-5 sm:p-6">
                <p className="whitespace-pre-line text-sm font-semibold leading-7 text-slate-600 sm:text-base sm:leading-8">
                  {product.description ||
                    t("memberProductDetail.defaultDescription")}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <ProductInfoItem
                  label={t("memberProductDetail.category")}
                  value={
                    product.category ||
                    t("memberProductDetail.general")
                  }
                />

                <ProductInfoItem
                  label={t("memberProductDetail.availability")}
                  value={
                    productStatus.label
                  }
                />

                <ProductInfoItem
                  label={t("memberProductDetail.points")}
                  value={`${formatNumber(
                    pointsEarned
                  )} ${t("memberProductDetail.pts")}`}
                />
              </div>
            </section>
          </div>
        </section>

        {/* Mobile fixed action */}
        <div className="fixed inset-x-0 bottom-[78px] z-[60] border-t border-slate-200 bg-white/95 px-4 pb-3 pt-3 shadow-[0_-12px_35px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                addToCart(false)
              }
              disabled={
                !productStatus.available
              }
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-950 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>

            <button
              type="button"
              onClick={() =>
                addToCart(true)
              }
              disabled={
                !productStatus.available
              }
              className="flex min-h-[52px] items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:bg-slate-300"
            >
              Buy Now
            </button>
          </div>
        </div>
      </main>
    </MemberLayout>
  );
}

function MerchantLogo({
  name,
  logoUrl,
  size,
}: {
  name: string;
  logoUrl: string;
  size:
    | "small"
    | "large";
}) {
  const sizeClass =
    size === "large"
      ? "h-14 w-14 rounded-2xl text-lg"
      : "h-11 w-11 rounded-xl text-sm";

  if (logoUrl) {
    return (
      <SafeImage
        src={getDisplayImageUrl(
          logoUrl
        )}
        alt={name}
        className={`${sizeClass} shrink-0 border border-slate-200 bg-white object-cover`}
        fallback={
          <span>
            {name
              .slice(0, 1)
              .toUpperCase()}
          </span>
        }
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center bg-gradient-to-br from-amber-300 to-amber-500 font-black text-slate-950`}
    >
      {name
        .slice(0, 1)
        .toUpperCase()}
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
  tone:
    | "silver"
    | "gold"
    | "platinum";
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
    silver:
      "text-emerald-700",
    gold:
      "text-amber-700",
    platinum:
      "text-emerald-300",
  };

  return (
    <div
      className={`min-w-0 rounded-[20px] border p-3.5 sm:p-4 ${styles[tone]}`}
    >
      <p className="truncate text-[11px] font-black uppercase tracking-[0.1em] opacity-65">
        {tier}
      </p>

      <p
        className={`mt-2 text-xl font-black tracking-tight sm:text-2xl ${valueStyles[tone]}`}
      >
        {value}
      </p>

      <p className="mt-1 truncate text-[10px] font-bold opacity-55">
        {subtitle}
      </p>
    </div>
  );
}

function PriceBenefit({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-200">
        {value}
      </p>
    </div>
  );
}

function ProductInfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  available,
  text,
}: {
  available: boolean;
  text: string;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-black shadow-lg ${
        available
          ? "bg-emerald-500 text-white"
          : "bg-rose-500 text-white"
      }`}
    >
      {text}
    </span>
  );
}

function ProductPlaceholder() {
  const { t } =
    useLanguage();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#111d30] to-[#07101c] text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/10 bg-white/5 text-5xl shadow-2xl">
        🛍️
      </div>

      <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-slate-400">
        {t("memberProductDetail.productImage")}
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
}: {
  message: string;
  onBack: () => void;
}) {
  const { t } =
    useLanguage();

  return (
    <main className="min-h-screen bg-[#f4f6fa] px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          ← {t("memberProductDetail.back")}
        </button>

        <div className="mt-8 rounded-[26px] border border-rose-200 bg-rose-50 p-7 text-center">
          <div className="text-4xl">
            ⚠️
          </div>

          <h1 className="mt-4 text-2xl font-black text-slate-950">
            {t("memberProductDetail.unableToOpenProduct")}
          </h1>

          <p className="mt-2 text-sm font-bold leading-6 text-rose-700">
            {message}
          </p>
        </div>
      </section>
    </main>
  );
}

function money(
  value: unknown
) {
  const amount =
    Number(value || 0);

  return Number.isFinite(
    amount
  )
    ? amount.toFixed(2)
    : "0.00";
}

function formatNumber(
  value: unknown
) {
  const number =
    Number(value || 0);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return "0";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits:
        0,
    }
  ).format(number);
}

function getDriveFileId(
  value: string
) {
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

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function getDisplayImageUrl(
  value: string
) {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  if (url.startsWith("/api/drive-image")) {
    return url;
  }

  const fileId = getDriveFileId(url);

  if (fileId) {
    return `/api/drive-image?id=${encodeURIComponent(fileId)}`;
  }

  return url;
}