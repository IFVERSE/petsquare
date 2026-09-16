"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ItemType = "vendor" | "product" | "deal" | "service";

/**
 * Backs every "Save" button across the app (deal cards, vendor cards, the
 * vendor profile page). When Supabase is configured and the person is
 * signed in, this writes a real row to `saved_items` (Rule 6 of the Pet
 * Owner spec: "Saved Vendors & Deals"). Otherwise it degrades to a
 * local-only toggle so the Phase 1 demo experience still feels complete
 * without a backend.
 */
export function useSaveItem(itemType: ItemType, itemId: string, initialSaved = false) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  const toggle = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      // Not configured — local-only optimistic toggle (Phase 1 demo mode).
      setSaved((s) => !s);
      return;
    }

    setPending(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = `/auth/sign-in?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (saved) {
      await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId);
      setSaved(false);
    } else {
      await supabase
        .from("saved_items")
        .insert({ user_id: user.id, item_type: itemType, item_id: itemId });
      setSaved(true);
    }
    setPending(false);
  }, [itemType, itemId, saved]);

  return { saved, pending, toggle };
}
