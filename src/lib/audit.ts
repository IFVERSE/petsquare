import { createClient } from "@/lib/supabase/server";

/**
 * Writes one row to audit_logs on behalf of the currently signed-in admin.
 * Call this from admin server actions right after a state-changing write
 * (vendor status change, deal moderation, report resolution, etc.).
 *
 * Best-effort: if this fails (e.g. RLS misconfigured, or called by a
 * non-admin session) it logs to the server console but never throws, so a
 * broken audit trail never blocks the actual admin action from completing.
 */
export async function logAudit(
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {}
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("audit_logs").insert({
      admin_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
    if (error) console.error("audit log write failed:", error.message);
  } catch (err) {
    console.error("audit log write threw:", err);
  }
}
