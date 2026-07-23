import {
  CalendarDays,
  Globe2,
  Mail,
  Phone,
  Store,
} from "lucide-react";

import type {
  AdminMerchantDetail,
} from "@/lib/admin-merchant-detail";

type MerchantHeaderProps = {
  merchant: AdminMerchantDetail;
};

export default function MerchantHeader({
  merchant,
}: MerchantHeaderProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/50">
      <div className="relative h-40 overflow-hidden bg-slate-900 sm:h-52">
  {merchant.bannerUrl ? (
    <>
      {/* 封面图铺满整个区域 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={merchant.bannerUrl}
        alt={`${merchant.merchantName} banner`}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* 柔化图片，避免测试图片太突兀 */}
      <div className="absolute inset-0 bg-slate-950/25" />

      {/* 上下渐变，让封面和资料区自然连接 */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
    </>
  ) : (
    <div className="h-full w-full bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-slate-950" />
  )}
</div>

      <div className="px-5 pb-6 pt-2 sm:px-7 sm:pt-3">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
    <div className="-mt-6 shrink-0 sm:-mt-8">
      <MerchantLogo
        merchant={merchant}
      />
    </div>

    <div className="min-w-0 pb-1 pt-1 sm:pt-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="max-w-3xl truncate text-2xl font-semibold text-white sm:text-3xl">
                  {merchant.merchantName ||
                    merchant.legalName ||
                    merchant.merchantId}
                </h1>

                <MerchantStatusBadge
                  status={merchant.status}
                />
              </div>

              <p className="mt-2 text-sm font-medium text-slate-500">
                {merchant.merchantId}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-500">
                {merchant.email ? (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {merchant.email}
                  </span>
                ) : null}

                {merchant.phone ? (
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {merchant.phone}
                  </span>
                ) : null}

                {merchant.website ? (
                  <span className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4" />
                    {merchant.website}
                  </span>
                ) : null}

                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Joined{" "}
                  {formatDate(
                    merchant.joinedAt ||
                      merchant.createdAt
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-slate-950/35 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Category
            </p>

            <p className="mt-1 text-sm font-medium text-slate-300">
              {merchant.category ||
                "Uncategorized"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MerchantLogo({
  merchant,
}: {
  merchant: AdminMerchantDetail;
}) {
  if (merchant.logoUrl) {
    return (
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-4 border-slate-950 bg-white shadow-xl sm:h-28 sm:w-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={merchant.logoUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border-4 border-slate-950 bg-emerald-400 text-2xl font-bold text-slate-950 shadow-xl sm:h-28 sm:w-28">
      {getInitials(
        merchant.merchantName ||
          merchant.legalName ||
          merchant.merchantId
      )}
    </div>
  );
}

function MerchantStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    String(status || "INACTIVE")
      .trim()
      .toUpperCase();

  const classes =
    normalized === "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "PENDING"
      ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
      : normalized === "SUSPENDED"
      ? "border-red-400/20 bg-red-400/10 text-red-300"
      : normalized === "REJECTED"
      ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
      : "border-slate-400/20 bg-slate-400/10 text-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized}
    </span>
  );
}

function getInitials(
  value: string
) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "M";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}