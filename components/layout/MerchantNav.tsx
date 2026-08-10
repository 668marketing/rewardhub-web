"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bell,
  Check,
  Headset,
  Languages,
  MoreHorizontal,
} from "lucide-react";

import Logo from "@/components/ui/Logo";
import SessionTimeout from "@/components/auth/SessionTimeout";
import {
  getMerchantUnreadNotificationCount,
} from "@/lib/api";

type NavLabelKey =
  | "marketing"
  | "collect"
  | "dashboard"
  | "orders"
  | "transactions"
  | "settlement"
  | "products"
  | "gallery"
  | "reviews"
  | "terminal"
  | "profile";

type NavItem = {
  labelKey: NavLabelKey;
  href: string;
  icon: string;
};

type LanguageCode = "en" | "zh" | "ms";

type LanguageOption = {
  code: LanguageCode;
  label: string;
  htmlLang: string;
};

const LANGUAGE_STORAGE_KEY =
  "rewardhub-language";

const languageOptions: LanguageOption[] = [
  {
    code: "en",
    label: "English",
    htmlLang: "en",
  },
  {
    code: "zh",
    label: "中文",
    htmlLang: "zh-CN",
  },
  {
    code: "ms",
    label: "Bahasa Melayu",
    htmlLang: "ms",
  },
];

const navCopy = {
  en: {
    marketing: "Marketing",
    collect: "Collect",
    dashboard: "Dashboard",
    orders: "Orders",
    transactions: "Transactions",
    settlement: "Settlement",
    products: "Products",
    gallery: "Gallery",
    reviews: "Reviews",
    terminal: "Terminal",
    profile: "Profile",
    more: "More",
    moreTools: "More tools",
    merchantTools: "Merchant tools",
    openMore: "Open more merchant tools",
    changeLanguage: "Change language",
    language: "Language",
    customerSupport: "Customer Support",
    openCustomerSupport: "Open customer support",
    notifications: "Notifications",
    unreadNotifications: "{{count}} unread notifications",
  },
  zh: {
    marketing: "营销",
    collect: "收款",
    dashboard: "主页",
    orders: "订单",
    transactions: "交易记录",
    settlement: "结算",
    products: "商品",
    gallery: "图片库",
    reviews: "评价",
    terminal: "感应机",
    profile: "商家资料",
    more: "更多",
    moreTools: "更多功能",
    merchantTools: "商家功能",
    openMore: "打开更多商家功能",
    changeLanguage: "切换语言",
    language: "语言",
    customerSupport: "客户服务",
    openCustomerSupport: "打开客户服务",
    notifications: "通知",
    unreadNotifications: "{{count}} 条未读通知",
  },
  ms: {
    marketing: "Pemasaran",
    collect: "Terima Bayaran",
    dashboard: "Papan Pemuka",
    orders: "Pesanan",
    transactions: "Transaksi",
    settlement: "Penyelesaian",
    products: "Produk",
    gallery: "Galeri",
    reviews: "Ulasan",
    terminal: "Terminal",
    profile: "Profil",
    more: "Lagi",
    moreTools: "Lebih banyak fungsi",
    merchantTools: "Fungsi peniaga",
    openMore: "Buka lebih banyak fungsi peniaga",
    changeLanguage: "Tukar bahasa",
    language: "Bahasa",
    customerSupport: "Khidmat Pelanggan",
    openCustomerSupport: "Buka khidmat pelanggan",
    notifications: "Notifikasi",
    unreadNotifications: "{{count}} notifikasi belum dibaca",
  },
} as const;

const primaryItems: NavItem[] = [
  {
    labelKey: "marketing",
    href: "/merchant/marketing-fund",
    icon: "📢",
  },
  {
    labelKey: "collect",
    href: "/merchant/collect",
    icon: "💳",
  },
  {
    labelKey: "dashboard",
    href: "/merchant/dashboard",
    icon: "🏠",
  },
  {
    labelKey: "orders",
    href: "/merchant/orders",
    icon: "🛍️",
  },
  {
    labelKey: "transactions",
    href: "/merchant/transactions",
    icon: "📄",
  },
  {
    labelKey: "settlement",
    href: "/merchant/settlement",
    icon: "💰",
  },
  {
    labelKey: "products",
    href: "/merchant/products",
    icon: "📦",
  },
];

