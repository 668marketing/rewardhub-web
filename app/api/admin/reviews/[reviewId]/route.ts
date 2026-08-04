import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RewardHubResponse<T> = {
  success?: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
};

function clearAdminCookie(
  response: NextResponse
) {
  response.cookies.set({
    name: "rewardhub_admin_session",
    value: "",
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}

async function callBackend(
  request: NextRequest,
  reviewId: string,
  body: Record<string, unknown>
) {
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

  const response = await fetch(
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
      body: JSON.stringify({
        token,
        reviewId,
        userAgent:
          request.headers.get(
            "user-agent"
          ) || "",
        ipAddress:
          request.headers.get(
            "x-forwarded-for"
          ) ||
          request.headers.get(
            "x-real-ip"
          ) ||
          "",
        ...body,
      }),
    }
  );

  const rawText =
    await response.text();

  let payload:
    RewardHubResponse<unknown>;

  try {
    payload =
      JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error:
          "Review backend returned an invalid response.",
      },
      { status: 502 }
    );
  }

  if (
    !response.ok ||
    payload.success === false
  ) {
    const errorMessage =
      payload.error ||
      payload.message ||
      "Unable to process review.";

    const isAuthError =
      /unauthorized|session|expired|inactive|authentication/i.test(
        errorMessage
      );

    const nextResponse =
      NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        {
          status:
            isAuthError
              ? 401
              : 500,
        }
      );

    return isAuthError
      ? clearAdminCookie(
          nextResponse
        )
      : nextResponse;
  }

  return NextResponse.json({
    success: true,
    data:
      payload.data ||
      payload.result,
  });
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      reviewId: string;
    }>;
  }
) {
  const { reviewId } =
    await context.params;

  return callBackend(
    request,
    decodeURIComponent(reviewId),
    {
      action:
        "getAdminMerchantReviewDetail",
    }
  );
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      reviewId: string;
    }>;
  }
) {
  const { reviewId } =
    await context.params;

  let body:
    Record<string, unknown>;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid request body.",
      },
      { status: 400 }
    );
  }

  const localAction =
    String(
      body.action || ""
    )
      .trim()
      .toLowerCase();

  let backendAction = "";

  if (
    localAction === "reply"
  ) {
    backendAction =
      "replyAdminMerchantReview";
  } else if (
    localAction === "status"
  ) {
    backendAction =
      "updateAdminMerchantReviewStatus";
  } else if (
    localAction === "pinned"
  ) {
    backendAction =
      "updateAdminMerchantReviewPinned";
  } else {
    return NextResponse.json(
      {
        success: false,
        error:
          "Unsupported review action.",
      },
      { status: 400 }
    );
  }

  const {
    action: _ignored,
    ...rest
  } = body;

  return callBackend(
    request,
    decodeURIComponent(reviewId),
    {
      action:
        backendAction,
      ...rest,
    }
  );
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      reviewId: string;
    }>;
  }
) {
  const { reviewId } =
    await context.params;

  let body:
    Record<string, unknown> = {};

  try {
    body =
      await request.json();
  } catch {
    body = {};
  }

  return callBackend(
    request,
    decodeURIComponent(reviewId),
    {
      action:
        "deleteAdminMerchantReview",
      reason:
        body.reason || "",
    }
  );
}
