import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin — PetSquare" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware already redirects any /admin/* route to /admin/unauthorized when
  // Supabase isn't configured — just render children plain in that case so this
  // layout doesn't try to query a database that doesn't exist yet.
  if (!isSupabaseConfigured) {
    return <div className="min-h-screen bg-paper">{children}</div>;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in?next=/admin");

  const { data: access } = await supabase
    .from("admin_access")
    .select("status, admin_roles(name,label,permissions)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!access) redirect("/admin/unauthorized");

  const role = Array.isArray(access.admin_roles) ? access.admin_roles[0] : access.admin_roles;

  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar roleLabel={role?.label ?? "Admin"} email={user.email ?? ""} />
      <main className="flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}