const moreItems: NavItem[] = [
  {
    labelKey: "gallery",
    href: "/merchant/gallery",
    icon: "🖼️",
  },
  {
    labelKey: "reviews",
    href: "/merchant/reviews",
    icon: "⭐",
  },
  {
    labelKey: "terminal",
    href: "/merchant/terminal",
    icon: "📟",
  },
  {
    labelKey: "profile",
    href: "/merchant/profile",
    icon: "⚙️",
  },
];

const mobilePrimaryItems: NavItem[] = [
  {
    labelKey: "marketing",
    href: "/merchant/marketing-fund",
    icon: "📢",
  },
  {
    labelKey: "collect",
    href: "/merchant/collect",
    icon: "💳",
  },
  {
    labelKey: "dashboard",
    href: "/merchant/dashboard",
    icon: "🏠",
  },
  {
    labelKey: "transactions",
    href: "/merchant/transactions",
    icon: "📄",
  },
  {
    labelKey: "settlement",
    href: "/merchant/settlement",
    icon: "💰",
  },
];

function getStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored =
    window.localStorage.getItem(
      LANGUAGE_STORAGE_KEY
    );

  return languageOptions.some(
    (option) => option.code === stored
  )
    ? (stored as LanguageCode)
    : "en";
}

function applyLanguage(
  language: LanguageCode
): void {
  if (typeof window === "undefined") {
    return;
  }

  const option =
    languageOptions.find(
      (item) => item.code === language
    ) ?? languageOptions[0];

  window.localStorage.setItem(
    LANGUAGE_STORAGE_KEY,
    option.code
  );

  document.documentElement.lang =
    option.htmlLang;

  window.dispatchEvent(
    new CustomEvent(
      "rewardhub-language-change",
      {
        detail: {
          language: option.code,
        },
      }
    )
  );
}

function openCustomerSupport(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("rewardhub-open-support")
  );
}

