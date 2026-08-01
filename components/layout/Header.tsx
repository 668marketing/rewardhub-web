"use client";

import { Headphones } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { useLanguage } from "@/hooks/useLanguage";

export default function Header() {
  const { language } = useLanguage();

  const pageText = {
    en: {
      home: "Home",
      marketplace: "Marketplace",
      howItWorks: "How It Works",
      about: "About",
      faq: "FAQ",
      contact: "Contact",
      memberLogin: "Member Login",
      memberRegister: "Join as Member",
      merchantLogin: "Merchant Login",
      merchantRegister: "Join as Merchant",
      referralId: "Referral ID",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
      openSupport: "Open RewardHub Support",
    },
    zh: {
      home: "首页",
      marketplace: "商家广场",
      howItWorks: "如何运作",
      about: "关于我们",
      faq: "常见问题",
      contact: "联系我们",
      memberLogin: "会员登录",
      memberRegister: "成为会员",
      merchantLogin: "商家登录",
      merchantRegister: "成为商家",
      referralId: "推荐编号",
      openMenu: "打开导航菜单",
      closeMenu: "关闭导航菜单",
      openSupport: "打开 RewardHub 客服",
    },
    ms: {
      home: "Utama",
      marketplace: "Marketplace",
      howItWorks: "Cara Berfungsi",
      about: "Tentang Kami",
      faq: "Soalan Lazim",
      contact: "Hubungi Kami",
      memberLogin: "Log Masuk Ahli",
      memberRegister: "Sertai Sebagai Ahli",
      merchantLogin: "Log Masuk Peniaga",
      merchantRegister: "Sertai Sebagai Peniaga",
      referralId: "ID Rujukan",
      openMenu: "Buka menu navigasi",
      closeMenu: "Tutup menu navigasi",
      openSupport: "Buka Sokongan RewardHub",
    },
  } as const;

  const copy =
    pageText[
      language === "zh" || language === "ms"
        ? language
        : "en"
    ];

  const [menuOpen, setMenuOpen] = useState(false);
  const [memberRef, setMemberRef] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRef =
      params.get("ref") ||
      params.get("refMember") ||
      "";

    if (queryRef) {
      localStorage.setItem("rewardhub_ref", queryRef);
      setMemberRef(queryRef);
      return;
    }

    setMemberRef(localStorage.getItem("rewardhub_ref") || "");
  }, []);

  const withRef = (path: string, key = "ref") =>
    memberRef
      ? `${path}?${key}=${encodeURIComponent(memberRef)}`
      : path;

  function closeMenu() {
    setMenuOpen(false);
  }

  function openSupport() {
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent("rewardhub-open-support"));
  }

  const navItems = [
    { href: withRef("/"), label: copy.home },
    { href: withRef("/marketplace"), label: copy.marketplace },
    { href: "/#how-it-works", label: copy.howItWorks },
    { href: "/#about", label: copy.about },
    { href: "/#faq", label: copy.faq },
    { href: "/#contact", label: copy.contact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:px-8 lg:min-h-24 xl:px-12">
        <Link
          href={withRef("/")}
          onClick={closeMenu}
          className="flex shrink-0 items-center no-underline"
        >
          <img
            src="/logo/rewardhub-logo.png"
            alt="RewardHub"
            className="h-11 w-auto object-contain sm:h-14 lg:h-16"
          />
        </Link>

        <nav className="hidden items-center gap-2 xl:flex">
          {navItems.map((item) => (
            <DesktopLink key={item.href} href={item.href}>
              {item.label}
            </DesktopLink>
          ))}

          <DesktopLink href={withRef("/login")}>
            {copy.memberLogin}
          </DesktopLink>

          <DesktopLink href={withRef("/register")} dark>
            {copy.memberRegister}
          </DesktopLink>

          <DesktopLink href="/merchant/login">
            {copy.merchantLogin}
          </DesktopLink>

          <DesktopLink
            href={withRef("/merchantregister", "refMember")}
            amber
          >
            {copy.merchantRegister}
          </DesktopLink>

          <SupportIconButton
            label={copy.openSupport}
            onClick={openSupport}
          />
        </nav>

        <div className="flex items-center gap-2 xl:hidden">
          <SupportIconButton
            label={copy.openSupport}
            onClick={openSupport}
            mobile
          />

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? copy.closeMenu : copy.openMenu}
            aria-expanded={menuOpen}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-950 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg sm:px-6 xl:hidden">
          <div className="mx-auto grid w-full max-w-7xl gap-3">
            {navItems.map((item) => (
              <MobileLink
                key={item.href}
                href={item.href}
                onClick={closeMenu}
              >
                {item.label}
              </MobileLink>
            ))}

            <MobileLink href={withRef("/login")} onClick={closeMenu}>
              {copy.memberLogin}
            </MobileLink>

            <MobileLink
              href={withRef("/register")}
              onClick={closeMenu}
              dark
            >
              {copy.memberRegister}
            </MobileLink>

            <MobileLink href="/merchant/login" onClick={closeMenu}>
              {copy.merchantLogin}
            </MobileLink>

            <MobileLink
              href={withRef("/merchantregister", "refMember")}
              onClick={closeMenu}
              amber
            >
              {copy.merchantRegister}
            </MobileLink>

            {memberRef && (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-xs font-black text-emerald-700">
                {copy.referralId}: {memberRef}
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function SupportIconButton({
  label,
  onClick,
  mobile = false,
}: {
  label: string;
  onClick: () => void;
  mobile?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        "group flex shrink-0 items-center justify-center",
        "border border-slate-200 bg-white text-slate-800",
        "shadow-sm transition",
        "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700",
        "active:scale-95",
        mobile
          ? "h-11 w-11 rounded-2xl"
          : "h-[46px] w-[46px] rounded-2xl",
      ].join(" ")}
    >
      <Headphones className="h-5 w-5 transition-transform group-hover:scale-110" />
    </button>
  );
}

function DesktopLink({
  href,
  children,
  dark = false,
  amber = false,
}: {
  href: string;
  children: React.ReactNode;
  dark?: boolean;
  amber?: boolean;
}) {
  const style = amber
    ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
    : dark
      ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
      : "border-transparent bg-white text-slate-700 hover:bg-slate-100";

  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-2xl border px-3 py-3 text-xs font-black no-underline transition 2xl:px-4 2xl:text-sm ${style}`}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  children,
  onClick,
  dark = false,
  amber = false,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  dark?: boolean;
  amber?: boolean;
}) {
  const style = amber
    ? "bg-amber-500 text-white"
    : dark
      ? "bg-slate-950 text-white"
      : "bg-slate-100 text-slate-950";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block w-full rounded-2xl px-5 py-4 text-center text-sm font-black no-underline transition active:scale-[0.98] ${style}`}
    >
      {children}
    </Link>
  );
}
