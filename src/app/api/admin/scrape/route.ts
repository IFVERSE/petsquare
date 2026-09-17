import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { discoverOsmPlaces, osmCategories, seedLocations } from "../../../../../scraper/lib/osm-places.js";
import { validateVendor } from "../../../../../scraper/validate.js";
import { checkDiscoverySchema, saveAcceptedVendor } from "../../../../../scraper/lib/supabase-writer.js";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to run discovery." }, { status: 401 });
  const { data: allowed, error: permissionError } = await db.rpc("has_admin_permission", { perm: "scraper.manage" });
  if (permissionError || allowed !== true) return NextResponse.json({ error: "Scraper access is required." }, { status: 403 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "Scraper storage is not configured on the server." }, { status: 503 });

  let input: { country?: string; category?: string };
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!input || typeof input !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if ((input.country !== undefined && typeof input.country !== "string") || (input.category !== undefined && typeof input.category !== "string")) {
    return NextResponse.json({ error: "Invalid country or category." }, { status: 400 });
  }
  const country = input.country?.toUpperCase() ?? "DE";
  const category = input.category ?? "retailer";
  if (!Object.hasOwn(seedLocations, country) || !Object.hasOwn(osmCategories, category)) {
    return NextResponse.json({ error: "Choose a supported country and category." }, { status: 400 });
  }

  const startedAt = new Date().toISOString();
  let jobId: string | undefined;
  try {
    await checkDiscoverySchema();
    const { data: running, error: runningError } = await db.from("scraping_jobs").select("id")
      .eq("status", "running").gte("started_at", new Date(Date.now() - 120000).toISOString()).limit(1);
    if (runningError) throw runningError;
    if (running?.length) return NextResponse.json({ error: "A discovery run is already in progress. Try again shortly." }, { status: 409 });
    const { data: job, error: jobError } = await db.from("scraping_jobs")
      .insert({ status: "running", started_at: startedAt })
      .select("id").single();
    if (jobError || !job) throw new Error(jobError?.message ?? "Could not create scraper job.");
    jobId = job.id;

    // Keep each web request bounded for serverless execution. The same validated
    // writer is used by the command-line scraper, so results reach public feeds.
    const places = await discoverOsmPlaces({ country, category, limit: 2, attempts: 1, timeoutMs: 15000 });
    let accepted = 0, deals = 0;
    const errors: { vendor: string; error: string }[] = [];
    for (const place of places) {
      try {
        const result = await validateVendor(place);
        if (!result.accepted) continue;
        const saved = await saveAcceptedVendor(result);
        accepted++;
        deals += saved.productsWritten;
      } catch (reason) {
        errors.push({ vendor: place.name, error: reason instanceof Error ? reason.message : "Validation failed" });
      }
    }
    const { error: updateError } = await db.from("scraping_jobs").update({
      status: errors.length ? "failed" : "completed", websites_scanned: places.length,
      vendors_discovered: accepted, products_discovered: deals, deals_discovered: deals,
      failed_websites: errors.length, errors, finished_at: new Date().toISOString(),
    }).eq("id", jobId);
    if (updateError) throw updateError;
    await logAudit("scraper.run", "scraping_job", job.id, { country, category, accepted, deals });
    for (const path of ["/admin", "/admin/scraper", "/admin/vendors", "/admin/deals", "/vendors", "/deals", "/"]) revalidatePath(path);
    return NextResponse.json({ scanned: places.length, accepted, deals, errors: errors.length });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Scrape failed";
    if (jobId) await db.from("scraping_jobs").update({ status: "failed", errors: [{ error: message }], finished_at: new Date().toISOString() }).eq("id", jobId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
