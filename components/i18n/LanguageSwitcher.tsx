"use client";

import {
  Globe2,
} from "lucide-react";

import {
  LANGUAGE_NAMES,
  LANGUAGES,
  type Language,
} from "@/lib/language";

import {
  useLanguage,
} from "@/hooks/useLanguage";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export default function LanguageSwitcher({
  className = "",
  compact = false,
}: LanguageSwitcherProps) {
  const {
    language,
    setLanguage,
    t,
  } = useLanguage();

  return (
    <label
      className={[
        "inline-flex items-center gap-2",
        "rounded-xl border border-slate-200",
        "bg-white px-3 py-2",
        "text-sm text-slate-700",
        "shadow-sm",
        className,
      ].join(" ")}
    >
      <Globe2
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      />

      {!compact && (
        <span className="sr-only">
          {t(
            "languageSwitcher.label"
          )}
        </span>
      )}

      <select
        value={language}
        aria-label={t(
          "languageSwitcher.label"
        )}
        onChange={(event) => {
          setLanguage(
            event.target
              .value as Language
          );
        }}
        className={[
          "cursor-pointer appearance-none",
          "border-0 bg-transparent",
          "font-medium text-slate-700",
          "outline-none",
          compact
            ? "max-w-[105px]"
            : "min-w-[130px]",
        ].join(" ")}
      >
        {LANGUAGES.map(
          (item) => (
            <option
              key={item}
              value={item}
            >
              {
                LANGUAGE_NAMES[
                  item
                ]
              }
            </option>
          )
        )}
      </select>
    </label>
  );
}