// scraper/lib/extract-products.js
import { extractShopify } from "../extractors/shopify.js";
import { extractJsonLd } from "../extractors/jsonld.js";
import { extractHeuristic } from "../extractors/heuristic.js";
import { discoverProductLinks } from "./discover-links.js";
import { checkImageUrl } from "./website-checker.js";
import { inferSpecies } from "./infer-species.js";
import { config } from "../config.js";

/**
 * Rules 10–18: discover product pages on a vendor's site and extract
 * validated discount listings from them, trying the most reliable strategy
 * first and falling back only when it comes up empty.
 *
 * @param {string} baseUrl vendor's verified website
 * @param {string} homepageHtml already-fetched homepage HTML (from checkWebsite)
 * @param {string} defaultCurrency fallback currency (from the vendor's country) when a page doesn't state one
 */
export async function extractProducts(baseUrl, homepageHtml, defaultCurrency) {
  const raw = [];

  // Strategy 1: Shopify JSON feed — cheapest and most reliable when present.
  const shopifyProducts = await extractShopify(baseUrl);
  if (shopifyProducts && shopifyProducts.length > 0) {
    raw.push(...shopifyProducts.filter((p) => p.discountPrice < p.originalPrice));
  }

  // Strategy 2 + 3: crawl a handful of likely product pages and try
  // JSON-LD first, heuristic HTML parsing second.
  if (raw.length === 0) {
    const links = discoverProductLinks(homepageHtml, baseUrl);
    for (const link of links) {
      try {
        const res = await fetch(link, {
          signal: AbortSignal.timeout(10000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; PetSquareBot/1.0)" },
        });
        if (!res.ok) continue;
        const html = await res.text();

        const jsonLdProducts = extractJsonLd(html, link).filter((p) => p.discountPrice < p.originalPrice);
        if (jsonLdProducts.length > 0) {
          raw.push(...jsonLdProducts);
          continue;
        }

        raw.push(...extractHeuristic(html, link));
      } catch {
        continue; // one broken product page shouldn't sink the whole vendor
      }
    }
  }

  // Rules 12–15, 17–19: normalize, validate, and enrich each candidate.
  const validated = [];
  for (const p of raw) {
    if (!p.name || !p.description) continue; // Rule 17: meaningful description required
    if (!p.originalPrice || !p.discountPrice) continue; // Rules 12–13
    if (p.discountPrice >= p.originalPrice) continue; // Rule 11: must be an actual discount

    const discountPercent = +(((p.originalPrice - p.discountPrice) / p.originalPrice) * 100).toFixed(2); // Rule 14
    if (discountPercent < config.minDiscountPercent || discountPercent > config.maxDiscountPercent) continue;

    const imageOk = await checkImageUrl(p.imageUrl); // Rule 16


    validated.push({
      name: p.name.trim(),
      description: p.description.trim(),
      imageUrl: imageOk ? p.imageUrl : null,
      species: inferSpecies(p.name, p.description),
      originalPrice: p.originalPrice,
      discountPrice: p.discountPrice,
      discountPercent,
      currency: p.currency || defaultCurrency || "EUR",
      availability: p.availability === "unknown" ? "in_stock" : p.availability, // Rule 18
      dealStartsAt: p.dealStartsAt ?? null,
      dealEndsAt: p.dealEndsAt ?? null, // Rule 15: only ever set when explicitly found
      sourceUrl: p.sourceUrl,
      lastChecked: new Date().toISOString(), // Rule 19
    });
  }

  return validated;
}
