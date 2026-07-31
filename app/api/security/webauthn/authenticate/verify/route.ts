import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type WebAuthnCredential,
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

type AuthenticationVerifyRequest = {
  challengeId?: string;

  userType?:
    RewardHubUserType;

  userId?: string;

  deviceId?: string;

  browser?: string;

  deviceName?: string;

  credential?:
    AuthenticationResponseJSON;
};

type ChallengeRecord = {
  challengeId: string;
  userType:
    RewardHubUserType;
  userId: string;
  deviceId: string;
  purpose: string;
  challenge: string;
  rpId: string;
  origin: string;
  expiresAt: string;
  status: string;
};

type RegisteredDevice = {
  securityId?: string;

  userType?: string;
  USER_TYPE?: string;

  userId?: string;
  USER_ID?: string;

  deviceId?: string;
  DEVICE_ID?: string;

  deviceName?: string;
  DEVICE_NAME?: string;

  browser?: string;
  BROWSER?: string;

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
    normalized === "TRUE" ||
    normalized === "YES" ||
    normalized === "1"
  );
}

function normalizeNumber(
  value: unknown,
  fallback = 0
) {
  const result =
    Number(value);

  return Number.isFinite(
    result
  )
    ? result
    : fallback;
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

  return (
    asRecord(
      resultRecord.data
    ) ||
    resultRecord
  );
}

