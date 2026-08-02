import "server-only";

import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

export type RewardHubUserType =
  | "MEMBER"
  | "MERCHANT"
  | "ADMIN";

export type WebAuthnStateCredential = {
  id: string;
  publicKey: string;
  counter: number;
  transports: string[];
  browser: string;
  deviceName: string;
};

export type WebAuthnAuthenticationState = {
  version: 1;

  challengeId: string;
  challenge: string;

  userType:
    RewardHubUserType;

  userId: string;
  deviceId: string;

  rpId: string;
  origin: string;

  expiresAt: number;

  credentials:
    WebAuthnStateCredential[];
};

function getSigningSecret() {
  const secret =
    String(
      process.env
        .WEBAUTHN_STATE_SECRET ||
      process.env
        .SECURITY_API_SECRET ||
      ""
    ).trim();

  if (!secret) {
    throw new Error(
      "WEBAUTHN_STATE_SECRET or SECURITY_API_SECRET is missing."
    );
  }

  return secret;
}

function encodeBase64Url(
  value: string
) {
  return Buffer
    .from(
      value,
      "utf8"
    )
    .toString(
      "base64url"
    );
}

function decodeBase64Url(
  value: string
) {
  return Buffer
    .from(
      value,
      "base64url"
    )
    .toString(
      "utf8"
    );
}

function createSignature(
  encodedPayload: string
) {
  return createHmac(
    "sha256",
    getSigningSecret()
  )
    .update(
      encodedPayload
    )
    .digest(
      "base64url"
    );
}

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

function normalizeState(
  value: unknown
):
  | WebAuthnAuthenticationState
  | null {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  const userType =
    normalizeUserType(
      record.userType
    );

  const credentials =
    Array.isArray(
      record.credentials
    )
      ? record.credentials
          .map(
            (
              item
            ) => {
              if (
                !item ||
                typeof item !==
                  "object" ||
                Array.isArray(
                  item
                )
              ) {
                return null;
              }

              const credential =
                item as Record<
                  string,
                  unknown
                >;

              const id =
                clean(
                  credential.id
                );

              const publicKey =
                clean(
                  credential.publicKey
                );

              if (
                !id ||
                !publicKey
              ) {
                return null;
              }

              return {
                id,

                publicKey,

                counter:
                  Number.isFinite(
                    Number(
                      credential.counter
                    )
                  )
                    ? Number(
                        credential.counter
                      )
                    : 0,

                transports:
                  Array.isArray(
                    credential.transports
                  )
                    ? credential.transports
                        .map(
                          (
                            transport
                          ) =>
                            clean(
                              transport
                            )
                        )
                        .filter(
                          Boolean
                        )
                    : [],

                browser:
                  clean(
                    credential.browser
                  ),

                deviceName:
                  clean(
                    credential.deviceName
                  ),
              };
            }
          )
          .filter(
            (
              item
            ): item is
              WebAuthnStateCredential =>
              Boolean(
                item
              )
          )
      : [];

  const normalized:
    WebAuthnAuthenticationState = {
      version:
        1,

      challengeId:
        clean(
          record.challengeId
        ),

      challenge:
        clean(
          record.challenge
        ),

      userType:
        userType ||
        "MEMBER",

      userId:
        clean(
          record.userId
        ),

      deviceId:
        clean(
          record.deviceId
        ),

      rpId:
        clean(
          record.rpId
        ),

      origin:
        clean(
          record.origin
        ),

      expiresAt:
        Number(
          record.expiresAt
        ),

      credentials,
    };

  if (
    record.version !== 1 ||
    !userType ||
    !normalized.challengeId ||
    !normalized.challenge ||
    !normalized.userId ||
    !normalized.deviceId ||
    !normalized.rpId ||
    !normalized.origin ||
    !Number.isFinite(
      normalized.expiresAt
    ) ||
    normalized.credentials.length ===
      0
  ) {
    return null;
  }

  normalized.userType =
    userType;

  return normalized;
}

export function createWebAuthnAuthenticationStateToken(
  state:
    WebAuthnAuthenticationState
) {
  const encodedPayload =
    encodeBase64Url(
      JSON.stringify(
        state
      )
    );

  const signature =
    createSignature(
      encodedPayload
    );

  return `${encodedPayload}.${signature}`;
}

export function verifyWebAuthnAuthenticationStateToken(
  token: string
):
  WebAuthnAuthenticationState {
  const normalizedToken =
    clean(
      token
    );

  const parts =
    normalizedToken.split(
      "."
    );

  if (
    parts.length !==
      2
  ) {
    throw new Error(
      "Invalid WebAuthn authentication state."
    );
  }

  const [
    encodedPayload,
    suppliedSignature,
  ] = parts;

  const expectedSignature =
    createSignature(
      encodedPayload
    );

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8"
    );

  const suppliedBuffer =
    Buffer.from(
      suppliedSignature,
      "utf8"
    );

  if (
    expectedBuffer.length !==
      suppliedBuffer.length ||
    !timingSafeEqual(
      expectedBuffer,
      suppliedBuffer
    )
  ) {
    throw new Error(
      "Invalid WebAuthn authentication state signature."
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        decodeBase64Url(
          encodedPayload
        )
      );
  } catch {
    throw new Error(
      "Invalid WebAuthn authentication state payload."
    );
  }

  const state =
    normalizeState(
      parsed
    );

  if (!state) {
    throw new Error(
      "Invalid WebAuthn authentication state data."
    );
  }

  if (
    state.expiresAt <=
      Date.now()
  ) {
    throw new Error(
      "WebAuthn authentication state has expired."
    );
  }

  return state;
}
