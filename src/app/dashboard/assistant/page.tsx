import { createClient } from "@/lib/supabase/server";
import AssistantChat from "@/components/dashboard/AssistantChat";

export default async function AssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, breed")
    .eq("owner_id", user!.id);

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <h1 className="font-display text-2xl text-navy">Meet Pawspero</h1>
      <p className="mt-1 text-sm text-navy/50">
        Ask about products, vendors, or general pet care. For medical concerns, the
        Pawspero will always point you to a licensed veterinarian.
      </p>
      <AssistantChat pets={pets ?? []} />
    </div>
  );
}
