"use client";

import { useI18n } from "@/components/locatomed/i18n-provider";
import { type Locale } from "@/lib/i18n/config";

const OPTIONS: Locale[] = ["fr", "ar", "en"];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
      <label className="sr-only" htmlFor="locale-switcher">
        {t("language.label", "Language")}
      </label>
      <select
        id="locale-switcher"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-700 outline-none focus:border-teal-400"
      >
        {OPTIONS.map((value) => (
          <option key={value} value={value}>
            {t(`language.${value}`, value.toUpperCase())}
          </option>
        ))}
      </select>
    </div>
  );
}
