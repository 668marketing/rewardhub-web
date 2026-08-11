"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  Archive,
  Boxes,
  CheckCircle2,
  CircleOff,
  Edit3,
  FileImage,
  ImagePlus,
  Loader2,
  Package,
  PackagePlus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  getDriveImageUrl,
} from "@/lib/drive-image";

import MerchantNav from "@/components/layout/MerchantNav";

import {
  createMerchantProduct,
  deleteMerchantProduct,
  getMerchantProductManagement,
  updateMerchantProduct,
  updateMerchantProductStatus,
  uploadMerchantProductImage,
} from "@/lib/api";


type LanguageCode = "en" | "zh" | "ms";

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const productTranslations = {
  en: {
    accountMissing: "Merchant account information was not found. Please log in again.",
    merchantIdMissingAgain: "Merchant ID is missing. Please log out and log in again.",
    merchantIdMissing: "Merchant ID is missing. Please log in again.",
    unableLoad: "Unable to load products.",
    updatedSuccess: "Product updated successfully.",
    createdSuccess: "Product created successfully.",
    unableUpdate: "Unable to update product.",
    unableCreate: "Unable to create product.",
    uploadedUrlMissing: "Uploaded image URL is missing.",
    unableCover: "Unable to upload cover image.",
    maxGallery: "A product can contain a maximum of 6 gallery images.",
    unableGallery: "Unable to upload gallery images.",
    statusUpdated: "{{name}} status updated.",
    unableStatus: "Unable to update product status.",
    deactivatedSuccess: "Product deactivated successfully.",
    unableDeactivate: "Unable to deactivate product.",
    catalogue: "Merchant Catalogue",
    products: "Products",
    intro: "Create and manage products, services, packages and vouchers displayed in RewardHub.",
    addProduct: "Add Product",
    totalProducts: "Total Products",
    active: "Active",
    draft: "Draft",
    inactive: "Inactive",
    searchPlaceholder: "Search product name or ID",
    allStatuses: "All Statuses",
    allTypes: "All Types",
    product: "Product",
    service: "Service",
    package: "Package",
    voucher: "Voucher",
    allCategories: "All Categories",
    refresh: "Refresh",
    productCatalogue: "Product Catalogue",
    showing: "Showing {{shown}} of {{total}} products",
    featured: "Featured",
    tableProduct: "Product",
    type: "Type",
    category: "Category",
    price: "Price",
    stock: "Stock",
    status: "Status",
    updated: "Updated",
    actions: "Actions",
    closeForm: "Close product form",
    editProduct: "Edit Product",
    createCatalogueItem: "Create a new catalogue item",
    basicInformation: "Basic Information",
    basicDescription: "Product type, name and description",
    productType: "Product Type",
    categoryExample: "Example: Drinks",
    productName: "Product Name",
    enterProductName: "Enter product name",
    shortDescription: "Short Description",
    shortPlaceholder: "Short summary shown in product cards",
    fullDescription: "Full Description",
    fullPlaceholder: "Describe the product, service, package or voucher",
    pricingInventory: "Pricing and Inventory",
    pricingDescription: "Configure price, points and stock",
    deliveryShipping: "Delivery & Shipping",
    deliveryShippingDescription:
      "Choose whether this physical product includes free shipping or a fixed shipping fee.",
    shippingType: "Shipping Type",
    freeShipping: "Free Shipping",
    fixedShipping: "Fixed Shipping Fee",
    shippingFee: "Shipping Fee",
    shippingFeePlaceholder: "0.00",
    shippingFeeRequired:
      "Shipping fee must be greater than zero when Fixed Shipping Fee is selected.",
    noShippingNeeded:
      "Shipping settings apply to physical products only. Services, packages and vouchers do not require shipping.",
    originalPrice: "Original Price",
    salePrice: "Sale Price",
    optional: "Optional",
    pointsEarned: "Points Earned",
    productImages: "Product Images",
    imageDescription: "Upload one cover and up to six gallery images",
    publishing: "Publishing",
    publishingDescription: "Control visibility and ordering",
    sortOrder: "Sort Order",
    featuredProduct: "Featured Product",
    featuredDescription: "Highlight this item in selected marketplace sections.",
    cancel: "Cancel",
    saving: "Saving...",
    saveChanges: "Save Changes",
    createProduct: "Create Product",
    edit: "Edit",
    uploadingImage: "Uploading image...",
    uploadCover: "Upload cover image",
    imageRequirements: "JPG, PNG or WebP. Maximum 5 MB.",
    replace: "Replace",
    productCover: "Product cover",
    galleryImages: "Gallery Images",
    uploadedCount: "{{count}}/6 uploaded",
    addImages: "Add Images",
    noGalleryImages: "No gallery images",
    deactivateProduct: "Deactivate Product?",
    deactivateDescription: "{{name}} will be changed to Inactive and removed from public product listings.",
    deactivating: "Deactivating...",
    deactivate: "Deactivate",
    loadingProducts: "Loading products...",
    noMatching: "No matching products",
    noProducts: "No products yet",
    changeSearch: "Try changing your search or filters.",
    createFirst: "Create your first product, service, package or voucher.",
    productNameRequired: "Product name is required.",
    categoryRequired: "Category is required.",
    priceInvalid: "Price must be zero or higher.",
    salePriceInvalid: "Sale price must be zero or higher.",
    salePriceExceed: "Sale price cannot exceed the original price.",
    stockInvalid: "Stock must be zero or higher.",
    pointsInvalid: "Points earned must be zero or higher.",
    imagesOnly: "Only image files are allowed.",
    imageTooLarge: "Image cannot exceed 5 MB.",
    unableReadImage: "Unable to read image file.",
  },
  zh: {
    accountMissing: "找不到商家账户资料，请重新登录。",
    merchantIdMissingAgain: "找不到商家 ID，请退出后重新登录。",
    merchantIdMissing: "找不到商家 ID，请重新登录。",
    unableLoad: "无法加载产品。",
    updatedSuccess: "产品更新成功。",
    createdSuccess: "产品创建成功。",
    unableUpdate: "无法更新产品。",
    unableCreate: "无法创建产品。",
    uploadedUrlMissing: "找不到已上传图片的网址。",
    unableCover: "无法上传封面图片。",
    maxGallery: "每个产品最多只能包含 6 张相册图片。",
    unableGallery: "无法上传相册图片。",
    statusUpdated: "{{name}} 的状态已更新。",
    unableStatus: "无法更新产品状态。",
    deactivatedSuccess: "产品已成功停用。",
    unableDeactivate: "无法停用产品。",
    catalogue: "商家目录",
    products: "产品管理",
    intro: "创建和管理在 RewardHub 展示的产品、服务、配套和礼券。",
    addProduct: "添加产品",
    totalProducts: "产品总数",
    active: "上架",
    draft: "草稿",
    inactive: "停用",
    searchPlaceholder: "搜索产品名称或 ID",
    allStatuses: "全部状态",
    allTypes: "全部类型",
    product: "产品",
    service: "服务",
    package: "配套",
    voucher: "礼券",
    allCategories: "全部分类",
    refresh: "刷新",
    productCatalogue: "产品目录",
    showing: "显示 {{shown}} / {{total}} 个产品",
    featured: "精选产品",
    tableProduct: "产品",
    type: "类型",
    category: "分类",
    price: "价格",
    stock: "库存",
    status: "状态",
    updated: "更新时间",
    actions: "操作",
    closeForm: "关闭产品表单",
    editProduct: "编辑产品",
    createCatalogueItem: "创建新的目录项目",
    basicInformation: "基本资料",
    basicDescription: "设置产品类型、名称和说明",
    productType: "产品类型",
    categoryExample: "例如：饮料",
    productName: "产品名称",
    enterProductName: "输入产品名称",
    shortDescription: "简短说明",
    shortPlaceholder: "显示在产品卡片上的简短介绍",
    fullDescription: "完整说明",
    fullPlaceholder: "说明这个产品、服务、配套或礼券",
    pricingInventory: "价格与库存",
    pricingDescription: "设置价格、积分和库存",
    deliveryShipping: "配送与运费",
    deliveryShippingDescription:
      "为实体商品设置包邮或固定运费。",
    shippingType: "运费方式",
    freeShipping: "包邮",
    fixedShipping: "固定运费",
    shippingFee: "运费",
    shippingFeePlaceholder: "0.00",
    shippingFeeRequired:
      "选择固定运费时，运费必须大于 0。",
    noShippingNeeded:
      "只有实体商品需要设置运费。服务、配套和礼券不需要配送。",
    originalPrice: "原价",
    salePrice: "促销价",
    optional: "选填",
    pointsEarned: "可获得积分",
    productImages: "产品图片",
    imageDescription: "上传一张封面和最多六张相册图片",
    publishing: "发布设置",
    publishingDescription: "管理显示状态与排列顺序",
    sortOrder: "排列顺序",
    featuredProduct: "精选产品",
    featuredDescription: "在指定的 Marketplace 区域重点展示此项目。",
    cancel: "取消",
    saving: "正在保存……",
    saveChanges: "保存修改",
    createProduct: "创建产品",
    edit: "编辑",
    uploadingImage: "正在上传图片……",
    uploadCover: "上传封面图片",
    imageRequirements: "支持 JPG、PNG 或 WebP，最大 5MB。",
    replace: "更换",
    productCover: "产品封面",
    galleryImages: "相册图片",
    uploadedCount: "已上传 {{count}}/6",
    addImages: "添加图片",
    noGalleryImages: "暂无相册图片",
    deactivateProduct: "停用产品？",
    deactivateDescription: "{{name}} 将被改为停用状态，并从公开产品列表移除。",
    deactivating: "正在停用……",
    deactivate: "停用",
    loadingProducts: "正在加载产品……",
    noMatching: "没有符合条件的产品",
    noProducts: "目前还没有产品",
    changeSearch: "请尝试更改搜索内容或筛选条件。",
    createFirst: "创建第一个产品、服务、配套或礼券。",
    productNameRequired: "必须填写产品名称。",
    categoryRequired: "必须填写分类。",
    priceInvalid: "价格必须为 0 或以上。",
    salePriceInvalid: "促销价必须为 0 或以上。",
    salePriceExceed: "促销价不能高于原价。",
    stockInvalid: "库存必须为 0 或以上。",
    pointsInvalid: "可获得积分必须为 0 或以上。",
    imagesOnly: "只允许上传图片文件。",
    imageTooLarge: "图片不可超过 5MB。",
    unableReadImage: "无法读取图片文件。",
  },
  ms: {
    accountMissing: "Maklumat akaun pedagang tidak ditemui. Sila log masuk semula.",
    merchantIdMissingAgain: "ID pedagang tidak ditemui. Sila log keluar dan log masuk semula.",
    merchantIdMissing: "ID pedagang tidak ditemui. Sila log masuk semula.",
    unableLoad: "Tidak dapat memuatkan produk.",
    updatedSuccess: "Produk berjaya dikemas kini.",
    createdSuccess: "Produk berjaya dicipta.",
    unableUpdate: "Tidak dapat mengemas kini produk.",
    unableCreate: "Tidak dapat mencipta produk.",
    uploadedUrlMissing: "URL imej yang dimuat naik tidak ditemui.",
    unableCover: "Tidak dapat memuat naik imej muka hadapan.",
    maxGallery: "Satu produk boleh mempunyai maksimum 6 imej galeri.",
    unableGallery: "Tidak dapat memuat naik imej galeri.",
    statusUpdated: "Status {{name}} telah dikemas kini.",
    unableStatus: "Tidak dapat mengemas kini status produk.",
    deactivatedSuccess: "Produk berjaya dinyahaktifkan.",
    unableDeactivate: "Tidak dapat menyahaktifkan produk.",
    catalogue: "Katalog Pedagang",
    products: "Produk",
    intro: "Cipta dan urus produk, perkhidmatan, pakej dan baucar yang dipaparkan di RewardHub.",
    addProduct: "Tambah Produk",
    totalProducts: "Jumlah Produk",
    active: "Aktif",
    draft: "Draf",
    inactive: "Tidak Aktif",
    searchPlaceholder: "Cari nama atau ID produk",
    allStatuses: "Semua Status",
    allTypes: "Semua Jenis",
    product: "Produk",
    service: "Perkhidmatan",
    package: "Pakej",
    voucher: "Baucar",
    allCategories: "Semua Kategori",
    refresh: "Muat Semula",
    productCatalogue: "Katalog Produk",
    showing: "Memaparkan {{shown}} daripada {{total}} produk",
    featured: "Pilihan",
    tableProduct: "Produk",
    type: "Jenis",
    category: "Kategori",
    price: "Harga",
    stock: "Stok",
    status: "Status",
    updated: "Dikemas Kini",
    actions: "Tindakan",
    closeForm: "Tutup borang produk",
    editProduct: "Edit Produk",
    createCatalogueItem: "Cipta item katalog baharu",
    basicInformation: "Maklumat Asas",
    basicDescription: "Jenis, nama dan penerangan produk",
    productType: "Jenis Produk",
    categoryExample: "Contoh: Minuman",
    productName: "Nama Produk",
    enterProductName: "Masukkan nama produk",
    shortDescription: "Penerangan Ringkas",
    shortPlaceholder: "Ringkasan yang dipaparkan pada kad produk",
    fullDescription: "Penerangan Penuh",
    fullPlaceholder: "Terangkan produk, perkhidmatan, pakej atau baucar",
    pricingInventory: "Harga dan Inventori",
    pricingDescription: "Tetapkan harga, mata dan stok",
    deliveryShipping: "Penghantaran & Caj",
    deliveryShippingDescription:
      "Pilih penghantaran percuma atau caj penghantaran tetap untuk produk fizikal.",
    shippingType: "Jenis Penghantaran",
    freeShipping: "Penghantaran Percuma",
    fixedShipping: "Caj Penghantaran Tetap",
    shippingFee: "Caj Penghantaran",
    shippingFeePlaceholder: "0.00",
    shippingFeeRequired:
      "Caj penghantaran mesti lebih daripada 0 apabila Caj Penghantaran Tetap dipilih.",
    noShippingNeeded:
      "Tetapan penghantaran hanya untuk produk fizikal. Perkhidmatan, pakej dan baucar tidak memerlukan penghantaran.",
    originalPrice: "Harga Asal",
    salePrice: "Harga Jualan",
    optional: "Pilihan",
    pointsEarned: "Mata Diperoleh",
    productImages: "Imej Produk",
    imageDescription: "Muat naik satu imej muka hadapan dan sehingga enam imej galeri",
    publishing: "Penerbitan",
    publishingDescription: "Kawal paparan dan susunan",
    sortOrder: "Susunan",
    featuredProduct: "Produk Pilihan",
    featuredDescription: "Tonjolkan item ini dalam bahagian Marketplace terpilih.",
    cancel: "Batal",
    saving: "Sedang Menyimpan...",
    saveChanges: "Simpan Perubahan",
    createProduct: "Cipta Produk",
    edit: "Edit",
    uploadingImage: "Sedang memuat naik imej...",
    uploadCover: "Muat naik imej muka hadapan",
    imageRequirements: "JPG, PNG atau WebP. Maksimum 5MB.",
    replace: "Ganti",
    productCover: "Imej muka hadapan produk",
    galleryImages: "Imej Galeri",
    uploadedCount: "{{count}}/6 dimuat naik",
    addImages: "Tambah Imej",
    noGalleryImages: "Tiada imej galeri",
    deactivateProduct: "Nyahaktifkan Produk?",
    deactivateDescription: "{{name}} akan ditukar kepada Tidak Aktif dan dikeluarkan daripada senarai awam.",
    deactivating: "Sedang Menyahaktifkan...",
    deactivate: "Nyahaktifkan",
    loadingProducts: "Sedang memuatkan produk...",
    noMatching: "Tiada produk sepadan",
    noProducts: "Belum ada produk",
    changeSearch: "Cuba ubah carian atau penapis anda.",
    createFirst: "Cipta produk, perkhidmatan, pakej atau baucar pertama anda.",
    productNameRequired: "Nama produk diperlukan.",
    categoryRequired: "Kategori diperlukan.",
    priceInvalid: "Harga mesti sifar atau lebih tinggi.",
    salePriceInvalid: "Harga jualan mesti sifar atau lebih tinggi.",
    salePriceExceed: "Harga jualan tidak boleh melebihi harga asal.",
    stockInvalid: "Stok mesti sifar atau lebih tinggi.",
    pointsInvalid: "Mata yang diperoleh mesti sifar atau lebih tinggi.",
    imagesOnly: "Hanya fail imej dibenarkan.",
    imageTooLarge: "Imej tidak boleh melebihi 5MB.",
    unableReadImage: "Tidak dapat membaca fail imej.",
  },
} as const;

