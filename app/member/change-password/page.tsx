"use client";

import {
  FormEvent,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import {
  useRouter,
} from "next/navigation";

import MemberLayout from "@/components/layout/MemberLayout";
import {
  useLanguage,
} from "@/hooks/useLanguage";

type StoredMember = {
  memberId?: string;
  MEMBER_ID?: string;
  id?: string;
  profile?: StoredMember;
  member?: StoredMember;
  data?: StoredMember;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  data?: unknown;
};

function getStoredMemberId() {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  try {
    const raw =
      localStorage.getItem(
        "member"
      );

    if (!raw) {
      return "";
    }

    const parsed =
      JSON.parse(
        raw
      ) as StoredMember;

    return String(
      parsed.memberId ??
        parsed.MEMBER_ID ??
        parsed.id ??
        parsed.profile?.memberId ??
        parsed.profile?.MEMBER_ID ??
        parsed.member?.memberId ??
        parsed.member?.MEMBER_ID ??
        parsed.data?.memberId ??
        parsed.data?.MEMBER_ID ??
        ""
    ).trim();
  } catch {
    return "";
  }
}

function getApiUrl() {
  return String(
    process.env
      .NEXT_PUBLIC_REWARDHUB_API ||
      ""
  ).trim();
}

async function updateMemberPassword(
  input: {
    memberId: string;
    currentPassword: string;
    newPassword: string;
  }
) {
  const apiUrl =
    getApiUrl();

  if (!apiUrl) {
    throw new Error(
      "RewardHub API URL is missing."
    );
  }

  const response =
    await fetch(
      apiUrl,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        cache:
          "no-store",

        body:
          JSON.stringify({
            action:
              "updateMemberPassword",

            ...input,
          }),
      }
    );

  const text =
    await response.text();

  let result:
    ApiResponse;

  try {
    result =
      JSON.parse(
        text
      ) as ApiResponse;
  } catch {
    throw new Error(
      "RewardHub backend returned an invalid response."
    );
  }

  if (
    !response.ok ||
    result.success ===
      false ||
    result.error
  ) {
    throw new Error(
      String(
        result.message ||
          result.error ||
          "Unable to change password."
      )
    );
  }

  return result;
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    error instanceof
      Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

export default function ChangePasswordPage() {
  const router =
    useRouter();

  const {
    t,
  } =
    useLanguage();

  const [
    currentPassword,
    setCurrentPassword,
  ] =
    useState("");

  const [
    newPassword,
    setNewPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] =
    useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const memberId =
      getStoredMemberId();

    if (!memberId) {
      setError(
        t(
          "memberCard.memberIdMissing"
        )
      );

      return;
    }

    if (
      !currentPassword
    ) {
      setError(
        t(
          "memberChangePassword.currentPassword"
        )
      );

      return;
    }

    if (
      newPassword.length <
      6
    ) {
      setError(
        "Password must be at least 6 characters."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      await updateMemberPassword({
        memberId,
        currentPassword,
        newPassword,
      });

      setCurrentPassword(
        ""
      );

      setNewPassword(
        ""
      );

      setConfirmPassword(
        ""
      );

      setSuccess(
        "Password updated successfully."
      );
    } catch (
      submitError
    ) {
      setError(
        getErrorMessage(
          submitError,
          "Unable to change password."
        )
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-32 sm:px-6 sm:py-7 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-2xl">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/member/profile"
              )
            }
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:px-5 sm:py-3 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />

            {t(
              "common.back"
            )}
          </button>

          <div className="mt-5 overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] sm:mt-6 sm:rounded-[2.5rem]">
            <div className="bg-slate-950 px-5 py-7 text-white sm:px-8 sm:py-9">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-300 sm:h-16 sm:w-16">
                  <KeyRound className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs">
                    RewardHub Member
                  </p>

                  <h1 className="mt-1 text-2xl font-black sm:text-4xl">
                    {t(
                      "memberChangePassword.title"
                    )}
                  </h1>

                  <p className="mt-2 text-xs font-bold leading-5 text-slate-400 sm:text-sm">
                    Update your account password securely.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="p-5 sm:p-8"
            >
              {error ? (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />

                  {success}
                </div>
              ) : null}

              <div className="space-y-5">
                <PasswordField
                  label={t(
                    "memberChangePassword.currentPassword"
                  )}
                  value={
                    currentPassword
                  }
                  show={
                    showCurrentPassword
                  }
                  onChange={
                    setCurrentPassword
                  }
                  onToggle={() =>
                    setShowCurrentPassword(
                      (current) =>
                        !current
                    )
                  }
                  autoComplete="current-password"
                />

                <PasswordField
                  label={t(
                    "memberChangePassword.newPassword"
                  )}
                  value={
                    newPassword
                  }
                  show={
                    showNewPassword
                  }
                  onChange={
                    setNewPassword
                  }
                  onToggle={() =>
                    setShowNewPassword(
                      (current) =>
                        !current
                    )
                  }
                  autoComplete="new-password"
                />

                <PasswordField
                  label={t(
                    "memberChangePassword.confirmPassword"
                  )}
                  value={
                    confirmPassword
                  }
                  show={
                    showConfirmPassword
                  }
                  onChange={
                    setConfirmPassword
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current
                    )
                  }
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:py-5 sm:text-base"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  t(
                    "memberChangePassword.updatePassword"
                  )
                )}
              </button>
            </form>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

function PasswordField({
  label,
  value,
  show,
  onChange,
  onToggle,
  autoComplete,
}: {
  label: string;
  value: string;
  show: boolean;
  onChange:
    (value: string) =>
      void;
  onToggle:
    () => void;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </span>

      <div className="relative">
        <input
          type={
            show
              ? "text"
              : "password"
          }
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          autoComplete={
            autoComplete
          }
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 pr-14 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-100 sm:py-5"
        />

        <button
          type="button"
          onClick={
            onToggle
          }
          aria-label={
            show
              ? "Hide password"
              : "Show password"
          }
          className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-slate-500 transition hover:text-slate-950"
        >
          {show ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
    </label>
  );
}