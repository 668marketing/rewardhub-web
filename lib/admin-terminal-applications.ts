"use client";

export type AdminTerminalApplicationAction =
  | "CONFIRM_PAYMENT"
  | "REJECT_PAYMENT"
  | "REJECT"
  | "SHIP"
  | "COMPLETE";

export type AdminTerminalApplication = {
  applicationId: string;
  merchantId: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  merchantStatus: string;
  shippingAddress: string;
  applicationType: string;
  applicationTypeCode: string;
  machinePrice: number;
  shippingFee: number;
  totalAmount: number;
  reason: string;
  paymentStatus: string;
  receiptUrl: string;
  paymentNote: string;
  paymentSubmittedAt: string;
  paymentVerifiedAt: string;
  status: string;
  statusCode: string;
  courier: string;
  trackingNumber: string;
  adminNote: string;
  reviewedBy: string;
  reviewedAt: string;
  shippedAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminTerminalApplicationSummary = {
  total: number;
  pendingPayment: number;
  paymentReview: number;
  paymentRejected: number;
  paid: number;
  pending: number;
  approved: number;
  shipped: number;
  completed: number;
  rejected: number;
  cancelled: number;
  firstApplication: number;
  replacementOrAdditional: number;
};

export type AdminTerminalApplicationPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AdminTerminalApplicationListData = {
  generatedAt: string;
  timezone: string;
  summary: AdminTerminalApplicationSummary;
  applicationTypes: string[];
  filters: {
    search: string;
    status: string;
    paymentStatus: string;
    applicationType: string;
    dateFrom: string;
    dateTo: string;
  };
  pagination: AdminTerminalApplicationPagination;
  applications: AdminTerminalApplication[];
};

export type AdminTerminalApplicationDetailData = {
  application: AdminTerminalApplication;
  merchant: {
    merchantId: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    status: string;
    address: string;
  };
};

export type GetAdminTerminalApplicationsInput = {
  search?: string;
  status?: string;
  paymentStatus?: string;
  applicationType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T | ApiResponse<T>;
  result?: T | ApiResponse<T>;
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

function unwrapPayload(
  value: unknown
): unknown {
  let current = value;

  for (
    let index = 0;
    index < 8;
    index += 1
  ) {
    if (!isRecord(current)) {
      return current;
    }

    const isList =
      "applications" in current ||
      "summary" in current ||
      "pagination" in current;

    const isDetail =
      "application" in current &&
      "merchant" in current;

    if (isList || isDetail) {
      return current;
    }

    if (
      current.data !== undefined
    ) {
      current =
        current.data;
      continue;
    }

    if (
      current.result !== undefined
    ) {
      current =
        current.result;
      continue;
    }

    return current;
  }

  return current;
}

async function readResponse<T>(
  response: Response,
  fallback: string
): Promise<T> {
  const rawText =
    await response.text();

  let parsed: ApiResponse<T>;

  try {
    parsed =
      JSON.parse(
        rawText
      ) as ApiResponse<T>;
  } catch {
    throw new Error(
      fallback
    );
  }

  if (
    !response.ok ||
    parsed.success === false
  ) {
    throw new Error(
      parsed.error ||
        parsed.message ||
        fallback
    );
  }

  return unwrapPayload(
    parsed
  ) as T;
}

export async function getAdminTerminalApplications(
  input: GetAdminTerminalApplicationsInput = {}
): Promise<AdminTerminalApplicationListData> {
  const params =
    new URLSearchParams();

  params.set(
    "search",
    input.search || ""
  );

  params.set(
    "status",
    input.status || "ALL"
  );

  params.set(
    "paymentStatus",
    input.paymentStatus || "ALL"
  );

  params.set(
    "applicationType",
    input.applicationType || "ALL"
  );

  params.set(
    "dateFrom",
    input.dateFrom || ""
  );

  params.set(
    "dateTo",
    input.dateTo || ""
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
      `/api/admin/terminal-applications?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return readResponse(
    response,
    "Unable to load terminal applications."
  );
}

export async function getAdminTerminalApplicationDetail(
  applicationId: string
): Promise<AdminTerminalApplicationDetailData> {
  const response =
    await fetch(
      `/api/admin/terminal-applications/${encodeURIComponent(
        applicationId
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return readResponse(
    response,
    "Unable to load terminal application details."
  );
}

export async function updateAdminTerminalApplication(
  applicationId: string,
  input: {
    terminalAction: AdminTerminalApplicationAction;
    note?: string;
    reason?: string;
    courier?: string;
    trackingNumber?: string;
  }
): Promise<AdminTerminalApplicationDetailData> {
  const response =
    await fetch(
      `/api/admin/terminal-applications/${encodeURIComponent(
        applicationId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body:
          JSON.stringify(
            input
          ),
      }
    );

  return readResponse(
    response,
    "Unable to update terminal application."
  );
}