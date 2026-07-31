"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Fingerprint,
  LockKeyhole,
  MonitorSmartphone,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Timer,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";
import {
  useLanguage,
} from "@/hooks/useLanguage";
import {
  getRewardHubSession,
  type RewardHubSession,
  type RewardHubUserType,
} from "@/lib/session";

import {
  checkRewardHubBiometricSupport,
  registerRewardHubBiometric,
} from "@/lib/webauthn-client";
import {
  getDefaultSecuritySettings,
  getSecuritySettings,
  resetSecuritySettings,
  saveSecuritySettings,
  type RewardHubSecuritySettings,
} from "@/lib/security-settings";

type SecurityCenterProps = {
  portal:
    | "MEMBER"
    | "MERCHANT"
    | "ADMIN";
};

type SupportedLanguage =
  | "en"
  | "zh"
  | "ms";

const LOCK_TIMEOUT_OPTIONS = [
  {
    value: 0,
    labels: {
      en: "Immediately",
      zh: "立即锁定",
      ms: "Serta-merta",
    },
  },
  {
    value: 20,
    labels: {
      en: "After 20 seconds",
      zh: "20 秒后",
      ms: "Selepas 20 saat",
    },
  },
  {
    value: 60,
    labels: {
      en: "After 1 minute",
      zh: "1 分钟后",
      ms: "Selepas 1 minit",
    },
  },
  {
    value: 300,
    labels: {
      en: "After 5 minutes",
      zh: "5 分钟后",
      ms: "Selepas 5 minit",
    },
  },
] as const;

type DeviceInformation = {
  deviceName: string;
  deviceType: string;
  deviceModel: string;
  deviceOs: string;
  browser: string;
};

