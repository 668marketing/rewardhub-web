import type { MetadataRoute } from "next";

const IS_BUSINESS_APP =
  process.env.NEXT_PUBLIC_APP_VARIANT === "business";

export default function manifest(): MetadataRoute.Manifest {
  if (IS_BUSINESS_APP) {
    return {
      id: "/merchant/",

      name: "RewardHub Business",
      short_name: "RH Business",

      description:
        "Manage your RewardHub business, transactions, orders, products, marketing and settlements.",

      start_url: "/merchant/login",
      scope: "/",

      display: "standalone",
      orientation: "portrait",

      background_color: "#050505",
      theme_color: "#050505",

      categories: [
        "business",
        "finance",
        "productivity",
      ],

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
  }

  return {
    id: "/member/",

    name: "RewardHub",
    short_name: "RewardHub",

    description:
      "Access your RewardHub membership, rewards, points, orders and participating merchants.",

    start_url: "/member/login",
    scope: "/",

    display: "standalone",
    orientation: "portrait",

    background_color: "#ffffff",
    theme_color: "#ffffff",

    categories: [
      "shopping",
      "finance",
      "lifestyle",
    ],

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
}