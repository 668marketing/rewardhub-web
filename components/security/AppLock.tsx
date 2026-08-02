"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  Fingerprint,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import { useLanguage } from "@/hooks/useLanguage";
import {
  getRewardHubLockState,
  lockRewardHub,
  markRewardHubBackgrounded,
  unlockRewardHub,
} from "@/lib/app-lock";
import {
  getSecuritySettings,
  type RewardHubSecuritySettings,
} from "@/lib/security-settings";
import {
  getRewardHubSession,
  type RewardHubSession,
} from "@/lib/session";
import {
  authenticateRewardHubBiometric,
} from "@/lib/webauthn-client";

type AppLockProps = {
  children: ReactNode;
  portal: "MEMBER" | "MERCHANT";
  publicPaths?: string[];
  lockAfterMs?: number;
};

type DeviceInformation = {
  deviceName: string;
  browser: string;
};

const DEFAULT_LOCK_AFTER_MS = 20_000;
const FOREGROUND_CHECK_INTERVAL_MS = 1_000;

function normalizeLanguage(
  language: string
): "en" | "zh" | "ms" {
  if (
    language === "zh" ||
    language === "ms"
  ) {
    return language;
  }

  return "en";
}

function isPublicPath(
  pathname: string,
  publicPaths: string[]
) {
  return publicPaths.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(`${path}/`)
  );
}

function getTimeoutMs(
  settings: RewardHubSecuritySettings,
  fallbackMs: number
) {
  if (
    typeof settings.lockTimeout === "number" &&
    Number.isFinite(settings.lockTimeout)
  ) {
    return Math.max(
      0,
      settings.lockTimeout * 1000
    );
  }

  return Math.max(0, fallbackMs);
}

function detectDeviceInformation():
  DeviceInformation {
  if (typeof navigator === "undefined") {
    return {
      deviceName: "Current Device",
      browser: "Web Browser",
    };
  }

  const userAgent =
    navigator.userAgent.toLowerCase();

  let deviceName = "Computer";
  let browser = "Web Browser";

  if (
    /ipad|tablet|playbook|silk/.test(userAgent)
  ) {
    deviceName =
      /ipad/.test(userAgent)
        ? "iPad"
        : "Tablet";
  } else if (
    /iphone|ipod/.test(userAgent)
  ) {
    deviceName = "iPhone";
  } else if (
    /android/.test(userAgent)
  ) {
    deviceName = "Android Phone";
  } else if (
    /macintosh|mac os x/.test(userAgent)
  ) {
    deviceName = "Mac";
  } else if (
    /windows/.test(userAgent)
  ) {
    deviceName = "Windows PC";
  } else if (
    /linux/.test(userAgent)
  ) {
    deviceName = "Linux Computer";
  }

  if (/edg\//.test(userAgent)) {
    browser = "Microsoft Edge";
  } else if (/opr\//.test(userAgent)) {
    browser = "Opera";
  } else if (/firefox\//.test(userAgent)) {
    browser = "Firefox";
  } else if (
    /chrome\//.test(userAgent) &&
    !/edg\//.test(userAgent)
  ) {
    browser = "Google Chrome";
  } else if (
    /safari\//.test(userAgent) &&
    !/chrome\//.test(userAgent)
  ) {
    browser = "Safari";
  }

  return {
    deviceName,
    browser,
  };
}

