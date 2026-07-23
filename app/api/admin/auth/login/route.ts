import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminLoginResult = {
  token: string;
  sessionId: string;
  expiresAt: string;
  admin: {
    adminId: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    lastLoginAt?: string;
  };
  permissions: string[];
};

type ApiPayload = {
  success?: boolean;
  data?: AdminLoginResult;
  result?: AdminLoginResult;
  error?: string;
  message?: string;
};

function getRequestOrigin(request: NextRequest): string {
  const forwardedHost =
    request.headers.get("x-forwarded-host");

  const host =
    forwardedHost ||
    request.headers.get("host");

  const forwardedProtocol =
    request.headers.get("x-forwarded-proto");

  const protocol =
    forwardedProtocol ||
    (process.env.NODE_ENV === "production"
      ? "https"
      : "http");

  if (host) {
    return `${protocol}://${host}`;
  }

  return request.nextUrl.origin;
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const email = String(
      body?.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      body?.password || ""
    );

    const rememberMe =
      body?.rememberMe === true;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required.",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: "Password is required.",
        },
        { status: 400 }
      );
    }

    const origin =
      getRequestOrigin(request);

    const apiResponse = await fetch(
      `${origin}/api/rewardhub`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
  action: "adminLogin",
  email,
  password,
  rememberMe,
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

    let payload: ApiPayload;

    try {
      payload = JSON.parse(rawText);
    } catch {
      console.error(
        "Invalid RewardHub API response:",
        rawText
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "RewardHub backend returned an invalid response.",
        },
        { status: 502 }
      );
    }

    if (
      !apiResponse.ok ||
      payload.success === false
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            payload.error ||
            payload.message ||
            "Invalid email or password.",
        },
        {
          status:
            apiResponse.status >= 400
              ? apiResponse.status
              : 401,
        }
      );
    }

    const result =
      payload.data ||
      payload.result;

    if (
      !result?.token ||
      !result?.admin
    ) {
      console.error(
        "Unexpected admin login payload:",
        payload
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Admin login returned an invalid response.",
        },
        { status: 502 }
      );
    }

    const expiresAt =
      new Date(result.expiresAt);

    if (
      Number.isNaN(
        expiresAt.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin session expiry is invalid.",
        },
        { status: 502 }
      );
    }

    const response =
      NextResponse.json({
        success: true,
        admin: result.admin,
        permissions:
          result.permissions || [],
        expiresAt:
          result.expiresAt,
      });

    response.cookies.set({
      name:
        "rewardhub_admin_session",
      value: result.token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error(
      "Admin login route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to sign in.",
      },
      { status: 500 }
    );
  }
}