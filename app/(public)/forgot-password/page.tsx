"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import {
  requestMemberPasswordReset,
  resetMemberPassword,
} from "@/lib/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset" | "success">(
    "email"
  );

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
      alert("Please enter your email");
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
        "If this email is registered, a verification code has been sent."
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to send verification code"
      );
    } finally {
      setSending(false);
    }
  }

  async function handleResetPassword() {
    if (!otp.trim()) {
      alert("Please enter the verification code");
      return;
    }

    if (otp.trim().length !== 6) {
      alert("Verification code must be 6 digits");
      return;
    }

    if (newPassword.length < 6) {
      alert(
        "Password must be at least 6 characters"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setResetting(true);

      await resetMemberPassword({
        email,
        otp: otp.trim(),
        newPassword,
      });

      setStep("success");
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to reset password"
      );
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),#f8fafc]">
        <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto w-full max-w-md rounded-[1.75rem] bg-white p-5 shadow-2xl sm:rounded-[2rem] sm:p-8">
            <div className="text-center">
              <img
                src="/rewardhub-logo.png"
                alt="RewardHub"
                className="mx-auto h-14 w-auto object-contain sm:h-16"
              />

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 sm:mt-6 sm:text-xs">
                Account Recovery
              </p>

              <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                {step === "email" &&
                  "Forgot Password"}

                {step === "reset" &&
                  "Reset Password"}

                {step === "success" &&
                  "Password Updated"}
              </h1>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {step === "email" &&
                  "Enter your registered email to receive a verification code."}

                {step === "reset" &&
                  `Enter the 6-digit code sent to ${email}.`}

                {step === "success" &&
                  "Your password has been reset successfully."}
              </p>
            </div>

            {step === "email" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSendCode();
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
                  placeholder="Registered Email"
                />

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl disabled:opacity-50 sm:rounded-2xl"
                >
                  {sending
                    ? "Sending Code..."
                    : "Send Verification Code"}
                </button>
              </form>
            )}

            {step === "reset" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleResetPassword();
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-4 pr-20 text-sm font-semibold outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-5"
                    placeholder="New Password"
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
                      ? "Hide"
                      : "Show"}
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 text-sm font-semibold outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-5"
                  placeholder="Confirm New Password"
                />

                <button
                  type="submit"
                  disabled={resetting}
                  className="w-full rounded-xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl disabled:opacity-50 sm:rounded-2xl"
                >
                  {resetting
                    ? "Resetting Password..."
                    : "Reset Password"}
                </button>

                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sending}
                  className="w-full rounded-xl bg-slate-100 py-4 text-xs font-black text-slate-700 disabled:opacity-50 sm:rounded-2xl"
                >
                  {sending
                    ? "Sending..."
                    : "Resend Code"}
                </button>
              </form>
            )}

            {step === "success" && (
              <div className="mt-8 rounded-[1.5rem] bg-emerald-50 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">
                  ✓
                </div>

                <h2 className="mt-4 text-xl font-black text-emerald-950">
                  Password Reset Complete
                </h2>

                <Link
                  href="/login"
                  className="mt-6 block rounded-xl bg-slate-950 py-4 text-sm font-black text-white no-underline sm:rounded-2xl"
                >
                  Return to Login
                </Link>
              </div>
            )}

            {step !== "success" && (
              <Link
                href="/login"
                className="mt-6 block text-center text-xs font-black text-slate-500 no-underline"
              >
                ← Back to Login
              </Link>
            )}
          </div>
        </section>
      </main>
    </>
  );
}