import { createClient } from "@/lib/supabase/server";
import { Bot } from "lucide-react";

export default async function AdminScraperPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("scraping_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Scraper Monitor</h1>
      <p className="mt-1 text-sm text-navy/50">
        Job history from every <code>npm run scrape</code> run. This is read-only — triggering a
        scrape from this web UI would need a server function this build doesn&apos;t have; for now,
        run it from a terminal or a scheduled job (cron / Supabase Edge Function).
      </p>

      <div className="mt-6 space-y-3">
        {(jobs ?? []).map((j) => (
          <div key={j.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${j.status === "completed" ? "bg-sage-light text-sage" : "bg-coral/10 text-coral"}`}>
                {j.status}
              </span>
              <span className="text-xs text-navy/40">{new Date(j.created_at).toLocaleString()}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-navy/70 sm:grid-cols-4">
              <div><span className="block font-data text-lg text-navy">{j.websites_scanned}</span>Websites scanned</div>
              <div><span className="block font-data text-lg text-navy">{j.vendors_discovered}</span>Vendors accepted</div>
              <div><span className="block font-data text-lg text-navy">{j.products_discovered}</span>Deals accepted</div>
              <div><span className="block font-data text-lg text-navy">{j.failed_websites}</span>Failed websites</div>
            </div>
          </div>
        ))}
        {(!jobs || jobs.length === 0) && (
          <div className="rounded-2xl border border-dashed border-paper-dim p-8 text-center text-sm text-navy/40">
            <Bot className="mx-auto mb-2 h-6 w-6" />
            No scraper runs logged yet. Run{" "}
            <code className="rounded bg-paper px-1.5 py-0.5">npm run scrape</code> from the project
            root (needs <code className="rounded bg-paper px-1.5 py-0.5">GOOGLE_PLACES_API_KEY</code>).
          </div>
        )}
      </div>
    </div>
  );
}
