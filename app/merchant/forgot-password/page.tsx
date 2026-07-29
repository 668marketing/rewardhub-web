"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import {
  requestMerchantPasswordReset,
  resetMerchantPassword,
} from "@/lib/api";

type Step = "email" | "reset" | "success";
type Language = "en" | "zh" | "ms";

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations = {
  en: {
    accountRecovery: "Merchant Account Recovery",
    forgotPassword: "Forgot Password",
    resetPassword: "Reset Password",
    passwordUpdated: "Password Updated",
    emailDescription:
      "Enter your merchant login email to receive a verification code.",
    resetDescription: (email: string) =>
      `Enter the 6-digit code sent to ${email}.`,
    successDescription:
      "Your merchant password has been reset successfully.",
    merchantLoginEmail: "Merchant Login Email",
    sendingCode: "Sending Code...",
    sendVerificationCode: "Send Verification Code",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    hide: "Hide",
    show: "Show",
    resettingPassword: "Resetting Password...",
    sending: "Sending...",
    resendCode: "Resend Code",
    passwordResetComplete: "Password Reset Complete",
    returnToLogin: "Return to Merchant Login",
    backToLogin: "← Back to Merchant Login",
    loading: "Loading RewardHub...",
    enterLoginEmail: "Please enter your login email",
    codeSent:
      "If this email is registered, a verification code has been sent.",
    unableSendCode: "Unable to send verification code",
    enterCode: "Please enter the verification code",
    codeSixDigits: "Verification code must be 6 digits",
    passwordMin: "Password must be at least 6 characters",
    passwordsMismatch: "Passwords do not match",
    unableReset: "Unable to reset password",
  },
  zh: {
    accountRecovery: "商家账户恢复",
    forgotPassword: "忘记密码",
    resetPassword: "重设密码",
    passwordUpdated: "密码已更新",
    emailDescription: "输入商家登录邮箱以接收验证码。",
    resetDescription: (email: string) =>
      `请输入发送至 ${email} 的六位数验证码。`,
    successDescription: "您的商家密码已成功重设。",
    merchantLoginEmail: "商家登录邮箱",
    sendingCode: "正在发送验证码...",
    sendVerificationCode: "发送验证码",
    newPassword: "新密码",
    confirmNewPassword: "确认新密码",
    hide: "隐藏",
    show: "显示",
    resettingPassword: "正在重设密码...",
    sending: "正在发送...",
    resendCode: "重新发送验证码",
    passwordResetComplete: "密码重设完成",
    returnToLogin: "返回商家登录",
    backToLogin: "← 返回商家登录",
    loading: "正在加载 RewardHub...",
    enterLoginEmail: "请输入您的登录邮箱",
    codeSent: "如果该邮箱已注册，验证码将发送至您的邮箱。",
    unableSendCode: "无法发送验证码",
    enterCode: "请输入验证码",
    codeSixDigits: "验证码必须是六位数字",
    passwordMin: "密码至少需要六个字符",
    passwordsMismatch: "两次输入的密码不一致",
    unableReset: "无法重设密码",
  },
  ms: {
    accountRecovery: "Pemulihan Akaun Pedagang",
    forgotPassword: "Lupa Kata Laluan",
    resetPassword: "Tetapkan Semula Kata Laluan",
    passwordUpdated: "Kata Laluan Dikemas Kini",
    emailDescription:
      "Masukkan e-mel log masuk pedagang untuk menerima kod pengesahan.",
    resetDescription: (email: string) =>
      `Masukkan kod 6 digit yang dihantar ke ${email}.`,
    successDescription:
      "Kata laluan pedagang anda telah berjaya ditetapkan semula.",
    merchantLoginEmail: "E-mel Log Masuk Pedagang",
    sendingCode: "Sedang Menghantar Kod...",
    sendVerificationCode: "Hantar Kod Pengesahan",
    newPassword: "Kata Laluan Baharu",
    confirmNewPassword: "Sahkan Kata Laluan Baharu",
    hide: "Sembunyi",
    show: "Tunjuk",
    resettingPassword: "Sedang Menetapkan Semula...",
    sending: "Sedang Menghantar...",
    resendCode: "Hantar Semula Kod",
    passwordResetComplete: "Penetapan Semula Selesai",
    returnToLogin: "Kembali ke Log Masuk Pedagang",
    backToLogin: "← Kembali ke Log Masuk Pedagang",
    loading: "Sedang Memuatkan RewardHub...",
    enterLoginEmail: "Sila masukkan e-mel log masuk anda",
    codeSent:
      "Jika e-mel ini didaftarkan, kod pengesahan telah dihantar.",
    unableSendCode: "Kod pengesahan tidak dapat dihantar",
    enterCode: "Sila masukkan kod pengesahan",
    codeSixDigits: "Kod pengesahan mesti mempunyai 6 digit",
    passwordMin: "Kata laluan mestilah sekurang-kurangnya 6 aksara",
    passwordsMismatch: "Kata laluan tidak sepadan",
    unableReset: "Kata laluan tidak dapat ditetapkan semula",
  },
} as const;

function normalizeLanguage(value: unknown): Language {
  const language = String(value || "").toLowerCase();

  if (language === "zh" || language === "cn") return "zh";
  if (language === "ms" || language === "bm" || language === "my") {
    return "ms";
  }

  return "en";
}

function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";

  try {
    return normalizeLanguage(
      window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    );
  } catch {
    return "en";
  }
}

