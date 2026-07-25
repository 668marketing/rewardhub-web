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

type AdminRewardsGetAction =
  | "getAdminRewardsDashboard"
  | "getAdminRewardRedemptions"
  | "getAdminRewards"
  | "getAdminRewardDetail";

type AdminRewardsPostAction =
  | "createAdminReward"
  | "uploadAdminRewardImage"
  | "updateAdminReward";

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
 * Read Backend Response
 * ============================================================
 */

async function parseBackendResponse<T>(
  backendResponse: Response,
  fallbackMessage: string
) {
  const rawText =
    await backendResponse.text();

  let payload:
    BackendResponse<T>;

  try {
    payload =
      JSON.parse(
        rawText
      ) as BackendResponse<T>;
  } catch {
    console.error(
      "Invalid admin rewards backend response:",
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

  if (
    !backendResponse.ok ||
    payload.success === false
  ) {
    const message =
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

  const result =
    payload.data ??
    payload.result;

  if (
    result === undefined ||
    result === null
  ) {
    return {
      ok: false as const,

      status: 502,

      error:
        "Rewards data is missing.",

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
 * GET
 *
 * Modes:
 * - dashboard
 * - redemptions
 * - list
 * - detail
 * ============================================================
 */

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
        {
          status: 401,
        }
      );
    }

    const searchParams =
      request.nextUrl.searchParams;

    const mode =
      String(
        searchParams.get(
          "mode"
        ) || "dashboard"
      )
        .trim()
        .toLowerCase();

    let action:
      AdminRewardsGetAction;

    if (
      mode ===
      "redemptions"
    ) {
      action =
        "getAdminRewardRedemptions";
    } else if (
      mode === "list"
    ) {
      action =
        "getAdminRewards";
    } else if (
      mode === "detail"
    ) {
      action =
        "getAdminRewardDetail";
    } else {
      action =
        "getAdminRewardsDashboard";
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
              action,

              token,

              rewardId:
                searchParams.get(
                  "rewardId"
                ) || "",

              search:
                searchParams.get(
                  "search"
                ) || "",

              status:
                searchParams.get(
                  "status"
                ) || "ALL",

              category:
                searchParams.get(
                  "category"
                ) || "ALL",

              rewardType:
                searchParams.get(
                  "rewardType"
                ) || "ALL",

              deliveryMethod:
                searchParams.get(
                  "deliveryMethod"
                ) || "ALL",

              dateFrom:
                searchParams.get(
                  "dateFrom"
                ) || "",

              dateTo:
                searchParams.get(
                  "dateTo"
                ) || "",

              page:
                Number(
                  searchParams.get(
                    "page"
                  ) || 1
                ),

              pageSize:
                Number(
                  searchParams.get(
                    "pageSize"
                  ) || 25
                ),
            }),
        }
      );

    let fallbackMessage =
      "Unable to load rewards dashboard.";

    if (
      mode ===
      "redemptions"
    ) {
      fallbackMessage =
        "Unable to load reward redemptions.";
    } else if (
      mode === "list"
    ) {
      fallbackMessage =
        "Unable to load rewards.";
    } else if (
      mode === "detail"
    ) {
      fallbackMessage =
        "Unable to load reward details.";
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
      "Admin rewards GET route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to load rewards.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
 * POST
 *
 * Modes:
 * - create
 * - uploadImage
 * - update
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

    const mode =
      String(
        body.mode || ""
      )
        .trim()
        .toLowerCase();

    let action:
      AdminRewardsPostAction;

    if (
      mode === "create"
    ) {
      action =
        "createAdminReward";
    } else if (
      mode ===
      "uploadimage"
    ) {
      action =
        "uploadAdminRewardImage";
    } else if (
      mode === "update"
    ) {
      action =
        "updateAdminReward";
    } else {
      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid rewards request mode.",
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
      "Unable to process reward request.";

    if (
      mode ===
      "uploadimage"
    ) {
      fallbackMessage =
        "Unable to upload reward image.";
    } else if (
      mode === "create"
    ) {
      fallbackMessage =
        "Unable to create reward.";
    } else if (
      mode === "update"
    ) {
      fallbackMessage =
        "Unable to update reward.";
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
      "Admin rewards POST route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to process reward request.",
      },
      {
        status: 500,
      }
    );
  }
}