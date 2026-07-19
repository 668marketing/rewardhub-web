"use client";

import { useEffect, useState } from "react";

export default function MerchantGallery({
  gallery,
}: {
  gallery: any[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const photos = Array.isArray(gallery)
    ? gallery.filter((item) => item?.imageUrl)
    : [];

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow = "";
    };
  }, [lightboxOpen, currentIndex, photos.length]);

  if (photos.length === 0) {
    return null;
  }

  function showPrevious() {
    setCurrentIndex((current) =>
      current === 0
        ? photos.length - 1
        : current - 1
    );
  }

  function showNext() {
    setCurrentIndex((current) =>
      current === photos.length - 1
        ? 0
        : current + 1
    );
  }

  function openPhoto(index: number) {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }

  const currentPhoto = photos[currentIndex];

  return (
    <>
      <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              Gallery
            </h2>

            <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
              View photos from this merchant.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-500 sm:px-4 sm:py-2 sm:text-xs">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-[1.5rem] bg-slate-950 sm:mt-6 sm:rounded-[2rem]">
          <button
            type="button"
            onClick={() => openPhoto(currentIndex)}
            className="block w-full"
            aria-label="Open gallery photo"
          >
            <img
              src={getDisplayImageUrl(
                currentPhoto.imageUrl
              )}
              alt={
                currentPhoto.title ||
                "Merchant gallery"
              }
              className="aspect-[4/3] w-full object-cover sm:aspect-[16/9]"
            />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

          {currentPhoto.title && (
            <div className="pointer-events-none absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-5">
              <p className="text-sm font-black text-white sm:text-lg">
                {currentPhoto.title}
              </p>
            </div>
          )}

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-xl font-black text-white backdrop-blur-md transition hover:bg-black/75 sm:left-5 sm:h-12 sm:w-12"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={showNext}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-xl font-black text-white backdrop-blur-md transition hover:bg-black/75 sm:right-5 sm:h-12 sm:w-12"
              >
                ›
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => openPhoto(currentIndex)}
            className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-2 text-[10px] font-black text-white backdrop-blur-md sm:right-5 sm:top-5 sm:px-4 sm:text-xs"
          >
            ⛶ View Fullscreen
          </button>
        </div>

        {photos.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2 overflow-x-auto pb-1">
            {photos.slice(0, 20).map(
              (item, index) => (
                <button
                  key={
                    item.galleryId ||
                    item.imageUrl ||
                    index
                  }
                  type="button"
                  onClick={() =>
                    setCurrentIndex(index)
                  }
                  aria-label={`View photo ${
                    index + 1
                  }`}
                  className={`h-2.5 shrink-0 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-8 bg-slate-950"
                      : "w-2.5 bg-slate-300"
                  }`}
                />
              )
            )}

            {photos.length > 20 && (
              <span className="ml-1 text-[10px] font-black text-slate-400">
                +{photos.length - 20}
              </span>
            )}
          </div>
        )}
      </section>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-3 sm:p-6"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl font-black text-white backdrop-blur-md sm:right-6 sm:top-6"
            aria-label="Close gallery"
          >
            ✕
          </button>

          <div
            className="relative flex h-full w-full max-w-7xl items-center justify-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <img
              src={getDisplayImageUrl(
                currentPhoto.imageUrl
              )}
              alt={
                currentPhoto.title ||
                "Merchant gallery"
              }
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl sm:rounded-2xl"
            />

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="Previous photo"
                  className="absolute left-1 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl font-black text-white backdrop-blur-md sm:left-5 sm:h-14 sm:w-14"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Next photo"
                  className="absolute right-1 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl font-black text-white backdrop-blur-md sm:right-5 sm:h-14 sm:w-14"
                >
                  ›
                </button>
              </>
            )}

            <div className="absolute inset-x-4 bottom-4 text-center sm:bottom-6">
              {currentPhoto.title && (
                <p className="text-sm font-black text-white sm:text-lg">
                  {currentPhoto.title}
                </p>
              )}

              <p className="mt-1 text-xs font-bold text-white/60">
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getDriveFileId(url: string) {
  if (!url) return "";

  const idFromQuery = url.match(
    /[?&]id=([^&]+)/
  );

  if (idFromQuery?.[1]) {
    return idFromQuery[1];
  }

  const idFromPath = url.match(
    /\/d\/([^/]+)/
  );

  if (idFromPath?.[1]) {
    return idFromPath[1];
  }

  return "";
}

function getDisplayImageUrl(url: string) {
  return url || "";
}