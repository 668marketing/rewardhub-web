import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    name: "rewardhub_admin_session",
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

async function callBackend<T>(
  request: NextRequest,
  body: Record<string, unknown>
) {
  const token =
    request.cookies.get(
      "rewardhub_admin_session"
    )?.value;

  if (!token) {
    return {
      response:
        NextResponse.json(
          {
            success: false,
            error:
              "Admin authentication required.",
          },
          { status: 401 }
        ),
    };
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
        body: JSON.stringify({
          ...body,
          token,
        }),
      }
    );

  const rawText =
    await backendResponse.text();

  let payload:
    BackendResponse<T>;

  try {
    payload =
      JSON.parse(rawText);
  } catch {
    return {
      response:
        NextResponse.json(
          {
            success: false,
            error:
              rawText
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 500) ||
              "Merchant application backend returned an invalid response.",
          },
          { status: 502 }
        ),
    };
  }

  if (
    !backendResponse.ok ||
    payload.success === false
  ) {
    const message =
      payload.error ||
      payload.message ||
      "Merchant application request failed.";

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

    return {
      response:
        unauthorized
          ? clearAdminCookie(
              response
            )
          : response,
    };
  }

  const result =
    payload.data ||
    payload.result;

  if (!result) {
    return {
      response:
        NextResponse.json(
          {
            success: false,
            error:
              "Merchant application response data is missing.",
          },
          { status: 502 }
        ),
    };
  }

  return {
    data: result,
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { merchantId } =
      await context.params;

    const result =
      await callBackend<unknown>(
        request,
        {
          action:
            "getAdminMerchantApplicationDetail",
          merchantId:
            decodeURIComponent(
              merchantId
            ),
        }
      );

    if (result.response) {
      return result.response;
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error(
      "Merchant application detail route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load merchant application details.",
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
    const { merchantId } =
      await context.params;

    const body =
      (await request.json()) as {
        action?: string;
        reviewNote?: string;
        rejectReason?: string;
      };

    const action =
      String(
        body.action || ""
      ).toLowerCase();

    if (
      action !== "approve" &&
      action !== "reject"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Action must be approve or reject.",
        },
        { status: 400 }
      );
    }

    const result =
      await callBackend<unknown>(
        request,
        {
          action:
            action === "approve"
              ? "approveAdminMerchantApplication"
              : "rejectAdminMerchantApplication",
          merchantId:
            decodeURIComponent(
              merchantId
            ),
          reviewNote:
            String(
              body.reviewNote || ""
            ),
          rejectReason:
            String(
              body.rejectReason || ""
            ),
        }
      );

    if (result.response) {
      return result.response;
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error(
      "Merchant application action route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update merchant application.",
      },
      { status: 500 }
    );
  }
}
