"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MerchantNav from "@/components/layout/MerchantNav";
import PushNotificationManager from "@/components/pwa/PushNotificationManager";
import SmartImage from "@/components/ui/SmartImage";
import {
  getMerchantDetail,
  getMerchantMarketingSummary,
  updateMerchantProfile,
  uploadMerchantLogo,
  uploadMerchantBanner,
} from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations = {
  en: {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    noRestDay: "No Rest Day",
    unableReadImage: "Unable to read image",
    chooseLogo: "Please choose a logo image",
    chooseBanner: "Please choose a banner image",
    merchantIdMissing: "Merchant ID missing",
    logoUrlMissing: "Logo URL missing",
    bannerUrlMissing: "Banner URL missing",
    logoUploaded: "Logo uploaded successfully",
    bannerUploaded: "Banner uploaded successfully",
    logoUploadFailed: "Logo upload failed",
    bannerUploadFailed: "Banner upload failed",
    businessNameRequired: "Business Name is required",
    phoneRequired: "Phone is required",
    addressRequired: "Address is required",
    selectBothTimes: "Please select both open and close time",
    profileUpdated: "Profile updated successfully",
    updateFailed: "Update failed",
    loadingProfile: "Loading Profile...",
    merchantProfile: "Merchant Profile",
    fallbackMerchant: "Merchant",
    merchantBranding: "Merchant Branding",
    merchantBrandingDescription: "Manage your public logo and cover banner.",
    logo: "Logo",
    logoDescription: "Square image, PNG, JPG or WebP, under 2MB.",
    merchantLogo: "Merchant Logo",
    logoTooLarge: "Logo must be smaller than 2MB",
    uploading: "Uploading...",
    uploadLogo: "Upload Logo",
    banner: "Banner",
    bannerDescription: "Wide image, PNG, JPG or WebP, under 3MB.",
    merchantBanner: "Merchant Banner",
    bannerTooLarge: "Banner must be smaller than 3MB",
    uploadBanner: "Upload Banner",
    businessInformation: "Business Information",
    businessInformationDescription: "Update the public information shown on your merchant page.",
    businessName: "Business Name",
    businessNamePlaceholder: "Business name",
    phone: "Phone",
    openingTime: "Opening Time",
    closingTime: "Closing Time",
    restDay: "Rest Day",
    category: "Category",
    businessAddress: "Business Address",
    addressPlaceholder: "Enter full business address",
    aboutMerchant: "About Merchant",
    aboutPlaceholder: "Introduce your business, products and services...",
    publicContentNote: "This content appears on your public merchant page.",
    characters: "{{count}} characters",
    savingChanges: "Saving Changes...",
    saveBusinessInformation: "Save Business Information",
    merchantSettings: "Merchant Settings",
    merchantSettingsDescription: "Important account and reward settings.",
    merchantId: "Merchant ID",
    loginEmail: "Login Email",
    status: "Status",
    marketingBudget: "Marketing Budget",
    rewardCredits: "Reward Credits",
    enabledWithLimit: "Enabled ({{limit}}%)",
    disabled: "Disabled",
    security: "Security",
    securityDescription:
      "Manage App Lock, biometric access, password and trusted devices.",
    securityCenter: "Security Center",
    securityCenterDescription:
      "Manage App Lock, Face ID / Touch ID and trusted devices.",
    changePassword: "Change Password",
    changePasswordDescription:
      "Update your merchant account password securely.",
    manageDevices: "Manage Devices",
    manageDevicesDescription:
      "Review all registered merchant devices.",
    open: "Open →",
    account: "Account",
    accountDescription: "Sign out from this merchant portal on the current device.",
    logout: "Logout",
  },
  zh: {
    monday: "星期一",
    tuesday: "星期二",
    wednesday: "星期三",
    thursday: "星期四",
    friday: "星期五",
    saturday: "星期六",
    sunday: "星期日",
    noRestDay: "没有休息日",
    unableReadImage: "无法读取图片",
    chooseLogo: "请选择 Logo 图片",
    chooseBanner: "请选择 Banner 图片",
    merchantIdMissing: "找不到商家 ID",
    logoUrlMissing: "找不到 Logo URL",
    bannerUrlMissing: "找不到 Banner URL",
    logoUploaded: "Logo 上传成功",
    bannerUploaded: "Banner 上传成功",
    logoUploadFailed: "Logo 上传失败",
    bannerUploadFailed: "Banner 上传失败",
    businessNameRequired: "必须填写商家名称",
    phoneRequired: "必须填写电话号码",
    addressRequired: "必须填写地址",
    selectBothTimes: "请选择营业开始和结束时间",
    profileUpdated: "商家资料更新成功",
    updateFailed: "更新失败",
    loadingProfile: "正在加载商家资料……",
    merchantProfile: "商家资料",
    fallbackMerchant: "商家",
    merchantBranding: "商家品牌",
    merchantBrandingDescription: "管理公开页面显示的 Logo 和封面 Banner。",
    logo: "Logo",
    logoDescription: "正方形图片，支持 PNG、JPG 或 WebP，大小不超过 2MB。",
    merchantLogo: "商家 Logo",
    logoTooLarge: "Logo 必须小于 2MB",
    uploading: "正在上传……",
    uploadLogo: "上传 Logo",
    banner: "Banner",
    bannerDescription: "横向图片，支持 PNG、JPG 或 WebP，大小不超过 3MB。",
    merchantBanner: "商家 Banner",
    bannerTooLarge: "Banner 必须小于 3MB",
    uploadBanner: "上传 Banner",
    businessInformation: "商家资料",
    businessInformationDescription: "更新公开商家页面显示的资料。",
    businessName: "商家名称",
    businessNamePlaceholder: "输入商家名称",
    phone: "电话号码",
    openingTime: "营业开始时间",
    closingTime: "营业结束时间",
    restDay: "休息日",
    category: "分类",
    businessAddress: "商家地址",
    addressPlaceholder: "输入完整商家地址",
    aboutMerchant: "关于商家",
    aboutPlaceholder: "介绍你的商家、产品和服务……",
    publicContentNote: "此内容会显示在公开商家页面。",
    characters: "{{count}} 个字符",
    savingChanges: "正在保存修改……",
    saveBusinessInformation: "保存商家资料",
    merchantSettings: "商家设置",
    merchantSettingsDescription: "重要的账户和奖励设置。",
    merchantId: "商家 ID",
    loginEmail: "登录邮箱",
    status: "状态",
    marketingBudget: "营销预算",
    rewardCredits: "奖励金",
    enabledWithLimit: "已开启（{{limit}}%）",
    disabled: "已关闭",
    security: "安全设置",
    securityDescription:
      "管理应用锁、生物识别、账户密码及受信任设备。",
    securityCenter: "安全中心",
    securityCenterDescription:
      "管理应用锁、生物识别及受信任设备。",
    changePassword: "更改密码",
    changePasswordDescription: "安全更新你的商家账户密码。",
    manageDevices: "设备管理",
    manageDevicesDescription:
      "查看所有已注册的商家设备。",
    open: "打开 →",
    account: "账户",
    accountDescription: "在当前设备退出商家后台。",
    logout: "退出登录",
  },
  ms: {
    monday: "Isnin",
    tuesday: "Selasa",
    wednesday: "Rabu",
    thursday: "Khamis",
    friday: "Jumaat",
    saturday: "Sabtu",
    sunday: "Ahad",
    noRestDay: "Tiada Hari Rehat",
    unableReadImage: "Tidak dapat membaca imej",
    chooseLogo: "Sila pilih imej logo",
    chooseBanner: "Sila pilih imej banner",
    merchantIdMissing: "ID pedagang tidak ditemui",
    logoUrlMissing: "URL logo tidak ditemui",
    bannerUrlMissing: "URL banner tidak ditemui",
    logoUploaded: "Logo berjaya dimuat naik",
    bannerUploaded: "Banner berjaya dimuat naik",
    logoUploadFailed: "Muat naik logo gagal",
    bannerUploadFailed: "Muat naik banner gagal",
    businessNameRequired: "Nama Perniagaan diperlukan",
    phoneRequired: "Nombor telefon diperlukan",
    addressRequired: "Alamat diperlukan",
    selectBothTimes: "Sila pilih masa buka dan tutup",
    profileUpdated: "Profil berjaya dikemas kini",
    updateFailed: "Kemas kini gagal",
    loadingProfile: "Sedang Memuatkan Profil...",
    merchantProfile: "Profil Pedagang",
    fallbackMerchant: "Pedagang",
    merchantBranding: "Penjenamaan Pedagang",
    merchantBrandingDescription: "Urus logo awam dan banner muka hadapan anda.",
    logo: "Logo",
    logoDescription: "Imej segi empat sama, PNG, JPG atau WebP, bawah 2MB.",
    merchantLogo: "Logo Pedagang",
    logoTooLarge: "Logo mesti lebih kecil daripada 2MB",
    uploading: "Sedang Memuat Naik...",
    uploadLogo: "Muat Naik Logo",
    banner: "Banner",
    bannerDescription: "Imej lebar, PNG, JPG atau WebP, bawah 3MB.",
    merchantBanner: "Banner Pedagang",
    bannerTooLarge: "Banner mesti lebih kecil daripada 3MB",
    uploadBanner: "Muat Naik Banner",
    businessInformation: "Maklumat Perniagaan",
    businessInformationDescription: "Kemas kini maklumat awam pada halaman pedagang anda.",
    businessName: "Nama Perniagaan",
    businessNamePlaceholder: "Nama perniagaan",
    phone: "Telefon",
    openingTime: "Masa Buka",
    closingTime: "Masa Tutup",
    restDay: "Hari Rehat",
    category: "Kategori",
    businessAddress: "Alamat Perniagaan",
    addressPlaceholder: "Masukkan alamat penuh perniagaan",
    aboutMerchant: "Tentang Pedagang",
    aboutPlaceholder: "Perkenalkan perniagaan, produk dan perkhidmatan anda...",
    publicContentNote: "Kandungan ini dipaparkan pada halaman awam pedagang anda.",
    characters: "{{count}} aksara",
    savingChanges: "Sedang Menyimpan Perubahan...",
    saveBusinessInformation: "Simpan Maklumat Perniagaan",
    merchantSettings: "Tetapan Pedagang",
    merchantSettingsDescription: "Tetapan akaun dan ganjaran penting.",
    merchantId: "ID Pedagang",
    loginEmail: "E-mel Log Masuk",
    status: "Status",
    marketingBudget: "Bajet Pemasaran",
    rewardCredits: "Kredit Ganjaran",
    enabledWithLimit: "Diaktifkan ({{limit}}%)",
    disabled: "Dilumpuhkan",
    security: "Keselamatan",
    securityDescription:
      "Urus App Lock, akses biometrik, kata laluan dan peranti dipercayai.",
    securityCenter: "Pusat Keselamatan",
    securityCenterDescription:
      "Urus App Lock, Face ID / Touch ID dan peranti dipercayai.",
    changePassword: "Tukar Kata Laluan",
    changePasswordDescription:
      "Kemas kini kata laluan akaun pedagang dengan selamat.",
    manageDevices: "Urus Peranti",
    manageDevicesDescription:
      "Lihat semua peranti pedagang yang didaftarkan.",
    open: "Buka →",
    account: "Akaun",
    accountDescription: "Log keluar daripada portal pedagang pada peranti ini.",
    logout: "Log Keluar",
  },
} as const;

