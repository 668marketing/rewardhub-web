"use client";

import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  MonitorSmartphone,
  MoreVertical,
  Share,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Language = "en" | "zh" | "ms";
type DeviceType = "ios" | "android" | "desktop";

const APP_NAME = "RH Business";
const BUSINESS_LOGIN_PATH = "/merchant/login";

const content = {
  en: {
    languageName: "English",
    badge: "Business App Installation",
    title: "Install RewardHub Business",
    subtitle:
      "Add RewardHub Business to your phone for faster and easier access.",
    detected: "Detected device",
    ios: "iPhone / iPad",
    android: "Android",
    desktop: "Desktop",
    installedTitle: "RewardHub Business is installed",
    installedDescription:
      "You are currently using RewardHub Business as an installed app.",
    openApp: "Open RewardHub Business",
    copyName: "Copy App Name",
    copied: "Copied",
    importantTitle: "Important",
    importantDescription:
      'Before tapping “Add”, make sure the app name is changed to “RewardHub Business”.',
    iosTitle: "Install on iPhone or iPad",
    iosSteps: [
      "Open this page using Safari.",
      "Tap the Share button at the bottom of Safari.",
      'Scroll down and tap “Add to Home Screen”.',
      'Tap the name field and change it to “RewardHub Business”.',
      'Confirm that the black RewardHub Business icon is displayed, then tap “Add”.',
    ],
    androidTitle: "Install on Android",
    androidSteps: [
      "Open this page using Google Chrome.",
      "Tap the three-dot menu in the top-right corner.",
      'Tap “Install app” or “Add to Home screen”.',
      'Confirm the name is “RewardHub Business”.',
      "Tap Install or Add.",
    ],
    desktopTitle: "Open this page on your phone",
    desktopDescription:
      "Use your iPhone, iPad or Android phone to install RewardHub Business.",
    manualTitle: "App name to use",
    manualDescription:
      "Copy this name and paste it into the Add to Home Screen name field.",
    finalNote:
      "After installation, open RewardHub Business from your phone’s home screen.",
  },

  zh: {
    languageName: "中文",
    badge: "商家 App 安装",
    title: "安装 RewardHub Business",
    subtitle: "把 RewardHub Business 添加到手机主屏幕，之后可以更快速进入商家端。",
    detected: "已识别设备",
    ios: "iPhone / iPad",
    android: "Android",
    desktop: "电脑",
    installedTitle: "RewardHub Business 已安装",
    installedDescription: "你目前正在以已安装 App 的方式使用 RewardHub Business。",
    openApp: "打开 RewardHub Business",
    copyName: "复制 App 名称",
    copied: "已复制",
    importantTitle: "重要提醒",
    importantDescription:
      "点击“添加”之前，请确认 App 名称已经改成“RewardHub Business”。",
    iosTitle: "iPhone 或 iPad 安装步骤",
    iosSteps: [
      "使用 Safari 打开这个页面。",
      "点击 Safari 下方的分享按钮。",
      "往下滑并点击“添加到主屏幕”。",
      "点击名称栏，把名称改成“RewardHub Business”。",
      "确认显示的是黑色 RewardHub Business 图标，然后点击“添加”。",
    ],
    androidTitle: "Android 安装步骤",
    androidSteps: [
      "使用 Google Chrome 打开这个页面。",
      "点击右上角的三个点菜单。",
      "点击“安装应用”或“添加到主屏幕”。",
      "确认名称显示为“RewardHub Business”。",
      "点击“安装”或“添加”。",
    ],
    desktopTitle: "请使用手机打开这个页面",
    desktopDescription:
      "请使用 iPhone、iPad 或 Android 手机安装 RewardHub Business。",
    manualTitle: "需要使用的 App 名称",
    manualDescription: "复制下面的名称，然后粘贴到“添加到主屏幕”的名称栏。",
    finalNote:
      "安装完成后，请从手机主屏幕打开 RewardHub Business。",
  },

  ms: {
    languageName: "Bahasa Melayu",
    badge: "Pemasangan Aplikasi Perniagaan",
    title: "Pasang RewardHub Business",
    subtitle:
      "Tambahkan RewardHub Business ke skrin utama telefon untuk akses yang lebih cepat.",
    detected: "Peranti dikesan",
    ios: "iPhone / iPad",
    android: "Android",
    desktop: "Komputer",
    installedTitle: "RewardHub Business telah dipasang",
    installedDescription:
      "Anda sedang menggunakan RewardHub Business sebagai aplikasi yang telah dipasang.",
    openApp: "Buka RewardHub Business",
    copyName: "Salin Nama Aplikasi",
    copied: "Disalin",
    importantTitle: "Peringatan Penting",
    importantDescription:
      'Sebelum menekan “Tambah”, pastikan nama aplikasi telah ditukar kepada “RewardHub Business”.',
    iosTitle: "Cara memasang pada iPhone atau iPad",
    iosSteps: [
      "Buka halaman ini menggunakan Safari.",
      "Tekan butang Kongsi di bahagian bawah Safari.",
      'Tatal ke bawah dan tekan “Tambah ke Skrin Utama”.',
      'Tekan ruangan nama dan tukar kepada “RewardHub Business”.',
      'Pastikan ikon hitam RewardHub Business dipaparkan, kemudian tekan “Tambah”.',
    ],
    androidTitle: "Cara memasang pada Android",
    androidSteps: [
      "Buka halaman ini menggunakan Google Chrome.",
      "Tekan menu tiga titik di penjuru kanan atas.",
      'Tekan “Pasang aplikasi” atau “Tambah ke Skrin Utama”.',
      'Pastikan nama dipaparkan sebagai “RewardHub Business”.',
      "Tekan Pasang atau Tambah.",
    ],
    desktopTitle: "Buka halaman ini menggunakan telefon",
    desktopDescription:
      "Gunakan iPhone, iPad atau telefon Android untuk memasang RewardHub Business.",
    manualTitle: "Nama aplikasi yang perlu digunakan",
    manualDescription:
      "Salin nama ini dan tampalkannya ke ruangan nama Tambah ke Skrin Utama.",
    finalNote:
      "Selepas pemasangan, buka RewardHub Business dari skrin utama telefon anda.",
  },
} as const;

