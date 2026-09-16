"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function setVendorStatus(vendorId: string, status: "verified" | "rejected" | "suspended") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendors")
    .update({ status, last_verified: status === "verified" ? new Date().toISOString() : undefined })
    .eq("id", vendorId);
  if (error) return { error: error.message };

  await logAudit(`vendor.${status}`, "vendor", vendorId);
  revalidatePath("/admin/vendors");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateVendorDetails(vendorId: string, formData: FormData) {
  const supabase = await createClient();
  const updates = {
    name: String(formData.get("name") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    phone: String(formData.get("phone") || "").trim() || null,
    website: String(formData.get("website") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
  };
  if (!updates.name || !updates.category) return { error: "Name and category are required." };

  const { error } = await supabase.from("vendors").update(updates).eq("id", vendorId);
  if (error) return { error: error.message };

  await logAudit("vendor.edit", "vendor", vendorId, updates);
  revalidatePath("/admin/vendors");
  return { success: true };
}

export async function deleteVendor(vendorId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vendors").delete().eq("id", vendorId);
  if (error) return { error: error.message };

  await logAudit("vendor.delete", "vendor", vendorId);
  revalidatePath("/admin/vendors");
  revalidatePath("/admin");
  return { success: true };
}
