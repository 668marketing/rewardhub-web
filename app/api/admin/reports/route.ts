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

function getOrigin(
  request: NextRequest
) {
  const host =
    request.headers.get(
      "x-forwarded-host"
    ) ||
    request.headers.get("host");

  const protocol =
    request.headers.get(
      "x-forwarded-proto"
    ) ||
    (
      process.env.NODE_ENV ===
      "production"
        ? "https"
        : "http"
    );

  return host
    ? `${protocol}://${host}`
    : request.nextUrl.origin;
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

async function callRewardHub<T>(
  request: NextRequest,
  payload: Record<
    string,
    unknown
  >
): Promise<T> {
  const response =
    await fetch(
      `${getOrigin(request)}/api/rewardhub`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify(
            payload
          ),
        cache: "no-store",
      }
    );

  const rawText =
    await response.text();

  let result:
    RewardHubResponse<T>;

  try {
    result =
      JSON.parse(rawText) as
        RewardHubResponse<T>;
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
      "RewardHub reports request failed."
    );
  }

  return (
    result.data ??
    result.result
  ) as T;
}

function errorResponse(
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Unable to load reports.";

  const isAuthError =
    /unauthorized|session|expired|inactive|authentication/i.test(
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
  request: NextRequest
) {
  try {
    const token =
      request.cookies.get(
        "rewardhub_admin_session"
      )?.value || "";

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

    const startDate =
      request.nextUrl.searchParams.get(
        "startDate"
      ) || "";

    const endDate =
      request.nextUrl.searchParams.get(
        "endDate"
      ) || "";

    const data =
      await callRewardHub(
        request,
        {
          action:
            "getAdminReportsDashboard",
          token,
          startDate,
          endDate,
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

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin reports GET error:",
      error
    );

    return errorResponse(
      error
    );
  }
}