"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import Header from "@/components/layout/Header";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import { memberRegister } from "@/lib/api";

function RegisterContent() {
  const {
    language,
  } = useLanguage();

  const pageText = {
    en: {
      joinRewardHub: "Join RewardHub",
      subtitle: "Create your member account",
      referredBy: "Referred by",
      fullName: "Full Name",
      email: "Email",
      dateOfBirth: "Date of Birth",
      year: "Year",
      month: "Month",
      day: "Day",
      selectGender: "Select Gender",
      male: "Male",
      female: "Female",
      password: "Password",
      creatingAccount: "Creating Account...",
      createAccount: "Create Account",
      accountCreated: "Account Created",
      tier: "Tier",
      silver: "Silver",
      goToLogin: "Go to Login",
      registrationFailed: "Registration failed",
      loading: "Loading RewardHub...",
    },

    zh: {
      joinRewardHub: "加入 RewardHub",
      subtitle: "创建您的会员账户",
      referredBy: "推荐人",
      fullName: "姓名",
      email: "邮箱",
      dateOfBirth: "出生日期",
      year: "年份",
      month: "月份",
      day: "日期",
      selectGender: "选择性别",
      male: "男",
      female: "女",
      password: "密码",
      creatingAccount: "正在创建账户...",
      createAccount: "创建账户",
      accountCreated: "账户已创建",
      tier: "会员等级",
      silver: "银卡",
      goToLogin: "前往登录",
      registrationFailed: "注册失败",
      loading: "RewardHub 加载中...",
    },

    ms: {
      joinRewardHub: "Sertai RewardHub",
      subtitle: "Cipta akaun ahli anda",
      referredBy: "Dirujuk oleh",
      fullName: "Nama Penuh",
      email: "E-mel",
      dateOfBirth: "Tarikh Lahir",
      year: "Tahun",
      month: "Bulan",
      day: "Hari",
      selectGender: "Pilih Jantina",
      male: "Lelaki",
      female: "Perempuan",
      password: "Kata Laluan",
      creatingAccount: "Sedang Mencipta Akaun...",
      createAccount: "Cipta Akaun",
      accountCreated: "Akaun Berjaya Dicipta",
      tier: "Tahap",
      silver: "Silver",
      goToLogin: "Pergi ke Log Masuk",
      registrationFailed: "Pendaftaran gagal",
      loading: "RewardHub sedang dimuatkan...",
    },
  } as const;

  const copy =
    pageText[language];

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
            copy.registrationFailed
        );
        return;
      }

      if (!data?.memberId) {
        alert(
          data?.message ||
            copy.registrationFailed
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
          copy.registrationFailed
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

      <main className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),#f8fafc]">
        <div className="absolute right-4 top-4 z-40 sm:right-6 sm:top-6">
          <LanguageSwitcher compact />
        </div>
        <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-6 py-12">
          <div className="mx-auto w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <div className="text-center">
              <img
                src="/rewardhub-logo.png"
                alt="RewardHub"
                className="mx-auto h-16 w-auto object-contain"
              />

              <h1 className="mt-6 text-4xl font-black text-slate-950">
                {copy.joinRewardHub}
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                {copy.subtitle}
              </p>

              {referredByMember && (
                <p className="mt-3 text-xs font-bold text-emerald-700">
                  {copy.referredBy}:{" "}
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
                  placeholder={copy.fullName}
                />

                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder={copy.email}
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
                    {copy.dateOfBirth}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <select
                      name="birthYear"
                      required
                      className="rounded-2xl border border-slate-200 px-4 py-4 font-semibold outline-none focus:border-slate-950"
                    >
                      <option value="">
                        {copy.year}
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
                        {copy.month}
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
                        {copy.day}
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
                    {copy.selectGender}
                  </option>
                  <option value="Male">
                    {copy.male}
                  </option>
                  <option value="Female">
                    {copy.female}
                  </option>
                </select>

                <input
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder={copy.password}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  {loading
                    ? copy.creatingAccount
                    : copy.createAccount}
                </button>
              </form>
            ) : (
              <div className="mt-8 rounded-3xl bg-emerald-50 p-6 text-center">
                <p className="text-sm font-bold text-emerald-700">
                  {copy.accountCreated}
                </p>

                <h2 className="mt-3 text-3xl font-black text-emerald-900">
                  {result.memberId}
                </h2>

                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  {copy.tier}:{" "}
                  {result.tier || copy.silver}
                </p>

                <a
                  href="/login"
                  className="mt-6 block rounded-2xl bg-slate-950 py-4 text-sm font-black text-white no-underline"
                >
                  {copy.goToLogin}
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<RegisterLoading />}
    >
      <RegisterContent />
    </Suspense>
  );
}