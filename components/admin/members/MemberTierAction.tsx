"use client";

import {
  Award,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  updateAdminMemberTier,
} from "@/lib/admin-member-detail";

type MemberTier =
  | "SILVER"
  | "GOLD"
  | "PLATINUM";

type MemberTierActionProps = {
  memberId: string;
  memberName: string;
  currentTier: string;
  onSuccess: () => void;
};

const tierOptions: Array<{
  value: MemberTier;
  label: string;
  description: string;
}> = [
  {
    value: "SILVER",
    label: "Silver",
    description:
      "Default RewardHub membership tier.",
  },
  {
    value: "GOLD",
    label: "Gold",
    description:
      "Lifetime spending reached RM5,000.",
  },
  {
    value: "PLATINUM",
    label: "Platinum",
    description:
      "Lifetime spending reached RM15,000.",
  },
];

export default function MemberTierAction({
  memberId,
  memberName,
  currentTier,
  onSuccess,
}: MemberTierActionProps) {
  const normalizedTier =
    currentTier
      .trim()
      .toUpperCase() as MemberTier;

  const [open, setOpen] =
    useState(false);

  const [selectedTier, setSelectedTier] =
    useState<MemberTier>(
      normalizedTier || "SILVER"
    );

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

    if (
      selectedTier ===
      normalizedTier
    ) {
      setError(
        "Please select a different tier."
      );
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

      await updateAdminMemberTier(
        memberId,
        {
          tier: selectedTier,
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
          : "Unable to update member tier."
      );
    } finally {
      setLoading(false);
    }
  }

  function openDialog() {
    setSelectedTier(
      normalizedTier || "SILVER"
    );
    setReason("");
    setError("");
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="flex h-11 items-center gap-3 rounded-xl border border-amber-400/15 bg-amber-400/5 px-4 text-left text-sm text-amber-300 transition hover:bg-amber-400/10"
      >
        <Award className="h-4 w-4" />
        Change member tier
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

          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/[0.09] bg-slate-900 p-6 shadow-2xl shadow-black/50 sm:p-7">
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

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
              <Award className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-white">
              Change member tier
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Update the lifetime membership
              tier for {memberName}.
            </p>

            <div className="mt-6 rounded-2xl border border-white/[0.07] bg-slate-950/35 p-4">
              <p className="text-xs text-slate-600">
                Current tier
              </p>

              <p className="mt-1 text-sm font-semibold text-white">
                {normalizedTier}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                {memberId}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {tierOptions.map(
                (option) => {
                  const selected =
                    selectedTier ===
                    option.value;

                  const current =
                    normalizedTier ===
                    option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        setSelectedTier(
                          option.value
                        )
                      }
                      className={[
                        "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition",
                        selected
                          ? "border-amber-400/35 bg-amber-400/10"
                          : "border-white/[0.07] bg-slate-950/30 hover:bg-white/[0.04]",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          selected
                            ? "border-amber-300 bg-amber-300 text-slate-950"
                            : "border-white/20",
                        ].join(" ")}
                      >
                        {selected ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">
                            {option.label}
                          </p>

                          {current ? (
                            <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[9px] uppercase tracking-wide text-slate-500">
                              Current
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <div className="mt-6">
              <label
                htmlFor="member-tier-reason"
                className="text-sm font-medium text-slate-300"
              >
                Reason
              </label>

              <textarea
                id="member-tier-reason"
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                disabled={loading}
                rows={4}
                placeholder="Explain why this member tier is being changed"
                className="mt-2 w-full resize-none rounded-2xl border border-white/[0.08] bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-amber-400/40 focus:ring-4 focus:ring-amber-400/10 disabled:opacity-50"
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
                  selectedTier ===
                    normalizedTier ||
                  reason.trim().length <
                    5
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Update tier"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}