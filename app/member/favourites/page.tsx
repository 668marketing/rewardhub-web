"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemberLayout from "@/components/layout/MemberLayout";
import {
  getMemberFavouriteMerchants,
  toggleFavouriteMerchant,
} from "@/lib/api";

export default function FavouriteMerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");

  useEffect(() => {
    loadFavourites();
  }, []);

  async function loadFavourites() {
    try {
      setLoading(true);

      const storedMember = JSON.parse(
        localStorage.getItem("member") || "{}"
      );

      const id =
        storedMember?.memberId ||
        storedMember?.MEMBER_ID ||
        "";

      if (!id) {
        setMerchants([]);
        return;
      }

      setMemberId(id);

      const res = await getMemberFavouriteMerchants({
        memberId: id,
      });

      const data =
        res?.data?.data ||
        res?.data ||
        res?.result ||
        res;

      setMerchants(
        Array.isArray(data?.merchants)
          ? data.merchants
          : []
      );
    } catch (error) {
      console.error("Failed to load favourites:", error);
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeFavourite(targetMerchantId: string) {
    if (!memberId || !targetMerchantId) return;

    try {
      setRemovingId(targetMerchantId);

      await toggleFavouriteMerchant({
        memberId,
        merchantId: targetMerchantId,
      });

      setMerchants((current) =>
        current.filter((merchant) => {
          const id =
            merchant?.merchantId ||
            merchant?.MERCHANT_ID ||
            "";

          return id !== targetMerchantId;
        })
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Failed to remove favourite merchant"
      );
    } finally {
      setRemovingId("");
    }
  }

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-7xl">
          <Link
            href="/member/dashboard"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm transition hover:bg-slate-50 sm:px-5 sm:py-3 sm:text-sm"
          >
            ← Back to Dashboard
          </Link>

          <section className="relative mt-5 overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:mt-6 sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />

            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
                Favourite Merchants
              </p>

              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                My Favourite Stores
              </h1>

              <p className="mt-2 max-w-2xl text-[11px] font-bold leading-5 text-slate-400 sm:mt-3 sm:text-sm sm:leading-6">
                Quickly access merchants you saved and enjoy RewardHub member
                benefits faster.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
                <HeroStat
                  title="Saved Merchants"
                  value={merchants.length}
                />
                <HeroStat title="Quick Access" value="Ready" />
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl md:text-3xl">
                  Favourite List
                </h2>
                <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">
                  Manage your saved merchants here.
                </p>
              </div>

              <Link
                href="/member/marketplace"
                className="shrink-0 rounded-xl bg-slate-950 px-3 py-2.5 text-[10px] font-black text-white no-underline transition hover:bg-slate-800 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
              >
                Browse Marketplace
              </Link>
            </div>

            {loading ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <LoadingCard key={item} />
                ))}
              </div>
            ) : merchants.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {merchants.map((merchant) => {
                  const id =
                    merchant?.merchantId ||
                    merchant?.MERCHANT_ID ||
                    "";

                  return (
                    <FavouriteCard
                      key={id}
                      merchant={merchant}
                      removing={removingId === id}
                      onRemove={() => removeFavourite(id)}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        </section>
      </main>
    </MemberLayout>
  );
}

function HeroStat({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.25rem] bg-white/10 p-4 sm:rounded-[2rem] sm:p-6">
      <p className="text-[10px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>
      <p className="mt-2 text-2xl font-black text-white sm:text-4xl">
        {value}
      </p>
    </div>
  );
}

function FavouriteCard({
  merchant,
  removing,
  onRemove,
}: {
  merchant: any;
  removing: boolean;
  onRemove: () => void;
}) {
  const merchantId =
    merchant?.merchantId ||
    merchant?.MERCHANT_ID ||
    "";

  const name =
    merchant?.displayName ||
    merchant?.DISPLAY_NAME ||
    merchant?.businessName ||
    merchant?.BUSINESS_NAME ||
    "Merchant";

  const category =
    merchant?.category ||
    merchant?.CATEGORY ||
    "Merchant";

  const area = merchant?.area || merchant?.AREA || "";
  const state = merchant?.state || merchant?.STATE || "";
  const location =
    [area, state].filter(Boolean).join(", ") || "Malaysia";

  const rating = Number(
    merchant?.rating ??
      merchant?.averageRating ??
      merchant?.AVERAGE_RATING ??
      0
  );

  const marketingBudget = Number(
    merchant?.marketingBudget ??
      merchant?.MARKETING_BUDGET ??
      0
  );

  const bannerUrl =
    merchant?.bannerUrl ||
    merchant?.BANNER_URL ||
    "";

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[2rem]">
      <Link
        href={`/member/merchant/${merchantId}`}
        className="block no-underline"
      >
        <div className="relative h-32 overflow-hidden bg-slate-950 sm:h-100">
          {bannerUrl ? (
            <img
              src={getDisplayImageUrl(bannerUrl)}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900" />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <MerchantLogo merchant={merchant} />

            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 text-sm sm:text-xl font-black text-slate-950 sm:text-xl">
                {name}
              </h3>
              <p className="mt-1 line-clamp-1 text-[9px] sm:text-sm font-bold text-slate-500 sm:text-sm">
                {category}
              </p>
              <p className="mt-1 line-clamp-1 text-[9px] font-bold text-slate-400 sm:text-xs">
                {location}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
            <InfoBox
              title="Rating"
              value={
                rating > 0
                  ? `★ ${rating.toFixed(1)}`
                  : "No rating"
              }
            />
            <InfoBox
              title="Budget"
              value={`${marketingBudget}%`}
              green
            />
          </div>

          <p className="mt-4 text-[10px] font-black text-slate-950 sm:mt-5 sm:text-sm">
            View Store →
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        className="mx-4 mb-4 w-[calc(100%-2rem)] rounded-xl bg-red-50 px-4 py-2.5 sm:py-4 text-[10px] font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:mx-5 sm:mb-5 sm:w-[calc(100%-2.5rem)] sm:rounded-2xl sm:py-4 sm:text-sm"
      >
        {removing ? "Removing..." : "Remove Favourite"}
      </button>
    </article>
  );
}

function MerchantLogo({ merchant }: { merchant: any }) {
  const name =
    merchant?.displayName ||
    merchant?.DISPLAY_NAME ||
    merchant?.businessName ||
    merchant?.BUSINESS_NAME ||
    "Merchant";

  const logoUrl =
    merchant?.logoUrl ||
    merchant?.LOGO_URL ||
    "";

  return (
    <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-950 shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl sm:text-lg">
      {logoUrl ? (
        <img
          src={getDisplayImageUrl(logoUrl)}
          alt={name}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

function InfoBox({
  title,
  value,
  green = false,
}: {
  title: string;
  value: any;
  green?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-white p-2.5 sm:p-4 sm:rounded-2xl sm:p-4">
      <p className="text-[9px] font-black text-slate-400 sm:text-[11px] sm:text-lg">
        {title}
      </p>
      <p
        className={`mt-1 truncate text-xs font-black sm:text-lg ${
          green ? "text-emerald-700" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-6 text-center sm:mt-6 sm:rounded-[2rem] sm:p-10">
      <p className="text-3xl sm:text-4xl">❤️</p>
      <h3 className="mt-3 text-xl font-black text-slate-950 sm:mt-4 sm:text-2xl">
        No favourite merchants yet
      </h3>
      <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500 sm:text-sm">
        Save merchants from Marketplace and they will appear here.
      </p>
      <Link
        href="/member/marketplace"
        className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-xs font-black text-white no-underline sm:mt-6 sm:rounded-2xl sm:px-6 sm:py-4 sm:text-sm"
      >
        Discover Merchants
      </Link>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50 shadow-sm sm:rounded-[2rem]">
      <div className="h-32 animate-pulse bg-slate-200 sm:h-40" />
      <div className="p-4 sm:p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function getDriveFileId(url: string) {
  if (!url) return "";

  const idFromQuery = url.match(/[?&]id=([^&]+)/);
  if (idFromQuery?.[1]) return idFromQuery[1];

  const idFromPath = url.match(/\/d\/([^/]+)/);
  if (idFromPath?.[1]) return idFromPath[1];

  return "";
}

function getDisplayImageUrl(url: string) {
  if (!url) return "";

  if (!url.includes("drive.google.com")) {
    return url;
  }

  if (
    url.includes("drive.google.com/thumbnail") ||
    url.includes("drive.google.com/uc")
  ) {
    return url;
  }

  const fileId = getDriveFileId(url);
  if (!fileId) return url;

  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
    fileId
  )}&sz=w1600`;
}