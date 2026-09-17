import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { deals as mockDeals, Deal } from "@/lib/mock-data";
import { getVendors, getVendorById } from "./vendors";

type ProductRow = {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  species: string[] | null;
  original_price: number;
  discount_price: number;
  discount_percent: number;
  currency: string;
  availability: string;
  deal_starts_at: string | null;
  deal_ends_at: string | null;
  source_url: string | null;
  source: string | null;
  last_checked: string;
};

function mapProductRow(row: ProductRow): Deal {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    productName: row.name,
    description: row.description ?? "",
    imageUrl: row.image_url ?? "",
    category: "",
    species: (row.species ?? []) as Deal["species"],
    originalPrice: Number(row.original_price),
    discountPrice: Number(row.discount_price),
    discountPercent: Number(row.discount_percent),
    currency: (row.currency as Deal["currency"]) ?? "EUR",
    availability: (row.availability as Deal["availability"]) ?? "in_stock",
    dealEndsAt: row.deal_ends_at,
    sourceUrl: row.source_url ?? "",
    source: (row.source as Deal["source"]) ?? "scraped",
    lastChecked: row.last_checked,
  };
}

/**
 * Every active deal — used by the deals directory. Falls back to Phase 1
 * mock data whenever Supabase isn't configured or the scraper hasn't
 * produced any rows yet, so the page is never empty.
 */
export async function getDeals(): Promise<Deal[]> {
  if (!isSupabaseConfigured) return mockDeals;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, vendor_id, name, description, image_url, species, original_price, discount_price, discount_percent, currency, availability, deal_starts_at, deal_ends_at, source_url, source, last_checked, vendors!inner(status)"
    )
    .eq("status", "active")
    .eq("vendors.status", "verified")
    .order("last_checked", { ascending: false });

  if (error || !data) return [];
  return data.filter(row => (!row.deal_ends_at || Date.parse(row.deal_ends_at) > Date.now()) && (!row.deal_starts_at || Date.parse(row.deal_starts_at) <= Date.now()) && row.availability !== "out_of_stock").map((row) => mapProductRow(row as ProductRow));
}

export async function getTrendingDeals(limit = 6): Promise<Deal[]> {
  const country = (await cookies()).get("petsquare-country")?.value;
  const [deals, vendors] = await Promise.all([getDeals(), getVendors()]);
  const ids = new Set(vendors.filter(v => !country || country === "all" || v.countryCode === country).map(v => v.id));
  return deals.filter(d => ids.has(d.vendorId)).sort((a, b) => b.discountPercent - a.discountPercent).slice(0, limit);
}

export async function getDealsEndingSoon(limit = 4): Promise<Deal[]> {
  return (await getDeals()).filter((d) => d.dealEndsAt).slice(0, limit);
}

export async function getDealsForVendor(vendorId: string): Promise<Deal[]> {
  return (await getDeals()).filter((d) => d.vendorId === vendorId);
}

/**
 * Phase 4 personalization: deals matching a pet's species. Used by the Pet
 * Owner dashboard's "Recommended for [pet name]" section.
 */
export async function getPersonalizedDeals(species: string, limit = 4) {
  const deals = await getDeals();
  const matches = deals.filter((d) => d.species.includes(species as Deal["species"][number])).slice(0, limit);

  const withVendors = await Promise.all(
    matches.map(async (deal) => ({ deal, vendor: await getVendorById(deal.vendorId) }))
  );
  return withVendors.filter((x): x is { deal: Deal; vendor: NonNullable<typeof x.vendor> } => !!x.vendor);
}

export async function getDealById(id: string) {
  const deals = await getDeals();
  const deal = deals.find((d) => d.id === id);
  if (!deal) return null;
  const vendor = await getVendorById(deal.vendorId);
  return vendor ? { deal, vendor } : null;
}

// Re-exported so dashboard/admin code can build vendor lookup maps without a
// second round trip when it already needs the full vendor list anyway.
export { getVendors };
