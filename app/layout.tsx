import type {
  Metadata,
  Viewport,
} from "next";

import LanguageProvider from "@/components/i18n/LanguageProvider";
import PWARegister from "@/components/pwa/PWARegister";
import SplashScreen from "@/components/pwa/SplashScreen";
import SupportModal from "@/components/chat/SupportModal";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RewardHub",
    template: "%s | RewardHub",
  },

  description:
    "RewardHub member rewards and merchant membership network.",

  applicationName: "RewardHub",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    title: "RewardHub",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
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