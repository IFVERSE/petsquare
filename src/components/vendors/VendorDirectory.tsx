"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { coordinates } from "@/lib/map-data";
import { useI18n } from "@/i18n/I18nProvider";
import { europe } from "../../../shared/europe.js";
import CountryPreference from "@/components/ui/CountryPreference";
import { useCountry } from "@/lib/hooks/use-country";
import { Search, List, Map as MapIcon, ArrowRight, Store, Tag, MapPin } from "lucide-react";
import { Vendor, Deal } from "@/lib/mock-data";
import VendorCard from "@/components/ui/VendorCard";

const categoryFilters: { id: Vendor["category"] | "all"; label: string; emoji: string }[] = [
  { id: "all", label: "All", emoji: "🐾" },
  { id: "retailer", label: "Pet Retailers", emoji: "🛍️" },
  { id: "veterinary", label: "Veterinary & Wellness", emoji: "🏥" },
  { id: "grooming", label: "Grooming", emoji: "✂️" },
  { id: "boarding", label: "Care & Boarding", emoji: "🏨" },
  { id: "walking", label: "Dog walking", emoji: "??" },
  { id: "shelter", label: "Shelters & adoption", emoji: "??" },
  { id: "memorial", label: "Memorial", emoji: "??" },
  { id: "breeding", label: "Breeders", emoji: "??" },
  { id: "training", label: "Training", emoji: "🎓" },
];

const LocationMap = dynamic(() => import("@/components/maps/LocationMap"), { ssr: false });

