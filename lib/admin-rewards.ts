export type AdminRewardStatus =
  | "ACTIVE"
  | "HIDDEN"
  | "DRAFT"
  | string;

export type AdminRewardRedemptionStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export type AdminRewardRedemption = {
  redemptionId: string;

  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;

  rewardId: string;
  rewardTitle: string;
  rewardType: string;
  rewardImageUrl: string;

  pointsUsed: number;
  quantity: number;

  status:
    AdminRewardRedemptionStatus;

  voucherCode: string;

  recipientName: string;
  phone: string;
  address: string;

  trackingNo: string;
  deliveryMethod: string;
  redemptionSource: string;
  adminNote: string;

  redeemedAt: string;
  processedAt: string;
  completedAt: string;
  updatedAt: string;
};

export type AdminRewardsDashboardData = {
  generatedAt: string;
  timezone: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  stats: {
    rewards: {
      total: number;
      active: number;
      hidden: number;
      draft: number;
      lowStock: number;
      outOfStock: number;
    };

    redemptions: {
      total: number;
      pending: number;
      processing: number;
      shipped: number;
      completed: number;
      cancelled: number;

      today: number;
      completedToday: number;

      totalPointsRedeemed: number;
      pointsRedeemedToday: number;
    };

    vouchers: {
      total: number;
      available: number;
      reserved: number;
      redeemed: number;
      expired: number;
    };
  };

  recentRedemptions:
    AdminRewardRedemption[];

  topRewards: Array<{
    rewardId: string;
    rewardTitle: string;
    redemptionCount: number;
    pointsRedeemed: number;
  }>;
};

export type AdminRewardRedemptionListData = {
  generatedAt: string;
  timezone: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  summary: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    completed: number;
    cancelled: number;
    pointsUsed: number;
  };

  options: {
    statuses: string[];
    rewardTypes: string[];
    deliveryMethods: string[];
  };

  filters: {
    search: string;
    status: string;
    rewardType: string;
    deliveryMethod: string;
    dateFrom: string;
    dateTo: string;
  };

  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    showingFrom: number;
    showingTo: number;
  };

  redemptions:
    AdminRewardRedemption[];
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

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
      "Rewards API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.success ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        fallbackMessage
    );
  }

  return result.data;
}

