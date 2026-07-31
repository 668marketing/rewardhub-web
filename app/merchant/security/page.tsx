"use client";

import dynamic from "next/dynamic";
import {
  Loader2,
} from "lucide-react";

const MerchantNav =
  dynamic(
    () =>
      import(
        "@/components/layout/MerchantNav"
      ),
    {
      ssr: false,
      loading: () =>
        null,
    }
  );

const SecurityCenter =
  dynamic(
    () =>
      import(
        "@/components/security/SecurityCenter"
      ),
    {
      ssr: false,
      loading: () => (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-slate-950" />

            <p className="mt-4 text-sm font-black text-slate-500">
              Loading Security Center...
            </p>
          </div>
        </main>
      ),
    }
  );

export default function MerchantSecurityPage() {
  return (
    <>
      <MerchantNav />

      <SecurityCenter
        portal="MERCHANT"
      />
    </>
  );
}