"use client";

import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";

export default function MarketplaceHero() {
  const {
    language,
  } = useLanguage();

  const pageText = {
    en: {
      network:
        "Malaysia Merchant Membership Network",
      title:
        "Discover rewards near you.",
      description:
        "Search partner merchants, enjoy instant member rewards, collect points and earn cashback with RewardHub.",
    },

    zh: {
      network:
        "马来西亚商家会员网络",
      title:
        "发现您附近的会员优惠。",
      description:
        "搜索 RewardHub 合作商家，享受即时会员优惠、累积积分并获得现金回扣。",
    },

    ms: {
      network:
        "Rangkaian Keahlian Peniaga Malaysia",
      title:
        "Temui ganjaran berhampiran anda.",
      description:
        "Cari peniaga rakan kongsi, nikmati ganjaran ahli serta-merta, kumpul mata dan peroleh pulangan tunai dengan RewardHub.",
    },
  } as const;

  const copy =
    pageText[language];

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 px-5 py-8 text-white shadow-2xl sm:rounded-[2rem] sm:px-8 sm:py-12 md:px-14 md:py-20">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageSwitcher
          compact
          className="border-white/15 bg-white/10 text-white shadow-none backdrop-blur"
        />
      </div>

      <div className="relative z-10 pr-0 pt-12 sm:pr-36 sm:pt-0">
        <div className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-blue-100 sm:mb-5 sm:px-4 sm:py-2 sm:text-sm">
          {copy.network}
        </div>

        <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          {copy.title}
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-6 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
          {copy.description}
        </p>
      </div>
    </div>
  );
}