import type { AdminMember } from "@/lib/admin-members";

export type AdminMemberDetailData = {
  member: AdminMember & {
    dateOfBirth?: string;
    gender?: string;

    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;

    profilePhotoUrl?: string;
    lastLoginAt?: string;
  };

  points: {
    summary: {
      currentPoints: number;
      totalEarned: number;
      totalRedeemed: number;
    };

    history: Array<{
      historyId: string;
      type: string;
      points: number;
      balanceAfter: number;
      description: string;
      referenceId: string;
      createdAt: string;
    }>;
  };

  referrals: {
    summary: {
      availableCommission: number;
      totalCommission: number;
      totalPaid: number;
      historyCount: number;
    };

    history: Array<{
      historyId: string;
      sourceMemberId: string;
      level: string;
      amount: number;
      status: string;
      transactionId: string;
      description: string;
      createdAt: string;
    }>;
  };

  transactions: {
    summary: {
      totalTransactions: number;
      totalSpend: number;
      totalCashback: number;
      rewardCreditsUsed: number;
      pointsEarned: number;
      lastTransactionAt: string;
    };

    recent: Array<{
      transactionId: string;
      referenceNo: string;
      merchantId: string;
      merchantName: string;
      amount: number;
      cashback: number;
      rewardCreditsUsed: number;
      netPaid: number;
      paymentMethod: string;
      status: string;
      createdAt: string;
    }>;
  };

  cardApplications: Array<{
    applicationId: string;
    applicationType: string;
    status: string;
    trackingNumber: string;
    receiptUrl: string;
    createdAt: string;
    updatedAt: string;
  }>;

  pushSubscriptions: Array<{
    subscriptionId: string;
    endpoint: string;
    userAgent: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

type AdminMemberDetailResponse = {
  success: boolean;
  data?: AdminMemberDetailData;
  error?: string;
};

export async function getAdminMemberDetail(
  memberId: string
): Promise<AdminMemberDetailData> {
  const response = await fetch(
    `/api/admin/members/${encodeURIComponent(memberId)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  let result: AdminMemberDetailResponse;

  try {
    result =
      (await response.json()) as AdminMemberDetailResponse;
  } catch {
    throw new Error(
      "Member detail API returned an invalid response."
    );
  }

  if (!response.ok || !result.data) {
    throw new Error(
      result.error ||
        "Unable to load member details."
    );
  }

  return result.data;
}

export type AdminMemberStatusResult = {
  memberId: string;
  previousStatus: string;
  status: string;
  changed: boolean;
  updatedAt?: string;
  message: string;
};

type AdminMemberStatusResponse = {
  success: boolean;
  data?: AdminMemberStatusResult;
  error?: string;
};

export async function updateAdminMemberStatus(
  memberId: string,
  input: {
    status:
      | "ACTIVE"
      | "SUSPENDED";
    reason: string;
  }
): Promise<AdminMemberStatusResult> {
  const response = await fetch(
    `/api/admin/members/${encodeURIComponent(
      memberId
    )}/status`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(input),
    }
  );

  let result:
    AdminMemberStatusResponse;

  try {
    result =
      (await response.json()) as AdminMemberStatusResponse;
  } catch {
    throw new Error(
      "Member status API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        "Unable to update member status."
    );
  }

  return result.data;
}

export type AdminMemberTierResult = {
  memberId: string;
  previousTier: string;
  tier: string;
  changed: boolean;
  updatedAt?: string;
  message: string;
};

type AdminMemberTierResponse = {
  success: boolean;
  data?: AdminMemberTierResult;
  error?: string;
};

export async function updateAdminMemberTier(
  memberId: string,
  input: {
    tier:
      | "SILVER"
      | "GOLD"
      | "PLATINUM";
    reason: string;
  }
): Promise<AdminMemberTierResult> {
  const response = await fetch(
    `/api/admin/members/${encodeURIComponent(
      memberId
    )}/tier`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(input),
    }
  );

  let result:
    AdminMemberTierResponse;

  try {
    result =
      (await response.json()) as AdminMemberTierResponse;
  } catch {
    throw new Error(
      "Member tier API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        "Unable to update member tier."
    );
  }

  return result.data;
}

export type AdminRewardCreditsAdjustmentResult = {
  adjustmentId: string;
  memberId: string;
  adjustmentType:
    | "ADD"
    | "DEDUCT";
  amount: number;
  signedAmount: number;
  previousBalance: number;
  newBalance: number;
  changed: boolean;
  updatedAt: string;
  message: string;
};

type AdminRewardCreditsAdjustmentResponse = {
  success: boolean;
  data?: AdminRewardCreditsAdjustmentResult;
  error?: string;
};

export async function adjustAdminMemberRewardCredits(
  memberId: string,
  input: {
    adjustmentType:
      | "ADD"
      | "DEDUCT";
    amount: number;
    reason: string;
  }
): Promise<AdminRewardCreditsAdjustmentResult> {
  const response = await fetch(
    `/api/admin/members/${encodeURIComponent(
      memberId
    )}/reward-credits`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(input),
    }
  );

  let result:
    AdminRewardCreditsAdjustmentResponse;

  try {
    result =
      (await response.json()) as
        AdminRewardCreditsAdjustmentResponse;
  } catch {
    throw new Error(
      "Reward Credits API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        "Unable to adjust Reward Credits."
    );
  }

  return result.data;
}

export type AdminPointsAdjustmentResult = {
  adjustmentId: string;
  memberId: string;
  adjustmentType:
    | "ADD"
    | "DEDUCT";
  points: number;
  signedPoints: number;
  previousBalance: number;
  newBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  changed: boolean;
  updatedAt: string;
  message: string;
};

type AdminPointsAdjustmentResponse = {
  success: boolean;
  data?: AdminPointsAdjustmentResult;
  error?: string;
};

export async function adjustAdminMemberPoints(
  memberId: string,
  input: {
    adjustmentType:
      | "ADD"
      | "DEDUCT";
    points: number;
    reason: string;
  }
): Promise<AdminPointsAdjustmentResult> {
  const response = await fetch(
    `/api/admin/members/${encodeURIComponent(
      memberId
    )}/points`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(input),
    }
  );

  let result:
    AdminPointsAdjustmentResponse;

  try {
    result =
      (await response.json()) as
        AdminPointsAdjustmentResponse;
  } catch {
    throw new Error(
      "Member points API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        "Unable to adjust member points."
    );
  }

  return result.data;
}

export type AdminMemberProfileInput = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  reason: string;
};

export type AdminMemberProfileResult = {
  memberId: string;
  changed: boolean;
  changedFields: string[];
  profile: Omit<
    AdminMemberProfileInput,
    "reason"
  >;
  updatedAt?: string;
  message: string;
};

type AdminMemberProfileResponse = {
  success: boolean;
  data?: AdminMemberProfileResult;
  error?: string;
};

export async function updateAdminMemberProfile(
  memberId: string,
  input: AdminMemberProfileInput
): Promise<AdminMemberProfileResult> {
  const response = await fetch(
    `/api/admin/members/${encodeURIComponent(
      memberId
    )}/profile`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(input),
    }
  );

  let result:
    AdminMemberProfileResponse;

  try {
    result =
      (await response.json()) as
        AdminMemberProfileResponse;
  } catch {
    throw new Error(
      "Member profile API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        "Unable to update member profile."
    );
  }

  return result.data;
}

export type AdminMemberPasswordResetResult = {
  memberId: string;
  changed: boolean;
  updatedAt?: string;
  message: string;
};

type AdminMemberPasswordResetResponse = {
  success: boolean;
  data?: AdminMemberPasswordResetResult;
  error?: string;
};

export async function resetAdminMemberPassword(
  memberId: string,
  input: {
    newPassword: string;
    confirmPassword: string;
    reason: string;
  }
): Promise<AdminMemberPasswordResetResult> {
  const response = await fetch(
    `/api/admin/members/${encodeURIComponent(
      memberId
    )}/password`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(input),
    }
  );

  let result:
    AdminMemberPasswordResetResponse;

  try {
    result =
      (await response.json()) as
        AdminMemberPasswordResetResponse;
  } catch {
    throw new Error(
      "Member password API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        "Unable to reset member password."
    );
  }

  return result.data;
}