"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

type TawkPosition =
  | "tl"
  | "tr"
  | "cl"
  | "cr"
  | "bl"
  | "br";

type TawkCustomStyle = {
  visibility?: {
    desktop?: {
      position?: TawkPosition;
      xOffset?: number;
      yOffset?: number;
    };
    mobile?: {
      position?: TawkPosition;
      xOffset?: number;
      yOffset?: number;
    };
  };
  zIndex?: number | string;
};

declare global {
  interface Window {
    Tawk_API?: {
      customStyle?: TawkCustomStyle;

      onBeforeLoad?: () => void;
      onLoad?: () => void;
      onChatMinimized?: () => void;

      maximize?: () => void;
      minimize?: () => void;
      hideWidget?: () => boolean;

      isChatMaximized?: () => boolean;
    };

    Tawk_LoadStart?: Date;
  }
}

const TAWK_SCRIPT_URL =
  "https://embed.tawk.to/6a66a6f1e36efe1d4eb18b53/1jugfo851";

function shouldLoadChat(pathname: string): boolean {
  const isMemberPortal =
    pathname === "/member" ||
    pathname.startsWith("/member/");

  const isMerchantPortal =
    pathname === "/merchant" ||
    pathname.startsWith("/merchant/");

  if (!isMemberPortal && !isMerchantPortal) {
    return false;
  }

  const excludedPaths = [
    "/member/login",
    "/member/register",
    "/member/forgot-password",
    "/member/reset-password",

    "/merchant/login",
    "/merchant/register",
    "/merchant/forgot-password",
    "/merchant/reset-password",
  ];

  return !excludedPaths.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(`${path}/`)
  );
}

export default function TawkChat() {
  const pathname = usePathname();
  const shouldLoad = shouldLoadChat(pathname || "");

  useEffect(() => {
    if (!shouldLoad) {
      window.Tawk_API?.hideWidget?.();
    }
  }, [shouldLoad]);

  if (!shouldLoad) {
    return null;
  }

  function prepareTawk(): void {
    window.Tawk_API =
      window.Tawk_API || {};

    window.Tawk_LoadStart =
      new Date();

    window.Tawk_API.customStyle = {
      visibility: {
        desktop: {
          position: "tr",
          xOffset: 20,
          yOffset: 105,
        },
        mobile: {
          position: "br",
          xOffset: 12,
          yOffset: 80,
        },
      },
      zIndex: "9999",
    };

    window.Tawk_API.onBeforeLoad = () => {
      window.Tawk_API?.hideWidget?.();
    };

    window.Tawk_API.onLoad = () => {
      window.Tawk_API?.hideWidget?.();
    };

    window.Tawk_API.onChatMinimized = () => {
      window.setTimeout(() => {
        window.Tawk_API?.hideWidget?.();
      }, 100);
    };
  }

  return (
    <Script
      id="rewardhub-tawk-chat"
      src={TAWK_SCRIPT_URL}
      strategy="afterInteractive"
      crossOrigin="anonymous"
      onLoad={prepareTawk}
      onReady={prepareTawk}
    />
  );
}