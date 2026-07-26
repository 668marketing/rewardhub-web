"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Html5Qrcode,
  Html5QrcodeCameraScanConfig,
  Html5QrcodeResult,
} from "html5-qrcode";
import ScannerOverlay from "./ScannerOverlay";
import ScannerToolbar from "./ScannerToolbar";
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

function normalizeQrPayload(decodedText: string): string {
  const raw = String(decodedText || "").trim();

  if (!raw) {
    throw new Error("Card ID not found.");
  }

  try {
    const parsed = JSON.parse(raw);

    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.type &&
      parsed.type !== "member_card"
    ) {
      throw new Error("This is not a RewardHub member QR code.");
    }

    const cardId = String(
      parsed?.cardId ??
        parsed?.card_id ??
        parsed?.memberCardId ??
        parsed?.member_card_id ??
        ""
    ).trim();

    if (!cardId) {
      throw new Error("Card ID not found in this QR code.");
    }

    return cardId;
  } catch (error) {
    if (error instanceof Error && error.message.includes("RewardHub")) {
      throw error;
    }

    if (/^[A-Za-z0-9_-]{4,80}$/.test(raw)) {
      return raw;
    }

    throw new Error("The selected QR code is invalid.");
  }
}

export default function MerchantQrScanner() {
  const router = useRouter();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const mountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);

const [currentFacingMode, setCurrentFacingMode] = useState<
  "environment" | "user"
>("environment");

