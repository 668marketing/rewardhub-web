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

    background_color: "#F7F8FC",
    theme_color: "#5B4FE8",

    categories: [
      "shopping",
      "business",
      "finance",
      "lifestyle",
    ],

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}