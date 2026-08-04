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

async function callRewardHub<T>(
  request: NextRequest,
  body: JsonObject
) {
  const token =
    request.cookies.get(
      "rewardhub_admin_session"
    )?.value;

  if (!token) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error:
            "Admin authentication required.",
        },
        { status: 401 }
      ),
      data: null as T | null,
    };
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
    RewardHubResponse<T>;

  try {
    payload =
      JSON.parse(rawText) as RewardHubResponse<T>;
  } catch {
    console.error(
      "Invalid admin products backend response:",
      rawText
    );

    return {
      response: NextResponse.json(
        {
          success: false,
          error:
            "Products backend returned an invalid response.",
        },
        { status: 502 }
      ),
      data: null as T | null,
    };
  }

  if (
    !backendResponse.ok ||
    payload.success === false
  ) {
    const errorMessage =
      payload.error ||
      payload.message ||
      "Unable to process products request.";

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

    return {
      response: isAuthError
        ? clearAdminCookie(response)
        : response,
      data: null as T | null,
    };
  }

  const result =
    payload.data ??
    payload.result;

  if (result === undefined) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error:
            "Products response data is missing.",
        },
        { status: 502 }
      ),
      data: null as T | null,
    };
  }

  return {
    response: null,
    data: result,
  };
}

/**
 * GET /api/admin/products
 *
 * Query:
 * search
 * merchantId
 * category
 * productType
 * status
 * featured
 * stock
 * sortBy
 * sortDirection
 * page
 * limit
 */
export async function GET(
  request: NextRequest
) {
  try {
    const params =
      request.nextUrl.searchParams;

    const backend =
      await callRewardHub<unknown>(
        request,
        {
          action:
            "getAdminProducts",
          search:
            params.get("search") || "",
          merchantId:
            params.get(
              "merchantId"
            ) || "",
          category:
            params.get(
              "category"
            ) || "",
          productType:
            params.get(
              "productType"
            ) || "ALL",
          status:
            params.get("status") ||
            "ALL",
          featured:
            params.get(
              "featured"
            ) || "ALL",
          stock:
            params.get("stock") ||
            "ALL",
          sortBy:
            params.get("sortBy") ||
            "UPDATED_AT",
          sortDirection:
            params.get(
              "sortDirection"
            ) || "DESC",
          page:
            Number(
              params.get("page") ||
              1
            ),
          limit:
            Number(
              params.get("limit") ||
              25
            ),
        }
      );

    if (backend.response) {
      return backend.response;
    }

    return NextResponse.json({
      success: true,
      data: backend.data,
    });
  } catch (error) {
    console.error(
      "Admin products GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load products.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 *
 * Creates a product for a selected merchant.
 */
export async function POST(
  request: NextRequest
) {
  try {
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
            "Product payload must be a JSON object.",
        },
        { status: 400 }
      );
    }

    const merchantId =
      String(
        body.merchantId || ""
      ).trim();

    const productName =
      String(
        body.productName || ""
      ).trim();

    if (!merchantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Merchant ID is required.",
        },
        { status: 400 }
      );
    }

    if (!productName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product name is required.",
        },
        { status: 400 }
      );
    }

    const backend =
      await callRewardHub<unknown>(
        request,
        {
          action:
            "createAdminProduct",
          ...body,
          merchantId,
          productName,
        }
      );

    if (backend.response) {
      return backend.response;
    }

    return NextResponse.json(
      {
        success: true,
        data: backend.data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Admin products POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create product.",
      },
      { status: 500 }
    );
  }
}
