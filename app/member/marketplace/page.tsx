"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MemberLayout from "@/components/layout/MemberLayout";
import {
  fetchMarketplaceMerchants,
  checkFavouriteMerchant,
  toggleFavouriteMerchant,
} from "@/lib/api";

const mainCategories = [
  "All",
  "Food & Beverage",
  "Cafe",
  "Retail",
  "Fashion",
  "Beauty",
  "Health & Wellness",
  "Fitness",
  "Hotel & Travel",
  "Education",
  "Home & Living",
  "Automotive",
  "Pets",
  "Electronics",
  "Online Store",
  "Professional Services",
  "Entertainment",
  "Wholesale",
  "Other",
];

const visibleCategories = [
  "All",
  "Food & Beverage",
  "Cafe",
  "Beauty",
  "Health & Wellness",
  "Fashion",
  "Retail",
  "Hotel & Travel",
  "Online Store",
];

const areaOptions: Record<string, string[]> = {
  Johor: [
    "Johor Bahru",
    "Muar",
    "Batu Pahat",
    "Kluang",
    "Kulai",
    "Pontian",
    "Segamat",
    "Tangkak",
    "Kota Tinggi",
    "Mersing",
  ],
  Kedah: ["Alor Setar", "Sungai Petani", "Kulim", "Langkawi", "Jitra", "Baling"],
  Kelantan: [
    "Kota Bharu",
    "Pasir Mas",
    "Tanah Merah",
    "Machang",
    "Tumpat",
    "Gua Musang",
  ],
  Melaka: ["Melaka City", "Ayer Keroh", "Alor Gajah", "Jasin", "Masjid Tanah"],
  "Negeri Sembilan": ["Seremban", "Nilai", "Port Dickson", "Bahau", "Kuala Pilah"],
  Pahang: [
    "Kuantan",
    "Temerloh",
    "Bentong",
    "Cameron Highlands",
    "Genting Highlands",
    "Raub",
  ],
  Penang: [
    "George Town",
    "Bayan Lepas",
    "Butterworth",
    "Bukit Mertajam",
    "Perai",
    "Balik Pulau",
  ],
  Perak: ["Ipoh", "Taiping", "Sitiawan", "Teluk Intan", "Kampar", "Batu Gajah"],
  Perlis: ["Kangar", "Arau", "Padang Besar", "Kuala Perlis"],
  Sabah: ["Kota Kinabalu", "Sandakan", "Tawau", "Lahad Datu", "Keningau", "Semporna"],
  Sarawak: ["Kuching", "Miri", "Sibu", "Bintulu", "Sri Aman", "Limbang"],
  Selangor: [
    "Shah Alam",
    "Petaling Jaya",
    "Subang Jaya",
    "Puchong",
    "Klang",
    "Kajang",
    "Ampang",
    "Cyberjaya",
    "Semenyih",
    "Rawang",
    "Cheras Selatan",
  ],
  Terengganu: ["Kuala Terengganu", "Kemaman", "Dungun", "Marang", "Besut"],
  "Kuala Lumpur": [
    "Cheras",
    "Bukit Bintang",
    "Setapak",
    "Kepong",
    "Bangsar",
    "Mont Kiara",
    "Sri Petaling",
    "Old Klang Road",
    "Wangsa Maju",
    "Titiwangsa",
  ],
  Putrajaya: ["Putrajaya"],
  Labuan: ["Labuan"],
};

