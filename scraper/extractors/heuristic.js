// scraper/extractors/heuristic.js
//
// Last-resort strategy for stores that expose neither a Shopify JSON feed nor
// schema.org JSON-LD. This is inherently fuzzy — arbitrary HTML has no fixed
// structure — so it only looks for very common WooCommerce/Magento/generic
// class-naming conventions. Expect this to need per-site tuning in practice;
// it's a reasonable starting point, not a universal parser.

import * as cheerio from "cheerio";

const CURRENCY_SYMBOLS = { "€": "EUR", "£": "GBP", "$": "USD", "zł": "PLN", "Kč": "CZK", "Ft": "HUF", kr: "SEK" };
const PRICE_RE = /([€£$]|zł|Kč|Ft|kr)?\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s?(€|zł|Kč|Ft|kr|lei|RON)?/;
const PERCENT_RE = /-?\s?(\d{1,2})\s?%/;

function parseAmount(text) {
  const m = text.match(PRICE_RE);
  if (!m) return null;
  const numeric = m[2].replace(/\./g, (match) => (m[2].includes(",") ? "" : match)).replace(",", ".");
  const amount = parseFloat(numeric);
  if (!Number.isFinite(amount)) return null;
  const currency = CURRENCY_SYMBOLS[m[1]] || CURRENCY_SYMBOLS[m[3]] || null;
  return { amount, currency };
}

const OLD_PRICE_SELECTORS = "del, s, strike, .old-price, .regular-price, .was-price, .price--compare, .compare-at-price";
const NEW_PRICE_SELECTORS = ".sale-price, .special-price, .current-price, .now-price, .price--sale, ins";
const GENERIC_PRICE_SELECTOR = "[class*=price], [itemprop=price]";
const AVAILABLE_RE = /in stock|available|verfügbar|na stanie|dostupné|elérhető|em stoque|en stock/i;
const OUT_OF_STOCK_RE = /out of stock|sold out|vergriffen|niedostępny|vyprodáno|elfogyott|rupture de stock/i;

export function extractHeuristic(html, pageUrl) {
  const $ = cheerio.load(html);
  const bodyText = $("body").text();

  const oldPriceEl = $(OLD_PRICE_SELECTORS).first();
  const newPriceEl = $(NEW_PRICE_SELECTORS).first();

  let original = oldPriceEl.length ? parseAmount(oldPriceEl.text()) : null;
  let discount = newPriceEl.length ? parseAmount(newPriceEl.text()) : null;

  // Fallback: no explicit old/new split found — look at generic price elements
  // and a nearby discount-percent badge to back-calculate the original price.
  if (!original || !discount) {
    const genericPrices = $(GENERIC_PRICE_SELECTOR)
      .map((_, el) => parseAmount($(el).text()))
      .get()
      .filter(Boolean);

    if (genericPrices.length >= 2) {
      genericPrices.sort((a, b) => b.amount - a.amount);
      original = original ?? genericPrices[0];
      discount = discount ?? genericPrices[genericPrices.length - 1];
    } else if (genericPrices.length === 1) {
      const pctMatch = bodyText.match(PERCENT_RE);
      if (pctMatch) {
        discount = discount ?? genericPrices[0];
        const pct = parseFloat(pctMatch[1]) / 100;
        original = original ?? { amount: +(discount.amount / (1 - pct)).toFixed(2), currency: discount.currency };
      }
    }
  }

  if (!original || !discount || discount.amount >= original.amount) {
    return []; // no discernible discount on this page — not a candidate deal
  }

  const name =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim();

  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    $("p").first().text().trim();

  const imageUrl = $('meta[property="og:image"]').attr("content") || $("img").first().attr("src") || null;

  let availability = "unknown";
  if (OUT_OF_STOCK_RE.test(bodyText)) availability = "out_of_stock";
  else if (AVAILABLE_RE.test(bodyText)) availability = "in_stock";

  return [
    {
      name: name?.slice(0, 200),
      description: description?.slice(0, 500) || "",
      imageUrl,
      originalPrice: original.amount,
      discountPrice: discount.amount,
      currency: original.currency || discount.currency,
      availability,
      sourceUrl: pageUrl,
    },
  ];
}
