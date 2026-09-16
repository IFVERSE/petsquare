import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!url && !!anonKey && !url.includes("YOUR-PROJECT-REF");

/**
 * Returns a Supabase browser client, or null if the project hasn't been
 * configured yet (see .env.example). Callers should handle the null case —
 * this keeps the Phase 1 frontend fully functional even before Phase 2's
 * Supabase project is wired up.
 */
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(url!, anonKey!);
}
