"use client";

import {
  Headphones,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useSearchParams,
} from "next/navigation";

import {
  useLanguage,
} from "@/hooks/useLanguage";

export default function Header() {
  const searchParams =
    useSearchParams();

  const {
    language,
  } = useLanguage();

  const pageText = {
    en: {
      marketplace: "Marketplace",
      memberLogin: "Member Login",
      memberRegister: "Member Register",
      merchantLogin: "Merchant Login",
      merchantRegister: "Merchant Register",
      referralId: "Referral ID",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
      openSupport: "Open RewardHub Support",
    },

    zh: {
      marketplace: "商家广场",
      memberLogin: "会员登录",
      memberRegister: "会员注册",
      merchantLogin: "商家登录",
      merchantRegister: "商家注册",
      referralId: "推荐编号",
      openMenu: "打开导航菜单",
      closeMenu: "关闭导航菜单",
      openSupport: "打开 RewardHub 客服",
    },

    ms: {
      marketplace: "Marketplace",
      memberLogin: "Log Masuk Ahli",
      memberRegister: "Daftar Ahli",
      merchantLogin: "Log Masuk Peniaga",
      merchantRegister: "Daftar Peniaga",
      referralId: "ID Rujukan",
      openMenu: "Buka menu navigasi",
      closeMenu: "Tutup menu navigasi",
      openSupport: "Buka Sokongan RewardHub",
    },
  } as const;

  const copy =
    pageText[language];

  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(false);

  const [
    memberRef,
    setMemberRef,
  ] =
    useState("");

  const queryRef =
    searchParams.get("ref") ||
    searchParams.get(
      "refMember"
    ) ||
    "";

  useEffect(() => {
    if (queryRef) {
      localStorage.setItem(
        "rewardhub_ref",
        queryRef
      );

      setMemberRef(
        queryRef
      );

      return;
    }

    const savedRef =
      localStorage.getItem(
        "rewardhub_ref"
      ) || "";

    setMemberRef(
      savedRef
    );
  }, [queryRef]);

  const marketplaceHref =
    memberRef
      ? `/marketplace?ref=${encodeURIComponent(
          memberRef
        )}`
      : "/marketplace";

  const memberLoginHref =
    memberRef
      ? `/login?ref=${encodeURIComponent(
          memberRef
        )}`
      : "/login";

  const memberRegisterHref =
    memberRef
      ? `/register?ref=${encodeURIComponent(
          memberRef
        )}`
      : "/register";

  const merchantRegisterHref =
    memberRef
      ? `/merchantregister?refMember=${encodeURIComponent(
          memberRef
        )}`
      : "/merchantregister";

  function closeMenu() {
    setMenuOpen(false);
  }

  function openSupport() {
    setMenuOpen(false);

    window.dispatchEvent(
      new CustomEvent(
        "rewardhub-open-support"
      )
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:px-8 lg:min-h-24 xl:px-12">
        <Link
          href={
            marketplaceHref
          }
          onClick={
            closeMenu
          }
          className="flex shrink-0 items-center no-underline"
        >
          <img
            src="/logo/rewardhub-logo.png"
            alt="RewardHub"
            className="h-11 w-auto object-contain sm:h-14 lg:h-16"
          />
        </Link>

        <nav className="hidden items-center gap-3 lg:flex">
          <DesktopLink
            href={
              marketplaceHref
            }
          >
            {
              copy.marketplace
            }
          </DesktopLink>

          <DesktopLink
            href={
              memberLoginHref
            }
          >
            {
              copy.memberLogin
            }
          </DesktopLink>

          <DesktopLink
            href={
              memberRegisterHref
            }
            dark
          >
            {
              copy.memberRegister
            }
          </DesktopLink>

          <DesktopLink
            href="/merchant/login"
          >
            {
              copy.merchantLogin
            }
          </DesktopLink>

          <DesktopLink
            href={
              merchantRegisterHref
            }
            amber
          >
            {
              copy.merchantRegister
            }
          </DesktopLink>

          <SupportIconButton
            label={
              copy.openSupport
            }
            onClick={
              openSupport
            }
          />
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <SupportIconButton
            label={
              copy.openSupport
            }
            onClick={
              openSupport
            }
            mobile
          />

          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (current) =>
                  !current
              )
            }
            aria-label={
              menuOpen
                ? copy.closeMenu
                : copy.openMenu
            }
            aria-expanded={
              menuOpen
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-950 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            {menuOpen
              ? "✕"
              : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg sm:px-6 lg:hidden">
          <div className="mx-auto grid w-full max-w-7xl gap-3">
            <MobileLink
              href={
                marketplaceHref
              }
              onClick={
                closeMenu
              }
            >
              {
                copy.marketplace
              }
            </MobileLink>

            <MobileLink
              href={
                memberLoginHref
              }
              onClick={
                closeMenu
              }
            >
              {
                copy.memberLogin
              }
            </MobileLink>

            <MobileLink
              href={
                memberRegisterHref
              }
              onClick={
                closeMenu
              }
              dark
            >
              {
                copy.memberRegister
              }
            </MobileLink>

            <MobileLink
              href="/merchant/login"
              onClick={
                closeMenu
              }
            >
              {
                copy.merchantLogin
              }
            </MobileLink>

            <MobileLink
              href={
                merchantRegisterHref
              }
              onClick={
                closeMenu
              }
              amber
            >
              {
                copy.merchantRegister
              }
            </MobileLink>

            {memberRef && (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-xs font-black text-emerald-700">
                {
                  copy.referralId
                }
                :{" "}
                {
                  memberRef
                }
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
      onClick={
        onClick
      }
      aria-label={
        label
      }
      title={
        label
      }
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
  children:
    React.ReactNode;
  dark?: boolean;
  amber?: boolean;
}) {
  const style =
    amber
      ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
      : dark
        ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100";

  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-2xl border px-5 py-3 text-sm font-black no-underline transition ${style}`}
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
  children:
    React.ReactNode;
  onClick: () => void;
  dark?: boolean;
  amber?: boolean;
}) {
  const style =
    amber
      ? "bg-amber-500 text-white"
      : dark
        ? "bg-slate-950 text-white"
        : "bg-slate-100 text-slate-950";

  return (
    <Link
      href={href}
      onClick={
        onClick
      }
      className={`block w-full rounded-2xl px-5 py-4 text-center text-sm font-black no-underline transition active:scale-[0.98] ${style}`}
    >
      {children}
    </Link>
  );
}