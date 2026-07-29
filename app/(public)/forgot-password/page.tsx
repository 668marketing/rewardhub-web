"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import {
  requestMemberPasswordReset,
  resetMemberPassword,
} from "@/lib/api";

function ForgotPasswordContent() {
  const {
    language,
  } = useLanguage();

  const pageText = {
    en: {
      accountRecovery: "Account Recovery",
      forgotPassword: "Forgot Password",
      resetPassword: "Reset Password",
      passwordUpdated: "Password Updated",
      enterRegisteredEmail:
        "Enter your registered email to receive a verification code.",
      enterCodePrefix:
        "Enter the 6-digit code sent to",
      resetSuccess:
        "Your password has been reset successfully.",
      registeredEmail: "Registered Email",
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
      returnToLogin: "Return to Login",
      backToLogin: "Back to Login",
      enterEmail: "Please enter your email",
      codeSent:
        "If this email is registered, a verification code has been sent.",
      sendCodeFailed:
        "Unable to send verification code",
      enterCode:
        "Please enter the verification code",
      codeLength:
        "Verification code must be 6 digits",
      passwordLength:
        "Password must be at least 6 characters",
      passwordMismatch:
        "Passwords do not match",
      resetFailed:
        "Unable to reset password",
    },

    zh: {
      accountRecovery: "账户恢复",
      forgotPassword: "忘记密码",
      resetPassword: "重设密码",
      passwordUpdated: "密码已更新",
      enterRegisteredEmail:
        "请输入注册邮箱以接收验证码。",
      enterCodePrefix:
        "请输入发送至以下邮箱的6位验证码：",
      resetSuccess:
        "您的密码已成功重设。",
      registeredEmail: "注册邮箱",
      sendingCode: "正在发送验证码...",
      sendVerificationCode: "发送验证码",
      newPassword: "新密码",
      confirmNewPassword: "确认新密码",
      hide: "隐藏",
      show: "显示",
      resettingPassword: "正在重设密码...",
      sending: "发送中...",
      resendCode: "重新发送验证码",
      passwordResetComplete: "密码重设完成",
      returnToLogin: "返回登录",
      backToLogin: "返回登录",
      enterEmail: "请输入邮箱",
      codeSent:
        "如果此邮箱已注册，验证码已经发送。",
      sendCodeFailed:
        "无法发送验证码",
      enterCode:
        "请输入验证码",
      codeLength:
        "验证码必须是6位数字",
      passwordLength:
        "密码至少需要6个字符",
      passwordMismatch:
        "两次输入的密码不一致",
      resetFailed:
        "无法重设密码",
    },

    ms: {
      accountRecovery: "Pemulihan Akaun",
      forgotPassword: "Lupa Kata Laluan",
      resetPassword: "Tetapkan Semula Kata Laluan",
      passwordUpdated: "Kata Laluan Dikemas Kini",
      enterRegisteredEmail:
        "Masukkan e-mel berdaftar anda untuk menerima kod pengesahan.",
      enterCodePrefix:
        "Masukkan kod 6 digit yang dihantar ke",
      resetSuccess:
        "Kata laluan anda berjaya ditetapkan semula.",
      registeredEmail: "E-mel Berdaftar",
      sendingCode: "Sedang Menghantar Kod...",
      sendVerificationCode: "Hantar Kod Pengesahan",
      newPassword: "Kata Laluan Baharu",
      confirmNewPassword: "Sahkan Kata Laluan Baharu",
      hide: "Sembunyi",
      show: "Tunjuk",
      resettingPassword: "Sedang Menetapkan Semula...",
      sending: "Sedang Menghantar...",
      resendCode: "Hantar Semula Kod",
      passwordResetComplete:
        "Penetapan Semula Kata Laluan Selesai",
      returnToLogin: "Kembali ke Log Masuk",
      backToLogin: "Kembali ke Log Masuk",
      enterEmail: "Sila masukkan e-mel anda",
      codeSent:
        "Jika e-mel ini berdaftar, kod pengesahan telah dihantar.",
      sendCodeFailed:
        "Kod pengesahan tidak dapat dihantar",
      enterCode:
        "Sila masukkan kod pengesahan",
      codeLength:
        "Kod pengesahan mestilah 6 digit",
      passwordLength:
        "Kata laluan mestilah sekurang-kurangnya 6 aksara",
      passwordMismatch:
        "Kata laluan tidak sepadan",
      resetFailed:
        "Kata laluan tidak dapat ditetapkan semula",
    },
  } as const;

  const copy =
    pageText[language];
  const [step, setStep] = useState<
    "email" | "reset" | "success"
  >("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [sending, setSending] = useState(false);
  const [resetting, setResetting] =
    useState(false);

  async function handleSendCode() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert(copy.enterEmail);
      return;
    }

    try {
      setSending(true);

      await requestMemberPasswordReset({
        email: cleanEmail,
      });

      setEmail(cleanEmail);
      setStep("reset");

      alert(
        copy.codeSent
      );
    } catch (error: any) {
      alert(
        error?.message ||
          copy.sendCodeFailed
      );
    } finally {
      setSending(false);
    }
  }

  async function handleResetPassword() {
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      alert(copy.enterCode);
      return;
    }

    if (cleanOtp.length !== 6) {
      alert(copy.codeLength);
      return;
    }

    if (newPassword.length < 6) {
      alert(
        copy.passwordLength
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      alert(copy.passwordMismatch);
      return;
    }

    try {
      setResetting(true);

      await resetMemberPassword({
        email,
        otp: cleanOtp,
        newPassword,
      });

      setStep("success");
    } catch (error: any) {
      alert(
        error?.message ||
          copy.resetFailed
      );
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <Header />

      <main className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),#f8fafc]">
        <div className="absolute right-4 top-4 z-40 sm:right-6 sm:top-6">
          <LanguageSwitcher compact />
        </div>
        <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto w-full max-w-md rounded-[1.75rem] bg-white p-5 shadow-2xl sm:rounded-[2rem] sm:p-8">
            <div className="text-center">
              <img
                src="/rewardhub-logo.png"
                alt="RewardHub"
                className="mx-auto h-14 w-auto object-contain sm:h-16"
              />

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 sm:mt-6 sm:text-xs">
                {copy.accountRecovery}
              </p>

              <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                {step === "email" &&
                  copy.forgotPassword}

                {step === "reset" &&
                  copy.resetPassword}

                {step === "success" &&
                  copy.passwordUpdated}
              </h1>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {step === "email" &&
                  copy.enterRegisteredEmail}

                {step === "reset" &&
                  `${copy.enterCodePrefix} ${email}.`}

                {step === "success" &&
                  copy.resetSuccess}
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
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 text-sm font-semibold outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-5"
                  placeholder={copy.registeredEmail}
                />

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl"
                >
                  {sending
                    ? copy.sendingCode
                    : copy.sendVerificationCode}
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
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-2xl font-black tracking-[0.4em] outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl"
                  placeholder="000000"
                />

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-4 pr-20 text-sm font-semibold outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-5"
                    placeholder={copy.newPassword}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 text-[10px] font-black text-slate-500"
                  >
                    {showPassword
                      ? copy.hide
                      : copy.show}
                  </button>
                </div>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 text-sm font-semibold outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-5"
                  placeholder={copy.confirmNewPassword}
                />

                <button
                  type="submit"
                  disabled={resetting}
                  className="w-full rounded-xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl"
                >
                  {resetting
                    ? copy.resettingPassword
                    : copy.resetPassword}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void handleSendCode();
                  }}
                  disabled={sending}
                  className="w-full rounded-xl bg-slate-100 py-4 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl"
                >
                  {sending
                    ? copy.sending
                    : copy.resendCode}
                </button>
              </form>
            )}

            {step === "success" && (
              <div className="mt-8 rounded-[1.5rem] bg-emerald-50 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">
                  ✓
                </div>

                <h2 className="mt-4 text-xl font-black text-emerald-950">
                  {copy.passwordResetComplete}
                </h2>

                <Link
                  href="/login"
                  className="mt-6 block rounded-xl bg-slate-950 py-4 text-sm font-black text-white no-underline sm:rounded-2xl"
                >
                  {copy.returnToLogin}
                </Link>
              </div>
            )}

            {step !== "success" && (
              <Link
                href="/login"
                className="mt-6 block text-center text-xs font-black text-slate-500 no-underline"
              >
                ← {copy.backToLogin}
              </Link>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function ForgotPasswordLoading() {
  const {
    language,
  } = useLanguage();

  const loadingText = {
    en: "Loading RewardHub...",
    zh: "RewardHub 加载中...",
    ms: "RewardHub sedang dimuatkan...",
  } as const;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />

        <p className="mt-4 text-sm font-semibold text-slate-500">
          {loadingText[language]}
        </p>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordLoading />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}