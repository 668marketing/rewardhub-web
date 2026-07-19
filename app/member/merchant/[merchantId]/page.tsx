"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MemberLayout from "@/components/layout/MemberLayout";
import MerchantGallery from "@/components/merchant/MerchantGallery";
import {
  getMerchantDetail,
  getMerchantReviews,
  getMerchantRating,
  getMerchantGallery,
  getMerchantProducts,
  checkFavouriteMerchant,
  toggleFavouriteMerchant,
} from "@/lib/api";

export default function MemberMerchantDetailPage() {
  const params = useParams();
  const merchantId = String(params?.merchantId || "");

  const [merchant, setMerchant] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState({
    average: 0,
    total: 0,
  });
  const [gallery, setGallery] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isFavourite, setIsFavourite] = useState(false);
  const [savingFavourite, setSavingFavourite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) {
      setLoading(false);
      return;
    }

    loadMerchantPage();
  }, [merchantId]);

  async function loadMerchantPage() {
    try {
      setLoading(true);

      const storedMember = JSON.parse(
        localStorage.getItem("member") || "{}"
      );

      const memberId =
        storedMember?.memberId ||
        storedMember?.MEMBER_ID ||
        "";

      const [
        detailRes,
        reviewRes,
        ratingRes,
        galleryRes,
        productRes,
        favouriteRes,
      ] = await Promise.all([
        getMerchantDetail(merchantId),
        getMerchantReviews(merchantId),
        getMerchantRating(merchantId),
        getMerchantGallery(merchantId),
        getMerchantProducts(merchantId),
        memberId
          ? checkFavouriteMerchant({
              memberId,
              merchantId,
            })
          : Promise.resolve(null),
      ]);

      const detail =
        detailRes?.data?.data?.data ||
        detailRes?.data?.data ||
        detailRes?.data ||
        detailRes?.result ||
        detailRes;

      const reviewData =
        reviewRes?.data?.data ||
        reviewRes?.data ||
        reviewRes?.result ||
        reviewRes;

      const ratingData =
        ratingRes?.data?.data ||
        ratingRes?.data ||
        ratingRes?.result ||
        ratingRes;

      const galleryData =
        galleryRes?.data?.data ||
        galleryRes?.data ||
        galleryRes?.result ||
        galleryRes;

      const productData =
        productRes?.data?.data ||
        productRes?.data ||
        productRes?.result ||
        productRes;

      const favouriteData =
        favouriteRes?.data?.data ||
        favouriteRes?.data ||
        favouriteRes?.result ||
        favouriteRes;

      const reviewList = Array.isArray(reviewData?.reviews)
        ? reviewData.reviews
        : Array.isArray(reviewData)
          ? reviewData
          : [];

      const validRatings = reviewList
        .map((review: any) => Number(review?.rating || 0))
        .filter(
          (value: number) =>
            Number.isFinite(value) &&
            value >= 1 &&
            value <= 5
        );

      const calculatedAverage =
        validRatings.length > 0
          ? validRatings.reduce(
              (sum: number, value: number) =>
                sum + value,
              0
            ) / validRatings.length
          : 0;

      const backendAverage = Number(
        ratingData?.average ??
          ratingData?.averageRating
      );

      const backendTotal = Number(
        ratingData?.total ??
          ratingData?.reviewCount
      );

      setMerchant(detail || null);
      setReviews(reviewList);

      setRating({
        average:
          Number.isFinite(backendAverage) &&
          backendAverage > 0
            ? backendAverage
            : calculatedAverage,
        total:
          Number.isFinite(backendTotal) &&
          backendTotal >= 0
            ? backendTotal
            : reviewList.length,
      });

      setGallery(
        Array.isArray(galleryData?.gallery)
          ? galleryData.gallery
          : []
      );

      setProducts(
        Array.isArray(productData?.products)
          ? productData.products
          : []
      );

      setIsFavourite(
        Boolean(favouriteData?.isFavourite)
      );
    } catch (error) {
      console.error(
        "Failed to load merchant detail:",
        error
      );
      setMerchant(null);
      setReviews([]);
      setGallery([]);
      setProducts([]);
      setRating({
        average: 0,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavourite() {
    try {
      const storedMember = JSON.parse(
        localStorage.getItem("member") || "{}"
      );

      const memberId =
        storedMember?.memberId ||
        storedMember?.MEMBER_ID ||
        "";

      if (!memberId) {
        alert("Please login again.");
        return;
      }

      setSavingFavourite(true);

      const res = await toggleFavouriteMerchant({
        memberId,
        merchantId,
      });

      const data =
        res?.data?.data ||
        res?.data ||
        res?.result ||
        res;

      setIsFavourite(
        Boolean(data?.isFavourite)
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Failed to update favourite"
      );
    } finally {
      setSavingFavourite(false);
    }
  }

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />

            <p className="mt-5 text-sm font-black text-slate-500">
              Loading Merchant...
            </p>
          </div>
        </div>
      </MemberLayout>
    );
  }

  if (!merchant) {
    return (
      <MemberLayout>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900">
              Merchant Not Found
            </h2>

            <p className="mt-3 text-sm font-bold text-slate-500">
              This merchant does not exist or has been removed.
            </p>

            <Link
              href="/member/marketplace"
              className="mt-6 inline-flex rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white no-underline"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </MemberLayout>
    );
  }

  const name =
    merchant?.displayName ||
    merchant?.businessName ||
    merchant?.DISPLAY_NAME ||
    merchant?.BUSINESS_NAME ||
    "Merchant";

  const category =
    merchant?.category ||
    merchant?.CATEGORY ||
    "Merchant";

  const address =
    merchant?.address ||
    merchant?.ADDRESS ||
    "Malaysia";

  const marketingBudget = Number(
    merchant?.marketingBudget ??
      merchant?.MARKETING_BUDGET ??
      5
  );

  const acceptCredits =
    merchant?.acceptRewardCredits !== false &&
    merchant?.rewardCreditEnabled !== false;

  const mapsUrl =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(address);

  const silverRate = marketingBudget * 0.1;
  const goldRate = marketingBudget * 0.2;
  const platinumRate = marketingBudget * 0.3;

  const openTime =
    merchant?.openTime ||
    merchant?.OPEN_TIME ||
    "";

  const closeTime =
    merchant?.closeTime ||
    merchant?.CLOSE_TIME ||
    "";

  const restDay =
    merchant?.restDay ||
    merchant?.REST_DAY ||
    "";

  const isOpen = checkIsOpen(
    openTime,
    closeTime,
    restDay
  );

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-7xl">
          <Link
            href="/member/marketplace"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm sm:px-5 sm:py-3 sm:text-sm"
          >
            ← Back to Marketplace
          </Link>

          <div className="relative mt-5 aspect-[16/9] min-h-[220px] overflow-hidden rounded-[1.75rem] bg-slate-950 sm:mt-6 sm:min-h-[300px] sm:rounded-[2rem] lg:min-h-[460px]">
            {merchant?.bannerUrl ||
            merchant?.BANNER_URL ? (
              <img
                src={getDisplayImageUrl(
                  merchant?.bannerUrl ||
                    merchant?.BANNER_URL ||
                    ""
                )}
                alt={name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900" />
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

            <button
              type="button"
              onClick={handleToggleFavourite}
              disabled={savingFavourite}
              className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-2 text-[10px] font-black text-slate-950 shadow-xl transition hover:scale-105 disabled:opacity-50 sm:right-6 sm:top-6 sm:px-5 sm:py-3 sm:text-sm"
            >
              {savingFavourite
                ? "Saving..."
                : isFavourite
                  ? "❤️ Favourite"
                  : "🤍 Favourite"}
            </button>

            <div className="absolute inset-x-4 bottom-4 flex items-end gap-3 sm:inset-x-8 sm:bottom-8 sm:gap-5">
              <MerchantLogo merchant={merchant} />

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
                  RewardHub Merchant
                </p>

                <h1 className="mt-1 break-words text-2xl font-black leading-tight text-white sm:mt-2 sm:text-4xl lg:text-5xl">
                  {name}
                </h1>

                <p className="mt-1 break-words text-[10px] font-bold text-white/85 sm:mt-2 sm:text-sm">
                  ⭐ {rating.average.toFixed(1)} ({rating.total} reviews) •{" "}
                  {category}
                </p>
              </div>
            </div>
          </div>

          <section className="mt-5 rounded-[1.5rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6">
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              About Merchant
            </h2>

            <p className="mt-2 text-[11px] font-bold leading-6 text-slate-500 sm:mt-3 sm:text-sm sm:leading-7">
              {merchant?.description ||
                merchant?.DESCRIPTION ||
                `${name} is a RewardHub partner merchant. Members can enjoy instant cashback, collect points and use Reward Credits when supported by the merchant.`}
            </p>
          </section>

          <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <section className="rounded-[1.5rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Member Rewards
                </h2>

                <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">
                  Cashback is calculated based on this merchant&apos;s Marketing
                  Budget and your membership tier.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3 sm:mt-6 sm:gap-4">
                  <RewardBox
                    title="Silver"
                    value={`${money(silverRate)}%`}
                  />
                  <RewardBox
                    title="Gold"
                    value={`${money(goldRate)}%`}
                  />
                  <RewardBox
                    title="Platinum"
                    value={`${money(platinumRate)}%`}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                  <Badge
                    text={`Marketing Budget ${marketingBudget}%`}
                  />

                  {acceptCredits && (
                    <Badge text="Reward Credits Accepted" />
                  )}
                </div>
              </section>

              {merchant?.promotion?.active && (
                <section className="mt-5 rounded-[1.5rem] bg-amber-50 p-4 sm:mt-6 sm:rounded-[2rem] sm:p-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-700 sm:text-xs sm:tracking-[0.25em]">
                    Current Promotion
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950 sm:mt-2 sm:text-2xl">
                    {merchant.promotion.title}
                  </h2>

                  <p className="mt-2 text-[11px] font-bold leading-5 text-amber-800 sm:text-sm sm:leading-7">
                    {merchant.promotion.description}
                  </p>

                  {merchant.promotion.endDate && (
                    <p className="mt-3 text-[10px] font-black text-amber-700 sm:mt-4 sm:text-xs">
                      Valid until {merchant.promotion.endDate}
                    </p>
                  )}
                </section>
              )}
            </div>

            <section className="rounded-[1.5rem] bg-slate-950 p-4 text-white sm:rounded-[2rem] sm:p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
                Store Info
              </p>

              <Info
                title="📞 Contact"
                value={
                  merchant?.ownerPhone ||
                  merchant?.phone ||
                  merchant?.OWNER_PHONE ||
                  merchant?.PHONE ||
                  "-"
                }
              />

              <Info
                title="📍 Address"
                value={[
                  merchant?.address ||
                    merchant?.ADDRESS,
                  merchant?.postcode ||
                    merchant?.POSTCODE,
                  merchant?.city ||
                    merchant?.CITY,
                  merchant?.state ||
                    merchant?.STATE,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />

              <Info
                title="🕒 Opening Hours"
                value={
                  openTime && closeTime
                    ? `${openTime} - ${closeTime}`
                    : "Opening hours not added"
                }
              />

              <Info
                title="🌴 Rest Day"
                value={
                  restDay ||
                  "Not specified"
                }
              />

              <Info
                title="Status"
                value={
                  isOpen
                    ? "🟢 Open Now"
                    : "🔴 Closed Now"
                }
              />

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 block rounded-xl bg-white py-3 text-center text-xs font-black text-slate-950 no-underline sm:mt-6 sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                📍 Open Google Maps
              </a>
            </section>
          </div>

          <MerchantGallery gallery={gallery} />

          {products.length > 0 && (
            <section className="mt-5 rounded-[1.5rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                    Products & Offers
                  </h2>

                  <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                    Browse products, services, packages or vouchers from this
                    merchant.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-500 sm:px-4 sm:py-2 sm:text-xs">
                  {products.length} Items
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
                {products.map((item: any) => (
                  <Link
                    key={item?.productId}
                    href={`/member/product/${item?.productId}`}
                    className="block min-w-0 overflow-hidden rounded-2xl bg-slate-50 no-underline shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl"
                  >
                    {item?.imageUrl ? (
                      <img
                        src={getDisplayImageUrl(
                          item.imageUrl
                        )}
                        alt={
                          item?.productName ||
                          "Product"
                        }
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-slate-200 text-xs font-black text-slate-400">
                        NO IMAGE
                      </div>
                    )}

                    <div className="p-3 sm:p-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-600 sm:text-xs sm:tracking-[0.2em]">
                            {item?.category ||
                              "Product"}
                          </p>

                          <h3 className="mt-1 line-clamp-2 text-sm font-black leading-tight text-slate-950 sm:mt-2 sm:text-xl">
                            {item?.productName ||
                              "Product"}
                          </h3>
                        </div>

                        <p className="w-fit shrink-0 rounded-xl bg-slate-950 px-3 py-1.5 text-[10px] font-black text-white sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm">
                          RM{money(item?.price)}
                        </p>
                      </div>

                      <p className="mt-2 line-clamp-3 text-[10px] font-bold leading-4 text-slate-500 sm:mt-3 sm:text-sm sm:leading-6">
                        {item?.description ||
                          "Available at this RewardHub merchant."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 sm:px-3 sm:text-xs">
                          Earn{" "}
                          {item?.pointsEarned ||
                            Math.floor(
                              item?.price || 0
                            )}{" "}
                          pts
                        </span>

                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700 sm:px-3 sm:text-xs">
                          Member Cashback
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-5 rounded-[1.5rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Member Reviews
                </h2>

                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  Verified feedback from RewardHub members.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-500 sm:px-4 sm:py-2 sm:text-xs">
                {reviews.length} Reviews
              </span>
            </div>

            <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
              {reviews.length > 0 ? (
                reviews.map(
                  (
                    review: any,
                    index: number
                  ) => (
                    <ReviewCard
                      key={
                        review?.reviewId ||
                        review?.id ||
                        index
                      }
                      review={review}
                    />
                  )
                )
              ) : (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-8 sm:text-sm">
                  No reviews yet.
                </div>
              )}
            </div>
          </section>
        </section>
      </main>
    </MemberLayout>
  );
}

function MerchantLogo({
  merchant,
}: {
  merchant: any;
}) {
  const name =
    merchant?.displayName ||
    merchant?.businessName ||
    merchant?.DISPLAY_NAME ||
    merchant?.BUSINESS_NAME ||
    "Merchant";

  const logoUrl =
    merchant?.logoUrl ||
    merchant?.LOGO_URL ||
    "";

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white text-sm font-black text-slate-950 shadow-xl sm:h-24 sm:w-24 sm:rounded-[2rem] sm:border-4 sm:text-2xl">
      {logoUrl ? (
        <img
          src={getDisplayImageUrl(logoUrl)}
          alt={name}
          className="h-full w-full object-contain p-1 sm:p-2"
        />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

function RewardBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-5">
      <p className="truncate text-[9px] font-black text-slate-500 sm:text-sm">
        {title}
      </p>

      <p className="mt-1 text-sm font-black text-emerald-700 sm:mt-2 sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="mt-4 sm:mt-5">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 sm:text-xs sm:tracking-[0.2em]">
        {title}
      </p>

      <p className="mt-1 break-words text-[11px] font-bold leading-5 text-slate-200 sm:mt-2 sm:text-sm sm:leading-6">
        {value || "-"}
      </p>
    </div>
  );
}

function Badge({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[9px] font-black text-slate-700 sm:px-4 sm:py-2 sm:text-xs">
      {text}
    </span>
  );
}

function ReviewCard({
  review,
}: {
  review: any;
}) {
  const rating = Math.max(
    0,
    Math.min(
      5,
      Number(
        review?.rating ||
          review?.RATING ||
          0
      )
    )
  );

  const merchantReply = String(
    review?.merchantReply ||
      review?.MERCHANT_REPLY ||
      ""
  ).trim();

  const memberName =
    review?.memberName ||
    review?.MEMBER_NAME ||
    "Member";

  const createdAt =
    review?.createdAt ||
    review?.CREATED_AT ||
    "";

  const updatedAt =
    review?.updatedAt ||
    review?.UPDATED_AT ||
    "";

  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-black text-amber-500 sm:text-base">
            {"★".repeat(rating)}
            {"☆".repeat(5 - rating)}
          </p>

          <p className="mt-2 break-words text-sm font-black text-slate-950 sm:text-base">
            {memberName}
          </p>

          <p className="mt-1 text-[10px] font-black text-emerald-700 sm:text-xs">
            Verified Purchase
          </p>
        </div>

        <p className="shrink-0 text-right text-[9px] font-bold leading-4 text-slate-400 sm:text-xs">
          {formatReviewDate(createdAt)}
        </p>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 sm:p-5">
        <p className="text-[11px] font-bold leading-5 text-slate-600 sm:text-sm sm:leading-6">
          {review?.comment ||
            review?.COMMENT ||
            "No comment added."}
        </p>
      </div>

      {merchantReply && (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 sm:text-xs">
              Merchant Reply
            </p>

            {updatedAt && (
              <p className="text-right text-[9px] font-bold text-emerald-700/60 sm:text-xs">
                {formatReviewDate(updatedAt)}
              </p>
            )}
          </div>

          <p className="mt-2 text-[11px] font-bold leading-5 text-emerald-950 sm:text-sm sm:leading-6">
            {merchantReply}
          </p>
        </div>
      )}
    </article>
  );
}

function money(value: any) {
  return Number(value || 0).toFixed(2);
}

function formatReviewDate(
  value: any
) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
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

function checkIsOpen(
  openTime: string,
  closeTime: string,
  restDay?: string
) {
  if (!openTime || !closeTime) {
    return false;
  }

  const now = new Date();

  const dayName = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "Asia/Kuala_Lumpur",
      weekday: "long",
    }
  ).format(now);

  if (
    restDay &&
    restDay.toLowerCase() ===
      dayName.toLowerCase()
  ) {
    return false;
  }

  const nowParts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).formatToParts(now);

  const hour = Number(
    nowParts.find(
      (part) => part.type === "hour"
    )?.value || 0
  );

  const minute = Number(
    nowParts.find(
      (part) => part.type === "minute"
    )?.value || 0
  );

  const current = hour * 60 + minute;

  const [openHour, openMinute] =
    openTime.split(":").map(Number);

  const [closeHour, closeMinute] =
    closeTime.split(":").map(Number);

  const open =
    openHour * 60 + openMinute;

  const close =
    closeHour * 60 + closeMinute;

  if (
    Number.isNaN(open) ||
    Number.isNaN(close)
  ) {
    return false;
  }

  if (close > open) {
    return (
      current >= open &&
      current <= close
    );
  }

  return (
    current >= open ||
    current <= close
  );
}

function getDisplayImageUrl(
  url: string
) {
  return url || "";
}