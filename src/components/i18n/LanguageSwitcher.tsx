"use client";

import { Globe } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { localeNames, locales, stripLocale, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();

  function change(nextLocale: Locale) {
    document.cookie = `petsquare-locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const path = stripLocale(pathname);
    router.push(`/${nextLocale}${path === "/" ? "" : path}${search.size ? `?${search}` : ""}`);
  }

  return (
    <label className="relative flex items-center gap-1.5 text-sm text-navy/70">
      <Globe className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{t("chooseLanguage")}</span>
      <select
        value={locale}
        onChange={(event) => change(event.target.value as Locale)}
        aria-label={t("chooseLanguage")}
        className="cursor-pointer appearance-none bg-transparent pr-1 font-medium uppercase text-inherit outline-none"
      >
        {locales.map((code) => <option key={code} value={code}>{compact ? code : `${code.toUpperCase()} · ${localeNames[code]}`}</option>)}
      </select>
    </label>
  );
}
