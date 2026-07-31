import {
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
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

type RegistrationVerifyRequest = {
  challengeId?: string;

  userType?:
    RewardHubUserType;

  userId?: string;

  deviceId?: string;

  deviceName?: string;

  deviceType?: string;

  deviceModel?: string;

  deviceOs?: string;

  browser?: string;

  credential?:
    RegistrationResponseJSON;
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
) {
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

function uint8ArrayToBase64Url(
  value: Uint8Array
) {
  return Buffer
    .from(
      value
    )
    .toString(
      "base64"
    )
    .replace(
      /\+/g,
      "-"
    )
    .replace(
      /\//g,
      "_"
    )
    .replace(
      /=+$/g,
      ""
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

export async function POST(
  request: Request
) {
  try {
    const body =
      (
        await request.json()
      ) as RegistrationVerifyRequest;

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

    const credential =
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

    if (
      !credential ||
      typeof credential !==
        "object"
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Missing WebAuthn credential.",
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
            "REGISTRATION",

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
            "Registration challenge was not found.",
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
      "REGISTRATION"
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Invalid registration challenge purpose.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      challengeRecord
        .status !==
      "PENDING"
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Registration challenge is no longer active.",
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
            "Registration challenge identity does not match.",
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
      config.rpId
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Registration RP ID does not match the current server configuration.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      challengeRecord
        .origin !==
      config.origin
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Registration origin does not match the current server configuration.",
        },
        {
          status:
            400,
        }
      );
    }

    const verification =
      await verifyRegistrationResponse({
        response:
          credential,

        expectedChallenge:
          challengeRecord
            .challenge,

        expectedOrigin:
          challengeRecord
            .origin,

        expectedRPID:
          challengeRecord
            .rpId,

        requireUserVerification:
          true,
      });

    if (
      !verification.verified ||
      !verification.registrationInfo
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Biometric registration verification failed.",
        },
        {
          status:
            400,
        }
      );
    }

    const {
      credential:
        verifiedCredential,

      credentialDeviceType,

      credentialBackedUp,
    } =
      verification
        .registrationInfo;

    const credentialId =
      clean(
        verifiedCredential.id
      );

    const publicKey =
      uint8ArrayToBase64Url(
        verifiedCredential
          .publicKey
      );

    if (
      !credentialId ||
      !publicKey
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Verified credential information is incomplete.",
        },
        {
          status:
            400,
        }
      );
    }

    const finishResult =
      await rewardHubBackend(
        "finishWebAuthnRegistration",
        {
          verified:
            true,

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

          credentialId,

          publicKey,

          signCount:
            verifiedCredential
              .counter,

          transports:
            verifiedCredential
              .transports ||
            credential
              .response
              .transports ||
            [],

          credentialDeviceType,

          credentialBackedUp,

          isTrusted:
            true,

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

        biometricEnabled:
          true,

        credentialId,

        deviceId,

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
      "WebAuthn registration verification error:",
      error
    );

    const message =
      getErrorMessage(
        error
      );

    const isValidationError =
      /challenge|credential|registration|origin|rp id|verification|attestation|user verification/i.test(
        message
      );

    return NextResponse.json(
      {
        success:
          false,

        message:
          message ||
          "Biometric registration failed.",
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