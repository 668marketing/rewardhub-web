"use client";

import {
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  updateAdminMemberProfile,
  updateAdminMemberStatus,
  updateAdminMemberTier,
} from "@/lib/admin-member-detail";

type MemberTier =
  | "SILVER"
  | "GOLD"
  | "PLATINUM";

type MemberStatus =
  | "ACTIVE"
  | "SUSPENDED";

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
    tier: string;
    status: string;
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
  tier: MemberTier;
  status: MemberStatus;
  reason: string;
};

export default function MemberEditAction({
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

  const initialForm =
    useMemo(
      () =>
        buildInitialForm(member),
      [member]
    );

  const changeState =
    useMemo(() => {
      const profileChanged =
        profileSnapshot(form) !==
        profileSnapshot(initialForm);

      const tierChanged =
        form.tier !==
        initialForm.tier;

      const statusChanged =
        form.status !==
        initialForm.status;

      return {
        profileChanged,
        tierChanged,
        statusChanged,
        anyChanged:
          profileChanged ||
          tierChanged ||
          statusChanged,
      };
    }, [form, initialForm]);

  function openDialog() {
    setForm(
      buildInitialForm(member)
    );
    setError("");
    setOpen(true);
  }

  function closeDialog() {
    if (loading) {
      return;
    }

    setOpen(false);
    setError("");
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
      !changeState.anyChanged
    ) {
      setError(
        "No member information has changed."
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

      const reason =
        form.reason.trim();

      if (
        changeState.profileChanged
      ) {
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

            reason,
          }
        );
      }

      if (
        changeState.tierChanged
      ) {
        await updateAdminMemberTier(
          memberId,
          {
            tier: form.tier,
            reason,
          }
        );
      }

      if (
        changeState.statusChanged
      ) {
        await updateAdminMemberStatus(
          memberId,
          {
            status:
              form.status,
            reason,
          }
        );
      }

      setOpen(false);
      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update member."
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
        Edit member
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Close edit member drawer"
            onClick={closeDialog}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-white/[0.09] bg-slate-900 shadow-2xl shadow-black/60">
            <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                  <Pencil className="h-5 w-5" />
                </div>

                <h2 className="mt-4 text-xl font-semibold text-white">
                  Edit member
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update profile, tier and account status for{" "}
                  {memberId}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                disabled={loading}
                aria-label="Close"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              <FormSection
                title="Personal Information"
                description="Member identity and contact details"
              >
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>
              </FormSection>

              <FormSection
                title="Address"
                description="Member residential or correspondence address"
              >
                <div className="grid gap-4 sm:grid-cols-2">
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
              </FormSection>

              <FormSection
                title="Membership"
                description="Tier and account access controls"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Membership Tier">
                    <select
                      value={form.tier}
                      onChange={(event) =>
                        setField(
                          "tier",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    >
                      <option value="SILVER">
                        Silver
                      </option>
                      <option value="GOLD">
                        Gold
                      </option>
                      <option value="PLATINUM">
                        Platinum
                      </option>
                    </select>
                  </FormField>

                  <FormField label="Account Status">
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setField(
                          "status",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    >
                      <option value="ACTIVE">
                        Active
                      </option>
                      <option value="SUSPENDED">
                        Suspended
                      </option>
                    </select>
                  </FormField>
                </div>

                <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] px-4 py-3 text-xs leading-5 text-amber-200/80">
                  Tier and status changes use the existing secured
                  Admin APIs and continue to create separate audit-log
                  records.
                </div>
              </FormSection>

              <FormSection
                title="Change Reason"
                description="Required for the Admin audit log"
              >
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
                    placeholder="Explain why this member information is being updated"
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
              </FormSection>

              {error ? (
                <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
            </div>

            <footer className="border-t border-white/[0.08] bg-slate-900/95 px-5 py-4 sm:px-7">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-600">
                  {changeState.anyChanged
                    ? [
                        changeState.profileChanged
                          ? "Profile"
                          : "",
                        changeState.tierChanged
                          ? "Tier"
                          : "",
                        changeState.statusChanged
                          ? "Status"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(", ") +
                      " changed"
                    : "No changes yet"}
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeDialog}
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
                      !changeState.anyChanged ||
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
                      "Save changes"
                    )}
                  </button>
                </div>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/55 px-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10 disabled:opacity-50";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5 last:mb-0 sm:p-6">
      <h3 className="font-semibold text-white">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-600">
        {description}
      </p>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

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
    tier:
      normalizeTier(
        member.tier
      ),
    status:
      normalizeStatus(
        member.status
      ),
    reason: "",
  };
}

function profileSnapshot(
  form: FormState
) {
  return JSON.stringify({
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
  });
}

function normalizeTier(
  value: string
): MemberTier {
  const normalized =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    normalized === "GOLD" ||
    normalized === "PLATINUM"
  ) {
    return normalized;
  }

  return "SILVER";
}

function normalizeStatus(
  value: string
): MemberStatus {
  return String(value || "")
    .trim()
    .toUpperCase() ===
    "SUSPENDED"
    ? "SUSPENDED"
    : "ACTIVE";
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
