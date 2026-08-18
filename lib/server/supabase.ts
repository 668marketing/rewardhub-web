import "server-only";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

const SUPABASE_URL = String(
  process.env.SUPABASE_URL || ""
).trim();

const SUPABASE_SERVICE_ROLE_KEY =
  String(
    process.env
      .SUPABASE_SERVICE_ROLE_KEY ||
      ""
  ).trim();

let cachedClient:
  SupabaseClient | null = null;

function assertSupabaseEnvironment() {
  if (!SUPABASE_URL) {
    throw new Error(
      "SUPABASE_URL is missing."
    );
  }

  if (
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing."
    );
  }
}

export function getSupabaseAdmin():
  SupabaseClient {
  assertSupabaseEnvironment();

  if (cachedClient) {
    return cachedClient;
  }

  cachedClient =
    createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },

        global: {
          headers: {
            "X-Client-Info":
              "rewardhub-nextjs-server",
          },
        },
      }
    );

  return cachedClient;
}

export async function testSupabaseConnection() {
  const supabase =
    getSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from("members")
      .select(
        "member_id,full_name"
      )
      .limit(1);

  if (error) {
    throw new Error(
      `Supabase connection failed: ${error.message}`
    );
  }

  return {
    success: true,
    rows: data || [],
  };
}