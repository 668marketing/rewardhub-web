"use client";

import { useEffect, useMemo, useState } from "react";
import MerchantNav from "@/components/layout/MerchantNav";
import {
  getMerchantTransactionHistory,
  uploadTransactionReceipt,
} from "@/lib/api";

export default function MerchantTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [previewReceipt, setPreviewReceipt] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    const merchant = JSON.parse(localStorage.getItem("merchant") || "{}");
    const merchantId = merchant?.merchantId || merchant?.MERCHANT_ID;

    if (!merchantId) {
      setLoading(false);
      return;
    }

    try {
      const res = await getMerchantTransactionHistory({
        merchantId,
        limit: 200,
      });

      setTransactions(res?.data?.data?.transactions || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadReceipt(transactionId: string, file: File) {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64 = String(reader.result).split(",")[1];

        const res = await uploadTransactionReceipt({
          transactionId,
          base64,
        });

        const receiptUrl =
          res?.data?.data?.receiptUrl || res?.data?.receiptUrl;

        setTransactions((old) =>
          old.map((tx) =>
            tx.transactionId === transactionId
              ? { ...tx, receiptUrl }
              : tx
          )
        );

        setSelectedTx((old: any) =>
          old?.transactionId === transactionId
            ? { ...old, receiptUrl }
            : old
        );

        alert("Receipt uploaded successfully");
      } catch (err: any) {
        alert(err.message || "Upload failed");
      }
    };

    reader.readAsDataURL(file);
  }

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const keyword = search.toLowerCase();

      const matchSearch =
        !keyword ||
        String(tx.transactionId || "").toLowerCase().includes(keyword) ||
        String(tx.memberId || "").toLowerCase().includes(keyword);

      const matchMethod =
        method === "All" || String(tx.paymentMethod || "") === method;

      const txDate = new Date(tx.createdAt);
      const today = new Date();

      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const isToday = txDate.toDateString() === today.toDateString();
      const isYesterday =
        txDate.toDateString() === yesterday.toDateString();

      const isThisMonth =
        txDate.getFullYear() === today.getFullYear() &&
        txDate.getMonth() === today.getMonth();

      const matchDate =
        dateFilter === "All" ||
        (dateFilter === "Today" && isToday) ||
        (dateFilter === "Yesterday" && isYesterday) ||
        (dateFilter === "This Month" && isThisMonth);

      return matchSearch && matchMethod && matchDate;
    });
  }, [transactions, search, method, dateFilter]);

  const totalOriginal = sum(filtered, "amount");
  const totalPayAmount = sum(filtered, "payAmount");
  const totalCashback = sum(filtered, "cashback");
  const totalRewardCredits = sum(filtered, "rewardCreditsUsed");
  const totalPoints = sum(filtered, "pointsEarned");

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-7xl">
          <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
              Merchant Transactions
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
              Transaction History
            </h1>

            <p className="mt-3 max-w-2xl text-xs font-bold leading-5 text-slate-400 sm:text-sm sm:leading-6">
              Track customer payments, instant cashback, Reward Credits used,
              and points issued.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-5">
              <Stat title="Customer Pays" value={`RM${money(totalPayAmount)}`} />
              <Stat title="Original Sales" value={`RM${money(totalOriginal)}`} />
              <Stat title="Cashback Given" value={`RM${money(totalCashback)}`} />
              <Stat
                title="Reward Credits Used"
                value={`RM${money(totalRewardCredits)}`}
              />
              <Stat
                title="Points Issued"
                value={`${totalPoints} pts`}
                wideOnMobile
              />
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  All Transactions
                </h2>
                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                  Showing {filtered.length} transaction(s)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-row">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search TX / Member ID"
                  className="col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm lg:col-span-1"
                />

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                >
                  <option value="All">All Dates</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Month">This Month</option>
                </select>

                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-slate-950 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                >
                  <option value="All">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="DuitNow">DuitNow</option>
                  <option value="TNG">TNG</option>
                  <option value="Bank">Bank</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="mt-5 space-y-3 lg:hidden">
              {filtered.map((tx) => (
                <MobileTransactionCard
                  key={tx.transactionId}
                  tx={tx}
                  onOpen={() => setSelectedTx(tx)}
                  onPreviewReceipt={(url) => setPreviewReceipt(url)}
                />
              ))}

              {!loading && filtered.length === 0 && (
                <EmptyState text="No transactions found." />
              )}

              {loading && <EmptyState text="Loading transactions..." />}
            </div>

            {/* Desktop table */}
            <div className="mt-6 hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1150px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-4">Date / Time</th>
                    <th className="px-4 py-4">Transaction ID</th>
                    <th className="px-4 py-4">Member</th>
                    <th className="px-4 py-4 text-right">Original</th>
                    <th className="px-4 py-4 text-right">Cashback</th>
                    <th className="px-4 py-4 text-right">Reward Credit</th>
                    <th className="px-4 py-4 text-right">Customer Pays</th>
                    <th className="px-4 py-4 text-right">Points</th>
                    <th className="px-4 py-4">Method</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Receipt</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((tx) => (
                    <tr
                      key={tx.transactionId}
                      onClick={() => setSelectedTx(tx)}
                      className="cursor-pointer border-b border-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-5">
                        {formatDate(tx.createdAt)}
                      </td>

                      <td className="px-4 py-5 font-black text-slate-950">
                        {tx.transactionId}
                      </td>

                      <td className="px-4 py-5">{tx.memberId || "-"}</td>

                      <td className="px-4 py-5 text-right">
                        RM{money(tx.amount)}
                      </td>

                      <td className="px-4 py-5 text-right text-emerald-700">
                        RM{money(tx.cashback)}
                      </td>

                      <td className="px-4 py-5 text-right">
                        RM{money(tx.rewardCreditsUsed)}
                      </td>

                      <td className="px-4 py-5 text-right text-lg font-black text-slate-950">
                        RM{money(tx.payAmount)}
                      </td>

                      <td className="px-4 py-5 text-right">
                        {Number(tx.pointsEarned || 0)} pts
                      </td>

                      <td className="px-4 py-5">{tx.paymentMethod || "-"}</td>

                      <td className="px-4 py-5">
                        <StatusBadge status={tx.status || "Completed"} />
                      </td>

                      <td className="px-4 py-5">
                        {tx.receiptUrl ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewReceipt(tx.receiptUrl);
                            }}
                            className="font-black text-blue-600"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filtered.length === 0 && (
                <EmptyState text="No transactions found." />
              )}

              {loading && <EmptyState text="Loading transactions..." />}
            </div>
          </div>
        </section>

        {selectedTx && (
          <TransactionDetailModal
            tx={selectedTx}
            onClose={() => setSelectedTx(null)}
            onPreviewReceipt={(url: string) => setPreviewReceipt(url)}
            onUploadReceipt={handleUploadReceipt}
          />
        )}

        {previewReceipt && (
          <ReceiptPreviewModal
            url={previewReceipt}
            onClose={() => setPreviewReceipt("")}
          />
        )}
      </main>
    </>
  );
}

