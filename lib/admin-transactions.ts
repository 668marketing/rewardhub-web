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

export type AdminTransactionFilters = {
  search: string;
  status: string;
  paymentMethod: string;
  memberId: string;
  merchantId: string;
  dateFrom: string;
  dateTo: string;
};

export type AdminTransactionListData = {
  generatedAt: string;
  timezone: string;

  summary: AdminTransactionSummary;
  paymentMethods: string[];
  filters: AdminTransactionFilters;
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

type NestedApiData<T> = {
  data?: T;
  result?: T;
  message?: string;
  error?: string;
};

type ApiResponse<T> = {
  success?: boolean;

  data?:
    | T
    | NestedApiData<T>;

  result?:
    | T
    | NestedApiData<T>;

  error?: string;
  message?: string;
};

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}

function toStringValue(
  value: unknown,
  fallback = ""
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(
    value
  );
}

function toNumberValue(
  value: unknown,
  fallback = 0
): number {
  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}

function toBooleanValue(
  value: unknown
): boolean {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  const normalized =
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase();

  return (
    normalized ===
      "true" ||
    normalized ===
      "yes" ||
    normalized ===
      "1"
  );
}

/**
 * Supports all these response shapes:
 *
 * 1.
 * {
 *   success: true,
 *   data: {...}
 * }
 *
 * 2.
 * {
 *   success: true,
 *   data: {
 *     data: {...}
 *   }
 * }
 *
 * 3.
 * {
 *   success: true,
 *   result: {...}
 * }
 *
 * 4.
 * {
 *   success: true,
 *   result: {
 *     data: {...}
 *   }
 * }
 */
function extractApiPayload<T>(
  response:
    ApiResponse<T>
): T | null {
  const firstPayload =
    response.data ??
    response.result;

  if (
    firstPayload ===
      undefined ||
    firstPayload ===
      null
  ) {
    return null;
  }

  if (
    isRecord(
      firstPayload
    )
  ) {
    if (
      "data" in
        firstPayload &&
      firstPayload.data !==
        undefined &&
      firstPayload.data !==
        null
    ) {
      return firstPayload.data as T;
    }

    if (
      "result" in
        firstPayload &&
      firstPayload.result !==
        undefined &&
      firstPayload.result !==
        null
    ) {
      return firstPayload.result as T;
    }
  }

  return firstPayload as T;
}

async function parseApiResponse<T>(
  response: Response,
  invalidResponseMessage: string,
  fallbackErrorMessage: string
): Promise<T> {
  const rawText =
    await response.text();

  let result:
    ApiResponse<T>;

  try {
    result =
      rawText
        ? JSON.parse(
            rawText
          ) as
            ApiResponse<T>
        : {};
  } catch {
    throw new Error(
      invalidResponseMessage
    );
  }

  if (
    !response.ok ||
    result.success ===
      false
  ) {
    throw new Error(
      result.error ||
        result.message ||
        fallbackErrorMessage
    );
  }

  const payload =
    extractApiPayload(
      result
    );

  if (!payload) {
    throw new Error(
      result.error ||
        result.message ||
        fallbackErrorMessage
    );
  }

  return payload;
}

function normalizeTransaction(
  value: unknown
): AdminTransaction {
  const source =
    isRecord(
      value
    )
      ? value
      : {};

  return {
    transactionId:
      toStringValue(
        source.transactionId
      ),

    memberId:
      toStringValue(
        source.memberId
      ),

    memberName:
      toStringValue(
        source.memberName
      ),

    merchantId:
      toStringValue(
        source.merchantId
      ),

    merchantName:
      toStringValue(
        source.merchantName
      ),

    memberTier:
      toStringValue(
        source.memberTier
      ),

    marketingRate:
      toNumberValue(
        source.marketingRate
      ),

    marketingAmount:
      toNumberValue(
        source.marketingAmount
      ),

    amount:
      toNumberValue(
        source.amount
      ),

    cashback:
      toNumberValue(
        source.cashback
      ),

    cashbackRate:
      toNumberValue(
        source.cashbackRate
      ),

    rewardCreditsUsed:
      toNumberValue(
        source.rewardCreditsUsed
      ),

    payAmount:
      toNumberValue(
        source.payAmount
      ),

    pointsEarned:
      toNumberValue(
        source.pointsEarned
      ),

    paymentMethod:
      toStringValue(
        source.paymentMethod
      ),

    status:
      toStringValue(
        source.status
      ),

    createdAt:
      toStringValue(
        source.createdAt
      ),

    receiptUrl:
      toStringValue(
        source.receiptUrl
      ),
  };
}

