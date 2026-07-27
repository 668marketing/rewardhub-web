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
} from "lucide-react";

import MemberBottomNav from "@/components/layout/MemberBottomNav";
import MemberGuard from "@/components/auth/MemberGuard";
import SessionTimeout from "@/components/auth/SessionTimeout";
import {
  getMemberUnreadNotificationCount,
} from "@/lib/api";

type StoredMember = {
  memberId?: string;
  MEMBER_ID?: string;
  id?: string;
  profile?: StoredMember;
  member?: StoredMember;
  data?: StoredMember;
};

function openCustomerSupport(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "rewardhub-open-support"
    )
  );
}

function getMemberIdFromStorage(): string {
  if (typeof window === "undefined") {
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

    const parsed: StoredMember =
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

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const loadUnreadCount =
    useCallback(async () => {
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
          unwrapData(result);

        const nextCount = Number(
          data.unreadCount ??
            data.count ??
            0
        );

        setUnreadCount(
          Number.isFinite(nextCount)
            ? nextCount
            : 0
        );
      } catch {
        // Notification refresh failure
        // should not block the portal.
      }
    }, []);

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
  }, [loadUnreadCount]);

  const badgeText =
    unreadCount > 99
      ? "99+"
      : String(unreadCount);

  const headerButtonClass =
    "relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-md active:scale-95 sm:h-12 sm:w-12";

  return (
    <MemberGuard>
      <SessionTimeout
        storageKey="member"
        loginPath="/login"
      />

      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:h-24 lg:px-8 xl:px-12">
            <Link
              href="/member/dashboard"
              className="flex min-w-0 items-center no-underline"
            >
              <img
                src="/logo/rewardhub-member.png"
                alt="RewardHub Member"
                className="block h-10 w-auto max-w-[170px] object-contain sm:h-12 sm:max-w-[210px] lg:h-16 lg:max-w-[280px]"
              />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={
                  openCustomerSupport
                }
                aria-label="Open customer support"
                title="Customer Support"
                className={
                  headerButtonClass
                }
              >
                <Headset className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              <Link
                href="/member/notifications"
                aria-label={
                  unreadCount > 0
                    ? `${unreadCount} unread notifications`
                    : "Notifications"
                }
                className={
                  headerButtonClass
                }
              >
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />

                {unreadCount > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[9px] font-black leading-none text-white shadow-sm sm:min-h-6 sm:min-w-6 sm:text-[10px]">
                    {badgeText}
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
    </MemberGuard>
  );
}