function getMerchantIdFromStorage(): string {
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

    const parsed = JSON.parse(raw);

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
    result as Record<string, unknown>;

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
  const pathname =
    usePathname() || "";

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


  const [
    languageOpen,
    setLanguageOpen,
  ] = useState(false);

  const [
    currentLanguage,
    setCurrentLanguage,
  ] = useState<LanguageCode>("en");

  const copy = navCopy[currentLanguage];

  const desktopMoreRef =
    useRef<HTMLDivElement>(null);

  const mobileMoreRef =
    useRef<HTMLDivElement>(null);


  const desktopLanguageRef =
    useRef<HTMLDivElement>(null);

  const mobileLanguageRef =
    useRef<HTMLDivElement>(null);

  function isActive(
    href: string
  ): boolean {
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

        const nextCount =
          Number(
            data.unreadCount ??
              data.count ??
              0
          );

        setUnreadCount(
          Number.isFinite(nextCount)
            ? nextCount
            : 0
        );
      } catch (error) {
        console.error(
          "Unable to load merchant notification count:",
          error
        );
      }
    }, []);

  useEffect(() => {
    const storedLanguage =
      getStoredLanguage();

    setCurrentLanguage(
      storedLanguage
    );

    applyLanguage(
      storedLanguage
    );

    const handleLanguageChange = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<{
          language?: LanguageCode;
        }>;

      const nextLanguage =
        customEvent.detail?.language;

      if (
        nextLanguage &&
        languageOptions.some(
          (option) =>
            option.code ===
            nextLanguage
        )
      ) {
        setCurrentLanguage(
          nextLanguage
        );
      }
    };

    window.addEventListener(
      "rewardhub-language-change",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "rewardhub-language-change",
        handleLanguageChange
      );
    };
  }, []);

  useEffect(() => {
    void loadUnreadCount();

    const handleNotificationChange =
      () => {
        void loadUnreadCount();
      };

    window.addEventListener(
      "rewardhub-notifications-updated",
      handleNotificationChange
    );

    window.addEventListener(
      "focus",
      handleNotificationChange
    );

    const interval =
      window.setInterval(
        handleNotificationChange,
        60000
      );

    return () => {
      window.removeEventListener(
        "rewardhub-notifications-updated",
        handleNotificationChange
      );

      window.removeEventListener(
        "focus",
        handleNotificationChange
      );

      window.clearInterval(
        interval
      );
    };
  }, [loadUnreadCount]);

  useEffect(() => {
    setDesktopMoreOpen(false);
    setMobileMoreOpen(false);
    setLanguageOpen(false);
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


      if (
        desktopLanguageRef.current &&
        !desktopLanguageRef.current.contains(
          target
        ) &&
        mobileLanguageRef.current &&
        !mobileLanguageRef.current.contains(
          target
        )
      ) {
        setLanguageOpen(false);
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

  const badgeText =
    unreadCount > 99
      ? "99+"
      : String(unreadCount);

  const headerIconClass =
    "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 hover:shadow-md active:scale-95 sm:h-11 sm:w-11";

  return (
    <>
      <SessionTimeout
        storageKey="merchant"
        loginPath="/merchant/login"
      />

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:h-[72px] sm:px-6 md:px-8 xl:px-10">
          {/* Logo */}
          <Link
            href="/merchant/dashboard"
            className="flex shrink-0 items-center no-underline"
          >
            <Logo
              type="merchant"
              className="h-9 w-auto max-w-[145px] object-contain sm:h-10 sm:max-w-[170px] xl:max-w-[185px]"
            />
          </Link>

          {/* Desktop navigation */}
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
                      {copy[item.labelKey]}
                    </span>
                  </Link>
                );
              }
            )}

            {/* Desktop More */}
            <div
              ref={desktopMoreRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => {
                  setDesktopMoreOpen(
                    (open) => !open
                  );
                }}
                aria-expanded={
                  desktopMoreOpen
                }
                aria-label={copy.openMore}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[12px] font-black transition xl:px-3 xl:text-[13px] ${
                  moreActive
                    ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <MoreHorizontal className="h-4 w-4" />

                <span>{copy.more}</span>

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
                      {copy.moreTools}
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
                              copy[item.labelKey]
                            }
                          </span>
                        </Link>
                      );
                    }
                  )}
                </div>
              ) : null}
            </div>

            {/* Language switcher */}
            <div
              ref={desktopLanguageRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => {
                  setLanguageOpen(
                    (open) => !open
                  );
                  setDesktopMoreOpen(false);
                  setMobileMoreOpen(false);
                }}
                aria-expanded={
                  languageOpen
                }
                aria-haspopup="menu"
                aria-label={copy.changeLanguage}
                title={copy.language}
                className={
                  headerIconClass
                }
              >
                <Languages className="h-5 w-5" />
              </button>

              {languageOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+10px)] w-44 overflow-hidden rounded-xl border border-slate-300 bg-slate-700 p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.28)]"
                >
                  {languageOptions.map(
                    (option) => {
                      const selected =
                        currentLanguage ===
                        option.code;

                      return (
                        <button
                          key={
                            option.code
                          }
                          type="button"
                          role="menuitemradio"
                          aria-checked={
                            selected
                          }
                          onClick={() => {
                            setCurrentLanguage(
                              option.code
                            );
                            applyLanguage(
                              option.code
                            );
                            setLanguageOpen(
                              false
                            );
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition ${
                            selected
                              ? "bg-white/10 text-white"
                              : "text-white hover:bg-white/10"
                          }`}
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                            {selected ? (
                              <Check className="h-4 w-4" />
                            ) : null}
                          </span>

                          <span>
                            {
                              option.label
                            }
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              ) : null}
            </div>

            {/* Desktop customer support */}
            <button
              type="button"
              onClick={
                openCustomerSupport
              }
              aria-label={copy.openCustomerSupport}
              title={copy.customerSupport}
              className={
                headerIconClass
              }
            >
              <Headset className="h-5 w-5" />
            </button>

            {/* Desktop notifications */}
            <Link
              href="/merchant/notifications"
              aria-label={
                unreadCount > 0
                  ? copy.unreadNotifications.replace("{{count}}", String(unreadCount))
                  : copy.notifications
              }
              aria-current={
                notificationActive
                  ? "page"
                  : undefined
              }
              className={`${headerIconClass} ${
                notificationActive
                  ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-900 hover:text-white"
                  : ""
              }`}
            >
              <Bell className="h-5 w-5" />

              {unreadCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                  {badgeText}
                </span>
              ) : null}
            </Link>
          </nav>

          {/* Mobile top-right support and notifications */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <div
              ref={mobileLanguageRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => {
                  setLanguageOpen(
                    (open) => !open
                  );
                  setDesktopMoreOpen(false);
                  setMobileMoreOpen(false);
                }}
                aria-expanded={
                  languageOpen
                }
                aria-haspopup="menu"
                aria-label={copy.changeLanguage}
                title={copy.language}
                className={
                  headerIconClass
                }
              >
                <Languages className="h-5 w-5" />
              </button>

              {languageOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+10px)] w-44 overflow-hidden rounded-xl border border-slate-300 bg-slate-700 p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.28)]"
                >
                  {languageOptions.map(
                    (option) => {
                      const selected =
                        currentLanguage ===
                        option.code;

                      return (
                        <button
                          key={
                            option.code
                          }
                          type="button"
                          role="menuitemradio"
                          aria-checked={
                            selected
                          }
                          onClick={() => {
                            setCurrentLanguage(
                              option.code
                            );
                            applyLanguage(
                              option.code
                            );
                            setLanguageOpen(
                              false
                            );
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition ${
                            selected
                              ? "bg-white/10 text-white"
                              : "text-white hover:bg-white/10"
                          }`}
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                            {selected ? (
                              <Check className="h-4 w-4" />
                            ) : null}
                          </span>

                          <span>
                            {
                              option.label
                            }
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={
                openCustomerSupport
              }
              aria-label={copy.openCustomerSupport}
              title={copy.customerSupport}
              className={
                headerIconClass
              }
            >
              <Headset className="h-5 w-5" />
            </button>

            <Link
              href="/merchant/notifications"
              aria-label={
                unreadCount > 0
                  ? copy.unreadNotifications.replace("{{count}}", String(unreadCount))
                  : copy.notifications
              }
              aria-current={
                notificationActive
                  ? "page"
                  : undefined
              }
              className={`${headerIconClass} ${
                notificationActive
                  ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-900 hover:text-white"
                  : ""
              }`}
            >
              <Bell className="h-5 w-5" />

              {unreadCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white">
                  {badgeText}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid w-full max-w-xl grid-cols-6 gap-1">
          {mobilePrimaryItems.map(
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
                    {copy[item.labelKey]}
                  </span>
                </Link>
              );
            }
          )}

          {/* Mobile More */}
          <div
            ref={mobileMoreRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() => {
                setMobileMoreOpen(
                  (open) => !open
                );
              }}
              aria-expanded={
                mobileMoreOpen
              }
              aria-label={copy.openMore}
              className={`flex h-full w-full min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-center transition active:scale-95 ${
                moreActive ||
                mobileMoreOpen
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <MoreHorizontal className="h-[18px] w-[18px]" />

              <span className="mt-1 block w-full truncate text-[9px] font-black leading-none sm:text-[10px]">
                {copy.more}
              </span>
            </button>

            {mobileMoreOpen ? (
              <div className="absolute bottom-[calc(100%+12px)] right-0 w-60 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
                <div className="px-3 pb-2 pt-1 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {copy.merchantTools}
                  </p>
                </div>

                {[
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
                        {copy[item.labelKey]}
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