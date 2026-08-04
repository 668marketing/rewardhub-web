import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

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
              "getAdminSettlements",

            token,

            search:
              searchParams.get(
                "search"
              ) || "",

            status:
              searchParams.get(
                "status"
              ) || "ALL",

            month:
              searchParams.get(
                "month"
              ) || "",

            dateFrom:
              searchParams.get(
                "dateFrom"
              ) || "",

            dateTo:
              searchParams.get(
                "dateTo"
              ) || "",

            page: Number(
              searchParams.get(
                "page"
              ) || 1
            ),

            pageSize: Number(
              searchParams.get(
                "pageSize"
              ) || 25
            ),
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
      console.error(
        "Invalid admin settlements backend response:",
        rawText
      );

      return NextResponse.json(
        {
          success: false,
          error:
            rawText
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 500) ||
            "Settlement backend returned an empty response.",
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
        "Unable to load settlements.";

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
            "Settlement data is missing.",
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
      "Admin settlements route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load settlements.",
      },
      { status: 500 }
    );
  }
}
