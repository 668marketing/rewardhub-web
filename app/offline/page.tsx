"use client";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC] px-6">
      <section className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFEDFF] text-3xl">
          📡
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          You’re Offline
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          RewardHub cannot connect to the internet right now.
          Please check your connection and try again.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 w-full rounded-2xl bg-[#5B4FE8] px-5 py-3 font-semibold text-white"
        >
          Try Again
        </button>
      </section>
    </main>
  );
}