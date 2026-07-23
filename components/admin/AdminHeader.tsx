"use client";

import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useAdminAuth } from "./AdminRouteGuard";

type AdminHeaderProps = {
  onMenuOpen: () => void;
};

export default function AdminHeader({
  onMenuOpen,
}: AdminHeaderProps) {
  const {
    admin,
    signOut,
  } = useAdminAuth();

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const dropdownRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    await signOut();
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center border-b border-white/[0.07] bg-slate-950/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open admin menu"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-slate-400 transition hover:bg-white/[0.07] hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-600" />

          <input
            type="search"
            disabled
            placeholder="Global search will be available soon"
            className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.035] pl-11 pr-4 text-sm text-slate-300 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            disabled
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-slate-500 disabled:cursor-not-allowed"
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </button>

          <div
            ref={dropdownRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() =>
                setProfileOpen(
                  (current) =>
                    !current
                )
              }
              className="flex h-11 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-2 transition hover:bg-white/[0.065] sm:pr-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold uppercase text-slate-950">
                {getInitials(
                  admin.fullName
                )}
              </div>

              <div className="hidden min-w-0 text-left sm:block">
                <p className="max-w-32 truncate text-xs font-medium text-white">
                  {admin.fullName}
                </p>

                <p className="mt-0.5 max-w-32 truncate text-[10px] text-slate-500">
                  {formatRole(
                    admin.role
                  )}
                </p>
              </div>

              <ChevronDown
                className={[
                  "hidden h-4 w-4 text-slate-500 transition sm:block",
                  profileOpen
                    ? "rotate-180"
                    : "",
                ].join(" ")}
              />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-[calc(100%+10px)] w-72 overflow-hidden rounded-2xl border border-white/[0.09] bg-slate-900 shadow-2xl shadow-black/40">
                <div className="border-b border-white/[0.07] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                      <ShieldCheck className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {
                          admin.fullName
                        }
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {admin.email}
                      </p>

                      <span className="mt-2 inline-flex rounded-md border border-emerald-400/15 bg-emerald-400/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                        {formatRole(
                          admin.role
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    disabled
                    className="flex h-11 w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 text-left text-sm text-slate-600"
                  >
                    <UserRound className="h-[18px] w-[18px]" />
                    Admin Profile
                  </button>

                  <button
                    type="button"
                    disabled
                    className="flex h-11 w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 text-left text-sm text-slate-600"
                  >
                    <Settings className="h-[18px] w-[18px]" />
                    Account Settings
                  </button>
                </div>

                <div className="border-t border-white/[0.07] p-2">
                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={
                      handleLogout
                    }
                    className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LogOut className="h-[18px] w-[18px]" />

                    {loggingOut
                      ? "Signing out…"
                      : "Sign out"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
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