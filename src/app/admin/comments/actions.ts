"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function setCommentStatus(commentId: string, status: "visible" | "hidden") {
  const supabase = await createClient();
  const { error } = await supabase.from("comments").update({ status }).eq("id", commentId);
  if (error) return { error: error.message };

  await logAudit(`comment.${status}`, "comment", commentId);
  revalidatePath("/admin/comments");
  return { success: true };
}

export async function deleteCommentAdmin(commentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { error: error.message };

  await logAudit("comment.delete", "comment", commentId);
  revalidatePath("/admin/comments");
  return { success: true };
}
