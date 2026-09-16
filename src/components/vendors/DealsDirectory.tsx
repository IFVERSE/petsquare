"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CountryPreference from "@/components/ui/CountryPreference";
import { useCountry } from "@/lib/hooks/use-country";
import { Search } from "lucide-react";
import { categories, petTypes, ProductCategory, Species, Deal, Vendor } from "@/lib/mock-data";
import DealCard from "@/components/ui/DealCard";

export default function DealsDirectory({ deals, vendors }: { deals: Deal[]; vendors: Vendor[] }) {
  const { country } = useCountry();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<ProductCategory | "all">(
    (params.get("category") as ProductCategory) ?? "all"
  );
  const [species, setSpecies] = useState<Species | "all">((params.get("species") as Species) ?? "all");

  const vendorMap = useMemo(() => new Map(vendors.map((v) => [v.id, v])), [vendors]);

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      const vendor = vendorMap.get(d.vendorId);
      if (!vendor) return false;
      if (country && country !== "all" && vendor.countryCode !== country) return false;
      if (category !== "all" && d.category !== category) return false;
      if (species !== "all" && !d.species.includes(species)) return false;
      if (query) {
        const haystack = `${d.productName} ${d.description} ${vendor.name} ${vendor.city}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [deals, vendorMap, query, category, species, country]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="mb-6"><CountryPreference /></div>
      <h1 className="font-display text-3xl text-navy">Pet Deals Directory</h1>
      <p className="mt-1 text-navy/60">
        Every deal here is scraper-verified — original price, discount price and a &ldquo;last checked&rdquo; timestamp.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-paper-dim bg-surface px-4 py-3">
        <Search className="h-4 w-4 text-navy/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search deals..."
          className="w-full bg-transparent text-sm text-navy placeholder:text-navy/40 focus:outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("all")}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${category === "all" ? "bg-abyss text-white" : "bg-surface border border-paper-dim text-navy/70"}`}
        >
          All categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${category === c.id ? "bg-tangerine text-white" : "bg-surface border border-paper-dim text-navy/70"}`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => setSpecies("all")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${species === "all" ? "bg-abyss text-white" : "bg-surface border border-paper-dim text-navy/60"}`}
        >
          All pets
        </button>
        {petTypes.map((p) => (
          <button
            key={p.id}
            onClick={() => setSpecies(p.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${species === p.id ? "bg-sage text-white" : "bg-surface border border-paper-dim text-navy/60"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-navy/50">{filtered.length} deals found</p>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => {
          const vendor = vendorMap.get(d.vendorId)!;
          return <DealCard key={d.id} deal={d} vendor={vendor} />;
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-16 text-center text-navy/40">No deals match those filters yet.</p>
        )}
      </div>
    </div>
  );
}
