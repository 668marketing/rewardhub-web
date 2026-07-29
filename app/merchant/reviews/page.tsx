"use client";

import { useEffect, useMemo, useState } from "react";
import MerchantNav from "@/components/layout/MerchantNav";
import {
  getMerchantReviews,
  replyMerchantReview,
} from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations = {
  en: {
    replyEmpty: "Reply cannot be empty",
    replyTooLong: "Reply must not exceed 1000 characters",
    replySaved: "Reply saved successfully",
    unableSaveReply: "Unable to save reply",
    merchantReviews: "Merchant Reviews",
    customerFeedback: "Customer Feedback",
    pageDescription:
      "Monitor ratings and reply to customer reviews professionally.",
    averageRating: "Average Rating",
    totalReviews: "Total Reviews",
    replied: "Replied",
    pendingReply: "Pending Reply",
    reviewList: "Review List",
    showingReviews: "Showing {{count}} review(s)",
    searchReviews: "Search reviews",
    allRatings: "All Ratings",
    fiveStars: "5 Stars",
    fourStars: "4 Stars",
    threeStars: "3 Stars",
    twoStars: "2 Stars",
    oneStar: "1 Star",
    allReplies: "All Replies",
    newest: "Newest",
    oldest: "Oldest",
    highestRating: "Highest Rating",
    lowestRating: "Lowest Rating",
    noReviewsFound: "No reviews found",
    noReviewsDescription:
      "Reviews matching your filters will appear here.",
    member: "Member",
    verifiedPurchase: "Verified Purchase",
    noComment: "No comment added.",
    merchantReply: "Merchant Reply",
    replyPlaceholder: "Write a professional reply...",
    saving: "Saving...",
    saveReply: "Save Reply",
    cancel: "Cancel",
    editReply: "Edit Reply →",
    replyToReview: "Reply to Review",
  },
  zh: {
    replyEmpty: "回复内容不能为空",
    replyTooLong: "回复内容不能超过 1000 个字符",
    replySaved: "回复保存成功",
    unableSaveReply: "无法保存回复",
    merchantReviews: "商家评价",
    customerFeedback: "顾客反馈",
    pageDescription: "查看顾客评分，并专业地回复顾客评价。",
    averageRating: "平均评分",
    totalReviews: "评价总数",
    replied: "已回复",
    pendingReply: "待回复",
    reviewList: "评价列表",
    showingReviews: "显示 {{count}} 条评价",
    searchReviews: "搜索评价",
    allRatings: "全部评分",
    fiveStars: "5 星",
    fourStars: "4 星",
    threeStars: "3 星",
    twoStars: "2 星",
    oneStar: "1 星",
    allReplies: "全部回复状态",
    newest: "最新",
    oldest: "最早",
    highestRating: "评分最高",
    lowestRating: "评分最低",
    noReviewsFound: "找不到评价",
    noReviewsDescription: "符合当前筛选条件的评价会显示在这里。",
    member: "会员",
    verifiedPurchase: "已验证消费",
    noComment: "没有填写评价内容。",
    merchantReply: "商家回复",
    replyPlaceholder: "填写专业的回复内容……",
    saving: "正在保存……",
    saveReply: "保存回复",
    cancel: "取消",
    editReply: "编辑回复 →",
    replyToReview: "回复评价",
  },
  ms: {
    replyEmpty: "Balasan tidak boleh kosong",
    replyTooLong: "Balasan tidak boleh melebihi 1000 aksara",
    replySaved: "Balasan berjaya disimpan",
    unableSaveReply: "Tidak dapat menyimpan balasan",
    merchantReviews: "Ulasan Pedagang",
    customerFeedback: "Maklum Balas Pelanggan",
    pageDescription:
      "Pantau penilaian dan balas ulasan pelanggan secara profesional.",
    averageRating: "Purata Penilaian",
    totalReviews: "Jumlah Ulasan",
    replied: "Telah Dibalas",
    pendingReply: "Menunggu Balasan",
    reviewList: "Senarai Ulasan",
    showingReviews: "Memaparkan {{count}} ulasan",
    searchReviews: "Cari ulasan",
    allRatings: "Semua Penilaian",
    fiveStars: "5 Bintang",
    fourStars: "4 Bintang",
    threeStars: "3 Bintang",
    twoStars: "2 Bintang",
    oneStar: "1 Bintang",
    allReplies: "Semua Balasan",
    newest: "Terbaharu",
    oldest: "Terlama",
    highestRating: "Penilaian Tertinggi",
    lowestRating: "Penilaian Terendah",
    noReviewsFound: "Tiada ulasan ditemui",
    noReviewsDescription:
      "Ulasan yang sepadan dengan penapis anda akan dipaparkan di sini.",
    member: "Ahli",
    verifiedPurchase: "Pembelian Disahkan",
    noComment: "Tiada komen ditambah.",
    merchantReply: "Balasan Pedagang",
    replyPlaceholder: "Tulis balasan yang profesional...",
    saving: "Sedang Menyimpan...",
    saveReply: "Simpan Balasan",
    cancel: "Batal",
    editReply: "Edit Balasan →",
    replyToReview: "Balas Ulasan",
  },
} as const;

