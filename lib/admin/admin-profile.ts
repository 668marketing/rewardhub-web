"use client";

import type {
  AdminUser,
} from "@/lib/admin-auth";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
};

type WrappedData<T> = {
  message?: string;
  data?: T;
  admin?: AdminUser;
};

export type CurrentAdminProfileResult = {
  admin: AdminUser;
  permissions: string[];
  expiresAt: string;
};

export type UpdateAdminProfileInput = {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
};

export type UpdateAdminPasswordInput = {
  currentPassword: string;
  newPassword: string;
  reason: string;
};

export type UpdateAdminProfileResult = {
  admin: AdminUser;
  message: string;
};

export type UpdateAdminPasswordResult = {
  adminId: string;
  revokedSessions: number;
  message: string;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function unwrap<T>(
  value: unknown
): T {
  let current =
    value;

  for (
    let index = 0;
    index < 5;
    index += 1
  ) {
    if (
      isRecord(current) &&
      "data" in current
    ) {
      current =
        current.data;

      continue;
    }

    break;
  }

  return current as T;
}

async function readResponse<T>(
  response: Response
): Promise<T> {
  const rawText =
    await response.text();

  let parsed:
    ApiEnvelope<unknown>;

  try {
    parsed =
      rawText
        ? JSON.parse(
            rawText
          )
        : {};
  } catch {
    throw new Error(
      "Admin Profile API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    parsed.success === false
  ) {
    throw new Error(
      parsed.error ||
      parsed.message ||
      "Admin Profile request failed."
    );
  }

  return unwrap<T>(
    parsed.data ??
    parsed.result
  );
}

export async function getCurrentAdminProfile(): Promise<CurrentAdminProfileResult> {
  const response =
    await fetch(
      "/api/admin/profile",
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",
      }
    );

  return readResponse<CurrentAdminProfileResult>(
    response
  );
}

export async function updateCurrentAdminProfile(
  input: UpdateAdminProfileInput
): Promise<UpdateAdminProfileResult> {
  const response =
    await fetch(
      "/api/admin/profile",
      {
        method:
          "PATCH",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            input
          ),
      }
    );

  return readResponse<UpdateAdminProfileResult>(
    response
  );
}

export async function updateCurrentAdminPassword(
  input: UpdateAdminPasswordInput
): Promise<UpdateAdminPasswordResult> {
  const response =
    await fetch(
      "/api/admin/profile/password",
      {
        method:
          "POST",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            input
          ),
      }
    );

  return readResponse<UpdateAdminPasswordResult>(
    response
  );
}