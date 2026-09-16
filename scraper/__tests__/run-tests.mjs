// scraper/__tests__/run-tests.mjs
//
// Not a formal test framework — just a straightforward script that serves
// the fixtures over real HTTP (loopback) and asserts each piece of the
// scraper produces the right output. Run with: node scraper/__tests__/run-tests.mjs
//
// This is the part of Phase 3 that's actually verifiable inside a
// network-restricted environment: the Google Places integration and live
// vendor-website checks need real network access this sandbox doesn't have,
// but the parsing/validation logic itself is fully testable against fixtures.

import assert from "node:assert/strict";
import { startFixtureServer } from "./fixture-server.mjs";
import { extractShopify } from "../extractors/shopify.js";
import { extractJsonLd } from "../extractors/jsonld.js";
import { extractHeuristic } from "../extractors/heuristic.js";
import { discoverProductLinks } from "../lib/discover-links.js";
import { checkWebsite, checkImageUrl } from "../lib/website-checker.js";
import { extractProducts } from "../lib/extract-products.js";
import { validateVendor } from "../validate.js";
import { inferSpecies } from "../lib/infer-species.js";

const BASE = "http://127.0.0.1:8931";
let passed = 0;
let failed = 0;

function goodPlace(overrides = {}) {
  return {
    placeId: "ChIJ_test_place",
    name: "Happy Paws Berlin",
    address: "Torstraße 42, 10119 Berlin, Germany",
    city: "Berlin",
    country: "DE",
    lat: 52.5296,
    lng: 13.4013,
    phone: "+49 30 1234567",
    website: BASE,
    rating: 4.8,
    reviewCount: 327,
    businessStatus: "OPERATIONAL",
    types: ["pet_store", "store"],
    ...overrides,
  };
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    failed++;
  }
}

