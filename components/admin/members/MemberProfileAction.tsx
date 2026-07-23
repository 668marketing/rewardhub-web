"use client";

import {
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  updateAdminMemberProfile,
} from "@/lib/admin-member-detail";

type Props = {
  memberId: string;
  member: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  onSuccess: () => void;
};

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  reason: string;
};

export default function MemberProfileAction({
  memberId,
  member,
  onSuccess,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const [form, setForm] =
    useState<FormState>(
      buildInitialForm(member)
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function openDialog() {
    setForm(
      buildInitialForm(member)
    );
    setError("");
    setOpen(true);
  }

  function setField(
    key: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit() {
    if (loading) {
      return;
    }

    if (
      form.fullName.trim().length <
      2
    ) {
      setError(
        "Full name must contain at least 2 characters."
      );
      return;
    }

    if (
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (
      form.phone &&
      form.phone.replace(
        /\D/g,
        ""
      ).length < 8
    ) {
      setError(
        "Phone number must contain at least 8 digits."
      );
      return;
    }

    if (
      form.reason.trim().length <
      5
    ) {
      setError(
        "Please enter a reason of at least 5 characters."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateAdminMemberProfile(
        memberId,
        {
          fullName:
            form.fullName.trim(),

          email:
            form.email
              .trim()
              .toLowerCase(),

          phone:
            form.phone.trim(),

          dateOfBirth:
            form.dateOfBirth,

          gender:
            form.gender,

          addressLine1:
            form.addressLine1.trim(),

          addressLine2:
            form.addressLine2.trim(),

          city:
            form.city.trim(),

          state:
            form.state.trim(),

          postcode:
            form.postcode.trim(),

          country:
            form.country.trim(),

          reason:
            form.reason.trim(),
        }
      );

      setOpen(false);
      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update member profile."
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
        className="flex h-11 items-center gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-4 text-left text-sm text-cyan-300 transition hover:bg-cyan-400/10"
      >
        <Pencil className="h-4 w-4" />
        Edit profile
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

          <div className="relative max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/[0.09] bg-slate-900 p-6 shadow-2xl shadow-black/50 sm:p-7">
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

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
              <Pencil className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-white">
              Edit member profile
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Update personal and contact
              information for {memberId}.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full Name"
                required
              >
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    setField(
                      "fullName",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setField(
                      "email",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setField(
                      "phone",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Date of Birth">
                <input
                  type="date"
                  value={
                    form.dateOfBirth
                  }
                  onChange={(event) =>
                    setField(
                      "dateOfBirth",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Gender">
                <select
                  value={form.gender}
                  onChange={(event) =>
                    setField(
                      "gender",
                      event.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Not specified
                  </option>
                  <option value="MALE">
                    Male
                  </option>
                  <option value="FEMALE">
                    Female
                  </option>
                  <option value="OTHER">
                    Other
                  </option>
                  <option value="PREFER_NOT_TO_SAY">
                    Prefer not to say
                  </option>
                </select>
              </FormField>

              <FormField label="Country">
                <input
                  value={form.country}
                  onChange={(event) =>
                    setField(
                      "country",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Address Line 1">
                  <input
                    value={
                      form.addressLine1
                    }
                    onChange={(event) =>
                      setField(
                        "addressLine1",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField label="Address Line 2">
                  <input
                    value={
                      form.addressLine2
                    }
                    onChange={(event) =>
                      setField(
                        "addressLine2",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="City">
                <input
                  value={form.city}
                  onChange={(event) =>
                    setField(
                      "city",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="State">
                <input
                  value={form.state}
                  onChange={(event) =>
                    setField(
                      "state",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Postcode">
                <input
                  value={form.postcode}
                  onChange={(event) =>
                    setField(
                      "postcode",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField
                label="Reason"
                required
              >
                <textarea
                  rows={4}
                  value={form.reason}
                  onChange={(event) =>
                    setField(
                      "reason",
                      event.target.value
                    )
                  }
                  placeholder="Explain why this profile is being updated"
                  className={`${inputClass} h-auto resize-none py-3`}
                />
              </FormField>

              <div className="mt-2 flex justify-between text-xs text-slate-700">
                <span>
                  Minimum 5 characters
                </span>

                <span>
                  {form.reason.trim().length}
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
                  form.fullName
                    .trim().length < 2 ||
                  form.reason
                    .trim().length < 5
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save profile"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/55 px-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10 disabled:opacity-50";

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">
        {label}

        {required ? (
          <span className="ml-1 text-red-300">
            *
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}

function buildInitialForm(
  member: Props["member"]
): FormState {
  return {
    fullName:
      member.fullName || "",
    email:
      member.email || "",
    phone:
      member.phone || "",
    dateOfBirth:
      normalizeDateInput(
        member.dateOfBirth || ""
      ),
    gender:
      normalizeGender(
        member.gender || ""
      ),
    addressLine1:
      member.addressLine1 || "",
    addressLine2:
      member.addressLine2 || "",
    city:
      member.city || "",
    state:
      member.state || "",
    postcode:
      member.postcode || "",
    country:
      member.country || "Malaysia",
    reason: "",
  };
}

function normalizeGender(
  value: string
) {
  const normalized =
    value
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");

  if (
    [
      "MALE",
      "FEMALE",
      "OTHER",
      "PREFER_NOT_TO_SAY",
    ].includes(normalized)
  ) {
    return normalized;
  }

  return "";
}

function normalizeDateInput(
  value: string
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
}