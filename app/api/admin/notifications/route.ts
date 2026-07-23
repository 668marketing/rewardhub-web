import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  isExpiredPushSubscription,
  sendRewardHubPush,
} from "@/lib/web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RewardHubResponse<T> = {
  success?: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
};
type NotificationTargetType =
  | "ALL_MEMBERS"
  | "ALL_MERCHANTS"
  | "SPECIFIC_MEMBER"
  | "SPECIFIC_MERCHANT";

type NotificationDeliveryTarget = {
  subscriptionId: string;
  userType: string;
  userId: string;
  endpoint: string;

  keys: {
    p256dh: string;
    auth: string;
  };
};

type NotificationRequestBody = {
  targetType?: NotificationTargetType;
  targetId?: string;
  title?: string;
  message?: string;
  url?: string;
  image?: string;
};

function getRequestOrigin(
  request: NextRequest
) {
  const forwardedHost =
    request.headers.get(
      "x-forwarded-host"
    );

  const host =
    forwardedHost ||
    request.headers.get("host");

  const forwardedProtocol =
    request.headers.get(
      "x-forwarded-proto"
    );

  const protocol =
    forwardedProtocol ||
    (
      process.env.NODE_ENV ===
      "production"
        ? "https"
        : "http"
    );

  if (host) {
    return `${protocol}://${host}`;
  }

  return request.nextUrl.origin;
}

