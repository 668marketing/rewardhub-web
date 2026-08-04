import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    memberId: string;
  }>;
};

async function proxy(
  request: NextRequest,
  body: Record<string, unknown>
) {
  return fetch(
    new URL(
      "/api/rewardhub",
      request.nextUrl.origin
    ),
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(body),
    }
  );
}

async function handle(
  response: Response
) {
  const text =
    await response.text();

  let payload: any;

  try {
    payload =
      JSON.parse(text);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error:
          text.replace(/\s+/g, " ").trim().slice(0, 500) ||
          "Points backend returned an invalid response.",
      },
      { status: 502 }
    );
  }

  if (
    !response.ok ||
    payload.success === false
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          payload.error ||
          payload.message ||
          "Points request failed.",
      },
      {
        status:
          response.status === 401
            ? 401
            : 400,
      }
    );
  }

  return NextResponse.json({
    success: true,
    data:
      payload.data ||
      payload.result,
  });
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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

  const { memberId } =
    await context.params;

  return handle(
    await proxy(
      request,
      {
        action:
          "getAdminMemberPointsDetail",
        token,
        memberId:
          decodeURIComponent(memberId),
        historyLimit: 100,
      }
    )
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
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

  const { memberId } =
    await context.params;

  const body =
    await request.json();

  return handle(
    await proxy(
      request,
      {
        action:
          "adjustAdminMemberPoints",
        token,
        memberId:
          decodeURIComponent(memberId),
        adjustmentType:
          body.adjustmentType,
        amount:
          Number(body.amount),
        reason:
          String(body.reason || ""),
        userAgent:
          request.headers.get("user-agent") || "",
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "",
      }
    )
  );
}
