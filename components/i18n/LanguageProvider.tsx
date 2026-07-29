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

import { translate } from "@/lib/i18n";

type TranslationVariables = Record<
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

type LanguageChangeEventDetail = {
  language?: string;
};

const LANGUAGE_CHANGE_EVENT =
  "rewardhub-language-change";

const LanguageContext =
  createContext<
    LanguageContextValue | undefined
  >(undefined);

type LanguageProviderProps = {
  children: ReactNode;
};

function readStoredLanguage(): Language {
  try {
    const storedLanguage =
      window.localStorage.getItem(
        LANGUAGE_STORAGE_KEY
      );

    if (isLanguage(storedLanguage)) {
      return storedLanguage;
    }
  } catch (error) {
    console.error(
      "Unable to read saved language:",
      error
    );
  }

  return DEFAULT_LANGUAGE;
}

export default function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [
    language,
    setLanguageState,
  ] = useState<Language>(
    DEFAULT_LANGUAGE
  );

  const [
    isLanguageReady,
    setIsLanguageReady,
  ] = useState(false);

  useEffect(() => {
    setLanguageState(
      readStoredLanguage()
    );

    setIsLanguageReady(true);
  }, []);

  useEffect(() => {
    const handleLanguageChange = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<
          LanguageChangeEventDetail
        >;

      const eventLanguage =
        customEvent.detail?.language;

      if (isLanguage(eventLanguage)) {
        setLanguageState(
          eventLanguage
        );

        return;
      }

      setLanguageState(
        readStoredLanguage()
      );
    };

    const handleStorageChange = (
      event: StorageEvent
    ) => {
      if (
        event.key !==
        LANGUAGE_STORAGE_KEY
      ) {
        return;
      }

      if (
        isLanguage(
          event.newValue
        )
      ) {
        setLanguageState(
          event.newValue
        );

        return;
      }

      setLanguageState(
        DEFAULT_LANGUAGE
      );
    };

    window.addEventListener(
      LANGUAGE_CHANGE_EVENT,
      handleLanguageChange
    );

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        LANGUAGE_CHANGE_EVENT,
        handleLanguageChange
      );

      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
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

        window.dispatchEvent(
          new CustomEvent<
            LanguageChangeEventDetail
          >(
            LANGUAGE_CHANGE_EVENT,
            {
              detail: {
                language:
                  nextLanguage,
              },
            }
          )
        );
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