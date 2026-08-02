import "server-only";

const BACKEND_URL =
  process.env.REWARDHUB_APPS_SCRIPT_URL ||
  process.env.NEXT_PUBLIC_REWARDHUB_API ||
  process.env.REWARDHUB_API_URL ||
  "";

const SECURITY_API_SECRET = String(
  process.env.SECURITY_API_SECRET || ""
).trim();

const DEFAULT_TIMEOUT_MS = 20_000;

type RewardHubBackendOptions = {
  timeoutMs?: number;
};

function getErrorMessage(
  value: unknown
) {
  if (value instanceof Error) {
    return value.message || "Unknown error";
  }

  return String(
    value || "Unknown error"
  );
}

export async function rewardHubBackend(
  action: string,
  data: Record<string, unknown> = {},
  options: RewardHubBackendOptions = {}
) {
  if (!BACKEND_URL) {
    throw new Error(
      "RewardHub backend URL is missing."
    );
  }

  if (!SECURITY_API_SECRET) {
    throw new Error(
      "SECURITY_API_SECRET is missing."
    );
  }

  const normalizedAction =
    String(action || "").trim();

  if (!normalizedAction) {
    throw new Error(
      "RewardHub backend action is missing."
    );
  }

  const timeoutMs =
    Number.isFinite(
      options.timeoutMs
    ) &&
    Number(options.timeoutMs) > 0
      ? Number(options.timeoutMs)
      : DEFAULT_TIMEOUT_MS;

  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);

  const startedAt =
    Date.now();

  try {
    const response =
      await fetch(
        BACKEND_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          cache: "no-store",

          signal:
            controller.signal,

          body: JSON.stringify({
            action:
              normalizedAction,

            serverSecret:
              SECURITY_API_SECRET,

            ...data,
          }),
        }
      );

    const responseText =
      await response.text();

    let json:
      Record<string, unknown>;

    try {
      json =
        JSON.parse(
          responseText
        ) as Record<
          string,
          unknown
        >;
    } catch {
      throw new Error(
        `RewardHub backend returned invalid JSON for ${normalizedAction}.`
      );
    }

    if (
      !response.ok ||
      json.success === false ||
      json.error
    ) {
      throw new Error(
        String(
          json.message ||
          json.error ||
          `RewardHub backend request failed: ${normalizedAction}`
        )
      );
    }

    const elapsedMs =
      Date.now() -
      startedAt;

    /*
     * Only record unusually slow calls.
     * Do not print the entire backend response because
     * WebAuthn responses may contain sensitive details.
     */
    if (elapsedMs >= 5_000) {
      console.warn(
        "[RewardHub Backend] Slow request",
        {
          action:
            normalizedAction,

          elapsedMs,
        }
      );
    }

    return json;
  } catch (error) {
    if (
      error instanceof Error &&
      error.name ===
        "AbortError"
    ) {
      throw new Error(
        `RewardHub backend timed out after ${timeoutMs}ms: ${normalizedAction}`
      );
    }

    console.error(
      "[RewardHub Backend] Request failed",
      {
        action:
          normalizedAction,

        elapsedMs:
          Date.now() -
          startedAt,

        message:
          getErrorMessage(
            error
          ),
      }
    );

    throw error;
  } finally {
    clearTimeout(
      timeout
    );
  }
}