"use client";

import {
  ArrowLeft,
  ChevronRight,
  BadgeCheck,
  CircleHelp,
  Clock3,
  Headphones,
  LoaderCircle,
  LockKeyhole,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/* ============================================================
 * Tawk Configuration
 * ============================================================
 */

const TAWK_CONTAINER_ID =
  "tawk_6a66a6f1e36efe1d4eb18b53";

const TAWK_SCRIPT_ID =
  "rewardhub-tawk-embed-script";

const TAWK_SCRIPT_URL =
  "https://embed.tawk.to/6a66a6f1e36efe1d4eb18b53/1juj0bd7p";

/* ============================================================
 * Types
 * ============================================================
 */

type UnknownRecord =
  Record<string, unknown>;

type RewardHubIdentity = {
  accountType:
    | "MEMBER"
    | "MERCHANT"
    | "GUEST";

  accountId: string;
  displayName: string;
  email: string;
  phone: string;

  tier: string;
  businessName: string;
};

type TawkAuthResponse = {
  success: boolean;
  userId?: string;
  hash?: string;
  message?: string;
};

type TawkApi = {
  embedded?: string;

  onLoad?: () => void;

  login?: (
    data: {
      hash: string;
      userId: string;
      name?: string;
      email?: string;
      phone?: string;
      [key: string]: string | undefined;
    },
    callback?: (
      error?: unknown
    ) => void
  ) => void;

  logout?: (
    callback?: (
      error?: unknown
    ) => void
  ) => void;

  setAttributes?: (
    attributes: Record<
      string,
      string
    >,
    callback?: (
      error?: unknown
    ) => void
  ) => void;

  shutdown?: () => void;
};

declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

/* ============================================================
 * Helpers
 * ============================================================
 */

function cleanValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function readFirstValue(
  source: UnknownRecord,
  keys: string[]
): string {
  for (const key of keys) {
    const value =
      cleanValue(
        source[key]
      );

    if (value) {
      return value;
    }
  }

  return "";
}

function parseStoredObject(
  key: string
): UnknownRecord | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const rawValue =
    window.localStorage.getItem(
      key
    );

  if (!rawValue) {
    return null;
  }

  try {
    const parsed: unknown =
      JSON.parse(rawValue);

    if (
      parsed &&
      typeof parsed ===
        "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as UnknownRecord;
    }

    return null;
  } catch {
    return null;
  }
}

function unwrapStoredData(
  source: UnknownRecord
): UnknownRecord {
  const possibleNestedKeys = [
    "data",
    "member",
    "merchant",
    "profile",
    "result",
  ];

  for (
    const key of
      possibleNestedKeys
  ) {
    const nested =
      source[key];

    if (
      nested &&
      typeof nested ===
        "object" &&
      !Array.isArray(nested)
    ) {
      return nested as UnknownRecord;
    }
  }

  return source;
}

/* ============================================================
 * Phone Normalization
 * ============================================================
 */

function normalizePhone(
  phone: string
): string {
  const cleaned =
    phone.replace(
      /[\s\-().]/g,
      ""
    );

  if (!cleaned) {
    return "";
  }

  if (
    cleaned.startsWith("+")
  ) {
    return cleaned;
  }

  if (
    cleaned.startsWith("60")
  ) {
    return `+${cleaned}`;
  }

  if (
    cleaned.startsWith("0")
  ) {
    return `+60${cleaned.slice(
      1
    )}`;
  }

  return cleaned;
}

/* ============================================================
 * Member Identity
 * ============================================================
 */

function getMemberIdentity(
  memberSource: UnknownRecord
): RewardHubIdentity | null {
  const member =
    unwrapStoredData(
      memberSource
    );

  const memberId =
    readFirstValue(
      member,
      [
        "memberId",
        "MEMBER_ID",
        "member_id",
        "id",
      ]
    );

  if (!memberId) {
    return null;
  }

  const fullName =
    readFirstValue(
      member,
      [
        "fullName",
        "FULL_NAME",
        "full_name",
        "memberName",
        "MEMBER_NAME",
        "name",
        "NAME",
      ]
    );

  const email =
    readFirstValue(
      member,
      [
        "email",
        "EMAIL",
        "emailAddress",
        "EMAIL_ADDRESS",
      ]
    );

  const phone =
    readFirstValue(
      member,
      [
        "phone",
        "PHONE",
        "phoneNumber",
        "PHONE_NUMBER",
        "mobile",
        "MOBILE",
        "mobileNo",
        "MOBILE_NO",
      ]
    );

  const tier =
    readFirstValue(
      member,
      [
        "tier",
        "TIER",
        "memberTier",
        "MEMBER_TIER",
      ]
    );

  return {
    accountType:
      "MEMBER",

    accountId:
      memberId,

    displayName:
      fullName ||
      memberId,

    email,

    phone:
      normalizePhone(
        phone
      ),

    tier:
      tier || "Silver",

    businessName: "",
  };
}

/* ============================================================
 * Merchant Identity
 * ============================================================
 */

function getMerchantIdentity(
  merchantSource:
    UnknownRecord
): RewardHubIdentity | null {
  const merchant =
    unwrapStoredData(
      merchantSource
    );

  const merchantId =
    readFirstValue(
      merchant,
      [
        "merchantId",
        "MERCHANT_ID",
        "merchant_id",
        "id",
      ]
    );

  if (!merchantId) {
    return null;
  }

  const businessName =
    readFirstValue(
      merchant,
      [
        "businessName",
        "BUSINESS_NAME",
        "business_name",
        "merchantName",
        "MERCHANT_NAME",
        "name",
        "NAME",
      ]
    );

  const ownerName =
    readFirstValue(
      merchant,
      [
        "ownerName",
        "OWNER_NAME",
        "owner_name",
        "contactName",
        "CONTACT_NAME",
        "personInCharge",
        "PERSON_IN_CHARGE",
      ]
    );

  const email =
    readFirstValue(
      merchant,
      [
        "email",
        "EMAIL",
        "loginEmail",
        "LOGIN_EMAIL",
        "businessEmail",
        "BUSINESS_EMAIL",
      ]
    );

  const phone =
    readFirstValue(
      merchant,
      [
        "phone",
        "PHONE",
        "phoneNumber",
        "PHONE_NUMBER",
        "mobile",
        "MOBILE",
        "contactPhone",
        "CONTACT_PHONE",
        "businessPhone",
        "BUSINESS_PHONE",
      ]
    );

  return {
    accountType:
      "MERCHANT",

    accountId:
      merchantId,

    displayName:
      businessName ||
      ownerName ||
      merchantId,

    email,

    phone:
      normalizePhone(
        phone
      ),

    tier: "",

    businessName:
      businessName ||
      merchantId,
  };
}

