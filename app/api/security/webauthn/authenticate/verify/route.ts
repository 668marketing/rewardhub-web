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
import {
  verifyWebAuthnAuthenticationStateToken,
} from "@/lib/server/webauthn-state";

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

function base64UrlToUint8Array(
  value: string
) {
  return new Uint8Array(
    Buffer.from(
      value,
      "base64url"
    )
  );
}

function normalizeTransports(
  value: string[]
): AuthenticatorTransportFuture[] {
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

  return value.filter(
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
      ) as AuthenticationVerifyRequest;

    const stateToken =
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

    if (!stateToken) {
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

    const state =
      verifyWebAuthnAuthenticationStateToken(
        stateToken
      );

    const config =
      getWebAuthnConfig();

    if (
      state.userType !==
        userType ||
      state.userId !==
        userId ||
      state.deviceId !==
        deviceId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Authentication state identity does not match.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      state.rpId !==
        config.rpId ||
      state.origin !==
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

    const returnedCredentialId =
      clean(
        responseCredential.id
      );

    const credentialRecord =
      state.credentials.find(
        (
          credential
        ) =>
          credential.id ===
            returnedCredentialId
      );

    if (
      !credentialRecord
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

    const storedCredential:
      WebAuthnCredential = {
        id:
          credentialRecord.id,

        publicKey:
          base64UrlToUint8Array(
            credentialRecord.publicKey
          ),

        counter:
          credentialRecord.counter,

        transports:
          normalizeTransports(
            credentialRecord.transports
          ),
      };

    const verification =
      await verifyAuthenticationResponse({
        response:
          responseCredential,

        expectedChallenge:
          state.challenge,

        expectedOrigin:
          state.origin,

        expectedRPID:
          state.rpId,

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

    /*
     * Only one Apps Script call remains after Face ID.
     * Apps Script still re-checks the pending challenge and
     * registered credential, updates the counter, marks the
     * challenge USED and writes the login audit record.
     */
    const finishResult =
      await rewardHubBackend(
        "finishWebAuthnAuthentication",
        {
          verified:
            true,

          challengeId:
            state.challengeId,

          userType,

          userId,

          deviceId,

          credentialId:
            credentialRecord.id,

          newSignCount,

          browser:
            clean(
              body.browser
            ) ||
            credentialRecord.browser,

          deviceName:
            clean(
              body.deviceName
            ) ||
            credentialRecord.deviceName,

          ip:
            getRequestIp(
              request
            ),
        },
        {
          timeoutMs:
            20_000,
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
          credentialRecord.id,

        signCount:
          newSignCount,

        result:
          finishResult,
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
      /challenge|credential|authentication|signature|origin|rp id|counter|verification|user verification|state/i.test(
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
