import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwZukKlv976yMLEA3Ap-_h6z4pyD8fTHzgpwHZlxAPGjfAjFYxRB6VdJXDK_zTJZmLs/exec";

type JsonObject = Record<
  string,
  unknown
>;

function isJsonObject(
  value: unknown
): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function safeTextPreview(
  value: string,
  maxLength = 500
) {
  const cleaned = String(
    value || ""
  )
    .replace(/\s+/g, " ")
    .trim();

  if (
    cleaned.length <= maxLength
  ) {
    return cleaned;
  }

  return (
    cleaned.slice(
      0,
      maxLength
    ) + "..."
  );
}

function removeJsonPrefix(
  value: string
) {
  return String(
    value || ""
  )
    .replace(
      /^\uFEFF/,
      ""
    )
    .replace(
      /^\)\]\}',?\s*/,
      ""
    )
    .trim();
}

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
          message:
            "The request body must be valid JSON.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isJsonObject(body)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request payload.",
          message:
            "The request payload must be a JSON object.",
        },
        {
          status: 400,
        }
      );
    }

    const action =
      typeof body.action ===
      "string"
        ? body.action.trim()
        : "";

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing action.",
          message:
            "RewardHub API action is required.",
        },
        {
          status: 400,
        }
      );
    }

    let upstreamResponse:
      Response;

    try {
      upstreamResponse =
        await fetch(
          API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "text/plain;charset=utf-8",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify(
                body
              ),

            cache:
              "no-store",

            redirect:
              "follow",

            signal:
              AbortSignal.timeout(
                90000
              ),
          }
        );
    } catch (error) {
      console.error(
        "REWARDHUB UPSTREAM FETCH ERROR:",
        {
          action,
          error,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to connect to the RewardHub backend.",
          message:
            error instanceof Error
              ? error.message
              : "Apps Script request failed.",
        },
        {
          status: 502,
        }
      );
    }

    const rawText =
      await upstreamResponse.text();

    const cleanedText =
      removeJsonPrefix(
        rawText
      );

    if (!cleanedText) {
      console.error(
        "REWARDHUB EMPTY RESPONSE:",
        {
          action,
          upstreamStatus:
            upstreamResponse.status,
          upstreamUrl:
            upstreamResponse.url,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "RewardHub backend returned an empty response.",
          message:
            `No response data was returned for action "${action}".`,
        },
        {
          status: 502,
        }
      );
    }

    let parsed:
      unknown;

    try {
      parsed =
        JSON.parse(
          cleanedText
        );
    } catch (error) {
      console.error(
        "REWARDHUB INVALID JSON RESPONSE:",
        {
          action,

          upstreamStatus:
            upstreamResponse.status,

          upstreamContentType:
            upstreamResponse.headers.get(
              "content-type"
            ),

          upstreamUrl:
            upstreamResponse.url,

          preview:
            safeTextPreview(
              cleanedText
            ),

          error,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "RewardHub backend returned an invalid response.",
          message:
            "The Apps Script backend did not return valid JSON.",

          details:
            process.env.NODE_ENV ===
            "development"
              ? safeTextPreview(
                  cleanedText
                )
              : undefined,
        },
        {
          status: 502,
        }
      );
    }

    if (!isJsonObject(parsed)) {
      console.error(
        "REWARDHUB NON-OBJECT RESPONSE:",
        {
          action,
          parsed,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "RewardHub backend returned an unexpected response.",
          message:
            "The backend response must be a JSON object.",
        },
        {
          status: 502,
        }
      );
    }

    const success =
      parsed.success !== false;

    if (
      !upstreamResponse.ok ||
      !success
    ) {
      const errorMessage =
        typeof parsed.error ===
        "string"
          ? parsed.error
          : typeof parsed.message ===
            "string"
          ? parsed.message
          : "RewardHub backend request failed.";

      console.error(
        "REWARDHUB BACKEND ERROR:",
        {
          action,
          upstreamStatus:
            upstreamResponse.status,
          response:
            parsed,
        }
      );

      return NextResponse.json(
        {
          ...parsed,
          success: false,
          error:
            errorMessage,
        },
        {
          status:
            upstreamResponse.ok
              ? 400
              : upstreamResponse.status,
        }
      );
    }

    /*
     * Return the Apps Script JSON response
     * without converting it to text again.
     */
    return NextResponse.json(
      parsed,
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          Pragma:
            "no-cache",
        },
      }
    );
  } catch (error) {
    console.error(
      "LOCAL REWARDHUB API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Local RewardHub API error.",
        message:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}