type ProductTranslation = {
  [Key in keyof typeof productTranslations.en]: string;
};

const ProductLanguageContext = createContext<{
  language: LanguageCode;
  t: ProductTranslation;
}>({
  language: "en",
  t: productTranslations.en,
});

function normalizeLanguage(value: string | null): LanguageCode {
  return value === "zh" || value === "ms" ? value : "en";
}

function fillTranslation(
  value: string,
  replacements: Record<string, string | number>
) {
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{{${key}}}`, String(replacement)),
    value
  );
}

function useProductLanguage() {
  return useContext(ProductLanguageContext);
}

/* ============================================================
 * Types
 * ============================================================
 */

type ProductType =
  | "PRODUCT"
  | "SERVICE"
  | "PACKAGE"
  | "VOUCHER";

type ProductStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE";

type ShippingType =
  | "FREE"
  | "FIXED"
  | "NONE";

type MerchantProduct = {
  productId: string;
  merchantId: string;

  productType: ProductType;
  productName: string;

  shortDescription: string;
  description: string;
  category: string;

  price: number;
  salePrice: number;
  effectivePrice: number;
  hasSale: boolean;

  shippingType: ShippingType;
  shippingFee: number;
  requiresShipping: boolean;
  isFreeShipping: boolean;

  imageUrl: string;
  gallery: string[];

  stock: number;
  pointsEarned: number;

  status: ProductStatus;
  sortOrder: number;
  isFeatured: boolean;

  createdAt: string;
  updatedAt: string;
};

type ProductSummary = {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  featured: number;
  totalStock: number;
};

type ProductFormState = {
  productType: ProductType;
  productName: string;
  shortDescription: string;
  description: string;
  category: string;

  price: string;
  salePrice: string;

  shippingType: ShippingType;
  shippingFee: string;

  imageUrl: string;
  gallery: string[];

  stock: string;
  pointsEarned: string;

  status: ProductStatus;
  sortOrder: string;
  isFeatured: boolean;
};

const EMPTY_SUMMARY: ProductSummary = {
  total: 0,
  active: 0,
  draft: 0,
  inactive: 0,
  featured: 0,
  totalStock: 0,
};

const EMPTY_FORM: ProductFormState = {
  productType: "PRODUCT",
  productName: "",
  shortDescription: "",
  description: "",
  category: "",

  price: "",
  salePrice: "",

  shippingType: "FREE",
  shippingFee: "",

  imageUrl: "",
  gallery: [],

  stock: "0",
  pointsEarned: "0",

  status: "DRAFT",
  sortOrder: "0",
  isFeatured: false,
};

/* ============================================================
 * Main Page
 * ============================================================
 */

export default function MerchantProductsPage() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const t = productTranslations[language];
  const [merchantId, setMerchantId] =
    useState("");

  const [products, setProducts] =
    useState<MerchantProduct[]>([]);

  const [summary, setSummary] =
    useState<ProductSummary>(
      EMPTY_SUMMARY
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

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

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [
    editingProduct,
    setEditingProduct,
  ] =
    useState<MerchantProduct | null>(
      null
    );

  const [form, setForm] =
    useState<ProductFormState>({
      ...EMPTY_FORM,
      gallery: [],
    });

  const [formError, setFormError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    uploadingCover,
    setUploadingCover,
  ] = useState(false);

  const [
    uploadingGallery,
    setUploadingGallery,
  ] = useState(false);

  const [
    statusUpdatingId,
    setStatusUpdatingId,
  ] = useState("");

  const [
    deletingProduct,
    setDeletingProduct,
  ] =
    useState<MerchantProduct | null>(
      null
    );

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    setLanguage(
      normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))
    );

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: string }>;

      setLanguage(
        normalizeLanguage(
          customEvent.detail?.language ||
            localStorage.getItem(LANGUAGE_STORAGE_KEY)
        )
      );
    }

    window.addEventListener(
      "rewardhub-language-change",
      handleLanguageChange as EventListener
    );
    window.addEventListener("storage", handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener(
        "rewardhub-language-change",
        handleLanguageChange as EventListener
      );
      window.removeEventListener(
        "storage",
        handleLanguageChange as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const storedMerchantId =
      getStoredMerchantId();

    console.log(
      "Products stored merchant ID:",
      storedMerchantId
    );

    if (!storedMerchantId) {
      setPageError(
        t.accountMissing
      );

      setLoading(false);
      return;
    }

    setMerchantId(
      storedMerchantId
    );

    void loadProducts(
      storedMerchantId,
      false
    );
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        !saving &&
        !uploadingCover &&
        !uploadingGallery
      ) {
        setDrawerOpen(false);
        setEditingProduct(null);
        setForm({
          ...EMPTY_FORM,
          gallery: [],
        });
        setFormError("");
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    drawerOpen,
    saving,
    uploadingCover,
    uploadingGallery,
  ]);

  async function loadProducts(
    selectedMerchantId: string,
    silent = true
  ) {
    if (!selectedMerchantId) {
      return;
    }

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setPageError("");

      const response =
        await getMerchantProductManagement({
          merchantId:
            selectedMerchantId,
        });

      const source =
        unwrapApiData(response);

      const nextProducts =
        Array.isArray(
          source?.products
        )
          ? source.products.map(
              normalizeProduct
            )
          : [];

      setProducts(
        nextProducts
      );

      setSummary(
        normalizeSummary(
          source?.summary
        )
      );
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
          t.unableLoad
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const categories =
    useMemo(() => {
      const values = products
        .map((product) =>
          product.category.trim()
        )
        .filter(Boolean);

      return Array.from(
        new Set(values)
      ).sort((first, second) =>
        first.localeCompare(second)
      );
    }, [products]);

  const filteredProducts =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      return products.filter(
        (product) => {
          if (
            statusFilter !== "ALL" &&
            product.status !==
              statusFilter
          ) {
            return false;
          }

          if (
            typeFilter !== "ALL" &&
            product.productType !==
              typeFilter
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
      products,
      search,
      statusFilter,
      typeFilter,
      categoryFilter,
    ]);

  function getActiveMerchantId() {
    const activeMerchantId =
      merchantId ||
      getStoredMerchantId();

    if (
      activeMerchantId &&
      activeMerchantId !== merchantId
    ) {
      setMerchantId(
        activeMerchantId
      );
    }

    return activeMerchantId;
  }

  function openCreateDrawer() {
    setEditingProduct(null);

    setForm({
      ...EMPTY_FORM,
      gallery: [],
    });

    setFormError("");
    setSuccessMessage("");
    setDrawerOpen(true);
  }

  function openEditDrawer(
    product: MerchantProduct
  ) {
    setEditingProduct(
      product
    );

    setForm({
      productType:
        product.productType,

      productName:
        product.productName,

      shortDescription:
        product.shortDescription,

      description:
        product.description,

      category:
        product.category,

      price:
        String(product.price),

      salePrice:
        product.salePrice > 0
          ? String(
              product.salePrice
            )
          : "",

      shippingType:
        product.productType === "PRODUCT"
          ? product.shippingType === "FIXED"
            ? "FIXED"
            : "FREE"
          : "NONE",

      shippingFee:
        product.shippingType === "FIXED" &&
        product.shippingFee > 0
          ? String(product.shippingFee)
          : "",

      imageUrl:
        product.imageUrl,

      gallery:
        [...product.gallery],

      stock:
        String(product.stock),

      pointsEarned:
        String(
          product.pointsEarned
        ),

      status:
        product.status,

      sortOrder:
        String(
          product.sortOrder
        ),

      isFeatured:
        product.isFeatured,
    });

    setFormError("");
    setSuccessMessage("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (
      saving ||
      uploadingCover ||
      uploadingGallery
    ) {
      return;
    }

    setDrawerOpen(false);
    setEditingProduct(null);

    setForm({
      ...EMPTY_FORM,
      gallery: [],
    });

    setFormError("");
  }

  function updateForm<
    Key extends keyof ProductFormState,
  >(
    key: Key,
    value: ProductFormState[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setFormError("");
  }

  async function handleSaveProduct() {
    const activeMerchantId =
      getActiveMerchantId();

    if (!activeMerchantId) {
      setFormError(
        t.merchantIdMissingAgain
      );

      return;
    }

    const validationError =
      validateProductForm(form, t);

    if (validationError) {
      setFormError(
        validationError
      );

      return;
    }

    const payload = {
      merchantId:
        activeMerchantId,

      productType:
        form.productType,

      productName:
        form.productName.trim(),

      shortDescription:
        form.shortDescription.trim(),

      description:
        form.description.trim(),

      category:
        form.category.trim(),

      price:
        normalizeMoney(
          form.price
        ),

      salePrice:
        normalizeMoney(
          form.salePrice
        ),

      shippingType:
        form.productType === "PRODUCT"
          ? form.shippingType === "FIXED"
            ? "FIXED"
            : "FREE"
          : "NONE",

      shippingFee:
        form.productType === "PRODUCT" &&
        form.shippingType === "FIXED"
          ? normalizeMoney(
              form.shippingFee
            )
          : 0,

      imageUrl:
        form.imageUrl.trim(),

      gallery:
        form.gallery,

      stock:
        normalizeInteger(
          form.stock
        ),

      pointsEarned:
        normalizeMoney(
          form.pointsEarned
        ),

      status:
        form.status,

      sortOrder:
        normalizeInteger(
          form.sortOrder
        ),

      isFeatured:
        form.isFeatured,
    };

    try {
      setSaving(true);
      setFormError("");

      if (editingProduct) {
        await updateMerchantProduct({
          ...payload,
          productId:
            editingProduct.productId,
        });

        setSuccessMessage(
          t.updatedSuccess
        );
      } else {
        await createMerchantProduct(
          payload
        );

        setSuccessMessage(
          t.createdSuccess
        );
      }

      setDrawerOpen(false);
      setEditingProduct(null);

      setForm({
        ...EMPTY_FORM,
        gallery: [],
      });

      await loadProducts(
        activeMerchantId,
        true
      );
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          editingProduct
            ? t.unableUpdate
            : t.unableCreate
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCoverUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const activeMerchantId =
      getActiveMerchantId();

    const input =
      event.currentTarget;

    const file =
      input.files?.[0];

    input.value = "";

    if (!activeMerchantId) {
      setFormError(
        t.merchantIdMissing
      );

      return;
    }

    if (!file) {
      return;
    }

    const fileError =
      validateImageFile(file, t);

    if (fileError) {
      setFormError(fileError);
      return;
    }

    try {
      setUploadingCover(true);
      setFormError("");

      const base64 =
        await fileToDataUrl(
          file,
          t.unableReadImage
        );

      const response =
        await uploadMerchantProductImage({
          merchantId:
            activeMerchantId,

          productId:
            editingProduct?.productId ||
            "",

          fileName:
            file.name,

          mimeType:
            file.type,

          base64,

          imageType:
            "COVER",
        });

      const source =
        unwrapApiData(response);

      const imageUrl =
        String(
          source?.imageUrl || ""
        ).trim();

      if (!imageUrl) {
        throw new Error(
          t.uploadedUrlMissing
        );
      }

      updateForm(
        "imageUrl",
        imageUrl
      );
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          t.unableCover
        )
      );
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleGalleryUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const activeMerchantId =
      getActiveMerchantId();

    const input =
      event.currentTarget;

    const files =
      Array.from(
        input.files || []
      );

    input.value = "";

    if (!activeMerchantId) {
      setFormError(
        t.merchantIdMissing
      );

      return;
    }

    if (files.length === 0) {
      return;
    }

    if (
      form.gallery.length +
        files.length >
      6
    ) {
      setFormError(
        t.maxGallery
      );

      return;
    }

    for (const file of files) {
      const fileError =
        validateImageFile(file, t);

      if (fileError) {
        setFormError(fileError);
        return;
      }
    }

    try {
      setUploadingGallery(true);
      setFormError("");

      const uploadedUrls: string[] =
        [];

      for (const file of files) {
        const base64 =
          await fileToDataUrl(
            file,
            t.unableReadImage
          );

        const response =
          await uploadMerchantProductImage({
            merchantId:
              activeMerchantId,

            productId:
              editingProduct?.productId ||
              "",

            fileName:
              file.name,

            mimeType:
              file.type,

            base64,

            imageType:
              "GALLERY",
          });

        const source =
          unwrapApiData(response);

        const imageUrl =
          String(
            source?.imageUrl || ""
          ).trim();

        if (imageUrl) {
          uploadedUrls.push(
            imageUrl
          );
        }
      }

      setForm((current) => ({
        ...current,

        gallery: [
          ...current.gallery,
          ...uploadedUrls,
        ].slice(0, 6),
      }));
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          t.unableGallery
        )
      );
    } finally {
      setUploadingGallery(false);
    }
  }

  function removeGalleryImage(
    index: number
  ) {
    setForm((current) => ({
      ...current,

      gallery:
        current.gallery.filter(
          (_, imageIndex) =>
            imageIndex !== index
        ),
    }));
  }

  async function handleStatusChange(
    product: MerchantProduct,
    nextStatus: ProductStatus
  ) {
    const activeMerchantId =
      getActiveMerchantId();

    if (!activeMerchantId) {
      setPageError(
        t.merchantIdMissing
      );

      return;
    }

    if (
      product.status === nextStatus
    ) {
      return;
    }

    try {
      setStatusUpdatingId(
        product.productId
      );

      setPageError("");

      await updateMerchantProductStatus({
        merchantId:
          activeMerchantId,

        productId:
          product.productId,

        status:
          nextStatus,
      });

      setSuccessMessage(
        fillTranslation(t.statusUpdated, { name: product.productName })
      );

      await loadProducts(
        activeMerchantId,
        true
      );
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
          t.unableStatus
        )
      );
    } finally {
      setStatusUpdatingId("");
    }
  }

  async function confirmDeleteProduct() {
    const activeMerchantId =
      getActiveMerchantId();

    if (!activeMerchantId) {
      setPageError(
        t.merchantIdMissing
      );

      return;
    }

    if (!deletingProduct) {
      return;
    }

    try {
      setDeleting(true);
      setPageError("");

      await deleteMerchantProduct({
        merchantId:
          activeMerchantId,

        productId:
          deletingProduct.productId,
      });

      setDeletingProduct(null);

      setSuccessMessage(
        t.deactivatedSuccess
      );

      await loadProducts(
        activeMerchantId,
        true
      );
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
          t.unableDeactivate
        )
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleRefresh() {
    const activeMerchantId =
      getActiveMerchantId();

    if (!activeMerchantId) {
      setPageError(
        t.merchantIdMissing
      );

      return;
    }

    await loadProducts(
      activeMerchantId,
      true
    );
  }

  return (
    <ProductLanguageContext.Provider value={{ language, t }}>
      <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-7xl">
          <header className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300 sm:text-xs">
                  {t.catalogue}
                </p>

                <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
                  {t.products}
                </h1>

                <p className="mt-3 max-w-2xl text-xs font-bold leading-5 text-slate-400 sm:text-sm sm:leading-6">
                  {t.intro}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  openCreateDrawer
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                <Plus className="h-4 w-4" />
                {t.addProduct}
              </button>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-4">
              <SummaryCard
                icon={Boxes}
                title={t.totalProducts}
                value={summary.total}
              />

              <SummaryCard
                icon={CheckCircle2}
                title={t.active}
                value={summary.active}
              />

              <SummaryCard
                icon={Archive}
                title={t.draft}
                value={summary.draft}
              />

              <SummaryCard
                icon={CircleOff}
                title={t.inactive}
                value={summary.inactive}
              />
            </div>
          </header>

          {pageError ? (
            <AlertBox
              type="error"
              message={pageError}
              onClose={() =>
                setPageError("")
              }
            />
          ) : null}

          {successMessage ? (
            <AlertBox
              type="success"
              message={
                successMessage
              }
              onClose={() =>
                setSuccessMessage("")
              }
            />
          ) : null}

          <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6">
            <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_180px_180px_180px_auto]">
              <label className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder={t.searchPlaceholder}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950"
                />
              </label>

              <FilterSelect
                value={statusFilter}
                onChange={
                  setStatusFilter
                }
              >
                <option value="ALL">
                  {t.allStatuses}
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
                  {t.allTypes}
                </option>
                <option value="PRODUCT">
                  {t.product}
                </option>
                <option value="SERVICE">
                  {t.service}
                </option>
                <option value="PACKAGE">
                  {t.package}
                </option>
                <option value="VOUCHER">
                  {t.voucher}
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
                  {t.allCategories}
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

              <button
                type="button"
                disabled={refreshing}
                onClick={() =>
                  void handleRefresh()
                }
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t.refresh
                )}
              </button>
            </div>
          </section>

          <section className="mt-5 overflow-hidden rounded-[1.75rem] bg-white shadow-sm sm:mt-6 sm:rounded-[2rem]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  {t.productCatalogue}
                </h2>

                <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
                  Showing{" "}
                  {
                    filteredProducts.length
                  }{" "}
                  of {products.length}{" "}
                  products
                </p>
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-xs font-black text-slate-400">
                  {t.featured}
                </p>

                <p className="mt-1 text-lg font-black text-slate-950">
                  {summary.featured}
                </p>
              </div>
            </div>

            {loading ? (
              <ProductsLoading />
            ) : filteredProducts.length ===
              0 ? (
              <ProductsEmpty
                hasProducts={
                  products.length > 0
                }
                onCreate={
                  openCreateDrawer
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
                        product={product}
                        statusUpdating={
                          statusUpdatingId ===
                          product.productId
                        }
                        onEdit={() =>
                          openEditDrawer(
                            product
                          )
                        }
                        onDelete={() =>
                          setDeletingProduct(
                            product
                          )
                        }
                        onStatusChange={(
                          status
                        ) =>
                          void handleStatusChange(
                            product,
                            status
                          )
                        }
                      />
                    )
                  )}
                </div>

                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                        <th className="px-6 py-4">
                          {t.tableProduct}
                        </th>

                        <th className="px-4 py-4">
                          {t.type}
                        </th>

                        <th className="px-4 py-4">
                          {t.category}
                        </th>

                        <th className="px-4 py-4 text-right">
                          {t.price}
                        </th>

                        <th className="px-4 py-4 text-right">
                          {t.stock}
                        </th>

                        <th className="px-4 py-4">
                          {t.status}
                        </th>

                        <th className="px-4 py-4">
                          {t.updated}
                        </th>

                        <th className="px-6 py-4 text-right">
                          {t.actions}
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
                            statusUpdating={
                              statusUpdatingId ===
                              product.productId
                            }
                            onEdit={() =>
                              openEditDrawer(
                                product
                              )
                            }
                            onDelete={() =>
                              setDeletingProduct(
                                product
                              )
                            }
                            onStatusChange={(
                              status
                            ) =>
                              void handleStatusChange(
                                product,
                                status
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
      </main>

      <ProductDrawer
        open={drawerOpen}
        editingProduct={
          editingProduct
        }
        form={form}
        formError={formError}
        saving={saving}
        uploadingCover={
          uploadingCover
        }
        uploadingGallery={
          uploadingGallery
        }
        onClose={closeDrawer}
        onChange={updateForm}
        onSave={() =>
          void handleSaveProduct()
        }
        onCoverUpload={
          handleCoverUpload
        }
        onGalleryUpload={
          handleGalleryUpload
        }
        onRemoveGallery={
          removeGalleryImage
        }
      />

      <DeleteProductDialog
        product={
          deletingProduct
        }
        deleting={deleting}
        onClose={() => {
          if (!deleting) {
            setDeletingProduct(
              null
            );
          }
        }}
        onConfirm={() =>
          void confirmDeleteProduct()
        }
      />
      </>
    </ProductLanguageContext.Provider>
  );
}

/* ============================================================
 * Product Drawer
 * ============================================================
 */

function ProductDrawer({
  open,
  editingProduct,
  form,
  formError,
  saving,
  uploadingCover,
  uploadingGallery,
  onClose,
  onChange,
  onSave,
  onCoverUpload,
  onGalleryUpload,
  onRemoveGallery,
}: {
  open: boolean;
  editingProduct:
    | MerchantProduct
    | null;
  form: ProductFormState;
  formError: string;
  saving: boolean;
  uploadingCover: boolean;
  uploadingGallery: boolean;

  onClose: () => void;

  onChange: <
    Key extends keyof ProductFormState,
  >(
    key: Key,
    value: ProductFormState[Key]
  ) => void;

  onSave: () => void;

  onCoverUpload: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;

  onGalleryUpload: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;

  onRemoveGallery: (
    index: number
  ) => void;
}) {
  const { t } = useProductLanguage();
  if (!open) {
    return null;
  }

  const busy =
    saving ||
    uploadingCover ||
    uploadingGallery;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label={t.closeForm}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 flex h-full min-h-0 w-full max-w-[680px] flex-col overflow-hidden bg-white shadow-2xl">
        <header className="shrink-0 flex items-start justify-between gap-5 border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              {editingProduct ? (
                <Edit3 className="h-5 w-5" />
              ) : (
                <PackagePlus className="h-5 w-5" />
              )}
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-950">
                {editingProduct
                  ? t.editProduct
                  : t.addProduct}
              </h2>

              <p className="mt-1 text-xs font-bold text-slate-500">
                {editingProduct
                  ? editingProduct.productId
                  : t.createCatalogueItem}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 pb-8 sm:px-7">
          {formError ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="space-y-7">
            <FormSection
              title={t.basicInformation}
              description={t.basicDescription}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelect
                  label={t.productType}
                  value={
                    form.productType
                  }
                  onChange={(value) => {
                    const nextType =
                      value as ProductType;

                    onChange(
                      "productType",
                      nextType
                    );

                    if (
                      nextType === "PRODUCT"
                    ) {
                      if (
                        form.shippingType ===
                        "NONE"
                      ) {
                        onChange(
                          "shippingType",
                          "FREE"
                        );
                      }
                    } else {
                      onChange(
                        "shippingType",
                        "NONE"
                      );
                      onChange(
                        "shippingFee",
                        ""
                      );
                    }
                  }}
                >
                  <option value="PRODUCT">
                    {t.product}
                  </option>

                  <option value="SERVICE">
                    {t.service}
                  </option>

                  <option value="PACKAGE">
                    {t.package}
                  </option>

                  <option value="VOUCHER">
                    {t.voucher}
                  </option>
                </FormSelect>

                <FormInput
                  label={t.category}
                  value={form.category}
                  placeholder={t.categoryExample}
                  onChange={(value) =>
                    onChange(
                      "category",
                      value
                    )
                  }
                />
              </div>

              <div className="mt-4">
                <FormInput
                  label={t.productName}
                  required
                  value={
                    form.productName
                  }
                  maxLength={120}
                  placeholder={t.enterProductName}
                  onChange={(value) =>
                    onChange(
                      "productName",
                      value
                    )
                  }
                />
              </div>

              <div className="mt-4">
                <FormTextArea
                  label={t.shortDescription}
                  value={
                    form.shortDescription
                  }
                  maxLength={250}
                  rows={3}
                  placeholder={t.shortPlaceholder}
                  onChange={(value) =>
                    onChange(
                      "shortDescription",
                      value
                    )
                  }
                />
              </div>

              <div className="mt-4">
                <FormTextArea
                  label={t.fullDescription}
                  value={
                    form.description
                  }
                  maxLength={5000}
                  rows={6}
                  placeholder={t.fullPlaceholder}
                  onChange={(value) =>
                    onChange(
                      "description",
                      value
                    )
                  }
                />
              </div>
            </FormSection>

            <FormSection
              title={t.pricingInventory}
              description={t.pricingDescription}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label={t.originalPrice}
                  type="number"
                  min="0"
                  step="0.01"
                  prefix="RM"
                  value={form.price}
                  placeholder="0.00"
                  onChange={(value) =>
                    onChange(
                      "price",
                      value
                    )
                  }
                />

                <FormInput
                  label={t.salePrice}
                  type="number"
                  min="0"
                  step="0.01"
                  prefix="RM"
                  value={
                    form.salePrice
                  }
                  placeholder={t.optional}
                  onChange={(value) =>
                    onChange(
                      "salePrice",
                      value
                    )
                  }
                />

                <FormInput
                  label={t.stock}
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  placeholder="0"
                  onChange={(value) =>
                    onChange(
                      "stock",
                      value
                    )
                  }
                />

                <FormInput
                  label={t.pointsEarned}
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.pointsEarned
                  }
                  placeholder="0"
                  onChange={(value) =>
                    onChange(
                      "pointsEarned",
                      value
                    )
                  }
                />
              </div>
            </FormSection>

            <FormSection
              title={t.deliveryShipping}
              description={t.deliveryShippingDescription}
            >
              {form.productType === "PRODUCT" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label
                      className={[
                        "cursor-pointer rounded-2xl border p-4 transition",
                        form.shippingType === "FREE"
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-slate-300",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="shippingType"
                          value="FREE"
                          checked={
                            form.shippingType === "FREE"
                          }
                          onChange={() => {
                            onChange(
                              "shippingType",
                              "FREE"
                            );
                            onChange(
                              "shippingFee",
                              ""
                            );
                          }}
                          className="mt-1 h-4 w-4 accent-slate-950"
                        />

                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {t.freeShipping}
                          </p>

                          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                            RM0.00
                          </p>
                        </div>
                      </div>
                    </label>

                    <label
                      className={[
                        "cursor-pointer rounded-2xl border p-4 transition",
                        form.shippingType === "FIXED"
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-slate-300",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="shippingType"
                          value="FIXED"
                          checked={
                            form.shippingType === "FIXED"
                          }
                          onChange={() =>
                            onChange(
                              "shippingType",
                              "FIXED"
                            )
                          }
                          className="mt-1 h-4 w-4 accent-slate-950"
                        />

                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {t.fixedShipping}
                          </p>

                          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                            {t.shippingFee}
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {form.shippingType === "FIXED" ? (
                    <div className="mt-4">
                      <FormInput
                        label={t.shippingFee}
                        type="number"
                        min="0.01"
                        step="0.01"
                        prefix="RM"
                        value={form.shippingFee}
                        placeholder={t.shippingFeePlaceholder}
                        onChange={(value) =>
                          onChange(
                            "shippingFee",
                            value
                          )
                        }
                      />
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold leading-6 text-slate-500">
                    {t.noShippingNeeded}
                  </p>
                </div>
              )}
            </FormSection>

            <FormSection
              title={t.productImages}
              description={t.imageDescription}
            >
              <CoverImageUploader
                imageUrl={
                  form.imageUrl
                }
                uploading={
                  uploadingCover
                }
                onUpload={
                  onCoverUpload
                }
                onRemove={() =>
                  onChange(
                    "imageUrl",
                    ""
                  )
                }
              />

              <div className="mt-6">
                <GalleryUploader
                  gallery={
                    form.gallery
                  }
                  uploading={
                    uploadingGallery
                  }
                  onUpload={
                    onGalleryUpload
                  }
                  onRemove={
                    onRemoveGallery
                  }
                />
              </div>
            </FormSection>

            <FormSection
              title={t.publishing}
              description={t.publishingDescription}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelect
                  label={t.status}
                  value={form.status}
                  onChange={(value) =>
                    onChange(
                      "status",
                      value as ProductStatus
                    )
                  }
                >
                  <option value="DRAFT">
                    {t.draft}
                  </option>

                  <option value="ACTIVE">
                    {t.active}
                  </option>

                  <option value="INACTIVE">
                    {t.inactive}
                  </option>
                </FormSelect>

                <FormInput
                  label={t.sortOrder}
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.sortOrder
                  }
                  placeholder="0"
                  onChange={(value) =>
                    onChange(
                      "sortOrder",
                      value
                    )
                  }
                />
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {t.featuredProduct}
                  </p>

                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                    {t.featuredDescription}
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    form.isFeatured
                  }
                  onChange={(event) =>
                    onChange(
                      "isFeatured",
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-slate-950"
                />
              </label>
            </FormSection>
          </div>
        </div>

        <footer className="relative z-10 shrink-0 border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
  <div className="mx-auto flex w-full max-w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
    <button
      type="button"
      disabled={busy}
      onClick={onClose}
      className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-600 transition hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {t.cancel}
    </button>

    <button
      type="button"
      disabled={busy}
      onClick={onSave}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : editingProduct ? (
        <Edit3 className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}

      {saving
        ? t.saving
        : editingProduct
          ? t.saveChanges
          : t.createProduct}
    </button>
  </div>
</footer>
      </aside>
    </div>
  );
}

/* ============================================================
 * Product Table
 * ============================================================
 */

function ProductTableRow({
  product,
  statusUpdating,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  product: MerchantProduct;
  statusUpdating: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (
    status: ProductStatus
  ) => void;
}) {
  const { language, t } = useProductLanguage();
  return (
    <tr className="border-b border-slate-100 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
      <td className="px-6 py-5">
        <div className="flex min-w-[270px] items-center gap-4">
          <ProductImage
            product={product}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="max-w-[230px] truncate font-black text-slate-950">
                {product.productName}
              </p>

              {product.isFeatured ? (
                <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
              ) : null}
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {product.productId}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-5">
        {formatProductType(
          product.productType,
          t
        )}
      </td>

      <td className="px-4 py-5">
        {product.category || "—"}
      </td>

      <td className="px-4 py-5 text-right">
        <ProductPrice
          product={product}
        />
      </td>

      <td className="px-4 py-5 text-right font-black text-slate-950">
        {product.stock}
      </td>

      <td className="px-4 py-5">
        {statusUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <select
            value={product.status}
            onChange={(event) =>
              onStatusChange(
                event.target
                  .value as ProductStatus
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none"
          >
            <option value="ACTIVE">
              {t.active}
            </option>

            <option value="DRAFT">
              {t.draft}
            </option>

            <option value="INACTIVE">
              {t.inactive}
            </option>
          </select>
        )}
      </td>

      <td className="whitespace-nowrap px-4 py-5 text-xs text-slate-500">
        {formatDate(
          product.updatedAt ||
            product.createdAt,
          language
        )}
      </td>

      <td className="px-6 py-5">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {t.edit}
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ============================================================
 * Product Mobile Card
 * ============================================================
 */

function ProductMobileCard({
  product,
  statusUpdating,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  product: MerchantProduct;
  statusUpdating: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (
    status: ProductStatus
  ) => void;
}) {
  const { t } = useProductLanguage();
  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
      <div className="flex gap-4">
        <ProductImage
          product={product}
          large
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-950">
                {product.productName}
              </p>

              <p className="mt-1 text-[10px] font-bold text-slate-400">
                {product.productId}
              </p>
            </div>

            {product.isFeatured ? (
              <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <TypeBadge
              type={
                product.productType
              }
            />

            <StatusBadge
              status={
                product.status
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MobileInfo
          label={t.price}
          value={formatMoney(
            product.effectivePrice
          )}
        />

        <MobileInfo
          label={t.stock}
          value={String(
            product.stock
          )}
        />

        <MobileInfo
          label={t.category}
          value={
            product.category || "—"
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
        {statusUpdating ? (
          <div className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        ) : (
          <select
            value={product.status}
            onChange={(event) =>
              onStatusChange(
                event.target
                  .value as ProductStatus
              )
            }
            className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none"
          >
            <option value="ACTIVE">
              {t.active}
            </option>

            <option value="DRAFT">
              {t.draft}
            </option>

            <option value="INACTIVE">
              {t.inactive}
            </option>
          </select>
        )}

        <button
          type="button"
          onClick={onEdit}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white"
        >
          <Edit3 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

/* ============================================================
 * Upload Components
 * ============================================================
 */

function CoverImageUploader({
  imageUrl,
  uploading,
  onUpload,
  onRemove,
}: {
  imageUrl: string;
  uploading: boolean;

  onUpload: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;

  onRemove: () => void;
}) {
  const { t } = useProductLanguage();
  if (imageUrl) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <img
  src={getDriveImageUrl(
    imageUrl
  )}
  alt={t.productCover}
  className="h-64 w-full object-contain"
  onError={(event) => {
    event.currentTarget.style.display =
      "none";
  }}
/>

        <div className="absolute right-3 top-3 flex gap-2">
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white shadow-lg">
            <Upload className="h-3.5 w-3.5" />
            {t.replace}

            <input
              type="file"
              accept="image/*"
              hidden
              disabled={uploading}
              onChange={onUpload}
            />
          </label>

          <button
            type="button"
            disabled={uploading}
            onClick={onRemove}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-500 shadow-lg disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-slate-400">
      {uploading ? (
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      ) : (
        <ImagePlus className="h-8 w-8 text-slate-400" />
      )}

      <p className="mt-4 text-sm font-black text-slate-950">
        {uploading
          ? t.uploadingImage
          : t.uploadCover}
      </p>

      <p className="mt-2 text-xs font-bold text-slate-500">
        {t.imageRequirements}
      </p>

      <input
        type="file"
        accept="image/*"
        hidden
        disabled={uploading}
        onChange={onUpload}
      />
    </label>
  );
}

function GalleryUploader({
  gallery,
  uploading,
  onUpload,
  onRemove,
}: {
  gallery: string[];
  uploading: boolean;

  onUpload: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;

  onRemove: (
    index: number
  ) => void;
}) {
  const { t } = useProductLanguage();
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-950">
            {t.galleryImages}
          </p>

          <p className="mt-1 text-xs font-bold text-slate-500">
            {fillTranslation(t.uploadedCount, { count: gallery.length })}
          </p>
        </div>

        <label
          className={[
            "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black",
            gallery.length >= 6 ||
            uploading
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "cursor-pointer bg-slate-950 text-white",
          ].join(" ")}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}

          {t.addImages}

          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={
              gallery.length >= 6 ||
              uploading
            }
            onChange={onUpload}
          />
        </label>
      </div>

      {gallery.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map(
            (imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
              >
                <img
  src={getDriveImageUrl(
    imageUrl
  )}
  alt={`Gallery ${index + 1}`}
  className="aspect-square w-full object-cover"
  onError={(event) => {
    event.currentTarget.style.display =
      "none";
  }}
/>

                <button
                  type="button"
                  onClick={() =>
                    onRemove(index)
                  }
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-500 shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="mt-4 flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
          <div>
            <FileImage className="mx-auto h-6 w-6 text-slate-300" />

            <p className="mt-2 text-xs font-bold text-slate-400">
              {t.noGalleryImages}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Delete Dialog
 * ============================================================
 */

function DeleteProductDialog({
  product,
  deleting,
  onClose,
  onConfirm,
}: {
  product:
    | MerchantProduct
    | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useProductLanguage();
  if (!product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <Trash2 className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-2xl font-black text-slate-950">
          {t.deactivateProduct}
        </h2>

        <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
          {fillTranslation(t.deactivateDescription, { name: product.productName })}
        </p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="h-12 rounded-2xl border border-slate-200 px-6 text-sm font-black text-slate-600 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-500 px-6 text-sm font-black text-white disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            {deleting
              ? t.deactivating
              : t.deactivate}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Shared Components
 * ============================================================
 */

function SummaryCard({
  icon: Icon,
  title,
  value,
}: {
  icon: ComponentType<{
    className?: string;
  }>;

  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 sm:rounded-[2rem] sm:p-6">
      <Icon className="h-5 w-5 text-emerald-300" />

      <p className="mt-4 text-[10px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>

      <p className="mt-1 text-2xl font-black text-white sm:mt-3 sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function AlertBox({
  type,
  message,
  onClose,
}: {
  type: "error" | "success";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={[
        "mt-5 flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm font-bold",
        type === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      ].join(" ")}
    >
      <span>{message}</span>

      <button
        type="button"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </button>
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

  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="h-12 min-w-0 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-slate-950"
    >
      {children}
    </select>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-base font-black text-slate-950">
        {title}
      </h3>

      <p className="mt-1 text-xs font-bold text-slate-500">
        {description}
      </p>

      <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  maxLength,
  min,
  step,
  prefix,
}: {
  label: string;
  value: string;

  onChange: (
    value: string
  ) => void;

  placeholder?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
  min?: string;
  step?: string;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-700">
        {label}
        {required ? " *" : ""}
      </span>

      <div className="relative mt-2">
        {prefix ? (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
            {prefix}
          </span>
        ) : null}

        <input
          type={type}
          value={value}
          min={min}
          step={step}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className={[
            "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-slate-950",
            prefix ? "pl-12" : "",
          ].join(" ")}
        />
      </div>
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;

  onChange: (
    value: string
  ) => void;

  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950"
      >
        {children}
      </select>
    </label>
  );
}

function FormTextArea({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  rows,
}: {
  label: string;
  value: string;

  onChange: (
    value: string
  ) => void;

  placeholder?: string;
  maxLength?: number;
  rows: number;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-black text-slate-700">
          {label}
        </span>

        {maxLength ? (
          <span className="text-[10px] font-bold text-slate-400">
            {value.length}/
            {maxLength}
          </span>
        ) : null}
      </div>

      <textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-slate-950"
      />
    </label>
  );
}

function ProductImage({
  product,
  large = false,
}: {
  product: MerchantProduct;
  large?: boolean;
}) {
  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white",
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
  onError={(event) => {
    event.currentTarget.style.display =
      "none";
  }}
/>
      ) : (
        <Package className="h-6 w-6 text-slate-300" />
      )}
    </div>
  );
}

function ProductPrice({
  product,
}: {
  product: MerchantProduct;
}) {
  return (
    <div>
      <p className="font-black text-slate-950">
        {formatMoney(
          product.effectivePrice
        )}
      </p>

      {product.hasSale ? (
        <p className="mt-1 text-xs text-slate-400 line-through">
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
  status: ProductStatus;
}) {
  const { t } = useProductLanguage();

  const classes =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-700"
      : status === "DRAFT"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-200 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${classes}`}
    >
      {formatStatus(status, t)}
    </span>
  );
}

