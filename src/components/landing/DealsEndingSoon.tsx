import { getDealsEndingSoon, getVendors } from "@/lib/data/deals";
import DealCard from "@/components/ui/DealCard";

export default async function DealsEndingSoon() {
  const [withEndDate, vendors] = await Promise.all([getDealsEndingSoon(4), getVendors()]);
  if (withEndDate.length === 0) return null;
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  return (
    <section className="bg-abyss py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <p className="font-data text-xs uppercase tracking-widest text-sunshine">⏰ Act fast</p>
        <h2 className="mt-1 font-display text-3xl text-white">Deals Ending Soon</h2>
        <p className="mt-1 text-sm text-white/50">
          Countdowns shown only when the vendor explicitly published an end date.
        </p>

        <div className="rail -mx-5 mt-8 flex gap-5 overflow-x-auto px-5 pb-4 lg:mx-0 lg:px-0">
          {withEndDate.map((deal) => {
            const vendor = vendorMap.get(deal.vendorId);
            if (!vendor) return null;
            return <DealCard key={deal.id} deal={deal} vendor={vendor} />;
          })}
        </div>
      </div>
    </section>
  );
}
