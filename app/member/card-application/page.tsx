"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MemberLayout from "@/components/layout/MemberLayout";
import {
  getMemberCardApplication,
  submitMemberCardApplication,
  cancelMemberCardApplication,
  uploadCardReplacementReceipt,
} from "@/lib/api";

const replacementPayment = {
  amount: 8,
  bankName: "MAYBANK",
  accountName: "668 MARKETING ENTERPRISE",
  accountNumber: "888111888",
  qrImageUrl: "/rewardhub-bank-qr.png",
};

const malaysiaAreas: Record<string, string[]> = {
  Johor: [
    "Johor Bahru",
    "Iskandar Puteri",
    "Pasir Gudang",
    "Kulai",
    "Skudai",
    "Muar",
    "Batu Pahat",
    "Kluang",
    "Segamat",
    "Tangkak",
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
    "Tumpat",
    "Tanah Merah",
    "Machang",
    "Kuala Krai",
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
    "Port Dickson",
    "Nilai",
    "Bahau",
    "Kuala Pilah",
    "Tampin",
  ],
  Pahang: [
    "Kuantan",
    "Temerloh",
    "Bentong",
    "Raub",
    "Jerantut",
    "Pekan",
    "Cameron Highlands",
  ],
  Penang: [
    "George Town",
    "Bayan Lepas",
    "Butterworth",
    "Bukit Mertajam",
    "Seberang Jaya",
    "Perai",
  ],
  Perak: [
    "Ipoh",
    "Taiping",
    "Sitiawan",
    "Manjung",
    "Teluk Intan",
    "Kuala Kangsar",
    "Kampar",
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
    "Samarahan",
    "Sri Aman",
  ],
  Selangor: [
    "Shah Alam",
    "Petaling Jaya",
    "Subang Jaya",
    "Puchong",
    "Klang",
    "Kajang",
    "Bangi",
    "Cyberjaya",
    "Rawang",
    "Ampang",
  ],
  Terengganu: [
    "Kuala Terengganu",
    "Kuala Nerus",
    "Dungun",
    "Kemaman",
    "Marang",
    "Besut",
  ],
  "Kuala Lumpur": [
    "Kuala Lumpur City Centre",
    "Bukit Bintang",
    "Cheras",
    "Kepong",
    "Setapak",
    "Bangsar",
    "Mont Kiara",
  ],
  Putrajaya: ["Putrajaya"],
  Labuan: ["Labuan"],
};

type ApplicationType = "First Card" | "Replacement Card";

type CardApplication = {
  applicationId: string;
  memberId: string;
  applicationType: ApplicationType | string;
  oldCardId: string;
  freezeOldCard: boolean;
  lossReason: string;
  replacementFee: number;
  paymentStatus: string;
  paymentReceiptUrl: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  area: string;
  postcode: string;
  deliveryNote: string;
  status: string;
  trackingNo: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string;
  shippedAt: string;
  completedAt: string;
};

type CardApplicationResponse = {
  profile?: {
    fullName?: string;
    phone?: string;
    email?: string;
    cardId?: string;
    cardStatus?: string;
  };
  hasExistingCard?: boolean;
  canApplyFirstCard?: boolean;
  canApplyReplacement?: boolean;
  activeApplication?: CardApplication | null;
  applications?: CardApplication[];
};

