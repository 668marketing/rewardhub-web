/* ============================================================
 * Merchant Product Types
 * ============================================================
 */

export type MerchantProductType =
  | "PRODUCT"
  | "SERVICE"
  | "PACKAGE"
  | "VOUCHER";

export type MerchantProductStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE";

export type MerchantProduct = {
  productId: string;
  merchantId: string;

  productType: MerchantProductType;
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

  status: MerchantProductStatus;
  sortOrder: number;
  isFeatured: boolean;

  createdAt: string;
  updatedAt: string;
};

export type MerchantProductSummary = {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  featured: number;
  totalStock: number;
};

export type MerchantProductManagementData = {
  merchantId: string;
  summary: MerchantProductSummary;
  total: number;
  products: MerchantProduct[];
};

export type MerchantProductInput = {
  productType: MerchantProductType;
  productName: string;

  shortDescription: string;
  description: string;
  category: string;

  price: number;
  salePrice: number;

  imageUrl: string;
  gallery: string[];

  stock: number;
  pointsEarned: number;

  status: MerchantProductStatus;
  sortOrder: number;
  isFeatured: boolean;
};

export type MerchantProductFilters = {
  search?: string;
  status?: MerchantProductStatus | "ALL";
  productType?: MerchantProductType | "ALL";
  category?: string;
};

export type MerchantProductImageType =
  | "COVER"
  | "GALLERY";

export type MerchantProductImageUploadInput = {
  productId?: string;
  fileName: string;
  mimeType: string;
  base64: string;
  imageType: MerchantProductImageType;
};

export type MerchantProductImageUploadResult = {
  fileId: string;
  fileName: string;
  imageType: MerchantProductImageType;
  imageUrl: string;
};

/* ============================================================
 * API Response Types
 * ============================================================
 */

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  result?: T;
  error?: string;
  message?: string;
};

type ProductManagementResponseData = {
  message?: string;
  merchantId?: string;
  summary?: MerchantProductSummary;
  total?: number;
  products?: MerchantProduct[];

  data?: {
    merchantId?: string;
    summary?: MerchantProductSummary;
    total?: number;
    products?: MerchantProduct[];
  };
};

type ProductDetailResponseData = {
  message?: string;
  product?: MerchantProduct;

  data?: {
    product?: MerchantProduct;
  };
};

type ProductMutationResponseData = {
  message?: string;
  product?: MerchantProduct;

  data?: {
    product?: MerchantProduct;
  };
};

type ProductImageResponseData = {
  message?: string;

  fileId?: string;
  fileName?: string;
  imageType?: MerchantProductImageType;
  imageUrl?: string;

  data?: {
    fileId?: string;
    fileName?: string;
    imageType?: MerchantProductImageType;
    imageUrl?: string;
  };
};

/* ============================================================
 * Shared API Request
 * ============================================================
 */

async function merchantProductRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },

    cache: "no-store",
  });

  const rawText = await response.text();

  let payload: ApiResponse<T>;

  try {
    payload = JSON.parse(
      rawText
    ) as ApiResponse<T>;
  } catch {
    const preview = rawText
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);

    throw new Error(
      preview ||
        "Merchant product API returned an invalid response."
    );
  }

  if (
    !response.ok ||
    payload.success === false
  ) {
    throw new Error(
      payload.error ||
        payload.message ||
        "Unable to process merchant product request."
    );
  }

  const result =
    payload.data ??
    payload.result;

  if (result === undefined) {
    throw new Error(
      "Merchant product API response data is missing."
    );
  }

  return result;
}

/* ============================================================
 * Product Management List
 * ============================================================
 */

