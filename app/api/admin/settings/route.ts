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

function getRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto");

  const protocol =
    forwardedProtocol ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  if (host) return `${protocol}://${host}`;

  return request.nextUrl.origin;
}

function clearAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: "rewardhub_admin_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}

function getMetadata(request: NextRequest) {
  return {
    userAgent: request.headers.get("user-agent") || "",
    ipAddress:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "",
  };
}

async function callRewardHub<T>(
  request: NextRequest,
  payload: Record<string, unknown>
): Promise<T> {
  const origin = getRequestOrigin(request);

  const response = await fetch(`${origin}/api/rewardhub`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();

  let result: RewardHubResponse<T>;

  try {
    result = JSON.parse(rawText) as RewardHubResponse<T>;
  } catch {
    throw new Error("RewardHub backend returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.error ||
        result.message ||
        "RewardHub request failed."
    );
  }

  return (result.data ?? result.result) as T;
}

function errorResponse(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Unable to process system settings request.";

  const authError =
    /unauthorized|session|expired|inactive|authentication/i.test(
      message
    );

  const status = authError
    ? 401
    : /permission|forbidden/i.test(message)
      ? 403
      : 500;

  const response = NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
    }
  );

  return authError ? clearAdminCookie(response) : response;
}

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get("rewardhub_admin_session")?.value || "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const data = await callRewardHub(request, {
      action: "adminGetSystemSettings",
      token,
      ...getMetadata(request),
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin Settings GET error:", error);
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token =
      request.cookies.get("rewardhub_admin_session")?.value || "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const body = (await request.json()) as {
      settings?: unknown;
      reason?: unknown;
    };

    const data = await callRewardHub(request, {
      action: "adminUpdateSystemSettings",
      token,
      settings: Array.isArray(body.settings) ? body.settings : [],
      reason: typeof body.reason === "string" ? body.reason : "",
      ...getMetadata(request),
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin Settings POST error:", error);
    return errorResponse(error);
  }
}