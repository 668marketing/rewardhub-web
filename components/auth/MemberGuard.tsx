"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MemberGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const member = localStorage.getItem("member");

    if (!member) {
      router.push("/login");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-500">Checking session...</p >
      </main>
    );
  }

  return <>{children}</>;
}