export async function getMerchantProductManagement(
  filters: MerchantProductFilters = {}
): Promise<MerchantProductManagementData> {
  const params =
    new URLSearchParams();

  if (filters.search?.trim()) {
    params.set(
      "search",
      filters.search.trim()
    );
  }

  if (
    filters.status &&
    filters.status !== "ALL"
  ) {
    params.set(
      "status",
      filters.status
    );
  }

  if (
    filters.productType &&
    filters.productType !== "ALL"
  ) {
    params.set(
      "productType",
      filters.productType
    );
  }

  if (filters.category?.trim()) {
    params.set(
      "category",
      filters.category.trim()
    );
  }

  const query =
    params.toString();

  const result =
    await merchantProductRequest<ProductManagementResponseData>(
      `/api/merchant/products${
        query ? `?${query}` : ""
      }`,
      {
        method: "GET",
      }
    );

  const source =
    result.data || result;

  return {
    merchantId:
      String(
        source.merchantId || ""
      ),

    summary: {
      total:
        Number(
          source.summary?.total || 0
        ),

      active:
        Number(
          source.summary?.active || 0
        ),

      draft:
        Number(
          source.summary?.draft || 0
        ),

      inactive:
        Number(
          source.summary?.inactive || 0
        ),

      featured:
        Number(
          source.summary?.featured || 0
        ),

      totalStock:
        Number(
          source.summary?.totalStock || 0
        ),
    },

    total:
      Number(
        source.total || 0
      ),

    products:
      Array.isArray(
        source.products
      )
        ? source.products.map(
            normalizeProduct
          )
        : [],
  };
}

/* ============================================================
 * Product Detail
 * ============================================================
 */

export async function getMerchantProductDetail(
  productId: string
): Promise<MerchantProduct> {
  const normalizedProductId =
    String(productId || "")
      .trim();

  if (!normalizedProductId) {
    throw new Error(
      "Product ID is required."
    );
  }

  const result =
    await merchantProductRequest<ProductDetailResponseData>(
      `/api/merchant/products/${encodeURIComponent(
        normalizedProductId
      )}`,
      {
        method: "GET",
      }
    );

  const source =
    result.data || result;

  if (!source.product) {
    throw new Error(
      "Product detail is missing."
    );
  }

  return normalizeProduct(
    source.product
  );
}

/* ============================================================
 * Create Product
 * ============================================================
 */

export async function createMerchantProduct(
  input: MerchantProductInput
): Promise<MerchantProduct> {
  validateProductInput(input);

  const result =
    await merchantProductRequest<ProductMutationResponseData>(
      "/api/merchant/products",
      {
        method: "POST",

        body: JSON.stringify({
          action: "create",
          ...normalizeProductInput(
            input
          ),
        }),
      }
    );

  const source =
    result.data || result;

  if (!source.product) {
    throw new Error(
      "Created product data is missing."
    );
  }

  return normalizeProduct(
    source.product
  );
}

/* ============================================================
 * Update Product
 * ============================================================
 */

export async function updateMerchantProduct(
  productId: string,
  input: MerchantProductInput
): Promise<MerchantProduct> {
  const normalizedProductId =
    String(productId || "")
      .trim();

  if (!normalizedProductId) {
    throw new Error(
      "Product ID is required."
    );
  }

  validateProductInput(input);

  const result =
    await merchantProductRequest<ProductMutationResponseData>(
      `/api/merchant/products/${encodeURIComponent(
        normalizedProductId
      )}`,
      {
        method: "PUT",

        body: JSON.stringify(
          normalizeProductInput(
            input
          )
        ),
      }
    );

  const source =
    result.data || result;

  if (!source.product) {
    throw new Error(
      "Updated product data is missing."
    );
  }

  return normalizeProduct(
    source.product
  );
}

/* ============================================================
 * Update Product Status
 * ============================================================
 */

export async function updateMerchantProductStatus(
  productId: string,
  status: MerchantProductStatus
): Promise<void> {
  const normalizedProductId =
    String(productId || "")
      .trim();

  if (!normalizedProductId) {
    throw new Error(
      "Product ID is required."
    );
  }

  if (
    !isProductStatus(status)
  ) {
    throw new Error(
      "Invalid product status."
    );
  }

  await merchantProductRequest<unknown>(
    `/api/merchant/products/${encodeURIComponent(
      normalizedProductId
    )}/status`,
    {
      method: "POST",

      body: JSON.stringify({
        status,
      }),
    }
  );
}

/* ============================================================
 * Delete / Deactivate Product
 * ============================================================
 */

