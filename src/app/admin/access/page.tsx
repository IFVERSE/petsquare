import { createClient } from "@/lib/supabase/server";
import AccessManager from "@/components/admin/AccessManager";

export default async function AdminAccessPage() {
  const supabase = await createClient();

  const [{ data: access }, { data: roles }] = await Promise.all([
    supabase
      .from("admin_access")
      .select("id, email, status, created_at, admin_roles(id,name,label)")
      .order("created_at", { ascending: false }),
    supabase.from("admin_roles").select("id, name, label").order("id"),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Admin Access Management</h1>
      <p className="mt-1 text-sm text-navy/50">
        Only pre-authorized emails can sign up or sign in as an administrator. Assign
        a role when you authorize someone — they get real access only once you flip
        their status to Active.
      </p>

      <AccessManager
        initialAccess={(access ?? []).map((a) => ({
          id: a.id,
          email: a.email,
          status: a.status,
          role: Array.isArray(a.admin_roles) ? a.admin_roles[0] : a.admin_roles,
        }))}
        roles={roles ?? []}
      />
    </div>
  );
}
