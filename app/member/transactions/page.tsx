"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getTransactionHistory } from "@/lib/api";
import MemberLayout from "@/components/layout/MemberLayout";

export default function TransactionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      const member = JSON.parse(localStorage.getItem("member") || "{}");
      const memberId = member?.memberId || member?.MEMBER_ID;

      if (!memberId) {
        setLoading(false);
        return;
      }

      const res = await getTransactionHistory({
        memberId,
        limit: 100,
      });

      const list =
        res?.data?.data?.transactions ||
        res?.data?.transactions ||
        res?.transactions ||
        [];

      setItems(list);
    } catch (err) {
      console.error(err);
      alert("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return items.filter((tx) => {
      const keyword = search.toLowerCase();

      const merchantName = String(
        tx.merchantName || tx.businessName || tx.merchantId || ""
      ).toLowerCase();

      const txId = String(tx.transactionId || "").toLowerCase();

      const matchSearch =
        !keyword || merchantName.includes(keyword) || txId.includes(keyword);

      const matchStatus =
        status === "All" || String(tx.status || "Completed") === status;

      return matchSearch && matchStatus;
    });
  }, [items, search, status]);

  const totalSpent = filtered.reduce(
    (sum, tx) => sum + Number(tx.netAmount || tx.payAmount || 0),
    0
  );

  const totalCashback = filtered.reduce(
    (sum, tx) =>
      sum +
      Number(
        tx.discountAmount ||
          tx.DISCOUNT_AMOUNT ||
          tx.cashbackAmount ||
          tx.cashback ||
          0
      ),
    0
  );

  const totalCreditsUsed = filtered.reduce(
    (sum, tx) => sum + Number(tx.rewardCreditsUsed || 0),
    0
  );

  const totalPoints = filtered.reduce(
    (sum, tx) => sum + Number(tx.pointsEarned || 0),
    0
  );

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-7xl">
          <Link
            href="/member/dashboard"
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 no-underline shadow-sm"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:mt-6 sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">
              Member Transactions
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
              Transaction History
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-bold text-slate-400">
              Track your spending, instant cashback, Reward Credits used and
              points earned.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard title="Total Paid" value={`RM${money(totalSpent)}`} />
              <StatCard
                title="Cashback Saved"
                value={`RM${money(totalCashback)}`}
              />
              <StatCard
                title="Credits Used"
                value={`RM${money(totalCreditsUsed)}`}
              />
              <StatCard title="Points Earned" value={`${totalPoints} pts`} />
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  All Transactions
                </h2>
                <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-xs lg:text-sm">
                  Showing {filtered.length} transaction(s)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-row">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search merchant / transaction"
                  className="rounded-2xl border border-slate-200 px-5 py-4 text-sm font-bold outline-none focus:border-slate-950"
                />

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-5 py-4 text-sm font-bold outline-none focus:border-slate-950"
                >
                  <option value="All">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {filtered.map((tx) => (
                <TransactionCard key={tx.transactionId} tx={tx} />
              ))}

              {!loading && filtered.length === 0 && (
                <div className="rounded-3xl bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">
                  No transactions found.
                </div>
              )}

              {loading && (
                <div className="rounded-3xl bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">
                  Loading transactions...
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

function TransactionCard({ tx }: { tx: any }) {
  const merchantName =
    tx.merchantName ||
    tx.businessName ||
    tx.merchantId ||
    "Unknown Merchant";

  const originalAmount = Number(
    tx.grossAmount || tx.originalAmount || tx.amount || 0
  );

  const cashback = Number(
    tx.discountAmount ||
      tx.DISCOUNT_AMOUNT ||
      tx.cashbackAmount ||
      tx.cashback ||
      0
  );

  const creditsUsed = Number(tx.rewardCreditsUsed || 0);

  const finalPaid = Number(
    tx.netAmount || tx.payAmount || originalAmount - cashback - creditsUsed || 0
  );

  const points = Number(tx.pointsEarned || 0);
  const status = tx.status || "Completed";

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white sm:h-14 sm:w-14 sm:rounded-2xl sm:text-lg">
            {String(merchantName).slice(0, 2).toUpperCase()}
          </div>

          <div>
<div>
  <h3 className="break-words text-base font-black text-slate-950 sm:text-lg lg:text-xl">
    {merchantName}
  </h3>

  <div className="mt-2">
    <StatusBadge status={status} />
  </div>
</div>

            <p className="mt-1 text-[9px] font-medium leading-4 text-slate-400 sm:text-[10px] lg:text-sm">
  {formatDate(tx.createdAt)}
</p>

            <p className="mt-1 text-[10px] font-bold text-slate-400 sm:text-xs">
              {tx.transactionId}
            </p>
          </div>
        </div>

        <div className="text-left lg:text-right">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Final Paid
          </p>
          <p className="mt-1 text-xl font-black text-slate-950 sm:text-2xl lg:text-3xl">
            RM{money(finalPaid)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat title="Original" value={`RM${money(originalAmount)}`} />
        <MiniStat title="Cashback Saved" value={`RM${money(cashback)}`} green />
        <MiniStat title="Credits Used" value={`RM${money(creditsUsed)}`} />
        <MiniStat title="Points Earned" value={`${points} pts`} blue />
      </div>

      {status === "Completed" &&
  (tx.reviewed ? (
    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-center text-xs font-black text-emerald-700 sm:py-4 sm:text-sm">
      ⭐ Reviewed
    </div>
  ) : (
    <Link
      href={`/member/review?transactionId=${encodeURIComponent(
        tx.transactionId
      )}&merchantId=${encodeURIComponent(
        tx.merchantId
      )}`}
      className="mt-5 block rounded-2xl bg-slate-950 py-3 text-center text-xs font-black text-white no-underline sm:py-4 sm:text-sm"
    >
      Leave Review
    </Link>
  ))}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/10 p-4 text-white sm:rounded-[2rem] sm:p-5 lg:p-6">
      <p className="truncate text-[10px] font-black text-slate-300 sm:text-sm">{title}</p>
      <h3 className="mt-2 break-words text-xl font-black leading-tight sm:mt-3 sm:text-2xl lg:text-3xl">{value}</h3>
    </div>
  );
}

function MiniStat({
  title,value,green=false,blue=false,
}:{title:string;value:any;green?:boolean;blue?:boolean;}){
 const color=green?"text-emerald-700":blue?"text-blue-700":"text-slate-950";
 return(
 <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
 <p className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 sm:text-xs">{title}</p>
 <p className={`mt-2 break-words text-sm font-black sm:text-lg ${color}`}>{value}</p>
 </div>);
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "Completed"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Pending"
      ? "bg-amber-100 text-amber-700"
      : status === "Refunded"
      ? "bg-blue-100 text-blue-700"
      : "bg-red-100 text-red-700";

  return (
    <span
  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black sm:px-3 sm:text-xs ${style}`}
>
      {status}
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}