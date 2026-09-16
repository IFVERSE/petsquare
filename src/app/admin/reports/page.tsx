import { createClient } from "@/lib/supabase/server";
import ReportsList from "@/components/admin/ReportsList";

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("id, target_type, target_id, reason, details, status, created_at, profiles(email)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Reports & Moderation</h1>
      <p className="mt-1 text-sm text-navy/50">
        Reports filed by pet owners against vendors, products, or comments — from the
        &ldquo;Report Vendor&rdquo; button on every public vendor profile.
      </p>
      <ReportsList
        reports={(reports ?? []).map((r) => {
          const reporter = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          return { ...r, reporter_email: (reporter as { email?: string } | null)?.email ?? null };
        })}
      />
    </div>
  );
}
