"use client";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  getCurrentAdminProfile,
  updateCurrentAdminPassword,
  updateCurrentAdminProfile,
} from "@/lib/admin/admin-profile";

import {
  useAdminAuth,
} from "@/components/admin/AdminRouteGuard";

type ProfileForm = {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  reason: string;
};

type ProfileTab =
  | "profile"
  | "security";

export default function AdminProfilePage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const {
    admin,
    permissions,
    expiresAt,
    updateCurrentAdmin,
    refreshSession,
  } = useAdminAuth();

  const requestedTab =
    searchParams.get(
      "tab"
    );

  const activeTab:
    ProfileTab =
    requestedTab ===
    "security"
      ? "security"
      : "profile";

  const [
    profileForm,
    setProfileForm,
  ] = useState<ProfileForm>({
    fullName:
      admin.fullName || "",
    email:
      admin.email || "",
    phone:
      admin.phone || "",
    reason:
      "",
  });

  const [
    passwordForm,
    setPasswordForm,
  ] = useState<PasswordForm>({
    currentPassword:
      "",
    newPassword:
      "",
    confirmPassword:
      "",
    reason:
      "",
  });

  const [
    loadedAdmin,
    setLoadedAdmin,
  ] = useState(
    admin
  );

  const [
    loading,
    setLoading,
  ] = useState(
    false
  );

  const [
    savingProfile,
    setSavingProfile,
  ] = useState(
    false
  );

  const [
    savingPassword,
    setSavingPassword,
  ] = useState(
    false
  );

  const [
    error,
    setError,
  ] = useState(
    ""
  );

  const [
    success,
    setSuccess,
  ] = useState(
    ""
  );

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(
    false
  );

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(
    false
  );

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(
    false
  );

  const profileHasChanges =
    useMemo(() => {
      return (
        profileForm.fullName.trim() !==
          String(
            loadedAdmin.fullName ||
            ""
          ).trim() ||
        profileForm.email
          .trim()
          .toLowerCase() !==
          String(
            loadedAdmin.email ||
            ""
          )
            .trim()
            .toLowerCase() ||
        profileForm.phone.trim() !==
          String(
            loadedAdmin.phone ||
            ""
          ).trim()
      );
    }, [
      profileForm,
      loadedAdmin,
    ]);

  const passwordStrength =
    useMemo(
      () =>
        getPasswordStrength(
          passwordForm.newPassword
        ),
      [
        passwordForm.newPassword,
      ]
    );

  const canSaveProfile =
    profileHasChanges &&
    profileForm.fullName.trim()
      .length > 0 &&
    isValidEmail(
      profileForm.email
    ) &&
    profileForm.reason.trim()
      .length > 0 &&
    !savingProfile;

  const canSavePassword =
    passwordForm.currentPassword
      .length > 0 &&
    passwordForm.newPassword
      .length >= 10 &&
    passwordStrength.valid &&
    passwordForm.confirmPassword ===
      passwordForm.newPassword &&
    passwordForm.reason.trim()
      .length > 0 &&
    !savingPassword;

  const loadProfile =
    useCallback(
      async () => {
        if (
          loading
        ) {
          return;
        }

        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          setSuccess(
            ""
          );

          const result =
            await getCurrentAdminProfile();

          if (
            !result.admin
          ) {
            throw new Error(
              "Current administrator profile was not returned."
            );
          }

          setLoadedAdmin(
            result.admin
          );

          setProfileForm({
            fullName:
              result.admin.fullName ||
              "",
            email:
              result.admin.email ||
              "",
            phone:
              result.admin.phone ||
              "",
            reason:
              "",
          });

          updateCurrentAdmin(
            result.admin
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load administrator profile."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        loading,
        updateCurrentAdmin,
      ]
    );

  useEffect(() => {
    void loadProfile();
    // Load once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeTab(
    tab: ProfileTab
  ) {
    setError(
      ""
    );

    setSuccess(
      ""
    );

    router.replace(
      tab ===
        "security"
        ? "/admin/profile?tab=security"
        : "/admin/profile"
    );
  }

  async function handleSaveProfile() {
    if (
      !profileHasChanges
    ) {
      setError(
        "No profile changes detected."
      );

      return;
    }

    if (
      !profileForm.fullName.trim()
    ) {
      setError(
        "Full name is required."
      );

      return;
    }

    if (
      !isValidEmail(
        profileForm.email
      )
    ) {
      setError(
        "Enter a valid email address."
      );

      return;
    }

    if (
      !profileForm.reason.trim()
    ) {
      setError(
        "Change reason is required."
      );

      return;
    }

    try {
      setSavingProfile(
        true
      );

      setError(
        ""
      );

      setSuccess(
        ""
      );

      const result =
        await updateCurrentAdminProfile({
          fullName:
            profileForm.fullName.trim(),

          email:
            profileForm.email
              .trim()
              .toLowerCase(),

          phone:
            profileForm.phone.trim(),

          reason:
            profileForm.reason.trim(),
        });

      if (
        !result.admin
      ) {
        throw new Error(
          "Updated administrator profile was not returned."
        );
      }

      setLoadedAdmin(
        result.admin
      );

      setProfileForm({
        fullName:
          result.admin.fullName ||
          "",
        email:
          result.admin.email ||
          "",
        phone:
          result.admin.phone ||
          "",
        reason:
          "",
      });

      updateCurrentAdmin(
        result.admin
      );

      setSuccess(
        result.message ||
          "Administrator profile updated successfully."
      );

      await refreshSession();
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to update administrator profile."
      );
    } finally {
      setSavingProfile(
        false
      );
    }
  }

  async function handleSavePassword() {
    if (
      !passwordForm.currentPassword
    ) {
      setError(
        "Current password is required."
      );

      return;
    }

    if (
      passwordForm.newPassword.length <
      10
    ) {
      setError(
        "New password must contain at least 10 characters."
      );

      return;
    }

    if (
      !passwordStrength.valid
    ) {
      setError(
        "New password must contain uppercase, lowercase, number and special character."
      );

      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setError(
        "New password and confirmation do not match."
      );

      return;
    }

    if (
      passwordForm.currentPassword ===
      passwordForm.newPassword
    ) {
      setError(
        "New password must be different from the current password."
      );

      return;
    }

    if (
      !passwordForm.reason.trim()
    ) {
      setError(
        "Change reason is required."
      );

      return;
    }

    try {
      setSavingPassword(
        true
      );

      setError(
        ""
      );

      setSuccess(
        ""
      );

      const result =
        await updateCurrentAdminPassword({
          currentPassword:
            passwordForm.currentPassword,

          newPassword:
            passwordForm.newPassword,

          reason:
            passwordForm.reason.trim(),
        });

      setPasswordForm({
        currentPassword:
          "",
        newPassword:
          "",
        confirmPassword:
          "",
        reason:
          "",
      });

      setShowCurrentPassword(
        false
      );

      setShowNewPassword(
        false
      );

      setShowConfirmPassword(
        false
      );

      setSuccess(
        result.message ||
          "Administrator password updated successfully."
      );
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to update administrator password."
      );
    } finally {
      setSavingPassword(
        false
      );
    }
  }

  function resetProfileForm() {
    setProfileForm({
      fullName:
        loadedAdmin.fullName ||
        "",
      email:
        loadedAdmin.email ||
        "",
      phone:
        loadedAdmin.phone ||
        "",
      reason:
        "",
    });

    setError(
      ""
    );

    setSuccess(
      ""
    );
  }

  function resetPasswordForm() {
    setPasswordForm({
      currentPassword:
        "",
      newPassword:
        "",
      confirmPassword:
        "",
      reason:
        "",
    });

    setShowCurrentPassword(
      false
    );

    setShowNewPassword(
      false
    );

    setShowConfirmPassword(
      false
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Admin Account
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Admin Profile
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
            Manage your administrator profile and security credentials.
          </p>
        </div>

        <button
          type="button"
          disabled={
            loading ||
            savingProfile ||
            savingPassword
          }
          onClick={() => {
            void loadProfile();
          }}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.035] px-5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.065] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={[
              "h-4 w-4",
              loading
                ? "animate-spin"
                : "",
            ].join(" ")}
          />

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      <div className="mt-7 inline-flex rounded-2xl border border-white/[0.08] bg-slate-900/60 p-1.5">
        <button
          type="button"
          onClick={() =>
            changeTab(
              "profile"
            )
          }
          className={[
            "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
            activeTab ===
            "profile"
              ? "bg-emerald-400 text-slate-950"
              : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
          ].join(" ")}
        >
          <UserRound className="h-4 w-4" />
          Profile
        </button>

        <button
          type="button"
          onClick={() =>
            changeTab(
              "security"
            )
          }
          className={[
            "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
            activeTab ===
            "security"
              ? "bg-emerald-400 text-slate-950"
              : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
          ].join(" ")}
        >
          <LockKeyhole className="h-4 w-4" />
          Security
        </button>
      </div>

      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            {error}
          </span>
        </div>
      ) : null}

      {success ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            {success}
          </span>
        </div>
      ) : null}

      <div className="mt-7 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ProfileSidebar
          admin={
            loadedAdmin
          }
          expiresAt={
            expiresAt
          }
          permissions={
            permissions
          }
        />

        {activeTab ===
        "profile" ? (
          <ProfilePanel
            form={
              profileForm
            }
            admin={
              loadedAdmin
            }
            loading={
              loading
            }
            saving={
              savingProfile
            }
            hasChanges={
              profileHasChanges
            }
            canSave={
              canSaveProfile
            }
            onChange={
              setProfileForm
            }
            onReset={
              resetProfileForm
            }
            onSave={
              handleSaveProfile
            }
          />
        ) : (
          <SecurityPanel
            form={
              passwordForm
            }
            saving={
              savingPassword
            }
            strength={
              passwordStrength
            }
            showCurrentPassword={
              showCurrentPassword
            }
            showNewPassword={
              showNewPassword
            }
            showConfirmPassword={
              showConfirmPassword
            }
            canSave={
              canSavePassword
            }
            onChange={
              setPasswordForm
            }
            onToggleCurrent={() =>
              setShowCurrentPassword(
                (
                  current
                ) =>
                  !current
              )
            }
            onToggleNew={() =>
              setShowNewPassword(
                (
                  current
                ) =>
                  !current
              )
            }
            onToggleConfirm={() =>
              setShowConfirmPassword(
                (
                  current
                ) =>
                  !current
              )
            }
            onReset={
              resetPasswordForm
            }
            onSave={
              handleSavePassword
            }
          />
        )}
      </div>
    </div>
  );
}

