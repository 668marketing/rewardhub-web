"use client";

import Link from "next/link";

import { useLanguage } from "@/hooks/useLanguage";

export default function Footer() {
  const { language } = useLanguage();

  const copy = {
    en: {
      description:
        "A smarter membership network connecting members with participating merchants across Malaysia.",
      explore: "Explore",
      marketplace: "Marketplace",
      memberRegister: "Member Registration",
      merchantRegister: "Merchant Registration",
      memberLogin: "Member Login",
      merchantLogin: "Merchant Login",
      support: "Support",
      faq: "FAQ",
      contact: "Contact",
      rights: "All rights reserved.",
    },
    zh: {
      description:
        "连接马来西亚会员与合作商家的智慧会员网络。",
      explore: "快速入口",
      marketplace: "商家广场",
      memberRegister: "会员注册",
      merchantRegister: "商家注册",
      memberLogin: "会员登录",
      merchantLogin: "商家登录",
      support: "支持",
      faq: "常见问题",
      contact: "联系我们",
      rights: "版权所有。",
    },
    ms: {
      description:
        "Rangkaian keahlian pintar yang menghubungkan ahli dengan peniaga di seluruh Malaysia.",
      explore: "Terokai",
      marketplace: "Marketplace",
      memberRegister: "Pendaftaran Ahli",
      merchantRegister: "Pendaftaran Peniaga",
      memberLogin: "Log Masuk Ahli",
      merchantLogin: "Log Masuk Peniaga",
      support: "Sokongan",
      faq: "Soalan Lazim",
      contact: "Hubungi Kami",
      rights: "Hak cipta terpelihara.",
    },
  } as const;

  const text =
    copy[
      language === "zh" || language === "ms"
        ? language
        : "en"
    ];

  return (
    <footer
      id="contact"
      className="border-t border-slate-200 bg-slate-950 text-white"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-8 xl:px-12">
        <div>
          <img
            src="/logo/rewardhub-logo.png"
            alt="RewardHub"
            className="h-14 w-auto rounded-xl bg-white p-2 object-contain"
          />

          <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-slate-400">
            {text.description}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">
            {text.explore}
          </h2>

          <div className="mt-4 grid gap-3 text-sm font-bold text-slate-300">
            <FooterLink href="/marketplace">{text.marketplace}</FooterLink>
            <FooterLink href="/register">{text.memberRegister}</FooterLink>
            <FooterLink href="/merchantregister">
              {text.merchantRegister}
            </FooterLink>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">
            {text.support}
          </h2>

          <div className="mt-4 grid gap-3 text-sm font-bold text-slate-300">
            <FooterLink href="/login">{text.memberLogin}</FooterLink>
            <FooterLink href="/merchant/login">
              {text.merchantLogin}
            </FooterLink>
            <FooterLink href="/#faq">{text.faq}</FooterLink>
            <FooterLink href="/#contact">{text.contact}</FooterLink>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-xs font-semibold text-slate-500 md:px-8 xl:px-12">
          © 2026 RewardHub. {text.rights}
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="w-fit text-slate-300 no-underline transition hover:text-white"
    >
      {children}
    </Link>
  );
}