/* ============================================================
 * Resolve Current Login Identity
 * ============================================================
 */

function getCurrentIdentity():
  RewardHubIdentity {
  const merchantStorage =
    parseStoredObject(
      "merchant"
    );

  const memberStorage =
    parseStoredObject(
      "member"
    );

  const pathname =
    typeof window !==
    "undefined"
      ? window.location.pathname
      : "";

  const isMerchantPortal =
    pathname ===
      "/merchant" ||
    pathname.startsWith(
      "/merchant/"
    );

  const isMemberPortal =
    pathname ===
      "/member" ||
    pathname.startsWith(
      "/member/"
    );

  /*
   * Use the current portal path first.
   *
   * A browser may contain both saved Member and Merchant
   * sessions. The active URL decides which identity should
   * be sent to Tawk.
   */
  if (
    isMerchantPortal &&
    merchantStorage
  ) {
    const merchantIdentity =
      getMerchantIdentity(
        merchantStorage
      );

    if (merchantIdentity) {
      return merchantIdentity;
    }
  }

  if (
    isMemberPortal &&
    memberStorage
  ) {
    const memberIdentity =
      getMemberIdentity(
        memberStorage
      );

    if (memberIdentity) {
      return memberIdentity;
    }
  }

  /*
   * Fallback for pages outside the two portals.
   */
  if (memberStorage) {
    const memberIdentity =
      getMemberIdentity(
        memberStorage
      );

    if (memberIdentity) {
      return memberIdentity;
    }
  }

  if (merchantStorage) {
    const merchantIdentity =
      getMerchantIdentity(
        merchantStorage
      );

    if (merchantIdentity) {
      return merchantIdentity;
    }
  }

  return {
    accountType:
      "GUEST",

    accountId: "",
    displayName:
      "RewardHub Visitor",
    email: "",
    phone: "",
    tier: "",
    businessName: "",
  };
}

/* ============================================================
 * Identity Session Helpers
 * ============================================================
 */

const TAWK_IDENTITY_KEY =
  "rewardhub_tawk_identity";

function getIdentitySessionKey(
  identity: RewardHubIdentity
): string {
  if (
    identity.accountType ===
      "GUEST" ||
    !identity.accountId
  ) {
    return "GUEST";
  }

  return `${identity.accountType}:${identity.accountId}`;
}

async function getTawkSecureAuth(
  identity: RewardHubIdentity
): Promise<TawkAuthResponse> {
  if (
    identity.accountType ===
      "GUEST" ||
    !identity.accountId
  ) {
    return {
      success: false,
      message:
        "Guest accounts do not require secure Tawk authentication.",
    };
  }

  try {
    const response =
      await fetch(
        "/api/tawk-auth",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            userId:
              getIdentitySessionKey(
                identity
              ),
          }),

          cache: "no-store",
        }
      );

    const result =
      (await response.json()) as
        TawkAuthResponse;

    if (
      !response.ok ||
      !result.success ||
      !result.userId ||
      !result.hash
    ) {
      return {
        success: false,
        message:
          result.message ||
          "Unable to authenticate the support session.",
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to authenticate the support session.",
    };
  }
}

function callTawkLogout(
  tawk: TawkApi
): Promise<void> {
  return new Promise(
    (resolve) => {
      if (!tawk.logout) {
        resolve();
        return;
      }

      tawk.logout(
        (error) => {
          if (error) {
            console.warn(
              "[RewardHub Tawk] Logout warning:",
              error
            );
          }

          resolve();
        }
      );
    }
  );
}

function callTawkLogin(
  tawk: TawkApi,
  identity:
    RewardHubIdentity,
  auth: {
    userId: string;
    hash: string;
  }
): Promise<void> {
  return new Promise(
    (resolve, reject) => {
      if (!tawk.login) {
        reject(
          new Error(
            "Tawk secure login is unavailable."
          )
        );

        return;
      }

      const loginData: {
        hash: string;
        userId: string;
        name?: string;
        email?: string;
        phone?: string;
        [key: string]:
          | string
          | undefined;
      } = {
        hash: auth.hash,
        userId: auth.userId,
        name:
          identity.displayName,
        "account-type":
          identity.accountType,
        "account-id":
          identity.accountId,
        "display-name":
          identity.displayName,
      };

      if (identity.email) {
        loginData.email =
          identity.email;

        loginData[
          "account-email"
        ] = identity.email;
      }

      if (identity.phone) {
        loginData.phone =
          identity.phone;
      }

      if (
        identity.accountType ===
        "MEMBER"
      ) {
        loginData[
          "member-tier"
        ] =
          identity.tier ||
          "Silver";

        loginData[
          "business-name"
        ] = "-";
      }

      if (
        identity.accountType ===
        "MERCHANT"
      ) {
        loginData[
          "business-name"
        ] =
          identity.businessName ||
          identity.displayName ||
          identity.accountId;

        loginData[
          "member-tier"
        ] = "-";
      }

      tawk.login(
        loginData,
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        }
      );
    }
  );
}



