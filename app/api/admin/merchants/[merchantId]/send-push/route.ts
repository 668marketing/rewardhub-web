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

type RouteContext = {
  params: Promise<{
    merchantId: string;
  }>;
};

type DeliveryTarget = {
  subscriptionId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

async function callRewardHub(
  request: NextRequest,
  payload: Record<
    string,
    unknown
  >
) {
  const response =
    await fetch(
      new URL(
        "/api/rewardhub",
        request.nextUrl.origin
      ),
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body:
          JSON.stringify(
            payload
          ),
      }
    );

  const rawText =
    await response.text();

  let result:
    any;

  try {
    result =
      JSON.parse(rawText);
  } catch {
    throw new Error(
      rawText
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500) ||
      "RewardHub returned an invalid response."
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

  return result;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
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
        { status: 401 }
      );
    }

    const {
      merchantId,
    } = await context.params;

    const cleanMerchantId =
      decodeURIComponent(
        merchantId || ""
      ).trim();

    const body =
      (await request.json()) as {
        title?: string;
        message?: string;
        url?: string;
        image?: string;
      };

    const title =
      String(
        body.title || ""
      ).trim();

    const message =
      String(
        body.message || ""
      ).trim();

    if (!cleanMerchantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Merchant ID is required.",
        },
        { status: 400 }
      );
    }

    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Title and message are required.",
        },
        { status: 400 }
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
            "getPushDeliveryTargets",
          token,
          pushApiSecret,
          userType:
            "MERCHANT",
          userId:
            cleanMerchantId,
        }
      );

    const resultData =
      targetResult.data?.data ||
      targetResult.data ||
      {};

    const subscriptions:
      DeliveryTarget[] =
      Array.isArray(
        resultData.subscriptions
      )
        ? resultData.subscriptions
        : [];

    if (
      subscriptions.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This merchant has no active push devices.",
        },
        { status: 400 }
      );
    }

    const deliveryResults =
      await Promise.allSettled(
        subscriptions.map(
          async (
            subscription
          ) => {
            try {
              await sendRewardHubPush(
                {
                  endpoint:
                    subscription.endpoint,
                  keys:
                    subscription.keys,
                },
                {
                  title,
                  message,
                  url:
                    String(
                      body.url ||
                      "/merchant/dashboard"
                    ).trim(),
                  image:
                    String(
                      body.image ||
                      ""
                    ).trim(),
                  tag:
                    `merchant-${cleanMerchantId}`,
                }
              );

              return {
                subscriptionId:
                  subscription.subscriptionId,
              };
            } catch (error) {
              if (
                isExpiredPushSubscription(
                  error
                )
              ) {
                await callRewardHub(
                  request,
                  {
                    action:
                      "markPushSubscriptionInactive",
                    token,
                    pushApiSecret,
                    subscriptionId:
                      subscription.subscriptionId,
                  }
                );
              }

              throw error;
            }
          }
        )
      );

    const delivered =
      deliveryResults.filter(
        (result) =>
          result.status ===
          "fulfilled"
      ).length;

    const failed =
      subscriptions.length -
      delivered;

    return NextResponse.json({
      success:
        delivered > 0,
      data: {
        merchantId:
          cleanMerchantId,
        attempted:
          subscriptions.length,
        delivered,
        failed,
      },
      error:
        delivered === 0
          ? "Unable to deliver the notification."
          : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to send notification.",
      },
      { status: 500 }
    );
  }
}