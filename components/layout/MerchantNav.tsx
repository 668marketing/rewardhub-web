"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Logo from "@/components/ui/Logo";
import SessionTimeout from "@/components/auth/SessionTimeout";
import {
  getMerchantUnreadNotificationCount,
} from "@/lib/api";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const primaryItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/merchant/dashboard",
    icon: "🏠",
  },
  {
    label: "Collect",
    href: "/merchant/collect",
    icon: "💳",
  },
  {
    label: "Products",
    href: "/merchant/products",
    icon: "📦",
  },
  {
    label: "Transactions",
    href: "/merchant/transactions",
    icon: "📄",
  },
  {
    label: "Settlement",
    href: "/merchant/settlement",
    icon: "💰",
  },
  {
    label: "Marketing",
    href: "/merchant/marketing-fund",
    icon: "📢",
  },
];

const moreItems: NavItem[] = [
  {
    label: "Gallery",
    href: "/merchant/gallery",
    icon: "🖼️",
  },
  {
    label: "Reviews",
    href: "/merchant/reviews",
    icon: "⭐",
  },
  {
    label: "Profile",
    href: "/merchant/profile",
    icon: "⚙️",
  },
];

const mobilePrimaryItems: NavItem[] = [
  {
    label: "Home",
    href: "/merchant/dashboard",
    icon: "🏠",
  },
  {
    label: "Collect",
    href: "/merchant/collect",
    icon: "💳",
  },
  {
    label: "Products",
    href: "/merchant/products",
    icon: "📦",
  },
  {
    label: "Transactions",
    href: "/merchant/transactions",
    icon: "📄",
  },
];

function getMerchantIdFromStorage() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const raw =
      window.localStorage.getItem(
        "merchant"
      );

    if (!raw) {
      return "";
    }

    const parsed: any =
      JSON.parse(raw);

    const candidate =
      parsed?.merchant ??
      parsed?.data ??
      parsed;

    return String(
      candidate?.merchantId ??
        candidate?.MERCHANT_ID ??
        candidate?.id ??
        ""
    ).trim();
  } catch {
    return "";
  }
}

function unwrapData(
  result: unknown
): Record<string, unknown> {
  if (
    !result ||
    typeof result !== "object"
  ) {
    return {};
  }

  const root =
    result as Record<
      string,
      unknown
    >;

  const first =
    root.data &&
    typeof root.data === "object"
      ? (root.data as Record<
          string,
          unknown
        >)
      : root;

  return first.data &&
    typeof first.data === "object"
    ? (first.data as Record<
        string,
        unknown
      >)
    : first;
}

