"use client";

import {
  Check,
  ChevronRight,
  Download,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type LanguageCode =
  | "en"
  | "zh"
  | "ms";

type AppVariant =
  | "member"
  | "business";

type BeforeInstallPromptEvent =
  Event & {
    prompt: () =>
      Promise<void>;

    userChoice:
      Promise<{
        outcome:
          | "accepted"
          | "dismissed";

        platform: string;
      }>;
  };

type PWAInstallGuideProps = {
  language:
    LanguageCode;

  variant:
    AppVariant;

  loginHref:
    string;

  accountId:
    string;

  statusLabel:
    string;

  statusValue:
    string;
};

function isIosDevice() {
  if (
    typeof navigator ===
      "undefined"
  ) {
    return false;
  }

  return (
    /iPad|iPhone|iPod/i.test(
      navigator.userAgent
    ) ||
    (
      navigator.platform ===
        "MacIntel" &&
      navigator.maxTouchPoints >
        1
    )
  );
}

function isAndroidDevice() {
  if (
    typeof navigator ===
      "undefined"
  ) {
    return false;
  }

  return /Android/i.test(
    navigator.userAgent
  );
}

function isStandaloneMode() {
  if (
    typeof window ===
      "undefined"
  ) {
    return false;
  }

  return (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    Boolean(
      (
        window.navigator as Navigator & {
          standalone?: boolean;
        }
      ).standalone
    )
  );
}

export default function PWAInstallGuide({
  language,
  variant,
  loginHref,
  accountId,
  statusLabel,
  statusValue,
}: PWAInstallGuideProps) {
  const copy = {
    en: {
      memberApp:
        "RewardHub Member App",
      businessApp:
        "RewardHub Business App",
      success:
        "Registration completed",
      nextStep:
        "Next step",
      installTitle:
        "Install the app",
      installDescription:
        "Install RewardHub on your home screen for faster and easier access.",
      memberBenefit1:
        "Open RewardHub directly from your home screen",
      memberBenefit2:
        "Stay signed in until you log out or leave the app for 10 minutes",
      memberBenefit3:
        "Receive account and campaign notifications",
      memberBenefit4:
        "Access QR payment, points and rewards faster",
      businessBenefit1:
        "Open your merchant portal directly from your home screen",
      businessBenefit2:
        "Stay signed in until you log out or leave the app for 10 minutes",
      businessBenefit3:
        "Receive order, transaction and settlement notifications",
      businessBenefit4:
        "Access scanning, products and merchant tools faster",
      installNow:
        "Install App",
      installed:
        "App Installed",
      installationGuide:
        "Installation Guide",
      alreadyInstalled:
        "Already installed?",
      login:
        "Go to Login",
      later:
        "Install later",
      iosTitle:
        "Install on iPhone or iPad",
      ios1:
        "Open this page in Safari.",
      ios2:
        "Tap the Share button at the bottom of Safari.",
      ios3:
        'Choose "Add to Home Screen".',
      ios4:
        'Tap "Add" to finish.',
      androidTitle:
        "Install on Android",
      android1:
        "Open this page in Chrome.",
      android2:
        "Tap the three-dot menu in Chrome.",
      android3:
        'Choose "Install app" or "Add to Home screen".',
      android4:
        'Tap "Install" to finish.',
      desktopTitle:
        "Install on desktop",
      desktop1:
        "Open this page in Chrome or Edge.",
      desktop2:
        "Click the install icon in the address bar.",
      desktop3:
        'Choose "Install".',
      close:
        "Close",
      promptUnavailable:
        "Your browser does not show an automatic install button. Follow the steps below.",
      stepAccount:
        "Create account",
      stepInstall:
        "Install app",
      stepLogin:
        "Log in",
      stepUse:
        "Start using",
    },

    zh: {
      memberApp:
        "RewardHub 会员 App",
      businessApp:
        "RewardHub 商家 App",
      success:
        "注册已经完成",
      nextStep:
        "下一步",
      installTitle:
        "安装 RewardHub App",
      installDescription:
        "把 RewardHub 安装到主屏幕，日后可以更快、更方便地进入账户。",
      memberBenefit1:
        "从手机主屏幕直接打开 RewardHub",
      memberBenefit2:
        "保持登录，主动退出或离开 App 超过 10 分钟才会登出",
      memberBenefit3:
        "接收账户与活动推送通知",
      memberBenefit4:
        "更快使用二维码付款、积分与奖励",
      businessBenefit1:
        "从手机主屏幕直接打开商家后台",
      businessBenefit2:
        "保持登录，主动退出或离开 App 超过 10 分钟才会登出",
      businessBenefit3:
        "接收订单、交易与结算通知",
      businessBenefit4:
        "更快使用扫码、商品与商家工具",
      installNow:
        "立即安装 App",
      installed:
        "App 已安装",
      installationGuide:
        "安装教学",
      alreadyInstalled:
        "已经安装好了？",
      login:
        "前往登录",
      later:
        "稍后安装",
      iosTitle:
        "在 iPhone 或 iPad 安装",
      ios1:
        "请使用 Safari 打开此页面。",
      ios2:
        "点击 Safari 底部的分享按钮。",
      ios3:
        "选择“加入主画面”。",
      ios4:
        "点击“新增”完成安装。",
      androidTitle:
        "在 Android 安装",
      android1:
        "请使用 Chrome 打开此页面。",
      android2:
        "点击 Chrome 右上角的三个点。",
      android3:
        "选择“安装应用”或“添加到主屏幕”。",
      android4:
        "点击“安装”完成。",
      desktopTitle:
        "在电脑安装",
      desktop1:
        "请使用 Chrome 或 Edge 打开此页面。",
      desktop2:
        "点击网址栏右侧的安装图标。",
      desktop3:
        "选择“安装”。",
      close:
        "关闭",
      promptUnavailable:
        "浏览器暂时没有显示自动安装按钮，请根据以下步骤安装。",
      stepAccount:
        "创建账户",
      stepInstall:
        "安装 App",
      stepLogin:
        "登录账户",
      stepUse:
        "开始使用",
    },

    ms: {
      memberApp:
        "Aplikasi Ahli RewardHub",
      businessApp:
        "Aplikasi Perniagaan RewardHub",
      success:
        "Pendaftaran selesai",
      nextStep:
        "Langkah seterusnya",
      installTitle:
        "Pasang aplikasi",
      installDescription:
        "Pasang RewardHub pada skrin utama untuk akses yang lebih pantas dan mudah.",
      memberBenefit1:
        "Buka RewardHub terus daripada skrin utama",
      memberBenefit2:
        "Kekal log masuk sehingga anda log keluar atau meninggalkan aplikasi selama 10 minit",
      memberBenefit3:
        "Terima notifikasi akaun dan kempen",
      memberBenefit4:
        "Akses bayaran QR, mata dan ganjaran dengan lebih pantas",
      businessBenefit1:
        "Buka portal peniaga terus daripada skrin utama",
      businessBenefit2:
        "Kekal log masuk sehingga anda log keluar atau meninggalkan aplikasi selama 10 minit",
      businessBenefit3:
        "Terima notifikasi pesanan, transaksi dan penyelesaian",
      businessBenefit4:
        "Akses imbasan, produk dan alat peniaga dengan lebih pantas",
      installNow:
        "Pasang Aplikasi",
      installed:
        "Aplikasi Dipasang",
      installationGuide:
        "Panduan Pemasangan",
      alreadyInstalled:
        "Sudah dipasang?",
      login:
        "Pergi ke Log Masuk",
      later:
        "Pasang kemudian",
      iosTitle:
        "Pasang pada iPhone atau iPad",
      ios1:
        "Buka halaman ini menggunakan Safari.",
      ios2:
        "Tekan butang Kongsi di bahagian bawah Safari.",
      ios3:
        'Pilih "Add to Home Screen".',
      ios4:
        'Tekan "Add" untuk selesai.',
      androidTitle:
        "Pasang pada Android",
      android1:
        "Buka halaman ini menggunakan Chrome.",
      android2:
        "Tekan menu tiga titik dalam Chrome.",
      android3:
        'Pilih "Install app" atau "Add to Home screen".',
      android4:
        'Tekan "Install" untuk selesai.',
      desktopTitle:
        "Pasang pada komputer",
      desktop1:
        "Buka halaman ini menggunakan Chrome atau Edge.",
      desktop2:
        "Klik ikon pemasangan di bar alamat.",
      desktop3:
        'Pilih "Install".',
      close:
        "Tutup",
      promptUnavailable:
        "Pelayar anda tidak menunjukkan butang pemasangan automatik. Ikuti langkah di bawah.",
      stepAccount:
        "Cipta akaun",
      stepInstall:
        "Pasang aplikasi",
      stepLogin:
        "Log masuk",
      stepUse:
        "Mula guna",
    },
  } as const;

  const text =
    copy[language];

  const [
    deferredPrompt,
    setDeferredPrompt,
  ] =
    useState<
      BeforeInstallPromptEvent |
      null
    >(null);

  const [
    guideOpen,
    setGuideOpen,
  ] =
    useState(false);

  const [
    installed,
    setInstalled,
  ] =
    useState(false);

  const [
    deviceType,
    setDeviceType,
  ] =
    useState<
      "ios" |
      "android" |
      "desktop"
    >("desktop");

  useEffect(() => {
    setInstalled(
      isStandaloneMode()
    );

    if (
      isIosDevice()
    ) {
      setDeviceType(
        "ios"
      );
    } else if (
      isAndroidDevice()
    ) {
      setDeviceType(
        "android"
      );
    } else {
      setDeviceType(
        "desktop"
      );
    }

    function handleBeforeInstallPrompt(
      event: Event
    ) {
      event.preventDefault();

      setDeferredPrompt(
        event as BeforeInstallPromptEvent
      );
    }

    function handleAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
      setGuideOpen(false);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  const benefits =
    useMemo(
      () =>
        variant ===
          "business"
          ? [
              text.businessBenefit1,
              text.businessBenefit2,
              text.businessBenefit3,
              text.businessBenefit4,
            ]
          : [
              text.memberBenefit1,
              text.memberBenefit2,
              text.memberBenefit3,
              text.memberBenefit4,
            ],
      [
        text,
        variant,
      ]
    );

  async function handleInstall() {
    if (installed) {
      return;
    }

    if (
      deferredPrompt
    ) {
      await deferredPrompt.prompt();

      const choice =
        await deferredPrompt.userChoice;

      if (
        choice.outcome ===
        "accepted"
      ) {
        setInstalled(true);
      }

      setDeferredPrompt(null);
      return;
    }

    setGuideOpen(true);
  }

  const appName =
    variant === "business"
      ? text.businessApp
      : text.memberApp;

  return (
    <>
      <div className="mt-6">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <ProgressStep
            number="1"
            label={text.stepAccount}
            complete
          />

          <ProgressStep
            number="2"
            label={text.stepInstall}
            active
          />

          <ProgressStep
            number="3"
            label={text.stepLogin}
          />

          <ProgressStep
            number="4"
            label={text.stepUse}
          />
        </div>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 text-left shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className={[
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white",
              variant ===
                "business"
                ? "bg-slate-950"
                : "bg-blue-600",
            ].join(" ")}
          >
            <Smartphone className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">
              {text.nextStep}
            </p>

            <h3 className="mt-1 text-xl font-black text-slate-950">
              {text.installTitle}
            </h3>

            <p className="mt-1 text-xs font-bold leading-5 text-slate-500 sm:text-sm">
              {text.installDescription}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">
            {appName}
          </p>

          <div className="mt-3 grid gap-2">
            {benefits.map(
              (
                benefit
              ) => (
                <div
                  key={benefit}
                  className="flex items-start gap-2"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3 w-3" />
                  </span>

                  <p className="text-xs font-bold leading-5 text-slate-600">
                    {benefit}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          disabled={installed}
          className={[
            "mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white transition",
            installed
              ? "cursor-default bg-emerald-600"
              : variant ===
                  "business"
                ? "bg-slate-950 hover:bg-slate-800"
                : "bg-blue-600 hover:bg-blue-700",
          ].join(" ")}
        >
          {installed ? (
            <Check className="h-5 w-5" />
          ) : (
            <Download className="h-5 w-5" />
          )}

          {installed
            ? text.installed
            : text.installNow}
        </button>

        {!installed && (
          <button
            type="button"
            onClick={() =>
              setGuideOpen(true)
            }
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
          >
            {text.installationGuide}
          </button>
        )}

        <div className="mt-5 border-t border-slate-200 pt-5 text-center">
          <p className="text-xs font-bold text-slate-400">
            {text.alreadyInstalled}
          </p>

          <a
            href={loginHref}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white no-underline transition hover:bg-emerald-700"
          >
            {text.login}
            <ChevronRight className="h-4 w-4" />
          </a>

          <a
            href={loginHref}
            className="mt-3 block text-xs font-black text-slate-400 no-underline hover:text-slate-700"
          >
            {text.later}
          </a>
        </div>
      </div>

      {guideOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:rounded-[2rem] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">
                  {appName}
                </p>

                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  {deviceType === "ios"
                    ? text.iosTitle
                    : deviceType === "android"
                      ? text.androidTitle
                      : text.desktopTitle}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setGuideOpen(false)
                }
                aria-label={text.close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-800">
              {text.promptUnavailable}
            </p>

            <div className="mt-5 space-y-3">
              {(
                deviceType === "ios"
                  ? [
                      text.ios1,
                      text.ios2,
                      text.ios3,
                      text.ios4,
                    ]
                  : deviceType === "android"
                    ? [
                        text.android1,
                        text.android2,
                        text.android3,
                        text.android4,
                      ]
                    : [
                        text.desktop1,
                        text.desktop2,
                        text.desktop3,
                      ]
              ).map(
                (
                  instruction,
                  index
                ) => (
                  <InstructionStep
                    key={instruction}
                    number={index + 1}
                    text={instruction}
                    share={
                      deviceType === "ios" &&
                      index === 1
                    }
                  />
                )
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setGuideOpen(false)
              }
              className="mt-6 w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white"
            >
              {text.close}
            </button>
          </div>
        </div>
      )}

      <div className="sr-only">
        <span>
          {text.success}
        </span>

        <span>
          {accountId}
        </span>

        <span>
          {statusLabel}:{" "}
          {statusValue}
        </span>
      </div>
    </>
  );
}

function ProgressStep({
  number,
  label,
  complete = false,
  active = false,
}: {
  number: string;
  label: string;
  complete?: boolean;
  active?: boolean;
}) {
  return (
    <div className="min-w-0 text-center">
      <div
        className={[
          "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-black",
          complete
            ? "bg-emerald-600 text-white"
            : active
              ? "bg-slate-950 text-white"
              : "bg-slate-100 text-slate-400",
        ].join(" ")}
      >
        {complete ? (
          <Check className="h-4 w-4" />
        ) : (
          number
        )}
      </div>

      <p
        className={[
          "mt-2 truncate text-[9px] font-black sm:text-[10px]",
          active ||
          complete
            ? "text-slate-950"
            : "text-slate-400",
        ].join(" ")}
      >
        {label}
      </p>
    </div>
  );
}

function InstructionStep({
  number,
  text,
  share = false,
}: {
  number: number;
  text: string;
  share?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
        {share ? (
          <Share className="h-4 w-4" />
        ) : (
          number
        )}
      </div>

      <p className="text-sm font-bold leading-6 text-slate-700">
        {text}
      </p>
    </div>
  );
}