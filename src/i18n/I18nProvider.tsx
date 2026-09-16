"use client";

import { createContext, useContext, useMemo } from "react";
import { localizeHref, type Locale } from "./config";
import { messages, type MessageKey } from "./messages";

type I18nValue = { locale: Locale; t: (key: MessageKey) => string; href: (path: string) => string };
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<I18nValue>(() => ({
    locale,
    t: (key) => messages[locale][key],
    href: (path) => localizeHref(path, locale),
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