function TypeBadge({
  type,
}: {
  type: ProductType;
}) {
  const { t } = useProductLanguage();

  return (
    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">
      {formatProductType(type, t)}
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
    <div className="min-w-0 rounded-xl bg-white p-3">
      <p className="truncate text-[9px] font-black text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ProductsLoading() {
  const { t } = useProductLanguage();

  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-16 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />

      <p className="mt-4 text-sm font-black text-slate-500">
        {t.loadingProducts}
      </p>
    </div>
  );
}

function ProductsEmpty({
  hasProducts,
  onCreate,
}: {
  hasProducts: boolean;
  onCreate: () => void;
}) {
  const { t } = useProductLanguage();

  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Package className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-xl font-black text-slate-950">
        {hasProducts
          ? t.noMatching
          : t.noProducts}
      </h3>

      <p className="mt-2 max-w-md text-sm font-bold leading-6 text-slate-500">
        {hasProducts
          ? t.changeSearch
          : t.createFirst}
      </p>

      {!hasProducts ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white"
        >
          <Plus className="h-4 w-4" />
          {t.addProduct}
        </button>
      ) : null}
    </div>
  );
}

/* ============================================================
 * Helpers
 * ============================================================
 */

function unwrapApiData(
  response: any
) {
  let current = response;

  for (
    let index = 0;
    index < 8;
    index += 1
  ) {
    if (
      current?.data !==
        undefined &&
      current?.data !== current
    ) {
      current = current.data;
      continue;
    }

    if (
      current?.result !==
        undefined &&
      current?.result !== current
    ) {
      current = current.result;
      continue;
    }

    break;
  }

  return current || {};
}

