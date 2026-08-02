"use client";

import { Suspense, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import { merchantRegister } from "@/lib/api";
import PWAInstallGuide from "@/components/pwa/PWAInstallGuide";

const subCategoryOptions: Record<string, string[]> = {
  "Food & Beverage": [
    "Restaurant",
    "Fast Food",
    "Bakery",
    "Dessert",
    "Bubble Tea",
    "Catering",
    "Food Stall",
  ],

  Cafe: [
    "Coffee Shop",
    "Tea House",
    "Dessert Cafe",
    "Internet Cafe",
  ],

  Retail: [
    "Mini Market",
    "Convenience Store",
    "Gift Shop",
    "Bookstore",
    "Department Store",
  ],

  Fashion: [
    "Clothing",
    "Shoes",
    "Bags",
    "Accessories",
    "Jewellery",
  ],

  Beauty: [
    "Hair Salon",
    "Nail Salon",
    "Beauty Salon",
    "Spa",
    "Skincare",
    "Makeup",
  ],

  "Health & Wellness": [
    "Clinic",
    "Dental",
    "Pharmacy",
    "Massage",
    "Chiropractic",
    "Traditional Medicine",
  ],

  Fitness: [
    "Gym",
    "Yoga",
    "Pilates",
    "Personal Trainer",
    "Sports Centre",
  ],

  "Hotel & Travel": [
    "Hotel",
    "Homestay",
    "Resort",
    "Travel Agency",
    "Tour Service",
  ],

  Education: [
    "Tuition Centre",
    "Language Centre",
    "Music School",
    "Training Centre",
    "Childcare",
  ],

  "Home & Living": [
    "Furniture",
    "Renovation",
    "Interior Design",
    "Curtain",
    "Home Appliance",
    "Cleaning Service",
  ],

  Automotive: [
    "Workshop",
    "Car Wash",
    "Tyre Shop",
    "Car Tint",
    "Car Accessories",
    "Motorcycle Shop",
  ],

  Pets: [
    "Pet Shop",
    "Pet Grooming",
    "Veterinary",
    "Pet Hotel",
  ],

  Electronics: [
    "Mobile Phone Shop",
    "Computer Shop",
    "Electronics Store",
    "Repair Service",
  ],

  "Online Store": [
    "Marketplace Seller",
    "Website Store",
    "Social Media Store",
    "Digital Products",
  ],

  "Professional Services": [
    "Accounting",
    "Legal",
    "Insurance",
    "Property",
    "Consulting",
    "Marketing",
  ],

  Entertainment: [
    "KTV",
    "Cinema",
    "Theme Park",
    "Gaming Centre",
    "Event Service",
  ],

  Wholesale: [
    "Distributor",
    "Supplier",
    "Importer",
    "Manufacturer",
  ],

  Other: ["Other"],
};

const areaOptions: Record<string, string[]> = {
  Johor: [
    "Johor Bahru",
    "Muar",
    "Batu Pahat",
    "Kluang",
    "Kulai",
    "Pontian",
    "Segamat",
    "Tangkak",
    "Kota Tinggi",
    "Mersing",
  ],

  Kedah: [
    "Alor Setar",
    "Sungai Petani",
    "Kulim",
    "Langkawi",
    "Jitra",
    "Baling",
  ],

  Kelantan: [
    "Kota Bharu",
    "Pasir Mas",
    "Tanah Merah",
    "Machang",
    "Tumpat",
    "Gua Musang",
  ],

  Melaka: [
    "Melaka City",
    "Ayer Keroh",
    "Alor Gajah",
    "Jasin",
    "Masjid Tanah",
  ],

  "Negeri Sembilan": [
    "Seremban",
    "Nilai",
    "Port Dickson",
    "Bahau",
    "Kuala Pilah",
  ],

  Pahang: [
    "Kuantan",
    "Temerloh",
    "Bentong",
    "Cameron Highlands",
    "Genting Highlands",
    "Raub",
  ],

  Penang: [
    "George Town",
    "Bayan Lepas",
    "Butterworth",
    "Bukit Mertajam",
    "Perai",
    "Balik Pulau",
  ],

  Perak: [
    "Ipoh",
    "Taiping",
    "Sitiawan",
    "Teluk Intan",
    "Kampar",
    "Batu Gajah",
  ],

  Perlis: [
    "Kangar",
    "Arau",
    "Padang Besar",
    "Kuala Perlis",
  ],

  Sabah: [
    "Kota Kinabalu",
    "Sandakan",
    "Tawau",
    "Lahad Datu",
    "Keningau",
    "Semporna",
  ],

  Sarawak: [
    "Kuching",
    "Miri",
    "Sibu",
    "Bintulu",
    "Sri Aman",
    "Limbang",
  ],

  Selangor: [
    "Shah Alam",
    "Petaling Jaya",
    "Subang Jaya",
    "Puchong",
    "Klang",
    "Kajang",
    "Ampang",
    "Cyberjaya",
    "Semenyih",
    "Rawang",
    "Cheras Selatan",
  ],

  Terengganu: [
    "Kuala Terengganu",
    "Kemaman",
    "Dungun",
    "Marang",
    "Besut",
  ],

  "Kuala Lumpur": [
    "Cheras",
    "Bukit Bintang",
    "Setapak",
    "Kepong",
    "Bangsar",
    "Mont Kiara",
    "Sri Petaling",
    "Old Klang Road",
    "Wangsa Maju",
    "Titiwangsa",
  ],

  Putrajaya: [
    "Putrajaya",
  ],

  Labuan: [
    "Labuan",
  ],
};
function MerchantRegisterContent() {
  const {
    language,
  } = useLanguage();

  const pageText = {
    en: {
      merchantRegister: "Merchant Register",
      subtitle: "Create your merchant account",
      referredByMember: "Referred by Member",
      referredByMerchant: "Referred by Merchant",
      businessName: "Business Name",
      ownerName: "Owner Name",
      loginEmail: "Login Email",
      mainCategory: "Main Category",
      subCategory: "Sub Category",
      selectCategory: "Select Category",
      selectSubCategory: "Select Sub Category",
      selectCategoryFirst: "Select Category First",
      state: "State",
      area: "Area",
      selectState: "Select State",
      selectArea: "Select Area",
      selectStateFirst: "Select State First",
      businessAddress: "Business Address",
      addressPlaceholder: "Enter full business address",
      password: "Password",
      creatingAccount: "Creating Account...",
      createAccount: "Create Merchant Account",
      accountCreated: "Merchant Account Created",
      status: "Status",
      active: "Active",
      goToLogin: "Go to Merchant Login",
      registrationFailed: "Registration failed",
      loading: "Loading RewardHub...",
    },

    zh: {
      merchantRegister: "商家注册",
      subtitle: "创建您的商家账户",
      referredByMember: "会员推荐人",
      referredByMerchant: "商家推荐人",
      businessName: "商家名称",
      ownerName: "负责人姓名",
      loginEmail: "登录邮箱",
      mainCategory: "主要分类",
      subCategory: "子分类",
      selectCategory: "选择分类",
      selectSubCategory: "选择子分类",
      selectCategoryFirst: "请先选择主要分类",
      state: "州属",
      area: "地区",
      selectState: "选择州属",
      selectArea: "选择地区",
      selectStateFirst: "请先选择州属",
      businessAddress: "商家地址",
      addressPlaceholder: "请输入完整商家地址",
      password: "密码",
      creatingAccount: "正在创建账户...",
      createAccount: "创建商家账户",
      accountCreated: "商家账户已创建",
      status: "状态",
      active: "启用中",
      goToLogin: "前往商家登录",
      registrationFailed: "注册失败",
      loading: "RewardHub 加载中...",
    },

    ms: {
      merchantRegister: "Pendaftaran Peniaga",
      subtitle: "Cipta akaun peniaga anda",
      referredByMember: "Dirujuk oleh Ahli",
      referredByMerchant: "Dirujuk oleh Peniaga",
      businessName: "Nama Perniagaan",
      ownerName: "Nama Pemilik",
      loginEmail: "E-mel Log Masuk",
      mainCategory: "Kategori Utama",
      subCategory: "Subkategori",
      selectCategory: "Pilih Kategori",
      selectSubCategory: "Pilih Subkategori",
      selectCategoryFirst: "Pilih Kategori Terlebih Dahulu",
      state: "Negeri",
      area: "Kawasan",
      selectState: "Pilih Negeri",
      selectArea: "Pilih Kawasan",
      selectStateFirst: "Pilih Negeri Terlebih Dahulu",
      businessAddress: "Alamat Perniagaan",
      addressPlaceholder: "Masukkan alamat penuh perniagaan",
      password: "Kata Laluan",
      creatingAccount: "Sedang Mencipta Akaun...",
      createAccount: "Cipta Akaun Peniaga",
      accountCreated: "Akaun Peniaga Berjaya Dicipta",
      status: "Status",
      active: "Aktif",
      goToLogin: "Pergi ke Log Masuk Peniaga",
      registrationFailed: "Pendaftaran gagal",
      loading: "RewardHub sedang dimuatkan...",
    },
  } as const;

  const copy =
    pageText[language];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [category, setCategory] = useState("");
const [subCategory, setSubCategory] = useState("");
const [state, setState] = useState("");
const [area, setArea] = useState("");
const [referredByMember, setReferredByMember] = useState("");
const [referredByMerchant, setReferredByMerchant] = useState("");

useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  const queryMemberRef =
    params.get("refMember") ||
    params.get("ref") ||
    "";

  const queryMerchantRef =
    params.get("refMerchant") ||
    "";

  if (queryMemberRef) {
    localStorage.setItem("rewardhub_ref", queryMemberRef);
    setReferredByMember(queryMemberRef);
  } else {
    const savedRef = localStorage.getItem("rewardhub_ref") || "";
    setReferredByMember(savedRef);
  }

  setReferredByMerchant(queryMerchantRef);
}, []);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);

      const phoneNumber = String(form.get("phone") || "")
        .replace(/\D/g, "")
        .replace(/^0+/, "");

      const phone = phoneNumber.startsWith("60")
        ? phoneNumber
        : `60${phoneNumber}`;

      const res = await merchantRegister({
        businessName: String(form.get("businessName") || ""),
        ownerName: String(form.get("ownerName") || ""),
        loginEmail: String(form.get("loginEmail") || ""),
        phone,
       category,
subCategory,
state,
area,
address: String(form.get("address") || "").trim(),
location: [area, state].filter(Boolean).join(", "),
password: String(form.get("password") || ""),
        referredByMember,
referredByMerchant,
      });

      const data = res?.data?.data || res?.data || res?.result || res;

      if (!data?.merchantId) {
        alert(data?.message || copy.registrationFailed);
        return;
      }

      setResult(data);
        localStorage.removeItem("rewardhub_ref");
    } catch (err: any) {
      alert(err?.message || copy.registrationFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />

      <main className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_35%),#f8fafc]">
        <div className="absolute right-4 top-4 z-40 sm:right-6 sm:top-6">
          <LanguageSwitcher compact />
        </div>
        <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto w-full max-w-2xl rounded-[2rem] bg-white p-5 shadow-2xl sm:p-8">
            <div className="text-center">
              <img
                src="/rewardhub-logo.png"
                alt="RewardHub"
                className="mx-auto h-14 w-auto object-contain sm:h-16"
              />

              <h1 className="mt-5 text-3xl font-black text-slate-950 sm:mt-6 sm:text-4xl">
                {copy.merchantRegister}
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                {copy.subtitle}
              </p>
              {referredByMember && (
  <p className="mt-3 text-xs font-bold text-emerald-700">
    {copy.referredByMember}: {referredByMember}
  </p>
)}

{referredByMerchant && (
  <p className="mt-3 text-xs font-bold text-amber-700">
    {copy.referredByMerchant}: {referredByMerchant}
  </p>
)}
            </div>

            {!result ? (
              <form onSubmit={handleRegister} className="mt-8 space-y-4">
                <input
                  name="businessName"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder={copy.businessName}
                />

                <input
                  name="ownerName"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder={copy.ownerName}
                />

                <input
                  name="loginEmail"
                  type="email"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder={copy.loginEmail}
                />

                <div className="flex overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex items-center bg-slate-100 px-5 font-black text-slate-700">
                    +60
                  </div>

                  <input
                    name="phone"
                    required
                    inputMode="numeric"
                    className="w-full px-5 py-4 font-semibold outline-none"
                    placeholder="123456789"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
  <div className="min-w-0">
    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
      {copy.mainCategory}
    </label>

    <select
      name="category"
      required
      value={category}
      onChange={(e) => {
        setCategory(e.target.value);
        setSubCategory("");
      }}
      className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm"
    >
      <option value="">{copy.selectCategory}</option>

      <option value="Food & Beverage">Food & Beverage</option>
      <option value="Cafe">Cafe</option>
      <option value="Retail">Retail</option>
      <option value="Fashion">Fashion</option>
      <option value="Beauty">Beauty</option>
      <option value="Health & Wellness">Health & Wellness</option>
      <option value="Fitness">Fitness</option>
      <option value="Hotel & Travel">Hotel & Travel</option>
      <option value="Education">Education</option>
      <option value="Home & Living">Home & Living</option>
      <option value="Automotive">Automotive</option>
      <option value="Pets">Pets</option>
      <option value="Electronics">Electronics</option>
      <option value="Online Store">Online Store</option>
      <option value="Professional Services">
        Professional Services
      </option>
      <option value="Entertainment">Entertainment</option>
      <option value="Wholesale">Wholesale</option>
      <option value="Other">Other</option>
    </select>
  </div>

  <div className="min-w-0">
    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
      {copy.subCategory}
    </label>

    <select
      name="subCategory"
      required
      value={subCategory}
      onChange={(e) => setSubCategory(e.target.value)}
      disabled={!category}
      className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-100 disabled:text-slate-400 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm"
    >
      <option value="">
        {category ? copy.selectSubCategory : copy.selectCategoryFirst}
      </option>

      {(subCategoryOptions[category] || []).map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  </div>
</div>

<div className="grid grid-cols-2 gap-3 sm:gap-4">
  <div className="min-w-0">
    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
      {copy.state}
    </label>

    <select
      name="state"
      required
      value={state}
      onChange={(e) => {
        setState(e.target.value);
        setArea("");
      }}
      className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm"
    >
      <option value="">{copy.selectState}</option>

      <option value="Johor">Johor</option>
      <option value="Kedah">Kedah</option>
      <option value="Kelantan">Kelantan</option>
      <option value="Melaka">Melaka</option>
      <option value="Negeri Sembilan">Negeri Sembilan</option>
      <option value="Pahang">Pahang</option>
      <option value="Penang">Penang</option>
      <option value="Perak">Perak</option>
      <option value="Perlis">Perlis</option>
      <option value="Sabah">Sabah</option>
      <option value="Sarawak">Sarawak</option>
      <option value="Selangor">Selangor</option>
      <option value="Terengganu">Terengganu</option>
      <option value="Kuala Lumpur">Kuala Lumpur</option>
      <option value="Putrajaya">Putrajaya</option>
      <option value="Labuan">Labuan</option>
    </select>
  </div>

  <div className="min-w-0">
    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
      {copy.area}
    </label>

    <select
      name="area"
      required
      value={area}
      onChange={(e) => setArea(e.target.value)}
      disabled={!state}
      className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-100 disabled:text-slate-400 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm"
    >
      <option value="">
        {state ? copy.selectArea : copy.selectStateFirst}
      </option>

      {(areaOptions[state] || []).map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  </div>
</div>

                <div>
  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
    {copy.businessAddress}
  </label>

  <textarea
    name="address"
    required
    rows={3}
    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-5"
    placeholder={copy.addressPlaceholder}
  />
</div>

                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder={copy.password}
                />

                <button
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  {loading ? copy.creatingAccount : copy.createAccount}
                </button>
              </form>
            ) : (
              <div className="mt-8">
                <div className="rounded-[1.75rem] bg-emerald-50 p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white">
                    ✓
                  </div>

                  <p className="mt-4 text-sm font-bold text-emerald-700">
                    {copy.accountCreated}
                  </p>

                  <h2 className="mt-3 text-3xl font-black text-emerald-900">
                    {result.merchantId}
                  </h2>

                  <p className="mt-2 text-sm font-semibold text-emerald-700">
                    {copy.status}:{" "}
                    {result.status || copy.active}
                  </p>
                </div>

                <PWAInstallGuide
                  language={language}
                  variant="business"
                  loginHref="/merchant/login"
                  accountId={result.merchantId}
                  statusLabel={copy.status}
                  statusValue={result.status || copy.active}
                />
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function MerchantRegisterLoading() {
  const {
    language,
  } = useLanguage();

  const loadingText = {
    en: "Loading RewardHub...",
    zh: "RewardHub 加载中...",
    ms: "RewardHub sedang dimuatkan...",
  } as const;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />

        <p className="mt-4 text-sm font-semibold text-slate-500">
          {loadingText[language]}
        </p>
      </div>
    </main>
  );
}

export default function MerchantRegisterPage() {
  return (
    <Suspense fallback={<MerchantRegisterLoading />}>
      <MerchantRegisterContent />
    </Suspense>
  );
}