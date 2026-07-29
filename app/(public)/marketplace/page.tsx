import PublicLayout from "@/components/layout/PublicLayout";
import { fetchMarketplaceMerchants } from "@/lib/api";

import MarketplaceClient from "./MarketplaceClient";
import MarketplaceHero from "./MarketplaceHero";

type MarketplacePageProps = {
  searchParams: Promise<{
    ref?: string;
  }>;
};

export default async function MarketplacePage({
  searchParams,
}: MarketplacePageProps) {
  const params = await searchParams;
  const refCode = params.ref?.trim() || "";

  const result = await fetchMarketplaceMerchants();

  const data =
    result?.data?.data ??
    result?.data ??
    result?.result ??
    result;

  const merchants = Array.isArray(data?.merchants)
    ? data.merchants
    : [];

  return (
    <PublicLayout>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),radial-gradient(circle_at_top_right,#fef3c7,transparent_30%),#f8fafc]">
        <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-16">
          <MarketplaceHero />

          <MarketplaceClient
            merchants={merchants}
            refCode={refCode}
          />
        </section>
      </main>
    </PublicLayout>
  );
}