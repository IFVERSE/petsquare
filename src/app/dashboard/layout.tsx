import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export const metadata = { title: "My PetSquare — Dashboard" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Middleware already redirects to /auth/sign-in when Supabase isn't
  // configured — this is just a defensive fallback.
  if (!isSupabaseConfigured) redirect("/auth/sign-in?next=/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, account_type")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen bg-paper">
      <DashboardSidebar
        name={profile?.full_name || user.email?.split("@")[0] || "Pet Owner"}
        email={user.email ?? ""}
        accountType={profile?.account_type ?? "pet_owner"}
      />
      <main className="flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}
