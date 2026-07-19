"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MemberLayout from "@/components/layout/MemberLayout";
import { getProductDetail } from "@/lib/api";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = String(params.productId || "");

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [productId]);

  async function load() {
    try {
      if (!productId) return;

      const res = await getProductDetail(productId);

      const data =
        res?.data?.data ||
        res?.data ||
        res?.result ||
        res;

      setProduct(data);
    } catch (err) {
      console.error("Failed to load product:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <MemberLayout>
        <main className="min-h-screen bg-[#f6f7fb] px-4 py-10 text-center font-black text-slate-500">
          Loading product...
        </main>
      </MemberLayout>
    );
  }

  if (!product) {
    return (
      <MemberLayout>
        <main className="min-h-screen bg-[#f6f7fb] px-4 py-10 text-center font-black text-slate-500">
          Product not found.
        </main>
      </MemberLayout>
    );
  }

  const merchant = product.merchant || {};
  const merchantName =
    merchant.displayName || merchant.businessName || "Merchant";

  const marketingBudget = Number(merchant.marketingBudget || 5);
  const silverRate = marketingBudget * 0.1;
  const goldRate = marketingBudget * 0.2;
  const platinumRate = marketingBudget * 0.3;

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 pb-28 md:px-8 xl:px-12">
        <section className="mx-auto max-w-6xl">
          <Link
            href={`/member/merchant/${product.merchantId}`}
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 no-underline shadow-sm"
          >
            ← Back to Merchant
          </Link>

          <div className="mt-6 overflow-hidden rounded-[2.5rem] bg-white shadow-sm">
            <div className="grid gap-0 lg:grid-cols-2">
              <div className="bg-slate-950 p-6">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.productName}
                    className="h-[460px] w-full rounded-[2rem] object-cover"
                  />
                ) : (
                  <div className="flex h-[460px] items-center justify-center rounded-[2rem] bg-slate-900 text-5xl">
                    🛍️
                  </div>
                )}
              </div>

              <div className="p-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">
                  {product.category || "RewardHub Product"}
                </p>

                <h1 className="mt-3 text-5xl font-black text-slate-950">
                  {product.productName}
                </h1>

                <p className="mt-4 text-sm font-bold text-slate-500">
                  Sold by {merchantName}
                </p>

                <div className="mt-6 rounded-[2rem] bg-slate-950 p-6 text-white">
                  <p className="text-sm font-black text-slate-400">Price</p>
                  <h2 className="mt-2 text-5xl font-black">
                    RM{money(product.price)}
                  </h2>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge text={`Earn ${product.pointsEarned} pts`} />
                    <Badge text={`Marketing Budget ${marketingBudget}%`} />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <CashbackBox title="Silver" value={`${money(silverRate)}%`} />
                  <CashbackBox title="Gold" value={`${money(goldRate)}%`} />
                  <CashbackBox
                    title="Platinum"
                    value={`${money(platinumRate)}%`}
                  />
                </div>

                <Link
                  href="/member/pay"
                  className="mt-6 block rounded-[2rem] bg-gradient-to-r from-amber-500 to-yellow-300 px-6 py-5 text-center text-lg font-black text-slate-950 no-underline shadow-xl"
                >
                  Pay with RewardHub QR →
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-7 shadow-sm lg:col-span-2">
              <h2 className="text-2xl font-black text-slate-950">
                Product Description
              </h2>

              <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                {product.description ||
                  "This product is available at this RewardHub merchant."}
              </p>
            </div>

            <Link
              href={`/member/merchant/${product.merchantId}`}
              className="rounded-[2rem] bg-slate-950 p-7 text-white no-underline shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">
                Merchant
              </p>

              <h2 className="mt-3 text-2xl font-black">{merchantName}</h2>

              <p className="mt-3 text-sm font-bold leading-6 text-slate-400">
                {merchant.category || "RewardHub Merchant"}
              </p>

              <p className="mt-5 text-sm font-black text-amber-300">
                View Merchant →
              </p>
            </Link>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

function CashbackBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[2rem] bg-slate-50 p-5">
      <p className="text-sm font-black text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-emerald-700">{value}</p>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-slate-300">
      {text}
    </span>
  );
}

function money(value: any) {
  return Number(value || 0).toFixed(2);
}