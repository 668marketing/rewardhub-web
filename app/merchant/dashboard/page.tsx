"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MerchantNav from "@/components/layout/MerchantNav";
import { getMerchantDashboardSummary } from "@/lib/api";

export default function MerchantDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function getApiData(res: any) {
  let data = res;

  while (data?.data && !data?.merchant && !data?.today) {
    data = data.data;
  }

  return data;
}

  useEffect(() => {
    async function load() {
      const stored = JSON.parse(localStorage.getItem("merchant") || "{}");

      const merchantId =
        stored?.merchantId ||
        stored?.MERCHANT_ID ||
        "";

      console.log("merchant storage:", stored);
      if (!merchantId) {
        setLoading(false);
        return;
      }

      try {
        console.log("merchantId:", merchantId);
        const res = await getMerchantDashboardSummary(merchantId);
        console.log("dashboard response:", res);
        const result = getApiData(res);

        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const merchant = data?.merchant || {};
  const today = data?.today || {};
  const latest = (data?.latestTransactions || [])
  .sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  )
  .slice(0, 5);

  const merchantName =
  merchant?.displayName ||
  merchant?.businessName ||
  data?.displayName ||
  data?.businessName ||
  "Merchant";

  const merchantId = merchant?.merchantId || "-";

  const activeBudget = Number(
  data?.marketing?.currentBudget ||
  merchant?.marketingBudget ||
  0
);

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-amber-300">
                  Merchant Dashboard
                </p >

                <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
                  {merchantName}
                </h1>

                <p className="mt-2 text-[11px] sm:text-sm font-bold text-slate-400">
                  {merchantId}
                </p >

                <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                  <Badge text={`Marketing Budget: ${activeBudget}%`} />

                  {data?.marketing?.boost?.active && (
  <Badge
    text={`Boost Active: ${data.marketing.boost.boostBudget}%`}
    green
  />
)}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-4">
              <Stat title="Today Sales" value={`RM${money(today.todaySales)}`} />
              <Stat title="Cashback Given" value={`RM${money(today.cashbackGiven)}`} />
              <Stat title="Transactions" value={today.transactionCount || 0} />
              <Stat title="Marketing Used" value={`RM${money(today.marketingUsed)}`} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-7 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                Collect Payment
              </h2>

              <p className="mt-2 text-sm font-bold text-slate-500">
                Scan member QR or tap member card to collect payment instantly.
              </p >

              <div className="mt-6 rounded-[1.5rem] bg-slate-950 p-4 text-white sm:rounded-[2rem] sm:p-7">
                <p className="text-sm font-black text-slate-400">
                  Payment Mode
                </p >

                <h3 className="mt-3 text-2xl sm:text-3xl font-black">
                  Ready to Collect
                </h3>

                <p className="mt-3 text-sm font-bold text-slate-300">
                  Cashback and points will be calculated automatically.
                </p >
              </div>

              <Link
                href="/merchant/collect"
                className="mt-6 block rounded-xl bg-slate-950 py-3 text-center text-xs font-black text-white no-underline sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                Open Collect Payment
              </Link>
            </div>

            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-7">
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                Payment Methods Today
              </h2>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <MiniStat title="Cash" value={`RM${money(today.paymentMethods?.Cash)}`} />
                <MiniStat title="DuitNow" value={`RM${money(today.paymentMethods?.DuitNow)}`} />
                <MiniStat title="TNG" value={`RM${money(today.paymentMethods?.TNG)}`} />
                <MiniStat
                  title="Bank / Card"
                  value={`RM${money(
                    Number(today.paymentMethods?.Bank || 0) +
                      Number(today.paymentMethods?.Card || 0)
                  )}`}
                />
              </div>

              <Link
                href="/merchant/transactions"
                className="mt-6 block rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-black text-slate-950 no-underline sm:rounded-2xl sm:py-4 sm:text-sm"
              >
                View Transactions
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-7 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                  Latest Transactions
                </h2>
                <p className="mt-1 text-[11px] sm:text-sm font-bold text-slate-500">
                  Recent customer payments from your store.
                </p >
              </div>

              <Link
                href="/merchant/transactions"
                className="text-xs sm:text-sm font-black text-slate-950 no-underline"
              >
                View All →
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {latest.map((tx: any) => (
                <div
                  key={tx.transactionId}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl sm:rounded-3xl bg-slate-50 p-5"
                >
                  <div>
                    <p className="text-base font-black text-slate-950 sm:text-lg">
                      {tx.memberId || "Member"}
                    </p >

                    <p className="mt-1 text-[10px] font-bold text-slate-500 sm:text-sm">
                      {tx.paymentMethod || "Payment"} • {formatDate(tx.createdAt)}
                    </p >

                    <p className="mt-1 text-[9px] font-bold text-slate-400 sm:text-xs">
                      {tx.transactionId}
                    </p >
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-slate-950 sm:text-2xl">
                      RM{money(tx.netAmount)}
                    </p >

                    <p className="mt-1 text-[10px] font-bold text-emerald-700 sm:text-sm">
                      Cashback RM{money(tx.cashbackAmount)}
                    </p >
                  </div>
                </div>
              ))}

              {!loading && latest.length === 0 && (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  No transactions yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="rounded-xl bg-white/10 p-3 text-white sm:rounded-[2rem] sm:p-6">
      <p className="truncate text-[9px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>

      <h3 className="mt-1 break-words text-sm font-black leading-tight sm:mt-3 sm:text-3xl">
        {value}
      </h3>
    </div>
  );
}

function MiniStat({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-5">
      <p className="text-[9px] font-black text-slate-400 sm:text-xs">
        {title}
      </p>

      <h3 className="mt-1 text-sm font-black text-slate-950 sm:mt-2 sm:text-2xl">
        {value}
      </h3>
    </div>
  );
}

function Badge({
  text,
  green = false,
}: {
  text: string;
  green?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[10px] font-black sm:px-4 sm:py-2 sm:text-xs ${
        green
          ? "bg-emerald-400/15 text-emerald-300"
          : "bg-white/10 text-slate-300"
      }`}
    >
      {text}
    </span>
  );
}

function money(value: any) {
  return Number(value || 0).toFixed(2);
}

function formatDate(date: any) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}