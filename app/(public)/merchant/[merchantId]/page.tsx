import PublicLayout from "@/components/layout/PublicLayout";
import Link from "next/link";
import {
  getMerchantDetail,
  getMerchantReviews,
  getMerchantRating,
  getMerchantGallery,
  getMerchantProducts,
} from "@/lib/api";
import MerchantGallery from "@/components/merchant/MerchantGallery";

export default async function PublicMerchantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ merchantId: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { merchantId } = await params;
  const query = await searchParams;
  const refCode = query?.ref || "";

  const [
    detailRes,
    reviewRes,
    ratingRes,
    galleryRes,
    productRes,
  ] = await Promise.all([
    getMerchantDetail(merchantId),
    getMerchantReviews(merchantId),
    getMerchantRating(merchantId),
    getMerchantGallery(merchantId),
    getMerchantProducts(merchantId),
  ]);

  const merchant =
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

  const reviews = Array.isArray(reviewData?.reviews)
    ? reviewData.reviews
    : Array.isArray(reviewData)
      ? reviewData
      : [];

  const gallery = Array.isArray(galleryData?.gallery)
    ? galleryData.gallery
    : [];

  const products = Array.isArray(productData?.products)
    ? productData.products
    : [];

  const rating = {
    average: Number(
      ratingData?.average ||
        ratingData?.averageRating ||
        0
    ),
    total: Number(
      ratingData?.total ||
        ratingData?.reviewCount ||
        0
    ),
  };

  if (!merchant) {
    return (
      <PublicLayout>
        <main className="min-h-screen bg-[#f6f7fb] px-4 py-10 text-center font-black text-slate-500">
          Merchant not found.
        </main>
      </PublicLayout>
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

  const isOpen = checkIsOpen(openTime, closeTime);

  const backHref = refCode
    ? `/marketplace?ref=${encodeURIComponent(refCode)}`
    : "/marketplace";

  return (
    <PublicLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-7xl">
          <Link
            href={backHref}
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm sm:px-5 sm:py-3 sm:text-sm"
          >
            ← Back to Marketplace
          </Link>

          <div className="relative mt-5 aspect-[16/9] min-h-[220px] overflow-hidden rounded-[1.75rem] bg-slate-950 sm:mt-6 sm:min-h-[300px] sm:rounded-[2rem] lg:min-h-[460px]">
            {merchant?.bannerUrl || merchant?.BANNER_URL ? (
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
              <div className="h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900" />
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 via-black/30 to-transparent sm:h-52" />

            <div className="absolute inset-x-4 bottom-4 flex items-end gap-3 sm:inset-x-6 sm:bottom-6 sm:gap-5 md:inset-x-8 md:bottom-8">
              <MerchantLogo merchant={merchant} />

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
                  RewardHub Merchant
                </p>

                <h1 className="mt-1 break-words text-2xl font-black leading-tight text-white sm:mt-2 sm:text-4xl md:text-5xl">
                  {name}
                </h1>

                <p className="mt-1 text-[10px] font-bold leading-4 text-slate-300 sm:mt-2 sm:text-sm sm:leading-5">
                  ⭐ {rating.average.toFixed(1)} ({rating.total} reviews) •{" "}
                  {category}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <div className="rounded-[1.5rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                About Merchant
              </h2>

              <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500 sm:mt-3 sm:text-sm sm:leading-7">
                {merchant?.description ||
                  merchant?.DESCRIPTION ||
                  `${name} is a RewardHub partner merchant. Members can enjoy instant cashback, collect points and use Reward Credits when supported by the merchant.`}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
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
                  <Badge text={`Marketing Budget ${marketingBudget}%`} />

                  {acceptCredits && (
                    <Badge text="Reward Credits Accepted" />
                  )}
                </div>
              </div>

              {merchant?.promotion?.active && (
                <div className="mt-5 rounded-[1.5rem] bg-amber-50 p-4 sm:mt-6 sm:rounded-[2rem] sm:p-6">
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
                </div>
              )}
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white sm:rounded-[2rem] sm:p-6">
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
                    merchant?.restDay ||
                    merchant?.REST_DAY ||
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
              </div>
            </div>
          </div>

          <MerchantGallery gallery={gallery} />

          {products.length > 0 && (
            <div className="mt-5 sm:mt-6">
              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
                <div className="flex items-center justify-between gap-4">
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
                  {products.map((item: any) => {
                    const productHref = refCode
                      ? `/product/${item.productId}?ref=${encodeURIComponent(
                          refCode
                        )}`
                      : `/product/${item.productId}`;

                    return (
                      <Link
                        key={item.productId}
                        href={productHref}
                        className="block min-w-0 overflow-hidden rounded-2xl bg-slate-50 no-underline shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl"
                      >
                        {item?.imageUrl ? (
                          <img
                            src={getDisplayImageUrl(item.imageUrl)}
                            alt={item?.productName || "Product"}
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
                                {item?.category || "Product"}
                              </p>

                              <h3 className="mt-1 line-clamp-2 text-sm font-black leading-tight text-slate-950 sm:mt-2 sm:text-xl">
                                {item?.productName || "Product"}
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
                                Math.floor(item?.price || 0)}{" "}
                              pts
                            </span>

                            <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700 sm:px-3 sm:text-xs">
                              Member Cashback
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 sm:mt-6">
            <div className="rounded-[1.5rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
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
                  reviews.map((review: any, index: number) => (
                    <ReviewCard
                      key={review?.reviewId || review?.id || index}
                      review={review}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-8 sm:text-sm">
                    No reviews yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function MerchantLogo({ merchant }: { merchant: any }) {
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

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[9px] font-black text-slate-700 sm:px-4 sm:py-2 sm:text-xs">
      {text}
    </span>
  );
}

function ReviewCard({ review }: { review: any }) {
  const rating = Math.max(
    0,
    Math.min(5, Number(review?.rating || 0))
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

function formatReviewDate(value: any) {
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
  closeTime: string
) {
  if (!openTime || !closeTime) return false;

  const nowParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(
    nowParts.find((part) => part.type === "hour")?.value || 0
  );

  const minute = Number(
    nowParts.find((part) => part.type === "minute")?.value || 0
  );

  const current = hour * 60 + minute;

  const [openHour, openMinute] = openTime
    .split(":")
    .map(Number);

  const [closeHour, closeMinute] = closeTime
    .split(":")
    .map(Number);

  const open = openHour * 60 + openMinute;
  const close = closeHour * 60 + closeMinute;

  if (
    Number.isNaN(open) ||
    Number.isNaN(close)
  ) {
    return false;
  }

  if (close > open) {
    return current >= open && current <= close;
  }

  return current >= open || current <= close;
}

function getDisplayImageUrl(url: string) {
  return url || "";
}