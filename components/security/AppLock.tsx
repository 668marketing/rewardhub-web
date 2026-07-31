"use client";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  usePathname,
} from "next/navigation";

import {
  getRewardHubSession,
} from "@/lib/session";
import {
  getRewardHubLockState,
  lockRewardHub,
  markRewardHubBackgrounded,
  unlockRewardHub,
} from "@/lib/app-lock";
import { useLanguage } from "@/hooks/useLanguage";

type AppLockProps = {
  children: ReactNode;
  portal:
    | "MEMBER"
    | "MERCHANT";
  publicPaths?: string[];
  lockAfterMs?: number;
};

const DEFAULT_LOCK_AFTER_MS =
  20_000;

function isPublicPath(
  pathname: string,
  publicPaths: string[]
) {
  return publicPaths.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(
        `${path}/`
      )
  );
}

export default function AppLock({
  children,
  portal,
  publicPaths = [],
  lockAfterMs =
    DEFAULT_LOCK_AFTER_MS,
}: AppLockProps) {
  const pathname =
    usePathname();

  const {
    language,
  } = useLanguage();

  const [
    isLocked,
    setIsLocked,
  ] =
    useState(false);

  const [
    isReady,
    setIsReady,
  ] =
    useState(false);

  const currentPath =
    pathname || "/";

  const shouldBypassLock =
    useMemo(
      () =>
        isPublicPath(
          currentPath,
          publicPaths
        ),
      [
        currentPath,
        publicPaths,
      ]
    );

  useEffect(() => {
    if (
      shouldBypassLock
    ) {
      setIsLocked(false);
      setIsReady(true);
      return;
    }

    const session =
      getRewardHubSession();

    if (
      !session ||
      session.userType !==
        portal
    ) {
      setIsLocked(false);
      setIsReady(true);
      return;
    }

    const lockState =
      getRewardHubLockState();

    const now =
      Date.now();

    const shouldLockFromBackground =
      Boolean(
        lockState.backgroundAt &&
        now -
          lockState.backgroundAt >=
          lockAfterMs
      );

    const nextLocked =
      lockState.locked ||
      shouldLockFromBackground;

    if (
      shouldLockFromBackground &&
      !lockState.locked
    ) {
      lockRewardHub();
    }

    setIsLocked(
      nextLocked
    );

    setIsReady(true);

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        markRewardHubBackgrounded();
        return;
      }

      const current =
        getRewardHubLockState();

      if (
        current.locked
      ) {
        setIsLocked(true);
        return;
      }

      if (
        current.backgroundAt &&
        Date.now() -
          current.backgroundAt >=
          lockAfterMs
      ) {
        lockRewardHub();
        setIsLocked(true);
      }
    }

    function handlePageHide() {
      markRewardHubBackgrounded();
    }

    function handleFocus() {
      const current =
        getRewardHubLockState();

      if (
        current.locked
      ) {
        setIsLocked(true);
        return;
      }

      if (
        current.backgroundAt &&
        Date.now() -
          current.backgroundAt >=
          lockAfterMs
      ) {
        lockRewardHub();
        setIsLocked(true);
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "pagehide",
      handlePageHide
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "pagehide",
        handlePageHide
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [
    lockAfterMs,
    portal,
    shouldBypassLock,
  ]);

  const copy = {
    en: {
      memberTitle:
        "RewardHub Locked",
      merchantTitle:
        "RewardHub Business Locked",
      message:
        "Unlock to continue using your account.",
      button:
        "Unlock",
      note:
        "Biometric verification will be added in the next step.",
    },
    zh: {
      memberTitle:
        "RewardHub 已锁定",
      merchantTitle:
        "RewardHub Business 已锁定",
      message:
        "请先解锁，才能继续使用您的账户。",
      button:
        "解锁",
      note:
        "下一步将加入 Face ID、Touch ID 与指纹验证。",
    },
    ms: {
      memberTitle:
        "RewardHub Dikunci",
      merchantTitle:
        "RewardHub Business Dikunci",
      message:
        "Buka kunci untuk terus menggunakan akaun anda.",
      button:
        "Buka Kunci",
      note:
        "Pengesahan biometrik akan ditambah pada langkah seterusnya.",
    },
  } as const;

  const text =
    copy[language];

  if (
    !isReady
  ) {
    return null;
  }

  if (
    shouldBypassLock ||
    !isLocked
  ) {
    return <>{children}</>;
  }

  function handleUnlock() {
    unlockRewardHub();
    setIsLocked(false);
  }

  return (
    <main className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-3xl text-white">
          🔒
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-950">
          {portal ===
          "MERCHANT"
            ? text.merchantTitle
            : text.memberTitle}
        </h1>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          {text.message}
        </p>

        <button
          type="button"
          onClick={
            handleUnlock
          }
          className="mt-6 w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl transition hover:bg-slate-800"
        >
          {text.button}
        </button>

        <p className="mt-4 text-xs font-semibold leading-5 text-slate-400">
          {text.note}
        </p>
      </div>
    </main>
  );
}