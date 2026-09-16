import { createClient } from "@/lib/supabase/server";
import { getPersonalizedDeals } from "@/lib/data/deals";
import DealCard from "@/components/ui/DealCard";
import { PawPrint, Heart, Bell, Eye } from "lucide-react";

export default async function DashboardOverview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: pets }, { data: saved }, { data: alerts }] = await Promise.all([
    supabase.from("pets").select("id, name, species, breed, photo_url").eq("owner_id", user!.id),
    supabase.from("saved_items").select("id, item_type").eq("user_id", user!.id),
    supabase.from("price_alerts").select("id").eq("user_id", user!.id),
  ]);

  const petList = pets ?? [];
  const firstPet = petList[0];
  const recommendations = firstPet ? await getPersonalizedDeals(firstPet.species, 4) : [];

  const stats = [
    { label: "Pets added", value: petList.length, icon: PawPrint },
    { label: "Deals & vendors saved", value: saved?.length ?? 0, icon: Heart },
    { label: "Active price alerts", value: alerts?.length ?? 0, icon: Bell },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Your PetSquare Activity</h1>
      <p className="mt-1 text-sm text-navy/50">
        A quick look at your pets, saved items, and personalized recommendations.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
            <s.icon className="h-5 w-5 text-tangerine" />
            <p className="mt-3 font-data text-3xl font-semibold text-navy">{s.value}</p>
            <p className="mt-1 text-sm text-navy/50">{s.label}</p>
          </div>
        ))}
      </div>

      {petList.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-paper-dim bg-surface p-8 text-center">
          <PawPrint className="mx-auto h-8 w-8 text-navy/30" />
          <p className="mt-3 font-display text-lg text-navy">Add your first pet</p>
          <p className="mt-1 text-sm text-navy/50">
            Tell us about your pet and we&apos;ll personalize deals and recommendations for them.
          </p>
          <a href="/dashboard/pets" className="mt-4 inline-block rounded-full bg-tangerine px-5 py-2.5 text-sm font-semibold text-white">
            Add a Pet →
          </a>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-sage" />
            <h2 className="font-display text-xl text-navy">
              {firstPet.name}&apos;s Recommendations
            </h2>
          </div>
          {recommendations.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map(({ deal, vendor }) => (
                <DealCard key={deal.id} deal={deal} vendor={vendor} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-navy/50">
              No {firstPet.species}-specific deals found yet — check back once more vendors are scraped, or
              browse <a href="/deals" className="font-medium text-tangerine hover:underline">all deals</a>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
