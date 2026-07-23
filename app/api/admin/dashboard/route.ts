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
    (process.env.NODE_ENV ===
    "production"
      ? "https"
      : "http");

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

export async function GET(
  request: NextRequest
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

    const origin =
      getRequestOrigin(request);

    const backendResponse =
      await fetch(
        `${origin}/api/rewardhub`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            action:
              "getAdminDashboardSummary",
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
          }),
        }
      );

    const rawText =
      await backendResponse.text();

    let payload:
      RewardHubResponse<unknown>;

    try {
      payload =
        JSON.parse(rawText);
    } catch {
      console.error(
        "Invalid dashboard backend response:",
        rawText
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Dashboard backend returned an invalid response.",
        },
        { status: 502 }
      );
    }

    if (
      !backendResponse.ok ||
      payload.success === false
    ) {
      const errorMessage =
        payload.error ||
        payload.message ||
        "Unable to load dashboard.";

      const isAuthError =
        /unauthorized|session|expired|inactive/i.test(
          errorMessage
        );

      const response =
        NextResponse.json(
          {
            success: false,
            error: errorMessage,
          },
          {
            status: isAuthError
              ? 401
              : 500,
          }
        );

      return isAuthError
        ? clearAdminCookie(response)
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
            "Dashboard data is missing.",
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
      "Admin dashboard route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load dashboard.",
      },
      { status: 500 }
    );
  }
}