function getStoredLanguage(): string {
  if (
    typeof window ===
    "undefined"
  ) {
    return "en";
  }

  const storedLanguage =
    window.localStorage.getItem(
      "rewardhub-language"
    ) ||
    window.localStorage.getItem(
      "rewardhub_language"
    ) ||
    "en";

  if (
    storedLanguage === "zh" ||
    storedLanguage === "ms"
  ) {
    return storedLanguage;
  }

  return "en";
}

function getCurrentPage(): string {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  return `${window.location.pathname}${window.location.search}`;
}

function buildTawkAttributes(
  identity:
    RewardHubIdentity,
  auth: {
    userId: string;
    hash: string;
  }
): Record<
  string,
  string
> {
  const attributes: Record<
    string,
    string
  > = {
    hash:
      auth.hash,

    name:
      identity.displayName,

    "account-type":
      identity.accountType,

    "account-id":
      identity.accountId,

    "display-name":
      identity.displayName,

    language:
      getStoredLanguage(),

    "current-page":
      getCurrentPage(),

    userID:
      auth.userId,

    "rewardhub-user-id":
      auth.userId,
  };

  if (identity.email) {
    attributes.email =
      identity.email;

    attributes[
      "account-email"
    ] =
      identity.email;
  }

  if (identity.phone) {
    attributes.phone =
      identity.phone;
  }

  if (
    identity.accountType ===
    "MEMBER"
  ) {
    attributes[
      "member-id"
    ] =
      identity.accountId;

    attributes[
      "member-tier"
    ] =
      identity.tier ||
      "Silver";

    attributes[
      "business-name"
    ] = "-";
  }

  if (
    identity.accountType ===
    "MERCHANT"
  ) {
    attributes[
      "merchant-id"
    ] =
      identity.accountId;

    attributes[
      "business-name"
    ] =
      identity.businessName ||
      identity.displayName ||
      identity.accountId;

    attributes[
      "member-tier"
    ] = "-";
  }

  return attributes;
}

function callTawkSetAttributes(
  tawk: TawkApi,
  identity:
    RewardHubIdentity,
  auth: {
    userId: string;
    hash: string;
  }
): Promise<void> {
  return new Promise(
    (resolve, reject) => {
      if (
        !tawk.setAttributes
      ) {
        reject(
          new Error(
            "Tawk setAttributes is unavailable."
          )
        );

        return;
      }

      const attributes =
        buildTawkAttributes(
          identity,
          auth
        );

      tawk.setAttributes(
        attributes,
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        }
      );
    }
  );
}


/* ============================================================
 * Support Center Types
 * ============================================================
 */

type SupportView =
  | "HOME"
  | "CHAT"
  | "FAQ";

type FaqItem = {
  category: string;
  question: string;
  answer: string;
};

type FaqTranslationItem = {
  categoryKey: string;
  questionKey: string;
  answerKey: string;
};

/* ============================================================
 * Support Center Content
 * ============================================================
 */

const MEMBER_FAQ_KEYS: FaqTranslationItem[] = [
  {
    categoryKey: "supportModal.faq.member.item01.category",
    questionKey: "supportModal.faq.member.item01.question",
    answerKey: "supportModal.faq.member.item01.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item02.category",
    questionKey: "supportModal.faq.member.item02.question",
    answerKey: "supportModal.faq.member.item02.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item03.category",
    questionKey: "supportModal.faq.member.item03.question",
    answerKey: "supportModal.faq.member.item03.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item04.category",
    questionKey: "supportModal.faq.member.item04.question",
    answerKey: "supportModal.faq.member.item04.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item05.category",
    questionKey: "supportModal.faq.member.item05.question",
    answerKey: "supportModal.faq.member.item05.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item06.category",
    questionKey: "supportModal.faq.member.item06.question",
    answerKey: "supportModal.faq.member.item06.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item07.category",
    questionKey: "supportModal.faq.member.item07.question",
    answerKey: "supportModal.faq.member.item07.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item08.category",
    questionKey: "supportModal.faq.member.item08.question",
    answerKey: "supportModal.faq.member.item08.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item09.category",
    questionKey: "supportModal.faq.member.item09.question",
    answerKey: "supportModal.faq.member.item09.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item10.category",
    questionKey: "supportModal.faq.member.item10.question",
    answerKey: "supportModal.faq.member.item10.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item11.category",
    questionKey: "supportModal.faq.member.item11.question",
    answerKey: "supportModal.faq.member.item11.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item12.category",
    questionKey: "supportModal.faq.member.item12.question",
    answerKey: "supportModal.faq.member.item12.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item13.category",
    questionKey: "supportModal.faq.member.item13.question",
    answerKey: "supportModal.faq.member.item13.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item14.category",
    questionKey: "supportModal.faq.member.item14.question",
    answerKey: "supportModal.faq.member.item14.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item15.category",
    questionKey: "supportModal.faq.member.item15.question",
    answerKey: "supportModal.faq.member.item15.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item16.category",
    questionKey: "supportModal.faq.member.item16.question",
    answerKey: "supportModal.faq.member.item16.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item17.category",
    questionKey: "supportModal.faq.member.item17.question",
    answerKey: "supportModal.faq.member.item17.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item18.category",
    questionKey: "supportModal.faq.member.item18.question",
    answerKey: "supportModal.faq.member.item18.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item19.category",
    questionKey: "supportModal.faq.member.item19.question",
    answerKey: "supportModal.faq.member.item19.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item20.category",
    questionKey: "supportModal.faq.member.item20.question",
    answerKey: "supportModal.faq.member.item20.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item21.category",
    questionKey: "supportModal.faq.member.item21.question",
    answerKey: "supportModal.faq.member.item21.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item22.category",
    questionKey: "supportModal.faq.member.item22.question",
    answerKey: "supportModal.faq.member.item22.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item23.category",
    questionKey: "supportModal.faq.member.item23.question",
    answerKey: "supportModal.faq.member.item23.answer",
  },
  {
    categoryKey: "supportModal.faq.member.item24.category",
    questionKey: "supportModal.faq.member.item24.question",
    answerKey: "supportModal.faq.member.item24.answer",
  },
];

