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

/* ============================================================
 * Support Center Content
 * ============================================================
 */

const MEMBER_FAQS: FaqItem[] = [
  {
    category: "Account",
    question:
      "How do I log in to my Member Portal?",
    answer:
      "Use the email address or Member ID registered to your RewardHub account together with your password. If you cannot remember the password, select Forgot Password from the login page.",
  },
  {
    category: "Account",
    question:
      "What should I do if I forgot my password?",
    answer:
      "Select Forgot Password on the Member Login page, request the verification code and follow the instructions to create a new password. Never share the verification code with another person.",
  },
  {
    category: "Account",
    question:
      "How do I update my name, phone number or profile information?",
    answer:
      "Open Profile inside the Member Portal and update the fields currently available for editing. For information that cannot be changed directly, start a live chat so the support team can verify the request.",
  },
  {
    category: "Account",
    question:
      "Why is my member account inactive or suspended?",
    answer:
      "An account may be restricted when verification is incomplete, unusual activity is detected or RewardHub account rules are breached. Start a live chat from the affected account for a status review.",
  },
  {
    category: "Membership Tier",
    question:
      "What are Silver, Gold and Platinum tiers?",
    answer:
      "Silver is the default membership tier. Gold is unlocked when eligible accumulated spending reaches RM5,000, and Platinum is unlocked at RM15,000. These are lifetime tiers and do not downgrade after being achieved.",
  },
  {
    category: "Membership Tier",
    question:
      "Why has my membership tier not upgraded yet?",
    answer:
      "Only completed and eligible RewardHub transactions count toward accumulated spending. Check that the latest transaction is completed and refresh the dashboard. Contact support if the total is correct but the tier has not updated.",
  },
  {
    category: "Rewards",
    question:
      "What are Reward Credits?",
    answer:
      "Reward Credits are the available referral commission balance credited to your RewardHub account. They are not the same as cashback and are not a cash wallet.",
  },
  {
    category: "Rewards",
    question:
      "How can I use Reward Credits?",
    answer:
      "When a participating merchant allows Reward Credit redemption, enter the amount during the RewardHub payment flow. The amount cannot exceed your available balance or the redemption limit set for that transaction.",
  },
  {
    category: "Rewards",
    question:
      "Why can I not use all of my Reward Credits?",
    answer:
      "The redeemable amount may be limited by your available balance, the transaction value, the merchant setting or the maximum allowed for that payment. The payment screen will show the valid amount.",
  },
  {
    category: "Points",
    question:
      "How are RewardHub points calculated?",
    answer:
      "Eligible spending earns 1 point for every RM1 recorded through the RewardHub transaction flow. Cancelled, failed or ineligible transactions do not earn points.",
  },
  {
    category: "Points",
    question:
      "Where can I see my points history?",
    answer:
      "Open Points in the Member Portal to view your current points, total earned, total redeemed and recent point activity.",
  },
  {
    category: "Cashback",
    question:
      "How does member cashback work?",
    answer:
      "Cashback is applied as an instant discount during an eligible merchant payment. It is not stored as a separate wallet balance. The rate depends on your membership tier and the merchant's active marketing settings.",
  },
  {
    category: "Cashback",
    question:
      "What cashback rate does each tier receive?",
    answer:
      "The standard RewardHub rates are Silver 1.5%, Gold 2% and Platinum 3%, subject to the participating merchant's eligible RewardHub payment and active marketing configuration.",
  },
  {
    category: "Payment",
    question:
      "How do I pay at a RewardHub merchant?",
    answer:
      "Show your member QR code or member card to the merchant. The merchant enters the payment amount, applies any eligible Reward Credits and completes the transaction after receiving payment through the merchant's accepted payment method.",
  },
  {
    category: "Payment",
    question:
      "Does RewardHub hold or process my payment money?",
    answer:
      "In the current RewardHub version, payment is made directly to the merchant. RewardHub records the eligible transaction, discount, points and referral rewards but does not hold the customer's payment funds.",
  },
  {
    category: "Transactions",
    question:
      "Why is my transaction not showing?",
    answer:
      "Confirm that the merchant completed the RewardHub collection flow and that the transaction was not left pending. Refresh the Transactions page. If it is still missing, provide the merchant name, amount and approximate time through live chat.",
  },
  {
    category: "Transactions",
    question:
      "Why is the transaction amount different from what I paid?",
    answer:
      "The RewardHub record may show the original amount, Reward Credit redemption, cashback discount and final payable amount separately. Open the transaction details and compare each field before contacting support.",
  },
  {
    category: "Referrals",
    question:
      "How do I invite another member?",
    answer:
      "Open the Referral or Commission section in the Member Portal, copy your personal invitation link and share it with the new member. The referral must be recorded during registration to connect correctly.",
  },
  {
    category: "Referrals",
    question:
      "How are referral commissions calculated?",
    answer:
      "Eligible merchant marketing allocation may generate three referral levels: Level 1 at 10%, Level 2 at 8% and Level 3 at 6% of the allocated referral portion. The actual credited amount depends on the eligible transaction calculation.",
  },
  {
    category: "Referrals",
    question:
      "Why did I not receive a referral commission?",
    answer:
      "The referred account must be correctly linked, the merchant transaction must be eligible and completed, and the referral chain must exist at the time of processing. Check Referral History and contact support with the transaction reference if needed.",
  },
  {
    category: "Merchant Discovery",
    question:
      "How do I find participating merchants?",
    answer:
      "Use Marketplace to browse participating merchants, search by keyword or category, view merchant details and save favourite merchants for easier access.",
  },
  {
    category: "Merchant Discovery",
    question:
      "How do favourites and merchant reviews work?",
    answer:
      "You can save participating merchants to your favourites list. Where reviews are enabled, eligible members can view merchant ratings and review information from the merchant detail page.",
  },
  {
    category: "Member Card",
    question:
      "How do I apply for or replace a RewardHub member card?",
    answer:
      "Open the Member Card section and follow the application or replacement steps shown for your account. Application status and any required receipt upload are displayed in the same area.",
  },
  {
    category: "Security",
    question:
      "How is my support identity recognized automatically?",
    answer:
      "When you open Live Chat while logged in, RewardHub securely sends your verified account type and account ID to the support system so the team can identify the correct account without asking you to type the details again.",
  },
];

