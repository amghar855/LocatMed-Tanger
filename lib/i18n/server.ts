import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type Locale,
  getNestedValue,
  resolveLocale,
} from "@/lib/i18n/config";
import { messages } from "@/lib/i18n/messages";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  return resolveLocale(store.get(LOCALE_COOKIE_NAME)?.value);
}

export async function getServerTranslator() {
  const locale = await getServerLocale();

  const t = (key: string, fallback?: string) => {
    const localized = getNestedValue(messages[locale] as Record<string, unknown>, key);
    if (localized) return localized;

    const fromDefault = getNestedValue(
      messages[DEFAULT_LOCALE] as Record<string, unknown>,
      key
    );
    return fromDefault ?? fallback ?? key;
  };

  return { locale, t };
}
