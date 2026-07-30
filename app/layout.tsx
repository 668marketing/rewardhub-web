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