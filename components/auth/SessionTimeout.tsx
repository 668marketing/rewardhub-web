"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  useRouter,
} from "next/navigation";

type SessionTimeoutProps = {
  storageKey: string;
  loginPath: string;
};

const BACKGROUND_TIMEOUT_MS =
  10 * 60 * 1000;

const BACKGROUND_STORAGE_PREFIX =
  "rewardhub_background_at";

function getBackgroundStorageKey(
  storageKey: string
) {
  return `${BACKGROUND_STORAGE_PREFIX}_${storageKey}`;
}

function hasStoredAccount(
  storageKey: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  return Boolean(
    localStorage.getItem(
      storageKey
    )
  );
}

function saveBackgroundTime(
  storageKey: string
) {
  if (
    typeof window ===
    "undefined" ||
    !hasStoredAccount(
      storageKey
    )
  ) {
    return;
  }

  localStorage.setItem(
    getBackgroundStorageKey(
      storageKey
    ),

    String(
      Date.now()
    )
  );
}

function getBackgroundTime(
  storageKey: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const raw =
    localStorage.getItem(
      getBackgroundStorageKey(
        storageKey
      )
    );

  if (!raw) {
    return null;
  }

  const parsed =
    Number(
      raw
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}

function clearBackgroundTime(
  storageKey: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    getBackgroundStorageKey(
      storageKey
    )
  );
}

function clearPortalSession(
  storageKey: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    storageKey
  );

  localStorage.removeItem(
    "rewardhub_session"
  );

  localStorage.removeItem(
    getBackgroundStorageKey(
      storageKey
    )
  );

  sessionStorage.removeItem(
    "rewardhub_tawk_identity"
  );
}

export default function SessionTimeout({
  storageKey,
  loginPath,
}: SessionTimeoutProps) {
  const router =
    useRouter();

  const isLoggingOutRef =
    useRef(false);

  useEffect(() => {
    function logout() {
      if (
        isLoggingOutRef.current
      ) {
        return;
      }

      isLoggingOutRef.current =
        true;

      clearPortalSession(
        storageKey
      );

      router.replace(
        loginPath
      );

      router.refresh();
    }

    function checkTimeout() {
      if (
        !hasStoredAccount(
          storageKey
        )
      ) {
        clearBackgroundTime(
          storageKey
        );

        return;
      }

      const backgroundAt =
        getBackgroundTime(
          storageKey
        );

      if (!backgroundAt) {
        return;
      }

      const elapsed =
        Date.now() -
        backgroundAt;

      if (
        elapsed >=
        BACKGROUND_TIMEOUT_MS
      ) {
        logout();

        return;
      }

      /*
       * The user returned within 10 minutes.
       * Clear the old timestamp so the next
       * background period starts fresh.
       */
      clearBackgroundTime(
        storageKey
      );
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        saveBackgroundTime(
          storageKey
        );

        return;
      }

      if (
        document.visibilityState ===
        "visible"
      ) {
        checkTimeout();
      }
    }

    function handlePageHide() {
      saveBackgroundTime(
        storageKey
      );
    }

    function handlePageShow() {
      checkTimeout();
    }

    function handleFocus() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        checkTimeout();
      }
    }

    /*
     * Covers Safari/PWA being terminated while
     * the app was in the background.
     */
    checkTimeout();

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "pagehide",
      handlePageHide
    );

    window.addEventListener(
      "pageshow",
      handlePageShow
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "pagehide",
        handlePageHide
      );

      window.removeEventListener(
        "pageshow",
        handlePageShow
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [
    loginPath,
    router,
    storageKey,
  ]);

  return null;
}
