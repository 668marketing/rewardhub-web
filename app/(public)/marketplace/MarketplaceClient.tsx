"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useLanguage } from "@/hooks/useLanguage";
import SafeImage from "@/components/ui/SafeImage";

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
  Kedah: [
    "Alor Setar",
    "Sungai Petani",
    "Kulim",
    "Langkawi",
    "Jitra",
    "Baling",
  ],
  Kelantan: [
    "Kota Bharu",
    "Pasir Mas",
    "Tanah Merah",
    "Machang",
    "Tumpat",
    "Gua Musang",
  ],
  Melaka: [
    "Melaka City",
    "Ayer Keroh",
    "Alor Gajah",
    "Jasin",
    "Masjid Tanah",
  ],
  "Negeri Sembilan": [
    "Seremban",
    "Nilai",
    "Port Dickson",
    "Bahau",
    "Kuala Pilah",
  ],
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
  Perak: [
    "Ipoh",
    "Taiping",
    "Sitiawan",
    "Teluk Intan",
    "Kampar",
    "Batu Gajah",
  ],
  Perlis: ["Kangar", "Arau", "Padang Besar", "Kuala Perlis"],
  Sabah: [
    "Kota Kinabalu",
    "Sandakan",
    "Tawau",
    "Lahad Datu",
    "Keningau",
    "Semporna",
  ],
  Sarawak: [
    "Kuching",
    "Miri",
    "Sibu",
    "Bintulu",
    "Sri Aman",
    "Limbang",
  ],
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
  Terengganu: [
    "Kuala Terengganu",
    "Kemaman",
    "Dungun",
    "Marang",
    "Besut",
  ],
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

type MarketplaceClientProps = {
  merchants: any[];
  refCode: string;
};

