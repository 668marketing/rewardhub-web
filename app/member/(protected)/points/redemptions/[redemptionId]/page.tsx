"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Loader2,
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLanguage } from "@/hooks/useLanguage";

import {
  getMemberRewardRedemptionDetail,
  type MemberRewardRedemptionDetail,
} from "@/lib/member-reward-redemptions";

type StoredMember = {
  memberId?: string;
  MEMBER_ID?: string;
  id?: string;
  profile?: StoredMember;
  member?: StoredMember;
  data?: StoredMember;
};

type CopyKey =
  | "voucher"
  | "tracking"
  | "redemption";

function getMemberIdFromStorage() {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  const storageKeys = [
    "member",
    "rewardhub_member",
    "member_session",
  ];

  for (
    const storageKey of storageKeys
  ) {
    try {
      const raw =
        window.localStorage.getItem(
          storageKey
        );

      if (!raw) {
        continue;
      }

      const parsed =
        JSON.parse(
          raw
        ) as StoredMember;

      const memberId =
        String(
          parsed.memberId ??
          parsed.MEMBER_ID ??
          parsed.id ??
          parsed.profile
            ?.memberId ??
          parsed.profile
            ?.MEMBER_ID ??
          parsed.member
            ?.memberId ??
          parsed.member
            ?.MEMBER_ID ??
          parsed.data
            ?.memberId ??
          parsed.data
            ?.MEMBER_ID ??
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

function normalizeStatus(
  value: string
) {
  return String(
    value || ""
  )
    .trim()
    .toUpperCase();
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

function getDateLocale(
  language: string
) {
  if (language === "zh") return "zh-CN";
  if (language === "ms") return "ms-MY";
  return "en-MY";
}

function formatDateTime(
  value: string,
  language: string
) {
  const date =
    parseDateValue(
      value
    );

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

function extractDriveFileId(
  value: string
) {
  const source =
    String(
      value || ""
    ).trim();

  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/i,
    /\/file\/d\/([a-zA-Z0-9_-]+)/i,
    /\/d\/([a-zA-Z0-9_-]+)/i,
    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      source.match(pattern);

    if (
      match &&
      match[1]
    ) {
      return match[1];
    }
  }

  return "";
}

function getImageSrc(
  value: string
) {
  const source =
    String(
      value || ""
    ).trim();

  if (!source) {
    return "";
  }

  if (
    source.startsWith(
      "/api/drive-image"
    )
  ) {
    return source;
  }

  const fileId =
    extractDriveFileId(
      source
    );

  if (fileId) {
    return (
      "/api/drive-image?id=" +
      encodeURIComponent(
        fileId
      )
    );
  }

  return source;
}

function getTrackingUrl(
  courier: string,
  trackingNo: string
) {
  const normalizedCourier =
    String(
      courier || ""
    )
      .trim()
      .toUpperCase();

  const tracking =
    encodeURIComponent(
      trackingNo
    );

  if (
    normalizedCourier.includes(
      "J&T"
    )
  ) {
    return (
      "https://www.jtexpress.my/tracking/" +
      tracking
    );
  }

  if (
    normalizedCourier.includes(
      "POS LAJU"
    )
  ) {
    return (
      "https://tracking.pos.com.my/tracking/" +
      tracking
    );
  }

  if (
    normalizedCourier.includes(
      "NINJA"
    )
  ) {
    return (
      "https://www.ninjavan.co/en-my/tracking?id=" +
      tracking
    );
  }

  if (
    normalizedCourier.includes(
      "DHL"
    )
  ) {
    return (
      "https://www.dhl.com/my-en/home/tracking.html?tracking-id=" +
      tracking
    );
  }

  if (
    normalizedCourier.includes(
      "CITY-LINK"
    ) ||
    normalizedCourier.includes(
      "CITY LINK"
    )
  ) {
    return (
      "https://www.citylinkexpress.com/MY/Tracking.aspx?No=" +
      tracking
    );
  }

  if (
    normalizedCourier.includes(
      "GDEX"
    )
  ) {
    return (
      "https://gdexpress.com/tracking?consignmentno=" +
      tracking
    );
  }

  return (
    "https://www.google.com/search?q=" +
    encodeURIComponent(
      (
        courier ||
        "parcel"
      ) +
      " tracking " +
      trackingNo
    )
  );
}

export default function MemberRewardRedemptionDetailPage() {
  const router =
    useRouter();

  const { t, language } =
    useLanguage();

  const params =
    useParams<{
      redemptionId:
        string;
    }>();

  const redemptionId =
    decodeURIComponent(
      String(
        params
          ?.redemptionId ||
        ""
      )
    );

  const [item, setItem] =
    useState<MemberRewardRedemptionDetail | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState<CopyKey | "">(
      ""
    );

  const loadDetail =
    useCallback(
      async (
        showRefreshLoader =
          false
      ) => {
        const memberId =
          getMemberIdFromStorage();

        if (!memberId) {
          setError(
            t("memberRewardRedemptionDetail.sessionUnavailable")
          );
          setLoading(false);
          return;
        }

        if (!redemptionId) {
          setError(
            t("memberRewardRedemptionDetail.redemptionIdMissing")
          );
          setLoading(false);
          return;
        }

        try {
          if (
            showRefreshLoader
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError("");

          const result =
            await getMemberRewardRedemptionDetail({
              memberId,
              redemptionId,
            });

          setItem(
            result
          );
        } catch (
          loadError
        ) {
          setItem(null);

          setError(
            loadError instanceof Error
              ? loadError.message
              : t("memberRewardRedemptionDetail.unableToLoad")
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      [redemptionId, t]
    );

  useEffect(
    function () {
      void loadDetail();
    },
    [loadDetail]
  );

  const status =
    normalizeStatus(
      item?.status || ""
    );

  const imageSrc =
    useMemo(
      function () {
        return getImageSrc(
          item
            ?.thumbnailUrl ||
          item
            ?.imageUrl ||
          ""
        );
      },
      [
        item
          ?.thumbnailUrl,
        item
          ?.imageUrl,
      ]
    );

  const trackingUrl =
    useMemo(
      function () {
        if (
          !item
            ?.trackingNo
        ) {
          return "";
        }

        return getTrackingUrl(
          item.courier,
          item.trackingNo
        );
      },
      [
        item?.courier,
        item
          ?.trackingNo,
      ]
    );

  async function copyValue(
    key: CopyKey,
    value: string
  ) {
    if (!value) {
      return;
    }

    try {
      await navigator
        .clipboard
        .writeText(
          value
        );

      setCopied(
        key
      );

      window.setTimeout(
        function () {
          setCopied("");
        },
        1600
      );
    } catch {
      setError(
        t("memberRewardRedemptionDetail.unableToCopy")
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-950" />

          <p className="mt-4 text-sm font-bold text-slate-500">
            {t("memberRewardRedemptionDetail.loadingDetails")}
          </p>
        </div>
      </main>
    );
  }

  if (
    error &&
    !item
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-5">
        <div className="w-full max-w-lg rounded-[32px] border border-red-200 bg-white p-7 text-center shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <AlertTriangle className="mx-auto h-9 w-9 text-red-500" />

          <h1 className="mt-4 text-xl font-black text-slate-950">
            {t("memberRewardRedemptionDetail.unableToLoad")}
          </h1>

          <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
            {error}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/member/points"
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800"
            >
              {t("memberRewardRedemptionDetail.backToPoints")}
            </button>

            <button
              type="button"
              onClick={() =>
                void loadDetail()
              }
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              {t("memberRewardRedemptionDetail.tryAgain")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-3 pb-28 pt-3 sm:px-6 sm:pb-32 sm:pt-5 lg:px-8 lg:pb-14 lg:pt-9">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:min-h-12 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("memberRewardRedemptionDetail.back")}
          </button>

          <button
            type="button"
            disabled={
              refreshing
            }
            onClick={() =>
              void loadDetail(
                true
              )
            }
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 sm:min-h-12 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
            {t("memberRewardRedemptionDetail.refresh")}
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            {error}
          </div>
        )}

        <section className="mt-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.08)] sm:mt-5 sm:rounded-[34px] sm:shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-[#10214a] px-4 py-5 text-white sm:px-8 sm:py-10">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative flex items-start gap-3 sm:gap-4">
              <RewardImage
                src={
                  imageSrc
                }
                title={
                  item.rewardTitle
                }
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <StatusBadge
                    status={
                      item.status
                    }
                  />

                  <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white sm:px-3 sm:text-[11px]">
                    {item.deliveryMethod ||
                      t("memberRewardRedemptionDetail.reward")}
                  </span>
                </div>

                <h1 className="mt-3 break-words text-xl font-black leading-tight tracking-tight sm:mt-4 sm:text-4xl">
                  {item.rewardTitle}
                </h1>

                <button
                  type="button"
                  onClick={() =>
                    void copyValue(
                      "redemption",
                      item.redemptionId
                    )
                  }
                  className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-left text-[10px] font-bold text-slate-200 transition hover:bg-white/15 sm:mt-3 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs"
                >
                  <span className="truncate">
                    {item.redemptionId}
                  </span>

                  {copied ===
                  "redemption" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  ) : (
                    <Clipboard className="h-4 w-4 shrink-0" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:gap-6 sm:p-8">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <InfoCard
                label={t("memberRewardRedemptionDetail.pointsUsed")}
                value={`${Number(
                  item.pointsUsed
                ).toLocaleString(
                  getDateLocale(language)
                )} ${t("memberRewardRedemptionDetail.pts")}`}
              />

              <InfoCard
                label={t("memberRewardRedemptionDetail.delivery")}
                value={
                  item.deliveryMethod ||
                  "-"
                }
              />

              <InfoCard
                label={t("memberRewardRedemptionDetail.quantity")}
                value={String(
                  item.quantity ||
                  1
                )}
              />
            </div>

            {item.voucherCode && (
              <CopyBox
                label={t("memberRewardRedemptionDetail.voucherCode")}
                value={
                  item.voucherCode
                }
                copied={
                  copied ===
                  "voucher"
                }
                onCopy={() =>
                  void copyValue(
                    "voucher",
                    item.voucherCode
                  )
                }
              />
            )}

            <section className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 sm:rounded-[28px] sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white sm:h-11 sm:w-11 sm:rounded-2xl">
                  <Truck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-black text-slate-950 sm:text-lg">
                    {t("memberRewardRedemptionDetail.fulfilment")}
                  </h2>

                  <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500 sm:mt-1 sm:text-xs">
                    {t("memberRewardRedemptionDetail.fulfilmentDescription")}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-4">
                <InfoCard
                  label={t("memberRewardRedemptionDetail.courier")}
                  value={
                    item.courier ||
                    "-"
                  }
                />

                <InfoCard
                  label={t("memberRewardRedemptionDetail.trackingNumber")}
                  value={
                    item.trackingNo ||
                    "-"
                  }
                />
              </div>

              {item.trackingNo ? (
                <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void copyValue(
                        "tracking",
                        item.trackingNo
                      )
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:py-3.5 sm:text-sm"
                  >
                    {copied ===
                    "tracking" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}

                    {copied ===
                    "tracking"
                      ? t("memberRewardRedemptionDetail.copied")
                      : t("memberRewardRedemptionDetail.copyTrackingNumber")}
                  </button>

                  <a
                    href={
                      trackingUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-3 text-xs font-black text-white shadow-sm transition hover:bg-slate-800 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:py-3.5 sm:text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("memberRewardRedemptionDetail.trackParcel")}
                  </a>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-xs font-bold leading-5 text-slate-500 sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm">
                  {t("memberRewardRedemptionDetail.trackingPending")}
                </div>
              )}
            </section>

            {item.address && (
              <section className="rounded-[22px] border border-slate-200 bg-white p-4 sm:rounded-[28px] sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 sm:h-11 sm:w-11 sm:rounded-2xl">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <h2 className="text-base font-black text-slate-950 sm:text-lg">
                    {t("memberRewardRedemptionDetail.deliveryInformation")}
                  </h2>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-4">
                  <InfoCard
                    label={t("memberRewardRedemptionDetail.recipient")}
                    value={
                      item.recipientName ||
                      "-"
                    }
                  />

                  <InfoCard
                    label={t("memberRewardRedemptionDetail.phone")}
                    value={
                      item.phone ||
                      "-"
                    }
                  />
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:mt-4 sm:rounded-2xl sm:p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">
                    {t("memberRewardRedemptionDetail.address")}
                  </p>

                  <p className="mt-1.5 whitespace-pre-wrap break-words text-xs font-bold leading-5 text-slate-700 sm:mt-2 sm:text-sm sm:leading-6">
                    {item.address}
                  </p>
                </div>
              </section>
            )}

            <section className="rounded-[22px] border border-slate-200 bg-white p-4 sm:rounded-[28px] sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-11 sm:w-11 sm:rounded-2xl">
                  <PackageCheck className="h-5 w-5" />
                </div>

                <h2 className="text-base font-black text-slate-950 sm:text-lg">
                  {t("memberRewardRedemptionDetail.statusTimeline")}
                </h2>
              </div>

              <div className="mt-5 sm:mt-6">
                <Timeline
                  title={t("memberRewardRedemptionDetail.redeemed")}
                  description={t("memberRewardRedemptionDetail.redeemedDescription")}
                  date={
                    item.redeemedAt
                  }
                  active
                  completed
                  language={language}
                />

                <Timeline
                  title={t("memberRewardRedemptionDetail.processing")}
                  description={t("memberRewardRedemptionDetail.processingDescription")}
                  date={
                    item.processedAt
                  }
                  active={
                    Boolean(
                      item.processedAt
                    )
                  }
                  completed={
                    Boolean(
                      item.processedAt
                    )
                  }
                  language={language}
                />

                <Timeline
                  title={t("memberRewardRedemptionDetail.shipped")}
                  description={
                    item.trackingNo
                      ? `${item.courier || t("memberRewardRedemptionDetail.courier")} · ${item.trackingNo}`
                      : t("memberRewardRedemptionDetail.shippedDescription")
                  }
                  date={
                    item.shippedAt
                  }
                  active={Boolean(
                    item.shippedAt
                  )}
                  completed={Boolean(
                    item.shippedAt
                  )}
                  language={language}
                />

                <Timeline
                  title={t("memberRewardRedemptionDetail.completed")}
                  description={t("memberRewardRedemptionDetail.completedDescription")}
                  date={
                    item.completedAt
                  }
                  active={
                    status ===
                    "COMPLETED"
                  }
                  completed={
                    status ===
                    "COMPLETED"
                  }
                  language={language}
                  last
                />
              </div>
            </section>

            {item.cancelReason && (
              <div className="rounded-[22px] border border-red-200 bg-red-50 p-4 sm:rounded-[28px] sm:p-5">
                <p className="text-xs font-black uppercase tracking-wide text-red-500">
                  {t("memberRewardRedemptionDetail.cancellationReason")}
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-red-700">
                  {item.cancelReason}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function RewardImage({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const [
    failed,
    setFailed,
  ] =
    useState(false);

  useEffect(
    function () {
      setFailed(false);
    },
    [src]
  );

  if (
    !src ||
    failed
  ) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-3xl sm:h-24 sm:w-24 sm:rounded-3xl sm:text-4xl">
        🎁
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 bg-white/5 object-cover sm:h-24 sm:w-24 sm:rounded-3xl"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() =>
        setFailed(true)
      }
    />
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
      <p className="text-[9px] font-black uppercase leading-4 tracking-wide text-slate-400 sm:text-xs">
        {label}
      </p>

      <p className="mt-1 break-all text-xs font-black leading-5 text-slate-950 sm:mt-2 sm:break-words sm:text-sm sm:leading-6">
        {value}
      </p>
    </div>
  );
}

function CopyBox({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const { t } =
    useLanguage();
  return (
    <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 sm:rounded-[28px] sm:p-6">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
        {label}
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 break-all text-base font-black text-slate-950 sm:text-lg">
          {value}
        </p>

        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-black text-white sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {t("memberRewardRedemptionDetail.copied")}
            </>
          ) : (
            <>
              <Clipboard className="h-4 w-4" />
              {t("memberRewardRedemptionDetail.copy")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const { t } =
    useLanguage();
  const normalized =
    normalizeStatus(
      status
    );

  let classes =
    "border-white/15 bg-white/10 text-white";

  if (
    normalized ===
    "PROCESSING"
  ) {
    classes =
      "border-blue-300/20 bg-blue-400/15 text-blue-100";
  } else if (
    normalized ===
    "SHIPPED"
  ) {
    classes =
      "border-violet-300/20 bg-violet-400/15 text-violet-100";
  } else if (
    normalized ===
    "COMPLETED"
  ) {
    classes =
      "border-emerald-300/20 bg-emerald-400/15 text-emerald-100";
  } else if (
    normalized ===
    "CANCELLED"
  ) {
    classes =
      "border-red-300/20 bg-red-400/15 text-red-100";
  } else if (
    normalized ===
    "PENDING"
  ) {
    classes =
      "border-amber-300/20 bg-amber-400/15 text-amber-100";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide sm:px-3 sm:text-[11px] ${classes}`}
    >
      {status
        ? t(
            `memberRewardRedemptionDetail.status.${normalizeStatus(
              status
            ).toLowerCase()}`
          )
        : t("memberRewardRedemptionDetail.status.pending")}
    </span>
  );
}

function Timeline({
  title,
  description,
  date,
  active,
  completed,
  language,
  last = false,
}: {
  title: string;
  description: string;
  date: string;
  active: boolean;
  completed: boolean;
  language: string;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3 pb-6 sm:gap-4 sm:pb-7">
      {!last && (
        <div
          className={`absolute left-[9px] top-5 h-[calc(100%-6px)] w-0.5 sm:left-[11px] sm:top-6 sm:h-[calc(100%-8px)] ${
            completed
              ? "bg-emerald-300"
              : "bg-slate-200"
          }`}
        />
      )}

      <div
        className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 sm:h-6 sm:w-6 ${
          completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : active
              ? "border-blue-500 bg-blue-50 text-blue-600"
              : "border-slate-300 bg-white text-slate-300"
        }`}
      >
        {completed && (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
      </div>

      <div className="-mt-0.5 min-w-0 flex-1">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-2">
          <p
            className={`text-[13px] font-black sm:text-sm ${
              active
                ? "text-slate-950"
                : "text-slate-400"
            }`}
          >
            {title}
          </p>

          <p className="text-[10px] font-bold text-slate-400 sm:text-xs">
            {formatDateTime(
              date,
              language
            )}
          </p>
        </div>

        <p
          className={`mt-1 text-[11px] font-semibold leading-4 sm:text-xs sm:leading-5 ${
            active
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}