export default function MerchantNav() {
  const pathname = usePathname();

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    desktopMoreOpen,
    setDesktopMoreOpen,
  ] = useState(false);

  const [
    mobileMoreOpen,
    setMobileMoreOpen,
  ] = useState(false);

  const desktopMoreRef =
    useRef<HTMLDivElement>(null);

  const mobileMoreRef =
    useRef<HTMLDivElement>(null);

  function isActive(href: string) {
    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  const moreActive =
    moreItems.some((item) =>
      isActive(item.href)
    );

  const notificationActive =
    isActive(
      "/merchant/notifications"
    );

  const loadUnreadCount =
    useCallback(async () => {
      const merchantId =
        getMerchantIdFromStorage();

      if (!merchantId) {
        setUnreadCount(0);
        return;
      }

      try {
        const result =
          await getMerchantUnreadNotificationCount(
            {
              merchantId,
            }
          );

        const data =
          unwrapData(result);

        setUnreadCount(
          Number(
            data.unreadCount || 0
          )
        );
      } catch (error) {
        console.error(
          "Unable to load merchant notification count:",
          error
        );
      }
    }, []);

  useEffect(() => {
    loadUnreadCount();

    const handleNotificationChange =
      () => {
        loadUnreadCount();
      };

    window.addEventListener(
      "rewardhub-notifications-updated",
      handleNotificationChange
    );

    const interval =
      window.setInterval(
        loadUnreadCount,
        60000
      );

    return () => {
      window.removeEventListener(
        "rewardhub-notifications-updated",
        handleNotificationChange
      );

      window.clearInterval(
        interval
      );
    };
  }, [
    loadUnreadCount,
    pathname,
  ]);

  useEffect(() => {
    setDesktopMoreOpen(false);
    setMobileMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        desktopMoreRef.current &&
        !desktopMoreRef.current.contains(
          target
        )
      ) {
        setDesktopMoreOpen(false);
      }

      if (
        mobileMoreRef.current &&
        !mobileMoreRef.current.contains(
          target
        )
      ) {
        setMobileMoreOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );
    };
  }, []);

  return (
    <>
      <SessionTimeout
        storageKey="merchant"
        loginPath="/merchant/login"
      />

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:h-[72px] sm:px-6 md:px-8 xl:px-10">
          <Link
            href="/merchant/dashboard"
            className="flex shrink-0 items-center no-underline"
          >
            <Logo
              type="merchant"
              className="h-9 w-auto max-w-[145px] object-contain sm:h-10 sm:max-w-[170px] xl:max-w-[185px]"
            />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1.5 lg:flex">
            {primaryItems.map(
              (item) => {
                const active =
                  isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[12px] font-black no-underline transition xl:px-3 xl:text-[13px] ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <span className="text-sm leading-none">
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>
                  </Link>
                );
              }
            )}

            <div
              ref={desktopMoreRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setDesktopMoreOpen(
                    (open) => !open
                  )
                }
                aria-expanded={
                  desktopMoreOpen
                }
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[12px] font-black transition xl:px-3 xl:text-[13px] ${
                  moreActive
                    ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <span className="text-base leading-none">
                  ⋯
                </span>

                <span>More</span>

                <span
                  className={`text-[10px] transition ${
                    desktopMoreOpen
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {desktopMoreOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                  <div className="px-3 pb-2 pt-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      More tools
                    </p>
                  </div>

                  {moreItems.map(
                    (item) => {
                      const active =
                        isActive(
                          item.href
                        );

                      return (
                        <Link
                          key={
                            item.href
                          }
                          href={
                            item.href
                          }
                          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-black no-underline transition ${
                            active
                              ? "bg-slate-950 text-white"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                          }`}
                        >
                          <span className="text-base">
                            {
                              item.icon
                            }
                          </span>

                          <span>
                            {
                              item.label
                            }
                          </span>
                        </Link>
                      );
                    }
                  )}
                </div>
              ) : null}
            </div>

            <Link
              href="/merchant/notifications"
              aria-label="Notifications"
              aria-current={
                notificationActive
                  ? "page"
                  : undefined
              }
              className={`relative ml-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg no-underline transition ${
                notificationActive
                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <span aria-hidden="true">
                🔔
              </span>

              {unreadCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              ) : null}
            </Link>
          </nav>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid w-full max-w-xl grid-cols-6 gap-1">
          {mobilePrimaryItems.map(
            (item) => {
              const active =
                isActive(
                  item.href
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`flex min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-center no-underline transition active:scale-95 ${
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span className="text-lg leading-none">
                    {item.icon}
                  </span>

                  <span className="mt-1 block w-full truncate text-[9px] font-black leading-none sm:text-[10px]">
                    {item.label}
                  </span>
                </Link>
              );
            }
          )}

          <Link
            href="/merchant/notifications"
            aria-current={
              notificationActive
                ? "page"
                : undefined
            }
            className={`relative flex min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-center no-underline transition active:scale-95 ${
              notificationActive
                ? "bg-slate-950 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <span className="relative text-lg leading-none">
              🔔

              {unreadCount > 0 ? (
                <span className="absolute -right-3 -top-3 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black leading-none text-white ring-2 ring-white">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              ) : null}
            </span>

            <span className="mt-1 block w-full truncate text-[9px] font-black leading-none sm:text-[10px]">
              Alerts
            </span>
          </Link>

          <div
            ref={mobileMoreRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() =>
                setMobileMoreOpen(
                  (open) => !open
                )
              }
              className={`flex h-full w-full min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-center transition active:scale-95 ${
                moreActive ||
                mobileMoreOpen
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              

              <span className="mt-1 block w-full truncate text-[9px] font-black leading-none sm:text-[10px]">
                More
              </span>
            </button>

            {mobileMoreOpen ? (
              <div className="absolute bottom-[calc(100%+12px)] right-0 w-60 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
                <div className="px-3 pb-2 pt-1 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Merchant tools
                  </p>
                </div>

                {[
                  {
                    label:
                      "Settlement",
                    href:
                      "/merchant/settlement",
                    icon: "💰",
                  },
                  {
                    label:
                      "Marketing",
                    href:
                      "/merchant/marketing-fund",
                    icon: "📢",
                  },
                  ...moreItems,
                ].map((item) => {
                  const active =
                    isActive(
                      item.href
                    );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black no-underline transition ${
                        active
                          ? "bg-slate-950 text-white"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      <span className="text-base">
                        {item.icon}
                      </span>

                      <span>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </>
  );
}