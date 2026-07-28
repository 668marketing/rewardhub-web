export const LANGUAGES = [
  "en",
  "zh",
  "ms",
] as const;

export type Language =
  (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language =
  "en";

export const LANGUAGE_STORAGE_KEY =
  "rewardhub_language";

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
  return LANGUAGES.includes(
    value as Language
  );
}