export default function CardApplicationPage() {
  const [memberId, setMemberId] = useState("");
  const [sessionMissing, setSessionMissing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [profileCardId, setProfileCardId] = useState("");
  const [profileCardStatus, setProfileCardStatus] = useState("");

  const [applications, setApplications] = useState<CardApplication[]>([]);
  const [activeApplication, setActiveApplication] =
    useState<CardApplication | null>(null);

  const [hasExistingCard, setHasExistingCard] = useState(false);
  const [canApplyFirstCard, setCanApplyFirstCard] = useState(false);
  const [canApplyReplacement, setCanApplyReplacement] = useState(false);
  const [replacementFormOpen, setReplacementFormOpen] = useState(false);

  const [applicationType, setApplicationType] =
    useState<ApplicationType>("First Card");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [area, setArea] = useState("");
  const [postcode, setPostcode] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [lossReason, setLossReason] = useState("");
  const [freezeOldCard, setFreezeOldCard] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] =
  useState(false);

  const availableAreas = useMemo(
    () => malaysiaAreas[state] || [],
    [state]
  );

  const historyApplications = useMemo(() => {
    if (!activeApplication) {
      return applications;
    }

    return applications.filter(
      (application) =>
        application.applicationId !== activeApplication.applicationId
    );
  }, [applications, activeApplication]);

  useEffect(() => {
    void loadApplication();
  }, []);

  async function loadApplication() {
    try {
      setLoading(true);
      setLoadError("");
      setSessionMissing(false);

      const stored = JSON.parse(
        localStorage.getItem("member") || "{}"
      );

      const id =
        stored?.memberId ||
        stored?.MEMBER_ID ||
        "";

      if (!id) {
        setSessionMissing(true);
        return;
      }

      setMemberId(id);

      const response = await getMemberCardApplication({
        memberId: id,
      });

      const data: CardApplicationResponse =
        response?.data?.data ||
        response?.data ||
        response?.result ||
        response ||
        {};

      const profile = data?.profile || {};

      setFullName(
        String(
          profile?.fullName ||
            stored?.fullName ||
            stored?.FULL_NAME ||
            ""
        )
      );

      setPhone(
        String(
          profile?.phone ||
            stored?.phone ||
            stored?.PHONE ||
            ""
        )
      );

      setEmail(
        String(
          profile?.email ||
            stored?.email ||
            stored?.EMAIL ||
            ""
        )
      );

      setProfileCardId(String(profile?.cardId || ""));
      setProfileCardStatus(String(profile?.cardStatus || ""));

      const applicationList = Array.isArray(data?.applications)
  ? data.applications
  : [];

const currentApplication =
  data?.activeApplication || null;

const hasCompletedApplication =
  applicationList.some((application: CardApplication) => {
    return (
      String(application?.status || "")
        .trim()
        .toLowerCase() === "completed"
    );
  });

const profileHasCard =
  Boolean(String(profile?.cardId || "").trim());

const existingCard =
  typeof data?.hasExistingCard === "boolean"
    ? data.hasExistingCard
    : profileHasCard || hasCompletedApplication;

const firstCardAllowed =
  typeof data?.canApplyFirstCard === "boolean"
    ? data.canApplyFirstCard
    : !existingCard && !currentApplication;

const replacementAllowed =
  typeof data?.canApplyReplacement === "boolean"
    ? data.canApplyReplacement
    : existingCard && !currentApplication;

      setHasExistingCard(existingCard);
      setCanApplyFirstCard(firstCardAllowed);
      setCanApplyReplacement(replacementAllowed);
      setApplicationType(
        existingCard ? "Replacement Card" : "First Card"
      );
      setActiveApplication(currentApplication);
      setApplications(applicationList);

      if (!replacementAllowed || currentApplication) {
        setReplacementFormOpen(false);
      }
    } catch (error: any) {
      console.error(
        "Failed to load physical card application:",
        error
      );

      setLoadError(
        error?.message ||
          "Unable to load physical card information."
      );
      setApplications([]);
      setActiveApplication(null);
    } finally {
      setLoading(false);
    }
  }

  function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",")
        ? result.split(",")[1]
        : result;

      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("Unable to read image"));
    };

    reader.readAsDataURL(file);
  });
}

