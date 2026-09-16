import "server-only";

import { createHash } from "node:crypto";
import { ApifyClient } from "apify-client";
import { createClient } from "@supabase/supabase-js";

export const DEFAULT_APIFY_ACTOR_ID = "123webdata/zooplus-scraper";
export type PetDataItem = Record<string, unknown>;

function databaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials are not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

function actorInput(maxItems: number): Record<string, unknown> {
  if (process.env.APIFY_INPUT_JSON) {
    const parsed: unknown = JSON.parse(process.env.APIFY_INPUT_JSON);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("APIFY_INPUT_JSON must contain a JSON object");
    }
    return parsed as Record<string, unknown>;
  }
  return {
    categoryUrls: ["https://www.zooplus.com/shop/dogs/dry_dog_food"],
    maxResultsPerScrape: maxItems,
    usePagination: false,
  };
}

function itemKey(item: PetDataItem) {
  const candidate = item.url ?? item.productUrl ?? item.product_url ?? item.id ?? item.sku ?? item;
  return createHash("sha256").update(JSON.stringify(candidate)).digest("hex");
}

export async function readCachedPetData(limit = 48) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const { data, error } = await databaseClient()
    .from("apify_pet_data")
    .select("item_key, payload, synced_at")
    .order("synced_at", { ascending: false })
    .limit(safeLimit)
    .abortSignal(AbortSignal.timeout(12000));
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.item_key as string,
    data: row.payload as PetDataItem,
    syncedAt: row.synced_at as string,
  }));
}

export async function syncPetData() {
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN (or APIFY_API_TOKEN) is not configured");
  const actorId = process.env.APIFY_ACTOR_ID || DEFAULT_APIFY_ACTOR_ID;
  const maxItems = Math.max(1, Math.min(Number(process.env.APIFY_MAX_ITEMS) || 50, 500));
  const client = new ApifyClient({ token });
  const input = { ...actorInput(maxItems), maxResultsPerScrape: maxItems };
  const run = await client.actor(actorId).call(input, {
    waitSecs: 240,
    timeout: 240,
    maxItems,
  });
  if (run.status !== "SUCCEEDED") throw new Error(`Apify actor finished with status ${run.status}`);

  const result = await client.dataset<PetDataItem>(run.defaultDatasetId).listItems({ clean: true, limit: maxItems });
  const items = result.items.filter((item) => item && typeof item === "object");
  if (items.length === 0) throw new Error("Apify returned no products; the existing cache was preserved");

  const db = databaseClient();
  const syncedAt = new Date().toISOString();
  const rows = items.map((item) => ({
    item_key: itemKey(item), actor_id: actorId, run_id: run.id, payload: item, synced_at: syncedAt,
  }));
  const { error: upsertError } = await db.from("apify_pet_data").upsert(rows, { onConflict: "item_key" });
  if (upsertError) throw upsertError;
  const { error: cleanupError } = await db.from("apify_pet_data").delete().eq("actor_id", actorId).neq("run_id", run.id);
  if (cleanupError) throw cleanupError;
  return { actorId, runId: run.id, itemCount: rows.length, syncedAt };
}
