"use client";

import { useEffect, useMemo, useState } from "react";

export type ScannerLanguageCode = "en" | "zh" | "ms";

export const SCANNER_LANGUAGE_STORAGE_KEY = "rewardhub-language";

export const merchantScannerTranslations = {
  en: {
    cardIdNotFound: "Card ID not found.",
    notRewardHubQr: "This is not a RewardHub member QR code.",
    cardIdNotFoundInQr: "Card ID not found in this QR code.",
    invalidSelectedQr: "The selected QR code is invalid.",
    unableReadQr: "Unable to read this QR code.",

    startingCamera: "Starting camera",
    cameraReady: "Camera ready",
    readingQr: "Reading QR",
    memberVerified: "Member verified",
    actionRequired: "Action required",
    scanner: "Scanner",

    cameraAccessFailed:
      "Camera access failed. Please allow camera permission, close other camera apps, then try again.",
    unableSwitchCamera: "Unable to switch camera. Please try again.",
    chooseImageFile: "Please choose an image file.",
    noReadableQr:
      "No readable QR code was found in this image. Try a clearer or less cropped photo.",

    rearCamera: "Rear camera",
    cameraFallback: "Camera {{suffix}}",

    backToCollectPayment: "Back to collect payment",
    merchantPayment: "Merchant payment",
    scanMemberQr: "Scan member QR",
    pageDescription:
      "Scan the member card with your rear camera or upload a QR image from the device gallery.",

    openingCamera: "Opening camera",
    allowCameraAccess: "Please allow camera access when prompted.",

    openingCollectionPage: "Opening the payment collection page…",

    unableToContinue: "Unable to continue",
    tryCameraAgain: "Try camera again",

    activeSource: "Active source",
    secure: "Secure",

    alignClearly: "Align clearly",
    alignClearlyDescription: "Keep the full QR code inside the frame.",
    holdSteady: "Hold steady",
    holdSteadyDescription:
      "Avoid glare, shadows, and excessive movement.",
    autoContinue: "Auto continue",
    autoContinueDescription:
      "Successful scans open payment collection instantly.",

    footnote:
      "Only RewardHub member QR codes are accepted. The camera stream is processed on this device.",
  },

  zh: {
    cardIdNotFound: "找不到会员卡 ID。",
    notRewardHubQr: "这不是 RewardHub 会员二维码。",
    cardIdNotFoundInQr: "此二维码内找不到会员卡 ID。",
    invalidSelectedQr: "所选择的二维码无效。",
    unableReadQr: "无法读取此二维码。",

    startingCamera: "正在启动相机",
    cameraReady: "相机已就绪",
    readingQr: "正在读取二维码",
    memberVerified: "会员验证成功",
    actionRequired: "需要处理",
    scanner: "扫描器",

    cameraAccessFailed:
      "无法使用相机。请允许相机权限、关闭其他正在使用相机的应用，然后重试。",
    unableSwitchCamera: "无法切换相机，请重试。",
    chooseImageFile: "请选择图片文件。",
    noReadableQr:
      "此图片中找不到可读取的二维码，请尝试更清晰或没有过度裁剪的图片。",

    rearCamera: "后置相机",
    cameraFallback: "相机 {{suffix}}",

    backToCollectPayment: "返回收款页面",
    merchantPayment: "商家收款",
    scanMemberQr: "扫描会员二维码",
    pageDescription:
      "使用后置相机扫描会员卡，或从设备相册上传二维码图片。",

    openingCamera: "正在打开相机",
    allowCameraAccess: "出现提示时，请允许使用相机。",

    openingCollectionPage: "正在打开收款页面……",

    unableToContinue: "无法继续",
    tryCameraAgain: "重新尝试相机",

    activeSource: "当前来源",
    secure: "安全",

    alignClearly: "清楚对准",
    alignClearlyDescription: "请将完整二维码保持在扫描框内。",
    holdSteady: "保持稳定",
    holdSteadyDescription: "避免反光、阴影和过度移动。",
    autoContinue: "自动继续",
    autoContinueDescription: "扫描成功后会立即打开收款页面。",

    footnote:
      "仅接受 RewardHub 会员二维码。相机画面只会在此设备上处理。",
  },

  ms: {
    cardIdNotFound: "ID kad tidak ditemui.",
    notRewardHubQr: "Ini bukan kod QR ahli RewardHub.",
    cardIdNotFoundInQr: "ID kad tidak ditemui dalam kod QR ini.",
    invalidSelectedQr: "Kod QR yang dipilih tidak sah.",
    unableReadQr: "Tidak dapat membaca kod QR ini.",

    startingCamera: "Memulakan kamera",
    cameraReady: "Kamera sedia",
    readingQr: "Membaca QR",
    memberVerified: "Ahli disahkan",
    actionRequired: "Tindakan diperlukan",
    scanner: "Pengimbas",

    cameraAccessFailed:
      "Akses kamera gagal. Sila benarkan kebenaran kamera, tutup aplikasi lain yang menggunakan kamera, kemudian cuba lagi.",
    unableSwitchCamera: "Tidak dapat menukar kamera. Sila cuba lagi.",
    chooseImageFile: "Sila pilih fail imej.",
    noReadableQr:
      "Tiada kod QR yang boleh dibaca ditemui dalam imej ini. Cuba foto yang lebih jelas atau kurang dipotong.",

    rearCamera: "Kamera belakang",
    cameraFallback: "Kamera {{suffix}}",

    backToCollectPayment: "Kembali ke kutipan bayaran",
    merchantPayment: "Bayaran pedagang",
    scanMemberQr: "Imbas QR ahli",
    pageDescription:
      "Imbas kad ahli menggunakan kamera belakang atau muat naik imej QR daripada galeri peranti.",

    openingCamera: "Membuka kamera",
    allowCameraAccess: "Sila benarkan akses kamera apabila diminta.",

    openingCollectionPage: "Membuka halaman kutipan bayaran…",

    unableToContinue: "Tidak dapat diteruskan",
    tryCameraAgain: "Cuba kamera semula",

    activeSource: "Sumber aktif",
    secure: "Selamat",

    alignClearly: "Jajarkan dengan jelas",
    alignClearlyDescription: "Pastikan keseluruhan kod QR berada dalam bingkai.",
    holdSteady: "Pegang dengan stabil",
    holdSteadyDescription:
      "Elakkan silau, bayang-bayang dan pergerakan berlebihan.",
    autoContinue: "Teruskan secara automatik",
    autoContinueDescription:
      "Imbasan berjaya akan membuka kutipan bayaran dengan segera.",

    footnote:
      "Hanya kod QR ahli RewardHub diterima. Strim kamera diproses pada peranti ini.",
  },
} as const;

