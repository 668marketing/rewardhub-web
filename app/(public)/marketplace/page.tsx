import PublicLayout from "@/components/layout/PublicLayout";
import { fetchMarketplaceMerchants } from "@/lib/api";
import MarketplaceClient from "./MarketplaceClient";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{
    ref?: string;
  }>;
}) {
  const params = await searchParams;
  const ref = params.ref || "";

  const result = await fetchMarketplaceMerchants();

  const data =
    result?.data?.data ||
    result?.data ||
    result?.result ||
    result;

  const merchants = Array.isArray(data?.merchants)
    ? data.merchants
    : [];

  return (
    <PublicLayout>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),radial-gradient(circle_at_top_right,#fef3c7,transparent_30%),#f8fafc]">
        <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-16">
          <div className="rounded-[1.75rem] bg-slate-950 px-5 py-8 text-white shadow-2xl sm:rounded-[2rem] sm:px-8 sm:py-12 md:px-14 md:py-20">
            <div className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-blue-100 sm:mb-5 sm:px-4 sm:py-2 sm:text-sm">
              Malaysia Merchant Membership Network
            </div>

            <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Discover rewards near you.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-6 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
              Search partner merchants, enjoy instant member rewards, collect
              points and earn cashback with RewardHub.
            </p>
          </div>

          <MarketplaceClient
            merchants={merchants}
            refCode={ref}
          />
        </section>
      </main>
    </PublicLayout>
  );
}