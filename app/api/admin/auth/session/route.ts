import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RewardHubApiResponse<T = unknown> = {
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
    name: "rewardhub_admin_session",
    value: "",
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
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
    const token = request.cookies.get(
      "rewardhub_admin_session"
    )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "No admin session.",
        },
        { status: 401 }
      );
    }

    const rewardHubUrl = new URL(
      "/api/rewardhub",
      request.nextUrl.origin
    );

    const apiResponse = await fetch(rewardHubUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
  action: "validateAdminSession",
  token,
  userAgent:
    request.headers.get("user-agent") || "",
  ipAddress:
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "",
}),
    });

    const payload =
      (await apiResponse.json()) as RewardHubApiResponse<AdminSessionResult>;

    const result =
      payload.data || payload.result;

    if (
      !apiResponse.ok ||
      payload.success === false ||
      !result?.valid ||
      !result.admin
    ) {
      const response = NextResponse.json(
        {
          success: false,
          authenticated: false,
          error:
            result?.reason ||
            payload.error ||
            payload.message ||
            "Admin session is invalid.",
        },
        { status: 401 }
      );

      return clearAdminCookie(response);
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      admin: result.admin,
      permissions: result.permissions || [],
      expiresAt: result.expiresAt || "",
    });
  } catch (error) {
    console.error(
      "Admin session validation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to validate session.",
      },
      { status: 500 }
    );
  }
}