export default function MemberMarketplacePage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedState, setSelectedState] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [favouriteMap, setFavouriteMap] = useState<Record<string, boolean>>({});
  const [savingFavId, setSavingFavId] = useState("");

  useEffect(() => {
    loadMarketplace();
  }, []);

  async function loadMarketplace() {
    try {
      setLoading(true);

      const res = await fetchMarketplaceMerchants();

      const result =
        res?.data?.data ||
        res?.data ||
        res?.result ||
        res;

      const list =
        result?.merchants ||
        result?.data?.merchants ||
        [];

      setMerchants(Array.isArray(list) ? list : []);

      const storedMember = JSON.parse(
        localStorage.getItem("member") || "{}"
      );

      const memberId =
        storedMember?.memberId ||
        storedMember?.MEMBER_ID ||
        "";

      if (!memberId || !Array.isArray(list)) {
        return;
      }

      const favEntries = await Promise.all(
        list.map(async (merchant: any) => {
          try {
            const merchantId =
              merchant?.merchantId ||
              merchant?.MERCHANT_ID ||
              "";

            if (!merchantId) {
              return ["", false] as [string, boolean];
            }

            const favRes = await checkFavouriteMerchant({
              memberId,
              merchantId,
            });

            const favData =
              favRes?.data?.data ||
              favRes?.data ||
              favRes?.result ||
              favRes;

            return [
              merchantId,
              Boolean(favData?.isFavourite),
            ] as [string, boolean];
          } catch {
            return ["", false] as [string, boolean];
          }
        })
      );

      setFavouriteMap(
        Object.fromEntries(
          favEntries.filter(([merchantId]) => merchantId)
        )
      );
    } catch (err) {
      console.error("Failed to load marketplace:", err);
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavourite(
    e: React.MouseEvent<HTMLButtonElement>,
    merchantId: string
  ) {
    e.preventDefault();
    e.stopPropagation();

    if (!merchantId || savingFavId) {
      return;
    }

    try {
      const storedMember = JSON.parse(
        localStorage.getItem("member") || "{}"
      );

      const memberId =
        storedMember?.memberId ||
        storedMember?.MEMBER_ID ||
        "";

      if (!memberId) {
        alert("Please login first");
        return;
      }

      setSavingFavId(merchantId);

      const res = await toggleFavouriteMerchant({
        memberId,
        merchantId,
      });

      const data =
        res?.data?.data ||
        res?.data ||
        res?.result ||
        res;

      setFavouriteMap((previous) => ({
        ...previous,
        [merchantId]: Boolean(data?.isFavourite),
      }));
    } catch (err: any) {
      alert(err?.message || "Failed to update favourite");
    } finally {
      setSavingFavId("");
    }
  }

  const filteredMerchants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return merchants.filter((merchant: any) => {
      const name = String(
        merchant?.displayName ||
          merchant?.businessName ||
          merchant?.storeName ||
          merchant?.DISPLAY_NAME ||
          merchant?.BUSINESS_NAME ||
          ""
      ).toLowerCase();

      const merchantCategory = String(
        merchant?.category ||
          merchant?.CATEGORY ||
          ""
      );

      const subCategory = String(
        merchant?.subCategory ||
          merchant?.SUB_CATEGORY ||
          ""
      ).toLowerCase();

      const merchantState = String(
        merchant?.state ||
          merchant?.STATE ||
          ""
      );

      const merchantArea = String(
        merchant?.area ||
          merchant?.AREA ||
          ""
      );

      const address = String(
        merchant?.address ||
          merchant?.location ||
          merchant?.ADDRESS ||
          ""
      ).toLowerCase();

      const matchSearch =
        !keyword ||
        name.includes(keyword) ||
        merchantCategory.toLowerCase().includes(keyword) ||
        subCategory.includes(keyword) ||
        merchantState.toLowerCase().includes(keyword) ||
        merchantArea.toLowerCase().includes(keyword) ||
        address.includes(keyword);

      const matchCategory =
        category === "All" ||
        merchantCategory.toLowerCase() === category.toLowerCase();

      const matchState =
        !selectedState ||
        merchantState.toLowerCase() === selectedState.toLowerCase();

      const matchArea =
        !selectedArea ||
        merchantArea.toLowerCase() === selectedArea.toLowerCase();

      return matchSearch && matchCategory && matchState && matchArea;
    });
  }, [merchants, search, category, selectedState, selectedArea]);

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setSelectedState("");
    setSelectedArea("");
  }

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-7xl">
          <Link
            href="/member/dashboard"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm sm:px-5 sm:py-3 sm:text-sm"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:mt-6 sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
              RewardHub Marketplace
            </p>

            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              Discover Member Merchants
            </h1>

            <p className="mt-3 max-w-2xl text-xs font-bold leading-5 text-slate-400 sm:text-sm sm:leading-6">
              Search merchants by category, state and area, then enjoy
              RewardHub member benefits.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 sm:mt-8 sm:gap-4">
              <MarketplaceStat
                title="Active Merchants"
                value={merchants.length}
              />
              <MarketplaceStat
                title="Categories"
                value={mainCategories.length - 1}
              />
              <MarketplaceStat
                title="Reward Credits"
                value="Accepted"
              />
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant, category, area or location"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-950 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
            />

            <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4">
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedArea("");
                }}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-700 outline-none focus:border-slate-950 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
              >
                <option value="">All States</option>
                {Object.keys(areaOptions).map((stateName) => (
                  <option key={stateName} value={stateName}>
                    {stateName}
                  </option>
                ))}
              </select>

              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                disabled={!selectedState}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-700 outline-none focus:border-slate-950 disabled:bg-slate-100 disabled:text-slate-400 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
              >
                <option value="">
                  {selectedState ? "All Areas" : "Select State First"}
                </option>

                {(areaOptions[selectedState] || []).map((areaName: string) => (
                  <option key={areaName} value={areaName}>
                    {areaName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:mt-5 sm:gap-3">
              {(showAllCategories ? mainCategories : visibleCategories).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-[10px] font-black shadow-sm transition sm:px-5 sm:py-3 sm:text-sm ${
                      category === item
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-950 hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  setShowAllCategories((current) => !current)
                }
                className="shrink-0 whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] font-black text-amber-800 shadow-sm hover:bg-amber-100 sm:px-5 sm:py-3 sm:text-sm"
              >
                {showAllCategories ? "Show Less" : "More Categories"}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 sm:mt-5">
              <p className="text-[10px] font-bold text-slate-500 sm:text-sm">
                Showing {filteredMerchants.length} merchants
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black text-slate-700 shadow-sm sm:px-5 sm:py-3 sm:text-sm"
              >
                View All
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7">
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
              All Merchants
            </h2>

            <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
              Browse all available RewardHub merchants.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 xl:grid-cols-3">
              {filteredMerchants.map((merchant: any) => {
                const merchantId =
                  merchant?.merchantId ||
                  merchant?.MERCHANT_ID ||
                  "";

                return (
                  <MerchantCard
                    key={merchantId}
                    merchant={merchant}
                    isFavourite={Boolean(favouriteMap[merchantId])}
                    saving={savingFavId === merchantId}
                    onToggleFavourite={handleToggleFavourite}
                  />
                );
              })}
            </div>

            {!loading && filteredMerchants.length === 0 && (
              <EmptyState text="No merchants found." />
            )}

            {loading && <EmptyState text="Loading marketplace..." />}
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

function MerchantCard({
  merchant,
  isFavourite,
  saving,
  onToggleFavourite,
}: {
  merchant: any;
  isFavourite: boolean;
  saving: boolean;
  onToggleFavourite: (
    e: React.MouseEvent<HTMLButtonElement>,
    merchantId: string
  ) => void;
}) {
  const name =
    merchant?.displayName ||
    merchant?.businessName ||
    merchant?.DISPLAY_NAME ||
    merchant?.BUSINESS_NAME ||
    "Merchant";

  const merchantId =
    merchant?.merchantId ||
    merchant?.MERCHANT_ID ||
    "";

  const rating = Number(
    merchant?.averageRating ||
      merchant?.rating ||
      0
  );

  const reviews = Number(
    merchant?.reviewCount ||
      merchant?.totalReviews ||
      0
  );

  const cashback = Number(
    merchant?.marketingBudget ||
      merchant?.MARKETING_BUDGET ||
      5
  );

  const acceptsCredits =
    merchant?.acceptRewardCredits !== false &&
    merchant?.rewardCreditEnabled !== false;

  const locationText =
    [
      merchant?.area || merchant?.AREA,
      merchant?.state || merchant?.STATE,
    ]
      .filter(Boolean)
      .join(", ") ||
    merchant?.address ||
    merchant?.location ||
    "Malaysia";

  return (
    <Link
      href={`/member/merchant/${merchantId}`}
      className="block min-w-0 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-3 no-underline transition hover:-translate-y-1 hover:bg-white hover:shadow-xl sm:rounded-[2rem] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <MerchantLogo merchant={merchant} />

        <button
          type="button"
          onClick={(e) => onToggleFavourite(e, merchantId)}
          disabled={saving}
          aria-label={
            isFavourite
              ? "Remove from favourites"
              : "Add to favourites"
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-md transition hover:scale-110 disabled:opacity-50 sm:h-11 sm:w-11 sm:text-xl"
        >
          {isFavourite ? "❤️" : "🤍"}
        </button>
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-black leading-5 text-slate-950 sm:mt-5 sm:min-h-0 sm:text-xl">
        {name}
      </h3>

      <p className="mt-1 truncate text-[10px] font-bold text-slate-500 sm:text-sm">
        {merchant?.category || merchant?.CATEGORY || "Merchant"}
      </p>

      <p className="mt-1 line-clamp-1 text-[9px] font-bold text-slate-400 sm:text-xs">
        📍 {locationText}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
        <InfoBox
          title="Cashback"
          value={`${cashback}%`}
          green
        />

        <InfoBox
          title="Rating"
          value={rating > 0 ? `★ ${rating.toFixed(1)}` : "New"}
          amber
        />
      </div>

      <p className="mt-2 text-[9px] font-bold text-slate-500 sm:mt-3 sm:text-xs">
        {reviews > 0
          ? `${reviews} Review${reviews === 1 ? "" : "s"}`
          : "No reviews yet"}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 sm:px-3 sm:text-xs">
          Rewards
        </span>

        {acceptsCredits && (
          <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700 sm:px-3 sm:text-xs">
            Credits
          </span>
        )}
      </div>

      <p className="mt-3 text-[10px] font-black text-slate-950 sm:mt-5 sm:text-sm">
        View Details →
      </p>
    </Link>
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
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-base font-black text-white sm:h-16 sm:w-16 sm:rounded-2xl sm:text-xl">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

function MarketplaceStat({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-white/10 p-3 text-white sm:rounded-[2rem] sm:p-6">
      <p className="truncate text-[9px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>

      <h3 className="mt-1 break-words text-sm font-black leading-tight sm:mt-3 sm:text-3xl">
        {value}
      </h3>
    </div>
  );
}

function InfoBox({
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
  const valueColor = green
    ? "text-emerald-700"
    : amber
      ? "text-amber-600"
      : "text-slate-950";

  return (
    <div className="min-w-0 rounded-xl bg-white p-2.5 sm:rounded-2xl sm:p-4">
      <p className="truncate text-[9px] font-black text-slate-400 sm:text-xs">
        {title}
      </p>

      <p className={`mt-1 text-sm font-black sm:text-lg ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:mt-6 sm:rounded-3xl sm:p-10 sm:text-sm">
      {text}
    </div>
  );
}