function normalizeProduct(
  source: any
): MerchantProduct {
  const price =
    normalizeMoney(
      source?.price
    );

  const salePrice =
    normalizeMoney(
      source?.salePrice
    );

  const effectivePrice =
    source?.effectivePrice !==
      undefined
      ? normalizeMoney(
          source.effectivePrice
        )
      : salePrice > 0
        ? salePrice
        : price;

  return {
    productId:
      String(
        source?.productId || ""
      ).trim(),

    merchantId:
      String(
        source?.merchantId || ""
      ).trim(),

    productType:
      normalizeProductType(
        source?.productType
      ),

    productName:
      String(
        source?.productName || ""
      ).trim(),

    shortDescription:
      String(
        source?.shortDescription ||
          ""
      ).trim(),

    description:
      String(
        source?.description || ""
      ).trim(),

    category:
      String(
        source?.category || ""
      ).trim(),

    price,
    salePrice,
    effectivePrice,

    hasSale:
      Boolean(
        source?.hasSale
      ) ||
      (
        salePrice > 0 &&
        (
          price <= 0 ||
          salePrice < price
        )
      ),

    shippingType:
      normalizeShippingType(
        source?.shippingType,
        normalizeProductType(
          source?.productType
        )
      ),

    shippingFee:
      normalizeMoney(
        source?.shippingFee
      ),

    requiresShipping:
      source?.requiresShipping !==
        undefined
        ? normalizeBoolean(
            source.requiresShipping
          )
        : normalizeProductType(
            source?.productType
          ) === "PRODUCT",

    isFreeShipping:
      source?.isFreeShipping !==
        undefined
        ? normalizeBoolean(
            source.isFreeShipping
          )
        : normalizeShippingType(
            source?.shippingType,
            normalizeProductType(
              source?.productType
            )
          ) === "FREE",

    imageUrl:
      String(
        source?.imageUrl || ""
      ).trim(),

    gallery:
      normalizeGallery(
        source?.gallery
      ),

    stock:
      normalizeInteger(
        source?.stock
      ),

    pointsEarned:
      normalizeMoney(
        source?.pointsEarned
      ),

    status:
      normalizeProductStatus(
        source?.status
      ),

    sortOrder:
      normalizeInteger(
        source?.sortOrder
      ),

    isFeatured:
      normalizeBoolean(
        source?.isFeatured
      ),

    createdAt:
      String(
        source?.createdAt || ""
      ),

    updatedAt:
      String(
        source?.updatedAt || ""
      ),
  };
}

