export type AdminMerchantApplicationStatus =
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "INACTIVE"
  | string;

export type AdminMerchantApplication = {
  merchantId: string;
  businessName: string;
  displayName: string;
  ownerName: string;
  loginEmail: string;
  phone: string;
  ownerPhone: string;
  category: string;
  subCategory: string;
  state: string;
  area: string;
  address: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  marketingBudget: number;
  rewardCreditEnabled: boolean;
  maxRewardCreditPercent: number;
  promotionTitle: string;
  promotionDescription: string;
  promotionEndDate: string;
  promotionActive: boolean;
  referredByMember: string;
  referredByMemberName: string;
  openTime: string;
  closeTime: string;
  restDay: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNo: string;
  bankQrUrl: string;
  status: AdminMerchantApplicationStatus;
  reviewNote: string;
  reviewedBy: string;
  reviewedAt: string;
  rejectReason: string;
  submittedAt: string;
  updatedAt: string;
};

export type AdminMerchantApplicationSummary = {
  total: number;
  pending: number;
  active: number;
  rejected: number;
  other: number;
  newToday: number;
};

export type AdminMerchantApplicationPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AdminMerchantApplicationListData = {
  generatedAt: string;
  timezone: string;
  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };
  summary: AdminMerchantApplicationSummary;
  categories: string[];
  filters: {
    search: string;
    status: string;
    category: string;
    dateFrom: string;
    dateTo: string;
  };
  pagination: AdminMerchantApplicationPagination;
  applications: AdminMerchantApplication[];
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type GetAdminMerchantApplicationsInput = {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export async function getAdminMerchantApplications(
  input: GetAdminMerchantApplicationsInput = {}
): Promise<AdminMerchantApplicationListData> {
  const params = new URLSearchParams();

  params.set("search", String(input.search || ""));
  params.set("status", String(input.status || "ALL"));
  params.set("category", String(input.category || "ALL"));
  params.set("dateFrom", String(input.dateFrom || ""));
  params.set("dateTo", String(input.dateTo || ""));
  params.set("page", String(input.page || 1));
  params.set("pageSize", String(input.pageSize || 25));

  const response = await fetch(
    `/api/admin/merchant-applications?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  let result: ApiResponse<AdminMerchantApplicationListData>;

  try {
    result =
      (await response.json()) as ApiResponse<AdminMerchantApplicationListData>;
  } catch {
    throw new Error(
      "Merchant applications API returned an invalid response."
    );
  }

  if (!response.ok || !result.data) {
    throw new Error(
      result.error || "Unable to load merchant applications."
    );
  }

  return result.data;
}

export async function getAdminMerchantApplicationDetail(
  merchantId: string
): Promise<AdminMerchantApplication> {
  const response = await fetch(
    `/api/admin/merchant-applications/${encodeURIComponent(merchantId)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  let result: ApiResponse<{
    application: AdminMerchantApplication;
  }>;

  try {
    result = (await response.json()) as ApiResponse<{
      application: AdminMerchantApplication;
    }>;
  } catch {
    throw new Error(
      "Merchant application detail API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data?.application
  ) {
    throw new Error(
      result.error ||
        "Unable to load merchant application details."
    );
  }

  return result.data.application;
}

export async function approveAdminMerchantApplication(
  merchantId: string,
  reviewNote = ""
): Promise<AdminMerchantApplication> {
  return runApplicationAction(
    merchantId,
    {
      action: "approve",
      reviewNote,
    }
  );
}

export async function rejectAdminMerchantApplication(
  merchantId: string,
  rejectReason: string,
  reviewNote = ""
): Promise<AdminMerchantApplication> {
  return runApplicationAction(
    merchantId,
    {
      action: "reject",
      rejectReason,
      reviewNote,
    }
  );
}

async function runApplicationAction(
  merchantId: string,
  body: Record<string, unknown>
): Promise<AdminMerchantApplication> {
  const response = await fetch(
    `/api/admin/merchant-applications/${encodeURIComponent(merchantId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(body),
    }
  );

  let result: ApiResponse<{
    application?: AdminMerchantApplication;
    message?: string;
  }>;

  try {
    result = (await response.json()) as ApiResponse<{
      application?: AdminMerchantApplication;
      message?: string;
    }>;
  } catch {
    throw new Error(
      "Merchant application action returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.success ||
    !result.data?.application
  ) {
    throw new Error(
      result.error ||
        "Unable to update merchant application."
    );
  }

  return result.data.application;
}
