import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";

config({ path: ".env.local", quiet: true });
const since = process.argv.find((arg) => arg.startsWith("--since="))?.slice(8);
if (!since || !Number.isFinite(Date.parse(since))) {
  throw new Error("Supply --since=<ISO timestamp> to export listings refreshed by this run.");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function readPages(query) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query().range(offset, offset + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}

// Explicit public fields exclude accounts, ownership, and operational records.
const vendors = await readPages(() => db.from("vendors")
  .select("id,slug,name,category,species,description,cover_image_url,discovery,website,phone,address,lat,lng,place_id,google_rating,review_count,business_status,badges,status,source,last_verified,last_scraped,countries(code,name,currency),cities(name)")
  .eq("source", "scraped").eq("status", "verified").like("place_id", "osm:%")
  .gte("last_scraped", new Date(since).toISOString()).order("id"));
const products = [];
for (let offset = 0; offset < vendors.length; offset += 100) {
  const ids = vendors.slice(offset, offset + 100).map((vendor) => vendor.id);
  products.push(...await readPages(() => db.from("products")
    .select("id,vendor_id,name,description,image_url,species,original_price,discount_price,currency,availability,deal_starts_at,deal_ends_at,source_url,status,last_checked")
    .in("vendor_id", ids).gte("last_checked", new Date(since).toISOString()).order("id")));
}
if (!vendors.length) throw new Error("No refreshed public vendors found; no snapshot written.");
const snapshot = {
  exportedAt: new Date().toISOString(), since: new Date(since).toISOString(),
  source: "OpenStreetMap and verified vendor websites",
  attribution: "© OpenStreetMap contributors",
  sourceLicense: "https://www.openstreetmap.org/copyright",
  note: "Snapshot of accepted records refreshed since the supplied timestamp. The application reads live Supabase data. Country/category coverage may be incomplete.",
  vendors, products,
};
await mkdir("data", { recursive: true });
await writeFile("data/scraped-listings.json", JSON.stringify(snapshot, null, 2) + "\n");
console.log(`Exported ${vendors.length} vendors and ${products.length} products to data/scraped-listings.json`);
