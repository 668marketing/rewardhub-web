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

export async function GET(
  request: NextRequest
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

  const searchParams =
    request.nextUrl.searchParams;

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
        action:
          "getAdminMerchantReviews",
        token,
        search:
          searchParams.get("search") ||
          "",
        status:
          searchParams.get("status") ||
          "ALL",
        rating:
          searchParams.get("rating") ||
          "ALL",
        merchantId:
          searchParams.get(
            "merchantId"
          ) || "ALL",
        replyStatus:
          searchParams.get(
            "replyStatus"
          ) || "ALL",
        pinned:
          searchParams.get("pinned") ||
          "ALL",
        sortBy:
          searchParams.get("sortBy") ||
          "CREATED_AT",
        sortDirection:
          searchParams.get(
            "sortDirection"
          ) || "DESC",
        page:
          Number(
            searchParams.get("page") ||
              1
          ),
        pageSize:
          Number(
            searchParams.get(
              "pageSize"
            ) || 25
          ),
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
          "Reviews backend returned an invalid response.",
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
      "Unable to load reviews.";

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
