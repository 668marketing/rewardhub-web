"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Gift,
  ImagePlus,
  Loader2,
  Save,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAdminRewardDetail,
  updateAdminReward,
  uploadAdminRewardImage,
  type AdminRewardCatalogItem,
} from "@/lib/admin-rewards";

type RewardType =
  | "VOUCHER"
  | "DIGITAL"
  | "PHYSICAL";

type RewardStatus =
  | "ACTIVE"
  | "HIDDEN"
  | "DRAFT"
  | "INACTIVE";

type FormState = {
  title: string;
  category: string;
  description: string;
  brand: string;

  pointsRequired: string;
  stock: string;
  unlimitedStock: boolean;

  rewardType: RewardType;
  voucherCode: string;

  maxPerMember: string;
  sortOrder: string;

  status: RewardStatus;

  featured: boolean;
  isNew: boolean;
  isHot: boolean;
  isRecommended: boolean;

  imageUrl: string;
  thumbnailUrl: string;
};

const CATEGORY_OPTIONS = [
  "Voucher",
  "Gift",
  "Digital",
  "Electronics",
  "Lifestyle",
];

const EMPTY_FORM: FormState = {
  title: "",
  category: "Voucher",
  description: "",
  brand: "",

  pointsRequired: "",
  stock: "0",
  unlimitedStock: false,

  rewardType: "VOUCHER",
  voucherCode: "",

  maxPerMember: "0",
  sortOrder: "999",

  status: "DRAFT",

  featured: false,
  isNew: true,
  isHot: false,
  isRecommended: false,

  imageUrl: "",
  thumbnailUrl: "",
};

