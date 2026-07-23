export type AdminMerchantStatus =
  | "ACTIVE"
  | "PENDING"
  | "SUSPENDED"
  | "REJECTED"
  | "INACTIVE"
  | string;

export type AdminMerchant = {
  merchantId: string;
  merchantName: string;
  legalName: string;
  email: string;
  phone: string;
  category: string;
  status: AdminMerchantStatus;
  logoUrl: string;
  ssmNumber: string;

  joinedAt: string;
  updatedAt: string;

  marketingBudgetPercent: number;
  monthlyMarketingBudget: number;
  marketingBudgetUsed: number;
  marketingBudgetRemaining: number;
  marketingStatus: string;

  transactionCount: number;
  completedTransactions: number;
  totalSales: number;
  cashbackIssued: number;
  rewardCreditsUsed: number;
  lastTransactionAt: string;

  settlementCount: number;
  pendingSettlements: number;
  pendingSettlementAmount: number;
  paidSettlementAmount: number;
};

export type AdminMerchantStats = {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  rejected: number;
  inactive: number;
  newToday: number;
  categories: number;
  totalSales: number;
  totalTransactions: number;
  pendingSettlements: number;
  pendingSettlementAmount: number;
};

export type AdminMerchantPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
};

export type AdminMerchantListData = {
  generatedAt: string;
  timezone: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  stats: AdminMerchantStats;
  categories: string[];

  filters: {
    search: string;
    status: string;
    category: string;
    dateFrom: string;
    dateTo: string;
  };

  pagination: AdminMerchantPagination;
  merchants: AdminMerchant[];
};

type AdminMerchantResponse = {
  success: boolean;
  data?: AdminMerchantListData;
  error?: string;
};

export type GetAdminMerchantsInput = {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export async function getAdminMerchants(
  input: GetAdminMerchantsInput = {}
): Promise<AdminMerchantListData> {
  const params = new URLSearchParams();

  params.set(
    "search",
    String(input.search || "")
  );

  params.set(
    "status",
    String(input.status || "ALL")
  );

  params.set(
    "category",
    String(input.category || "ALL")
  );

  params.set(
    "dateFrom",
    String(input.dateFrom || "")
  );

  params.set(
    "dateTo",
    String(input.dateTo || "")
  );

  params.set(
    "page",
    String(input.page || 1)
  );

  params.set(
    "pageSize",
    String(input.pageSize || 25)
  );

  const response = await fetch(
    `/api/admin/merchants?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  let result: AdminMerchantResponse;

  try {
    result =
      (await response.json()) as
        AdminMerchantResponse;
  } catch {
    throw new Error(
      "Merchant API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        "Unable to load merchants."
    );
  }

  return result.data;
}