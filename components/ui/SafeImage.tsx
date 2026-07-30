"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

type SafeImageProps = {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallback?: ReactNode;
  loading?: "eager" | "lazy";
};

export default function SafeImage({
  src = "",
  alt,
  className = "",
  fallbackClassName = "",
  fallback,
  loading = "lazy",
}: SafeImageProps) {
  const [failed, setFailed] =
    useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={[
          "flex h-full w-full items-center justify-center",
          "bg-gradient-to-br from-slate-100 to-slate-200",
          "text-slate-400",
          fallbackClassName,
        ].join(" ")}
        role="img"
        aria-label={alt}
      >
        {fallback || (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              🛍️
            </div>

            <p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em]">
              No Image
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        setFailed(true);
      }}
    />
  );
}