export type AdminSettlementStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "PAID"
  | "REJECTED"
  | "UNKNOWN"
  | string;

export type AdminSettlementDirection =
  | "MERCHANT_TO_REWARDHUB"
  | "REWARDHUB_TO_MERCHANT"
  | "NO_PAYMENT";

export type AdminSettlement = {
  settlementId: string;
  merchantId: string;
  month: string;

  totalSales: number;
  totalCashback: number;
  totalRewardCredits: number;
  totalVoucherDiscount: number;
  totalMarketingBudget: number;

  merchantDue: number;
  rewardHubDue: number;
  netAmount: number;

  settlementDirection:
    AdminSettlementDirection;
  directionLabel: string;

  amountPayable: number;

  bankName: string;
bankAccount: string;
bankAccountName: string;
bankQrUrl: string;
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

  merchantToRewardHubCount:
    number;
  merchantToRewardHubAmount:
    number;

  rewardHubToMerchantCount:
    number;
  rewardHubToMerchantAmount:
    number;

  noPaymentCount: number;
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

  pagination:
    AdminSettlementPagination;

  settlements:
    AdminSettlement[];
};

export type AdminSettlementDetailData = {
  generatedAt: string;
  timezone: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  settlement:
    AdminSettlement;

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

    paymentDirection:
      AdminSettlementDirection;

    requiresMerchantReceipt:
      boolean;

    requiresAdminPayment:
      boolean;

    noPaymentRequired:
      boolean;

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
  input:
    GetAdminSettlementsInput = {}
): Promise<AdminSettlementListData> {
  const params =
    new URLSearchParams();

  params.set(
    "search",
    String(input.search || "")
  );

  params.set(
    "status",
    String(
      input.status || "ALL"
    )
  );

  params.set(
    "month",
    String(input.month || "")
  );

  params.set(
    "dateFrom",
    String(
      input.dateFrom || ""
    )
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
    String(
      input.pageSize || 25
    )
  );

  const response =
    await fetch(
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
  const response =
    await fetch(
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

  return normalizeDetailData(
    result.data
  );
}

export async function approveAdminSettlement(
  settlement: Pick<
    AdminSettlement,
    | "settlementId"
    | "merchantId"
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
    | "settlementId"
    | "merchantId"
  >,
  paymentMethod =
    "Bank Transfer",
  paymentNote = "",
  receiptUrl = ""
): Promise<void> {
  await runSettlementAction(
    settlement.settlementId,
    {
      action:
        "mark-paid",
      merchantId:
        settlement.merchantId,
      paymentMethod,
      paymentNote,
      receiptUrl,
    }
  );
}


export async function uploadAdminSettlementPaymentReceipt(
  settlement: Pick<
    AdminSettlement,
    | "settlementId"
    | "merchantId"
  >,
  input: {
    fileName: string;
    mimeType: string;
    base64: string;
    paymentMethod?: string;
    paymentNote?: string;
  }
): Promise<void> {
  await runSettlementAction(
    settlement.settlementId,
    {
      action:
        "upload-payment-receipt",

      merchantId:
        settlement.merchantId,

      fileName:
        input.fileName,

      mimeType:
        input.mimeType,

      base64:
        input.base64,

      paymentMethod:
        input.paymentMethod ||
        "Bank Transfer",

      paymentNote:
        input.paymentNote ||
        "",
    }
  );
}

export async function rejectAdminSettlement(
  settlement: Pick<
    AdminSettlement,
    | "settlementId"
    | "merchantId"
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
  body: Record<
    string,
    unknown
  >
): Promise<void> {
  const response =
    await fetch(
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
        body:
          JSON.stringify(body),
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

function normalizeDirection(
  value: unknown,
  netAmount: number
): AdminSettlementDirection {
  const direction =
    String(value || "")
      .trim()
      .toUpperCase()
      .replace(
        /[\s-]+/g,
        "_"
      );

  if (
    direction ===
      "MERCHANT_TO_REWARDHUB" ||
    direction ===
      "REWARDHUB_TO_MERCHANT" ||
    direction ===
      "NO_PAYMENT"
  ) {
    return direction;
  }

  if (netAmount > 0) {
    return "MERCHANT_TO_REWARDHUB";
  }

  if (netAmount < 0) {
    return "REWARDHUB_TO_MERCHANT";
  }

  return "NO_PAYMENT";
}

function normalizeSettlement(
  settlement:
    AdminSettlement
): AdminSettlement {
  const totalMarketingBudget =
    Number(
      settlement.totalMarketingBudget ||
        0
    );

  const totalCashback =
    Number(
      settlement.totalCashback ||
        0
    );

  const totalRewardCredits =
    Number(
      settlement.totalRewardCredits ||
        0
    );

  const totalVoucherDiscount =
    Number(
      settlement.totalVoucherDiscount ||
        0
    );

  /*
   * Cashback is funded from the merchant's Marketing Budget,
   * so Merchant Due is the remaining Marketing Budget after Cashback.
   */
  const merchantDue =
    Number(
      settlement.merchantDue ??
        Math.max(
          totalMarketingBudget -
            totalCashback,
          0
        )
    );

  /*
   * RewardHub funds both Reward Credits and RewardHub Vouchers.
   */
  const rewardHubDue =
    Number(
      settlement.rewardHubDue ??
        (
          totalRewardCredits +
          totalVoucherDiscount
        )
    );

  const fallbackNet =
    merchantDue -
    rewardHubDue;

  const netAmount =
    Number(
      settlement.netAmount ??
        fallbackNet
    );

  const direction =
    normalizeDirection(
      settlement.settlementDirection,
      netAmount
    );

  const amountPayable =
    Number(
      settlement.amountPayable ??
        Math.abs(netAmount)
    );

  return {
    ...settlement,

    totalSales:
      Number(
        settlement.totalSales ||
          0
      ),

    totalCashback,

    totalRewardCredits,

    totalVoucherDiscount,

    totalMarketingBudget,

    merchantDue,
    rewardHubDue,
    netAmount,

    settlementDirection:
      direction,

    directionLabel:
      settlement.directionLabel ||
      (
        direction ===
          "REWARDHUB_TO_MERCHANT"
          ? "RewardHub to Merchant"
          : direction ===
              "NO_PAYMENT"
            ? "No Payment Required"
            : "Merchant to RewardHub"
      ),

    amountPayable,
  };
}

function normalizeDetailData(
  data:
    AdminSettlementDetailData
): AdminSettlementDetailData {
  const settlement =
    normalizeSettlement(
      data.settlement
    );

  const direction =
    settlement.settlementDirection;

  return {
    ...data,

    settlement,

    actions: {
      canApprove:
        Boolean(
          data.actions
            ?.canApprove
        ),

      canReject:
        Boolean(
          data.actions
            ?.canReject
        ),

      canMarkPaid:
        Boolean(
          data.actions
            ?.canMarkPaid
        ),

      paymentDirection:
        (
          data.actions
            ?.paymentDirection ||
          direction
        ) as AdminSettlementDirection,

      requiresMerchantReceipt:
        data.actions
          ?.requiresMerchantReceipt ??
        direction ===
          "MERCHANT_TO_REWARDHUB",

      requiresAdminPayment:
        data.actions
          ?.requiresAdminPayment ??
        direction ===
          "REWARDHUB_TO_MERCHANT",

      noPaymentRequired:
        data.actions
          ?.noPaymentRequired ??
        direction ===
          "NO_PAYMENT",

      locked:
        Boolean(
          data.actions?.locked
        ),
    },
  };
}

function normalizeListData(
  data:
    AdminSettlementListData
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
          data.summary?.total ||
            0
        ),

      pending:
        Number(
          data.summary
            ?.pending || 0
        ),

      submitted:
        Number(
          data.summary
            ?.submitted || 0
        ),

      approved:
        Number(
          data.summary
            ?.approved || 0
        ),

      paid:
        Number(
          data.summary?.paid ||
            0
        ),

      rejected:
        Number(
          data.summary
            ?.rejected || 0
        ),

      totalAmount:
        Number(
          data.summary
            ?.totalAmount || 0
        ),

      pendingAmount:
        Number(
          data.summary
            ?.pendingAmount ||
            0
        ),

      submittedAmount:
        Number(
          data.summary
            ?.submittedAmount ||
            0
        ),

      approvedAmount:
        Number(
          data.summary
            ?.approvedAmount ||
            0
        ),

      paidAmount:
        Number(
          data.summary
            ?.paidAmount || 0
        ),

      rejectedAmount:
        Number(
          data.summary
            ?.rejectedAmount ||
            0
        ),

      merchantToRewardHubCount:
        Number(
          data.summary
            ?.merchantToRewardHubCount ||
            0
        ),

      merchantToRewardHubAmount:
        Number(
          data.summary
            ?.merchantToRewardHubAmount ||
            0
        ),

      rewardHubToMerchantCount:
        Number(
          data.summary
            ?.rewardHubToMerchantCount ||
            0
        ),

      rewardHubToMerchantAmount:
        Number(
          data.summary
            ?.rewardHubToMerchantAmount ||
            0
        ),

      noPaymentCount:
        Number(
          data.summary
            ?.noPaymentCount ||
            0
        ),
    },

    months:
      Array.isArray(
        data.months
      )
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
          data.pagination?.page ||
            1
        ),

      pageSize:
        Number(
          data.pagination
            ?.pageSize || 25
        ),

      totalItems:
        Number(
          data.pagination
            ?.totalItems || 0
        ),

      totalPages:
        Math.max(
          1,
          Number(
            data.pagination
              ?.totalPages || 1
          )
        ),

      showingFrom:
        Number(
          data.pagination
            ?.showingFrom || 0
        ),

      showingTo:
        Number(
          data.pagination
            ?.showingTo || 0
        ),

      hasPrevious:
        Boolean(
          data.pagination
            ?.hasPrevious
        ),

      hasNext:
        Boolean(
          data.pagination
            ?.hasNext
        ),
    },

    settlements:
      Array.isArray(
        data.settlements
      )
        ? data.settlements.map(
            normalizeSettlement
          )
        : [],
  };
}