export type MerchantScannerTranslation =
  (typeof merchantScannerTranslations)[ScannerLanguageCode];

export function normalizeScannerLanguage(
  value: string | null
): ScannerLanguageCode {
  return value === "zh" || value === "ms" ? value : "en";
}

export function fillScannerText(
  value: string,
  replacements: Record<string, string | number>
) {
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{{${key}}}`, String(replacement)),
    value
  );
}

export function useScannerLanguage() {
  const [language, setLanguage] =
    useState<ScannerLanguageCode>("en");

  useEffect(() => {
    setLanguage(
      normalizeScannerLanguage(
        localStorage.getItem(SCANNER_LANGUAGE_STORAGE_KEY)
      )
    );

    function handleLanguageChange(event: Event) {
      const customEvent =
        event as CustomEvent<{ language?: string }>;

      setLanguage(
        normalizeScannerLanguage(
          customEvent.detail?.language ||
            localStorage.getItem(SCANNER_LANGUAGE_STORAGE_KEY)
        )
      );
    }

    window.addEventListener(
      "rewardhub-language-change",
      handleLanguageChange as EventListener
    );
    window.addEventListener(
      "storage",
      handleLanguageChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "rewardhub-language-change",
        handleLanguageChange as EventListener
      );
      window.removeEventListener(
        "storage",
        handleLanguageChange as EventListener
      );
    };
  }, []);

  const t = useMemo(
    () => merchantScannerTranslations[language],
    [language]
  );

  return {
    language,
    t,
  };
}