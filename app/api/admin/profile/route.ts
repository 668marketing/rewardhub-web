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

type UnknownRecord =
  Record<string, unknown>;

function isRecord(
  value: unknown
): value is UnknownRecord {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getOrigin(
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

  return host
    ? `${protocol}://${host}`
    : request.nextUrl.origin;
}

function getToken(
  request: NextRequest
) {
  return (
    request.cookies.get(
      "rewardhub_admin_session"
    )?.value ||
    ""
  );
}

function requestMetadata(
  request: NextRequest
) {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for"
    );

  const ipAddress =
    forwardedFor
      ? forwardedFor
          .split(",")[0]
          .trim()
      : request.headers.get(
          "x-real-ip"
        ) || "";

  return {
    userAgent:
      request.headers.get(
        "user-agent"
      ) || "",

    ipAddress,
  };
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

function normalizeMessage(
  value: unknown
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
}

/*
 * 只有这些明确的管理员认证错误，
 * 才会删除管理员 Session Cookie。
 *
 * 不可以只匹配 "required"，
 * 因为：
 *
 * "Full name is required"
 * "Change reason is required"
 *
 * 都不是登录失效。
 */
function isExplicitAuthFailure(
  message: string
) {
  const normalized =
    normalizeMessage(
      message
    );

  const exactMessages = [
    "no admin session",
    "no admin session.",

    "admin authentication required",
    "admin authentication required.",

    "administrator authentication required",
    "administrator authentication required.",

    "unauthorized administrator session",
    "unauthorized administrator session.",

    "invalid admin session",
    "invalid admin session.",

    "admin session is invalid",
    "admin session is invalid.",

    "admin session expired",
    "admin session expired.",

    "administrator session expired",
    "administrator session expired.",

    "invalid session token",
    "invalid session token.",

    "administrator account is inactive",
    "administrator account is inactive.",

    "admin account is inactive",
    "admin account is inactive.",
  ];

  if (
    exactMessages.includes(
      normalized
    )
  ) {
    return true;
  }

  return (
    normalized.includes(
      "unauthorized administrator session"
    ) ||
    normalized.includes(
      "admin session expired"
    ) ||
    normalized.includes(
      "administrator session expired"
    ) ||
    normalized.includes(
      "invalid admin session"
    ) ||
    normalized.includes(
      "invalid session token"
    )
  );
}

/*
 * /api/rewardhub 有时候可能返回：
 *
 * {
 *   success: true,
 *   data: {
 *     message: "...",
 *     data: {...}
 *   }
 * }
 *
 * 这里不会强制拆掉全部包装，
 * 因为前端 admin-profile.ts 已经支持多层 data。
 */
async function callRewardHub<T>(
  request: NextRequest,
  payload: Record<
    string,
    unknown
  >
): Promise<T> {
  const rewardHubUrl =
    new URL(
      "/api/rewardhub",
      getOrigin(
        request
      )
    );

  const response =
    await fetch(
      rewardHubUrl,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
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

  let parsed:
    RewardHubResponse<T>;

  try {
    parsed =
      rawText
        ? JSON.parse(
            rawText
          )
        : {};
  } catch {
    console.error(
      "Admin Profile invalid RewardHub response:",
      {
        status:
          response.status,

        contentType:
          response.headers.get(
            "content-type"
          ),

        preview:
          rawText.slice(
            0,
            500
          ),
      }
    );

    throw new Error(
      "RewardHub backend returned an invalid response."
    );
  }

  if (
    !response.ok ||
    parsed.success === false
  ) {
    throw new Error(
      parsed.error ||
      parsed.message ||
      "RewardHub request failed."
    );
  }

  const result =
    parsed.data ??
    parsed.result;

  if (
    result ===
      undefined ||
    result ===
      null
  ) {
    throw new Error(
      "RewardHub backend returned an incomplete response."
    );
  }

  return result;
}

function errorResponse(
  error: unknown
) {
  const message =
    error instanceof
      Error
      ? error.message
      : "Unable to process Admin Profile request.";

  const authFailure =
    isExplicitAuthFailure(
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
          authFailure
            ? 401
            : 500,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );

  return authFailure
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
      getToken(
        request
      );

    if (!token) {
      const response =
        NextResponse.json(
          {
            success:
              false,

            error:
              "Admin authentication required.",
          },
          {
            status:
              401,

            headers: {
              "Cache-Control":
                "no-store, no-cache, must-revalidate",
            },
          }
        );

      return clearAdminCookie(
        response
      );
    }

    const data =
      await callRewardHub(
        request,
        {
          action:
            "getCurrentAdmin",

          token,

          ...requestMetadata(
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

          Expires:
            "0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin Profile GET error:",
      error
    );

    return errorResponse(
      error
    );
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    const token =
      getToken(
        request
      );

    if (!token) {
      const response =
        NextResponse.json(
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

      return clearAdminCookie(
        response
      );
    }

    let body:
      UnknownRecord;

    try {
      const parsedBody =
        await request.json();

      body =
        isRecord(
          parsedBody
        )
          ? parsedBody
          : {};
    } catch {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Invalid profile request body.",
        },
        {
          status:
            400,
        }
      );
    }

    const fullName =
      String(
        body.fullName ||
        ""
      ).trim();

    const email =
      String(
        body.email ||
        ""
      )
        .trim()
        .toLowerCase();

    const phone =
      String(
        body.phone ||
        ""
      ).trim();

    const reason =
      String(
        body.reason ||
        ""
      ).trim();

    if (!fullName) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Full name is required.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Enter a valid email address.",
        },
        {
          status:
            400,
        }
      );
    }

    if (!reason) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Change reason is required.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      reason.length >
      500
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Change reason cannot exceed 500 characters.",
        },
        {
          status:
            400,
        }
      );
    }

    const data =
      await callRewardHub(
        request,
        {
          action:
            "updateAdminProfile",

          token,

          fullName,

          email,

          phone,

          reason,

          ...requestMetadata(
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
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin Profile PATCH error:",
      error
    );

    return errorResponse(
      error
    );
  }
}