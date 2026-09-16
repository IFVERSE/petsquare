"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function setReportStatus(
  reportId: string,
  status: "under_review" | "resolved" | "dismissed"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null })
    .eq("id", reportId);
  if (error) return { error: error.message };

  await logAudit(`report.${status}`, "report", reportId);
  revalidatePath("/admin/reports");
  return { success: true };
}
