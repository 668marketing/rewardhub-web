const API_URL =
  "https://script.google.com/macros/s/AKfycbwZukKlv976yMLEA3Ap-_h6z4pyD8fTHzgpwHZlxAPGjfAjFYxRB6VdJXDK_zTJZmLs/exec";

export async function apiPost(
  action: string,
  data: any = {}
) {
  const endpoint =
    typeof window === "undefined"
      ? API_URL
      : "/api/rewardhub";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      ...data,
    }),
    cache: "no-store",
  });

  const text = await response.text();

  console.log("API RAW RESPONSE:", text);

  let result: any;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      "Backend returned non-JSON: " +
        text.slice(0, 300)
    );
  }

  if (
    !response.ok ||
    result?.success === false ||
    result?.error
  ) {
    throw new Error(
      result?.message ||
        result?.error ||
        result?.data?.message ||
        "Server error"
    );
  }

  return result;
}

export async function fetchMarketplaceMerchants() {
  const result = await apiPost("getMarketplaceMerchants", {
    keyword: "",
    category: "",
    limit: 20,
  });

  console.log("Marketplace API result:", result);

  return result;
}

export async function memberRegister(data:any){

    return apiPost("memberRegister",data);

}

export async function memberLogin(data: any) {
  return apiPost("memberLogin", data);
}

export async function requestMemberPasswordReset(data: {
  email: string;
}) {
  return apiPost(
    "requestMemberPasswordReset",
    data
  );
}

export async function resetMemberPassword(data: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  return apiPost(
    "resetMemberPassword",
    data
  );
}

export async function merchantPayment(data: any) {
  return apiPost("merchantPayment", data);
}

export async function getTransactionHistory(data: any) {
  return apiPost("getTransactionHistory", data);
}

export async function getMemberWalletSummary(data: any) {
  return apiPost("getMemberWalletSummary", data);
}

export async function getMemberCommissionSummary(data: any) {
  return apiPost("getMemberCommissionSummary", data);
}

export async function getMerchantDetail(merchantId: string) {
  return apiPost("getMerchantDetail", { merchantId });
}

export async function getMerchantReviews(merchantId: string) {
  return apiPost("getMerchantReviews", { merchantId });
}

export async function replyMerchantReview(data: {
  merchantId: string;
  reviewId: string;
  merchantReply: string;
}) {
  return apiPost("replyMerchantReview", data);
}

export async function addMerchantReview(data: any) {
  return apiPost("addMerchantReview", data);
}

export async function getMerchantRating(merchantId: string) {
  return apiPost("getMerchantRating", { merchantId });
}

export async function verifyMemberPin(data: any) {
  return apiPost("verifyMemberPin", data);
}

export async function merchantLogin(data: any) {
  return apiPost("merchantLogin", data);
}

export async function requestMerchantPasswordReset(
  data: {
    email: string;
  }
) {
  return apiPost(
    "requestMerchantPasswordReset",
    data
  );
}

export async function resetMerchantPassword(
  data: {
    email: string;
    otp: string;
    newPassword: string;
  }
) {
  return apiPost(
    "resetMerchantPassword",
    data
  );
}

export async function merchantRegister(data: {
  businessName: string;
  ownerName: string;
  loginEmail: string;
  phone: string;
  category: string;
  subCategory: string;
  state: string;
  area: string;
  address: string;
  location?: string;
  password: string;
  referredByMember?: string;
  referredByMerchant?: string;
}) {
  return apiPost("merchantRegister", data);
}

export async function getMemberByCardId(cardId: string) {
  return apiPost("getMemberByCardId", { cardId });
}

export async function getMemberCardApplication(
  data: {
    memberId: string;
  }
) {
  return apiPost(
    "getMemberCardApplication",
    data
  );
}

export async function cancelMemberCardApplication(
  data: {
    memberId: string;
    applicationId: string;
  }
) {
  return apiPost(
    "cancelMemberCardApplication",
    data
  );
}

export async function submitMemberCardApplication(
  data: {
    memberId: string;
    applicationType: "First Card" | "Replacement Card";
    fullName: string;
    phone: string;
    email: string;
    address: string;
    state: string;
    area: string;
    postcode: string;
    deliveryNote?: string;
    freezeOldCard?: boolean;
    lossReason?: string;
  }
) {
  return apiPost(
    "submitMemberCardApplication",
    data
  );
}

export async function uploadCardReplacementReceipt(
  data: {
    memberId: string;
    applicationId: string;
    fileName: string;
    mimeType: string;
    base64: string;
  }
) {
  return apiPost(
    "uploadCardReplacementReceipt",
    data
  );
}

