"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SPLASH_SESSION_KEY = "rewardhub_splash_shown";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const navigatorWithStandalone = window.navigator as Navigator & {
      standalone?: boolean;
    };

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      navigatorWithStandalone.standalone === true;

    // 普通 Safari / Chrome 浏览器不显示
    if (!isStandalone) {
      return;
    }

    // 同一次开启 App 的期间，只显示一次
    const alreadyShown =
      window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true";

    if (alreadyShown) {
      return;
    }

    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true");

    const originalOverflow = document.body.style.overflow;
    const originalBackground = document.body.style.backgroundColor;

    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "#050505";

    setVisible(true);

    // 3.6 秒开始淡出
    const leaveTimer = window.setTimeout(() => {
      setLeaving(true);
    }, 3600);

    // 4.2 秒完全移除
    const removeTimer = window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = originalOverflow;
      document.body.style.backgroundColor = originalBackground;
    }, 4200);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);

      document.body.style.overflow = originalOverflow;
      document.body.style.backgroundColor = originalBackground;
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <>
      <div
        aria-label="RewardHub is loading"
        role="status"
        className={[
          "fixed inset-0 z-[99999]",
          "flex min-h-[100dvh] items-center justify-center",
          "overflow-hidden bg-[#050505]",
          "transition-[opacity,transform,filter]",
          "duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          leaving
            ? "pointer-events-none scale-[1.035] opacity-0 blur-sm"
            : "scale-100 opacity-100 blur-0",
        ].join(" ")}
        style={{
          paddingTop: "max(24px, env(safe-area-inset-top))",
          paddingRight: "max(24px, env(safe-area-inset-right))",
          paddingBottom: "max(24px, env(safe-area-inset-bottom))",
          paddingLeft: "max(24px, env(safe-area-inset-left))",
        }}
      >
        {/* Background effects */}
        <div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden"
        >
          <div className="splash-background-glow absolute left-1/2 top-[40%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/[0.09] blur-[110px]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_0%,transparent_58%)]" />

          <div className="splash-grid absolute inset-0 opacity-[0.025]" />

          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.025] to-transparent" />

          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {/* Main content */}
        <div className="relative flex w-full max-w-sm flex-col items-center text-center">
          {/* Logo */}
          <div className="splash-logo relative">
            <div className="splash-logo-ring absolute -inset-5 rounded-[2.5rem] border border-yellow-300/15" />

            <div className="splash-logo-glow absolute inset-0 scale-[1.45] rounded-full bg-yellow-400/25 blur-3xl" />

            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-1.5 shadow-[0_30px_90px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <Image
                src="/icons/icon-512.png"
                alt="RewardHub"
                width={144}
                height={144}
                priority
                className="h-32 w-32 rounded-[1.65rem] object-cover sm:h-36 sm:w-36"
              />
            </div>
          </div>

          {/* Brand */}
          <div className="splash-brand mt-8">
            <h1 className="text-[2.45rem] font-black leading-none tracking-[-0.045em] text-white">
              Reward
              <span className="text-yellow-400">Hub</span>
            </h1>

            <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent" />

            <p className="splash-tagline mt-4 text-[10px] font-bold uppercase tracking-[0.34em] text-yellow-300/90 sm:text-[11px]">
              Merchant Membership Network
            </p>
          </div>

          {/* Loading */}
          <div className="splash-loading mt-12 flex flex-col items-center">
            <div className="flex items-center gap-2.5">
              <span className="splash-dot splash-dot-one h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <span className="splash-dot splash-dot-two h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <span className="splash-dot splash-dot-three h-1.5 w-1.5 rounded-full bg-yellow-400" />
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
              Preparing your rewards
            </p>
          </div>
        </div>

        {/* Bottom progress */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div className="h-px w-full overflow-hidden bg-white/[0.05]">
            <div className="splash-progress h-full bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-500" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .splash-logo {
          opacity: 0;
          transform: translateY(18px) scale(0.76);
          animation: splash-logo-in 900ms
            cubic-bezier(0.16, 1, 0.3, 1) 120ms forwards;
        }

        .splash-brand {
          opacity: 0;
          transform: translateY(14px);
          animation: splash-content-in 700ms
            cubic-bezier(0.22, 1, 0.36, 1) 780ms forwards;
        }

        .splash-tagline {
          opacity: 0;
          transform: translateY(8px);
          animation: splash-content-in 650ms
            cubic-bezier(0.22, 1, 0.36, 1) 1250ms forwards;
        }

        .splash-loading {
          opacity: 0;
          transform: translateY(10px);
          animation: splash-content-in 600ms
            cubic-bezier(0.22, 1, 0.36, 1) 1650ms forwards;
        }

        .splash-logo-glow {
          animation: splash-glow 2200ms ease-in-out infinite;
        }

        .splash-logo-ring {
          opacity: 0;
          transform: scale(0.82);
          animation: splash-ring 2200ms ease-out 650ms infinite;
        }

        .splash-background-glow {
          animation: splash-background 3000ms ease-in-out infinite;
        }

        .splash-dot {
          opacity: 0.3;
          transform: translateY(0) scale(0.8);
          animation: splash-dot 1100ms ease-in-out infinite;
        }

        .splash-dot-one {
          animation-delay: 0ms;
        }

        .splash-dot-two {
          animation-delay: 160ms;
        }

        .splash-dot-three {
          animation-delay: 320ms;
        }

        .splash-progress {
          width: 0%;
          box-shadow: 0 0 16px rgba(250, 204, 21, 0.6);
          animation: splash-progress 3600ms
            cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }

        .splash-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.8) 1px,
              transparent 1px
            );
          background-size: 42px 42px;
          mask-image: radial-gradient(
            circle at center,
            black 0%,
            transparent 72%
          );
        }

        @keyframes splash-logo-in {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.76);
            filter: blur(8px);
          }

          65% {
            opacity: 1;
            transform: translateY(-3px) scale(1.035);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes splash-content-in {
          from {
            opacity: 0;
            transform: translateY(14px);
            filter: blur(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes splash-glow {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(1.3);
          }

          50% {
            opacity: 0.8;
            transform: scale(1.55);
          }
        }

        @keyframes splash-ring {
          0% {
            opacity: 0;
            transform: scale(0.82);
          }

          30% {
            opacity: 0.4;
          }

          100% {
            opacity: 0;
            transform: scale(1.22);
          }
        }

        @keyframes splash-background {
          0%,
          100% {
            opacity: 0.65;
            transform: translate(-50%, -50%) scale(0.92);
          }

          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.08);
          }
        }

        @keyframes splash-dot {
          0%,
          100% {
            opacity: 0.25;
            transform: translateY(0) scale(0.78);
          }

          50% {
            opacity: 1;
            transform: translateY(-5px) scale(1);
            box-shadow: 0 0 12px rgba(250, 204, 21, 0.75);
          }
        }

        @keyframes splash-progress {
          0% {
            width: 0%;
            opacity: 0.5;
          }

          18% {
            width: 20%;
          }

          48% {
            width: 58%;
          }

          76% {
            width: 82%;
          }

          100% {
            width: 100%;
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .splash-logo,
          .splash-brand,
          .splash-tagline,
          .splash-loading {
            opacity: 1;
            transform: none;
            filter: none;
            animation: none;
          }

          .splash-logo-glow,
          .splash-logo-ring,
          .splash-background-glow,
          .splash-dot {
            animation: none;
          }

          .splash-progress {
            width: 100%;
            animation: none;
          }
        }
      `}</style>
    </>
  );
}