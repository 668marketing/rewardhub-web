import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

type RewardHubApiResponse<
  T = unknown,
> = {
  success?: boolean;
  data?: T;
  result?: T;
  message?: string;
  error?: string;
};

type AdminSessionResult = {
  valid?: boolean;
  reason?: string;
  expiresAt?: string;

  admin?: {
    adminId: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    lastLoginAt?: string;
  };

  permissions?: string[];
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

function normalizeMessage(
  value: unknown
) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/*
 * 只把非常明确的管理员身份错误
 * 视为真正需要退出登录。
 */
function isExplicitAuthFailure(
  message: string
) {
  const normalized =
    normalizeMessage(message);

  return [
    "no admin session",
    "no admin session.",
    "admin authentication required",
    "admin authentication required.",
    "invalid admin session",
    "invalid admin session.",
    "admin session is invalid",
    "admin session is invalid.",
    "admin session expired",
    "admin session expired.",
    "administrator account is inactive",
    "administrator account is inactive.",
    "admin account is inactive",
    "admin account is inactive.",
    "invalid session token",
    "invalid session token.",
  ].includes(normalized);
}

export async function GET(
  request: NextRequest
) {
  try {
    const token =
      request.cookies.get(
        "rewardhub_admin_session"
      )?.value;

    /*
     * 浏览器根本没有 Cookie，
     * 这时可以明确返回 401。
     */
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error:
            "No admin session.",
        },
        { status: 401 }
      );
    }

    const rewardHubUrl =
      new URL(
        "/api/rewardhub",
        request.nextUrl.origin
      );

    const apiResponse =
      await fetch(
        rewardHubUrl,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            action:
              "validateAdminSession",
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
      await apiResponse.text();

    let payload:
      RewardHubApiResponse<AdminSessionResult>;

    try {
      payload =
        JSON.parse(rawText) as
          RewardHubApiResponse<AdminSessionResult>;
    } catch {
      console.error(
        "Invalid admin session backend response:",
        rawText
      );

      /*
       * 后台返回空白或 HTML，
       * 属于临时服务器问题，
       * 不删除 Admin Cookie。
       */
      return NextResponse.json(
        {
          success: false,
          authenticated: null,
          error:
            "Admin session service returned an invalid response. Please retry.",
        },
        { status: 503 }
      );
    }

    const result =
      payload.data ||
      payload.result;

    const errorMessage =
      result?.reason ||
      payload.error ||
      payload.message ||
      "";

    /*
     * 只有明确的登录失效信息，
     * 才清除 Cookie。
     */
    const explicitAuthFailure =
      isExplicitAuthFailure(
        errorMessage
      );

    if (explicitAuthFailure) {
      const response =
        NextResponse.json(
          {
            success: false,
            authenticated: false,
            error:
              errorMessage ||
              "Admin session is invalid.",
          },
          { status: 401 }
        );

      return clearAdminCookie(
        response
      );
    }

    /*
     * RewardHub API 自己发生异常，
     * 但没有明确证明 Session 已失效。
     *
     * 返回 503，不删除 Cookie。
     */
    if (
      !apiResponse.ok ||
      payload.success === false
    ) {
      return NextResponse.json(
        {
          success: false,
          authenticated: null,
          error:
            errorMessage ||
            "Admin session service is temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    /*
     * 后台没有返回完整资料，
     * 也视为暂时异常，不清除 Cookie。
     */
    if (
      !result ||
      typeof result.valid !==
        "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          authenticated: null,
          error:
            "Admin session response is incomplete. Please retry.",
        },
        { status: 503 }
      );
    }

    /*
     * valid=false，但原因不是明确的认证错误。
     * 不直接删除 Cookie，避免网络慢时误退出。
     */
    if (
      !result.valid ||
      !result.admin
    ) {
      return NextResponse.json(
        {
          success: false,
          authenticated: null,
          error:
            errorMessage ||
            "Unable to confirm the admin session. Please retry.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      admin: result.admin,
      permissions:
        Array.isArray(
          result.permissions
        )
          ? result.permissions
          : [],
      expiresAt:
        result.expiresAt || "",
    });
  } catch (error) {
    console.error(
      "Admin session validation error:",
      error
    );

    /*
     * 请求超时、网络错误或服务器异常，
     * 不删除 Cookie。
     */
    return NextResponse.json(
      {
        success: false,
        authenticated: null,
        error:
          error instanceof Error
            ? error.message
            : "Unable to validate admin session.",
      },
      { status: 503 }
    );
  }
}