async function handleReceiptUpload(file: File) {
  if (!activeApplication) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Please upload an image receipt.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Receipt image must not exceed 5MB.");
    return;
  }

  try {
    setUploadingReceipt(true);

    const base64 = await fileToBase64(file);

    await uploadCardReplacementReceipt({
      memberId,
      applicationId:
        activeApplication.applicationId,
      fileName: file.name,
      mimeType: file.type,
      base64,
    });

    alert("Payment receipt submitted successfully.");

    await loadApplication();
  } catch (error: any) {
    alert(
      error?.message ||
        "Unable to upload payment receipt."
    );
  } finally {
    setUploadingReceipt(false);
  }
}

  function resetDeliveryForm() {
    setAddress("");
    setState("");
    setArea("");
    setPostcode("");
    setDeliveryNote("");
    setLossReason("");
    setFreezeOldCard(false);
  }

  async function handleSubmit() {
    if (submitting || activeApplication) {
      return;
    }

    const payload = {
      memberId,
      applicationType,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),
      state: state.trim(),
      area: area.trim(),
      postcode: postcode.trim(),
      deliveryNote: deliveryNote.trim(),
      freezeOldCard,
      lossReason: lossReason.trim(),
    };

    if (!payload.memberId) {
      alert("Member ID missing. Please login again.");
      return;
    }

    if (!payload.fullName) {
      alert("Please enter your full name.");
      return;
    }

    if (!payload.phone) {
      alert("Please enter your phone number.");
      return;
    }

    if (!payload.email) {
      alert("Please enter your email.");
      return;
    }

    if (!isValidEmail(payload.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!payload.address) {
      alert("Please enter your delivery address.");
      return;
    }

    if (!payload.state) {
      alert("Please select your state.");
      return;
    }

    if (!payload.area) {
      alert("Please select your area.");
      return;
    }

    if (!/^\d{5}$/.test(payload.postcode)) {
      alert("Please enter a valid 5-digit postcode.");
      return;
    }

    if (payload.deliveryNote.length > 500) {
      alert("Delivery note must not exceed 500 characters.");
      return;
    }

    if (applicationType === "Replacement Card") {
      if (!payload.lossReason) {
        alert("Please explain why you need a replacement card.");
        return;
      }

      if (!payload.freezeOldCard) {
        alert("Please confirm that the old card should be frozen.");
        return;
      }

      const confirmed = window.confirm(
        "The replacement fee is RM8 and your old card will be frozen immediately. Continue?"
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setSubmitting(true);

      await submitMemberCardApplication(payload as any);

      alert(
        applicationType === "Replacement Card"
          ? "Replacement card application submitted. RM8 payment is required."
          : "Physical card application submitted successfully."
      );

      resetDeliveryForm();
      setReplacementFormOpen(false);
      await loadApplication();
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to submit physical card application."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!activeApplication || cancelling) {
      return;
    }

    const isReplacement =
      activeApplication.applicationType === "Replacement Card";

    const confirmed = window.confirm(
      isReplacement
        ? "Cancel this replacement application? Your old card will be restored to Active if it was frozen."
        : "Cancel this physical card application?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);

      await cancelMemberCardApplication({
        memberId,
        applicationId: activeApplication.applicationId,
      });

      alert("Application cancelled successfully.");
      await loadApplication();
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to cancel application."
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <MemberLayout>
        <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f7fb] px-4">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-950" />

            <p className="mt-4 text-sm font-black text-slate-500">
              Loading Card Application...
            </p>
          </div>
        </main>
      </MemberLayout>
    );
  }

  if (sessionMissing) {
    return (
      <MemberLayout>
        <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f7fb] px-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-sm">
            <p className="text-4xl">🔒</p>

            <h1 className="mt-4 text-2xl font-black text-slate-950">
              Login Required
            </h1>

            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              Please login to manage your physical card application.
            </p>

            <Link
              href="/login"
              className="mt-6 block rounded-2xl bg-slate-950 py-4 text-sm font-black text-white no-underline"
            >
              Member Login
            </Link>
          </div>
        </main>
      </MemberLayout>
    );
  }

  const canShowFirstCardForm =
    !activeApplication &&
    canApplyFirstCard &&
    !hasExistingCard;

  const canShowReplacementForm =
    !activeApplication &&
    canApplyReplacement &&
    hasExistingCard &&
    replacementFormOpen;

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-6xl">
          <Link
            href="/member/dashboard"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm sm:px-5 sm:py-3 sm:text-sm"
          >
            ← Back to Dashboard
          </Link>

          <section className="relative mt-5 overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:mt-6 sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs">
                RewardHub Physical Card
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
                Physical Membership Card
              </h1>

              <p className="mt-2 max-w-2xl text-[11px] font-bold leading-5 text-slate-400 sm:text-sm">
                Your first card is free. A lost, stolen or damaged card can be
                replaced for RM8 after the old card is frozen.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
                <HeroStat
                  title="Current Status"
                  value={
                    activeApplication?.status ||
                    profileCardStatus ||
                    (hasExistingCard
                      ? "Card Issued"
                      : "Not Applied")
                  }
                />

                <HeroStat
                  title="Member ID"
                  value={memberId || "-"}
                />
              </div>
            </div>
          </section>

          {loadError && (
            <section className="mt-5 rounded-[1.5rem] border border-red-100 bg-red-50 p-4 sm:mt-6 sm:rounded-[2rem] sm:p-5">
              <p className="text-sm font-black text-red-700">
                Unable to load card information
              </p>

              <p className="mt-1 text-xs font-bold leading-5 text-red-600">
                {loadError}
              </p>

              <button
                type="button"
                onClick={() => void loadApplication()}
                className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-xs font-black text-white"
              >
                Try Again
              </button>
            </section>
          )}

          {!loadError && activeApplication && (
            <ActiveApplicationCard
  application={activeApplication}
  cancelling={cancelling}
  uploadingReceipt={uploadingReceipt}
  onCancel={handleCancel}
  onReceiptUpload={handleReceiptUpload}
/>
          )}

          {!loadError && canShowFirstCardForm && (
            <ApplicationForm
              hasExistingCard={false}
              profileCardId={profileCardId}
              fullName={fullName}
              setFullName={setFullName}
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
              address={address}
              setAddress={setAddress}
              state={state}
              setState={(value) => {
                setState(value);
                setArea("");
              }}
              area={area}
              setArea={setArea}
              postcode={postcode}
              setPostcode={setPostcode}
              deliveryNote={deliveryNote}
              setDeliveryNote={setDeliveryNote}
              lossReason={lossReason}
              setLossReason={setLossReason}
              freezeOldCard={freezeOldCard}
              setFreezeOldCard={setFreezeOldCard}
              availableAreas={availableAreas}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          )}

          {!loadError &&
            hasExistingCard &&
            canApplyReplacement &&
            !activeApplication &&
            !replacementFormOpen && (
              <IssuedCardPanel
                cardId={profileCardId}
                cardStatus={profileCardStatus}
                onApplyReplacement={() => {
                  setApplicationType("Replacement Card");
                  setReplacementFormOpen(true);
                }}
              />
            )}

          {!loadError && canShowReplacementForm && (
            <>
              <ApplicationForm
                hasExistingCard
                profileCardId={profileCardId}
                fullName={fullName}
                setFullName={setFullName}
                phone={phone}
                setPhone={setPhone}
                email={email}
                setEmail={setEmail}
                address={address}
                setAddress={setAddress}
                state={state}
                setState={(value) => {
                  setState(value);
                  setArea("");
                }}
                area={area}
                setArea={setArea}
                postcode={postcode}
                setPostcode={setPostcode}
                deliveryNote={deliveryNote}
                setDeliveryNote={setDeliveryNote}
                lossReason={lossReason}
                setLossReason={setLossReason}
                freezeOldCard={freezeOldCard}
                setFreezeOldCard={setFreezeOldCard}
                availableAreas={availableAreas}
                submitting={submitting}
                onSubmit={handleSubmit}
              />

              <button
                type="button"
                onClick={() => {
                  resetDeliveryForm();
                  setReplacementFormOpen(false);
                }}
                className="mt-3 w-full rounded-2xl bg-white py-4 text-sm font-black text-slate-600 shadow-sm"
              >
                Close Replacement Form
              </button>
            </>
          )}

          {!loadError &&
            !activeApplication &&
            !canApplyFirstCard &&
            !canApplyReplacement && (
              <section className="mt-5 rounded-[1.75rem] bg-white p-8 text-center shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-10">
                <p className="text-4xl">💳</p>

                <h2 className="mt-4 text-2xl font-black text-slate-950">
                  Card Application Unavailable
                </h2>

                <p className="mt-2 text-sm font-bold text-slate-500">
                  Please contact RewardHub support for assistance.
                </p>
              </section>
            )}

          <ApplicationHistory applications={historyApplications} />
        </section>
      </main>
    </MemberLayout>
  );
}

