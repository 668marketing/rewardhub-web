/* ============================================================
 * RewardHub Admin Notification Center
 * File: lib/admin-notifications.ts
 * ============================================================
 */

export type NotificationTargetType =
  | "ALL_MEMBERS"
  | "ALL_MERCHANTS"
  | "SPECIFIC_MEMBER"
  | "SPECIFIC_MERCHANT";

export type NotificationStatus =
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "NO_TARGETS";

export type AdminNotificationHistoryItem = {
  notificationId: string;

  channel: string;

  targetType:
    NotificationTargetType | string;

  targetId: string;

  title: string;
  message: string;

  url: string;
  image: string;

  attemptedCount: number;
  sentCount: number;
  failedCount: number;

  status:
    NotificationStatus | string;

  errorSummary: string;

  createdBy: string;
  createdAt: string;
};

export type AdminNotificationDashboard = {
  todaySent: number;
  todayDelivered: number;
  todayFailed: number;

  activeDevices: number;
  memberDevices: number;
  merchantDevices: number;
  adminDevices: number;

  recent:
    AdminNotificationHistoryItem[];
};

export type AdminNotificationHistory = {
  total: number;
  count: number;

  items:
    AdminNotificationHistoryItem[];
};

export type SendAdminNotificationInput = {
  targetType:
    NotificationTargetType;

  targetId?: string;

  title: string;
  message: string;

  url?: string;
  image?: string;
};

export type SendAdminNotificationResult = {
  attemptedCount: number;
  sentCount: number;
  failedCount: number;

  status:
    NotificationStatus | string;

  history?: unknown;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/* ============================================================
 * Internal JSON Reader
 * ============================================================
 */

async function readApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  let result:
    ApiResponse<T>;

  try {
    result =
      (await response.json()) as
        ApiResponse<T>;
  } catch {
    throw new Error(
      "Notification API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.success ||
    !result.data
  ) {
    throw new Error(
      result.error ||
      result.message ||
      fallbackMessage
    );
  }

  return result.data;
}

/* ============================================================
 * Dashboard
 * ============================================================
 */

export async function getAdminNotificationDashboard():
  Promise<AdminNotificationDashboard> {
  const response =
    await fetch(
      "/api/admin/notifications",
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return readApiResponse<
    AdminNotificationDashboard
  >(
    response,
    "Unable to load notification dashboard."
  );
}

/* ============================================================
 * History
 * ============================================================
 */

export async function getAdminNotificationHistory(
  options?: {
    search?: string;
    targetType?: string;
    status?: string;
  }
): Promise<AdminNotificationHistory> {
  const searchParams =
    new URLSearchParams();

  searchParams.set(
    "mode",
    "history"
  );

  if (
    options?.search?.trim()
  ) {
    searchParams.set(
      "search",
      options.search.trim()
    );
  }

  if (
    options?.targetType?.trim()
  ) {
    searchParams.set(
      "targetType",
      options.targetType.trim()
    );
  }

  if (
    options?.status?.trim()
  ) {
    searchParams.set(
      "status",
      options.status.trim()
    );
  }

  const response =
    await fetch(
      `/api/admin/notifications?${searchParams.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return readApiResponse<
    AdminNotificationHistory
  >(
    response,
    "Unable to load notification history."
  );
}

/* ============================================================
 * Send Notification
 * ============================================================
 */

export async function sendAdminNotification(
  input:
    SendAdminNotificationInput
): Promise<SendAdminNotificationResult> {
  const response =
    await fetch(
      "/api/admin/notifications",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        cache: "no-store",

        body:
          JSON.stringify({
            targetType:
              input.targetType,

            targetId:
              input.targetId?.trim() ||
              "",

            title:
              input.title.trim(),

            message:
              input.message.trim(),

            url:
              input.url?.trim() ||
              "",

            image:
              input.image?.trim() ||
              "",
          }),
      }
    );

  return readApiResponse<
    SendAdminNotificationResult
  >(
    response,
    "Unable to send notification."
  );
}

/* ============================================================
 * Helpers
 * ============================================================
 */

export function getNotificationTargetLabel(
  targetType: string,
  targetId?: string
) {
  switch (
    String(
      targetType || ""
    ).toUpperCase()
  ) {
    case "ALL_MEMBERS":
      return "All Members";

    case "ALL_MERCHANTS":
      return "All Merchants";

    case "SPECIFIC_MEMBER":
      return targetId
        ? `Member · ${targetId}`
        : "Specific Member";

    case "SPECIFIC_MERCHANT":
      return targetId
        ? `Merchant · ${targetId}`
        : "Specific Merchant";

    default:
      return (
        targetType ||
        "Unknown Target"
      );
  }
}

export function formatNotificationDate(
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

      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(date);
}