export default function AppLock({
  children,
  portal,
  publicPaths = [],
  lockAfterMs = DEFAULT_LOCK_AFTER_MS,
}: AppLockProps) {
  const pathname = usePathname();
  const { language } = useLanguage();

  const currentLanguage =
    normalizeLanguage(language);

  const [session, setSession] =
    useState<RewardHubSession | null>(null);

  const [
    securitySettings,
    setSecuritySettings,
  ] =
    useState<RewardHubSecuritySettings | null>(
      null
    );

  const [isReady, setIsReady] =
    useState(false);

  const [isLocked, setIsLocked] =
    useState(false);

  const [isUnlocking, setIsUnlocking] =
    useState(false);

  const [unlockError, setUnlockError] =
    useState("");

  const activeSessionRef =
    useRef<RewardHubSession | null>(null);

  const mountedRef = useRef(true);

  const autoUnlockAttemptedRef =
    useRef(false);

  const currentPath = pathname || "/";

  const shouldBypassLock =
    isPublicPath(
      currentPath,
      publicPaths
    );

  const setSafeLocked =
    useCallback((locked: boolean) => {
      if (!mountedRef.current) {
        return;
      }

      setIsLocked(locked);
    }, []);

  const readSettings =
    useCallback(() => {
      const activeSession =
        activeSessionRef.current;

      if (!activeSession) {
        return null;
      }

      return getSecuritySettings(
        portal,
        activeSession.userId
      );
    }, [portal]);

  const clearUnlockedState =
    useCallback(() => {
      unlockRewardHub();
      setSafeLocked(false);

      if (mountedRef.current) {
        setUnlockError("");
      }
    }, [setSafeLocked]);

  const evaluateLockState =
    useCallback(() => {
      const activeSession =
        activeSessionRef.current;

      if (!activeSession) {
        setSafeLocked(false);
        return false;
      }

      const latestSettings =
        getSecuritySettings(
          portal,
          activeSession.userId
        );

      if (mountedRef.current) {
        setSecuritySettings(
          latestSettings
        );
      }

      if (!latestSettings.appLockEnabled) {
        clearUnlockedState();
        return false;
      }

      const lockState =
        getRewardHubLockState();

      if (lockState.locked) {
        setSafeLocked(true);
        return true;
      }

      if (lockState.backgroundAt === null) {
        setSafeLocked(false);
        return false;
      }

      const timeoutMs =
        getTimeoutMs(
          latestSettings,
          lockAfterMs
        );

      const elapsedMs =
        Date.now() -
        lockState.backgroundAt;

      if (elapsedMs >= timeoutMs) {
        lockRewardHub();
        setSafeLocked(true);
        return true;
      }

      setSafeLocked(false);
      return false;
    }, [
      clearUnlockedState,
      lockAfterMs,
      portal,
      setSafeLocked,
    ]);

  const recordBackgroundTime =
    useCallback(() => {
      const latestSettings =
        readSettings();

      if (
        !latestSettings?.appLockEnabled
      ) {
        return;
      }

      markRewardHubBackgrounded();

      const timeoutMs =
        getTimeoutMs(
          latestSettings,
          lockAfterMs
        );

      if (timeoutMs <= 0) {
        lockRewardHub();
        setSafeLocked(true);
      }
    }, [
      lockAfterMs,
      readSettings,
      setSafeLocked,
    ]);

  /*
   * Initial session and lock-state loading.
   *
   * The lock screen never creates or clears a login session.
   * Session persistence remains the responsibility of the
   * MemberGuard / MerchantGuard and login/logout functions.
   */
  useEffect(() => {
    mountedRef.current = true;
    setIsReady(false);

    if (shouldBypassLock) {
      activeSessionRef.current = null;
      setSession(null);
      setSecuritySettings(null);
      setIsLocked(false);
      setUnlockError("");
      setIsReady(true);

      return () => {
        mountedRef.current = false;
      };
    }

    const currentSession =
      getRewardHubSession();

    if (
      !currentSession ||
      currentSession.userType !== portal
    ) {
      activeSessionRef.current = null;
      setSession(null);
      setSecuritySettings(null);
      setIsLocked(false);
      setUnlockError("");
      setIsReady(true);

      return () => {
        mountedRef.current = false;
      };
    }

    activeSessionRef.current =
      currentSession;

    setSession(currentSession);

    const loadedSettings =
      getSecuritySettings(
        portal,
        currentSession.userId
      );

    setSecuritySettings(
      loadedSettings
    );

    if (!loadedSettings.appLockEnabled) {
      clearUnlockedState();
    } else {
      evaluateLockState();
    }

    setIsReady(true);

    return () => {
      mountedRef.current = false;
    };
  }, [
    clearUnlockedState,
    evaluateLockState,
    portal,
    shouldBypassLock,
  ]);

  /*
   * iOS can suspend JavaScript while the app is in the
   * background. Therefore, this component does NOT depend
   * on a background setTimeout. It stores backgroundAt and
   * calculates the elapsed time when the app becomes active.
   */
  useEffect(() => {
    if (
      shouldBypassLock ||
      !activeSessionRef.current
    ) {
      return;
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        recordBackgroundTime();
        return;
      }

      evaluateLockState();
    }

    function handlePageHide() {
      recordBackgroundTime();
    }

    function handlePageShow() {
      evaluateLockState();
    }

    function handleFreeze() {
      recordBackgroundTime();
    }

    function handleResume() {
      evaluateLockState();
    }

    function handleFocus() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        evaluateLockState();
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
      "pageshow",
      handlePageShow
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    document.addEventListener(
      "freeze",
      handleFreeze
    );

    document.addEventListener(
      "resume",
      handleResume
    );

    const intervalId =
      window.setInterval(() => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          evaluateLockState();
        }
      }, FOREGROUND_CHECK_INTERVAL_MS);

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
        "pageshow",
        handlePageShow
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "freeze",
        handleFreeze
      );

      document.removeEventListener(
        "resume",
        handleResume
      );

      window.clearInterval(intervalId);
    };
  }, [
    evaluateLockState,
    recordBackgroundTime,
    shouldBypassLock,
  ]);

  /*
   * Apply Security Center changes immediately without
   * requiring a refresh.
   */
  useEffect(() => {
    function handleSecuritySettingsChange(
      event: Event
    ) {
      const customEvent =
        event as CustomEvent<{
          portal?: string;
          userId?: string;
          settings?: RewardHubSecuritySettings;
        }>;

      const currentSession =
        getRewardHubSession();

      if (
        !currentSession ||
        currentSession.userType !== portal
      ) {
        return;
      }

      if (
        customEvent.detail?.portal &&
        customEvent.detail.portal !== portal
      ) {
        return;
      }

      if (
        customEvent.detail?.userId &&
        customEvent.detail.userId !==
          currentSession.userId
      ) {
        return;
      }

      activeSessionRef.current =
        currentSession;

      setSession(currentSession);

      const nextSettings =
        customEvent.detail?.settings ||
        getSecuritySettings(
          portal,
          currentSession.userId
        );

      setSecuritySettings(
        nextSettings
      );

      if (!nextSettings.appLockEnabled) {
        clearUnlockedState();
        return;
      }

      evaluateLockState();
    }

    window.addEventListener(
      "rewardhub-security-settings-change",
      handleSecuritySettingsChange
    );

    return () => {
      window.removeEventListener(
        "rewardhub-security-settings-change",
        handleSecuritySettingsChange
      );
    };
  }, [
    clearUnlockedState,
    evaluateLockState,
    portal,
  ]);

  /*
   * Synchronise changes across tabs/windows on the same
   * portal origin.
   */
  useEffect(() => {
    function handleStorage() {
      evaluateLockState();
    }

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [evaluateLockState]);

  const copy = {
    en: {
      memberTitle:
        "RewardHub Locked",

      merchantTitle:
        "RewardHub Business Locked",

      message:
        "Verify your identity to continue using your account.",

      biometricButton:
        "Unlock with biometrics",

      unlocking:
        "Verifying...",

      normalButton:
        "Unlock",

      biometricNote:
        "Use Face ID, Touch ID, fingerprint or Windows Hello.",

      normalNote:
        "Biometric unlock is not enabled on this device.",

      failed:
        "Biometric verification failed. Please try again.",
    },

    zh: {
      memberTitle:
        "RewardHub 已锁定",

      merchantTitle:
        "RewardHub Business 已锁定",

      message:
        "请验证您的身份，才能继续使用账户。",

      biometricButton:
        "使用生物识别解锁",

      unlocking:
        "验证中...",

      normalButton:
        "解锁",

      biometricNote:
        "使用 Face ID、Touch ID、指纹或 Windows Hello。",

      normalNote:
        "此设备尚未启用生物识别解锁。",

      failed:
        "生物识别验证失败，请重试。",
    },

    ms: {
      memberTitle:
        "RewardHub Dikunci",

      merchantTitle:
        "RewardHub Business Dikunci",

      message:
        "Sahkan identiti anda untuk terus menggunakan akaun.",

      biometricButton:
        "Buka dengan biometrik",

      unlocking:
        "Mengesahkan...",

      normalButton:
        "Buka Kunci",

      biometricNote:
        "Gunakan Face ID, Touch ID, cap jari atau Windows Hello.",

      normalNote:
        "Buka kunci biometrik belum diaktifkan pada peranti ini.",

      failed:
        "Pengesahan biometrik gagal. Sila cuba lagi.",
    },
  } as const;

  const text =
    copy[currentLanguage];

  const handleUnlock =
    useCallback(
      async (
        source:
          | "auto"
          | "manual" =
          "manual"
      ) => {
        if (isUnlocking) {
          return;
        }

        setUnlockError("");

        if (
          !securitySettings
            ?.biometricEnabled
        ) {
          clearUnlockedState();
          return;
        }

        if (!session) {
          setUnlockError(
            text.failed
          );
          return;
        }

        setIsUnlocking(true);

        try {
          const device =
            detectDeviceInformation();

          const result =
            await authenticateRewardHubBiometric(
              {
                userType:
                  portal,

                userId:
                  session.userId,

                deviceId:
                  session.deviceId,

                deviceName:
                  device.deviceName,

                browser:
                  device.browser,

                language:
                  currentLanguage,
              }
            );

          if (
            !result.success ||
            !result.verified ||
            !result.authenticated
          ) {
            throw new Error(
              text.failed
            );
          }

          clearUnlockedState();
        } catch (error) {
          console.error(
            `Biometric unlock error (${source}):`,
            error
          );

          setUnlockError(
            error instanceof Error &&
            error.message
              ? error.message
              : text.failed
          );
        } finally {
          setIsUnlocking(false);
        }
      },
      [
        clearUnlockedState,
        currentLanguage,
        isUnlocking,
        portal,
        securitySettings
          ?.biometricEnabled,
        session,
        text.failed,
      ]
    );

  useEffect(() => {
    if (!isLocked) {
      autoUnlockAttemptedRef.current =
        false;

      return;
    }

    if (
      !isReady ||
      isUnlocking ||
      !securitySettings
        ?.appLockEnabled ||
      !securitySettings
        ?.biometricEnabled ||
      autoUnlockAttemptedRef.current
    ) {
      return;
    }

    autoUnlockAttemptedRef.current =
      true;

    const timer =
      window.setTimeout(() => {
        void handleUnlock(
          "auto"
        );
      }, 350);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    handleUnlock,
    isLocked,
    isReady,
    isUnlocking,
    securitySettings
      ?.appLockEnabled,
    securitySettings
      ?.biometricEnabled,
  ]);

  if (!isReady) {
    return null;
  }

  if (
    shouldBypassLock ||
    !isLocked ||
    securitySettings?.appLockEnabled ===
      false
  ) {
    return <>{children}</>;
  }

  const biometricEnabled =
    Boolean(
      securitySettings?.biometricEnabled
    );

  return (
    <main className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-y-auto bg-slate-950 px-4 py-8">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
          {biometricEnabled ? (
            <Fingerprint className="h-8 w-8" />
          ) : (
            <LockKeyhole className="h-8 w-8" />
          )}
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-950">
          {portal === "MERCHANT"
            ? text.merchantTitle
            : text.memberTitle}
        </h1>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          {text.message}
        </p>

        {unlockError && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-bold leading-6 text-rose-700">
            {unlockError}
          </div>
        )}

        <button
          type="button"
          disabled={isUnlocking}
          onClick={() => {
            void handleUnlock(
              "manual"
            );
          }}
          className={[
            "mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 text-sm font-black text-white shadow-xl transition",
            "hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300",
            isUnlocking
              ? "cursor-wait opacity-70"
              : "",
          ].join(" ")}
        >
          {isUnlocking ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : biometricEnabled ? (
            <Fingerprint className="h-5 w-5" />
          ) : (
            <LockKeyhole className="h-5 w-5" />
          )}

          {isUnlocking
            ? text.unlocking
            : biometricEnabled
              ? text.biometricButton
              : text.normalButton}
        </button>

        <p className="mt-4 text-xs font-semibold leading-5 text-slate-400">
          {biometricEnabled
            ? text.biometricNote
            : text.normalNote}
        </p>
      </div>
    </main>
  );
}