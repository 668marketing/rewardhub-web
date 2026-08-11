"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import MemberLayout from "@/components/layout/MemberLayout";
import SafeImage from "@/components/ui/SafeImage";
import { useLanguage } from "@/hooks/useLanguage";

import {
  clearMemberCart,
  MemberCartItem,
  readMemberCart,
  removeMemberCartItem,
  updateMemberCartQuantity,
} from "@/lib/memberCart";

type LanguageCode = "en" | "zh" | "ms";

const copyMap = {
  en: {
    title: "Shopping Cart",
    subtitle: "Review your selected products before checkout.",
    emptyTitle: "Your cart is empty",
    emptyText: "Browse RewardHub merchants and add products to your cart.",
    browse: "Browse Marketplace",
    clear: "Clear Cart",
    merchant: "Merchant",
    quantity: "Quantity",
    remove: "Remove",
    subtotal: "Subtotal",
    totalItems: "Total Items",
    orderTotal: "Product Subtotal",
    shipping: "Shipping",
    shippingAtCheckout: "Calculated at checkout",
    estimatedTotal: "Final total includes shipping after delivery method is selected.",
    checkout: "Continue to Checkout",
    checkoutNotice:
      "Shipping, member benefits and final payment amount will be confirmed at checkout.",
    oneMerchant:
      "Each order can contain products from one merchant only.",
    points: "Estimated Points",
  },
  zh: {
    title: "购物车",
    subtitle: "付款前请确认你选择的商品。",
    emptyTitle: "购物车还是空的",
    emptyText: "前往 RewardHub 商家市场，把商品加入购物车。",
    browse: "浏览商家市场",
    clear: "清空购物车",
    merchant: "商家",
    quantity: "数量",
    remove: "删除",
    subtotal: "小计",
    totalItems: "商品数量",
    orderTotal: "商品小计",
    shipping: "运费",
    shippingAtCheckout: "结账时计算",
    estimatedTotal: "选择送货方式后，系统会把运费加入最终订单总额。",
    checkout: "继续结账",
    checkoutNotice:
      "运费、会员福利和最终付款金额会在结账页面确认。",
    oneMerchant:
      "每一张订单只可以包含同一位商家的商品。",
    points: "预计获得积分",
  },
  ms: {
    title: "Troli Beli-belah",
    subtitle: "Semak produk yang dipilih sebelum pembayaran.",
    emptyTitle: "Troli anda kosong",
    emptyText:
      "Layari peniaga RewardHub dan tambah produk ke dalam troli.",
    browse: "Lihat Marketplace",
    clear: "Kosongkan Troli",
    merchant: "Peniaga",
    quantity: "Kuantiti",
    remove: "Buang",
    subtotal: "Jumlah Kecil",
    totalItems: "Jumlah Item",
    orderTotal: "Subjumlah Produk",
    shipping: "Caj Penghantaran",
    shippingAtCheckout: "Dikira semasa checkout",
    estimatedTotal: "Jumlah akhir termasuk caj penghantaran selepas kaedah penghantaran dipilih.",
    checkout: "Teruskan ke Pembayaran",
    checkoutNotice:
      "Caj penghantaran, manfaat ahli dan jumlah bayaran akhir akan disahkan semasa checkout.",
    oneMerchant:
      "Setiap pesanan hanya boleh mengandungi produk daripada seorang peniaga.",
    points: "Anggaran Mata",
  },
} as const;

function normalizeLanguage(
  value: unknown
): LanguageCode {
  return value === "zh" || value === "ms"
    ? value
    : "en";
}

