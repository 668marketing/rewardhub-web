import { redirect } from "next/navigation";

const OFFICIAL_WEBSITE =
  "https://rewardhub-official.vercel.app";

type SearchParamValue =
  | string
  | string[]
  | undefined;

type PageProps = {
  searchParams?: Promise<
    Record<string, SearchParamValue>
  >;
};

export default async function MemberRegisterRedirectPage({
  searchParams,
}: PageProps) {
  const params =
    (await searchParams) ?? {};

  const query =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        typeof value === "string"
      ) {
        query.set(
          key,
          value
        );

        return;
      }

      if (
        Array.isArray(value)
      ) {
        value.forEach(
          (item) => {
            query.append(
              key,
              item
            );
          }
        );
      }
    }
  );

  const queryString =
    query.toString();

  const redirectUrl =
    queryString
      ? `${OFFICIAL_WEBSITE}/register?${queryString}`
      : `${OFFICIAL_WEBSITE}/register`;

  redirect(
    redirectUrl
  );
}