function detectDeviceInformation():
  DeviceInformation {
  if (
    typeof navigator ===
    "undefined"
  ) {
    return {
      deviceName:
        "Current Device",
      deviceType:
        "DESKTOP",
      deviceModel:
        "",
      deviceOs:
        "Unknown",
      browser:
        "Web Browser",
    };
  }

  const lowered =
    navigator.userAgent.toLowerCase();

  let deviceType =
    "DESKTOP";

  let deviceName =
    "Computer";

  let deviceModel =
    "";

  if (
    /ipad|tablet|playbook|silk/.test(
      lowered
    )
  ) {
    deviceType =
      "TABLET";

    deviceName =
      /ipad/.test(
        lowered
      )
        ? "iPad"
        : "Tablet";

    deviceModel =
      deviceName;
  } else if (
    /iphone|ipod/.test(
      lowered
    )
  ) {
    deviceType =
      "MOBILE";

    deviceName =
      "iPhone";

    deviceModel =
      "iPhone";
  } else if (
    /android/.test(
      lowered
    )
  ) {
    deviceType =
      "MOBILE";

    deviceName =
      "Android Phone";

    deviceModel =
      "Android";
  } else if (
    /macintosh|mac os x/.test(
      lowered
    )
  ) {
    deviceName =
      "Mac";

    deviceModel =
      "Mac";
  } else if (
    /windows/.test(
      lowered
    )
  ) {
    deviceName =
      "Windows PC";

    deviceModel =
      "Windows PC";
  } else if (
    /linux/.test(
      lowered
    )
  ) {
    deviceName =
      "Linux Computer";

    deviceModel =
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

  let deviceOs =
    "Unknown";

  if (
    /iphone|ipad|ipod/.test(
      lowered
    )
  ) {
    deviceOs =
      "iOS / iPadOS";
  } else if (
    /android/.test(
      lowered
    )
  ) {
    deviceOs =
      "Android";
  } else if (
    /macintosh|mac os x/.test(
      lowered
    )
  ) {
    deviceOs =
      "macOS";
  } else if (
    /windows/.test(
      lowered
    )
  ) {
    deviceOs =
      "Windows";
  } else if (
    /linux/.test(
      lowered
    )
  ) {
    deviceOs =
      "Linux";
  }

  return {
    deviceName,
    deviceType,
    deviceModel,
    deviceOs,
    browser,
  };
}

function ToggleSwitch({
  checked,
  disabled = false,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (
    checked: boolean
  ) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={
        checked
      }
      disabled={
        disabled
      }
      onClick={() =>
        onChange(
          !checked
        )
      }
      className={[
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300",
        checked
          ? "bg-slate-950"
          : "bg-slate-200",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked
            ? "translate-x-6"
            : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

function SettingCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-slate-950">
            {title}
          </h2>

          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <div className="shrink-0">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function SecurityCenter({
  portal,
}: SecurityCenterProps) {
  const router =
    useRouter();

    function openDevices() {
  if (portal === "MERCHANT") {
    router.push("/merchant/devices");
    return;
  }

  if (portal === "ADMIN") {
    router.push("/admin/devices");
    return;
  }

  router.push("/member/devices");
}

  const {
    language,
  } =
    useLanguage();

  const currentLanguage =
    (
      language ===
        "zh" ||
      language ===
        "ms"
    )
      ? language
      : "en";

  const [
    settings,
    setSettings,
  ] =
    useState<RewardHubSecuritySettings>(
      getDefaultSecuritySettings()
    );

  const [
    userId,
    setUserId,
  ] =
    useState("");

    const [
  session,
  setSession,
] =
  useState<RewardHubSession | null>(
    null
  );

const [
  biometricSupported,
  setBiometricSupported,
] =
  useState(false);

const [
  biometricChecking,
  setBiometricChecking,
] =
  useState(true);

const [
  biometricBusy,
  setBiometricBusy,
] =
  useState(false);

const [
  biometricMessage,
  setBiometricMessage,
] =
  useState<{
    type:
      | "success"
      | "error";
    text: string;
  } | null>(
    null
  );

  const [
    isReady,
    setIsReady,
  ] =
    useState(false);

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  const copy = {
    en: {
      title:
        "Security Center",
      subtitle:
        "Manage app lock, biometric access and security settings for this device.",
      back:
        "Back",
      appLockTitle:
        "App Lock",
      appLockDescription:
        "Lock RewardHub after the app has been inactive or moved to the background.",
      biometricTitle:
        "Face ID / Biometric Unlock",
      biometricDescription:
        "Use Face ID, Touch ID, fingerprint or Windows Hello to unlock RewardHub.",
      setupBiometric:
  "Set Up",
biometricEnabled:
  "Enabled",
biometricUnavailable:
  "Not supported",
biometricSettingUp:
  "Setting up...",
biometricSuccess:
  "Biometric unlock has been enabled on this device.",
biometricFailure:
  "Biometric setup failed.",
      timeoutTitle:
        "Lock Timeout",
      timeoutDescription:
        "Choose how long RewardHub waits before locking after you leave the app.",
      trustedTitle:
        "Trusted Device",
      trustedDescription:
        "Remember this device as one of your trusted RewardHub devices.",
      resetTitle:
        "Reset Security Settings",
      resetDescription:
        "Restore the default app lock and device security settings.",
      resetButton:
        "Reset",
      resetConfirm:
        "Reset all security settings on this device?",
      saved:
        "Security settings saved",
      noSessionTitle:
        "Session unavailable",
      noSessionDescription:
        "Please sign in again before opening Security Center.",
      signIn:
        "Return to login",
      memberAccount:
        "Member account",
      merchantAccount:
        "Merchant account",
      adminAccount:
        "Admin account",
      currentDevice:
        "Current device",
      biometricNote:
  "Your biometric data stays on your device. RewardHub only stores the secure credential.",
    },

    zh: {
      title:
        "安全中心",
      subtitle:
        "管理此设备的应用锁、生物识别解锁与安全设置。",
      back:
        "返回",
      appLockTitle:
        "应用锁",
      appLockDescription:
        "当 RewardHub 闲置或转到后台后，自动锁定应用。",
      biometricTitle:
        "Face ID / 生物识别解锁",
      biometricDescription:
        "使用 Face ID、Touch ID、指纹或 Windows Hello 解锁 RewardHub。",
      setupBiometric:
  "立即设置",
biometricEnabled:
  "已启用",
biometricUnavailable:
  "此设备不支持",
biometricSettingUp:
  "设置中...",
biometricSuccess:
  "此设备已成功启用生物识别解锁。",
biometricFailure:
  "生物识别设置失败。",
      timeoutTitle:
        "锁定时间",
      timeoutDescription:
        "选择离开应用后，RewardHub 等待多久才自动锁定。",
      trustedTitle:
        "信任此设备",
      trustedDescription:
        "将目前设备保存为您的 RewardHub 信任设备。",
      resetTitle:
        "重置安全设置",
      resetDescription:
        "恢复默认的应用锁与设备安全设置。",
      resetButton:
        "重置",
      resetConfirm:
        "确定要重置此设备的所有安全设置吗？",
      saved:
        "安全设置已保存",
      noSessionTitle:
        "登录状态无效",
      noSessionDescription:
        "请重新登录后再进入安全中心。",
      signIn:
        "返回登录",
      memberAccount:
        "会员账户",
      merchantAccount:
        "商家账户",
      adminAccount:
        "管理员账户",
      currentDevice:
        "当前设备",
      biometricNote:
  "您的生物识别资料只保留在设备中，RewardHub 只保存安全凭证。",
    },

    ms: {
      title:
        "Pusat Keselamatan",
      subtitle:
        "Urus kunci aplikasi, akses biometrik dan tetapan keselamatan peranti ini.",
      back:
        "Kembali",
      appLockTitle:
        "Kunci Aplikasi",
      appLockDescription:
        "Kunci RewardHub selepas aplikasi tidak aktif atau berada di latar belakang.",
      biometricTitle:
        "Face ID / Buka Kunci Biometrik",
      biometricDescription:
        "Gunakan Face ID, Touch ID, cap jari atau Windows Hello untuk membuka RewardHub.",
      setupBiometric:
  "Tetapkan",
biometricEnabled:
  "Diaktifkan",
biometricUnavailable:
  "Tidak disokong",
biometricSettingUp:
  "Sedang menetapkan...",
biometricSuccess:
  "Buka kunci biometrik telah diaktifkan pada peranti ini.",
biometricFailure:
  "Tetapan biometrik gagal.",
      timeoutTitle:
        "Tempoh Kunci",
      timeoutDescription:
        "Pilih tempoh menunggu sebelum RewardHub dikunci selepas anda meninggalkan aplikasi.",
      trustedTitle:
        "Peranti Dipercayai",
      trustedDescription:
        "Simpan peranti ini sebagai salah satu peranti RewardHub yang dipercayai.",
      resetTitle:
        "Tetapkan Semula Keselamatan",
      resetDescription:
        "Pulihkan tetapan asal kunci aplikasi dan keselamatan peranti.",
      resetButton:
        "Tetapkan Semula",
      resetConfirm:
        "Tetapkan semula semua tetapan keselamatan pada peranti ini?",
      saved:
        "Tetapan keselamatan disimpan",
      noSessionTitle:
        "Sesi tidak tersedia",
      noSessionDescription:
        "Sila log masuk semula sebelum membuka Pusat Keselamatan.",
      signIn:
        "Kembali ke log masuk",
      memberAccount:
        "Akaun ahli",
      merchantAccount:
        "Akaun peniaga",
      adminAccount:
        "Akaun pentadbir",
      currentDevice:
  "Peranti semasa",
biometricNote:
  "Data biometrik kekal pada peranti anda. RewardHub hanya menyimpan kelayakan keselamatan.",
    },
  } as const;

  const text =
    copy[
      currentLanguage
    ];

  const accountLabel =
    useMemo(() => {
      if (
        portal ===
        "MERCHANT"
      ) {
        return text.merchantAccount;
      }

      if (
        portal ===
        "ADMIN"
      ) {
        return text.adminAccount;
      }

      return text.memberAccount;
    }, [
      portal,
      text,
    ]);

  useEffect(() => {
    const session =
      getRewardHubSession();

    if (
      !session ||
      session.userType !==
        portal
    ) {
      setIsReady(true);
      return;
    }

    setUserId(
      session.userId
    );

    setSession(
  session
);

    setSettings(
      getSecuritySettings(
        portal,
        session.userId
      )
    );

    void checkRewardHubBiometricSupport()
  .then(
    (
      support
    ) => {
      setBiometricSupported(
        support.supported
      );
    }
  )
  .catch(
    () => {
      setBiometricSupported(
        false
      );
    }
  )
  .finally(
    () => {
      setBiometricChecking(
        false
      );
    }
  );

    setIsReady(true);
  }, [
    portal,
  ]);

  function persistSettings(
    nextSettings:
      RewardHubSecuritySettings
  ) {
    if (
      !userId
    ) {
      return;
    }

    setSettings(
      nextSettings
    );

    saveSecuritySettings(
      portal as RewardHubUserType,
      userId,
      nextSettings
    );

    window.dispatchEvent(
      new CustomEvent(
        "rewardhub-security-settings-change",
        {
          detail: {
            portal,
            userId,
            settings:
              nextSettings,
          },
        }
      )
    );

    setSaved(true);

    window.setTimeout(
      () => {
        setSaved(false);
      },
      1800
    );
  }

  function updateSetting<
    Key extends keyof RewardHubSecuritySettings
  >(
    key: Key,
    value:
      RewardHubSecuritySettings[Key]
  ) {
    persistSettings({
      ...settings,
      [key]:
        value,
    });
  }

  async function handleBiometricSetup() {
  if (
    !session ||
    !userId ||
    biometricBusy ||
    !biometricSupported
  ) {
    return;
  }

  setBiometricBusy(
    true
  );

  setBiometricMessage(
    null
  );

  try {
    const device =
      detectDeviceInformation();

    await registerRewardHubBiometric({
      userType:
        portal,

      userId,

      userName:
        userId,

      displayName:
        userId,

      deviceId:
        session.deviceId,

      deviceName:
        device.deviceName,

      deviceType:
        device.deviceType,

      deviceModel:
        device.deviceModel,

      deviceOs:
        device.deviceOs,

      browser:
        device.browser,

      language:
        currentLanguage,
    });

    persistSettings({
      ...settings,

      appLockEnabled:
        true,

      biometricEnabled:
        true,
    });

    setBiometricMessage({
      type:
        "success",

      text:
        text.biometricSuccess,
    });
  } catch (
    error
  ) {
    setBiometricMessage({
      type:
        "error",

      text:
        error instanceof
          Error &&
        error.message
          ? error.message
          : text.biometricFailure,
    });
  } finally {
    setBiometricBusy(
      false
    );
  }
}

  function handleReset() {
    if (
      !userId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        text.resetConfirm
      );

    if (
      !confirmed
    ) {
      return;
    }

    resetSecuritySettings(
      portal,
      userId
    );

    const defaultSettings =
      getDefaultSecuritySettings();

    setSettings(
      defaultSettings
    );

    window.dispatchEvent(
      new CustomEvent(
        "rewardhub-security-settings-change",
        {
          detail: {
            portal,
            userId,
            settings:
              defaultSettings,
          },
        }
      )
    );

    setSaved(true);

    window.setTimeout(
      () => {
        setSaved(false);
      },
      1800
    );
  }

  function handleBack() {
    if (
      portal ===
      "MERCHANT"
    ) {
      router.push(
        "/merchant/profile"
      );
      return;
    }

    if (
      portal ===
      "ADMIN"
    ) {
      router.push(
        "/admin"
      );
      return;
    }

    router.push(
      "/member/profile"
    );
  }

  function handleReturnToLogin() {
    if (
      portal ===
      "MERCHANT"
    ) {
      router.replace(
        "/merchant/login"
      );
      return;
    }

    if (
      portal ===
      "ADMIN"
    ) {
      router.replace(
        "/admin/login"
      );
      return;
    }

    router.replace(
      "/member/login"
    );
  }

  if (
    !isReady
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="h-40 animate-pulse rounded-[2rem] bg-slate-200" />
        </div>
      </main>
    );
  }

  if (
    !userId
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            {text.noSessionTitle}
          </h1>

          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            {text.noSessionDescription}
          </p>

          <Button
            type="button"
            size="lg"
            onClick={
              handleReturnToLogin
            }
            className="mt-6 h-12 w-full rounded-2xl bg-slate-950 font-black text-white"
          >
            {text.signIn}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl sm:p-7">
          <button
            type="button"
            onClick={
              handleBack
            }
            className="inline-flex items-center gap-2 rounded-xl px-1 py-1 text-sm font-bold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </button>

          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                {accountLabel}
              </p>

              <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                {text.title}
              </h1>

              <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-slate-300">
                {text.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3">
            <Smartphone className="h-4 w-4 shrink-0 text-slate-300" />

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400">
                {text.currentDevice}
              </p>

              <p className="truncate text-sm font-black text-white">
                {userId}
              </p>
            </div>
          </div>
        </header>

        {saved && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            <Check className="h-4 w-4" />
            {text.saved}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <SettingCard
            icon={
              <LockKeyhole className="h-6 w-6" />
            }
            title={
              text.appLockTitle
            }
            description={
              text.appLockDescription
            }
          >
            <ToggleSwitch
              checked={
                settings.appLockEnabled
              }
              label={
                text.appLockTitle
              }
              onChange={(
                checked
              ) =>
                updateSetting(
                  "appLockEnabled",
                  checked
                )
              }
            />
          </SettingCard>

          <SettingCard
  icon={
    <Fingerprint className="h-6 w-6" />
  }
  title={
    text.biometricTitle
  }
  description={
    text.biometricDescription
  }
>
  {settings.biometricEnabled ? (
    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
      {
        text.biometricEnabled
      }
    </span>
  ) : (
    <Button
      type="button"
      size="lg"
      disabled={
        biometricChecking ||
        biometricBusy ||
        !biometricSupported
      }
      onClick={
        handleBiometricSetup
      }
      className="h-11 rounded-2xl bg-slate-950 px-4 font-black text-white"
    >
      <Fingerprint className="h-4 w-4" />

      {biometricBusy
        ? text.biometricSettingUp
        : biometricChecking
          ? "..."
          : biometricSupported
            ? text.setupBiometric
            : text.biometricUnavailable}
    </Button>
  )}
</SettingCard>

{biometricMessage && (
  <div
    className={[
      "flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-bold leading-6",

      biometricMessage.type ===
      "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-rose-200 bg-rose-50 text-rose-700",
    ].join(" ")}
  >
    {biometricMessage.type ===
      "success" && (
      <Check className="mt-1 h-4 w-4 shrink-0" />
    )}

    <span>
      {
        biometricMessage.text
      }
    </span>
  </div>
)}

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Timer className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black text-slate-950">
                  {text.timeoutTitle}
                </h2>

                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  {text.timeoutDescription}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LOCK_TIMEOUT_OPTIONS.map(
                (
                  option
                ) => {
                  const active =
                    settings.lockTimeout ===
                    option.value;

                  return (
                    <button
                      type="button"
                      key={
                        option.value
                      }
                      disabled={
                        !settings.appLockEnabled
                      }
                      onClick={() =>
                        updateSetting(
                          "lockTimeout",
                          option.value
                        )
                      }
                      className={[
                        "min-h-12 rounded-2xl border px-3 py-3 text-xs font-black transition",
                        active
                          ? "border-slate-950 bg-slate-950 text-white shadow-md"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300",
                        !settings.appLockEnabled
                          ? "cursor-not-allowed opacity-40"
                          : "",
                      ].join(" ")}
                    >
                      {
                        option.labels[
                          currentLanguage as SupportedLanguage
                        ]
                      }
                    </button>
                  );
                }
              )}
            </div>
          </section>

          <SettingCard
            icon={
              <Smartphone className="h-6 w-6" />
            }
            title={
              text.trustedTitle
            }
            description={
              text.trustedDescription
            }
          >
            <ToggleSwitch
              checked={
                settings.trustedDevice
              }
              label={
                text.trustedTitle
              }
              onChange={(
                checked
              ) =>
                updateSetting(
                  "trustedDevice",
                  checked
                )
              }
            />
          </SettingCard>

          <SettingCard
  icon={
    <MonitorSmartphone className="h-6 w-6" />
  }
  title={
    language === "zh"
      ? "设备管理"
      : language === "ms"
      ? "Pengurusan Peranti"
      : "Manage Devices"
  }
  description={
    language === "zh"
      ? "查看所有已登录设备、修改设备名称以及管理信任设备。"
      : language === "ms"
      ? "Lihat semua peranti, tukar nama peranti dan urus peranti dipercayai."
      : "View signed-in devices, rename this device and manage trusted devices."
  }
>
  <Button
    type="button"
    variant="outline"
    size="lg"
    onClick={openDevices}
    className="rounded-2xl"
  >
    <ChevronRight className="h-4 w-4" />
  </Button>
</SettingCard>

          <section className="rounded-[1.75rem] border border-rose-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <RotateCcw className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-black text-slate-950">
                    {text.resetTitle}
                  </h2>

                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    {text.resetDescription}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="lg"
                onClick={
                  handleReset
                }
                className="h-11 rounded-2xl px-5 font-black"
              >
                <RotateCcw className="h-4 w-4" />
                {text.resetButton}
              </Button>
            </div>
          </section>

          <p className="px-4 text-center text-xs font-semibold leading-5 text-slate-400">
            {text.biometricNote}
          </p>
        </div>
      </div>
    </main>
  );
}