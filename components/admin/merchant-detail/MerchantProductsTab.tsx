"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Archive,
  Boxes,
  CheckCircle2,
  CircleOff,
  Eye,
  ImageIcon,
  Package,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  getDriveImageUrl,
} from "@/lib/drive-image";
import AdminProductControls from "@/components/admin/merchant-detail/AdminProductControls";

import type {
  AdminMerchantProduct,
  AdminMerchantProductStatus,
  AdminMerchantProductType,
} from "@/lib/admin-merchant-detail";

type MerchantProductsTabProps = {
  products: {
    total: number;
    active: number;
    items: AdminMerchantProduct[];
  };
};

export default function MerchantProductsTab({
  products,
}: MerchantProductsTabProps) {
  const items =
    Array.isArray(products?.items)
      ? products.items
      : [];

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("ALL");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("ALL");

  const [
    selectedProduct,
    setSelectedProduct,
  ] =
    useState<AdminMerchantProduct | null>(
      null
    );

  const summary =
    useMemo(() => {
      return {
        total:
          items.length,

        active:
          items.filter(
            (product) =>
              normalizeStatus(
                product.status
              ) === "ACTIVE"
          ).length,

        draft:
          items.filter(
            (product) =>
              normalizeStatus(
                product.status
              ) === "DRAFT"
          ).length,

        inactive:
          items.filter(
            (product) =>
              normalizeStatus(
                product.status
              ) === "INACTIVE"
          ).length,

        featured:
          items.filter(
            (product) =>
              Boolean(
                product.isFeatured
              )
          ).length,
      };
    }, [items]);

  const categories =
    useMemo(() => {
      return Array.from(
        new Set(
          items
            .map((product) =>
              String(
                product.category || ""
              ).trim()
            )
            .filter(Boolean)
        )
      ).sort((first, second) =>
        first.localeCompare(
          second
        )
      );
    }, [items]);

  const filteredProducts =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return items.filter(
        (product) => {
          const status =
            normalizeStatus(
              product.status
            );

          const type =
            normalizeType(
              product.productType
            );

          if (
            statusFilter !== "ALL" &&
            status !==
              statusFilter
          ) {
            return false;
          }

          if (
            typeFilter !== "ALL" &&
            type !== typeFilter
          ) {
            return false;
          }

          if (
            categoryFilter !== "ALL" &&
            product.category !==
              categoryFilter
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          const searchable = [
            product.productId,
            product.productName,
            product.productType,
            product.category,
            product.shortDescription,
            product.description,
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            keyword
          );
        }
      );
    }, [
      items,
      search,
      statusFilter,
      typeFilter,
      categoryFilter,
    ]);

  return (
    <>
      <section className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
          <SummaryCard
            icon={Boxes}
            title="Total Products"
            value={summary.total}
          />

          <SummaryCard
            icon={CheckCircle2}
            title="Active"
            value={summary.active}
          />

          <SummaryCard
            icon={Archive}
            title="Draft"
            value={summary.draft}
          />

          <SummaryCard
            icon={CircleOff}
            title="Inactive"
            value={summary.inactive}
          />

          <SummaryCard
            icon={Sparkles}
            title="Featured"
            value={summary.featured}
          />
        </div>

        <div className="rounded-[1.5rem] border border-slate-800 bg-[#071126] p-4 lg:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search product name or ID"
                className="h-12 w-full rounded-2xl border border-slate-800 bg-[#050d1e] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <FilterSelect
              value={statusFilter}
              onChange={
                setStatusFilter
              }
            >
              <option value="ALL">
                All Statuses
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
            </FilterSelect>

            <FilterSelect
              value={typeFilter}
              onChange={
                setTypeFilter
              }
            >
              <option value="ALL">
                All Types
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
            </FilterSelect>

            <FilterSelect
              value={
                categoryFilter
              }
              onChange={
                setCategoryFilter
              }
            >
              <option value="ALL">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </FilterSelect>
          </div>
        </div>

        <section className="overflow-hidden rounded-[1.5rem] border border-slate-800 bg-[#071126]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-5 lg:px-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                Merchant Products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing{" "}
                {
                  filteredProducts.length
                }{" "}
                of {items.length} products
              </p>
            </div>

            <p className="text-sm text-slate-500">
              Total stock:{" "}
              <span className="font-bold text-white">
                {items.reduce(
                  (total, product) =>
                    total +
                    Number(
                      product.stock || 0
                    ),
                  0
                )}
              </span>
            </p>
          </div>

          {filteredProducts.length ===
          0 ? (
            <ProductsEmpty
              hasProducts={
                items.length > 0
              }
            />
          ) : (
            <>
              <div className="space-y-3 p-4 lg:hidden">
                {filteredProducts.map(
                  (product) => (
                    <ProductMobileCard
                      key={
                        product.productId
                      }
                      product={
                        product
                      }
                      onView={() =>
                        setSelectedProduct(
                          product
                        )
                      }
                    />
                  )
                )}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      <th className="px-6 py-4">
                        Product
                      </th>

                      <th className="px-4 py-4">
                        Type
                      </th>

                      <th className="px-4 py-4">
                        Category
                      </th>

                      <th className="px-4 py-4 text-right">
                        Price
                      </th>

                      <th className="px-4 py-4 text-right">
                        Stock
                      </th>

                      <th className="px-4 py-4">
                        Status
                      </th>

                      <th className="px-4 py-4">
                        Updated
                      </th>

                      <th className="px-6 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map(
                      (product) => (
                        <ProductTableRow
                          key={
                            product.productId
                          }
                          product={
                            product
                          }
                          onView={() =>
                            setSelectedProduct(
                              product
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </section>

      <ProductDetailDrawer
        product={selectedProduct}
        onClose={() =>
          setSelectedProduct(null)
        }
      />
    </>
  );
}

function ProductTableRow({
  product,
  onView,
}: {
  product: AdminMerchantProduct;
  onView: () => void;
}) {
  return (
    <tr className="border-b border-slate-800/80 text-sm text-slate-300 transition hover:bg-white/[0.025]">
      <td className="px-6 py-5">
        <div className="flex min-w-[270px] items-center gap-4">
          <ProductImage
            product={product}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="max-w-[220px] truncate font-bold text-white">
                {product.productName ||
                  "Untitled Product"}
              </p>

              {product.isFeatured ? (
                <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
              ) : null}
            </div>

            <p className="mt-1 text-xs text-slate-600">
              {product.productId ||
                "—"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-5">
        <TypeBadge
          type={normalizeType(
            product.productType
          )}
        />
      </td>

      <td className="px-4 py-5">
        {product.category || "—"}
      </td>

      <td className="px-4 py-5 text-right">
        <ProductPrice
          product={product}
        />
      </td>

      <td className="px-4 py-5 text-right font-bold text-white">
        {formatNumber(
          product.stock
        )}
      </td>

      <td className="px-4 py-5">
        <StatusBadge
          status={normalizeStatus(
            product.status
          )}
        />
      </td>

      <td className="whitespace-nowrap px-4 py-5 text-xs text-slate-500">
        {formatDate(
          product.updatedAt ||
            product.createdAt
        )}
      </td>

      <td className="px-6 py-5">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onView}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 px-4 text-xs font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            <Eye className="h-4 w-4" />

            View
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProductMobileCard({
  product,
  onView,
}: {
  product: AdminMerchantProduct;
  onView: () => void;
}) {
  return (
    <article className="rounded-[1.25rem] border border-slate-800 bg-[#050d1e] p-4">
      <div className="flex gap-4">
        <ProductImage
          product={product}
          large
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-bold text-white">
                {product.productName ||
                  "Untitled Product"}
              </p>

              <p className="mt-1 text-[10px] text-slate-600">
                {product.productId}
              </p>
            </div>

            {product.isFeatured ? (
              <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <TypeBadge
              type={normalizeType(
                product.productType
              )}
            />

            <StatusBadge
              status={normalizeStatus(
                product.status
              )}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MobileInfo
          label="Price"
          value={formatMoney(
            product.effectivePrice
          )}
        />

        <MobileInfo
          label="Stock"
          value={formatNumber(
            product.stock
          )}
        />

        <MobileInfo
          label="Category"
          value={
            product.category || "—"
          }
        />
      </div>

      <button
        type="button"
        onClick={onView}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-xs font-bold text-slate-950"
      >
        <Eye className="h-4 w-4" />

        View Product
      </button>
    </article>
  );
}

function ProductDetailDrawer({
  product,
  onClose,
}: {
  product: AdminMerchantProduct | null;
  onClose: () => void;
}) {
  if (!product) {
    return null;
  }

  const gallery =
    Array.isArray(product.gallery)
      ? product.gallery
      : [];

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close product details"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 flex h-full min-h-0 w-full max-w-[640px] flex-col overflow-hidden border-l border-slate-800 bg-[#050d1e] shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Package className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                Product Details
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {product.productId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-500 transition hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-800 bg-[#071126]">
            {product.imageUrl ? (
              <img
  src={getDriveImageUrl(
    product.imageUrl
  )}
  alt={product.productName}
  className="h-full w-full object-contain"
/>
            ) : (
              <div className="flex h-72 items-center justify-center text-slate-700">
                <ImageIcon className="h-12 w-12" />
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge
                type={normalizeType(
                  product.productType
                )}
              />

              <StatusBadge
                status={normalizeStatus(
                  product.status
                )}
              />

              {product.isFeatured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-bold text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />

                  Featured
                </span>
              ) : null}
            </div>

            <h3 className="mt-4 text-2xl font-bold text-white">
              {product.productName ||
                "Untitled Product"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {product.shortDescription ||
                product.description ||
                "No product description provided."}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <DetailBox
              label="Original Price"
              value={formatMoney(
                product.price
              )}
            />

            <DetailBox
              label="Sale Price"
              value={
                product.salePrice > 0
                  ? formatMoney(
                      product.salePrice
                    )
                  : "—"
              }
            />

            <DetailBox
              label="Stock"
              value={formatNumber(
                product.stock
              )}
            />

            <DetailBox
              label="Points Earned"
              value={formatNumber(
                product.pointsEarned
              )}
            />

            <DetailBox
              label="Category"
              value={
                product.category || "—"
              }
            />

            <DetailBox
              label="Sort Order"
              value={formatNumber(
                product.sortOrder
              )}
            />
          </div>

          {product.description ? (
            <section className="mt-6 rounded-[1.5rem] border border-slate-800 bg-[#071126] p-5">
              <h4 className="text-sm font-bold text-white">
                Full Description
              </h4>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">
                {product.description}
              </p>
            </section>
          ) : null}

          {gallery.length > 0 ? (
            <section className="mt-6">
              <h4 className="text-sm font-bold text-white">
                Gallery Images
              </h4>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map(
                  (
                    imageUrl,
                    index
                  ) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className="overflow-hidden rounded-2xl border border-slate-800 bg-[#071126]"
                    >
                      <img
  src={getDriveImageUrl(
    imageUrl
  )}
  alt={`Gallery ${index + 1}`}
  className="h-full w-full object-cover"
/>
                    </div>
                  )
                )}
              </div>
            </section>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <DetailBox
              label="Created"
              value={formatDateTime(
                product.createdAt
              )}
            />

            <DetailBox
              label="Last Updated"
              value={formatDateTime(
                product.updatedAt
              )}
            />
          </div>
          <AdminProductControls
  product={product}
/>
        </div>

        <footer className="shrink-0 border-t border-slate-800 bg-[#050d1e] px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-2xl border border-slate-700 text-sm font-bold text-slate-300 transition hover:border-white hover:text-white"
          >
            Close
          </button>
        </footer>
      </aside>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Package;
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-[#071126] p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 text-emerald-300">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function ProductImage({
  product,
  large = false,
}: {
  product: AdminMerchantProduct;
  large?: boolean;
}) {
  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-[#050d1e]",
        large
          ? "h-20 w-20"
          : "h-14 w-14",
      ].join(" ")}
    >
      {product.imageUrl ? (
        <img
          src={getDriveImageUrl(
  product.imageUrl
)}
          alt={product.productName}
          className="h-full w-full object-cover"
        />
      ) : (
        <Package className="h-6 w-6 text-slate-700" />
      )}
    </div>
  );
}

function ProductPrice({
  product,
}: {
  product: AdminMerchantProduct;
}) {
  return (
    <div>
      <p className="font-bold text-white">
        {formatMoney(
          product.effectivePrice
        )}
      </p>

      {product.hasSale ? (
        <p className="mt-1 text-xs text-slate-600 line-through">
          {formatMoney(
            product.price
          )}
        </p>
      ) : null}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: AdminMerchantProductStatus;
}) {
  const classes =
    status === "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : status === "DRAFT"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : "border-slate-700 bg-slate-800 text-slate-400";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${classes}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function TypeBadge({
  type,
}: {
  type: AdminMerchantProductType;
}) {
  return (
    <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-bold text-blue-300">
      {formatType(type)}
    </span>
  );
}

function MobileInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-[#071126] p-3">
      <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#071126] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function ProductsEmpty({
  hasProducts,
}: {
  hasProducts: boolean;
}) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
        <Package className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-white">
        {hasProducts
          ? "No matching products"
          : "No products found"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {hasProducts
          ? "Try changing the search term or filters."
          : "This merchant has not created any products yet."}
      </p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="h-12 min-w-0 rounded-2xl border border-slate-800 bg-[#050d1e] px-4 text-sm font-semibold text-slate-300 outline-none transition focus:border-emerald-400"
    >
      {children}
    </select>
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

function normalizeType(
  value: unknown
): AdminMerchantProductType {
  const type =
    String(value || "")
      .trim()
      .toUpperCase();

  if (type === "SERVICE") {
    return "SERVICE";
  }

  if (type === "PACKAGE") {
    return "PACKAGE";
  }

  if (type === "VOUCHER") {
    return "VOUCHER";
  }

  return "PRODUCT";
}

function formatStatus(
  value: AdminMerchantProductStatus
) {
  if (value === "ACTIVE") {
    return "Active";
  }

  if (value === "INACTIVE") {
    return "Inactive";
  }

  return "Draft";
}

function formatType(
  value: AdminMerchantProductType
) {
  if (value === "SERVICE") {
    return "Service";
  }

  if (value === "PACKAGE") {
    return "Package";
  }

  if (value === "VOUCHER") {
    return "Voucher";
  }

  return "Product";
}

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY",
    {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value || 0)
  );
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(
    Number(value || 0)
  );
}

function formatDate(
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
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
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
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone:
        "Asia/Kuala_Lumpur",

      day: "2-digit",
      month: "short",
      year: "numeric",

      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);
}