function normalizeTransactionListData(
  value: unknown
): AdminTransactionListData {
  const payload =
    isRecord(
      value
    )
      ? value
      : {};

  const summary =
    isRecord(
      payload.summary
    )
      ? payload.summary
      : {};

  const filters =
    isRecord(
      payload.filters
    )
      ? payload.filters
      : {};

  const pagination =
    isRecord(
      payload.pagination
    )
      ? payload.pagination
      : {};

  const rawPaymentMethods =
    Array.isArray(
      payload.paymentMethods
    )
      ? payload.paymentMethods
      : [];

  const rawTransactions =
    Array.isArray(
      payload.transactions
    )
      ? payload.transactions
      : [];

  const page =
    Math.max(
      1,
      toNumberValue(
        pagination.page,
        1
      )
    );

  const pageSize =
    Math.max(
      1,
      toNumberValue(
        pagination.pageSize,
        25
      )
    );

  const totalItems =
    Math.max(
      0,
      toNumberValue(
        pagination.totalItems,
        rawTransactions.length
      )
    );

  const totalPages =
    Math.max(
      1,
      toNumberValue(
        pagination.totalPages,
        Math.ceil(
          totalItems /
            pageSize
        ) || 1
      )
    );

  return {
    generatedAt:
      toStringValue(
        payload.generatedAt
      ),

    timezone:
      toStringValue(
        payload.timezone,
        "Asia/Kuala_Lumpur"
      ),

    summary: {
      total:
        toNumberValue(
          summary.total
        ),

      completed:
        toNumberValue(
          summary.completed
        ),

      pending:
        toNumberValue(
          summary.pending
        ),

      cancelled:
        toNumberValue(
          summary.cancelled
        ),

      failed:
        toNumberValue(
          summary.failed
        ),

      totalSales:
        toNumberValue(
          summary.totalSales
        ),

      totalCashback:
        toNumberValue(
          summary.totalCashback
        ),

      totalRewardCreditsUsed:
        toNumberValue(
          summary
            .totalRewardCreditsUsed
        ),

      totalPayAmount:
        toNumberValue(
          summary.totalPayAmount
        ),

      totalPointsIssued:
        toNumberValue(
          summary
            .totalPointsIssued
        ),

      totalMarketingAmount:
        toNumberValue(
          summary
            .totalMarketingAmount
        ),
    },

    paymentMethods:
      rawPaymentMethods
        .map(
          (
            paymentMethod
          ) =>
            toStringValue(
              paymentMethod
            )
        )
        .filter(
          Boolean
        ),

    filters: {
      search:
        toStringValue(
          filters.search
        ),

      status:
        toStringValue(
          filters.status,
          "ALL"
        ),

      paymentMethod:
        toStringValue(
          filters.paymentMethod,
          "ALL"
        ),

      memberId:
        toStringValue(
          filters.memberId
        ),

      merchantId:
        toStringValue(
          filters.merchantId
        ),

      dateFrom:
        toStringValue(
          filters.dateFrom
        ),

      dateTo:
        toStringValue(
          filters.dateTo
        ),
    },

    pagination: {
      page:
        page,

      pageSize:
        pageSize,

      totalItems:
        totalItems,

      totalPages:
        totalPages,

      showingFrom:
        toNumberValue(
          pagination.showingFrom
        ),

      showingTo:
        toNumberValue(
          pagination.showingTo
        ),

      hasPrevious:
        typeof pagination
          .hasPrevious ===
          "boolean"
          ? pagination
              .hasPrevious
          : page > 1,

      hasNext:
        typeof pagination
          .hasNext ===
          "boolean"
          ? pagination
              .hasNext
          : page <
            totalPages,
    },

    transactions:
      rawTransactions.map(
        normalizeTransaction
      ),
  };
}