function clearAdminCookie(
  response: NextResponse
) {
  response.cookies.set({
    name:
      "rewardhub_admin_session",
    value: "",
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}

async function callRewardHub(
  request: NextRequest,
  payload: Record<
    string,
    unknown
  >
) {
  const origin =
    getRequestOrigin(request);

  const response =
    await fetch(
      `${origin}/api/rewardhub`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(
          payload
        ),
      }
    );

  const rawText =
    await response.text();

  let result:
    RewardHubResponse<unknown>;

  try {
    result =
      JSON.parse(rawText);
  } catch {
    console.error(
      "Invalid RewardHub notification response:",
      rawText
    );

    throw new Error(
      "RewardHub backend returned an invalid response."
    );
  }

  if (
    !response.ok ||
    result.success === false
  ) {
    throw new Error(
      result.error ||
      result.message ||
      "RewardHub request failed."
    );
  }

  const responsePayload =
  result.data ||
  result.result;

if (
  responsePayload &&
  typeof responsePayload ===
    "object" &&
  "data" in responsePayload
) {
  const nestedPayload =
    responsePayload as {
      data?: unknown;
    };

  return (
    nestedPayload.data ??
    responsePayload
  );
}

return responsePayload;
}

export async function GET(
  request: NextRequest
) {
  try {
    const token =
      request.cookies.get(
        "rewardhub_admin_session"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const mode =
      request.nextUrl
        .searchParams
        .get("mode") ||
      "dashboard";

    let action =
      "getAdminNotificationDashboard";

    const payload:
      Record<string, unknown> = {
        token,

        userAgent:
          request.headers.get(
            "user-agent"
          ) || "",

        ipAddress:
          request.headers.get(
            "x-forwarded-for"
          ) ||
          request.headers.get(
            "x-real-ip"
          ) ||
          "",
      };

    if (
      mode ===
      "history"
    ) {
      action =
        "getAdminNotificationHistory";

      payload.search =
        request.nextUrl
          .searchParams
          .get("search") ||
        "";

      payload.targetType =
        request.nextUrl
          .searchParams
          .get(
            "targetType"
          ) ||
        "";

      payload.status =
        request.nextUrl
          .searchParams
          .get("status") ||
        "";

      payload.limit =
        200;
    }

    payload.action =
      action;

    const data =
      await callRewardHub(
        request,
        payload
      );

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            mode ===
            "history"
              ? "Notification history data is missing."
              : "Notification dashboard data is missing.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Notification GET error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to load notification data.";

    const isAuthError =
      /unauthorized|session|expired|inactive/i.test(
        errorMessage
      );

    const response =
      NextResponse.json(
        {
          success: false,
          error:
            errorMessage,
        },
        {
          status:
            isAuthError
              ? 401
              : 500,
        }
      );

    return isAuthError
      ? clearAdminCookie(
          response
        )
      : response;
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const token =
      request.cookies.get(
        "rewardhub_admin_session"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as
        NotificationRequestBody;

    const targetType =
      String(
        body.targetType || ""
      ).trim() as
        NotificationTargetType;

    const targetId =
      String(
        body.targetId || ""
      ).trim();

    const title =
      String(
        body.title || ""
      ).trim();

    const message =
      String(
        body.message || ""
      ).trim();

    const url =
      String(
        body.url || ""
      ).trim();

    const image =
      String(
        body.image || ""
      ).trim();

    const allowedTargetTypes:
      NotificationTargetType[] = [
        "ALL_MEMBERS",
        "ALL_MERCHANTS",
        "SPECIFIC_MEMBER",
        "SPECIFIC_MERCHANT",
      ];

    if (
      !allowedTargetTypes.includes(
        targetType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please select a valid notification target.",
        },
        {
          status: 400,
        }
      );
    }

    const requiresTargetId =
      targetType ===
        "SPECIFIC_MEMBER" ||
      targetType ===
        "SPECIFIC_MERCHANT";

    if (
      requiresTargetId &&
      !targetId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            targetType ===
            "SPECIFIC_MEMBER"
              ? "Member ID is required."
              : "Merchant ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Notification title is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Notification message is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      title.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Notification title must not exceed 100 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      message.length > 500
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Notification message must not exceed 500 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const pushApiSecret =
      process.env
        .PUSH_API_SECRET
        ?.trim();

    if (!pushApiSecret) {
      throw new Error(
        "PUSH_API_SECRET is not configured."
      );
    }

    const targetResult =
      await callRewardHub(
        request,
        {
          action:
            "getNotificationDeliveryTargets",

          token,
          pushApiSecret,
          targetType,
          targetId,

          userAgent:
            request.headers.get(
              "user-agent"
            ) || "",

          ipAddress:
            request.headers.get(
              "x-forwarded-for"
            ) ||
            request.headers.get(
              "x-real-ip"
            ) ||
            "",
        }
      );

    const targetPayload =
      targetResult as {
        subscriptions?:
          NotificationDeliveryTarget[];
      };

    const subscriptions =
      Array.isArray(
        targetPayload
          .subscriptions
      )
        ? targetPayload.subscriptions
        : [];

    const deliveryResults =
      await Promise.allSettled(
        subscriptions.map(
          async (
            subscription
          ) => {
            try {
              const defaultUrl =
                subscription.userType ===
                "MERCHANT"
                  ? "/merchant/dashboard"
                  : "/member/dashboard";

              await sendRewardHubPush(
                {
                  endpoint:
                    subscription.endpoint,

                  keys: {
                    p256dh:
                      subscription.keys
                        .p256dh,

                    auth:
                      subscription.keys
                        .auth,
                  },
                },
                {
                  title,
                  message,

                  url:
                    url ||
                    defaultUrl,

                  image,

                  tag:
                    `rewardhub-${targetType.toLowerCase()}`,
                }
              );

              return {
                subscriptionId:
                  subscription.subscriptionId,

                success:
                  true,
              };
            } catch (error) {

  console.error(
    "Web Push Delivery Error:",
    error
  );

  if (
    isExpiredPushSubscription(
      error
    )
  ) {
    try {
      await callRewardHub(
        request,
        {
          action:
            "markNotificationPushInactive",

          token,
          pushApiSecret,

          subscriptionId:
            subscription.subscriptionId,
        }
      );
    } catch (
      inactiveError
    ) {
      console.error(
        "Unable to mark inactive:",
        inactiveError
      );
    }
  }

  throw error;
}
          }
        )
      );

    const sentCount =
      deliveryResults.filter(
        (result) =>
          result.status ===
          "fulfilled"
      ).length;

    const failedCount =
      subscriptions.length -
      sentCount;

    const status =
      subscriptions.length === 0
        ? "NO_TARGETS"
        : sentCount === 0
          ? "FAILED"
          : failedCount > 0
            ? "PARTIAL"
            : "COMPLETED";

    const errorSummary =
  deliveryResults
    .filter(
      (
        result
      ): result is PromiseRejectedResult =>
        result.status ===
        "rejected"
    )
    .slice(0, 5)
    .map((result) => {
      const reason =
        result.reason;

      if (
        reason &&
        typeof reason ===
          "object"
      ) {
        const pushError =
          reason as {
            message?: string;
            statusCode?: number;
            body?: string;
            headers?: unknown;
          };

        return [
          pushError.statusCode
            ? `Status ${pushError.statusCode}`
            : "",

          pushError.message ||
            "",

          pushError.body ||
            "",
        ]
          .filter(Boolean)
          .join(" · ");
      }

      return String(
        reason ||
        "Push delivery failed."
      );
    })
    .join(" | ");

    const historyResult =
      await callRewardHub(
        request,
        {
          action:
            "createNotificationHistory",

          token,
          pushApiSecret,

          channel:
            "PUSH",

          targetType,
          targetId,
          title,
          message,
          url,
          image,

          attemptedCount:
            subscriptions.length,

          sentCount,
          failedCount,
          status,
          errorSummary,

          createdBy:
            "ADMIN",
        }
      );

    /*
     * Create In-App Notifications
     */

    const historyPayload =
      historyResult &&
      typeof historyResult === "object"
        ? (historyResult as {
            notification?: {
              notificationId?: string;
            };
            notificationId?: string;
          })
        : {};

    const notificationId =
      String(
        historyPayload.notification
          ?.notificationId ||
          historyPayload.notificationId ||
          ""
      ).trim();

    const inAppResult =
      await callRewardHub(
        request,
        {
          action:
            "createUserNotification",

          token,
          pushApiSecret,
          notificationId,
          targetType,
          targetId,
          title,
          message,

          url:
            url ||
            (
              targetType ===
                "ALL_MERCHANTS" ||
              targetType ===
                "SPECIFIC_MERCHANT"
                ? "/merchant/dashboard"
                : "/member/dashboard"
            ),

          image,
        }
      );

    if (
      subscriptions.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No active push devices matched this target.",

          data: {
            attemptedCount:
              0,

            sentCount:
              0,

            failedCount:
              0,

            status,

            history:
              historyResult,

            inApp:
              inAppResult,
          },
        },
        {
          status: 400,
        }
      );
    }

    if (
      sentCount === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The notification could not be delivered.",

          data: {
            attemptedCount:
              subscriptions.length,

            sentCount,
            failedCount,
            status,

            history:
              historyResult,

            inApp:
              inAppResult,
          },
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,

      data: {
        attemptedCount:
          subscriptions.length,

        sentCount,
        failedCount,
        status,

        history:
          historyResult,

        inApp:
          inAppResult,
      },
    });
  } catch (error) {
    console.error(
      "Send notification error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to send notification.";

    const isAuthError =
      /unauthorized|session|expired|inactive/i.test(
        errorMessage
      );

    const response =
      NextResponse.json(
        {
          success: false,
          error:
            errorMessage,
        },
        {
          status:
            isAuthError
              ? 401
              : 500,
        }
      );

    return isAuthError
      ? clearAdminCookie(
          response
        )
      : response;
  }
}