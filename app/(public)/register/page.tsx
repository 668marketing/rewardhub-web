"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import Header from "@/components/layout/Header";
import { memberRegister } from "@/lib/api";

function RegisterContent() {
  const searchParams = useSearchParams();
  const queryRef = searchParams.get("ref") || "";

  const [referredByMember, setReferredByMember] =
    useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (queryRef) {
      localStorage.setItem(
        "rewardhub_ref",
        queryRef
      );
      setReferredByMember(queryRef);
      return;
    }

    const savedRef =
      localStorage.getItem("rewardhub_ref") || "";

    setReferredByMember(savedRef);
  }, [queryRef]);

  async function handleRegister(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);

      const phoneNumber = String(
        form.get("phone") || ""
      ).replace(/\D/g, "");

      const phone = `60${phoneNumber}`;

      const birthday = [
        String(form.get("birthYear") || ""),
        String(form.get("birthMonth") || ""),
        String(form.get("birthDay") || ""),
      ].join("-");

      const res = await memberRegister({
        fullName: String(
          form.get("fullName") || ""
        ),
        email: String(form.get("email") || ""),
        phone,
        birthday,
        gender: String(
          form.get("gender") || ""
        ),
        password: String(
          form.get("password") || ""
        ),
        referredByMember,
      });

      const data =
        res?.data?.data ||
        res?.data ||
        res?.result ||
        res;

      if (
        data?.success === false ||
        data?.error
      ) {
        alert(
          data?.message ||
            data?.error ||
            "Registration failed"
        );
        return;
      }

      if (!data?.memberId) {
        alert(
          data?.message ||
            "Registration failed"
        );
        return;
      }

      setResult(data);

      localStorage.removeItem(
        "rewardhub_ref"
      );
    } catch (err: any) {
      console.error("REGISTER ERROR:", err);

      alert(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  const currentYear =
    new Date().getFullYear();

  const years = Array.from(
    { length: 100 },
    (_, i) => String(currentYear - i)
  );

  const months = Array.from(
    { length: 12 },
    (_, i) =>
      String(i + 1).padStart(2, "0")
  );

  const days = Array.from(
    { length: 31 },
    (_, i) =>
      String(i + 1).padStart(2, "0")
  );

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),#f8fafc]">
        <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-6 py-12">
          <div className="mx-auto w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <div className="text-center">
              <img
                src="/rewardhub-logo.png"
                alt="RewardHub"
                className="mx-auto h-16 w-auto object-contain"
              />

              <h1 className="mt-6 text-4xl font-black text-slate-950">
                Join RewardHub
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Create your member account
              </p>

              {referredByMember && (
                <p className="mt-3 text-xs font-bold text-emerald-700">
                  Referred by:{" "}
                  {referredByMember}
                </p>
              )}
            </div>

            {!result ? (
              <form
                onSubmit={handleRegister}
                className="mt-8 space-y-4"
              >
                <input
                  name="fullName"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder="Full Name"
                />

                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder="Email"
                />

                <div className="flex overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex items-center bg-slate-100 px-5 font-black text-slate-700">
                    +60
                  </div>

                  <input
                    name="phone"
                    required
                    inputMode="numeric"
                    className="w-full px-5 py-4 font-semibold outline-none"
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-black text-slate-500">
                    Date of Birth
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <select
                      name="birthYear"
                      required
                      className="rounded-2xl border border-slate-200 px-4 py-4 font-semibold outline-none focus:border-slate-950"
                    >
                      <option value="">
                        Year
                      </option>

                      {years.map((year) => (
                        <option
                          key={year}
                          value={year}
                        >
                          {year}
                        </option>
                      ))}
                    </select>

                    <select
                      name="birthMonth"
                      required
                      className="rounded-2xl border border-slate-200 px-4 py-4 font-semibold outline-none focus:border-slate-950"
                    >
                      <option value="">
                        Month
                      </option>

                      {months.map((month) => (
                        <option
                          key={month}
                          value={month}
                        >
                          {month}
                        </option>
                      ))}
                    </select>

                    <select
                      name="birthDay"
                      required
                      className="rounded-2xl border border-slate-200 px-4 py-4 font-semibold outline-none focus:border-slate-950"
                    >
                      <option value="">
                        Day
                      </option>

                      {days.map((day) => (
                        <option
                          key={day}
                          value={day}
                        >
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <select
                  name="gender"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                >
                  <option value="">
                    Select Gender
                  </option>
                  <option value="Male">
                    Male
                  </option>
                  <option value="Female">
                    Female
                  </option>
                </select>

                <input
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder="Password"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  {loading
                    ? "Creating Account..."
                    : "Create Account"}
                </button>
              </form>
            ) : (
              <div className="mt-8 rounded-3xl bg-emerald-50 p-6 text-center">
                <p className="text-sm font-bold text-emerald-700">
                  Account Created
                </p>

                <h2 className="mt-3 text-3xl font-black text-emerald-900">
                  {result.memberId}
                </h2>

                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  Tier:{" "}
                  {result.tier || "Silver"}
                </p>

                <a
                  href="/login"
                  className="mt-6 block rounded-2xl bg-slate-950 py-4 text-sm font-black text-white no-underline"
                >
                  Go to Login
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function RegisterLoading() {
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<RegisterLoading />}
    >
      <RegisterContent />
    </Suspense>
  );
}