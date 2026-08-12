"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Coins,
  History,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

import MemberLayout from "@/components/layout/MemberLayout";
import { useLanguage } from "@/hooks/useLanguage";
import { getMemberPointsHistory } from "@/lib/api";

type HistoryFilter =
  | "ALL"
  | "EARN"
  | "REDEEM";

type PointHistoryItem = {
  pointId?: string;
  pointsTxId?: string;
  id?: string;
  transactionId?: string;
  type?: string;
  description?: string;
  source?: string;
  points?: number | string;
  createdAt?: string;
  CREATED_AT?: string;
  balanceAfter?: number | string;
  BALANCE_AFTER?: number | string;
};

type LanguageCode =
  | "en"
  | "zh"
  | "ms";

const pageText = {
  en: {
    back: "Back to Points & Rewards",
    eyebrow: "POINTS ACTIVITY",
    title: "Points History",
    description:
      "Review every points earning and redemption record in one place.",
    all: "All",
    earned: "Earned",
    redeemed: "Redeemed",
    searchPlaceholder:
      "Search description or source...",
    refresh: "Refresh",
    records: "records",
    pointsEarned: "Points Earned",
    pointsRedeemed: "Points Redeemed",
    noRecords: "No points history yet",
    noRecordsDescription:
      "Your earned and redeemed points will appear here.",
    noSearchResults:
      "No matching points records found.",
    loading: "Loading points history...",
    error:
      "Unable to load points history.",
    retry: "Try Again",
    memberSessionNotFound:
      "Member session not found. Please log in again.",
    balanceAfter: "Balance after",
    points: "pts",
    date: "Date",
  },

  zh: {
    back: "返回积分与奖励",
    eyebrow: "积分动态",
    title: "积分记录",
    description:
      "集中查看所有积分获得与兑换记录。",
    all: "全部",
    earned: "获得",
    redeemed: "兑换",
    searchPlaceholder:
      "搜索说明或来源……",
    refresh: "刷新",
    records: "记录",
    pointsEarned: "获得积分",
    pointsRedeemed: "兑换积分",
    noRecords: "目前没有积分记录",
    noRecordsDescription:
      "您获得和兑换的积分记录将显示在这里。",
    noSearchResults:
      "找不到符合条件的积分记录。",
    loading: "正在加载积分记录……",
    error: "无法加载积分记录。",
    retry: "重新尝试",
    memberSessionNotFound:
      "找不到会员登录资料，请重新登录。",
    balanceAfter: "变动后余额",
    points: "积分",
    date: "日期",
  },

  ms: {
    back: "Kembali ke Mata & Ganjaran",
    eyebrow: "AKTIVITI MATA",
    title: "Sejarah Mata",
    description:
      "Semak semua rekod mata yang diperoleh dan ditebus di satu tempat.",
    all: "Semua",
    earned: "Diperoleh",
    redeemed: "Ditebus",
    searchPlaceholder:
      "Cari penerangan atau sumber...",
    refresh: "Muat Semula",
    records: "rekod",
    pointsEarned: "Mata Diperoleh",
    pointsRedeemed: "Mata Ditebus",
    noRecords: "Belum ada sejarah mata",
    noRecordsDescription:
      "Mata yang diperoleh dan ditebus akan dipaparkan di sini.",
    noSearchResults:
      "Tiada rekod mata yang sepadan ditemui.",
    loading: "Memuatkan sejarah mata...",
    error:
      "Tidak dapat memuatkan sejarah mata.",
    retry: "Cuba Lagi",
    memberSessionNotFound:
      "Sesi ahli tidak ditemui. Sila log masuk semula.",
    balanceAfter: "Baki selepas",
    points: "mata",
    date: "Tarikh",
  },
} as const;

function unwrapApiData(
  result: any
) {
  return (
    result?.data?.data ??
    result?.data ??
    result?.result ??
    result ??
    {}
  );
}

function getMemberIdFromStorage() {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  try {
    const member = JSON.parse(
      window.localStorage.getItem(
        "member"
      ) || "{}"
    );

    return String(
      member?.memberId ||
        member?.MEMBER_ID ||
        ""
    ).trim();
  } catch {
    return "";
  }
}

function normalizeType(
  value: unknown
) {
  return String(
    value || ""
  )
    .trim()
    .toUpperCase();
}

