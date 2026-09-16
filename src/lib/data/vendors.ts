import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { vendors as mockVendors, Vendor } from "@/lib/mock-data";

type VendorRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  species: string[] | null;
  logo_url: string | null;
  cover_image_url: string | null;
  google_rating: number | null;
  review_count: number | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  place_id: string | null;
  business_status: string | null;
  badges: string[] | null;
  last_verified: string | null;
  cities: { name: string } | { name: string }[] | null;
  countries: { name: string; code: string } | { name: string; code: string }[] | null;
};

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

/**
 * Placeholder cover/logo images for vendors that came from the scraper —
 * the scraper doesn't currently extract vendor imagery (Google Places
 * doesn't reliably expose logo/cover photos through the free API tier), so
 * this keeps vendor cards visually consistent until that's added.
 */
const FALLBACK_LOGO = "https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=200&q=80";

function mapVendorRow(row: VendorRow, productCounts: Map<string, { total: number; active: number; maxDiscount: number }>): Vendor {
  const city = one(row.cities);
  const country = one(row.countries);
  const counts = productCounts.get(row.id) ?? { total: 0, active: 0, maxDiscount: 0 };

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    species: (row.species ?? []) as Vendor["species"],
    logoUrl: row.logo_url || FALLBACK_LOGO,
    coverImageUrl: row.cover_image_url || "",
    rating: row.google_rating ?? 0,
    reviewCount: row.review_count ?? 0,
    city: city?.name ?? "",
    country: country?.name ?? "",
    countryCode: country?.code ?? "",
    address: row.address ?? "",
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    phone: row.phone ?? "",
    website: row.website ?? "",
    placeId: row.place_id ?? "",
    businessStatus: row.business_status ?? "UNKNOWN",
    badges: (row.badges ?? []) as Vendor["badges"],
    activeDealCount: counts.active,
    productCount: counts.total,
    maxDiscountPercent: counts.maxDiscount,
    lastVerified: row.last_verified ?? new Date().toISOString(),
  };
}

async function loadProductCounts(supabase: Awaited<ReturnType<typeof createClient>>, vendorIds: string[]) {
  const counts = new Map<string, { total: number; active: number; maxDiscount: number }>();
  if (vendorIds.length === 0) return counts;

  const { data } = await supabase
    .from("products")
    .select("vendor_id, status, discount_percent")
    .in("vendor_id", vendorIds);

  for (const p of data ?? []) {
    const entry = counts.get(p.vendor_id) ?? { total: 0, active: 0, maxDiscount: 0 };
    entry.total += 1;
    if (p.status === "active") {
      entry.active += 1;
      entry.maxDiscount = Math.max(entry.maxDiscount, Number(p.discount_percent) || 0);
    }
    counts.set(p.vendor_id, entry);
  }
  return counts;
}

/**
 * Every vendor with status='verified' — used by the vendor directory and
 * "Trusted Vendors" rail. Falls back to Phase 1 mock data when Supabase
 * isn't configured, or when it's configured but the scraper hasn't run yet
 * (empty table), so the frontend never shows a blank directory.
 */
export async function getVendors(): Promise<Vendor[]> {
  if (!isSupabaseConfigured) return process.env.NODE_ENV === "production" ? [] : mockVendors;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select(
      "id, slug, name, category, species, logo_url, cover_image_url, google_rating, review_count, address, lat, lng, phone, website, place_id, business_status, badges, last_verified, cities(name), countries(name, code)"
    )
    .eq("status", "verified")
    .order("last_verified", { ascending: false });

  if (error || !data) return [];

  const counts = await loadProductCounts(supabase, data.map((v) => v.id));
  return data.map((row) => mapVendorRow(row as unknown as VendorRow, counts));
}

/**
 * A single verified vendor by slug, or null if it doesn't exist in either
 * Supabase or the mock dataset (the caller should 404).
 */
export async function getVendorBySlug(slug: string): Promise<Vendor | null> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vendors")
      .select(
        "id, slug, name, category, species, logo_url, cover_image_url, google_rating, review_count, address, lat, lng, phone, website, place_id, business_status, badges, last_verified, cities(name), countries(name, code)"
      )
      .eq("slug", slug)
      .eq("status", "verified")
      .maybeSingle();

    if (!error && data) {
      const counts = await loadProductCounts(supabase, [data.id]);
      return mapVendorRow(data as unknown as VendorRow, counts);
    }
  }

  return isSupabaseConfigured ? null : mockVendors.find((v) => v.slug === slug) ?? null;
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  const all = await getVendors();
  return all.find((v) => v.id === id) ?? null;
}
