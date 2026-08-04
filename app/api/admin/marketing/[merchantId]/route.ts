import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    merchantId: string;
  }>;
};

type BackendResponse<T> = {
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
    name:
      "rewardhub_admin_session",
    value: "",
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}

async function callBackend(
  request: NextRequest,
  body: Record<
    string,
    unknown
  >
) {
  return fetch(
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
      body: JSON.stringify(body),
    }
  );
}

export async function GET(
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

    const { merchantId } =
      await context.params;

    const decodedMerchantId =
      decodeURIComponent(
        merchantId || ""
      );

    if (!decodedMerchantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Merchant ID is required.",
        },
        { status: 400 }
      );
    }

    const backendResponse =
      await callBackend(
        request,
        {
          action:
            "getAdminMarketingBudgetDetail",
          token,
          merchantId:
            decodedMerchantId,
        }
      );

    return handleResponse(
      backendResponse
    );
  } catch (error) {
    return errorResponse(
      error,
      "Unable to load merchant marketing settings."
    );
  }
}

export async function POST(
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

    const { merchantId } =
      await context.params;

    const decodedMerchantId =
      decodeURIComponent(
        merchantId || ""
      );

    if (!decodedMerchantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Merchant ID is required.",
        },
        { status: 400 }
      );
    }

    const body =
      (await request.json()) as {
        normalBudget?: number;
        acceptRewardCredits?: boolean;
        redemptionLimit?: number;
        boostEnabled?: boolean;
        boostBudget?: number;
        boostStart?: string;
        boostEnd?: string;
        reason?: string;
      };

    const normalBudget =
      Number(
        body.normalBudget
      );

    const redemptionLimit =
      Number(
        body.redemptionLimit
      );

    const boostBudget =
      Number(
        body.boostBudget
      );

    const reason =
      String(
        body.reason || ""
      ).trim();

    if (
      !Number.isFinite(
        normalBudget
      ) ||
      normalBudget < 5 ||
      normalBudget > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Normal marketing budget must be between 5% and 100%.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(
        redemptionLimit
      ) ||
      redemptionLimit < 0 ||
      redemptionLimit > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Reward Credit limit must be between 0% and 100%.",
        },
        { status: 400 }
      );
    }

    if (
      body.boostEnabled &&
      (
        !Number.isFinite(
          boostBudget
        ) ||
        boostBudget < 5 ||
        boostBudget > 100
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Boost budget must be between 5% and 100%.",
        },
        { status: 400 }
      );
    }

    if (
      reason.length < 5
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter an update reason of at least 5 characters.",
        },
        { status: 400 }
      );
    }

    const backendResponse =
      await callBackend(
        request,
        {
          action:
            "updateAdminMarketingBudget",

          token,
          merchantId:
            decodedMerchantId,

          normalBudget,

          acceptRewardCredits:
            Boolean(
              body.acceptRewardCredits
            ),

          redemptionLimit,

          boostEnabled:
            Boolean(
              body.boostEnabled
            ),

          boostBudget,

          boostStart:
            String(
              body.boostStart || ""
            ),

          boostEnd:
            String(
              body.boostEnd || ""
            ),

          reason,

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
        }
      );

    return handleResponse(
      backendResponse
    );
  } catch (error) {
    return errorResponse(
      error,
      "Unable to update merchant marketing settings."
    );
  }
}

async function handleResponse(
  backendResponse: Response
) {
  const rawText =
    await backendResponse.text();

  let payload:
    BackendResponse<unknown>;

  try {
    payload =
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
          "Marketing backend returned an invalid response.",
      },
      { status: 502 }
    );
  }

  if (
    !backendResponse.ok ||
    payload.success === false
  ) {
    const message =
      payload.error ||
      payload.message ||
      "Marketing request failed.";

    const unauthorized =
      /session|unauthorized|expired|inactive/i.test(
        message
      );

    const response =
      NextResponse.json(
        {
          success: false,
          error: message,
        },
        {
          status:
            unauthorized
              ? 401
              : 400,
        }
      );

    return unauthorized
      ? clearAdminCookie(
          response
        )
      : response;
  }

  const result =
    payload.data ||
    payload.result;

  if (!result) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Marketing response data is missing.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result,
  });
}

function errorResponse(
  error: unknown,
  fallback: string
) {
  console.error(
    "Admin marketing detail route error:",
    error
  );

  return NextResponse.json(
    {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : fallback,
    },
    { status: 500 }
  );
}