function getPointsValue(
  item: PointHistoryItem
) {
  const value =
    Number(
      item.points || 0
    );

  return Number.isFinite(value)
    ? value
    : 0;
}

function parseDateValue(
  value: string
) {
  if (!value) {
    return null;
  }

  const normalized =
    value.replace(
      /^(\d{4})-(\d{2})-(\d{2})\s/,
      "$1/$2/$3 "
    );

  const date =
    new Date(normalized);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

function formatDateTime(
  value: string,
  language: LanguageCode
) {
  const date =
    parseDateValue(value);

  if (!date) {
    return value || "-";
  }

  const locale =
    language === "zh"
      ? "zh-CN"
      : language === "ms"
        ? "ms-MY"
        : "en-MY";

  return new Intl.DateTimeFormat(
    locale,
    {
      timeZone:
        "Asia/Kuala_Lumpur",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

export default function PointsHistoryPage() {
  const {
    language,
  } = useLanguage();

  const lang:
    LanguageCode =
      language === "zh" ||
      language === "ms"
        ? language
        : "en";

  const copy =
    pageText[lang];

  const [
    history,
    setHistory,
  ] =
    useState<
      PointHistoryItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<HistoryFilter>(
      "ALL"
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const loadHistory =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const memberId =
            getMemberIdFromStorage();

          if (!memberId) {
            throw new Error(
              copy.memberSessionNotFound
            );
          }

          const response =
            await getMemberPointsHistory(
              {
                memberId,
                limit: 500,
              }
            );

          const data =
            unwrapApiData(
              response
            );

          const rows =
            Array.isArray(
              data?.history
            )
              ? data.history
              : Array.isArray(data)
                ? data
                : [];

          setHistory(
            rows as PointHistoryItem[]
          );
        } catch (err: any) {
          console.error(
            "Failed to load points history:",
            err
          );

          setError(
            err?.message ||
              copy.error
          );

          setHistory([]);
        } finally {
          setLoading(false);
        }
      },
      [
        copy.error,
        copy.memberSessionNotFound,
      ]
    );

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filteredHistory =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return history.filter(
        (item) => {
          const points =
            getPointsValue(
              item
            );

          const type =
            normalizeType(
              item.type
            );

          const isEarn =
            type === "EARN" ||
            type === "EARNED" ||
            points > 0;

          const isRedeem =
            type === "REDEEM" ||
            type === "REDEEMED" ||
            type === "REDEMPTION" ||
            points < 0;

          if (
            filter === "EARN" &&
            !isEarn
          ) {
            return false;
          }

          if (
            filter ===
              "REDEEM" &&
            !isRedeem
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          const searchText =
            [
              item.description,
              item.source,
              item.transactionId,
              item.pointId,
              item.pointsTxId,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchText.includes(
            keyword
          );
        }
      );
    }, [
      history,
      filter,
      search,
    ]);

  const earnedCount =
    history.filter(
      (item) =>
        getPointsValue(
          item
        ) > 0
    ).length;

  const redeemedCount =
    history.filter(
      (item) =>
        getPointsValue(
          item
        ) < 0
    ).length;

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/member/points"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              {copy.back}
            </Link>

            <button
              type="button"
              onClick={() =>
                void loadHistory()
              }
              disabled={loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
              <RefreshCw
                className={[
                  "h-4 w-4",
                  loading
                    ? "animate-spin"
                    : "",
                ].join(" ")}
              />
              <span className="hidden sm:inline">
                {copy.refresh}
              </span>
            </button>
          </div>

          <section className="mt-5 overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-2xl sm:mt-6 sm:rounded-[2.5rem]">
            <div className="relative p-5 sm:p-7 md:p-9">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs">
                    {copy.eyebrow}
                  </p>

                  <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl md:text-5xl">
                    {copy.title}
                  </h1>

                  <p className="mt-3 max-w-2xl text-xs font-bold leading-6 text-slate-400 sm:text-sm">
                    {copy.description}
                  </p>
                </div>

                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 sm:flex">
                  <History className="h-7 w-7 text-amber-300" />
                </div>
              </div>

              <div className="relative mt-6 grid grid-cols-3 gap-3 sm:mt-8">
                <SummaryCard
                  label={copy.all}
                  value={history.length}
                />

                <SummaryCard
                  label={copy.earned}
                  value={earnedCount}
                />

                <SummaryCard
                  label={copy.redeemed}
                  value={redeemedCount}
                />
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder={
                    copy.searchPlaceholder
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(
                  [
                    [
                      "ALL",
                      copy.all,
                    ],
                    [
                      "EARN",
                      copy.earned,
                    ],
                    [
                      "REDEEM",
                      copy.redeemed,
                    ],
                  ] as const
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setFilter(
                          value
                        )
                      }
                      className={[
                        "shrink-0 rounded-full border px-4 py-2.5 text-xs font-black transition",
                        filter ===
                        value
                          ? "border-slate-950 bg-slate-950 text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                      ].join(
                        " "
                      )}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs font-black text-slate-950 sm:text-sm">
                {copy.title}
              </p>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600 sm:text-xs">
                {
                  filteredHistory.length
                }{" "}
                {copy.records}
              </span>
            </div>

            {loading ? (
              <div className="mt-5 flex min-h-[220px] items-center justify-center rounded-2xl bg-slate-50">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
                  <p className="mt-3 text-xs font-bold text-slate-500 sm:text-sm">
                    {copy.loading}
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-sm font-black text-red-700">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void loadHistory()
                  }
                  className="mt-4 rounded-xl bg-red-700 px-4 py-2.5 text-xs font-black text-white"
                >
                  {copy.retry}
                </button>
              </div>
            ) : filteredHistory.length >
              0 ? (
              <div className="mt-5 space-y-3">
                {filteredHistory.map(
                  (
                    item,
                    index
                  ) => (
                    <HistoryCard
                      key={
                        item.pointId ||
                        item.pointsTxId ||
                        item.id ||
                        item.transactionId ||
                        `points-history-${index}`
                      }
                      item={item}
                      language={
                        lang
                      }
                      copy={
                        copy
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 p-7 text-center sm:p-9">
                <Coins className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-4 text-base font-black text-slate-950 sm:text-lg">
                  {history.length ===
                  0
                    ? copy.noRecords
                    : copy.noSearchResults}
                </p>

                <p className="mx-auto mt-2 max-w-lg text-xs font-bold leading-6 text-slate-500 sm:text-sm">
                  {history.length ===
                  0
                    ? copy.noRecordsDescription
                    : copy.description}
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
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 sm:p-4">
      <p className="text-[9px] font-bold text-slate-400 sm:text-[10px]">
        {label}
      </p>

      <p className="mt-1 text-lg font-black sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function HistoryCard({
  item,
  language,
  copy,
}: {
  item: PointHistoryItem;
  language: LanguageCode;
  copy:
    (typeof pageText)[LanguageCode];
}) {
  const points =
    getPointsValue(item);

  const type =
    normalizeType(
      item.type
    );

  const earned =
    type === "EARN" ||
    type === "EARNED" ||
    points > 0;

  const title =
    earned
      ? copy.pointsEarned
      : copy.pointsRedeemed;

  const createdAt =
    String(
      item.createdAt ||
        item.CREATED_AT ||
        ""
    );

  const balanceAfterRaw =
    item.balanceAfter ??
    item.BALANCE_AFTER;

  const hasBalance =
    balanceAfterRaw !==
      undefined &&
    balanceAfterRaw !== null &&
    String(
      balanceAfterRaw
    ).trim() !== "";

  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md sm:rounded-[1.6rem] sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            earned
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {earned ? (
            <ArrowUpRight className="h-5 w-5" />
          ) : (
            <ArrowDownRight className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-950 sm:text-base">
                {title}
              </p>

              <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                {item.description ||
                  item.source ||
                  "-"}
              </p>
            </div>

            <p
              className={[
                "shrink-0 text-base font-black sm:text-lg",
                earned
                  ? "text-emerald-600"
                  : "text-amber-700",
              ].join(" ")}
            >
              {points > 0
                ? "+"
                : ""}
              {points}{" "}
              {copy.points}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 sm:text-xs">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateTime(
                createdAt,
                language
              )}
            </span>

            {hasBalance ? (
              <span className="text-[10px] font-bold text-slate-400 sm:text-xs">
                {copy.balanceAfter}:{" "}
                <span className="font-black text-slate-600">
                  {Number(
                    balanceAfterRaw ||
                      0
                  ).toLocaleString()}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}