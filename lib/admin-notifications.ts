/* ============================================================
 * RewardHub Admin Notification Center
 * File: lib/admin/admin-notifications.ts
 *
 * Existing features preserved:
 * - Notification dashboard
 * - Notification history
 * - Notification detail
 * - Delete notification history
 * - Send push + in-app notifications
 *
 * Added for Admin Header bell:
 * - Admin notification inbox
 * - Unread count
 * - Mark one notification as read
 * - Mark all notifications as read
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
  targetType: NotificationTargetType | string;
  targetId: string;
  title: string;
  message: string;
  url: string;
  image: string;
  attemptedCount: number;
  sentCount: number;
  failedCount: number;
  status: NotificationStatus | string;
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
  recent: AdminNotificationHistoryItem[];
};

export type AdminNotificationHistory = {
  total: number;
  count: number;
  items: AdminNotificationHistoryItem[];
};

export type AdminNotificationDetail = {
  notification: AdminNotificationHistoryItem;

  analytics: {
    recipientCount: number;
    readCount: number;
    unreadCount: number;
    readRate: number;
  };
};

export type SendAdminNotificationInput = {
  targetType: NotificationTargetType;
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
  status: NotificationStatus | string;
  history?: unknown;
  inApp?: unknown;
};

/* ============================================================
 * Admin Header Bell / Notification Inbox
 * ============================================================
 */

export type AdminInboxNotificationType =
  | "MEMBER"
  | "MERCHANT"
  | "MERCHANT_APPLICATION"
  | "TRANSACTION"
  | "SETTLEMENT"
  | "CARD_APPLICATION"
  | "REWARD"
  | "REDEMPTION"
  | "REVIEW"
  | "CAMPAIGN"
  | "SECURITY"
  | "SYSTEM";

export type AdminInboxNotificationPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";

export type AdminInboxNotificationItem = {
  notificationId: string;

  adminId: string;

  type:
    | AdminInboxNotificationType
    | string;

  priority:
    | AdminInboxNotificationPriority
    | string;

  title: string;
  message: string;

  status: string;

  isRead: boolean;

  actionUrl: string;

  entityType: string;
  entityId: string;

  createdAt: string;
  readAt: string;

  createdBy: string;
};

export type AdminNotificationInbox = {
  total: number;
  count: number;
  unreadCount: number;
  items: AdminInboxNotificationItem[];
};

export type MarkAdminNotificationReadResult = {
  notificationId: string;
  isRead: boolean;
  readAt: string;
};

export type MarkAllAdminNotificationsReadResult = {
  updatedCount: number;
  readAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
};

type UnknownRecord =
  Record<string, unknown>;

function isRecord(
  value: unknown
): value is UnknownRecord {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toStringValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

function toNumberValue(
  value: unknown,
  fallback = 0
): number {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}

function toBooleanValue(
  value: unknown
): boolean {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  const normalized =
    String(value || "")
      .trim()
      .toUpperCase();

  return [
    "TRUE",
    "YES",
    "Y",
    "1",
    "READ",
  ].includes(
    normalized
  );
}

function unwrapData(
  value: unknown
): unknown {
  let current =
    value;

  for (
    let index = 0;
    index < 4;
    index += 1
  ) {
    if (
      !isRecord(
        current
      )
    ) {
      break;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        current,
        "data"
      )
    ) {
      current =
        current.data;

      continue;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        current,
        "result"
      )
    ) {
      current =
        current.result;

      continue;
    }

    break;
  }

  return current;
}

async function readApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const rawText =
    await response.text();

  let result:
    ApiResponse<unknown>;

  try {
    result =
      rawText
        ? JSON.parse(
            rawText
          )
        : {};
  } catch {
    throw new Error(
      "Notification API returned an invalid JSON response."
    );
  }

  if (
    !response.ok ||
    !result ||
    result.success !== true
  ) {
    throw new Error(
      result?.error ||
        result?.message ||
        fallbackMessage
    );
  }

  const payload =
    result.data ??
    result.result;

  if (
    payload ===
      undefined
  ) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Notification API response is missing data."
    );
  }

  return unwrapData(
    payload
  ) as T;
}

/* ============================================================
 * Notification dashboard
 * ============================================================
 */

