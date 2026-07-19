"use client";

import { useEffect, useMemo, useState } from "react";
import MerchantNav from "@/components/layout/MerchantNav";
import {
  getMerchantSettlementSummary,
  requestMerchantSettlement,
  uploadSettlementReceipt,
} from "@/lib/api";

export default function MerchantSettlementPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const [showPayment, setShowPayment] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  async function load() {
    const merchant = JSON.parse(localStorage.getItem("merchant") || "{}");
    const merchantId = merchant?.merchantId || merchant?.MERCHANT_ID;

    if (!merchantId) {
      setLoading(false);
      return;
    }

    try {
      const res = await getMerchantSettlementSummary({ merchantId });
      const result = res?.data?.data || res?.data || res;

      setData(result);
    } catch (err) {
      console.error("Failed to load settlement summary:", err);
      alert("Failed to load settlement summary");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRequestSettlement() {
    const merchant = JSON.parse(localStorage.getItem("merchant") || "{}");
    const merchantId = merchant?.merchantId || merchant?.MERCHANT_ID;

    if (!merchantId) return alert("Merchant not found");

    try {
      setRequesting(true);

      const res = await requestMerchantSettlement({ merchantId });
      const result = res?.data?.data || res?.data || res;

      alert(
        `Settlement requested successfully.\nAmount Payable: RM${money(
          result.amountPayable
        )}`
      );

      await load();
    } catch (err: any) {
      alert(err.message || "Request settlement failed");
    } finally {
      setRequesting(false);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.split(",")[1]);
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleUploadReceipt() {
    const pendingSettlement = history.find(
      (item: any) => item.status === "Pending"
    );

    if (!pendingSettlement) return alert("No pending settlement found");
    if (!receiptFile) return alert("Please select receipt image");

    try {
      setSubmittingReceipt(true);

      const base64 = await fileToBase64(receiptFile);

      await uploadSettlementReceipt({
        settlementId: pendingSettlement.settlementId,
        base64,
        fileName: receiptFile.name,
        paymentNote: paymentNote.trim(),
      });

      alert("Receipt uploaded successfully");

      setShowPayment(false);
      setReceiptFile(null);
      setPaymentNote("");

      await load();
    } catch (err: any) {
      alert(err.message || "Upload receipt failed");
    } finally {
      setSubmittingReceipt(false);
    }
  }

  const history = data?.history || [];
  const todayDate = new Date().getDate();
  const canPaySettlement = todayDate >= 1 && todayDate <= 10;

  const pendingSettlement = history.find(
    (item: any) => item.status === "Pending"
  );

  const filteredHistory = useMemo(() => {
    if (statusFilter === "All") return history;
    return history.filter((item: any) => item.status === statusFilter);
  }, [history, statusFilter]);

  const pendingAmount = Number(data?.pendingAmount || 0);
  const availablePayable = Number(data?.availablePayable || 0);
  const hasPending = pendingAmount > 0;
  const paidAmount = Number(data?.paidAmount || 0);
  const lastSettlement = Number(data?.lastSettlement || 0);

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-7xl">
          <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
              Merchant Settlement
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
              Settlement Center
            </h1>

            <p className="mt-3 max-w-2xl text-[11px] font-bold leading-5 text-slate-400 sm:text-sm sm:leading-6">
              Track your payable amount, settlement requests and payment status.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 sm:mt-8 sm:gap-4">
              <StatCard
                title="Pending Settlement"
                value={`RM${money(pendingAmount)}`}
              />
              <StatCard
                title="Paid Settlement"
                value={`RM${money(paidAmount)}`}
              />
              <StatCard
                title="Last Settlement"
                value={`RM${money(lastSettlement)}`}
              />
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal">
                  Available Payable
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-5xl">
                  RM{money(availablePayable)}
                </h2>

                <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  Formula: Marketing Budget - Cashback already given to members.
                </p>
              </div>

              {hasPending ? (
                <button
                  onClick={() => canPaySettlement && setShowPayment(true)}
                  disabled={!canPaySettlement}
                  className="w-full rounded-xl bg-slate-950 px-5 py-3 text-xs font-black text-white disabled:opacity-40 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4 sm:text-sm"
                >
                  {canPaySettlement
                    ? "Pay / Upload Receipt"
                    : "Settlement available from 1st - 10th"}
                </button>
              ) : (
                <button
                  onClick={handleRequestSettlement}
                  disabled={
                    requesting || availablePayable <= 0 || !canPaySettlement
                  }
                  className="w-full rounded-xl bg-slate-950 px-5 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4 sm:text-sm"
                >
                  {requesting
                    ? "Requesting..."
                    : !canPaySettlement
                      ? "Settlement available from 1st - 10th"
                      : availablePayable <= 0
                        ? "No Amount Available"
                        : "Request Settlement"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Settlement History
                </h2>

                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                  View all settlement requests and payment status.
                </p>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 outline-none sm:w-auto sm:rounded-2xl sm:px-5 sm:text-sm"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Mobile cards */}
            <div className="mt-5 space-y-3 lg:hidden">
              {filteredHistory.map((item: any) => (
                <SettlementCard key={item.settlementId} item={item} />
              ))}

              {!loading && filteredHistory.length === 0 && (
                <EmptyState text="No settlement records yet." />
              )}

              {loading && <EmptyState text="Loading settlements..." />}
            </div>

            {/* Desktop table */}
            <div className="mt-6 hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4">Settlement ID</th>
                    <th className="px-4 py-4">Month</th>
                    <th className="px-4 py-4">Total Sales</th>
                    <th className="px-4 py-4">Cashback</th>
                    <th className="px-4 py-4">Marketing Budget</th>
                    <th className="px-4 py-4">Amount Payable</th>
                    <th className="px-4 py-4">Bank</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Paid At</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHistory.map((item: any) => (
                    <tr
                      key={item.settlementId}
                      className="border-b border-slate-100 text-sm font-bold text-slate-700"
                    >
                      <td className="px-4 py-5">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-5 font-black text-slate-950">
                        {item.settlementId}
                      </td>
                      <td className="px-4 py-5">{formatMonth(item.month)}</td>
                      <td className="px-4 py-5">
                        RM{money(item.totalSales)}
                      </td>
                      <td className="px-4 py-5">
                        RM{money(item.totalCashback)}
                      </td>
                      <td className="px-4 py-5">
                        RM{money(item.totalMarketingBudget)}
                      </td>
                      <td className="px-4 py-5 font-black text-emerald-700">
                        RM{money(item.amountPayable)}
                      </td>
                      <td className="px-4 py-5">
                        {item.bankName || "-"}
                        {item.bankAccount ? ` / ${item.bankAccount}` : ""}
                      </td>
                      <td className="px-4 py-5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-5">{formatDate(item.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredHistory.length === 0 && (
                <EmptyState text="No settlement records yet." />
              )}

              {loading && <EmptyState text="Loading settlements..." />}
            </div>
          </div>
        </section>
      </main>

      {showPayment && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 px-3 py-3 sm:items-center sm:px-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                Settlement Payment
              </h2>

              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 sm:hidden"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500 sm:mt-3 sm:text-sm sm:leading-6">
              Please transfer the amount below and upload your receipt.
            </p>

            <div className="mt-5 rounded-xl border border-slate-200 p-4 sm:mt-6 sm:rounded-2xl sm:p-5">
              <p className="text-[10px] font-black text-slate-500 sm:text-sm">
                Amount Payable
              </p>

              <p className="mt-1 text-3xl font-black text-slate-950 sm:mt-2 sm:text-4xl">
                RM{money(pendingSettlement?.amountPayable || 0)}
              </p>

              <hr className="my-4 sm:my-5" />

              <BankDetail label="Bank" value="Maybank" />
              <BankDetail label="Account Name" value="RewardHub" />
              <BankDetail label="Account Number" value="123456789012" />
            </div>

            <input
              type="file"
              accept="image/*"
              className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none sm:mt-6 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
              onChange={(e) =>
                setReceiptFile(e.target.files?.[0] || null)
              }
            />

            {receiptFile && (
              <p className="mt-2 break-all text-[10px] font-bold text-emerald-700 sm:text-sm">
                Selected: {receiptFile.name}
              </p>
            )}

            <textarea
              className="mt-4 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
              placeholder="Payment Note (optional)"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />

            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6">
              <button
                className="rounded-xl border border-slate-200 py-3 text-xs font-black text-slate-950 sm:rounded-2xl sm:py-4 sm:text-sm"
                onClick={() => setShowPayment(false)}
              >
                Cancel
              </button>

              <button
                className="rounded-xl bg-slate-950 py-3 text-xs font-black text-white disabled:opacity-50 sm:rounded-2xl sm:py-4 sm:text-sm"
                disabled={submittingReceipt}
                onClick={handleUploadReceipt}
              >
                {submittingReceipt ? "Uploading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SettlementCard({ item }: { item: any }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">
            {formatMonth(item.month)}
          </p>

          <div className="mt-2">
            <StatusBadge status={item.status} />
          </div>

          <p className="mt-2 truncate text-[9px] font-bold text-slate-400">
            {item.settlementId}
          </p>

          <p className="mt-1 text-[9px] font-medium text-slate-400">
            {formatDate(item.createdAt)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
            Amount Payable
          </p>
          <p className="mt-1 text-lg font-black text-emerald-700">
            RM{money(item.amountPayable)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniInfo title="Total Sales" value={`RM${money(item.totalSales)}`} />
        <MiniInfo
          title="Cashback"
          value={`RM${money(item.totalCashback)}`}
        />
        <MiniInfo
          title="Marketing Budget"
          value={`RM${money(item.totalMarketingBudget)}`}
        />
        <MiniInfo
          title="Paid At"
          value={formatDate(item.paidAt)}
        />
      </div>

      <div className="mt-3 rounded-xl bg-white p-3">
        <p className="text-[9px] font-black text-slate-400">Bank</p>
        <p className="mt-1 break-words text-xs font-black text-slate-950">
          {item.bankName || "-"}
          {item.bankAccount ? ` / ${item.bankAccount}` : ""}
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/10 p-3 text-white sm:rounded-[2rem] sm:p-6">
      <p className="truncate text-[9px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>
      <h3 className="mt-1 break-words text-sm font-black leading-tight sm:mt-3 sm:text-3xl">
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

function BankDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-black text-slate-500 sm:text-sm">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "Paid"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Approved"
        ? "bg-blue-100 text-blue-700"
        : status === "Rejected"
          ? "bg-red-100 text-red-700"
          : status === "Submitted"
            ? "bg-purple-100 text-purple-700"
            : "bg-amber-100 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black sm:px-3 sm:text-xs ${style}`}
    >
      {status || "Pending"}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:p-10 sm:text-sm">
      {text}
    </div>
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
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMonth(value: any) {
  if (!value) return "-";

  const raw = String(value);
  const parts = raw.split("-");

  if (parts.length !== 2) return raw;

  const year = parts[0];
  const month = parts[1];

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${months[Number(month) - 1]} ${year}`;
}