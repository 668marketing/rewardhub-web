"use client";

export type RewardHubSecuritySettings = {
  appLockEnabled: boolean;
  biometricEnabled: boolean;
  trustedDevice: boolean;
  lockTimeout: number;
};

const STORAGE_PREFIX = "rewardhub_security";

const DEFAULT_SETTINGS: RewardHubSecuritySettings = {
  appLockEnabled: true,
  biometricEnabled: false,
  trustedDevice: true,
  lockTimeout: 20,
};

function isBrowser() {
  return typeof window !== "undefined";
}

function getStorageKey(
  userType: "MEMBER" | "MERCHANT" | "ADMIN",
  userId: string
) {
  return `${STORAGE_PREFIX}_${userType}_${userId}`;
}

export function getDefaultSecuritySettings() {
  return { ...DEFAULT_SETTINGS };
}

export function getSecuritySettings(
  userType: "MEMBER" | "MERCHANT" | "ADMIN",
  userId: string
): RewardHubSecuritySettings {
  if (!isBrowser()) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(
      getStorageKey(userType, userId)
    );

    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSecuritySettings(
  userType: "MEMBER" | "MERCHANT" | "ADMIN",
  userId: string,
  settings: RewardHubSecuritySettings
) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(
    getStorageKey(userType, userId),
    JSON.stringify(settings)
  );
}

export function updateSecuritySetting<
  K extends keyof RewardHubSecuritySettings
>(
  userType: "MEMBER" | "MERCHANT" | "ADMIN",
  userId: string,
  key: K,
  value: RewardHubSecuritySettings[K]
) {
  const current = getSecuritySettings(
    userType,
    userId
  );

  saveSecuritySettings(userType, userId, {
    ...current,
    [key]: value,
  });
}

export function resetSecuritySettings(
  userType: "MEMBER" | "MERCHANT" | "ADMIN",
  userId: string
) {
  saveSecuritySettings(
    userType,
    userId,
    DEFAULT_SETTINGS
  );
}