async function main() {
  const server = await startFixtureServer(8931);
  console.log("Fixture server running on :8931\n");

  await test("extractShopify: parses products.json and only keeps discounted items", async () => {
    const products = await extractShopify(BASE);
    assert.equal(products.length, 1, "should filter out the non-discounted leash");
    const p = products[0];
    assert.equal(p.name, "Premium Adult Dog Food 15kg");
    assert.equal(p.originalPrice, 45.99);
    assert.equal(p.discountPrice, 29.99);
  });

  await test("extractJsonLd: reads schema.org Product/Offer with priceSpecification", async () => {
    const res = await fetch(`${BASE}/products/dog-bed`);
    const html = await res.text();
    const products = extractJsonLd(html, `${BASE}/products/dog-bed`);
    assert.equal(products.length, 1);
    assert.equal(products[0].originalPrice, 79.0);
    assert.equal(products[0].discountPrice, 59.25);
    assert.equal(products[0].availability, "in_stock");
  });

  await test("extractHeuristic: reads old-price/sale-price class convention", async () => {
    const res = await fetch(`${BASE}/products/dog-food`);
    const html = await res.text();
    const products = extractHeuristic(html, `${BASE}/products/dog-food`);
    assert.equal(products.length, 1);
    assert.equal(products[0].originalPrice, 22.5);
    assert.equal(products[0].discountPrice, 16.88);
    assert.equal(products[0].availability, "in_stock");
  });

  await test("extractHeuristic: back-calculates original price from a discount badge", async () => {
    const res = await fetch(`${BASE}/products/cat-litter`);
    const html = await res.text();
    const products = extractHeuristic(html, `${BASE}/products/cat-litter`);
    assert.equal(products.length, 1);
    assert.equal(products[0].discountPrice, 13.32);
    // 13.32 / (1 - 0.28) = 18.5
    assert.equal(products[0].originalPrice, 18.5);
  });

  await test("discoverProductLinks: finds same-origin product paths, ignores external links", async () => {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    const links = discoverProductLinks(html, BASE);
    assert.equal(links.length, 2);
    assert.ok(links.every((l) => l.startsWith(BASE)));
  });

  await test("checkWebsite: accepts a normal, sufficiently-sized page", async () => {
    const result = await checkWebsite(`${BASE}/`);
    assert.equal(result.ok, true);
  });

  await test("checkWebsite: rejects a parked-domain page (Rule 9)", async () => {
    const result = await checkWebsite(`${BASE}/parked`);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "parked_domain");
  });

  await test("checkWebsite: rejects a too-small/placeholder page", async () => {
    const result = await checkWebsite(`${BASE}/tiny`);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "page_too_small");
  });

  await test("checkWebsite: rejects a 500 response", async () => {
    const result = await checkWebsite(`${BASE}/broken`);
    assert.equal(result.ok, false);
  });

  await test("checkWebsite: rejects a missing website", async () => {
    const result = await checkWebsite(null);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "no_website_listed");
  });

  await test("checkImageUrl: confirms a reachable image responds with an image content-type", async () => {
    const ok = await checkImageUrl(`${BASE}/images/photo.jpg`);
    assert.equal(ok, true);
  });

  await test("checkImageUrl: rejects a 404 image", async () => {
    const ok = await checkImageUrl(`${BASE}/images/missing.jpg`);
    assert.equal(ok, false);
  });

  await test("extractProducts: end-to-end Shopify-store vendor produces one validated deal", async () => {
    const homepageRes = await fetch(`${BASE}/`);
    const homepageHtml = await homepageRes.text();
    const products = await extractProducts(BASE, homepageHtml, "EUR");
    assert.equal(products.length, 1);
    assert.equal(products[0].discountPercent, 34.79);
    assert.ok(products[0].lastChecked);
  });

  await test("validateVendor: accepts a fully valid vendor end-to-end (all 19 rules)", async () => {
    const result = await validateVendor(goodPlace());
    assert.equal(result.accepted, true);
    assert.equal(result.vendor.name, "Happy Paws Berlin");
    assert.equal(result.vendor.badges.includes("deal_verified"), true);
    assert.ok(result.products.length >= 1);
  });

  await test("validateVendor: accepts a website-verified AI vendor without invented Google fields", async () => {
    const result = await validateVendor(goodPlace({
      discoverySource: "tavily_ai", placeId: "tavily_fixture", rating: null,
      reviewCount: 0, lat: null, lng: null, phone: null,
    }));
    assert.equal(result.accepted, true);
    assert.equal(result.vendor.googleRating, null);
    assert.equal(result.vendor.badges.includes("business_verified"), false);
    assert.equal(result.vendor.badges.includes("website_verified"), true);
  });

  await test("validateVendor: rejects rating out of range (Rule 5)", async () => {
    const result = await validateVendor(goodPlace({ rating: 2.4 }));
    assert.equal(result.accepted, false);
    assert.ok(result.reasons.includes("rating_out_of_range"));
  });

  await test("validateVendor: rejects a permanently closed business (Rule 3)", async () => {
    const result = await validateVendor(goodPlace({ businessStatus: "CLOSED_PERMANENTLY" }));
    assert.equal(result.accepted, false);
    assert.ok(result.reasons.includes("not_operational"));
  });

  await test("validateVendor: rejects too few reviews (Rule 6)", async () => {
    const result = await validateVendor(goodPlace({ reviewCount: 1 }));
    assert.equal(result.accepted, false);
    assert.ok(result.reasons.includes("too_few_reviews"));
  });

  await test("validateVendor: rejects a business category Places mis-typed as unrelated", async () => {
    const result = await validateVendor(
      goodPlace({ name: "Berlin Hardware Supply", types: ["hardware_store", "store"] })
    );
    assert.equal(result.accepted, false);
    assert.ok(result.reasons.includes("not_a_pet_business_category"));
  });

  await test("validateVendor: rejects an unreachable/placeholder website (Rule 9)", async () => {
    const result = await validateVendor(goodPlace({ website: `${BASE}/tiny` }));
    assert.equal(result.accepted, false);
    assert.equal(result.reasons[0], "website_check_failed:page_too_small");
  });

  await test("inferSpecies: matches dog keywords across languages", async () => {
    assert.deepEqual(inferSpecies("Premium Adult Dog Food 15kg", "Grain-inclusive kibble for adult dogs"), ["dog"]);
    assert.deepEqual(inferSpecies("Hundefutter Trocken", ""), ["dog"]);
  });

  await test("inferSpecies: matches multiple species when both are mentioned", async () => {
    const result = inferSpecies("Interactive Puzzle Feeder", "Great for dogs and cats at mealtime");
    assert.deepEqual(result.sort(), ["cat", "dog"]);
  });

  await test("inferSpecies: returns an empty array when nothing matches", async () => {
    assert.deepEqual(inferSpecies("Reflective Nylon Harness", "Adjustable padded straps"), []);
  });

  await test("extractProducts: attaches inferred species to each product", async () => {
    const homepageRes = await fetch(`${BASE}/`);
    const homepageHtml = await homepageRes.text();
    const products = await extractProducts(BASE, homepageHtml, "EUR");
    assert.deepEqual(products[0].species, ["dog"]);
  });

  server.close();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
