"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createVendorListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  if (!name || !category) return { error: "Business name and category are required." };

  const baseSlug = slugify(name);
  const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

  const { error } = await supabase.from("vendors").insert({
    owner_id: user.id,
    slug,
    name,
    category,
    species: formData.getAll("species"),
    phone: String(formData.get("phone") || "").trim() || null,
    website: String(formData.get("website") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    business_status: "OPERATIONAL",
    badges: [],
    status: "pending",
    source: "vendor_submitted",
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/business");
  return { success: true };
}

export async function createProduct(vendorId: string, formData: FormData) {
  const originalPrice = Number(formData.get("original_price"));
  const discountPrice = Number(formData.get("discount_price"));
  if (!formData.get("name") || !originalPrice || !discountPrice) {
    return { error: "Name, original price and discount price are required." };
  }
  if (discountPrice >= originalPrice) {
    return { error: "Discount price must be lower than the original price." };
  }

  const supabase = await createClient();
  const dealEndsAt = String(formData.get("deal_ends_at") || "");

  const { error } = await supabase.from("products").insert({
    vendor_id: vendorId,
    name: String(formData.get("name")).trim(),
    description: String(formData.get("description") || "").trim(),
    image_url: String(formData.get("image_url") || "").trim() || null,
    species: formData.getAll("species"),
    original_price: originalPrice,
    discount_price: discountPrice,
    currency: String(formData.get("currency") || "EUR"),
    availability: String(formData.get("availability") || "in_stock"),
    deal_ends_at: dealEndsAt ? new Date(dealEndsAt).toISOString() : null,
    source: "vendor_submitted",
    status: "active",
    last_checked: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/business");
  return { success: true };
}

export async function updateProductStatus(productId: string, status: "active" | "expired" | "suspended") {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ status }).eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/business");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/business");
  return { success: true };
}

export async function markMessageRead(messageId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendor_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", messageId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/business");
  return { success: true };
}
