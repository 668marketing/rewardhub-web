export type AdminTransaction = {
  transactionId: string;
  memberId: string;
  memberName: string;
  merchantId: string;
  merchantName: string;
  memberTier: string;

  marketingRate: number;
  marketingAmount: number;

  amount: number;
  cashback: number;
  cashbackRate: number;
  rewardCreditsUsed: number;
  payAmount: number;
  pointsEarned: number;

  paymentMethod: string;
  status: string;
  createdAt: string;
  receiptUrl: string;
};

export type AdminTransactionSummary = {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  failed: number;

  totalSales: number;
  totalCashback: number;
  totalRewardCreditsUsed: number;
  totalPayAmount: number;
  totalPointsIssued: number;
  totalMarketingAmount: number;
};

export type AdminTransactionPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AdminTransactionListData = {
  generatedAt: string;
  timezone: string;

  summary: AdminTransactionSummary;
  paymentMethods: string[];

  filters: {
    search: string;
    status: string;
    paymentMethod: string;
    memberId: string;
    merchantId: string;
    dateFrom: string;
    dateTo: string;
  };

  pagination: AdminTransactionPagination;
  transactions: AdminTransaction[];
};

export type AdminTransactionDetail = {
  transaction: AdminTransaction;

  member: {
    memberId: string;
    fullName: string;
    email: string;
    phone: string;
    tier: string;
    status: string;
  };

  merchant: {
    merchantId: string;
    merchantName: string;
    email: string;
    phone: string;
    category: string;
    subCategory: string;
    status: string;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type GetAdminTransactionsInput = {
  search?: string;
  status?: string;
  paymentMethod?: string;
  memberId?: string;
  merchantId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export async function getAdminTransactions(
  input: GetAdminTransactionsInput = {}
): Promise<AdminTransactionListData> {
  const params =
    new URLSearchParams();

  params.set(
    "search",
    String(input.search || "")
  );

  params.set(
    "status",
    String(input.status || "ALL")
  );

  params.set(
    "paymentMethod",
    String(
      input.paymentMethod || "ALL"
    )
  );

  params.set(
    "memberId",
    String(input.memberId || "")
  );

  params.set(
    "merchantId",
    String(input.merchantId || "")
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

  const response =
    await fetch(
      `/api/admin/transactions?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  let result:
    ApiResponse<AdminTransactionListData>;

  try {
    result =
      (await response.json()) as
        ApiResponse<AdminTransactionListData>;
  } catch {
    throw new Error(
      "Transaction API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        "Unable to load transactions."
    );
  }

  const raw =
    result.data as
      | AdminTransactionListData
      | {
          data?: AdminTransactionListData;
        };

  const payload =
    "data" in raw &&
    raw.data
      ? raw.data
      : raw;

  return {
    generatedAt:
      payload.generatedAt || "",
    timezone:
      payload.timezone ||
      "Asia/Kuala_Lumpur",

    summary: {
      total:
        Number(
          payload.summary?.total || 0
        ),
      completed:
        Number(
          payload.summary?.completed || 0
        ),
      pending:
        Number(
          payload.summary?.pending || 0
        ),
      cancelled:
        Number(
          payload.summary?.cancelled || 0
        ),
      failed:
        Number(
          payload.summary?.failed || 0
        ),
      totalSales:
        Number(
          payload.summary?.totalSales || 0
        ),
      totalCashback:
        Number(
          payload.summary?.totalCashback || 0
        ),
      totalRewardCreditsUsed:
        Number(
          payload.summary
            ?.totalRewardCreditsUsed || 0
        ),
      totalPayAmount:
        Number(
          payload.summary?.totalPayAmount || 0
        ),
      totalPointsIssued:
        Number(
          payload.summary
            ?.totalPointsIssued || 0
        ),
      totalMarketingAmount:
        Number(
          payload.summary
            ?.totalMarketingAmount || 0
        ),
    },

    paymentMethods:
      Array.isArray(
        payload.paymentMethods
      )
        ? payload.paymentMethods
        : [],

    filters: {
      search:
        payload.filters?.search || "",
      status:
        payload.filters?.status || "ALL",
      paymentMethod:
        payload.filters
          ?.paymentMethod || "ALL",
      memberId:
        payload.filters?.memberId || "",
      merchantId:
        payload.filters?.merchantId || "",
      dateFrom:
        payload.filters?.dateFrom || "",
      dateTo:
        payload.filters?.dateTo || "",
    },

    pagination: {
      page:
        Number(
          payload.pagination?.page || 1
        ),
      pageSize:
        Number(
          payload.pagination?.pageSize || 25
        ),
      totalItems:
        Number(
          payload.pagination
            ?.totalItems || 0
        ),
      totalPages:
        Math.max(
          1,
          Number(
            payload.pagination
              ?.totalPages || 1
          )
        ),
      showingFrom:
        Number(
          payload.pagination
            ?.showingFrom || 0
        ),
      showingTo:
        Number(
          payload.pagination
            ?.showingTo || 0
        ),
      hasPrevious:
        Boolean(
          payload.pagination
            ?.hasPrevious
        ),
      hasNext:
        Boolean(
          payload.pagination
            ?.hasNext
        ),
    },

    transactions:
      Array.isArray(
        payload.transactions
      )
        ? payload.transactions
        : [],
  };
}

export async function getAdminTransactionDetail(
  transactionId: string
): Promise<AdminTransactionDetail> {
  const response =
    await fetch(
      `/api/admin/transactions/${encodeURIComponent(
        transactionId
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  let result:
    ApiResponse<AdminTransactionDetail>;

  try {
    result =
      (await response.json()) as
        ApiResponse<AdminTransactionDetail>;
  } catch {
    throw new Error(
      "Transaction detail API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        "Unable to load transaction details."
    );
  }

  const raw =
    result.data as
      | AdminTransactionDetail
      | {
          data?: AdminTransactionDetail;
        };

  const payload =
    "data" in raw &&
    raw.data
      ? raw.data
      : raw;

  if (!payload.transaction) {
    throw new Error(
      "Transaction detail response is incomplete."
    );
  }

  return payload;
}
