"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import MemberLayout from "@/components/layout/MemberLayout";
import PushNotificationManager from "@/components/pwa/PushNotificationManager";
import {
  useLanguage,
} from "@/hooks/useLanguage";

import {
  getMemberProfile,
  updateMemberProfile,
} from "@/lib/api";

type ProfileData = {
  memberId: string;
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  birthday: string;
  gender: string;
  tier: string;
  status: string;

  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2: string;
  area: string;
  state: string;
  postcode: string;
  country: string;
  defaultDeliveryMethod:
    | "Delivery"
    | "Self Pickup";
};

type EditMode =
  | "PERSONAL"
  | "ADDRESS"
  | "DELIVERY"
  | null;

const states = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Penang",
  "Perak",
  "Perlis",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Kuala Lumpur",
  "Putrajaya",
  "Labuan",
];

function unwrap(
  response: unknown
): Record<string, any> {
  if (
    !response ||
    typeof response !==
      "object"
  ) {
    return {};
  }

  const root =
    response as Record<
      string,
      any
    >;

  const first =
    root.data &&
    typeof root.data ===
      "object"
      ? root.data
      : root;

  return first.data &&
    typeof first.data ===
      "object"
    ? first.data
    : first;
}

function getStoredMemberId() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          "member"
        ) || "{}"
      );

    return String(
      parsed?.memberId ??
        parsed?.MEMBER_ID ??
        parsed?.id ??
        parsed?.profile
          ?.memberId ??
        parsed?.member
          ?.memberId ??
        parsed?.data
          ?.memberId ??
        ""
    ).trim();
  } catch {
    return "";
  }
}

function normalizeProfile(
  data: Record<
    string,
    any
  >
): ProfileData {
  return {
    memberId:
      String(
        data.memberId || ""
      ),
    fullName:
      String(
        data.fullName || ""
      ),
    displayName:
      String(
        data.displayName ||
          data.fullName ||
          ""
      ),
    email:
      String(
        data.email || ""
      ),
    phone:
      String(
        data.phone || ""
      ),
    birthday:
      String(
        data.birthday || ""
      ),
    gender:
      String(
        data.gender || ""
      ),
    tier:
      String(
        data.tier ||
          "Silver"
      ),
    status:
      String(
        data.status ||
          "Active"
      ),

    recipientName:
      String(
        data.recipientName ||
          data.fullName ||
          ""
      ),
    recipientPhone:
      String(
        data.recipientPhone ||
          data.phone ||
          ""
      ),
    addressLine1:
      String(
        data.addressLine1 ||
          ""
      ),
    addressLine2:
      String(
        data.addressLine2 ||
          ""
      ),
    area:
      String(
        data.area || ""
      ),
    state:
      String(
        data.state || ""
      ),
    postcode:
      String(
        data.postcode || ""
      ),
    country:
      String(
        data.country ||
          "Malaysia"
      ),
    defaultDeliveryMethod:
      data.defaultDeliveryMethod ===
      "Self Pickup"
        ? "Self Pickup"
        : "Delivery",
  };
}


type ProfileCopy = {
  memberProfile: string;
  member: string;
  tier: string;
  memberId: string;
  accountStatus: string;
  personalInformation: string;
  accountSummary: string;
  membership: string;
  lifetime: string;
  referral: string;
  enabled: string;
  rewardCredits: string;
  security: string;
  protected: string;
  fullName: string;
  displayName: string;
  gender: string;
  birthday: string;
  email: string;
  phone: string;
  shippingAddress: string;
  recipientName: string;
  recipientPhone: string;
  noAddress: string;
  deliveryPreference: string;
  defaultMethod: string;
  securityCenter: string;
  securityCenterDescription: string;
  changePassword: string;
  changePasswordDescription: string;
  devices: string;
  devicesDescription: string;
  dangerZone: string;
  logout: string;
  edit: string;
  editPersonal: string;
  editAddress: string;
  editDelivery: string;
  addressLine1: string;
  addressLine2: string;
  area: string;
  state: string;
  postcode: string;
  country: string;
  cancel: string;
  save: string;
  saving: string;
  delivery: string;
  selfPickup: string;
  open: string;
  personalRequired: string;
  addressRequired: string;
  saved: string;
  loadFailed: string;
  updateFailed: string;
  male: string;
  female: string;
  other: string;
  active: string;
  inactive: string;
  suspended: string;
  pending: string;
  silver: string;
  gold: string;
  platinum: string;
  malaysia: string;
};

