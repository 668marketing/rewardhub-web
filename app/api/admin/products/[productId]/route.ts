import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RewardHubResponse<T = unknown> = {
  success?: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
};

type JsonObject = Record<string, unknown>;

function isJsonObject(
  value: unknown
): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function clearAdminCookie(
  response: NextResponse
) {
  response.cookies.set({
    name: "rewardhub_admin_session",
    value: "",
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}

function getClientIp(
  request: NextRequest
) {
  return (
    request.headers.get(
      "x-forwarded-for"
    ) ||
    request.headers.get(
      "x-real-ip"
    ) ||
    ""
  );
}

async function callBackend(
  request: NextRequest,
  productId: string,
  body: JsonObject
) {
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
          ...body,
          token,
          productId,
          userAgent:
            request.headers.get(
              "user-agent"
            ) || "",
          ipAddress:
            getClientIp(request),
        }),
      }
    );

  const rawText =
    await backendResponse.text();

  let payload:
    RewardHubResponse<unknown>;

  try {
    payload =
      JSON.parse(rawText);
  } catch {
    console.error(
      "Invalid admin product detail response:",
      rawText
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Product backend returned an invalid response.",
      },
      { status: 502 }
    );
  }

  if (
    !backendResponse.ok ||
    payload.success === false
  ) {
    const errorMessage =
      payload.error ||
      payload.message ||
      "Unable to process product request.";

    const isAuthError =
      /unauthorized|authentication|session|expired|inactive/i.test(
        errorMessage
      );

    const response =
      NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        {
          status: isAuthError
            ? 401
            : backendResponse.status >= 400
              ? backendResponse.status
              : 500,
        }
      );

    return isAuthError
      ? clearAdminCookie(response)
      : response;
  }

  const result =
    payload.data ??
    payload.result;

  if (result === undefined) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Product response data is missing.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result,
  });
}

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

/**
 * GET /api/admin/products/[productId]
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { productId } =
      await context.params;

    const normalizedProductId =
      decodeURIComponent(
        productId
      ).trim();

    if (!normalizedProductId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product ID is required.",
        },
        { status: 400 }
      );
    }

    return callBackend(
      request,
      normalizedProductId,
      {
        action:
          "getAdminProductDetail",
      }
    );
  } catch (error) {
    console.error(
      "Admin product detail GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load product detail.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/products/[productId]
 *
 * Supported body.action:
 * update
 * status
 * featured
 * sortOrder
 * deactivate
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { productId } =
      await context.params;

    const normalizedProductId =
      decodeURIComponent(
        productId
      ).trim();

    if (!normalizedProductId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product ID is required.",
        },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request body.",
        },
        { status: 400 }
      );
    }

    if (!isJsonObject(body)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product update payload must be a JSON object.",
        },
        { status: 400 }
      );
    }

    const action =
      String(
        body.action || "update"
      )
        .trim()
        .toLowerCase();

    const actionMap:
      Record<string, string> = {
        update:
          "updateAdminProduct",
        status:
          "updateAdminProductStatus",
        featured:
          "updateAdminProductFeatured",
        sortorder:
          "updateAdminProductSortOrder",
        deactivate:
          "deactivateAdminProduct",
      };

    const backendAction =
      actionMap[action];

    if (!backendAction) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported product action.",
        },
        { status: 400 }
      );
    }

    return callBackend(
      request,
      normalizedProductId,
      {
        ...body,
        action: backendAction,
      }
    );
  } catch (error) {
    console.error(
      "Admin product PATCH error:",
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

/**
 * DELETE /api/admin/products/[productId]
 *
 * Soft-delete only:
 * product becomes INACTIVE.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { productId } =
      await context.params;

    const normalizedProductId =
      decodeURIComponent(
        productId
      ).trim();

    if (!normalizedProductId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product ID is required.",
        },
        { status: 400 }
      );
    }

    let reason =
      "Deactivated by administrator.";

    try {
      const body =
        await request.json();

      if (
        isJsonObject(body) &&
        typeof body.reason ===
          "string" &&
        body.reason.trim()
      ) {
        reason =
          body.reason.trim();
      }
    } catch {
      // DELETE body is optional.
    }

    return callBackend(
      request,
      normalizedProductId,
      {
        action:
          "deactivateAdminProduct",
        reason,
      }
    );
  } catch (error) {
    console.error(
      "Admin product DELETE error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to deactivate product.",
      },
      { status: 500 }
    );
  }
}