const [torchSupported, setTorchSupported] = useState(false);
const [torchEnabled, setTorchEnabled] = useState(false);
const [deviceMessage, setDeviceMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "starting":
        return "Starting camera";
      case "ready":
        return "Camera ready";
      case "processing":
        return "Reading QR";
      case "success":
        return "Member verified";
      case "error":
        return "Action required";
      default:
        return "Scanner";
    }
  }, [status]);

  const getActiveVideoTrack = useCallback(() => {
  const video = document.querySelector(
    `#${READER_ID} video`
  ) as HTMLVideoElement | null;

  if (!video?.srcObject) {
    return null;
  }

  const stream = video.srcObject as MediaStream;

  return stream.getVideoTracks()[0] || null;
}, []);

  const clearScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) return;

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

    scannerRef.current = null;
    setTorchEnabled(false);
    setTorchSupported(false);
  }, []);

  const completeScan = useCallback(
    async (decodedText: string) => {
      if (handledRef.current) return;

      handledRef.current = true;
      setStatus("processing");
      setErrorMessage("");

      try {
        const cardId = normalizeQrPayload(decodedText);

        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(60);
        }

        setStatus("success");
        await clearScanner();

        localStorage.setItem("scannedCardId", cardId);

        window.setTimeout(() => {
          router.replace("/merchant/collect");
        }, 650);
      } catch (error) {
        handledRef.current = false;
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to read this QR code."
        );
      }
    },
    [clearScanner, router]
  );

  const detectTorchSupport = useCallback(() => {
  try {
    const track = getActiveVideoTrack();

    if (!track) {
      setTorchSupported(false);
      return false;
    }

    const capabilities = track.getCapabilities?.() as
      | MediaTrackCapabilities & {
          torch?: boolean;
        }
      | undefined;

    const supported = capabilities?.torch === true;

    setTorchSupported(supported);

    return supported;
  } catch (error) {
    console.warn("Unable to detect torch support:", error);

    setTorchSupported(false);

    return false;
  }
}, [getActiveVideoTrack]);

  const startCamera = useCallback(
    async (preferredCameraId?: string) => {
      handledRef.current = false;
      setStatus("starting");
      setErrorMessage("");

      await clearScanner();

      const scanner = new Html5Qrcode(READER_ID, {
        verbose: false,
      });

      scannerRef.current = scanner;

      const config: Html5QrcodeCameraScanConfig = {
        fps: 12,
        qrbox: (width, height) => {
          const shortest = Math.min(width, height);
          const size = Math.max(210, Math.min(300, Math.floor(shortest * 0.72)));

          return {
            width: size,
            height: size,
          };
        },
        aspectRatio: 1,
        disableFlip: false,
      };

      const onSuccess = (
        decodedText: string,
        _result: Html5QrcodeResult
      ) => {
        void completeScan(decodedText);
      };

      try {
        const source = preferredCameraId
          ? { deviceId: { exact: preferredCameraId } }
          : { facingMode: { exact: "environment" } };

        await scanner.start(source, config, onSuccess, () => undefined);

        if (mountedRef.current) {
          setStatus("ready");
          window.setTimeout(() => {
            void detectTorchSupport();
          }, 350);
        }
      } catch (firstError) {
        console.warn("Preferred camera unavailable:", firstError);

        try {
          await scanner.start(
            { facingMode: "environment" },
            config,
            onSuccess,
            () => undefined
          );

          if (mountedRef.current) {
            setStatus("ready");
            window.setTimeout(() => {
              void detectTorchSupport();
            }, 350);
          }
        } catch (secondError) {
          console.error("Unable to start camera:", secondError);

          if (mountedRef.current) {
            setStatus("error");
            setErrorMessage(
              "Camera access failed. Please allow camera permission, close other camera apps, then try again."
            );
          }
        }
      }
    },
    [clearScanner, completeScan, detectTorchSupport]
  );

  const loadCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();

      const normalized = devices.map((camera) => ({
        id: camera.id,
        label: camera.label || `Camera ${camera.id.slice(-4)}`,
      }));

      setCameras(normalized);

      if (normalized.length > 0) {
        const rearIndex = normalized.findIndex((camera) =>
          /back|rear|environment/i.test(camera.label)
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
  }, [startCamera]);

  useEffect(() => {
    mountedRef.current = true;

    const timer = window.setTimeout(() => {
      void loadCameras();
    }, 120);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
      void clearScanner();
    };
  }, [clearScanner, loadCameras]);

  const handleBack = async () => {
    await clearScanner();
    router.push("/merchant/collect");
  };

  const handleRetry = async () => {
    const selected = cameras[cameraIndex];
    await startCamera(selected?.id);
  };

  const handleSwitchCamera = async () => {
  if (status === "processing" || status === "starting") {
    return;
  }

  setDeviceMessage("");
  setErrorMessage("");

  try {
    if (cameras.length >= 2) {
      const nextIndex = (cameraIndex + 1) % cameras.length;

      setCameraIndex(nextIndex);

      const nextCamera = cameras[nextIndex];

      const nextFacingMode =
        /front|user|facetime/i.test(nextCamera.label)
          ? "user"
          : "environment";

      setCurrentFacingMode(nextFacingMode);

      await startCamera(nextCamera.id);

      setDeviceMessage(
        nextFacingMode === "environment"
          ? "Rear camera activated."
          : "Front camera activated."
      );

      return;
    }

    const nextFacingMode =
      currentFacingMode === "environment"
        ? "user"
        : "environment";

    setCurrentFacingMode(nextFacingMode);

    await clearScanner();

    handledRef.current = false;
    setStatus("starting");

    const scanner = new Html5Qrcode(READER_ID, {
      verbose: false,
    });

    scannerRef.current = scanner;

    const config: Html5QrcodeCameraScanConfig = {
      fps: 12,

      qrbox: (width, height) => {
        const shortest = Math.min(width, height);

        const size = Math.max(
          210,
          Math.min(
            300,
            Math.floor(shortest * 0.72)
          )
        );

        return {
          width: size,
          height: size,
        };
      },

      aspectRatio: 1,
      disableFlip: false,
    };

    await scanner.start(
      {
        facingMode: nextFacingMode,
      },
      config,
      (decodedText) => {
        void completeScan(decodedText);
      },
      () => undefined
    );

    setStatus("ready");

    window.setTimeout(() => {
      detectTorchSupport();
    }, 350);

    setDeviceMessage(
      nextFacingMode === "environment"
        ? "Rear camera activated."
        : "Front camera activated."
    );
  } catch (error) {
    console.warn("Unable to switch camera:", error);

    setStatus("ready");

    setDeviceMessage(
      "No additional camera is available on this device."
    );
  }
};

  const handleTorch = async () => {
  if (status === "processing" || status === "starting") {
    return;
  }

  setDeviceMessage("");
  setErrorMessage("");

  try {
    const track = getActiveVideoTrack();

    if (!track) {
      setDeviceMessage(
        "Camera is not ready. Please try again."
      );

      return;
    }

    const capabilities = track.getCapabilities?.() as
      | MediaTrackCapabilities & {
          torch?: boolean;
        }
      | undefined;

    if (capabilities?.torch !== true) {
      setTorchSupported(false);

      setDeviceMessage(
        "Flashlight is not supported by this camera or browser."
      );

      return;
    }

    setTorchSupported(true);

    const nextValue = !torchEnabled;

    await track.applyConstraints({
      advanced: [
        {
          torch: nextValue,
        } as MediaTrackConstraintSet,
      ],
    });

    setTorchEnabled(nextValue);

    setDeviceMessage(
      nextValue
        ? "Flashlight turned on."
        : "Flashlight turned off."
    );
  } catch (error) {
    console.warn("Unable to control flashlight:", error);

    setTorchEnabled(false);

    setDeviceMessage(
      "Unable to control the flashlight on this device."
    );
  }
};

  const handleUploadClick = () => {
    if (status === "processing" || uploading) return;
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMessage("Please choose an image file.");
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

      const decodedText = await fileScanner.scanFile(file, true);
      await completeScan(decodedText);
    } catch (error) {
      handledRef.current = false;
      setStatus("error");
      setErrorMessage(
        "No readable QR code was found in this image. Try a clearer or less cropped photo."
      );
    } finally {
      setUploading(false);
    }
  };

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
            aria-label="Back to collect payment"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className={`rh-status-pill rh-status-${status}`}>
            <span className="rh-status-dot" />
            <span>{statusLabel}</span>
          </div>
        </header>

        <div className="rh-title-block">
          <div className="rh-kicker">Merchant payment</div>
          <h1>Scan member QR</h1>
          <p>
            Scan the member card with your rear camera or upload a QR image
            from the device gallery.
          </p>
        </div>

        <div className="rh-scanner-card">
          <div className="rh-camera-stage">
            <div id={READER_ID} className="rh-reader" />

            <ScannerOverlay status={status} />

            {status === "starting" && (
              <div className="rh-state-panel">
                <div className="rh-loader" />
                <strong>Opening camera</strong>
                <span>Please allow camera access when prompted.</span>
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
                <strong>Member verified</strong>
                <span>Opening the payment collection page…</span>
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
                <strong>Unable to continue</strong>
                <span>{errorMessage}</span>
                <button type="button" onClick={handleRetry}>
                  Try camera again
                </button>
              </div>
            )}
          </div>

          <div className="rh-camera-summary">
            <div>
              <span className="rh-camera-summary-label">Active source</span>
              <strong>
                {cameras[cameraIndex]?.label || "Rear camera"}
              </strong>
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
              Secure
            </span>
          </div>

          <ScannerToolbar
  torchEnabled={torchEnabled}
  busy={status === "processing" || status === "starting"}
  uploading={uploading}
  onUpload={handleUploadClick}
  onSwitchCamera={handleSwitchCamera}
  onToggleTorch={handleTorch}
/>

{deviceMessage && (
  <div className="rh-device-message">
    {deviceMessage}
  </div>
)}

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
            <strong>Align clearly</strong>
            <p>Keep the full QR code inside the frame.</p>
          </article>

          <article>
            <span>02</span>
            <strong>Hold steady</strong>
            <p>Avoid glare, shadows, and excessive movement.</p>
          </article>

          <article>
            <span>03</span>
            <strong>Auto continue</strong>
            <p>Successful scans open payment collection instantly.</p>
          </article>
        </div>

        <p className="rh-footnote">
          Only RewardHub member QR codes are accepted. The camera stream is
          processed on this device.
        </p>
      </section>
    </main>
  );
}
