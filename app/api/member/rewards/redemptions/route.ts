import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as {
        memberId?: string;
        redemptionId?: string;
      };

    const memberId =
      String(
        body.memberId || ""
      ).trim();

    const redemptionId =
      String(
        body.redemptionId ||
        ""
      ).trim();

    if (!memberId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Member session is required.",
        },
        {
          status: 401,
        }
      );
    }

    if (!redemptionId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Redemption ID is required.",
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
              action:
                "getMemberRewardRedemptionDetail",
              memberId,
              redemptionId,
            }),
        }
      );

    const rawText =
      await backendResponse.text();

    let result:
      Record<string, unknown>;

    try {
      result =
        JSON.parse(
          rawText
        ) as Record<
          string,
          unknown
        >;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "RewardHub backend returned an invalid response.",
        },
        {
          status: 502,
        }
      );
    }

    if (
      !backendResponse.ok ||
      result.success === false
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            String(
              result.error ||
              result.message ||
              "Unable to load redemption."
            ),
        },
        {
          status: 400,
        }
      );
    }

    let data:
      unknown =
      result.data ??
      result.result;

    for (
      let level = 0;
      level < 4;
      level++
    ) {
      if (
        !data ||
        typeof data !==
          "object" ||
        Array.isArray(data)
      ) {
        break;
      }

      const objectValue =
        data as {
          data?: unknown;
          result?: unknown;
        };

      if (
        objectValue.data !==
          undefined
      ) {
        data =
          objectValue.data;
        continue;
      }

      if (
        objectValue.result !==
          undefined
      ) {
        data =
          objectValue.result;
        continue;
      }

      break;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load redemption.",
      },
      {
        status: 500,
      }
    );
  }
}