export async function deleteMerchantProduct(
  productId: string
): Promise<void> {
  const normalizedProductId =
    String(productId || "")
      .trim();

  if (!normalizedProductId) {
    throw new Error(
      "Product ID is required."
    );
  }

  await merchantProductRequest<unknown>(
    `/api/merchant/products/${encodeURIComponent(
      normalizedProductId
    )}`,
    {
      method: "DELETE",
    }
  );
}

/* ============================================================
 * Upload Product Image
 * ============================================================
 */

export async function uploadMerchantProductImage(
  input: MerchantProductImageUploadInput
): Promise<MerchantProductImageUploadResult> {
  if (!input.fileName.trim()) {
    throw new Error(
      "Image file name is required."
    );
  }

  if (
    !input.mimeType.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Only image files are allowed."
    );
  }

  if (!input.base64.trim()) {
    throw new Error(
      "Image data is required."
    );
  }

  const result =
    await merchantProductRequest<ProductImageResponseData>(
      "/api/merchant/products/upload",
      {
        method: "POST",

        body: JSON.stringify({
          productId:
            input.productId || "",

          fileName:
            input.fileName,

          mimeType:
            input.mimeType,

          base64:
            input.base64,

          imageType:
            input.imageType,
        }),
      }
    );

  const source =
    result.data || result;

  const imageUrl =
    String(
      source.imageUrl || ""
    ).trim();

  if (!imageUrl) {
    throw new Error(
      "Uploaded image URL is missing."
    );
  }

  return {
    fileId:
      String(
        source.fileId || ""
      ),

    fileName:
      String(
        source.fileName ||
          input.fileName
      ),

    imageType:
      source.imageType ===
      "GALLERY"
        ? "GALLERY"
        : "COVER",

    imageUrl,
  };
}

/* ============================================================
 * File Conversion
 * ============================================================
 */

export function productImageFileToBase64(
  file: File
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result !==
          "string"
        ) {
          reject(
            new Error(
              "Unable to read image file."
            )
          );

          return;
        }

        resolve(
          reader.result
        );
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Unable to read image file."
          )
        );
      };

      reader.readAsDataURL(
        file
      );
    }
  );
}

/* ============================================================
 * Validation
 * ============================================================
 */

export function validateProductInput(
  input: MerchantProductInput
): void {
  if (
    !isProductType(
      input.productType
    )
  ) {
    throw new Error(
      "Please select a valid product type."
    );
  }

  const productName =
    String(
      input.productName || ""
    ).trim();

  if (!productName) {
    throw new Error(
      "Product name is required."
    );
  }

  if (
    productName.length > 120
  ) {
    throw new Error(
      "Product name cannot exceed 120 characters."
    );
  }

  if (
    String(
      input.shortDescription ||
        ""
    ).length > 250
  ) {
    throw new Error(
      "Short description cannot exceed 250 characters."
    );
  }

  if (
    String(
      input.description || ""
    ).length > 5000
  ) {
    throw new Error(
      "Description cannot exceed 5,000 characters."
    );
  }

  if (
    !String(
      input.category || ""
    ).trim()
  ) {
    throw new Error(
      "Category is required."
    );
  }

  const price =
    Number(input.price);

  const salePrice =
    Number(input.salePrice);

  const stock =
    Number(input.stock);

  const pointsEarned =
    Number(
      input.pointsEarned
    );

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new Error(
      "Price must be zero or higher."
    );
  }

  if (
    !Number.isFinite(
      salePrice
    ) ||
    salePrice < 0
  ) {
    throw new Error(
      "Sale price must be zero or higher."
    );
  }

  if (
    salePrice > 0 &&
    price > 0 &&
    salePrice > price
  ) {
    throw new Error(
      "Sale price cannot exceed the original price."
    );
  }

  if (
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    throw new Error(
      "Stock must be zero or higher."
    );
  }

  if (
    !Number.isFinite(
      pointsEarned
    ) ||
    pointsEarned < 0
  ) {
    throw new Error(
      "Points earned must be zero or higher."
    );
  }

  if (
    !isProductStatus(
      input.status
    )
  ) {
    throw new Error(
      "Please select a valid product status."
    );
  }
}

/* ============================================================
 * Normalizers
 * ============================================================
 */

