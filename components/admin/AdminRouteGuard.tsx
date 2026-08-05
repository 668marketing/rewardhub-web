"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  AdminUser,
  getAdminSession,
  logoutAdmin,
} from "@/lib/admin-auth";

type AdminAuthContextValue = {
  admin: AdminUser;
  permissions: string[];
  expiresAt: string;

  hasPermission: (
    permission: string
  ) => boolean;

  updateCurrentAdmin: (
    nextAdmin:
      AdminUser
  ) => void;

  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminAuthContext =
  createContext<AdminAuthContextValue | null>(
    null
  );

export function useAdminAuth() {
  const context =
    useContext(
      AdminAuthContext
    );

  if (!context) {
    throw new Error(
      "useAdminAuth must be used inside AdminRouteGuard"
    );
  }

  return context;
}

type AdminRouteGuardProps = {
  children: ReactNode;
};

type LoadSessionOptions = {
  manual?: boolean;
  force?: boolean;
};

const FOCUS_RECHECK_INTERVAL =
  5 * 60 * 1000;

export default function AdminRouteGuard({
  children,
}: AdminRouteGuardProps) {
  const router =
    useRouter();

  const [
    admin,
    setAdmin,
  ] =
    useState<AdminUser | null>(
      null
    );

  const [
    permissions,
    setPermissions,
  ] =
    useState<string[]>([]);

  const [
    expiresAt,
    setExpiresAt,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const adminRef =
    useRef<AdminUser | null>(
      null
    );

  const requestInProgressRef =
    useRef(false);

  const lastCheckedAtRef =
    useRef(0);

  const mountedRef =
    useRef(false);

  const redirectingRef =
    useRef(false);

  const updateAdminState =
    useCallback(
      (
        nextAdmin:
          | AdminUser
          | null,
        nextPermissions:
          string[] = [],
        nextExpiresAt = ""
      ) => {
        adminRef.current =
          nextAdmin;

        setAdmin(
          nextAdmin
        );

        setPermissions(
          nextPermissions
        );

        setExpiresAt(
          nextExpiresAt
        );
      },
      []
    );

  const updateCurrentAdmin =
    useCallback(
      (
        nextAdmin:
          AdminUser
      ) => {
        adminRef.current =
          nextAdmin;

        setAdmin(
          nextAdmin
        );
      },
      []
    );

  const redirectToLogin =
    useCallback(
      (
        clearState =
          true
      ) => {
        if (
          redirectingRef.current
        ) {
          return;
        }

        redirectingRef.current =
          true;

        if (
          clearState
        ) {
          updateAdminState(
            null,
            [],
            ""
          );
        }

        router.replace(
          "/admin/login"
        );
      },
      [
        router,
        updateAdminState,
      ]
    );

  const loadSession =
    useCallback(
      async (
        options:
          LoadSessionOptions = {}
      ) => {
        const manual =
          options.manual ===
          true;

        const force =
          options.force ===
          true;

        if (
          requestInProgressRef.current
        ) {
          return;
        }

        const currentTime =
          Date.now();

        if (
          !force &&
          adminRef.current &&
          currentTime -
            lastCheckedAtRef.current <
            FOCUS_RECHECK_INTERVAL
        ) {
          return;
        }

        requestInProgressRef.current =
          true;

        try {
          if (
            mountedRef.current
          ) {
            setError(
              ""
            );

            if (
              manual
            ) {
              setRefreshing(
                true
              );
            } else if (
              !adminRef.current
            ) {
              setLoading(
                true
              );
            }
          }

          const result =
            await getAdminSession();

          if (
            !mountedRef.current
          ) {
            return;
          }

          if (
            result.authenticated ===
            false
          ) {
            redirectToLogin(
              true
            );

            return;
          }

          if (
            result.success !==
              true ||
            !result.admin
          ) {
            throw new Error(
              result.error ||
              "Unable to validate admin session."
            );
          }

          redirectingRef.current =
            false;

          updateAdminState(
            result.admin,
            Array.isArray(
              result.permissions
            )
              ? result.permissions
              : [],
            result.expiresAt ||
              ""
          );

          setError(
            ""
          );
        } catch (
          sessionError
        ) {
          console.error(
            "Admin session load error:",
            sessionError
          );

          if (
            !mountedRef.current
          ) {
            return;
          }

          setError(
            sessionError instanceof
              Error
              ? sessionError.message
              : "Unable to validate admin session."
          );
        } finally {
          lastCheckedAtRef.current =
            Date.now();

          requestInProgressRef.current =
            false;

          if (
            mountedRef.current
          ) {
            setLoading(
              false
            );

            setRefreshing(
              false
            );
          }
        }
      },
      [
        redirectToLogin,
        updateAdminState,
      ]
    );

  useEffect(() => {
    mountedRef.current =
      true;

    void loadSession({
      force:
        true,
    });

    return () => {
      mountedRef.current =
        false;
    };
  }, [
    loadSession,
  ]);

  useEffect(() => {
    function handleFocus() {
      if (
        !adminRef.current
      ) {
        return;
      }

      const elapsed =
        Date.now() -
        lastCheckedAtRef.current;

      if (
        elapsed <
        FOCUS_RECHECK_INTERVAL
      ) {
        return;
      }

      void loadSession();
    }

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [
    loadSession,
  ]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      if (
        !adminRef.current
      ) {
        return;
      }

      const elapsed =
        Date.now() -
        lastCheckedAtRef.current;

      if (
        elapsed <
        FOCUS_RECHECK_INTERVAL
      ) {
        return;
      }

      void loadSession();
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    loadSession,
  ]);

  const signOut =
    useCallback(
      async () => {
        if (
          redirectingRef.current
        ) {
          return;
        }

        redirectingRef.current =
          true;

        try {
          await logoutAdmin();
        } catch (
          logoutError
        ) {
          console.error(
            "Admin logout error:",
            logoutError
          );
        } finally {
          updateAdminState(
            null,
            [],
            ""
          );

          setError(
            ""
          );

          router.replace(
            "/admin/login"
          );
        }
      },
      [
        router,
        updateAdminState,
      ]
    );

  const hasPermission =
    useCallback(
      (
        permission:
          string
      ) => {
        if (
          permissions.includes(
            "*"
          )
        ) {
          return true;
        }

        return permissions.includes(
          permission
        );
      },
      [
        permissions,
      ]
    );

  const refreshSession =
    useCallback(
      async () => {
        await loadSession({
          manual:
            true,

          force:
            true,
        });
      },
      [
        loadSession,
      ]
    );

  const contextValue =
    useMemo<AdminAuthContextValue | null>(
      () => {
        if (
          !admin
        ) {
          return null;
        }

        return {
          admin,
          permissions,
          expiresAt,
          hasPermission,
          updateCurrentAdmin,
          refreshSession,
          signOut,
        };
      },
      [
        admin,
        permissions,
        expiresAt,
        hasPermission,
        updateCurrentAdmin,
        refreshSession,
        signOut,
      ]
    );

  if (
    loading &&
    !admin
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/30">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />

            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-slate-950 bg-emerald-500 text-slate-950">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>

          <h1 className="mt-7 text-xl font-semibold text-white">
            RewardHub Administration
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Verifying your secure session…
          </p>
        </div>
      </main>
    );
  }

  if (
    !admin ||
    !contextValue
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-7 text-center shadow-2xl shadow-black/40">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-xl font-semibold text-white">
            Session verification delayed
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {error ||
              "The server took too long to verify your admin session."}
          </p>

          <button
            type="button"
            disabled={
              refreshing
            }
            onClick={() => {
              void refreshSession();
            }}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Retry verification
          </button>

          <button
            type="button"
            onClick={() => {
              router.replace(
                "/admin/login"
              );
            }}
            className="mt-3 h-11 w-full rounded-xl border border-white/10 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
          >
            Return to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <AdminAuthContext.Provider
      value={
        contextValue
      }
    >
      {children}

      {refreshing ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 text-xs text-slate-300 shadow-xl">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />

          Verifying session
        </div>
      ) : null}

      {error &&
      !refreshing ? (
        <div className="fixed bottom-5 right-5 z-[200] w-[calc(100%-2.5rem)] max-w-md rounded-2xl border border-amber-400/20 bg-slate-900/95 p-4 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
              <AlertTriangle className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">
                Session check delayed
              </p>

              <p className="mt-1 break-words text-xs leading-5 text-slate-400">
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  void refreshSession();
                }}
                className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-emerald-300 transition hover:text-emerald-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry now
              </button>
            </div>

            <button
              type="button"
              aria-label="Dismiss warning"
              onClick={() =>
                setError(
                  ""
                )
              }
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </AdminAuthContext.Provider>
  );
}