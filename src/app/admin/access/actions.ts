"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function inviteAdmin(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const roleId = Number(formData.get("role_id"));
  if (!email || !roleId) return { error: "Email and role are required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // RLS also enforces this — checking here just gives a clean error message
  // instead of a raw Postgres permission error.
  const { error } = await supabase
    .from("admin_access")
    .insert({ email, role_id: roleId, status: "pending", invited_by: user.id });

  if (error) return { error: error.message };

  revalidatePath("/admin/access");
  return { success: true };
}

export async function updateAdminStatus(accessId: string, status: "active" | "suspended") {
  const supabase = await createClient();
  const { error } = await supabase.from("admin_access").update({ status }).eq("id", accessId);
  if (error) return { error: error.message };
  revalidatePath("/admin/access");
  return { success: true };
}
