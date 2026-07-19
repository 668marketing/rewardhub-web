import { Suspense } from "react";
import Link from "next/link";

import Header from "@/components/layout/Header";

function MerchantContent() {
  const products = [
    "Latte",
    "Caramel Macchiato",
    "Chocolate Cake",
  ];

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),radial-gradient(circle_at_top_right,#fef3c7,transparent_30%),#f8fafc]">
        <section className="mx-auto max-w-7xl px-6 py-10">
          <Link
            href="/marketplace"
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 no-underline shadow-sm transition hover:bg-slate-50"
          >
            ← Back to Marketplace
          </Link>

          <div className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="relative h-80 bg-gradient-to-br from-slate-950 via-blue-700 to-cyan-500">
              <div className="absolute left-8 top-8 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                Verified Merchant
              </div>
            </div>

            <div className="px-8 pb-10 md:px-12">
              <div className="-mt-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-5 md:flex-row md:items-end">
                  <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-[2rem] border-8 border-white bg-white text-5xl font-black text-slate-950 shadow-xl">
                    SB
                  </div>

                  <div className="pb-3">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                      Cafe • Muar
                    </p>

                    <h1 className="mt-2 text-5xl font-black tracking-tight text-slate-950">
                      Starbucks
                    </h1>

                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      ⭐ 4.8 Rating • Open Now • Malaysia
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    ♡ Save
                  </button>

                  <Link
                    href="/login"
                    className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white no-underline shadow-sm transition hover:bg-slate-800"
                  >
                    Pay with RewardHub
                  </Link>
                </div>
              </div>

              <div className="mt-10 grid gap-5 md:grid-cols-4">
                <div className="rounded-3xl bg-emerald-50 p-6">
                  <p className="text-sm font-bold text-emerald-700">
                    Gold Cashback
                  </p>

                  <h2 className="mt-2 text-4xl font-black text-emerald-900">
                    2.4%
                  </h2>
                </div>

                <div className="rounded-3xl bg-amber-50 p-6">
                  <p className="text-sm font-bold text-amber-700">
                    Campaign
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-amber-900">
                    20%
                  </h2>
                </div>

                <div className="rounded-3xl bg-blue-50 p-6">
                  <p className="text-sm font-bold text-blue-700">
                    Points
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-blue-900">
                    1x
                  </h2>
                </div>

                <div className="rounded-3xl bg-violet-50 p-6">
                  <p className="text-sm font-bold text-violet-700">
                    Referral
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-violet-900">
                    Active
                  </h2>
                </div>
              </div>

              <div className="mt-10 grid gap-6 lg:grid-cols-3">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7 lg:col-span-2">
                  <h2 className="text-2xl font-black text-slate-950">
                    About Merchant
                  </h2>

                  <p className="mt-4 leading-8 text-slate-600">
                    Enjoy exclusive RewardHub member benefits at
                    Starbucks. Members can receive instant
                    discounts during payment, collect points and
                    unlock campaign rewards.
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7">
                  <h2 className="text-2xl font-black text-slate-950">
                    Store Info
                  </h2>

                  <div className="mt-5 space-y-4 text-sm font-semibold text-slate-600">
                    <p>📍 Muar, Johor</p>
                    <p>🕘 8:00 AM – 10:00 PM</p>
                    <p>📞 012-345 6789</p>
                    <p>🌐 RewardHub Merchant</p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-3xl font-black text-slate-950">
                  Popular Products
                </h2>

                <div className="mt-6 grid gap-5 md:grid-cols-3">
                  {products.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="h-32 rounded-2xl bg-slate-100" />

                      <h3 className="mt-4 text-lg font-black text-slate-950">
                        {item}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        From RM12.90
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function MerchantLoading() {
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

export default function MerchantPage() {
  return (
    <Suspense fallback={<MerchantLoading />}>
      <MerchantContent />
    </Suspense>
  );
}