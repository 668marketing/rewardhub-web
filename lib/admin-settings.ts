"use client";

/* ============================================================
 * RewardHub Admin System Settings
 * File: lib/admin-settings.ts
 * ============================================================
 */

export type AdminSettingValueType =
  | "TEXT"
  | "EMAIL"
  | "NUMBER"
  | "PERCENT"
  | "BOOLEAN"
  | string;

export type AdminSystemSetting = {
  key: string;
  category: string;
  label: string;
  value: string | number | boolean;
  rawValue: string;
  valueType: AdminSettingValueType;
  description: string;
  isSecret: boolean;
  status: string;
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
};

export type AdminSystemSettingsResult = {
  items: AdminSystemSetting[];
  categories: Record<string, AdminSystemSetting[]>;
  count: number;
  canUpdate: boolean;
};

export type UpdateAdminSystemSettingsInput = {
  settings: Array<{
    key: string;
    value: string | number | boolean;
  }>;
  reason: string;
};

export type UpdateAdminSystemSettingsResult = {
  updated: boolean;
  changedCount: number;
  changedKeys?: string[];
  items: AdminSystemSetting[];
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapPayload(value: unknown): unknown {
  let current = value;

  for (let index = 0; index < 8; index++) {
    if (!isRecord(current)) return current;

    if (Array.isArray(current.items) || isRecord(current.categories)) {
      return current;
    }

    if (current.data !== undefined) {
      current = current.data;
      continue;
    }

    if (current.result !== undefined) {
      current = current.result;
      continue;
    }

    return current;
  }

  return current;
}

function toStringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function toBooleanValue(value: unknown) {
  if (value === true || value === 1) return true;

  const normalized = toStringValue(value).trim().toLowerCase();

  return (
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "1" ||
    normalized === "on"
  );
}

function toNumberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeSetting(value: unknown): AdminSystemSetting {
  const row = isRecord(value) ? value : {};
  const valueType = toStringValue(row.valueType).toUpperCase();

  let normalizedValue: string | number | boolean =
    toStringValue(row.value);

  if (valueType === "BOOLEAN") {
    normalizedValue = toBooleanValue(row.value);
  }

  if (valueType === "NUMBER" || valueType === "PERCENT") {
    normalizedValue = toNumberValue(row.value);
  }

  return {
    key: toStringValue(row.key),
    category: toStringValue(row.category).toUpperCase(),
    label: toStringValue(row.label),
    value: normalizedValue,
    rawValue: toStringValue(row.rawValue ?? row.value),
    valueType: valueType || "TEXT",
    description: toStringValue(row.description),
    isSecret: toBooleanValue(row.isSecret),
    status: toStringValue(row.status).toUpperCase() || "ACTIVE",
    updatedBy: toStringValue(row.updatedBy),
    updatedAt: toStringValue(row.updatedAt),
    createdAt: toStringValue(row.createdAt),
  };
}

function normalizeResult(value: unknown): AdminSystemSettingsResult {
  const payload = unwrapPayload(value);
  const row = isRecord(payload) ? payload : {};

  const items = Array.isArray(row.items)
    ? row.items.map(normalizeSetting)
    : [];

  const categories: Record<string, AdminSystemSetting[]> = {};

  items.forEach((item) => {
    const category = item.category || "OTHER";
    categories[category] ||= [];
    categories[category].push(item);
  });

  return {
    items,
    categories,
    count: Number(row.count ?? items.length) || items.length,
    canUpdate: toBooleanValue(row.canUpdate),
  };
}

async function readApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  let result: ApiResponse<T>;

  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error("Settings API returned an invalid JSON response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.error || result.message || fallbackMessage);
  }

  const payload = result.data ?? result.result;

  if (payload === undefined) {
    throw new Error(
      result.error ||
        result.message ||
        "Settings API response is missing data."
    );
  }

  return payload;
}

export async function getAdminSystemSettings():
  Promise<AdminSystemSettingsResult> {
  const response = await fetch("/api/admin/settings", {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readApiResponse<unknown>(
    response,
    "Unable to load system settings."
  );

  return normalizeResult(payload);
}

export async function updateAdminSystemSettings(
  input: UpdateAdminSystemSettingsInput
): Promise<UpdateAdminSystemSettingsResult> {
  const response = await fetch("/api/admin/settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      settings: input.settings,
      reason: input.reason.trim(),
    }),
  });

  const payload = await readApiResponse<unknown>(
    response,
    "Unable to update system settings."
  );

  const unwrapped = unwrapPayload(payload);
  const row = isRecord(unwrapped) ? unwrapped : {};

  return {
    updated: toBooleanValue(row.updated),
    changedCount: toNumberValue(row.changedCount),
    changedKeys: Array.isArray(row.changedKeys)
      ? row.changedKeys.map(toStringValue)
      : [],
    items: Array.isArray(row.items)
      ? row.items.map(normalizeSetting)
      : [],
  };
}

export function formatAdminSettingDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}