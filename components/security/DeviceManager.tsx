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
  Clock3,
  Edit3,
  Globe2,
  Laptop,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";
import {
  useLanguage,
} from "@/hooks/useLanguage";
import {
  logoutRewardHub,
} from "@/lib/auth";
import {
  getSecuritySettings,
  saveSecuritySettings,
  type RewardHubSecuritySettings,
} from "@/lib/security-settings";
import {
  getRewardHubSession,
  type RewardHubSession,
} from "@/lib/session";

type DeviceManagerProps = {
  portal:
    | "MEMBER"
    | "MERCHANT"
    | "ADMIN";
};

type DeviceCategory =
  | "mobile"
  | "tablet"
  | "desktop";

type BrowserDetails = {
  deviceCategory: DeviceCategory;
  deviceName: string;
  browserName: string;
  operatingSystem: string;
};

const DEVICE_NAME_PREFIX =
  "rewardhub_device_name";

function getDeviceNameStorageKey(
  portal: string,
  userId: string,
  deviceId: string
) {
  return [
    DEVICE_NAME_PREFIX,
    portal,
    userId,
    deviceId,
  ].join("_");
}

function detectBrowserDetails():
  BrowserDetails {
  if (
    typeof navigator ===
    "undefined"
  ) {
    return {
      deviceCategory:
        "desktop",
      deviceName:
        "Current Device",
      browserName:
        "Web Browser",
      operatingSystem:
        "Unknown System",
    };
  }

  const userAgent =
    navigator.userAgent;

  const lowered =
    userAgent.toLowerCase();

  let deviceCategory:
    DeviceCategory =
      "desktop";

  let deviceName =
    "Computer";

  if (
    /ipad|tablet|playbook|silk/.test(
      lowered
    )
  ) {
    deviceCategory =
      "tablet";
    deviceName =
      /ipad/.test(lowered)
        ? "iPad"
        : "Tablet";
  } else if (
    /iphone|ipod/.test(
      lowered
    )
  ) {
    deviceCategory =
      "mobile";
    deviceName =
      "iPhone";
  } else if (
    /android/.test(
      lowered
    )
  ) {
    deviceCategory =
      "mobile";
    deviceName =
      "Android Phone";
  } else if (
    /macintosh|mac os x/.test(
      lowered
    )
  ) {
    deviceCategory =
      "desktop";
    deviceName =
      "Mac";
  } else if (
    /windows/.test(
      lowered
    )
  ) {
    deviceCategory =
      "desktop";
    deviceName =
      "Windows PC";
  } else if (
    /linux/.test(
      lowered
    )
  ) {
    deviceCategory =
      "desktop";
    deviceName =
      "Linux Computer";
  }

  let browserName =
    "Web Browser";

  if (
    /edg\//.test(
      lowered
    )
  ) {
    browserName =
      "Microsoft Edge";
  } else if (
    /opr\//.test(
      lowered
    )
  ) {
    browserName =
      "Opera";
  } else if (
    /firefox\//.test(
      lowered
    )
  ) {
    browserName =
      "Firefox";
  } else if (
    /chrome\//.test(
      lowered
    ) &&
    !/edg\//.test(
      lowered
    )
  ) {
    browserName =
      "Google Chrome";
  } else if (
    /safari\//.test(
      lowered
    ) &&
    !/chrome\//.test(
      lowered
    )
  ) {
    browserName =
      "Safari";
  }

  let operatingSystem =
    "Unknown System";

  if (
    /iphone|ipad|ipod/.test(
      lowered
    )
  ) {
    operatingSystem =
      "iOS / iPadOS";
  } else if (
    /android/.test(
      lowered
    )
  ) {
    operatingSystem =
      "Android";
  } else if (
    /macintosh|mac os x/.test(
      lowered
    )
  ) {
    operatingSystem =
      "macOS";
  } else if (
    /windows/.test(
      lowered
    )
  ) {
    operatingSystem =
      "Windows";
  } else if (
    /linux/.test(
      lowered
    )
  ) {
    operatingSystem =
      "Linux";
  }

  return {
    deviceCategory,
    deviceName,
    browserName,
    operatingSystem,
  };
}

