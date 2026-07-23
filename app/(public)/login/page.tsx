"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import Header from "@/components/layout/Header";
import {
  memberLogin,
} from "@/lib/api";

/* ============================================================
 * Member Login Error Message
 * ============================================================
 */

function getMemberLoginErrorMessage(
  error: unknown
) {
  let message = "";

  if (error instanceof Error) {
    message =
      error.message || "";
  } else if (
    typeof error === "string"
  ) {
    message = error;
  } else if (
    error &&
    typeof error === "object"
  ) {
    const objectError =
      error as {
        message?: unknown;
        error?: unknown;
      };

    message = String(
      objectError.message ||
        objectError.error ||
        ""
    );
  }

  const normalized =
    message
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  if (
    normalized.includes(
      "invalid password"
    ) ||
    normalized.includes(
      "incorrect password"
    ) ||
    normalized.includes(
      "wrong password"
    )
  ) {
    return "Incorrect password. Please try again.";
  }

  if (
    normalized.includes(
      "member not found"
    ) ||
    normalized.includes(
      "account not found"
    ) ||
    normalized.includes(
      "email not found"
    ) ||
    normalized.includes(
      "user not found"
    )
  ) {
    return "Member account not found. Please check your email or Member ID.";
  }

  if (
    normalized.includes(
      "account suspended"
    ) ||
    normalized.includes(
      "member suspended"
    ) ||
    normalized.includes(
      "account blocked"
    )
  ) {
    return "Your account has been suspended. Please contact RewardHub Support.";
  }

  if (
    normalized.includes(
      "account inactive"
    ) ||
    normalized.includes(
      "member inactive"
    ) ||
    normalized.includes(
      "inactive account"
    )
  ) {
    return "Your account is inactive. Please contact RewardHub Support.";
  }

  if (
    normalized.includes(
      "missing loginid"
    ) ||
    normalized.includes(
      "missing login id"
    ) ||
    normalized.includes(
      "missing email"
    ) ||
    normalized.includes(
      "missing member id"
    )
  ) {
    return "Please enter your Email or Member ID.";
  }

  if (
    normalized.includes(
      "missing password"
    )
  ) {
    return "Please enter your password.";
  }

  if (
    normalized.includes(
      "failed to fetch"
    ) ||
    normalized.includes(
      "network"
    ) ||
    normalized.includes(
      "fetch failed"
    )
  ) {
    return "Network connection failed. Please try again.";
  }

  if (
    normalized.includes(
      "page not found"
    ) ||
    normalized.includes(
      "<!doctype html"
    )
  ) {
    return "The service is temporarily unavailable. Please try again later.";
  }

  return "Unable to login. Please try again later.";
}

/* ============================================================
 * Login Content
 * ============================================================
 */

function LoginContent() {
  const router =
    useRouter();

  const [
    referralId,
    setReferralId,
  ] =
    useState("");

  const [
    loginId,
    setLoginId,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const queryRef =
      params.get("ref") || "";

    if (queryRef) {
      localStorage.setItem(
        "rewardhub_ref",
        queryRef
      );

      setReferralId(
        queryRef
      );

      return;
    }

    const savedRef =
      localStorage.getItem(
        "rewardhub_ref"
      ) || "";

    setReferralId(
      savedRef
    );
  }, []);

  const registerHref =
    referralId
      ? `/register?ref=${encodeURIComponent(
          referralId
        )}`
      : "/register";

  async function handleLogin() {
    setErrorMessage("");

    const cleanLoginId =
      loginId.trim();

    if (!cleanLoginId) {
      setErrorMessage(
        "Please enter your Email or Member ID."
      );

      return;
    }

    if (!password) {
      setErrorMessage(
        "Please enter your password."
      );

      return;
    }

    try {
      setLoading(true);

      const result =
        await memberLogin({
          loginId:
            cleanLoginId,

          password:
            password,
        });

      if (!result?.success) {
        const resultMessage =
          result?.message ||
          result?.error ||
          "Login failed";

        setErrorMessage(
          getMemberLoginErrorMessage(
            resultMessage
          )
        );

        return;
      }

      const memberData =
        result?.data?.data ||
        result?.data ||
        result;

      const memberId =
        memberData?.memberId ||
        memberData?.MEMBER_ID ||
        "";

      if (!memberId) {
        setErrorMessage(
          "Unable to load member information. Please try again."
        );

        return;
      }

      localStorage.setItem(
        "member",
        JSON.stringify(
          memberData
        )
      );

      router.push(
        "/member/dashboard"
      );
    } catch (error: unknown) {
      setErrorMessage(
        getMemberLoginErrorMessage(
          error
        )
      );
    } finally {
      setLoading(false);
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

              <h1 className="mt-5 text-3xl font-black text-slate-950 sm:mt-6 sm:text-4xl">
                Welcome Back
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Login to your RewardHub account
              </p>

              {referralId ? (
                <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">
                  Referral ID:{" "}
                  {referralId}
                </div>
              ) : null}
            </div>

            {errorMessage ? (
              <div
                role="alert"
                aria-live="polite"
                className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-left shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 9v4m0 4h.01M10.29 3.86 2.82 17a2 2 0 0 0 1.74 3h14.88a2 2 0 0 0 1.74-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-red-700">
                    Unable to sign in
                  </p>

                  <p className="mt-1 text-sm font-semibold leading-6 text-red-600">
                    {errorMessage}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setErrorMessage("")
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl font-medium leading-none text-red-400 transition hover:bg-red-100 hover:text-red-600"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            ) : null}

            <form
              onSubmit={(
                event
              ) => {
                event.preventDefault();

                void handleLogin();
              }}
              className={
                errorMessage
                  ? "mt-5 space-y-4"
                  : "mt-7 space-y-4 sm:mt-8"
              }
            >
              <input
                value={
                  loginId
                }
                onChange={(
                  event
                ) => {
                  setLoginId(
                    event.target.value
                  );

                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}
                required
                autoComplete="username"
                aria-invalid={
                  Boolean(
                    errorMessage
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-4 text-sm font-semibold outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-5"
                placeholder="Email or Member ID"
              />

              <div className="relative">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) => {
                    setPassword(
                      event.target.value
                    );

                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                  required
                  autoComplete="current-password"
                  aria-invalid={
                    Boolean(
                      errorMessage
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 pr-20 text-sm font-semibold outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-5 sm:pr-24"
                  placeholder="Password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-[10px] font-black text-slate-500 sm:text-xs"
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-black text-slate-600 no-underline hover:text-slate-950"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="w-full rounded-xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl"
              >
                {loading
                  ? "Logging in..."
                  : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm font-semibold text-slate-500">
              New to RewardHub?{" "}
              <Link
                href={
                  registerHref
                }
                className="font-black text-slate-950 no-underline"
              >
                Register
              </Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

/* ============================================================
 * Loading
 * ============================================================
 */

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />

        <p className="mt-4 text-sm font-semibold text-slate-500">
          Loading RewardHub...
        </p>
      </div>
    </main>
  );
}

/* ============================================================
 * Login Page
 * ============================================================
 */

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <LoginLoading />
      }
    >
      <LoginContent />
    </Suspense>
  );
}