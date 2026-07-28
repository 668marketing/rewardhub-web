import {
  createHmac,
} from "crypto";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RequestBody = {
  userId?: unknown;
};

function cleanUserId(
  value: unknown
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function isAllowedUserId(
  userId: string
): boolean {
  return /^(MEMBER:RHM[A-Z0-9_-]+|MERCHANT:RHCM[A-Z0-9_-]+)$/i.test(
    userId
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as
        RequestBody;

    const userId =
      cleanUserId(
        body.userId
      );

    if (
      !userId ||
      !isAllowedUserId(
        userId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid RewardHub support identity.",
        },
        {
          status: 400,
        }
      );
    }

    const apiKey =
      process.env
        .TAWK_API_KEY?.trim();

    if (!apiKey) {
      console.error(
        "[Tawk Auth] Missing TAWK_API_KEY."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Support authentication is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const hash =
      createHmac(
        "sha256",
        apiKey
      )
        .update(userId)
        .digest("hex");

    return NextResponse.json(
      {
        success: true,
        userId,
        hash,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "[Tawk Auth] Failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create the support authentication signature.",
      },
      {
        status: 500,
      }
    );
  }
}