"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { merchantLogin } from "@/lib/api";

export default function MerchantLoginPage() {
  const [loading, setLoading] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    referralId,
    setReferralId,
  ] = useState("");

  useEffect(() => {
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

    const savedRef =
      localStorage.getItem(
        "rewardhub_ref"
      ) || "";

    setReferralId(savedRef);
  }, []);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      alert(
        "Please enter your login email"
      );
      return;
    }

    if (!password) {
      alert(
        "Please enter your password"
      );
      return;
    }

    try {
      setLoading(true);

      const res =
        await merchantLogin({
          email: cleanEmail,
          password,
        });

      if (!res?.success) {
        alert(
          res?.message ||
            "Merchant login failed"
        );
        return;
      }

      const merchantData =
        res?.data?.data ||
        res?.data ||
        res?.result?.data ||
        res?.result ||
        res;

      const merchantId =
        merchantData?.merchantId ||
        merchantData?.MERCHANT_ID ||
        "";

      if (!merchantId) {
        alert(
          "Merchant data missing"
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
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to login"
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

            <form
              onSubmit={handleLogin}
              className="mt-7 space-y-4 text-left sm:mt-8"
            >
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
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
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 pr-20 text-sm font-bold outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 sm:rounded-2xl sm:px-5 sm:pr-24"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
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
                disabled={loading}
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