"use client";

import { useEffect, useRef, useState } from "react";
import MemberLayout from "@/components/layout/MemberLayout";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";

export default function ScanPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
  let scanner: Html5Qrcode | null = null;

  const timer = setTimeout(() => {
    const element = document.getElementById("qr-reader");

    if (!element) {
      setError("Scanner container not found.");
      return;
    }

    scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          await scanner?.stop();

          let merchantId = "";

          if (decodedText.includes("merchantId=")) {
            const url = new URL(decodedText);
            merchantId = url.searchParams.get("merchantId") || "";
          } else if (decodedText.startsWith("RHCM")) {
  merchantId = decodedText;
} else {
  setError("Invalid RewardHub merchant QR");
  await scanner?.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 260, height: 260 } },
    async () => {},
    () => {}
  );
  return;
}

          window.location.href = `/member/pay?merchantId=${merchantId}`;
        },
        () => {}
      )
      .catch(() => {
        setError("Camera permission denied or not available.");
      });
  }, 500);

  return () => {
    clearTimeout(timer);
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
  };
}, []);

  return (
    <MemberLayout>
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <Link
          href="/member/dashboard"
          className="inline-block rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-950 no-underline"
        >
          ← Back
        </Link>

        <section className="mx-auto mt-10 max-w-md rounded-[2rem] bg-white p-6 text-center shadow-2xl">
          <h1 className="text-3xl font-black text-slate-950">
            Scan Merchant QR
          </h1>

          <p className="mt-3 text-sm font-bold text-slate-500">
            Point your camera at the merchant QR code.
          </p >

          <div
            id="qr-reader"
            className="mt-6 overflow-hidden rounded-3xl"
          />

          {error && (
            <p className="mt-4 text-sm font-black text-red-600">
              {error}
            </p >
          )}
        </section>
      </main>
    </MemberLayout>
  );
}