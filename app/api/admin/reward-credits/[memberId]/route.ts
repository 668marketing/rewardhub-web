import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    memberId: string;
  }>;
};

type BackendResponse<T> = {
  success?: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
};

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

    const { memberId } =
      await context.params;

    const decodedMemberId =
      decodeURIComponent(
        memberId || ""
      );

    if (!decodedMemberId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Member ID is required.",
        },
        { status: 400 }
      );
    }

    const backendResponse =
      await callBackend(
        request,
        {
          action:
            "getAdminMemberRewardCreditDetail",
          token,
          memberId:
            decodedMemberId,
          historyLimit: 100,
        }
      );

    return handleBackendResponse(
      backendResponse,
      "Reward Credit detail is missing."
    );
  } catch (error) {
    return errorResponse(
      error,
      "Unable to load Reward Credit details."
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

    const { memberId } =
      await context.params;

    const decodedMemberId =
      decodeURIComponent(
        memberId || ""
      );

    if (!decodedMemberId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Member ID is required.",
        },
        { status: 400 }
      );
    }

    const body =
      (await request.json()) as {
        adjustmentType?:
          | "ADD"
          | "DEDUCT";
        amount?: number;
        reason?: string;
      };

    const adjustmentType =
      String(
        body.adjustmentType || ""
      )
        .trim()
        .toUpperCase();

    const amount =
      Number(body.amount);

    const reason =
      String(
        body.reason || ""
      ).trim();

    if (
      adjustmentType !== "ADD" &&
      adjustmentType !== "DEDUCT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Adjustment type must be ADD or DEDUCT.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Amount must be greater than 0.",
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
            "Reason must contain at least 5 characters.",
        },
        { status: 400 }
      );
    }

    const backendResponse =
      await callBackend(
        request,
        {
          action:
            "adjustAdminMemberRewardCredits",
          token,
          memberId:
            decodedMemberId,
          adjustmentType,
          amount,
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

    return handleBackendResponse(
      backendResponse,
      "Reward Credit adjustment result is missing."
    );
  } catch (error) {
    return errorResponse(
      error,
      "Unable to adjust Reward Credits."
    );
  }
}

async function handleBackendResponse(
  backendResponse: Response,
  missingMessage: string
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
          "Reward Credits backend returned an invalid response.",
      },
      { status: 502 }
    );
  }

  if (
    !backendResponse.ok ||
    payload.success === false
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          payload.error ||
          payload.message ||
          "Reward Credits request failed.",
      },
      {
        status:
          backendResponse.status === 401
            ? 401
            : 400,
      }
    );
  }

  const result =
    payload.data ||
    payload.result;

  if (!result) {
    return NextResponse.json(
      {
        success: false,
        error:
          missingMessage,
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
    "Admin Reward Credits detail route error:",
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
