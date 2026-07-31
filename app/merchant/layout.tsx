import type {
  Metadata,
  Viewport,
} from "next";

import MerchantGuard from "@/components/auth/MerchantGuard";
import AppLock from "@/components/security/AppLock";

export const metadata: Metadata = {
  title: {
    default:
      "RewardHub Business",
    template:
      "%s | RewardHub Business",
  },
  description:
    "Manage your RewardHub business, transactions, orders, products, marketing and settlements.",
  applicationName:
    "RewardHub Business",
  manifest:
    "/merchant/manifest.webmanifest",
  icons: {
    icon: [
      {
        url:
          "/icons/business/icon-192.png",
        sizes:
          "192x192",
        type:
          "image/png",
      },
      {
        url:
          "/icons/business/icon-512.png",
        sizes:
          "512x512",
        type:
          "image/png",
      },
    ],
    apple: [
      {
        url:
          "/icons/business/apple-touch-icon.png",
        type:
          "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title:
      "RewardHub Business",
    statusBarStyle:
      "black-translucent",
  },
};

export const viewport: Viewport = {
  width:
    "device-width",
  initialScale:
    1,
  maximumScale:
    1,
  viewportFit:
    "cover",
  themeColor:
    "#050505",
};

export default function MerchantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MerchantGuard>
      <AppLock
        portal="MERCHANT"
        publicPaths={[
          "/merchant/login",
          "/merchant/register",
          "/merchant/forgot-password",
          "/merchant/reset-password",
        ]}
        lockAfterMs={20_000}
      >
        {children}
      </AppLock>
    </MerchantGuard>
  );
}