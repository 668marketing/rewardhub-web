"use client";

export default function SessionTimeout({
  storageKey: _storageKey,
  loginPath: _loginPath,
}: {
  storageKey: string;
  loginPath: string;
}) {
  /*
   * RewardHub no longer logs users out
   * automatically after inactivity.
   *
   * This component is intentionally kept
   * as a no-op so existing pages that still
   * render <SessionTimeout /> do not break.
   *
   * App locking and biometric verification
   * will be handled separately in the next
   * phase without deleting the login session.
   */
  return null;
}