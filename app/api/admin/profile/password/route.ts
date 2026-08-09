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
 * 不可以使用：
 *
 * /required|session|.../
 *
 * 因为：
 *
 * "Current password is required"
 * "Change reason is required"
 *
 * 不能被当成 Session 失效。
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
      "Admin Password invalid RewardHub response:",
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
      : "Unable to update administrator password.";

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

export async function POST(
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
            "Invalid password request body.",
        },
        {
          status:
            400,
        }
      );
    }

    const currentPassword =
      String(
        body.currentPassword ||
        ""
      );

    const newPassword =
      String(
        body.newPassword ||
        ""
      );

    const reason =
      String(
        body.reason ||
        ""
      ).trim();

    if (!currentPassword) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Current password is required.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      newPassword.length <
      10
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "New password must contain at least 10 characters.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !/[A-Z]/.test(
        newPassword
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "New password must contain at least one uppercase letter.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !/[a-z]/.test(
        newPassword
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "New password must contain at least one lowercase letter.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !/\d/.test(
        newPassword
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "New password must contain at least one number.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !/[^A-Za-z0-9]/.test(
        newPassword
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "New password must contain at least one special character.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "New password must be different from the current password.",
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
            "updateAdminPassword",

          token,

          currentPassword,

          newPassword,

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
      "Admin Password POST error:",
      error
    );

    return errorResponse(
      error
    );
  }
}   