export default function MarketplaceClient({
  merchants,
  refCode,
}: MarketplaceClientProps) {
  const {
    language,
  } = useLanguage();

  const pageText = {
    en: {
      searchPlaceholder: "Search merchant, category or location...",
      allStates: "All States",
      allAreas: "All Areas",
      selectStateFirst: "Select State First",
      showLess: "Show Less",
      moreCategories: "More Categories",
      featured: "Featured",
      popularMerchants: "Popular Merchants",
      showing: "Showing",
      merchants: "merchants",
      viewAll: "View All",
      merchant: "Merchant",
      cashback: "Cashback",
      available: "Available",
      campaign: "Campaign",
      active: "Active",
      comingSoon: "Coming Soon",
      viewMerchant: "View Merchant",
      unavailable: "Merchant Unavailable",
      noMerchants: "No merchants found.",
      malaysia: "Malaysia",
    },

    zh: {
      searchPlaceholder: "搜索商家、分类或地区...",
      allStates: "全部州属",
      allAreas: "全部地区",
      selectStateFirst: "请先选择州属",
      showLess: "收起分类",
      moreCategories: "更多分类",
      featured: "精选",
      popularMerchants: "热门商家",
      showing: "目前显示",
      merchants: "家商家",
      viewAll: "查看全部",
      merchant: "商家",
      cashback: "现金回扣",
      available: "可享有",
      campaign: "推广活动",
      active: "进行中",
      comingSoon: "即将推出",
      viewMerchant: "查看商家",
      unavailable: "商家暂不可用",
      noMerchants: "找不到符合条件的商家。",
      malaysia: "马来西亚",
    },

    ms: {
      searchPlaceholder: "Cari peniaga, kategori atau lokasi...",
      allStates: "Semua Negeri",
      allAreas: "Semua Kawasan",
      selectStateFirst: "Pilih Negeri Terlebih Dahulu",
      showLess: "Tunjuk Kurang",
      moreCategories: "Lebih Banyak Kategori",
      featured: "Pilihan",
      popularMerchants: "Peniaga Popular",
      showing: "Memaparkan",
      merchants: "peniaga",
      viewAll: "Lihat Semua",
      merchant: "Peniaga",
      cashback: "Pulangan Tunai",
      available: "Tersedia",
      campaign: "Kempen",
      active: "Aktif",
      comingSoon: "Akan Datang",
      viewMerchant: "Lihat Peniaga",
      unavailable: "Peniaga Tidak Tersedia",
      noMerchants: "Tiada peniaga ditemui.",
      malaysia: "Malaysia",
    },
  } as const;

  const categoryText: Record<
    string,
    Record<"en" | "zh" | "ms", string>
  > = {
    All: {
      en: "All",
      zh: "全部",
      ms: "Semua",
    },
    "Food & Beverage": {
      en: "Food & Beverage",
      zh: "餐饮",
      ms: "Makanan & Minuman",
    },
    Cafe: {
      en: "Cafe",
      zh: "咖啡馆",
      ms: "Kafe",
    },
    Retail: {
      en: "Retail",
      zh: "零售",
      ms: "Runcit",
    },
    Fashion: {
      en: "Fashion",
      zh: "时尚",
      ms: "Fesyen",
    },
    Beauty: {
      en: "Beauty",
      zh: "美容",
      ms: "Kecantikan",
    },
    "Health & Wellness": {
      en: "Health & Wellness",
      zh: "健康与保健",
      ms: "Kesihatan & Kesejahteraan",
    },
    Fitness: {
      en: "Fitness",
      zh: "健身",
      ms: "Kecergasan",
    },
    "Hotel & Travel": {
      en: "Hotel & Travel",
      zh: "酒店与旅游",
      ms: "Hotel & Pelancongan",
    },
    Education: {
      en: "Education",
      zh: "教育",
      ms: "Pendidikan",
    },
    "Home & Living": {
      en: "Home & Living",
      zh: "家居生活",
      ms: "Rumah & Kehidupan",
    },
    Automotive: {
      en: "Automotive",
      zh: "汽车",
      ms: "Automotif",
    },
    Pets: {
      en: "Pets",
      zh: "宠物",
      ms: "Haiwan Peliharaan",
    },
    Electronics: {
      en: "Electronics",
      zh: "电子产品",
      ms: "Elektronik",
    },
    "Online Store": {
      en: "Online Store",
      zh: "网店",
      ms: "Kedai Dalam Talian",
    },
    "Professional Services": {
      en: "Professional Services",
      zh: "专业服务",
      ms: "Perkhidmatan Profesional",
    },
    Entertainment: {
      en: "Entertainment",
      zh: "娱乐",
      ms: "Hiburan",
    },
    Wholesale: {
      en: "Wholesale",
      zh: "批发",
      ms: "Borong",
    },
    Other: {
      en: "Other",
      zh: "其他",
      ms: "Lain-lain",
    },
  };

  const copy =
    pageText[language];

  function getCategoryLabel(
    category: string
  ) {
    return (
      categoryText[category]?.[
        language
      ] || category
    );
  }
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedState, setSelectedState] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    if (refCode) {
      localStorage.setItem("rewardhub_ref", refCode);
    }
  }, [refCode]);

  const safeMerchants = Array.isArray(merchants) ? merchants : [];

  const filteredMerchants = useMemo(() => {
    const searchText = keyword.trim().toLowerCase();

    return safeMerchants.filter((merchant: any) => {
      const merchantState = String(
        merchant?.state || merchant?.STATE || ""
      ).trim();

      const merchantArea = String(
        merchant?.area || merchant?.AREA || ""
      ).trim();

      const name = String(
        merchant?.displayName ||
          merchant?.DISPLAY_NAME ||
          merchant?.storeName ||
          merchant?.STORE_NAME ||
          merchant?.businessName ||
          merchant?.BUSINESS_NAME ||
          merchant?.name ||
          ""
      ).trim();

      const category = String(
        merchant?.category || merchant?.CATEGORY || ""
      ).trim();

      const matchKeyword =
        !searchText ||
        name.toLowerCase().includes(searchText) ||
        category.toLowerCase().includes(searchText) ||
        merchantState.toLowerCase().includes(searchText) ||
        merchantArea.toLowerCase().includes(searchText);

      const matchCategory =
        activeCategory === "All" ||
        category.toLowerCase() === activeCategory.toLowerCase();

      const matchState =
        !selectedState ||
        merchantState.toLowerCase() === selectedState.toLowerCase();

      const matchArea =
        !selectedArea ||
        merchantArea.toLowerCase() === selectedArea.toLowerCase();

      return matchKeyword && matchCategory && matchState && matchArea;
    });
  }, [
    safeMerchants,
    keyword,
    activeCategory,
    selectedState,
    selectedArea,
  ]);

  function resetFilters() {
    setKeyword("");
    setActiveCategory("All");
    setSelectedState("");
    setSelectedArea("");
  }

  return (
    <>

      <div className="mt-3 rounded-[1.5rem] bg-white p-3 shadow-xl sm:mt-4 sm:rounded-2xl sm:p-4">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="w-full rounded-xl px-4 py-3 text-xs font-medium text-slate-900 outline-none sm:px-5 sm:py-4 sm:text-base"
          placeholder={copy.searchPlaceholder}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4">
        <select
          value={selectedState}
          onChange={(event) => {
            setSelectedState(event.target.value);
            setSelectedArea("");
          }}
          className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-950 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
        >
          <option value="">{copy.allStates}</option>

          {Object.keys(areaOptions).map((stateName) => (
            <option key={stateName} value={stateName}>
              {stateName}
            </option>
          ))}
        </select>

        <select
          value={selectedArea}
          onChange={(event) => setSelectedArea(event.target.value)}
          disabled={!selectedState}
          className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-950 disabled:bg-slate-100 disabled:text-slate-400 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
        >
          <option value="">
            {selectedState ? copy.allAreas : copy.selectStateFirst}
          </option>

          {(areaOptions[selectedState] || []).map((areaName) => (
            <option key={areaName} value={areaName}>
              {areaName}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:mt-6 sm:gap-3">
        {(showAllCategories ? mainCategories : visibleCategories).map(
          (category) => (
            <button
              key={getCategoryLabel(category)}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-[10px] font-bold shadow-sm transition sm:px-5 sm:py-3 sm:text-sm ${
                activeCategory === category
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-950 hover:text-white"
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => setShowAllCategories((current) => !current)}
          className="shrink-0 whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] font-black text-amber-800 shadow-sm hover:bg-amber-100 sm:px-5 sm:py-3 sm:text-sm"
        >
          {showAllCategories ? copy.showLess : copy.moreCategories}
        </button>
      </div>

      <div className="mt-7 flex items-end justify-between gap-4 sm:mt-12">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600 sm:text-sm sm:tracking-[0.2em]">
            {copy.featured}
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:mt-2 sm:text-4xl">
            {copy.popularMerchants}
          </h2>

          <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
            {copy.showing} {filteredMerchants.length} {copy.merchants}
          </p>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-bold text-slate-700 shadow-sm sm:px-5 sm:py-3 sm:text-sm"
        >
          {copy.viewAll}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
        {filteredMerchants.map((merchant: any) => {
          const merchantName = String(
            merchant?.displayName ||
              merchant?.DISPLAY_NAME ||
              merchant?.storeName ||
              merchant?.STORE_NAME ||
              merchant?.businessName ||
              merchant?.BUSINESS_NAME ||
              merchant?.name ||
              "RewardHub Merchant"
          ).trim();

          const merchantId = String(
            merchant?.merchantId || merchant?.MERCHANT_ID || ""
          ).trim();

          const category = String(
            merchant?.category || merchant?.CATEGORY || ""
          ).trim();

          const merchantState = String(
            merchant?.state || merchant?.STATE || ""
          ).trim();

          const merchantArea = String(
            merchant?.area || merchant?.AREA || ""
          ).trim();

          const rawLocation =
            merchant?.location ??
            merchant?.LOCATION ??
            merchant?.address ??
            merchant?.ADDRESS ??
            "";

          const locationText =
            [merchantArea, merchantState]
              .filter(Boolean)
              .join(", ") ||
            (typeof rawLocation === "string" &&
            rawLocation.trim()
              ? rawLocation
              : copy.malaysia);

          const logoUrl = getDisplayImageUrl(
            String(
              merchant?.logoUrl ||
                merchant?.LOGO_URL ||
                merchant?.logoURL ||
                merchant?.LOGO ||
                ""
            ).trim()
          );

          const goldCashback = Number(
            merchant?.goldCashback ??
              merchant?.GOLD_CASHBACK ??
              merchant?.goldCashbackPercent ??
              merchant?.GOLD_CASHBACK_PERCENT ??
              0
          );

          const marketingBudget = Number(
            merchant?.marketingBudget ??
              merchant?.MARKETING_BUDGET ??
              0
          );

          const merchantHref = refCode
            ? `/merchant/${merchantId}?ref=${encodeURIComponent(refCode)}`
            : `/merchant/${merchantId}`;

          return (
            <div
              key={merchantId || merchantName}
              className="group min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[1.75rem] sm:p-5"
            >
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 text-xl font-black text-slate-400 sm:rounded-3xl sm:text-3xl">
                {logoUrl ? (
                  <SafeImage
                    src={logoUrl}
                    alt={merchantName}
                    className="h-full w-full rounded-2xl object-cover"
                    fallback={
                      <span>
                        {merchantName
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    }
                  />
                ) : (
                  merchantName.slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="mt-3 min-w-0 sm:mt-5">
                <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-black leading-5 text-slate-950 sm:min-h-0 sm:text-xl">
                  {merchantName}
                </h3>

                <p className="mt-1 line-clamp-2 text-[9px] font-semibold leading-4 text-slate-500 sm:text-sm sm:leading-5">
                  {getCategoryLabel(category) || copy.merchant} • {locationText}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 sm:rounded-2xl sm:p-3">
                  <p className="text-[9px] font-bold text-emerald-700 sm:text-xs">
                    {copy.cashback}
                  </p>

                  <p className="mt-1 text-xs font-black text-emerald-900 sm:text-base">
                    {goldCashback > 0
                      ? `Gold ${goldCashback}%`
                      : copy.available}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-2.5 sm:rounded-2xl sm:p-3">
                  <p className="text-[9px] font-bold text-amber-700 sm:text-xs">
                    {copy.campaign}
                  </p>

                  <p className="mt-1 text-xs font-black text-amber-900 sm:text-base">
                    {marketingBudget > 0 ? copy.active : copy.comingSoon}
                  </p>
                </div>
              </div>

              {merchantId ? (
                <Link
                  href={merchantHref}
                  className="mt-3 block w-full rounded-xl bg-slate-950 py-3 text-center text-[10px] font-black text-white no-underline transition group-hover:bg-blue-600 sm:mt-5 sm:rounded-2xl sm:py-4 sm:text-sm"
                >
                  {copy.viewMerchant}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-3 block w-full cursor-not-allowed rounded-xl bg-slate-300 py-3 text-center text-[10px] font-black text-white sm:mt-5 sm:rounded-2xl sm:py-4 sm:text-sm"
                >
                  {copy.unavailable}
                </button>
              )}
            </div>
          );
        })}

        {filteredMerchants.length === 0 && (
          <div className="col-span-2 rounded-[1.5rem] bg-white p-6 text-center text-xs font-bold text-slate-500 sm:rounded-[2rem] sm:p-10 sm:text-sm md:col-span-2 xl:col-span-4">
            {copy.noMerchants}
          </div>
        )}
      </div>
    </>
  );
}

function getDriveFileId(value: string) {
  const url = String(value || "").trim();

  if (!url) return "";

  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/i,
    /\/file\/d\/([a-zA-Z0-9_-]+)/i,
    /\/d\/([a-zA-Z0-9_-]+)/i,
    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function getDisplayImageUrl(value: string) {
  const url = String(value || "").trim();

  if (!url) return "";

  if (url.startsWith("/api/drive-image")) {
    return url;
  }

  const fileId = getDriveFileId(url);

  if (fileId) {
    return `/api/drive-image?id=${encodeURIComponent(fileId)}`;
  }

  return url;
}