const MERCHANT_FAQ_KEYS: FaqTranslationItem[] = [
  {
    categoryKey: "supportModal.faq.merchant.item01.category",
    questionKey: "supportModal.faq.merchant.item01.question",
    answerKey: "supportModal.faq.merchant.item01.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item02.category",
    questionKey: "supportModal.faq.merchant.item02.question",
    answerKey: "supportModal.faq.merchant.item02.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item03.category",
    questionKey: "supportModal.faq.merchant.item03.question",
    answerKey: "supportModal.faq.merchant.item03.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item04.category",
    questionKey: "supportModal.faq.merchant.item04.question",
    answerKey: "supportModal.faq.merchant.item04.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item05.category",
    questionKey: "supportModal.faq.merchant.item05.question",
    answerKey: "supportModal.faq.merchant.item05.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item06.category",
    questionKey: "supportModal.faq.merchant.item06.question",
    answerKey: "supportModal.faq.merchant.item06.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item07.category",
    questionKey: "supportModal.faq.merchant.item07.question",
    answerKey: "supportModal.faq.merchant.item07.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item08.category",
    questionKey: "supportModal.faq.merchant.item08.question",
    answerKey: "supportModal.faq.merchant.item08.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item09.category",
    questionKey: "supportModal.faq.merchant.item09.question",
    answerKey: "supportModal.faq.merchant.item09.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item10.category",
    questionKey: "supportModal.faq.merchant.item10.question",
    answerKey: "supportModal.faq.merchant.item10.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item11.category",
    questionKey: "supportModal.faq.merchant.item11.question",
    answerKey: "supportModal.faq.merchant.item11.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item12.category",
    questionKey: "supportModal.faq.merchant.item12.question",
    answerKey: "supportModal.faq.merchant.item12.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item13.category",
    questionKey: "supportModal.faq.merchant.item13.question",
    answerKey: "supportModal.faq.merchant.item13.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item14.category",
    questionKey: "supportModal.faq.merchant.item14.question",
    answerKey: "supportModal.faq.merchant.item14.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item15.category",
    questionKey: "supportModal.faq.merchant.item15.question",
    answerKey: "supportModal.faq.merchant.item15.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item16.category",
    questionKey: "supportModal.faq.merchant.item16.question",
    answerKey: "supportModal.faq.merchant.item16.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item17.category",
    questionKey: "supportModal.faq.merchant.item17.question",
    answerKey: "supportModal.faq.merchant.item17.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item18.category",
    questionKey: "supportModal.faq.merchant.item18.question",
    answerKey: "supportModal.faq.merchant.item18.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item19.category",
    questionKey: "supportModal.faq.merchant.item19.question",
    answerKey: "supportModal.faq.merchant.item19.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item20.category",
    questionKey: "supportModal.faq.merchant.item20.question",
    answerKey: "supportModal.faq.merchant.item20.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item21.category",
    questionKey: "supportModal.faq.merchant.item21.question",
    answerKey: "supportModal.faq.merchant.item21.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item22.category",
    questionKey: "supportModal.faq.merchant.item22.question",
    answerKey: "supportModal.faq.merchant.item22.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item23.category",
    questionKey: "supportModal.faq.merchant.item23.question",
    answerKey: "supportModal.faq.merchant.item23.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item24.category",
    questionKey: "supportModal.faq.merchant.item24.question",
    answerKey: "supportModal.faq.merchant.item24.answer",
  },
  {
    categoryKey: "supportModal.faq.merchant.item25.category",
    questionKey: "supportModal.faq.merchant.item25.question",
    answerKey: "supportModal.faq.merchant.item25.answer",
  },
];

const GUEST_FAQ_KEYS: FaqTranslationItem[] = [
  {
    categoryKey: "supportModal.faq.guest.item01.category",
    questionKey: "supportModal.faq.guest.item01.question",
    answerKey: "supportModal.faq.guest.item01.answer",
  },
  {
    categoryKey: "supportModal.faq.guest.item02.category",
    questionKey: "supportModal.faq.guest.item02.question",
    answerKey: "supportModal.faq.guest.item02.answer",
  },
  {
    categoryKey: "supportModal.faq.guest.item03.category",
    questionKey: "supportModal.faq.guest.item03.question",
    answerKey: "supportModal.faq.guest.item03.answer",
  },
  {
    categoryKey: "supportModal.faq.guest.item04.category",
    questionKey: "supportModal.faq.guest.item04.question",
    answerKey: "supportModal.faq.guest.item04.answer",
  },
  {
    categoryKey: "supportModal.faq.guest.item05.category",
    questionKey: "supportModal.faq.guest.item05.question",
    answerKey: "supportModal.faq.guest.item05.answer",
  },
  {
    categoryKey: "supportModal.faq.guest.item06.category",
    questionKey: "supportModal.faq.guest.item06.question",
    answerKey: "supportModal.faq.guest.item06.answer",
  },
  {
    categoryKey: "supportModal.faq.guest.item07.category",
    questionKey: "supportModal.faq.guest.item07.question",
    answerKey: "supportModal.faq.guest.item07.answer",
  },
  {
    categoryKey: "supportModal.faq.guest.item08.category",
    questionKey: "supportModal.faq.guest.item08.question",
    answerKey: "supportModal.faq.guest.item08.answer",
  },
];

function translateFaqItems(
  items: FaqTranslationItem[],
  t: (key: string, variables?: Record<string, string | number>) => string
): FaqItem[] {
  return items.map((item) => ({
    category: t(item.categoryKey),
    question: t(item.questionKey),
    answer: t(item.answerKey),
  }));
}

/* ============================================================
 * Small UI Helpers
 * ============================================================
 */

function getGreetingName(
  identity: RewardHubIdentity,
  t: (key: string, variables?: Record<string, string | number>) => string
): string {
  if (
    identity.accountType ===
    "GUEST"
  ) {
    return t("supportModal.greetingGuest");
  }

  return (
    identity.displayName ||
    identity.accountId
  );
}

