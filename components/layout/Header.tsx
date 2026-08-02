"use client";

import {
  Bell,
  Headphones,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLanguage } from "@/hooks/useLanguage";

type PortalType = "member" | "business";

type NavItem = {
  href: string;
  label: string;
};

const APP_VARIANT: PortalType =
  process.env.NEXT_PUBLIC_APP_VARIANT === "business"
    ? "business"
    : "member";

const AUTH_PATHS = [
  "/login",
  "/member/login",
  "/merchant/login",
  "/forgot-password",
  "/member/forgot-password",
  "/merchant/forgot-password",
];

export default function Header() {
  const pathname = usePathname();
  const { language } = useLanguage();

  const [menuOpen, setMenuOpen] = useState(false);

  const isBusiness = APP_VARIANT === "business";

  const isAuthPage =
    AUTH_PATHS.includes(pathname) ||
    pathname.includes("/reset-password");

  const isPortalPage = isBusiness
    ? pathname.startsWith("/merchant/")
    : pathname.startsWith("/member/");

  const showPortalControls =
    isPortalPage && !isAuthPage;

  const pageText = {
    en: {
      memberBrand: "RewardHub Member",
      businessBrand: "RewardHub Business",
      dashboard: "Dashboard",
      pay: "Pay",
      points: "Points",
      referral: "Referral",
      profile: "Profile",
      scan: "Scan",
      transactions: "Transactions",
      orders: "Orders",
      products: "Products",
      marketing: "Marketing",
      settlement: "Settlement",
      notifications: "Notifications",
      security: "Security",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
      openSupport: "Open RewardHub Support",
    },
    zh: {
      memberBrand: "RewardHub 会员版",
      businessBrand: "RewardHub 商家版",
      dashboard: "主页",
      pay: "付款",
      points: "积分",
      referral: "推荐",
      profile: "个人资料",
      scan: "扫码",
      transactions: "交易记录",
      orders: "订单",
      products: "商品",
      marketing: "营销预算",
      settlement: "结算",
      notifications: "通知",
      security: "安全中心",
      openMenu: "打开导航菜单",
      closeMenu: "关闭导航菜单",
      openSupport: "打开 RewardHub 客服",
    },
    ms: {
      memberBrand: "RewardHub Ahli",
      businessBrand: "RewardHub Perniagaan",
      dashboard: "Papan Pemuka",
      pay: "Bayar",
      points: "Mata",
      referral: "Rujukan",
      profile: "Profil",
      scan: "Imbas",
      transactions: "Transaksi",
      orders: "Pesanan",
      products: "Produk",
      marketing: "Pemasaran",
      settlement: "Penyelesaian",
      notifications: "Notifikasi",
      security: "Pusat Keselamatan",
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

  const navItems = useMemo<NavItem[]>(
    () =>
      isBusiness
        ? [
            {
              href: "/merchant/dashboard",
              label: copy.dashboard,
            },
            {
              href: "/merchant/scan",
              label: copy.scan,
            },
            {
              href: "/merchant/transactions",
              label: copy.transactions,
            },
            {
              href: "/merchant/orders",
              label: copy.orders,
            },
            {
              href: "/merchant/products",
              label: copy.products,
            },
            {
              href: "/merchant/marketing",
              label: copy.marketing,
            },
            {
              href: "/merchant/settlement",
              label: copy.settlement,
            },
          ]
        : [
            {
              href: "/member/dashboard",
              label: copy.dashboard,
            },
            {
              href: "/member/pay",
              label: copy.pay,
            },
            {
              href: "/member/points",
              label: copy.points,
            },
            {
              href: "/member/referral",
              label: copy.referral,
            },
          ],
    [copy, isBusiness]
  );

  const loginHref = isBusiness
    ? "/merchant/login"
    : "/login";

  const homeHref = showPortalControls
    ? isBusiness
      ? "/merchant/dashboard"
      : "/member/dashboard"
    : loginHref;

  const profileHref = isBusiness
    ? "/merchant/profile"
    : "/member/profile";

  const securityHref = isBusiness
    ? "/merchant/security"
    : "/member/security";

  const notificationsHref = isBusiness
    ? "/merchant/notifications"
    : "/member/notifications";

  const brandLabel = isBusiness
    ? copy.businessBrand
    : copy.memberBrand;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!showPortalControls) {
      setMenuOpen(false);
    }
  }, [showPortalControls]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1280) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function openSupport() {
    setMenuOpen(false);

    window.dispatchEvent(
      new CustomEvent("rewardhub-open-support")
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 text-slate-950 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-2 sm:px-6 md:px-8 xl:px-10 2xl:px-12">
        <Link
  href={homeHref}
  className="flex min-w-0 shrink-0 items-center no-underline"
  aria-label={brandLabel}
>
  <img
  src="/logo/rewardhub-logo.png?v=6"
  alt="RewardHub"
  draggable={false}
  className="h-auto w-[155px] object-contain sm:w-[170px] md:w-[185px]"
/>
</Link>

        {showPortalControls && (
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
            {navItems.map((item) => (
              <DesktopLink
                key={item.href}
                href={item.href}
                active={isActivePath(pathname, item.href)}
              >
                {item.label}
              </DesktopLink>
            ))}
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {showPortalControls && (
            <>
              <IconLink
                href={notificationsHref}
                label={copy.notifications}
              >
                <Bell className="h-[18px] w-[18px]" />
              </IconLink>

              <IconLink
                href={securityHref}
                label={copy.security}
                desktopOnly
              >
                <ShieldCheck className="h-[18px] w-[18px]" />
              </IconLink>

              <IconLink
                href={profileHref}
                label={copy.profile}
                desktopOnly
              >
                <UserRound className="h-[18px] w-[18px]" />
              </IconLink>
            </>
          )}

          <SupportIconButton
            label={copy.openSupport}
            onClick={openSupport}
          />

          {showPortalControls && (
            <button
              type="button"
              onClick={() =>
                setMenuOpen((current) => !current)
              }
              aria-label={
                menuOpen
                  ? copy.closeMenu
                  : copy.openMenu
              }
              aria-expanded={menuOpen}
              aria-controls="portal-mobile-menu"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm transition hover:bg-slate-50 active:scale-95 xl:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {menuOpen && showPortalControls && (
        <nav
          id="portal-mobile-menu"
          className="max-h-[calc(100vh-72px)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-4 shadow-xl sm:px-6 xl:hidden"
        >
          <div className="mx-auto grid w-full max-w-3xl gap-2">
            {navItems.map((item) => (
              <MobileLink
                key={item.href}
                href={item.href}
                active={isActivePath(pathname, item.href)}
              >
                {item.label}
              </MobileLink>
            ))}

            <div className="my-2 h-px bg-slate-200" />

            <MobileLink
              href={notificationsHref}
              active={isActivePath(
                pathname,
                notificationsHref
              )}
            >
              {copy.notifications}
            </MobileLink>

            <MobileLink
              href={securityHref}
              active={isActivePath(
                pathname,
                securityHref
              )}
            >
              {copy.security}
            </MobileLink>

            <MobileLink
              href={profileHref}
              active={isActivePath(
                pathname,
                profileHref
              )}
            >
              {copy.profile}
            </MobileLink>
          </div>
        </nav>
      )}
    </header>
  );
}

function isActivePath(
  pathname: string,
  href: string
) {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function SupportIconButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-95"
    >
      <Headphones className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
    </button>
  );
}

function IconLink({
  href,
  label,
  children,
  desktopOnly = false,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  desktopOnly?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={[
        "h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95",
        desktopOnly ? "hidden sm:flex" : "flex",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function DesktopLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl px-3 text-xs font-black no-underline transition 2xl:px-4 2xl:text-sm",
        active
          ? "bg-slate-950 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex min-h-12 w-full items-center justify-center rounded-2xl px-5 py-3.5 text-center text-sm font-black no-underline transition active:scale-[0.98]",
        active
          ? "bg-slate-950 text-white"
          : "bg-slate-100 text-slate-950",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
