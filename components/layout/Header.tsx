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
import {
  usePathname,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLanguage,
} from "@/hooks/useLanguage";

type PortalType =
  | "member"
  | "business";

type NavItem = {
  href: string;
  label: string;
};

const APP_VARIANT: PortalType =
  process.env
    .NEXT_PUBLIC_APP_VARIANT ===
  "business"
    ? "business"
    : "member";

export default function Header() {
  const pathname =
    usePathname();

  const {
    language,
  } = useLanguage();

  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(false);

  const isBusiness =
    APP_VARIANT ===
    "business";

  const isAuthPage =
    pathname ===
      "/member/login" ||
    pathname ===
      "/merchant/login" ||
    pathname.includes(
      "/forgot-password"
    ) ||
    pathname.includes(
      "/reset-password"
    );

  const pageText = {
    en: {
      memberBrand:
        "RewardHub Member",

      businessBrand:
        "RewardHub Business",

      dashboard:
        "Dashboard",

      pay:
        "Pay",

      points:
        "Points",

      referral:
        "Referral",

      profile:
        "Profile",

      scan:
        "Scan",

      transactions:
        "Transactions",

      orders:
        "Orders",

      products:
        "Products",

      marketing:
        "Marketing",

      settlement:
        "Settlement",

      notifications:
        "Notifications",

      security:
        "Security",

      openMenu:
        "Open navigation menu",

      closeMenu:
        "Close navigation menu",

      openSupport:
        "Open RewardHub Support",
    },

    zh: {
      memberBrand:
        "RewardHub 会员版",

      businessBrand:
        "RewardHub 商家版",

      dashboard:
        "主页",

      pay:
        "付款",

      points:
        "积分",

      referral:
        "推荐",

      profile:
        "个人资料",

      scan:
        "扫码",

      transactions:
        "交易记录",

      orders:
        "订单",

      products:
        "商品",

      marketing:
        "营销预算",

      settlement:
        "结算",

      notifications:
        "通知",

      security:
        "安全中心",

      openMenu:
        "打开导航菜单",

      closeMenu:
        "关闭导航菜单",

      openSupport:
        "打开 RewardHub 客服",
    },

    ms: {
      memberBrand:
        "RewardHub Ahli",

      businessBrand:
        "RewardHub Perniagaan",

      dashboard:
        "Papan Pemuka",

      pay:
        "Bayar",

      points:
        "Mata",

      referral:
        "Rujukan",

      profile:
        "Profil",

      scan:
        "Imbas",

      transactions:
        "Transaksi",

      orders:
        "Pesanan",

      products:
        "Produk",

      marketing:
        "Pemasaran",

      settlement:
        "Penyelesaian",

      notifications:
        "Notifikasi",

      security:
        "Pusat Keselamatan",

      openMenu:
        "Buka menu navigasi",

      closeMenu:
        "Tutup menu navigasi",

      openSupport:
        "Buka Sokongan RewardHub",
    },
  } as const;

  const copy =
    pageText[
      language === "zh" ||
      language === "ms"
        ? language
        : "en"
    ];

  const navItems =
    useMemo<
      NavItem[]
    >(
      () =>
        isBusiness
          ? [
              {
                href:
                  "/merchant/dashboard",

                label:
                  copy.dashboard,
              },

              {
                href:
                  "/merchant/scan",

                label:
                  copy.scan,
              },

              {
                href:
                  "/merchant/transactions",

                label:
                  copy.transactions,
              },

              {
                href:
                  "/merchant/orders",

                label:
                  copy.orders,
              },

              {
                href:
                  "/merchant/products",

                label:
                  copy.products,
              },

              {
                href:
                  "/merchant/marketing",

                label:
                  copy.marketing,
              },

              {
                href:
                  "/merchant/settlement",

                label:
                  copy.settlement,
              },
            ]
          : [
              {
                href:
                  "/member/dashboard",

                label:
                  copy.dashboard,
              },

              {
                href:
                  "/member/pay",

                label:
                  copy.pay,
              },

              {
                href:
                  "/member/points",

                label:
                  copy.points,
              },

              {
                href:
                  "/member/referral",

                label:
                  copy.referral,
              },

              {
                href:
                  "/member/profile",

                label:
                  copy.profile,
              },
            ],
      [
        copy,
        isBusiness,
      ]
    );

  const homeHref =
    isBusiness
      ? "/merchant/dashboard"
      : "/member/dashboard";

  const profileHref =
    isBusiness
      ? "/merchant/profile"
      : "/member/profile";

  const securityHref =
    isBusiness
      ? "/merchant/security"
      : "/member/security";

  const notificationsHref =
    isBusiness
      ? "/merchant/notifications"
      : "/member/notifications";

  const brandLabel =
    isBusiness
      ? copy.businessBrand
      : copy.memberBrand;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleResize() {
      if (
        window.innerWidth >=
        1280
      ) {
        setMenuOpen(false);
      }
    }

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  function openSupport() {
    setMenuOpen(false);

    window.dispatchEvent(
      new CustomEvent(
        "rewardhub-open-support"
      )
    );
  }

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b backdrop-blur-xl",
        isBusiness
          ? "border-white/10 bg-slate-950/95 text-white"
          : "border-slate-200 bg-white/95 text-slate-950",
      ].join(" ")}
    >
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-2 sm:px-6 md:px-8 xl:px-10 2xl:px-12">
        <Link
          href={
            homeHref
          }
          className="flex min-w-0 shrink-0 items-center gap-3 no-underline"
          aria-label={
            brandLabel
          }
        >
          <span
            className={[
              "flex h-11 items-center rounded-xl p-2",
              isBusiness
                ? "bg-white"
                : "bg-slate-950",
            ].join(" ")}
          >
            <img
              src="/logo/rewardhub-logo.png"
              alt="RewardHub"
              className="h-7 w-auto object-contain"
            />
          </span>

          <span className="hidden min-w-0 sm:block">
            <span
              className={[
                "block truncate text-sm font-black",
                isBusiness
                  ? "text-white"
                  : "text-slate-950",
              ].join(" ")}
            >
              {
                brandLabel
              }
            </span>

            <span
              className={[
                "block text-[10px] font-bold uppercase tracking-[0.16em]",
                isBusiness
                  ? "text-slate-400"
                  : "text-slate-500",
              ].join(" ")}
            >
              {
                isBusiness
                  ? "Merchant Portal"
                  : "Member Portal"
              }
            </span>
          </span>
        </Link>

        {!isAuthPage && (
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
            {navItems.map(
              (
                item
              ) => (
                <DesktopLink
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  active={
                    isActivePath(
                      pathname,
                      item.href
                    )
                  }
                  business={
                    isBusiness
                  }
                >
                  {
                    item.label
                  }
                </DesktopLink>
              )
            )}
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {!isAuthPage && (
            <>
              <IconLink
                href={
                  notificationsHref
                }
                label={
                  copy.notifications
                }
                business={
                  isBusiness
                }
              >
                <Bell className="h-[18px] w-[18px]" />
              </IconLink>

              <IconLink
                href={
                  securityHref
                }
                label={
                  copy.security
                }
                business={
                  isBusiness
                }
                desktopOnly
              >
                <ShieldCheck className="h-[18px] w-[18px]" />
              </IconLink>

              <IconLink
                href={
                  profileHref
                }
                label={
                  copy.profile
                }
                business={
                  isBusiness
                }
                desktopOnly
              >
                <UserRound className="h-[18px] w-[18px]" />
              </IconLink>
            </>
          )}

          <SupportIconButton
            label={
              copy.openSupport
            }
            onClick={
              openSupport
            }
            business={
              isBusiness
            }
          />

          {!isAuthPage && (
            <button
              type="button"
              onClick={() =>
                setMenuOpen(
                  (
                    current
                  ) =>
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
              aria-controls="portal-mobile-menu"
              className={[
                "flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm transition active:scale-95 xl:hidden",
                isBusiness
                  ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                  : "border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
              ].join(" ")}
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

      {menuOpen &&
        !isAuthPage && (
          <nav
            id="portal-mobile-menu"
            className={[
              "max-h-[calc(100vh-72px)] overflow-y-auto border-t px-4 py-4 shadow-xl sm:px-6 xl:hidden",
              isBusiness
                ? "border-white/10 bg-slate-950"
                : "border-slate-200 bg-white",
            ].join(" ")}
          >
            <div className="mx-auto grid w-full max-w-3xl gap-2">
              {navItems.map(
                (
                  item
                ) => (
                  <MobileLink
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    active={
                      isActivePath(
                        pathname,
                        item.href
                      )
                    }
                    business={
                      isBusiness
                    }
                  >
                    {
                      item.label
                    }
                  </MobileLink>
                )
              )}

              <div
                className={[
                  "my-2 h-px",
                  isBusiness
                    ? "bg-white/10"
                    : "bg-slate-200",
                ].join(" ")}
              />

              <MobileLink
                href={
                  notificationsHref
                }
                active={
                  isActivePath(
                    pathname,
                    notificationsHref
                  )
                }
                business={
                  isBusiness
                }
              >
                {
                  copy.notifications
                }
              </MobileLink>

              <MobileLink
                href={
                  securityHref
                }
                active={
                  isActivePath(
                    pathname,
                    securityHref
                  )
                }
                business={
                  isBusiness
                }
              >
                {
                  copy.security
                }
              </MobileLink>

              <MobileLink
                href={
                  profileHref
                }
                active={
                  isActivePath(
                    pathname,
                    profileHref
                  )
                }
                business={
                  isBusiness
                }
              >
                {
                  copy.profile
                }
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
    pathname ===
      href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

function SupportIconButton({
  label,
  onClick,
  business,
}: {
  label: string;
  onClick: () => void;
  business: boolean;
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
        "group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition active:scale-95",
        business
          ? "border-white/15 bg-white/10 text-white hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-300"
          : "border-slate-200 bg-white text-slate-800 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700",
      ].join(" ")}
    >
      <Headphones className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
    </button>
  );
}

function IconLink({
  href,
  label,
  children,
  business,
  desktopOnly = false,
}: {
  href: string;
  label: string;
  children:
    React.ReactNode;
  business: boolean;
  desktopOnly?: boolean;
}) {
  return (
    <Link
      href={
        href
      }
      aria-label={
        label
      }
      title={
        label
      }
      className={[
        "h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition active:scale-95",
        desktopOnly
          ? "hidden sm:flex"
          : "flex",
        business
          ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
      ].join(" ")}
    >
      {
        children
      }
    </Link>
  );
}

function DesktopLink({
  href,
  children,
  active,
  business,
}: {
  href: string;
  children:
    React.ReactNode;
  active: boolean;
  business: boolean;
}) {
  const style =
    business
      ? active
        ? "bg-white text-slate-950"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
      : active
        ? "bg-slate-950 text-white"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950";

  return (
    <Link
      href={
        href
      }
      className={[
        "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl px-3 text-xs font-black no-underline transition 2xl:px-4 2xl:text-sm",
        style,
      ].join(" ")}
    >
      {
        children
      }
    </Link>
  );
}

function MobileLink({
  href,
  children,
  active,
  business,
}: {
  href: string;
  children:
    React.ReactNode;
  active: boolean;
  business: boolean;
}) {
  const style =
    business
      ? active
        ? "bg-white text-slate-950"
        : "bg-white/10 text-white"
      : active
        ? "bg-slate-950 text-white"
        : "bg-slate-100 text-slate-950";

  return (
    <Link
      href={
        href
      }
      className={[
        "flex min-h-12 w-full items-center justify-center rounded-2xl px-5 py-3.5 text-center text-sm font-black no-underline transition active:scale-[0.98]",
        style,
      ].join(" ")}
    >
      {
        children
      }
    </Link>
  );
}