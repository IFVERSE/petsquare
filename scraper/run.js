#!/usr/bin/env node
import { config as loadEnv } from "dotenv";
import { europe } from "../shared/europe.js";
import { discoverOsmPlaces, seedLocations, osmCategories } from "./lib/osm-places.js";
import pLimit from "p-limit";
import { discoverVendorFromUrl, discoverVendors } from "./lib/ai-vendor-agent.js";
import { validateVendor } from "./validate.js";
import { buildSeedQueries, seedCities } from "./queries.js";
import { saveAcceptedVendor, logScrapingJob, checkDiscoverySchema } from "./lib/supabase-writer.js";

loadEnv({ path: ".env.local" });
const args = process.argv.slice(2);
const provider = args.find(arg => arg.startsWith("--provider="))?.split("=")[1] ?? "osm";
if (!["osm", "ai"].includes(provider)) throw new Error("--provider must be osm or ai");
const categoriesArg = args.find(arg => arg.startsWith("--categories="))?.split("=")[1];
const categories = categoriesArg ? categoriesArg.split(",") : Object.keys(osmCategories);
if (categories.some(category => !Object.hasOwn(osmCategories, category))) throw new Error("Unsupported category");
const nationwide = args.includes("--nationwide");
const vendorLimit = Number(args.find(arg => arg.startsWith("--vendor-limit="))?.split("=")[1] ?? 30);
if (!Number.isInteger(vendorLimit) || vendorLimit < 1 || vendorLimit > 100) throw new Error("--vendor-limit must be 1?100");
const dryRun = args.includes("--dry-run");
const countriesArg = args.find((arg) => arg.startsWith("--countries="));
const countries = countriesArg ? countriesArg.split("=")[1].split(",") : undefined;
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const queryLimit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
if (queryLimit !== undefined && (!Number.isInteger(queryLimit) || queryLimit < 1)) throw new Error("--limit must be a positive integer");
const urlsArg = args.find((arg) => arg.startsWith("--urls="));
const seedUrls = urlsArg ? urlsArg.slice("--urls=".length).split(",").filter(Boolean) : [];
const limit = pLimit(3);
const startAt = args.find((arg) => arg.startsWith("--start-at="))?.slice(11);

async function main() {
  if (!dryRun) await checkDiscoverySchema();
  const startedAt = new Date().toISOString();
  if (countries?.some(code => !Object.hasOwn(seedLocations, code))) throw new Error("Unsupported country code");
  const allQueries = provider === "osm" ? (countries ?? Object.keys(seedLocations)).flatMap(country => categories.map(category => `${country}:${category}`)) : buildSeedQueries({ countries });
  const startIndex = startAt ? allQueries.indexOf(startAt) : 0;
  if (startIndex < 0) throw new Error("--start-at must match a selected seed query, e.g. BE:shelter");
  const queries = allQueries.slice(startIndex).slice(0, queryLimit);
  console.log(`Running ${queries.length} ${provider} seed queries${dryRun ? " (dry run)" : ""}...`);
  const seen = new Set(), accepted = [], rejected = [], errors = [];
  let websitesScanned = 0, productsWritten = 0;
  for (const query of queries) {
    const country = provider === "osm" ? query.split(":")[0] : Object.entries(europe).find(([, info]) => query.includes(String(info[0])))?.[0] ?? Object.entries(seedCities).find(([, city]) => query.includes(city))?.[0] ?? null;
    if (provider === "osm") await new Promise(resolve => setTimeout(resolve, 1500));
    let results;
    try { results = provider === "osm" ? await discoverOsmPlaces({ country, category: query.split(":")[1], nationwide, limit: vendorLimit }) : await discoverVendors(query, country); }
    catch (error) { console.error(`Search failed for "${query}": ${error.message}`); errors.push({ query, error: error.message }); continue; }
    console.log(`  "${query}" -> ${results.length} discovered vendors`);
    await Promise.all(results.map((vendor) => limit(async () => {
      if (seen.has(vendor.placeId)) return;
      seen.add(vendor.placeId);
      try {
        const result = await validateVendor(vendor); websitesScanned++;
        if (result.accepted) { accepted.push(result); if (!dryRun) { const saved = await saveAcceptedVendor(result); productsWritten += saved.productsWritten; } console.log(`  ✓ ${vendor.name} — ${result.products.length} deal(s)`); }
        else { rejected.push({ name: vendor.name, reasons: result.reasons }); console.log(`  · ${vendor.name} — rejected: ${result.reasons.join(", ")}`); }
      } catch (error) { errors.push({ vendor: vendor.name, error: error.message }); }
    })));
  }
  for (const url of seedUrls) {
    try {
      const vendor = await discoverVendorFromUrl(url, countries?.[0] ?? null);
      if (!vendor || seen.has(vendor.placeId)) continue;
      seen.add(vendor.placeId);
      const result = await validateVendor(vendor); websitesScanned++;
      if (result.accepted) { accepted.push(result); if (!dryRun) { const saved = await saveAcceptedVendor(result); productsWritten += saved.productsWritten; } console.log(`  ✓ ${vendor.name} — ${result.products.length} deal(s)`); }
      else { rejected.push({ name: vendor.name, reasons: result.reasons }); console.log(`  · ${vendor.name} — rejected: ${result.reasons.join(", ")}`); }
    } catch (error) { errors.push({ url, error: error.message }); console.error(`Direct URL failed for "${url}": ${error.message}`); }
  }
  if (!dryRun) {
    await logScrapingJob({ startedAt, websitesScanned, vendorsAccepted: accepted.length, productsWritten, rejected, errors });
  }
  console.log(`Summary: ${accepted.length} accepted, ${rejected.length} rejected, ${errors.length} errors${dryRun ? "; nothing written" : `; ${productsWritten} products written`}.`);
  if (errors.length) process.exitCode = 1;
}
main().catch((error) => { console.error("Fatal error:", error); process.exit(1); });
