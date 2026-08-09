"use client";

import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getImageUrl,
} from "@/lib/image";

type SafeImageProps = {
  src?: string;
  alt: string;
  className?: string;

  /*
   * Existing RewardHub pages already use these props.
   */
  fallbackLabel?: string;
  fallbackClassName?: string;
  width?: number;

  /*
   * Newer pages may provide a fully custom fallback.
   */
  fallback?: ReactNode;

  loading?: "eager" | "lazy";
};

export default function SafeImage({
  src = "",
  alt,
  className = "",
  fallbackLabel = "IMAGE",
  fallbackClassName = "",
  width = 1600,
  fallback,
  loading = "lazy",
}: SafeImageProps) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  const displayUrl =
    useMemo(
      () =>
        getImageUrl(
          src,
          width
        ),
      [
        src,
        width,
      ]
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
        className={[
          "flex h-full w-full items-center justify-center",
          "bg-slate-100 text-center",
          "font-black text-slate-300",
          fallbackClassName,
        ].join(" ")}
      >
        {fallback ?? fallbackLabel}
      </div>
    );
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => {
        setFailed(true);
      }}
      className={className}
    />
  );
}