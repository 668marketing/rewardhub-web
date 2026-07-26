"use client";

type ScannerOverlayProps = {
  status:
    | "idle"
    | "starting"
    | "ready"
    | "processing"
    | "success"
    | "error";
};

export default function ScannerOverlay({
  status,
}: ScannerOverlayProps) {
  const active = status === "ready";

  return (
    <div className="rh-overlay" aria-hidden="true">
      <div className={`rh-frame ${active ? "rh-frame-active" : ""}`}>
        <span className="rh-corner rh-corner-tl" />
        <span className="rh-corner rh-corner-tr" />
        <span className="rh-corner rh-corner-bl" />
        <span className="rh-corner rh-corner-br" />
        {active && <span className="rh-scan-line" />}
      </div>
    </div>
  );
}
