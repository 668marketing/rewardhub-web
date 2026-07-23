"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  getImageUrl,
} from "@/lib/image";

type SmartImageProps = {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  fallbackClassName?: string;
  width?: number;
  loading?: "eager" | "lazy";
};

export default function SmartImage({
  src = "",
  alt,
  className = "",
  fallbackLabel = "IMAGE",
  fallbackClassName = "",
  width = 1600,
  loading = "lazy",
}: SmartImageProps) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  const displayUrl =
    getImageUrl(
      src,
      width
    );

  useEffect(() => {
    setFailed(false);
  }, [displayUrl]);

  if (
    !displayUrl ||
    failed
  ) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex h-full w-full items-center justify-center bg-slate-100 text-center font-black text-slate-300 ${fallbackClassName}`}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() =>
        setFailed(true)
      }
      className={className}
    />
  );
}
