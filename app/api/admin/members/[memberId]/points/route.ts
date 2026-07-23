import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    memberId: string;
  }>;
};

type AdjustmentType =
  | "ADD"
  | "DEDUCT";

type PointsAdjustmentResult = {
  adjustmentId: string;
  memberId: string;
  adjustmentType: AdjustmentType;
  points: number;
  signedPoints: number;
  previousBalance: number;
  newBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  changed: boolean;
  updatedAt: string;
  message: string;
};

type BackendResponse<T> = {
  success?: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
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

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
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

    const decodedMemberId =
      decodeURIComponent(
        memberId || ""
      );

    if (!decodedMemberId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Member ID is required.",
        },
        { status: 400 }
      );
    }

    const body =
      await request.json();

    const adjustmentType =
      String(
        body?.adjustmentType || ""
      )
        .trim()
        .toUpperCase() as
        AdjustmentType;

    const points =
      Number(body?.points);

    const reason =
      String(
        body?.reason || ""
      ).trim();

    if (
      adjustmentType !== "ADD" &&
      adjustmentType !== "DEDUCT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Adjustment type must be ADD or DEDUCT.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(points) ||
      points <= 0 ||
      !Number.isInteger(points)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Points must be a whole number greater than 0.",
        },
        { status: 400 }
      );
    }

    if (points > 100000000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Points adjustment exceeds the allowed limit.",
        },
        { status: 400 }
      );
    }

    if (reason.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a reason of at least 5 characters.",
        },
        { status: 400 }
      );
    }

    const backendResponse =
      await fetch(
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
          body: JSON.stringify({
            action:
              "adjustAdminMemberPoints",

            token,
            memberId:
              decodedMemberId,
            adjustmentType,
            points,
            reason,

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
      await backendResponse.text();

    let payload:
      BackendResponse<PointsAdjustmentResult>;

    try {
      payload =
        JSON.parse(rawText);
    } catch {
      console.error(
        "Invalid member points backend response:",
        rawText
      );

      const preview =
        rawText
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 500);

      return NextResponse.json(
        {
          success: false,
          error:
            preview ||
            "Member points backend returned an empty response.",
        },
        { status: 502 }
      );
    }

    if (
      !backendResponse.ok ||
      payload.success === false
    ) {
      const message =
        payload.error ||
        payload.message ||
        "Unable to adjust member points.";

      const unauthorized =
        /session|unauthorized|expired|inactive/i.test(
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
              unauthorized
                ? 401
                : 400,
          }
        );

      return unauthorized
        ? clearAdminCookie(response)
        : response;
    }

    const result =
      payload.data ||
      payload.result;

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Points adjustment result is missing.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Member points adjustment route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to adjust member points.",
      },
      { status: 500 }
    );
  }
}