export async function getAdminRewardsDashboard():
  Promise<AdminRewardsDashboardData> {
  const response =
    await fetch(
      "/api/admin/rewards",
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return readApiResponse<
    AdminRewardsDashboardData
  >(
    response,
    "Unable to load rewards dashboard."
  );
}

export type GetAdminRewardRedemptionsInput = {
  search?: string;
  status?: string;
  rewardType?: string;
  deliveryMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export async function getAdminRewardRedemptions(
  input:
    GetAdminRewardRedemptionsInput = {}
): Promise<AdminRewardRedemptionListData> {
  const params =
    new URLSearchParams();

  params.set(
    "mode",
    "redemptions"
  );

  params.set(
    "search",
    input.search || ""
  );

  params.set(
    "status",
    input.status || "ALL"
  );

  params.set(
    "rewardType",
    input.rewardType || "ALL"
  );

  params.set(
    "deliveryMethod",
    input.deliveryMethod ||
      "ALL"
  );

  params.set(
    "dateFrom",
    input.dateFrom || ""
  );

  params.set(
    "dateTo",
    input.dateTo || ""
  );

  params.set(
    "page",
    String(input.page || 1)
  );

  params.set(
    "pageSize",
    String(
      input.pageSize || 25
    )
  );

  const response =
    await fetch(
      `/api/admin/rewards?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return readApiResponse<
    AdminRewardRedemptionListData
  >(
    response,
    "Unable to load reward redemptions."
  );
}

/* ============================================================
 * Admin Reward Catalog
 * ============================================================
 */

export type AdminRewardCatalogItem = {
  rewardId: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  brand: string;

  pointsRequired: number;
  stock: number;
  unlimitedStock: boolean;
  stockLabel: string;

  featured: boolean;
  isNew: boolean;
  isHot: boolean;
  isRecommended: boolean;

  maxPerMember: number;
  status: string;
  rewardType: string;
  voucherCode: string;
  shippingRequired: boolean;
  sortOrder: number;

  createdAt: string;
  updatedAt: string;

  redemptionCount: number;
  redeemedQuantity: number;
  pointsRedeemed: number;
};

export type AdminRewardCatalogListData = {
  generatedAt: string;
  timezone: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  summary: {
    total: number;
    active: number;
    hidden: number;
    draft: number;
    lowStock: number;
    outOfStock: number;
    featured: number;
    unlimitedStock: number;
  };

  options: {
    statuses: string[];
    categories: string[];
    rewardTypes: string[];
  };

  filters: {
    search: string;
    status: string;
    category: string;
    rewardType: string;
  };

  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    showingFrom: number;
    showingTo: number;
  };

  rewards: AdminRewardCatalogItem[];
};

export type GetAdminRewardsInput = {
  search?: string;
  status?: string;
  category?: string;
  rewardType?: string;
  page?: number;
  pageSize?: number;
};

export type CreateAdminRewardInput = {
  title: string;
  category: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  brand?: string;

  pointsRequired: number;
  stock?: number;
  unlimitedStock?: boolean;

  featured?: boolean;
  isNew?: boolean;
  isHot?: boolean;
  isRecommended?: boolean;

  maxPerMember?: number;

  status:
    | "ACTIVE"
    | "HIDDEN"
    | "DRAFT"
    | "INACTIVE";

  rewardType:
    | "VOUCHER"
    | "DIGITAL"
    | "PHYSICAL";

  voucherCode?: string;
  shippingRequired?: boolean;
  sortOrder?: number;
};

export type CreateAdminRewardResult = {
  message: string;
  reward: AdminRewardCatalogItem;
};

export type UploadAdminRewardImageResult = {
  message: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  imageUrl: string;
  thumbnailUrl: string;
};

export async function getAdminRewards(
  input: GetAdminRewardsInput = {}
): Promise<AdminRewardCatalogListData> {
  const params =
    new URLSearchParams();

  params.set("mode", "list");
  params.set(
    "search",
    input.search || ""
  );
  params.set(
    "status",
    input.status || "ALL"
  );
  params.set(
    "category",
    input.category || "ALL"
  );
  params.set(
    "rewardType",
    input.rewardType || "ALL"
  );
  params.set(
    "page",
    String(input.page || 1)
  );
  params.set(
    "pageSize",
    String(input.pageSize || 25)
  );

  const response =
    await fetch(
      `/api/admin/rewards?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return readApiResponse<
    AdminRewardCatalogListData
  >(
    response,
    "Unable to load rewards."
  );
}

export async function createAdminReward(
  input: CreateAdminRewardInput
): Promise<CreateAdminRewardResult> {
  const response =
    await fetch(
      "/api/admin/rewards",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        cache: "no-store",

        body: JSON.stringify({
          mode: "create",
          ...input,
        }),
      }
    );

  return readApiResponse<
    CreateAdminRewardResult
  >(
    response,
    "Unable to create reward."
  );
}

export async function uploadAdminRewardImage(
  input: {
    fileName: string;
    mimeType: string;
    base64: string;
  }
): Promise<UploadAdminRewardImageResult> {
  const response =
    await fetch(
      "/api/admin/rewards",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        cache: "no-store",

        body: JSON.stringify({
          mode: "uploadImage",
          ...input,
        }),
      }
    );

  return readApiResponse<
    UploadAdminRewardImageResult
  >(
    response,
    "Unable to upload reward image."
  );
}

export type AdminRewardDetailData = {
  generatedAt: string;
  timezone: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  reward:
    AdminRewardCatalogItem;
};

export type UpdateAdminRewardInput = {
  rewardId: string;

  title: string;
  category: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  brand?: string;

  pointsRequired: number;
  stock?: number;
  unlimitedStock?: boolean;

  featured?: boolean;
  isNew?: boolean;
  isHot?: boolean;
  isRecommended?: boolean;

  maxPerMember?: number;

  status:
    | "ACTIVE"
    | "HIDDEN"
    | "DRAFT"
    | "INACTIVE";

  rewardType:
    | "VOUCHER"
    | "DIGITAL"
    | "PHYSICAL";

  voucherCode?: string;
  shippingRequired?: boolean;
  sortOrder?: number;
};

export type UpdateAdminRewardResult = {
  message: string;
  reward:
    AdminRewardCatalogItem;
};

export async function getAdminRewardDetail(
  rewardId: string
): Promise<AdminRewardDetailData> {
  const params =
    new URLSearchParams();

  params.set(
    "mode",
    "detail"
  );

  params.set(
    "rewardId",
    rewardId
  );

  const response =
    await fetch(
      `/api/admin/rewards?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return readApiResponse<
    AdminRewardDetailData
  >(
    response,
    "Unable to load reward details."
  );
}

export async function updateAdminReward(
  input: UpdateAdminRewardInput
): Promise<UpdateAdminRewardResult> {
  const response =
    await fetch(
      "/api/admin/rewards",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        cache: "no-store",

        body:
          JSON.stringify({
            mode:
              "update",
            ...input,
          }),
      }
    );

  return readApiResponse<
    UpdateAdminRewardResult
  >(
    response,
    "Unable to update reward."
  );
}