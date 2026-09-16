// scripts/seed-super-admin.mjs
//
// One-time setup script: creates the first Super Admin login using the
// Supabase Admin API (service role key), and links it in admin_access with
// the 'super_admin' role so it can pass the RBAC check in middleware.
//
// Usage:
//   1. Run supabase/schema.sql and supabase/seed.sql in your Supabase project
//   2. Fill in .env.local (see .env.example)
//   3. node scripts/seed-super-admin.mjs

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL;
const PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !EMAIL || !PASSWORD) {
  console.error(
    "Missing env vars. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL, " +
      "SUPABASE_SERVICE_ROLE_KEY, SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD."
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Seeding Super Admin: ${EMAIL}`);

  // 1. Look up (or create) the super_admin role row.
  const { data: role, error: roleError } = await admin
    .from("admin_roles")
    .select("id")
    .eq("name", "super_admin")
    .single();

  if (roleError || !role) {
    console.error(
      "Could not find the 'super_admin' role. Did you run supabase/seed.sql first?",
      roleError?.message
    );
    process.exit(1);
  }

  // 2. Create (or reuse) the auth user.
  let userId;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Super Admin", account_type: "admin" },
  });

  if (createError) {
    if (createError.message?.toLowerCase().includes("already")) {
      console.log("User already exists — looking it up instead.");
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === EMAIL);
      if (!existing) {
        console.error("Could not find the existing user by email.");
        process.exit(1);
      }
      userId = existing.id;
    } else {
      console.error("Failed to create user:", createError.message);
      process.exit(1);
    }
  } else {
    userId = created.user.id;
  }

  // 3. Upsert the admin_access row linking this user to the super_admin role.
  const { error: accessError } = await admin.from("admin_access").upsert(
    {
      email: EMAIL,
      role_id: role.id,
      status: "active",
      user_id: userId,
    },
    { onConflict: "email" }
  );

  if (accessError) {
    console.error("Failed to upsert admin_access:", accessError.message);
    process.exit(1);
  }

  console.log("✅ Super Admin ready.");
  console.log(`   Email:    ${EMAIL}`);
  console.log(`   Password: ${PASSWORD}`);
  console.log("   Sign in at /auth/sign-in, then visit /admin.");
}

main();
