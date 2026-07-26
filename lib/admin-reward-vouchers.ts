export type AdminRewardVoucherStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "REDEEMED"
  | "EXPIRED"
  | "DISABLED";

export type AdminRewardVoucher = {
  voucherId: string;
  rewardId: string;
  rewardTitle: string;
  rewardCategory: string;
  rewardType: string;
  voucherCode: string;
  status: AdminRewardVoucherStatus;
  redemptionId: string;
  memberId: string;
  assignedAt: string;
  redeemedAt: string;
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
  note: string;
};

export type AdminRewardVoucherRewardOption = {
  rewardId: string;
  title: string;
  category: string;
  rewardType: string;
  status: string;
};

export type AdminRewardVoucherStats = {
  total: number;
  available: number;
  assigned: number;
  redeemed: number;
  expired: number;
  disabled: number;
};

export type AdminRewardVoucherPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
};

export type GetAdminRewardVouchersResponse = {
  generatedAt: string;
  timezone: string;
  admin: {
    adminId: string;
    fullName: string;
    role: string;
  };
  stats: AdminRewardVoucherStats;
  filters: {
    search: string;
    status: string;
    rewardId: string;
  };
  pagination: AdminRewardVoucherPagination;
  rewards: AdminRewardVoucherRewardOption[];
  vouchers: AdminRewardVoucher[];
};

export type GenerateAdminRewardVouchersPayload = {
  rewardId: string;
  quantity: number;
  prefix: string;
  digits?: number;
  expiredAt?: string;
  note?: string;
};

export type ImportAdminRewardVouchersPayload = {
  rewardId: string;
  voucherCodes: string[];
  expiredAt?: string;
  note?: string;
};

export type UpdateAdminRewardVoucherStatusPayload = {
  voucherId: string;
  status: "AVAILABLE" | "DISABLED" | "EXPIRED";
  note?: string;
};

type ApiEnvelope = {
  success?: boolean;
  data?: unknown;
  result?: unknown;
  error?: string;
  message?: string;
};

function unwrapVoucherApiData<T>(
  value: unknown
): T {
  let current: unknown = value;

  for (let level = 0; level < 5; level++) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      break;
    }

    const objectValue =
      current as {
        data?: unknown;
        result?: unknown;
      };

    if (
      objectValue.data !== undefined &&
      objectValue.data !== null
    ) {
      current = objectValue.data;
      continue;
    }

    if (
      objectValue.result !== undefined &&
      objectValue.result !== null
    ) {
      current = objectValue.result;
      continue;
    }

    break;
  }

  return current as T;
}

async function postVoucherApi<T>(
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(
    "/api/admin/rewards/vouchers",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify(body),
    }
  );

  let envelope: ApiEnvelope;

  try {
    envelope =
      (await response.json()) as ApiEnvelope;
  } catch {
    throw new Error(
      "Voucher API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    envelope.success === false
  ) {
    throw new Error(
      envelope.error ||
      envelope.message ||
      "Voucher request failed."
    );
  }

  const rawData =
    envelope.data ??
    envelope.result;

  if (
    rawData === undefined ||
    rawData === null
  ) {
    throw new Error(
      "Voucher API data is missing."
    );
  }

  return unwrapVoucherApiData<T>(
    rawData
  );
}

export async function getAdminRewardVouchers(
  params: {
    search?: string;
    status?: string;
    rewardId?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  return postVoucherApi<GetAdminRewardVouchersResponse>({
    action: "getAdminRewardVouchers",
    search: params.search || "",
    status: params.status || "ALL",
    rewardId: params.rewardId || "ALL",
    page: params.page || 1,
    pageSize: params.pageSize || 25,
  });
}

export async function getAdminRewardVoucherDetail(
  voucherId: string
) {
  return postVoucherApi<unknown>({
    action: "getAdminRewardVoucherDetail",
    voucherId,
  });
}

export async function createAdminRewardVouchers(
  payload: ImportAdminRewardVouchersPayload
) {
  return postVoucherApi<{
    message: string;
    requestedCount: number;
    createdCount: number;
    skippedCount: number;
    created: AdminRewardVoucher[];
    skipped: Array<{
      voucherCode: string;
      reason: string;
    }>;
  }>({
    action: "createAdminRewardVouchers",
    ...payload,
  });
}

export async function generateAdminRewardVoucherCodes(
  payload: GenerateAdminRewardVouchersPayload
) {
  return postVoucherApi<{
    message: string;
    createdCount: number;
    firstVoucherCode: string;
    lastVoucherCode: string;
    created: AdminRewardVoucher[];
  }>({
    action: "generateAdminRewardVoucherCodes",
    ...payload,
  });
}

export async function updateAdminRewardVoucherStatus(
  payload: UpdateAdminRewardVoucherStatusPayload
) {
  return postVoucherApi<{
    message: string;
    voucher: AdminRewardVoucher;
  }>({
    action: "updateAdminRewardVoucherStatus",
    ...payload,
  });
}