export default function EditAdminRewardPage() {
  const params = useParams<{
    rewardId: string;
  }>();

  const router = useRouter();

  const rewardId =
    decodeURIComponent(
      String(
        params?.rewardId || ""
      )
    );

  const [form, setForm] =
    useState<FormState>(
      EMPTY_FORM
    );

  const [reward, setReward] =
    useState<AdminRewardCatalogItem | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);

  const [
    imagePreview,
    setImagePreview,
  ] = useState("");

  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const shippingRequired =
    form.rewardType ===
    "PHYSICAL";

  const canSubmit =
    useMemo(() => {
      return Boolean(
        form.title.trim() &&
          form.category.trim() &&
          Number(
            form.pointsRequired
          ) > 0 &&
          !loading &&
          !saving &&
          !uploadingImage
      );
    }, [
      form.title,
      form.category,
      form.pointsRequired,
      loading,
      saving,
      uploadingImage,
    ]);

  useEffect(() => {
    if (!rewardId) {
      setError(
        "Reward ID is missing."
      );
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadReward() {
      try {
        setLoading(true);
        setError("");

        const result =
          await getAdminRewardDetail(
            rewardId
          );

        if (cancelled) {
          return;
        }

        const item =
          result.reward;

        setReward(item);

        setForm(
          mapRewardToForm(
            item
          )
        );

        setImagePreview("");
        setImageFailed(false);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load reward details."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReward();

    return () => {
      cancelled = true;
    };
  }, [rewardId]);

  function updateField<
    K extends keyof FormState
  >(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleRewardTypeChange(
    rewardType: RewardType
  ) {
    setForm((current) => ({
      ...current,

      rewardType,

      category:
        rewardType === "VOUCHER"
          ? "Voucher"
          : rewardType === "DIGITAL"
            ? "Digital"
            : current.category ===
                  "Voucher" ||
                current.category ===
                  "Digital"
              ? "Gift"
              : current.category,

      unlimitedStock:
        rewardType === "PHYSICAL"
          ? false
          : current.unlimitedStock,
    }));
  }

  async function handleImageChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      setError(
        "Only JPG, PNG and WEBP images are allowed."
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Image must be smaller than 5MB."
      );
      return;
    }

    try {
      setUploadingImage(true);
      setError("");
      setSuccess("");

      const base64 =
        await readFileAsDataUrl(
          file
        );

      setImagePreview(base64);
      setImageFailed(false);

      const result =
        await uploadAdminRewardImage({
          fileName: file.name,
          mimeType: file.type,
          base64,
        });

      setForm((current) => ({
        ...current,

        imageUrl:
          result.imageUrl ||
          "",

        thumbnailUrl:
          result.thumbnailUrl ||
          result.imageUrl ||
          "",
      }));

      setSuccess(
        "Image uploaded successfully. Click Save Changes to update this reward."
      );
    } catch (uploadError) {
      setImagePreview("");

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload image."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canSubmit) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    const pointsRequired =
      Number(
        form.pointsRequired
      );

    const stock =
      Number(
        form.stock || 0
      );

    const maxPerMember =
      Number(
        form.maxPerMember || 0
      );

    const sortOrder =
      Number(
        form.sortOrder || 999
      );

    if (
      !Number.isFinite(
        pointsRequired
      ) ||
      pointsRequired <= 0
    ) {
      setError(
        "Points required must be greater than 0."
      );
      return;
    }

    if (
      !form.unlimitedStock &&
      (
        !Number.isFinite(stock) ||
        stock < 0
      )
    ) {
      setError(
        "Stock must be 0 or greater."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result =
        await updateAdminReward({
          rewardId,

          title:
            form.title.trim(),

          category:
            form.category.trim(),

          description:
            form.description.trim(),

          brand:
            form.brand.trim(),

          imageUrl:
            form.imageUrl,

          thumbnailUrl:
            form.thumbnailUrl,

          pointsRequired,

          stock:
            form.unlimitedStock
              ? 0
              : stock,

          unlimitedStock:
            form.unlimitedStock,

          featured:
            form.featured,

          isNew:
            form.isNew,

          isHot:
            form.isHot,

          isRecommended:
            form.isRecommended,

          maxPerMember:
            Number.isFinite(
              maxPerMember
            )
              ? maxPerMember
              : 0,

          status:
            form.status,

          rewardType:
            form.rewardType,

          voucherCode:
            form.voucherCode.trim(),

          shippingRequired,

          sortOrder:
            Number.isFinite(
              sortOrder
            )
              ? sortOrder
              : 999,
        });

      setReward(
        result.reward
      );

      setForm(
        mapRewardToForm(
          result.reward
        )
      );

      setImagePreview("");
      setImageFailed(false);

      setSuccess(
        result.message ||
        "Reward updated successfully."
      );

      window.setTimeout(() => {
        router.push(
          "/admin/rewards/list"
        );
        router.refresh();
      }, 800);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update reward."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />

          <p className="mt-4 text-sm text-slate-500">
            Loading reward details…
          </p>
        </div>
      </div>
    );
  }

  if (error && !reward) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center px-5">
        <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-400/10 p-7 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-red-300" />

          <h1 className="mt-4 text-lg font-semibold text-white">
            Unable to load reward
          </h1>

          <p className="mt-3 text-sm leading-6 text-red-200/80">
            {error}
          </p>

          <Link
            href="/admin/rewards/list"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-red-300 px-5 text-sm font-semibold text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Rewards
          </Link>
        </div>
      </div>
    );
  }

  const displayedImage =
    imagePreview ||
    form.thumbnailUrl ||
    form.imageUrl;

  return (
    <div className="min-w-0 space-y-7 overflow-x-hidden pb-12 pt-6 lg:pt-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <Gift className="h-4 w-4" />
            Rewards management
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Edit Reward
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            Update reward details,
            inventory, image and
            publishing settings.
          </p>

          <p className="mt-2 text-xs font-medium text-slate-600">
            {rewardId}
          </p>
        </div>

        <Link
          href="/admin/rewards/list"
          className="inline-flex h-12 w-fit items-center gap-2 rounded-2xl border border-white/[0.08] bg-slate-900/60 px-5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rewards
        </Link>
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"
      >
        <div className="space-y-6">
          <FormSection
            title="Reward Information"
            description="Basic information shown to members."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Reward Title"
                required
              >
                <input
                  value={form.title}
                  onChange={(event) =>
                    updateField(
                      "title",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field
                label="Reward Type"
                required
              >
                <select
                  value={
                    form.rewardType
                  }
                  onChange={(event) =>
                    handleRewardTypeChange(
                      event.target
                        .value as RewardType
                    )
                  }
                  className={inputClass}
                >
                  <option value="VOUCHER">
                    Voucher
                  </option>

                  <option value="DIGITAL">
                    Digital
                  </option>

                  <option value="PHYSICAL">
                    Physical
                  </option>
                </select>
              </Field>

              <Field
                label="Category"
                required
              >
                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value
                    )
                  }
                  className={inputClass}
                >
                  {!CATEGORY_OPTIONS.includes(
                    form.category
                  ) &&
                  form.category ? (
                    <option
                      value={
                        form.category
                      }
                    >
                      {form.category}
                    </option>
                  ) : null}

                  {CATEGORY_OPTIONS.map(
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
              </Field>

              <Field label="Brand">
                <input
                  value={form.brand}
                  onChange={(event) =>
                    updateField(
                      "brand",
                      event.target.value
                    )
                  }
                  placeholder="Optional brand"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                className={`${inputClass} min-h-32 resize-y py-3`}
              />
            </Field>
          </FormSection>

          <FormSection
            title="Points & Inventory"
            description="Control redemption cost, stock and member limits."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Points Required"
                required
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    form.pointsRequired
                  }
                  onChange={(event) =>
                    updateField(
                      "pointsRequired",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Maximum Per Member">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.maxPerMember
                  }
                  onChange={(event) =>
                    updateField(
                      "maxPerMember",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-slate-600">
                  Use 0 for no personal
                  redemption limit.
                </p>
              </Field>

              <Field label="Stock">
                <input
                  type="number"
                  min="0"
                  step="1"
                  disabled={
                    form.unlimitedStock
                  }
                  value={form.stock}
                  onChange={(event) =>
                    updateField(
                      "stock",
                      event.target.value
                    )
                  }
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-40`}
                />
              </Field>

              <Field label="Sort Order">
                <input
                  type="number"
                  step="1"
                  value={
                    form.sortOrder
                  }
                  onChange={(event) =>
                    updateField(
                      "sortOrder",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            {form.rewardType !==
            "PHYSICAL" ? (
              <ToggleRow
                label="Unlimited stock"
                description="Reward remains available without reducing stock."
                checked={
                  form.unlimitedStock
                }
                onChange={(checked) =>
                  updateField(
                    "unlimitedStock",
                    checked
                  )
                }
              />
            ) : null}

            {(form.rewardType ===
              "VOUCHER" ||
              form.rewardType ===
                "DIGITAL") ? (
              <Field label="Shared Voucher / Promo Code">
                <input
                  value={
                    form.voucherCode
                  }
                  onChange={(event) =>
                    updateField(
                      "voucherCode",
                      event.target.value
                    )
                  }
                  placeholder="Optional shared code"
                  className={inputClass}
                />
              </Field>
            ) : null}

            {shippingRequired ? (
              <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-4 text-sm leading-6 text-amber-200/80">
                Physical rewards require
                recipient and shipping
                details during redemption.
              </div>
            ) : null}
          </FormSection>

          <FormSection
            title="Display Settings"
            description="Choose how this reward appears in the member portal."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleRow
                label="New reward"
                description="Shows in New Rewards while within the 30-day window."
                checked={form.isNew}
                onChange={(checked) =>
                  updateField(
                    "isNew",
                    checked
                  )
                }
              />

              <ToggleRow
                label="Featured"
                description="Highlights the reward in featured sections."
                checked={form.featured}
                onChange={(checked) =>
                  updateField(
                    "featured",
                    checked
                  )
                }
              />

              <ToggleRow
                label="Hot"
                description="Adds a Hot badge."
                checked={form.isHot}
                onChange={(checked) =>
                  updateField(
                    "isHot",
                    checked
                  )
                }
              />

              <ToggleRow
                label="Recommended"
                description="Prioritizes the reward in recommended sorting."
                checked={
                  form.isRecommended
                }
                onChange={(checked) =>
                  updateField(
                    "isRecommended",
                    checked
                  )
                }
              />
            </div>
          </FormSection>
        </div>

        <aside className="space-y-6">
          <FormSection
            title="Reward Image"
            description="Upload a replacement image or remove the current image."
          >
            <div className="overflow-hidden rounded-3xl border border-dashed border-white/[0.1] bg-slate-950/40">
              {displayedImage &&
              !imageFailed ? (
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      displayedImage
                    }
                    alt={form.title}
                    onError={() =>
                      setImageFailed(
                        true
                      )
                    }
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setImageFailed(false);

                      updateField(
                        "imageUrl",
                        ""
                      );

                      updateField(
                        "thumbnailUrl",
                        ""
                      );
                    }}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/80 text-white backdrop-blur"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center px-6 text-center transition hover:bg-white/[0.025]">
                  {uploadingImage ? (
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                  ) : (
                    <ImagePlus className="h-9 w-9 text-slate-600" />
                  )}

                  <p className="mt-4 text-sm font-medium text-slate-300">
                    {uploadingImage
                      ? "Uploading image…"
                      : imageFailed
                        ? "Current image failed. Upload a replacement."
                        : "Click to upload image"}
                  </p>

                  <p className="mt-2 text-xs text-slate-600">
                    JPG, PNG or WEBP.
                    Maximum 5MB.
                  </p>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={
                      uploadingImage
                    }
                    onChange={
                      handleImageChange
                    }
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {displayedImage &&
            !uploadingImage ? (
              <label className="mt-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] px-4 text-sm text-slate-300 transition hover:bg-white/[0.05]">
                <Upload className="h-4 w-4" />
                Replace image

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleImageChange
                  }
                  className="hidden"
                />
              </label>
            ) : null}
          </FormSection>

          <FormSection
            title="Publishing"
            description="Control whether members can see and redeem it."
          >
            <Field
              label="Status"
              required
            >
              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target
                      .value as RewardStatus
                  )
                }
                className={inputClass}
              >
                <option value="ACTIVE">
                  Active
                </option>

                <option value="DRAFT">
                  Draft
                </option>

                <option value="HIDDEN">
                  Hidden
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </Field>

            <div className="rounded-2xl border border-white/[0.07] bg-slate-950/35 p-4 text-xs leading-6 text-slate-500">
              <strong className="text-slate-300">
                Active
              </strong>{" "}
              rewards appear immediately
              in the member Points page.
              Hidden, Draft and Inactive
              rewards cannot be redeemed.
            </div>

            {reward ? (
              <div className="grid grid-cols-2 gap-3">
                <Metric
                  label="Redemptions"
                  value={String(
                    reward.redemptionCount
                  )}
                />

                <Metric
                  label="Points Used"
                  value={`${Number(
                    reward.pointsRedeemed ||
                      0
                  ).toLocaleString()} pts`}
                />
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? "Saving changes…"
                : "Save Changes"}
            </button>
          </FormSection>
        </aside>
      </form>
    </div>
  );
}

function mapRewardToForm(
  reward: AdminRewardCatalogItem
): FormState {
  return {
    title:
      reward.title || "",

    category:
      reward.category ||
      "Voucher",

    description:
      reward.description ||
      "",

    brand:
      reward.brand || "",

    pointsRequired:
      String(
        reward.pointsRequired ||
          ""
      ),

    stock:
      String(
        reward.stock || 0
      ),

    unlimitedStock:
      Boolean(
        reward.unlimitedStock
      ),

    rewardType:
      normalizeRewardType(
        reward.rewardType
      ),

    voucherCode:
      reward.voucherCode ||
      "",

    maxPerMember:
      String(
        reward.maxPerMember ||
          0
      ),

    sortOrder:
      String(
        reward.sortOrder ??
          999
      ),

    status:
      normalizeRewardStatus(
        reward.status
      ),

    featured:
      Boolean(
        reward.featured
      ),

    isNew:
      Boolean(
        reward.isNew
      ),

    isHot:
      Boolean(
        reward.isHot
      ),

    isRecommended:
      Boolean(
        reward.isRecommended
      ),

    imageUrl:
      reward.imageUrl || "",

    thumbnailUrl:
      reward.thumbnailUrl ||
      reward.imageUrl ||
      "",
  };
}

function normalizeRewardType(
  value: string
): RewardType {
  const normalized =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    normalized ===
    "PHYSICAL"
  ) {
    return "PHYSICAL";
  }

  if (
    normalized ===
    "DIGITAL"
  ) {
    return "DIGITAL";
  }

  return "VOUCHER";
}

function normalizeRewardStatus(
  value: string
): RewardStatus {
  const normalized =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    normalized === "ACTIVE" ||
    normalized === "HIDDEN" ||
    normalized === "DRAFT" ||
    normalized === "INACTIVE"
  ) {
    return normalized;
  }

  return "DRAFT";
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
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">
        {title}
      </h2>

      <p className="mt-1 text-xs leading-5 text-slate-600">
        {description}
      </p>

      <div className="mt-6 space-y-5">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}

        {required ? (
          <span className="ml-1 text-emerald-400">
            *
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-slate-950/30 p-4">
      <div>
        <p className="text-sm font-medium text-slate-200">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="h-5 w-5 shrink-0 accent-emerald-400"
      />
    </label>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-slate-950/35 p-4">
      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function readFileAsDataUrl(
  file: File
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
        } else {
          reject(
            new Error(
              "Unable to read image."
            )
          );
        }
      };

      reader.onerror = () =>
        reject(
          new Error(
            "Unable to read image."
          )
        );

      reader.readAsDataURL(
        file
      );
    }
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-white/[0.08] bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-emerald-400/35 focus:ring-4 focus:ring-emerald-400/10";