function ApplicationForm({
  hasExistingCard,
  profileCardId,
  fullName,
  setFullName,
  phone,
  setPhone,
  email,
  setEmail,
  address,
  setAddress,
  state,
  setState,
  area,
  setArea,
  postcode,
  setPostcode,
  deliveryNote,
  setDeliveryNote,
  lossReason,
  setLossReason,
  freezeOldCard,
  setFreezeOldCard,
  availableAreas,
  submitting,
  onSubmit,
}: {
  hasExistingCard: boolean;
  profileCardId: string;
  fullName: string;
  setFullName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  state: string;
  setState: (value: string) => void;
  area: string;
  setArea: (value: string) => void;
  postcode: string;
  setPostcode: (value: string) => void;
  deliveryNote: string;
  setDeliveryNote: (value: string) => void;
  lossReason: string;
  setLossReason: (value: string) => void;
  freezeOldCard: boolean;
  setFreezeOldCard: (value: boolean) => void;
  availableAreas: string[];
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
            {hasExistingCard
              ? "Replacement Card Application"
              : "First Card Application"}
          </h2>

          <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
            {hasExistingCard
              ? "Replacement cards cost RM8."
              : "Your first physical card is free."}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-4 py-2 text-xs font-black ${
            hasExistingCard
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {hasExistingCard ? "RM8" : "FREE"}
        </span>
      </div>

      {hasExistingCard && (
        <div className="mt-5 rounded-[1.5rem] border border-red-100 bg-red-50 p-4 sm:rounded-[2rem] sm:p-5">
          <p className="text-xs font-black text-red-700 sm:text-sm">
            Old Card Freeze Required
          </p>

          <p className="mt-1 text-[11px] font-bold leading-5 text-red-700/80 sm:text-sm">
            Old Card ID: {profileCardId || "Not available"}. The old card will
            be frozen immediately after submission.
          </p>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="mt-5 space-y-4 sm:mt-6"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <FieldCard label="Full Name">
            <input
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              className={fieldClass}
              placeholder="Full name"
              autoComplete="name"
            />
          </FieldCard>

          <FieldCard label="Phone">
            <input
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              className={fieldClass}
              placeholder="60123456789"
              inputMode="tel"
              autoComplete="tel"
            />
          </FieldCard>
        </div>

        <FieldCard label="Email">
          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            className={fieldClass}
            placeholder="Email address"
            autoComplete="email"
          />
        </FieldCard>

        {hasExistingCard && (
          <>
            <FieldCard label="Reason for Replacement">
              <textarea
                rows={3}
                value={lossReason}
                maxLength={500}
                onChange={(event) =>
                  setLossReason(event.target.value)
                }
                className={`${fieldClass} resize-none`}
                placeholder="Example: Card lost, stolen or damaged"
              />

              <p className="mt-2 text-right text-[10px] font-bold text-slate-400">
                {lossReason.length} / 500
              </p>
            </FieldCard>

            <label className="flex cursor-pointer items-start gap-3 rounded-[1.5rem] border border-red-100 bg-red-50 p-4 sm:rounded-[2rem] sm:p-5">
              <input
                type="checkbox"
                checked={freezeOldCard}
                onChange={(event) =>
                  setFreezeOldCard(event.target.checked)
                }
                className="mt-1 h-5 w-5 shrink-0"
              />

              <span>
                <span className="block text-xs font-black text-red-700 sm:text-sm">
                  Freeze my old card
                </span>

                <span className="mt-1 block text-[11px] font-bold leading-5 text-red-700/80 sm:text-sm">
                  I understand that the old card will stop working when this
                  replacement request is submitted.
                </span>
              </span>
            </label>
          </>
        )}

        <FieldCard label="Full Delivery Address">
          <textarea
            rows={4}
            value={address}
            onChange={(event) =>
              setAddress(event.target.value)
            }
            className={`${fieldClass} resize-none`}
            placeholder="House / unit number, street name and building details"
            autoComplete="street-address"
          />
        </FieldCard>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <FieldCard label="State">
            <select
              value={state}
              onChange={(event) =>
                setState(event.target.value)
              }
              className={fieldClass}
            >
              <option value="">Select State</option>

              {Object.keys(malaysiaAreas).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FieldCard>

          <FieldCard label="Area">
            <select
              value={area}
              onChange={(event) =>
                setArea(event.target.value)
              }
              disabled={!state}
              className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            >
              <option value="">
                {state
                  ? "Select Area"
                  : "Select State First"}
              </option>

              {availableAreas.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FieldCard>
        </div>

        <FieldCard label="Postcode">
          <input
            value={postcode}
            onChange={(event) =>
              setPostcode(
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 5)
              )
            }
            className={fieldClass}
            placeholder="Example: 84000"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
          />
        </FieldCard>

        <FieldCard label="Delivery Note">
          <textarea
            rows={3}
            maxLength={500}
            value={deliveryNote}
            onChange={(event) =>
              setDeliveryNote(event.target.value)
            }
            className={`${fieldClass} resize-none`}
            placeholder="Example: Leave with guard, call before delivery..."
          />

          <p className="mt-2 text-right text-[10px] font-bold text-slate-400">
            {deliveryNote.length} / 500
          </p>
        </FieldCard>

        <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-4 sm:rounded-[2rem] sm:p-5">
          <p className="text-xs font-black text-amber-900">
            Before submitting
          </p>

          <p className="mt-1 text-[11px] font-bold leading-5 text-amber-800 sm:text-sm">
            Check your recipient name, phone number, full address and postcode.
            Only one active card application is allowed at a time.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl sm:py-5"
        >
          {submitting
            ? "Submitting Application..."
            : hasExistingCard
              ? "Submit Replacement Application — RM8"
              : "Submit Free First Card Application"}
        </button>
      </form>
    </section>
  );
}

function IssuedCardPanel({
  cardId,
  cardStatus,
  onApplyReplacement,
}: {
  cardId: string;
  cardStatus: string;
  onApplyReplacement: () => void;
}) {
  return (
    <section className="mt-5 rounded-[1.75rem] bg-white p-6 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
            Physical Card Issued
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Your card is ready to use
          </h2>

          <p className="mt-2 text-sm font-bold text-slate-500">
            Card ID: {cardId || "Not available"} • Status:{" "}
            {cardStatus || "Active"}
          </p>
        </div>

        <button
          type="button"
          onClick={onApplyReplacement}
          className="rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white"
        >
          Report Lost / Replace Card
        </button>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-amber-100 bg-amber-50 p-4">
        <p className="text-xs font-black text-amber-900">
          Replacement policy
        </p>

        <p className="mt-1 text-[11px] font-bold leading-5 text-amber-800 sm:text-sm">
          A replacement card costs RM8. The old card must be frozen before a
          new card can be issued.
        </p>
      </div>
    </section>
  );
}

function ActiveApplicationCard({
  application,
  cancelling,
  uploadingReceipt,
  onCancel,
  onReceiptUpload,
}: {
  application: CardApplication;
  cancelling: boolean;
  uploadingReceipt: boolean;
  onCancel: () => void;
  onReceiptUpload: (file: File) => void;
}) {
  const normalizedStatus = normalizeStatus(application.status);
  const isReplacement =
    application.applicationType === "Replacement Card";

  const steps = isReplacement
    ? [
        "Pending Payment",
        "Pending",
        "Approved",
        "Shipped",
        "Completed",
      ]
    : ["Pending", "Approved", "Shipped", "Completed"];

  const currentIndex = steps.findIndex(
    (step) =>
      normalizeStatus(step) === normalizedStatus
  );

  const isCancelledOrRejected =
    normalizedStatus === "cancelled" ||
    normalizedStatus === "rejected";

  return (
    <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
            Current Application
          </h2>

          <p className="mt-1 break-all text-[11px] font-bold text-slate-500 sm:text-sm">
            {application.applicationType || "First Card"} •{" "}
            {application.applicationId}
          </p>
        </div>

        <StatusBadge status={application.status} />
      </div>

      {isReplacement && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <InfoCard
              label="Replacement Fee"
              value={`RM${Number(
                application.replacementFee || 8
              ).toFixed(2)}`}
              highlight
            />

            <InfoCard
              label="Payment Status"
              value={
                application.paymentStatus ||
                "Pending Payment"
              }
              highlight
            />
          </div>

          {normalizedStatus === "pending payment" && (
            <ReplacementPaymentCard
              application={application}
              uploading={uploadingReceipt}
              onUpload={onReceiptUpload}
            />
          )}
        </>
      )}

      {!isCancelledOrRejected && (
        <div
          className={`mt-6 grid gap-2 sm:gap-4 ${
            steps.length === 5
              ? "grid-cols-5"
              : "grid-cols-4"
          }`}
        >
          {steps.map((step, index) => {
            const reached =
              currentIndex >= 0 &&
              currentIndex >= index;

            return (
              <div key={step} className="min-w-0 text-center">
                <div
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black sm:h-11 sm:w-11 sm:text-xs ${
                    reached
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {reached ? "✓" : index + 1}
                </div>

                <p
                  className={`mt-2 truncate text-[7px] font-black sm:text-xs ${
                    reached
                      ? "text-slate-950"
                      : "text-slate-400"
                  }`}
                >
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <InfoCard
          label="Recipient"
          value={application.fullName}
        />

        <InfoCard
          label="Phone"
          value={application.phone}
        />

        <InfoCard
          label="State / Area"
          value={
            [application.area, application.state]
              .filter(Boolean)
              .join(", ") || "-"
          }
        />

        <InfoCard
          label="Postcode"
          value={application.postcode}
        />

        <div className="sm:col-span-2">
          <InfoCard
            label="Delivery Address"
            value={application.address}
          />
        </div>

        {application.deliveryNote && (
          <div className="sm:col-span-2">
            <InfoCard
              label="Delivery Note"
              value={application.deliveryNote}
            />
          </div>
        )}

        {application.lossReason && (
          <div className="sm:col-span-2">
            <InfoCard
              label="Replacement Reason"
              value={application.lossReason}
            />
          </div>
        )}

        {application.trackingNo && (
          <div className="sm:col-span-2">
            <InfoCard
              label="Tracking Number"
              value={application.trackingNo}
              highlight
            />
          </div>
        )}

        {application.adminNote && (
          <div className="sm:col-span-2">
            <InfoCard
              label="Admin Note"
              value={application.adminNote}
            />
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase text-slate-400">
          Submitted At
        </p>

        <p className="mt-2 text-xs font-black text-slate-950 sm:text-sm">
          {formatDate(application.createdAt)}
        </p>
      </div>

      {(normalizedStatus === "pending" ||
        normalizedStatus === "pending payment") && (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          className="mt-5 w-full rounded-xl bg-red-50 py-4 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl sm:text-sm"
        >
          {cancelling
            ? "Cancelling..."
            : "Cancel Application"}
        </button>
      )}
    </section>
  );
}

function ApplicationHistory({
  applications,
}: {
  applications: CardApplication[];
}) {
  return (
    <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
      <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
        Application History
      </h2>

      <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
        Previous applications are listed here. The current active application
        is shown above and is not repeated.
      </p>

      {applications.length > 0 ? (
        <div className="mt-5 space-y-3 sm:mt-6">
          {applications.map((application) => (
            <article
              key={application.applicationId}
              className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 sm:rounded-[2rem] sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="break-all text-xs font-black text-slate-950 sm:text-sm">
                    {application.applicationId}
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    {application.applicationType || "First Card"} •{" "}
                    {formatDate(application.createdAt)}
                  </p>
                </div>

                <StatusBadge status={application.status} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCard
                  label="Area"
                  value={
                    [application.area, application.state]
                      .filter(Boolean)
                      .join(", ") || "-"
                  }
                />

                <InfoCard
                  label="Postcode"
                  value={application.postcode}
                />
              </div>

              {application.applicationType === "Replacement Card" && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <InfoCard
                    label="Fee"
                    value={`RM${Number(
                      application.replacementFee || 8
                    ).toFixed(2)}`}
                    highlight
                  />

                  <InfoCard
                    label="Payment"
                    value={
                      application.paymentStatus ||
                      "Pending Payment"
                    }
                    highlight
                  />
                </div>
              )}

              {application.trackingNo && (
                <div className="mt-3">
                  <InfoCard
                    label="Tracking Number"
                    value={application.trackingNo}
                    highlight
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-8 text-center sm:rounded-[2rem]">
          <p className="text-3xl">💳</p>

          <h3 className="mt-3 text-xl font-black text-slate-950">
            No previous applications
          </h3>

          <p className="mt-2 text-xs font-bold text-slate-500 sm:text-sm">
            Completed, cancelled or rejected applications will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

const fieldClass =
  "mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-bold text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm";

function FieldCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[1.5rem] bg-slate-50 p-3 sm:rounded-[2rem] sm:p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
        {label}
      </p>

      {children}
    </div>
  );
}

function HeroStat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[1.25rem] bg-white/10 p-4 sm:rounded-[2rem] sm:p-6">
      <p className="text-[10px] font-black text-slate-300 sm:text-sm">
        {title}
      </p>

      <p className="mt-2 break-words text-base font-black text-white sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number | null | undefined;
  highlight?: boolean;
}) {
  const displayValue =
    value === null ||
    value === undefined ||
    String(value).trim() === ""
      ? "-"
      : String(value);

  return (
    <div
      className={`min-w-0 rounded-2xl p-4 ${
        highlight
          ? "bg-emerald-50"
          : "bg-white"
      }`}
    >
      <p
        className={`text-[9px] font-black uppercase sm:text-xs ${
          highlight
            ? "text-emerald-700"
            : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-2 break-words text-xs font-black sm:text-sm ${
          highlight
            ? "text-emerald-950"
            : "text-slate-950"
        }`}
      >
        {displayValue}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const value = normalizeStatus(status);

  const style =
    value === "pending payment"
      ? "bg-orange-100 text-orange-700"
      : value === "approved"
        ? "bg-blue-100 text-blue-700"
        : value === "shipped"
          ? "bg-violet-100 text-violet-700"
          : value === "completed"
            ? "bg-emerald-100 text-emerald-700"
            : value === "rejected"
              ? "bg-red-100 text-red-700"
              : value === "cancelled"
                ? "bg-slate-200 text-slate-600"
                : "bg-amber-100 text-amber-700";

  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-black sm:px-4 sm:py-2 sm:text-xs ${style}`}
    >
      {status || "Pending"}
    </span>
  );
}

function normalizeStatus(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function ReplacementPaymentCard({
  application,
  uploading,
  onUpload,
}: {
  application: CardApplication;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const paymentStatus = normalizeStatus(
    application.paymentStatus
  );

  const submitted =
    paymentStatus === "submitted" ||
    paymentStatus === "paid";

  return (
    <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-amber-200 bg-amber-50 sm:rounded-[2rem]">
      <div className="bg-slate-950 p-5 text-white sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 sm:text-xs">
          Replacement Card Payment
        </p>

        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-400">
              Amount Payable
            </p>

            <p className="mt-1 text-4xl font-black">
              RM{replacementPayment.amount.toFixed(2)}
            </p>
          </div>

          <StatusBadge
            status={
              application.paymentStatus ||
              "Pending Payment"
            }
          />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <PaymentInfo
              label="Bank Name"
              value={replacementPayment.bankName}
            />

            <PaymentInfo
              label="Account Name"
              value={replacementPayment.accountName}
            />

            <PaymentInfo
              label="Account Number"
              value={replacementPayment.accountNumber}
            />

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    replacementPayment.accountNumber
                  );

                  alert("Bank account copied.");
                } catch {
                  alert(
                    "Please copy manually:\n" +
                    replacementPayment.accountNumber
                  );
                }
              }}
              className="w-full rounded-xl bg-white py-3 text-xs font-black text-slate-950 shadow-sm"
            >
              Copy Bank Account
            </button>
          </div>

          <div className="rounded-[1.5rem] bg-white p-4 text-center">
            <p className="text-xs font-black text-slate-950">
              Scan to Pay
            </p>

            <img
              src={replacementPayment.qrImageUrl}
              alt="RewardHub payment QR"
              className="mx-auto mt-3 aspect-square w-full max-w-[220px] object-contain"
            />
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] bg-white p-4">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl">
                ✓
              </div>

              <p className="mt-3 text-sm font-black text-emerald-700">
                Payment Receipt Submitted
              </p>

              <p className="mt-1 text-xs font-bold text-slate-500">
                RewardHub will verify your RM8 payment.
              </p>

              {application.paymentReceiptUrl && (
                <a
                  href={application.paymentReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-xs font-black text-slate-950"
                >
                  View Submitted Receipt
                </a>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm font-black text-slate-950">
                Upload Payment Receipt
              </p>

              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                Pay RM8 using the bank details above, then upload your receipt.
              </p>

              <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white">
                {uploading
                  ? "Uploading Receipt..."
                  : "Choose Receipt Image"}

                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="hidden"
                  onChange={(event) => {
                    const file =
                      event.target.files?.[0];

                    if (file) {
                      onUpload(file);
                    }

                    event.target.value = "";
                  }}
                />
              </label>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function PaymentInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}