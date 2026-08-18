import {
  NextResponse,
} from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/server/supabase";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    const supabase =
      getSupabaseAdmin();

    const {
      data,
      error,
    } =
      await supabase
        .from("members")
        .select(
          [
            "member_id",
            "full_name",
            "card_id",
            "card_status",
            "member_tier",
            "member_status",
            "referral_code",
            "created_at",
          ].join(",")
        )
        .order(
          "member_id",
          {
            ascending: true,
          }
        )
        .limit(10);

    if (error) {
      console.error(
        "SUPABASE TEST QUERY ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
          code:
            error.code,
          details:
            error.details,
          hint:
            error.hint,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        source:
          "SUPABASE_POSTGRESQL",
        count:
          data?.length || 0,
        members:
          data || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "SUPABASE TEST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected Supabase test error.",
      },
      {
        status: 500,
      }
    );
  }
}