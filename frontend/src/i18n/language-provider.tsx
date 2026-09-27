"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import englishMessages from "./messages/en.json";
import portugueseMessages from "./messages/pt-BR.json";

export const supportedLocales = ["pt-BR", "en"] as const;
export type Locale = (typeof supportedLocales)[number];
export type TranslationKey = keyof typeof portugueseMessages;
type TranslationValues = Record<string, string | number>;

const storageKey = "crowdtube.locale";
const defaultLocale: Locale = "pt-BR";
const localeListeners = new Set<() => void>();
const catalogs: Record<Locale, Partial<Record<TranslationKey, string>>> = {
  "pt-BR": portugueseMessages,
  en: englishMessages,
};

type LanguageContextValue = {
  locale: Locale;
  intlLocale: string;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

export type Translate = LanguageContextValue["t"];

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLocale(value: string | null): value is Locale {
  return supportedLocales.some((locale) => locale === value);
}

function getLocaleSnapshot(): Locale {
  const storedLocale = window.localStorage.getItem(storageKey);
  return isLocale(storedLocale) ? storedLocale : defaultLocale;
}

function getServerLocaleSnapshot(): Locale {
  return defaultLocale;
}

function subscribeToLocale(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) onStoreChange();
  };

  localeListeners.add(onStoreChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    localeListeners.delete(onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function interpolate(message: string, values: TranslationValues = {}) {
  return message.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    values[key] === undefined ? placeholder : String(values[key]),
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem(storageKey, nextLocale);
    localeListeners.forEach((listener) => listener());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: TranslationKey, values?: TranslationValues) => {
    const message = catalogs[locale][key] ?? portugueseMessages[key] ?? key;
    return interpolate(message, values);
  }, [locale]);

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    intlLocale: locale === "en" ? "en-US" : "pt-BR",
    setLocale,
    t,
  }), [locale, setLocale, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