function normalizeSummary(
  source: any
): ProductSummary {
  return {
    total:
      Number(source?.total || 0),

    active:
      Number(source?.active || 0),

    draft:
      Number(source?.draft || 0),

    inactive:
      Number(
        source?.inactive || 0
      ),

    featured:
      Number(
        source?.featured || 0
      ),

    totalStock:
      Number(
        source?.totalStock || 0
      ),
  };
}

function validateProductForm(
  form: ProductFormState,
  t: ProductTranslation
) {
  if (
    !form.productName.trim()
  ) {
    return t.productNameRequired;
  }

  if (
    !form.category.trim()
  ) {
    return t.categoryRequired;
  }

  const price =
    parseNumericInput(
      form.price
    );

  const salePrice =
    parseNumericInput(
      form.salePrice
    );

  const stock =
    parseNumericInput(
      form.stock
    );

  const pointsEarned =
    parseNumericInput(
      form.pointsEarned
    );

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    return t.priceInvalid;
  }

  if (
    !Number.isFinite(
      salePrice
    ) ||
    salePrice < 0
  ) {
    return t.salePriceInvalid;
  }

  if (
    salePrice > 0 &&
    price > 0 &&
    salePrice > price
  ) {
    return t.salePriceExceed;
  }

  if (
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    return t.stockInvalid;
  }

  if (
    !Number.isFinite(
      pointsEarned
    ) ||
    pointsEarned < 0
  ) {
    return t.pointsInvalid;
  }

  if (
    form.productType === "PRODUCT" &&
    form.shippingType === "FIXED"
  ) {
    const shippingFee =
      parseNumericInput(
        form.shippingFee
      );

    if (
      !Number.isFinite(
        shippingFee
      ) ||
      shippingFee <= 0
    ) {
      return t.shippingFeeRequired;
    }
  }

  return "";
}

