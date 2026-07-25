export async function getAdminRewardVouchers(
  params: {
    search?: string;
    status?: string;
    rewardId?: string;
    page?: number;
    pageSize?: number;
  }
) {
  const res = await fetch(
    "/api/admin/rewards/vouchers",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        action:
          "getAdminRewardVouchers",
        ...params,
      }),
    }
  );

  return res.json();
}

export async function getAdminRewardVoucherDetail(
  voucherId: string
) {
  const res = await fetch(
    "/api/admin/rewards/vouchers",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        action:
          "getAdminRewardVoucherDetail",
        voucherId,
      }),
    }
  );

  return res.json();
}

export async function createAdminRewardVouchers(
  payload: any
) {
  const res = await fetch(
    "/api/admin/rewards/vouchers",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        action:
          "createAdminRewardVouchers",
        ...payload,
      }),
    }
  );

  return res.json();
}

export async function updateAdminRewardVoucherStatus(
  payload: {
    voucherId: string;
    status: string;
    note?: string;
  }
) {
  const res = await fetch(
    "/api/admin/rewards/vouchers",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        action:
          "updateAdminRewardVoucherStatus",
        ...payload,
      }),
    }
  );

  return res.json();
}

export type GenerateAdminRewardVouchersPayload = {
  rewardId: string;
  quantity: number;
  prefix: string;
  digits?: number;
  expiredAt?: string;
  note?: string;
};

export async function generateAdminRewardVoucherCodes(
  payload: GenerateAdminRewardVouchersPayload
) {
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
      body: JSON.stringify({
        action:
          "generateAdminRewardVoucherCodes",

        ...payload,
      }),
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result?.message ||
      "Failed to generate voucher codes"
    );
  }

  if (
    result?.success === false
  ) {
    throw new Error(
      result?.message ||
      "Failed to generate voucher codes"
    );
  }

  return result;
}