"use client";

type ScannerToolbarProps = {
  cameraCount: number;
  torchSupported: boolean;
  torchEnabled: boolean;
  busy: boolean;
  uploading: boolean;
  onUpload: () => void;
  onSwitchCamera: () => void;
  onToggleTorch: () => void;
};

export default function ScannerToolbar({
  cameraCount,
  torchSupported,
  torchEnabled,
  busy,
  uploading,
  onUpload,
  onSwitchCamera,
  onToggleTorch,
}: ScannerToolbarProps) {
  const cameraAvailable = cameraCount > 1;

  return (
    <div className="rh-toolbar">
      <button
        type="button"
        onClick={onUpload}
        disabled={busy || uploading}
        className="rh-tool-button rh-tool-primary"
      >
        <span className="rh-tool-icon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7a2 2 0 012-2h3l1.2-1.5h3.6L15 5h3a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="3.2"
              stroke="currentColor"
              strokeWidth="1.7"
            />
          </svg>
        </span>

        <span className="rh-tool-content">
          <strong>{uploading ? "Reading…" : "Upload QR"}</strong>
          <small>From gallery</small>
        </span>
      </button>

      <button
        type="button"
        onClick={onSwitchCamera}
        disabled={busy || !cameraAvailable}
        className="rh-tool-button"
      >
        <span className="rh-tool-icon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 7h10l2 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V9l2-2z"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <path
              d="M9 12a3 3 0 015-2M15 12a3 3 0 01-5 2"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <path
              d="M14 8.8v2.1h2.1M10 15.2v-2.1H7.9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <span className="rh-tool-content">
          <strong>Switch</strong>
          <small>{cameraAvailable ? "Front / rear" : "Unavailable"}</small>
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleTorch}
        disabled={busy || !torchSupported}
        className={`rh-tool-button ${
          torchEnabled ? "rh-tool-active" : ""
        }`}
      >
        <span className="rh-tool-icon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 3h6l-1 6h-4L9 3zM10 9h4l1 4-3 8-3-8 1-4z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <span className="rh-tool-content">
          <strong>{torchEnabled ? "Light on" : "Flashlight"}</strong>
          <small>{torchSupported ? "Tap to control" : "Unsupported"}</small>
        </span>
      </button>
    </div>
  );
}
