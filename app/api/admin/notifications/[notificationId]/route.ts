import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

type RewardHubResponse<T> = {
  success?: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
};

function getRequestOrigin(
  request: NextRequest
) {
  const forwardedHost =
    request.headers.get(
      "x-forwarded-host"
    );

  const host =
    forwardedHost ||
    request.headers.get("host");

  const forwardedProtocol =
    request.headers.get(
      "x-forwarded-proto"
    );

  const protocol =
    forwardedProtocol ||
    (
      process.env.NODE_ENV ===
      "production"
        ? "https"
        : "http"
    );

  if (host) {
    return `${protocol}://${host}`;
  }

  return request.nextUrl.origin;
}

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

async function callRewardHub(
  request: NextRequest,
  payload: Record<
    string,
    unknown
  >
) {
  const origin =
    getRequestOrigin(request);

  const response =
    await fetch(
      `${origin}/api/rewardhub`,
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
    await response.text();

  let result:
    RewardHubResponse<unknown>;

  try {
    result =
      JSON.parse(rawText);
  } catch {
    throw new Error(
      "RewardHub backend returned an invalid response."
    );
  }

  if (
    !response.ok ||
    result.success === false
  ) {
    throw new Error(
      result.error ||
      result.message ||
      "RewardHub request failed."
    );
  }

  const responsePayload =
    result.data ??
    result.result ??
    null;

  if (
    responsePayload &&
    typeof responsePayload ===
      "object"
  ) {
    const objectPayload =
      responsePayload as Record<
        string,
        unknown
      >;

    if (
      "data" in objectPayload
    ) {
      return objectPayload.data;
    }

    return objectPayload;
  }

  return responsePayload;
}

async function getToken(
  request: NextRequest
) {
  return (
    request.cookies.get(
      "rewardhub_admin_session"
    )?.value ||
    ""
  );
}

function buildRequestMetadata(
  request: NextRequest
) {
  return {
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
  };
}

function errorResponse(
  error: unknown
) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : "Unable to process notification history.";

  const isAuthError =
    /unauthorized|session|expired|inactive|authentication/i.test(
      errorMessage
    );

  const response =
    NextResponse.json(
      {
        success: false,
        error:
          errorMessage,
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
        response
      )
    : response;
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      notificationId: string;
    }>;
  }
) {
  try {
    const token =
      await getToken(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      notificationId,
    } =
      await context.params;

    const data =
      await callRewardHub(
        request,
        {
          action:
            "getAdminNotificationDetail",

          token,

          notificationId:
            decodeURIComponent(
              notificationId
            ),

          ...buildRequestMetadata(
            request
          ),
        }
      );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Notification detail GET error:",
      error
    );

    return errorResponse(
      error
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      notificationId: string;
    }>;
  }
) {
  try {
    const token =
      await getToken(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      notificationId,
    } =
      await context.params;

    const data =
      await callRewardHub(
        request,
        {
          action:
            "deleteAdminNotificationHistory",

          token,

          notificationId:
            decodeURIComponent(
              notificationId
            ),

          ...buildRequestMetadata(
            request
          ),
        }
      );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Notification history DELETE error:",
      error
    );

    return errorResponse(
      error
    );
  }
}
