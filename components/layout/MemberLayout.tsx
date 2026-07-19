"use client";

import Link from "next/link";
import MemberBottomNav from "@/components/layout/MemberBottomNav";
import MemberGuard from "@/components/auth/MemberGuard";
import SessionTimeout from "@/components/auth/SessionTimeout";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MemberGuard>
      <SessionTimeout
        storageKey="member"
        loginPath="/login"
      />

      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:h-24 lg:px-8 xl:px-12">
            <Link
              href="/member/dashboard"
              className="flex min-w-0 items-center no-underline"
            >
              <img
                src="/logo/rewardhub-member.png"
                alt="RewardHub Member"
                className="block h-10 w-auto max-w-[170px] object-contain sm:h-12 sm:max-w-[210px] lg:h-16 lg:max-w-[280px]"
              />
            </Link>
          </div>
        </header>

        <div className="min-h-[calc(100vh-64px)] pb-28 sm:min-h-[calc(100vh-80px)] sm:pb-32 lg:min-h-[calc(100vh-96px)] lg:pb-36">
          {children}
        </div>

        <MemberBottomNav />
      </div>
    </MemberGuard>
  );
}