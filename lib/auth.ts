"use client";

import {
  clearRewardHubSession,
  getRewardHubSession,
  saveRewardHubSession,
} from "@/lib/session";

type UnknownRecord =
  Record<string, unknown>;

const MEMBER_STORAGE_KEY =
  "member";

const MERCHANT_STORAGE_KEY =
  "merchant";

function isBrowser() {
  return (
    typeof window !==
    "undefined"
  );
}

function asRecord(
  value: unknown
): UnknownRecord | null {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as UnknownRecord;
}

function readString(
  record: UnknownRecord,
  keys: string[]
) {
  for (const key of keys) {
    const value =
      record[key];

    if (
      typeof value ===
      "string" &&
      value.trim()
    ) {
      return value.trim();
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(value);
    }
  }

  return "";
}

export function getSafeInternalRedirect(
  value: string | null | undefined,
  fallback: string
) {
  const redirect =
    String(value || "")
      .trim();

  if (
    !redirect ||
    !redirect.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.includes("://") ||
    redirect.includes("\\")
  ) {
    return fallback;
  }

  return redirect;
}

export function saveMemberLogin(
  memberData: unknown
) {
  if (!isBrowser()) {
    throw new Error(
      "Browser storage is unavailable."
    );
  }

  const record =
    asRecord(memberData);

  if (!record) {
    throw new Error(
      "Invalid member information."
    );
  }

  const memberId =
    readString(
      record,
      [
        "memberId",
        "MEMBER_ID",
      ]
    );

  if (!memberId) {
    throw new Error(
      "Missing member ID."
    );
  }

  /*
   * A browser origin can only have one active
   * RewardHub portal identity at a time.
   */
  localStorage.removeItem(
    MERCHANT_STORAGE_KEY
  );

  localStorage.setItem(
    MEMBER_STORAGE_KEY,
    JSON.stringify(record)
  );

  saveRewardHubSession({
    userType:
      "MEMBER",
    userId:
      memberId,
  });

  return {
    memberId,
    session:
      getRewardHubSession(),
  };
}

export function saveMerchantLogin(
  merchantData: unknown
) {
  if (!isBrowser()) {
    throw new Error(
      "Browser storage is unavailable."
    );
  }

  const record =
    asRecord(merchantData);

  if (!record) {
    throw new Error(
      "Invalid merchant information."
    );
  }

  const merchantId =
    readString(
      record,
      [
        "merchantId",
        "MERCHANT_ID",
      ]
    );

  if (!merchantId) {
    throw new Error(
      "Missing merchant ID."
    );
  }

  localStorage.removeItem(
    MEMBER_STORAGE_KEY
  );

  localStorage.setItem(
    MERCHANT_STORAGE_KEY,
    JSON.stringify(record)
  );

  saveRewardHubSession({
    userType:
      "MERCHANT",
    userId:
      merchantId,
  });

  return {
    merchantId,
    session:
      getRewardHubSession(),
  };
}

export function hasValidMemberLogin() {
  if (!isBrowser()) {
    return false;
  }

  try {
    const raw =
      localStorage.getItem(
        MEMBER_STORAGE_KEY
      );

    if (!raw) {
      return false;
    }

    const record =
      asRecord(
        JSON.parse(raw)
      );

    if (!record) {
      return false;
    }

    const memberId =
      readString(
        record,
        [
          "memberId",
          "MEMBER_ID",
        ]
      );

    if (!memberId) {
      return false;
    }

    const session =
      getRewardHubSession();

    return Boolean(
      session &&
      session.userType ===
        "MEMBER" &&
      session.userId ===
        memberId
    );
  } catch {
    return false;
  }
}

export function hasValidMerchantLogin() {
  if (!isBrowser()) {
    return false;
  }

  try {
    const raw =
      localStorage.getItem(
        MERCHANT_STORAGE_KEY
      );

    if (!raw) {
      return false;
    }

    const record =
      asRecord(
        JSON.parse(raw)
      );

    if (!record) {
      return false;
    }

    const merchantId =
      readString(
        record,
        [
          "merchantId",
          "MERCHANT_ID",
        ]
      );

    if (!merchantId) {
      return false;
    }

    const session =
      getRewardHubSession();

    return Boolean(
      session &&
      session.userType ===
        "MERCHANT" &&
      session.userId ===
        merchantId
    );
  } catch {
    return false;
  }
}

export function logoutRewardHub(
  options?: {
    clearDeviceId?: boolean;
  }
) {
  clearRewardHubSession({
    clearMember:
      true,
    clearMerchant:
      true,
    clearAdmin:
      true,
    clearDeviceId:
      options?.clearDeviceId ??
      false,
  });
}