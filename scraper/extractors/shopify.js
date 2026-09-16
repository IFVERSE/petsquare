// scraper/extractors/shopify.js
//
// Many independent pet stores run on Shopify, which exposes a public
// products.json endpoint with structured price data — by far the most
// reliable extraction path when it's available, so we always try it first.

function parsePrice(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export async function extractShopify(baseUrl) {
  const url = new URL("/products.json?limit=100", baseUrl).toString();

  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "PetSquareBot/1.0" } });
  } catch {
    return null; // not reachable — let the caller fall through to the next strategy
  }
  if (!res.ok) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    return null; // not actually a Shopify store (some other JSON/HTML at this path)
  }

  const products = Array.isArray(data.products) ? data.products : null;
  if (!products) return null;

  const results = [];
  for (const p of products) {
    const variant = (p.variants ?? [])[0];
    if (!variant) continue;

    const discountPrice = parsePrice(variant.price);
    const originalPrice = parsePrice(variant.compare_at_price) ?? discountPrice;
    if (discountPrice == null || originalPrice == null) continue;

    results.push({
      name: p.title,
      description: stripHtml(p.body_html).trim(),
      imageUrl: p.images?.[0]?.src ?? p.image?.src ?? null,
      originalPrice,
      discountPrice,
      currency: null, // Shopify's public JSON doesn't include currency; caller infers from country
      availability: variant.available ? "in_stock" : "out_of_stock",
      sourceUrl: new URL(`/products/${p.handle}`, baseUrl).toString(),
    });
  }

  return results.filter((p) => p.discountPrice < p.originalPrice);
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}
