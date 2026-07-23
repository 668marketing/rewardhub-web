import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    merchantId: string;
    settlementId: string;
  }>;
};

type RejectRequestBody = {
  reason?: string;
};

type BackendResponse = {
  success?: boolean;
  data?: unknown;
  result?: unknown;
  error?: string;
  message?: string;
};

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
        {
          status: 401,
        }
      );
    }

    const {
      merchantId,
      settlementId,
    } =
      await context.params;

    const decodedMerchantId =
      decodeURIComponent(
        merchantId || ""
      ).trim();

    const decodedSettlementId =
      decodeURIComponent(
        settlementId || ""
      ).trim();

    let body:
      RejectRequestBody;

    try {
      body =
        (await request.json()) as RejectRequestBody;
    } catch {
      body = {};
    }

    const reason =
      String(
        body.reason || ""
      ).trim();

    if (
      !decodedMerchantId ||
      !decodedSettlementId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Merchant ID and Settlement ID are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Rejection reason is required.",
        },
        {
          status: 400,
        }
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
              "rejectAdminMerchantSettlement",

            token,

            merchantId:
              decodedMerchantId,

            settlementId:
              decodedSettlementId,

            reason,
          }),
        }
      );

    const rawText =
      await backendResponse.text();

    let payload:
      BackendResponse;

    try {
      payload =
        JSON.parse(rawText) as BackendResponse;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            rawText ||
            "Invalid backend response.",
        },
        {
          status: 502,
        }
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
            "Unable to reject settlement.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,

      data:
        payload.data ||
        payload.result ||
        null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to reject settlement.",
      },
      {
        status: 500,
      }
    );
  }
}