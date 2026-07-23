import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    name: "rewardhub_admin_session",
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

export async function GET(
  request: NextRequest
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

    const searchParams =
      request.nextUrl.searchParams;

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
              "getAdminMembers",
            token,

            search:
              searchParams.get(
                "search"
              ) || "",

            status:
              searchParams.get(
                "status"
              ) || "",

            tier:
              searchParams.get(
                "tier"
              ) || "",

            dateFrom:
              searchParams.get(
                "dateFrom"
              ) || "",

            dateTo:
              searchParams.get(
                "dateTo"
              ) || "",

            page:
              Number(
                searchParams.get(
                  "page"
                ) || 1
              ),

            limit:
              Number(
                searchParams.get(
                  "limit"
                ) || 25
              ),

            sortBy:
              searchParams.get(
                "sortBy"
              ) ||
              "CREATED_AT",

            sortDirection:
              searchParams.get(
                "sortDirection"
              ) || "DESC",

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
      BackendResponse<unknown>;

    try {
      payload =
        JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Member backend returned an invalid response.",
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
        "Unable to load members.";

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
                : 500,
          }
        );

      return unauthorized
        ? clearAdminCookie(response)
        : response;
    }

    return NextResponse.json({
      success: true,
      data:
        payload.data ||
        payload.result,
    });
  } catch (error) {
    console.error(
      "Admin members route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load members.",
      },
      { status: 500 }
    );
  }
}