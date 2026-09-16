import type { Locale } from "@/i18n/config";

type LibreTranslateResponse = { translatedText?: string | string[]; error?: string };

/** Server-only adapter for translating imported vendor or CMS content. */
export async function translateContent(text: string[], target: Exclude<Locale, "en">) {
  const endpoint = process.env.LIBRETRANSLATE_URL;
  if (!endpoint) throw new Error("LIBRETRANSLATE_URL is not configured");

  const response = await fetch(`${endpoint.replace(/\/$/, "")}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: "en",
      target,
      format: "text",
      ...(process.env.LIBRETRANSLATE_API_KEY ? { api_key: process.env.LIBRETRANSLATE_API_KEY } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const result = (await response.json()) as LibreTranslateResponse;
  if (!response.ok || !result.translatedText) {
    throw new Error(result.error || `Translation provider returned ${response.status}`);
  }
  return Array.isArray(result.translatedText) ? result.translatedText : [result.translatedText];
}
