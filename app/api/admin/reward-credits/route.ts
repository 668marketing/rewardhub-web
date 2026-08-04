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
              "getAdminRewardCredits",
            token,

            search:
              params.get(
                "search"
              ) || "",

            tier:
              params.get(
                "tier"
              ) || "ALL",

            status:
              params.get(
                "status"
              ) || "ALL",

            balance:
              params.get(
                "balance"
              ) || "ALL",

            sortBy:
              params.get(
                "sortBy"
              ) ||
              "AVAILABLE_DESC",

            page:
              Number(
                params.get(
                  "page"
                ) || 1
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

    return handleBackendResponse(
      backendResponse
    );
  } catch (error) {
    console.error(
      "Admin Reward Credits route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Reward Credits.",
      },
      { status: 500 }
    );
  }
}

async function handleBackendResponse(
  backendResponse: Response
) {
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
          rawText
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 500) ||
          "Reward Credits backend returned an invalid response.",
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
      "Unable to load Reward Credits.";

    /*
     * Do not clear the admin cookie for ordinary
     * Apps Script, network or data errors.
     * The central session route handles explicit
     * authentication failures.
     */
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status:
          backendResponse.status === 401
            ? 401
            : 400,
      }
    );
  }

  const result =
    payload.data ||
    payload.result;

  if (!result) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Reward Credits data is missing.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result,
  });
}
