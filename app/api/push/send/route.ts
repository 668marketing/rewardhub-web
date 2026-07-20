import webpush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwZukKlv976yMLEA3Ap-_h6z4pyD8fTHzgpwHZlxAPGjfAjFYxRB6VdJXDK_zTJZmLs/exec";

type PushSubscriptionRecord = {
  subscriptionId: string;
  userType: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  status: string;
};

type SendPushBody = {
  secret?: string;
  userType?: "MEMBER" | "MERCHANT" | "ADMIN";
  userId?: string;
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
};

function getRequiredEnvironmentVariable(
  name: string
) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`
    );
  }

  return value;
}

async function callAppsScript(
  action: string,
  data: Record<string, unknown>
) {
  const response = await fetch(
    APPS_SCRIPT_URL,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action,
        ...data,
      }),
      cache: "no-store",
    }
  );

  const text = await response.text();

  let result: any;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Apps Script returned invalid JSON: ${text.slice(
        0,
        300
      )}`
    );
  }

  if (
    !response.ok ||
    result?.success === false ||
    result?.error
  ) {
    throw new Error(
      result?.message ||
        result?.error ||
        "Apps Script request failed"
    );
  }

  return result;
}

export async function POST(
  request: Request
) {
  try {
    const requestBody =
      (await request.json()) as SendPushBody;

    const pushApiSecret =
      getRequiredEnvironmentVariable(
        "PUSH_API_SECRET"
      );

    if (
      !requestBody.secret ||
      requestBody.secret !== pushApiSecret
    ) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const vapidPublicKey =
      getRequiredEnvironmentVariable(
        "NEXT_PUBLIC_VAPID_PUBLIC_KEY"
      );

    const vapidPrivateKey =
      getRequiredEnvironmentVariable(
        "VAPID_PRIVATE_KEY"
      );

    const vapidSubject =
      getRequiredEnvironmentVariable(
        "VAPID_SUBJECT"
      );

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    const userType =
      requestBody.userType || "MEMBER";

    const userId =
      requestBody.userId?.trim() || "";

    const subscriptionResult =
      await callAppsScript(
        "getPushSubscriptions",
        {
          userType,
          userId,
          status: "ACTIVE",
        }
      );

    const subscriptions:
      | PushSubscriptionRecord[] =
      subscriptionResult?.data
        ?.subscriptions ||
      subscriptionResult?.subscriptions ||
      [];

    if (subscriptions.length === 0) {
      return Response.json({
        success: false,
        message:
          "No active push subscriptions found.",
        sent: 0,
        failed: 0,
      });
    }

    const notificationPayload =
      JSON.stringify({
        title:
          requestBody.title ||
          "RewardHub",
        body:
          requestBody.body ||
          "You have a new RewardHub notification.",
        url:
          requestBody.url ||
          "/member/dashboard",
        tag:
          requestBody.tag ||
          `rewardhub-${Date.now()}`,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      });

    let sent = 0;
    let failed = 0;

    const results =
      await Promise.allSettled(
        subscriptions.map(
          async (subscription) => {
            try {
              await webpush.sendNotification(
                {
                  endpoint:
                    subscription.endpoint,
                  keys: {
                    p256dh:
                      subscription.p256dh,
                    auth: subscription.auth,
                  },
                },
                notificationPayload,
                {
                  TTL: 60 * 60,
                }
              );

              sent += 1;

              return {
                success: true,
                endpoint:
                  subscription.endpoint,
              };
            } catch (error: any) {
              failed += 1;

              const statusCode =
                error?.statusCode;

              if (
                statusCode === 404 ||
                statusCode === 410
              ) {
                await callAppsScript(
                  "disablePushSubscriptionByEndpoint",
                  {
                    endpoint:
                      subscription.endpoint,
                  }
                );
              }

              return {
                success: false,
                endpoint:
                  subscription.endpoint,
                statusCode,
                message:
                  error?.message ||
                  "Push delivery failed",
              };
            }
          }
        )
      );

    return Response.json({
      success: sent > 0,
      message:
        sent > 0
          ? "Push notification sent."
          : "Push notification could not be delivered.",
      total: subscriptions.length,
      sent,
      failed,
      results,
    });
  } catch (error: unknown) {
    console.error(
      "Push send error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to send push notification.",
      },
      {
        status: 500,
      }
    );
  }
}