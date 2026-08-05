"use client";

import {
  Bell,
  ChevronDown,
  ChevronRight,
  Command,
  FileText,
  Gift,
  History,
  Loader2,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserCog,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  type AdminGlobalSearchData,
  type AdminGlobalSearchResult,
  searchAdminGlobal,
} from "@/lib/admin/admin-global-search";

import AdminNotificationDropdown from "./AdminNotificationDropdown";
import { useAdminAuth } from "./AdminRouteGuard";

type AdminHeaderProps = {
  onMenuOpen: () => void;
};

const EMPTY_SEARCH_RESULT: AdminGlobalSearchData = {
  query: "",
  minimumQueryLength: 2,
  total: 0,
  totalMatched: 0,
  results: [],
  groups: [],
};

export default function AdminHeader({
  onMenuOpen,
}: AdminHeaderProps) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const {
    admin,
    signOut,
  } = useAdminAuth();

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    searchResult,
    setSearchResult,
  ] =
    useState<AdminGlobalSearchData>(
      EMPTY_SEARCH_RESULT
    );

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    searchError,
    setSearchError,
  ] = useState("");

  const [
    activeResultIndex,
    setActiveResultIndex,
  ] = useState(-1);

  const dropdownRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const searchRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const searchInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const searchAbortRef =
    useRef<AbortController | null>(
      null
    );

  const normalizedQuery =
    searchQuery.trim();

  const minimumQueryLength =
    searchResult.minimumQueryLength ||
    2;

  const hasEnoughCharacters =
    normalizedQuery.length >=
    minimumQueryLength;

  const visibleResults =
    useMemo(
      () =>
        searchResult.results.slice(
          0,
          20
        ),
      [searchResult.results]
    );

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          target
        )
      ) {
        setProfileOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(
          target
        )
      ) {
        setSearchOpen(false);
        setActiveResultIndex(-1);
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

  useEffect(() => {
    function handleShortcut(
      event: KeyboardEvent
    ) {
      const isSearchShortcut =
        (
          event.metaKey ||
          event.ctrlKey
        ) &&
        event.key.toLowerCase() ===
          "k";

      if (
        isSearchShortcut
      ) {
        event.preventDefault();
        setSearchOpen(true);

        window.setTimeout(
          () => {
            searchInputRef.current?.focus();
          },
          0
        );
      }

      if (
        event.key === "Escape"
      ) {
        setSearchOpen(false);
        setProfileOpen(false);
        setActiveResultIndex(-1);
      }
    }

    window.addEventListener(
      "keydown",
      handleShortcut
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleShortcut
      );
    };
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setProfileOpen(false);
    setActiveResultIndex(-1);
  }, [pathname]);

  useEffect(() => {
    searchAbortRef.current?.abort();

    if (
      !normalizedQuery
    ) {
      setSearchResult(
        EMPTY_SEARCH_RESULT
      );
      setSearching(false);
      setSearchError("");
      setActiveResultIndex(-1);
      return;
    }

    if (
      normalizedQuery.length < 2
    ) {
      setSearchResult({
        ...EMPTY_SEARCH_RESULT,
        query:
          normalizedQuery,
      });
      setSearching(false);
      setSearchError("");
      setActiveResultIndex(-1);
      return;
    }

    const controller =
      new AbortController();

    searchAbortRef.current =
      controller;

    const timer =
      window.setTimeout(
        async () => {
          try {
            setSearching(true);
            setSearchError("");

            const result =
              await searchAdminGlobal(
                normalizedQuery,
                {
                  limit: 20,
                  signal:
                    controller.signal,
                }
              );

            if (
              controller.signal.aborted
            ) {
              return;
            }

            setSearchResult(
              result
            );

            setActiveResultIndex(
              result.results.length >
                0
                ? 0
                : -1
            );
          } catch (error) {
            if (
              controller.signal.aborted
            ) {
              return;
            }

            setSearchResult(
              EMPTY_SEARCH_RESULT
            );

            setSearchError(
              error instanceof Error
                ? error.message
                : "Unable to search RewardHub."
            );

            setActiveResultIndex(-1);
          } finally {
            if (
              !controller.signal.aborted
            ) {
              setSearching(false);
            }
          }
        },
        350
      );

    return () => {
      window.clearTimeout(
        timer
      );
      controller.abort();
    };
  }, [normalizedQuery]);

  const openSearch =
    useCallback(() => {
      setSearchOpen(true);

      window.setTimeout(
        () => {
          searchInputRef.current?.focus();
        },
        0
      );
    }, []);

  const closeSearch =
    useCallback(() => {
      setSearchOpen(false);
      setActiveResultIndex(-1);
    }, []);

  const openResult =
    useCallback(
      (
        result:
          AdminGlobalSearchResult
      ) => {
        if (!result.href) {
          return;
        }

        closeSearch();
        setSearchQuery("");
        setSearchResult(
          EMPTY_SEARCH_RESULT
        );

        router.push(
          result.href
        );
      },
      [
        closeSearch,
        router,
      ]
    );

  function handleSearchKeyDown(
    event:
      React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      !searchOpen
    ) {
      setSearchOpen(true);
    }

    if (
      visibleResults.length ===
      0
    ) {
      if (
        event.key === "Escape"
      ) {
        closeSearch();
      }

      return;
    }

    if (
      event.key ===
      "ArrowDown"
    ) {
      event.preventDefault();

      setActiveResultIndex(
        (current) =>
          current >=
          visibleResults.length -
            1
            ? 0
            : current + 1
      );
    }

    if (
      event.key ===
      "ArrowUp"
    ) {
      event.preventDefault();

      setActiveResultIndex(
        (current) =>
          current <= 0
            ? visibleResults.length -
              1
            : current - 1
      );
    }

    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      const result =
        visibleResults[
          activeResultIndex
        ];

      if (result) {
        openResult(result);
      }
    }

    if (
      event.key === "Escape"
    ) {
      closeSearch();
    }
  }

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

        <div
          ref={searchRef}
          className="relative hidden max-w-xl flex-1 md:block"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-[18px] w-[18px] -translate-y-1/2 text-slate-600" />

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={openSearch}
            onChange={(
              event
            ) => {
              setSearchQuery(
                event.target.value
              );
              setSearchOpen(true);
            }}
            onKeyDown={
              handleSearchKeyDown
            }
            placeholder="Search members, merchants, transactions..."
            className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.035] pl-11 pr-24 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-emerald-400/35 focus:bg-white/[0.05]"
          />

          <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md border border-white/[0.08] bg-slate-950/70 px-2 py-1 text-[10px] text-slate-500">
            <Command className="h-3 w-3" />
            K
          </div>

          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResult(
                  EMPTY_SEARCH_RESULT
                );
                setSearchError("");
                searchInputRef.current?.focus();
              }}
              className="absolute right-[58px] top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          {searchOpen ? (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl border border-white/[0.09] bg-slate-900 shadow-2xl shadow-black/45">
              <SearchPanel
                query={normalizedQuery}
                minimumQueryLength={
                  minimumQueryLength
                }
                searching={
                  searching
                }
                error={
                  searchError
                }
                results={
                  visibleResults
                }
                totalMatched={
                  searchResult.totalMatched
                }
                activeResultIndex={
                  activeResultIndex
                }
                onHoverResult={
                  setActiveResultIndex
                }
                onOpenResult={
                  openResult
                }
              />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={openSearch}
          aria-label="Open global search"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-slate-400 transition hover:bg-white/[0.07] hover:text-white md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        {searchOpen ? (
          <div className="fixed inset-0 z-50 bg-slate-950/95 p-4 backdrop-blur-xl md:hidden">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-600" />

                  <input
                    type="search"
                    autoFocus
                    value={
                      searchQuery
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    onKeyDown={
                      handleSearchKeyDown
                    }
                    placeholder="Search RewardHub..."
                    className="h-12 w-full rounded-2xl border border-white/[0.09] bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={
                    closeSearch
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.09] text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.09] bg-slate-900">
                <SearchPanel
                  query={
                    normalizedQuery
                  }
                  minimumQueryLength={
                    minimumQueryLength
                  }
                  searching={
                    searching
                  }
                  error={
                    searchError
                  }
                  results={
                    visibleResults
                  }
                  totalMatched={
                    searchResult.totalMatched
                  }
                  activeResultIndex={
                    activeResultIndex
                  }
                  onHoverResult={
                    setActiveResultIndex
                  }
                  onOpenResult={
                    openResult
                  }
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              setNotificationsOpen(
                (
                  current
                ) =>
                  !current
              );

              setProfileOpen(
                false
              );
            }}
            className={[
              "relative flex h-11 w-11 items-center justify-center rounded-xl border transition",
              notificationsOpen
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : "border-white/[0.07] bg-white/[0.035] text-slate-500 hover:bg-white/[0.065] hover:text-white",
            ].join(" ")}
          >
            <Bell className="h-5 w-5" />
          </button>

          <div
            ref={dropdownRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() => {
                setProfileOpen(
                  (
                    current
                  ) =>
                    !current
                );

                setNotificationsOpen(
                  false
                );
              }}
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
                        {admin.fullName}
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
                    onClick={() => {
                      setProfileOpen(
                        false
                      );

                      router.push(
                        "/admin/profile"
                      );
                    }}
                    className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-slate-300 transition hover:bg-white/[0.055] hover:text-white"
                  >
                    <UserRound className="h-[18px] w-[18px]" />
                    Admin Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(
                        false
                      );

                      router.push(
                        "/admin/profile?tab=security"
                      );
                    }}
                    className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-slate-300 transition hover:bg-white/[0.055] hover:text-white"
                  >
                    <Settings className="h-[18px] w-[18px]" />
                    Account Settings
                  </button>
                </div>

                <div className="border-t border-white/[0.07] p-2">
                  <button
                    type="button"
                    disabled={
                      loggingOut
                    }
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

      <AdminNotificationDropdown
        open={
          notificationsOpen
        }
        onClose={() =>
          setNotificationsOpen(
            false
          )
        }
      />
    </header>
  );
}