function MerchantForgotPasswordContent() {
  const [language, setLanguage] = useState<Language>("en");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);

  const text = useMemo(() => translations[language], [language]);

  useEffect(() => {
    setLanguage(getStoredLanguage());

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{
        language?: string;
        locale?: string;
      }>;

      setLanguage(
        normalizeLanguage(
          customEvent.detail?.language ||
            customEvent.detail?.locale ||
            getStoredLanguage()
        )
      );
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === LANGUAGE_STORAGE_KEY) {
        setLanguage(normalizeLanguage(event.newValue));
      }
    }

    window.addEventListener(
      "rewardhub-language-change",
      handleLanguageChange
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "rewardhub-language-change",
        handleLanguageChange
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  async function handleSendCode() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert(text.enterLoginEmail);
      return;
    }

    try {
      setSending(true);

      await requestMerchantPasswordReset({
        email: cleanEmail,
      });

      setEmail(cleanEmail);
      setStep("reset");
      alert(text.codeSent);
    } catch (error: any) {
      alert(error?.message || text.unableSendCode);
    } finally {
      setSending(false);
    }
  }

  async function handleResetPassword() {
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      alert(text.enterCode);
      return;
    }

    if (cleanOtp.length !== 6) {
      alert(text.codeSixDigits);
      return;
    }

    if (newPassword.length < 6) {
      alert(text.passwordMin);
      return;
    }

    if (newPassword !== confirmPassword) {
      alert(text.passwordsMismatch);
      return;
    }

    try {
      setResetting(true);

      await resetMerchantPassword({
        email,
        otp: cleanOtp,
        newPassword,
      });

      setStep("success");
    } catch (error: any) {
      alert(error?.message || text.unableReset);
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_35%),#f8fafc] px-4 py-8 sm:px-6 sm:py-12">
        <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-md items-center">
          <div className="w-full rounded-[1.75rem] bg-white p-5 shadow-2xl sm:rounded-[2.5rem] sm:p-8">
            <div className="text-center">
              <img
                src="/rewardhub-logo.png"
                alt="RewardHub"
                className="mx-auto h-14 w-auto object-contain sm:h-16"
              />

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-amber-600 sm:mt-6 sm:text-xs">
                {text.accountRecovery}
              </p>

              <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                {step === "email" && text.forgotPassword}
                {step === "reset" && text.resetPassword}
                {step === "success" && text.passwordUpdated}
              </h1>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {step === "email" && text.emailDescription}
                {step === "reset" && text.resetDescription(email)}
                {step === "success" && text.successDescription}
              </p>
            </div>

            {step === "email" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSendCode();
                }}
                className="mt-7 space-y-4 sm:mt-8"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 text-sm font-semibold outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 sm:rounded-2xl sm:px-5"
                  placeholder={text.merchantLoginEmail}
                />

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl disabled:opacity-50 sm:rounded-2xl"
                >
                  {sending
                    ? text.sendingCode
                    : text.sendVerificationCode}
                </button>
              </form>
            )}

            {step === "reset" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleResetPassword();
                }}
                className="mt-7 space-y-4 sm:mt-8"
              >
                <input
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-2xl font-black tracking-[0.35em] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 sm:rounded-2xl sm:tracking-[0.4em]"
                  placeholder="000000"
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-slate-200 px-4 py-4 pr-20 text-sm font-semibold outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 sm:rounded-2xl sm:px-5"
                    placeholder={text.newPassword}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 text-[10px] font-black text-slate-500"
                  >
                    {showPassword ? text.hide : text.show}
                  </button>
                </div>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 text-sm font-semibold outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 sm:rounded-2xl sm:px-5"
                  placeholder={text.confirmNewPassword}
                />

                <button
                  type="submit"
                  disabled={resetting}
                  className="w-full rounded-xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl disabled:opacity-50 sm:rounded-2xl"
                >
                  {resetting
                    ? text.resettingPassword
                    : text.resetPassword}
                </button>

                <button
                  type="button"
                  onClick={() => void handleSendCode()}
                  disabled={sending}
                  className="w-full rounded-xl bg-slate-100 py-4 text-xs font-black text-slate-700 disabled:opacity-50 sm:rounded-2xl"
                >
                  {sending ? text.sending : text.resendCode}
                </button>
              </form>
            )}

            {step === "success" && (
              <div className="mt-8 rounded-[1.5rem] bg-emerald-50 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl font-black text-white">
                  ✓
                </div>

                <h2 className="mt-4 text-xl font-black text-emerald-950">
                  {text.passwordResetComplete}
                </h2>

                <Link
                  href="/merchant/login"
                  className="mt-6 block rounded-xl bg-slate-950 py-4 text-sm font-black text-white no-underline sm:rounded-2xl"
                >
                  {text.returnToLogin}
                </Link>
              </div>
            )}

            {step !== "success" && (
              <Link
                href="/merchant/login"
                className="mt-6 block text-center text-xs font-black text-slate-500 no-underline"
              >
                {text.backToLogin}
              </Link>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function MerchantForgotPasswordLoading() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    setLanguage(getStoredLanguage());
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />

        <p className="mt-4 text-sm font-semibold text-slate-500">
          {translations[language].loading}
        </p>
      </div>
    </main>
  );
}

export default function MerchantForgotPasswordPage() {
  return (
    <Suspense fallback={<MerchantForgotPasswordLoading />}>
      <MerchantForgotPasswordContent />
    </Suspense>
  );
}