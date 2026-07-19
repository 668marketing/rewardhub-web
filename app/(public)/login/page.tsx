"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Header from "@/components/layout/Header";
import { memberLogin } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [referralId, setReferralId] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRef = params.get("ref") || "";

    if (queryRef) {
      localStorage.setItem("rewardhub_ref", queryRef);
      setReferralId(queryRef);
      return;
    }

    const savedRef =
      localStorage.getItem("rewardhub_ref") || "";

    setReferralId(savedRef);
  }, []);

  const registerHref = referralId
    ? `/register?ref=${encodeURIComponent(referralId)}`
    : "/register";

  async function handleLogin() {
    const cleanLoginId = loginId.trim();

    if (!cleanLoginId) {
      alert("Please enter your email or Member ID");
      return;
    }

    if (!password) {
      alert("Please enter your password");
      return;
    }

    try {
      setLoading(true);

      const result = await memberLogin({
        loginId: cleanLoginId,
        password,
      });

      if (!result?.success) {
        alert(result?.message || "Login failed");
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
        alert("Member data missing");
        return;
      }

      localStorage.setItem(
        "member",
        JSON.stringify(memberData)
      );

      router.push("/member/dashboard");
    } catch (error: any) {
      console.error("MEMBER LOGIN ERROR:", error);
      alert(
        error?.message ||
          "Unable to login."
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

              {referralId && (
                <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">
                  Referral ID: {referralId}
                </div>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleLogin();
              }}
              className="mt-7 space-y-4 sm:mt-8"
            >
              <input
                value={loginId}
                onChange={(event) =>
                  setLoginId(event.target.value)
                }
                required
                autoComplete="username"
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
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 pr-20 text-sm font-semibold outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-5 sm:pr-24"
                  placeholder="Password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
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
                disabled={loading}
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
                href={registerHref}
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