const MERCHANT_FAQS: FaqItem[] = [
  {
    category: "Account",
    question:
      "How do I log in to the Merchant Portal?",
    answer:
      "Use the merchant login email and password registered for the business. If the account is already stored in the browser, the login page may redirect directly to the Merchant Dashboard.",
  },
  {
    category: "Account",
    question:
      "What should I do if I forgot the merchant password?",
    answer:
      "Select Forgot Password from the Merchant Login page, complete the verification process and set a new password. Contact support if the registered email is no longer accessible.",
  },
  {
    category: "Account",
    question:
      "Why is my merchant registration still pending?",
    answer:
      "Merchant registrations may require business information review before activation. Confirm that all required details were submitted and use live chat if the application remains pending longer than expected.",
  },
  {
    category: "Profile",
    question:
      "How do I update business details, logo or banner?",
    answer:
      "Open Merchant Profile to update supported business information. Logo, banner and gallery management are available in their corresponding profile or media sections.",
  },
  {
    category: "Profile",
    question:
      "How do merchant gallery images work?",
    answer:
      "The gallery allows the merchant to upload, update and remove business images shown in RewardHub merchant-facing listings. Use clear images that accurately represent the business.",
  },
  {
    category: "Marketing Budget",
    question:
      "What is the RewardHub marketing budget?",
    answer:
      "The marketing budget is the percentage allocated by the merchant for eligible RewardHub member sales. It funds member cashback, referral rewards and the platform allocation according to the transaction rules.",
  },
  {
    category: "Marketing Budget",
    question:
      "What is the minimum marketing budget?",
    answer:
      "The RewardHub merchant marketing budget must be at least 5%. A merchant may choose a higher percentage based on its promotion and customer acquisition strategy.",
  },
  {
    category: "Marketing Budget",
    question:
      "How do I change my marketing budget?",
    answer:
      "Open Marketing in the Merchant Portal, enter the new valid percentage and save the setting. The updated rate applies according to the effective settings used when new transactions are created.",
  },
  {
    category: "Marketing Budget",
    question:
      "What is a temporary budget boost?",
    answer:
      "A budget boost allows a merchant to increase the marketing percentage for a selected promotional period. After the boost ends or is cancelled, the standard budget setting resumes.",
  },
  {
    category: "Collect Payment",
    question:
      "How do I collect payment from a RewardHub member?",
    answer:
      "Open Collect Payment, scan or enter the member identification, enter the sale amount and payment method, review any Reward Credit redemption and confirm only after the merchant has received payment.",
  },
  {
    category: "Collect Payment",
    question:
      "Does RewardHub receive the customer's payment money?",
    answer:
      "No. In the current version, customers pay the merchant directly using the merchant's accepted method. RewardHub records the transaction and reward calculation but does not hold the customer payment funds.",
  },
  {
    category: "Collect Payment",
    question:
      "How is cashback calculated during collection?",
    answer:
      "The system reads the member tier and the active merchant marketing configuration, then calculates the eligible instant cashback discount automatically before the transaction is completed.",
  },
  {
    category: "Reward Credits",
    question:
      "Can members use Reward Credits at my business?",
    answer:
      "The merchant may enable or configure Reward Credit acceptance through the supported marketing settings. The system validates the member balance and the permitted redemption amount during payment.",
  },
  {
    category: "Reward Credits",
    question:
      "Why was a member unable to redeem the requested amount?",
    answer:
      "The amount may exceed the member's available Reward Credits, the transaction value or the merchant's permitted redemption setting. Ask the member to enter an amount within the limit shown on screen.",
  },
  {
    category: "Transactions",
    question:
      "Where can I view merchant transactions?",
    answer:
      "Open Transactions in the Merchant Portal to review recorded member sales, payment methods, reward calculations and available transaction receipt functions.",
  },
  {
    category: "Transactions",
    question:
      "Why is a transaction not appearing?",
    answer:
      "Confirm that the collection flow reached a successful completion response. Refresh the page and check the selected date or pagination. Contact support with the amount, member ID and approximate time if it remains missing.",
  },
  {
    category: "Transactions",
    question:
      "How do I upload a transaction receipt?",
    answer:
      "Open the relevant transaction and use the receipt upload action where available. Upload a clear supported image or document associated with that transaction only.",
  },
  {
    category: "Settlement",
    question:
      "How do RewardHub settlements work?",
    answer:
      "The Settlement page shows settlement summaries, amounts and available settlement actions. The merchant can submit a settlement request or payment information according to the current settlement status.",
  },
  {
    category: "Settlement",
    question:
      "How do I submit a settlement payment or receipt?",
    answer:
      "Open Settlement, select the relevant outstanding record and follow the submission flow. Upload the correct proof of payment and wait for the settlement status to update after review.",
  },
  {
    category: "Settlement",
    question:
      "Why is my settlement still pending?",
    answer:
      "A pending settlement may still be awaiting payment submission, receipt review or administrative confirmation. Review the displayed status and contact support with the settlement reference if clarification is required.",
  },
  {
    category: "Products",
    question:
      "What can I list in Merchant Products?",
    answer:
      "The catalogue can be used for physical products, services, packages, vouchers and suitable online merchant offerings. Each listing should use accurate descriptions, pricing and images.",
  },
  {
    category: "Products",
    question:
      "How do I add or update a product?",
    answer:
      "Open Products, create or select a listing and complete the available product fields. Save changes after confirming the title, description, price, status and images are correct.",
  },
  {
    category: "Reviews",
    question:
      "How do merchant reviews and replies work?",
    answer:
      "The Merchant Reviews area allows the business to view customer review information and reply where the feature is available. Replies should remain professional and relevant to the customer's feedback.",
  },
  {
    category: "Notifications",
    question:
      "Where can I see merchant notifications?",
    answer:
      "Use the notification icon in the Merchant Portal to view unread activity and system updates linked to the logged-in merchant account.",
  },
  {
    category: "Security",
    question:
      "How does RewardHub identify my merchant account in Live Chat?",
    answer:
      "When Live Chat opens from the Merchant Portal, RewardHub securely connects the merchant account type and Merchant ID to the support session, reducing the need to type account details manually.",
  },
];