function MobileTransactionCard({
  tx,
  onOpen,
  onPreviewReceipt,
}: {
  tx: any;
  onOpen: () => void;
  onPreviewReceipt: (url: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 text-left transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">
            {tx.memberId || "Member"}
          </p>

          <div className="mt-2">
            <StatusBadge status={tx.status || "Completed"} />
          </div>

          <p className="mt-2 text-[10px] font-bold text-slate-500">
            {tx.paymentMethod || "Payment"} • {formatDate(tx.createdAt)}
          </p>

          <p className="mt-1 truncate text-[9px] font-bold text-slate-400">
            {tx.transactionId}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
            Customer Pays
          </p>
          <p className="mt-1 text-lg font-black text-slate-950">
            RM{money(tx.payAmount)}
          </p>
          <p className="mt-1 text-[10px] font-bold text-emerald-700">
            Cashback RM{money(tx.cashback)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniInfo title="Original" value={`RM${money(tx.amount)}`} />
        <MiniInfo
          title="Credits Used"
          value={`RM${money(tx.rewardCreditsUsed)}`}
        />
        <MiniInfo
          title="Points"
          value={`${Number(tx.pointsEarned || 0)} pts`}
        />

        <div className="rounded-xl bg-white p-3">
          <p className="text-[9px] font-black text-slate-400">Receipt</p>
          {tx.receiptUrl ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onPreviewReceipt(tx.receiptUrl);
              }}
              className="mt-1 inline-block text-xs font-black text-blue-600"
            >
              View Receipt
            </span>
          ) : (
            <p className="mt-1 text-xs font-black text-slate-400">No Receipt</p>
          )}
        </div>
      </div>
    </button>
  );
}