function normalizeLanguage(value: string | null): LanguageCode {
  return value === "zh" || value === "ms" ? value : "en";
}

function fillText(
  value: string,
  replacements: Record<string, string | number>
) {
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{{${key}}}`, String(replacement)),
    value
  );
}

const fieldClass =
  "mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:px-4 sm:text-sm";

function toText(value: any) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

export default function MerchantProfilePage() {
  const router = useRouter();

  const [language, setLanguage] = useState<LanguageCode>("en");
  const [merchant, setMerchant] = useState<any>(null);
  const [marketing, setMarketing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [restDay, setRestDay] = useState("");
  const [description, setdescription] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const t = useMemo(() => translations[language], [language]);

  const restDayOptions = useMemo(
    () => [
      { value: "Monday", label: t.monday },
      { value: "Tuesday", label: t.tuesday },
      { value: "Wednesday", label: t.wednesday },
      { value: "Thursday", label: t.thursday },
      { value: "Friday", label: t.friday },
      { value: "Saturday", label: t.saturday },
      { value: "Sunday", label: t.sunday },
    ],
    [t]
  );

  function getApiData(res: any) {
    let data = res;

    while (data?.data && !data?.merchantId && !data?.MERCHANT_ID) {
      data = data.data;
    }

    return data;
  }

  useEffect(() => {
    setLanguage(
      normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))
    );

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: string }>;

      setLanguage(
        normalizeLanguage(
          customEvent.detail?.language ||
            localStorage.getItem(LANGUAGE_STORAGE_KEY)
        )
      );
    }

    window.addEventListener(
      "rewardhub-language-change",
      handleLanguageChange as EventListener
    );
    window.addEventListener("storage", handleLanguageChange as EventListener);

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

  useEffect(() => {
    async function load() {
      let stored: any = {};

      try {
        stored = JSON.parse(localStorage.getItem("merchant") || "{}");
      } catch {
        stored = {};
      }

      const storedMerchantId =
        stored?.merchantId || stored?.MERCHANT_ID || "";

      if (!storedMerchantId) {
        setLoading(false);
        return;
      }

      try {
        const detailRes = await getMerchantDetail(storedMerchantId);
        const data = getApiData(detailRes) || {};
        const mergedMerchant = { ...stored, ...data };

        setMerchant(mergedMerchant);

        setBusinessName(
          toText(
            data?.businessName ||
              data?.BUSINESS_NAME ||
              stored?.businessName ||
              stored?.BUSINESS_NAME
          )
        );

        setPhone(
          toText(
            data?.phone ||
              data?.PHONE ||
              stored?.phone ||
              stored?.PHONE
          )
        );

        setAddress(
          toText(
            data?.address ||
              data?.ADDRESS ||
              stored?.address ||
              stored?.ADDRESS
          )
        );

        setOpenTime(
          toText(
            data?.openTime ||
              data?.OPEN_TIME ||
              stored?.openTime ||
              stored?.OPEN_TIME
          )
        );

        setCloseTime(
          toText(
            data?.closeTime ||
              data?.CLOSE_TIME ||
              stored?.closeTime ||
              stored?.CLOSE_TIME
          )
        );

        setRestDay(
          toText(
            data?.restDay ||
              data?.REST_DAY ||
              stored?.restDay ||
              stored?.REST_DAY
          )
        );

        setdescription(
          toText(
            data?.description ||
              data?.DESCRIPTION ||
              stored?.description ||
              stored?.DESCRIPTION
          )
        );

        const marketingRes =
          await getMerchantMarketingSummary(storedMerchantId);

        const marketingData =
          marketingRes?.data?.data ||
          marketingRes?.data ||
          marketingRes;

        setMarketing(marketingData);
      } catch (error) {
        console.error("Failed to load merchant profile:", error);
        setMerchant(stored);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }

      if (bannerPreview.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [logoPreview, bannerPreview]);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = String(reader.result || "");

        resolve(result.includes(",") ? result.split(",")[1] : result);
      };

      reader.onerror = () => reject(new Error(t.unableReadImage));
      reader.readAsDataURL(file);
    });
  }

  const merchantId = merchant?.merchantId || merchant?.MERCHANT_ID || "-";

  const merchantName =
    merchant?.displayName ||
    merchant?.businessName ||
    merchant?.DISPLAY_NAME ||
    merchant?.BUSINESS_NAME ||
    businessName ||
    t.fallbackMerchant;

  async function handleUploadLogo() {
    if (!logoFile) {
      alert(t.chooseLogo);
      return;
    }

    if (!merchantId || merchantId === "-") {
      alert(t.merchantIdMissing);
      return;
    }

    try {
      setUploadingLogo(true);

      const base64 = await fileToBase64(logoFile);

      const res = await uploadMerchantLogo({
        merchantId,
        fileName: logoFile.name,
        base64,
      });

      const data = res?.data?.data || res?.data || res?.result || res;
      const imageUrl = data?.imageUrl || data?.data?.imageUrl || "";

      if (!imageUrl) {
        throw new Error(t.logoUrlMissing);
      }

      setMerchant((old: any) => ({
        ...old,
        logoUrl: imageUrl,
        LOGO_URL: imageUrl,
      }));

      let stored: any = {};

      try {
        stored = JSON.parse(localStorage.getItem("merchant") || "{}");
      } catch {
        stored = {};
      }

      localStorage.setItem(
        "merchant",
        JSON.stringify({
          ...stored,
          logoUrl: imageUrl,
          LOGO_URL: imageUrl,
        })
      );

      setLogoPreview(imageUrl);
      setLogoFile(null);
      alert(t.logoUploaded);
    } catch (error: any) {
      alert(error?.message || t.logoUploadFailed);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleUploadBanner() {
    if (!bannerFile) {
      alert(t.chooseBanner);
      return;
    }

    if (!merchantId || merchantId === "-") {
      alert(t.merchantIdMissing);
      return;
    }

    try {
      setUploadingBanner(true);

      const base64 = await fileToBase64(bannerFile);

      const res = await uploadMerchantBanner({
        merchantId,
        fileName: bannerFile.name,
        base64,
      });

      const data = res?.data?.data || res?.data || res?.result || res;
      const imageUrl = data?.imageUrl || data?.data?.imageUrl || "";

      if (!imageUrl) {
        throw new Error(t.bannerUrlMissing);
      }

      setMerchant((old: any) => ({
        ...old,
        bannerUrl: imageUrl,
        BANNER_URL: imageUrl,
      }));

      let stored: any = {};

      try {
        stored = JSON.parse(localStorage.getItem("merchant") || "{}");
      } catch {
        stored = {};
      }

      localStorage.setItem(
        "merchant",
        JSON.stringify({
          ...stored,
          bannerUrl: imageUrl,
          BANNER_URL: imageUrl,
        })
      );

      setBannerPreview(imageUrl);
      setBannerFile(null);
      alert(t.bannerUploaded);
    } catch (error: any) {
      alert(error?.message || t.bannerUploadFailed);
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handleSaveProfile() {
    const cleanBusinessName = toText(businessName).trim();
    const cleanPhone = toText(phone).trim();
    const cleanAddress = toText(address).trim();
    const cleanDescription = toText(description).trim();
    const cleanOpenTime = toText(openTime).trim();
    const cleanCloseTime = toText(closeTime).trim();
    const cleanRestDay = toText(restDay).trim();

    if (!cleanBusinessName) {
      alert(t.businessNameRequired);
      return;
    }

    if (!cleanPhone) {
      alert(t.phoneRequired);
      return;
    }

    if (!cleanAddress) {
      alert(t.addressRequired);
      return;
    }

    if (
      (cleanOpenTime && !cleanCloseTime) ||
      (!cleanOpenTime && cleanCloseTime)
    ) {
      alert(t.selectBothTimes);
      return;
    }

    try {
      setSaving(true);

      await updateMerchantProfile({
        merchantId,
        businessName: cleanBusinessName,
        phone: cleanPhone,
        address: cleanAddress,
        openTime: cleanOpenTime,
        closeTime: cleanCloseTime,
        restDay: cleanRestDay,
        description: cleanDescription,
      });

      const nextMerchant = {
        ...merchant,

        businessName: cleanBusinessName,
        BUSINESS_NAME: cleanBusinessName,

        displayName: cleanBusinessName,
        DISPLAY_NAME: cleanBusinessName,

        phone: cleanPhone,
        PHONE: cleanPhone,

        address: cleanAddress,
        ADDRESS: cleanAddress,

        openTime: cleanOpenTime,
        OPEN_TIME: cleanOpenTime,

        closeTime: cleanCloseTime,
        CLOSE_TIME: cleanCloseTime,

        restDay: cleanRestDay,
        REST_DAY: cleanRestDay,

        description: cleanDescription,
      };

      setMerchant(nextMerchant);

      let stored: any = {};

      try {
        stored = JSON.parse(localStorage.getItem("merchant") || "{}");
      } catch {
        stored = {};
      }

      localStorage.setItem(
        "merchant",
        JSON.stringify({
          ...stored,
          ...nextMerchant,
        })
      );

      alert(t.profileUpdated);
    } catch (error: any) {
      alert(error?.message || t.updateFailed);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    /*
     * Clear both RewardHub account sessions.
     *
     * A device may previously have logged in as both Merchant and Member.
     * Removing only the Merchant record would leave the old Member session
     * available to other pages and to the support identity resolver.
     */
    localStorage.removeItem("merchant");
    localStorage.removeItem("member");

    /*
     * Clear the identity remembered by the RewardHub Tawk integration.
     * The key is stored in sessionStorage by SupportModal.
     */
    sessionStorage.removeItem(
      "rewardhub_tawk_identity"
    );

    /*
     * Use replace so the authenticated profile page is not kept in the
     * browser history after logout.
     */
    router.replace(
      "/merchant/login"
    );
  }

  if (loading) {
    return (
      <>
        <MerchantNav />

        <main className="min-h-screen bg-[#f6f7fb] px-4 py-10 text-center text-sm font-black text-slate-500 sm:px-8">
          {t.loadingProfile}
        </main>
      </>
    );
  }

  const rewardCreditLimit =
    marketing?.rewardCredits?.redemptionLimit || 30;

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-2xl sm:rounded-[2rem] md:rounded-[2.5rem]">
            <div className="relative p-5 sm:p-7 md:p-10">
              <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-sm sm:tracking-[0.25em]">
                  {t.merchantProfile}
                </p>

                <h1 className="mt-3 break-words text-3xl font-black sm:text-4xl md:text-6xl">
                  {merchantName}
                </h1>

                <p className="mt-2 text-[11px] font-bold text-slate-400 sm:mt-3 sm:text-sm">
                  {merchantId}
                </p>
              </div>
            </div>
          </div>

          <SectionCard
            title={t.merchantBranding}
            description={t.merchantBrandingDescription}
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <BrandingCard title={t.logo} description={t.logoDescription}>
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-32 sm:w-32 sm:rounded-3xl">
                  {logoPreview || merchant?.logoUrl || merchant?.LOGO_URL ? (
                    <SmartImage
                      src={
                        logoPreview ||
                        merchant?.logoUrl ||
                        merchant?.LOGO_URL ||
                        ""
                      }
                      alt={t.merchantLogo}
                      fallbackLabel="LOGO"
                      width={600}
                      className="h-full w-full object-contain p-2"
                      fallbackClassName="text-xl sm:text-3xl"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-300 sm:text-3xl">
                      LOGO
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] || null;

                    if (
                      selectedFile &&
                      selectedFile.size > 2 * 1024 * 1024
                    ) {
                      alert(t.logoTooLarge);
                      event.target.value = "";
                      return;
                    }

                    if (logoPreview.startsWith("blob:")) {
                      URL.revokeObjectURL(logoPreview);
                    }

                    setLogoFile(selectedFile);

                    if (selectedFile) {
                      setLogoPreview(URL.createObjectURL(selectedFile));
                    }
                  }}
                  className="mt-4 block w-full text-[10px] font-bold text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-[10px] file:font-black file:text-white sm:text-sm sm:file:rounded-xl sm:file:px-4 sm:file:text-xs"
                />

                <button
                  type="button"
                  onClick={handleUploadLogo}
                  disabled={!logoFile || uploadingLogo}
                  className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                >
                  {uploadingLogo ? t.uploading : t.uploadLogo}
                </button>
              </BrandingCard>

              <BrandingCard
                title={t.banner}
                description={t.bannerDescription}
              >
                <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-sm sm:h-40 sm:rounded-3xl">
                  {bannerPreview ||
                  merchant?.bannerUrl ||
                  merchant?.BANNER_URL ? (
                    <SmartImage
                      src={
                        bannerPreview ||
                        merchant?.bannerUrl ||
                        merchant?.BANNER_URL ||
                        ""
                      }
                      alt={t.merchantBanner}
                      fallbackLabel="BANNER"
                      width={1800}
                      className="h-full w-full object-cover"
                      fallbackClassName="bg-slate-950 text-xl text-slate-600 sm:text-3xl"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-600 sm:text-3xl">
                      BANNER
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] || null;

                    if (
                      selectedFile &&
                      selectedFile.size > 3 * 1024 * 1024
                    ) {
                      alert(t.bannerTooLarge);
                      event.target.value = "";
                      return;
                    }

                    if (bannerPreview.startsWith("blob:")) {
                      URL.revokeObjectURL(bannerPreview);
                    }

                    setBannerFile(selectedFile);

                    if (selectedFile) {
                      setBannerPreview(URL.createObjectURL(selectedFile));
                    }
                  }}
                  className="mt-4 block w-full text-[10px] font-bold text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-[10px] file:font-black file:text-white sm:text-sm sm:file:rounded-xl sm:file:px-4 sm:file:text-xs"
                />

                <button
                  type="button"
                  onClick={handleUploadBanner}
                  disabled={!bannerFile || uploadingBanner}
                  className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                >
                  {uploadingBanner ? t.uploading : t.uploadBanner}
                </button>
              </BrandingCard>
            </div>
          </SectionCard>

          <SectionCard
            title={t.businessInformation}
            description={t.businessInformationDescription}
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <FieldCard label={t.businessName}>
                <input
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  className={fieldClass}
                  placeholder={t.businessNamePlaceholder}
                />
              </FieldCard>

              <FieldCard label={t.phone}>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={fieldClass}
                  placeholder="60123456789"
                />
              </FieldCard>

              <FieldCard label={t.openingTime}>
                <input
                  type="time"
                  value={openTime}
                  onChange={(event) => setOpenTime(event.target.value)}
                  className={fieldClass}
                />
              </FieldCard>

              <FieldCard label={t.closingTime}>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(event) => setCloseTime(event.target.value)}
                  className={fieldClass}
                />
              </FieldCard>

              <FieldCard label={t.restDay}>
                <select
                  value={restDay}
                  onChange={(event) => setRestDay(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">{t.noRestDay}</option>

                  {restDayOptions.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </FieldCard>

              <InfoFieldCard
                label={t.category}
                value={merchant?.category || merchant?.CATEGORY || "-"}
              />

              <div className="col-span-2">
                <FieldCard label={t.businessAddress}>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className={`${fieldClass} resize-none`}
                    placeholder={t.addressPlaceholder}
                  />
                </FieldCard>
              </div>

              <div className="col-span-2">
                <FieldCard label={t.aboutMerchant}>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(event) => setdescription(event.target.value)}
                    className={`${fieldClass} resize-none`}
                    placeholder={t.aboutPlaceholder}
                  />

                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400 sm:text-xs">
                    <span>{t.publicContentNote}</span>

                    <span>
                      {fillText(t.characters, {
                        count: description.length,
                      })}
                    </span>
                  </div>
                </FieldCard>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white shadow-xl transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-6 sm:rounded-2xl sm:py-5 sm:text-sm"
            >
              {saving ? t.savingChanges : t.saveBusinessInformation}
            </button>
          </SectionCard>

          <SectionCard
            title={t.merchantSettings}
            description={t.merchantSettingsDescription}
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <InfoFieldCard label={t.merchantId} value={merchantId} />

              <InfoFieldCard
                label={t.loginEmail}
                value={merchant?.loginEmail || merchant?.LOGIN_EMAIL || "-"}
              />

              <InfoFieldCard
                label={t.status}
                value={merchant?.status || merchant?.STATUS || "-"}
              />

              <InfoFieldCard
                label={t.marketingBudget}
                value={`${
                  merchant?.marketingBudget ||
                  merchant?.MARKETING_BUDGET ||
                  0
                }%`}
              />

              <div className="col-span-2">
                <InfoFieldCard
                  label={t.rewardCredits}
                  value={
                    marketing?.rewardCredits?.acceptRewardCredits === true
                      ? fillText(t.enabledWithLimit, {
                          limit: rewardCreditLimit,
                        })
                      : t.disabled
                  }
                />
              </div>
            </div>
          </SectionCard>

          {merchantId && merchantId !== "-" ? (
            <div className="mt-5 sm:mt-6">
              <PushNotificationManager
                userType="MERCHANT"
                userId={merchantId}
              />
            </div>
          ) : null}

          <SectionCard
            title={t.security}
            description={t.securityDescription}
          >
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              <SecurityActionCard
                title={t.securityCenter}
                description={t.securityCenterDescription}
                openLabel={t.open}
                onClick={() =>
                  router.push("/merchant/security")
                }
              />

              <SecurityActionCard
                title={t.changePassword}
                description={t.changePasswordDescription}
                openLabel={t.open}
                onClick={() =>
                  router.push("/merchant/profile/change-password")
                }
              />

              <SecurityActionCard
                title={t.manageDevices}
                description={t.manageDevicesDescription}
                openLabel={t.open}
                onClick={() =>
                  router.push("/merchant/devices")
                }
              />
            </div>
          </SectionCard>

          <div className="mt-5 rounded-[1.75rem] border border-red-100 bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
            <h2 className="text-xl font-black text-red-600 sm:text-2xl">
              {t.account}
            </h2>

            <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">
              {t.accountDescription}
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 w-full rounded-xl bg-red-600 py-3 text-xs font-black text-white shadow-xl transition hover:bg-red-700 sm:mt-6 sm:rounded-2xl sm:py-5 sm:text-sm"
            >
              {t.logout}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
      <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
        {title}
      </h2>

      <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">
        {description}
      </p>

      <div className="mt-5 sm:mt-6">{children}</div>
    </section>
  );
}

function BrandingCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-3 sm:rounded-[2rem] sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.15em]">
        {title}
      </p>

      <div className="mt-3">{children}</div>

      <p className="mt-3 text-[9px] font-bold leading-4 text-slate-400 sm:text-xs">
        {description}
      </p>
    </div>
  );
}

function FieldCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[1.5rem] bg-slate-50 p-3 sm:rounded-[2rem] sm:p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.15em]">
        {label}
      </p>

      {children}
    </div>
  );
}

function InfoFieldCard({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="min-w-0 rounded-[1.5rem] bg-slate-50 p-3 sm:rounded-[2rem] sm:p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.15em]">
        {label}
      </p>

      <p className="mt-2 break-words text-xs font-black text-slate-950 sm:mt-3 sm:text-lg">
        {value || "-"}
      </p>
    </div>
  );
}

function SecurityActionCard({
  title,
  description,
  openLabel,
  onClick,
}: {
  title: string;
  description: string;
  openLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white sm:p-5"
    >
      <p className="text-sm font-black text-slate-950 sm:text-lg">
        {title}
      </p>

      <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500 sm:text-sm sm:leading-6">
        {description}
      </p>

      <p className="mt-3 text-xs font-black text-slate-950 sm:text-sm">
        {openLabel}
      </p>
    </button>
  );
}