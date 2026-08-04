export type AdminRewardCreditMember = {
  memberId: string;
  fullName: string;
  email: string;
  phone: string;
  tier: string;
  status: string;
  referralCode: string;

  availableCredits: number;
  lifetimeEarned: number;
  totalUsed: number;
  totalPaid: number;
  totalPending: number;

  rewardCreditsUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminRewardCreditsSummary = {
  totalMembers: number;
  membersWithCredits: number;
  zeroBalanceMembers: number;
  totalAvailableCredits: number;
  totalLifetimeEarned: number;
  totalUsed: number;
  averageAvailableCredits: number;
};

export type AdminRewardCreditsPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AdminRewardCreditsListData = {
  generatedAt: string;
  timezone: string;

  summary: AdminRewardCreditsSummary;

  filters: {
    search: string;
    tier: string;
    status: string;
    balance: string;
    sortBy: string;
  };

  options: {
    tiers: string[];
    statuses: string[];
    balances: string[];
    sortOptions: string[];
  };

  pagination: AdminRewardCreditsPagination;
  members: AdminRewardCreditMember[];
};

export type AdminRewardCreditHistory = {
  historyId: string;
  memberId: string;
  type: "ADD" | "DEDUCT" | string;
  action: string;
  amount: number;
  signedAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: string;
  level: string;
  sourceMemberId: string;
  transactionId: string;
  adminId: string;
  adminName: string;
  createdAt: string;
};

export type AdminRewardCreditDetail = {
  generatedAt: string;
  timezone: string;

  member: {
    memberId: string;
    fullName: string;
    email: string;
    phone: string;
    tier: string;
    status: string;
    referralCode: string;
    createdAt: string;
    updatedAt: string;
  };

  wallet: {
    availableCredits: number;
    lifetimeEarned: number;
    totalUsed: number;
    totalPaid: number;
    totalPending: number;
    lastUpdatedAt: string;
  };

  historySummary: {
    totalRecords: number;
    totalAdded: number;
    totalDeducted: number;
    adminAdjustments: number;
    referralRewards: number;
  };

  history: AdminRewardCreditHistory[];
};

export type GetAdminRewardCreditsInput = {
  search?: string;
  tier?: string;
  status?: string;
  balance?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
};

export type AdjustAdminRewardCreditsInput = {
  adjustmentType: "ADD" | "DEDUCT";
  amount: number;
  reason: string;
};

export type AdjustAdminRewardCreditsResult = {
  adjustmentId: string;
  memberId: string;
  adjustmentType: string;
  amount: number;
  signedAmount: number;
  previousBalance: number;
  newBalance: number;
  changed: boolean;
  updatedAt: string;
  message: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export async function getAdminRewardCredits(
  input: GetAdminRewardCreditsInput = {}
): Promise<AdminRewardCreditsListData> {
  const params =
    new URLSearchParams();

  params.set(
    "search",
    String(input.search || "")
  );

  params.set(
    "tier",
    String(input.tier || "ALL")
  );

  params.set(
    "status",
    String(input.status || "ALL")
  );

  params.set(
    "balance",
    String(input.balance || "ALL")
  );

  params.set(
    "sortBy",
    String(
      input.sortBy || "AVAILABLE_DESC"
    )
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
      `/api/admin/reward-credits?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  const result =
    await readApiResponse<AdminRewardCreditsListData>(
      response,
      "Reward Credits API returned an invalid response."
    );

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
      result.message ||
      "Unable to load Reward Credits."
    );
  }

  return normalizeListData(
    unwrapData(result.data)
  );
}

export async function getAdminMemberRewardCreditDetail(
  memberId: string
): Promise<AdminRewardCreditDetail> {
  const response =
    await fetch(
      `/api/admin/reward-credits/${encodeURIComponent(
        memberId
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  const result =
    await readApiResponse<AdminRewardCreditDetail>(
      response,
      "Reward Credit detail API returned an invalid response."
    );

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
      result.message ||
      "Unable to load Reward Credit details."
    );
  }

  return normalizeDetail(
    unwrapData(result.data)
  );
}

export async function adjustAdminMemberRewardCredits(
  memberId: string,
  input: AdjustAdminRewardCreditsInput
): Promise<AdjustAdminRewardCreditsResult> {
  const response =
    await fetch(
      `/api/admin/reward-credits/${encodeURIComponent(
        memberId
      )}`,
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

  const result =
    await readApiResponse<AdjustAdminRewardCreditsResult>(
      response,
      "Reward Credit adjustment API returned an invalid response."
    );

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
      result.message ||
      "Unable to adjust Reward Credits."
    );
  }

  return unwrapData(
    result.data
  );
}

async function readApiResponse<T>(
  response: Response,
  fallback: string
): Promise<ApiResponse<T>> {
  const rawText =
    await response.text();

  try {
    return JSON.parse(
      rawText
    ) as ApiResponse<T>;
  } catch {
    throw new Error(
      rawText
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500) ||
      fallback
    );
  }
}

function unwrapData<T>(
  value: T | { data?: T }
): T {
  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    (value as { data?: T }).data
  ) {
    return (
      value as { data: T }
    ).data;
  }

  return value as T;
}

