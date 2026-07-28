"use client";

import { useLanguage } from "@/hooks/useLanguage";

export default function MemberProductPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-[#f8fafc] p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0f172a]">
          {t("memberProduct.title")}
        </h1>

        <p className="mt-3 text-sm text-[#64748b]">
          {t("memberProduct.description")}
        </p>
      </div>
    </main>
  );
}