"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import Header from "@/components/layout/Header";
import {
  merchantLogin,
} from "@/lib/api";

/* ============================================================
 * Merchant Login Error Message
 * ============================================================
 */

function getMerchantLoginErrorMessage(
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
      "merchant not found"
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
    return "Merchant account not found. Please check your login email.";
  }

  if (
    normalized.includes(
      "account suspended"
    ) ||
    normalized.includes(
      "merchant suspended"
    ) ||
    normalized.includes(
      "account blocked"
    )
  ) {
    return "Your merchant account has been suspended. Please contact RewardHub Support.";
  }

  if (
    normalized.includes(
      "account inactive"
    ) ||
    normalized.includes(
      "merchant inactive"
    ) ||
    normalized.includes(
      "inactive account"
    )
  ) {
    return "Your merchant account is inactive. Please contact RewardHub Support.";
  }

  if (
    normalized.includes(
      "pending approval"
    ) ||
    normalized.includes(
      "account pending"
    ) ||
    normalized.includes(
      "merchant pending"
    )
  ) {
    return "Your merchant account is still pending approval.";
  }

  if (
    normalized.includes(
      "missing email"
    ) ||
    normalized.includes(
      "missing login email"
    )
  ) {
    return "Please enter your login email.";
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

  return "Unable to sign in. Please try again later.";
}

/* ============================================================
 * Merchant Login Content
 * ============================================================
 */

function MerchantLoginContent() {
  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    email,
    setEmail,
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
    referralId,
    setReferralId,
  ] =
    useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  useEffect(() => {
    try {
      const storedMerchant =
        JSON.parse(
          localStorage.getItem(
            "merchant"
          ) || "{}"
        );

      if (
        storedMerchant?.merchantId ||
        storedMerchant?.MERCHANT_ID
      ) {
        window.location.replace(
          "/merchant/dashboard"
        );

        return;
      }
    } catch {
      localStorage.removeItem(
        "merchant"
      );
    }

    const savedRef =
      localStorage.getItem(
        "rewardhub_ref"
      ) || "";

    setReferralId(
      savedRef
    );
  }, []);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setErrorMessage("");

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (!cleanEmail) {
      setErrorMessage(
        "Please enter your login email."
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

      const response =
        await merchantLogin({
          email:
            cleanEmail,

          password:
            password,
        });

      if (!response?.success) {
        const responseMessage =
          response?.message ||
          response?.error ||
          "Merchant login failed";

        setErrorMessage(
          getMerchantLoginErrorMessage(
            responseMessage
          )
        );

        return;
      }

      const merchantData =
        response?.data?.data ||
        response?.data ||
        response?.result?.data ||
        response?.result ||
        response;

      const merchantId =
        merchantData?.merchantId ||
        merchantData?.MERCHANT_ID ||
        "";

      if (!merchantId) {
        setErrorMessage(
          "Unable to load merchant information. Please try again."
        );

        return;
      }

      localStorage.setItem(
        "merchant",
        JSON.stringify(
          merchantData
        )
      );

      window.location.replace(
        "/merchant/dashboard"
      );
    } catch (error: unknown) {
      setErrorMessage(
        getMerchantLoginErrorMessage(
          error
        )
      );
    } finally {
      setLoading(false);
    }
  }

  const merchantRegisterHref =
    referralId
      ? `/merchantregister?refMember=${encodeURIComponent(
          referralId
        )}`
      : "/merchantregister";

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_35%),#f8fafc] px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-md items-center">
          <div className="w-full rounded-[1.75rem] bg-white p-5 text-center shadow-2xl sm:rounded-[2.5rem] sm:p-8">
            <img
              src="/rewardhub-logo.png"
              alt="RewardHub"
              className="mx-auto h-14 w-auto object-contain sm:h-16"
            />

            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-amber-600 sm:mt-6 sm:text-xs">
              Merchant Portal
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm font-bold text-slate-500">
              Login to your merchant account
            </p>

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
              onSubmit={
                handleLogin
              }
              className={[
                errorMessage
                  ? "mt-5"
                  : "mt-7 sm:mt-8",
                "space-y-4 text-left",
              ].join(" ")}
            >
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={
                  email
                }
                onChange={(
                  event
                ) => {
                  setEmail(
                    event.target.value
                  );

                  if (
                    errorMessage
                  ) {
                    setErrorMessage("");
                  }
                }}
                aria-invalid={
                  Boolean(
                    errorMessage
                  )
                }
                placeholder="Login Email"
                className="w-full rounded-xl border border-slate-200 px-4 py-4 text-sm font-bold outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 sm:rounded-2xl sm:px-5"
              />

              <div className="relative">
                <input
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="current-password"
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) => {
                    setPassword(
                      event.target.value
                    );

                    if (
                      errorMessage
                    ) {
                      setErrorMessage("");
                    }
                  }}
                  aria-invalid={
                    Boolean(
                      errorMessage
                    )
                  }
                  placeholder="Password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 pr-20 text-sm font-bold outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 sm:rounded-2xl sm:px-5 sm:pr-24"
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
                  href="/merchant/forgot-password"
                  className="text-xs font-black text-amber-700 no-underline hover:text-amber-800"
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
                  : "Merchant Login"}
              </button>
            </form>

            <p className="mt-6 text-sm font-bold text-slate-500">
              New to RewardHub?{" "}
              <Link
                href={
                  merchantRegisterHref
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
 * Merchant Login Loading
 * ============================================================
 */

function MerchantLoginLoading() {
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
 * Merchant Login Page
 * ============================================================
 */

export default function MerchantLoginPage() {
  return (
    <Suspense
      fallback={
        <MerchantLoginLoading />
      }
    >
      <MerchantLoginContent />
    </Suspense>
  );
}