export default function VendorDirectory({ vendors, deals }: { vendors: Vendor[]; deals: Deal[] }) {
  const { country } = useCountry();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { href } = useI18n();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [liveVendors, setLiveVendors] = useState<{ name: string; category: string; description: string; city: string | null; address: string | null; phone: string | null; website: string | null; services: string[]; sourceUrl: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const initialQuery = searchParams.get("q");
    if (initialQuery) void runDiscovery(initialQuery);
  // Run once for the landing-page query.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runDiscovery(searchQuery: string) {
    if (!searchQuery.trim()) return;
    setLoading(true); setError(""); setSearched(false);
    try {
      const response = await fetch("/api/pet-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: searchQuery.trim(), location: country && country !== "all" ? String(europe[country as keyof typeof europe]?.[0] || "") : "" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Discovery failed.");
      setLiveVendors(data.vendors || []); setSearched(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Discovery failed."); setLiveVendors([]); }
    finally { setLoading(false); }
  }

  function discover(e: React.FormEvent) { e.preventDefault(); void runDiscovery(query); }
  const [category, setCategory] = useState<Vendor["category"] | "all">("all");
  const [minRating, setMinRating] = useState(0);
  const [dealsOnly, setDealsOnly] = useState(false);
  const view = searchParams.get("view") === "map" ? "map" : "list";
  function setView(mode: "list" | "map") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }
  useEffect(() => {
    if (view !== "map") return;
    const timer = setInterval(() => { if (!document.hidden) router.refresh(); }, 60000);
    return () => clearInterval(timer);
  }, [router, view]);


  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (country && country !== "all" && v.countryCode !== country) return false;
      if (category !== "all" && v.category !== category) return false;
      if (minRating && (!v.rating || v.rating < minRating)) return false;
      if (dealsOnly && v.activeDealCount === 0) return false;
      if (query && !`${v.name} ${v.city} ${v.country} ${deals.filter((d) => d.vendorId === v.id).map((d) => d.productName).join(" ")}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, category, minRating, dealsOnly, vendors, deals, country]);

  const locations = useMemo(() => filtered.filter((v) => coordinates(v.lat, v.lng)).map((v) => ({
    id: v.id, name: v.name, lat: v.lat, lng: v.lng,
    description: [v.address, v.city, v.country].filter(Boolean).join(", "),
    href: href(`/vendors/${v.slug}`),
    products: deals.filter((d) => d.vendorId === v.id && d.availability !== "out_of_stock" && (!d.dealEndsAt || new Date(d.dealEndsAt).getTime() > Date.now())).map((d) => ({ name: d.productName, href: d.sourceUrl || href(`/vendors/${v.slug}`) })),
  })), [filtered, deals, href]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="mb-6"><CountryPreference /></div>
      <section className="rounded-3xl bg-abyss px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">The business directory</p><h1 className="mt-3 font-display text-3xl sm:text-4xl">Explore pet businesses near you</h1><p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">Compare local stores and providers, browse their products and deals, or see them on a map.</p></div>
          <a href={href("/services")} className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-navy md:self-auto">Need a care service? <ArrowRight className="h-4 w-4" /></a>
        </div>
      </section>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-paper-dim bg-surface p-4"><Store className="h-5 w-5 shrink-0 text-tangerine" /><div><p className="font-semibold text-navy">{vendors.length} businesses</p><p className="text-xs text-navy/60">Browse profiles and contact details</p></div></div>
        <div className="flex items-center gap-3 rounded-2xl border border-paper-dim bg-surface p-4"><Tag className="h-5 w-5 shrink-0 text-tangerine" /><div><p className="font-semibold text-navy">{deals.filter((deal) => deal.availability !== "out_of_stock" && (!deal.dealEndsAt || new Date(deal.dealEndsAt).getTime() > Date.now())).length} available deals</p><p className="text-xs text-navy/60">Find offers from listed vendors</p></div></div>
        <button type="button" onClick={() => setView("map")} className="flex items-center gap-3 rounded-2xl border border-paper-dim bg-surface p-4 text-left hover:border-sage"><MapPin className="h-5 w-5 shrink-0 text-tangerine" /><div><p className="font-semibold text-navy">Explore the map</p><p className="text-xs text-navy/60">See businesses by location</p></div></button>
      </div>

      {/* Search + view toggle */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={discover} className="flex flex-1 items-center gap-2 rounded-2xl border border-paper-dim bg-surface px-4 py-3">
          <Search className="h-4 w-4 text-navy/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendors, products or services"
            className="w-full bg-transparent text-sm text-navy placeholder:text-navy/40 focus:outline-none"
          />
          <button type="submit" disabled={loading} className="rounded-xl bg-tangerine px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Searching…" : "Search web"}</button>
        </form>
        <div className="flex rounded-2xl border border-paper-dim bg-surface p-1">
          <button
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              view === "list" ? "bg-abyss text-white" : "text-navy/60"
            }`}
          >
            <List className="h-4 w-4" /> List
          </button>
          <button
            onClick={() => setView("map")}
            aria-pressed={view === "map"}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              view === "map" ? "bg-abyss text-white" : "text-navy/60"
            }`}
          >
            <MapIcon className="h-4 w-4" /> Map
          </button>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-coral">{error}</p>}
      {searched && <section className="mt-6" aria-label="Live vendor discovery">
        <h2 className="font-display text-xl text-navy">Discovered on the web</h2>
        {liveVendors.length === 0 ? <p className="mt-2 text-sm text-navy/60">No vendor websites could be verified for this search.</p> :
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{liveVendors.map((vendor) =>
            <article key={vendor.sourceUrl} className="rounded-2xl border border-paper-dim bg-surface p-5">
              <h3 className="font-display text-lg text-navy">{vendor.name}</h3>
              <p className="mt-1 text-xs uppercase text-tangerine">{vendor.category}{vendor.city ? ` · ${vendor.city}` : ""}</p>
              <p className="mt-3 text-sm text-navy/70">{vendor.description}</p>
              {vendor.address && <p className="mt-2 text-sm text-navy/60">{vendor.address}</p>}
              {vendor.phone && <p className="mt-1 text-sm text-navy/60">{vendor.phone}</p>}
              <a href={vendor.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-tangerine hover:underline">Visit website</a>
            </article>)}</div>}
      </section>}

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {categoryFilters.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              category === c.id ? "bg-tangerine text-white" : "bg-surface text-navy/70 border border-paper-dim"
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-paper-dim" />
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="rounded-full border border-paper-dim bg-surface px-3.5 py-1.5 text-sm text-navy/70"
        >
          <option value={0}>Any rating</option>
          <option value={4}>4.0+ ⭐</option>
          <option value={4.5}>4.5+ ⭐</option>
        </select>
        <button
          onClick={() => setDealsOnly((d) => !d)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            dealsOnly ? "bg-coral text-white" : "bg-surface text-navy/70 border border-paper-dim"
          }`}
        >
          🔥 Active deals only
        </button>
      </div>

      <p className="mt-4 text-sm text-navy/50">{filtered.length} vendors found</p>

      {view === "list" ? (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <div key={v.id} className="w-full">
              <VendorCard vendor={v} />
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-16 text-center text-navy/40">No vendors match those filters yet.</p>
          )}
        </div>
      ) : (
        <LocationMap locations={locations} missing={filtered.length - locations.length} />
      )}
    </div>
  );
}
