"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PERMISSION_CATALOG,
  type PermissionGroup,
} from "@/lib/admin/permissionCatalog";

type AdminPermissionEditorProps = {
  open: boolean;
  adminId: string;
  adminName: string;
  role: string;
  permissions: string[];
  roleDefaultPermissions?: string[];
  loading?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: {
    adminId: string;
    permissions: string[];
    reason: string;
  }) => Promise<void> | void;
  onResetToRoleDefault?: (payload: {
    adminId: string;
    reason: string;
  }) => Promise<void> | void;
};

function uniquePermissions(
  permissions: string[]
) {
  return Array.from(
    new Set(
      permissions
        .map((permission) =>
          String(permission || "").trim()
        )
        .filter(Boolean)
    )
  ).sort();
}

function getAllPermissionKeys(
  catalog: PermissionGroup[]
) {
  return uniquePermissions(
    catalog.flatMap((group) =>
      group.permissions.map(
        (permission) =>
          permission.key
      )
    )
  );
}

function arraysEqual(
  first: string[],
  second: string[]
) {
  const a =
    uniquePermissions(first);
  const b =
    uniquePermissions(second);

  if (a.length !== b.length) {
    return false;
  }

  return a.every(
    (value, index) =>
      value === b[index]
  );
}

export default function AdminPermissionEditor({
  open,
  adminId,
  adminName,
  role,
  permissions,
  roleDefaultPermissions = [],
  loading = false,
  saving = false,
  onClose,
  onSave,
  onResetToRoleDefault,
}: AdminPermissionEditorProps) {
  const allPermissionKeys =
    useMemo(
      () =>
        getAllPermissionKeys(
          PERMISSION_CATALOG
        ),
      []
    );

  const [
    selectedPermissions,
    setSelectedPermissions,
  ] = useState<string[]>([]);

  const [
    expandedGroups,
    setExpandedGroups,
  ] = useState<
    Record<string, boolean>
  >({});

  const [search, setSearch] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    resetting,
    setResetting,
  ] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedPermissions(
      uniquePermissions(
        permissions
      )
    );

    setExpandedGroups(
      Object.fromEntries(
        PERMISSION_CATALOG.map(
          (group) => [
            group.title,
            true,
          ]
        )
      )
    );

    setSearch("");
    setReason("");
    setActionError("");
  }, [
    open,
    permissions,
    adminId,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape" &&
        !saving &&
        !resetting
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    saving,
    resetting,
    onClose,
  ]);

  const normalizedCurrent =
    useMemo(
      () =>
        uniquePermissions(
          permissions
        ),
      [permissions]
    );

  const isDirty =
    !arraysEqual(
      selectedPermissions,
      normalizedCurrent
    );

  const selectedSet =
    useMemo(
      () =>
        new Set(
          selectedPermissions
        ),
      [selectedPermissions]
    );

  const filteredCatalog =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return PERMISSION_CATALOG;
      }

      return PERMISSION_CATALOG
        .map((group) => {
          const groupMatches =
            group.title
              .toLowerCase()
              .includes(keyword);

          const groupPermissions =
            group.permissions.filter(
              (permission) =>
                groupMatches ||
                permission.label
                  .toLowerCase()
                  .includes(
                    keyword
                  ) ||
                permission.key
                  .toLowerCase()
                  .includes(
                    keyword
                  )
            );

          return {
            ...group,
            permissions:
              groupPermissions,
          };
        })
        .filter(
          (group) =>
            group.permissions
              .length > 0
        );
    }, [search]);

  const selectedCount =
    selectedPermissions.length;

  const togglePermission = (
    permissionKey: string
  ) => {
    setSelectedPermissions(
      (current) => {
        if (
          current.includes(
            permissionKey
          )
        ) {
          return current.filter(
            (permission) =>
              permission !==
              permissionKey
          );
        }

        return uniquePermissions([
          ...current,
          permissionKey,
        ]);
      }
    );
  };

  const toggleGroup = (
    group: PermissionGroup
  ) => {
    const groupKeys =
      group.permissions.map(
        (permission) =>
          permission.key
      );

    const allSelected =
      groupKeys.every((key) =>
        selectedSet.has(key)
      );

    setSelectedPermissions(
      (current) => {
        if (allSelected) {
          return current.filter(
            (permission) =>
              !groupKeys.includes(
                permission
              )
          );
        }

        return uniquePermissions([
          ...current,
          ...groupKeys,
        ]);
      }
    );
  };

  const selectAll = () => {
    setSelectedPermissions(
      allPermissionKeys
    );
  };

  const clearAll = () => {
    setSelectedPermissions([]);
  };

  const restoreRoleDefaultsLocally =
    () => {
      setSelectedPermissions(
        uniquePermissions(
          roleDefaultPermissions
        )
      );
    };

  const handleSave =
    async () => {
      if (!isDirty) {
        return;
      }

      if (!reason.trim()) {
        setActionError(
          "Please enter a reason for changing permissions."
        );
        return;
      }

      setActionError("");

      try {
        await onSave({
          adminId,
          permissions:
            uniquePermissions(
              selectedPermissions
            ),
          reason:
            reason.trim(),
        });
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to save permissions."
        );
      }
    };

  const handleReset =
    async () => {
      if (
        !onResetToRoleDefault
      ) {
        restoreRoleDefaultsLocally();
        return;
      }

      if (!reason.trim()) {
        setActionError(
          "Please enter a reason before resetting permissions."
        );
        return;
      }

      setActionError("");
      setResetting(true);

      try {
        await onResetToRoleDefault({
          adminId,
          reason:
            reason.trim(),
        });
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to reset permissions."
        );
      } finally {
        setResetting(false);
      }
    };

  if (!open) {
    return null;
  }

  const busy =
    saving || resetting;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Edit administrator permissions"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-slate-800 bg-[#050b1d] shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5 sm:px-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Admin Security
            </div>

            <h2 className="mt-2 text-2xl font-black text-white">
              Edit Permissions
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {adminName} · {adminId}
            </p>

            <div className="mt-3 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
              Role: {role}
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close permission editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-slate-800 p-5 lg:border-b-0 lg:border-r">
            <div className="rounded-2xl border border-slate-800 bg-[#081126] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Selected permissions
              </p>

              <div className="mt-2 text-3xl font-black text-white">
                {selectedCount}
              </div>

              <p className="mt-1 text-xs text-slate-500">
                of {allPermissionKeys.length} available
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
              <button
                type="button"
                disabled={busy}
                onClick={selectAll}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#081126] px-4 text-sm font-bold text-slate-200 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Select All
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={clearAll}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#081126] px-4 text-sm font-bold text-slate-200 transition hover:border-rose-500/40 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Clear All
              </button>

              <button
                type="button"
                disabled={
                  busy ||
                  roleDefaultPermissions.length ===
                    0
                }
                onClick={
                  restoreRoleDefaultsLocally
                }
                className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 text-sm font-bold text-amber-300 transition hover:border-amber-500/40 disabled:cursor-not-allowed disabled:opacity-50 lg:col-span-1"
              >
                <RotateCcw className="h-4 w-4" />
                Preview Role Defaults
              </button>
            </div>

            <div className="mt-5">
              <label
                htmlFor="permission-reason"
                className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
              >
                Reason
              </label>

              <textarea
                id="permission-reason"
                value={reason}
                disabled={busy}
                onChange={(event) => {
                  setReason(
                    event.target.value
                  );
                  setActionError("");
                }}
                placeholder="Example: Allow campaign scheduling and report export."
                className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-slate-800 bg-[#081126] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={500}
              />

              <div className="mt-1 text-right text-xs text-slate-600">
                {reason.length}/500
              </div>
            </div>

            {actionError ? (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {actionError}
              </div>
            ) : null}
          </aside>

          <section className="min-h-0 overflow-y-auto p-5 sm:p-6 lg:p-8">
            <div className="sticky top-0 z-10 -mx-2 mb-5 bg-[#050b1d]/95 px-2 pb-3 backdrop-blur">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  type="search"
                  value={search}
                  disabled={busy}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search permission or key"
                  className="h-12 w-full rounded-2xl border border-slate-800 bg-[#081126] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-72 items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-300" />
                  <p className="mt-3 text-sm text-slate-400">
                    Loading permissions...
                  </p>
                </div>
              </div>
            ) : filteredCatalog.length ===
              0 ? (
              <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-slate-800 text-sm text-slate-500">
                No matching permissions.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCatalog.map(
                  (group) => {
                    const groupKeys =
                      group.permissions.map(
                        (permission) =>
                          permission.key
                      );

                    const selectedInGroup =
                      groupKeys.filter(
                        (key) =>
                          selectedSet.has(
                            key
                          )
                      ).length;

                    const allSelected =
                      selectedInGroup ===
                        groupKeys.length &&
                      groupKeys.length > 0;

                    const partiallySelected =
                      selectedInGroup > 0 &&
                      !allSelected;

                    const expanded =
                      expandedGroups[
                        group.title
                      ] ?? true;

                    return (
                      <div
                        key={group.title}
                        className="overflow-hidden rounded-2xl border border-slate-800 bg-[#081126]"
                      >
                        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-4">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              toggleGroup(
                                group
                              )
                            }
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                              allSelected
                                ? "border-emerald-400 bg-emerald-400 text-slate-950"
                                : partiallySelected
                                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                                  : "border-slate-700 bg-slate-950/40 text-transparent"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                            aria-label={`Toggle all ${group.title} permissions`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setExpandedGroups(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  [group.title]:
                                    !expanded,
                                })
                              )
                            }
                            className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <div>
                              <h3 className="font-black text-white">
                                {
                                  group.title
                                }
                              </h3>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  selectedInGroup
                                }{" "}
                                of{" "}
                                {
                                  groupKeys.length
                                }{" "}
                                selected
                              </p>
                            </div>

                            {expanded ? (
                              <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                            )}
                          </button>
                        </div>

                        {expanded ? (
                          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                            {group.permissions.map(
                              (
                                permission
                              ) => {
                                const checked =
                                  selectedSet.has(
                                    permission.key
                                  );

                                return (
                                  <label
                                    key={
                                      permission.key
                                    }
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                      checked
                                        ? "border-emerald-500/40 bg-emerald-500/10"
                                        : "border-slate-800 bg-slate-950/30 hover:border-slate-700"
                                    } ${
                                      busy
                                        ? "cursor-not-allowed opacity-60"
                                        : ""
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={
                                        checked
                                      }
                                      disabled={
                                        busy
                                      }
                                      onChange={() =>
                                        togglePermission(
                                          permission.key
                                        )
                                      }
                                    />

                                    <span
                                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                        checked
                                          ? "border-emerald-400 bg-emerald-400 text-slate-950"
                                          : "border-slate-700 bg-slate-950/50 text-transparent"
                                      }`}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </span>

                                    <span className="min-w-0">
                                      <span className="block text-sm font-bold text-slate-100">
                                        {
                                          permission.label
                                        }
                                      </span>

                                      <span className="mt-1 block break-all font-mono text-[11px] text-slate-500">
                                        {
                                          permission.key
                                        }
                                      </span>
                                    </span>
                                  </label>
                                );
                              }
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-800 bg-[#050b1d] px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs text-slate-500">
            Changes are recorded in the administrator audit log.
          </p>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-800 px-6 text-sm font-bold text-slate-200 transition hover:border-slate-700 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                busy ||
                !onResetToRoleDefault
              }
              onClick={() =>
                void handleReset()
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 text-sm font-bold text-amber-300 transition hover:border-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}

              {resetting
                ? "Resetting..."
                : "Reset to Role Default"}
            </button>

            <button
              type="button"
              disabled={
                busy || !isDirty
              }
              onClick={() =>
                void handleSave()
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-7 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? "Saving Permissions..."
                : "Save Permissions"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}