const GUEST_FAQS: FaqItem[] = [
  {
    category: "About RewardHub",
    question:
      "What is RewardHub?",
    answer:
      "RewardHub is a merchant membership network and merchant growth platform connecting members with participating merchants, rewards, referrals and member benefits.",
  },
  {
    category: "Membership",
    question:
      "Is RewardHub membership free?",
    answer:
      "RewardHub member registration is free. Members can access participating merchants, eligible rewards, points and referral features after completing registration.",
  },
  {
    category: "Membership",
    question:
      "How do I create a member account?",
    answer:
      "Open Member Registration, complete the required personal details and create the account. Use an invitation link during registration when you want the referring member to be recorded.",
  },
  {
    category: "Merchants",
    question:
      "Is merchant registration free?",
    answer:
      "RewardHub merchants can register without a fixed membership fee. The merchant contributes through its chosen marketing budget on eligible RewardHub member sales.",
  },
  {
    category: "Merchants",
    question:
      "How do I register my business?",
    answer:
      "Open Merchant Registration, submit the requested business and contact information, then wait for the merchant account review and activation process.",
  },
  {
    category: "Payments",
    question:
      "Does RewardHub hold customer payments?",
    answer:
      "No. In the current version, customers pay participating merchants directly. RewardHub records eligible transactions and reward calculations but does not hold customer payment funds.",
  },
  {
    category: "Rewards",
    question:
      "What benefits can members receive?",
    answer:
      "Depending on the eligible transaction and merchant settings, members may receive instant cashback discounts, points, membership tier progress and referral commission credits.",
  },
  {
    category: "Support",
    question:
      "What information should I provide when contacting support?",
    answer:
      "Describe the issue clearly and include only relevant information such as account ID, transaction reference, merchant name and approximate time. Do not send passwords, OTP codes or banking PINs.",
  },
];