function ProfileSidebar({
  admin,
  expiresAt,
  permissions,
}: {
  admin: {
    adminId: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    lastLoginAt?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  expiresAt: string;
  permissions: string[];
}) {
  return (
    <aside className="space-y-6">
      <section className="rounded-3xl border border-white/[0.08] bg-slate-900/65 p-6 shadow-xl shadow-black/10">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/10 text-xl font-bold uppercase text-emerald-300">
            {getInitials(
              admin.fullName
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xl font-bold text-white">
              {admin.fullName}
            </p>

            <p className="mt-1 truncate text-sm text-slate-500">
              {admin.email}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge
            text={formatRole(
              admin.role
            )}
            tone="cyan"
          />

          <Badge
            text={
              admin.status ||
              "UNKNOWN"
            }
            tone={
              String(
                admin.status
              ).toUpperCase() ===
              "ACTIVE"
                ? "emerald"
                : "slate"
            }
          />
        </div>

        <div className="mt-6 space-y-4 border-t border-white/[0.07] pt-5">
          <DetailLine
            icon={
              IdCard
            }
            label="Administrator ID"
            value={
              admin.adminId ||
              "—"
            }
          />

          <DetailLine
            icon={
              Clock3
            }
            label="Last Login"
            value={formatDateTime(
              admin.lastLoginAt
            )}
          />

          <DetailLine
            icon={
              CalendarDays
            }
            label="Created"
            value={formatDateTime(
              admin.createdAt
            )}
          />

          <DetailLine
            icon={
              CalendarDays
            }
            label="Updated"
            value={formatDateTime(
              admin.updatedAt
            )}
          />

          <DetailLine
            icon={
              ShieldCheck
            }
            label="Session Expires"
            value={formatDateTime(
              expiresAt
            )}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-slate-900/65 p-6">
        <p className="text-sm font-semibold text-white">
          Access Summary
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your effective permissions are controlled from Admin Users.
        </p>

        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-slate-950/45 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-600">
            Effective Permissions
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {permissions.includes(
              "*"
            )
              ? "Full Access"
              : `${permissions.length} permission(s)`}
          </p>
        </div>
      </section>
    </aside>
  );
}

function ProfilePanel({
  form,
  admin,
  loading,
  saving,
  hasChanges,
  canSave,
  onChange,
  onReset,
  onSave,
}: {
  form: ProfileForm;
  admin: {
    role: string;
    status: string;
  };
  loading: boolean;
  saving: boolean;
  hasChanges: boolean;
  canSave: boolean;
  onChange:
    React.Dispatch<
      React.SetStateAction<ProfileForm>
    >;
  onReset: () => void;
  onSave: () => Promise<void>;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/65 shadow-xl shadow-black/10">
      <div className="border-b border-white/[0.07] px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
            <UserRound className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Changes are recorded in the administrator audit log.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
        <Field
          label="Full Name"
          icon={
            UserRound
          }
        >
          <input
            type="text"
            value={
              form.fullName
            }
            onChange={(
              event
            ) =>
              onChange(
                (
                  current
                ) => ({
                  ...current,
                  fullName:
                    event.target.value,
                })
              )
            }
            disabled={
              loading ||
              saving
            }
            className={inputClassName()}
            placeholder="Administrator full name"
          />
        </Field>

        <Field
          label="Email Address"
          icon={
            Mail
          }
        >
          <input
            type="email"
            value={
              form.email
            }
            onChange={(
              event
            ) =>
              onChange(
                (
                  current
                ) => ({
                  ...current,
                  email:
                    event.target.value,
                })
              )
            }
            disabled={
              loading ||
              saving
            }
            className={inputClassName()}
            placeholder="administrator@example.com"
          />
        </Field>

        <Field
          label="Phone"
          icon={
            Phone
          }
        >
          <input
            type="tel"
            value={
              form.phone
            }
            onChange={(
              event
            ) =>
              onChange(
                (
                  current
                ) => ({
                  ...current,
                  phone:
                    event.target.value,
                })
              )
            }
            disabled={
              loading ||
              saving
            }
            className={inputClassName()}
            placeholder="Example: 0122231261"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <ReadOnlyField
            label="Role"
            value={formatRole(
              admin.role
            )}
          />

          <ReadOnlyField
            label="Status"
            value={
              admin.status ||
              "—"
            }
          />
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Change Reason
          </label>

          <textarea
            value={
              form.reason
            }
            onChange={(
              event
            ) =>
              onChange(
                (
                  current
                ) => ({
                  ...current,
                  reason:
                    event.target.value,
                })
              )
            }
            disabled={
              loading ||
              saving
            }
            maxLength={
              500
            }
            rows={
              3
            }
            placeholder="Example: Update administrator contact information."
            className="mt-2 w-full resize-none rounded-2xl border border-white/[0.09] bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/5 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="mt-2 flex justify-between text-xs text-slate-600">
            <span>
              Required for audit logging.
            </span>

            <span>
              {form.reason.length}/500
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />

          <div>
            <p className="text-xs font-medium text-slate-300">
              {hasChanges
                ? "Unsaved profile changes detected."
                : "Profile information is up to date."}
            </p>

            <p className="mt-1 text-[11px] text-slate-600">
              Changes are recorded in the administrator audit log.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={
              !hasChanges ||
              saving
            }
            onClick={
              onReset
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.09] px-5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.055] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Discard Changes
          </button>

          <button
            type="button"
            disabled={
              !canSave
            }
            onClick={() => {
              void onSave();
            }}
            className="inline-flex h-11 min-w-40 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving
              ? "Saving..."
              : "Save Profile"}
          </button>
        </div>
      </div>
    </section>
  );
}

function SecurityPanel({
  form,
  saving,
  strength,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  canSave,
  onChange,
  onToggleCurrent,
  onToggleNew,
  onToggleConfirm,
  onReset,
  onSave,
}: {
  form: PasswordForm;
  saving: boolean;
  strength: PasswordStrength;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  canSave: boolean;
  onChange:
    React.Dispatch<
      React.SetStateAction<PasswordForm>
    >;
  onToggleCurrent: () => void;
  onToggleNew: () => void;
  onToggleConfirm: () => void;
  onReset: () => void;
  onSave: () => Promise<void>;
}) {
  const hasPasswordInput =
    form.currentPassword.length >
      0 ||
    form.newPassword.length >
      0 ||
    form.confirmPassword.length >
      0 ||
    form.reason.trim().length >
      0;

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/65 shadow-xl shadow-black/10">
      <div className="border-b border-white/[0.07] px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
            <LockKeyhole className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Password & Security
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Changing your password signs out your other active devices.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.07] px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />

            <div>
              <p className="text-sm font-semibold text-amber-200">
                Security requirement
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-100/65">
                Use at least 10 characters with uppercase, lowercase, number and special character.
              </p>
            </div>
          </div>
        </div>

        <PasswordField
          label="Current Password"
          value={
            form.currentPassword
          }
          visible={
            showCurrentPassword
          }
          disabled={
            saving
          }
          placeholder="Enter your current password"
          onToggle={
            onToggleCurrent
          }
          onChange={(
            value
          ) =>
            onChange(
              (
                current
              ) => ({
                ...current,
                currentPassword:
                  value,
              })
            )
          }
        />

        <PasswordField
          label="New Password"
          value={
            form.newPassword
          }
          visible={
            showNewPassword
          }
          disabled={
            saving
          }
          placeholder="Create a strong new password"
          onToggle={
            onToggleNew
          }
          onChange={(
            value
          ) =>
            onChange(
              (
                current
              ) => ({
                ...current,
                newPassword:
                  value,
              })
            )
          }
        />

        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Password Strength
            </p>

            <p
              className={[
                "text-xs font-semibold",
                strength.tone,
              ].join(" ")}
            >
              {strength.label}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              1,
              2,
              3,
              4,
            ].map(
              (
                level
              ) => (
                <div
                  key={
                    level
                  }
                  className={[
                    "h-2 rounded-full",
                    level <=
                    strength.level
                      ? strength.bar
                      : "bg-white/[0.07]",
                  ].join(" ")}
                />
              )
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Requirement
              met={
                form.newPassword.length >=
                10
              }
              label="At least 10 characters"
            />

            <Requirement
              met={
                /[A-Z]/.test(
                  form.newPassword
                )
              }
              label="Uppercase letter"
            />

            <Requirement
              met={
                /[a-z]/.test(
                  form.newPassword
                )
              }
              label="Lowercase letter"
            />

            <Requirement
              met={
                /\d/.test(
                  form.newPassword
                )
              }
              label="Number"
            />

            <Requirement
              met={
                /[^A-Za-z0-9]/.test(
                  form.newPassword
                )
              }
              label="Special character"
            />
          </div>
        </div>

        <PasswordField
          label="Confirm New Password"
          value={
            form.confirmPassword
          }
          visible={
            showConfirmPassword
          }
          disabled={
            saving
          }
          placeholder="Re-enter your new password"
          onToggle={
            onToggleConfirm
          }
          onChange={(
            value
          ) =>
            onChange(
              (
                current
              ) => ({
                ...current,
                confirmPassword:
                  value,
              })
            )
          }
        />

        {form.confirmPassword &&
        form.confirmPassword !==
          form.newPassword ? (
          <p className="text-xs font-medium text-rose-300">
            Password confirmation does not match.
          </p>
        ) : null}

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Change Reason
          </label>

          <textarea
            value={
              form.reason
            }
            onChange={(
              event
            ) =>
              onChange(
                (
                  current
                ) => ({
                  ...current,
                  reason:
                    event.target.value,
                })
              )
            }
            disabled={
              saving
            }
            maxLength={
              500
            }
            rows={
              3
            }
            placeholder="Example: Routine administrator security update."
            className="mt-2 w-full resize-none rounded-2xl border border-white/[0.09] bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/5 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="mt-2 flex justify-between text-xs text-slate-600">
            <span>
              Required for audit logging.
            </span>

            <span>
              {form.reason.length}/500
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-start gap-2">
          <KeyRound className="mt-0.5 h-4 w-4 text-emerald-300" />

          <div>
            <p className="text-xs font-medium text-slate-300">
              Your current device remains signed in.
            </p>

            <p className="mt-1 text-[11px] text-slate-600">
              Other active administrator sessions will be revoked.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={
              !hasPasswordInput ||
              saving
            }
            onClick={
              onReset
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.09] px-5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.055] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </button>

          <button
            type="button"
            disabled={
              !canSave
            }
            onClick={() => {
              void onSave();
            }}
            className="inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}

            {saving
              ? "Updating..."
              : "Change Password"}
          </button>
        </div>
      </div>
    </section>
  );
}

