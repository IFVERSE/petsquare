import { createClient } from "@/lib/supabase/server";
import { Bot } from "lucide-react";
import ScraperControls from "@/components/admin/ScraperControls";

export default async function AdminScraperPage() {
  const supabase = await createClient();
  const [{ data: jobs }, { data: canManage }] = await Promise.all([
    supabase.from("scraping_jobs").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.rpc("has_admin_permission", { perm: "scraper.manage" }),
  ]);

  return <div>
    <h1 className="font-display text-2xl text-navy">Scraper Monitor</h1>
    <p className="mt-1 text-sm text-navy/60">Discover pet businesses, validate their websites and deals, and publish accepted results to the public directories. Each request checks up to two places.</p>
    {canManage ? <ScraperControls /> : <p className="mt-6 rounded-xl bg-surface p-4 text-sm text-navy/60">Your admin role can view run history. Scraper management permission is required to start a run.</p>}
    <h2 className="mt-8 font-display text-xl text-navy">Recent runs</h2>
    <div className="mt-4 space-y-3">
      {(jobs ?? []).map(job => <div key={job.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${job.status === "completed" ? "bg-sage-light text-sage" : "bg-coral/10 text-coral"}`}>{job.status}</span>
          <span className="text-xs text-navy/50">{new Date(job.created_at).toLocaleString()}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-navy/70 sm:grid-cols-4">
          <div><span className="block font-data text-lg text-navy">{job.websites_scanned ?? 0}</span>Places scanned</div>
          <div><span className="block font-data text-lg text-navy">{job.vendors_discovered ?? 0}</span>Vendors published</div>
          <div><span className="block font-data text-lg text-navy">{job.products_discovered ?? 0}</span>Deals published</div>
          <div><span className="block font-data text-lg text-navy">{job.failed_websites ?? 0}</span>Errors</div>
        </div>
        {Array.isArray(job.errors) && job.errors.length > 0 && <details className="mt-3 text-xs text-coral"><summary className="cursor-pointer">View errors</summary><ul className="mt-2 space-y-1 break-words">{job.errors.map((entry: { vendor?: string; error?: string }, index: number) => <li key={index}>{entry.vendor ? `${entry.vendor}: ` : ""}{entry.error}</li>)}</ul></details>}
      </div>)}
      {(!jobs || jobs.length === 0) && <div className="rounded-2xl border border-dashed border-paper-dim p-8 text-center text-sm text-navy/50"><Bot className="mx-auto mb-2 h-6 w-6" />No scraper runs logged yet.</div>}
    </div>
  </div>;
}
