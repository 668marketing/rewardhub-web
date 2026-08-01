"use client";

import {
  ArrowRight,
  BadgePercent,
  Building2,
  CheckCircle2,
  Gift,
  QrCode,
  ShieldCheck,
  Store,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/hooks/useLanguage";

export default function PublicHomePage() {
  const { language } = useLanguage();

  const copy = {
    en: {
      eyebrow: "Malaysia's Merchant Membership Network",
      title: "One membership. More rewards. Better business growth.",
      subtitle:
        "RewardHub connects members with participating merchants through cashback, points, Reward Credits and referral rewards.",
      explore: "Explore Marketplace",
      joinMember: "Join as Member",
      joinMerchant: "Join as Merchant",
      memberFree: "Free for members",
      merchantFree: "Free to join for merchants",
      rewards: "Rewards on eligible spending",
      aboutTitle: "A smarter way to connect members and merchants",
      aboutText:
        "Members discover trusted merchants and enjoy meaningful rewards. Merchants gain repeat customers and pay marketing costs only when RewardHub members spend.",
      memberTitle: "For Members",
      memberText:
        "Join free, earn points, enjoy cashback and use Reward Credits on eligible purchases.",
      merchantTitle: "For Merchants",
      merchantText:
        "Reach more customers, manage your own marketing budget and grow repeat sales.",
      howTitle: "How RewardHub works",
      step1Title: "Join RewardHub",
      step1Text:
        "Register as a member or merchant through the official website.",
      step2Title: "Discover and transact",
      step2Text:
        "Members explore merchants, scan or pay through the supported RewardHub flow.",
      step3Title: "Earn and grow",
      step3Text:
        "Members receive rewards while merchants build customer loyalty and measurable sales.",
      benefitsTitle: "Built for everyday rewards",
      benefits: [
        "Lifetime membership tiers",
        "Points and reward redemptions",
        "Reward Credits from referral earnings",
        "Cashback at participating merchants",
        "Merchant products and services",
        "Secure account and biometric access",
      ],
      merchantGrowthTitle: "Grow with a flexible marketing budget",
      merchantGrowthText:
        "Merchants decide their own marketing budget from a minimum of 5%. RewardHub records member transactions, rewards, referrals and settlements without holding customer payment funds.",
      merchantCta: "Become a RewardHub Merchant",
      marketplaceTitle: "Discover RewardHub merchants",
      marketplaceText:
        "Explore products, services, offers and member rewards from participating businesses.",
      marketplaceCta: "Open Marketplace",
      faqTitle: "Frequently asked questions",
      faqs: [
        ["Is RewardHub free to join?", "Yes. Member and merchant registration are free."],
        [
          "Does RewardHub hold customer payments?",
          "No. Payments go directly to merchants. RewardHub records the transaction and related rewards.",
        ],
        [
          "What are Reward Credits?",
          "Reward Credits come from available referral earnings and may be used at eligible merchants, subject to merchant settings.",
        ],
        [
          "Can merchants control their marketing budget?",
          "Yes. Merchants can set and update their own marketing budget, starting from the platform minimum.",
        ],
      ],
      finalTitle: "Ready to join the RewardHub network?",
      finalText:
        "Start as a member, grow as a merchant, or explore the marketplace today.",
    },
    zh: {
      eyebrow: "马来西亚商家会员网络",
      title: "一个会员身份，更多奖励，更好的商家增长。",
      subtitle:
        "RewardHub 通过现金回馈、积分、Reward Credits 与推荐奖励，把会员和合作商家连接起来。",
      explore: "浏览商家广场",
      joinMember: "成为会员",
      joinMerchant: "成为商家",
      memberFree: "会员免费加入",
      merchantFree: "商家免费加入",
      rewards: "合资格消费可获得奖励",
      aboutTitle: "更聪明地连接会员与商家",
      aboutText:
        "会员可发现值得信赖的商家并获得实际奖励；商家则能吸引回头客，并只在 RewardHub 会员消费时承担营销成本。",
      memberTitle: "会员",
      memberText:
        "免费加入、累积积分、享有现金回馈，并在合资格消费中使用 Reward Credits。",
      merchantTitle: "商家",
      merchantText:
        "接触更多顾客，自主设置营销预算，并提升重复消费。",
      howTitle: "RewardHub 如何运作",
      step1Title: "加入 RewardHub",
      step1Text: "通过官网注册成为会员或商家。",
      step2Title: "发现商家并完成消费",
      step2Text:
        "会员浏览合作商家，并通过 RewardHub 支持的扫码或付款流程消费。",
      step3Title: "获得奖励并持续增长",
      step3Text:
        "会员获得奖励，商家则建立顾客忠诚度与可追踪的销售增长。",
      benefitsTitle: "为日常奖励而设计",
      benefits: [
        "终身会员等级",
        "积分与奖励兑换",
        "推荐收益转换为 Reward Credits",
        "合作商家现金回馈",
        "商家商品与服务",
        "安全账户与生物识别",
      ],
      merchantGrowthTitle: "使用灵活营销预算推动增长",
      merchantGrowthText:
        "商家可从最低 5% 起自行设置营销预算。RewardHub 记录会员交易、奖励、推荐与结算，但不会代收顾客付款。",
      merchantCta: "成为 RewardHub 商家",
      marketplaceTitle: "发现 RewardHub 合作商家",
      marketplaceText:
        "浏览合作商家的商品、服务、优惠与会员奖励。",
      marketplaceCta: "进入商家广场",
      faqTitle: "常见问题",
      faqs: [
        ["加入 RewardHub 需要付费吗？", "不需要。会员与商家都可以免费注册。"],
        [
          "RewardHub 会代收顾客付款吗？",
          "不会。付款直接进入商家，RewardHub 只记录交易与相关奖励。",
        ],
        [
          "什么是 Reward Credits？",
          "Reward Credits 来自可用的推荐收益，并可根据商家设置用于合资格消费。",
        ],
        [
          "商家可以自己控制营销预算吗？",
          "可以。商家可从平台最低标准起，自行设置和调整营销预算。",
        ],
      ],
      finalTitle: "准备加入 RewardHub 网络了吗？",
      finalText:
        "成为会员、加入成为商家，或立即浏览商家广场。",
    },
    ms: {
      eyebrow: "Rangkaian Keahlian Peniaga Malaysia",
      title:
        "Satu keahlian. Lebih banyak ganjaran. Pertumbuhan perniagaan yang lebih baik.",
      subtitle:
        "RewardHub menghubungkan ahli dan peniaga melalui pulangan tunai, mata, Reward Credits dan ganjaran rujukan.",
      explore: "Terokai Marketplace",
      joinMember: "Sertai Sebagai Ahli",
      joinMerchant: "Sertai Sebagai Peniaga",
      memberFree: "Percuma untuk ahli",
      merchantFree: "Percuma untuk peniaga menyertai",
      rewards: "Ganjaran untuk perbelanjaan yang layak",
      aboutTitle: "Cara lebih pintar menghubungkan ahli dan peniaga",
      aboutText:
        "Ahli menemui peniaga yang dipercayai dan menikmati ganjaran bermakna. Peniaga pula memperoleh pelanggan berulang dan hanya membayar kos pemasaran apabila ahli RewardHub berbelanja.",
      memberTitle: "Untuk Ahli",
      memberText:
        "Sertai secara percuma, kumpul mata, nikmati pulangan tunai dan gunakan Reward Credits untuk pembelian yang layak.",
      merchantTitle: "Untuk Peniaga",
      merchantText:
        "Capai lebih ramai pelanggan, urus bajet pemasaran sendiri dan tingkatkan jualan berulang.",
      howTitle: "Cara RewardHub berfungsi",
      step1Title: "Sertai RewardHub",
      step1Text:
        "Daftar sebagai ahli atau peniaga melalui laman web rasmi.",
      step2Title: "Terokai dan berbelanja",
      step2Text:
        "Ahli meneroka peniaga dan membuat pembayaran melalui aliran RewardHub yang disokong.",
      step3Title: "Dapat ganjaran dan berkembang",
      step3Text:
        "Ahli menerima ganjaran manakala peniaga membina kesetiaan pelanggan dan jualan yang boleh diukur.",
      benefitsTitle: "Dibina untuk ganjaran harian",
      benefits: [
        "Tahap keahlian seumur hidup",
        "Mata dan penebusan ganjaran",
        "Reward Credits daripada pendapatan rujukan",
        "Pulangan tunai di peniaga terlibat",
        "Produk dan perkhidmatan peniaga",
        "Akaun selamat dan akses biometrik",
      ],
      merchantGrowthTitle:
        "Berkembang dengan bajet pemasaran fleksibel",
      merchantGrowthText:
        "Peniaga menetapkan bajet pemasaran sendiri bermula daripada minimum 5%. RewardHub merekod transaksi, ganjaran, rujukan dan penyelesaian tanpa memegang bayaran pelanggan.",
      merchantCta: "Jadi Peniaga RewardHub",
      marketplaceTitle: "Temui peniaga RewardHub",
      marketplaceText:
        "Terokai produk, perkhidmatan, tawaran dan ganjaran ahli daripada perniagaan yang mengambil bahagian.",
      marketplaceCta: "Buka Marketplace",
      faqTitle: "Soalan lazim",
      faqs: [
        [
          "Adakah RewardHub percuma untuk disertai?",
          "Ya. Pendaftaran ahli dan peniaga adalah percuma.",
        ],
        [
          "Adakah RewardHub memegang bayaran pelanggan?",
          "Tidak. Bayaran dibuat terus kepada peniaga. RewardHub hanya merekod transaksi dan ganjaran berkaitan.",
        ],
        [
          "Apakah Reward Credits?",
          "Reward Credits datang daripada pendapatan rujukan tersedia dan boleh digunakan di peniaga yang layak tertakluk pada tetapan peniaga.",
        ],
        [
          "Bolehkah peniaga mengawal bajet pemasaran sendiri?",
          "Ya. Peniaga boleh menetapkan dan mengemas kini bajet pemasaran sendiri bermula daripada minimum platform.",
        ],
      ],
      finalTitle: "Bersedia menyertai rangkaian RewardHub?",
      finalText:
        "Mulakan sebagai ahli, berkembang sebagai peniaga atau terokai marketplace hari ini.",
    },
  } as const;

  const text =
    copy[
      language === "zh" || language === "ms"
        ? language
        : "en"
    ];

  return (
    <>
      <Header />

      <main className="bg-white">
        <section className="overflow-hidden bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-20 md:px-8 lg:py-28 xl:px-12">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300 sm:text-sm">
                {text.eyebrow}
              </p>

              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
                {text.title}
              </h1>

              <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-300 sm:text-lg">
                {text.subtitle}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryLink href="/marketplace">{text.explore}</PrimaryLink>
                <SecondaryLink href="/register">{text.joinMember}</SecondaryLink>
                <AmberLink href="/merchantregister">{text.joinMerchant}</AmberLink>
              </div>

              <div className="mt-8 grid gap-3 text-sm font-bold text-slate-300 sm:grid-cols-3">
                <TrustItem text={text.memberFree} />
                <TrustItem text={text.merchantFree} />
                <TrustItem text={text.rewards} />
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="rounded-[2rem] bg-white p-6 text-slate-950 sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <WalletCards className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
                    RewardHub
                  </span>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <FeatureMini icon={<BadgePercent className="h-5 w-5" />} title="Cashback" />
                  <FeatureMini icon={<Gift className="h-5 w-5" />} title="Rewards" />
                  <FeatureMini icon={<QrCode className="h-5 w-5" />} title="QR Pay" />
                  <FeatureMini icon={<Users className="h-5 w-5" />} title="Referral" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="px-4 py-16 sm:px-6 md:px-8 lg:py-24 xl:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>RewardHub</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl lg:text-5xl">
                {text.aboutTitle}
              </h2>
              <p className="mt-5 text-base font-semibold leading-8 text-slate-500">
                {text.aboutText}
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <AudienceCard
                icon={<Users className="h-7 w-7" />}
                title={text.memberTitle}
                text={text.memberText}
                href="/register"
                dark
              />
              <AudienceCard
                icon={<Store className="h-7 w-7" />}
                title={text.merchantTitle}
                text={text.merchantText}
                href="/merchantregister"
                amber
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-slate-50 px-4 py-16 sm:px-6 md:px-8 lg:py-24 xl:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <SectionEyebrow>01 — 02 — 03</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl lg:text-5xl">
                {text.howTitle}
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <StepCard number="01" icon={<Users className="h-6 w-6" />} title={text.step1Title} text={text.step1Text} />
              <StepCard number="02" icon={<QrCode className="h-6 w-6" />} title={text.step2Title} text={text.step2Text} />
              <StepCard number="03" icon={<BadgePercent className="h-6 w-6" />} title={text.step3Title} text={text.step3Text} />
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 md:px-8 lg:py-24 xl:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <SectionEyebrow>Benefits</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl lg:text-5xl">
                {text.benefitsTitle}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {text.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm font-black leading-6 text-slate-800">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 md:px-8 lg:pb-24 xl:px-12">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-amber-500 p-7 text-slate-950 shadow-2xl sm:p-10 lg:p-14">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Building2 className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-3xl font-black sm:text-4xl lg:text-5xl">
                  {text.merchantGrowthTitle}
                </h2>
                <p className="mt-4 max-w-4xl text-base font-bold leading-8 text-amber-950/80">
                  {text.merchantGrowthText}
                </p>
              </div>

              <Link
                href="/merchantregister"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white no-underline shadow-xl transition hover:bg-slate-800"
              >
                {text.merchantCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 md:px-8 lg:py-24 xl:px-12">
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <SectionEyebrow dark>Marketplace</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl lg:text-5xl">
                {text.marketplaceTitle}
              </h2>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-slate-300">
                {text.marketplaceText}
              </p>
            </div>

            <PrimaryLink href="/marketplace">{text.marketplaceCta}</PrimaryLink>
          </div>
        </section>

        <section id="faq" className="px-4 py-16 sm:px-6 md:px-8 lg:py-24 xl:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <SectionEyebrow>FAQ</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl lg:text-5xl">
                {text.faqTitle}
              </h2>
            </div>

            <div className="mt-10 space-y-4">
              {text.faqs.map(([question, answer]) => (
                <details key={question} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <summary className="cursor-pointer list-none text-base font-black text-slate-950">
                    {question}
                  </summary>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 md:px-8 lg:pb-24 xl:px-12">
          <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-slate-100 p-7 text-center sm:p-10 lg:p-14">
            <ShieldCheck className="mx-auto h-12 w-12 text-slate-950" />
            <h2 className="mx-auto mt-5 max-w-4xl text-3xl font-black text-slate-950 sm:text-4xl lg:text-5xl">
              {text.finalTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-8 text-slate-500">
              {text.finalText}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <DarkLink href="/register">{text.joinMember}</DarkLink>
              <AmberLink href="/merchantregister">{text.joinMerchant}</AmberLink>
              <OutlineLink href="/marketplace">{text.explore}</OutlineLink>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
      <span>{text}</span>
    </div>
  );
}

function FeatureMini({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <div className="text-slate-950">{icon}</div>
      <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
    </div>
  );
}

function AudienceCard({
  icon,
  title,
  text,
  href,
  dark = false,
  amber = false,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
  dark?: boolean;
  amber?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-[2rem] p-6 no-underline shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:p-8",
        dark
          ? "bg-slate-950 text-white"
          : amber
            ? "bg-amber-500 text-slate-950"
            : "bg-white text-slate-950",
      ].join(" ")}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
        {icon}
      </div>
      <h3 className="mt-5 text-2xl font-black">{title}</h3>
      <p className={dark ? "mt-3 text-sm font-semibold leading-7 text-slate-300" : "mt-3 text-sm font-semibold leading-7 text-slate-700"}>
        {text}
      </p>
    </Link>
  );
}

function StepCard({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-amber-600">{number}</span>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
          {icon}
        </div>
      </div>
      <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">{text}</p>
    </div>
  );
}

function SectionEyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`text-xs font-black uppercase tracking-[0.22em] ${dark ? "text-amber-300" : "text-amber-600"}`}>
      {children}
    </p>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 no-underline transition hover:bg-slate-100">
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black text-white no-underline transition hover:bg-white/15">
      {children}
    </Link>
  );
}

function AmberLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-slate-950 no-underline transition hover:bg-amber-400">
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function DarkLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white no-underline">
      {children}
    </Link>
  );
}

function OutlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-black text-slate-950 no-underline">
      {children}
    </Link>
  );
}