function PasswordField({
  label,
  value,
  visible,
  disabled,
  placeholder,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  visible: boolean;
  disabled: boolean;
  placeholder: string;
  onToggle: () => void;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          type={
            visible
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
          disabled={
            disabled
          }
          autoComplete="off"
          placeholder={
            placeholder
          }
          className={`${inputClassName()} pr-12`}
        />

        <button
          type="button"
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
          onClick={
            onToggle
          }
          disabled={
            disabled
          }
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function Requirement({
  met,
  label,
}: {
  met: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={[
          "flex h-5 w-5 items-center justify-center rounded-full border",
          met
            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
            : "border-white/[0.08] bg-white/[0.03] text-slate-700",
        ].join(" ")}
      >
        <CheckCircle2 className="h-3 w-3" />
      </div>

      <span
        className={
          met
            ? "text-slate-300"
            : "text-slate-600"
        }
      >
        {label}
      </span>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof UserRound;
  children:
    React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </label>

      <div className="mt-2">
        {children}
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>

      <div className="mt-2 flex h-12 items-center rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 text-sm font-semibold text-slate-400">
        {value}
      </div>
    </div>
  );
}

function DetailLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IdCard;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-slate-500">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-slate-300">
          {value}
        </p>
      </div>
    </div>
  );
}

function Badge({
  text,
  tone,
}: {
  text: string;
  tone:
    | "emerald"
    | "cyan"
    | "slate";
}) {
  const classes = {
    emerald:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",

    cyan:
      "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",

    slate:
      "border-white/[0.08] bg-white/[0.04] text-slate-400",
  };

  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${classes[tone]}`}
    >
      {text}
    </span>
  );
}

type PasswordStrength = {
  valid: boolean;
  level: number;
  label: string;
  tone: string;
  bar: string;
};

function getPasswordStrength(
  password: string
): PasswordStrength {
  if (
    !password
  ) {
    return {
      valid:
        false,
      level:
        0,
      label:
        "Not entered",
      tone:
        "text-slate-600",
      bar:
        "bg-slate-700",
    };
  }

  let score =
    0;

  if (
    password.length >=
    10
  ) {
    score++;
  }

  if (
    /[A-Z]/.test(
      password
    ) &&
    /[a-z]/.test(
      password
    )
  ) {
    score++;
  }

  if (
    /\d/.test(
      password
    )
  ) {
    score++;
  }

  if (
    /[^A-Za-z0-9]/.test(
      password
    )
  ) {
    score++;
  }

  const valid =
    password.length >=
      10 &&
    /[A-Z]/.test(
      password
    ) &&
    /[a-z]/.test(
      password
    ) &&
    /\d/.test(
      password
    ) &&
    /[^A-Za-z0-9]/.test(
      password
    );

  if (
    score <=
    1
  ) {
    return {
      valid,
      level:
        1,
      label:
        "Weak",
      tone:
        "text-rose-300",
      bar:
        "bg-rose-400",
    };
  }

  if (
    score ===
    2
  ) {
    return {
      valid,
      level:
        2,
      label:
        "Fair",
      tone:
        "text-amber-300",
      bar:
        "bg-amber-400",
    };
  }

  if (
    score ===
    3
  ) {
    return {
      valid,
      level:
        3,
      label:
        "Good",
      tone:
        "text-cyan-300",
      bar:
        "bg-cyan-400",
    };
  }

  return {
    valid,
    level:
      4,
    label:
      "Strong",
    tone:
      "text-emerald-300",
    bar:
      "bg-emerald-400",
  };
}

function inputClassName() {
  return "h-12 w-full rounded-2xl border border-white/[0.09] bg-slate-950/55 px-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/5 disabled:cursor-not-allowed disabled:opacity-60";
}

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

function getInitials(
  fullName: string
) {
  const parts =
    String(
      fullName ||
      ""
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length ===
    0
  ) {
    return "AD";
  }

  return parts
    .slice(
      0,
      2
    )
    .map(
      (
        part
      ) =>
        part.charAt(
          0
        )
    )
    .join("")
    .toUpperCase();
}

function formatRole(
  role: string
) {
  return String(
    role || ""
  )
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (
        part
      ) =>
        part
          .charAt(
            0
          )
          .toUpperCase() +
        part.slice(
          1
        )
    )
    .join(" ");
}

function formatDateTime(
  value?: string
) {
  if (
    !value
  ) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone:
        "Asia/Kuala_Lumpur",

      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        true,
    }
  ).format(
    date
  );
}