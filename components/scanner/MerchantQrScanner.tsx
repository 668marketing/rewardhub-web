"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import type {
  Html5QrcodeCameraScanConfig,
  Html5QrcodeResult,
} from "html5-qrcode";

import ScannerOverlay from "./ScannerOverlay";
import ScannerToolbar from "./ScannerToolbar";
import {
  fillScannerText,
  type MerchantScannerTranslation,
  useScannerLanguage,
} from "./merchantScannerLanguage";
import "./merchant-scanner.css";

type ScannerStatus =
  | "idle"
  | "starting"
  | "ready"
  | "processing"
  | "success"
  | "error";

type CameraInfo = {
  id: string;
  label: string;
};

const READER_ID = "rewardhub-merchant-qr-reader";

function getCameraFacing(
  label: string
): "environment" | "user" | "unknown" {
  const value = String(label || "").toLowerCase();

  if (
    /front|user|facetime|selfie|前置|前鏡|前镜|depan/.test(
      value
    )
  ) {
    return "user";
  }

  if (
    /back|rear|environment|后置|後置|后鏡|後鏡|后镜|後镜|背面|belakang/.test(
      value
    )
  ) {
    return "environment";
  }

  return "unknown";
}

function normalizeQrPayload(
  decodedText: string,
  t: MerchantScannerTranslation
): string {
  const raw = String(decodedText || "").trim();

  if (!raw) {
    throw new Error(t.cardIdNotFound);
  }

  try {
    const parsed = JSON.parse(raw);

    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.type &&
      parsed.type !== "member_card"
    ) {
      throw new Error(t.notRewardHubQr);
    }

    const cardId = String(
      parsed?.cardId ??
        parsed?.card_id ??
        parsed?.memberCardId ??
        parsed?.member_card_id ??
        ""
    ).trim();

    if (!cardId) {
      throw new Error(t.cardIdNotFoundInQr);
    }

    return cardId;
  } catch (error) {
    if (
      error instanceof Error &&
      [
        t.notRewardHubQr,
        t.cardIdNotFound,
        t.cardIdNotFoundInQr,
      ].includes(error.message as never)
    ) {
      throw error;
    }

    if (/^[A-Za-z0-9_-]{4,80}$/.test(raw)) {
      return raw;
    }

    throw new Error(t.invalidSelectedQr);
  }
}

function createScanConfig(): Html5QrcodeCameraScanConfig {
  return {
    fps: 12,
    qrbox: (width, height) => {
      const shortest = Math.min(width, height);
      const size = Math.max(
        210,
        Math.min(300, Math.floor(shortest * 0.72))
      );

      return {
        width: size,
        height: size,
      };
    },
    aspectRatio: 1,
    disableFlip: false,
  };
}

