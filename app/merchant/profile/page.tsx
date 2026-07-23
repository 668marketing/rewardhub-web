"use client";

import { useEffect, useState } from "react";
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

const restDayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const fieldClass =
  "mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:px-4 sm:text-sm";

  function toText(value: any) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return "";
}

export default function MerchantProfilePage() {
  const router = useRouter();

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

  function getApiData(res: any) {
    let data = res;
    while (data?.data && !data?.merchantId && !data?.MERCHANT_ID) {
      data = data.data;
    }
    return data;
  }

  useEffect(() => {
    async function load() {
      const stored = JSON.parse(localStorage.getItem("merchant") || "{}");
      const storedMerchantId = stored?.merchantId || stored?.MERCHANT_ID || "";

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

        const marketingRes = await getMerchantMarketingSummary(storedMerchantId);
        const marketingData = marketingRes?.data?.data || marketingRes?.data || marketingRes;
        setMarketing(marketingData);
      } catch (error) {
        console.error("Failed to load merchant profile:", error);
        setMerchant(stored);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      if (bannerPreview.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    };
  }, [logoPreview, bannerPreview]);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.includes(",") ? result.split(",")[1] : result);
      };
      reader.onerror = () => reject(new Error("Unable to read image"));
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
    "Merchant";

  async function handleUploadLogo() {
    if (!logoFile) return alert("Please choose a logo image");
    if (!merchantId || merchantId === "-") return alert("Merchant ID missing");

    try {
      setUploadingLogo(true);
      const base64 = await fileToBase64(logoFile);
      const res = await uploadMerchantLogo({ merchantId, fileName: logoFile.name, base64 });
      const data = res?.data?.data || res?.data || res?.result || res;
      const imageUrl = data?.imageUrl || data?.data?.imageUrl || "";
      if (!imageUrl) throw new Error("Logo URL missing");

      setMerchant((old: any) => ({ ...old, logoUrl: imageUrl, LOGO_URL: imageUrl }));
      const stored = JSON.parse(localStorage.getItem("merchant") || "{}");
      localStorage.setItem("merchant", JSON.stringify({ ...stored, logoUrl: imageUrl, LOGO_URL: imageUrl }));
      setLogoPreview(imageUrl);
      setLogoFile(null);
      alert("Logo uploaded successfully");
    } catch (error: any) {
      alert(error?.message || "Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleUploadBanner() {
    if (!bannerFile) return alert("Please choose a banner image");
    if (!merchantId || merchantId === "-") return alert("Merchant ID missing");

    try {
      setUploadingBanner(true);
      const base64 = await fileToBase64(bannerFile);
      const res = await uploadMerchantBanner({ merchantId, fileName: bannerFile.name, base64 });
      const data = res?.data?.data || res?.data || res?.result || res;
      const imageUrl = data?.imageUrl || data?.data?.imageUrl || "";
      if (!imageUrl) throw new Error("Banner URL missing");

      setMerchant((old: any) => ({ ...old, bannerUrl: imageUrl, BANNER_URL: imageUrl }));
      const stored = JSON.parse(localStorage.getItem("merchant") || "{}");
      localStorage.setItem("merchant", JSON.stringify({ ...stored, bannerUrl: imageUrl, BANNER_URL: imageUrl }));
      setBannerPreview(imageUrl);
      setBannerFile(null);
      alert("Banner uploaded successfully");
    } catch (error: any) {
      alert(error?.message || "Banner upload failed");
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handleSaveProfile() {
  const cleanBusinessName = toText(
    businessName
  ).trim();

  const cleanPhone = toText(phone).trim();
  const cleanAddress = toText(address).trim();

  const cleanDescription = toText(
    description
  ).trim();

  const cleanOpenTime = toText(openTime).trim();
  const cleanCloseTime = toText(closeTime).trim();
  const cleanRestDay = toText(restDay).trim();

  if (!cleanBusinessName) {
    return alert("Business Name is required");
  }

  if (!cleanPhone) {
    return alert("Phone is required");
  }

  if (!cleanAddress) {
    return alert("Address is required");
  }

  if (
    (cleanOpenTime && !cleanCloseTime) ||
    (!cleanOpenTime && cleanCloseTime)
  ) {
    return alert(
      "Please select both open and close time"
    );
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

    const stored = JSON.parse(
      localStorage.getItem("merchant") || "{}"
    );

    localStorage.setItem(
      "merchant",
      JSON.stringify({
        ...stored,
        ...nextMerchant,
      })
    );

    alert("Profile updated successfully");
  } catch (error: any) {
    alert(error?.message || "Update failed");
  } finally {
    setSaving(false);
  }
}

  function handleLogout() {
    localStorage.removeItem("merchant");
    router.push("/merchant/login");
  }

  if (loading) {
    return (
      <>
        <MerchantNav />
        <main className="min-h-screen bg-[#f6f7fb] px-4 py-10 text-center text-sm font-black text-slate-500 sm:px-8">
          Loading Profile...
        </main>
      </>
    );
  }

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
                  Merchant Profile
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

          <SectionCard title="Merchant Branding" description="Manage your public logo and cover banner.">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <BrandingCard title="Logo" description="Square image, PNG, JPG or WebP, under 2MB.">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-32 sm:w-32 sm:rounded-3xl">
                  {logoPreview || merchant?.logoUrl || merchant?.LOGO_URL ? (
                    <SmartImage
                      src={
                        logoPreview ||
                        merchant?.logoUrl ||
                        merchant?.LOGO_URL ||
                        ""
                      }
                      alt="Merchant Logo"
                      fallbackLabel="LOGO"
                      width={600}
                      className="h-full w-full object-contain p-2"
                      fallbackClassName="text-xl sm:text-3xl"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-300 sm:text-3xl">LOGO</span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    if (file && file.size > 2 * 1024 * 1024) {
                      alert("Logo must be smaller than 2MB");
                      event.target.value = "";
                      return;
                    }
                    setLogoFile(file);
                    if (file) setLogoPreview(URL.createObjectURL(file));
                  }}
                  className="mt-4 block w-full text-[10px] font-bold text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-[10px] file:font-black file:text-white sm:text-sm sm:file:rounded-xl sm:file:px-4 sm:file:text-xs"
                />

                <button
                  type="button"
                  onClick={handleUploadLogo}
                  disabled={!logoFile || uploadingLogo}
                  className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                >
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                </button>
              </BrandingCard>

              <BrandingCard title="Banner" description="Wide image, PNG, JPG or WebP, under 3MB.">
                <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-sm sm:h-40 sm:rounded-3xl">
                  {bannerPreview || merchant?.bannerUrl || merchant?.BANNER_URL ? (
                    <SmartImage
                      src={
                        bannerPreview ||
                        merchant?.bannerUrl ||
                        merchant?.BANNER_URL ||
                        ""
                      }
                      alt="Merchant Banner"
                      fallbackLabel="BANNER"
                      width={1800}
                      className="h-full w-full object-cover"
                      fallbackClassName="bg-slate-950 text-xl text-slate-600 sm:text-3xl"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-600 sm:text-3xl">BANNER</span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    if (file && file.size > 3 * 1024 * 1024) {
                      alert("Banner must be smaller than 3MB");
                      event.target.value = "";
                      return;
                    }
                    setBannerFile(file);
                    if (file) setBannerPreview(URL.createObjectURL(file));
                  }}
                  className="mt-4 block w-full text-[10px] font-bold text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-[10px] file:font-black file:text-white sm:text-sm sm:file:rounded-xl sm:file:px-4 sm:file:text-xs"
                />

                <button
                  type="button"
                  onClick={handleUploadBanner}
                  disabled={!bannerFile || uploadingBanner}
                  className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                >
                  {uploadingBanner ? "Uploading..." : "Upload Banner"}
                </button>
              </BrandingCard>
            </div>
          </SectionCard>

          <SectionCard title="Business Information" description="Update the public information shown on your merchant page.">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <FieldCard label="Business Name">
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={fieldClass} placeholder="Business name" />
              </FieldCard>

              <FieldCard label="Phone">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} placeholder="60123456789" />
              </FieldCard>

              <FieldCard label="Opening Time">
                <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={fieldClass} />
              </FieldCard>

              <FieldCard label="Closing Time">
                <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={fieldClass} />
              </FieldCard>

              <FieldCard label="Rest Day">
                <select value={restDay} onChange={(e) => setRestDay(e.target.value)} className={fieldClass}>
                  <option value="">No Rest Day</option>
                  {restDayOptions.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </FieldCard>

              <InfoFieldCard label="Category" value={merchant?.category || merchant?.CATEGORY || "-"} />

              <div className="col-span-2">
                <FieldCard label="Business Address">
                  <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className={`${fieldClass} resize-none`} placeholder="Enter full business address" />
                </FieldCard>
              </div>

              <div className="col-span-2">
                <FieldCard label="About Merchant">
                  <textarea rows={5} value={description} onChange={(e) => setdescription(e.target.value)} className={`${fieldClass} resize-none`} placeholder="Introduce your business, products and services..." />
                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400 sm:text-xs">
                    <span>This content appears on your public merchant page.</span>
                    <span>{description.length} characters</span>
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
              {saving ? "Saving Changes..." : "Save Business Information"}
            </button>
          </SectionCard>

          <SectionCard title="Merchant Settings" description="Important account and reward settings.">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <InfoFieldCard label="Merchant ID" value={merchantId} />
              <InfoFieldCard label="Login Email" value={merchant?.loginEmail || merchant?.LOGIN_EMAIL || "-"} />
              <InfoFieldCard label="Status" value={merchant?.status || merchant?.STATUS || "-"} />
              <InfoFieldCard label="Marketing Budget" value={`${merchant?.marketingBudget || merchant?.MARKETING_BUDGET || 0}%`} />
              <div className="col-span-2">
                <InfoFieldCard
                  label="Reward Credits"
                  value={
                    marketing?.rewardCredits?.acceptRewardCredits === true
                      ? `Enabled (${marketing?.rewardCredits?.redemptionLimit || 30}%)`
                      : "Disabled"
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

          <SectionCard title="Security" description="Manage your merchant account password.">
            <button
              type="button"
              onClick={() => router.push("/merchant/profile/change-password")}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white sm:p-5"
            >
              <p className="text-sm font-black text-slate-950 sm:text-lg">Change Password</p>
              <p className="mt-1 text-[10px] font-bold text-slate-500 sm:text-sm">Update your merchant account password securely</p>
              <p className="mt-3 text-xs font-black text-slate-950 sm:text-sm">Open →</p>
            </button>
          </SectionCard>

          <div className="mt-5 rounded-[1.75rem] border border-red-100 bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
            <h2 className="text-xl font-black text-red-600 sm:text-2xl">Account</h2>
            <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">Sign out from this merchant portal on the current device.</p>
            <button type="button" onClick={handleLogout} className="mt-5 w-full rounded-xl bg-red-600 py-3 text-xs font-black text-white shadow-xl transition hover:bg-red-700 sm:mt-6 sm:rounded-2xl sm:py-5 sm:text-sm">Logout</button>
          </div>
        </section>
      </main>
    </>
  );
}

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
      <h2 className="text-xl font-black text-slate-950 sm:text-2xl">{title}</h2>
      <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">{description}</p>
      <div className="mt-5 sm:mt-6">{children}</div>
    </section>
  );
}

function BrandingCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-3 sm:rounded-[2rem] sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.15em]">{title}</p>
      <div className="mt-3">{children}</div>
      <p className="mt-3 text-[9px] font-bold leading-4 text-slate-400 sm:text-xs">{description}</p>
    </div>
  );
}

function FieldCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[1.5rem] bg-slate-50 p-3 sm:rounded-[2rem] sm:p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.15em]">{label}</p>
      {children}
    </div>
  );
}

function InfoFieldCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="min-w-0 rounded-[1.5rem] bg-slate-50 p-3 sm:rounded-[2rem] sm:p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.15em]">{label}</p>
      <p className="mt-2 break-words text-xs font-black text-slate-950 sm:mt-3 sm:text-lg">{value || "-"}</p>
    </div>
  );
}

