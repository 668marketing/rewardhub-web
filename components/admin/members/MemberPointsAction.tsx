"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  adjustAdminMemberPoints,
} from "@/lib/admin-member-detail";

type AdjustmentType =
  | "ADD"
  | "DEDUCT";

type Props = {
  memberId: string;
  memberName: string;
  currentPoints: number;
  onSuccess: () => void;
};

export default function MemberPointsAction({
  memberId,
  memberName,
  currentPoints,
  onSuccess,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const [
    adjustmentType,
    setAdjustmentType,
  ] = useState<AdjustmentType>(
    "ADD"
  );

  const [points, setPoints] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const numericPoints =
    Number(points || 0);

  const validWholeNumber =
    Number.isInteger(
      numericPoints
    );

  const previewBalance =
    adjustmentType === "ADD"
      ? currentPoints +
        numericPoints
      : currentPoints -
        numericPoints;

  function openDialog() {
    setAdjustmentType("ADD");
    setPoints("");
    setReason("");
    setError("");
    setOpen(true);
  }

  async function handleSubmit() {
    if (loading) {
      return;
    }

    if (
      !Number.isFinite(
        numericPoints
      ) ||
      numericPoints <= 0 ||
      !Number.isInteger(
        numericPoints
      )
    ) {
      setError(
        "Enter a whole number greater than 0."
      );
      return;
    }

    if (
      adjustmentType ===
        "DEDUCT" &&
      numericPoints >
        currentPoints
    ) {
      setError(
        "The deduction cannot exceed the current points balance."
      );
      return;
    }

    if (
      reason.trim().length < 5
    ) {
      setError(
        "Please enter a reason of at least 5 characters."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await adjustAdminMemberPoints(
        memberId,
        {
          adjustmentType,
          points:
            numericPoints,
          reason:
            reason.trim(),
        }
      );

      setOpen(false);
      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to adjust member points."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="flex h-11 items-center gap-3 rounded-xl border border-blue-400/15 bg-blue-400/5 px-4 text-left text-sm text-blue-300 transition hover:bg-blue-400/10"
      >
        <Star className="h-4 w-4" />
        Adjust points
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => {
              if (!loading) {
                setOpen(false);
              }
            }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/[0.09] bg-slate-900 p-6 shadow-2xl shadow-black/50 sm:p-7">
            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              disabled={loading}
              aria-label="Close"
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300">
              <Star className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-white">
              Adjust member points
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Manually add or deduct
              RewardHub points for{" "}
              {memberName}.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <PointsBalanceBox
                label="Current Points"
                value={formatNumber(
                  currentPoints
                )}
              />

              <PointsBalanceBox
                label="Points After"
                value={formatNumber(
                  Math.max(
                    previewBalance,
                    0
                  )
                )}
                invalid={
                  previewBalance < 0
                }
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setAdjustmentType(
                    "ADD"
                  )
                }
                className={[
                  "flex items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition",
                  adjustmentType ===
                  "ADD"
                    ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300"
                    : "border-white/[0.07] bg-slate-950/30 text-slate-500",
                ].join(" ")}
              >
                <ArrowUpCircle className="h-5 w-5" />
                Add
              </button>

              <button
                type="button"
                onClick={() =>
                  setAdjustmentType(
                    "DEDUCT"
                  )
                }
                className={[
                  "flex items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition",
                  adjustmentType ===
                  "DEDUCT"
                    ? "border-red-400/35 bg-red-400/10 text-red-300"
                    : "border-white/[0.07] bg-slate-950/30 text-slate-500",
                ].join(" ")}
              >
                <ArrowDownCircle className="h-5 w-5" />
                Deduct
              </button>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-slate-300">
                Points
              </label>

              <input
                type="number"
                min="1"
                step="1"
                max="100000000"
                value={points}
                onChange={(event) =>
                  setPoints(
                    event.target.value
                  )
                }
                placeholder="0"
                className="mt-2 h-14 w-full rounded-2xl border border-white/[0.08] bg-slate-950/55 px-4 text-lg font-semibold text-white outline-none placeholder:text-slate-700 focus:border-blue-400/40 focus:ring-4 focus:ring-blue-400/10"
              />

              {points &&
              !validWholeNumber ? (
                <p className="mt-2 text-xs text-red-300">
                  Points must be a whole
                  number.
                </p>
              ) : null}
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-300">
                Reason
              </label>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Explain why this points adjustment is required"
                className="mt-2 w-full resize-none rounded-2xl border border-white/[0.08] bg-slate-950/55 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-400/40 focus:ring-4 focus:ring-blue-400/10"
              />

              <div className="mt-2 flex justify-between text-xs text-slate-700">
                <span>
                  Minimum 5 characters
                </span>

                <span>
                  {reason.trim().length}
                </span>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                disabled={loading}
                className="h-11 rounded-xl border border-white/[0.08] px-5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleSubmit
                }
                disabled={
                  loading ||
                  numericPoints <= 0 ||
                  !validWholeNumber ||
                  reason.trim().length <
                    5 ||
                  previewBalance < 0
                }
                className={[
                  "flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40",
                  adjustmentType ===
                  "ADD"
                    ? "bg-emerald-400 hover:bg-emerald-300"
                    : "bg-red-300 hover:bg-red-200",
                ].join(" ")}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : adjustmentType ===
                  "ADD" ? (
                  "Add points"
                ) : (
                  "Deduct points"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PointsBalanceBox({
  label,
  value,
  invalid = false,
}: {
  label: string;
  value: string;
  invalid?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border bg-slate-950/35 p-4",
        invalid
          ? "border-red-400/25"
          : "border-white/[0.07]",
      ].join(" ")}
    >
      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p
        className={[
          "mt-2 text-xl font-semibold",
          invalid
            ? "text-red-300"
            : "text-white",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(Number(value || 0));
}