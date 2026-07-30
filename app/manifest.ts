import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",

    name: "RewardHub",
    short_name: "RewardHub",

    description:
      "Earn rewards, enjoy member benefits and discover participating merchants with RewardHub.",

    start_url: "/login",
    scope: "/",

    display: "standalone",
    orientation: "portrait",

    background_color: "#ffffff",
    theme_color: "#ffffff",

    categories: [
      "shopping",
      "business",
      "finance",
      "lifestyle",
    ],

    icons: [
  {
    src: "/icons/android-pwa-192.png?v=8",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/android-pwa-512.png?v=8",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/android-pwa-maskable-512.png?v=8",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
],
  };
}