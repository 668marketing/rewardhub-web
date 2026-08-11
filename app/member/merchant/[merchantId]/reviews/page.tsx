"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MemberLayout from "@/components/layout/MemberLayout";
import {
  getMerchantDetail,
  getMerchantRating,
  getMerchantReviews,
} from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations = {
  en: {
    reviews: "Reviews",
    customerReviews: "Customer Reviews",
    backToMerchant: "Back to Merchant",
    pageDescription:
      "Verified member feedback and merchant replies.",
    averageRating: "Average Rating",
    totalReviews: "Total Reviews",
    allRatings: "All Ratings",
    newest: "Newest",
    oldest: "Oldest",
    highestRating: "Highest Rating",
    lowestRating: "Lowest Rating",
    search: "Search reviews",
    verifiedPurchase: "Verified Purchase",
    merchantReply: "Merchant Reply",
    noComment: "No comment added.",
    noReviews: "No reviews yet",
    noReviewsDescription:
      "Verified member reviews will appear here.",
    loading: "Loading reviews...",
    merchant: "Merchant",
    member: "Member",
    pinnedReview: "Pinned Review",
  },
  zh: {
    reviews: "评价",
    customerReviews: "顾客评价",
    backToMerchant: "返回商家",
    pageDescription:
      "查看已验证会员的评价与商家回复。",
    averageRating: "平均评分",
    totalReviews: "评价总数",
    allRatings: "全部评分",
    newest: "最新",
    oldest: "最早",
    highestRating: "评分最高",
    lowestRating: "评分最低",
    search: "搜索评价",
    verifiedPurchase: "已验证消费",
    merchantReply: "商家回复",
    noComment: "没有填写评价内容。",
    noReviews: "暂时没有评价",
    noReviewsDescription:
      "会员完成消费后的真实评价会显示在这里。",
    loading: "正在加载评价……",
    merchant: "商家",
    member: "会员",
    pinnedReview: "置顶评价",
  },
  ms: {
    reviews: "Ulasan",
    customerReviews: "Ulasan Pelanggan",
    backToMerchant: "Kembali ke Peniaga",
    pageDescription:
      "Maklum balas ahli yang disahkan dan balasan peniaga.",
    averageRating: "Purata Penilaian",
    totalReviews: "Jumlah Ulasan",
    allRatings: "Semua Penilaian",
    newest: "Terbaharu",
    oldest: "Terlama",
    highestRating: "Penilaian Tertinggi",
    lowestRating: "Penilaian Terendah",
    search: "Cari ulasan",
    verifiedPurchase: "Pembelian Disahkan",
    merchantReply: "Balasan Peniaga",
    noComment: "Tiada komen ditambah.",
    noReviews: "Belum ada ulasan",
    noReviewsDescription:
      "Ulasan ahli yang disahkan akan dipaparkan di sini.",
    loading: "Memuatkan ulasan...",
    merchant: "Peniaga",
    member: "Ahli",
    pinnedReview: "Ulasan Disemat",
  },
} as const;

function normalizeLanguage(value: string | null): LanguageCode {
  return value === "zh" || value === "ms" ? value : "en";
}

