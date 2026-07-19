"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Header() {
  const searchParams = useSearchParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [memberRef, setMemberRef] = useState("");

  const queryRef =
    searchParams.get("ref") ||
    searchParams.get("refMember") ||
    "";

  useEffect(() => {
    if (queryRef) {
      localStorage.setItem("rewardhub_ref", queryRef);
      setMemberRef(queryRef);
      return;
    }

    const savedRef =
      localStorage.getItem("rewardhub_ref") || "";

    setMemberRef(savedRef);
  }, [queryRef]);

  const marketplaceHref = memberRef
    ? `/marketplace?ref=${encodeURIComponent(memberRef)}`
    : "/marketplace";

  const memberLoginHref = memberRef
    ? `/login?ref=${encodeURIComponent(memberRef)}`
    : "/login";

  const memberRegisterHref = memberRef
    ? `/register?ref=${encodeURIComponent(memberRef)}`
    : "/register";

  const merchantRegisterHref = memberRef
    ? `/merchantregister?refMember=${encodeURIComponent(memberRef)}`
    : "/merchantregister";

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:px-8 lg:min-h-24 xl:px-12">
        {/* Logo */}
        <Link
          href={marketplaceHref}
          onClick={closeMenu}
          className="flex shrink-0 items-center no-underline"
        >
          <img
            src="/logo/rewardhub-logo.png"
            alt="RewardHub"
            className="h-11 w-auto object-contain sm:h-14 lg:h-16"
          />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-3 lg:flex">
          <DesktopLink href={marketplaceHref}>
            Marketplace
          </DesktopLink>

          <DesktopLink href={memberLoginHref}>
            Member Login
          </DesktopLink>

          <DesktopLink href={memberRegisterHref} dark>
            Member Register
          </DesktopLink>

          <DesktopLink href="/merchant/login">
            Merchant Login
          </DesktopLink>

          <DesktopLink href={merchantRegisterHref} amber>
            Merchant Register
          </DesktopLink>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-950 shadow-sm transition active:scale-95 lg:hidden"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg sm:px-6 lg:hidden">
          <div className="mx-auto grid w-full max-w-7xl gap-3">
            <MobileLink
              href={marketplaceHref}
              onClick={closeMenu}
            >
              Marketplace
            </MobileLink>

            <MobileLink
              href={memberLoginHref}
              onClick={closeMenu}
            >
              Member Login
            </MobileLink>

            <MobileLink
              href={memberRegisterHref}
              onClick={closeMenu}
              dark
            >
              Member Register
            </MobileLink>

            <MobileLink
              href="/merchant/login"
              onClick={closeMenu}
            >
              Merchant Login
            </MobileLink>

            <MobileLink
              href={merchantRegisterHref}
              onClick={closeMenu}
              amber
            >
              Merchant Register
            </MobileLink>

            {memberRef && (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-xs font-black text-emerald-700">
                Referral ID: {memberRef}
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
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