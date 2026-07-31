import {
  generateRegistrationOptions,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import {
  NextResponse,
} from "next/server";

import {
  rewardHubBackend,
} from "@/lib/server/rewardhub-backend";
import {
  getWebAuthnConfig,
} from "@/lib/server/webauthn-config";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RewardHubUserType =
  | "MEMBER"
  | "MERCHANT"
  | "ADMIN";

type RegistrationOptionsRequest = {
  userType?: RewardHubUserType;
  userId?: string;
  userName?: string;
  displayName?: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  deviceModel?: string;
  deviceOs?: string;
  browser?: string;
};

type RegisteredDeviceRecord = {
  credentialId?: string;
  CREDENTIAL_ID?: string;
  transports?: string[];
  TRANSPORTS?: string[] | string;
  status?: string;
  STATUS?: string;
};

function clean(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function normalizeUserType(
  value: unknown
): RewardHubUserType | null {
  const normalized =
    clean(value).toUpperCase();

  if (
    normalized ===
      "MEMBER" ||
    normalized ===
      "MERCHANT" ||
    normalized ===
      "ADMIN"
  ) {
    return normalized;
  }

  return null;
}

function getErrorMessage(
  error: unknown
) {
  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return String(
    error || "Unknown error"
  );
}

function extractPayload(
  result: unknown
): Record<string, unknown> {
  if (
    !result ||
    typeof result !==
      "object" ||
    Array.isArray(result)
  ) {
    return {};
  }

  const record =
    result as Record<
      string,
      unknown
    >;

  const data =
    record.data;

  if (
    data &&
    typeof data ===
      "object" &&
    !Array.isArray(data)
  ) {
    return data as Record<
      string,
      unknown
    >;
  }

  return record;
}

function extractDevices(
  result: unknown
): RegisteredDeviceRecord[] {
  const payload =
    extractPayload(result);

  const candidates = [
    payload.devices,
    payload.items,
    payload.records,
  ];

  for (
    const candidate of
    candidates
  ) {
    if (
      Array.isArray(candidate)
    ) {
      return candidate.filter(
        (
          item
        ): item is RegisteredDeviceRecord =>
          Boolean(
            item &&
            typeof item ===
              "object" &&
            !Array.isArray(
              item
            )
          )
      );
    }
  }

  return [];
}

function normalizeTransports(
  value:
    | string[]
    | string
    | undefined
): AuthenticatorTransportFuture[] {
  const rawValues =
    Array.isArray(value)
      ? value
      : clean(value)
        ? clean(value)
            .split(",")
            .map(
              (
                item
              ) =>
                item.trim()
            )
        : [];

  const allowed =
    new Set([
      "ble",
      "cable",
      "hybrid",
      "internal",
      "nfc",
      "smart-card",
      "usb",
    ]);

  return rawValues.filter(
    (
      item
    ): item is
      AuthenticatorTransportFuture =>
      allowed.has(item)
  );
}

function createWebAuthnUserId(
  userType:
    RewardHubUserType,
  userId: string
) {
  return new TextEncoder()
    .encode(
      `${userType}:${userId}`
    );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (
        await request.json()
      ) as RegistrationOptionsRequest;

    const userType =
      normalizeUserType(
        body.userType
      );

    const userId =
      clean(
        body.userId
      );

    const deviceId =
      clean(
        body.deviceId
      );

    const userName =
      clean(
        body.userName
      ) ||
      userId;

    const displayName =
      clean(
        body.displayName
      ) ||
      userName;

    if (
      !userType
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Invalid user type.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !userId
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Missing user ID.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !deviceId
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Missing device ID.",
        },
        {
          status:
            400,
        }
      );
    }

    const config =
      getWebAuthnConfig();

    let registeredDevices:
      RegisteredDeviceRecord[] =
        [];

    try {
      const deviceResult =
        await rewardHubBackend(
          "getRegisteredDevices",
          {
            userType,
            userId,
            currentDeviceId:
              deviceId,
          }
        );

      registeredDevices =
        extractDevices(
          deviceResult
        );
    } catch (
      error
    ) {
      console.warn(
        "Unable to load existing WebAuthn credentials:",
        getErrorMessage(
          error
        )
      );
    }

    const excludeCredentials =
      registeredDevices
        .filter(
          (
            device
          ) => {
            const status =
              clean(
                device.status ||
                  device.STATUS
              ).toUpperCase();

            return (
              !status ||
              status ===
                "ACTIVE"
            );
          }
        )
        .map(
          (
            device
          ) => {
            const credentialId =
              clean(
                device.credentialId ||
                  device.CREDENTIAL_ID
              );

            if (
              !credentialId
            ) {
              return null;
            }

            const transports =
              normalizeTransports(
                device.transports ||
                  device.TRANSPORTS
              );

            return {
              id:
                credentialId,
              transports:
                transports.length
                  ? transports
                  : undefined,
            };
          }
        )
        .filter(
          (
            item
          ): item is {
            id: string;
            transports:
              | AuthenticatorTransportFuture[]
              | undefined;
          } =>
            Boolean(item)
        );

    const options =
      await generateRegistrationOptions({
        rpName:
          config.rpName,

        rpID:
          config.rpId,

        userID:
          createWebAuthnUserId(
            userType,
            userId
          ),

        userName,

        userDisplayName:
          displayName,

        timeout:
          60_000,

        attestationType:
          "none",

        excludeCredentials,

        authenticatorSelection:
          {
            authenticatorAttachment:
              "platform",

            residentKey:
              "discouraged",

            userVerification:
              "required",
          },

        supportedAlgorithmIDs:
          [
            -7,
            -257,
          ],
      });

    const challengeId =
      crypto.randomUUID();

    const createdAt =
      new Date();

    const expiresAt =
      new Date(
        createdAt.getTime() +
          config
            .challengeTtlSeconds *
            1000
      );

    await rewardHubBackend(
      "beginWebAuthnRegistration",
      {
        challengeId,

        userType,
        userId,
        deviceId,

        deviceName:
          clean(
            body.deviceName
          ),

        deviceType:
          clean(
            body.deviceType
          ),

        deviceModel:
          clean(
            body.deviceModel
          ),

        deviceOs:
          clean(
            body.deviceOs
          ),

        browser:
          clean(
            body.browser
          ),

        purpose:
          "REGISTRATION",

        challenge:
          options.challenge,

        rpId:
          config.rpId,

        origin:
          config.origin,

        expiresAt:
          expiresAt.toISOString(),

        status:
          "PENDING",

        createdAt:
          createdAt.toISOString(),

        updatedAt:
          createdAt.toISOString(),
      }
    );

    return NextResponse.json(
      {
        success:
          true,

        challengeId,

        options,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (
    error
  ) {
    console.error(
      "WebAuthn registration options error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          getErrorMessage(
            error
          ),
      },
      {
        status:
          500,
      }
    );
  }
}