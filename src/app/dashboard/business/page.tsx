import { createClient } from "@/lib/supabase/server";
import VendorOnboarding from "@/components/dashboard/VendorOnboarding";
import BusinessDashboard from "@/components/dashboard/BusinessDashboard";

export default async function BusinessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, slug, name, category, status, website, phone, address, business_status")
    .eq("owner_id", user!.id)
    .maybeSingle();

  if (!vendor) {
    return (
      <div>
        <h1 className="font-display text-2xl text-navy">🏪 My Business</h1>
        <p className="mt-1 text-sm text-navy/50">
          Create your PetSquare business profile to start listing products and deals.
        </p>
        <VendorOnboarding />
      </div>
    );
  }

  const [{ data: products }, { data: events }, { data: messages }, { count: savedCount }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, image_url, original_price, discount_price, discount_percent, currency, availability, status, deal_ends_at, source, last_checked")
      .eq("vendor_id", vendor.id)
      .order("last_checked", { ascending: false }),
    supabase.from("vendor_events").select("event_type").eq("vendor_id", vendor.id),
    supabase
      .from("vendor_messages")
      .select("id, message, read_at, created_at, sender_id, profiles(full_name, email)")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
    supabase.from("saved_items").select("*", { count: "exact", head: true }).eq("item_type", "vendor").eq("item_id", vendor.id),
  ]);

  const eventCounts = { profile_view: 0, website_click: 0, contact_click: 0, directions_click: 0 };
  for (const e of events ?? []) {
    if (e.event_type in eventCounts) eventCounts[e.event_type as keyof typeof eventCounts] += 1;
  }

  return (
    <BusinessDashboard
      vendor={vendor}
      products={products ?? []}
      messages={(messages ?? []).map((m) => ({
        ...m,
        sender: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
      }))}
      analytics={{ ...eventCounts, saved: savedCount ?? 0 }}
    />
  );
}
