export type MemberRewardRedemptionDetail = {
  redemptionId: string;
  memberId: string;

  rewardId: string;
  rewardTitle: string;
  rewardType: string;
  imageUrl: string;
  thumbnailUrl: string;

  pointsUsed: number;
  quantity: number;
  status: string;

  voucherCode: string;
  voucherId: string;
  voucherStatus: string;
  voucherAvailable: boolean;
  voucherUsed: boolean;
  voucherUsedAt: string;
  voucherUsedTransactionId: string;
  voucherUsedMerchantId: string;
  voucherUsedMerchantName: string;
  voucherExpiredAt: string;

  recipientName: string;
  phone: string;
  address: string;
  deliveryMethod: string;

  courier: string;
  trackingNo: string;
  cancelReason: string;
  adminNote: string;

  redeemedAt: string;
  processedAt: string;
  shippedAt: string;
  completedAt: string;
  updatedAt: string;
};

export async function getMemberRewardRedemptionDetail(
  input: {
    memberId: string;
    redemptionId: string;
  }
): Promise<MemberRewardRedemptionDetail> {
  const response =
    await fetch(
      "/api/member/rewards/redemptions",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body:
          JSON.stringify(input),
      }
    );

  const result =
    (await response.json()) as {
      success?: boolean;
      data?: {
        redemption?:
          MemberRewardRedemptionDetail;
      };
      error?: string;
      message?: string;
    };

  if (
    !response.ok ||
    result.success === false ||
    !result.data?.redemption
  ) {
    throw new Error(
      result.error ||
        result.message ||
        "Unable to load redemption."
    );
  }

  return result.data.redemption;
}