"use client";

import {
  type ReactNode,
  useEffect,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getRewardHubSession,
  saveRewardHubSession,
  touchRewardHubSession,
} from "@/lib/session";

type MerchantGuardProps = {
  children: ReactNode;
};

type StoredMerchant = {
  merchantId?: string;
  MERCHANT_ID?: string;
};

const PUBLIC_MERCHANT_PATHS = [
  "/merchant/login",
  "/merchant/register",
  "/merchant/forgot-password",
  "/merchant/reset-password",
];

function isPublicMerchantPath(
  pathname: string
) {
  return PUBLIC_MERCHANT_PATHS.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(
        `${path}/`
      )
  );
}

function readStoredMerchant():
  | StoredMerchant
  | null {
  try {
    const raw =
      localStorage.getItem(
        "merchant"
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(
        raw
      ) as StoredMerchant;

    const merchantId =
      String(
        parsed?.merchantId ||
        parsed?.MERCHANT_ID ||
        ""
      ).trim();

    if (!merchantId) {
      localStorage.removeItem(
        "merchant"
      );

      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(
      "merchant"
    );

    return null;
  }
}

export default function MerchantGuard({
  children,
}: MerchantGuardProps) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const [
    isChecking,
    setIsChecking,
  ] =
    useState(true);

  useEffect(() => {
    const currentPath =
      pathname ||
      "/merchant/dashboard";

    /*
     * Public merchant pages must not be
     * blocked by the merchant session guard.
     *
     * Without this exception, /merchant/login
     * redirects to itself and remains on the
     * loading screen forever.
     */
    if (
      isPublicMerchantPath(
        currentPath
      )
    ) {
      setIsChecking(false);
      return;
    }

    const storedMerchant =
      readStoredMerchant();

    if (!storedMerchant) {
      router.replace(
        `/merchant/login?redirect=${encodeURIComponent(
          currentPath
        )}`
      );

      return;
    }

    const merchantId =
      String(
        storedMerchant.merchantId ||
        storedMerchant.MERCHANT_ID ||
        ""
      ).trim();

    const session =
      getRewardHubSession();

    /*
     * Compatibility migration for merchants
     * who logged in before rewardhub_session
     * was introduced.
     */
    if (!session) {
      saveRewardHubSession({
        userType:
          "MERCHANT",

        userId:
          merchantId,
      });

      setIsChecking(false);

      return;
    }

    const isCorrectSession =
      session.userType ===
        "MERCHANT" &&
      session.userId ===
        merchantId;

    if (!isCorrectSession) {
      router.replace(
        `/merchant/login?redirect=${encodeURIComponent(
          currentPath
        )}`
      );

      return;
    }

    touchRewardHubSession();
    setIsChecking(false);
  }, [
    pathname,
    router,
  ]);

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />

          <p className="mt-4 text-sm font-bold text-slate-500">
            Loading RewardHub Business...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}