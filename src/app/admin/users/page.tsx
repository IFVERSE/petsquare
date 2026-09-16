import { createClient } from "@/lib/supabase/server";
import UsersList from "@/components/admin/UsersList";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, account_type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">User Management</h1>
      <p className="mt-1 text-sm text-navy/50">
        Every PetSquare account — pet owners and vendors. Suspending an account blocks their
        dashboard access (enforced in middleware) but doesn&apos;t sign them out of the public site.
      </p>
      <UsersList users={users ?? []} />
    </div>
  );
}