function SearchPanel({
  query,
  minimumQueryLength,
  searching,
  error,
  results,
  totalMatched,
  activeResultIndex,
  onHoverResult,
  onOpenResult,
}: {
  query: string;
  minimumQueryLength: number;
  searching: boolean;
  error: string;
  results:
    AdminGlobalSearchResult[];
  totalMatched: number;
  activeResultIndex: number;
  onHoverResult: (
    index: number
  ) => void;
  onOpenResult: (
    result:
      AdminGlobalSearchResult
  ) => void;
}) {
  if (!query) {
    return (
      <div className="px-5 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <Search className="h-5 w-5" />
        </div>

        <p className="mt-4 text-sm font-semibold text-white">
          Search RewardHub
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Search members, merchants, transactions, settlements, products, rewards, campaigns and administrators.
        </p>
      </div>
    );
  }

  if (
    query.length <
    minimumQueryLength
  ) {
    return (
      <div className="px-5 py-8 text-center text-sm text-slate-500">
        Enter at least{" "}
        {minimumQueryLength}{" "}
        characters.
      </div>
    );
  }

  if (searching) {
    return (
      <div className="flex items-center justify-center gap-3 px-5 py-10 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
        Searching RewardHub...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8">
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      </div>
    );
  }

  if (
    results.length === 0
  ) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm font-semibold text-white">
          No results found
        </p>

        <p className="mt-2 text-xs text-slate-500">
          Try searching by ID, name, email, phone or status.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <p className="text-xs font-semibold text-slate-400">
          Search results
        </p>

        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">
          {totalMatched} matched
        </p>
      </div>

      <div className="max-h-[460px] overflow-y-auto p-2">
        {results.map(
          (
            result,
            index
          ) => {
            const Icon =
              getSearchResultIcon(
                result.type
              );

            const isActive =
              index ===
              activeResultIndex;

            return (
              <button
                key={`${result.type}-${result.id}-${index}`}
                type="button"
                onMouseEnter={() =>
                  onHoverResult(
                    index
                  )
                }
                onClick={() =>
                  onOpenResult(
                    result
                  )
                }
                className={[
                  "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition",
                  isActive
                    ? "bg-emerald-400/10"
                    : "hover:bg-white/[0.045]",
                ].join(" ")}
              >
                <div
                  className={[
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    isActive
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-white/[0.045] text-slate-500",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      {result.title ||
                        result.id}
                    </p>

                    {result.status ? (
                      <StatusBadge
                        status={
                          result.status
                        }
                      />
                    ) : null}
                  </div>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {result.typeLabel}
                    {result.subtitle
                      ? ` · ${result.subtitle}`
                      : ""}
                  </p>

                  {result.description ? (
                    <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                      {result.description}
                    </p>
                  ) : null}
                </div>

                <ChevronRight
                  className={[
                    "mt-2 h-4 w-4 shrink-0",
                    isActive
                      ? "text-emerald-300"
                      : "text-slate-700",
                  ].join(" ")}
                />
              </button>
            );
          }
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-3 text-[10px] text-slate-600">
        <span>
          ↑ ↓ Navigate
        </span>

        <span>
          Enter Open · Esc Close
        </span>
      </div>
    </>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status
      .trim()
      .toUpperCase();

  const className =
    normalized === "ACTIVE" ||
    normalized === "APPROVED" ||
    normalized === "COMPLETED" ||
    normalized === "PAID" ||
    normalized === "PUBLISHED"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "PENDING" ||
          normalized ===
            "UNDER_REVIEW" ||
          normalized ===
            "SUBMITTED" ||
          normalized ===
            "PROCESSING"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : normalized ===
              "REJECTED" ||
            normalized ===
              "DECLINED" ||
            normalized ===
              "INACTIVE" ||
            normalized ===
              "CANCELLED"
          ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
          : "border-white/[0.08] bg-white/[0.04] text-slate-400";

  return (
    <span
      className={`shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${className}`}
    >
      {normalized}
    </span>
  );
}

function getSearchResultIcon(
  type: string
) {
  switch (
    String(type || "")
      .toUpperCase()
  ) {
    case "MEMBER":
      return Users;

    case "MERCHANT":
      return Store;

    case "MERCHANT_APPLICATION":
      return ShoppingBag;

    case "TRANSACTION":
      return ReceiptText;

    case "SETTLEMENT":
      return FileText;

    case "CARD_APPLICATION":
      return History;

    case "REWARD":
      return Gift;

    case "PRODUCT":
      return Package;

    case "REVIEW":
      return FileText;

    case "CAMPAIGN":
      return Bell;

    case "ADMIN_USER":
      return UserCog;

    default:
      return Search;
  }
}

function getInitials(
  fullName: string
) {
  const parts =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 0
  ) {
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

function formatRole(
  role: string
) {
  return role
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}