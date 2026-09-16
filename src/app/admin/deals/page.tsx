import { createClient } from "@/lib/supabase/server";
import DealModerationList from "@/components/admin/DealModerationList";

export default async function AdminDealsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, discount_price, original_price, discount_percent, currency, status, source, last_checked, vendors(name, slug)"
    )
    .order("last_checked", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Deal Management</h1>
      <p className="mt-1 text-sm text-navy/50">
        Every product across every vendor — scraped and vendor-submitted alike. Mark expired,
        reject, or delete a listing.
      </p>
      <DealModerationList
        products={(products ?? []).map((p) => {
          const vendor = Array.isArray(p.vendors) ? p.vendors[0] : p.vendors;
          return { ...p, vendor_name: vendor?.name ?? "Unknown vendor", vendor_slug: vendor?.slug ?? "" };
        })}
      />
    </div>
  );
}
