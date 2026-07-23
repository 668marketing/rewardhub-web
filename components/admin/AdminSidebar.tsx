"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  CreditCard,
  FileBarChart,
  Gift,
  LayoutDashboard,
  Megaphone,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  Star,
  Store,
  UserCog,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { useAdminAuth } from "./AdminRouteGuard";

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  permission?: string;
  available: boolean;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] =
  [
    {
      label: "Overview",
      items: [
        {
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
          permission:
            "dashboard.view",
          available: true,
        },
      ],
    },
    {
      label: "Network",
      items: [
        {
  label: "Members",
  href: "/admin/members",
  icon: Users,
  permission:
    "members.view",
  available: true,
},
        {
  label: "Merchants",
  href: "/admin/merchants",
  icon: Store,
  permission:
    "merchants.view",
  available: true,
},
        {
          label:
            "Merchant Applications",
          href:
            "/admin/merchant-applications",
          icon: Building2,
          permission:
            "merchants.manage",
          available: false,
        },
      ],
    },
    {
      label: "Finance",
      items: [
        {
          label: "Transactions",
          href: "/admin/transactions",
          icon: ReceiptText,
          permission:
            "transactions.view",
          available: false,
        },
        {
          label: "Settlements",
          href: "/admin/settlements",
          icon: WalletCards,
          permission:
            "settlements.view",
          available: false,
        },
        {
          label: "Marketing Budget",
          href: "/admin/marketing",
          icon: BarChart3,
          permission:
            "marketing.view",
          available: false,
        },
        {
          label: "Reward Credits",
          href:
            "/admin/reward-credits",
          icon: Gift,
          permission:
            "reward_credits.view",
          available: false,
        },
        {
          label: "Points",
          href: "/admin/points",
          icon: Star,
          permission:
            "points.view",
          available: false,
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          label:
            "Card Applications",
          href:
            "/admin/card-applications",
          icon: CreditCard,
          permission:
            "cards.view",
          available: false,
        },
        {
          label: "Products",
          href: "/admin/products",
          icon: Package,
          permission:
            "products.view",
          available: false,
        },
        {
          label: "Reviews",
          href: "/admin/reviews",
          icon: Star,
          permission:
            "reviews.view",
          available: false,
        },
        {
          label: "Notifications",
          href:
            "/admin/notifications",
          icon: Bell,
          permission:
            "notifications.view",
          available: false,
        },
        {
          label: "Campaigns",
          href: "/admin/campaigns",
          icon: Megaphone,
          permission:
            "marketing.view",
          available: false,
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          label: "Reports",
          href: "/admin/reports",
          icon: FileBarChart,
          permission:
            "reports.view",
          available: false,
        },
        {
          label: "Admin Users",
          href: "/admin/admin-users",
          icon: UserCog,
          permission:
            "admin_users.view",
          available: false,
        },
        {
          label: "Settings",
          href: "/admin/settings",
          icon: Settings,
          permission:
            "settings.view",
          available: false,
        },
      ],
    },
  ];

type AdminSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export default function AdminSidebar({
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const {
    admin,
    hasPermission,
  } = useAdminAuth();

  function isActive(
    href: string
  ) {
    if (
      href === "/admin/dashboard"
    ) {
      return (
        pathname ===
        "/admin/dashboard"
      );
    }

    return pathname.startsWith(
      href
    );
  }

  const sidebarContent = (
    <aside className="flex h-full w-[286px] flex-col border-r border-white/[0.07] bg-slate-950">
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
        <Link
          href="/admin/dashboard"
          onClick={onMobileClose}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div>
            <p className="font-semibold tracking-tight text-white">
              RewardHub
            </p>

            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.23em] text-slate-500">
              Administration
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {navigationGroups.map(
          (group) => {
            const visibleItems =
              group.items.filter(
                (item) =>
                  !item.permission ||
                  hasPermission(
                    item.permission
                  )
              );

            if (
              visibleItems.length === 0
            ) {
              return null;
            }

            return (
              <div
                key={group.label}
                className="mb-6"
              >
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {group.label}
                </p>

                <div className="space-y-1">
                  {visibleItems.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      const active =
                        isActive(
                          item.href
                        );

                      if (
                        !item.available
                      ) {
                        return (
                          <div
                            key={
                              item.href
                            }
                            className="group flex h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm text-slate-600"
                          >
                            <Icon className="h-[18px] w-[18px] shrink-0" />

                            <span className="min-w-0 flex-1 truncate">
                              {
                                item.label
                              }
                            </span>

                            <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-700">
                              Soon
                            </span>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={
                            item.href
                          }
                          href={
                            item.href
                          }
                          onClick={
                            onMobileClose
                          }
                          className={[
                            "group flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition",
                            active
                              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10"
                              : "text-slate-400 hover:bg-white/[0.055] hover:text-white",
                          ].join(" ")}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" />

                          <span className="min-w-0 flex-1 truncate font-medium">
                            {
                              item.label
                            }
                          </span>

                          {active ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : null}
                        </Link>
                      );
                    }
                  )}
                </div>
              </div>
            );
          }
        )}
      </nav>

      <div className="shrink-0 border-t border-white/[0.07] p-4">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-sm font-semibold uppercase text-emerald-300">
              {getInitials(
                admin.fullName
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {admin.fullName}
              </p>

              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                {formatRole(
                  admin.role
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        {sidebarContent}
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={onMobileClose}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          />

          <div className="absolute inset-y-0 left-0 shadow-2xl shadow-black/50">
            {sidebarContent}
          </div>
        </div>
      ) : null}
    </>
  );
}

function getInitials(
  fullName: string
) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "AD";
  }

  return parts
    .slice(0, 2)
    .map((part) =>
      part.charAt(0)
    )
    .join("")
    .toUpperCase();
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}