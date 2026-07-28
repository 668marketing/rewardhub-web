"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemberLayout from "@/components/layout/MemberLayout";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { getMemberDashboard } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

export default function PayPage() {
  const { t } = useLanguage();
  const [member, setMember] = useState<any>(null);
  const [memberQrValue, setMemberQrValue] = useState("");

  useEffect(() => {
    async function load() {
      const storedMember = JSON.parse(localStorage.getItem("member") || "{}");
      const memberId = storedMember?.memberId || storedMember?.MEMBER_ID || "";

      function updateMemberQr(memberData: any) {
        const latestMemberId = memberData?.memberId || memberData?.MEMBER_ID || memberId || "";
        const latestCardId =
          memberData?.cardId ||
          memberData?.CARD_ID ||
          memberData?.memberCardId ||
          memberData?.MEMBER_CARD_ID ||
          "";

        if (!latestCardId) {
          setMemberQrValue("");
          return;
        }

        setMemberQrValue(
          JSON.stringify({
            type: "member_card",
            app: "RewardHub",
            cardId: latestCardId,
            memberId: latestMemberId,
          })
        );
      }

      if (!memberId) {
        setMember(storedMember);
        updateMemberQr(storedMember);
        return;
      }

      try {
        const res = await getMemberDashboard({ memberId });
        const data = res?.data?.data || res?.data || res?.result || res;
        const freshMember = {
          ...storedMember,
          ...(data?.profile || {}),
          ...(data?.wallet || {}),
        };

        setMember(freshMember);
        localStorage.setItem("member", JSON.stringify(freshMember));
        updateMemberQr(freshMember);
      } catch (err) {
        console.error("Failed to refresh member pay data:", err);
        setMember(storedMember);
        updateMemberQr(storedMember);
      }
    }

    load();
  }, []);

  const memberId = member?.memberId || member?.MEMBER_ID || "-";
  const cardId =
    member?.cardId ||
    member?.CARD_ID ||
    member?.memberCardId ||
    member?.MEMBER_CARD_ID ||
    "-";

  const memberName =
    member?.fullName ||
    member?.displayName ||
    member?.name ||
    member?.FULL_NAME ||
    member?.DISPLAY_NAME ||
    t("memberPay.fallbackMember");

  const memberTier = member?.tier || member?.memberTier || member?.MEMBER_TIER || "Silver";
  const localizedTier = getTierLabel(String(memberTier), t);
  const rewardCredits = Number(member?.rewardCredits || member?.rewardCreditBalance || 0);
  const points = Number(member?.points || member?.pointsBalance || 0);
  const cashbackSaved = Number(member?.cashbackSaved || member?.totalCashback || 0);

  const tierKey =
    String(memberTier).toLowerCase() === "platinum"
      ? "memberPay.marketingBudget30"
      : String(memberTier).toLowerCase() === "gold"
      ? "memberPay.marketingBudget20"
      : "memberPay.marketingBudget10";

  const cashbackRate = t(tierKey);

  async function downloadPremiumCard() {
    if (!memberQrValue) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const logo = await loadImage("/rewardhub-logo.png");
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, "#020617");
    bg.addColorStop(0.5, "#030712");
    bg.addColorStop(1, "#3b2500");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.save();
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 30;
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 5;
    roundRect(ctx, 55, 55, 970, 1810, 60);
    ctx.stroke();
    ctx.restore();

    ctx.drawImage(logo, 335, 120, 410, 150);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 34px Arial";
    ctx.fillText(t("memberPay.cardTitle").toUpperCase(), 540, 335);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 82px Arial";
    ctx.fillText(t("memberPay.scanToPay"), 540, 440);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 30px Arial";
    ctx.fillText(t("memberPay.cardInstruction"), 540, 515);

    const qrDataUrl = await QRCode.toDataURL(memberQrValue, {
      width: 760,
      margin: 1,
      errorCorrectionLevel: "H",
    });
    const qrImg = await loadImage(qrDataUrl);

    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 160, 600, 760, 760, 42);
    ctx.fill();
    ctx.drawImage(qrImg, 185, 625, 710, 710);

    ctx.fillStyle = "#020617";
    roundRect(ctx, 465, 895, 150, 150, 24);
    ctx.fill();
    ctx.drawImage(logo, 480, 910, 120, 120);

    drawInfo(ctx, 145, 1440, "🪪", t("memberPay.memberId"), String(memberId));
    drawInfo(ctx, 145, 1520, "👤", t("memberPay.memberName"), String(memberName));
    drawInfo(ctx, 145, 1600, "👑", t("memberPay.memberTier"), String(localizedTier));

    const gold = ctx.createLinearGradient(145, 1740, 935, 1835);
    gold.addColorStop(0, "#f59e0b");
    gold.addColorStop(0.5, "#fde047");
    gold.addColorStop(1, "#f59e0b");
    ctx.fillStyle = gold;
    roundRect(ctx, 145, 1740, 790, 95, 28);
    ctx.fill();

    ctx.fillStyle = "#020617";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(t("memberPay.secureFastRewarding"), 540, 1787);

    const link = document.createElement("a");
    link.download = `rewardhub-${cardId}-pay-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-6xl">
          <Link
            href="/member/dashboard"
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 no-underline shadow-sm"
          >
            ← {t("memberPay.backToDashboard")}
          </Link>

          <div className="mt-5 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:mt-6 sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">
                  {t("memberPay.rewardHubPay")}
                </p>
                <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
                  {t("memberPay.scanToPay")}
                </h1>
                <p className="mt-3 max-w-xl text-sm font-bold text-slate-400">
                  {t("memberPay.scanDescription")}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-5 py-4">
                <p className="text-xs font-black text-slate-400">{t("memberPay.currentTier")}</p>
                <p className="mt-1 text-xl font-black text-amber-300">{localizedTier}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center rounded-[2rem] bg-white p-4">
              {memberQrValue ? (
                <QRCodeSVG
                  value={memberQrValue}
                  size={240}
                  level="H"
                  includeMargin
                  imageSettings={{
                    src: "/rewardhub-logo.png",
                    height: 54,
                    width: 54,
                    excavate: true,
                  }}
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center rounded-[1.5rem] bg-slate-50 px-6 text-center font-bold text-slate-500">
                  {t("memberPay.cardIdNotFound")}
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniInfo title={t("memberPay.memberId")} value={memberId} />
              <MiniInfo title={t("memberPay.rewardCredits")} value={`RM${money(rewardCredits)}`} />
              <MiniInfo title={t("memberPay.points")} value={t("memberPay.pointsValue", { points })} />
            </div>

            <button
              type="button"
              onClick={downloadPremiumCard}
              disabled={!memberQrValue}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-300 py-3 text-sm font-black text-slate-950 shadow-xl disabled:cursor-not-allowed disabled:opacity-40 sm:py-4"
            >
              ⬇ {t("memberPay.downloadPremiumCard")}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 lg:grid-cols-2 lg:gap-6">
            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5 lg:rounded-[2.5rem] lg:p-6">
              <h2 className="text-2xl font-black text-slate-950">{t("memberPay.paymentProfile")}</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                {t("memberPay.paymentProfileDescription")}
              </p>
              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <InfoCard title={t("memberPay.memberName")} value={memberName} />
                <InfoCard title={t("memberPay.memberId")} value={memberId} />
                <InfoCard title={t("memberPay.cardId")} value={cardId} />
                <InfoCard title={t("memberPay.currentTier")} value={localizedTier} />
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5 lg:rounded-[2.5rem] lg:p-6">
              <h2 className="text-2xl font-black text-slate-950">{t("memberPay.availableBenefits")}</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                {t("memberPay.availableBenefitsDescription")}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                <BenefitCard
                  title={t("memberPay.rewardCredits")}
                  value={`RM${money(rewardCredits)}`}
                  desc={t("memberPay.rewardCreditsDescription")}
                  dark
                />
                <BenefitCard
                  title={t("memberPay.points")}
                  value={t("memberPay.pointsValue", { points })}
                  desc={t("memberPay.pointsDescription")}
                />
                <BenefitCard
                  title={t("memberPay.cashbackSaved")}
                  value={`RM${money(cashbackSaved)}`}
                  desc={t("memberPay.cashbackSavedDescription")}
                />
                <BenefitCard
                  title={t("memberPay.cashbackRate")}
                  value={cashbackRate}
                  desc={t("memberPay.cashbackRateDescription")}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem]">
            <h2 className="text-2xl font-black text-slate-950">{t("memberPay.howItWorks")}</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <StepCard step="01" title={t("memberPay.stepShowQr")} desc={t("memberPay.stepShowQrDescription")} />
              <StepCard step="02" title={t("memberPay.stepMerchantScans")} desc={t("memberPay.stepMerchantScansDescription")} />
              <StepCard step="03" title={t("memberPay.stepPayLess")} desc={t("memberPay.stepPayLessDescription")} />
            </div>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

function MiniInfo({ title, value }: { title: string; value: any }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/10 p-3 sm:rounded-2xl sm:p-4">
      <p className="truncate text-[11px] font-black text-slate-300 sm:text-xs">{title}</p>
      <p className="mt-1 break-words text-xs font-black leading-tight text-white sm:text-lg">{value}</p>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">{title}</p>
      <p className="mt-2 break-all text-sm font-black text-slate-950 sm:text-lg">{value || "-"}</p>
    </div>
  );
}

function BenefitCard({
  title,
  value,
  desc,
  dark = false,
}: {
  title: string;
  value: string;
  desc: string;
  dark?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 sm:rounded-2xl sm:p-5 ${dark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-950"}`}>
      <p className={`text-xs font-black uppercase tracking-[0.15em] ${dark ? "text-amber-300" : "text-slate-400"}`}>
        {title}
      </p>
      <p className={`mt-2 break-words text-base font-black sm:text-lg ${dark ? "text-white" : "text-slate-950"}`}>
        {value}
      </p>
      <p className={`mt-2 text-sm font-bold leading-6 ${dark ? "text-slate-300" : "text-slate-500"}`}>
        {desc}
      </p>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm font-black text-amber-600">{step}</p>
      <h3 className="mt-2 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm font-bold text-slate-500">{desc}</p>
    </div>
  );
}

function getTierLabel(
  tier: string,
  t: (key: string, values?: Record<string, string | number>) => string
) {
  const normalized = tier.toLowerCase();
  if (normalized === "platinum") return t("memberPay.platinum");
  if (normalized === "gold") return t("memberPay.gold");
  if (normalized === "silver") return t("memberPay.silver");
  return tier;
}

function drawInfo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  icon: string,
  label: string,
  value: string
) {
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, x, y - 38, 790, 68, 18);
  ctx.fill();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#facc15";
  ctx.font = "bold 28px Arial";
  ctx.fillText(icon, x + 28, y - 3);
  ctx.fillStyle = "#ffffff";
  ctx.font = "26px Arial";
  ctx.fillText(label, x + 85, y - 3);
  ctx.textAlign = "right";
  ctx.font = "bold 29px Arial";
  ctx.fillText(value || "-", x + 755, y - 3);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function money(value: any) {
  return Number(value || 0).toFixed(2);
}
