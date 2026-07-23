"use client";

import {
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Snowflake,
  X,
} from "lucide-react";
import {
  useState,
} from "react";

import {
  updateAdminMemberStatus,
} from "@/lib/admin-member-detail";

type MemberStatusActionProps = {
  memberId: string;
  memberName: string;
  currentStatus: string;
  onSuccess: () => void;
};

export default function MemberStatusAction({
  memberId,
  memberName,
  currentStatus,
  onSuccess,
}: MemberStatusActionProps) {
  const normalizedStatus =
    currentStatus
      .trim()
      .toUpperCase();

  const targetStatus =
    normalizedStatus ===
    "SUSPENDED"
      ? "ACTIVE"
      : "SUSPENDED";

  const isSuspending =
    targetStatus ===
    "SUSPENDED";

  const [open, setOpen] =
    useState(false);

  const [reason, setReason] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit() {
    if (loading) {
      return;
    }

    const normalizedReason =
      reason.trim();

    if (
      normalizedReason.length < 5
    ) {
      setError(
        "Please enter a reason of at least 5 characters."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateAdminMemberStatus(
        memberId,
        {
          status: targetStatus,
          reason:
            normalizedReason,
        }
      );

      setOpen(false);
      setReason("");

      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update member status."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setReason("");
          setOpen(true);
        }}
        className={[
          "flex h-11 items-center gap-3 rounded-xl border px-4 text-left text-sm transition",
          isSuspending
            ? "border-red-400/15 bg-red-400/5 text-red-300 hover:bg-red-400/10"
            : "border-emerald-400/15 bg-emerald-400/5 text-emerald-300 hover:bg-emerald-400/10",
        ].join(" ")}
      >
        {isSuspending ? (
          <Snowflake className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}

        {isSuspending
          ? "Suspend member"
          : "Activate member"}
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

          <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.09] bg-slate-900 p-6 shadow-2xl shadow-black/50 sm:p-7">
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

            <div
              className={[
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                isSuspending
                  ? "bg-red-400/10 text-red-300"
                  : "bg-emerald-400/10 text-emerald-300",
              ].join(" ")}
            >
              {isSuspending ? (
                <ShieldAlert className="h-6 w-6" />
              ) : (
                <CheckCircle2 className="h-6 w-6" />
              )}
            </div>

            <h2 className="mt-5 text-xl font-semibold text-white">
              {isSuspending
                ? "Suspend member account"
                : "Activate member account"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {isSuspending
                ? `${memberName} will no longer be allowed to use the RewardHub member account until it is activated again.`
                : `${memberName} will regain access to the RewardHub member account.`}
            </p>

            <div className="mt-6 rounded-2xl border border-white/[0.07] bg-slate-950/35 p-4">
              <p className="text-xs text-slate-600">
                Member
              </p>

              <p className="mt-1 text-sm font-medium text-white">
                {memberName}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                {memberId}
              </p>
            </div>

            <div className="mt-5">
              <label
                htmlFor="member-status-reason"
                className="text-sm font-medium text-slate-300"
              >
                Reason
              </label>

              <textarea
                id="member-status-reason"
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                disabled={loading}
                rows={4}
                placeholder={
                  isSuspending
                    ? "Explain why this member account is being suspended"
                    : "Explain why this member account is being activated"
                }
                className="mt-2 w-full resize-none rounded-2xl border border-white/[0.08] bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10 disabled:opacity-50"
              />

              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-700">
                  Minimum 5 characters
                </p>

                <p className="text-xs text-slate-700">
                  {reason.trim().length}
                </p>
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
                  reason.trim().length <
                    5
                }
                className={[
                  "flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                  isSuspending
                    ? "bg-red-300 text-slate-950 hover:bg-red-200"
                    : "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
                ].join(" ")}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : isSuspending ? (
                  "Suspend member"
                ) : (
                  "Activate member"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}