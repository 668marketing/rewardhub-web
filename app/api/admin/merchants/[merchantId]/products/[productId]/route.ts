import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    merchantId: string;
    productId: string;
  }>;
};

type AdminProductAction =
  | "status"
  | "featured"
  | "sortOrder"
  | "deactivate";

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

function resolveBackendAction(
  action: AdminProductAction
) {
  if (action === "status") {
    return "updateAdminProductStatus";
  }

  if (action === "featured") {
    return "updateAdminProductFeatured";
  }

  if (action === "sortOrder") {
    return "updateAdminProductSortOrder";
  }

  return "deactivateAdminProduct";
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
      productId,
    } = await context.params;

    const decodedMerchantId =
      decodeURIComponent(
        merchantId || ""
      ).trim();

    const decodedProductId =
      decodeURIComponent(
        productId || ""
      ).trim();

    if (!decodedMerchantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Merchant ID is required.",
        },
        { status: 400 }
      );
    }

    if (!decodedProductId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const body =
      (await request.json()) as {
        action?: AdminProductAction;
        status?:
          | "ACTIVE"
          | "DRAFT"
          | "INACTIVE";
        isFeatured?: boolean;
        sortOrder?: number;
        reason?: string;
      };

    const action =
      body.action;

    if (
      action !== "status" &&
      action !== "featured" &&
      action !== "sortOrder" &&
      action !== "deactivate"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid admin product action.",
        },
        { status: 400 }
      );
    }

    const backendPayload: Record<
      string,
      unknown
    > = {
      action:
        resolveBackendAction(
          action
        ),
      token,
      merchantId:
        decodedMerchantId,
      productId:
        decodedProductId,
    };

    if (action === "status") {
      backendPayload.status =
        body.status;
    }

    if (action === "featured") {
      backendPayload.isFeatured =
        Boolean(
          body.isFeatured
        );
    }

    if (action === "sortOrder") {
      backendPayload.sortOrder =
        Number(
          body.sortOrder || 0
        );
    }

    if (action === "deactivate") {
      backendPayload.reason =
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
              backendPayload
            ),
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
        "Invalid admin product backend response:",
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
            "Admin product backend returned an invalid response.",
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
        "Unable to update product.";

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

    return NextResponse.json({
      success: true,
      data:
        payload.data ||
        payload.result ||
        payload,
    });
  } catch (error) {
    console.error(
      "Admin product action route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update product.",
      },
      { status: 500 }
    );
  }
}