import {
  NextResponse,
} from "next/server";

import {
  rewardHubBackend,
} from "@/lib/server/rewardhub-backend";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type ChangePasswordRequest = {
  memberId?: string;
  currentPassword?: string;
  newPassword?: string;
};

function clean(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function getErrorMessage(
  error: unknown
) {
  if (
    error instanceof Error
  ) {
    return (
      error.message ||
      "Unable to change password."
    );
  }

  return String(
    error ||
      "Unable to change password."
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (
        await request.json()
      ) as ChangePasswordRequest;

    const memberId =
      clean(
        body.memberId
      );

    const currentPassword =
      clean(
        body.currentPassword
      );

    const newPassword =
      clean(
        body.newPassword
      );

    if (!memberId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing member ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (!currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      newPassword.length < 6
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be at least 6 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await rewardHubBackend(
        "updateMemberPassword",
        {
          memberId,
          currentPassword,
          newPassword,
        }
      );

    return NextResponse.json(
      result,
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Member change password error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          getErrorMessage(
            error
          ),
      },
      {
        status: 500,
      }
    );
  }
}