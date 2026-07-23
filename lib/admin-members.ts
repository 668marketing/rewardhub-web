export type AdminMember = {
  memberId: string;
  cardId: string;
  fullName: string;
  email: string;
  phone: string;

  tier: "SILVER" | "GOLD" | "PLATINUM" | string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | string;

  referralCode: string;
  referredByMemberId: string;
  referredByMerchantId: string;

  points: number;
  rewardCredits: number;

  totalSpend: number;
  totalTransactions: number;
  lastTransactionAt: string;

  createdAt: string;
  updatedAt: string;
};

export type AdminMemberSummary = {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  silver: number;
  gold: number;
  platinum: number;
};

export type AdminMemberPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AdminMembersData = {
  members: AdminMember[];

  summary: AdminMemberSummary;

  pagination: AdminMemberPagination;

  filters: {
    search: string;
    status: string;
    tier: string;
    dateFrom: string;
    dateTo: string;
    sortBy: string;
    sortDirection: string;
  };
};

export type AdminMembersQuery = {
  search?: string;
  status?: string;
  tier?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
};

type AdminMembersResponse = {
  success: boolean;
  data?: AdminMembersData;
  error?: string;
};

export async function getAdminMembers(
  query: AdminMembersQuery
): Promise<AdminMembersData> {
  const params = new URLSearchParams();

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.tier) {
    params.set("tier", query.tier);
  }

  if (query.dateFrom) {
    params.set("dateFrom", query.dateFrom);
  }

  if (query.dateTo) {
    params.set("dateTo", query.dateTo);
  }

  params.set(
    "page",
    String(query.page || 1)
  );

  params.set(
    "limit",
    String(query.limit || 25)
  );

  params.set(
    "sortBy",
    query.sortBy || "CREATED_AT"
  );

  params.set(
    "sortDirection",
    query.sortDirection || "DESC"
  );

  const response = await fetch(
    `/api/admin/members?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const result =
    (await response.json()) as AdminMembersResponse;

  if (!response.ok || !result.data) {
    throw new Error(
      result.error ||
        "Unable to load members."
    );
  }

  return result.data;
}