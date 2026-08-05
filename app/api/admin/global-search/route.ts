import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

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
    request.headers.get(
      "host"
    );

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

    value:
      "",

    httpOnly:
      true,

    secure:
      process.env.NODE_ENV ===
      "production",

    sameSite:
      "lax",

    path:
      "/",

    expires:
      new Date(0),
  });

  return response;
}

function getRequestMetadata(
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

async function callRewardHub<T>(
  request: NextRequest,
  payload: Record<
    string,
    unknown
  >
): Promise<T> {
  const response =
    await fetch(
      `${getRequestOrigin(
        request
      )}/api/rewardhub`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        cache:
          "no-store",

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  const rawText =
    await response.text();

  let result:
    RewardHubResponse<T>;

  try {
    result =
      rawText
        ? JSON.parse(
            rawText
          )
        : {};
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
      : "Unable to process Global Search request.";

  const isAuthError =
    /unauthorized|session|expired|inactive|authentication/i.test(
      message
    );

  const isPermissionError =
    /permission|forbidden/i.test(
      message
    );

  const response =
    NextResponse.json(
      {
        success:
          false,

        error:
          message,
      },
      {
        status:
          isAuthError
            ? 401
            : isPermissionError
              ? 403
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
      )?.value ||
      "";

    if (!token) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Admin authentication required.",
        },
        {
          status:
            401,
        }
      );
    }

    const query =
      (
        request.nextUrl.searchParams.get(
          "query"
        ) ||
        ""
      ).trim();

    const rawLimit =
      Number(
        request.nextUrl.searchParams.get(
          "limit"
        ) ||
        20
      );

    const limit =
      Math.min(
        Math.max(
          Number.isFinite(
            rawLimit
          )
            ? rawLimit
            : 20,
          1
        ),
        50
      );

    if (!query) {
      return NextResponse.json(
        {
          success:
            true,

          data: {
            query:
              "",

            minimumQueryLength:
              2,

            total:
              0,

            totalMatched:
              0,

            results:
              [],

            groups:
              [],
          },
        },
        {
          status:
            200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }

    const data =
      await callRewardHub(
        request,
        {
          action:
            "adminGlobalSearch",

          token,

          query,

          limit,

          ...getRequestMetadata(
            request
          ),
        }
      );

    return NextResponse.json(
      {
        success:
          true,

        data,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          Pragma:
            "no-cache",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin Global Search GET error:",
      error
    );

    return errorResponse(
      error
    );
  }
}