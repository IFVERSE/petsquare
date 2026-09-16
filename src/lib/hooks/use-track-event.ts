"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type EventType = "profile_view" | "website_click" | "contact_click" | "directions_click";

function isRealVendorId(id: string) {
  // Mock-data vendor ids look like "v1" — only track events for real Supabase
  // UUIDs so a Phase 1 demo session never tries to write to a table that
  // doesn't have a matching vendor row.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function trackVendorEvent(vendorId: string, eventType: EventType) {
  if (!isRealVendorId(vendorId)) return;
  const supabase = createClient();
  if (!supabase) return;
  // Fire-and-forget — analytics shouldn't block or fail the user's action.
  supabase.from("vendor_events").insert({ vendor_id: vendorId, event_type: eventType }).then(
    () => {},
    () => {}
  );
}

/** Fires a single profile_view event once, on mount, for a real vendor. */
export function useTrackProfileView(vendorId: string) {
  useEffect(() => {
    trackVendorEvent(vendorId, "profile_view");
  }, [vendorId]);
}
