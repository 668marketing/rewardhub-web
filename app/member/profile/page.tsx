"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MemberLayout from "@/components/layout/MemberLayout";
import PushNotificationManager from "@/components/pwa/PushNotificationManager";

export default function ProfilePage() {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("member");

    if (stored) {
      try {
        setMember(JSON.parse(stored));
      } catch {
        setMember(null);
      }
    }
  }, []);

  function logout() {
    localStorage.removeItem("member");
    router.push("/login");
  }

  const name = member?.displayName || member?.fullName || "Member";
  const tier = member?.tier || "Silver";
  const memberId = member?.memberId || member?.MEMBER_ID || "-";
  const email = member?.email || "-";
  const phone = member?.phone || "-";
  const gender = member?.gender || member?.GENDER || "-";
  const status = member?.status || "Active";

  const pushUserId = memberId === "-" ? "" : memberId;

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-6xl">
          <Link
            href="/member/dashboard"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm sm:px-5 sm:py-3 sm:text-sm"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:mt-6 sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 sm:h-20 sm:w-20 sm:rounded-[1.5rem] sm:p-3">
                  <img
                    src="/rewardhub-logo.png"
                    alt="RewardHub"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
                    Member Profile
                  </p>

                  <h1 className="mt-1 truncate text-2xl font-black sm:mt-2 sm:text-4xl md:text-5xl">
                    {name}
                  </h1>

                  <p className="mt-1 truncate text-[10px] font-bold text-slate-400 sm:mt-2 sm:text-sm">
                    {tier} Member • {memberId}
                  </p>
                </div>
              </div>

              <StatusBadge status={status} />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 sm:mt-8 sm:gap-4">
              <StatCard title="Tier" value={tier} />
              <StatCard title="Member ID" value={memberId} />
              <StatCard title="Account Status" value={status} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 lg:grid-cols-3 lg:gap-6">
            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:col-span-2 lg:rounded-[2.5rem] lg:p-7">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                Personal Information
              </h2>

              <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                Your RewardHub membership details.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4">
                <InfoCard label="Full Name" value={name} />
                <InfoCard label="Gender" value={gender || "-"} />
                <InfoCard label="Member ID" value={memberId} />
                <InfoCard label="Tier" value={`${tier} Member`} />
                <InfoCard label="Email" value={email} />
                <InfoCard label="Phone" value={phone} />
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                Account Summary
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-1 sm:gap-4">
                <SummaryRow label="Membership" value="Lifetime" />
                <SummaryRow label="Referral" value="Enabled" />
                <SummaryRow label="Reward Credits" value="Enabled" />
                <SummaryRow label="Security" value="Protected" />
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <PushNotificationManager
              userType="MEMBER"
              userId={pushUserId}
            />
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7">
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              Security
            </h2>

            <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
              Manage your account password and trusted devices.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4">
              <ActionCard
                title="Change Password"
                subtitle="Update your account password"
                href="/member/change-password"
              />

              <ActionCard
                title="Devices"
                subtitle="Manage your logged in devices"
                href="/member/devices"
              />
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-red-100 bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7">
            <h2 className="text-xl font-black text-red-600 sm:text-2xl">
              Danger Zone
            </h2>

            <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
              This action will sign you out from this device.
            </p>

            <button
              onClick={logout}
              className="mt-5 w-full rounded-xl bg-red-600 py-3 text-xs font-black text-white shadow-xl shadow-red-600/20 sm:mt-6 sm:rounded-2xl sm:py-5 sm:text-sm"
            >
              Logout
            </button>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/10 p-3 text-white sm:rounded-[2rem] sm:p-6">
      <p className="truncate text-[9px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>

      <h3
        className={`mt-1 break-words font-black leading-tight sm:mt-3 ${
          title === "Member ID"
            ? "text-[12px] sm:text-xl lg:text-2xl"
            : "text-sm sm:text-3xl"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-5">
      <p className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 sm:text-xs sm:tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-slate-950 sm:mt-2 sm:text-lg">
        {value || "-"}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
      <span className="truncate text-[10px] font-bold text-slate-500 sm:text-sm">
        {label}
      </span>
      <span className="shrink-0 text-[10px] font-black text-slate-950 sm:text-sm">
        {value}
      </span>
    </div>
  );
}

function ActionCard({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="min-w-0 rounded-xl bg-slate-50 p-3 no-underline transition hover:bg-slate-100 sm:rounded-2xl sm:p-5"
    >
      <p className="text-sm font-black text-slate-950 sm:text-lg">{title}</p>
      <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500 sm:text-sm sm:leading-5">
        {subtitle}
      </p>
      <p className="mt-3 text-[10px] font-black text-slate-950 sm:mt-4 sm:text-sm">
        Open →
      </p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "Active";

  return (
    <span
      className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black sm:px-5 sm:py-3 sm:text-sm ${
        isActive
          ? "bg-emerald-400/15 text-emerald-300"
          : "bg-amber-400/15 text-amber-300"
      }`}
    >
      {status}
    </span>
  );
}