import { redirect } from "next/navigation";

import PublicHomePage from "@/components/layout/PublicHomePage";

export default function Home() {
  const appVariant =
    process.env.NEXT_PUBLIC_APP_VARIANT === "business"
      ? "business"
      : "member";

  if (appVariant === "business") {
    redirect("/merchant/login");
  }

  return <PublicHomePage />;
}
