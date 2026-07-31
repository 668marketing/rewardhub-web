import "server-only";

export type RewardHubWebAuthnConfig = {
  rpName: string;
  rpId: string;
  origin: string;
  challengeTtlSeconds: number;
};

const DEFAULT_CHALLENGE_TTL_SECONDS =
  300;

function readRequiredEnvironmentVariable(
  key: string
) {
  const value =
    String(
      process.env[key] || ""
    ).trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}`
    );
  }

  return value;
}

function normalizeRpId(
  value: string
) {
  const rpId =
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .split(":")[0];

  if (!rpId) {
    throw new Error(
      "WEBAUTHN_RP_ID is invalid."
    );
  }

  return rpId;
}

function normalizeOrigin(
  value: string
) {
  const raw =
    String(value || "")
      .trim()
      .replace(/\/+$/, "");

  let parsed: URL;

  try {
    parsed =
      new URL(raw);
  } catch {
    throw new Error(
      "WEBAUTHN_ORIGIN must be a complete URL."
    );
  }

  const isLocalhost =
    parsed.hostname ===
      "localhost" ||
    parsed.hostname ===
      "127.0.0.1";

  if (
    parsed.protocol !==
      "https:" &&
    !isLocalhost
  ) {
    throw new Error(
      "WEBAUTHN_ORIGIN must use HTTPS outside localhost."
    );
  }

  return parsed.origin;
}

function readChallengeTtlSeconds() {
  const raw =
    Number(
      process.env
        .WEBAUTHN_CHALLENGE_TTL_SECONDS ||
        DEFAULT_CHALLENGE_TTL_SECONDS
    );

  if (
    !Number.isFinite(raw) ||
    raw < 60 ||
    raw > 900
  ) {
    return DEFAULT_CHALLENGE_TTL_SECONDS;
  }

  return Math.floor(raw);
}

export function getWebAuthnConfig():
  RewardHubWebAuthnConfig {
  const rpName =
    readRequiredEnvironmentVariable(
      "WEBAUTHN_RP_NAME"
    );

  const rpId =
    normalizeRpId(
      readRequiredEnvironmentVariable(
        "WEBAUTHN_RP_ID"
      )
    );

  const origin =
    normalizeOrigin(
      readRequiredEnvironmentVariable(
        "WEBAUTHN_ORIGIN"
      )
    );

  const originHostname =
    new URL(origin).hostname;

  const rpMatchesOrigin =
    originHostname === rpId ||
    originHostname.endsWith(
      `.${rpId}`
    );

  if (!rpMatchesOrigin) {
    throw new Error(
      "WEBAUTHN_RP_ID must match WEBAUTHN_ORIGIN or its parent domain."
    );
  }

  return {
    rpName,
    rpId,
    origin,
    challengeTtlSeconds:
      readChallengeTtlSeconds(),
  };
}