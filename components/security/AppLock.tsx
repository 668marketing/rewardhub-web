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
  Fingerprint,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import {
  useLanguage,
} from "@/hooks/useLanguage";
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

  portal:
    | "MEMBER"
    | "MERCHANT";

  publicPaths?: string[];

  lockAfterMs?: number;
};

type DeviceInformation = {
  deviceName: string;
  browser: string;
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

function detectDeviceInformation():
  DeviceInformation {
  if (
    typeof navigator ===
    "undefined"
  ) {
    return {
      deviceName:
        "Current Device",
      browser:
        "Web Browser",
    };
  }

  const lowered =
    navigator.userAgent.toLowerCase();

  let deviceName =
    "Computer";

  if (
    /ipad|tablet|playbook|silk/.test(
      lowered
    )
  ) {
    deviceName =
      /ipad/.test(
        lowered
      )
        ? "iPad"
        : "Tablet";
  } else if (
    /iphone|ipod/.test(
      lowered
    )
  ) {
    deviceName =
      "iPhone";
  } else if (
    /android/.test(
      lowered
    )
  ) {
    deviceName =
      "Android Phone";
  } else if (
    /macintosh|mac os x/.test(
      lowered
    )
  ) {
    deviceName =
      "Mac";
  } else if (
    /windows/.test(
      lowered
    )
  ) {
    deviceName =
      "Windows PC";
  } else if (
    /linux/.test(
      lowered
    )
  ) {
    deviceName =
      "Linux Computer";
  }

  let browser =
    "Web Browser";

  if (
    /edg\//.test(
      lowered
    )
  ) {
    browser =
      "Microsoft Edge";
  } else if (
    /opr\//.test(
      lowered
    )
  ) {
    browser =
      "Opera";
  } else if (
    /firefox\//.test(
      lowered
    )
  ) {
    browser =
      "Firefox";
  } else if (
    /chrome\//.test(
      lowered
    ) &&
    !/edg\//.test(
      lowered
    )
  ) {
    browser =
      "Google Chrome";
  } else if (
    /safari\//.test(
      lowered
    ) &&
    !/chrome\//.test(
      lowered
    )
  ) {
    browser =
      "Safari";
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
  lockAfterMs =
    DEFAULT_LOCK_AFTER_MS,
}: AppLockProps) {
  const pathname =
    usePathname();

  const {
    language,
  } =
    useLanguage();

  const currentLanguage =
    language === "zh" ||
    language === "ms"
      ? language
      : "en";

  const [
    session,
    setSession,
  ] =
    useState<RewardHubSession | null>(
      null
    );

  const [
    securitySettings,
    setSecuritySettings,
  ] =
    useState<RewardHubSecuritySettings | null>(
      null
    );

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

  const [
    isUnlocking,
    setIsUnlocking,
  ] =
    useState(false);

  const [
    unlockError,
    setUnlockError,
  ] =
    useState("");

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
      setSession(
        null
      );

      setSecuritySettings(
        null
      );

      setIsLocked(
        false
      );

      setIsReady(
        true
      );

      return;
    }

    const currentSession =
      getRewardHubSession();

    if (
      !currentSession ||
      currentSession.userType !==
        portal
    ) {
      setSession(
        null
      );

      setSecuritySettings(
        null
      );

      setIsLocked(
        false
      );

      setIsReady(
        true
      );

      return;
    }

    const activeSession =
      currentSession;

    const loadedSettings =
      getSecuritySettings(
        portal,
        activeSession.userId
      );

    setSession(
      activeSession
    );

    setSecuritySettings(
      loadedSettings
    );

    if (
      !loadedSettings.appLockEnabled
    ) {
      unlockRewardHub();

      setIsLocked(
        false
      );

      setIsReady(
        true
      );

      return;
    }

    const effectiveTimeout =
      loadedSettings.lockTimeout != null
        ? loadedSettings.lockTimeout *
          1000
        : lockAfterMs;

    const lockState =
      getRewardHubLockState();

    const shouldLockFromBackground =
      Boolean(
        lockState.backgroundAt !==
          null &&
        Date.now() -
          lockState.backgroundAt >=
          effectiveTimeout
      );

    if (
      shouldLockFromBackground &&
      !lockState.locked
    ) {
      lockRewardHub();
    }

    setIsLocked(
      lockState.locked ||
      shouldLockFromBackground
    );

    setIsReady(
      true
    );

    function checkLockStatus() {
      const latestSettings =
        getSecuritySettings(
          portal,
          activeSession.userId
        );

      setSecuritySettings(
        latestSettings
      );

      if (
        !latestSettings.appLockEnabled
      ) {
        unlockRewardHub();

        setIsLocked(
          false
        );

        return;
      }

      const current =
        getRewardHubLockState();

      if (
        current.locked
      ) {
        setIsLocked(
          true
        );

        return;
      }

      const currentTimeout =
        latestSettings.lockTimeout != null
          ? latestSettings.lockTimeout *
            1000
          : lockAfterMs;

      if (
        current.backgroundAt !==
          null &&
        Date.now() -
          current.backgroundAt >=
          currentTimeout
      ) {
        lockRewardHub();

        setIsLocked(
          true
        );
      }
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        const latestSettings =
          getSecuritySettings(
            portal,
            activeSession.userId
          );

        if (
          latestSettings.appLockEnabled
        ) {
          markRewardHubBackgrounded();
        }

        return;
      }

      checkLockStatus();
    }

    function handlePageHide() {
      const latestSettings =
        getSecuritySettings(
          portal,
          activeSession.userId
        );

      if (
        latestSettings.appLockEnabled
      ) {
        markRewardHubBackgrounded();
      }
    }

    function handleFocus() {
      checkLockStatus();
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
        currentSession.userType !==
          portal
      ) {
        return;
      }

      if (
        customEvent.detail?.portal &&
        customEvent.detail.portal !==
          portal
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

      const nextSettings =
        customEvent.detail?.settings ||
        getSecuritySettings(
          portal,
          currentSession.userId
        );

      setSecuritySettings(
        nextSettings
      );

      if (
        !nextSettings.appLockEnabled
      ) {
        unlockRewardHub();

        setIsLocked(
          false
        );

        setUnlockError(
          ""
        );
      }
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
    portal,
  ]);

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
        "Biometric unlock has not been enabled on this device.",

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
    copy[
      currentLanguage
    ];

    async function handleUnlock() {

  if (isUnlocking) {
    return;
  }

  setUnlockError("");

  if (
    !securitySettings?.biometricEnabled
  ) {
    unlockRewardHub();
    setIsLocked(false);
    return;
  }

  if (!session) {
    setUnlockError(text.failed);
    return;
  }

  setIsUnlocking(true);

  try {
    const device =
      detectDeviceInformation();

    const result =
      await authenticateRewardHubBiometric({
        userType: portal,
        userId: session.userId,
        deviceId: session.deviceId,
        deviceName:
          device.deviceName,
        browser:
          device.browser,
        language:
          currentLanguage,
      });

    if (
      !result.success ||
      !result.verified ||
      !result.authenticated
    ) {
      throw new Error(
        text.failed
      );
    }

    unlockRewardHub();
    setUnlockError("");
    setIsUnlocking(false);
    setIsLocked(false);
  } catch (error) {
    console.error(
      "Biometric unlock error:",
      error
    );

    setUnlockError(
      error instanceof Error &&
      error.message
        ? error.message
        : text.failed
    );
  } finally {
    setIsUnlocking(
      false
    );
  }
}

  if (
    !isReady
  ) {
    return null;
  }

  if (
    shouldBypassLock ||
    !isLocked ||
    securitySettings?.appLockEnabled ===
      false
  ) {
    return (
      <>
        {children}
      </>
    );
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
          {portal ===
          "MERCHANT"
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
          disabled={
            isUnlocking
          }
          onClick={
            handleUnlock
          }
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