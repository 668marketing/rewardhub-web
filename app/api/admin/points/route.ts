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
              "getAdminPoints",
            token,
            search:
              params.get("search") || "",
            tier:
              params.get("tier") || "ALL",
            status:
              params.get("status") || "ALL",
            balance:
              params.get("balance") || "ALL",
            sortBy:
              params.get("sortBy") || "CURRENT_DESC",
            page:
              Number(params.get("page") || 1),
            pageSize:
              Number(params.get("pageSize") || 25),
          }),
        }
      );

    const text =
      await backendResponse.text();

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
      !backendResponse.ok ||
      payload.success === false
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            payload.error ||
            payload.message ||
            "Unable to load points.",
        },
        {
          status:
            backendResponse.status === 401
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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load points.",
      },
      { status: 500 }
    );
  }
}
