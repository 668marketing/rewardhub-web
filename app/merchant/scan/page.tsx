"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

type ScannerStatus =
  | "starting"
  | "ready"
  | "success"
  | "error";

export default function MerchantScanPage() {
  const router = useRouter();

  const scannerRef =
    useRef<Html5Qrcode | null>(null);

  const handledRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  const [status, setStatus] =
    useState<ScannerStatus>("starting");

  const [errorMessage, setErrorMessage] =
    useState("");

  const stopScanner =
    useCallback(async () => {
      const scanner =
        scannerRef.current;

      if (!scanner) {
        return;
      }

      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (error) {
        console.warn(
          "Unable to stop scanner:",
          error
        );
      }

      try {
        await scanner.clear();
      } catch (error) {
        console.warn(
          "Unable to clear scanner:",
          error
        );
      }

      scannerRef.current =
        null;
    }, []);

  const handleDecodedResult =
    useCallback(
      async (
        decodedText: string
      ) => {
        if (
          handledRef.current
        ) {
          return;
        }

        handledRef.current =
          true;

        let cardId = "";

        try {
          const qrData =
            JSON.parse(
              decodedText
            );

          if (
            qrData?.type &&
            qrData.type !==
              "member_card"
          ) {
            handledRef.current =
              false;

            setStatus("error");
            setErrorMessage(
              "This QR code is not a valid RewardHub member card."
            );

            return;
          }

          cardId = String(
            qrData?.cardId ||
              ""
          ).trim();
        } catch {
          cardId =
            decodedText.trim();
        }

        if (!cardId) {
          handledRef.current =
            false;

          setStatus("error");
          setErrorMessage(
            "Card ID could not be found in this QR code."
          );

          return;
        }

        setStatus("success");
        setErrorMessage("");

        await stopScanner();

        localStorage.setItem(
          "scannedCardId",
          cardId
        );

        window.setTimeout(
          () => {
            router.push(
              "/merchant/collect"
            );
          },
          700
        );
      },
      [
        router,
        stopScanner,
      ]
    );

  const startScanner =
    useCallback(async () => {
      handledRef.current =
        false;

      setStatus("starting");
      setErrorMessage("");

      await stopScanner();

      const scanner =
        new Html5Qrcode(
          "rewardhub-qr-reader",
          {
            verbose: false,
          }
        );

      scannerRef.current =
        scanner;

      try {
        await scanner.start(
          {
            facingMode: {
              exact:
                "environment",
            },
          },
          {
            fps: 12,

            qrbox: (
              viewfinderWidth,
              viewfinderHeight
            ) => {
              const shortestSide =
                Math.min(
                  viewfinderWidth,
                  viewfinderHeight
                );

              const boxSize =
                Math.floor(
                  Math.min(
                    shortestSide *
                      0.7,
                    280
                  )
                );

              return {
                width:
                  boxSize,
                height:
                  boxSize,
              };
            },

            aspectRatio:
              1,
          },
          handleDecodedResult,
          () => {
            // QR not detected yet.
            // No action is needed.
          }
        );

        if (
          mountedRef.current
        ) {
          setStatus(
            "ready"
          );
        }
      } catch (
        exactCameraError
      ) {
        console.warn(
          "Exact rear camera unavailable:",
          exactCameraError
        );

        try {
          await scanner.start(
            {
              facingMode:
                "environment",
            },
            {
              fps: 12,

              qrbox: (
                viewfinderWidth,
                viewfinderHeight
              ) => {
                const shortestSide =
                  Math.min(
                    viewfinderWidth,
                    viewfinderHeight
                  );

                const boxSize =
                  Math.floor(
                    Math.min(
                      shortestSide *
                        0.7,
                      280
                    )
                  );

                return {
                  width:
                    boxSize,
                  height:
                    boxSize,
                };
              },

              aspectRatio:
                1,
            },
            handleDecodedResult,
            () => {}
          );

          if (
            mountedRef.current
          ) {
            setStatus(
              "ready"
            );
          }
        } catch (
          cameraError
        ) {
          console.error(
            "Unable to start camera:",
            cameraError
          );

          if (
            mountedRef.current
          ) {
            setStatus(
              "error"
            );

            setErrorMessage(
              "We could not open your camera. Please allow camera access and try again."
            );
          }
        }
      }
    }, [
      handleDecodedResult,
      stopScanner,
    ]);

  useEffect(() => {
    mountedRef.current =
      true;

    const timer =
      window.setTimeout(
        () => {
          startScanner();
        },
        250
      );

    return () => {
      mountedRef.current =
        false;

      window.clearTimeout(
        timer
      );

      stopScanner();
    };
  }, [
    startScanner,
    stopScanner,
  ]);

  const handleBack =
    async () => {
      await stopScanner();

      router.push(
        "/merchant/collect"
      );
    };

  const handleTryAgain =
    async () => {
      await startScanner();
    };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="absolute -right-24 top-28 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-400/5 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize:
              "36px 36px",
          }}
        />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 pb-8 pt-5 sm:px-7 sm:pt-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={
              handleBack
            }
            className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white shadow-lg shadow-black/10 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.1] active:scale-95"
            aria-label="Back"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-xl">
            <span
              className={`h-2 w-2 rounded-full ${
                status ===
                "success"
                  ? "bg-emerald-400"
                  : status ===
                      "error"
                    ? "bg-rose-400"
                    : status ===
                        "ready"
                      ? "bg-cyan-400"
                      : "animate-pulse bg-amber-300"
              }`}
            />

            <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-300">
              {status ===
              "success"
                ? "Scanned"
                : status ===
                    "error"
                  ? "Camera Issue"
                  : status ===
                      "ready"
                    ? "Camera Active"
                    : "Starting"}
            </span>
          </div>
        </header>

        {/* Title */}
        <div className="mt-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 to-blue-500/10 shadow-xl shadow-cyan-950/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 text-cyan-300"
            >
              <path
                d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <path
                d="M8 8h3v3H8V8zM13 8h3v3h-3V8zM8 13h3v3H8v-3zM14 14h2v2h-2v-2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-300">
            Merchant Payment
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Scan Member QR
          </h1>

          <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-slate-400">
            Position the member
            QR code inside the
            frame to continue
            with payment
            collection.
          </p>
        </div>

        {/* Scanner card */}
        <div className="mt-7 rounded-[2rem] border border-white/10 bg-white/[0.055] p-3 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-4">
          <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#030b15]">
            <div className="relative aspect-square w-full">
              <div
                id="rewardhub-qr-reader"
                className="absolute inset-0 h-full w-full overflow-hidden"
              />

              {/* Dark scanner overlay */}
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/10 via-transparent to-black/25" />

              {/* Center frame */}
              <div className="pointer-events-none absolute inset-[13%] z-20">
                {/* Top left */}
                <span className="absolute left-0 top-0 h-12 w-12 rounded-tl-2xl border-l-[3px] border-t-[3px] border-cyan-300" />

                {/* Top right */}
                <span className="absolute right-0 top-0 h-12 w-12 rounded-tr-2xl border-r-[3px] border-t-[3px] border-cyan-300" />

                {/* Bottom left */}
                <span className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-2xl border-b-[3px] border-l-[3px] border-cyan-300" />

                {/* Bottom right */}
                <span className="absolute bottom-0 right-0 h-12 w-12 rounded-br-2xl border-b-[3px] border-r-[3px] border-cyan-300" />

                {status ===
                  "ready" && (
                  <div className="scan-line absolute left-3 right-3 top-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
                )}
              </div>

              {/* Starting state */}
              {status ===
                "starting" && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#030b15]/90 px-8 text-center backdrop-blur-sm">
                  <div className="relative flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full border border-cyan-300/30" />

                    <div className="absolute inset-2 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" />

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6 text-cyan-300"
                    >
                      <path
                        d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <p className="mt-5 text-base font-black text-white">
                    Opening camera
                  </p>

                  <p className="mt-2 text-xs font-medium leading-5 text-slate-400">
                    Please allow
                    camera access
                    when prompted.
                  </p>
                </div>
              )}

              {/* Success state */}
              {status ===
                "success" && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-emerald-950/90 px-8 text-center backdrop-blur-md">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/15 shadow-2xl shadow-emerald-500/20">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-10 w-10 text-emerald-300"
                    >
                      <path
                        d="M5 12.5l4.2 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <p className="mt-5 text-xl font-black text-white">
                    Member found
                  </p>

                  <p className="mt-2 text-sm font-semibold text-emerald-100/70">
                    Redirecting to
                    payment
                    collection…
                  </p>
                </div>
              )}

              {/* Error state */}
              {status ===
                "error" && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#07111f]/95 px-8 text-center backdrop-blur-md">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-400/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-8 w-8 text-rose-300"
                    >
                      <path
                        d="M12 8v4M12 16h.01M10.3 4.8L3.6 16.4A2 2 0 005.3 19h13.4a2 2 0 001.7-2.6L13.7 4.8a2 2 0 00-3.4 0z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <p className="mt-5 text-lg font-black text-white">
                    Unable to scan
                  </p>

                  <p className="mt-2 max-w-xs text-xs font-medium leading-5 text-slate-400">
                    {errorMessage}
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleTryAgain
                    }
                    className="mt-5 rounded-xl bg-white px-5 py-3 text-xs font-black text-slate-950 shadow-xl transition hover:bg-slate-100 active:scale-95"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Scanner footer */}
          <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                >
                  <path
                    d="M8 5h8M7 9h10M6 13h12M8 17h8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black text-white">
                  Rear camera
                </p>

                <p className="truncate text-xs font-medium text-slate-500">
                  Automatically
                  detects member
                  cards
                </p>
              </div>
            </div>

            <div className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                Secure
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-4 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-black text-cyan-300">
              01
            </div>

            <p className="mt-2 text-[11px] font-extrabold leading-4 text-slate-300">
              Hold device
              steady
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-4 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-black text-cyan-300">
              02
            </div>

            <p className="mt-2 text-[11px] font-extrabold leading-4 text-slate-300">
              Align the
              QR code
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-4 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-black text-cyan-300">
              03
            </div>

            <p className="mt-2 text-[11px] font-extrabold leading-4 text-slate-300">
              Continue
              payment
            </p>
          </div>
        </div>

        <p className="mt-auto pt-8 text-center text-[11px] font-semibold leading-5 text-slate-600">
          Only scan RewardHub
          member QR codes.
          Member information is
          processed securely.
        </p>
      </section>

      <style jsx global>{`
        #rewardhub-qr-reader {
          border: 0 !important;
          background: #030b15 !important;
        }

        #rewardhub-qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0 !important;
        }

        #rewardhub-qr-reader img {
          display: none !important;
        }

        #rewardhub-qr-reader__scan_region {
          min-height: 100% !important;
          background: #030b15 !important;
        }

        #rewardhub-qr-reader__dashboard,
        #rewardhub-qr-reader__header_message {
          display: none !important;
        }

        @keyframes rewardhub-scan-line {
          0% {
            top: 12px;
            opacity: 0.25;
          }

          50% {
            opacity: 1;
          }

          100% {
            top: calc(100% - 14px);
            opacity: 0.25;
          }
        }

        .scan-line {
          animation: rewardhub-scan-line
            2.2s ease-in-out
            infinite alternate;
        }
      `}</style>
    </main>
  );
}