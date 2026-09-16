import SupportChat from "@/components/landing/SupportChat";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, noFlashThemeScript } from "@/components/theme/ThemeProvider";
import { headers } from "next/headers";
import { defaultLocale, isLocale } from "@/i18n/config";
import { I18nProvider } from "@/i18n/I18nProvider";

// NOTE: fonts are loaded via a <link> tag rather than next/font/google.
// next/font/google fetches font files at BUILD time, which fails in
// network-restricted environments (like this sandbox). A <link> tag fetches
// at runtime in the browser instead, so the build always succeeds and the
// fonts still load correctly once deployed (falls back to the system stack
// in globals.css if the request is ever blocked).

export const metadata: Metadata = {
  title: "PetSquare — Discover Better Deals. Find Trusted Pet Care.",
  description:
    "Discover pet stores, products, services and exclusive deals from trusted vendors across Europe, all in one place.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const requestedLocale = (await headers()).get("x-petsquare-locale") ?? defaultLocale;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  return (
    <html lang={locale} className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Sets data-theme before first paint if the user previously chose
            Midnight OLED, so there's no flash of the default Nord & Forest
            theme on load. Default (Nord & Forest) needs no attribute. */}
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-paper">
        <ThemeProvider><I18nProvider locale={locale}>{children}<SupportChat /></I18nProvider></ThemeProvider>
      </body>
    </html>
  );
}
