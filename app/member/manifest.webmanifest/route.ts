import type { MetadataRoute } from "next";

const manifest: MetadataRoute.Manifest = {
  id: "/member/",
  name: "RewardHub",
  short_name: "RewardHub",
  description:
    "Access your RewardHub membership, rewards, points, orders and participating merchants.",
  start_url: "/member/login",
  scope: "/member/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#ffffff",
  theme_color: "#ffffff",
  categories: ["shopping", "finance", "lifestyle"],
  icons: [
    {
      src: "/icons/member/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/member/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/member/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};

export function GET() {
  return Response.json(manifest, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/manifest+json; charset=utf-8",
    },
  });
}
