import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    merchantId: string;
  }>;
};

type MarketingRequestBody = {
  normalBudget: number;

  boostEnabled: boolean;
  boostBudget: number;
  boostStart: string;
  boostEnd: string;

  acceptRewardCredits: boolean;
  redemptionLimit: number;
};

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

    const { merchantId } =
      await context.params;

    const decodedMerchantId =
      decodeURIComponent(
        merchantId || ""
      ).trim();

    if (!decodedMerchantId) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Merchant ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    let body:
      MarketingRequestBody;

    try {
      body =
        (await request.json()) as MarketingRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const normalBudget =
      Number(body.normalBudget);

    const boostEnabled =
      Boolean(
        body.boostEnabled
      );

    const boostBudget =
      Number(
        body.boostBudget || 0
      );

    const acceptRewardCredits =
      Boolean(
        body.acceptRewardCredits
      );

    const redemptionLimit =
      Number(
        body.redemptionLimit || 0
      );

    if (
      !Number.isFinite(
        normalBudget
      ) ||
      normalBudget < 5 ||
      normalBudget > 100
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Normal Marketing Budget must be between 5% and 100%.",
        },
        {
          status: 400,
        }
      );
    }

    if (boostEnabled) {
      if (
        !Number.isFinite(
          boostBudget
        ) ||
        boostBudget < 5 ||
        boostBudget > 100
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              "Boost Budget must be between 5% and 100%.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        boostBudget <
        normalBudget
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              "Boost Budget cannot be lower than Normal Budget.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !body.boostStart ||
        !body.boostEnd
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              "Boost start and end dates are required.",
          },
          {
            status: 400,
          }
        );
      }

      const boostStart =
        new Date(
          body.boostStart
        );

      const boostEnd =
        new Date(
          body.boostEnd
        );

      if (
        Number.isNaN(
          boostStart.getTime()
        ) ||
        Number.isNaN(
          boostEnd.getTime()
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              "Invalid Boost Period.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        boostEnd.getTime() <=
        boostStart.getTime()
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              "Boost end date must be later than Boost start date.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      !Number.isFinite(
        redemptionLimit
      ) ||
      redemptionLimit < 0 ||
      redemptionLimit > 100
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Redemption Limit must be between 0% and 100%.",
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
              "updateAdminMerchantMarketingSettings",

            token,

            merchantId:
              decodedMerchantId,

            normalBudget,

            boostEnabled,

            boostBudget:
              boostEnabled
                ? boostBudget
                : 0,

            boostStart:
              boostEnabled
                ? body.boostStart
                : "",

            boostEnd:
              boostEnabled
                ? body.boostEnd
                : "",

            acceptRewardCredits,

            redemptionLimit:
              acceptRewardCredits
                ? redemptionLimit
                : 0,
          }),
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
        "Invalid marketing backend response:",
        rawText
      );

      const preview =
        rawText
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 500);

      return NextResponse.json(
        {
          success: false,

          error:
            preview ||
            "Marketing backend returned an empty response.",
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
      const message =
        payload.error ||
        payload.message ||
        "Unable to update marketing settings.";

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
        null,
    });
  } catch (error) {
    console.error(
      "Merchant marketing route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to update marketing settings.",
      },
      {
        status: 500,
      }
    );
  }
}