function validateImageFile(
  file: File,
  t: ProductTranslation
) {
  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    return t.imagesOnly;
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    return t.imageTooLarge;
  }

  return "";
}

function fileToDataUrl(
  file: File,
  errorMessage: string
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result ===
          "string"
        ) {
          resolve(
            reader.result
          );
          return;
        }

        reject(
          new Error(
            errorMessage
          )
        );
      };

      reader.onerror = () => {
        reject(
          new Error(
            errorMessage
          )
        );
      };

      reader.readAsDataURL(file);
    }
  );
}

function safeParseStorage(
  value: string | null
): any {
  try {
    return JSON.parse(
      value || "{}"
    );
  } catch {
    return {};
  }
}

function getStoredMerchantId() {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  const stored =
    safeParseStorage(
      localStorage.getItem(
        "merchant"
      )
    );

  return String(
    stored?.merchantId ||
      stored?.MERCHANT_ID ||
      stored?.merchant
        ?.merchantId ||
      stored?.merchant
        ?.MERCHANT_ID ||
      stored?.data?.merchantId ||
      stored?.data
        ?.MERCHANT_ID ||
      ""
  ).trim();
}

function normalizeProductType(
  value: unknown
): ProductType {
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

function normalizeShippingType(
  value: unknown,
  productType: ProductType
): ShippingType {
  if (
    productType !== "PRODUCT"
  ) {
    return "NONE";
  }

  const type =
    String(value || "")
      .trim()
      .toUpperCase();

  if (type === "FIXED") {
    return "FIXED";
  }

  return "FREE";
}


function normalizeProductStatus(
  value: unknown
): ProductStatus {
  const status =
    String(value || "")
      .trim()
      .toUpperCase();

  if (status === "ACTIVE") {
    return "ACTIVE";
  }

  if (status === "INACTIVE") {
    return "INACTIVE";
  }

  return "DRAFT";
}

function normalizeGallery(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item || "").trim()
      )
      .filter(Boolean);
  }

  const text =
    String(value || "").trim();

  if (!text) {
    return [];
  }

  return text
    .split("|")
    .map((item) =>
      item.trim()
    )
    .filter(Boolean);
}

