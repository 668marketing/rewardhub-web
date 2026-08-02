"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRewardHubSession, saveRewardHubSession, touchRewardHubSession } from "@/lib/session";

type MemberGuardProps = { children: ReactNode };
type StoredMember = { memberId?: string; MEMBER_ID?: string };

const PUBLIC_MEMBER_PATHS = [
  "/member/login",
  "/member/register",
  "/member/forgot-password",
  "/member/reset-password",
];

function isPublicMemberPath(pathname: string) {
  return PUBLIC_MEMBER_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function readStoredMember(): StoredMember | null {
  try {
    const raw = localStorage.getItem("member");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredMember;
    const memberId = String(parsed?.memberId || parsed?.MEMBER_ID || "").trim();
    if (!memberId) { localStorage.removeItem("member"); return null; }
    return parsed;
  } catch {
    localStorage.removeItem("member");
    return null;
  }
}

export default function MemberGuard({ children }: MemberGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const currentPath = pathname || "/member/dashboard";

    if (isPublicMemberPath(currentPath)) {
      setIsChecking(false);
      return;
    }

    const session = getRewardHubSession();

    if (session?.userType === "MEMBER" && session.userId) {
      touchRewardHubSession();
      setIsChecking(false);
      return;
    }

    const storedMember = readStoredMember();
    const memberId = String(storedMember?.memberId || storedMember?.MEMBER_ID || "").trim();

    if (memberId) {
      saveRewardHubSession({ userType: "MEMBER", userId: memberId });
      setIsChecking(false);
      return;
    }

    router.replace(`/member/login?redirect=${encodeURIComponent(currentPath)}`);
  }, [pathname, router]);

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
          <p className="mt-4 text-sm font-bold text-slate-500">Loading RewardHub...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
