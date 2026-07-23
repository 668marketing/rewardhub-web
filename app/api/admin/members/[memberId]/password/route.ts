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

type PasswordResetResult = {
  memberId: string;
  changed: boolean;
  updatedAt?: string;
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

    const newPassword =
      String(
        body?.newPassword || ""
      ).trim();

    const confirmPassword =
      String(
        body?.confirmPassword || ""
      ).trim();

    const reason =
      String(
        body?.reason || ""
      ).trim();

    if (!newPassword) {
      return NextResponse.json(
        {
          success: false,
          error:
            "New password is required.",
        },
        { status: 400 }
      );
    }

    if (
      newPassword.length < 6 ||
      newPassword.length > 50
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password must contain between 6 and 50 characters.",
        },
        { status: 400 }
      );
    }

    if (
      /\s/.test(newPassword)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password cannot contain spaces.",
        },
        { status: 400 }
      );
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password confirmation does not match.",
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
              "resetAdminMemberPassword",

            token,
            memberId:
              decodedMemberId,
            newPassword,
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
      BackendResponse<PasswordResetResult>;

    try {
      payload =
        JSON.parse(rawText);
    } catch {
      console.error(
        "Invalid member password backend response:",
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
            "Member password backend returned an empty response.",
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
        "Unable to reset member password.";

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
        ? clearAdminCookie(
            response
          )
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
            "Password reset result is missing.",
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
      "Member password reset route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to reset member password.",
      },
      { status: 500 }
    );
  }
}