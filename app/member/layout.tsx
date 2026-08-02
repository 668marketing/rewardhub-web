import type {
  Metadata,
  Viewport,
} from "next";

import MemberGuard from "@/components/auth/MemberGuard";
import AppLock from "@/components/security/AppLock";

export const metadata: Metadata = {
  title: {
    default: "RewardHub",
    template: "%s | RewardHub",
  },
  description:
    "Access your RewardHub membership, rewards, points, orders and participating merchants.",
  applicationName: "RewardHub",
  manifest:
    "/member/manifest.webmanifest",
  icons: {
    icon: [
      {
        url:
          "/icons/member/icon-192.png",
        sizes:
          "192x192",
        type:
          "image/png",
      },
      {
        url:
          "/icons/member/icon-512.png",
        sizes:
          "512x512",
        type:
          "image/png",
      },
    ],
    apple: [
      {
        url:
          "/icons/member/apple-touch-icon.png",
        type:
          "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title:
      "RewardHub",
    statusBarStyle:
      "default",
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
    "#ffffff",
};

const MEMBER_PUBLIC_PATHS = [
  "/member/login",
  "/member/register",
  "/member/forgot-password",
  "/member/reset-password",
];

export default function MemberRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MemberGuard>
      <AppLock
        portal="MEMBER"
        publicPaths={
          MEMBER_PUBLIC_PATHS
        }
      >
        {children}
      </AppLock>
    </MemberGuard>
  );
}
