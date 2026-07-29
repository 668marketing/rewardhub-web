"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MerchantNav from "@/components/layout/MerchantNav";
import { updateMerchantPassword } from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations = {
  en: {
    back: "← Back",
    title: "Change Password",
    description: "Update your merchant account password.",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    saving: "Saving...",
    changePassword: "Change Password",
    enterCurrentPassword: "Please enter current password.",
    enterNewPassword: "Please enter new password.",
    passwordTooShort: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    merchantIdMissing: "Merchant ID missing. Please log in again.",
    success: "Password changed successfully.",
    failed: "Unable to change password.",
  },
  zh: {
    back: "← 返回",
    title: "更改密码",
    description: "更新你的商家账户密码。",
    currentPassword: "当前密码",
    newPassword: "新密码",
    confirmNewPassword: "确认新密码",
    saving: "正在保存……",
    changePassword: "更改密码",
    enterCurrentPassword: "请输入当前密码。",
    enterNewPassword: "请输入新密码。",
    passwordTooShort: "密码至少需要 6 个字符。",
    passwordMismatch: "两次输入的密码不一致。",
    merchantIdMissing: "找不到商家 ID，请重新登录。",
    success: "密码更改成功。",
    failed: "无法更改密码。",
  },
  ms: {
    back: "← Kembali",
    title: "Tukar Kata Laluan",
    description: "Kemas kini kata laluan akaun pedagang anda.",
    currentPassword: "Kata Laluan Semasa",
    newPassword: "Kata Laluan Baharu",
    confirmNewPassword: "Sahkan Kata Laluan Baharu",
    saving: "Sedang Menyimpan...",
    changePassword: "Tukar Kata Laluan",
    enterCurrentPassword: "Sila masukkan kata laluan semasa.",
    enterNewPassword: "Sila masukkan kata laluan baharu.",
    passwordTooShort: "Kata laluan mesti sekurang-kurangnya 6 aksara.",
    passwordMismatch: "Kata laluan tidak sepadan.",
    merchantIdMissing: "ID pedagang tidak ditemui. Sila log masuk semula.",
    success: "Kata laluan berjaya ditukar.",
    failed: "Tidak dapat menukar kata laluan.",
  },
} as const;

function normalizeLanguage(value: string | null): LanguageCode {
  return value === "zh" || value === "ms" ? value : "en";
}

export default function MerchantChangePasswordPage() {
  const router = useRouter();

  const [language, setLanguage] = useState<LanguageCode>("en");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const t = useMemo(() => translations[language], [language]);

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

  async function handleSave() {
    let merchant: any = {};

    try {
      merchant = JSON.parse(localStorage.getItem("merchant") || "{}");
    } catch {
      merchant = {};
    }

    const merchantId =
      merchant?.merchantId ||
      merchant?.MERCHANT_ID ||
      "";

    if (!merchantId) {
      alert(t.merchantIdMissing);
      return;
    }

    if (!currentPassword) {
      alert(t.enterCurrentPassword);
      return;
    }

    if (!newPassword) {
      alert(t.enterNewPassword);
      return;
    }

    if (newPassword.length < 6) {
      alert(t.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      alert(t.passwordMismatch);
      return;
    }

    try {
      setSaving(true);

      await updateMerchantPassword({
        merchantId,
        currentPassword,
        newPassword,
      });

      alert(t.success);
      router.back();
    } catch (err: any) {
      alert(err?.message || t.failed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 pb-28 md:px-8">
        <section className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 text-sm font-black text-slate-500 hover:text-slate-900"
          >
            {t.back}
          </button>

          <div className="rounded-[2rem] bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-black text-slate-950">
              {t.title}
            </h1>

            <p className="mt-2 text-sm font-bold text-slate-500">
              {t.description}
            </p>

            <div className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  {t.currentPassword}
                </label>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  {t.newPassword}
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  {t.confirmNewPassword}
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold outline-none focus:border-slate-950"
                />
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="mt-4 w-full rounded-2xl bg-slate-950 py-5 text-sm font-black text-white transition hover:bg-black disabled:opacity-50"
              >
                {saving ? t.saving : t.changePassword}
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}