export async function getAdminNotificationDashboard():
  Promise<AdminNotificationDashboard> {
  const response =
    await fetch(
      "/api/admin/notifications",
      {
        method:
          "GET",

        cache:
          "no-store",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",
        },
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
 * Notification history
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
        method:
          "GET",

        cache:
          "no-store",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  return readApiResponse<
    AdminNotificationHistory
  >(
    response,
    "Unable to load notification history."
  );
}

export async function getAdminNotificationDetail(
  notificationId: string
): Promise<AdminNotificationDetail> {
  const normalizedId =
    notificationId.trim();

  if (
    !normalizedId
  ) {
    throw new Error(
      "Notification ID is required."
    );
  }

  const response =
    await fetch(
      `/api/admin/notifications/${encodeURIComponent(
        normalizedId
      )}`,
      {
        method:
          "GET",

        cache:
          "no-store",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  return readApiResponse<
    AdminNotificationDetail
  >(
    response,
    "Unable to load notification details."
  );
}

export async function deleteAdminNotificationHistory(
  notificationId: string
): Promise<{
  deleted: boolean;
  notificationId: string;
}> {
  const normalizedId =
    notificationId.trim();

  if (
    !normalizedId
  ) {
    throw new Error(
      "Notification ID is required."
    );
  }

  const response =
    await fetch(
      `/api/admin/notifications/${encodeURIComponent(
        normalizedId
      )}`,
      {
        method:
          "DELETE",

        cache:
          "no-store",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  return readApiResponse<{
    deleted: boolean;
    notificationId: string;
  }>(
    response,
    "Unable to delete notification history."
  );
}

/* ============================================================
 * Send notification
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
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        cache:
          "no-store",

        credentials:
          "include",

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
 * Admin Header Bell / Inbox
 * ============================================================
 */

export async function getAdminNotificationInbox(
  options?: {
    limit?: number;
    unreadOnly?: boolean;
    signal?: AbortSignal;
  }
): Promise<AdminNotificationInbox> {
  const limit =
    Math.min(
      Math.max(
        Number(
          options?.limit ||
            8
        ),
        1
      ),
      100
    );

  const searchParams =
    new URLSearchParams({
      mode:
        "inbox",

      limit:
        String(limit),

      unreadOnly:
        options?.unreadOnly
          ? "true"
          : "false",
    });

  const response =
    await fetch(
      `/api/admin/notifications?${searchParams.toString()}`,
      {
        method:
          "GET",

        cache:
          "no-store",

        credentials:
          "include",

        signal:
          options?.signal,

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  const rawData =
    await readApiResponse<unknown>(
      response,
      "Unable to load administrator notifications."
    );

  return normalizeAdminNotificationInbox(
    rawData
  );
}

export async function markAdminNotificationRead(
  notificationId: string
): Promise<MarkAdminNotificationReadResult> {
  const normalizedId =
    notificationId.trim();

  if (
    !normalizedId
  ) {
    throw new Error(
      "Notification ID is required."
    );
  }

  const response =
    await fetch(
      "/api/admin/notifications",
      {
        method:
          "PATCH",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        cache:
          "no-store",

        credentials:
          "include",

        body:
          JSON.stringify({
            action:
              "MARK_READ",

            notificationId:
              normalizedId,
          }),
      }
    );

  const data =
    await readApiResponse<unknown>(
      response,
      "Unable to mark notification as read."
    );

  const source =
    isRecord(
      data
    )
      ? data
      : {};

  return {
    notificationId:
      toStringValue(
        source.notificationId ||
        normalizedId
      ),

    isRead:
      source.isRead ===
        undefined
        ? true
        : toBooleanValue(
            source.isRead
          ),

    readAt:
      toStringValue(
        source.readAt
      ),
  };
}

export async function markAllAdminNotificationsRead():
  Promise<MarkAllAdminNotificationsReadResult> {
  const response =
    await fetch(
      "/api/admin/notifications",
      {
        method:
          "PATCH",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        cache:
          "no-store",

        credentials:
          "include",

        body:
          JSON.stringify({
            action:
              "MARK_ALL_READ",
          }),
      }
    );

  const data =
    await readApiResponse<unknown>(
      response,
      "Unable to mark all notifications as read."
    );

  const source =
    isRecord(
      data
    )
      ? data
      : {};

  return {
    updatedCount:
      toNumberValue(
        source.updatedCount
      ),

    readAt:
      toStringValue(
        source.readAt
      ),
  };
}

/* ============================================================
 * Inbox normalization
 * ============================================================
 */

function normalizeAdminNotificationInbox(
  value: unknown
): AdminNotificationInbox {
  const source =
    isRecord(
      value
    )
      ? value
      : {};

  const rawItems =
    Array.isArray(
      source.items
    )
      ? source.items
      : Array.isArray(
          source.notifications
        )
        ? source.notifications
        : [];

  const items =
    rawItems
      .map(
        normalizeAdminInboxNotificationItem
      )
      .filter(
        (
          item
        ): item is AdminInboxNotificationItem =>
          Boolean(item)
      );

  const unreadCount =
    source.unreadCount ===
      undefined
      ? items.filter(
          (
            item
          ) =>
            !item.isRead
        ).length
      : toNumberValue(
          source.unreadCount
        );

  return {
    total:
      toNumberValue(
        source.total,
        items.length
      ),

    count:
      toNumberValue(
        source.count,
        items.length
      ),

    unreadCount,

    items,
  };
}

function normalizeAdminInboxNotificationItem(
  value: unknown
): AdminInboxNotificationItem | null {
  if (
    !isRecord(
      value
    )
  ) {
    return null;
  }

  const notificationId =
    toStringValue(
      value.notificationId ||
      value.id
    );

  if (
    !notificationId
  ) {
    return null;
  }

  const isRead =
    value.isRead !==
      undefined
      ? toBooleanValue(
          value.isRead
        )
      : Boolean(
          toStringValue(
            value.readAt
          )
        );

  return {
    notificationId,

    adminId:
      toStringValue(
        value.adminId ||
        value.userId
      ),

    type:
      toStringValue(
        value.type ||
        value.notificationType ||
        "SYSTEM"
      ),

    priority:
      toStringValue(
        value.priority ||
        "NORMAL"
      ),

    title:
      toStringValue(
        value.title
      ),

    message:
      toStringValue(
        value.message ||
        value.description
      ),

    status:
      toStringValue(
        value.status ||
        "ACTIVE"
      ),

    isRead,

    actionUrl:
      toStringValue(
        value.actionUrl ||
        value.url ||
        value.href
      ),

    entityType:
      toStringValue(
        value.entityType
      ),

    entityId:
      toStringValue(
        value.entityId
      ),

    createdAt:
      toStringValue(
        value.createdAt
      ),

    readAt:
      toStringValue(
        value.readAt
      ),

    createdBy:
      toStringValue(
        value.createdBy
      ),
  };
}

/* ============================================================
 * Shared UI helpers
 * ============================================================
 */

export function getNotificationTargetLabel(
  targetType: string,
  targetId?: string
) {
  switch (
    String(
      targetType ||
      ""
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

export function getAdminInboxNotificationTypeLabel(
  type: string
) {
  switch (
    String(
      type ||
      ""
    ).toUpperCase()
  ) {
    case "MEMBER":
      return "Member";

    case "MERCHANT":
      return "Merchant";

    case "MERCHANT_APPLICATION":
      return "Merchant Application";

    case "TRANSACTION":
      return "Transaction";

    case "SETTLEMENT":
      return "Settlement";

    case "CARD_APPLICATION":
      return "Card Application";

    case "REWARD":
      return "Reward";

    case "REDEMPTION":
      return "Redemption";

    case "REVIEW":
      return "Review";

    case "CAMPAIGN":
      return "Campaign";

    case "SECURITY":
      return "Security";

    case "SYSTEM":
      return "System";

    default:
      return (
        type ||
        "Notification"
      );
  }
}

export function formatNotificationDate(
  value: string
) {
  if (
    !value
  ) {
    return "—";
  }

  const date =
    new Date(
      value
    );

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
  ).format(
    date
  );
}

export function formatNotificationRelativeTime(
  value: string
) {
  if (
    !value
  ) {
    return "Just now";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  const difference =
    Date.now() -
    date.getTime();

  const minutes =
    Math.floor(
      difference /
      60000
    );

  if (
    minutes <
    1
  ) {
    return "Just now";
  }

  if (
    minutes <
    60
  ) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes /
      60
    );

  if (
    hours <
    24
  ) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours /
      24
    );

  if (
    days <
    7
  ) {
    return `${days}d ago`;
  }

  return formatNotificationDate(
    value
  );
}