const PROFILE_COPY: Record<"en" | "zh" | "ms", ProfileCopy> = {
  en: {
    memberProfile: "Member Profile",
    member: "Member",
    tier: "Tier",
    memberId: "Member ID",
    accountStatus: "Account Status",
    personalInformation: "Personal Information",
    accountSummary: "Account Summary",
    membership: "Membership",
    lifetime: "Lifetime",
    referral: "Referral",
    enabled: "Enabled",
    rewardCredits: "Reward Credits",
    security: "Security",
    protected: "Protected",
    fullName: "Full Name",
    displayName: "Display Name",
    gender: "Gender",
    birthday: "Date of Birth",
    email: "Login Email",
    phone: "Phone Number",
    shippingAddress: "Default Shipping Address",
    recipientName: "Recipient Name",
    recipientPhone: "Recipient Phone",
    noAddress: "No shipping address saved yet.",
    deliveryPreference: "Delivery Preference",
    defaultMethod: "Default Method",
    securityCenter: "Security Center",
    securityCenterDescription:
      "Manage App Lock, Face ID / Touch ID and trusted devices.",
    changePassword: "Change Password",
    changePasswordDescription: "Update your account password.",
    devices: "Manage Devices",
    devicesDescription: "Review all registered devices.",
    dangerZone: "Danger Zone",
    logout: "Logout",
    edit: "Edit",
    editPersonal: "Edit Personal Information",
    editAddress: "Edit Shipping Address",
    editDelivery: "Edit Delivery Preference",
    addressLine1: "Address Line 1",
    addressLine2: "Address Line 2",
    area: "Area",
    state: "State",
    postcode: "Postcode",
    country: "Country",
    cancel: "Cancel",
    save: "Save Changes",
    saving: "Saving...",
    delivery: "Delivery",
    selfPickup: "Self Pickup",
    open: "Open",
    personalRequired: "Name, email and phone are required.",
    addressRequired: "Please complete all required shipping fields.",
    saved: "Profile updated successfully.",
    loadFailed: "Unable to load profile.",
    updateFailed: "Unable to update profile.",
    male: "Male",
    female: "Female",
    other: "Other",
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
    pending: "Pending",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    malaysia: "Malaysia",
  },
  zh: {
    memberProfile: "会员资料",
    member: "会员",
    tier: "会员等级",
    memberId: "会员编号",
    accountStatus: "账户状态",
    personalInformation: "个人资料",
    accountSummary: "账户摘要",
    membership: "会员资格",
    lifetime: "终身有效",
    referral: "推荐功能",
    enabled: "已启用",
    rewardCredits: "Reward Credits",
    security: "账户安全",
    protected: "已保护",
    fullName: "姓名",
    displayName: "显示名称",
    gender: "性别",
    birthday: "出生日期",
    email: "登录电子邮件",
    phone: "手机号码",
    shippingAddress: "默认收货地址",
    recipientName: "收货人姓名",
    recipientPhone: "收货人手机号",
    noAddress: "还没有保存收货地址。",
    deliveryPreference: "默认配送方式",
    defaultMethod: "默认方式",
    securityCenter: "安全中心",
    securityCenterDescription:
      "管理应用锁、生物识别及受信任设备。",
    changePassword: "更改密码",
    changePasswordDescription: "更新会员账户密码。",
    devices: "设备管理",
    devicesDescription: "查看所有已注册设备。",
    dangerZone: "危险区域",
    logout: "退出登录",
    edit: "编辑",
    editPersonal: "编辑个人资料",
    editAddress: "编辑收货地址",
    editDelivery: "编辑默认配送方式",
    addressLine1: "地址第一行",
    addressLine2: "地址第二行",
    area: "地区",
    state: "州属",
    postcode: "邮政编码",
    country: "国家",
    cancel: "取消",
    save: "保存修改",
    saving: "正在保存...",
    delivery: "送货",
    selfPickup: "自行取货",
    open: "打开",
    personalRequired: "姓名、电子邮件和手机号码为必填项目。",
    addressRequired: "请完整填写所有必填收货资料。",
    saved: "会员资料已成功更新。",
    loadFailed: "无法加载会员资料。",
    updateFailed: "无法更新会员资料。",
    male: "男性",
    female: "女性",
    other: "其他",
    active: "正常",
    inactive: "未启用",
    suspended: "已暂停",
    pending: "待审核",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    malaysia: "马来西亚",
  },
  ms: {
    memberProfile: "Profil Ahli",
    member: "Ahli",
    tier: "Tahap",
    memberId: "ID Ahli",
    accountStatus: "Status Akaun",
    personalInformation: "Maklumat Peribadi",
    accountSummary: "Ringkasan Akaun",
    membership: "Keahlian",
    lifetime: "Seumur Hidup",
    referral: "Rujukan",
    enabled: "Diaktifkan",
    rewardCredits: "Reward Credits",
    security: "Keselamatan",
    protected: "Dilindungi",
    fullName: "Nama Penuh",
    displayName: "Nama Paparan",
    gender: "Jantina",
    birthday: "Tarikh Lahir",
    email: "E-mel Log Masuk",
    phone: "Nombor Telefon",
    shippingAddress: "Alamat Penghantaran Utama",
    recipientName: "Nama Penerima",
    recipientPhone: "Telefon Penerima",
    noAddress: "Belum ada alamat penghantaran disimpan.",
    deliveryPreference: "Kaedah Penghantaran Utama",
    defaultMethod: "Kaedah Utama",
    securityCenter: "Pusat Keselamatan",
    securityCenterDescription:
      "Urus App Lock, Face ID / Touch ID dan peranti dipercayai.",
    changePassword: "Tukar Kata Laluan",
    changePasswordDescription: "Kemas kini kata laluan akaun.",
    devices: "Urus Peranti",
    devicesDescription: "Lihat semua peranti yang didaftarkan.",
    dangerZone: "Zon Bahaya",
    logout: "Log Keluar",
    edit: "Edit",
    editPersonal: "Edit Maklumat Peribadi",
    editAddress: "Edit Alamat Penghantaran",
    editDelivery: "Edit Kaedah Penghantaran",
    addressLine1: "Alamat Baris 1",
    addressLine2: "Alamat Baris 2",
    area: "Kawasan",
    state: "Negeri",
    postcode: "Poskod",
    country: "Negara",
    cancel: "Batal",
    save: "Simpan Perubahan",
    saving: "Menyimpan...",
    delivery: "Penghantaran",
    selfPickup: "Ambil Sendiri",
    open: "Buka",
    personalRequired: "Nama, e-mel dan nombor telefon diperlukan.",
    addressRequired: "Sila lengkapkan semua maklumat penghantaran yang diperlukan.",
    saved: "Profil berjaya dikemas kini.",
    loadFailed: "Tidak dapat memuatkan profil ahli.",
    updateFailed: "Tidak dapat mengemas kini profil ahli.",
    male: "Lelaki",
    female: "Perempuan",
    other: "Lain-lain",
    active: "Aktif",
    inactive: "Tidak Aktif",
    suspended: "Digantung",
    pending: "Menunggu",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    malaysia: "Malaysia",
  },
};

