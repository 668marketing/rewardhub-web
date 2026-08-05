import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

type BackendResponse = {
  success?: boolean;
  data?: unknown;
  result?: unknown;
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
  payload: Record<string, unknown>
) {
  const token =
    request.cookies.get(
      "rewardhub_admin_session"
    )?.value;

  if (!token) {
    throw new Error(
      "Admin authentication required."
    );
  }

  const response =
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
          JSON.stringify({
            token,
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
            ...payload,
          }),
      }
    );

  const text =
    await response.text();

  let result: BackendResponse;

  try {
    result =
      JSON.parse(text);
  } catch {
    throw new Error(
      "Campaign backend returned invalid JSON."
    );
  }

  if (
    !response.ok ||
    result.success === false
  ) {
    throw new Error(
      result.error ||
      result.message ||
      "Campaign request failed."
    );
  }

  const output =
    result.data ??
    result.result ??
    null;

  if (
    output &&
    typeof output === "object" &&
    "data" in
      (output as Record<string, unknown>)
  ) {
    return (
      output as Record<string, unknown>
    ).data;
  }

  return output;
}

function respondError(
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Campaign request failed.";

  const auth =
    /authentication|session|unauthorized|expired/i.test(
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
          auth
            ? 401
            : 500,
      }
    );

  return auth
    ? clearAdminCookie(
        response
      )
    : response;
}


export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      campaignId: string;
    }>;
  }
) {
  try {
    const {
      campaignId,
    } =
      await context.params;

    const data =
      await callBackend(
        request,
        {
          action:
            "getAdminCampaignDetail",
          campaignId:
            decodeURIComponent(
              campaignId
            ),
        }
      );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return respondError(
      error
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      campaignId: string;
    }>;
  }
) {
  try {
    const {
      campaignId,
    } =
      await context.params;

    const body =
      await request.json();

    const data =
      await callBackend(
        request,
        {
          action:
            "updateAdminCampaign",
          campaignId:
            decodeURIComponent(
              campaignId
            ),
          ...body,
        }
      );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return respondError(
      error
    );
  }
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      campaignId: string;
    }>;
  }
) {
  try {
    const {
      campaignId,
    } =
      await context.params;

    const body =
      await request.json();

    const actionMap:
      Record<string, string> = {
        duplicate:
          "duplicateAdminCampaign",
        cancel:
          "cancelAdminCampaign",
        complete:
          "completeAdminCampaign",
      };

    const backendAction =
      actionMap[
        String(
          body.action || ""
        )
      ];

    if (!backendAction) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid campaign action.",
        },
        {
          status: 400,
        }
      );
    }

    const data =
      await callBackend(
        request,
        {
          ...body,
          action:
            backendAction,
          campaignId:
            decodeURIComponent(
              campaignId
            ),
        }
      );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return respondError(
      error
    );
  }
}
