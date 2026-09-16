"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function setProductStatus(
  productId: string,
  status: "active" | "expired" | "rejected" | "suspended"
) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ status }).eq("id", productId);
  if (error) return { error: error.message };

  await logAudit(`deal.${status}`, "product", productId);
  revalidatePath("/admin/deals");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteProductAdmin(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { error: error.message };

  await logAudit("deal.delete", "product", productId);
  revalidatePath("/admin/deals");
  return { success: true };
}
