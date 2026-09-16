// scraper/validate.js
import { enrichWebsite } from "./lib/website-enrichment.js";
import { europe } from "../shared/europe.js";
import { config } from "./config.js";
import { checkWebsite } from "./lib/website-checker.js";
import { extractProducts } from "./lib/extract-products.js";

/**
 * Runs a Google Place record through all 19 rules and returns either an
 * accepted vendor+products record, or a rejection with the specific reasons.
 *
 * This function deliberately does NOT throw on a failed rule — it collects
 * every reason so a human reviewing the scraper's output (or the "Review
 * Results" admin action from the Phase 6 spec) can see exactly why a
 * business was excluded, rather than a single opaque failure.
 */
export async function validateVendor(place) {
  const reasons = [];
  const osmDiscovered = place.discoverySource === "osm";
  const withoutReviews = osmDiscovered || place.discoverySource === "tavily_ai";

  // Rule 1 — Business category
  const nameAndTypes = `${place.name} ${place.types.join(" ")}`.toLowerCase();
  const looksLikePetBusiness =
    place.types.some((t) => config.allowedPlaceTypes.includes(t)) ||
    config.categoryKeywords.some((kw) => nameAndTypes.includes(kw));
  if (!looksLikePetBusiness) reasons.push("not_a_pet_business_category");

  // Rule 2 — Google Place ID
  if (!place.placeId) reasons.push("missing_place_id");

  // Rule 3 — Business status
  if (place.businessStatus !== "OPERATIONAL" && !(osmDiscovered && place.businessStatus === "UNKNOWN")) reasons.push("not_operational");

  // Rule 4 — Website availability (existence check; reachability is Rule 9)
  if (!place.website) reasons.push("no_website_listed");

  // Rule 5 — Rating range
  if (!withoutReviews && (place.rating == null || place.rating < config.minRating || place.rating > config.maxRating)) {
    reasons.push("rating_out_of_range");
  }

  // Rule 6 — Review count floor (see config.js note on the advisory upper band)
  if (!withoutReviews && (place.reviewCount ?? 0) < config.minReviews) reasons.push("too_few_reviews");
  const reviewCountAdvisory = (place.reviewCount ?? 0) > config.reviewBandUpperAdvisory;

  // Rule 7 — Contact details
  if (!withoutReviews && !place.phone) reasons.push("missing_phone");

  // Rule 8 — Location
  if (!withoutReviews && (!place.address || place.lat == null || place.lng == null)) reasons.push("missing_location");

  // Bail out before spending an HTTP request if the vendor already fails a
  // hard, unfixable rule — no point checking a website that doesn't exist.
  if (reasons.length > 0) {
    return { accepted: false, place, reasons, reviewCountAdvisory };
  }

  // Rule 9 — Website verification (reachable, functional, not parked/redirected)
  const site = await checkWebsite(place.website);
  if (!site.ok) {
    return { accepted: false, place, reasons: [`website_check_failed:${site.reason}`], reviewCountAdvisory };
  }

  // Rules 10–19 — product discovery, discount validation, enrichment
  const defaultCurrency = europe[place.country]?.[3] ?? config.currencyByCountry[place.country] ?? "EUR";
  const products = await extractProducts(place.website, site.html, defaultCurrency);

  if (!withoutReviews && products.length === 0) {
    return { accepted: false, place, reasons: ["no_valid_discounted_product_found"], reviewCountAdvisory };
  }

  const discovery = await enrichWebsite(site.finalUrl || place.website, site.html, products);

  // Final Acceptance Rule
  const vendorSpecies = Array.from(new Set(products.flatMap((p) => p.species)));

  return {
    accepted: true,
    reviewCountAdvisory,
    vendor: {
      placeId: place.placeId,
      name: place.name,
      category: inferCategory(place.types),
      species: vendorSpecies,
      address: place.address,
      city: place.city,
      country: place.country,
      lat: place.lat,
      lng: place.lng,
      phone: place.phone,
      website: place.website,
      description: place.description ?? null,
      discovery,
      coverImageUrl: discovery.images[0] ?? null,
      googleRating: place.rating,
      reviewCount: place.reviewCount,
      businessStatus: place.businessStatus,
      badges: [...(!withoutReviews ? ["business_verified"] : []), "website_verified", ...(products.length ? ["deal_verified"] : [])],
      lastVerified: new Date().toISOString(),
      lastScraped: new Date().toISOString(),
    },
    products,
  };
}

function inferCategory(types) {
  if (types.includes("veterinary_care")) return "veterinary";
  if (types.includes("pet_grooming")) return "grooming";
  if (types.includes("pet_boarding")) return "boarding";
  if (types.includes("pet_training")) return "training";
  for (const category of ["walking", "shelter", "memorial", "breeding"]) if (types.includes(`pet_${category}`)) return category;
  return "retailer";
}
