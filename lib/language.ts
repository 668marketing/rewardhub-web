export const LANGUAGES = [
  "en",
  "zh",
  "ms",
] as const;

export type Language =
  (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language =
  "en";

/*
 * All RewardHub pages must use exactly the same key.
 */
export const LANGUAGE_STORAGE_KEY =
  "rewardhub-language";

export const LANGUAGE_NAMES: Record<
  Language,
  string
> = {
  en: "English",
  zh: "中文",
  ms: "Bahasa Melayu",
};

export function isLanguage(
  value: unknown
): value is Language {
  return (
    typeof value === "string" &&
    LANGUAGES.includes(
      value as Language
    )
  );
}