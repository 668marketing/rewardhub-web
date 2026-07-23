"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import {
  useRouter,
} from "next/navigation";

import {
  deactivateAdminProduct,
  updateAdminProductFeatured,
  updateAdminProductSortOrder,
  updateAdminProductStatus,
} from "@/lib/admin-merchant-detail";

import type {
  AdminMerchantProduct,
  AdminMerchantProductStatus,
} from "@/lib/admin-merchant-detail";

type AdminProductControlsProps = {
  product: AdminMerchantProduct;
  onUpdated?: (
    product: AdminMerchantProduct
  ) => void;
  onDeactivated?: () => void;
};

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

export default function AdminProductControls({
  product,
  onUpdated,
  onDeactivated,
}: AdminProductControlsProps) {
  const router =
    useRouter();

  const [
    isRefreshing,
    startRefresh,
  ] = useTransition();

  const [
    status,
    setStatus,
  ] =
    useState<AdminMerchantProductStatus>(
      normalizeStatus(
        product.status
      )
    );

  const [
    isFeatured,
    setIsFeatured,
  ] =
    useState(
      Boolean(
        product.isFeatured
      )
    );

  const [
    sortOrder,
    setSortOrder,
  ] =
    useState(
      String(
        Number(
          product.sortOrder || 0
        )
      )
    );

  const [
    reason,
    setReason,
  ] =
    useState("");

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    isDeactivating,
    setIsDeactivating,
  ] =
    useState(false);

  const [
    feedback,
    setFeedback,
  ] =
    useState<FeedbackState>(
      null
    );

  useEffect(() => {
    setStatus(
      normalizeStatus(
        product.status
      )
    );

    setIsFeatured(
      Boolean(
        product.isFeatured
      )
    );

    setSortOrder(
      String(
        Number(
          product.sortOrder || 0
        )
      )
    );

    setReason("");
    setFeedback(null);
  }, [product]);

  const merchantId =
    String(
      product.merchantId || ""
    ).trim();

  const productId =
    String(
      product.productId || ""
    ).trim();

  const originalStatus =
    normalizeStatus(
      product.status
    );

  const originalFeatured =
    Boolean(
      product.isFeatured
    );

  const originalSortOrder =
    Number(
      product.sortOrder || 0
    );

  const parsedSortOrder =
    Math.max(
      0,
      Math.floor(
        Number(
          sortOrder || 0
        )
      )
    );

  const hasChanges =
    status !==
      originalStatus ||
    isFeatured !==
      originalFeatured ||
    parsedSortOrder !==
      originalSortOrder;

  const isBusy =
    isSaving ||
    isDeactivating ||
    isRefreshing;

  async function handleSave() {
    if (
      !merchantId ||
      !productId
    ) {
      setFeedback({
        type: "error",
        message:
          "Merchant ID or Product ID is missing.",
      });

      return;
    }

    if (
      isFeatured &&
      status !== "ACTIVE"
    ) {
      setFeedback({
        type: "error",
        message:
          "Only Active products can be featured.",
      });

      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      if (
        status !==
        originalStatus
      ) {
        await updateAdminProductStatus(
          merchantId,
          productId,
          status
        );
      }

      if (
        isFeatured !==
        originalFeatured
      ) {
        await updateAdminProductFeatured(
          merchantId,
          productId,
          isFeatured
        );
      }

      if (
        parsedSortOrder !==
        originalSortOrder
      ) {
        await updateAdminProductSortOrder(
          merchantId,
          productId,
          parsedSortOrder
        );
      }

      const updatedProduct = {
        ...product,
        status,
        isFeatured:
          status === "ACTIVE"
            ? isFeatured
            : false,
        sortOrder:
          parsedSortOrder,
      };

      onUpdated?.(
        updatedProduct
      );

      setFeedback({
        type: "success",
        message:
          "Product controls updated successfully.",
      });

      startRefresh(() => {
        router.refresh();
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update product.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate() {
    if (
      !merchantId ||
      !productId
    ) {
      setFeedback({
        type: "error",
        message:
          "Merchant ID or Product ID is missing.",
      });

      return;
    }

    const cleanReason =
      reason.trim();

    if (
      cleanReason.length < 3
    ) {
      setFeedback({
        type: "error",
        message:
          "Please enter a deactivation reason.",
      });

      return;
    }

    const confirmed =
      window.confirm(
        "Deactivate this product? It will be removed from active marketplace listings."
      );

    if (!confirmed) {
      return;
    }

    setIsDeactivating(true);
    setFeedback(null);

    try {
      await deactivateAdminProduct(
        merchantId,
        productId,
        cleanReason
      );

      const updatedProduct = {
        ...product,
        status:
          "INACTIVE" as AdminMerchantProductStatus,
        isFeatured:
          false,
      };

      onUpdated?.(
        updatedProduct
      );

      onDeactivated?.();

      setStatus(
        "INACTIVE"
      );

      setIsFeatured(false);

      setFeedback({
        type: "success",
        message:
          "Product deactivated successfully.",
      });

      startRefresh(() => {
        router.refresh();
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to deactivate product.",
      });
    } finally {
      setIsDeactivating(false);
    }
  }

  return (
    <section className="mt-6 rounded-[1.5rem] border border-slate-800 bg-[#071126] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
          <Sparkles className="h-5 w-5" />
        </div>

        <div>
          <h4 className="text-sm font-bold text-white">
            Admin Controls
          </h4>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Control marketplace visibility, featured placement and display order.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
            Product Status
          </span>

          <select
            value={status}
            disabled={isBusy}
            onChange={(event) => {
              const nextStatus =
                normalizeStatus(
                  event.target.value
                );

              setStatus(
                nextStatus
              );

              if (
                nextStatus !==
                "ACTIVE"
              ) {
                setIsFeatured(
                  false
                );
              }
            }}
            className="h-12 w-full rounded-2xl border border-slate-800 bg-[#050d1e] px-4 text-sm font-semibold text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="ACTIVE">
              Active
            </option>

            <option value="DRAFT">
              Draft
            </option>

            <option value="INACTIVE">
              Inactive
            </option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
            Sort Order
          </span>

          <input
            type="number"
            min="0"
            step="1"
            value={sortOrder}
            disabled={isBusy}
            onChange={(event) =>
              setSortOrder(
                event.target.value
              )
            }
            className="h-12 w-full rounded-2xl border border-slate-800 bg-[#050d1e] px-4 text-sm font-semibold text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#050d1e] p-4">
        <div>
          <p className="text-sm font-bold text-white">
            Featured Product
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Featured products receive priority placement.
          </p>
        </div>

        <input
          type="checkbox"
          checked={
            isFeatured
          }
          disabled={
            isBusy ||
            status !== "ACTIVE"
          }
          onChange={(event) =>
            setIsFeatured(
              event.target.checked
            )
          }
          className="h-5 w-5 accent-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>

      {feedback ? (
        <div
          className={[
            "mt-4 flex items-start gap-3 rounded-2xl border p-4 text-sm",
            feedback.type ===
            "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-red-400/20 bg-red-400/10 text-red-300",
          ].join(" ")}
        >
          {feedback.type ===
          "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}

          <p className="leading-5">
            {feedback.message}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        disabled={
          isBusy ||
          !hasChanges
        }
        onClick={handleSave}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ||
        isRefreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}

        Save Admin Controls
      </button>

      <div className="my-5 border-t border-slate-800" />

      <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.04] p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

          <div>
            <p className="text-sm font-bold text-white">
              Force Deactivate
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Immediately mark this product as inactive and remove its featured status.
            </p>
          </div>
        </div>

        <textarea
          value={reason}
          disabled={isBusy}
          onChange={(event) =>
            setReason(
              event.target.value
            )
          }
          rows={3}
          placeholder="Enter the reason for deactivation"
          className="mt-4 w-full resize-none rounded-2xl border border-slate-800 bg-[#050d1e] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="button"
          disabled={
            isBusy ||
            reason.trim()
              .length < 3 ||
            originalStatus ===
              "INACTIVE"
          }
          onClick={
            handleDeactivate
          }
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 text-xs font-bold text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isDeactivating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}

          Deactivate Product
        </button>
      </div>
    </section>
  );
}

function normalizeStatus(
  value: unknown
): AdminMerchantProductStatus {
  const status =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    status === "ACTIVE" ||
    status === "PUBLISHED"
  ) {
    return "ACTIVE";
  }

  if (
    status === "INACTIVE" ||
    status === "DISABLED" ||
    status === "DELETED"
  ) {
    return "INACTIVE";
  }

  return "DRAFT";
}