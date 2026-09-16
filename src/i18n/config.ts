export const locales = ["en", "de", "fr", "it", "es", "pl", "ro", "cs", "hu", "pt"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookie = "petsquare-locale";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  es: "Español",
  pl: "Polski",
  ro: "Română",
  cs: "Čeština",
  hu: "Magyar",
  pt: "Português",
};

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function localeFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return isLocale(segment) ? segment : null;
}

export function stripLocale(pathname: string) {
  const locale = localeFromPathname(pathname);
  if (!locale) return pathname;
  const stripped = pathname.slice(locale.length + 1);
  return stripped || "/";
}

export function localizeHref(href: string, locale: Locale) {
  if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/api/")) return href;
  const [pathAndQuery, hash = ""] = href.split("#", 2);
  const cleanPath = stripLocale(pathAndQuery);
  return `/${locale}${cleanPath === "/" ? "" : cleanPath}${hash ? `#${hash}` : ""}`;
}
