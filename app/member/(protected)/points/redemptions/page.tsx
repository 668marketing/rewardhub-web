"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Clock3,
  Gift,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  Ticket,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import MemberLayout from "@/components/layout/MemberLayout";

import { useLanguage } from "@/hooks/useLanguage";

import {
  getRewardRedemptionHistory,
  type RewardRedemptionItem,
} from "@/lib/api";

type StoredMember = {
  memberId?: string;
  MEMBER_ID?: string;
  id?: string;
  profile?: StoredMember;
  member?: StoredMember;
  data?: StoredMember;
};

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";


type RewardRedemptionWithVoucher =
  RewardRedemptionItem & {
    voucherId?: string;
    voucherStatus?: string;
    voucherAvailable?: boolean;
    voucherUsed?: boolean;
    voucherUsedAt?: string;
    voucherUsedTransactionId?: string;
    voucherUsedMerchantId?: string;
    voucherUsedMerchantName?: string;
    voucherExpiredAt?: string;
  };

function getMemberIdFromStorage() {
  if (typeof window === "undefined") {
    return "";
  }

  const storageKeys = [
    "member",
    "rewardhub_member",
    "member_session",
  ];

  for (const storageKey of storageKeys) {
    try {
      const raw =
        window.localStorage.getItem(storageKey);

      if (!raw) {
        continue;
      }

      const parsed =
        JSON.parse(raw) as StoredMember;

      const memberId =
        String(
          parsed.memberId ??
            parsed.MEMBER_ID ??
            parsed.id ??
            parsed.profile?.memberId ??
            parsed.profile?.MEMBER_ID ??
            parsed.member?.memberId ??
            parsed.member?.MEMBER_ID ??
            parsed.data?.memberId ??
            parsed.data?.MEMBER_ID ??
            ""
        ).trim();

      if (memberId) {
        return memberId;
      }
    } catch {
      continue;
    }
  }

  return "";
}

