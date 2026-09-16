import { createClient } from "@/lib/supabase/server";
import PetManager from "@/components/dashboard/PetManager";

export default async function PetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, breed, gender, size, weight_kg, activity_level, allergies, photo_url, created_at")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">My Pets</h1>
      <p className="mt-1 text-sm text-navy/50">
        Add a pet profile to unlock personalized deals, breed-specific recommendations, and the AI assistant.
      </p>
      <PetManager initialPets={pets ?? []} />
    </div>
  );
}