export default function MerchantQrScanner() {
  const router = useRouter();
  const { t } = useScannerLanguage();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const mountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const redirectTimerRef = useRef<number | null>(null);

  const [status, setStatus] =
    useState<ScannerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "starting":
        return t.startingCamera;
      case "ready":
        return t.cameraReady;
      case "processing":
        return t.readingQr;
      case "success":
        return t.memberVerified;
      case "error":
        return t.actionRequired;
      default:
        return t.scanner;
    }
  }, [status, t]);

  const clearScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (!scanner) {
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (error) {
      console.warn("Unable to stop QR scanner:", error);
    }

    try {
      await scanner.clear();
    } catch (error) {
      console.warn("Unable to clear QR scanner:", error);
    }
  }, []);

  const completeScan = useCallback(
    async (decodedText: string) => {
      if (handledRef.current) {
        return;
      }

      handledRef.current = true;
      setStatus("processing");
      setErrorMessage("");

      try {
        const cardId = normalizeQrPayload(decodedText, t);

        if (
          typeof navigator !== "undefined" &&
          "vibrate" in navigator
        ) {
          navigator.vibrate?.(60);
        }

        setStatus("success");
        await clearScanner();

        localStorage.setItem("scannedCardId", cardId);

        redirectTimerRef.current = window.setTimeout(() => {
          router.replace("/merchant/collect");
        }, 650);
      } catch (error) {
        handledRef.current = false;
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : t.unableReadQr
        );
      }
    },
    [clearScanner, router, t]
  );

  const startScannerWithSource = useCallback(
    async (source: string | MediaTrackConstraints) => {
      const scanner = new Html5Qrcode(READER_ID, {
        verbose: false,
      });

      scannerRef.current = scanner;

      const onSuccess = (
        decodedText: string,
        _result: Html5QrcodeResult
      ) => {
        void completeScan(decodedText);
      };

      await scanner.start(
        source,
        createScanConfig(),
        onSuccess,
        () => undefined
      );
    },
    [completeScan]
  );

  const startCamera = useCallback(
    async (preferredCameraId?: string) => {
      handledRef.current = false;
      setStatus("starting");
      setErrorMessage("");

      await clearScanner();

      try {
        if (preferredCameraId) {
          await startScannerWithSource(preferredCameraId);
        } else {
          await startScannerWithSource({
            facingMode: { ideal: "environment" },
          });
        }

        if (mountedRef.current) {
          setStatus("ready");
        }
      } catch (firstError) {
        console.warn(
          "Preferred camera unavailable:",
          firstError
        );
        await clearScanner();

        try {
          await startScannerWithSource({
            facingMode: "environment",
          });

          if (mountedRef.current) {
            setStatus("ready");
          }
        } catch (secondError) {
          console.error(
            "Unable to start camera:",
            secondError
          );
          await clearScanner();

          if (mountedRef.current) {
            setStatus("error");
            setErrorMessage(t.cameraAccessFailed);
          }
        }
      }
    },
    [clearScanner, startScannerWithSource, t]
  );

  const loadCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();

      const normalized = devices.map((camera) => ({
        id: camera.id,
        label:
          camera.label ||
          fillScannerText(t.cameraFallback, {
            suffix: camera.id.slice(-4),
          }),
      }));

      setCameras(normalized);

      if (normalized.length > 0) {
        const rearIndex = normalized.findIndex(
          (camera) =>
            getCameraFacing(camera.label) === "environment"
        );

        const initialIndex = rearIndex >= 0 ? rearIndex : 0;

        setCameraIndex(initialIndex);
        await startCamera(normalized[initialIndex].id);
        return;
      }
    } catch (error) {
      console.warn("Unable to enumerate cameras:", error);
    }

    await startCamera();
  }, [startCamera, t]);

  useEffect(() => {
    mountedRef.current = true;

    const timer = window.setTimeout(() => {
      void loadCameras();
    }, 120);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);

      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }

      void clearScanner();
    };
  }, [clearScanner, loadCameras]);

  const handleBack = async () => {
    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current);
    }

    await clearScanner();
    router.push("/merchant/collect");
  };

  const handleRetry = async () => {
    const selected = cameras[cameraIndex];
    await startCamera(selected?.id);
  };

  const handleSwitchCamera = async () => {
    if (
      status === "processing" ||
      status === "starting" ||
      cameras.length < 2
    ) {
      return;
    }

    setErrorMessage("");

    try {
      const currentFacing = getCameraFacing(
        cameras[cameraIndex]?.label || ""
      );

      let nextIndex = -1;

      if (currentFacing === "environment") {
        nextIndex = cameras.findIndex(
          (camera) =>
            getCameraFacing(camera.label) === "user"
        );
      } else if (currentFacing === "user") {
        nextIndex = cameras.findIndex(
          (camera) =>
            getCameraFacing(camera.label) === "environment"
        );
      }

      if (nextIndex < 0) {
        nextIndex = (cameraIndex + 1) % cameras.length;
      }

      setCameraIndex(nextIndex);
      await startCamera(cameras[nextIndex].id);
    } catch (error) {
      console.warn("Unable to switch camera:", error);
      setStatus("error");
      setErrorMessage(t.unableSwitchCamera);
    }
  };

  const handleUploadClick = () => {
    if (
      status === "processing" ||
      status === "starting" ||
      uploading
    ) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMessage(t.chooseImageFile);
      return;
    }

    setUploading(true);
    setStatus("processing");
    setErrorMessage("");
    handledRef.current = false;

    try {
      await clearScanner();

      const fileScanner = new Html5Qrcode(READER_ID, {
        verbose: false,
      });

      scannerRef.current = fileScanner;

      const decodedText = await fileScanner.scanFile(
        file,
        true
      );
      await completeScan(decodedText);
    } catch {
      handledRef.current = false;
      setStatus("error");
      setErrorMessage(t.noReadableQr);
    } finally {
      setUploading(false);
    }
  };

  const activeCameraLabel =
    cameras[cameraIndex]?.label || t.rearCamera;

  return (
    <main className="rh-scanner-page">
      <div className="rh-scanner-bg" aria-hidden="true">
        <span className="rh-orb rh-orb-one" />
        <span className="rh-orb rh-orb-two" />
        <span className="rh-grid" />
      </div>

      <section className="rh-scanner-shell">
        <header className="rh-scanner-header">
          <button
            type="button"
            className="rh-icon-button"
            onClick={handleBack}
            aria-label={t.backToCollectPayment}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
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

          <div
            className={`rh-status-pill rh-status-${status}`}
          >
            <span className="rh-status-dot" />
            <span>{statusLabel}</span>
          </div>
        </header>

        <div className="rh-title-block">
          <div className="rh-kicker">
            {t.merchantPayment}
          </div>

          <h1>{t.scanMemberQr}</h1>

          <p>{t.pageDescription}</p>
        </div>

        <div className="rh-scanner-card">
          <div className="rh-camera-stage">
            <div id={READER_ID} className="rh-reader" />

            <ScannerOverlay status={status} />

            {status === "starting" && (
              <div className="rh-state-panel">
                <div className="rh-loader" />
                <strong>{t.openingCamera}</strong>
                <span>{t.allowCameraAccess}</span>
              </div>
            )}

            {status === "success" && (
              <div className="rh-state-panel rh-state-success">
                <div className="rh-success-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12.5l4.2 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <strong>{t.memberVerified}</strong>
                <span>{t.openingCollectionPage}</span>
              </div>
            )}

            {status === "error" && (
              <div className="rh-state-panel rh-state-error">
                <div className="rh-error-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 8v4M12 16h.01M10.3 4.8L3.6 16.4A2 2 0 005.3 19h13.4a2 2 0 001.7-2.6L13.7 4.8a2 2 0 00-3.4 0z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <strong>{t.unableToContinue}</strong>
                <span>{errorMessage}</span>

                <button
                  type="button"
                  onClick={handleRetry}
                >
                  {t.tryCameraAgain}
                </button>
              </div>
            )}
          </div>

          <div className="rh-camera-summary">
            <div>
              <span className="rh-camera-summary-label">
                {t.activeSource}
              </span>

              <strong>{activeCameraLabel}</strong>
            </div>

            <span className="rh-secure-badge">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3l7 3v5c0 4.6-2.8 8.6-7 10-4.2-1.4-7-5.4-7-10V6l7-3z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {t.secure}
            </span>
          </div>

          <ScannerToolbar
            cameraCount={cameras.length}
            busy={
              status === "processing" ||
              status === "starting"
            }
            uploading={uploading}
            onUpload={handleUploadClick}
            onSwitchCamera={handleSwitchCamera}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="rh-hidden-input"
            onChange={handleImageUpload}
          />
        </div>

        <div className="rh-help-grid">
          <article>
            <span>01</span>
            <strong>{t.alignClearly}</strong>
            <p>{t.alignClearlyDescription}</p>
          </article>

          <article>
            <span>02</span>
            <strong>{t.holdSteady}</strong>
            <p>{t.holdSteadyDescription}</p>
          </article>

          <article>
            <span>03</span>
            <strong>{t.autoContinue}</strong>
            <p>{t.autoContinueDescription}</p>
          </article>
        </div>

        <p className="rh-footnote">{t.footnote}</p>
      </section>
    </main>
  );
}