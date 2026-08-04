export type AdminMarketingMerchant = {
  merchantId: string;
  businessName: string;
  displayName: string;
  loginEmail: string;
  phone: string;
  category: string;
  subCategory: string;
  state: string;
  area: string;
  logoUrl: string;
  status: string;

  normalBudget: number;
  currentBudget: number;

  boostEnabled: boolean;
  boostActive: boolean;
  boostBudget: number;
  boostStart: string;
  boostEnd: string;
  boostCount: number;
  nextNormalUpdate: string;

  acceptRewardCredits: boolean;
  redemptionLimit: number;

  updatedAt: string;
};

export type AdminMarketingSummary = {
  totalMerchants: number;
  averageBudget: number;
  boostEnabled: number;
  activeBoosts: number;
  rewardCreditsEnabled: number;
};

export type AdminMarketingPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AdminMarketingListData = {
  generatedAt: string;
  timezone: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  summary: AdminMarketingSummary;
  categories: string[];

  filters: {
    search: string;
    category: string;
    rewardCredits: string;
    boostStatus: string;
    status: string;
  };

  pagination: AdminMarketingPagination;
  merchants: AdminMarketingMerchant[];
};

export type AdminMarketingDetail = {
  generatedAt: string;

  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };

  merchant: AdminMarketingMerchant;

  actions: {
    canEdit: boolean;
  };
};

