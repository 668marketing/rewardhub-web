"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import {
  AdminUser,
  getAdminSession,
  logoutAdmin,
} from "@/lib/admin-auth";

type AdminAuthContextValue = {
  admin: AdminUser;
  permissions: string[];
  expiresAt: string;
  hasPermission: (permission: string) => boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminAuthContext =
  createContext<AdminAuthContextValue | null>(
    null
  );

export function useAdminAuth() {
  const context = useContext(
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

export default function AdminRouteGuard({
  children,
}: AdminRouteGuardProps) {
  const router = useRouter();

  const [admin, setAdmin] =
    useState<AdminUser | null>(null);

  const [permissions, setPermissions] =
    useState<string[]>([]);

  const [expiresAt, setExpiresAt] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadSession =
    useCallback(async () => {
      try {
        setError("");

        const result =
          await getAdminSession();

        if (
          !result.success ||
          !result.authenticated ||
          !result.admin
        ) {
          setAdmin(null);
          setPermissions([]);
          setExpiresAt("");

          router.replace(
            "/admin/login"
          );

          return;
        }

        setAdmin(result.admin);
        setPermissions(
          result.permissions || []
        );
        setExpiresAt(
          result.expiresAt || ""
        );
      } catch (sessionError) {
        console.error(
          "Admin session load error:",
          sessionError
        );

        setAdmin(null);
        setPermissions([]);
        setExpiresAt("");

        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Unable to validate admin session."
        );

        router.replace(
          "/admin/login"
        );
      } finally {
        setLoading(false);
      }
    }, [router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  /*
   * 当后台页面重新获得焦点时，再检查一次 Session。
   * 例如管理员在另一个设备被停用，回来时会自动退出。
   */
  useEffect(() => {
    function handleFocus() {
      loadSession();
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
  }, [loadSession]);

  async function signOut() {
    try {
      await logoutAdmin();
    } catch (logoutError) {
      console.error(
        "Admin logout error:",
        logoutError
      );
    } finally {
      setAdmin(null);
      setPermissions([]);
      setExpiresAt("");

      router.replace(
        "/admin/login"
      );

      router.refresh();
    }
  }

  function hasPermission(
    permission: string
  ) {
    if (
      permissions.includes("*")
    ) {
      return true;
    }

    return permissions.includes(
      permission
    );
  }

  const contextValue =
    useMemo<AdminAuthContextValue | null>(
      () => {
        if (!admin) {
          return null;
        }

        return {
          admin,
          permissions,
          expiresAt,
          hasPermission,
          refreshSession:
            loadSession,
          signOut,
        };
      },
      [
        admin,
        permissions,
        expiresAt,
        loadSession,
      ]
    );

  if (loading) {
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

          {error ? (
            <p className="mt-4 text-sm text-red-300">
              {error}
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  if (!admin || !contextValue) {
    return null;
  }

  return (
    <AdminAuthContext.Provider
      value={contextValue}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}