"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import SessionTimeout from "@/components/auth/SessionTimeout";

const items = [
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

export default function MerchantNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <SessionTimeout
        storageKey="merchant"
        loginPath="/merchant/login"
      />

      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-4 px-4 sm:h-20 sm:px-6 md:px-8 lg:h-24 xl:px-10">
          <Link
  href="/merchant/dashboard"
  className="flex shrink-0 items-center no-underline"
>
  <Logo
    type="merchant"
    className="h-10 w-auto max-w-[170px] object-contain sm:h-12 sm:max-w-[210px] lg:h-14 lg:max-w-[230px]"
  />
</Link>

          {/* Desktop navigation */}
          <nav className="hidden min-w-0 flex-1 items-center justify-end gap-2 overflow-x-auto pb-1 lg:flex">
            {items.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 whitespace-nowrap rounded-2xl border px-3 py-2.5 text-xs font-black no-underline shadow-sm transition xl:px-4 xl:py-3 xl:text-sm ${
  active
    ? "border-slate-950 bg-slate-950 text-white"
    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
}`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_35px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid w-full max-w-xl grid-cols-8 gap-1">
          {items.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-center no-underline transition active:scale-95 ${
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <span className="text-lg leading-none">
                  {item.icon}
                </span>

                <span className="mt-1 block w-full truncate text-[8px] font-black leading-none sm:text-[10px]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}