export default function MemberMerchantReviewsPage() {
  const params = useParams();
  const merchantId = String(params?.merchantId || "");

  const [language, setLanguage] = useState<LanguageCode>("en");
  const [merchant, setMerchant] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const t = translations[language];

  useEffect(() => {
    setLanguage(
      normalizeLanguage(
        localStorage.getItem(LANGUAGE_STORAGE_KEY)
      )
    );

    function handleLanguageChange(event: Event) {
      const customEvent =
        event as CustomEvent<{ language?: string }>;

      setLanguage(
        normalizeLanguage(
          customEvent.detail?.language ||
            localStorage.getItem(LANGUAGE_STORAGE_KEY)
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

  useEffect(() => {
    if (!merchantId) {
      setLoading(false);
      return;
    }

    void loadPage();
  }, [merchantId]);

  async function loadPage() {
    try {
      setLoading(true);

      const [
        merchantRes,
        reviewsRes,
        ratingRes,
      ] = await Promise.all([
        getMerchantDetail(merchantId),
        getMerchantReviews(merchantId),
        getMerchantRating(merchantId),
      ]);

      const merchantData =
        merchantRes?.data?.data?.data ||
        merchantRes?.data?.data ||
        merchantRes?.data ||
        merchantRes?.result ||
        merchantRes;

      const reviewData =
        reviewsRes?.data?.data ||
        reviewsRes?.data ||
        reviewsRes?.result ||
        reviewsRes;

      const ratingData =
        ratingRes?.data?.data ||
        ratingRes?.data ||
        ratingRes?.result ||
        ratingRes;

      const list =
        Array.isArray(reviewData?.reviews)
          ? reviewData.reviews
          : Array.isArray(reviewData)
            ? reviewData
            : [];

      const validRatings = list
        .map((review: any) =>
          Number(review?.rating || review?.RATING || 0)
        )
        .filter(
          (rating: number) =>
            Number.isFinite(rating) &&
            rating >= 1 &&
            rating <= 5
        );

      const calculatedAverage =
        validRatings.length > 0
          ? validRatings.reduce(
              (sum: number, value: number) =>
                sum + value,
              0
            ) / validRatings.length
          : 0;

      const backendAverage =
        Number(
          ratingData?.average ??
            ratingData?.averageRating
        );

      const backendTotal =
        Number(
          ratingData?.total ??
            ratingData?.reviewCount
        );

      setMerchant(merchantData || null);
      setReviews(list);

      setAverageRating(
        Number.isFinite(backendAverage) &&
          backendAverage > 0
          ? backendAverage
          : calculatedAverage
      );

      setTotalReviews(
        Number.isFinite(backendTotal) &&
          backendTotal >= 0
          ? backendTotal
          : list.length
      );
    } catch (error) {
      console.error(
        "Failed to load merchant reviews:",
        error
      );

      setMerchant(null);
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setLoading(false);
    }
  }

  const filteredReviews = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    let result =
      reviews.filter((review) => {
        const rating =
          Number(
            review?.rating ||
              review?.RATING ||
              0
          );

        const searchable = [
          review?.memberName,
          review?.MEMBER_NAME,
          review?.comment,
          review?.COMMENT,
          review?.merchantReply,
          review?.MERCHANT_REPLY,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !keyword ||
          searchable.includes(keyword);

        const matchesRating =
          ratingFilter === "All" ||
          rating === Number(ratingFilter);

        return (
          matchesSearch &&
          matchesRating
        );
      });

    result = [...result].sort(
      (a, b) => {
        const ratingA =
          Number(
            a?.rating ||
              a?.RATING ||
              0
          );

        const ratingB =
          Number(
            b?.rating ||
              b?.RATING ||
              0
          );

        const dateA =
          new Date(
            a?.createdAt ||
              a?.CREATED_AT ||
              0
          ).getTime();

        const dateB =
          new Date(
            b?.createdAt ||
              b?.CREATED_AT ||
              0
          ).getTime();

        if (sortBy === "Oldest") {
          return dateA - dateB;
        }

        if (
          sortBy === "Highest Rating"
        ) {
          return ratingB - ratingA;
        }

        if (
          sortBy === "Lowest Rating"
        ) {
          return ratingA - ratingB;
        }

        return dateB - dateA;
      }
    );

    return result;
  }, [
    reviews,
    search,
    ratingFilter,
    sortBy,
  ]);

  const merchantName =
    merchant?.displayName ||
    merchant?.businessName ||
    merchant?.DISPLAY_NAME ||
    merchant?.BUSINESS_NAME ||
    t.merchant;

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/member/merchant/${merchantId}`}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm sm:px-5 sm:py-3 sm:text-sm"
            >
              ← {t.backToMerchant}
            </Link>

            <span className="rounded-full bg-white px-3 py-2 text-[10px] font-black text-slate-500 shadow-sm sm:px-4 sm:text-xs">
              {totalReviews} {t.reviews}
            </span>
          </div>

          <section className="relative mt-5 overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-xl sm:mt-6 sm:rounded-[2.25rem] sm:p-8">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl" />

            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 sm:text-xs">
                {merchantName}
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
                {t.customerReviews}
              </h1>

              <p className="mt-2 max-w-2xl text-[11px] font-bold leading-5 text-slate-400 sm:text-sm sm:leading-6">
                {t.pageDescription}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-xl sm:gap-4">
                <SummaryCard
                  label={t.averageRating}
                  value={`★ ${averageRating.toFixed(1)}`}
                />

                <SummaryCard
                  label={t.totalReviews}
                  value={totalReviews}
                />
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[1.5rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_180px_190px]">
              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={t.search}
                className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:text-sm"
              />

              <select
                value={ratingFilter}
                onChange={(event) =>
                  setRatingFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:text-sm"
              >
                <option value="All">
                  {t.allRatings}
                </option>
                <option value="5">5 ★</option>
                <option value="4">4 ★</option>
                <option value="3">3 ★</option>
                <option value="2">2 ★</option>
                <option value="1">1 ★</option>
              </select>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value
                  )
                }
                className="rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:text-sm"
              >
                <option value="Newest">
                  {t.newest}
                </option>
                <option value="Oldest">
                  {t.oldest}
                </option>
                <option value="Highest Rating">
                  {t.highestRating}
                </option>
                <option value="Lowest Rating">
                  {t.lowestRating}
                </option>
              </select>
            </div>

            {loading ? (
              <div className="mt-5 space-y-4">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-48 animate-pulse rounded-[1.5rem] bg-slate-100"
                    />
                  )
                )}
              </div>
            ) : filteredReviews.length > 0 ? (
              <div className="mt-5 space-y-4">
                {filteredReviews.map(
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
                      language={language}
                      labels={t}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-8 text-center sm:p-10">
                <p className="text-3xl">
                  ⭐
                </p>

                <h2 className="mt-3 text-xl font-black text-slate-950">
                  {t.noReviews}
                </h2>

                <p className="mt-2 text-xs font-bold text-slate-500 sm:text-sm">
                  {t.noReviewsDescription}
                </p>
              </div>
            )}
          </section>
        </section>
      </main>
    </MemberLayout>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.25rem] bg-white/10 p-4 sm:rounded-[1.75rem] sm:p-5">
      <p className="text-[10px] font-black text-slate-300 sm:text-sm">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-white sm:text-4xl">
        {value}
      </p>
    </div>
  );
}

function ReviewCard({
  review,
  language,
  labels,
}: {
  review: any;
  language: LanguageCode;
  labels: (typeof translations)[LanguageCode];
}) {
  const rating =
    Math.max(
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

  const memberName =
    review?.memberName ||
    review?.MEMBER_NAME ||
    labels.member;

  const comment =
    review?.comment ||
    review?.COMMENT ||
    labels.noComment;

  const merchantReply =
    String(
      review?.merchantReply ||
        review?.MERCHANT_REPLY ||
        ""
    ).trim();

  const createdAt =
    review?.createdAt ||
    review?.CREATED_AT ||
    "";

  const updatedAt =
    review?.updatedAt ||
    review?.UPDATED_AT ||
    "";

  const isPinned =
    review?.isPinned === true ||
    review?.IS_PINNED === true ||
    String(
      review?.isPinned
    ).toUpperCase() === "TRUE" ||
    String(
      review?.IS_PINNED
    ).toUpperCase() === "TRUE";

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

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-200 sm:text-xs">
              {labels.verifiedPurchase}
            </span>

            {isPinned && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-black text-amber-800 ring-1 ring-inset ring-amber-200 sm:text-xs">
                📌 {labels.pinnedReview}
              </span>
            )}
          </div>
        </div>

        <p className="shrink-0 text-right text-[9px] font-bold leading-4 text-slate-400 sm:text-xs">
          {formatDate(
            createdAt,
            language
          )}
        </p>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 sm:p-5">
        <p className="text-[11px] font-bold leading-5 text-slate-600 sm:text-sm sm:leading-6">
          {comment}
        </p>
      </div>

      {merchantReply && (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 sm:text-xs">
              {labels.merchantReply}
            </p>

            {updatedAt && (
              <p className="text-right text-[9px] font-bold text-emerald-700/60 sm:text-xs">
                {formatDate(
                  updatedAt,
                  language
                )}
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

function formatDate(
  value: any,
  language: LanguageCode
) {
  if (!value) return "";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    language === "zh"
      ? "zh-CN"
      : language === "ms"
        ? "ms-MY"
        : "en-GB",
    {
      timeZone:
        "Asia/Kuala_Lumpur",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );
}