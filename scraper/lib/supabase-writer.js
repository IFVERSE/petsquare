// scraper/lib/supabase-writer.js
import { createHash } from "node:crypto";
import { europe } from "../../shared/europe.js";
import { createClient } from "@supabase/supabase-js";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local " +
        "for the scraper to write results (RLS blocks anon writes to vendors/products by design)."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function slugify(name, city) {
  return `${name}-${city}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Upserts one accepted vendor + its validated products. Vendors are keyed on
 * `place_id` (unique in the schema) so re-running the scraper refreshes
 * existing listings instead of duplicating them.
 */
export async function saveAcceptedVendor(result) {
  const supabase = client();
  const v = result.vendor;

  const region = europe[v.country];
  if (region) {
    const { error } = await supabase.from("countries").upsert({ code: v.country, name: region[0], currency: region[3] }, { onConflict: "code" });
    if (error) throw error;
  }
  const { data: countryRow } = await supabase
    .from("countries")
    .select("id")
    .eq("code", v.country)
    .maybeSingle();
  if (!countryRow) throw new Error(`Country ${v.country} is missing from the countries table`);

  const { data: cityRow } = v.city
    ? await supabase
        .from("cities")
        .select("id")
        .eq("name", v.city)
        .eq("country_id", countryRow.id)
        .maybeSingle()
    : { data: null };

  const { data: existing, error: existingError } = await supabase.from("vendors").select("slug").eq("place_id", v.placeId).maybeSingle();
  if (existingError) throw existingError;
  const { data: vendorRow, error: vendorError } = await supabase
    .from("vendors")
    .upsert(
      {
        slug: existing?.slug ?? `${slugify(v.name, v.city ?? v.country ?? "")}-${createHash("sha256").update(v.placeId).digest("hex").slice(0, 8)}`,
        name: v.name,
        category: v.category,
        species: v.species ?? [],
        description: v.description ?? null,
        cover_image_url: v.coverImageUrl,
        discovery: v.discovery,
        website: v.website,
        phone: v.phone,
        address: v.address,
        city_id: cityRow?.id ?? null,
        country_id: countryRow?.id ?? null,
        lat: v.lat,
        lng: v.lng,
        place_id: v.placeId,
        google_rating: v.googleRating,
        review_count: v.reviewCount,
        business_status: v.businessStatus,
        badges: v.badges,
        status: "verified",
        source: "scraped",
        last_verified: v.lastVerified,
        last_scraped: v.lastScraped,
      },
      { onConflict: "place_id" }
    )
    .select("id")
    .single();

  if (vendorError) throw vendorError;

  let productsWritten = 0;
  for (const p of result.products) {
    const { error: productError } = await supabase.from("products").upsert(
      {
        vendor_id: vendorRow.id,
        name: p.name,
        description: p.description,
        image_url: p.imageUrl,
        species: p.species ?? [],
        original_price: p.originalPrice,
        discount_price: p.discountPrice,
        currency: p.currency,
        availability: p.availability,
        deal_starts_at: p.dealStartsAt,
        deal_ends_at: p.dealEndsAt,
        source_url: p.sourceUrl,
        status: "active",
        last_checked: p.lastChecked,
      },
      { onConflict: "source_url" }
    );
    if (productError) throw productError;
    productsWritten += 1;
  }

  return { vendorId: vendorRow.id, productsWritten };
}

export async function logScrapingJob(summary) {
  const supabase = client();
  const { error } = await supabase.from("scraping_jobs").insert({
    status: summary.errors.length ? "failed" : "completed",
    websites_scanned: summary.websitesScanned,
    vendors_discovered: summary.vendorsAccepted,
    products_discovered: summary.productsWritten,
    deals_discovered: summary.productsWritten,
    failed_websites: summary.rejected.filter((r) => r.reasons[0]?.startsWith("website_check_failed")).length,
    errors: summary.errors,
    started_at: summary.startedAt,
    finished_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function checkDiscoverySchema() {
  const { error } = await client().from("vendors").select("discovery").limit(1);
  if (error) throw new Error("Vendor discovery storage is unavailable. Apply supabase/migrations/202609160002_vendor_discovery.sql and verify Supabase credentials before scraping.");
}
