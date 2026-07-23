import webpush from "web-push";

export type RewardHubPushPayload = {
  title: string;
  message: string;
  url?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
};

export type RewardHubPushSubscription = {
  endpoint: string;

  keys: {
    p256dh: string;
    auth: string;
  };
};

let configured = false;

function requiredEnvironmentVariable(
  name: string
) {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is not configured.`
    );
  }

  return value;
}

function configureWebPush() {
  if (configured) {
    return;
  }

  const subject =
    requiredEnvironmentVariable(
      "VAPID_SUBJECT"
    );

  const publicKey =
    requiredEnvironmentVariable(
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY"
    );

  const privateKey =
    requiredEnvironmentVariable(
      "VAPID_PRIVATE_KEY"
    );

  webpush.setVapidDetails(
    subject,
    publicKey,
    privateKey
  );

  configured = true;
}

export async function sendRewardHubPush(
  subscription:
    RewardHubPushSubscription,
  payload:
    RewardHubPushPayload
) {
  configureWebPush();

  return webpush.sendNotification(
    subscription,
    JSON.stringify({
      title:
        payload.title,

      body:
        payload.message,

      url:
        payload.url ||
        "/",

      icon:
        payload.icon ||
        "/icons/icon-192.png",

      badge:
        payload.badge ||
        "/icons/icon-192.png",

      image:
        payload.image ||
        "",

      tag:
        payload.tag ||
        "rewardhub-notification",
    }),
    {
      TTL: 3600,
      urgency: "normal",
    }
  );
}

export function isExpiredPushSubscription(
  error: unknown
) {
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error
      ? Number(
          (
            error as {
              statusCode?: unknown;
            }
          ).statusCode
        )
      : 0;

  return (
    statusCode === 404 ||
    statusCode === 410
  );
}