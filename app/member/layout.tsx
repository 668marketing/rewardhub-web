import type {
  Metadata,
  Viewport,
} from "next";

import MemberGuard from "@/components/auth/MemberGuard";
import MemberHeader from "@/components/layout/MemberHeader";

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

export default function MemberLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MemberGuard>
      <div className="min-h-screen bg-slate-50">
        <MemberHeader />

        {children}
      </div>
    </MemberGuard>
  );
}
