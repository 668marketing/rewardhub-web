"use client";

export type AdminReviewStatus =
  | "Published"
  | "Hidden"
  | "Deleted";

export type AdminMerchantReview = {
  reviewId: string;
  transactionId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  memberTier: string;
  memberStatus: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  merchantPhone: string;
  merchantCategory: string;
  merchantStatus: string;
  merchantLogoUrl: string;
  rating: number;
  comment: string;
  merchantReply: string;
  status: AdminReviewStatus;
  isPinned: boolean;
  adminNote: string;
  adminUpdatedBy: string;
  adminUpdatedAt: string;
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminReviewsSummary = {
  total: number;
  published: number;
  hidden: number;
  deleted: number;
  replied: number;
  pendingReply: number;
  pinned: number;
  averageRating: number;
  oneStar: number;
  twoStar: number;
  threeStar: number;
  fourStar: number;
  fiveStar: number;
};

export type AdminReviewsData = {
  summary: AdminReviewsSummary;
  filters: {
    merchants: Array<{
      merchantId: string;
      businessName: string;
    }>;
  };
  reviews: AdminMerchantReview[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    from: number;
    to: number;
  };
};

export type AdminReviewDetailData = {
  review: AdminMerchantReview;
  transaction: {
    transactionId: string;
    amount: number;
    payAmount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
  } | null;
};

export type AdminReviewFilters = {
  search?: string;
  status?: string;
  rating?: string;
  merchantId?: string;
  replyStatus?: string;
  pinned?: string;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  pageSize?: number;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
};

async function parseResponse<T>(
  response: Response
): Promise<T> {
  const rawText = await response.text();

  let payload: ApiEnvelope<T>;

  try {
    payload = JSON.parse(rawText) as ApiEnvelope<T>;
  } catch {
    throw new Error(
      "RewardHub backend returned an invalid response."
    );
  }

  if (!response.ok || payload.success === false) {
    throw new Error(
      payload.error ||
        payload.message ||
        "Unable to process review request."
    );
  }

  const data = payload.data ?? payload.result;

  if (!data) {
    throw new Error(
      "Review response did not contain data."
    );
  }

  return data;
}

export async function getAdminMerchantReviews(
  filters: AdminReviewFilters
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        params.set(key, String(value));
      }
    }
  );

  const response = await fetch(
    `/api/admin/reviews?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return parseResponse<AdminReviewsData>(
    response
  );
}

export async function getAdminMerchantReviewDetail(
  reviewId: string
) {
  const response = await fetch(
    `/api/admin/reviews/${encodeURIComponent(
      reviewId
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return parseResponse<AdminReviewDetailData>(
    response
  );
}

async function patchReview(
  reviewId: string,
  body: Record<string, unknown>
) {
  const response = await fetch(
    `/api/admin/reviews/${encodeURIComponent(
      reviewId
    )}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  return parseResponse<AdminReviewDetailData>(
    response
  );
}

export function replyAdminMerchantReview(
  reviewId: string,
  merchantReply: string,
  adminNote = ""
) {
  return patchReview(reviewId, {
    action: "reply",
    merchantReply,
    adminNote,
  });
}

export function updateAdminMerchantReviewStatus(
  reviewId: string,
  status: "Published" | "Hidden",
  adminNote = ""
) {
  return patchReview(reviewId, {
    action: "status",
    status,
    adminNote,
  });
}

export function updateAdminMerchantReviewPinned(
  reviewId: string,
  isPinned: boolean
) {
  return patchReview(reviewId, {
    action: "pinned",
    isPinned,
  });
}

export async function deleteAdminMerchantReview(
  reviewId: string,
  reason: string
) {
  const response = await fetch(
    `/api/admin/reviews/${encodeURIComponent(
      reviewId
    )}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
      }),
    }
  );

  return parseResponse<{
    deleted: boolean;
    reviewId: string;
    reason: string;
  }>(response);
}