function formatDateTime(
  timestamp: number,
  language: string
) {
  if (
    !timestamp ||
    Number.isNaN(timestamp)
  ) {
    return "-";
  }

  const locale =
    language === "zh"
      ? "zh-CN"
      : language === "ms"
        ? "ms-MY"
        : "en-MY";

  return new Intl.DateTimeFormat(
    locale,
    {
      year:
        "numeric",
      month:
        "short",
      day:
        "2-digit",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  ).format(
    new Date(timestamp)
  );
}

function DeviceIcon({
  category,
}: {
  category: DeviceCategory;
}) {
  if (
    category ===
    "mobile"
  ) {
    return (
      <Smartphone className="h-7 w-7" />
    );
  }

  if (
    category ===
    "tablet"
  ) {
    return (
      <Tablet className="h-7 w-7" />
    );
  }

  return (
    <Laptop className="h-7 w-7" />
  );
}

function ToggleSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={
        label
      }
      aria-checked={
        checked
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

export default function DeviceManager({
  portal,
}: DeviceManagerProps) {
  const router =
    useRouter();

  const {
    language,
  } =
    useLanguage();

  const supportedLanguage =
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
    deviceName,
    setDeviceName,
  ] =
    useState("");

  const [
    editingName,
    setEditingName,
  ] =
    useState("");

  const [
    isEditing,
    setIsEditing,
  ] =
    useState(false);

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

  const browserDetails =
    useMemo(
      () =>
        detectBrowserDetails(),
      []
    );

  const copy = {
    en: {
      title:
        "Devices",
      subtitle:
        "Review and manage devices that can access your RewardHub account.",
      back:
        "Back",
      currentDevice:
        "Current Device",
      thisDevice:
        "This device",
      trusted:
        "Trusted device",
      trustedDescription:
        "Keep this device marked as trusted for your RewardHub account.",
      deviceName:
        "Device name",
      browser:
        "Browser",
      system:
        "Operating system",
      deviceId:
        "Device ID",
      signedIn:
        "Signed in",
      lastActive:
        "Last active",
      editName:
        "Rename",
      save:
        "Save",
      cancel:
        "Cancel",
      saved:
        "Device settings saved",
      logout:
        "Log out this device",
      logoutDescription:
        "Remove the current login session from this device.",
      logoutConfirm:
        "Log out from RewardHub on this device?",
      remove:
        "Remove device",
      futureTitle:
        "Other Devices",
      futureDescription:
        "Other signed-in devices will appear here after device management is connected to the RewardHub server.",
      noOtherDevices:
        "No other devices are currently available.",
      sessionUnavailable:
        "Session unavailable",
      sessionDescription:
        "Please sign in again before opening device management.",
      returnLogin:
        "Return to login",
      memberAccount:
        "Member account",
      merchantAccount:
        "Merchant account",
      adminAccount:
        "Admin account",
    },

    zh: {
      title:
        "设备管理",
      subtitle:
        "查看和管理可以进入您的 RewardHub 账户的设备。",
      back:
        "返回",
      currentDevice:
        "当前设备",
      thisDevice:
        "此设备",
      trusted:
        "信任此设备",
      trustedDescription:
        "将此设备保留为您的 RewardHub 信任设备。",
      deviceName:
        "设备名称",
      browser:
        "浏览器",
      system:
        "操作系统",
      deviceId:
        "设备 ID",
      signedIn:
        "登录时间",
      lastActive:
        "最后活动",
      editName:
        "修改名称",
      save:
        "保存",
      cancel:
        "取消",
      saved:
        "设备设置已保存",
      logout:
        "退出此设备",
      logoutDescription:
        "删除此设备目前的 RewardHub 登录状态。",
      logoutConfirm:
        "确定要在此设备退出 RewardHub 吗？",
      remove:
        "移除设备",
      futureTitle:
        "其他设备",
      futureDescription:
        "连接 RewardHub 服务器设备管理后，其他已登录设备会显示在这里。",
      noOtherDevices:
        "目前没有其他可管理的设备。",
      sessionUnavailable:
        "登录状态无效",
      sessionDescription:
        "请重新登录后再进入设备管理。",
      returnLogin:
        "返回登录",
      memberAccount:
        "会员账户",
      merchantAccount:
        "商家账户",
      adminAccount:
        "管理员账户",
    },

    ms: {
      title:
        "Pengurusan Peranti",
      subtitle:
        "Semak dan urus peranti yang boleh mengakses akaun RewardHub anda.",
      back:
        "Kembali",
      currentDevice:
        "Peranti Semasa",
      thisDevice:
        "Peranti ini",
      trusted:
        "Peranti dipercayai",
      trustedDescription:
        "Kekalkan peranti ini sebagai peranti dipercayai untuk akaun RewardHub anda.",
      deviceName:
        "Nama peranti",
      browser:
        "Pelayar",
      system:
        "Sistem operasi",
      deviceId:
        "ID Peranti",
      signedIn:
        "Log masuk",
      lastActive:
        "Aktiviti terakhir",
      editName:
        "Tukar nama",
      save:
        "Simpan",
      cancel:
        "Batal",
      saved:
        "Tetapan peranti disimpan",
      logout:
        "Log keluar peranti ini",
      logoutDescription:
        "Padam sesi log masuk semasa daripada peranti ini.",
      logoutConfirm:
        "Log keluar daripada RewardHub pada peranti ini?",
      remove:
        "Buang peranti",
      futureTitle:
        "Peranti Lain",
      futureDescription:
        "Peranti lain yang telah log masuk akan dipaparkan selepas pengurusan peranti disambungkan ke pelayan RewardHub.",
      noOtherDevices:
        "Tiada peranti lain yang tersedia buat masa ini.",
      sessionUnavailable:
        "Sesi tidak tersedia",
      sessionDescription:
        "Sila log masuk semula sebelum membuka pengurusan peranti.",
      returnLogin:
        "Kembali ke log masuk",
      memberAccount:
        "Akaun ahli",
      merchantAccount:
        "Akaun peniaga",
      adminAccount:
        "Akaun pentadbir",
    },
  } as const;

  const text =
    copy[
      supportedLanguage
    ];

  const accountLabel =
    portal ===
    "MERCHANT"
      ? text.merchantAccount
      : portal ===
          "ADMIN"
        ? text.adminAccount
        : text.memberAccount;

  useEffect(() => {
    const currentSession =
      getRewardHubSession();

    if (
      !currentSession ||
      currentSession.userType !==
        portal
    ) {
      setIsReady(true);
      return;
    }

    const currentSettings =
      getSecuritySettings(
        portal,
        currentSession.userId
      );

    const storageKey =
      getDeviceNameStorageKey(
        portal,
        currentSession.userId,
        currentSession.deviceId
      );

    const storedDeviceName =
      localStorage.getItem(
        storageKey
      );

    const initialDeviceName =
      storedDeviceName ||
      browserDetails.deviceName;

    setSession(
      currentSession
    );

    setSecuritySettings(
      currentSettings
    );

    setDeviceName(
      initialDeviceName
    );

    setEditingName(
      initialDeviceName
    );

    setIsReady(true);
  }, [
    browserDetails.deviceName,
    portal,
  ]);

  function showSavedMessage() {
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
        "/merchant/security"
      );
      return;
    }

    if (
      portal ===
      "ADMIN"
    ) {
      router.push(
        "/admin/security"
      );
      return;
    }

    router.push(
      "/member/security"
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

  function handleSaveName() {
    if (
      !session
    ) {
      return;
    }

    const nextName =
      editingName.trim() ||
      browserDetails.deviceName;

    localStorage.setItem(
      getDeviceNameStorageKey(
        portal,
        session.userId,
        session.deviceId
      ),
      nextName
    );

    setDeviceName(
      nextName
    );

    setEditingName(
      nextName
    );

    setIsEditing(false);

    showSavedMessage();
  }

  function handleTrustedChange(
    checked: boolean
  ) {
    if (
      !session ||
      !securitySettings
    ) {
      return;
    }

    const nextSettings = {
      ...securitySettings,
      trustedDevice:
        checked,
    };

    saveSecuritySettings(
      portal,
      session.userId,
      nextSettings
    );

    setSecuritySettings(
      nextSettings
    );

    window.dispatchEvent(
      new CustomEvent(
        "rewardhub-security-settings-change",
        {
          detail: {
            portal,
            userId:
              session.userId,
            settings:
              nextSettings,
          },
        }
      )
    );

    showSavedMessage();
  }

  function handleLogout() {
    const confirmed =
      window.confirm(
        text.logoutConfirm
      );

    if (
      !confirmed
    ) {
      return;
    }

    logoutRewardHub({
      clearDeviceId:
        false,
    });

    handleReturnToLogin();
  }

  if (
    !isReady
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="h-48 animate-pulse rounded-[2rem] bg-slate-200" />
        </div>
      </main>
    );
  }

  if (
    !session ||
    !securitySettings
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            {
              text.sessionUnavailable
            }
          </h1>

          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            {
              text.sessionDescription
            }
          </p>

          <Button
            type="button"
            size="lg"
            onClick={
              handleReturnToLogin
            }
            className="mt-6 h-12 w-full rounded-2xl bg-slate-950 font-black text-white"
          >
            {
              text.returnLogin
            }
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
              <MonitorSmartphone className="h-7 w-7" />
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
        </header>

        {saved && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            <Check className="h-4 w-4" />
            {text.saved}
          </div>
        )}

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <DeviceIcon
                  category={
                    browserDetails.deviceCategory
                  }
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-black text-slate-950">
                    {deviceName}
                  </h2>

                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                    {text.thisDevice}
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {
                    browserDetails.browserName
                  }
                  {" • "}
                  {
                    browserDetails.operatingSystem
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingName(
                    deviceName
                  );
                  setIsEditing(true);
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                aria-label={
                  text.editName
                }
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>

            {isEditing && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                  {
                    text.deviceName
                  }
                </label>

                <input
                  type="text"
                  value={
                    editingName
                  }
                  maxLength={
                    50
                  }
                  onChange={(
                    event
                  ) =>
                    setEditingName(
                      event.target.value
                    )
                  }
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-100"
                />

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setEditingName(
                        deviceName
                      );
                      setIsEditing(false);
                    }}
                    className="h-11 rounded-2xl font-black"
                  >
                    {
                      text.cancel
                    }
                  </Button>

                  <Button
                    type="button"
                    size="lg"
                    onClick={
                      handleSaveName
                    }
                    className="h-11 rounded-2xl bg-slate-950 font-black text-white"
                  >
                    {
                      text.save
                    }
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Globe2 className="h-5 w-5 shrink-0 text-slate-400" />

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400">
                    {
                      text.browser
                    }
                  </p>

                  <p className="truncate text-sm font-black text-slate-800">
                    {
                      browserDetails.browserName
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Laptop className="h-5 w-5 shrink-0 text-slate-400" />

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400">
                    {
                      text.system
                    }
                  </p>

                  <p className="truncate text-sm font-black text-slate-800">
                    {
                      browserDetails.operatingSystem
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Clock3 className="h-5 w-5 shrink-0 text-slate-400" />

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400">
                    {
                      text.signedIn
                    }
                  </p>

                  <p className="text-sm font-black text-slate-800">
                    {formatDateTime(
                      session.createdAt,
                      supportedLanguage
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Clock3 className="h-5 w-5 shrink-0 text-slate-400" />

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400">
                    {
                      text.lastActive
                    }
                  </p>

                  <p className="text-sm font-black text-slate-800">
                    {formatDateTime(
                      session.lastActiveAt,
                      supportedLanguage
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 sm:px-6">
              <p className="text-xs font-bold text-slate-400">
                {text.deviceId}
              </p>

              <p className="mt-1 break-all font-mono text-xs font-bold leading-5 text-slate-600">
                {session.deviceId}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-950">
                  {
                    text.trusted
                  }
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {
                    text.trustedDescription
                  }
                </p>
              </div>

              <ToggleSwitch
                checked={
                  securitySettings.trustedDevice
                }
                label={
                  text.trusted
                }
                onChange={
                  handleTrustedChange
                }
              />
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <MonitorSmartphone className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-950">
                {
                  text.futureTitle
                }
              </h2>

              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                {
                  text.futureDescription
                }
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-bold text-slate-400">
              {
                text.noOtherDevices
              }
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-[1.75rem] border border-rose-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <LogOut className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-black text-slate-950">
                  {
                    text.logout
                  }
                </h2>

                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  {
                    text.logoutDescription
                  }
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={
                handleLogout
              }
              className="h-11 rounded-2xl px-5 font-black"
            >
              <Trash2 className="h-4 w-4" />
              {text.logout}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}