function getProfileCopy(language: unknown): ProfileCopy {
  return language === "zh"
    ? PROFILE_COPY.zh
    : language === "ms"
      ? PROFILE_COPY.ms
      : PROFILE_COPY.en;
}

function localizeTier(value: string, ui: ProfileCopy) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "silver") return ui.silver;
  if (normalized === "gold") return ui.gold;
  if (normalized === "platinum") return ui.platinum;
  return value || "-";
}

function localizeStatus(value: string, ui: ProfileCopy) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "active") return ui.active;
  if (normalized === "inactive") return ui.inactive;
  if (normalized === "suspended") return ui.suspended;
  if (normalized === "pending") return ui.pending;
  return value || "-";
}

function localizeGender(value: string, ui: ProfileCopy) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "male") return ui.male;
  if (normalized === "female") return ui.female;
  if (normalized === "other" || normalized === "others") return ui.other;
  return value || "-";
}

function localizeDelivery(value: string, ui: ProfileCopy) {
  return value === "Self Pickup" ? ui.selfPickup : ui.delivery;
}

function formatProfileDate(value: string, language: unknown) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const locale =
    language === "zh"
      ? "zh-CN"
      : language === "ms"
        ? "ms-MY"
        : "en-MY";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default function ProfilePage() {
  const router =
    useRouter();

  const {
    t,
    language,
  } = useLanguage();

  const ui = getProfileCopy(language);

  const [
    profile,
    setProfile,
  ] =
    useState<ProfileData | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<ProfileData | null>(
      null
    );

  const [
    editMode,
    setEditMode,
  ] =
    useState<EditMode>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  async function loadProfile() {
    const memberId =
      getStoredMemberId();

    if (!memberId) {
      router.replace(
        "/login"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await getMemberProfile({
          memberId,
        });

      const data =
        normalizeProfile(
          unwrap(response)
        );

      setProfile(data);
      setForm(data);
      updateLocalMember(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : ui.loadFailed
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  const fullAddress =
    useMemo(() => {
      if (!profile) {
        return "";
      }

      const hasAddress = [
        profile.addressLine1,
        profile.addressLine2,
        profile.area,
        profile.postcode,
        profile.state,
      ].some(Boolean);

      if (!hasAddress) {
        return "";
      }

      return [
        profile.addressLine1,
        profile.addressLine2,
        profile.area,
        profile.postcode,
        profile.state,
        profile.country === "Malaysia"
          ? ui.malaysia
          : profile.country,
      ]
        .filter(Boolean)
        .join(", ");
    }, [profile, ui.malaysia]);

  function openEdit(
    mode: Exclude<
      EditMode,
      null
    >
  ) {
    if (!profile) {
      return;
    }

    setForm({
      ...profile,
    });

    setEditMode(mode);
    setError("");
    setSuccess("");
  }

  function updateField<
    K extends keyof ProfileData
  >(
    key: K,
    value: ProfileData[K]
  ) {
    setForm((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current
    );
  }

  async function saveProfile(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !profile ||
      !form
    ) {
      return;
    }

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim()
    ) {
      setError(
        ui.personalRequired
      );
      return;
    }

    if (
      editMode ===
        "ADDRESS" &&
      (
        !form.recipientName.trim() ||
        !form.recipientPhone.trim() ||
        !form.addressLine1.trim() ||
        !form.area.trim() ||
        !form.state.trim() ||
        !form.postcode.trim()
      )
    ) {
      setError(
        ui.addressRequired
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await updateMemberProfile({
          memberId:
            profile.memberId,
          fullName:
            form.fullName,
          displayName:
            form.displayName,
          email:
            form.email,
          phone:
            form.phone,
          birthday:
            form.birthday,
          gender:
            form.gender,
          recipientName:
            form.recipientName,
          recipientPhone:
            form.recipientPhone,
          addressLine1:
            form.addressLine1,
          addressLine2:
            form.addressLine2,
          area:
            form.area,
          state:
            form.state,
          postcode:
            form.postcode,
          country:
            form.country,
          defaultDeliveryMethod:
            form.defaultDeliveryMethod,
        });

      const data =
        unwrap(response);

      const updated =
        normalizeProfile(
          data.profile ||
            data
        );

      setProfile(updated);
      setForm(updated);
      updateLocalMember(updated);
      setEditMode(null);
      setSuccess(
        ui.saved
      );

      window.dispatchEvent(
        new CustomEvent(
          "rewardhub-member-profile-updated",
          {
            detail:
              updated,
          }
        )
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : ui.updateFailed
      );
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem(
      "member"
    );

    localStorage.removeItem(
      "merchant"
    );

    sessionStorage.removeItem(
      "rewardhub_tawk_identity"
    );

    router.replace(
      "/login"
    );
  }

  if (loading) {
    return (
      <MemberLayout>
        <main className="min-h-screen bg-[#f6f7fb] px-4 py-12">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-500" />
        </main>
      </MemberLayout>
    );
  }

  if (!profile) {
    return (
      <MemberLayout>
        <main className="min-h-screen bg-[#f6f7fb] px-4 py-10">
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="font-black text-rose-600">
              {error ||
                ui.loadFailed}
            </p>
          </div>
        </main>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-6xl">
          <Link
            href="/member/dashboard"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm sm:px-5 sm:py-3 sm:text-sm"
          >
            ←{" "}
            {t(
              "memberProfile.backToDashboard"
            )}
          </Link>

          {success ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              {success}
            </div>
          ) : null}

          <div className="mt-5 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:mt-6 sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-9">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 sm:h-20 sm:w-20 sm:rounded-[1.5rem] sm:p-3">
                  <img
                    src="/rewardhub-logo.png"
                    alt="RewardHub"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs">
                    {ui.memberProfile}
                  </p>

                  <h1 className="mt-1 truncate text-2xl font-black sm:mt-2 sm:text-4xl md:text-5xl">
                    {profile.displayName ||
                      profile.fullName}
                  </h1>

                  <p className="mt-1 truncate text-[10px] font-bold text-slate-400 sm:mt-2 sm:text-sm">
                    {localizeTier(profile.tier, ui)} {ui.member} •{" "}
                    {profile.memberId}
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-full bg-emerald-400/15 px-3 py-2 text-[10px] font-black text-emerald-300 sm:px-5 sm:py-3 sm:text-sm">
                {localizeStatus(profile.status, ui)}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 sm:mt-8 sm:gap-4">
              <StatCard
                title={ui.tier}
                value={
                  localizeTier(profile.tier, ui)
                }
              />

              <StatCard
                title={ui.memberId}
                value={
                  profile.memberId
                }
                compact
              />

              <StatCard
                title={ui.accountStatus}
                value={
                  localizeStatus(profile.status, ui)
                }
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
              <SectionHeader
                icon={
                  <UserRound className="h-5 w-5" />
                }
                title={ui.personalInformation}
                editLabel={ui.edit}
                onEdit={() =>
                  openEdit(
                    "PERSONAL"
                  )
                }
              />

              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <InfoCard
                  label={ui.fullName}
                  value={
                    profile.fullName
                  }
                />

                <InfoCard
                  label={ui.displayName}
                  value={
                    profile.displayName
                  }
                />

                <InfoCard
                  label={ui.gender}
                  value={
                    localizeGender(profile.gender, ui)
                  }
                />

                <InfoCard
                  label={ui.birthday}
                  value={
                    formatProfileDate(
                      profile.birthday,
                      language
                    )
                  }
                />

                <InfoCard
                  label={ui.email}
                  value={
                    profile.email
                  }
                />

                <InfoCard
                  label={ui.phone}
                  value={
                    profile.phone
                  }
                />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                {ui.accountSummary}
              </h2>

              <div className="mt-6 space-y-3">
                <SummaryRow
                  label={ui.membership}
                  value={ui.lifetime}
                />
                <SummaryRow
                  label={ui.referral}
                  value={ui.enabled}
                />
                <SummaryRow
                  label={ui.rewardCredits}
                  value={ui.enabled}
                />
                <SummaryRow
                  label={ui.security}
                  value={ui.protected}
                />
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
              <SectionHeader
                icon={
                  <MapPin className="h-5 w-5" />
                }
                title={ui.shippingAddress}
                editLabel={ui.edit}
                onEdit={() =>
                  openEdit(
                    "ADDRESS"
                  )
                }
              />

              {fullAddress ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <InfoCard
                    label={ui.recipientName}
                    value={
                      profile.recipientName
                    }
                  />

                  <InfoCard
                    label={ui.recipientPhone}
                    value={
                      profile.recipientPhone
                    }
                  />

                  <div className="sm:col-span-2">
                    <InfoCard
                      label={ui.shippingAddress}
                      value={
                        fullAddress
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  {ui.noAddress}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
              <SectionHeader
                icon={
                  <Truck className="h-5 w-5" />
                }
                title={ui.deliveryPreference}
                editLabel={ui.edit}
                onEdit={() =>
                  openEdit(
                    "DELIVERY"
                  )
                }
              />

              <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">
                  {ui.defaultMethod}
                </p>

                <p className="mt-2 text-2xl font-black">
                  {localizeDelivery(
                    profile.defaultDeliveryMethod,
                    ui
                  )}
                </p>
              </div>
            </section>
          </div>

          <div className="mt-6">
            <PushNotificationManager
              userType="MEMBER"
              userId={
                profile.memberId
              }
            />
          </div>

          <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              {ui.security}
            </h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              <ActionCard
                title={ui.securityCenter}
                subtitle={ui.securityCenterDescription}
                href="/member/security"
                openLabel={ui.open}
              />

              <ActionCard
                title={ui.changePassword}
                subtitle={ui.changePasswordDescription}
                href="/member/change-password"
                openLabel={ui.open}
              />

              <ActionCard
                title={ui.devices}
                subtitle={ui.devicesDescription}
                href="/member/devices"
                openLabel={ui.open}
              />
            </div>
          </section>

          <section className="mt-6 rounded-[2rem] border border-red-100 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-black text-red-600 sm:text-2xl">
              {ui.dangerZone}
            </h2>

            <button
              type="button"
              onClick={logout}
              className="mt-6 w-full rounded-2xl bg-red-600 py-4 text-sm font-black text-white shadow-xl shadow-red-600/20"
            >
              {ui.logout}
            </button>
          </section>
        </section>

        {editMode &&
        form ? (
          <EditModal
            ui={ui}
            mode={editMode}
            form={form}
            saving={saving}
            error={error}
            onClose={() =>
              setEditMode(
                null
              )
            }
            onSubmit={
              saveProfile
            }
            updateField={
              updateField
            }
          />
        ) : null}
      </main>
    </MemberLayout>
  );
}

function EditModal({
  ui,
  mode,
  form,
  saving,
  error,
  onClose,
  onSubmit,
  updateField,
}: {
  ui: ProfileCopy;
  mode: Exclude<
    EditMode,
    null
  >;
  form: ProfileData;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    event: FormEvent
  ) => void;
  updateField: <
    K extends keyof ProfileData
  >(
    key: K,
    value: ProfileData[K]
  ) => void;
}) {
  const title =
    mode === "PERSONAL"
      ? ui.editPersonal
      : mode === "ADDRESS"
        ? ui.editAddress
        : ui.editDelivery;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-5">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-[30px] sm:p-7"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-700">
            {error}
          </div>
        ) : null}

        {mode ===
        "PERSONAL" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field
              label={ui.fullName}
              required
            >
              <input
                value={
                  form.fullName
                }
                onChange={(event) =>
                  updateField(
                    "fullName",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label={ui.displayName}>
              <input
                value={
                  form.displayName
                }
                onChange={(event) =>
                  updateField(
                    "displayName",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label={ui.email}
              required
            >
              <input
                type="email"
                value={
                  form.email
                }
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label={ui.phone}
              required
            >
              <input
                type="tel"
                value={
                  form.phone
                }
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label={ui.birthday}>
              <input
                type="date"
                value={
                  form.birthday
                }
                onChange={(event) =>
                  updateField(
                    "birthday",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label={ui.gender}>
              <select
                value={
                  form.gender
                }
                onChange={(event) =>
                  updateField(
                    "gender",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  -
                </option>
                <option value="Male">
                  {ui.male}
                </option>
                <option value="Female">
                  {ui.female}
                </option>
                <option value="Other">
                  {ui.other}
                </option>
              </select>
            </Field>
          </div>
        ) : null}

        {mode ===
        "ADDRESS" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field
              label={ui.recipientName}
              required
            >
              <input
                value={
                  form.recipientName
                }
                onChange={(event) =>
                  updateField(
                    "recipientName",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label={ui.recipientPhone}
              required
            >
              <input
                value={
                  form.recipientPhone
                }
                onChange={(event) =>
                  updateField(
                    "recipientPhone",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <div className="sm:col-span-2">
              <Field
                label={ui.addressLine1}
                required
              >
                <input
                  value={
                    form.addressLine1
                  }
                  onChange={(event) =>
                    updateField(
                      "addressLine1",
                      event.target.value
                    )
                  }
                  className={
                    inputClass
                  }
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label={ui.addressLine2}>
                <input
                  value={
                    form.addressLine2
                  }
                  onChange={(event) =>
                    updateField(
                      "addressLine2",
                      event.target.value
                    )
                  }
                  className={
                    inputClass
                  }
                />
              </Field>
            </div>

            <Field
              label={ui.area}
              required
            >
              <input
                value={
                  form.area
                }
                onChange={(event) =>
                  updateField(
                    "area",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label={ui.state}
              required
            >
              <select
                value={
                  form.state
                }
                onChange={(event) =>
                  updateField(
                    "state",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  -
                </option>

                {states.map(
                  (state) => (
                    <option
                      key={state}
                      value={state}
                    >
                      {state}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field
              label={ui.postcode}
              required
            >
              <input
                value={
                  form.postcode
                }
                onChange={(event) =>
                  updateField(
                    "postcode",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label={ui.country}
              required
            >
              <input
                value={
                  form.country
                }
                onChange={(event) =>
                  updateField(
                    "country",
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>
          </div>
        ) : null}

        {mode ===
        "DELIVERY" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <DeliveryChoice
              active={
                form.defaultDeliveryMethod ===
                "Delivery"
              }
              title={ui.delivery}
              onClick={() =>
                updateField(
                  "defaultDeliveryMethod",
                  "Delivery"
                )
              }
            />

            <DeliveryChoice
              active={
                form.defaultDeliveryMethod ===
                "Self Pickup"
              }
              title={ui.selfPickup}
              onClick={() =>
                updateField(
                  "defaultDeliveryMethod",
                  "Self Pickup"
                )
              }
            />
          </div>
        ) : null}

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-13 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700"
          >
            {ui.cancel}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {ui.saving}
              </>
            ) : (
              ui.save
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none focus:border-slate-400 focus:bg-white";

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-700">
        {label}
        {required ? (
          <span className="ml-1 text-rose-600">
            *
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}

function DeliveryChoice({
  active,
  title,
  onClick,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left font-black transition ${
        active
          ? "border-amber-400 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {title}
    </button>
  );
}

function SectionHeader({
  icon,
  title,
  editLabel,
  onEdit,
}: {
  icon:
    React.ReactNode;
  title: string;
  editLabel: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
          {icon}
        </span>

        <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
          {title}
        </h2>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm"
      >
        <Edit3 className="h-4 w-4" />
        {editLabel}
      </button>
    </div>
  );
}

function StatCard({
  title,
  value,
  compact = false,
}: {
  title: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-white/10 p-3 text-white sm:rounded-[2rem] sm:p-6">
      <p className="truncate text-[9px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>

      <h3
        className={`mt-1 break-words font-black leading-tight sm:mt-3 ${
          compact
            ? "text-[12px] sm:text-xl"
            : "text-sm sm:text-3xl"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-5">
      <p className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 sm:text-xs">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-black text-slate-950 sm:mt-2 sm:text-lg">
        {value || "-"}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
      <span className="text-sm font-bold text-slate-500">
        {label}
      </span>

      <span className="text-sm font-black text-slate-950">
        {value}
      </span>
    </div>
  );
}

function ActionCard({
  title,
  subtitle,
  href,
  openLabel,
}: {
  title: string;
  subtitle: string;
  href: string;
  openLabel: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-slate-50 p-3 no-underline transition hover:bg-slate-100 sm:rounded-2xl sm:p-5"
    >
      <p className="text-sm font-black text-slate-950 sm:text-lg">
        {title}
      </p>

      <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500 sm:text-sm">
        {subtitle}
      </p>

      <p className="mt-3 text-[10px] font-black text-slate-950 sm:text-sm">
        {openLabel} →
      </p>
    </Link>
  );
}

function updateLocalMember(
  profile: ProfileData
) {
  try {
    const current =
      JSON.parse(
        localStorage.getItem(
          "member"
        ) || "{}"
      );

    localStorage.setItem(
      "member",
      JSON.stringify({
        ...current,
        ...profile,
      })
    );
  } catch {
    // Do not block a successful profile update.
  }
}