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
    request.headers.get(
      "host"
    );

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

function getMetadata(
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
      `${getOrigin(
        request
      )}/api/rewardhub`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(
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
      : "Unable to process Admin Users request.";

  const authError =
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
          authError
            ? 401
            : 500,
      }
    );

  return authError
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

    const mode =
      request.nextUrl.searchParams.get(
        "mode"
      ) || "";

    const adminId =
      request.nextUrl.searchParams.get(
        "adminId"
      ) || "";

    const action =
      mode ===
      "permissionCatalog"
        ? "getAdminUserPermissionCatalog"
        : adminId
          ? "getAdminUserDetail"
          : "getAdminUsers";

    const data =
      await callRewardHub(
        request,
        {
          action,
          token,
          adminId,
          search:
            request.nextUrl.searchParams.get(
              "search"
            ) || "",
          role:
            request.nextUrl.searchParams.get(
              "role"
            ) || "",
          status:
            request.nextUrl.searchParams.get(
              "status"
            ) || "",
          page: Number(
            request.nextUrl.searchParams.get(
              "page"
            ) || 1
          ),
          limit: Number(
            request.nextUrl.searchParams.get(
              "limit"
            ) || 100
          ),
          ...getMetadata(
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
      "Admin Users GET error:",
      error
    );

    return errorResponse(
      error
    );
  }
}

export async function POST(
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

    const body =
      (await request.json()) as Record<
        string,
        unknown
      >;

    const actionMap:
      Record<string, string> = {
        create:
          "createAdminUser",
        update:
          "updateAdminUser",
        status:
          "updateAdminUserStatus",
        resetPassword:
          "resetAdminUserPassword",
        revokeSessions:
          "revokeAdminUserSessions",
        updatePermissions:
          "updateAdminUserPermissions",
        resetPermissions:
          "resetAdminUserPermissions",
      };

    const action =
      actionMap[
        String(
          body.operation || ""
        )
      ];

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Admin Users operation.",
        },
        {
          status: 400,
        }
      );
    }

    const data =
      await callRewardHub(
        request,
        {
          ...body,
          action,
          token,
          ...getMetadata(
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
      "Admin Users POST error:",
      error
    );

    return errorResponse(
      error
    );
  }
}