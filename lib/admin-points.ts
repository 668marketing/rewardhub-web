export type AdminPointsMember = {
  memberId: string;
  fullName: string;
  email: string;
  phone: string;
  tier: string;
  status: string;
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  pointsUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminPointsListData = {
  generatedAt: string;
  timezone: string;

  summary: {
    totalMembers: number;
    membersWithPoints: number;
    zeroBalanceMembers: number;
    totalCurrentPoints: number;
    totalEarned: number;
    totalRedeemed: number;
    averageCurrentPoints: number;
  };

  filters: {
    search: string;
    tier: string;
    status: string;
    balance: string;
    sortBy: string;
  };

  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    showingFrom: number;
    showingTo: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };

  members: AdminPointsMember[];
};

export type AdminPointsHistory = {
  pointId: string;
  memberId: string;
  transactionId: string;
  type: string;
  source: string;
  sourceId: string;
  points: number;
  signedPoints: number;
  balanceAfter: number;
  description: string;
  adminId: string;
  adminName: string;
  createdAt: string;
};

export type AdminPointsDetail = {
  generatedAt: string;
  timezone: string;

  member: {
    memberId: string;
    fullName: string;
    email: string;
    phone: string;
    tier: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };

  wallet: {
    currentPoints: number;
    totalEarned: number;
    totalRedeemed: number;
    lastUpdatedAt: string;
  };

  historySummary: {
    totalRecords: number;
    totalAdded: number;
    totalDeducted: number;
    adminAdjustments: number;
  };

  history: AdminPointsHistory[];
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export async function getAdminPoints(input: {
  search?: string;
  tier?: string;
  status?: string;
  balance?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<AdminPointsListData> {
  const params = new URLSearchParams();

  params.set("search", input.search || "");
  params.set("tier", input.tier || "ALL");
  params.set("status", input.status || "ALL");
  params.set("balance", input.balance || "ALL");
  params.set("sortBy", input.sortBy || "CURRENT_DESC");
  params.set("page", String(input.page || 1));
  params.set("pageSize", String(input.pageSize || 25));

  const response = await fetch(
    `/api/admin/points?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const result = await readJson<AdminPointsListData>(
    response,
    "Points API returned an invalid response."
  );

  if (!response.ok || !result.data) {
    throw new Error(
      result.error ||
      result.message ||
      "Unable to load points."
    );
  }

  return result.data;
}

export async function getAdminMemberPointsDetail(
  memberId: string
): Promise<AdminPointsDetail> {
  const response = await fetch(
    `/api/admin/points/${encodeURIComponent(memberId)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const result = await readJson<AdminPointsDetail>(
    response,
    "Points detail API returned an invalid response."
  );

  if (!response.ok || !result.data) {
    throw new Error(
      result.error ||
      result.message ||
      "Unable to load point details."
    );
  }

  return result.data;
}

export async function adjustAdminMemberPoints(
  memberId: string,
  input: {
    adjustmentType: "ADD" | "DEDUCT";
    amount: number;
    reason: string;
  }
) {
  const response = await fetch(
    `/api/admin/points/${encodeURIComponent(memberId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(input),
    }
  );

  const result = await readJson<{
    adjustmentId: string;
    memberId: string;
    adjustmentType: string;
    amount: number;
    signedPoints: number;
    previousBalance: number;
    newBalance: number;
    changed: boolean;
    updatedAt: string;
    message: string;
  }>(
    response,
    "Point adjustment API returned an invalid response."
  );

  if (!response.ok || !result.data) {
    throw new Error(
      result.error ||
      result.message ||
      "Unable to adjust points."
    );
  }

  return result.data;
}

async function readJson<T>(
  response: Response,
  fallback: string
): Promise<ApiResponse<T>> {
  const text = await response.text();

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error(
      text.replace(/\s+/g, " ").trim().slice(0, 500) ||
      fallback
    );
  }
}
