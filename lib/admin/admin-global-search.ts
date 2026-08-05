export type AdminGlobalSearchResultType =
  | "MEMBER"
  | "MERCHANT"
  | "MERCHANT_APPLICATION"
  | "TRANSACTION"
  | "SETTLEMENT"
  | "CARD_APPLICATION"
  | "REWARD"
  | "PRODUCT"
  | "REVIEW"
  | "CAMPAIGN"
  | "ADMIN_USER";

export type AdminGlobalSearchResult = {
  type: AdminGlobalSearchResultType | string;
  typeLabel: string;
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: string;
  href: string;
  score: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminGlobalSearchGroup = {
  type: AdminGlobalSearchResultType | string;
  label: string;
  count: number;
  results: AdminGlobalSearchResult[];
};

export type AdminGlobalSearchData = {
  query: string;
  minimumQueryLength: number;
  total: number;
  totalMatched: number;
  results: AdminGlobalSearchResult[];
  groups: AdminGlobalSearchGroup[];
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toStringValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

function toNumberValue(
  value: unknown,
  fallback = 0
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function normalizeSearchResult(
  value: unknown
): AdminGlobalSearchResult | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    type:
      toStringValue(
        value.type
      ),

    typeLabel:
      toStringValue(
        value.typeLabel
      ),

    id:
      toStringValue(
        value.id
      ),

    title:
      toStringValue(
        value.title
      ),

    subtitle:
      toStringValue(
        value.subtitle
      ),

    description:
      toStringValue(
        value.description
      ),

    status:
      toStringValue(
        value.status
      ),

    href:
      toStringValue(
        value.href
      ),

    score:
      toNumberValue(
        value.score
      ),

    createdAt:
      toStringValue(
        value.createdAt
      ),

    updatedAt:
      toStringValue(
        value.updatedAt
      ),
  };
}

function normalizeSearchGroup(
  value: unknown
): AdminGlobalSearchGroup | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawResults =
    Array.isArray(
      value.results
    )
      ? value.results
      : [];

  return {
    type:
      toStringValue(
        value.type
      ),

    label:
      toStringValue(
        value.label
      ),

    count:
      toNumberValue(
        value.count,
        rawResults.length
      ),

    results:
      rawResults
        .map(
          normalizeSearchResult
        )
        .filter(
          (
            item
          ): item is AdminGlobalSearchResult =>
            Boolean(item)
        ),
  };
}

function normalizeSearchData(
  value: unknown
): AdminGlobalSearchData {
  const source =
    isRecord(value)
      ? value
      : {};

  const rawResults =
    Array.isArray(
      source.results
    )
      ? source.results
      : [];

  const rawGroups =
    Array.isArray(
      source.groups
    )
      ? source.groups
      : [];

  const results =
    rawResults
      .map(
        normalizeSearchResult
      )
      .filter(
        (
          item
        ): item is AdminGlobalSearchResult =>
          Boolean(item)
      );

  const groups =
    rawGroups
      .map(
        normalizeSearchGroup
      )
      .filter(
        (
          item
        ): item is AdminGlobalSearchGroup =>
          Boolean(item)
      );

  return {
    query:
      toStringValue(
        source.query
      ),

    minimumQueryLength:
      toNumberValue(
        source.minimumQueryLength,
        2
      ),

    total:
      toNumberValue(
        source.total,
        results.length
      ),

    totalMatched:
      toNumberValue(
        source.totalMatched,
        results.length
      ),

    results,

    groups,
  };
}

function extractResponsePayload<T>(
  response: ApiResponse<T>
): T | null {
  if (
    response.data !==
    undefined
  ) {
    return response.data;
  }

  if (
    response.result !==
    undefined
  ) {
    return response.result;
  }

  return null;
}

export async function searchAdminGlobal(
  query: string,
  options?: {
    limit?: number;
    signal?: AbortSignal;
  }
): Promise<AdminGlobalSearchData> {
  const normalizedQuery =
    query.trim();

  if (!normalizedQuery) {
    return {
      query: "",
      minimumQueryLength: 2,
      total: 0,
      totalMatched: 0,
      results: [],
      groups: [],
    };
  }

  const limit =
    Math.min(
      Math.max(
        Number(
          options?.limit ||
            20
        ),
        1
      ),
      50
    );

  const params =
    new URLSearchParams({
      query:
        normalizedQuery,

      limit:
        String(limit),
    });

  const response =
    await fetch(
      `/api/admin/global-search?${params.toString()}`,
      {
        method: "GET",
        credentials:
          "include",
        cache:
          "no-store",
        signal:
          options?.signal,
        headers: {
          Accept:
            "application/json",
        },
      }
    );

  const rawText =
    await response.text();

  let parsed:
    ApiResponse<unknown>;

  try {
    parsed =
      rawText
        ? JSON.parse(
            rawText
          )
        : {};
  } catch {
    throw new Error(
      "Global Search returned an invalid response."
    );
  }

  if (
    !response.ok ||
    parsed.success === false
  ) {
    throw new Error(
      parsed.error ||
        parsed.message ||
        "Unable to search RewardHub."
    );
  }

  const payload =
    extractResponsePayload(
      parsed
    );

  /*
   * Some API routes return:
   *
   * {
   *   success: true,
   *   data: {
   *     message: "...",
   *     data: {...}
   *   }
   * }
   *
   * This handles both wrapped and
   * directly returned data.
   */
  if (
    isRecord(payload) &&
    "data" in payload
  ) {
    return normalizeSearchData(
      payload.data
    );
  }

  return normalizeSearchData(
    payload
  );
}