function TransactionDetailModal({
  tx,
  onClose,
  onPreviewReceipt,
  onUploadReceipt,
}: {
  tx: any;
  onClose: () => void;
  onPreviewReceipt: (url: string) => void;
  onUploadReceipt: (transactionId: string, file: File) => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 px-3 py-3 sm:items-center sm:px-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
            Transaction Detail
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 sm:hidden"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3 text-xs font-bold text-slate-700 sm:mt-6 sm:space-y-4 sm:text-sm">
          <Detail label="Transaction ID" value={tx.transactionId} />
          <Detail label="Member ID" value={tx.memberId || "-"} />
          <Detail label="Date / Time" value={formatDate(tx.createdAt)} />
          <Detail label="Original Amount" value={`RM${money(tx.amount)}`} />
          <Detail label="Cashback" value={`RM${money(tx.cashback)}`} />
          <Detail
            label="Reward Credits"
            value={`RM${money(tx.rewardCreditsUsed)}`}
          />
          <Detail label="Customer Pays" value={`RM${money(tx.payAmount)}`} />
          <Detail
            label="Points Earned"
            value={`${Number(tx.pointsEarned || 0)} pts`}
          />
          <Detail label="Payment Method" value={tx.paymentMethod || "-"} />
          <Detail label="Status" value={tx.status || "Completed"} />

          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <span className="text-slate-400">Receipt</span>

            <div className="flex items-center gap-2">
              {tx.receiptUrl ? (
                <button
                  onClick={() => onPreviewReceipt(tx.receiptUrl)}
                  className="font-black text-blue-600"
                >
                  View
                </button>
              ) : (
                <span className="text-slate-400">-</span>
              )}

              <label className="cursor-pointer rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black text-white sm:text-xs">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    onUploadReceipt(tx.transactionId, file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 hidden w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white sm:block"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function ReceiptPreviewModal({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-3 py-3 sm:px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-[1.75rem] bg-white p-4 shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
            Receipt Preview
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white sm:px-4 sm:text-sm"
          >
            Close
          </button>
        </div>

        <div className="mt-4 max-h-[78vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:mt-5 sm:p-3">
          <img
            src={getReceiptImageUrl(url)}
            alt="Receipt"
            className="mx-auto max-h-[72vh] w-auto rounded-xl object-contain"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  wideOnMobile = false,
}: {
  title: string;
  value: any;
  wideOnMobile?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl bg-white/10 p-3 sm:rounded-[2rem] sm:p-6 ${
        wideOnMobile ? "col-span-2 xl:col-span-1" : ""
      }`}
    >
      <p className="truncate text-[9px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>
      <h3 className="mt-1 break-words text-sm font-black leading-tight text-white sm:mt-3 sm:text-3xl">
        {value}
      </h3>
    </div>
  );
}

function MiniInfo({ title, value }: { title: string; value: any }) {
  return (
    <div className="min-w-0 rounded-xl bg-white p-3">
      <p className="truncate text-[9px] font-black text-slate-400">{title}</p>
      <p className="mt-1 break-words text-xs font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "Completed"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Pending"
        ? "bg-amber-100 text-amber-700"
        : status === "Cancelled"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black sm:px-3 sm:text-xs ${color}`}
    >
      {status}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="break-all text-right font-black text-slate-950">
        {value}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-10 sm:text-sm">
      {text}
    </div>
  );
}

function sum(list: any[], key: string) {
  return list.reduce((total, item) => total + Number(item?.[key] || 0), 0);
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

function getReceiptImageUrl(url: string) {
  if (!url) return "";

  if (url.includes("drive.google.com/uc?export=view&id=")) {
    const id = url.split("id=")[1];
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }

  if (url.includes("drive.google.com/file/d/")) {
    const id = url.split("/file/d/")[1]?.split("/")[0];
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }

  return url;
}