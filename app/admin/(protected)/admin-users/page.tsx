"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  KeyRound,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldCog,
  UserCog,
  UserRoundCheck,
  UserRoundX,
  Users,
  X,
} from "lucide-react";

import AdminPermissionEditor from "@/components/admin/AdminPermissionEditor";
import {
  ADMIN_ROLES,
  type AdminUser,
  type AdminUserDetail,
  type PermissionCatalogResult,
  createAdminUser,
  formatAdminDate,
  formatAdminRole,
  getAdminUserDetail,
  getAdminUserPermissionCatalog,
  getAdminUsers,
  resetAdminUserPassword,
  resetAdminUserPermissions,
  revokeAdminUserSessions,
  updateAdminUser,
  updateAdminUserPermissions,
  updateAdminUserStatus,
} from "@/lib/admin-users";

const EMPTY_CREATE_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  role: "VIEWER",
  status: "ACTIVE",
  reason: "",
};

type Mode =
  | "edit"
  | "password"
  | "status"
  | "sessions"
  | null;

export default function AdminUsersPage() {
  const [
    admins,
    setAdmins,
  ] = useState<AdminUser[]>([]);

  const [
    selected,
    setSelected,
  ] =
    useState<AdminUserDetail | null>(
      null
    );

  const [
    permissionCatalog,
    setPermissionCatalog,
  ] =
    useState<PermissionCatalogResult | null>(
      null
    );

  const [search, setSearch] =
    useState("");

  const [role, setRole] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    permissionLoading,
    setPermissionLoading,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    feedback,
    setFeedback,
  ] = useState("");

  const [success, setSuccess] =
    useState("");

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    permissionOpen,
    setPermissionOpen,
  ] = useState(false);

  const [
    createForm,
    setCreateForm,
  ] = useState(
    EMPTY_CREATE_FORM
  );

  const [mode, setMode] =
    useState<Mode>(null);

  const [reason, setReason] =
    useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    nextStatus,
    setNextStatus,
  ] = useState("INACTIVE");

  const [edit, setEdit] =
    useState({
      fullName: "",
      email: "",
      phone: "",
      role: "",
    });

  const load =
    useCallback(async () => {
      try {
        setLoading(true);
        setFeedback("");

        const result =
          await getAdminUsers({
            search,
            role,
            status,
            limit: 100,
          });

        setAdmins(
          Array.isArray(
            result.admins
          )
            ? result.admins
            : []
        );
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "Unable to load administrators."
        );
      } finally {
        setLoading(false);
      }
    }, [
      search,
      role,
      status,
    ]);

  useEffect(() => {
    const timer =
      setTimeout(
        () => void load(),
        350
      );

    return () =>
      clearTimeout(timer);
  }, [load]);

  const summary =
    useMemo(
      () => ({
        total:
          admins.length,
        active:
          admins.filter(
            (admin) =>
              admin.status ===
              "ACTIVE"
          ).length,
        inactive:
          admins.filter(
            (admin) =>
              admin.status ===
              "INACTIVE"
          ).length,
        locked:
          admins.filter(
            (admin) =>
              admin.status ===
              "LOCKED"
          ).length,
      }),
      [admins]
    );

  async function openDetail(
    adminId: string
  ) {
    try {
      setFeedback("");

      const detail =
        await getAdminUserDetail(
          adminId
        );

      setSelected(detail);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to load administrator."
      );
    }
  }

  async function openPermissions() {
    if (!selected) {
      return;
    }

    if (
      selected.admin.role ===
      "SUPER_ADMIN"
    ) {
      setFeedback(
        "Super Admin permissions are fixed and cannot be reduced."
      );
      return;
    }

    try {
      setPermissionLoading(true);
      setFeedback("");

      if (!permissionCatalog) {
        const catalog =
          await getAdminUserPermissionCatalog();

        setPermissionCatalog(
          catalog
        );
      }

      setPermissionOpen(true);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to load permission catalog."
      );
    } finally {
      setPermissionLoading(false);
    }
  }

  function startEdit() {
    if (!selected) {
      return;
    }

    setEdit({
      fullName:
        selected.admin.fullName,
      email:
        selected.admin.email,
      phone:
        selected.admin.phone,
      role:
        selected.admin.role,
    });

    setReason("");
    setMode("edit");
  }

  async function create(
    event: FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setFeedback("");
      setSuccess("");

      const result =
        await createAdminUser(
          createForm
        );

      setSuccess(
        result.message
      );

      setCreateOpen(false);
      setCreateForm(
        EMPTY_CREATE_FORM
      );

      await load();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to create administrator."
      );
    } finally {
      setSaving(false);
    }
  }

  async function act(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !selected ||
      !mode
    ) {
      return;
    }

    try {
      setSaving(true);
      setFeedback("");
      setSuccess("");

      let message = "";

      if (
        mode === "edit"
      ) {
        message =
          (
            await updateAdminUser({
              adminId:
                selected.admin
                  .adminId,
              ...edit,
              reason,
            })
          ).message;
      }

      if (
        mode ===
        "password"
      ) {
        const result =
          await resetAdminUserPassword(
            {
              adminId:
                selected.admin
                  .adminId,
              newPassword,
              reason,
            }
          );

        message =
          `${result.message}. ` +
          `${result.revokedSessions} session(s) revoked.`;
      }

      if (
        mode === "status"
      ) {
        message =
          (
            await updateAdminUserStatus(
              {
                adminId:
                  selected.admin
                    .adminId,
                status:
                  nextStatus,
                reason,
              }
            )
          ).message;
      }

      if (
        mode ===
        "sessions"
      ) {
        const result =
          await revokeAdminUserSessions(
            {
              adminId:
                selected.admin
                  .adminId,
              reason,
            }
          );

        message =
          `${result.message}. ` +
          `${result.revokedSessions} session(s) revoked.`;
      }

      setSuccess(message);
      setMode(null);
      setReason("");
      setNewPassword("");

      await load();

      await openDetail(
        selected.admin.adminId
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to update administrator."
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePermissions(
    payload: {
      adminId: string;
      permissions: string[];
      reason: string;
    }
  ) {
    try {
      setSaving(true);
      setFeedback("");
      setSuccess("");

      const result =
        await updateAdminUserPermissions(
          payload
        );

      setSuccess(
        result.message ||
          "Administrator permissions updated successfully."
      );

      setPermissionOpen(false);

      await load();

      await openDetail(
        payload.adminId
      );
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function resetPermissions(
    payload: {
      adminId: string;
      reason: string;
    }
  ) {
    try {
      setSaving(true);
      setFeedback("");
      setSuccess("");

      const result =
        await resetAdminUserPermissions(
          payload
        );

      setSuccess(
        result.message ||
          "Administrator permissions reset to role default."
      );

      setPermissionOpen(false);

      await load();

      await openDetail(
        payload.adminId
      );
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  }

  const roleDefaults =
    selected
      ? permissionCatalog
          ?.roleDefaults?.[
          selected.admin.role
        ] ||
        selected.roleDefaultPermissions ||
        []
      : [];

  return (
    <main className="min-h-full bg-slate-950 px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Administration
            </div>

            <h1 className="mt-3 text-4xl font-black">
              Admin Users
            </h1>

            <p className="mt-2 text-slate-400">
              Manage administrator accounts, roles, security status and permissions.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void load()
              }
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 px-5 font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() =>
                setCreateOpen(
                  true
                )
              }
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-5 font-black text-slate-950"
            >
              <Plus className="h-4 w-4" />
              New Administrator
            </button>
          </div>
        </header>

        {feedback ? (
          <Message
            error
            text={feedback}
          />
        ) : null}

        {success ? (
          <Message
            text={success}
          />
        ) : null}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Summary
            label="Total Admins"
            value={summary.total}
            icon={Users}
          />

          <Summary
            label="Active"
            value={summary.active}
            icon={
              UserRoundCheck
            }
          />

          <Summary
            label="Inactive"
            value={summary.inactive}
            icon={UserRoundX}
          />

          <Summary
            label="Locked"
            value={summary.locked}
            icon={LockKeyhole}
          />
        </section>

        <section className="mt-6 grid gap-3 rounded-3xl border border-white/[0.08] bg-slate-900/60 p-5 lg:grid-cols-[1fr_250px_250px]">
          <label className="relative">
            <Search className="absolute left-4 top-4 h-4 w-4 text-slate-600" />

            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search ID, name, email or phone"
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950 pl-11 pr-4 outline-none"
            />
          </label>

          <select
            value={role}
            onChange={(
              event
            ) =>
              setRole(
                event.target
                  .value
              )
            }
            className="h-12 rounded-2xl border border-white/10 bg-slate-950 px-4"
          >
            <option value="">
              All roles
            </option>

            {ADMIN_ROLES.map(
              (adminRole) => (
                <option
                  key={
                    adminRole
                  }
                  value={
                    adminRole
                  }
                >
                  {formatAdminRole(
                    adminRole
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={status}
            onChange={(
              event
            ) =>
              setStatus(
                event.target
                  .value
              )
            }
            className="h-12 rounded-2xl border border-white/10 bg-slate-950 px-4"
          >
            <option value="">
              All statuses
            </option>
            <option value="ACTIVE">
              Active
            </option>
            <option value="INACTIVE">
              Inactive
            </option>
            <option value="LOCKED">
              Locked
            </option>
          </select>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/60">
          <div className="p-6">
            <h2 className="text-lg font-black">
              Administrator Directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {admins.length} administrator(s)
            </p>
          </div>

          <div className="overflow-x-auto border-t border-white/[0.06]">
            <table className="min-w-full">
              <thead className="bg-slate-950/40 text-left text-[10px] uppercase tracking-[0.16em] text-slate-600">
                <tr>
                  <th className="px-6 py-4">
                    Administrator
                  </th>
                  <th className="px-5 py-4">
                    Role
                  </th>
                  <th className="px-5 py-4">
                    Status
                  </th>
                  <th className="px-5 py-4">
                    Last Login
                  </th>
                  <th className="px-5 py-4">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">
                {admins.map(
                  (admin) => (
                    <tr
                      key={
                        admin.adminId
                      }
                      className="hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={
                              admin.fullName
                            }
                          />

                          <div>
                            <p className="font-bold">
                              {
                                admin.fullName
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                admin.adminId
                              }{" "}
                              ·{" "}
                              {
                                admin.email
                              }
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {formatAdminRole(
                          admin.role
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            admin.status
                          }
                        />
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {formatAdminDate(
                          admin.lastLoginAt
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {formatAdminDate(
                          admin.createdAt
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            void openDetail(
                              admin.adminId
                            )
                          }
                          className="h-10 rounded-xl border border-white/10 px-4 text-sm font-bold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {loading ? (
              <Empty>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading administrators...
              </Empty>
            ) : admins.length ===
              0 ? (
              <Empty>
                No administrators found.
              </Empty>
            ) : null}
          </div>
        </section>
      </div>

      {selected ? (
        <AdminDetailDrawer
          detail={selected}
          permissionLoading={
            permissionLoading
          }
          onClose={() =>
            setSelected(null)
          }
          onEdit={
            startEdit
          }
          onEditPermissions={() =>
            void openPermissions()
          }
          onPassword={() => {
            setReason("");
            setNewPassword(
              ""
            );
            setMode(
              "password"
            );
          }}
          onStatus={() => {
            setNextStatus(
              selected.admin
                .status ===
                "ACTIVE"
                ? "INACTIVE"
                : "ACTIVE"
            );
            setReason("");
            setMode(
              "status"
            );
          }}
          onSessions={() => {
            setReason("");
            setMode(
              "sessions"
            );
          }}
        />
      ) : null}

      {createOpen ? (
        <Modal
          title="New Administrator"
          onClose={() =>
            setCreateOpen(
              false
            )
          }
        >
          <form
            onSubmit={create}
            className="space-y-4"
          >
            <Field
              label="Full Name"
              value={
                createForm.fullName
              }
              onChange={(
                value
              ) =>
                setCreateForm({
                  ...createForm,
                  fullName:
                    value,
                })
              }
            />

            <Field
              label="Email"
              type="email"
              value={
                createForm.email
              }
              onChange={(
                value
              ) =>
                setCreateForm({
                  ...createForm,
                  email:
                    value,
                })
              }
            />

            <Field
              label="Phone"
              value={
                createForm.phone
              }
              onChange={(
                value
              ) =>
                setCreateForm({
                  ...createForm,
                  phone:
                    value,
                })
              }
            />

            <Field
              label="Temporary Password"
              type="password"
              value={
                createForm.password
              }
              onChange={(
                value
              ) =>
                setCreateForm({
                  ...createForm,
                  password:
                    value,
                })
              }
            />

            <SelectField
              label="Role"
              value={
                createForm.role
              }
              onChange={(
                value
              ) =>
                setCreateForm({
                  ...createForm,
                  role:
                    value,
                })
              }
              options={ADMIN_ROLES.map(
                (
                  adminRole
                ) => [
                  adminRole,
                  formatAdminRole(
                    adminRole
                  ),
                ]
              )}
            />

            <SelectField
              label="Status"
              value={
                createForm.status
              }
              onChange={(
                value
              ) =>
                setCreateForm({
                  ...createForm,
                  status:
                    value,
                })
              }
              options={[
                [
                  "ACTIVE",
                  "Active",
                ],
                [
                  "INACTIVE",
                  "Inactive",
                ],
              ]}
            />

            <TextArea
              label="Reason"
              value={
                createForm.reason
              }
              onChange={(
                value
              ) =>
                setCreateForm({
                  ...createForm,
                  reason:
                    value,
                })
              }
            />

            <SubmitButton
              saving={saving}
              text="Create Administrator"
            />
          </form>
        </Modal>
      ) : null}

      {selected &&
      mode ? (
        <Modal
          title={
            {
              edit:
                "Edit Administrator",
              password:
                "Reset Password",
              status:
                "Change Status",
              sessions:
                "Revoke Sessions",
            }[mode]
          }
          onClose={() =>
            setMode(null)
          }
        >
          <form
            onSubmit={act}
            className="space-y-4"
          >
            {mode ===
            "edit" ? (
              <>
                <Field
                  label="Full Name"
                  value={
                    edit.fullName
                  }
                  onChange={(
                    value
                  ) =>
                    setEdit({
                      ...edit,
                      fullName:
                        value,
                    })
                  }
                />

                <Field
                  label="Email"
                  type="email"
                  value={
                    edit.email
                  }
                  onChange={(
                    value
                  ) =>
                    setEdit({
                      ...edit,
                      email:
                        value,
                    })
                  }
                />

                <Field
                  label="Phone"
                  value={
                    edit.phone
                  }
                  onChange={(
                    value
                  ) =>
                    setEdit({
                      ...edit,
                      phone:
                        value,
                    })
                  }
                />

                <SelectField
                  label="Role"
                  value={
                    edit.role
                  }
                  onChange={(
                    value
                  ) =>
                    setEdit({
                      ...edit,
                      role:
                        value,
                    })
                  }
                  options={ADMIN_ROLES.map(
                    (
                      adminRole
                    ) => [
                      adminRole,
                      formatAdminRole(
                        adminRole
                      ),
                    ]
                  )}
                />
              </>
            ) : null}

            {mode ===
            "password" ? (
              <Field
                label="New Password"
                type="password"
                value={
                  newPassword
                }
                onChange={
                  setNewPassword
                }
              />
            ) : null}

            {mode ===
            "status" ? (
              <SelectField
                label="New Status"
                value={
                  nextStatus
                }
                onChange={
                  setNextStatus
                }
                options={[
                  [
                    "ACTIVE",
                    "Active",
                  ],
                  [
                    "INACTIVE",
                    "Inactive",
                  ],
                ]}
              />
            ) : null}

            {mode ===
            "sessions" ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
                This administrator will be signed out from every active device.
              </div>
            ) : null}

            <TextArea
              label="Reason"
              value={reason}
              onChange={
                setReason
              }
            />

            <SubmitButton
              saving={saving}
              text={
                mode ===
                "sessions"
                  ? "Revoke All Sessions"
                  : mode ===
                      "password"
                    ? "Reset Password"
                    : mode ===
                        "status"
                      ? "Update Status"
                      : "Save Changes"
              }
            />
          </form>
        </Modal>
      ) : null}

      {selected ? (
        <AdminPermissionEditor
          open={
            permissionOpen
          }
          adminId={
            selected.admin
              .adminId
          }
          adminName={
            selected.admin
              .fullName
          }
          role={
            selected.admin.role
          }
          permissions={
            selected.permissions ||
            []
          }
          roleDefaultPermissions={
            roleDefaults
          }
          loading={
            permissionLoading
          }
          saving={saving}
          onClose={() =>
            setPermissionOpen(
              false
            )
          }
          onSave={
            savePermissions
          }
          onResetToRoleDefault={
            resetPermissions
          }
        />
      ) : null}
    </main>
  );
}

function AdminDetailDrawer({
  detail,
  permissionLoading,
  onClose,
  onEdit,
  onEditPermissions,
  onPassword,
  onStatus,
  onSessions,
}: {
  detail: AdminUserDetail;
  permissionLoading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onEditPermissions: () => void;
  onPassword: () => void;
  onStatus: () => void;
  onSessions: () => void;
}) {
  const admin =
    detail.admin;

  const isSuperAdmin =
    admin.role ===
    "SUPER_ADMIN";

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        aria-label="Close administrator detail"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[760px] flex-col border-l border-white/[0.08] bg-slate-950">
        <header className="flex items-center justify-between border-b border-white/[0.08] p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
              Admin Security
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Administrator Detail
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {admin.adminId}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
          >
            <X />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <section className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6">
            <div className="flex items-center gap-4">
              <Avatar
                name={
                  admin.fullName
                }
                large
              />

              <div>
                <h3 className="text-2xl font-black">
                  {admin.fullName}
                </h3>

                <p className="mt-1 text-slate-500">
                  {admin.email}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge
                    status={
                      admin.status
                    }
                  />

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-300">
                    {formatAdminRole(
                      admin.role
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              [
                "Phone",
                admin.phone ||
                  "—",
              ],
              [
                "Last Login",
                formatAdminDate(
                  admin.lastLoginAt
                ),
              ],
              [
                "Created",
                formatAdminDate(
                  admin.createdAt
                ),
              ],
              [
                "Updated",
                formatAdminDate(
                  admin.updatedAt
                ),
              ],
              [
                "Failed Logins",
                String(
                  admin.failedLoginCount ||
                    0
                ),
              ],
              [
                "Locked Until",
                formatAdminDate(
                  admin.lockedUntil
                ),
              ],
            ].map(
              ([
                label,
                value,
              ]) => (
                <Info
                  key={label}
                  label={label}
                  value={value}
                />
              )
            )}
          </section>

          <section className="mt-5 rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6">
            <h3 className="font-black">
              Sessions
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(
                detail.sessions
              ).map(
                ([
                  key,
                  value,
                ]) => (
                  <Info
                    key={key}
                    label={key}
                    value={String(
                      value
                    )}
                  />
                )
              )}
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-black">
                  Permissions
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {isSuperAdmin
                    ? "Super Admin has permanent full access."
                    : detail.permissionSource ===
                        "CUSTOM"
                      ? "Custom permissions"
                      : "Role default permissions"}
                </p>
              </div>

              {!isSuperAdmin ? (
                <button
                  type="button"
                  disabled={
                    permissionLoading
                  }
                  onClick={
                    onEditPermissions
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 text-sm font-bold text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {permissionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCog className="h-4 w-4" />
                  )}

                  {permissionLoading
                    ? "Loading..."
                    : "Edit Permissions"}
                </button>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(detail.permissions ||
                []).map(
                (
                  permission
                ) => (
                  <span
                    key={
                      permission
                    }
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-slate-400"
                  >
                    {permission}
                  </span>
                )
              )}
            </div>
          </section>
        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-white/[0.08] p-6">
          <ActionButton
            icon={UserCog}
            text="Edit Administrator"
            onClick={onEdit}
          />

          <ActionButton
            icon={KeyRound}
            text="Reset Password"
            onClick={
              onPassword
            }
          />

          <ActionButton
            icon={Activity}
            text="Revoke Sessions"
            onClick={
              onSessions
            }
          />

          <ActionButton
            icon={
              admin.status ===
              "ACTIVE"
                ? UserRoundX
                : UserRoundCheck
            }
            text={
              admin.status ===
              "ACTIVE"
                ? "Deactivate"
                : "Activate"
            }
            onClick={
              onStatus
            }
          />
        </footer>
      </aside>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        aria-label="Close modal"
      />

      <section className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/[0.09] bg-slate-950">
        <header className="flex items-center justify-between border-b border-white/[0.08] p-6">
          <h2 className="text-xl font-black">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
          >
            <X />
          </button>
        </header>

        <div className="p-6">
          {children}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-slate-500">
        {label}
      </span>

      <input
        required
        type={type}
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 outline-none"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-slate-500">
        {label}
      </span>

      <textarea
        required
        rows={4}
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-white/10 bg-slate-900 p-4 outline-none"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options:
    readonly (
      readonly [
        string,
        string,
      ]
    )[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-slate-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-4"
      >
        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (
            <option
              key={
                optionValue
              }
              value={
                optionValue
              }
            >
              {optionLabel}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function SubmitButton({
  saving,
  text,
}: {
  saving: boolean;
  text: string;
}) {
  return (
    <button
      disabled={saving}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : null}

      {saving
        ? "Processing..."
        : text}
    </button>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon:
    React.ComponentType<{
      className?: string;
    }>;
}) {
  return (
    <article className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>
    </article>
  );
}

function Avatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
      )
      .join("")
      .toUpperCase() ||
    "AD";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 font-black text-emerald-300 ${
        large
          ? "h-16 w-16 text-xl"
          : "h-11 w-11 text-sm"
      }`}
    >
      {initials}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toUpperCase();

  const color =
    normalized ===
    "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized ===
          "LOCKED"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : "border-rose-400/20 bg-rose-400/10 text-rose-300";

  return (
    <span
      className={`inline-flex h-9 min-w-24 items-center justify-center rounded-full border px-4 text-xs font-black ${color}`}
    >
      {normalized}
    </span>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  text,
  onClick,
}: {
  icon:
    React.ComponentType<{
      className?: string;
    }>;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 font-black hover:bg-white/[0.05]"
    >
      <Icon className="h-4 w-4" />
      {text}
    </button>
  );
}

function Message({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return (
    <div
      className={`mt-5 rounded-2xl border px-5 py-4 text-sm ${
        error
          ? "border-rose-400/25 bg-rose-400/10 text-rose-200"
          : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
      }`}
    >
      {text}
    </div>
  );
}

function Empty({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-16 text-slate-500">
      {children}
    </div>
  );
}