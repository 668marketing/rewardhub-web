/* ============================================================
 * Merchant
 * ============================================================
 */

export type AdminMerchantDetail = {
  merchantId: string;
  merchantName: string;
  legalName: string;
  displayName: string;

  email: string;
  phone: string;
  contactPerson: string;

  category: string;
  description: string;
  status: string;

  logoUrl: string;
  bannerUrl: string;

  ssmNumber: string;
  website: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;

  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;

  joinedAt: string;
  lastLoginAt: string;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
};

/* ============================================================
 * Transactions
 * ============================================================
 */

export type AdminMerchantTransaction = {
  transactionId: string;
  memberId: string;

  amount: number;
  cashback: number;
  rewardCreditsUsed: number;
  payAmount: number;

  paymentMethod: string;
  status: string;
  receiptUrl: string;
  createdAt: string;
};

export type MerchantTransactionSummary = {
  total: number;
  completed: number;
  failed: number;
  cancelled: number;

  sales: number;
  cashback: number;
  rewardCreditsUsed: number;

  lastTransactionAt: string;
};

/* ============================================================
 * Marketing
 * ============================================================
 */

export type AdminMerchantMarketingSetting = {
  merchantId: string;

  normalBudget: number;

  boostEnabled: boolean;
  boostBudget: number;
  boostStart: string;
  boostEnd: string;
  boostCount: number;

  currentBudget: number;
  boostActive: boolean;

  updatedAt: string;
  nextNormalUpdate: string;

  acceptRewardCredits: boolean;
  redemptionLimit: number;
};

export type MerchantMarketingSummary = {
  normalBudget: number;

  boostEnabled: boolean;
  boostBudget: number;
  boostStart: string;
  boostEnd: string;
  boostCount: number;

  currentBudget: number;
  boostActive: boolean;

  acceptRewardCredits: boolean;
  redemptionLimit: number;

  updatedAt: string;
  nextNormalUpdate: string;
};

/* ============================================================
 * Products
 * ============================================================
 */

export type AdminMerchantProductType =
  | "PRODUCT"
  | "SERVICE"
  | "PACKAGE"
  | "VOUCHER";

export type AdminMerchantProductStatus =
  | "ACTIVE"
  | "DRAFT"
  | "INACTIVE";

export type AdminMerchantProduct = {
  productId: string;
  merchantId: string;

  productType:
    AdminMerchantProductType;

  productName: string;

  shortDescription: string;
  description: string;
  category: string;

  price: number;
  salePrice: number;
  effectivePrice: number;
  hasSale: boolean;

  imageUrl: string;
  gallery: string[];

  stock: number;
  pointsEarned: number;

  status:
    AdminMerchantProductStatus;

  sortOrder: number;
  isFeatured: boolean;

  createdAt: string;
  updatedAt: string;
};

/* ============================================================
 * Settlements
 * ============================================================
 */

export type AdminMerchantSettlement = {
  settlementId: string;
  merchantId: string;
  merchantName: string;

  month: string;

  totalSales: number;
  totalCashback: number;
  totalRewardCredits: number;
  totalMarketingBudget: number;
  amountPayable: number;

  bankName: string;
  bankAccount: string;

  status: string;

  createdAt: string;

  approvedAt: string;
  approvedBy: string;

  paidAt: string;

  rejectedAt: string;
  rejectedBy: string;

  updatedAt: string;

  paymentMethod: string;
  receiptUrl: string;
  paymentNote: string;
  rejectReason: string;
};

export type MerchantSettlementSummary = {
  total: number;

  pending: number;
  submitted: number;
  approved: number;
  paid: number;
  rejected: number;

  pendingAmount: number;
  submittedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  rejectedAmount: number;
};

/* ============================================================
 * Merchant Detail Response
 * ============================================================
 */

export type AdminMerchantDetailData = {
  generatedAt: string;
  timezone: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  merchant: AdminMerchantDetail;

  marketing: {
    summary: MerchantMarketingSummary;
    setting: AdminMerchantMarketingSetting | null;
  };

  transactions: {
    summary: MerchantTransactionSummary;
    recent: AdminMerchantTransaction[];
  };

  settlements: {
    summary: MerchantSettlementSummary;
    recent: AdminMerchantSettlement[];
  };

  products: {
  total: number;
  active: number;
  items: AdminMerchantProduct[];
};

  reviews: {
  total: number;
  averageRating: number;
  items: AdminMerchantReview[];
};

  pushSubscriptions: {
  total: number;
  active: number;
  items: AdminMerchantPushDevice[];
};
};

/* ============================================================
 * Merchant Detail API
 * ============================================================
 */