function extractChallengeRecord(
  result: unknown
):
  | ChallengeRecord
  | null {
  const payload =
    extractPayload(
      result
    );

  if (
    !payload
  ) {
    return null;
  }

  const userType =
    normalizeUserType(
      payload.userType ??
        payload.USER_TYPE
    );

  const challengeId =
    clean(
      payload.challengeId ??
        payload.CHALLENGE_ID
    );

  const userId =
    clean(
      payload.userId ??
        payload.USER_ID
    );

  const deviceId =
    clean(
      payload.deviceId ??
        payload.DEVICE_ID
    );

  const purpose =
    clean(
      payload.purpose ??
        payload.PURPOSE
    ).toUpperCase();

  const challenge =
    clean(
      payload.challenge ??
        payload.CHALLENGE
    );

  const rpId =
    clean(
      payload.rpId ??
        payload.RP_ID
    );

  const origin =
    clean(
      payload.origin ??
        payload.ORIGIN
    );

  const expiresAt =
    clean(
      payload.expiresAt ??
        payload.EXPIRES_AT
    );

  const status =
    clean(
      payload.status ??
        payload.STATUS
    ).toUpperCase();

  if (
    !userType ||
    !challengeId ||
    !userId ||
    !deviceId ||
    !challenge ||
    !rpId ||
    !origin
  ) {
    return null;
  }

  return {
    challengeId,
    userType,
    userId,
    deviceId,
    purpose,
    challenge,
    rpId,
    origin,
    expiresAt,
    status,
  };
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

function base64UrlToUint8Array(
  value: string
) {
  const normalized =
    value
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );

  const padded =
    normalized +
    "=".repeat(
      (
        4 -
        (
          normalized.length %
          4
        )
      ) %
        4
    );

  return new Uint8Array(
    Buffer.from(
      padded,
      "base64"
    )
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

function getRequestIp(
  request: Request
) {
  const forwardedFor =
    clean(
      request.headers.get(
        "x-forwarded-for"
      )
    );

  if (
    forwardedFor
  ) {
    return clean(
      forwardedFor.split(
        ","
      )[0]
    );
  }

  return (
    clean(
      request.headers.get(
        "x-real-ip"
      )
    ) ||
    clean(
      request.headers.get(
        "cf-connecting-ip"
      )
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
      ) as AuthenticationVerifyRequest;

    const challengeId =
      clean(
        body.challengeId
      );

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

    const responseCredential =
      body.credential;

    if (
      !challengeId
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Missing challenge ID.",
        },
        {
          status:
            400,
        }
      );
    }

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
      !userId ||
      !deviceId
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Missing user or device ID.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !responseCredential
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Missing authentication credential.",
        },
        {
          status:
            400,
        }
      );
    }

    const config =
      getWebAuthnConfig();

    const challengeResult =
      await rewardHubBackend(
        "getWebAuthnChallenge",
        {
          challengeId,

          purpose:
            "AUTHENTICATION",

          userType,

          userId,

          deviceId,
        }
      );

    const challengeRecord =
      extractChallengeRecord(
        challengeResult
      );

    if (
      !challengeRecord
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Authentication challenge was not found.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      challengeRecord
        .purpose !==
        "AUTHENTICATION" ||
      challengeRecord
        .status !==
        "PENDING"
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Authentication challenge is no longer active.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      challengeRecord
        .userType !==
        userType ||
      challengeRecord
        .userId !==
        userId ||
      challengeRecord
        .deviceId !==
        deviceId
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Authentication challenge identity does not match.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      challengeRecord
        .rpId !==
        config.rpId ||
      challengeRecord
        .origin !==
        config.origin
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Authentication domain configuration does not match.",
        },
        {
          status:
            400,
        }
      );
    }

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

    const devices =
      extractDevices(
        devicesResult
      );

    const returnedCredentialId =
      clean(
        responseCredential.id
      );

    const device =
      devices.find(
        (
          item
        ) => {
          const credentialId =
            clean(
              item.credentialId ||
                item.CREDENTIAL_ID
            );

          const status =
            clean(
              item.status ||
                item.STATUS
            ).toUpperCase();

          const biometricEnabled =
            normalizeBoolean(
              item.biometricEnabled ??
                item
                  .BIOMETRIC_ENABLED
            );

          return (
            credentialId ===
              returnedCredentialId &&
            (
              !status ||
              status ===
                "ACTIVE"
            ) &&
            biometricEnabled
          );
        }
      );

    if (
      !device
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Registered biometric credential was not found.",
        },
        {
          status:
            404,
        }
      );
    }

    const storedCredentialId =
      clean(
        device.credentialId ||
          device.CREDENTIAL_ID
      );

    const storedPublicKey =
      clean(
        device.publicKey ||
          device.PUBLIC_KEY
      );

    const storedCounter =
      normalizeNumber(
        device.signCount ??
          device.SIGN_COUNT,
        0
      );

    if (
      !storedCredentialId ||
      !storedPublicKey
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Stored biometric credential is incomplete.",
        },
        {
          status:
            500,
        }
      );
    }

    const storedCredential:
      WebAuthnCredential = {
        id:
          storedCredentialId,

        publicKey:
          base64UrlToUint8Array(
            storedPublicKey
          ),

        counter:
          storedCounter,

        transports:
          normalizeTransports(
            device.transports ||
              device.TRANSPORTS
          ),
      };

    const verification =
      await verifyAuthenticationResponse({
        response:
          responseCredential,

        expectedChallenge:
          challengeRecord
            .challenge,

        expectedOrigin:
          challengeRecord
            .origin,

        expectedRPID:
          challengeRecord
            .rpId,

        credential:
          storedCredential,

        requireUserVerification:
          true,
      });

    if (
      !verification.verified ||
      !verification
        .authenticationInfo
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Biometric authentication verification failed.",
        },
        {
          status:
            400,
        }
      );
    }

    const newSignCount =
      verification
        .authenticationInfo
        .newCounter;

    const finishResult =
      await rewardHubBackend(
        "finishWebAuthnAuthentication",
        {
          verified:
            true,

          challengeId,

          userType,

          userId,

          deviceId,

          credentialId:
            storedCredentialId,

          newSignCount,

          browser:
            clean(
              body.browser
            ) ||
            clean(
              device.browser ||
                device.BROWSER
            ),

          deviceName:
            clean(
              body.deviceName
            ) ||
            clean(
              device.deviceName ||
                device.DEVICE_NAME
            ),

          ip:
            getRequestIp(
              request
            ),
        }
      );

    return NextResponse.json(
      {
        success:
          true,

        verified:
          true,

        authenticated:
          true,

        userType,

        userId,

        deviceId,

        credentialId:
          storedCredentialId,

        signCount:
          newSignCount,

        result:
          extractPayload(
            finishResult
          ),
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
      "WebAuthn authentication verification error:",
      error
    );

    const message =
      getErrorMessage(
        error
      );

    const isValidationError =
      /challenge|credential|authentication|signature|origin|rp id|counter|verification|user verification/i.test(
        message
      );

    return NextResponse.json(
      {
        success:
          false,

        message:
          message ||
          "Biometric authentication failed.",
      },
      {
        status:
          isValidationError
            ? 400
            : 500,
      }
    );
  }
}