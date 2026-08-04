export type AdminSettlementStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "PAID"
  | "REJECTED"
  | "UNKNOWN"
  | string;

export type AdminSettlement = {
  settlementId: string;
  merchantId: string;
  month: string;

  totalSales: number;
  totalCashback: number;
  totalRewardCredits: number;
  totalMarketingBudget: number;
  amountPayable: number;

  bankName: string;
  bankAccount: string;
  merchantName: string;

  status: AdminSettlementStatus;

  createdAt: string;
  paidAt: string;

  paymentMethod: string;
  receiptUrl: string;
  paymentNote: string;

  rejectReason: string;

  approvedAt: string;
  approvedBy: string;

  rejectedAt: string;
  rejectedBy: string;

  updatedAt: string;
};

export type AdminSettlementSummary = {
  total: number;
  pending: number;
  submitted: number;
  approved: number;
  paid: number;
  rejected: number;

  totalAmount: number;
  pendingAmount: number;
  submittedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  rejectedAmount: number;
};

export type AdminSettlementPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AdminSettlementListData = {
  generatedAt: string;
  timezone: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  summary: AdminSettlementSummary;
  months: string[];

  filters: {
    search: string;
    status: string;
    month: string;
    dateFrom: string;
    dateTo: string;
  };

  pagination: AdminSettlementPagination;
  settlements: AdminSettlement[];
};

export type AdminSettlementDetailData = {
  generatedAt: string;
  timezone: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  settlement: AdminSettlement;

  merchant: {
    merchantId: string;
    businessName: string;
    displayName: string;
    email: string;
    phone: string;
    category: string;
    subCategory: string;
    state: string;
    area: string;
    status: string;
  };

  actions: {
    canApprove: boolean;
    canReject: boolean;
    canMarkPaid: boolean;
    locked: boolean;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type GetAdminSettlementsInput = {
  search?: string;
  status?: string;
  month?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export async function getAdminSettlements(
  input: GetAdminSettlementsInput = {}
): Promise<AdminSettlementListData> {
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
    "month",
    String(input.month || "")
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
    `/api/admin/settlements?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  let result:
    ApiResponse<AdminSettlementListData>;

  try {
    result =
      (await response.json()) as
        ApiResponse<AdminSettlementListData>;
  } catch {
    throw new Error(
      "Settlement API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        "Unable to load settlements."
    );
  }

  return normalizeListData(
    result.data
  );
}

export async function getAdminSettlementDetail(
  settlementId: string
): Promise<AdminSettlementDetailData> {
  const response = await fetch(
    `/api/admin/settlements/${encodeURIComponent(
      settlementId
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  let result:
    ApiResponse<AdminSettlementDetailData>;

  try {
    result =
      (await response.json()) as
        ApiResponse<AdminSettlementDetailData>;
  } catch {
    throw new Error(
      "Settlement detail API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data?.settlement
  ) {
    throw new Error(
      result.error ||
        "Unable to load settlement details."
    );
  }

  return result.data;
}

export async function approveAdminSettlement(
  settlement: Pick<
    AdminSettlement,
    "settlementId" | "merchantId"
  >
): Promise<void> {
  await runSettlementAction(
    settlement.settlementId,
    {
      action: "approve",
      merchantId:
        settlement.merchantId,
    }
  );
}

export async function markAdminSettlementPaid(
  settlement: Pick<
    AdminSettlement,
    "settlementId" | "merchantId"
  >,
  paymentMethod = "Bank Transfer",
  paymentNote = "Settlement payment completed.",
  receiptUrl = ""
): Promise<void> {
  await runSettlementAction(
    settlement.settlementId,
    {
      action: "mark-paid",
      merchantId:
        settlement.merchantId,
      paymentMethod,
      paymentNote,
      receiptUrl,
    }
  );
}

export async function rejectAdminSettlement(
  settlement: Pick<
    AdminSettlement,
    "settlementId" | "merchantId"
  >,
  rejectReason: string
): Promise<void> {
  await runSettlementAction(
    settlement.settlementId,
    {
      action: "reject",
      merchantId:
        settlement.merchantId,
      rejectReason,
    }
  );
}

async function runSettlementAction(
  settlementId: string,
  body: Record<string, unknown>
): Promise<void> {
  const response = await fetch(
    `/api/admin/settlements/${encodeURIComponent(
      settlementId
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(body),
    }
  );

  let result:
    ApiResponse<unknown>;

  try {
    result =
      (await response.json()) as
        ApiResponse<unknown>;
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

function normalizeListData(
  data: AdminSettlementListData
): AdminSettlementListData {
  return {
    generatedAt:
      data.generatedAt || "",
    timezone:
      data.timezone ||
      "Asia/Kuala_Lumpur",

    admin:
      data.admin || {
        adminId: "",
        fullName: "",
        role: "",
      },

    summary: {
      total:
        Number(
          data.summary?.total || 0
        ),
      pending:
        Number(
          data.summary?.pending || 0
        ),
      submitted:
        Number(
          data.summary?.submitted || 0
        ),
      approved:
        Number(
          data.summary?.approved || 0
        ),
      paid:
        Number(
          data.summary?.paid || 0
        ),
      rejected:
        Number(
          data.summary?.rejected || 0
        ),

      totalAmount:
        Number(
          data.summary?.totalAmount || 0
        ),
      pendingAmount:
        Number(
          data.summary?.pendingAmount || 0
        ),
      submittedAmount:
        Number(
          data.summary?.submittedAmount || 0
        ),
      approvedAmount:
        Number(
          data.summary?.approvedAmount || 0
        ),
      paidAmount:
        Number(
          data.summary?.paidAmount || 0
        ),
      rejectedAmount:
        Number(
          data.summary?.rejectedAmount || 0
        ),
    },

    months:
      Array.isArray(data.months)
        ? data.months
        : [],

    filters:
      data.filters || {
        search: "",
        status: "ALL",
        month: "",
        dateFrom: "",
        dateTo: "",
      },

    pagination: {
      page:
        Number(
          data.pagination?.page || 1
        ),
      pageSize:
        Number(
          data.pagination?.pageSize || 25
        ),
      totalItems:
        Number(
          data.pagination?.totalItems || 0
        ),
      totalPages:
        Math.max(
          1,
          Number(
            data.pagination?.totalPages || 1
          )
        ),
      showingFrom:
        Number(
          data.pagination?.showingFrom || 0
        ),
      showingTo:
        Number(
          data.pagination?.showingTo || 0
        ),
      hasPrevious:
        Boolean(
          data.pagination?.hasPrevious
        ),
      hasNext:
        Boolean(
          data.pagination?.hasNext
        ),
    },

    settlements:
      Array.isArray(data.settlements)
        ? data.settlements
        : [],
  };
}
