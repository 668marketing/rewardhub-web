import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    settlementId: string;
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
  body: Record<string, unknown>
) {
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
        body: JSON.stringify(body),
      }
    );

  const rawText =
    await backendResponse.text();

  let payload:
    BackendResponse<unknown>;

  try {
    payload =
      JSON.parse(rawText);
  } catch {
    throw new Error(
      rawText
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500) ||
      "Settlement backend returned an invalid response."
    );
  }

  return {
    backendResponse,
    payload,
  };
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

    const { settlementId } =
      await context.params;

    const decodedSettlementId =
      decodeURIComponent(
        settlementId || ""
      );

    if (!decodedSettlementId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Settlement ID is required.",
        },
        { status: 400 }
      );
    }

    const {
      backendResponse,
      payload,
    } =
      await callBackend(
        request,
        {
          action:
            "getAdminSettlementDetail",
          token,
          settlementId:
            decodedSettlementId,
        }
      );

    if (
      !backendResponse.ok ||
      payload.success === false
    ) {
      return createErrorResponse(
        payload
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
            "Settlement detail is missing.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Admin settlement detail route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load settlement details.",
      },
      { status: 500 }
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

    const { settlementId } =
      await context.params;

    const decodedSettlementId =
      decodeURIComponent(
        settlementId || ""
      );

    if (!decodedSettlementId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Settlement ID is required.",
        },
        { status: 400 }
      );
    }

    const body =
      (await request.json()) as {
        action?: string;
        merchantId?: string;
        rejectReason?: string;
        paymentMethod?: string;
        paymentNote?: string;
        receiptUrl?: string;
      };

    const action =
      String(
        body.action || ""
      )
        .trim()
        .toLowerCase();

    const merchantId =
      String(
        body.merchantId || ""
      ).trim();

    if (!merchantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Merchant ID is required.",
        },
        { status: 400 }
      );
    }

    let backendAction = "";

    if (action === "approve") {
      backendAction =
        "approveAdminMerchantSettlement";
    } else if (
      action === "reject"
    ) {
      backendAction =
        "rejectAdminMerchantSettlement";
    } else if (
      action === "mark-paid"
    ) {
      backendAction =
        "markAdminSettlementPaid";
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid settlement action.",
        },
        { status: 400 }
      );
    }

    const rejectReason =
      String(
        body.rejectReason || ""
      ).trim();

    if (
      action === "reject" &&
      rejectReason.length < 3
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Reject reason must contain at least 3 characters.",
        },
        { status: 400 }
      );
    }

    const {
      backendResponse,
      payload,
    } =
      await callBackend(
        request,
        {
          action:
            backendAction,
          token,
          settlementId:
            decodedSettlementId,
          merchantId,
          rejectReason,
          reason:
            rejectReason,
          paymentMethod:
            String(
              body.paymentMethod ||
              "Bank Transfer"
            ).trim(),
          paymentNote:
            String(
              body.paymentNote ||
              "Settlement payment completed."
            ).trim(),
          receiptUrl:
            String(
              body.receiptUrl || ""
            ).trim(),
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

    if (
      !backendResponse.ok ||
      payload.success === false
    ) {
      return createErrorResponse(
        payload
      );
    }

    return NextResponse.json({
      success: true,
      data:
        payload.data ||
        payload.result ||
        {},
    });
  } catch (error) {
    console.error(
      "Admin settlement action route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update settlement.",
      },
      { status: 500 }
    );
  }
}

function createErrorResponse(
  payload: BackendResponse<unknown>
) {
  const message =
    payload.error ||
    payload.message ||
    "Settlement request failed.";

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
