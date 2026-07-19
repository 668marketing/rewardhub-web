"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

export default function MerchantQRPage() {
  const merchant = {
    name: "ABC Cafe",
    merchantId: "RHCM00000001",
  };

  const payUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3000/member/pay?merchantId=${merchant.merchantId}`
    : "";

  function downloadQR() {
    const canvas = document.getElementById("merchant-qr") as HTMLCanvasElement;

    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `${merchant.merchantId}-rewardhub-qr.png`;
    link.click();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <section className="mx-auto max-w-md">
        <Link
          href="/merchant/dashboard"
          className="inline-block rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-950 no-underline"
        >
          ← Dashboard
        </Link>

        <div className="mt-8 rounded-[2rem] bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-xl font-black text-white">
            RH
          </div>

          <h1 className="mt-5 text-3xl font-black text-slate-950">
            {merchant.name}
          </h1>

          <p className="mt-2 text-sm font-black text-slate-500">
            {merchant.merchantId}
          </p >

          <div className="mt-8 flex justify-center rounded-[2rem] bg-slate-50 p-6"> 
        <QRCodeSVG
              id="merchant-qr"
              value={payUrl}
              size={260}
              level="H"
              includeMargin
            />
          </div>

          <p className="mt-5 text-sm font-bold text-slate-500">
            Customer scans this QR to pay with RewardHub.
          </p >

          <button
            onClick={downloadQR}
            className="mt-8 w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white"
          >
            Download QR
          </button>
        </div>
      </section>
    </main>
  );
}