import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    merchantId: string;
    reviewId: string;
  }>;
};

type ReviewAction =
  | "reply"
  | "status"
  | "pinned"
  | "delete";

type BackendPayload = {
  success?: boolean;
  data?: unknown;
  result?: unknown;
  error?: string;
  message?: string;
};

function resolveAction(
  action: ReviewAction
) {
  if (action === "reply") {
    return "replyAdminMerchantReview";
  }

  if (action === "status") {
    return "updateAdminMerchantReviewStatus";
  }

  if (action === "pinned") {
    return "updateAdminMerchantReviewPinned";
  }

  return "deleteAdminMerchantReview";
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const token =
      request.cookies.get(
        "rewardhub_admin_session"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin authentication required.",
        },
        { status: 401 }
      );
    }

    const {
      merchantId,
      reviewId,
    } = await context.params;

    const cleanMerchantId =
      decodeURIComponent(
        merchantId || ""
      ).trim();

    const cleanReviewId =
      decodeURIComponent(
        reviewId || ""
      ).trim();

    if (
      !cleanMerchantId ||
      !cleanReviewId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Merchant ID and Review ID are required.",
        },
        { status: 400 }
      );
    }

    const body =
      (await request.json()) as {
        action?: ReviewAction;
        merchantReply?: string;
        status?:
          | "PUBLISHED"
          | "HIDDEN"
          | "DELETED";
        isPinned?: boolean;
        reason?: string;
      };

    const action =
      body.action;

    if (
      action !== "reply" &&
      action !== "status" &&
      action !== "pinned" &&
      action !== "delete"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid review action.",
        },
        { status: 400 }
      );
    }

    const payload: Record<
      string,
      unknown
    > = {
      action:
        resolveAction(
          action
        ),
      token,
      merchantId:
        cleanMerchantId,
      reviewId:
        cleanReviewId,
    };

    if (action === "reply") {
      payload.merchantReply =
        String(
          body.merchantReply || ""
        ).trim();
    }

    if (action === "status") {
      payload.status =
        body.status;

      payload.reason =
        String(
          body.reason || ""
        ).trim();
    }

    if (action === "pinned") {
      payload.isPinned =
        Boolean(
          body.isPinned
        );
    }

    if (action === "delete") {
      payload.reason =
        String(
          body.reason || ""
        ).trim();
    }

    const backendResponse =
      await fetch(
        new URL(
          "/api/rewardhub",
          request.nextUrl.origin
        ),
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          cache: "no-store",
          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const rawText =
      await backendResponse.text();

    let result:
      BackendPayload;

    try {
      result =
        JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            rawText
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 500) ||
            "Review backend returned an invalid response.",
        },
        { status: 502 }
      );
    }

    if (
      !backendResponse.ok ||
      result.success === false
    ) {
      const message =
        result.error ||
        result.message ||
        "Unable to update review.";

      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data:
        result.data ||
        result.result ||
        result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update review.",
      },
      { status: 500 }
    );
  }
}