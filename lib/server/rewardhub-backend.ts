import "server-only";

const BACKEND_URL =
  process.env
    .REWARDHUB_APPS_SCRIPT_URL ||
  process.env
    .NEXT_PUBLIC_REWARDHUB_API ||
  process.env
    .REWARDHUB_API_URL ||
  "";

const SECURITY_API_SECRET =
  String(
    process.env
      .SECURITY_API_SECRET ||
      ""
  ).trim();

export async function rewardHubBackend(
  action: string,
  data: Record<string, unknown> = {}
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

  const response =
    await fetch(
      BACKEND_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          action,
          serverSecret:
            SECURITY_API_SECRET,
          ...data,
        }),
      }
    );

 const text =
  await response.text();

console.log("======== BACKEND RESPONSE ========");
console.log(text);
console.log("==================================");

  let json:
    Record<string, unknown>;

  try {
    json =
      JSON.parse(
        text
      ) as Record<
        string,
        unknown
      >;
  } catch {
    throw new Error(
      `RewardHub backend returned non-JSON: ${text.slice(
        0,
        300
      )}`
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
        "RewardHub backend request failed."
      )
    );
  }

  return json;
}