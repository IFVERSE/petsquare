"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function removeSavedItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("saved_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/saved");
  revalidatePath("/dashboard");
  return { success: true };
}
