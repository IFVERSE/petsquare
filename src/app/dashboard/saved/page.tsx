import { createClient } from "@/lib/supabase/server";
import SavedItemsList from "@/components/dashboard/SavedItemsList";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: savedItems } = await supabase
    .from("saved_items")
    .select("id, item_type, item_id, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const vendorIds = (savedItems ?? []).filter((i) => i.item_type === "vendor").map((i) => i.item_id);
  const productIds = (savedItems ?? [])
    .filter((i) => i.item_type === "product" || i.item_type === "deal")
    .map((i) => i.item_id);

  const [{ data: vendorRows }, { data: productRows }] = await Promise.all([
    vendorIds.length
      ? supabase.from("vendors").select("id, slug, name, logo_url, city_id, cities(name)").in("id", vendorIds)
      : Promise.resolve({ data: [] as never[] }),
    productIds.length
      ? supabase
          .from("products")
          .select("id, name, image_url, discount_price, original_price, vendor_id, vendors(slug, name)")
          .in("id", productIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const vendorMap = new Map((vendorRows ?? []).map((v) => [v.id, v]));
  const productMap = new Map((productRows ?? []).map((p) => [p.id, p]));

  const items = (savedItems ?? []).map((item) => ({
    id: item.id,
    type: item.item_type as "vendor" | "product" | "deal" | "service",
    vendor: item.item_type === "vendor" ? vendorMap.get(item.item_id) : undefined,
    product: item.item_type !== "vendor" ? productMap.get(item.item_id) : undefined,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Saved Vendors & Deals</h1>
      <p className="mt-1 text-sm text-navy/50">
        Tap the heart on any deal or vendor to save it here. We&apos;ll add price-drop
        notifications for saved deals once the notification system is built.
      </p>
      <SavedItemsList items={items} />
    </div>
  );
}