function normalizeListData(
  raw: AdminRewardCreditsListData
): AdminRewardCreditsListData {
  return {
    generatedAt:
      raw?.generatedAt || "",

    timezone:
      raw?.timezone ||
      "Asia/Kuala_Lumpur",

    summary: {
      totalMembers:
        numberValue(
          raw?.summary?.totalMembers
        ),
      membersWithCredits:
        numberValue(
          raw?.summary
            ?.membersWithCredits
        ),
      zeroBalanceMembers:
        numberValue(
          raw?.summary
            ?.zeroBalanceMembers
        ),
      totalAvailableCredits:
        numberValue(
          raw?.summary
            ?.totalAvailableCredits
        ),
      totalLifetimeEarned:
        numberValue(
          raw?.summary
            ?.totalLifetimeEarned
        ),
      totalUsed:
        numberValue(
          raw?.summary?.totalUsed
        ),
      averageAvailableCredits:
        numberValue(
          raw?.summary
            ?.averageAvailableCredits
        ),
    },

    filters: {
      search:
        raw?.filters?.search || "",
      tier:
        raw?.filters?.tier || "ALL",
      status:
        raw?.filters?.status || "ALL",
      balance:
        raw?.filters?.balance || "ALL",
      sortBy:
        raw?.filters?.sortBy ||
        "AVAILABLE_DESC",
    },

    options: {
      tiers:
        arrayValue(
          raw?.options?.tiers
        ),
      statuses:
        arrayValue(
          raw?.options?.statuses
        ),
      balances:
        arrayValue(
          raw?.options?.balances
        ),
      sortOptions:
        arrayValue(
          raw?.options?.sortOptions
        ),
    },

    pagination: {
      page:
        numberValue(
          raw?.pagination?.page,
          1
        ),
      pageSize:
        numberValue(
          raw?.pagination?.pageSize,
          25
        ),
      totalItems:
        numberValue(
          raw?.pagination?.totalItems
        ),
      totalPages:
        Math.max(
          1,
          numberValue(
            raw?.pagination?.totalPages,
            1
          )
        ),
      showingFrom:
        numberValue(
          raw?.pagination?.showingFrom
        ),
      showingTo:
        numberValue(
          raw?.pagination?.showingTo
        ),
      hasPrevious:
        Boolean(
          raw?.pagination?.hasPrevious
        ),
      hasNext:
        Boolean(
          raw?.pagination?.hasNext
        ),
    },

    members:
      Array.isArray(
        raw?.members
      )
        ? raw.members.map(
            normalizeMember
          )
        : [],
  };
}

