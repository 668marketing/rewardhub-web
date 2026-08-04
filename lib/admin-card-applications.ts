export type CardApplicationAction =
  | "CONFIRM_PAYMENT"
  | "REJECT_PAYMENT"
  | "APPROVE"
  | "REJECT"
  | "MARK_PROCESSING"
  | "SHIP"
  | "COMPLETE";

export type AdminCardApplication = {
  applicationId: string;
  memberId: string;
  fullName: string;
  email: string;
  phone: string;
  memberTier: string;
  memberStatus: string;
  applicationType: string;
  status: string;
  fee: number;
  paymentStatus: string;
  receiptUrl: string;
  address: string;
  fullAddress: string;
  state: string;
  area: string;
  postcode: string;
  deliveryNote: string;
  lossReason: string;
  oldCardId: string;
  freezeOldCard: boolean;
  courier: string;
  trackingNumber: string;
  adminNote: string;
  rejectReason: string;
  reviewedBy: string;
  reviewedAt: string;
  paymentReviewedBy: string;
  paymentReviewedAt: string;
  processingBy: string;
  processingAt: string;
  shippedBy: string;
  shippedAt: string;
  completedBy: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminCardApplicationSummary = {
  total: number;
  pendingPayment: number;
  paymentRejected: number;
  pending: number;
  approved: number;
  processing: number;
  shipped: number;
  completed: number;
  rejected: number;
  cancelled: number;
  replacement: number;
};

export type AdminCardApplicationPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AdminCardApplicationListData = {
  generatedAt: string;
  timezone: string;
  summary: AdminCardApplicationSummary;
  applicationTypes: string[];
  filters: {
    search: string;
    status: string;
    applicationType: string;
    dateFrom: string;
    dateTo: string;
  };
  pagination: AdminCardApplicationPagination;
  applications: AdminCardApplication[];
};

export type AdminCardApplicationDetailData = {
  application: AdminCardApplication;
  member: {
    memberId: string;
    fullName: string;
    email: string;
    phone: string;
    tier: string;
    status: string;
    cardId: string;
    cardStatus: string;
  };
};

export type GetAdminCardApplicationsInput = {
  search?: string;
  status?: string;
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

  for (let index = 0; index < 8; index += 1) {
    if (!isRecord(current)) {
      return current;
    }

    const isList =
      "applications" in current ||
      "summary" in current ||
      "pagination" in current;

    const isDetail =
      "application" in current &&
      "member" in current;

    if (isList || isDetail) {
      return current;
    }

    if (current.data !== undefined) {
      current = current.data;
      continue;
    }

    if (current.result !== undefined) {
      current = current.result;
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
  const rawText = await response.text();

  let parsed: ApiResponse<T>;

  try {
    parsed = JSON.parse(rawText) as ApiResponse<T>;
  } catch {
    throw new Error(fallback);
  }

  if (!response.ok || parsed.success === false) {
    throw new Error(
      parsed.error ||
        parsed.message ||
        fallback
    );
  }

  return unwrapPayload(parsed) as T;
}

export async function getAdminCardApplications(
  input: GetAdminCardApplicationsInput = {}
): Promise<AdminCardApplicationListData> {
  const params = new URLSearchParams();

  params.set("search", input.search || "");
  params.set("status", input.status || "ALL");
  params.set(
    "applicationType",
    input.applicationType || "ALL"
  );
  params.set("dateFrom", input.dateFrom || "");
  params.set("dateTo", input.dateTo || "");
  params.set("page", String(input.page || 1));
  params.set(
    "pageSize",
    String(input.pageSize || 25)
  );

  const response = await fetch(
    `/api/admin/card-applications?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return readResponse<AdminCardApplicationListData>(
    response,
    "Unable to load card applications."
  );
}

export async function getAdminCardApplicationDetail(
  applicationId: string
): Promise<AdminCardApplicationDetailData> {
  const response = await fetch(
    `/api/admin/card-applications/${encodeURIComponent(
      applicationId
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return readResponse<AdminCardApplicationDetailData>(
    response,
    "Unable to load card application details."
  );
}

export async function updateAdminCardApplication(
  applicationId: string,
  input: {
    cardAction: CardApplicationAction;
    note?: string;
    reason?: string;
    courier?: string;
    trackingNumber?: string;
  }
): Promise<AdminCardApplicationDetailData> {
  const response = await fetch(
    `/api/admin/card-applications/${encodeURIComponent(
      applicationId
    )}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(input),
    }
  );

  return readResponse<AdminCardApplicationDetailData>(
    response,
    "Unable to update card application."
  );
}