import type {
  Metadata,
  Viewport,
} from "next";

import LanguageProvider from "@/components/i18n/LanguageProvider";
import PWARegister from "@/components/pwa/PWARegister";
import SplashScreen from "@/components/pwa/SplashScreen";
import SupportModal from "@/components/chat/SupportModal";

import "./globals.css";

const APP_VARIANT =
  process.env.NEXT_PUBLIC_APP_VARIANT === "business"
    ? "business"
    : "member";

const IS_BUSINESS_APP =
  APP_VARIANT === "business";

const APP_NAME = IS_BUSINESS_APP
  ? "RewardHub Business"
  : "RewardHub";

const APP_DESCRIPTION = IS_BUSINESS_APP
  ? "Manage your RewardHub business, transactions, orders, products, marketing and settlements."
  : "Access your RewardHub membership, rewards, points, orders and participating merchants.";

const APP_MANIFEST = IS_BUSINESS_APP
  ? "/merchant/manifest.webmanifest"
  : "/member/manifest.webmanifest";

const APP_ICON_192 = IS_BUSINESS_APP
  ? "/icons/business/icon-192.png"
  : "/icons/member/icon-192.png";

const APP_ICON_512 = IS_BUSINESS_APP
  ? "/icons/business/icon-512.png"
  : "/icons/member/icon-512.png";

const APP_MASKABLE_ICON = IS_BUSINESS_APP
  ? "/icons/business/icon-maskable-512.png"
  : "/icons/member/icon-maskable-512.png";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },

  description: APP_DESCRIPTION,

  applicationName: APP_NAME,

  manifest: APP_MANIFEST,

  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },

  icons: {
    icon: [
      {
        url: APP_ICON_192,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: APP_ICON_512,
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: APP_ICON_192,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: APP_ICON_512,
        sizes: "512x512",
        type: "image/png",
      },
    ],

    other: [
      {
        rel: "mask-icon",
        url: APP_MASKABLE_ICON,
      },
    ],
  },

  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": APP_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: IS_BUSINESS_APP
    ? "#050505"
    : "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <LanguageProvider>
          <SplashScreen />

          <PWARegister />

          {children}

          <SupportModal />
        </LanguageProvider>
      </body>
    </html>
  );
}