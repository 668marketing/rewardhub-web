import { redirect } from "next/navigation";

const OFFICIAL_WEBSITE =
  "https://rewardhub-official.vercel.app";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RedirectPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => query.append(key, item));
      } else if (typeof value === "string") {
        query.set(key, value);
      }
    });
  }

  const suffix = query.toString()
    ? `?${query.toString()}`
    : "";

  redirect(`${OFFICIAL_WEBSITE}/marketplace${suffix}`);
}
