export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "RUNNING"
  | "COMPLETED"
  | "CANCELLED";

export type CampaignTargetType =
  | "ALL_MEMBERS"
  | "ALL_MERCHANTS"
  | "SPECIFIC_MEMBER"
  | "SPECIFIC_MERCHANT";

export type AdminCampaign = {
  campaignId: string;
  campaignName: string;
  targetType: CampaignTargetType | string;
  targetId: string;
  title: string;
  message: string;
  url: string;
  image: string;
  status: CampaignStatus | string;
  scheduledAt: string;
  sentAt: string;
  notificationId: string;
  attemptedCount: number;
  sentCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string;
};

export type AdminCampaignDashboard = {
  totals: {
    total: number;
    draft: number;
    scheduled: number;
    running: number;
    completed: number;
    cancelled: number;
  };
  recent: AdminCampaign[];
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

async function readApi<T>(
  response: Response,
  fallback: string
): Promise<T> {
  let payload: ApiResponse<T>;

  try {
    payload =
      (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(
      "Campaign API returned invalid JSON."
    );
  }

  if (
    !response.ok ||
    payload.success !== true
  ) {
    throw new Error(
      payload.error ||
      payload.message ||
      fallback
    );
  }

  let data: unknown =
    payload.data;

  // RewardHub Apps Script commonly returns
  // { success, data: { message, data: {...} } }.
  // Safely unwrap nested responseMessage() layers.
  for (
    let depth = 0;
    depth < 4;
    depth++
  ) {
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      Object.prototype.hasOwnProperty.call(
        data,
        "data"
      )
    ) {
      data = (
        data as Record<string, unknown>
      ).data;
      continue;
    }

    break;
  }

  return data as T;
}

export async function getAdminCampaignDashboard() {
  const response =
    await fetch(
      "/api/admin/campaigns?mode=dashboard",
      {
        cache: "no-store",
      }
    );

  return readApi<AdminCampaignDashboard>(
    response,
    "Unable to load campaign dashboard."
  );
}

export async function getAdminCampaigns(
  options?: {
    search?: string;
    status?: string;
    targetType?: string;
  }
) {
  const params =
    new URLSearchParams({
      mode: "list",
    });

  if (options?.search) {
    params.set(
      "search",
      options.search
    );
  }

  if (options?.status) {
    params.set(
      "status",
      options.status
    );
  }

  if (options?.targetType) {
    params.set(
      "targetType",
      options.targetType
    );
  }

  const response =
    await fetch(
      `/api/admin/campaigns?${params.toString()}`,
      {
        cache: "no-store",
      }
    );

  return readApi<{
    total: number;
    count: number;
    items: AdminCampaign[];
  }>(
    response,
    "Unable to load campaigns."
  );
}

export async function getAdminCampaignDetail(
  campaignId: string
) {
  const response =
    await fetch(
      `/api/admin/campaigns/${encodeURIComponent(
        campaignId
      )}`,
      {
        cache: "no-store",
      }
    );

  return readApi<{
    campaign: AdminCampaign;
  }>(
    response,
    "Unable to load campaign detail."
  );
}

export async function createAdminCampaign(
  input: Record<string, unknown>
) {
  const response =
    await fetch(
      "/api/admin/campaigns",
      {
        method: "POST",
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

  return readApi<{
    campaign: AdminCampaign;
  }>(
    response,
    "Unable to create campaign."
  );
}

export async function updateAdminCampaign(
  campaignId: string,
  input: Record<string, unknown>
) {
  const response =
    await fetch(
      `/api/admin/campaigns/${encodeURIComponent(
        campaignId
      )}`,
      {
        method: "PATCH",
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

  return readApi<{
    campaign: AdminCampaign;
  }>(
    response,
    "Unable to update campaign."
  );
}

export async function campaignAction(
  campaignId: string,
  action:
    | "duplicate"
    | "cancel"
    | "complete",
  extra?: Record<string, unknown>
) {
  const response =
    await fetch(
      `/api/admin/campaigns/${encodeURIComponent(
        campaignId
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            action,
            ...(extra || {}),
          }),
      }
    );

  return readApi<{
    campaign: AdminCampaign;
  }>(
    response,
    "Unable to process campaign."
  );
}

export function formatCampaignDate(
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
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}