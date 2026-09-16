// scraper/extractors/jsonld.js
//
// Parses <script type="application/ld+json"> blocks for schema.org Product /
// Offer data. This is the most common structured-data format across
// WooCommerce, Magento, and most custom storefronts that bother with SEO.

import * as cheerio from "cheerio";

function toArray(v) {
  return Array.isArray(v) ? v : v ? [v] : [];
}

function flattenGraph(json) {
  // Some sites wrap everything in a top-level @graph array.
  if (json["@graph"]) return json["@graph"];
  return [json];
}

function parsePrice(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function extractJsonLd(html, pageUrl) {
  const $ = cheerio.load(html);
  const products = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    let json;
    try {
      json = JSON.parse($(el).contents().text());
    } catch {
      return; // malformed JSON-LD — skip, don't crash the whole page
    }

    for (const raw of toArray(json)) {
      for (const node of flattenGraph(raw)) {
        const type = toArray(node["@type"]).map(String);
        if (!type.includes("Product")) continue;

        const offers = toArray(node.offers);
        const offer = offers[0];
        if (!offer) continue;

        // Structured discount data: priceSpecification with an original price,
        // or a plain price + separate "highPrice"/compare field some sites add.
        const discountPrice = parsePrice(offer.price ?? offer.lowPrice);
        const originalPrice =
          parsePrice(offer.priceSpecification?.price) ??
          parsePrice(node.highPrice) ??
          discountPrice;

        if (discountPrice == null) continue;

        const availabilityRaw = String(offer.availability || "").toLowerCase();
        let availability = "unknown";
        if (availabilityRaw.includes("instock")) availability = "in_stock";
        else if (availabilityRaw.includes("outofstock")) availability = "out_of_stock";
        else if (availabilityRaw.includes("limitedavailability")) availability = "limited";

        products.push({
          name: node.name,
          description: (node.description || "").trim(),
          imageUrl: Array.isArray(node.image) ? node.image[0] : node.image ?? null,
          originalPrice,
          discountPrice,
          currency: offer.priceCurrency ?? null,
          availability,
          sourceUrl: pageUrl,
        });
      }
    }
  });

  return products;
}
