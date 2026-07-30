export default function MarketplaceLoading() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto w-full max-w-7xl">
        {/* Hero loading */}
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-8 sm:p-12 lg:p-16">
          <div className="h-8 w-52 animate-pulse rounded-full bg-white/10" />

          <div className="mt-8 h-16 w-full max-w-3xl animate-pulse rounded-2xl bg-white/10 sm:h-24" />

          <div className="mt-5 h-6 w-full max-w-2xl animate-pulse rounded-xl bg-white/10" />
        </div>

        {/* Search loading */}
        <div className="mt-6 h-20 animate-pulse rounded-[1.5rem] bg-white shadow-sm" />

        {/* Filter loading */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-14 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-14 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>

        {/* Categories loading */}
        <div className="mt-5 flex gap-3 overflow-hidden">
          {Array.from({
            length: 7,
          }).map((_, index) => (
            <div
              key={index}
              className="h-11 w-28 shrink-0 animate-pulse rounded-full bg-white shadow-sm"
            />
          ))}
        </div>

        {/* Title loading */}
        <div className="mt-10">
          <div className="h-5 w-28 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-3 h-10 w-72 animate-pulse rounded-xl bg-slate-200" />
        </div>

        {/* Merchant cards loading */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          {Array.from({
            length: 8,
          }).map((_, index) => (
            <div
              key={index}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm sm:p-5"
            >
              <div className="aspect-square animate-pulse rounded-2xl bg-slate-200" />

              <div className="mt-4 h-5 w-3/4 animate-pulse rounded-lg bg-slate-200" />

              <div className="mt-2 h-4 w-1/2 animate-pulse rounded-lg bg-slate-100" />

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              </div>

              <div className="mt-4 h-12 animate-pulse rounded-xl bg-slate-900/10" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}