function normalizeBoolean(
  value: unknown
) {
  if (
    value === true ||
    value === 1
  ) {
    return true;
  }

  const text =
    String(value || "")
      .trim()
      .toUpperCase();

  return (
    text === "TRUE" ||
    text === "YES" ||
    text === "Y" ||
    text === "1"
  );
}

function parseNumericInput(
  value: unknown
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  return Number(value);
}

function normalizeMoney(
  value: unknown
) {
  const number =
    parseNumericInput(value);

  if (
    !Number.isFinite(number)
  ) {
    return 0;
  }

  return (
    Math.round(number * 100) /
    100
  );
}

function normalizeInteger(
  value: unknown
) {
  const number =
    parseNumericInput(value);

  if (
    !Number.isFinite(number)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(number)
  );
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

function formatDate(
  value: string,
  language: LanguageCode
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
    language === "zh" ? "zh-CN" : language === "ms" ? "ms-MY" : "en-MY",
    {
      timeZone:
        "Asia/Kuala_Lumpur",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatProductType(
  value: ProductType,
  t: ProductTranslation
) {
  if (value === "SERVICE") {
    return t.service;
  }

  if (value === "PACKAGE") {
    return t.package;
  }

  if (value === "VOUCHER") {
    return t.voucher;
  }

  return t.product;
}

function formatStatus(
  value: ProductStatus,
  t: ProductTranslation
) {
  if (value === "ACTIVE") {
    return t.active;
  }

  if (value === "INACTIVE") {
    return t.inactive;
  }

  return t.draft;
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  return error instanceof Error
    ? error.message
    : fallback;
}