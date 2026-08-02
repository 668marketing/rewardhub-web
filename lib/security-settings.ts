"use client";

export type RewardHubSecuritySettings = {
  appLockEnabled: boolean;
  biometricEnabled: boolean;
  trustedDevice: boolean;
  lockTimeout: number;
};

export type RewardHubSecurityUserType =
  | "MEMBER"
  | "MERCHANT"
  | "ADMIN";

const STORAGE_PREFIX =
  "rewardhub_security";

const DEFAULT_SETTINGS:
  RewardHubSecuritySettings = {
    appLockEnabled: true,
    biometricEnabled: false,
    trustedDevice: true,
    lockTimeout: 20,
  };

function isBrowser() {
  return (
    typeof window !==
    "undefined"
  );
}

function getStorageKey(
  userType:
    RewardHubSecurityUserType,
  userId: string
) {
  return `${STORAGE_PREFIX}_${userType}_${String(
    userId || ""
  ).trim()}`;
}

function normalizeSettings(
  value: unknown
): RewardHubSecuritySettings {
  const parsed =
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
      ? (
          value as Partial<RewardHubSecuritySettings>
        )
      : {};

  const allowedTimeouts =
    new Set([
      0,
      20,
      60,
      300,
    ]);

  const parsedTimeout =
    Number(
      parsed.lockTimeout
    );

  return {
    appLockEnabled:
      typeof parsed.appLockEnabled ===
      "boolean"
        ? parsed.appLockEnabled
        : DEFAULT_SETTINGS.appLockEnabled,

    biometricEnabled:
      typeof parsed.biometricEnabled ===
      "boolean"
        ? parsed.biometricEnabled
        : DEFAULT_SETTINGS.biometricEnabled,

    trustedDevice:
      typeof parsed.trustedDevice ===
      "boolean"
        ? parsed.trustedDevice
        : DEFAULT_SETTINGS.trustedDevice,

    lockTimeout:
      allowedTimeouts.has(
        parsedTimeout
      )
        ? parsedTimeout
        : DEFAULT_SETTINGS.lockTimeout,
  };
}

export function getDefaultSecuritySettings():
  RewardHubSecuritySettings {
  return {
    ...DEFAULT_SETTINGS,
  };
}

export function getSecuritySettings(
  userType:
    RewardHubSecurityUserType,
  userId: string
): RewardHubSecuritySettings {
  if (
    !isBrowser() ||
    !String(
      userId || ""
    ).trim()
  ) {
    return {
      ...DEFAULT_SETTINGS,
    };
  }

  try {
    const raw =
      localStorage.getItem(
        getStorageKey(
          userType,
          userId
        )
      );

    if (!raw) {
      return {
        ...DEFAULT_SETTINGS,
      };
    }

    return normalizeSettings(
      JSON.parse(raw)
    );
  } catch {
    return {
      ...DEFAULT_SETTINGS,
    };
  }
}

export function saveSecuritySettings(
  userType:
    RewardHubSecurityUserType,
  userId: string,
  settings:
    RewardHubSecuritySettings
) {
  if (
    !isBrowser() ||
    !String(
      userId || ""
    ).trim()
  ) {
    return;
  }

  const normalized =
    normalizeSettings(
      settings
    );

  localStorage.setItem(
    getStorageKey(
      userType,
      userId
    ),
    JSON.stringify(
      normalized
    )
  );
}

export function updateSecuritySetting<
  Key extends keyof RewardHubSecuritySettings
>(
  userType:
    RewardHubSecurityUserType,
  userId: string,
  key: Key,
  value:
    RewardHubSecuritySettings[Key]
) {
  const current =
    getSecuritySettings(
      userType,
      userId
    );

  saveSecuritySettings(
    userType,
    userId,
    {
      ...current,
      [key]:
        value,
    }
  );
}

export function resetSecuritySettings(
  userType:
    RewardHubSecurityUserType,
  userId: string
) {
  saveSecuritySettings(
    userType,
    userId,
    {
      ...DEFAULT_SETTINGS,
    }
  );
}
