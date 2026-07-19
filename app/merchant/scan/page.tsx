"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function MerchantScanPage() {
  const router = useRouter();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 260,
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          await scanner.clear();
        } catch (e) {}

        let cardId = "";

        try {
          const qr = JSON.parse(decodedText);

          if (qr.type !== "member_card") {
            alert("Invalid member QR");
            router.push("/merchant/collect");
            return;
          }

          cardId = String(qr.cardId || "").trim();
        } catch (e) {
          cardId = decodedText.trim();
        }

        if (!cardId) {
          alert("Card ID not found");
          router.push("/merchant/collect");
          return;
        }

        localStorage.setItem("scannedCardId", cardId);
        router.push("/merchant/collect");
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto max-w-md">
        <button
          onClick={() => router.push("/merchant/collect")}
          className="mb-6 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-black">Scan Member QR</h1>

        <p className="mt-2 text-sm font-bold text-slate-400">
          Align member QR code inside the camera box.
        </p >

        <div className="mt-6 overflow-hidden rounded-[2rem] bg-white p-4 text-slate-950">
          <div id="qr-reader" />
        </div>
      </section>
    </main>
  );
}