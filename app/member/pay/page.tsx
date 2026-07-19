"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemberLayout from "@/components/layout/MemberLayout";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { getMemberDashboard } from "@/lib/api";

export default function PayPage() {
  const [member, setMember] = useState<any>(null);
  const [memberQrValue, setMemberQrValue] = useState("");

  useEffect(() => {
  async function load() {
    const storedMember = JSON.parse(localStorage.getItem("member") || "{}");
    const memberId = storedMember?.memberId || storedMember?.MEMBER_ID || "";

    if (!memberId) {
      setMember(storedMember);
      return;
    }

    try {
      const res = await getMemberDashboard({ memberId });

      const data =
        res?.data?.data ||
        res?.data ||
        res?.result ||
        res;

      const freshMember = {
        ...storedMember,
        ...data.profile,
        ...data.wallet,
      };

      setMember(freshMember);
      localStorage.setItem("member", JSON.stringify(freshMember));

      const cardId =
        freshMember?.cardId ||
        freshMember?.CARD_ID ||
        freshMember?.memberCardId ||
        freshMember?.MEMBER_CARD_ID ||
        "";

      if (cardId) {
        setMemberQrValue(
          JSON.stringify({
            type: "member_card",
            app: "RewardHub",
            cardId,
            memberId,
          })
        );
      }
    } catch (err) {
      console.error("Failed to refresh member pay data:", err);
      setMember(storedMember);
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
    "RewardHub Member";

  const memberTier =
    member?.tier || member?.memberTier || member?.MEMBER_TIER || "Silver";

  const rewardCredits = Number(
    member?.rewardCredits || member?.rewardCreditBalance || 0
  );

  const points = Number(member?.points || member?.pointsBalance || 0);

  const cashbackSaved = Number(
    member?.cashbackSaved || member?.totalCashback || 0
  );

  const cashbackRate =
    String(memberTier).toLowerCase() === "platinum"
      ? "Marketing Budget × 30%"
      : String(memberTier).toLowerCase() === "gold"
      ? "Marketing Budget × 20%"
      : "Marketing Budget × 10%";

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
    ctx.fillText("REWARDHUB MEMBER PAY", 540, 335);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 82px Arial";
    ctx.fillText("Scan to Pay", 540, 440);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 30px Arial";
    ctx.fillText("Show this QR to any RewardHub Merchant", 540, 515);

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

    drawInfo(ctx, 145, 1440, "ID", "Member ID", memberId);
    drawInfo(ctx, 145, 1520, "NM", "Member Name", memberName);
    drawInfo(ctx, 145, 1600, "TR", "Member Tier", memberTier);
    drawInfo(
      ctx,
      145,
      1680,
      "RC",
      "Reward Credits",
      `RM${money(rewardCredits)}`
    );

    const gold = ctx.createLinearGradient(145, 1775, 935, 1870);
    gold.addColorStop(0, "#f59e0b");
    gold.addColorStop(0.5, "#fde047");
    gold.addColorStop(1, "#f59e0b");

    ctx.fillStyle = gold;
    roundRect(ctx, 145, 1775, 790, 95, 28);
    ctx.fill();

    ctx.fillStyle = "#020617";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Secure • Fast • Rewarding", 540, 1822);

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
            ← Back to Dashboard
          </Link>

          <div className="mt-5 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:mt-6 sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">
                  RewardHub Pay
                </p>

                <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
                  Scan to Pay
                </h1>

                <p className="mt-3 max-w-xl text-sm font-bold text-slate-400">
                  Show this QR to the merchant. Your tier, Reward Credits and
                  cashback rules will be detected automatically.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-5 py-4">
                <p className="text-xs font-black text-slate-400">Current Tier</p>
                <p className="mt-1 text-xl font-black text-amber-300">
                  {memberTier}
                </p>
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
                <div className="flex h-[320px] items-center justify-center rounded-[1.5rem] bg-slate-50 text-center font-bold text-slate-500">
                  Card ID not found. Please login again.
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniInfo title="Member ID" value={memberId} />
              <MiniInfo
                title="Reward Credits"
                value={`RM${money(rewardCredits)}`}
              />
              <MiniInfo title="Points" value={`${points} pts`} />
            </div>

            <button
              onClick={downloadPremiumCard}
              disabled={!memberQrValue}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-300 py-3 sm:py-4 text-sm font-black text-slate-950 shadow-xl disabled:opacity-40"
            >
              ⬇ Download Premium QR Card
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 lg:grid-cols-2 lg:gap-6">
            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5 lg:rounded-[2.5rem] lg:p-6">
              <h2 className="text-2xl font-black text-slate-950">
                Payment Profile
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                Merchant will see this profile when scanning your QR.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <InfoCard title="Member Name" value={memberName} />
                <InfoCard title="Member ID" value={memberId} />
                <InfoCard title="Card ID" value={cardId} />
                <InfoCard title="Current Tier" value={memberTier} />
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5 lg:rounded-[2.5rem] lg:p-6">
              <h2 className="text-2xl font-black text-slate-950">
                Available Benefits
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                Your available RewardHub benefits for payment.
              </p>

             <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                <BenefitCard
                  title="Reward Credits"
                  value={`RM${money(rewardCredits)}`}
                  desc="Can be used to offset your payment."
                  dark
                />

                <BenefitCard
                  title="Points"
                  value={`${points} pts`}
                  desc="Loyalty points earned from RewardHub activity."
                />

                <BenefitCard
                  title="Cashback Saved"
                  value={`RM${money(cashbackSaved)}`}
                  desc="Total instant discount you have saved."
                />

                <BenefitCard
                  title="Cashback Rate"
                  value={cashbackRate}
                  desc="Based on merchant Marketing Budget and your tier."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[2.5rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              How RewardHub Pay Works
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <StepCard step="01" title="Show QR" desc="Open this page." />
              <StepCard step="02" title="Merchant Scans" desc="Merchant enters amount." />
              <StepCard step="03" title="Pay Less" desc="Cashback and credits apply." />
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
      <p className="truncate text-[11px] font-black text-slate-300 sm:text-xs">
        {title}
      </p>

      <p className="mt-1 break-words text-xs font-black leading-tight text-white sm:text-lg">
        {value}
      </p>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 break-all text-sm font-black text-slate-950 sm:text-lg">
        {value || "-"}
      </p>
    </div>
  );
}

function BenefitCard({ title, value, desc, dark = false }: any) {
  return (
    <div
      className={`rounded-xl p-3 sm:rounded-2xl sm:p-5 ${
        dark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-950"
      }`}
    >
      <p
        className={`text-xs font-black uppercase tracking-[0.15em] ${
          dark ? "text-amber-300" : "text-slate-400"
        }`}
      >
        {title}
      </p>
      <p className="mt-2 text-base font-black text-slate-950 sm:text-lg"></p>
      <p
        className={`mt-2 text-sm font-bold leading-6 ${
          dark ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {desc}
      </p>
    </div>
  );
}

function StepCard({ step, title, desc }: any) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm font-black text-amber-600">{step}</p>
      <h3 className="mt-2 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm font-bold text-slate-500">{desc}</p>
    </div>
  );
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