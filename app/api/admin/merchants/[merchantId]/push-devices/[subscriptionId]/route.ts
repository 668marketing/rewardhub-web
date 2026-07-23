import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    merchantId: string;
    subscriptionId: string;
  }>;
};

type PushDeviceAction =
  | "status"
  | "remove";

type BackendPayload = {
  success?: boolean;
  data?: unknown;
  result?: unknown;
  error?: string;
  message?: string;
};

function resolveAction(
  action: PushDeviceAction
) {
  if (action === "status") {
    return "updateAdminMerchantPushDeviceStatus";
  }

  return "removeAdminMerchantPushDevice";
}

export async function PATCH(
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

    const {
      merchantId,
      subscriptionId,
    } = await context.params;

    const cleanMerchantId =
      decodeURIComponent(
        merchantId || ""
      ).trim();

    const cleanSubscriptionId =
      decodeURIComponent(
        subscriptionId || ""
      ).trim();

    if (
      !cleanMerchantId ||
      !cleanSubscriptionId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Merchant ID and Subscription ID are required.",
        },
        { status: 400 }
      );
    }

    const body =
      (await request.json()) as {
        action?: PushDeviceAction;
        status?:
          | "ACTIVE"
          | "INACTIVE";
        reason?: string;
      };

    const action =
      body.action;

    if (
      action !== "status" &&
      action !== "remove"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid push device action.",
        },
        { status: 400 }
      );
    }

    const payload: Record<
      string,
      unknown
    > = {
      action:
        resolveAction(
          action
        ),
      token,
      merchantId:
        cleanMerchantId,
      subscriptionId:
        cleanSubscriptionId,
    };

    if (action === "status") {
      payload.status =
        body.status;
    }

    if (action === "remove") {
      payload.reason =
        String(
          body.reason || ""
        ).trim();
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
          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const rawText =
      await backendResponse.text();

    let result:
      BackendPayload;

    try {
      result =
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
            "Push device backend returned an invalid response.",
        },
        { status: 502 }
      );
    }

    if (
      !backendResponse.ok ||
      result.success === false
    ) {
      const message =
        result.error ||
        result.message ||
        "Unable to update push device.";

      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data:
        result.data ||
        result.result ||
        result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update push device.",
      },
      { status: 500 }
    );
  }
}