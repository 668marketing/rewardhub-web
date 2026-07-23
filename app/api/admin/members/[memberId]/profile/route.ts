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

type ProfileInput = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  reason: string;
};

type ProfileUpdateResult = {
  memberId: string;
  changed: boolean;
  changedFields: string[];
  profile: Omit<
    ProfileInput,
    "reason"
  >;
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
      (await request.json()) as
        Partial<ProfileInput>;

    const input: ProfileInput = {
      fullName:
        String(
          body.fullName || ""
        ).trim(),

      email:
        String(
          body.email || ""
        )
          .trim()
          .toLowerCase(),

      phone:
        String(
          body.phone || ""
        ).trim(),

      dateOfBirth:
        String(
          body.dateOfBirth || ""
        ).trim(),

      gender:
        String(
          body.gender || ""
        )
          .trim()
          .toUpperCase(),

      addressLine1:
        String(
          body.addressLine1 || ""
        ).trim(),

      addressLine2:
        String(
          body.addressLine2 || ""
        ).trim(),

      city:
        String(
          body.city || ""
        ).trim(),

      state:
        String(
          body.state || ""
        ).trim(),

      postcode:
        String(
          body.postcode || ""
        ).trim(),

      country:
        String(
          body.country || ""
        ).trim(),

      reason:
        String(
          body.reason || ""
        ).trim(),
    };

    if (
      input.fullName.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Full name must contain at least 2 characters.",
        },
        { status: 400 }
      );
    }

    if (
      input.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        input.email
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (
      input.phone &&
      input.phone.replace(
        /\D/g,
        ""
      ).length < 8
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Phone number must contain at least 8 digits.",
        },
        { status: 400 }
      );
    }

    if (
      input.reason.length < 5
    ) {
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
              "updateAdminMemberProfile",

            token,
            memberId:
              decodedMemberId,
            ...input,

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
      BackendResponse<ProfileUpdateResult>;

    try {
      payload =
        JSON.parse(rawText);
    } catch {
      console.error(
        "Invalid member profile backend response:",
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
            "Member profile backend returned an empty response.",
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
        "Unable to update member profile.";

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
            "Member profile result is missing.",
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
      "Member profile route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update member profile.",
      },
      { status: 500 }
    );
  }
}