function getTierLabel(
  tier: string,
  t: (key: string, variables?: Record<string, string | number>) => string
): string {
  const normalized =
    cleanValue(tier).toUpperCase();

  if (normalized === "GOLD") {
    return t("supportModal.tiers.gold");
  }

  if (normalized === "PLATINUM") {
    return t("supportModal.tiers.platinum");
  }

  return t("supportModal.tiers.silver");
}

function getIdentityLabel(
  identity: RewardHubIdentity,
  t: (key: string, variables?: Record<string, string | number>) => string
): string {
  if (
    identity.accountType ===
    "MEMBER"
  ) {
    return t(
      "supportModal.memberLabel",
      {
        tier: getTierLabel(
          identity.tier ||
            "Silver",
          t
        ),
      }
    );
  }

  if (
    identity.accountType ===
    "MERCHANT"
  ) {
    return t(
      "supportModal.rewardHubMerchant"
    );
  }

  return t(
    "supportModal.rewardHubVisitor"
  );
}

function getFaqItems(
  identity: RewardHubIdentity,
  t: (key: string, variables?: Record<string, string | number>) => string
): FaqItem[] {
  if (
    identity.accountType ===
    "MEMBER"
  ) {
    return translateFaqItems(
      MEMBER_FAQ_KEYS,
      t
    );
  }

  if (
    identity.accountType ===
    "MERCHANT"
  ) {
    return translateFaqItems(
      MERCHANT_FAQ_KEYS,
      t
    );
  }

  return translateFaqItems(
    GUEST_FAQ_KEYS,
    t
  );
}

/* ============================================================
 * Support Modal
 * ============================================================
 */

