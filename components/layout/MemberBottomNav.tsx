"use client";

import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import {
  useLanguage,
} from "@/hooks/useLanguage";

type NavItem = {
  labelKey: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  {
    labelKey:
      "navigation.dashboard",
    href:
      "/member/dashboard",
    icon:
      "🏠",
  },
  {
    labelKey:
      "navigation.points",
    href:
      "/member/points",
    icon:
      "💳",
  },
  {
    labelKey:
      "navigation.pay",
    href:
      "/member/pay",
    icon:
      "💰",
  },
  {
    labelKey:
      "navigation.transactions",
    href:
      "/member/transactions",
    icon:
      "📜",
  },
  {
    labelKey:
      "navigation.commission",
    href:
      "/member/commission",
    icon:
      "👥",
  },
  {
    labelKey:
      "navigation.profile",
    href:
      "/member/profile",
    icon:
      "👤",
  },
];

export default function MemberBottomNav() {
  const pathname =
    usePathname();

  const {
    t,
  } = useLanguage();

  function isActive(
    href: string
  ) {
    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  return (
    <nav
      aria-label={t(
        "memberBottomNav.navigation"
      )}
      className="
        fixed bottom-0 left-0 right-0 z-50
        border-t border-slate-200
        bg-white/95
        px-2 pt-2
        pb-[max(8px,env(safe-area-inset-bottom))]
        shadow-[0_-10px_35px_rgba(15,23,42,0.12)]
        backdrop-blur-xl

        lg:bottom-5
        lg:left-1/2
        lg:right-auto
        lg:w-[620px]
        lg:max-w-[92vw]
        lg:-translate-x-1/2
        lg:rounded-[2rem]
        lg:border
        lg:px-3
        lg:pb-3
        lg:pt-3
        lg:shadow-[0_20px_50px_rgba(15,23,42,0.20)]
      "
    >
      <div className="grid w-full grid-cols-6 gap-1 lg:gap-2">
        {navItems.map(
          (item) => {
            const active =
              isActive(
                item.href
              );

            const label =
              t(
                item.labelKey
              );

            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                aria-label={
                  label
                }
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                className={`
                  flex min-w-0 flex-col
                  items-center justify-center
                  rounded-2xl px-1 py-2
                  text-center no-underline
                  transition active:scale-95
                  lg:px-2 lg:py-3
                  ${
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                  }
                `}
              >
                <span
                  aria-hidden="true"
                  className="text-lg leading-none sm:text-xl lg:text-2xl"
                >
                  {
                    item.icon
                  }
                </span>

                <span className="mt-1 block w-full truncate text-[9px] font-black leading-none sm:text-[10px] lg:text-[11px]">
                  {
                    label
                  }
                </span>
              </Link>
            );
          }
        )}
      </div>
    </nav>
  );
}