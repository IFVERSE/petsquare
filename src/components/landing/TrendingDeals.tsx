import { getTrendingDeals, getVendors } from "@/lib/data/deals";
import DealCard from "@/components/ui/DealCard";

export default async function TrendingDeals() {
  const [top, vendors] = await Promise.all([getTrendingDeals(6), getVendors()]);
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-data text-xs uppercase tracking-widest text-coral">🔥 Live from the scraper</p>
          <h2 className="mt-1 font-display text-3xl text-navy">Trending Pet Deals</h2>
        </div>
        <a href="/deals" className="hidden font-medium text-tangerine hover:underline sm:block">
          See all deals →
        </a>
      </div>

      <div className="rail -mx-5 flex gap-5 overflow-x-auto px-5 pb-4 lg:mx-0 lg:px-0">
        {top.map((deal) => {
          const vendor = vendorMap.get(deal.vendorId);
          if (!vendor) return null;
          return <DealCard key={deal.id} deal={deal} vendor={vendor} />;
        })}
      </div>
    </section>
  );
}
