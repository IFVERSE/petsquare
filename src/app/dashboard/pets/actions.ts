"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") || "").trim();
  const species = String(formData.get("species") || "").trim();
  if (!name || !species) return { error: "Name and species are required." };

  const { error } = await supabase.from("pets").insert({
    owner_id: user.id,
    name,
    species,
    breed: String(formData.get("breed") || "").trim() || null,
    gender: String(formData.get("gender") || "").trim() || null,
    size: String(formData.get("size") || "").trim() || null,
    weight_kg: formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null,
    activity_level: String(formData.get("activity_level") || "").trim() || null,
    allergies: String(formData.get("allergies") || "").trim() || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/pets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePet(petId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pets").delete().eq("id", petId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/pets");
  revalidatePath("/dashboard");
  return { success: true };
}