function normalizeLanguage(value: string | null): LanguageCode {
  return value === "zh" || value === "ms" ? value : "en";
}

function fillText(
  value: string,
  replacements: Record<string, string | number>
) {
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{{${key}}}`, String(replacement)),
    value
  );
}

export default function MerchantReviewsPage() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [merchantId, setMerchantId] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    repliedReviews: 0,
    pendingReplies: 0,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [replyFilter, setReplyFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const [editingId, setEditingId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [savingId, setSavingId] = useState("");

  const t = useMemo(() => translations[language], [language]);

  useEffect(() => {
    setLanguage(
      normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))
    );

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: string }>;

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
    window.addEventListener("storage", handleLanguageChange as EventListener);

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
    let stored: any = {};

    try {
      stored = JSON.parse(localStorage.getItem("merchant") || "{}");
    } catch {
      stored = {};
    }

    const id = stored?.merchantId || stored?.MERCHANT_ID || "";

    setMerchantId(id);

    if (!id) {
      setLoading(false);
      return;
    }

    void loadReviews(id);
  }, []);

  async function loadReviews(id = merchantId) {
    if (!id) return;

    try {
      setLoading(true);

      const res = await getMerchantReviews(id);

      const data =
        res?.data?.data ||
        res?.data ||
        res?.result ||
        res;

      const list = Array.isArray(data?.reviews)
        ? data.reviews
        : [];

      setReviews(list);

      const validRatings = list
        .map((review: any) => Number(review?.rating || 0))
        .filter((rating: number) => rating >= 1 && rating <= 5);

      const calculatedAverage =
        validRatings.length > 0
          ? validRatings.reduce(
              (sum: number, rating: number) => sum + rating,
              0
            ) / validRatings.length
          : 0;

      const calculatedReplied = list.filter((review: any) =>
        String(review?.merchantReply || "").trim()
      ).length;

      const backendAverage = Number(data?.averageRating);

      setSummary({
        averageRating:
          Number.isFinite(backendAverage) && backendAverage > 0
            ? backendAverage
            : calculatedAverage,

        totalReviews: Number(
          data?.totalReviews ?? list.length
        ),

        repliedReviews: Number(
          data?.repliedReviews ?? calculatedReplied
        ),

        pendingReplies: Number(
          data?.pendingReplies ??
            Math.max(list.length - calculatedReplied, 0)
        ),
      });
    } catch (error) {
      console.error(
        "Failed to load merchant reviews:",
        error
      );

      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredReviews = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let result = reviews.filter((review) => {
      const memberName = String(
        review?.memberName || ""
      ).toLowerCase();

      const comment = String(
        review?.comment || ""
      ).toLowerCase();

      const merchantReply = String(
        review?.merchantReply || ""
      ).toLowerCase();

      const matchesSearch =
        !keyword ||
        memberName.includes(keyword) ||
        comment.includes(keyword) ||
        merchantReply.includes(keyword);

      const matchesRating =
        ratingFilter === "All" ||
        Number(review?.rating || 0) ===
          Number(ratingFilter);

      const hasReply = Boolean(
        String(
          review?.merchantReply || ""
        ).trim()
      );

      const matchesReply =
        replyFilter === "All" ||
        (replyFilter === "Replied" && hasReply) ||
        (replyFilter === "Pending" && !hasReply);

      return (
        matchesSearch &&
        matchesRating &&
        matchesReply
      );
    });

    result = [...result].sort((a, b) => {
      const dateA = new Date(
        a?.createdAt || 0
      ).getTime();

      const dateB = new Date(
        b?.createdAt || 0
      ).getTime();

      if (sortBy === "Oldest") {
        return dateA - dateB;
      }

      if (sortBy === "Highest Rating") {
        return (
          Number(b?.rating || 0) -
          Number(a?.rating || 0)
        );
      }

      if (sortBy === "Lowest Rating") {
        return (
          Number(a?.rating || 0) -
          Number(b?.rating || 0)
        );
      }

      return dateB - dateA;
    });

    return result;
  }, [
    reviews,
    search,
    ratingFilter,
    replyFilter,
    sortBy,
  ]);

  function startReply(review: any) {
    setEditingId(review.reviewId);
    setReplyText(review.merchantReply || "");
  }

  function cancelReply() {
    setEditingId("");
    setReplyText("");
  }

  async function saveReply(review: any) {
    const cleanReply = replyText.trim();

    if (!cleanReply) {
      alert(t.replyEmpty);
      return;
    }

    if (cleanReply.length > 1000) {
      alert(t.replyTooLong);
      return;
    }

    try {
      setSavingId(review.reviewId);

      await replyMerchantReview({
        merchantId,
        reviewId: review.reviewId,
        merchantReply: cleanReply,
      });

      setReviews((current) =>
        current.map((item) =>
          item.reviewId === review.reviewId
            ? {
                ...item,
                merchantReply: cleanReply,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      setSummary((current) => {
        const previouslyReplied = Boolean(
          String(
            review?.merchantReply || ""
          ).trim()
        );

        if (previouslyReplied) {
          return current;
        }

        return {
          ...current,
          repliedReviews: current.repliedReviews + 1,
          pendingReplies: Math.max(
            current.pendingReplies - 1,
            0
          ),
        };
      });

      cancelReply();
      alert(t.replySaved);
    } catch (error: any) {
      alert(error?.message || t.unableSaveReply);
    } finally {
      setSavingId("");
    }
  }

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-10">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />

            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
                {t.merchantReviews}
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
                {t.customerFeedback}
              </h1>

              <p className="mt-2 max-w-2xl text-[11px] font-bold leading-5 text-slate-400 sm:mt-3 sm:text-sm sm:leading-6">
                {t.pageDescription}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
                <SummaryCard
                  title={t.averageRating}
                  value={`★ ${summary.averageRating.toFixed(1)}`}
                />

                <SummaryCard
                  title={t.totalReviews}
                  value={summary.totalReviews}
                />

                <SummaryCard
                  title={t.replied}
                  value={summary.repliedReviews}
                  green
                />

                <SummaryCard
                  title={t.pendingReply}
                  value={summary.pendingReplies}
                  amber
                />
              </div>
            </div>
          </div>

          <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  {t.reviewList}
                </h2>

                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                  {fillText(t.showingReviews, {
                    count: filteredReviews.length,
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder={t.searchReviews}
                  className="col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:text-sm lg:col-span-1"
                />

                <select
                  value={ratingFilter}
                  onChange={(event) =>
                    setRatingFilter(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:text-sm"
                >
                  <option value="All">{t.allRatings}</option>
                  <option value="5">{t.fiveStars}</option>
                  <option value="4">{t.fourStars}</option>
                  <option value="3">{t.threeStars}</option>
                  <option value="2">{t.twoStars}</option>
                  <option value="1">{t.oneStar}</option>
                </select>

                <select
                  value={replyFilter}
                  onChange={(event) =>
                    setReplyFilter(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:text-sm"
                >
                  <option value="All">{t.allReplies}</option>
                  <option value="Pending">{t.pendingReply}</option>
                  <option value="Replied">{t.replied}</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value)
                  }
                  className="col-span-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:text-sm lg:col-span-1"
                >
                  <option value="Newest">{t.newest}</option>
                  <option value="Oldest">{t.oldest}</option>
                  <option value="Highest Rating">
                    {t.highestRating}
                  </option>
                  <option value="Lowest Rating">
                    {t.lowestRating}
                  </option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-48 animate-pulse rounded-[1.5rem] bg-slate-100 sm:rounded-[2rem]"
                  />
                ))}
              </div>
            ) : filteredReviews.length > 0 ? (
              <div className="mt-6 space-y-4">
                {filteredReviews.map((review) => (
                  <ReviewCard
                    key={review.reviewId}
                    review={review}
                    editing={editingId === review.reviewId}
                    replyText={replyText}
                    saving={savingId === review.reviewId}
                    language={language}
                    labels={{
                      member: t.member,
                      verifiedPurchase: t.verifiedPurchase,
                      replied: t.replied,
                      pendingReply: t.pendingReply,
                      noComment: t.noComment,
                      merchantReply: t.merchantReply,
                      replyPlaceholder: t.replyPlaceholder,
                      saving: t.saving,
                      saveReply: t.saveReply,
                      cancel: t.cancel,
                      editReply: t.editReply,
                      replyToReview: t.replyToReview,
                    }}
                    onStart={() => startReply(review)}
                    onCancel={cancelReply}
                    onReplyChange={setReplyText}
                    onSave={() => void saveReply(review)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-8 text-center sm:rounded-[2rem] sm:p-10">
                <p className="text-3xl">⭐</p>

                <h3 className="mt-3 text-xl font-black text-slate-950">
                  {t.noReviewsFound}
                </h3>

                <p className="mt-2 text-xs font-bold text-slate-500 sm:text-sm">
                  {t.noReviewsDescription}
                </p>
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}

function SummaryCard({
  title,
  value,
  green = false,
  amber = false,
}: {
  title: string;
  value: any;
  green?: boolean;
  amber?: boolean;
}) {
  const valueClass = green
    ? "text-emerald-300"
    : amber
      ? "text-amber-300"
      : "text-white";

  return (
    <div className="rounded-[1.25rem] bg-white/10 p-4 sm:rounded-[2rem] sm:p-6">
      <p className="text-[10px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>

      <p
        className={`mt-2 text-2xl font-black sm:text-4xl ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function ReviewCard({
  review,
  editing,
  replyText,
  saving,
  language,
  labels,
  onStart,
  onCancel,
  onReplyChange,
  onSave,
}: {
  review: any;
  editing: boolean;
  replyText: string;
  saving: boolean;
  language: LanguageCode;
  labels: {
    member: string;
    verifiedPurchase: string;
    replied: string;
    pendingReply: string;
    noComment: string;
    merchantReply: string;
    replyPlaceholder: string;
    saving: string;
    saveReply: string;
    cancel: string;
    editReply: string;
    replyToReview: string;
  };
  onStart: () => void;
  onCancel: () => void;
  onReplyChange: (value: string) => void;
  onSave: () => void;
}) {
  const rating = Math.max(
    1,
    Math.min(5, Number(review?.rating || 1))
  );

  const hasReply = Boolean(
    String(review?.merchantReply || "").trim()
  );

  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 sm:rounded-[2rem] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-black text-amber-500 sm:text-xl">
            {"★".repeat(rating)}
            {"☆".repeat(5 - rating)}
          </p>

          <h3 className="mt-2 text-base font-black text-slate-950 sm:text-lg">
            {review?.memberName || labels.member}
          </h3>

          <p className="mt-1 text-[10px] font-bold text-emerald-700 sm:text-xs">
            {labels.verifiedPurchase}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-slate-500 sm:text-xs">
            {hasReply ? labels.replied : labels.pendingReply}
          </span>

          <p className="mt-2 text-[9px] font-bold text-slate-400 sm:text-xs">
            {formatDate(review?.createdAt, language)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 sm:mt-5 sm:p-5">
        <p className="text-xs font-bold leading-5 text-slate-700 sm:text-sm sm:leading-6">
          {review?.comment || labels.noComment}
        </p>
      </div>

      {editing ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:mt-5 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-slate-950 sm:text-sm">
              {labels.merchantReply}
            </p>

            <p className="text-[9px] font-bold text-slate-400 sm:text-xs">
              {replyText.length} / 1000
            </p>
          </div>

          <textarea
            value={replyText}
            maxLength={1000}
            onChange={(event) =>
              onReplyChange(event.target.value)
            }
            rows={4}
            className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:text-sm"
            placeholder={labels.replyPlaceholder}
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-xl bg-slate-950 py-3 text-xs font-black text-white disabled:opacity-50 sm:rounded-2xl sm:text-sm"
            >
              {saving ? labels.saving : labels.saveReply}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl bg-slate-100 py-3 text-xs font-black text-slate-700 sm:rounded-2xl sm:text-sm"
            >
              {labels.cancel}
            </button>
          </div>
        </div>
      ) : hasReply ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:mt-5 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 sm:text-xs">
            {labels.merchantReply}
          </p>

          <p className="mt-2 text-xs font-bold leading-5 text-emerald-950 sm:text-sm sm:leading-6">
            {review.merchantReply}
          </p>

          <button
            type="button"
            onClick={onStart}
            className="mt-3 text-[10px] font-black text-emerald-700 sm:text-xs"
          >
            {labels.editReply}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onStart}
          className="mt-4 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white transition hover:bg-slate-800 sm:mt-5 sm:rounded-2xl sm:py-4 sm:text-sm"
        >
          {labels.replyToReview}
        </button>
      )}
    </article>
  );
}

function formatDate(value: any, language: LanguageCode) {
  if (!value) return "-";

  return new Date(value).toLocaleString(
    language === "zh"
      ? "zh-CN"
      : language === "ms"
        ? "ms-MY"
        : "en-GB",
    {
      timeZone: "Asia/Kuala_Lumpur",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );
}