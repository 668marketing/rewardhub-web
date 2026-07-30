import type { MetadataRoute } from "next";

const manifest: MetadataRoute.Manifest = {
  id: "/merchant/",
  name: "RewardHub Business",
  short_name: "RH Business",
  description:
    "Manage your RewardHub business, transactions, orders, products, marketing and settlements.",
  start_url: "/merchant/login",
  scope: "/merchant/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#050505",
  theme_color: "#050505",
  categories: ["business", "finance", "productivity"],
  icons: [
    {
      src: "/icons/business/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/business/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/business/icon-maskable-512.png",
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