export async function getMerchantDashboardSummary(merchantId: string) {
  return apiPost("getMerchantDashboardSummary", {
    merchantId,
  });
}

export async function updateMerchantMarketingBudget(data: any) {
  return apiPost("updateMerchantMarketingBudget", data);
}

export async function getMerchantMarketingSummary(merchantId: string) {
  return apiPost("getMerchantMarketingSummary", { merchantId });
}

export async function createMerchantBudgetBoost(data: any) {
  return apiPost("createMerchantBudgetBoost", data);
}

export async function cancelMerchantBudgetBoost(data: any) {
  return apiPost("cancelMerchantBudgetBoost", data);
}

export async function getMerchantTransactionHistory(data: any) {
  return apiPost("getMerchantTransactionHistory", data);
}

export async function getMerchantSettlementSummary(data: any) {
  return apiPost("getMerchantSettlementSummary", data);
}

export async function requestMerchantSettlement(data: any) {
  return apiPost("requestMerchantSettlement", data);
}

export async function updateMerchantRewardCreditSettings(data: any) {
  return apiPost("updateMerchantRewardCreditSettings", data);
}

export async function getMemberPointsHistory(data: any) {
  return apiPost("getMemberPointsHistory", data);
}

export async function healthCheck() {
  return apiPost("healthCheck");
}

export async function bindMemberCard(data: any) {
  return apiPost("bindMemberCard", data);
}

export async function getMemberProfile(data: any) {
  return apiPost("getMemberProfile", data);
}

export async function getMemberPointsSummary(data: any) {
  return apiPost("getMemberPointsSummary", data);
}

export async function getMemberReferralSummary(data: any) {
  return apiPost("getMemberReferralSummary", data);
}

export async function getMemberReferralHistory(data: any) {
  return apiPost("getMemberReferralHistory", data);
}

export async function getMerchantMarketingSettings(merchantId: string) {
  return apiPost("getMerchantMarketingSettings", { merchantId });
}

export async function submitSettlementPayment(data: any) {
  return apiPost("submitSettlementPayment", data);
}

export async function uploadSettlementReceipt(data: any) {
  return apiPost("uploadSettlementReceipt", data);
}

export async function uploadTransactionReceipt(data: any) {
  return apiPost("uploadTransactionReceipt", data);
}

export async function updateMerchantProfile(data: {
  merchantId: string;
  businessName: string;
  phone: string;
  address: string;
  openTime?: string;
  closeTime?: string;
  restDay?: string;
  description?: string;
}) {
  return apiPost("updateMerchantProfile", data);
}

export async function uploadMerchantLogo(data: any) {
  return apiPost("uploadMerchantLogo", data);
}

export async function uploadMerchantBanner(data: any) {
  return apiPost("uploadMerchantBanner", data);
}

export async function updateMerchantPassword(data: any) {
  return apiPost("updateMerchantPassword", data);
}

export async function changeMerchantPassword(data: any) {
  return apiPost("changeMerchantPassword", data);
}

export async function getMemberDashboard(data: any) {
  return apiPost("getMemberDashboard", data);
}

export async function getMerchantGallery(merchantId: string) {
  return apiPost("getMerchantGallery", { merchantId });
}

export async function getMerchantProducts(merchantId: string) {
  return apiPost("getMerchantProducts", { merchantId });
}

export async function getProductDetail(productId: string) {
  return apiPost("getProductDetail", { productId });
}

export async function checkFavouriteMerchant(data: any) {
  return apiPost("checkFavouriteMerchant", data);
}

export async function toggleFavouriteMerchant(data: any) {
  return apiPost("toggleFavouriteMerchant", data);
}

export async function getMemberFavouriteMerchants(data: any) {
  return apiPost("getMemberFavouriteMerchants", data);
}

export async function uploadMerchantGallery(data: {
  merchantId: string;
  title?: string;
  fileName: string;
  mimeType: string;
  base64: string;
}) {
  return apiPost("uploadMerchantGallery", data);
}

export async function updateMerchantGallery(data: {
  merchantId: string;
  galleryId: string;
  title?: string;
  sortOrder?: number;
}) {
  return apiPost("updateMerchantGallery", data);
}

export async function deleteMerchantGallery(data: {
  merchantId: string;
  galleryId: string;
}) {
  return apiPost("deleteMerchantGallery", data);
}

export type SavePushSubscriptionPayload = {
  userType: "MEMBER" | "MERCHANT" | "ADMIN";
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
};

export async function savePushSubscription(
  data: SavePushSubscriptionPayload
) {
  return apiPost("savePushSubscription", data);
}

export async function disablePushSubscription(data: {
  endpoint: string;
}) {
  return apiPost("disablePushSubscription", data);
}