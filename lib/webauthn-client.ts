"use client";

import {
  createWebAuthnCredential,
  getWebAuthnCredential,
  getWebAuthnErrorMessage,
  getWebAuthnSupport,
  type AuthenticationCredentialJSON,
  type RegistrationCredentialJSON,
  type RewardHubPortal,
  type WebAuthnCreationOptionsJSON,
  type WebAuthnRequestOptionsJSON,
} from "@/lib/webauthn";

export type WebAuthnLanguage =
  | "en"
  | "zh"
  | "ms";

export type RewardHubDeviceInformation = {
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  deviceModel?: string;
  deviceOs?: string;
  browser?: string;
};

export type RegisterBiometricInput =
  RewardHubDeviceInformation & {
    userType:
      RewardHubPortal;
    userId: string;
    userName?: string;
    displayName?: string;
    language?:
      WebAuthnLanguage;
  };

export type AuthenticateBiometricInput =
  RewardHubDeviceInformation & {
    userType:
      RewardHubPortal;
    userId: string;
    language?:
      WebAuthnLanguage;
  };

export type BiometricRegistrationResult = {
  success: boolean;
  verified: boolean;
  biometricEnabled: boolean;
  challengeId: string;
  credentialId: string;
  deviceId: string;
  result?: unknown;
};

export type BiometricAuthenticationResult = {
  success: boolean;
  verified: boolean;
  authenticated: boolean;
  challengeId: string;
  credentialId: string;
  deviceId: string;
  userType:
    RewardHubPortal;
  userId: string;
  signCount?: number;
  result?: unknown;
};

type RegistrationOptionsResponse = {
  success: boolean;
  challengeId: string;
  options:
    WebAuthnCreationOptionsJSON;
  message?: string;
  code?: string;
};

type AuthenticationOptionsResponse = {
  success: boolean;
  challengeId: string;
  options:
    WebAuthnRequestOptionsJSON;
  message?: string;
  code?: string;
};

function clean(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function normalizeLanguage(
  value: unknown
): WebAuthnLanguage {
  if (
    value === "zh" ||
    value === "ms"
  ) {
    return value;
  }

  return "en";
}

function getFallbackMessage(
  language:
    WebAuthnLanguage
) {
  if (
    language === "zh"
  ) {
    return "生物识别操作失败，请重试。";
  }

  if (
    language === "ms"
  ) {
    return "Operasi biometrik gagal. Sila cuba lagi.";
  }

  return "Biometric operation failed. Please try again.";
}

async function readJsonResponse<
  Result
>(
  response: Response,
  language:
    WebAuthnLanguage
): Promise<Result> {
  const text =
    await response.text();

  let result:
    Record<
      string,
      unknown
    >;

  try {
    result =
      JSON.parse(
        text
      ) as Record<
        string,
        unknown
      >;
  } catch {
    throw new Error(
      text
        ? `Server returned non-JSON: ${text.slice(
            0,
            300
          )}`
        : getFallbackMessage(
            language
          )
    );
  }

  if (
    !response.ok ||
    result.success ===
      false
  ) {
    throw new Error(
      clean(
        result.message
      ) ||
      clean(
        result.error
      ) ||
      getFallbackMessage(
        language
      )
    );
  }

  return result as Result;
}

async function postJson<
  Result
>(
  url: string,
  body:
    Record<
      string,
      unknown
    >,
  language:
    WebAuthnLanguage
): Promise<Result> {
  const response =
    await fetch(
      url,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        cache:
          "no-store",

        credentials:
          "same-origin",

        body:
          JSON.stringify(
            body
          ),
      }
    );

  return readJsonResponse<Result>(
    response,
    language
  );
}

function validateCommonInput(
  input: {
    userType:
      RewardHubPortal;
    userId: string;
    deviceId: string;
  }
) {
  if (
    ![
      "MEMBER",
      "MERCHANT",
      "ADMIN",
    ].includes(
      input.userType
    )
  ) {
    throw new Error(
      "Invalid RewardHub user type."
    );
  }

  if (
    !clean(
      input.userId
    )
  ) {
    throw new Error(
      "Missing RewardHub user ID."
    );
  }

  if (
    !clean(
      input.deviceId
    )
  ) {
    throw new Error(
      "Missing RewardHub device ID."
    );
  }
}

