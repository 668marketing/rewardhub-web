"use client";

import { Suspense, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { merchantRegister } from "@/lib/api";

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
        alert(data?.message || "Registration failed");
        return;
      }

      setResult(data);
        localStorage.removeItem("rewardhub_ref");
    } catch (err: any) {
      alert(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_35%),#f8fafc]">
        <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto w-full max-w-2xl rounded-[2rem] bg-white p-5 shadow-2xl sm:p-8">
            <div className="text-center">
              <img
                src="/rewardhub-logo.png"
                alt="RewardHub"
                className="mx-auto h-14 w-auto object-contain sm:h-16"
              />

              <h1 className="mt-5 text-3xl font-black text-slate-950 sm:mt-6 sm:text-4xl">
                Merchant Register
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Create your merchant account
              </p>
              {referredByMember && (
  <p className="mt-3 text-xs font-bold text-emerald-700">
    Referred by Member: {referredByMember}
  </p>
)}

{referredByMerchant && (
  <p className="mt-3 text-xs font-bold text-amber-700">
    Referred by Merchant: {referredByMerchant}
  </p>
)}
            </div>

            {!result ? (
              <form onSubmit={handleRegister} className="mt-8 space-y-4">
                <input
                  name="businessName"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder="Business Name"
                />

                <input
                  name="ownerName"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder="Owner Name"
                />

                <input
                  name="loginEmail"
                  type="email"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder="Login Email"
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
      Main Category
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
      <option value="">Select Category</option>

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
      Sub Category
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
        {category ? "Select Sub Category" : "Select Category First"}
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
      State
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
      <option value="">Select State</option>

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
      Area
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
        {state ? "Select Area" : "Select State First"}
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
    Business Address
  </label>

  <textarea
    name="address"
    required
    rows={3}
    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-5"
    placeholder="Enter full business address"
  />
</div>

                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-semibold outline-none focus:border-slate-950"
                  placeholder="Password"
                />

                <button
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Create Merchant Account"}
                </button>
              </form>
            ) : (
              <div className="mt-8 rounded-3xl bg-emerald-50 p-6 text-center">
                <p className="text-sm font-bold text-emerald-700">
                  Merchant Account Created
                </p>

                <h2 className="mt-3 text-3xl font-black text-emerald-900">
                  {result.merchantId}
                </h2>

                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  Status: {result.status || "Active"}
                </p>

                <a
                  href="/merchant/login"
                  className="mt-6 block rounded-2xl bg-slate-950 py-4 text-sm font-black text-white"
                >
                  Go to Merchant Login
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function MerchantRegisterLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />

        <p className="mt-4 text-sm font-semibold text-slate-500">
          Loading RewardHub...
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