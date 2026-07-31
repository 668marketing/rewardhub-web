"use client";

export type RewardHubPortal =
  | "MEMBER"
  | "MERCHANT"
  | "ADMIN";

export type WebAuthnSupport = {
  supported: boolean;
  secureContext: boolean;
  platformAuthenticatorAvailable: boolean;
  conditionalMediationAvailable: boolean;
  reason:
    | "SUPPORTED"
    | "SERVER_RENDER"
    | "INSECURE_CONTEXT"
    | "PUBLIC_KEY_CREDENTIAL_UNAVAILABLE"
    | "CREDENTIALS_API_UNAVAILABLE"
    | "PLATFORM_AUTHENTICATOR_UNAVAILABLE"
    | "UNKNOWN_ERROR";
};

export type WebAuthnCredentialDescriptorJSON = {
  id: string;
  type: PublicKeyCredentialType;
  transports?: AuthenticatorTransport[];
};

export type WebAuthnCreationOptionsJSON = {
  challenge: string;

  rp: {
    id?: string;
    name: string;
  };

  user: {
    id: string;
    name: string;
    displayName: string;
  };

  pubKeyCredParams: PublicKeyCredentialParameters[];

  timeout?: number;

  excludeCredentials?: WebAuthnCredentialDescriptorJSON[];

  authenticatorSelection?: AuthenticatorSelectionCriteria;

  attestation?: AttestationConveyancePreference;

  extensions?: AuthenticationExtensionsClientInputs;
};

export type WebAuthnRequestOptionsJSON = {
  challenge: string;

  timeout?: number;

  rpId?: string;

  allowCredentials?: WebAuthnCredentialDescriptorJSON[];

  userVerification?: UserVerificationRequirement;

  extensions?: AuthenticationExtensionsClientInputs;
};

export type RegistrationCredentialJSON = {
  id: string;
  rawId: string;
  type: PublicKeyCredentialType;

  authenticatorAttachment:
    | AuthenticatorAttachment
    | null;

  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports: AuthenticatorTransport[];
    publicKeyAlgorithm: number | null;
    publicKey: string | null;
    authenticatorData: string | null;
  };

  clientExtensionResults:
    AuthenticationExtensionsClientOutputs;
};

export type AuthenticationCredentialJSON = {
  id: string;
  rawId: string;
  type: PublicKeyCredentialType;

  authenticatorAttachment:
    | AuthenticatorAttachment
    | null;

  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string | null;
  };

  clientExtensionResults:
    AuthenticationExtensionsClientOutputs;
};

export type WebAuthnErrorCode =
  | "NOT_SUPPORTED"
  | "NOT_ALLOWED"
  | "INVALID_STATE"
  | "SECURITY_ERROR"
  | "ABORTED"
  | "TIMEOUT"
  | "UNKNOWN";

export class RewardHubWebAuthnError extends Error {
  readonly code: WebAuthnErrorCode;

  readonly originalError:
    | unknown;

  constructor(
    code: WebAuthnErrorCode,
    message: string,
    originalError?: unknown
  ) {
    super(message);

    this.name =
      "RewardHubWebAuthnError";

    this.code =
      code;

    this.originalError =
      originalError;
  }
}

function isBrowser() {
  return (
    typeof window !==
      "undefined" &&
    typeof navigator !==
      "undefined"
  );
}

function normalizeBase64Url(
  value: string
) {
  return String(
    value || ""
  )
    .trim()
    .replace(
      /-/g,
      "+"
    )
    .replace(
      /_/g,
      "/"
    );
}

function addBase64Padding(
  value: string
) {
  const remainder =
    value.length % 4;

  if (
    remainder === 0
  ) {
    return value;
  }

  return (
    value +
    "=".repeat(
      4 - remainder
    )
  );
}

export function base64UrlToArrayBuffer(
  value: string
): ArrayBuffer {
  const normalized =
    addBase64Padding(
      normalizeBase64Url(
        value
      )
    );

  let binary: string;

  try {
    binary =
      atob(
        normalized
      );
  } catch (
    error
  ) {
    throw new RewardHubWebAuthnError(
      "UNKNOWN",
      "Invalid Base64URL value.",
      error
    );
  }

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let index = 0;
    index <
    binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(
        index
      );
  }

  return bytes.buffer;
}

