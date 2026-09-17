import { createClient } from "@/lib/supabase/server";
import { Store, Package, Users, ShieldAlert, Bot } from "lucide-react";

async function count(supabase: Awaited<ReturnType<typeof createClient>>, table: string, filter?: [string, string]) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = query.eq(filter[0], filter[1]);
  const { count: c } = await query;
  return c ?? 0;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [vendors, verifiedVendors, pendingVendors, products, users, reports, lastJob] = await Promise.all([
    count(supabase, "vendors"),
    count(supabase, "vendors", ["status", "verified"]),
    count(supabase, "vendors", ["status", "pending"]),
    count(supabase, "products", ["status", "active"]),
    count(supabase, "profiles"),
    count(supabase, "reports", ["status", "pending"]),
    supabase
      .from("scraping_jobs")
      .select("status, vendors_discovered, products_discovered, finished_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const stats = [
    { label: "Total Vendors", value: vendors, icon: Store, href: "/admin/vendors" },
    { label: "Verified Vendors", value: verifiedVendors, icon: Store, href: "/admin/vendors" },
    { label: "Pending Vendor Approvals", value: pendingVendors, icon: Store, href: "/admin/vendors" },
    { label: "Active Deals", value: products, icon: Package },
    { label: "Pet Owners & Users", value: users, icon: Users },
    { label: "Pending Reports", value: reports, icon: ShieldAlert },
  ];

  const job = lastJob.data;

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Dashboard Overview</h1>
      <p className="mt-1 text-sm text-navy/50">
        Live counts from Supabase. Use <a href="/admin/scraper" className="font-medium text-tangerine underline">Scraper Monitor</a> to fetch and publish validated vendors and deals.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Wrapper = s.href ? "a" : "div";
          return (
            <Wrapper key={s.label} {...(s.href ? { href: s.href } : {})} className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
              <s.icon className="h-5 w-5 text-tangerine" />
              <p className="mt-3 font-data text-3xl font-semibold text-navy">{s.value}</p>
              <p className="mt-1 text-sm text-navy/50">{s.label}</p>
            </Wrapper>
          );
        })}

        <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <Bot className="h-5 w-5 text-sage" />
          {job ? (
            <>
              <p className="mt-3 font-data text-lg font-semibold text-navy">{job.status}</p>
              <p className="mt-1 text-sm text-navy/50">
                Last scrape: {job.vendors_discovered} vendors, {job.products_discovered} deals
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 font-data text-lg font-semibold text-navy">No runs yet</p>
              <p className="mt-1 text-sm text-navy/50">Scraper hasn&apos;t run in this project</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-paper-dim p-6 text-sm text-navy/60">
        Manage vendors, deals, reports, comments, users and scraper runs from the navigation menu.
      </div>
    </div>
  );
}