function normalizeTransactionDetail(
  value: unknown
): AdminTransactionDetail {
  const payload =
    isRecord(
      value
    )
      ? value
      : {};

  const member =
    isRecord(
      payload.member
    )
      ? payload.member
      : {};

  const merchant =
    isRecord(
      payload.merchant
    )
      ? payload.merchant
      : {};

  if (
    !isRecord(
      payload.transaction
    )
  ) {
    throw new Error(
      "Transaction detail response is incomplete."
    );
  }

  return {
    transaction:
      normalizeTransaction(
        payload.transaction
      ),

    member: {
      memberId:
        toStringValue(
          member.memberId
        ),

      fullName:
        toStringValue(
          member.fullName
        ),

      email:
        toStringValue(
          member.email
        ),

      phone:
        toStringValue(
          member.phone
        ),

      tier:
        toStringValue(
          member.tier
        ),

      status:
        toStringValue(
          member.status
        ),
    },

    merchant: {
      merchantId:
        toStringValue(
          merchant.merchantId
        ),

      merchantName:
        toStringValue(
          merchant.merchantName
        ),

      email:
        toStringValue(
          merchant.email
        ),

      phone:
        toStringValue(
          merchant.phone
        ),

      category:
        toStringValue(
          merchant.category
        ),

      subCategory:
        toStringValue(
          merchant.subCategory
        ),

      status:
        toStringValue(
          merchant.status
        ),
    },
  };
}

export async function getAdminTransactions(
  input:
    GetAdminTransactionsInput = {}
): Promise<AdminTransactionListData> {
  const params =
    new URLSearchParams();

  params.set(
    "search",
    String(
      input.search ||
        ""
    )
  );

  params.set(
    "status",
    String(
      input.status ||
        "ALL"
    )
  );

  params.set(
    "paymentMethod",
    String(
      input.paymentMethod ||
        "ALL"
    )
  );

  params.set(
    "memberId",
    String(
      input.memberId ||
        ""
    )
  );

  params.set(
    "merchantId",
    String(
      input.merchantId ||
        ""
    )
  );

  params.set(
    "dateFrom",
    String(
      input.dateFrom ||
        ""
    )
  );

  params.set(
    "dateTo",
    String(
      input.dateTo ||
        ""
    )
  );

  params.set(
    "page",
    String(
      Math.max(
        1,
        Number(
          input.page ||
            1
        )
      )
    )
  );

  params.set(
    "pageSize",
    String(
      Math.min(
        200,
        Math.max(
          1,
          Number(
            input.pageSize ||
              25
          )
        )
      )
    )
  );

  const response =
    await fetch(
      `/api/admin/transactions?${params.toString()}`,
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  const payload =
    await parseApiResponse<
      AdminTransactionListData
    >(
      response,
      "Transaction API returned an invalid response.",
      "Unable to load transactions."
    );

  return normalizeTransactionListData(
    payload
  );
}

export async function getAdminTransactionDetail(
  transactionId: string
): Promise<AdminTransactionDetail> {
  const normalizedTransactionId =
    transactionId.trim();

  if (
    !normalizedTransactionId
  ) {
    throw new Error(
      "Missing transactionId."
    );
  }

  const response =
    await fetch(
      `/api/admin/transactions/${encodeURIComponent(
        normalizedTransactionId
      )}`,
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  const payload =
    await parseApiResponse<
      AdminTransactionDetail
    >(
      response,
      "Transaction detail API returned an invalid response.",
      "Unable to load transaction details."
    );

  return normalizeTransactionDetail(
    payload
  );
}