export type AdminMarketingQuery = {
  search?: string;
  category?: string;
  rewardCredits?: string;
  boostStatus?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type UpdateAdminMarketingInput = {
  normalBudget: number;

  acceptRewardCredits: boolean;
  redemptionLimit: number;

  boostEnabled: boolean;
  boostBudget: number;
  boostStart: string;
  boostEnd: string;

  reason: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getAdminMarketingBudgets(
  query: AdminMarketingQuery = {}
): Promise<AdminMarketingListData> {
  const params =
    new URLSearchParams();

  params.set(
    "search",
    String(query.search || "")
  );

  params.set(
    "category",
    String(query.category || "ALL")
  );

  params.set(
    "rewardCredits",
    String(
      query.rewardCredits || "ALL"
    )
  );

  params.set(
    "boostStatus",
    String(
      query.boostStatus || "ALL"
    )
  );

  params.set(
    "status",
    String(query.status || "ALL")
  );

  params.set(
    "page",
    String(query.page || 1)
  );

  params.set(
    "pageSize",
    String(query.pageSize || 25)
  );

  const response =
    await fetch(
      `/api/admin/marketing?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  const result =
    await readResponse<AdminMarketingListData>(
      response,
      "Marketing API returned an invalid response."
    );

  if (
    !response.ok ||
    !result.data
  ) {
    throw new Error(
      result.error ||
      "Unable to load marketing settings."
    );
  }

  return normalizeListData(
    result.data
  );
}

export async function getAdminMarketingBudgetDetail(
  merchantId: string
): Promise<AdminMarketingDetail> {
  const response =
    await fetch(
      `/api/admin/marketing/${encodeURIComponent(
        merchantId
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  const result =
    await readResponse<AdminMarketingDetail>(
      response,
      "Marketing detail API returned an invalid response."
    );

  if (
    !response.ok ||
    !result.data?.merchant
  ) {
    throw new Error(
      result.error ||
      "Unable to load merchant marketing settings."
    );
  }

  return {
    generatedAt:
      result.data.generatedAt || "",

    admin:
      result.data.admin || {
        adminId: "",
        fullName: "",
        role: "",
      },

    merchant:
      normalizeMerchant(
        result.data.merchant
      ),

    actions: {
      canEdit:
        Boolean(
          result.data.actions?.canEdit
        ),
    },
  };
}

export async function updateAdminMarketingBudget(
  merchantId: string,
  input: UpdateAdminMarketingInput
): Promise<AdminMarketingMerchant> {
  const response =
    await fetch(
      `/api/admin/marketing/${encodeURIComponent(
        merchantId
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(input),
      }
    );

  const result =
    await readResponse<{
      merchant: AdminMarketingMerchant;
      message?: string;
    }>(
      response,
      "Marketing update API returned an invalid response."
    );

  if (
    !response.ok ||
    !result.data?.merchant
  ) {
    throw new Error(
      result.error ||
      "Unable to update merchant marketing settings."
    );
  }

  return normalizeMerchant(
    result.data.merchant
  );
}

async function readResponse<T>(
  response: Response,
  fallback: string
): Promise<ApiResponse<T>> {
  const rawText =
    await response.text();

  try {
    return JSON.parse(
      rawText
    ) as ApiResponse<T>;
  } catch {
    throw new Error(
      rawText
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500) ||
      fallback
    );
  }
}

function normalizeListData(
  raw: AdminMarketingListData
): AdminMarketingListData {
  return {
    generatedAt:
      raw.generatedAt || "",

    timezone:
      raw.timezone ||
      "Asia/Kuala_Lumpur",

    admin:
      raw.admin || {
        adminId: "",
        fullName: "",
        role: "",
      },

    summary: {
      totalMerchants:
        numberValue(
          raw.summary?.totalMerchants
        ),

      averageBudget:
        numberValue(
          raw.summary?.averageBudget
        ),

      boostEnabled:
        numberValue(
          raw.summary?.boostEnabled
        ),

      activeBoosts:
        numberValue(
          raw.summary?.activeBoosts
        ),

      rewardCreditsEnabled:
        numberValue(
          raw.summary
            ?.rewardCreditsEnabled
        ),
    },

    categories:
      Array.isArray(
        raw.categories
      )
        ? raw.categories
        : [],

    filters: {
      search:
        raw.filters?.search || "",
      category:
        raw.filters?.category || "ALL",
      rewardCredits:
        raw.filters?.rewardCredits ||
        "ALL",
      boostStatus:
        raw.filters?.boostStatus ||
        "ALL",
      status:
        raw.filters?.status || "ALL",
    },

    pagination: {
      page:
        numberValue(
          raw.pagination?.page,
          1
        ),
      pageSize:
        numberValue(
          raw.pagination?.pageSize,
          25
        ),
      totalItems:
        numberValue(
          raw.pagination?.totalItems
        ),
      totalPages:
        Math.max(
          1,
          numberValue(
            raw.pagination?.totalPages,
            1
          )
        ),
      showingFrom:
        numberValue(
          raw.pagination?.showingFrom
        ),
      showingTo:
        numberValue(
          raw.pagination?.showingTo
        ),
      hasPrevious:
        Boolean(
          raw.pagination?.hasPrevious
        ),
      hasNext:
        Boolean(
          raw.pagination?.hasNext
        ),
    },

    merchants:
      Array.isArray(
        raw.merchants
      )
        ? raw.merchants.map(
            normalizeMerchant
          )
        : [],
  };
}

function normalizeMerchant(
  raw: AdminMarketingMerchant
): AdminMarketingMerchant {
  return {
    merchantId:
      raw?.merchantId || "",
    businessName:
      raw?.businessName || "",
    displayName:
      raw?.displayName || "",
    loginEmail:
      raw?.loginEmail || "",
    phone:
      raw?.phone || "",
    category:
      raw?.category || "",
    subCategory:
      raw?.subCategory || "",
    state:
      raw?.state || "",
    area:
      raw?.area || "",
    logoUrl:
      raw?.logoUrl || "",
    status:
      raw?.status || "ACTIVE",

    normalBudget:
      numberValue(
        raw?.normalBudget,
        5
      ),

    currentBudget:
      numberValue(
        raw?.currentBudget,
        5
      ),

    boostEnabled:
      Boolean(
        raw?.boostEnabled
      ),

    boostActive:
      Boolean(
        raw?.boostActive
      ),

    boostBudget:
      numberValue(
        raw?.boostBudget
      ),

    boostStart:
      raw?.boostStart || "",

    boostEnd:
      raw?.boostEnd || "",

    boostCount:
      numberValue(
        raw?.boostCount
      ),

    nextNormalUpdate:
      raw?.nextNormalUpdate || "",

    acceptRewardCredits:
      Boolean(
        raw?.acceptRewardCredits
      ),

    redemptionLimit:
      numberValue(
        raw?.redemptionLimit
      ),

    updatedAt:
      raw?.updatedAt || "",
  };
}

function numberValue(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}