function detectDevice(): DeviceType {
  if (typeof window === "undefined") {
    return "desktop";
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() ?? "";
  const maxTouchPoints = window.navigator.maxTouchPoints ?? 0;

  const isIOS =
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform.includes("mac") && maxTouchPoints > 1);

  if (isIOS) {
    return "ios";
  }

  if (/android/.test(userAgent)) {
    return "android";
  }

  return "desktop";
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export default function MerchantInstallPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [isStandalone, setIsStandalone] = useState(false);
  const [copied, setCopied] = useState(false);

  const t = content[language];

  useEffect(() => {
    setDevice(detectDevice());
    setIsStandalone(detectStandalone());

    const savedLanguage = window.localStorage.getItem(
      "rewardhub_language"
    );

    if (
      savedLanguage === "en" ||
      savedLanguage === "zh" ||
      savedLanguage === "ms"
    ) {
      setLanguage(savedLanguage);
      return;
    }

    const browserLanguage =
      window.navigator.language.toLowerCase();

    if (browserLanguage.startsWith("zh")) {
      setLanguage("zh");
    } else if (browserLanguage.startsWith("ms")) {
      setLanguage("ms");
    }
  }, []);

  const deviceLabel = useMemo(() => {
    if (device === "ios") {
      return t.ios;
    }

    if (device === "android") {
      return t.android;
    }

    return t.desktop;
  }, [device, t]);

  const steps = device === "android" ? t.androidSteps : t.iosSteps;
  const stepsTitle =
    device === "android" ? t.androidTitle : t.iosTitle;

  async function handleCopyAppName() {
    try {
      await navigator.clipboard.writeText(APP_NAME);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      const textArea = document.createElement("textarea");

      textArea.value = APP_NAME;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }

  function handleOpenBusiness() {
    window.location.href = BUSINESS_LOGIN_PATH;
  }

  function handleLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem(
      "rewardhub_language",
      nextLanguage
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5 flex justify-end">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {(["en", "zh", "ms"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleLanguageChange(item)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  language === item
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {content[item].languageName}
              </button>
            ))}
          </div>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="bg-slate-950 px-6 py-8 text-white sm:px-10 sm:py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/business/icon-192.png"
                  alt="RewardHub Business"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-300">
                  <MonitorSmartphone className="h-4 w-4" />
                  {t.badge}
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  {t.title}
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  {t.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-8">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-slate-700" />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.detected}
                  </p>

                  <p className="font-bold text-slate-950">
                    {deviceLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenBusiness}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                {t.openApp}
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>

            {isStandalone ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />

                  <div>
                    <h2 className="font-black text-emerald-950">
                      {t.installedTitle}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      {t.installedDescription}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h2 className="font-black text-amber-950">
                    {t.importantTitle}
                  </h2>

                  <p className="mt-2 text-sm font-medium leading-6 text-amber-900">
                    {t.importantDescription}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.manualTitle}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {t.manualDescription}
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <div className="flex min-h-14 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-lg font-black text-slate-950">
                      {APP_NAME}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAppName}
                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 font-black text-slate-950 transition hover:bg-amber-400"
                    >
                      {copied ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}

                      {copied ? t.copied : t.copyName}
                    </button>
                  </div>
                </div>

                {device === "desktop" ? (
                  <div className="rounded-2xl border border-slate-200 p-6 text-center">
                    <MonitorSmartphone className="mx-auto h-12 w-12 text-slate-700" />

                    <h2 className="mt-4 text-xl font-black text-slate-950">
                      {t.desktopTitle}
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                      {t.desktopDescription}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                      {device === "ios" ? (
  <Share className="h-6 w-6 text-slate-950" />
) : (
  <Globe className="h-6 w-6 text-slate-950" />
)}

                      <h2 className="text-xl font-black text-slate-950">
                        {stepsTitle}
                      </h2>
                    </div>

                    <ol className="space-y-4">
                      {steps.map((step, index) => (
                        <li
                          key={step}
                          className="flex gap-4"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                            {index + 1}
                          </span>

                          <div className="flex-1 pt-1 text-sm font-medium leading-6 text-slate-700">
                            {step}

                            {device === "android" && index === 1 ? (
                              <MoreVertical className="ml-2 inline h-5 w-5 align-middle text-slate-700" />
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}

            <div className="rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-semibold leading-6 text-white">
              {t.finalNote}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}