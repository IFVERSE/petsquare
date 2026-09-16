import { createClient } from "@/lib/supabase/server";
import VendorApprovalList from "@/components/admin/VendorApprovalList";

export default async function AdminVendorsPage() {
  const supabase = await createClient();

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name, category, status, source, address, phone, website, created_at, profiles(email)")
    .order("created_at", { ascending: false })
    .limit(100);

  const vendorIds = (vendors ?? []).map((v) => v.id);
  const { data: products } = vendorIds.length
    ? await supabase.from("products").select("vendor_id").in("vendor_id", vendorIds)
    : { data: [] as { vendor_id: string }[] };

  const countByVendor = new Map<string, number>();
  for (const p of products ?? []) {
    countByVendor.set(p.vendor_id, (countByVendor.get(p.vendor_id) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Vendor Management</h1>
      <p className="mt-1 text-sm text-navy/50">
        Approve vendor-submitted listings, edit any vendor&apos;s details, or suspend/delete a
        listing. Full bulk actions and duplicate-merging tools aren&apos;t built yet.
      </p>
      <VendorApprovalList
        vendors={(vendors ?? []).map((v) => {
          const profile = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
          return {
            ...v,
            owner_email: (profile as { email?: string } | null)?.email ?? null,
            product_count: countByVendor.get(v.id) ?? 0,
          };
        })}
      />
    </div>
  );
}
