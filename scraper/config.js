// scraper/config.js
//
// All the tunable thresholds from the "Vendor & Product Filtering Rules" spec
// live here so the pipeline in validate.js stays readable.

export const config = {
  // Rule 1 — Business Category
  // Google Places `types` that qualify a business as a legitimate pet vendor,
  // plus a name/keyword fallback for when Places mis-categorizes a listing.
  allowedPlaceTypes: ["pet_store", "veterinary_care", "pet_grooming", "pet_boarding", "pet_training", "pet_walking", "pet_shelter", "pet_memorial", "pet_breeding"],
  categoryKeywords: [
    "pet", "pets", "animal", "vet", "veterinar", "aquarium", "zoo",
    "tierbedarf", "zoofachhandel", "sklep zoologiczny", "animale",
    "mascotas", "zvirata", "állat",
  ],

  // Rules 5–6 — Google rating & review count
  minRating: 3.0,
  maxRating: 5.0,
  minReviews: 3,
  // The spec says "3–20 reviews to improve reliability", which reads like an
  // example band rather than a hard ceiling (a 500-review vendor is not less
  // reliable). We enforce the floor strictly and treat the upper bound as a
  // soft/advisory flag instead of an outright rejection — see validate.js.
  reviewBandUpperAdvisory: 20,

  // Rule 9 — Website verification
  requestTimeoutMs: 10000,
  maxRedirects: 5,
  parkedDomainSignals: [
    "domain is for sale", "buy this domain", "domain parking",
    "this domain may be for sale", "future home of something quite cool",
    "godaddy.com/domains", "sedo.com", "namecheap parking",
  ],
  minHtmlBytesForRealSite: 800, // parked/placeholder pages are almost always tiny

  // Rules 12–14 — Pricing
  minDiscountPercent: 1,
  maxDiscountPercent: 90, // above this is almost always an extraction error, not a real deal

  // Rule 16 — Product image
  imageCheckTimeoutMs: 8000,

  // Currency inference by TLD/locale — used only when a price has no explicit symbol
  currencyByCountry: {
    RO: "RON", PL: "PLN", CZ: "CZK", HU: "HUF", DE: "EUR", GB: "GBP",
    FR: "EUR", IT: "EUR", ES: "EUR", AT: "EUR", SE: "SEK", PT: "EUR",
  },
};
