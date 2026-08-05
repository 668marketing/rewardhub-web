"use client";

/* ============================================================
 * RewardHub Admin Reports
 * File: lib/admin-reports.ts
 * ============================================================
 */

export type AdminReportDailyTrendItem = {
  date: string;
  transactions: number;
  grossSales: number;
  customerPaid: number;
  cashback: number;
  rewardCreditsUsed: number;
};

export type AdminReportMerchantItem = {
  merchantId: string;
  merchantName: string;
  category: string;
  transactionCount: number;
  grossSales: number;
  customerPaid: number;
  cashback: number;
};

export type AdminReportMemberItem = {
  memberId: string;
  memberName: string;
  tier: string;
  transactionCount: number;
  grossSales: number;
};

export type AdminReportsDashboard = {
  range: {
    startDate: string;
    endDate: string;
    timezone: string;
  };

  overview: {
    grossSales: number;
    customerPaid: number;
    transactionCount: number;
    averageTransactionValue: number;
    cashback: number;
    rewardCreditsUsed: number;
    pointsEarned: number;
    marketingAmount: number;
  };

  members: {
    total: number;
    active: number;
    newInRange: number;
    transactingInRange: number;
    tiers: {
      silver: number;
      gold: number;
      platinum: number;
      other: number;
    };
  };

  merchants: {
    total: number;
    active: number;
    pending: number;
    newInRange: number;
    sellingInRange: number;
  };

  points: {
    currentBalance: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
  };

  rewardCredits: {
    availableBalance: number;
    lifetimeEarned: number;
    lifetimePaid: number;
    usedInRange: number;
  };

  settlements: {
    total: number;
    pendingAmount: number;
    approvedAmount: number;
    paidAmount: number;
  };

  marketing: {
    averageNormalBudget: number;
    activeBoosts: number;
    marketingAmountInRange: number;
  };

  dailyTrend: AdminReportDailyTrendItem[];
  topMerchants: AdminReportMerchantItem[];
  topMembers: AdminReportMemberItem[];
  generatedAt: string;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T | { data?: T };
  result?: T;
  error?: string;
  message?: string;
};

function unwrapData<T>(value: unknown): T {
  let current = value;

  for (let index = 0; index < 4; index++) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      "data" in current
    ) {
      current = (
        current as Record<string, unknown>
      ).data;

      continue;
    }

    break;
  }

  return current as T;
}

async function readApiResponse<T>(
  response: Response
): Promise<T> {
  let result: ApiResponse<T>;

  try {
    result =
      (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(
      "Reports API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    result.success === false
  ) {
    throw new Error(
      result.error ||
      result.message ||
      "Unable to load reports."
    );
  }

  return unwrapData<T>(
    result.data ??
    result.result
  );
}

export async function getAdminReportsDashboard(
  input: {
    startDate: string;
    endDate: string;
  }
): Promise<AdminReportsDashboard> {
  const searchParams =
    new URLSearchParams({
      startDate:
        input.startDate,
      endDate:
        input.endDate,
    });

  const response =
    await fetch(
      `/api/admin/reports?${searchParams.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return readApiResponse<
    AdminReportsDashboard
  >(response);
}

export function formatReportCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY",
    {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(Number(value || 0));
}

export function formatReportNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY",
    {
      maximumFractionDigits: 2,
    }
  ).format(Number(value || 0));
}