export default function MemberCartPage() {
  const { language } = useLanguage();
  const copy =
    copyMap[normalizeLanguage(language)];

  const [items, setItems] =
    useState<MemberCartItem[]>([]);
  const [ready, setReady] =
    useState(false);

  const [
    confirmAction,
    setConfirmAction,
  ] = useState<
    | {
        type: "REMOVE";
        productId: string;
        productName: string;
      }
    | {
        type: "CLEAR";
      }
    | null
  >(null);

  const refresh = useCallback(() => {
    setItems(readMemberCart());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();

    window.addEventListener(
      "rewardhub-cart-updated",
      refresh
    );

    return () => {
      window.removeEventListener(
        "rewardhub-cart-updated",
        refresh
      );
    };
  }, [refresh]);

  const totals = useMemo(() => {
    return items.reduce(
      (result, item) => {
        result.quantity +=
          item.quantity;
        result.amount +=
          item.price *
          item.quantity;
        result.points +=
          item.pointsEarned *
          item.quantity;

        return result;
      },
      {
        quantity: 0,
        amount: 0,
        points: 0,
      }
    );
  }, [items]);

  function changeQuantity(
    item: MemberCartItem,
    nextQuantity: number
  ) {
    setItems(
      updateMemberCartQuantity(
        item.productId,
        nextQuantity
      )
    );
  }

  function removeItem(
    productId: string
  ) {
    setItems(
      removeMemberCartItem(
        productId
      )
    );

    setConfirmAction(null);
  }

  function clearCart() {
    setItems(clearMemberCart());
    setConfirmAction(null);
  }

  if (!ready) {
    return (
      <MemberLayout>
        <div className="min-h-screen bg-[#f4f6fa] px-4 py-8">
          <div className="mx-auto h-72 max-w-5xl animate-pulse rounded-[32px] bg-white" />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f4f6fa] px-4 py-6 text-slate-950 sm:px-6 sm:py-9 lg:px-8">
        <section className="mx-auto w-full max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                RewardHub Member
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                {copy.title}
              </h1>

              <p className="mt-2 text-sm font-bold text-slate-500">
                {copy.subtitle}
              </p>
            </div>

            {items.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    type: "CLEAR",
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-xs font-black text-rose-600 shadow-sm transition hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                {copy.clear}
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-amber-100 text-amber-700">
                <ShoppingBag className="h-9 w-9" />
              </div>

              <h2 className="mt-6 text-2xl font-black">
                {copy.emptyTitle}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-slate-500">
                {copy.emptyText}
              </p>

              <Link
                href="/member/marketplace"
                className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-black text-white no-underline"
              >
                {copy.browse}
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {items.map((item) => {
                  const subtotal =
                    item.price *
                    item.quantity;

                  return (
                    <article
                      key={item.productId}
                      className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                    >
                      <div className="flex gap-4">
                        <Link
                          href={`/member/product/${encodeURIComponent(
                            item.productId
                          )}`}
                          className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 no-underline sm:h-32 sm:w-32"
                        >
                          <SafeImage
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600">
                            {item.category ||
                              "Product"}
                          </p>

                          <Link
                            href={`/member/product/${encodeURIComponent(
                              item.productId
                            )}`}
                            className="mt-1 block line-clamp-2 text-base font-black text-slate-950 no-underline sm:text-xl"
                          >
                            {item.productName}
                          </Link>

                          <p className="mt-1 truncate text-xs font-bold text-slate-500">
                            {copy.merchant}:{" "}
                            {item.merchantName}
                          </p>

                          <p className="mt-3 text-lg font-black">
                            RM
                            {money(item.price)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                            {copy.quantity}
                          </p>

                          <div className="mt-2 inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(
                                  item,
                                  item.quantity -
                                    1
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm"
                            >
                              <Minus className="h-4 w-4" />
                            </button>

                            <span className="min-w-12 text-center text-sm font-black">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(
                                  item,
                                  item.quantity +
                                    1
                                )
                              }
                              disabled={
                                item.stock !==
                                  null &&
                                item.quantity >=
                                  item.stock
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                            {copy.subtotal}
                          </p>

                          <p className="mt-2 text-xl font-black">
                            RM
                            {money(subtotal)}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                type: "REMOVE",
                                productId:
                                  item.productId,
                                productName:
                                  item.productName,
                              })
                            }
                            className="mt-2 text-xs font-black text-rose-600"
                          >
                            {copy.remove}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="h-fit rounded-[28px] bg-[#08111f] p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)] lg:sticky lg:top-28">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                  Order Summary
                </p>

                <div className="mt-6 space-y-4">
                  <SummaryRow
                    label={copy.totalItems}
                    value={String(
                      totals.quantity
                    )}
                  />

                  <SummaryRow
                    label={copy.points}
                    value={`${formatNumber(
                      totals.points
                    )} pts`}
                  />

                  <SummaryRow
                    label={copy.shipping}
                    value={copy.shippingAtCheckout}
                  />

                  <div className="border-t border-white/10 pt-4">
                    <SummaryRow
                      label={copy.orderTotal}
                      value={`RM${money(
                        totals.amount
                      )}`}
                      large
                    />

                    <p className="mt-2 text-[10px] font-bold leading-4 text-slate-400">
                      {copy.estimatedTotal}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-bold leading-5 text-slate-300">
                    {copy.oneMerchant}
                  </p>
                </div>

                <Link
                  href="/member/checkout"
                  className="mt-6 flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 px-5 text-center text-sm font-black text-slate-950 no-underline shadow-lg"
                >
                  {copy.checkout}
                </Link>

                <p className="mt-3 text-center text-[10px] font-bold leading-4 text-slate-500">
                  {copy.checkoutNotice}
                </p>
              </aside>
            </div>
          )}
        </section>

        {confirmAction ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <Trash2 className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-center text-xl font-black text-slate-950">
                {confirmAction.type ===
                "CLEAR"
                  ? "Clear shopping cart?"
                  : "Remove this product?"}
              </h2>

              <p className="mt-2 text-center text-sm font-bold leading-6 text-slate-500">
                {confirmAction.type ===
                "CLEAR"
                  ? "All products in your cart will be removed. This action cannot be undone."
                  : `"${confirmAction.productName}" will be removed from your cart.`}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction(
                      null
                    )
                  }
                  className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirmAction.type ===
                      "CLEAR"
                    ) {
                      clearCart();
                      return;
                    }

                    removeItem(
                      confirmAction.productId
                    );
                  }}
                  className="min-h-12 rounded-2xl bg-rose-600 px-4 text-sm font-black text-white transition hover:bg-rose-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </MemberLayout>
  );
}

function SummaryRow({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          large
            ? "text-sm font-black text-white"
            : "text-sm font-bold text-slate-400"
        }
      >
        {label}
      </span>

      <span
        className={
          large
            ? "text-2xl font-black text-amber-300"
            : "text-sm font-black text-white"
        }
      >
        {value}
      </span>
    </div>
  );
}

function money(value: unknown) {
  const amount =
    Number(value || 0);

  return Number.isFinite(amount)
    ? amount.toFixed(2)
    : "0.00";
}

function formatNumber(value: unknown) {
  const amount =
    Number(value || 0);

  return Number.isFinite(amount)
    ? new Intl.NumberFormat(
        "en-US",
        {
          maximumFractionDigits: 0,
        }
      ).format(amount)
    : "0";
}