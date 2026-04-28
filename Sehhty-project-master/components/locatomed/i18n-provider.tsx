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
import { useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  localeToDir,
  type Locale,
  getNestedValue,
  resolveLocale,
} from "@/lib/i18n/config";
import { messages } from "@/lib/i18n/messages";

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: string, fallback?: string) => string;
  setLocale: (nextLocale: Locale) => Promise<void>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(resolveLocale(initialLocale));
  const router = useRouter();

  const dir = useMemo(() => localeToDir(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const local = getNestedValue(messages[locale] as Record<string, unknown>, key);
      if (local) return local;

      const fromDefault = getNestedValue(
        messages[DEFAULT_LOCALE] as Record<string, unknown>,
        key
      );
      return fromDefault ?? fallback ?? key;
    },
    [locale]
  );

  const setLocale = useCallback(
    async (nextLocale: Locale) => {
      const resolved = resolveLocale(nextLocale);
      if (resolved === locale) return;

      setLocaleState(resolved);

      try {
        await fetch("/api/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: resolved }),
        });
      } finally {
        router.refresh();
      }
    },
    [locale, router]
  );

  return (
    <I18nContext.Provider value={{ locale, dir, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
