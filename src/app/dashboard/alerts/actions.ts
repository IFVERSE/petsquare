"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPriceAlert(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const productId = String(formData.get("product_id") || "");
  const targetPrice = Number(formData.get("target_price"));
  if (!productId || !targetPrice || targetPrice <= 0) {
    return { error: "Choose a product and a valid target price." };
  }

  const { error } = await supabase
    .from("price_alerts")
    .insert({ user_id: user.id, product_id: productId, target_price: targetPrice });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function removePriceAlert(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("price_alerts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard");
  return { success: true };
}