/* ============================================================
 * Small UI Helpers
 * ============================================================
 */

function getGreetingName(
  identity: RewardHubIdentity
): string {
  if (
    identity.accountType ===
    "GUEST"
  ) {
    return "there";
  }

  return (
    identity.displayName ||
    identity.accountId
  );
}

function getIdentityLabel(
  identity: RewardHubIdentity
): string {
  if (
    identity.accountType ===
    "MEMBER"
  ) {
    return `${
      identity.tier || "Silver"
    } Member`;
  }

  if (
    identity.accountType ===
    "MERCHANT"
  ) {
    return "RewardHub Merchant";
  }

  return "RewardHub Visitor";
}

function getFaqItems(
  identity: RewardHubIdentity
): FaqItem[] {
  if (
    identity.accountType ===
    "MEMBER"
  ) {
    return MEMBER_FAQS;
  }

  if (
    identity.accountType ===
    "MERCHANT"
  ) {
    return MERCHANT_FAQS;
  }

  return GUEST_FAQS;
}

/* ============================================================
 * Support Modal
 * ============================================================
 */

export default function SupportModal() {
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

      if (!tawk) {
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

        return;
      }

      if (
        previousIdentityKey ===
        currentIdentityKey
      ) {
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

      if (
        previousIdentityKey &&
        previousIdentityKey !==
          "GUEST"
      ) {
        await callTawkLogout(
          tawk
        );
      }

      try {
        await callTawkLogin(
          tawk,
          currentIdentity,
          {
            userId:
              auth.userId,
            hash:
              auth.hash,
          }
        );

        window.sessionStorage.setItem(
          TAWK_IDENTITY_KEY,
          currentIdentityKey
        );

        console.log(
          "[RewardHub Tawk] Secure identity connected:",
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
          }
        );
      } catch (error) {
        console.error(
          "[RewardHub Tawk] Secure login failed:",
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
          "Unable to load customer support. Please check your internet connection and try again."
        );
      };

    document.head.appendChild(
      script
    );
  }, [
    shouldLoadWidget,
    syncIdentityToTawk,
  ]);

  const faqItems =
    getFaqItems(
      identity
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
      aria-label="RewardHub Support Center"
      aria-hidden={
        !isOpen
      }
    >
      <button
        type="button"
        aria-label="Close customer support"
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
                  aria-label="Back to support home"
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
                      ? "Live Support"
                      : activeView ===
                          "FAQ"
                        ? "Help & FAQ"
                        : "Customer Support"}
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
                    Online
                  </span>
                </div>

                <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                  RewardHub Support Team
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                closeSupport
              }
              aria-label="Close customer support"
              title="Close"
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
                      RewardHub Support
                    </p>

                    <h3 className="mt-2 truncate text-2xl font-black">
                      Hi,{" "}
                      {getGreetingName(
                        identity
                      )}{" "}
                      <span aria-hidden="true">
                        👋
                      </span>
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-slate-300">
                      How can we help you today?
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
                        identity
                      )}
                    </p>

                    <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                      {identity.accountId ||
                        "General support"}
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
                    Start Live Chat
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Talk directly with the RewardHub Support Team.
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
                    Help & FAQ
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Find quick answers for common RewardHub questions.
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
                  Fast, account-aware support
                </p>

                <p className="mt-1 text-[11px] font-semibold leading-5 text-emerald-800/75">
                  Your account details are connected automatically when you start Live Chat.
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
                    Frequently Asked Questions
                  </h3>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    Browse detailed answers tailored to your current RewardHub account type.
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600">
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {faqItems.length} support topics
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
              Still need help? Start Live Chat
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
                  Connecting to Support…
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Securing your RewardHub support session.
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
                  Support unavailable
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
                  Try Again
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
              RewardHub Support Center • Connected to your current account.
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
}