import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const params =
      request.nextUrl.searchParams;

    const response =
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
              "getAdminTerminalApplications",
            token,
            search:
              params.get("search") ||
              "",
            status:
              params.get("status") ||
              "ALL",
            paymentStatus:
              params.get(
                "paymentStatus"
              ) || "ALL",
            applicationType:
              params.get(
                "applicationType"
              ) || "ALL",
            dateFrom:
              params.get("dateFrom") ||
              "",
            dateTo:
              params.get("dateTo") ||
              "",
            page:
              Number(
                params.get("page") ||
                  1
              ),
            pageSize:
              Number(
                params.get(
                  "pageSize"
                ) || 25
              ),
          }),
        }
      );

    const rawText =
      await response.text();

    let payload: Record<
      string,
      any
    >;

    try {
      payload =
        JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Terminal application backend returned an invalid response.",
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
            "Unable to load terminal applications.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data:
        payload.data ||
        payload.result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load terminal applications.",
      },
      { status: 500 }
    );
  }
}