export function arrayBufferToBase64Url(
  value:
    | ArrayBuffer
    | ArrayBufferView
): string {
  let bytes:
    Uint8Array;

  if (
    value instanceof
    ArrayBuffer
  ) {
    bytes =
      new Uint8Array(
        value
      );
  } else {
    bytes =
      new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength
      );
  }

  let binary =
    "";

  const chunkSize =
    0x8000;

  for (
    let offset = 0;
    offset <
    bytes.length;
    offset +=
    chunkSize
  ) {
    const chunk =
      bytes.subarray(
        offset,
        Math.min(
          offset +
            chunkSize,
          bytes.length
        )
      );

    binary +=
      String.fromCharCode(
        ...chunk
      );
  }

  return btoa(
    binary
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

function descriptorFromJSON(
  descriptor:
    WebAuthnCredentialDescriptorJSON
): PublicKeyCredentialDescriptor {
  return {
    id:
      base64UrlToArrayBuffer(
        descriptor.id
      ),

    type:
      descriptor.type,

    transports:
      descriptor.transports,
  };
}

export function creationOptionsFromJSON(
  options:
    WebAuthnCreationOptionsJSON
): PublicKeyCredentialCreationOptions {
  return {
    challenge:
      base64UrlToArrayBuffer(
        options.challenge
      ),

    rp:
      options.rp,

    user: {
      id:
        base64UrlToArrayBuffer(
          options.user.id
        ),

      name:
        options.user.name,

      displayName:
        options.user.displayName,
    },

    pubKeyCredParams:
      options.pubKeyCredParams,

    timeout:
      options.timeout,

    excludeCredentials:
      options.excludeCredentials?.map(
        descriptorFromJSON
      ),

    authenticatorSelection:
      options.authenticatorSelection,

    attestation:
      options.attestation,

    extensions:
      options.extensions,
  };
}

export function requestOptionsFromJSON(
  options:
    WebAuthnRequestOptionsJSON
): PublicKeyCredentialRequestOptions {
  return {
    challenge:
      base64UrlToArrayBuffer(
        options.challenge
      ),

    timeout:
      options.timeout,

    rpId:
      options.rpId,

    allowCredentials:
      options.allowCredentials?.map(
        descriptorFromJSON
      ),

    userVerification:
      options.userVerification,

    extensions:
      options.extensions,
  };
}

function getAuthenticatorTransports(
  response:
    AuthenticatorAttestationResponse
): AuthenticatorTransport[] {
  try {
    if (
      typeof response.getTransports ===
      "function"
    ) {
      const transports =
        response.getTransports();

      return transports.map(
        (transport) =>
          transport as AuthenticatorTransport
      );
    }
  } catch {
    return [];
  }

  return [];
}

function getPublicKeyAlgorithm(
  response:
    AuthenticatorAttestationResponse
): number | null {
  try {
    if (
      typeof response.getPublicKeyAlgorithm ===
      "function"
    ) {
      return response.getPublicKeyAlgorithm();
    }
  } catch {
    return null;
  }

  return null;
}

function getPublicKey(
  response:
    AuthenticatorAttestationResponse
): string | null {
  try {
    if (
      typeof response.getPublicKey ===
      "function"
    ) {
      const value =
        response.getPublicKey();

      return value
        ? arrayBufferToBase64Url(
            value
          )
        : null;
    }
  } catch {
    return null;
  }

  return null;
}

function getAuthenticatorData(
  response:
    AuthenticatorAttestationResponse
): string | null {
  try {
    if (
      typeof response.getAuthenticatorData ===
      "function"
    ) {
      const value =
        response.getAuthenticatorData();

      return value
        ? arrayBufferToBase64Url(
            value
          )
        : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function serializeRegistrationCredential(
  credential:
    PublicKeyCredential
): RegistrationCredentialJSON {
  const response =
    credential.response;

  if (
    !(
      response instanceof
      AuthenticatorAttestationResponse
    )
  ) {
    throw new RewardHubWebAuthnError(
      "UNKNOWN",
      "Invalid WebAuthn registration response."
    );
  }

  return {
    id:
      credential.id,

    rawId:
      arrayBufferToBase64Url(
        credential.rawId
      ),

    type:
  credential.type as PublicKeyCredentialType,

    authenticatorAttachment:
  credential.authenticatorAttachment as
    | AuthenticatorAttachment
    | null,

    response: {
      clientDataJSON:
        arrayBufferToBase64Url(
          response.clientDataJSON
        ),

      attestationObject:
        arrayBufferToBase64Url(
          response.attestationObject
        ),

      transports:
        getAuthenticatorTransports(
          response
        ),

      publicKeyAlgorithm:
        getPublicKeyAlgorithm(
          response
        ),

      publicKey:
        getPublicKey(
          response
        ),

      authenticatorData:
        getAuthenticatorData(
          response
        ),
    },

    clientExtensionResults:
      credential.getClientExtensionResults(),
  };
}

export function serializeAuthenticationCredential(
  credential:
    PublicKeyCredential
): AuthenticationCredentialJSON {
  const response =
    credential.response;

  if (
    !(
      response instanceof
      AuthenticatorAssertionResponse
    )
  ) {
    throw new RewardHubWebAuthnError(
      "UNKNOWN",
      "Invalid WebAuthn authentication response."
    );
  }

  return {
    id:
      credential.id,

    rawId:
      arrayBufferToBase64Url(
        credential.rawId
      ),

   type:
  credential.type as PublicKeyCredentialType,

    authenticatorAttachment:
  credential.authenticatorAttachment as
    | AuthenticatorAttachment
    | null,

    response: {
      clientDataJSON:
        arrayBufferToBase64Url(
          response.clientDataJSON
        ),

      authenticatorData:
        arrayBufferToBase64Url(
          response.authenticatorData
        ),

      signature:
        arrayBufferToBase64Url(
          response.signature
        ),

      userHandle:
        response.userHandle
          ? arrayBufferToBase64Url(
              response.userHandle
            )
          : null,
    },

    clientExtensionResults:
      credential.getClientExtensionResults(),
  };
}

function convertWebAuthnError(
  error: unknown
): RewardHubWebAuthnError {
  if (
    error instanceof
    RewardHubWebAuthnError
  ) {
    return error;
  }

  if (
    error instanceof
    DOMException
  ) {
    if (
      error.name ===
      "NotAllowedError"
    ) {
      return new RewardHubWebAuthnError(
        "NOT_ALLOWED",
        "Biometric verification was cancelled, timed out, or not allowed.",
        error
      );
    }

    if (
      error.name ===
      "InvalidStateError"
    ) {
      return new RewardHubWebAuthnError(
        "INVALID_STATE",
        "This biometric credential is already registered on this device.",
        error
      );
    }

    if (
      error.name ===
      "SecurityError"
    ) {
      return new RewardHubWebAuthnError(
        "SECURITY_ERROR",
        "WebAuthn security validation failed. Check the website domain and HTTPS connection.",
        error
      );
    }

    if (
      error.name ===
      "AbortError"
    ) {
      return new RewardHubWebAuthnError(
        "ABORTED",
        "Biometric verification was stopped.",
        error
      );
    }

    if (
      error.name ===
      "NotSupportedError"
    ) {
      return new RewardHubWebAuthnError(
        "NOT_SUPPORTED",
        "This browser or device does not support the requested biometric method.",
        error
      );
    }
  }

  if (
    error instanceof
    Error
  ) {
    return new RewardHubWebAuthnError(
      "UNKNOWN",
      error.message ||
        "Biometric verification failed.",
      error
    );
  }

  return new RewardHubWebAuthnError(
    "UNKNOWN",
    "Biometric verification failed.",
    error
  );
}

export function isWebAuthnAvailable() {
  return Boolean(
    isBrowser() &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !==
      "undefined" &&
    navigator.credentials
  );
}

export async function getWebAuthnSupport():
  Promise<WebAuthnSupport> {
  if (
    !isBrowser()
  ) {
    return {
      supported:
        false,
      secureContext:
        false,
      platformAuthenticatorAvailable:
        false,
      conditionalMediationAvailable:
        false,
      reason:
        "SERVER_RENDER",
    };
  }

  const secureContext =
    window.isSecureContext;

  if (
    !secureContext
  ) {
    return {
      supported:
        false,
      secureContext:
        false,
      platformAuthenticatorAvailable:
        false,
      conditionalMediationAvailable:
        false,
      reason:
        "INSECURE_CONTEXT",
    };
  }

  if (
    typeof window.PublicKeyCredential ===
    "undefined"
  ) {
    return {
      supported:
        false,
      secureContext:
        true,
      platformAuthenticatorAvailable:
        false,
      conditionalMediationAvailable:
        false,
      reason:
        "PUBLIC_KEY_CREDENTIAL_UNAVAILABLE",
    };
  }

  if (
    !navigator.credentials
  ) {
    return {
      supported:
        false,
      secureContext:
        true,
      platformAuthenticatorAvailable:
        false,
      conditionalMediationAvailable:
        false,
      reason:
        "CREDENTIALS_API_UNAVAILABLE",
    };
  }

  try {
    const platformAuthenticatorAvailable =
      await PublicKeyCredential
        .isUserVerifyingPlatformAuthenticatorAvailable();

    let conditionalMediationAvailable =
      false;

    try {
      const publicKeyCredential =
        PublicKeyCredential as typeof PublicKeyCredential & {
          isConditionalMediationAvailable?:
            () =>
              Promise<boolean>;
        };

      if (
        typeof publicKeyCredential
          .isConditionalMediationAvailable ===
        "function"
      ) {
        conditionalMediationAvailable =
          await publicKeyCredential
            .isConditionalMediationAvailable();
      }
    } catch {
      conditionalMediationAvailable =
        false;
    }

    return {
      supported:
        platformAuthenticatorAvailable,

      secureContext:
        true,

      platformAuthenticatorAvailable,

      conditionalMediationAvailable,

      reason:
        platformAuthenticatorAvailable
          ? "SUPPORTED"
          : "PLATFORM_AUTHENTICATOR_UNAVAILABLE",
    };
  } catch {
    return {
      supported:
        false,
      secureContext:
        true,
      platformAuthenticatorAvailable:
        false,
      conditionalMediationAvailable:
        false,
      reason:
        "UNKNOWN_ERROR",
    };
  }
}

export async function createWebAuthnCredential(
  options:
    WebAuthnCreationOptionsJSON,
  signal?:
    AbortSignal
): Promise<RegistrationCredentialJSON> {
  if (
    !isWebAuthnAvailable()
  ) {
    throw new RewardHubWebAuthnError(
      "NOT_SUPPORTED",
      "WebAuthn is not available on this browser or connection."
    );
  }

  try {
    const credential =
      await navigator.credentials.create({
        publicKey:
          creationOptionsFromJSON(
            options
          ),
        signal,
      });

    if (
      !(
        credential instanceof
        PublicKeyCredential
      )
    ) {
      throw new RewardHubWebAuthnError(
        "UNKNOWN",
        "No WebAuthn registration credential was returned."
      );
    }

    return serializeRegistrationCredential(
      credential
    );
  } catch (
    error
  ) {
    throw convertWebAuthnError(
      error
    );
  }
}

export async function getWebAuthnCredential(
  options:
    WebAuthnRequestOptionsJSON,
  signal?:
    AbortSignal
): Promise<AuthenticationCredentialJSON> {
  if (
    !isWebAuthnAvailable()
  ) {
    throw new RewardHubWebAuthnError(
      "NOT_SUPPORTED",
      "WebAuthn is not available on this browser or connection."
    );
  }

  try {
    const credential =
      await navigator.credentials.get({
        publicKey:
          requestOptionsFromJSON(
            options
          ),
        signal,
      });

    if (
      !(
        credential instanceof
        PublicKeyCredential
      )
    ) {
      throw new RewardHubWebAuthnError(
        "UNKNOWN",
        "No WebAuthn authentication credential was returned."
      );
    }

    return serializeAuthenticationCredential(
      credential
    );
  } catch (
    error
  ) {
    throw convertWebAuthnError(
      error
    );
  }
}

export function getWebAuthnErrorMessage(
  error: unknown,
  language:
    | "en"
    | "zh"
    | "ms" =
    "en"
) {
  const resolved =
    convertWebAuthnError(
      error
    );

  const messages = {
    en: {
      NOT_SUPPORTED:
        "Biometric verification is not supported on this device or browser.",
      NOT_ALLOWED:
        "Verification was cancelled, timed out, or not approved.",
      INVALID_STATE:
        "Biometric access is already registered on this device.",
      SECURITY_ERROR:
        "Security verification failed. Please use RewardHub through its official HTTPS domain.",
      ABORTED:
        "Biometric verification was stopped.",
      TIMEOUT:
        "Biometric verification timed out.",
      UNKNOWN:
        "Biometric verification failed. Please try again.",
    },

    zh: {
      NOT_SUPPORTED:
        "此设备或浏览器不支持生物识别验证。",
      NOT_ALLOWED:
        "验证已取消、超时或未获批准。",
      INVALID_STATE:
        "此设备已经注册了生物识别解锁。",
      SECURITY_ERROR:
        "安全验证失败。请通过 RewardHub 官方 HTTPS 域名使用此功能。",
      ABORTED:
        "生物识别验证已停止。",
      TIMEOUT:
        "生物识别验证已超时。",
      UNKNOWN:
        "生物识别验证失败，请重试。",
    },

    ms: {
      NOT_SUPPORTED:
        "Pengesahan biometrik tidak disokong pada peranti atau pelayar ini.",
      NOT_ALLOWED:
        "Pengesahan dibatalkan, tamat masa atau tidak diluluskan.",
      INVALID_STATE:
        "Akses biometrik telah didaftarkan pada peranti ini.",
      SECURITY_ERROR:
        "Pengesahan keselamatan gagal. Sila gunakan domain HTTPS rasmi RewardHub.",
      ABORTED:
        "Pengesahan biometrik telah dihentikan.",
      TIMEOUT:
        "Pengesahan biometrik telah tamat masa.",
      UNKNOWN:
        "Pengesahan biometrik gagal. Sila cuba lagi.",
    },
  } as const;

  return messages[
    language
  ][
    resolved.code
  ];
}