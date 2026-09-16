import { createClient } from "@/lib/supabase/server";
import AlertsManager from "@/components/dashboard/AlertsManager";

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: alerts }, { data: saved }] = await Promise.all([
    supabase
      .from("price_alerts")
      .select("id, target_price, created_at, products(id, name, discount_price, image_url)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_items")
      .select("item_id, products:item_id(id, name, discount_price)")
      .eq("user_id", user!.id)
      .in("item_type", ["product", "deal"]),
  ]);

  const savedProducts = (saved ?? [])
    .map((s) => (Array.isArray(s.products) ? s.products[0] : s.products))
    .filter(Boolean);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Price Alerts</h1>
      <p className="mt-1 text-sm text-navy/50">
        Get notified when a saved product drops to or below your target price.
        (Notification delivery is part of a future phase — this page manages the
        alert records themselves.)
      </p>
      <AlertsManager initialAlerts={alerts ?? []} savedProducts={savedProducts} />
    </div>
  );
}