type MerchantDetailApiResponse = {
  success: boolean;
  data?: AdminMerchantDetailData;
  error?: string;
};

export async function getAdminMerchantDetail(
  merchantId: string
): Promise<AdminMerchantDetailData> {
  const response = await fetch(
    `/api/admin/merchants/${encodeURIComponent(
      merchantId
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  let result: MerchantDetailApiResponse;

  try {
    result =
      (await response.json()) as MerchantDetailApiResponse;
  } catch {
    throw new Error(
      "Merchant detail API returned an invalid response."
    );
  }

  if (!response.ok || !result.data) {
    throw new Error(
      result.error ||
        "Unable to load merchant details."
    );
  }

  return result.data;
}

/* ============================================================
 * Update Marketing Settings
 * ============================================================
 */

export type UpdateMerchantMarketingInput = {
  normalBudget: number;

  boostEnabled: boolean;
  boostBudget: number;
  boostStart: string;
  boostEnd: string;

  acceptRewardCredits: boolean;
  redemptionLimit: number;
};

type UpdateMerchantMarketingResponse = {
  success: boolean;

  data?: {
    setting?:
      AdminMerchantMarketingSetting;
  };

  error?: string;
};

export async function updateMerchantMarketingSettings(
  merchantId: string,
  input: UpdateMerchantMarketingInput
): Promise<void> {
  const response = await fetch(
    `/api/admin/merchants/${encodeURIComponent(
      merchantId
    )}/marketing`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(input),
    }
  );

  let result:
    UpdateMerchantMarketingResponse;

  try {
    result =
      (await response.json()) as UpdateMerchantMarketingResponse;
  } catch {
    throw new Error(
      "Marketing settings API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.error ||
        "Unable to update marketing settings."
    );
  }
}

/* ============================================================
 * Settlement Actions
 * ============================================================
 */

type SettlementActionResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

async function runSettlementAction(
  merchantId: string,
  settlementId: string,
  action: "approve" | "reject",
  reason?: string
): Promise<void> {
  const response = await fetch(
    `/api/admin/merchants/${encodeURIComponent(
      merchantId
    )}/settlements/${encodeURIComponent(
      settlementId
    )}/${action}`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        reason:
          reason || "",
      }),
    }
  );

  let result:
    SettlementActionResponse;

  try {
    result =
      (await response.json()) as SettlementActionResponse;
  } catch {
    throw new Error(
      "Settlement action returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.error ||
        "Unable to update settlement."
    );
  }
}

export async function approveMerchantSettlement(
  merchantId: string,
  settlementId: string
): Promise<void> {
  await runSettlementAction(
    merchantId,
    settlementId,
    "approve"
  );
}

export async function rejectMerchantSettlement(
  merchantId: string,
  settlementId: string,
  reason: string
): Promise<void> {
  await runSettlementAction(
    merchantId,
    settlementId,
    "reject",
    reason
  );
}

/* ============================================================
 * Admin Merchant Product Actions
 * Add this section to lib/admin-merchant-detail.ts
 * ============================================================
 */

export type AdminProductStatus =
  | "ACTIVE"
  | "DRAFT"
  | "INACTIVE";

type AdminProductActionResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

async function runAdminProductAction(
  merchantId: string,
  productId: string,
  body: Record<string, unknown>
): Promise<void> {
  const response =
    await fetch(
      `/api/admin/merchants/${encodeURIComponent(
        merchantId
      )}/products/${encodeURIComponent(
        productId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body:
          JSON.stringify(body),
      }
    );

  let result:
    AdminProductActionResponse;

  try {
    result =
      (await response.json()) as AdminProductActionResponse;
  } catch {
    throw new Error(
      "Admin product action returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.error ||
        "Unable to update product."
    );
  }
}

export async function updateAdminProductStatus(
  merchantId: string,
  productId: string,
  status: AdminProductStatus
): Promise<void> {
  await runAdminProductAction(
    merchantId,
    productId,
    {
      action: "status",
      status,
    }
  );
}

export async function updateAdminProductFeatured(
  merchantId: string,
  productId: string,
  isFeatured: boolean
): Promise<void> {
  await runAdminProductAction(
    merchantId,
    productId,
    {
      action: "featured",
      isFeatured,
    }
  );
}

export async function updateAdminProductSortOrder(
  merchantId: string,
  productId: string,
  sortOrder: number
): Promise<void> {
  await runAdminProductAction(
    merchantId,
    productId,
    {
      action: "sortOrder",
      sortOrder,
    }
  );
}

export async function deactivateAdminProduct(
  merchantId: string,
  productId: string,
  reason: string
): Promise<void> {
  await runAdminProductAction(
    merchantId,
    productId,
    {
      action: "deactivate",
      reason,
    }
  );
}

/* ============================================================
 * Reviews
 * Add this section to lib/admin-merchant-detail.ts
 * ============================================================
 */

export type AdminMerchantReviewStatus =
  | "PUBLISHED"
  | "HIDDEN"
  | "DELETED";

export type AdminMerchantReview = {
  reviewId: string;
  transactionId: string;

  memberId: string;
  memberName: string;
  merchantId: string;

  rating: number;
  comment: string;
  merchantReply: string;

  status:
    AdminMerchantReviewStatus;

  isPinned: boolean;

  adminNote: string;
  adminUpdatedBy: string;
  adminUpdatedAt: string;

  createdAt: string;
  updatedAt: string;
};

export type AdminMerchantReviewSummary = {
  total: number;
  published: number;
  hidden: number;
  deleted: number;
  pinned: number;

  replied: number;
  pendingReplies: number;

  averageRating: number;

  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

type AdminReviewActionResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

async function runAdminReviewAction(
  merchantId: string,
  reviewId: string,
  body: Record<string, unknown>
): Promise<void> {
  const response =
    await fetch(
      `/api/admin/merchants/${encodeURIComponent(
        merchantId
      )}/reviews/${encodeURIComponent(
        reviewId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body:
          JSON.stringify(body),
      }
    );

  let result:
    AdminReviewActionResponse;

  try {
    result =
      (await response.json()) as AdminReviewActionResponse;
  } catch {
    throw new Error(
      "Review action returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.error ||
        "Unable to update review."
    );
  }
}

export async function replyAdminMerchantReview(
  merchantId: string,
  reviewId: string,
  merchantReply: string
): Promise<void> {
  await runAdminReviewAction(
    merchantId,
    reviewId,
    {
      action: "reply",
      merchantReply,
    }
  );
}

export async function updateAdminMerchantReviewStatus(
  merchantId: string,
  reviewId: string,
  status: AdminMerchantReviewStatus,
  reason = ""
): Promise<void> {
  await runAdminReviewAction(
    merchantId,
    reviewId,
    {
      action: "status",
      status,
      reason,
    }
  );
}

export async function updateAdminMerchantReviewPinned(
  merchantId: string,
  reviewId: string,
  isPinned: boolean
): Promise<void> {
  await runAdminReviewAction(
    merchantId,
    reviewId,
    {
      action: "pinned",
      isPinned,
    }
  );
}

export async function deleteAdminMerchantReview(
  merchantId: string,
  reviewId: string,
  reason: string
): Promise<void> {
  await runAdminReviewAction(
    merchantId,
    reviewId,
    {
      action: "delete",
      reason,
    }
  );
}

/* ============================================================
 * Merchant Push Devices
 * Add this section to lib/admin-merchant-detail.ts
 * ============================================================
 */

export type AdminMerchantPushDeviceStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "REMOVED";

export type AdminMerchantPushDevice = {
  subscriptionId: string;

  userType: string;
  userId: string;

  endpoint: string;
  userAgent: string;

  browser: string;
  platform: string;
  deviceName: string;

  status:
    AdminMerchantPushDeviceStatus;

  createdAt: string;
  updatedAt: string;
};

type AdminPushDeviceActionResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

async function runAdminPushDeviceAction(
  merchantId: string,
  subscriptionId: string,
  body: Record<string, unknown>
): Promise<void> {
  const response =
    await fetch(
      `/api/admin/merchants/${encodeURIComponent(
        merchantId
      )}/push-devices/${encodeURIComponent(
        subscriptionId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body:
          JSON.stringify(body),
      }
    );

  let result:
    AdminPushDeviceActionResponse;

  try {
    result =
      (await response.json()) as AdminPushDeviceActionResponse;
  } catch {
    throw new Error(
      "Push device action returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.error ||
        "Unable to update push device."
    );
  }
}

export async function updateAdminMerchantPushDeviceStatus(
  merchantId: string,
  subscriptionId: string,
  status:
    | "ACTIVE"
    | "INACTIVE"
): Promise<void> {
  await runAdminPushDeviceAction(
    merchantId,
    subscriptionId,
    {
      action: "status",
      status,
    }
  );
}

export async function removeAdminMerchantPushDevice(
  merchantId: string,
  subscriptionId: string,
  reason: string
): Promise<void> {
  await runAdminPushDeviceAction(
    merchantId,
    subscriptionId,
    {
      action: "remove",
      reason,
    }
  );
}