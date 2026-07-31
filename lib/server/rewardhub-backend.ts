import "server-only";

const BACKEND_URL =
  process.env
    .REWARDHUB_APPS_SCRIPT_URL ||
  process.env
    .NEXT_PUBLIC_REWARDHUB_API ||
  process.env
    .REWARDHUB_API_URL ||
  "";

export async function rewardHubBackend(
  action: string,
  data: Record<string, unknown> = {}
) {
  if (!BACKEND_URL) {
    throw new Error(
      "RewardHub backend URL is missing."
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
          ...data,
        }),
      }
    );

  const json =
    await response.json();

  if (
    !response.ok ||
    json?.success === false
  ) {
    throw new Error(
      json?.message ||
        "RewardHub backend request failed."
    );
  }

  return json;
}