function normalizeMember(
  raw: AdminRewardCreditMember
): AdminRewardCreditMember {
  return {
    memberId:
      raw?.memberId || "",
    fullName:
      raw?.fullName || "",
    email:
      raw?.email || "",
    phone:
      raw?.phone || "",
    tier:
      raw?.tier || "SILVER",
    status:
      raw?.status || "ACTIVE",
    referralCode:
      raw?.referralCode || "",

    availableCredits:
      numberValue(
        raw?.availableCredits
      ),
    lifetimeEarned:
      numberValue(
        raw?.lifetimeEarned
      ),
    totalUsed:
      numberValue(
        raw?.totalUsed
      ),
    totalPaid:
      numberValue(
        raw?.totalPaid
      ),
    totalPending:
      numberValue(
        raw?.totalPending
      ),

    rewardCreditsUpdatedAt:
      raw?.rewardCreditsUpdatedAt || "",
    createdAt:
      raw?.createdAt || "",
    updatedAt:
      raw?.updatedAt || "",
  };
}

function normalizeDetail(
  raw: AdminRewardCreditDetail
): AdminRewardCreditDetail {
  return {
    generatedAt:
      raw?.generatedAt || "",
    timezone:
      raw?.timezone ||
      "Asia/Kuala_Lumpur",

    member: {
      memberId:
        raw?.member?.memberId || "",
      fullName:
        raw?.member?.fullName || "",
      email:
        raw?.member?.email || "",
      phone:
        raw?.member?.phone || "",
      tier:
        raw?.member?.tier || "SILVER",
      status:
        raw?.member?.status || "ACTIVE",
      referralCode:
        raw?.member?.referralCode || "",
      createdAt:
        raw?.member?.createdAt || "",
      updatedAt:
        raw?.member?.updatedAt || "",
    },

    wallet: {
      availableCredits:
        numberValue(
          raw?.wallet
            ?.availableCredits
        ),
      lifetimeEarned:
        numberValue(
          raw?.wallet
            ?.lifetimeEarned
        ),
      totalUsed:
        numberValue(
          raw?.wallet?.totalUsed
        ),
      totalPaid:
        numberValue(
          raw?.wallet?.totalPaid
        ),
      totalPending:
        numberValue(
          raw?.wallet?.totalPending
        ),
      lastUpdatedAt:
        raw?.wallet
          ?.lastUpdatedAt || "",
    },

    historySummary: {
      totalRecords:
        numberValue(
          raw?.historySummary
            ?.totalRecords
        ),
      totalAdded:
        numberValue(
          raw?.historySummary
            ?.totalAdded
        ),
      totalDeducted:
        numberValue(
          raw?.historySummary
            ?.totalDeducted
        ),
      adminAdjustments:
        numberValue(
          raw?.historySummary
            ?.adminAdjustments
        ),
      referralRewards:
        numberValue(
          raw?.historySummary
            ?.referralRewards
        ),
    },

    history:
      Array.isArray(
        raw?.history
      )
        ? raw.history.map(
            (item) => ({
              historyId:
                item?.historyId || "",
              memberId:
                item?.memberId || "",
              type:
                item?.type || "",
              action:
                item?.action || "",
              amount:
                numberValue(
                  item?.amount
                ),
              signedAmount:
                numberValue(
                  item?.signedAmount
                ),
              balanceBefore:
                numberValue(
                  item?.balanceBefore
                ),
              balanceAfter:
                numberValue(
                  item?.balanceAfter
                ),
              description:
                item?.description || "",
              status:
                item?.status || "",
              level:
                item?.level || "",
              sourceMemberId:
                item?.sourceMemberId || "",
              transactionId:
                item?.transactionId || "",
              adminId:
                item?.adminId || "",
              adminName:
                item?.adminName || "",
              createdAt:
                item?.createdAt || "",
            })
          )
        : [],
  };
}

function arrayValue(
  value: unknown
): string[] {
  return Array.isArray(value)
    ? value.map(String)
    : [];
}

function numberValue(
  value: unknown,
  fallback = 0
) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}
