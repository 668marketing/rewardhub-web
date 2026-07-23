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

type AdjustmentType =
  | "ADD"
  | "DEDUCT";

type RewardCreditsResult = {
  adjustmentId: string;
  memberId: string;
  adjustmentType: AdjustmentType;
  amount: number;
  signedAmount: number;
  previousBalance: number;
  newBalance: number;
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

    const amount =
      Number(body?.amount);

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
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Amount must be greater than RM0.",
        },
        { status: 400 }
      );
    }

    if (amount > 1000000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Adjustment amount exceeds the allowed limit.",
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
              "adjustAdminMemberRewardCredits",

            token,
            memberId:
              decodedMemberId,
            adjustmentType,
            amount,
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
      BackendResponse<RewardCreditsResult>;

    try {
      payload =
        JSON.parse(rawText);
    } catch {
      console.error(
        "Invalid Reward Credits backend response:",
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
            "Reward Credits backend returned an empty response.",
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
        "Unable to adjust Reward Credits.";

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
            "Reward Credits adjustment result is missing.",
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
      "Reward Credits adjustment route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to adjust Reward Credits.",
      },
      { status: 500 }
    );
  }
}