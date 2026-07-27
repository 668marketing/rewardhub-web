"use client";

import {
  ExternalLink,
  Headset,
  LoaderCircle,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

const TAWK_DIRECT_CHAT_URL =
  "https://tawk.to/chat/6a66a6f1e36efe1d4eb18b53/1jugfo851";

export default function SupportModal() {
  const [isOpen, setIsOpen] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const openSupport =
    useCallback(() => {
      setIsLoading(true);
      setIsOpen(true);
    }, []);

  const closeSupport =
    useCallback(() => {
      setIsOpen(false);
    }, []);

  useEffect(() => {
    window.addEventListener(
      "rewardhub-open-support",
      openSupport
    );

    return () => {
      window.removeEventListener(
        "rewardhub-open-support",
        openSupport
      );
    };
  }, [openSupport]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        closeSupport();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [closeSupport, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[99999]
        flex items-end justify-center
        bg-slate-950/45
        backdrop-blur-[2px]
        sm:items-center
        sm:p-5
      "
      role="dialog"
      aria-modal="true"
      aria-label="RewardHub Customer Support"
    >
      <button
        type="button"
        aria-label="Close customer support"
        onClick={closeSupport}
        className="absolute inset-0 cursor-default"
      />

      <section
        className="
          relative z-10
          flex h-[92dvh] w-full
          flex-col overflow-hidden
          rounded-t-[28px]
          border border-white/20
          bg-white
          shadow-2xl
          sm:h-[min(760px,88vh)]
          sm:max-w-[440px]
          sm:rounded-[28px]
        "
      >
        <header
          className="
            flex min-h-20
            items-center justify-between
            border-b border-slate-200
            bg-slate-950
            px-5
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex h-11 w-11
                shrink-0 items-center justify-center
                rounded-2xl
                bg-amber-400
                text-slate-950
                shadow-sm
              "
            >
              <Headset className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-white">
                Customer Support
              </h2>

              <p className="truncate text-xs font-semibold text-slate-400">
                RewardHub Support Team
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={closeSupport}
              aria-label="Close customer support"
              title="Close"
              className="
                inline-flex h-10 w-10
                items-center justify-center
                rounded-xl
                border border-white/10
                bg-white/10
                text-white
                transition
                hover:bg-white/15
                active:scale-95
              "
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="relative flex-1 bg-white">
          {isLoading ? (
            <div
              className="
                absolute inset-0 z-10
                flex flex-col
                items-center justify-center
                bg-white
              "
            >
              <LoaderCircle className="h-7 w-7 animate-spin text-amber-500" />

              <p className="mt-3 text-sm font-bold text-slate-700">
                Loading customer support…
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait a moment.
              </p>
            </div>
          ) : null}

          <iframe
            key={
              isOpen
                ? "support-open"
                : "support-closed"
            }
            src={TAWK_DIRECT_CHAT_URL}
            title="RewardHub Customer Support"
            className="h-full w-full border-0"
            allow="microphone; camera; clipboard-read; clipboard-write"
            onLoad={() => {
              setIsLoading(false);
            }}
          />
        </div>

        <footer
          className="
            border-t border-slate-200
            bg-white
            px-5 py-3
            text-center
          "
        >
          <p className="text-[11px] font-medium text-slate-400">
            Never share passwords, OTP codes or banking PINs in chat.
          </p>
        </footer>
      </section>
    </div>
  );
}