function normalizeProduct(
  product: MerchantProduct
): MerchantProduct {
  const productType =
    normalizeProductType(
      product.productType
    );

  const status =
    normalizeProductStatus(
      product.status
    );

  const price =
    normalizeNumber(
      product.price
    );

  const salePrice =
    normalizeNumber(
      product.salePrice
    );

  const effectivePrice =
    salePrice > 0
      ? salePrice
      : price;

  return {
    productId:
      String(
        product.productId || ""
      ).trim(),

    merchantId:
      String(
        product.merchantId || ""
      ).trim(),

    productType,

    productName:
      String(
        product.productName || ""
      ).trim(),

    shortDescription:
      String(
        product.shortDescription ||
          ""
      ).trim(),

    description:
      String(
        product.description || ""
      ).trim(),

    category:
      String(
        product.category || ""
      ).trim(),

    price,

    salePrice,

    effectivePrice,

    hasSale:
      salePrice > 0 &&
      (
        price <= 0 ||
        salePrice < price
      ),

    imageUrl:
      String(
        product.imageUrl || ""
      ).trim(),

    gallery:
      Array.isArray(
        product.gallery
      )
        ? product.gallery
            .map((item) =>
              String(
                item || ""
              ).trim()
            )
            .filter(Boolean)
        : [],

    stock:
      normalizeInteger(
        product.stock
      ),

    pointsEarned:
      normalizeNumber(
        product.pointsEarned
      ),

    status,

    sortOrder:
      normalizeInteger(
        product.sortOrder
      ),

    isFeatured:
      Boolean(
        product.isFeatured
      ),

    createdAt:
      String(
        product.createdAt || ""
      ),

    updatedAt:
      String(
        product.updatedAt || ""
      ),
  };
}

function normalizeProductInput(
  input: MerchantProductInput
): MerchantProductInput {
  return {
    productType:
      normalizeProductType(
        input.productType
      ),

    productName:
      input.productName.trim(),

    shortDescription:
      input.shortDescription.trim(),

    description:
      input.description.trim(),

    category:
      input.category.trim(),

    price:
      normalizeMoney(
        input.price
      ),

    salePrice:
      normalizeMoney(
        input.salePrice
      ),

    imageUrl:
      input.imageUrl.trim(),

    gallery:
      input.gallery
        .map((item) =>
          item.trim()
        )
        .filter(Boolean),

    stock:
      normalizeInteger(
        input.stock
      ),

    pointsEarned:
      normalizeMoney(
        input.pointsEarned
      ),

    status:
      normalizeProductStatus(
        input.status
      ),

    sortOrder:
      normalizeInteger(
        input.sortOrder
      ),

    isFeatured:
      Boolean(
        input.isFeatured
      ),
  };
}

function normalizeProductType(
  value: unknown
): MerchantProductType {
  const type =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    type === "SERVICE"
  ) {
    return "SERVICE";
  }

  if (
    type === "PACKAGE"
  ) {
    return "PACKAGE";
  }

  if (
    type === "VOUCHER"
  ) {
    return "VOUCHER";
  }

  return "PRODUCT";
}

function normalizeProductStatus(
  value: unknown
): MerchantProductStatus {
  const status =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    status === "ACTIVE"
  ) {
    return "ACTIVE";
  }

  if (
    status === "INACTIVE"
  ) {
    return "INACTIVE";
  }

  return "DRAFT";
}

function normalizeNumber(
  value: unknown
): number {
  const number =
    Number(value || 0);

  return Number.isFinite(number)
    ? number
    : 0;
}

function normalizeInteger(
  value: unknown
): number {
  return Math.max(
    0,
    Math.floor(
      normalizeNumber(value)
    )
  );
}

function normalizeMoney(
  value: unknown
): number {
  return Math.round(
    normalizeNumber(value) *
      100
  ) / 100;
}

function isProductType(
  value: unknown
): value is MerchantProductType {
  return [
    "PRODUCT",
    "SERVICE",
    "PACKAGE",
    "VOUCHER",
  ].includes(
    String(value)
  );
}

function isProductStatus(
  value: unknown
): value is MerchantProductStatus {
  return [
    "DRAFT",
    "ACTIVE",
    "INACTIVE",
  ].includes(
    String(value)
  );
}