export default function SupportModal() {
  const { t } = useLanguage();

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    activeView,
    setActiveView,
  ] =
    useState<SupportView>(
      "HOME"
    );

  const [
    shouldLoadWidget,
    setShouldLoadWidget,
  ] =
    useState(false);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    loadError,
    setLoadError,
  ] =
    useState("");

  const [
    openFaqIndex,
    setOpenFaqIndex,
  ] =
    useState<number | null>(
      null
    );

  /*
   * IMPORTANT:
   *
   * The first render must be identical on the server and browser.
   * Do not read localStorage inside the useState initializer,
   * otherwise Next.js renders "there" on the server but the member
   * name in the browser, causing a hydration mismatch.
   *
   * The real identity is loaded when the support modal opens and
   * again before Tawk Secure Login.
   */
  const initialIdentity:
    RewardHubIdentity = {
    accountType:
      "GUEST",

    accountId: "",

    displayName:
      "RewardHub Visitor",

    email: "",
    phone: "",
    tier: "",
    businessName: "",
  };

  const [
    identity,
    setIdentity,
  ] =
    useState<RewardHubIdentity>(
      initialIdentity
    );

  const widgetLoadedRef =
    useRef(false);

  const identityRef =
    useRef<
      RewardHubIdentity
    >(
      initialIdentity
    );

  /* ==========================================================
   * Securely connect the current RewardHub identity
   * ==========================================================
   */

  const syncIdentityToTawk =
    useCallback(async () => {
      const tawk =
        window.Tawk_API;

      if (
        !tawk ||
        !tawk.login ||
        !tawk.setAttributes
      ) {
        console.warn(
          "[RewardHub Tawk] API is not ready yet."
        );

        return;
      }

      const currentIdentity =
        getCurrentIdentity();

      identityRef.current =
        currentIdentity;

      setIdentity(
        currentIdentity
      );

      const currentIdentityKey =
        getIdentitySessionKey(
          currentIdentity
        );

      const previousIdentityKey =
        window.sessionStorage.getItem(
          TAWK_IDENTITY_KEY
        ) || "";

      if (
        currentIdentity.accountType ===
          "GUEST" ||
        !currentIdentity.accountId
      ) {
        if (
          previousIdentityKey &&
          previousIdentityKey !==
            "GUEST"
        ) {
          await callTawkLogout(
            tawk
          );
        }

        window.sessionStorage.setItem(
          TAWK_IDENTITY_KEY,
          "GUEST"
        );

        console.log(
          "[RewardHub Tawk] Guest support session active."
        );

        return;
      }

      const auth =
        await getTawkSecureAuth(
          currentIdentity
        );

      if (
        !auth.success ||
        !auth.userId ||
        !auth.hash
      ) {
        console.error(
          "[RewardHub Tawk] Secure authentication failed:",
          auth.message
        );

        return;
      }

      const identityChanged =
        previousIdentityKey !==
        currentIdentityKey;

      try {
        /*
         * Only log out when the actual RewardHub account changed.
         * Do not log out whenever the same member opens chat again,
         * because that can break or replace an existing conversation.
         */
        if (
          identityChanged &&
          previousIdentityKey &&
          previousIdentityKey !==
            "GUEST"
        ) {
          await callTawkLogout(
            tawk
          );
        }

        const secureIdentity = {
          userId:
            auth.userId,
          hash:
            auth.hash,
        };

        /*
         * Always call login(), even when sessionStorage says this is
         * the same member or merchant.
         *
         * Tawk documents that login() refreshes and reconnects the
         * visitor session. This is important for an iOS Home Screen PWA,
         * whose WebView may resume while retaining stale sessionStorage
         * but losing the authenticated Tawk connection.
         */
        await callTawkLogin(
          tawk,
          currentIdentity,
          secureIdentity
        );

        /*
         * Send all RewardHub attributes after the authenticated
         * Tawk session has been refreshed.
         */
        await callTawkSetAttributes(
          tawk,
          currentIdentity,
          secureIdentity
        );

        /*
         * The refreshed Tawk connection can take a few seconds to
         * propagate. Send the attributes again after short delays.
         */
        window.setTimeout(
          () => {
            const latestTawk =
              window.Tawk_API;

            if (
              !latestTawk
                ?.setAttributes
            ) {
              return;
            }

            void callTawkSetAttributes(
              latestTawk,
              getCurrentIdentity(),
              secureIdentity
            ).catch(
              (error) => {
                console.error(
                  "[RewardHub Tawk] Delayed attribute sync failed (1s):",
                  error
                );
              }
            );
          },
          1000
        );

        window.setTimeout(
          () => {
            const latestTawk =
              window.Tawk_API;

            if (
              !latestTawk
                ?.setAttributes
            ) {
              return;
            }

            void callTawkSetAttributes(
              latestTawk,
              getCurrentIdentity(),
              secureIdentity
            ).catch(
              (error) => {
                console.error(
                  "[RewardHub Tawk] Delayed attribute sync failed (3s):",
                  error
                );
              }
            );
          },
          3000
        );

        window.sessionStorage.setItem(
          TAWK_IDENTITY_KEY,
          currentIdentityKey
        );

        console.log(
          "[RewardHub Tawk] Identity login and attributes connected:",
          {
            accountType:
              currentIdentity
                .accountType,

            accountId:
              currentIdentity
                .accountId,

            displayName:
              currentIdentity
                .displayName,

            email:
              currentIdentity
                .email,

            currentPage:
              getCurrentPage(),

            language:
              getStoredLanguage(),

            identityChanged,
          }
        );
      } catch (error) {
        console.error(
          "[RewardHub Tawk] Identity sync failed:",
          error
        );
      }
    }, []);

  /* ==========================================================
   * Open / close / navigation
   * ==========================================================
   */

  const openSupport =
    useCallback(() => {
      const currentIdentity =
        getCurrentIdentity();

      identityRef.current =
        currentIdentity;

      setIdentity(
        currentIdentity
      );

      setLoadError("");
      setOpenFaqIndex(null);
      setActiveView("HOME");
      setIsOpen(true);
    }, []);

  const closeSupport =
    useCallback(() => {
      setIsOpen(false);
    }, []);

  const openLiveChat =
    useCallback(() => {
      setLoadError("");
      setActiveView("CHAT");
      setShouldLoadWidget(
        true
      );

      if (
        widgetLoadedRef.current
      ) {
        setIsLoading(false);

        window.setTimeout(
          () => {
            void syncIdentityToTawk();
          },
          50
        );
      } else {
        setIsLoading(true);
      }
    }, [
      syncIdentityToTawk,
    ]);

  const goBack =
    useCallback(() => {
      setOpenFaqIndex(null);
      setActiveView("HOME");
    }, []);

  /* ==========================================================
   * Global support button event
   * ==========================================================
   */

  useEffect(() => {
    window.addEventListener(
      "rewardhub-open-support",
      openSupport
    );

    return () => {
      window.removeEventListener(
        "rewardhub-open-support",
        openSupport
      );
    };
  }, [openSupport]);

  /* ==========================================================
   * Body lock / Escape
   * ==========================================================
   */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape"
      ) {
        if (
          activeView !==
          "HOME"
        ) {
          goBack();
        } else {
          closeSupport();
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    activeView,
    closeSupport,
    goBack,
    isOpen,
  ]);

  /* ==========================================================
   * Initialize Tawk Embed Widget only when chat is opened
   * ==========================================================
   */

  useEffect(() => {
    if (
      !shouldLoadWidget
    ) {
      return;
    }

    if (
      widgetLoadedRef.current
    ) {
      void syncIdentityToTawk();
      setIsLoading(false);

      return;
    }

    const existingScript =
      document.getElementById(
        TAWK_SCRIPT_ID
      ) as HTMLScriptElement | null;

    window.Tawk_API =
      window.Tawk_API || {};

    window.Tawk_LoadStart =
      new Date();

    window.Tawk_API.embedded =
      TAWK_CONTAINER_ID;

    window.Tawk_API.onLoad =
      () => {
        widgetLoadedRef.current =
          true;

        setIsLoading(false);
        setLoadError("");

        void syncIdentityToTawk();
      };

    if (existingScript) {
      return;
    }

    const script =
      document.createElement(
        "script"
      );

    script.id =
      TAWK_SCRIPT_ID;

    script.async = true;
    script.src =
      TAWK_SCRIPT_URL;
    script.charset =
      "UTF-8";
    script.crossOrigin =
      "anonymous";

    script.onerror =
      () => {
        setIsLoading(false);

        setLoadError(
          t("supportModal.loadError")
        );
      };

    document.head.appendChild(
      script
    );
  }, [
    shouldLoadWidget,
    syncIdentityToTawk,
    t,
  ]);

  const faqItems =
    getFaqItems(
      identity,
      t
    );

  /* ==========================================================
   * Render
   * ==========================================================
   */

  return (
    <div
      className={[
        "fixed inset-0 z-[99999]",
        "flex items-end justify-center",
        "bg-slate-950/55",
        "backdrop-blur-md",
        "transition-all duration-200",
        "sm:items-center",
        "sm:p-5",

        isOpen
          ? "visible pointer-events-auto opacity-100"
          : "invisible pointer-events-none opacity-0",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-label={t("supportModal.aria.supportCenter")}
      aria-hidden={
        !isOpen
      }
    >
      <button
        type="button"
        aria-label={t("supportModal.aria.closeSupport")}
        onClick={
          closeSupport
        }
        className="absolute inset-0 cursor-default"
      />

      <section
        className={[
          "relative z-10",
          "flex h-[94dvh] w-full",
          "flex-col overflow-hidden",
          "rounded-t-[30px]",
          "border border-white/20",
          "bg-[#f5f7fb]",
          "shadow-[0_30px_90px_rgba(2,6,23,0.38)]",
          "transition-all duration-200",
          "sm:h-[min(790px,90vh)]",
          "sm:max-w-[480px]",
          "sm:rounded-[30px]",

          isOpen
            ? "translate-y-0 scale-100"
            : "translate-y-4 scale-[0.97]",
        ].join(" ")}
      >
        {/* RewardHub branded header */}
        <header
          className="
            relative shrink-0 overflow-hidden
            border-b border-white/10
            bg-gradient-to-br
            from-[#050816]
            via-[#090f24]
            to-[#151d38]
            px-5 py-4
            text-white
          "
        >
          <div
            className="
              pointer-events-none
              absolute -right-14 -top-20
              h-40 w-40 rounded-full
              bg-amber-400/10 blur-3xl
            "
          />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {activeView ===
              "FAQ" ? (
                <button
                  type="button"
                  onClick={
                    goBack
                  }
                  aria-label={t("supportModal.aria.backHome")}
                  className="
                    inline-flex h-10 w-10
                    shrink-0 items-center justify-center
                    rounded-2xl
                    border border-white/10
                    bg-white/10
                    text-white
                    transition
                    hover:bg-white/15
                    active:scale-95
                  "
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : (
                <div
                  className="
                    flex h-12 w-12
                    shrink-0 items-center justify-center
                    overflow-hidden rounded-2xl
                    border border-white/15
                    bg-white
                    p-1.5
                    shadow-lg
                  "
                >
                  <img
                    src="/rewardhub-logo.png"
                    alt="RewardHub"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-black">
                    {activeView ===
                    "CHAT"
                      ? t("supportModal.liveSupport")
                      : activeView ===
                          "FAQ"
                        ? t("supportModal.helpFaq")
                        : t("supportModal.customerSupport")}
                  </h2>

                  <span
                    className="
                      inline-flex shrink-0
                      items-center gap-1.5
                      rounded-full
                      border border-emerald-400/20
                      bg-emerald-400/10
                      px-2 py-1
                      text-[9px] font-black
                      uppercase tracking-[0.12em]
                      text-emerald-300
                    "
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {t("supportModal.online")}
                  </span>
                </div>

                <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                  {t("supportModal.supportTeam")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                closeSupport
              }
              aria-label={t("supportModal.aria.closeSupport")}
              title={t("supportModal.close")}
              className="
                inline-flex h-10 w-10
                shrink-0 items-center justify-center
                rounded-2xl
                border border-white/10
                bg-white/10
                text-white
                transition duration-200
                hover:rotate-90
                hover:border-red-400/30
                hover:bg-red-400/15
                hover:text-red-200
                active:scale-95
              "
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Support content */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {/* Home */}
          <div
            className={[
              "absolute inset-0",
              "overflow-y-auto",
              "px-5 py-5",
              "transition-all duration-200",

              activeView ===
              "HOME"
                ? "z-20 translate-x-0 opacity-100"
                : "z-0 -translate-x-5 pointer-events-none opacity-0",
            ].join(" ")}
          >
            <section
              className="
                relative overflow-hidden
                rounded-[26px]
                bg-gradient-to-br
                from-[#070b1b]
                via-[#0c132a]
                to-[#151f3d]
                p-5 text-white
                shadow-xl
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute -right-10 -top-14
                  h-36 w-36 rounded-full
                  bg-amber-400/15 blur-3xl
                "
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
                      {t("supportModal.rewardHubSupport")}
                    </p>

                    <h3 className="mt-2 truncate text-2xl font-black">
                      {t("supportModal.hi")}{" "}
                      {getGreetingName(
                        identity,
                        t
                      )}{" "}
                      <span aria-hidden="true">
                        👋
                      </span>
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-slate-300">
                      {t("supportModal.howCanWeHelp")}
                    </p>
                  </div>

                  <div
                    className="
                      flex h-12 w-12
                      shrink-0 items-center justify-center
                      rounded-2xl
                      bg-amber-400
                      text-slate-950
                      shadow-lg
                    "
                  >
                    {identity.accountType ===
                    "MERCHANT" ? (
                      <Store className="h-5 w-5" />
                    ) : identity.accountType ===
                      "MEMBER" ? (
                      <UserRound className="h-5 w-5" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                  </div>
                </div>

                <div
                  className="
                    mt-5 flex items-center
                    justify-between gap-3
                    rounded-2xl
                    border border-white/10
                    bg-white/[0.07]
                    px-4 py-3
                  "
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">
                      {getIdentityLabel(
                        identity,
                        t
                      )}
                    </p>

                    <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                      {identity.accountId ||
                        t("supportModal.generalSupport")}
                    </p>
                  </div>

                  <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
                </div>
              </div>
            </section>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={
                  openLiveChat
                }
                className="
                  group flex w-full
                  items-center gap-4
                  rounded-[22px]
                  border border-slate-200
                  bg-white p-4
                  text-left
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:border-amber-300
                  hover:shadow-lg
                  active:translate-y-0
                "
              >
                <div
                  className="
                    flex h-12 w-12
                    shrink-0 items-center justify-center
                    rounded-2xl
                    bg-amber-400
                    text-slate-950
                  "
                >
                  <MessageCircleMore className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950">
                    {t("supportModal.startLiveChat")}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {t("supportModal.chatDescription")}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-amber-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenFaqIndex(
                    null
                  );
                  setActiveView(
                    "FAQ"
                  );
                }}
                className="
                  group flex w-full
                  items-center gap-4
                  rounded-[22px]
                  border border-slate-200
                  bg-white p-4
                  text-left
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:border-blue-200
                  hover:shadow-lg
                  active:translate-y-0
                "
              >
                <div
                  className="
                    flex h-12 w-12
                    shrink-0 items-center justify-center
                    rounded-2xl
                    bg-blue-50
                    text-blue-600
                  "
                >
                  <CircleHelp className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950">
                    {t("supportModal.helpFaq")}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {t("supportModal.faqDescription")}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
              </button>

            </div>

            <div
              className="
                mt-5 flex items-center gap-3
                rounded-[20px]
                border border-emerald-200/80
                bg-emerald-50
                px-4 py-3.5
              "
            >
              <div
                className="
                  flex h-10 w-10
                  shrink-0 items-center justify-center
                  rounded-2xl bg-white
                  text-emerald-600
                  shadow-sm
                "
              >
                <Clock3 className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black text-emerald-900">
                  {t("supportModal.fastSupport")}
                </p>

                <p className="mt-1 text-[11px] font-semibold leading-5 text-emerald-800/75">
                  {t("supportModal.accountConnectedDescription")}
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div
            className={[
              "absolute inset-0",
              "overflow-y-auto",
              "px-5 py-5",
              "transition-all duration-200",

              activeView ===
              "FAQ"
                ? "z-20 translate-x-0 opacity-100"
                : "z-0 translate-x-5 pointer-events-none opacity-0",
            ].join(" ")}
          >
            <div
              className="
                rounded-[24px]
                border border-slate-200
                bg-white p-5
                shadow-sm
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex h-11 w-11
                    shrink-0 items-center justify-center
                    rounded-2xl
                    bg-blue-50
                    text-blue-600
                  "
                >
                  <CircleHelp className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    {t("supportModal.frequentlyAskedQuestions")}
                  </h3>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {t("supportModal.faqIntro")}
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600">
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {t("supportModal.supportTopics", { count: faqItems.length })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {faqItems.map(
                (
                  item,
                  index
                ) => {
                  const isExpanded =
                    openFaqIndex ===
                    index;

                  return (
                    <div
                      key={
                        item.question
                      }
                      className="
                        overflow-hidden
                        rounded-[20px]
                        border border-slate-200
                        bg-white
                        shadow-sm
                      "
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaqIndex(
                            isExpanded
                              ? null
                              : index
                          )
                        }
                        className="
                          flex w-full
                          items-center
                          justify-between gap-4
                          px-4 py-4
                          text-left
                        "
                      >
                        <span className="min-w-0">
                          <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                            {item.category}
                          </span>

                          <span className="mt-1 block text-sm font-black leading-5 text-slate-900">
                            {item.question}
                          </span>
                        </span>

                        <ChevronRight
                          className={[
                            "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",

                            isExpanded
                              ? "rotate-90"
                              : "",
                          ].join(
                            " "
                          )}
                        />
                      </button>

                      <div
                        className={[
                          "grid transition-all duration-200",

                          isExpanded
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]",
                        ].join(
                          " "
                        )}
                      >
                        <div className="overflow-hidden">
                          <p className="border-t border-slate-100 px-4 py-4 text-xs font-semibold leading-6 text-slate-600">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <button
              type="button"
              onClick={
                openLiveChat
              }
              className="
                mt-5 inline-flex w-full
                items-center justify-center gap-2
                rounded-2xl
                bg-slate-950
                px-5 py-4
                text-sm font-black
                text-white
                shadow-lg
                transition
                hover:bg-slate-800
                active:scale-[0.99]
              "
            >
              <Headphones className="h-4 w-4" />
              {t("supportModal.stillNeedHelp")}
            </button>
          </div>

          {/* Tawk chat */}
          <div
            /*
             * Tawk renders an iframe inside this container.
             * An iframe may continue intercepting clicks even when its
             * parent only has opacity: 0 or pointer-events: none.
             *
             * Use display: none whenever Live Chat is not the active
             * screen. This keeps the loaded chat session in the DOM,
             * but completely removes it from hit testing so Home and
             * FAQ buttons remain clickable after returning from chat.
             */
            style={{
              display:
                activeView ===
                "CHAT"
                  ? "block"
                  : "none",
            }}
            className="
              absolute inset-0
              z-30
              bg-white
            "
          >
            {isLoading ? (
              <div
                className="
                  absolute inset-0 z-20
                  flex flex-col
                  items-center justify-center
                  bg-white px-8
                  text-center
                "
              >
                <div
                  className="
                    flex h-16 w-16
                    items-center justify-center
                    overflow-hidden rounded-[22px]
                    border border-slate-200
                    bg-white p-2
                    shadow-lg
                  "
                >
                  <img
                    src="/rewardhub-logo.png"
                    alt="RewardHub"
                    className="h-full w-full object-contain"
                  />
                </div>

                <LoaderCircle className="mt-5 h-6 w-6 animate-spin text-amber-500" />

                <p className="mt-3 text-sm font-black text-slate-900">
                  {t("supportModal.connecting")}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {t("supportModal.securingSession")}
                </p>
              </div>
            ) : null}

            {loadError ? (
              <div
                className="
                  absolute inset-0 z-30
                  flex flex-col
                  items-center justify-center
                  bg-white px-8
                  text-center
                "
              >
                <div
                  className="
                    flex h-12 w-12
                    items-center justify-center
                    rounded-2xl
                    bg-red-50
                    text-xl font-black
                    text-red-600
                  "
                >
                  !
                </div>

                <p className="mt-4 text-sm font-black text-slate-900">
                  {t("supportModal.supportUnavailable")}
                </p>

                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  {loadError}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setLoadError("");
                    setIsLoading(true);

                    const failedScript =
                      document.getElementById(
                        TAWK_SCRIPT_ID
                      );

                    failedScript?.remove();

                    widgetLoadedRef.current =
                      false;

                    setShouldLoadWidget(
                      false
                    );

                    window.setTimeout(
                      () => {
                        setShouldLoadWidget(
                          true
                        );
                      },
                      50
                    );
                  }}
                  className="
                    mt-5 rounded-2xl
                    bg-slate-950
                    px-5 py-3
                    text-xs font-black
                    text-white
                  "
                >
                  {t("supportModal.tryAgain")}
                </button>
              </div>
            ) : null}

            {shouldLoadWidget ? (
              <div
                id={
                  TAWK_CONTAINER_ID
                }
                className="h-full w-full"
              />
            ) : null}
          </div>
        </div>

        {/* RewardHub safety footer */}
        <footer
          className="
            shrink-0
            border-t border-slate-200
            bg-white
            px-5 py-3
          "
        >
          <div className="flex items-center justify-center gap-2">
            <LockKeyhole className="h-3.5 w-3.5 text-emerald-600" />

            <p className="text-center text-[10px] font-semibold text-slate-500">
              {t("supportModal.footerConnected")}
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
}