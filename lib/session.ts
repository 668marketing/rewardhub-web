"use client";

export type RewardHubUserType =
  | "MEMBER"
  | "MERCHANT"
  | "ADMIN";

export type RewardHubSession = {
  userType: RewardHubUserType;
  userId: string;
  createdAt: number;
  lastActiveAt: number;
  deviceId: string;
};

const SESSION_KEY =
  "rewardhub_session";

const DEVICE_ID_KEY =
  "rewardhub_device_id";

const LEGACY_MEMBER_KEY =
  "member";

const LEGACY_MERCHANT_KEY =
  "merchant";

const LEGACY_ADMIN_KEY =
  "admin";

function isBrowser() {
  return (
    typeof window !==
    "undefined"
  );
}

function createRandomId() {
  if (
    isBrowser() &&
    window.crypto?.randomUUID
  ) {
    return window.crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
}

export function getOrCreateDeviceId() {
  if (!isBrowser()) {
    return "";
  }

  const existing =
    localStorage.getItem(
      DEVICE_ID_KEY
    );

  if (existing) {
    return existing;
  }

  const deviceId =
    createRandomId();

  localStorage.setItem(
    DEVICE_ID_KEY,
    deviceId
  );

  return deviceId;
}

export function saveRewardHubSession(
  input: {
    userType: RewardHubUserType;
    userId: string;
  }
) {
  if (!isBrowser()) {
    return;
  }

  const now =
    Date.now();

  const session: RewardHubSession =
    {
      userType:
        input.userType,

      userId:
        String(
          input.userId || ""
        ).trim(),

      createdAt:
        now,

      lastActiveAt:
        now,

      deviceId:
        getOrCreateDeviceId(),
    };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(
      session
    )
  );
}

export function getRewardHubSession():
  | RewardHubSession
  | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw =
      localStorage.getItem(
        SESSION_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(
        raw
      ) as Partial<RewardHubSession>;

    if (
      !parsed.userType ||
      !parsed.userId ||
      !parsed.deviceId
    ) {
      localStorage.removeItem(
        SESSION_KEY
      );

      return null;
    }

    return {
      userType:
        parsed.userType,

      userId:
        String(
          parsed.userId
        ),

      createdAt:
        Number(
          parsed.createdAt ||
          Date.now()
        ),

      lastActiveAt:
        Number(
          parsed.lastActiveAt ||
          Date.now()
        ),

      deviceId:
        String(
          parsed.deviceId
        ),
    };
  } catch {
    localStorage.removeItem(
      SESSION_KEY
    );

    return null;
  }
}

export function touchRewardHubSession() {
  if (!isBrowser()) {
    return;
  }

  const session =
    getRewardHubSession();

  if (!session) {
    return;
  }

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      ...session,
      lastActiveAt:
        Date.now(),
    })
  );
}

export function clearRewardHubSession(
  options?: {
    clearMember?: boolean;
    clearMerchant?: boolean;
    clearAdmin?: boolean;
    clearDeviceId?: boolean;
  }
) {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(
    SESSION_KEY
  );

  if (
    options?.clearMember !==
    false
  ) {
    localStorage.removeItem(
      LEGACY_MEMBER_KEY
    );
  }

  if (
    options?.clearMerchant !==
    false
  ) {
    localStorage.removeItem(
      LEGACY_MERCHANT_KEY
    );
  }

  if (
    options?.clearAdmin !==
    false
  ) {
    localStorage.removeItem(
      LEGACY_ADMIN_KEY
    );
  }

  if (
    options?.clearDeviceId
  ) {
    localStorage.removeItem(
      DEVICE_ID_KEY
    );
  }

  sessionStorage.removeItem(
    "rewardhub_tawk_identity"
  );
}

export function hasStoredMember() {
  if (!isBrowser()) {
    return false;
  }

  try {
    const raw =
      localStorage.getItem(
        LEGACY_MEMBER_KEY
      );

    if (!raw) {
      return false;
    }

    const parsed =
      JSON.parse(raw);

    return Boolean(
      parsed?.memberId ||
      parsed?.MEMBER_ID
    );
  } catch {
    localStorage.removeItem(
      LEGACY_MEMBER_KEY
    );

    return false;
  }
}

export function hasStoredMerchant() {
  if (!isBrowser()) {
    return false;
  }

  try {
    const raw =
      localStorage.getItem(
        LEGACY_MERCHANT_KEY
      );

    if (!raw) {
      return false;
    }

    const parsed =
      JSON.parse(raw);

    return Boolean(
      parsed?.merchantId ||
      parsed?.MERCHANT_ID
    );
  } catch {
    localStorage.removeItem(
      LEGACY_MERCHANT_KEY
    );

    return false;
  }
}