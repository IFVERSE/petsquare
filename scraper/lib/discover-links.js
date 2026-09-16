// scraper/lib/discover-links.js
import * as cheerio from "cheerio";

const PRODUCT_PATH_HINTS = [
  "/product/", "/products/", "/shop/", "/produkt/", "/produkty/", "/produit/",
  "/prodotto/", "/producto/", "/produto/", "/artikel/", "/item/", "/p/",
];

/**
 * Rule 10: find candidate product page URLs on a vendor's homepage by
 * looking for links whose path matches common e-commerce product URL
 * conventions across the target languages.
 */
export function discoverProductLinks(html, baseUrl, limit = 15) {
  const $ = cheerio.load(html);
  const origin = new URL(baseUrl).origin;
  const found = new Set();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    let abs;
    try {
      abs = new URL(href, baseUrl).toString();
    } catch {
      return;
    }

    if (!abs.startsWith(origin)) return; // stay on the same site
    const path = new URL(abs).pathname.toLowerCase();
    if (PRODUCT_PATH_HINTS.some((hint) => path.includes(hint))) {
      found.add(abs.split("#")[0]);
    }
  });

  return Array.from(found).slice(0, limit);
}
