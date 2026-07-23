export type AdminDashboardData = {
  generatedAt: string;
  timezone: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  members: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    newToday: number;

    tiers: {
      silver: number;
      gold: number;
      platinum: number;
    };
  };

  merchants: {
    total: number;
    active: number;
    pending: number;
    rejected: number;
    inactive: number;
    newToday: number;
  };

  transactions: {
    total: number;
    completed: number;
    failed: number;
    cancelled: number;

    today: {
      count: number;
      sales: number;
      cashback: number;
      rewardCreditsUsed: number;
      pointsIssued: number;
      platformRetention: number;
    };

    month: {
      count: number;
      sales: number;
    };
  };

  settlements: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
    rejected: number;
    pendingAmount: number;
    paidAmount: number;
  };

  cardApplications: {
    total: number;
    pending: number;
    approved: number;
    processing: number;
    shipped: number;
    completed: number;
    rejected: number;
  };

  pendingActions: {
    merchantApplications: number;
    settlementRequests: number;
    cardApplications: number;
    total: number;
  };

  recentTransactions: Array<{
    transactionId: string;
    referenceNo: string;
    memberId: string;
    memberName: string;
    merchantId: string;
    merchantName: string;
    amount: number;
    netPaid: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
  }>;
};

type DashboardResponse = {
  success: boolean;
  data?: AdminDashboardData;
  error?: string;
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const response = await fetch(
    "/api/admin/dashboard",
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const result =
    (await response.json()) as DashboardResponse;

  if (!response.ok || !result.data) {
    throw new Error(
      result.error ||
        "Unable to load admin dashboard."
    );
  }

  return result.data;
}