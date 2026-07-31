import {
  generateAuthenticationOptions,
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

type AuthenticationOptionsRequest = {
  userType?:
    RewardHubUserType;

  userId?: string;

  deviceId?: string;

  browser?: string;

  deviceName?: string;
};

type RegisteredDevice = {
  userType?: string;
  userId?: string;
  deviceId?: string;
  deviceName?: string;

  credentialId?: string;
  CREDENTIAL_ID?: string;

  transports?:
    | string[]
    | string;

  TRANSPORTS?:
    | string[]
    | string;

  status?: string;
  STATUS?: string;

  biometricEnabled?:
    | boolean
    | string;

  BIOMETRIC_ENABLED?:
    | boolean
    | string;
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
):
  | RewardHubUserType
  | null {
  const normalized =
    clean(
      value
    ).toUpperCase();

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

function asRecord(
  value: unknown
):
  | Record<
      string,
      unknown
    >
  | null {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}

function extractPayload(
  result: unknown
):
  | Record<
      string,
      unknown
    >
  | null {
  const resultRecord =
    asRecord(
      result
    );

  if (
    !resultRecord
  ) {
    return null;
  }

  const dataRecord =
    asRecord(
      resultRecord.data
    );

  return (
    dataRecord ||
    resultRecord
  );
}

function extractDevices(
  result: unknown
): RegisteredDevice[] {
  const payload =
    extractPayload(
      result
    );

  if (
    !payload
  ) {
    return [];
  }

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
      Array.isArray(
        candidate
      )
    ) {
      return candidate.filter(
        (
          item
        ): item is RegisteredDevice =>
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

function normalizeBoolean(
  value: unknown
) {
  if (
    value === true ||
    value === 1
  ) {
    return true;
  }

  const normalized =
    clean(
      value
    ).toUpperCase();

  return (
    normalized ===
      "TRUE" ||
    normalized ===
      "YES" ||
    normalized ===
      "1"
  );
}

function normalizeTransports(
  value:
    | string[]
    | string
    | undefined
): AuthenticatorTransportFuture[] {
  const rawValues =
    Array.isArray(
      value
    )
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
      allowed.has(
        item
      )
  );
}

function getErrorMessage(
  error: unknown
) {
  if (
    error instanceof
    Error
  ) {
    return (
      error.message ||
      "Unknown error"
    );
  }

  return String(
    error ||
      "Unknown error"
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (
        await request.json()
      ) as AuthenticationOptionsRequest;

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

    const devicesResult =
      await rewardHubBackend(
        "getRegisteredDevices",
        {
          userType,
          userId,
          currentDeviceId:
            deviceId,
        }
      );

    const registeredDevices =
      extractDevices(
        devicesResult
      );

    const activeDevices =
      registeredDevices.filter(
        (
          device
        ) => {
          const status =
            clean(
              device.status ||
                device.STATUS
            ).toUpperCase();

          const biometricEnabled =
            normalizeBoolean(
              device.biometricEnabled ??
                device
                  .BIOMETRIC_ENABLED
            );

          const credentialId =
            clean(
              device.credentialId ||
                device.CREDENTIAL_ID
            );

          return (
            credentialId &&
            biometricEnabled &&
            (
              !status ||
              status ===
                "ACTIVE"
            )
          );
        }
      );

    if (
      activeDevices.length ===
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,
          code:
            "NO_REGISTERED_CREDENTIAL",

          message:
            "No active biometric credential is registered for this account.",
        },
        {
          status:
            404,
        }
      );
    }

    const allowCredentials =
      activeDevices.map(
        (
          device
        ) => {
          const credentialId =
            clean(
              device.credentialId ||
                device.CREDENTIAL_ID
            );

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
      );

    const options =
      await generateAuthenticationOptions({
        rpID:
          config.rpId,

        timeout:
          60_000,

        allowCredentials,

        userVerification:
          "required",
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
      "beginWebAuthnAuthentication",
      {
        challengeId,

        userType,

        userId,

        deviceId,

        purpose:
          "AUTHENTICATION",

        challenge:
          options.challenge,

        rpId:
          config.rpId,

        origin:
          config.origin,

        expiresAt:
          expiresAt.toISOString(),

        browser:
          clean(
            body.browser
          ),

        deviceName:
          clean(
            body.deviceName
          ),

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
      "WebAuthn authentication options error:",
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