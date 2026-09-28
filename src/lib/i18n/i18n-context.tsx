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
import { useQueryClient } from "@tanstack/react-query";
import { getLocale, setLocale, type Locale } from "@/i18n/locale";
import { translations, type Lang } from "./translations";

const STORAGE_KEY = "siteLang";

interface I18nContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "ar";
  // the NEXT_LOCALE cookie is the plan's contract (§4.1); localStorage keeps
  // the legacy marketing pages in sync
  const fromCookie = getLocale();
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "ar") {
    if (saved !== fromCookie) setLocale(saved);
    return saved;
  }
  return fromCookie;
}

function applyDocumentLang(lang: Lang) {
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lang);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const queryClient = useQueryClient();

  useEffect(() => {
    const initial = readInitialLang();
    setLangState(initial);
    applyDocumentLang(initial);
  }, []);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      window.localStorage.setItem(STORAGE_KEY, next);
      setLocale(next as Locale);
      applyDocumentLang(next);
      // API message/*_label fields come translated via Accept-Language — refetch
      queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const t = useCallback(
    (key: string) => {
      const val = translations[lang]?.[key] ?? translations.ar[key];
      return typeof val === "string" ? val : key;
    },
    [lang]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, t }),
    [lang, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