export async function registerRewardHubBiometric(
  input:
    RegisterBiometricInput
): Promise<BiometricRegistrationResult> {
  const language =
    normalizeLanguage(
      input.language
    );

  validateCommonInput(
    input
  );

  try {
    const support =
      await getWebAuthnSupport();

    if (
      !support.supported
    ) {
      throw new Error(
        getWebAuthnErrorMessage(
          {
            name:
              "NotSupportedError",
          },
          language
        )
      );
    }

    const optionsResult =
      await postJson<RegistrationOptionsResponse>(
        "/api/security/webauthn/register/options",
        {
          userType:
            input.userType,

          userId:
            clean(
              input.userId
            ),

          userName:
            clean(
              input.userName
            ) ||
            clean(
              input.userId
            ),

          displayName:
            clean(
              input.displayName
            ) ||
            clean(
              input.userName
            ) ||
            clean(
              input.userId
            ),

          deviceId:
            clean(
              input.deviceId
            ),

          deviceName:
            clean(
              input.deviceName
            ),

          deviceType:
            clean(
              input.deviceType
            ),

          deviceModel:
            clean(
              input.deviceModel
            ),

          deviceOs:
            clean(
              input.deviceOs
            ),

          browser:
            clean(
              input.browser
            ),
        },
        language
      );

    if (
      !optionsResult
        .challengeId ||
      !optionsResult
        .options
    ) {
      throw new Error(
        "Registration options are incomplete."
      );
    }

    const credential:
      RegistrationCredentialJSON =
        await createWebAuthnCredential(
          optionsResult.options
        );

    const verifyResult =
      await postJson<BiometricRegistrationResult>(
        "/api/security/webauthn/register/verify",
        {
          challengeId:
            optionsResult
              .challengeId,

          userType:
            input.userType,

          userId:
            clean(
              input.userId
            ),

          deviceId:
            clean(
              input.deviceId
            ),

          deviceName:
            clean(
              input.deviceName
            ),

          deviceType:
            clean(
              input.deviceType
            ),

          deviceModel:
            clean(
              input.deviceModel
            ),

          deviceOs:
            clean(
              input.deviceOs
            ),

          browser:
            clean(
              input.browser
            ),

          credential,
        },
        language
      );

    return {
      ...verifyResult,

      challengeId:
        optionsResult
          .challengeId,
    };
  } catch (
    error
  ) {
    if (
      error instanceof
      Error &&
      error.message
    ) {
      throw error;
    }

    throw new Error(
      getWebAuthnErrorMessage(
        error,
        language
      )
    );
  }
}

export async function authenticateRewardHubBiometric(
  input:
    AuthenticateBiometricInput
): Promise<BiometricAuthenticationResult> {
  const language =
    normalizeLanguage(
      input.language
    );

  validateCommonInput(
    input
  );

  try {
    const support =
      await getWebAuthnSupport();

    if (
      !support.supported
    ) {
      throw new Error(
        getWebAuthnErrorMessage(
          {
            name:
              "NotSupportedError",
          },
          language
        )
      );
    }

    const optionsResult =
      await postJson<AuthenticationOptionsResponse>(
        "/api/security/webauthn/authenticate/options",
        {
          userType:
            input.userType,

          userId:
            clean(
              input.userId
            ),

          deviceId:
            clean(
              input.deviceId
            ),

          deviceName:
            clean(
              input.deviceName
            ),

          browser:
            clean(
              input.browser
            ),
        },
        language
      );

    if (
      !optionsResult
        .challengeId ||
      !optionsResult
        .options
    ) {
      throw new Error(
        "Authentication options are incomplete."
      );
    }

    const credential:
      AuthenticationCredentialJSON =
        await getWebAuthnCredential(
          optionsResult.options
        );

    const verifyResult =
      await postJson<BiometricAuthenticationResult>(
        "/api/security/webauthn/authenticate/verify",
        {
          challengeId:
            optionsResult
              .challengeId,

          userType:
            input.userType,

          userId:
            clean(
              input.userId
            ),

          deviceId:
            clean(
              input.deviceId
            ),

          deviceName:
            clean(
              input.deviceName
            ),

          browser:
            clean(
              input.browser
            ),

          credential,
        },
        language
      );

    return {
      ...verifyResult,

      challengeId:
        optionsResult
          .challengeId,
    };
  } catch (
    error
  ) {
    if (
      error instanceof
      Error &&
      error.message
    ) {
      throw error;
    }

    throw new Error(
      getWebAuthnErrorMessage(
        error,
        language
      )
    );
  }
}

export async function checkRewardHubBiometricSupport() {
  return getWebAuthnSupport();
}