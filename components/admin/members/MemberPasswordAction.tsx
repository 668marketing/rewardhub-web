"use client";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  resetAdminMemberPassword,
} from "@/lib/admin-member-detail";

type Props = {
  memberId: string;
  memberName: string;
  onSuccess: () => void;
};

export default function MemberPasswordAction({
  memberId,
  memberName,
  onSuccess,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [reason, setReason] =
    useState("");

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const passwordMatches =
    newPassword.length > 0 &&
    newPassword ===
      confirmPassword;

  const passwordValid =
    newPassword.length >= 6 &&
    newPassword.length <= 50 &&
    !/\s/.test(newPassword);

  function openDialog() {
    setNewPassword("");
    setConfirmPassword("");
    setReason("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setOpen(true);
  }

  async function handleSubmit() {
    if (loading) {
      return;
    }

    if (!passwordValid) {
      setError(
        "Password must contain between 6 and 50 characters and cannot contain spaces."
      );
      return;
    }

    if (!passwordMatches) {
      setError(
        "Password confirmation does not match."
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

      await resetAdminMemberPassword(
        memberId,
        {
          newPassword,
          confirmPassword,
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
          : "Unable to reset member password."
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
        className="flex h-11 items-center gap-3 rounded-xl border border-orange-400/15 bg-orange-400/5 px-4 text-left text-sm text-orange-300 transition hover:bg-orange-400/10"
      >
        <KeyRound className="h-4 w-4" />
        Reset password
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-5">
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

          <div className="relative max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/[0.09] bg-slate-900 p-6 shadow-2xl shadow-black/50 sm:p-7">
            <button
              type="button"
              aria-label="Close"
              disabled={loading}
              onClick={() =>
                setOpen(false)
              }
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/10 text-orange-300">
              <KeyRound className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-white">
              Reset member password
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Set a new login password
              for {memberName}.
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

            <div className="mt-5 rounded-2xl border border-orange-400/15 bg-orange-400/[0.06] p-4">
              <div className="flex gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />

                <p className="text-xs leading-5 text-orange-100/70">
                  The previous password
                  will stop working
                  immediately after this
                  change.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-slate-300">
                New Password
              </label>

              <div className="relative mt-2">
                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/55 px-4 pr-12 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-orange-400/40 focus:ring-4 focus:ring-orange-400/10"
                />

                <button
                  type="button"
                  aria-label={
                    showNewPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowNewPassword(
                      (current) =>
                        !current
                    )
                  }
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-700">
                6–50 characters, no
                spaces
              </p>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-300">
                Confirm Password
              </label>

              <div className="relative mt-2">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Enter password again"
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/55 px-4 pr-12 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-orange-400/40 focus:ring-4 focus:ring-orange-400/10"
                />

                <button
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current
                    )
                  }
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {confirmPassword ? (
                <div
                  className={[
                    "mt-2 flex items-center gap-2 text-xs",
                    passwordMatches
                      ? "text-emerald-300"
                      : "text-red-300",
                  ].join(" ")}
                >
                  {passwordMatches ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Passwords match
                    </>
                  ) : (
                    "Passwords do not match"
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-300">
                Reason
              </label>

              <textarea
                rows={4}
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                placeholder="Explain why the member password is being reset"
                className="mt-2 w-full resize-none rounded-2xl border border-white/[0.08] bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-orange-400/40 focus:ring-4 focus:ring-orange-400/10"
              />

              <div className="mt-2 flex items-center justify-between text-xs text-slate-700">
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
                disabled={loading}
                onClick={() =>
                  setOpen(false)
                }
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
                  !passwordValid ||
                  !passwordMatches ||
                  reason.trim().length <
                    5
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting…
                  </>
                ) : (
                  "Reset password"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}