function normalizeStatus(value: string) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function parseDateValue(value: string) {
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

function getDateLocale(language: string) {
  if (language === "zh") return "zh-CN";
  if (language === "ms") return "ms-MY";
  return "en-MY";
}

function formatDateTime(
  value: string,
  language: string
) {
  const date =
    parseDateValue(value);

  if (!date) {
    return value || "-";
  }

  return new Intl.DateTimeFormat(
    getDateLocale(language),
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function getText(
  language: string,
  en: string,
  zh: string,
  ms: string
) {
  if (language === "zh") {
    return zh;
  }

  if (language === "ms") {
    return ms;
  }

  return en;
}

function getVoucherStatusLabel(
  status: string,
  language: string
) {
  const normalized =
    normalizeStatus(status);

  if (normalized === "USED") {
    return getText(
      language,
      "Used",
      "已使用",
      "Telah Digunakan"
    );
  }

  if (normalized === "REDEEMED") {
    return getText(
      language,
      "Available",
      "可使用",
      "Boleh Digunakan"
    );
  }

  if (normalized === "EXPIRED") {
    return getText(
      language,
      "Expired",
      "已过期",
      "Tamat Tempoh"
    );
  }

  if (normalized === "DISABLED") {
    return getText(
      language,
      "Unavailable",
      "不可使用",
      "Tidak Tersedia"
    );
  }

  return status || "";
}

function getVoucherStatusClasses(
  status: string
) {
  const normalized =
    normalizeStatus(status);

  if (normalized === "USED") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  if (normalized === "REDEEMED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "EXPIRED") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "DISABLED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getStatusLabel(
  status: string,
  language: string
) {
  const normalized =
    normalizeStatus(status);

  const labels: Record<
    string,
    [string, string, string]
  > = {
    PENDING: [
      "Pending",
      "待处理",
      "Menunggu",
    ],
    PROCESSING: [
      "Processing",
      "处理中",
      "Diproses",
    ],
    SHIPPED: [
      "Shipped",
      "已寄出",
      "Dihantar",
    ],
    COMPLETED: [
      "Completed",
      "已完成",
      "Selesai",
    ],
    CANCELLED: [
      "Cancelled",
      "已取消",
      "Dibatalkan",
    ],
  };

  const item =
    labels[normalized];

  if (!item) {
    return status || "-";
  }

  if (language === "zh") {
    return item[1];
  }

  if (language === "ms") {
    return item[2];
  }

  return item[0];
}

function getStatusClasses(
  status: string
) {
  const normalized =
    normalizeStatus(status);

  if (
    normalized ===
    "COMPLETED"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized ===
    "SHIPPED"
  ) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (
    normalized ===
    "PROCESSING"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    normalized ===
    "CANCELLED"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function normalizeHistoryResult(
  result: any
): RewardRedemptionWithVoucher[] {
  const candidates = [
    // Current RewardHub API shape:
    // { success: true, data: { message: "...", data: { history: [...] } } }
    result?.data?.data?.history,
    result?.data?.data?.items,
    result?.data?.data?.redemptions,

    // Backward-compatible response shapes
    result?.data?.history,
    result?.data?.items,
    result?.data?.redemptions,
    result?.history,
    result?.items,
    result?.redemptions,

    // Direct-array fallbacks
    result?.data?.data,
    result?.data,
    result,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as RewardRedemptionWithVoucher[];
    }
  }

  return [];
}

export default function MemberRewardRedemptionsPage() {
  const router =
    useRouter();

  const { language } =
    useLanguage();

  const [items, setItems] =
    useState<RewardRedemptionWithVoucher[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "ALL"
    );

  const loadItems =
    useCallback(
      async (
        showRefreshLoader =
          false
      ) => {
        const memberId =
          getMemberIdFromStorage();

        if (!memberId) {
          setError(
            getText(
              language,
              "Member session is unavailable.",
              "找不到会员登录资料。",
              "Sesi ahli tidak tersedia."
            )
          );

          setLoading(false);
          return;
        }

        try {
          if (
            showRefreshLoader
          ) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const result =
            await getRewardRedemptionHistory({
              memberId,
              status:
                statusFilter ===
                "ALL"
                  ? ""
                  : statusFilter,
              limit: 100,
            });

          setItems(
            normalizeHistoryResult(
              result
            )
          );
        } catch (loadError) {
          setItems([]);

          setError(
            loadError instanceof Error
              ? loadError.message
              : getText(
                  language,
                  "Unable to load redemption history.",
                  "无法读取兑换记录。",
                  "Tidak dapat memuatkan rekod penebusan."
                )
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        language,
        statusFilter,
      ]
    );

  useEffect(
    function () {
      void loadItems();
    },
    [loadItems]
  );

  const filteredItems =
    useMemo(
      function () {
        const keyword =
          search
            .trim()
            .toLowerCase();

        const filtered =
          items.filter(
            function (item) {
              if (
                statusFilter !==
                  "ALL" &&
                normalizeStatus(
                  item.status
                ) !==
                  statusFilter
              ) {
                return false;
              }

              if (!keyword) {
                return true;
              }

              return [
                item.redemptionId,
                item.rewardId,
                item.rewardTitle,
                item.voucherCode,
                item.voucherStatus,
                item.voucherUsedTransactionId,
                item.voucherUsedMerchantId,
                item.voucherUsedMerchantName,
                item.trackingNo,
                item.deliveryMethod,
                item.status,
              ]
                .join(" ")
                .toLowerCase()
                .includes(keyword);
            }
          );

        return [...filtered].sort(
          function (a, b) {
            const aTime =
              parseDateValue(
                a.redeemedAt
              )?.getTime() || 0;

            const bTime =
              parseDateValue(
                b.redeemedAt
              )?.getTime() || 0;

            return bTime - aTime;
          }
        );
      },
      [
        items,
        search,
        statusFilter,
      ]
    );

  const counts =
    useMemo(
      function () {
        return {
          total:
            items.length,

          pending:
            items.filter(
              (item) =>
                normalizeStatus(
                  item.status
                ) === "PENDING"
            ).length,

          processing:
            items.filter(
              (item) =>
                normalizeStatus(
                  item.status
                ) ===
                "PROCESSING"
            ).length,

          shipped:
            items.filter(
              (item) =>
                normalizeStatus(
                  item.status
                ) === "SHIPPED"
            ).length,

          completed:
            items.filter(
              (item) =>
                normalizeStatus(
                  item.status
                ) ===
                "COMPLETED"
            ).length,
        };
      },
      [items]
    );

  if (loading) {
    return (
      <MemberLayout>
        <main className="flex min-h-[60vh] items-center justify-center bg-[#f6f7fb]">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-950" />

            <p className="mt-4 text-sm font-bold text-slate-500">
              {getText(
                language,
                "Loading your rewards...",
                "正在读取我的奖励...",
                "Memuatkan ganjaran anda..."
              )}
            </p>
          </div>
        </main>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-3 pb-28 pt-3 sm:px-6 sm:pb-32 sm:pt-5 lg:px-8 lg:pb-14 lg:pt-9">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/member/points"
              )
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />

            {getText(
              language,
              "Back to Points",
              "返回积分中心",
              "Kembali ke Mata"
            )}
          </button>

          <button
            type="button"
            disabled={
              refreshing
            }
            onClick={() =>
              void loadItems(
                true
              )
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {getText(
              language,
              "Refresh",
              "刷新",
              "Muat Semula"
            )}
          </button>
        </div>

        <section className="relative mt-4 overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-950 via-slate-900 to-[#11264f] p-5 text-white shadow-[0_20px_70px_rgba(15,23,42,0.14)] sm:mt-6 sm:rounded-[36px] sm:p-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200 sm:text-xs">
              <Gift className="h-4 w-4" />

              {getText(
                language,
                "Reward history",
                "奖励记录",
                "Sejarah ganjaran"
              )}
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              {getText(
                language,
                "My Rewards",
                "我的奖励",
                "Ganjaran Saya"
              )}
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-300 sm:text-base">
              {getText(
                language,
                "View all rewards you have redeemed, including vouchers, digital rewards and physical items.",
                "查看你已经兑换的所有奖励，包括 Voucher、电子奖励和实体商品。",
                "Lihat semua ganjaran yang telah anda tebus, termasuk baucar, ganjaran digital dan barangan fizikal."
              )}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <SummaryCard
                label={getText(
                  language,
                  "Total",
                  "全部",
                  "Jumlah"
                )}
                value={counts.total}
              />

              <SummaryCard
                label={getText(
                  language,
                  "Pending",
                  "待处理",
                  "Menunggu"
                )}
                value={
                  counts.pending
                }
              />

              <SummaryCard
                label={getText(
                  language,
                  "Processing",
                  "处理中",
                  "Diproses"
                )}
                value={
                  counts.processing
                }
              />

              <SummaryCard
                label={getText(
                  language,
                  "Shipped",
                  "已寄出",
                  "Dihantar"
                )}
                value={
                  counts.shipped
                }
              />

              <SummaryCard
                label={getText(
                  language,
                  "Completed",
                  "已完成",
                  "Selesai"
                )}
                value={
                  counts.completed
                }
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="text-sm font-black">
                {getText(
                  language,
                  "Unable to load rewards",
                  "读取奖励失败",
                  "Tidak dapat memuatkan ganjaran"
                )}
              </p>

              <p className="mt-1 text-xs font-semibold leading-5">
                {error}
              </p>
            </div>
          </div>
        )}

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_45px_rgba(15,23,42,0.06)] sm:mt-6 sm:rounded-[32px] sm:p-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="h-4 w-4 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={getText(
                  language,
                  "Search reward, voucher code or redemption ID...",
                  "搜索奖励、Voucher Code 或兑换编号...",
                  "Cari ganjaran, kod baucar atau ID penebusan..."
                )}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </label>

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter
                )
              }
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 outline-none"
            >
              <option value="ALL">
                {getText(
                  language,
                  "All statuses",
                  "全部状态",
                  "Semua status"
                )}
              </option>

              <option value="PENDING">
                {getStatusLabel(
                  "PENDING",
                  language
                )}
              </option>

              <option value="PROCESSING">
                {getStatusLabel(
                  "PROCESSING",
                  language
                )}
              </option>

              <option value="SHIPPED">
                {getStatusLabel(
                  "SHIPPED",
                  language
                )}
              </option>

              <option value="COMPLETED">
                {getStatusLabel(
                  "COMPLETED",
                  language
                )}
              </option>

              <option value="CANCELLED">
                {getStatusLabel(
                  "CANCELLED",
                  language
                )}
              </option>
            </select>
          </div>
        </section>

        <section className="mt-4 sm:mt-6">
          {filteredItems.length ===
          0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:rounded-[34px] sm:py-16">
              <Gift className="mx-auto h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-black text-slate-950">
                {getText(
                  language,
                  "No rewards found",
                  "暂时没有奖励记录",
                  "Tiada ganjaran ditemui"
                )}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                {getText(
                  language,
                  "Redeem rewards from the Points Center and they will appear here.",
                  "你在积分中心兑换奖励后，记录会显示在这里。",
                  "Tebus ganjaran dari Pusat Mata dan rekod akan dipaparkan di sini."
                )}
              </p>

              <Link
                href="/member/points"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white"
              >
                {getText(
                  language,
                  "Browse Rewards",
                  "浏览奖励",
                  "Lihat Ganjaran"
                )}
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredItems.map(
                (item) => (
                  <RedemptionCard
                    key={
                      item.redemptionId
                    }
                    item={item}
                    language={
                      language
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
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
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-300 sm:text-xs">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-white sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function RedemptionCard({
  item,
  language,
}: {
  item: RewardRedemptionWithVoucher;
  language: string;
}) {
  const isVoucher =
    Boolean(
      String(
        item.voucherCode || ""
      ).trim()
    );

  const isShipped =
    Boolean(
      String(
        item.trackingNo || ""
      ).trim()
    );

  return (
    <Link
      href={`/member/points/redemptions/${encodeURIComponent(
        item.redemptionId
      )}`}
      className="group block overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)] sm:rounded-[30px]"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                isVoucher
                  ? "bg-emerald-50 text-emerald-700"
                  : isShipped
                    ? "bg-violet-50 text-violet-700"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {isVoucher ? (
                <Ticket className="h-5 w-5" />
              ) : isShipped ? (
                <Truck className="h-5 w-5" />
              ) : (
                <Gift className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="line-clamp-2 text-base font-black leading-6 text-slate-950 sm:text-lg">
                {item.rewardTitle ||
                  item.rewardId ||
                  getText(
                    language,
                    "Reward",
                    "奖励",
                    "Ganjaran"
                  )}
              </h2>

              <p className="mt-1 truncate text-[11px] font-bold text-slate-400 sm:text-xs">
                {item.redemptionId}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide sm:text-[10px] ${getStatusClasses(
              item.status
            )}`}
          >
            {getStatusLabel(
              item.status,
              language
            )}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniInfo
            icon={
              <Clock3 className="h-3.5 w-3.5" />
            }
            label={getText(
              language,
              "Redeemed",
              "兑换时间",
              "Ditebus"
            )}
            value={formatDateTime(
              item.redeemedAt,
              language
            )}
          />

          <MiniInfo
            icon={
              <PackageCheck className="h-3.5 w-3.5" />
            }
            label={getText(
              language,
              "Points",
              "使用积分",
              "Mata"
            )}
            value={`${Number(
              item.pointsUsed || 0
            ).toLocaleString(
              getDateLocale(
                language
              )
            )} pts`}
          />
        </div>

        {item.voucherCode && (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600">
                  {getText(
                    language,
                    "Voucher Code",
                    "Voucher Code",
                    "Kod Baucar"
                  )}
                </p>

                <p className="mt-1 break-all text-sm font-black text-slate-950">
                  {item.voucherCode}
                </p>
              </div>

              {item.voucherStatus ? (
                <span
                  className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${getVoucherStatusClasses(
                    item.voucherStatus
                  )}`}
                >
                  {getVoucherStatusLabel(
                    item.voucherStatus,
                    language
                  )}
                </span>
              ) : null}
            </div>

            {normalizeStatus(
              item.voucherStatus || ""
            ) === "USED" ? (
              <div className="mt-3 grid gap-2 border-t border-emerald-200/70 pt-3 sm:grid-cols-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                    {getText(
                      language,
                      "Used At",
                      "使用时间",
                      "Digunakan Pada"
                    )}
                  </p>

                  <p className="mt-1 text-xs font-black leading-5 text-slate-800">
                    {item.voucherUsedAt
                      ? formatDateTime(
                          item.voucherUsedAt,
                          language
                        )
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                    {getText(
                      language,
                      "Used At Merchant",
                      "使用商家",
                      "Digunakan Di"
                    )}
                  </p>

                  <p className="mt-1 break-words text-xs font-black leading-5 text-slate-800">
                    {item.voucherUsedMerchantName ||
                      item.voucherUsedMerchantId ||
                      "-"}
                  </p>
                </div>

                {item.voucherUsedTransactionId ? (
                  <div className="sm:col-span-2">
                    <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                      {getText(
                        language,
                        "Transaction ID",
                        "交易编号",
                        "ID Transaksi"
                      )}
                    </p>

                    <p className="mt-1 break-all text-xs font-black leading-5 text-slate-800">
                      {item.voucherUsedTransactionId}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : normalizeStatus(
                item.voucherStatus || ""
              ) === "REDEEMED" ? (
              <p className="mt-3 border-t border-emerald-200/70 pt-3 text-[11px] font-bold leading-5 text-emerald-700">
                {getText(
                  language,
                  "This voucher is available for use at eligible RewardHub merchants.",
                  "此 Voucher 目前可在符合条件的 RewardHub 商家使用。",
                  "Baucar ini boleh digunakan di peniaga RewardHub yang layak."
                )}
              </p>
            ) : null}
          </div>
        )}

        {item.trackingNo && (
          <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-violet-600">
              {getText(
                language,
                "Tracking Number",
                "物流单号",
                "Nombor Penjejakan"
              )}
            </p>

            <p className="mt-1 break-all text-sm font-black text-slate-950">
              {item.trackingNo}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-xs font-black text-slate-500">
            {getText(
              language,
              "View details",
              "查看详情",
              "Lihat butiran"
            )}
          </p>

          <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
        </div>
      </div>
    </Link>
  );
}

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}

        <p className="truncate text-[9px] font-black uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="mt-1.5 break-words text-xs font-black leading-5 text-slate-800">
        {value}
      </p>
    </div>
  );
}