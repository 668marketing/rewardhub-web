export type AdminProductType =
  | "PRODUCT"
  | "SERVICE"
  | "PACKAGE"
  | "VOUCHER";

export type AdminProductStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE";

export type AdminProduct = {
  productId: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  merchantPhone: string;
  merchantStatus: string;
  merchantCategory: string;
  productType: AdminProductType;
  productName: string;
  shortDescription: string;
  description: string;
  category: string;
  price: number;
  salePrice: number;
  effectivePrice: number;
  hasSale: boolean;
  imageUrl: string;
  gallery: string[];
  stock: number;
  pointsEarned: number;
  status: AdminProductStatus;
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductSummary = {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  featured: number;
  lowStock: number;
  outOfStock: number;
  totalStock: number;
  merchantsSelling: number;
};

export type AdminProductsData = {
  generatedAt: string;
  timezone: string;
  summary: AdminProductSummary;
  categories: string[];
  merchants: Array<{
    merchantId: string;
    merchantName: string;
  }>;
  filters: {
    search: string;
    merchantId: string;
    category: string;
    productType: string;
    status: string;
    featured: string;
    stock: string;
    sortBy: string;
    sortDirection: string;
  };
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    showingFrom: number;
    showingTo: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  products: AdminProduct[];
};

export type AdminProductDetailData = {
  product: AdminProduct;
  merchant: {
    merchantId: string;
    merchantName: string;
    email: string;
    phone: string;
    category: string;
    status: string;
  };
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T | ApiResponse<T>;
  result?: T | ApiResponse<T>;
  error?: string;
  message?: string;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function unwrap(
  value: unknown
): unknown {
  let current = value;

  for (let index = 0; index < 8; index++) {
    if (!isRecord(current)) {
      return current;
    }

    if (
      "products" in current ||
      "product" in current ||
      "summary" in current
    ) {
      return current;
    }

    if (current.data !== undefined) {
      current = current.data;
      continue;
    }

    if (current.result !== undefined) {
      current = current.result;
      continue;
    }

    return current;
  }

  return current;
}

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response =
    await fetch(url, {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        ...(options?.headers || {}),
      },
      cache: "no-store",
    });

  const rawText =
    await response.text();

  let parsed:
    ApiResponse<T>;

  try {
    parsed =
      JSON.parse(rawText) as ApiResponse<T>;
  } catch {
    throw new Error(
      rawText
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500) ||
      "Products API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    parsed.success === false
  ) {
    throw new Error(
      parsed.error ||
      parsed.message ||
      "Unable to process product request."
    );
  }

  return unwrap(parsed) as T;
}

export async function getAdminProducts(
  input: {
    search?: string;
    merchantId?: string;
    category?: string;
    productType?: string;
    status?: string;
    featured?: string;
    stock?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<AdminProductsData> {
  const params =
    new URLSearchParams();

  Object.entries({
    search: input.search || "",
    merchantId: input.merchantId || "",
    category: input.category || "",
    productType: input.productType || "ALL",
    status: input.status || "ALL",
    featured: input.featured || "ALL",
    stock: input.stock || "ALL",
    sortBy: input.sortBy || "UPDATED_AT",
    sortDirection:
      input.sortDirection || "DESC",
    page: input.page || 1,
    limit: input.limit || 25,
  }).forEach(([key, value]) => {
    params.set(key, String(value));
  });

  return request<AdminProductsData>(
    `/api/admin/products?${params.toString()}`,
    {
      method: "GET",
    }
  );
}

export async function getAdminProductDetail(
  productId: string
): Promise<AdminProductDetailData> {
  return request<AdminProductDetailData>(
    `/api/admin/products/${encodeURIComponent(
      productId
    )}`,
    {
      method: "GET",
    }
  );
}

export async function updateAdminProductStatus(
  productId: string,
  status: AdminProductStatus
) {
  return request<AdminProductDetailData>(
    `/api/admin/products/${encodeURIComponent(
      productId
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        action: "status",
        status,
      }),
    }
  );
}

export async function updateAdminProductFeatured(
  productId: string,
  isFeatured: boolean
) {
  return request<AdminProductDetailData>(
    `/api/admin/products/${encodeURIComponent(
      productId
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        action: "featured",
        isFeatured,
      }),
    }
  );
}

export async function deactivateAdminProduct(
  productId: string,
  reason: string
) {
  return request<AdminProductDetailData>(
    `/api/admin/products/${encodeURIComponent(
      productId
    )}`,
    {
      method: "DELETE",
      body: JSON.stringify({
        reason,
      }),
    }
  );
}
