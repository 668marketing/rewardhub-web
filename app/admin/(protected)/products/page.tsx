"use client";

import {
  ArrowLeft,
  ArrowRight,
  Box,
  Download,
  Eye,
  ImageIcon,
  Loader2,
  Package,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminProduct,
  AdminProductDetailData,
  AdminProductsData,
  deactivateAdminProduct,
  getAdminProductDetail,
  getAdminProducts,
  updateAdminProductFeatured,
  updateAdminProductStatus,
} from "@/lib/admin-products";

type Filters = {
  search: string;
  merchantId: string;
  category: string;
  productType: string;
  status: string;
  featured: string;
  stock: string;
  sortBy: string;
  sortDirection: string;
  page: number;
  limit: number;
};

const DEFAULT_FILTERS: Filters = {
  search: "",
  merchantId: "",
  category: "",
  productType: "ALL",
  status: "ALL",
  featured: "ALL",
  stock: "ALL",
  sortBy: "UPDATED_AT",
  sortDirection: "DESC",
  page: 1,
  limit: 25,
};

export default function AdminProductsPage() {
  const [filters, setFilters] =
    useState<Filters>(DEFAULT_FILTERS);

  const [data, setData] =
    useState<AdminProductsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedId, setSelectedId] =
    useState("");

  const [detail, setDetail] =
    useState<AdminProductDetailData | null>(
      null
    );

  const [detailLoading, setDetailLoading] =
    useState(false);

  const loadProducts =
    useCallback(
      async (manual = false) => {
        try {
          setError("");

          if (manual) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const result =
            await getAdminProducts(
              filters
            );

          setData(result);
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load products."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [filters]
    );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadProducts();
        },
        filters.search
          ? 350
          : 0
      );

    return () =>
      window.clearTimeout(timer);
  }, [
    loadProducts,
    filters.search,
  ]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let active = true;

    async function loadDetail() {
      try {
        setDetailLoading(true);
        setError("");

        const result =
          await getAdminProductDetail(
            selectedId
          );

        if (active) {
          setDetail(result);
        }
      } catch (detailError) {
        if (active) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : "Unable to load product details."
          );
          setSelectedId("");
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [selectedId]);

  const products =
    data?.products || [];

  const pagination =
    data?.pagination || {
      page: 1,
      limit: filters.limit,
      totalItems: 0,
      totalPages: 1,
      showingFrom: 0,
      showingTo: 0,
      hasPrevious: false,
      hasNext: false,
    };

  const hasFilters =
    useMemo(
      () =>
        Boolean(
          filters.search ||
          filters.merchantId ||
          filters.category ||
          filters.productType !== "ALL" ||
          filters.status !== "ALL" ||
          filters.featured !== "ALL" ||
          filters.stock !== "ALL"
        ),
      [filters]
    );

  function updateFilter<
    K extends keyof Filters
  >(
    key: K,
    value: Filters[K]
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page:
        key === "page"
          ? Number(value)
          : 1,
    }));
  }

  function exportPage() {
    if (!products.length) {
      return;
    }

    const rows = [
      [
        "Product ID",
        "Product Name",
        "Merchant ID",
        "Merchant Name",
        "Type",
        "Category",
        "Price",
        "Sale Price",
        "Stock",
        "Status",
        "Featured",
        "Updated At",
      ],
      ...products.map(
        (product) => [
          product.productId,
          product.productName,
          product.merchantId,
          product.merchantName,
          product.productType,
          product.category,
          product.price,
          product.salePrice,
          product.stock,
          product.status,
          product.isFeatured,
          product.updatedAt,
        ]
      ),
    ];

    const csv =
      rows
        .map((row) =>
          row
            .map((value) =>
              `"${String(
                value ?? ""
              ).replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n");

    const url =
      URL.createObjectURL(
        new Blob([csv], {
          type:
            "text/csv;charset=utf-8;",
        })
      );

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `rewardhub-products-page-${pagination.page}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-7 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <Package className="h-4 w-4" />
              Merchant catalogue operations
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Products
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Monitor products, services,
              packages and vouchers across
              all RewardHub merchants.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void loadProducts(true)
              }
              disabled={refreshing}
              className="flex h-11 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>

            <button
              type="button"
              onClick={exportPage}
              disabled={!products.length}
              className="flex h-11 items-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Export page
            </button>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Products"
            value={formatNumber(
              data?.summary.total || 0
            )}
            note={`${formatNumber(
              data?.summary.merchantsSelling || 0
            )} merchants selling`}
            icon={Package}
          />

          <SummaryCard
            label="Active Products"
            value={formatNumber(
              data?.summary.active || 0
            )}
            note={`${formatNumber(
              data?.summary.draft || 0
            )} drafts`}
            icon={Box}
          />

          <SummaryCard
            label="Featured"
            value={formatNumber(
              data?.summary.featured || 0
            )}
            note="Promoted catalogue items"
            icon={Star}
          />

          <SummaryCard
            label="Stock Alerts"
            value={formatNumber(
              (data?.summary.lowStock || 0) +
              (data?.summary.outOfStock || 0)
            )}
            note={`${formatNumber(
              data?.summary.outOfStock || 0
            )} out of stock`}
            icon={TriangleAlert}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                value={filters.search}
                onChange={(event) =>
                  updateFilter(
                    "search",
                    event.target.value
                  )
                }
                placeholder="Search product, merchant or category"
                className={inputClass + " pl-11"}
              />
            </div>

            <select
              value={filters.merchantId}
              onChange={(event) =>
                updateFilter(
                  "merchantId",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="">
                All merchants
              </option>

              {(data?.merchants || []).map(
                (merchant) => (
                  <option
                    key={merchant.merchantId}
                    value={merchant.merchantId}
                  >
                    {merchant.merchantName}
                  </option>
                )
              )}
            </select>

            <select
              value={filters.category}
              onChange={(event) =>
                updateFilter(
                  "category",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="">
                All categories
              </option>

              {(data?.categories || []).map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            <select
              value={filters.productType}
              onChange={(event) =>
                updateFilter(
                  "productType",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="ALL">
                All types
              </option>
              <option value="PRODUCT">
                Product
              </option>
              <option value="SERVICE">
                Service
              </option>
              <option value="PACKAGE">
                Package
              </option>
              <option value="VOUCHER">
                Voucher
              </option>
            </select>

            <select
              value={filters.status}
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="ALL">
                All statuses
              </option>
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

            <select
              value={filters.featured}
              onChange={(event) =>
                updateFilter(
                  "featured",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="ALL">
                All featured states
              </option>
              <option value="FEATURED">
                Featured only
              </option>
              <option value="NOT_FEATURED">
                Not featured
              </option>
            </select>

            <select
              value={filters.stock}
              onChange={(event) =>
                updateFilter(
                  "stock",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="ALL">
                All stock levels
              </option>
              <option value="IN_STOCK">
                In stock
              </option>
              <option value="LOW_STOCK">
                Low stock
              </option>
              <option value="OUT_OF_STOCK">
                Out of stock
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              setFilters(
                DEFAULT_FILTERS
              )
            }
            disabled={!hasFilters}
            className="mt-3 h-11 rounded-xl border border-white/[0.08] px-5 text-sm text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
          >
            Reset
          </button>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/35">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                Product Directory
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                {data
                  ? `Showing ${pagination.showingFrom}–${pagination.showingTo} of ${pagination.totalItems}`
                  : "Loading products"}
              </p>
            </div>

            <select
              value={filters.limit}
              onChange={(event) =>
                updateFilter(
                  "limit",
                  Number(
                    event.target.value
                  )
                )
              }
              className="h-10 rounded-xl border border-white/[0.08] bg-slate-950/70 px-3 text-sm text-slate-300 outline-none"
            >
              {[10, 25, 50, 100].map(
                (size) => (
                  <option
                    key={size}
                    value={size}
                  >
                    {size} rows
                  </option>
                )
              )}
            </select>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
            </div>
          ) : !products.length ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <Package className="h-9 w-9 text-slate-700" />
              <h3 className="mt-4 font-medium text-slate-300">
                No products found
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Try changing the current filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.16em] text-slate-700">
                      <th className="px-6 py-4">Product</th>
                      <th className="px-4 py-4">Merchant</th>
                      <th className="px-4 py-4">Type</th>
                      <th className="px-4 py-4">Category</th>
                      <th className="px-4 py-4">Price</th>
                      <th className="px-4 py-4">Stock</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Featured</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.055]">
                    {products.map(
                      (product) => (
                        <ProductRow
                          key={product.productId}
                          product={product}
                          onView={() =>
                            setSelectedId(
                              product.productId
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/[0.07] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-600">
                  Page {pagination.page} of{" "}
                  {pagination.totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPrevious}
                    onClick={() =>
                      updateFilter(
                        "page",
                        Math.max(
                          1,
                          filters.page - 1
                        )
                      )
                    }
                    className={pageButtonClass}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={!pagination.hasNext}
                    onClick={() =>
                      updateFilter(
                        "page",
                        filters.page + 1
                      )
                    }
                    className={pageButtonClass}
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {selectedId ? (
        <ProductDrawer
          detail={detail}
          loading={detailLoading}
          onClose={() => {
            setSelectedId("");
            setDetail(null);
          }}
          onUpdated={(next) => {
            setDetail(next);
            void loadProducts(true);
          }}
        />
      ) : null}
    </div>
  );
}

function ProductRow({
  product,
  onView,
}: {
  product: AdminProduct;
  onView: () => void;
}) {
  return (
    <tr className="text-sm transition hover:bg-white/[0.018]">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <ProductImage
            src={product.imageUrl}
            alt={product.productName}
          />

          <div>
            <p className="font-medium text-white">
              {product.productName}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {product.productId}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <p className="text-slate-300">
          {product.merchantName ||
            product.merchantId}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {product.merchantId}
        </p>
      </td>

      <td className="px-4 py-4 text-slate-300">
        {product.productType}
      </td>

      <td className="px-4 py-4 text-slate-300">
        {product.category || "—"}
      </td>

      <td className="px-4 py-4">
        <p className="font-medium text-white">
          {formatCurrency(
            product.effectivePrice
          )}
        </p>

        {product.hasSale ? (
          <p className="mt-1 text-xs text-slate-600 line-through">
            {formatCurrency(
              product.price
            )}
          </p>
        ) : null}
      </td>

      <td className="px-4 py-4">
        <StockBadge
          stock={product.stock}
        />
      </td>

      <td className="px-4 py-4">
        <StatusBadge
          status={product.status}
        />
      </td>

      <td className="px-4 py-4">
        {product.isFeatured ? (
          <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
        ) : (
          <span className="text-slate-700">—</span>
        )}
      </td>

      <td className="px-6 py-4 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
      </td>
    </tr>
  );
}

function ProductDrawer({
  detail,
  loading,
  onClose,
  onUpdated,
}: {
  detail: AdminProductDetailData | null;
  loading: boolean;
  onClose: () => void;
  onUpdated: (
    next: AdminProductDetailData
  ) => void;
}) {
  const [saving, setSaving] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const [deactivateMode, setDeactivateMode] =
    useState(false);

  const [reason, setReason] =
    useState("");

  const product =
    detail?.product;

  async function changeStatus(
    status: "DRAFT" | "ACTIVE" | "INACTIVE"
  ) {
    if (!product) {
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      await updateAdminProductStatus(
        product.productId,
        status
      );

      const next =
        await getAdminProductDetail(
          product.productId
        );

      onUpdated(next);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update status."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeatured() {
    if (!product) {
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      await updateAdminProductFeatured(
        product.productId,
        !product.isFeatured
      );

      const next =
        await getAdminProductDetail(
          product.productId
        );

      onUpdated(next);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update featured status."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivate() {
    if (!product) {
      return;
    }

    if (reason.trim().length < 3) {
      setActionError(
        "Please enter a deactivation reason."
      );
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      await deactivateAdminProduct(
        product.productId,
        reason.trim()
      );

      const next =
        await getAdminProductDetail(
          product.productId
        );

      onUpdated(next);
      setDeactivateMode(false);
      setReason("");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to deactivate product."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-white/[0.09] bg-slate-950">
        <header className="flex items-start justify-between border-b border-white/[0.08] px-7 py-5">
          <div>
            <h2 className="text-xl font-semibold">
              Product details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {product?.productId ||
                "Loading product"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 transition hover:bg-white/[0.05]"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {loading ||
          !detail ||
          !product ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
            </div>
          ) : (
            <div className="space-y-5">
              <Panel title="Product">
                <div className="flex items-start gap-4">
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.productName}
                    large
                  />

                  <div>
                    <p className="text-lg font-semibold text-white">
                      {product.productName}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {product.shortDescription ||
                        "No short description."}
                    </p>
                  </div>
                </div>

                <Grid>
                  <Item
                    label="Product Type"
                    value={product.productType}
                  />
                  <Item
                    label="Category"
                    value={product.category}
                  />
                  <Item
                    label="Original Price"
                    value={formatCurrency(
                      product.price
                    )}
                  />
                  <Item
                    label="Sale Price"
                    value={
                      product.salePrice > 0
                        ? formatCurrency(
                            product.salePrice
                          )
                        : "—"
                    }
                  />
                  <Item
                    label="Stock"
                    value={formatNumber(
                      product.stock
                    )}
                  />
                  <Item
                    label="Points Earned"
                    value={formatNumber(
                      product.pointsEarned
                    )}
                  />
                  <Item
                    label="Status"
                    value={product.status}
                  />
                  <Item
                    label="Featured"
                    value={
                      product.isFeatured
                        ? "Yes"
                        : "No"
                    }
                  />
                  <Item
                    label="Sort Order"
                    value={formatNumber(
                      product.sortOrder
                    )}
                  />
                  <Item
                    label="Updated"
                    value={formatDateTime(
                      product.updatedAt
                    )}
                  />
                </Grid>

                <Item
                  label="Description"
                  value={product.description}
                  full
                />
              </Panel>

              <Panel title="Merchant">
                <Grid>
                  <Item
                    label="Business"
                    value={
                      detail.merchant.merchantName
                    }
                  />
                  <Item
                    label="Merchant ID"
                    value={
                      detail.merchant.merchantId
                    }
                  />
                  <Item
                    label="Email"
                    value={
                      detail.merchant.email
                    }
                  />
                  <Item
                    label="Phone"
                    value={
                      detail.merchant.phone
                    }
                  />
                  <Item
                    label="Category"
                    value={
                      detail.merchant.category
                    }
                  />
                  <Item
                    label="Status"
                    value={
                      detail.merchant.status
                    }
                  />
                </Grid>
              </Panel>

              <Panel title="Gallery">
                {product.gallery.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {product.gallery.map(
                      (imageUrl, index) => (
                        <a
                          key={`${imageUrl}-${index}`}
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]"
                        >
                          <img
                            src={imageUrl}
                            alt={`${product.productName} ${index + 1}`}
                            className="h-32 w-full object-cover"
                          />
                        </a>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    No gallery images.
                  </p>
                )}
              </Panel>
            </div>
          )}
        </div>

        {product ? (
          <footer className="border-t border-white/[0.08] px-7 py-4">
            {actionError ? (
              <div className="mb-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {actionError}
              </div>
            ) : null}

            {deactivateMode ? (
              <div className="space-y-3">
                <textarea
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Reason for deactivation"
                  className={textareaClass}
                />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setDeactivateMode(false);
                      setReason("");
                    }}
                    className={secondaryButtonClass}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void deactivate()
                    }
                    className="h-12 rounded-xl bg-red-400 text-sm font-semibold text-slate-950 disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ) : (
              <ProductActionButtons
                product={product}
                saving={saving}
                onActivate={() =>
                  void changeStatus(
                    "ACTIVE"
                  )
                }
                onToggleFeatured={() =>
                  void toggleFeatured()
                }
                onMoveToDraft={() =>
                  void changeStatus(
                    "DRAFT"
                  )
                }
                onDeactivate={() =>
                  setDeactivateMode(true)
                }
              />
            )}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function ProductActionButtons({
  product,
  saving,
  onActivate,
  onToggleFeatured,
  onMoveToDraft,
  onDeactivate,
}: {
  product: AdminProduct;
  saving: boolean;
  onActivate: () => void;
  onToggleFeatured: () => void;
  onMoveToDraft: () => void;
  onDeactivate: () => void;
}) {
  const normalizedStatus =
    String(product.status || "")
      .trim()
      .toUpperCase();

  const isActive =
    normalizedStatus === "ACTIVE";

  const isDraft =
    normalizedStatus === "DRAFT";

  const isInactive =
    normalizedStatus === "INACTIVE";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        disabled={saving || isActive}
        onClick={onActivate}
        className="h-12 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-950 disabled:text-emerald-800 disabled:opacity-60"
      >
        {isActive
          ? "Active"
          : "Activate"}
      </button>

      <button
        type="button"
        disabled={
          saving ||
          !isActive
        }
        onClick={onToggleFeatured}
        className="h-12 rounded-xl border border-amber-400/20 bg-amber-400/10 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-35"
      >
        {product.isFeatured
          ? "Remove Featured"
          : "Mark Featured"}
      </button>

      <button
        type="button"
        disabled={saving || isDraft}
        onClick={onMoveToDraft}
        className={`${secondaryButtonClass} disabled:cursor-not-allowed`}
      >
        {isDraft
          ? "Draft"
          : "Move to Draft"}
      </button>

      <button
        type="button"
        disabled={saving || isInactive}
        onClick={onDeactivate}
        className="h-12 rounded-xl border border-red-400/20 bg-red-400/10 text-sm font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:text-red-900 disabled:opacity-35"
      >
        {isInactive
          ? "Inactive"
          : "Deactivate"}
      </button>
    </div>
  );
}

function ProductImage({
  src,
  alt,
  large = false,
}: {
  src: string;
  alt: string;
  large?: boolean;
}) {
  const size =
    large
      ? "h-24 w-24"
      : "h-12 w-12";

  if (!src) {
    return (
      <div
        className={`flex ${size} shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-600`}
      >
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${size} shrink-0 rounded-xl border border-white/[0.08] object-cover`}
    />
  );
}

function SummaryCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-slate-400">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-slate-600">{note}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/45 p-5">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Grid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {children}
    </div>
  );
}

function Item({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-700">
        {label}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-slate-300">
        {value || "—"}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    String(status || "DRAFT")
      .toUpperCase();

  const className =
    normalized === "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "DRAFT"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : "border-slate-400/20 bg-slate-400/10 text-slate-400";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {normalized}
    </span>
  );
}

function StockBadge({
  stock,
}: {
  stock: number;
}) {
  const className =
    stock === 0
      ? "text-red-300"
      : stock <= 5
        ? "text-amber-300"
        : "text-slate-300";

  return (
    <span className={className}>
      {formatNumber(stock)}
    </span>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/65 px-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10";

const textareaClass =
  "w-full rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/40";

const pageButtonClass =
  "flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30";

const secondaryButtonClass =
  "h-12 rounded-xl border border-white/[0.08] text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-35";

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY",
    {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 2,
    }
  ).format(Number(value || 0));
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(Number(value || 0));
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone:
        "Asia/Kuala_Lumpur",
    }
  ).format(date);
}