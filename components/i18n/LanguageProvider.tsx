"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isLanguage,
  type Language,
} from "@/lib/language";

import {
  translate,
} from "@/lib/i18n";

type TranslationVariables =
  Record<
    string,
    string | number
  >;

type LanguageContextValue = {
  language: Language;

  setLanguage: (
    language: Language
  ) => void;

  t: (
    key: string,
    variables?: TranslationVariables
  ) => string;

  isLanguageReady: boolean;
};

const LanguageContext =
  createContext<
    LanguageContextValue | undefined
  >(undefined);

type LanguageProviderProps = {
  children: ReactNode;
};

export default function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [
    language,
    setLanguageState,
  ] =
    useState<Language>(
      DEFAULT_LANGUAGE
    );

  const [
    isLanguageReady,
    setIsLanguageReady,
  ] =
    useState(false);

  useEffect(() => {
    try {
      const storedLanguage =
        window.localStorage.getItem(
          LANGUAGE_STORAGE_KEY
        );

      if (
        isLanguage(
          storedLanguage
        )
      ) {
        setLanguageState(
          storedLanguage
        );
      }
    } catch (error) {
      console.error(
        "Unable to read saved language:",
        error
      );
    } finally {
      setIsLanguageReady(
        true
      );
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang =
      language;
  }, [language]);

  const setLanguage =
    useCallback(
      (
        nextLanguage:
          Language
      ) => {
        setLanguageState(
          nextLanguage
        );

        try {
          window.localStorage.setItem(
            LANGUAGE_STORAGE_KEY,
            nextLanguage
          );
        } catch (error) {
          console.error(
            "Unable to save language:",
            error
          );
        }
      },
      []
    );

  const t =
    useCallback(
      (
        key: string,
        variables?: TranslationVariables
      ) => {
        return translate(
          language,
          key,
          variables
        );
      },
      [language]
    );

  const contextValue =
    useMemo(
      () => ({
        language,
        setLanguage,
        t,
        isLanguageReady,
      }),
      [
        language,
        setLanguage,
        t,
        isLanguageReady,
      ]
    );

  return (
    <LanguageContext.Provider
      value={contextValue}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider."
    );
  }

  return context;
}