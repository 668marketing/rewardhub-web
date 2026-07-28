import en from "@/locales/en";
import zh from "@/locales/zh";
import ms from "@/locales/ms";

import type {
  Language,
} from "@/lib/language";

export type TranslationValue =
  | string
  | TranslationDictionary;

export type TranslationDictionary = {
  [key: string]: TranslationValue;
};

export const dictionaries: Record<
  Language,
  TranslationDictionary
> = {
  en,
  zh,
  ms,
};

function getNestedValue(
  dictionary: TranslationDictionary,
  key: string
): string | undefined {
  const parts =
    key.split(".");

  let current:
    TranslationValue =
    dictionary;

  for (const part of parts) {
    if (
      typeof current !==
        "object" ||
      current === null ||
      !(part in current)
    ) {
      return undefined;
    }

    current =
      current[part];
  }

  return typeof current ===
    "string"
    ? current
    : undefined;
}

export function translate(
  language: Language,
  key: string,
  variables?: Record<
    string,
    string | number
  >
): string {
  const selectedValue =
    getNestedValue(
      dictionaries[language],
      key
    );

  const fallbackValue =
    getNestedValue(
      dictionaries.en,
      key
    );

  let result =
    selectedValue ??
    fallbackValue ??
    key;

  if (variables) {
    Object.entries(
      variables
    ).forEach(
      ([variable, value]) => {
        result =
          result.replaceAll(
            `{{${variable}}}`,
            String(value)
          );
      }
    );
  }

  return result;
}