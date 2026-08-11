"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  Bell,
  Headset,
  ShoppingCart,
} from "lucide-react";

import MemberBottomNav from "@/components/layout/MemberBottomNav";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

import {
  useLanguage,
} from "@/hooks/useLanguage";

import {
  getMemberUnreadNotificationCount,
} from "@/lib/api";

import {
  getMemberCartCount,
  MEMBER_CART_UPDATED_EVENT,
} from "@/lib/memberCart";

type StoredMember = {
  memberId?: string;
  MEMBER_ID?: string;
  id?: string;
  profile?: StoredMember;
  member?: StoredMember;
  data?: StoredMember;
};

function openCustomerSupport(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(
      "rewardhub-open-support"
    )
  );
}

function getMemberIdFromStorage():
  string {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  try {
    const raw =
      window.localStorage.getItem(
        "member"
      );

    if (!raw) {
      return "";
    }

    const parsed:
      StoredMember =
        JSON.parse(raw);

    return String(
      parsed?.memberId ??
        parsed?.MEMBER_ID ??
        parsed?.id ??
        parsed?.profile?.memberId ??
        parsed?.profile?.MEMBER_ID ??
        parsed?.member?.memberId ??
        parsed?.member?.MEMBER_ID ??
        parsed?.data?.memberId ??
        parsed?.data?.MEMBER_ID ??
        ""
    ).trim();
  } catch {
    return "";
  }
}

function unwrapData(
  result: unknown
): Record<
  string,
  unknown
> {
  if (
    !result ||
    typeof result !==
      "object"
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
    typeof root.data ===
      "object"
      ? (
          root.data as Record<
            string,
            unknown
          >
        )
      : root;

  return first.data &&
    typeof first.data ===
      "object"
    ? (
        first.data as Record<
          string,
          unknown
        >
      )
    : first;
}

export default function MemberLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const {
    t,
  } =
    useLanguage();

  const [
    unreadCount,
    setUnreadCount,
  ] =
    useState(0);

  const [
    cartCount,
    setCartCount,
  ] =
    useState(0);

  const loadUnreadCount =
    useCallback(
      async () => {
        const memberId =
          getMemberIdFromStorage();

        if (!memberId) {
          setUnreadCount(0);
          return;
        }

        try {
          const result =
            await getMemberUnreadNotificationCount(
              {
                memberId,
              }
            );

          const data =
            unwrapData(
              result
            );

          const nextCount =
            Number(
              data.unreadCount ??
                data.count ??
                0
            );

          setUnreadCount(
            Number.isFinite(
              nextCount
            )
              ? nextCount
              : 0
          );
        } catch {
          // Notifications must not block the portal.
        }
      },
      []
    );

  const refreshCartCount =
    useCallback(
      () => {
        setCartCount(
          getMemberCartCount()
        );
      },
      []
    );

  useEffect(() => {
    void loadUnreadCount();

    const handleNotificationUpdate =
      () => {
        void loadUnreadCount();
      };

    window.addEventListener(
      "rewardhub-notifications-updated",
      handleNotificationUpdate
    );

    window.addEventListener(
      "focus",
      handleNotificationUpdate
    );

    const interval =
      window.setInterval(
        handleNotificationUpdate,
        60000
      );

    return () => {
      window.removeEventListener(
        "rewardhub-notifications-updated",
        handleNotificationUpdate
      );

      window.removeEventListener(
        "focus",
        handleNotificationUpdate
      );

      window.clearInterval(
        interval
      );
    };
  }, [
    loadUnreadCount,
  ]);

  useEffect(() => {
    refreshCartCount();

    window.addEventListener(
      MEMBER_CART_UPDATED_EVENT,
      refreshCartCount
    );

    window.addEventListener(
      "storage",
      refreshCartCount
    );

    window.addEventListener(
      "focus",
      refreshCartCount
    );

    return () => {
      window.removeEventListener(
        MEMBER_CART_UPDATED_EVENT,
        refreshCartCount
      );

      window.removeEventListener(
        "storage",
        refreshCartCount
      );

      window.removeEventListener(
        "focus",
        refreshCartCount
      );
    };
  }, [
    refreshCartCount,
  ]);

  const badgeText =
    unreadCount > 99
      ? "99+"
      : String(
          unreadCount
        );

  const cartBadgeText =
    cartCount > 99
      ? "99+"
      : String(
          cartCount
        );

  const notificationLabel =
    unreadCount > 0
      ? t(
          "memberLayout.unreadNotifications",
          {
            count:
              unreadCount,
          }
        )
      : t(
          "navigation.notifications"
        );

  const headerButtonClass = [
    "relative inline-flex",
    "h-10 w-10",
    "items-center justify-center",
    "rounded-xl",
    "border border-slate-200",
    "bg-white",
    "text-slate-700",
    "shadow-sm",
    "transition",
    "hover:border-slate-300",
    "hover:bg-slate-50",
    "hover:text-slate-950",
    "hover:shadow-md",
    "active:scale-95",
    "sm:h-12 sm:w-12",
    "sm:rounded-2xl",
  ].join(" ");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-3 sm:h-20 sm:px-6 lg:h-24 lg:px-8 xl:px-12">
          <Link
  href="/member/dashboard"
  aria-label="RewardHub Member"
  className="flex min-w-0 shrink items-center no-underline"
>
  <div className="flex items-center overflow-hidden">
    <img
      src="/logo/rewardhub-member.png?v=2"
      alt="RewardHub Member"
      draggable={false}
      className="block h-9 w-auto max-w-[145px] object-contain sm:h-12 sm:max-w-[190px] lg:h-14 lg:max-w-[230px]"
    />
  </div>
</Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <LanguageSwitcher
              compact
              className={[
                "max-w-[118px]",
                "px-2 py-2",
                "sm:max-w-none",
                "sm:px-3",
              ].join(" ")}
            />

            <Link
              href="/member/cart"
              aria-label="Shopping Cart"
              title="Shopping Cart"
              className={
                headerButtonClass
              }
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />

              {cartCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-amber-500 px-1 text-[9px] font-black leading-none text-slate-950 shadow-sm sm:min-h-6 sm:min-w-6 sm:text-[10px]">
                  {
                    cartBadgeText
                  }
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={
                openCustomerSupport
              }
              aria-label={t(
                "memberLayout.customerSupport"
              )}
              title={t(
                "memberLayout.customerSupport"
              )}
              className={
                headerButtonClass
              }
            >
              <Headset className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <Link
              href="/member/notifications"
              aria-label={
                notificationLabel
              }
              title={t(
                "navigation.notifications"
              )}
              className={
                headerButtonClass
              }
            >
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />

              {unreadCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[9px] font-black leading-none text-white shadow-sm sm:min-h-6 sm:min-w-6 sm:text-[10px]">
                  {
                    badgeText
                  }
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <div className="min-h-[calc(100vh-64px)] pb-28 sm:min-h-[calc(100vh-80px)] sm:pb-32 lg:min-h-[calc(100vh-96px)] lg:pb-36">
        {children}
      </div>

      <MemberBottomNav />
    </div>
  );
}
