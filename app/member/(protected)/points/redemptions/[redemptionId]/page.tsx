"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Gift,
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

function formatDateTime(
  value: string
) {
  const date =
    parseDateValue(
      value
    );

  if (!date) {
    return value || "-";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
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
            "Member session is unavailable. Please sign in again."
          );
          setLoading(false);
          return;
        }

        if (!redemptionId) {
          setError(
            "Redemption ID is missing."
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
              : "Unable to load redemption."
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      [redemptionId]
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
        "Unable to copy. Please press and hold the value to copy manually."
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-950" />

          <p className="mt-4 text-sm font-bold text-slate-500">
            Loading redemption details...
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
            Unable to load redemption
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
              Back to Points
            </button>

            <button
              type="button"
              onClick={() =>
                void loadDetail()
              }
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Try Again
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
    <main className="min-h-screen bg-[#f6f7fb] px-4 pb-32 pt-5 sm:px-6 lg:px-8 lg:pb-14 lg:pt-9">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
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
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <section className="mt-5 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-[#10214a] px-5 py-7 text-white sm:px-8 sm:py-10">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative flex items-start gap-4">
              <RewardImage
                src={
                  imageSrc
                }
                title={
                  item.rewardTitle
                }
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    status={
                      item.status
                    }
                  />

                  <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                    {item.deliveryMethod ||
                      "Reward"}
                  </span>
                </div>

                <h1 className="mt-4 break-words text-2xl font-black tracking-tight sm:text-4xl">
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
                  className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-left text-xs font-bold text-slate-200 transition hover:bg-white/15"
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

          <div className="grid gap-6 p-5 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard
                label="Points Used"
                value={`${Number(
                  item.pointsUsed
                ).toLocaleString(
                  "en-MY"
                )} pts`}
              />

              <InfoCard
                label="Delivery"
                value={
                  item.deliveryMethod ||
                  "-"
                }
              />

              <InfoCard
                label="Quantity"
                value={String(
                  item.quantity ||
                  1
                )}
              />
            </div>

            {item.voucherCode && (
              <CopyBox
                label="Voucher Code"
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

            <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Truck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Fulfilment
                  </h2>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Courier and parcel tracking information
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  label="Courier"
                  value={
                    item.courier ||
                    "-"
                  }
                />

                <InfoCard
                  label="Tracking Number"
                  value={
                    item.trackingNo ||
                    "-"
                  }
                />
              </div>

              {item.trackingNo ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      void copyValue(
                        "tracking",
                        item.trackingNo
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {copied ===
                    "tracking" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}

                    {copied ===
                    "tracking"
                      ? "Copied"
                      : "Copy Tracking Number"}
                  </button>

                  <a
                    href={
                      trackingUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Track Parcel
                  </a>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-bold text-slate-500">
                  Tracking information will appear here after the reward is shipped.
                </div>
              )}
            </section>

            {item.address && (
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <h2 className="text-lg font-black text-slate-950">
                    Delivery Information
                  </h2>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <InfoCard
                    label="Recipient"
                    value={
                      item.recipientName ||
                      "-"
                    }
                  />

                  <InfoCard
                    label="Phone"
                    value={
                      item.phone ||
                      "-"
                    }
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Address
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-700">
                    {item.address}
                  </p>
                </div>
              </section>
            )}

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <PackageCheck className="h-5 w-5" />
                </div>

                <h2 className="text-lg font-black text-slate-950">
                  Status Timeline
                </h2>
              </div>

              <div className="mt-6">
                <Timeline
                  title="Redeemed"
                  description="Your points were deducted and the redemption order was created."
                  date={
                    item.redeemedAt
                  }
                  active
                  completed
                />

                <Timeline
                  title="Processing"
                  description="RewardHub is preparing your reward."
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
                />

                <Timeline
  title="Shipped"
  description={
    item.trackingNo
      ? `${item.courier || "Courier"} · ${item.trackingNo}`
      : "Courier and tracking information will appear after shipment."
  }
  date={item.shippedAt}
  active={Boolean(item.shippedAt)}
  completed={Boolean(item.shippedAt)}
/>

                <Timeline
                  title="Completed"
                  description="The reward order has been completed."
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
                  last
                />
              </div>
            </section>

            {item.cancelReason && (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-red-500">
                  Cancellation Reason
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
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-4xl sm:h-24 sm:w-24">
        🎁
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      className="h-20 w-20 shrink-0 rounded-3xl border border-white/10 bg-white/5 object-cover sm:h-24 sm:w-24"
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black leading-6 text-slate-950">
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
  return (
    <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
        {label}
      </p>

      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="break-all text-lg font-black text-slate-950">
          {value}
        </p>

        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Clipboard className="h-4 w-4" />
              Copy
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
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${classes}`}
    >
      {status || "Pending"}
    </span>
  );
}

function Timeline({
  title,
  description,
  date,
  active,
  completed,
  last = false,
}: {
  title: string;
  description: string;
  date: string;
  active: boolean;
  completed: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-7">
      {!last && (
        <div
          className={`absolute left-[11px] top-6 h-[calc(100%-8px)] w-0.5 ${
            completed
              ? "bg-emerald-300"
              : "bg-slate-200"
          }`}
        />
      )}

      <div
        className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
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
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p
            className={`text-sm font-black ${
              active
                ? "text-slate-950"
                : "text-slate-400"
            }`}
          >
            {title}
          </p>

          <p className="text-xs font-bold text-slate-400">
            {formatDateTime(
              date
            )}
          </p>
        </div>

        <p
          className={`mt-1 text-xs font-semibold leading-5 ${
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