import { redirect } from "next/navigation";

const APP_VARIANT =
  process.env.NEXT_PUBLIC_APP_VARIANT === "business"
    ? "business"
    : "member";

export default function Home() {
  if (APP_VARIANT === "business") {
    redirect("/merchant/login");
  }

  redirect("/login");
}
