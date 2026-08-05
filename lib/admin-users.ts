"use client";

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "OPERATIONS",
  "FINANCE",
  "SUPPORT",
  "MARKETING",
  "VIEWER",
] as const;

export type AdminUser = {
  adminId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  failedLoginCount: number;
  lockedUntil: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  permissionsUpdatedBy?: string;
  permissionsUpdatedAt?: string;
};

export type AdminUserDetail = {
  admin: AdminUser;
  permissions: string[];
  permissionSource?: "CUSTOM" | "ROLE_DEFAULT" | string;
  roleDefaultPermissions?: string[];
  sessions: {
    total: number;
    active: number;
    expired: number;
    revoked: number;
  };
};

export type AdminUsersResult = {
  admins: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PermissionCatalogResult = {
  catalog: Array<{
    group: string;
    permissions: Array<{
      key: string;
      label: string;
    }>;
  }>;
  allPermissionKeys: string[];
  roles: string[];
  roleDefaults: Record<string, string[]>;
};

type Envelope<T> = {
  success?: boolean;
  data?: T | { data?: T };
  result?: T;
  error?: string;
  message?: string;
};

function unwrap<T>(value: unknown): T {
  let current = value;

  for (let index = 0; index < 5; index += 1) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      "data" in current
    ) {
      current = (
        current as Record<string, unknown>
      ).data;
      continue;
    }

    break;
  }

  return current as T;
}

async function read<T>(
  response: Response
): Promise<T> {
  let result: Envelope<T>;

  try {
    result =
      (await response.json()) as Envelope<T>;
  } catch {
    throw new Error(
      "Admin Users API returned invalid JSON."
    );
  }

  if (
    !response.ok ||
    result.success === false
  ) {
    throw new Error(
      result.error ||
        result.message ||
        "Admin Users request failed."
    );
  }

  return unwrap<T>(
    result.data ??
      result.result
  );
}

export async function getAdminUsers(
  options: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const params =
    new URLSearchParams({
      page: String(
        options.page || 1
      ),
      limit: String(
        options.limit || 100
      ),
    });

  if (options.search?.trim()) {
    params.set(
      "search",
      options.search.trim()
    );
  }

  if (options.role?.trim()) {
    params.set(
      "role",
      options.role.trim()
    );
  }

  if (options.status?.trim()) {
    params.set(
      "status",
      options.status.trim()
    );
  }

  return read<AdminUsersResult>(
    await fetch(
      `/api/admin/admin-users?${params.toString()}`,
      {
        cache: "no-store",
      }
    )
  );
}

export async function getAdminUserDetail(
  adminId: string
) {
  return read<AdminUserDetail>(
    await fetch(
      `/api/admin/admin-users?adminId=${encodeURIComponent(
        adminId
      )}`,
      {
        cache: "no-store",
      }
    )
  );
}

export async function getAdminUserPermissionCatalog() {
  return read<PermissionCatalogResult>(
    await fetch(
      "/api/admin/admin-users?mode=permissionCatalog",
      {
        cache: "no-store",
      }
    )
  );
}

async function mutate<T>(
  payload: Record<string, unknown>
) {
  return read<T>(
    await fetch(
      "/api/admin/admin-users",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(
          payload
        ),
      }
    )
  );
}

export const createAdminUser = (
  input: Record<string, unknown>
) =>
  mutate<{
    admin: AdminUser;
    message: string;
  }>({
    operation: "create",
    ...input,
  });

export const updateAdminUser = (
  input: Record<string, unknown>
) =>
  mutate<{
    admin: AdminUser;
    message: string;
  }>({
    operation: "update",
    ...input,
  });

export const updateAdminUserStatus = (
  input: Record<string, unknown>
) =>
  mutate<{
    admin: AdminUser;
    message: string;
  }>({
    operation: "status",
    ...input,
  });

export const resetAdminUserPassword = (
  input: Record<string, unknown>
) =>
  mutate<{
    adminId: string;
    revokedSessions: number;
    message: string;
  }>({
    operation: "resetPassword",
    ...input,
  });

export const revokeAdminUserSessions = (
  input: Record<string, unknown>
) =>
  mutate<{
    adminId: string;
    revokedSessions: number;
    message: string;
  }>({
    operation: "revokeSessions",
    ...input,
  });

export const updateAdminUserPermissions = (
  input: {
    adminId: string;
    permissions: string[];
    reason: string;
  }
) =>
  mutate<{
    adminId?: string;
    permissions?: string[];
    revokedSessions?: number;
    message?: string;
  }>({
    operation: "updatePermissions",
    ...input,
  });

export const resetAdminUserPermissions = (
  input: {
    adminId: string;
    reason: string;
  }
) =>
  mutate<{
    adminId?: string;
    permissions?: string[];
    revokedSessions?: number;
    message?: string;
  }>({
    operation: "resetPermissions",
    ...input,
  });

export function formatAdminRole(
  value: string
) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) =>
      part
        ? part[0].toUpperCase() +
          part.slice(1)
        : ""
    )
    .join(" ");
}

export function formatAdminDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

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
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}