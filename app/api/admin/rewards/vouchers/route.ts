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

/* ============================================================
 * Clear Admin Cookie
 * ============================================================
 */

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

/* ============================================================
 * Unwrap Nested RewardHub Response
 *
 * Supports:
 *
 * {
 *   success: true,
 *   data: actualData
 * }
 *
 * and:
 *
 * {
 *   success: true,
 *   data: {
 *     success: true,
 *     data: actualData
 *   }
 * }
 * ============================================================
 */

function unwrapBackendData(
  value: unknown
): unknown {
  let current =
    value;

  /*
   * Maximum 5 levels prevents an
   * accidental infinite nested object.
   */
  for (
    let level = 0;
    level < 5;
    level++
  ) {
    if (
      !current ||
      typeof current !==
        "object" ||
      Array.isArray(current)
    ) {
      break;
    }

    const objectValue =
      current as {
        success?: unknown;
        data?: unknown;
        result?: unknown;
      };

    if (
      objectValue.data !==
        undefined &&
      objectValue.data !== null
    ) {
      current =
        objectValue.data;

      continue;
    }

    if (
      objectValue.result !==
        undefined &&
      objectValue.result !== null
    ) {
      current =
        objectValue.result;

      continue;
    }

    break;
  }

  return current;
}

/* ============================================================
 * Find Backend Error
 *
 * Checks outer and nested response levels.
 * ============================================================
 */

function getBackendError(
  payload: unknown,
  fallbackMessage: string
) {
  let current =
    payload;

  for (
    let level = 0;
    level < 5;
    level++
  ) {
    if (
      !current ||
      typeof current !==
        "object" ||
      Array.isArray(current)
    ) {
      break;
    }

    const objectValue =
      current as {
        success?: boolean;
        error?: unknown;
        message?: unknown;
        data?: unknown;
        result?: unknown;
      };

    if (
      objectValue.success === false
    ) {
      return String(
        objectValue.error ||
        objectValue.message ||
        fallbackMessage
      );
    }

    if (
      objectValue.error
    ) {
      return String(
        objectValue.error
      );
    }

    if (
      objectValue.data !==
        undefined &&
      objectValue.data !== null
    ) {
      current =
        objectValue.data;

      continue;
    }

    if (
      objectValue.result !==
        undefined &&
      objectValue.result !== null
    ) {
      current =
        objectValue.result;

      continue;
    }

    break;
  }

  return "";
}

/* ============================================================
 * Parse Backend Response
 * ============================================================
 */

async function parseBackendResponse<T>(
  backendResponse: Response,
  fallbackMessage: string
) {
  const rawText =
    await backendResponse.text();

  let payload:
    BackendResponse<unknown>;

  try {
    payload =
      JSON.parse(
        rawText
      ) as BackendResponse<unknown>;
  } catch {
    console.error(
      "Invalid voucher backend response:",
      rawText
    );

    const preview =
      rawText
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500);

    return {
      ok: false as const,

      status: 502,

      error:
        preview ||
        fallbackMessage,

      unauthorized: false,
    };
  }

  const nestedError =
    getBackendError(
      payload,
      fallbackMessage
    );

  if (
    !backendResponse.ok ||
    payload.success === false ||
    nestedError
  ) {
    const message =
      nestedError ||
      payload.error ||
      payload.message ||
      fallbackMessage;

    const unauthorized =
      /session|unauthorized|expired|inactive/i.test(
        message
      );

    return {
      ok: false as const,

      status:
        unauthorized
          ? 401
          : 400,

      error:
        message,

      unauthorized,
    };
  }

  const firstPayload =
    payload.data ??
    payload.result;

  const result =
    unwrapBackendData(
      firstPayload
    ) as T;

  if (
    result === undefined ||
    result === null
  ) {
    return {
      ok: false as const,

      status: 502,

      error:
        "Voucher data is missing.",

      unauthorized: false,
    };
  }

  return {
    ok: true as const,

    data:
      result,
  };
}

/* ============================================================
 * POST
 *
 * Supported actions:
 * - getAdminRewardVouchers
 * - getAdminRewardVoucherDetail
 * - createAdminRewardVouchers
 * - generateAdminRewardVoucherCodes
 * - updateAdminRewardVoucherStatus
 * ============================================================
 */

export async function POST(
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
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as Record<
        string,
        unknown
      >;

    const action =
      String(
        body.action || ""
      ).trim();

    const allowedActions = [
      "getAdminRewardVouchers",
      "getAdminRewardVoucherDetail",
      "createAdminRewardVouchers",
      "generateAdminRewardVoucherCodes",
      "updateAdminRewardVoucherStatus",
    ];

    if (
      !allowedActions.includes(
        action
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid voucher request action.",
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

          body:
            JSON.stringify({
              ...body,

              action,

              token,
            }),
        }
      );

    let fallbackMessage =
      "Unable to process voucher request.";

    if (
      action ===
      "getAdminRewardVouchers"
    ) {
      fallbackMessage =
        "Unable to load voucher codes.";
    } else if (
      action ===
      "getAdminRewardVoucherDetail"
    ) {
      fallbackMessage =
        "Unable to load voucher details.";
    } else if (
      action ===
      "createAdminRewardVouchers"
    ) {
      fallbackMessage =
        "Unable to import voucher codes.";
    } else if (
      action ===
      "generateAdminRewardVoucherCodes"
    ) {
      fallbackMessage =
        "Unable to generate voucher codes.";
    } else if (
      action ===
      "updateAdminRewardVoucherStatus"
    ) {
      fallbackMessage =
        "Unable to update voucher status.";
    }

    const parsed =
      await parseBackendResponse<
        unknown
      >(
        backendResponse,
        fallbackMessage
      );

    if (!parsed.ok) {
      const response =
        NextResponse.json(
          {
            success: false,

            error:
              parsed.error,
          },
          {
            status:
              parsed.status,
          }
        );

      return parsed.unauthorized
        ? clearAdminCookie(
            response
          )
        : response;
    }

    return NextResponse.json({
      success: true,

      data:
        parsed.data,
    });
  } catch (error) {
    console.error(
      "Admin reward vouchers POST route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to process voucher request.",
      },
      {
        status: 500,
      }
    );
  }
}