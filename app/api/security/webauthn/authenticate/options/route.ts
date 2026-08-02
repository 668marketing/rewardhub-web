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
import {
  createWebAuthnAuthenticationStateToken,
  type WebAuthnStateCredential,
} from "@/lib/server/webauthn-state";

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
  credentialId?: string;
  CREDENTIAL_ID?: string;

  publicKey?: string;
  PUBLIC_KEY?: string;

  signCount?:
    | number
    | string;

  SIGN_COUNT?:
    | number
    | string;

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

  browser?: string;
  BROWSER?: string;

  deviceName?: string;
  DEVICE_NAME?: string;
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
  const record =
    asRecord(
      result
    );

  if (!record) {
    return null;
  }

  return (
    asRecord(
      record.data
    ) ||
    record
  );
}

function extractDevices(
  result: unknown
): RegisteredDevice[] {
  const payload =
    extractPayload(
      result
    );

  if (!payload) {
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
        ): item is
          RegisteredDevice =>
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

function normalizeNumber(
  value: unknown
) {
  const numberValue =
    Number(
      value
    );

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : 0;
}

function normalizeTransports(
  value:
    | string[]
    | string
    | undefined
): AuthenticatorTransportFuture[] {
  const values =
    Array.isArray(
      value
    )
      ? value
      : clean(
          value
        )
        ? clean(
            value
          )
            .split(
              ","
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

  return values
    .map(
      (
        item
      ) =>
        clean(
          item
        )
    )
    .filter(
      (
        item
      ): item is
        AuthenticatorTransportFuture =>
        allowed.has(
          item
        )
    );
}

function createChallengePair() {
  const source =
    [
      crypto.randomUUID(),
      crypto.randomUUID(),
    ].join(
      ":"
    );

  return {
    source,

    encoded:
      Buffer.from(
        source,
        "utf8"
      ).toString(
        "base64url"
      ),
  };
}

function getErrorMessage(
  error: unknown
) {
  return error instanceof
    Error
    ? error.message
    : String(
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

    const actualChallengeId =
      crypto.randomUUID();

    const challengePair =
      createChallengePair();

    const createdAt =
      new Date();

    const expiresAt =
      new Date(
        createdAt.getTime() +
          config
            .challengeTtlSeconds *
            1000
      );

    const preparationResult =
      await rewardHubBackend(
        "prepareWebAuthnAuthentication",
        {
          challengeId:
            actualChallengeId,

          userType,

          userId,

          deviceId,

          purpose:
            "AUTHENTICATION",

          challenge:
            challengePair.encoded,

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
        },
        {
          timeoutMs:
            20_000,
        }
      );

    const registeredDevices =
      extractDevices(
        preparationResult
      );

    const activeDevices =
      registeredDevices.filter(
        (
          device
        ) => {
          const credentialId =
            clean(
              device.credentialId ||
                device.CREDENTIAL_ID
            );

          const publicKey =
            clean(
              device.publicKey ||
                device.PUBLIC_KEY
            );

          const status =
            clean(
              device.status ||
                device.STATUS
            ).toUpperCase();

          return (
            credentialId &&
            publicKey &&
            normalizeBoolean(
              device.biometricEnabled ??
                device.BIOMETRIC_ENABLED
            ) &&
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

    const credentials:
      WebAuthnStateCredential[] =
        activeDevices.map(
          (
            device
          ) => ({
            id:
              clean(
                device.credentialId ||
                  device.CREDENTIAL_ID
              ),

            publicKey:
              clean(
                device.publicKey ||
                  device.PUBLIC_KEY
              ),

            counter:
              normalizeNumber(
                device.signCount ??
                  device.SIGN_COUNT
              ),

            transports:
              normalizeTransports(
                device.transports ||
                  device.TRANSPORTS
              ),

            browser:
              clean(
                device.browser ||
                  device.BROWSER
              ),

            deviceName:
              clean(
                device.deviceName ||
                  device.DEVICE_NAME
              ),
          })
        );

    const options =
      await generateAuthenticationOptions({
        rpID:
          config.rpId,

        challenge:
          challengePair.source,

        timeout:
          60_000,

        allowCredentials:
          credentials.map(
            (
              credential
            ) => ({
              id:
                credential.id,

              transports:
                credential.transports
                  .length
                  ? credential.transports as
                      AuthenticatorTransportFuture[]
                  : undefined,
            })
          ),

        userVerification:
          "required",
      });

    if (
      options.challenge !==
        challengePair.encoded
    ) {
      throw new Error(
        "Generated WebAuthn challenge does not match the stored challenge."
      );
    }

    /*
     * The browser continues to return this value as challengeId.
     * It is now a signed, short-lived state token containing the
     * exact credential data already read during the options call.
     *
     * This removes the extra Apps Script read before verification.
     */
    const stateToken =
      createWebAuthnAuthenticationStateToken({
        version:
          1,

        challengeId:
          actualChallengeId,

        challenge:
          options.challenge,

        userType,

        userId,

        deviceId,

        rpId:
          config.rpId,

        origin:
          config.origin,

        expiresAt:
          expiresAt.getTime(),

        credentials,
      });

    return NextResponse.json(
      {
        success:
          true,

        challengeId:
          stateToken,

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
