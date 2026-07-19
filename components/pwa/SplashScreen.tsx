"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    // 普通浏览器不显示 Splash
    if (!isStandalone) {
      return;
    }

    setVisible(true);

    const hideTimer = window.setTimeout(() => {
      setLeaving(true);
    }, 1200);

    const removeTimer = window.setTimeout(() => {
      setVisible(false);
    }, 1700);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={[
        "fixed inset-0 z-[99999]",
        "flex items-center justify-center",
        "bg-[#050505]",
        "transition-all duration-500 ease-out",
        leaving
          ? "pointer-events-none scale-105 opacity-0"
          : "opacity-100 scale-100",
      ].join(" ")}
      style={{
        minHeight: "100dvh",
      }}
    >
      <div className="flex flex-col items-center text-center px-6">
        {/* Glow */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-yellow-400/25 blur-3xl scale-150" />

          <img
            src="/icons/icon-512.png"
            alt="RewardHub"
            className="relative h-32 w-32 rounded-[30px] shadow-2xl"
          />
        </div>

        <h1 className="mt-8 text-4xl font-black tracking-tight text-white">
          RewardHub
        </h1>

        <p className="mt-2 text-xs font-bold uppercase tracking-[0.35em] text-yellow-400">
          Merchant Membership Network
        </p>

        <div className="mt-10 flex gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-400 animate-bounce [animation-delay:-0.3s]" />

          <span className="h-2 w-2 rounded-full bg-yellow-400 animate-bounce [animation-delay:-0.15s]" />

          <span className="h-2 w-2 rounded-full bg-yellow-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}