import type { Metadata, Viewport } from "next";
import PWARegister from "./components/PWARegister";
import "./globals.css";
import SplashScreen from "@/components/pwa/SplashScreen";

export const metadata: Metadata = {
  title: {
    default: "RewardHub",
    template: "%s | RewardHub",
  },

  description:
    "RewardHub member rewards and merchant membership network.",

  applicationName: "RewardHub",

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
  themeColor: "#5B4FE8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SplashScreen />
        <PWARegister />
        {children}
      </body>
    </html>
  );
}