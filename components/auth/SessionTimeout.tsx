"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TIMEOUT_MS = 10 * 60 * 1000;

export default function SessionTimeout({
  storageKey,
  loginPath,
}: {
  storageKey: string;
  loginPath: string;
}) {
  const router = useRouter();

  useEffect(() => {
    let timer: any;

    function logout() {
      localStorage.removeItem(storageKey);
      alert("Session expired. Please login again.");
      router.push(loginPath);
    }

    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(logout, TIMEOUT_MS);
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [router, storageKey, loginPath]);

  return null;
}