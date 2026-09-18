"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, HeartPulse, MapPin, Phone, Search, ShieldCheck, Star } from "lucide-react";
import type { Vendor } from "@/lib/mock-data";
import { useCountry } from "@/lib/hooks/use-country";
import CountryPreference from "@/components/ui/CountryPreference";
import { useI18n } from "@/i18n/I18nProvider";

const needs = [
  { id: "health", label: "Health & wellness", categories: ["veterinary", "medical", "wellness", "veterinarian"], intro: "For checkups, vaccinations, symptoms, or ongoing care.", questions: ["What symptoms or changes have you noticed, and when did they start?", "Which vaccines, medicines, and past diagnoses should the provider know about?", "Is this a routine visit or does your pet need urgent attention?"] },
  { id: "grooming", label: "Grooming", categories: ["grooming"], intro: "For coat, nail, skin, and hygiene care.", questions: ["What coat type and grooming needs does your pet have?", "Does your pet have sensitive skin, anxiety, or handling concerns?", "What is included in the price and how long will the appointment take?"] },
  { id: "care", label: "Sitting & boarding", categories: ["boarding", "walking", "sitting", "daycare", "care"], intro: "For safe care while you work or travel.", questions: ["How are pets supervised and separated by size or temperament?", "What are the vaccination and emergency contact requirements?", "Can you share feeding, medication, and exercise instructions?"] },
  { id: "training", label: "Training & behaviour", categories: ["training", "behavior", "behaviour"], intro: "For skills, confidence, and behaviour support.", questions: ["Which specific behaviour do you want to work on?", "What methods does the trainer use?", "Can everyone at home follow the same practice plan?"] },
  { id: "other", label: "Other care", categories: ["shelter", "adoption", "memorial", "breeding"], intro: "For adoption support, specialist help, and life transitions.", questions: ["What experience does the provider have with your pet's situation?", "What documents or history should you bring?", "What support is available after the visit?"] },
] as const;

export default function ServiceFinder({ vendors }: { vendors: Vendor[] }) {
  const { country } = useCountry();
  const { href } = useI18n();
  const [need, setNeed] = useState<(typeof needs)[number]["id"]>("health");
  const [species, setSpecies] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("relevance");
  const selected = needs.find((item) => item.id === need)!;
  const results = useMemo(() => {
    const matches = vendors.filter((vendor) => {
      if (!selected.categories.some((category) => vendor.category.toLowerCase().includes(category))) return false;
      if (country && country !== "all" && vendor.countryCode !== country) return false;
      if (species !== "all" && vendor.species.length && !vendor.species.includes(species as Vendor["species"][number])) return false;
      if (query.trim() && !`${vendor.name} ${vendor.city} ${vendor.address}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
    return matches.sort((a, b) => sort === "rating" ? b.rating - a.rating : sort === "reviews" ? b.reviewCount - a.reviewCount : Number(b.badges.includes("business_verified")) - Number(a.badges.includes("business_verified")) || b.rating - a.rating);
  }, [vendors, selected, country, species, query, sort]);

  return <div className="mx-auto max-w-7xl px-5 py-8 sm:py-12 lg:px-8">
    <section className="overflow-hidden rounded-3xl bg-abyss px-6 py-9 text-white sm:px-10 sm:py-12 lg:px-14">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Pet care, made easier</p>
        <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">Find the right service for your pet</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">Start with what your pet needs. See relevant local providers and a practical checklist for your first conversation.</p>
      </div>
    </section>

    <div className="mt-7"><CountryPreference /></div>
    <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
      <div className="min-w-0">
        <h2 className="font-display text-2xl text-navy">What does your pet need?</h2>
        <p className="mt-1 text-sm text-navy/65">Choose a need to update the provider list and visit checklist.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2" role="group" aria-label="Choose a care need">
          {needs.map((item) => <button key={item.id} type="button" onClick={() => setNeed(item.id)} aria-pressed={need === item.id} className={`min-w-0 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tangerine ${need === item.id ? "border-tangerine bg-sage-light shadow-sm" : "border-paper-dim bg-surface hover:border-sage"}`}>
            <span className="block font-semibold text-navy">{item.label}</span><span className="mt-1 block text-sm leading-5 text-navy/65">{item.intro}</span>
          </button>)}
        </div>
        <div className="mt-7 rounded-2xl border border-paper-dim bg-surface p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_160px]">
            <label className="min-w-0 text-xs font-semibold text-navy/70">City or provider name
              <span className="mt-2 flex items-center gap-2 rounded-xl border border-paper-dim px-3 py-2.5"><Search className="h-4 w-4 shrink-0" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city or name" className="min-w-0 w-full bg-transparent text-sm text-navy outline-none placeholder:text-navy/40" /></span>
            </label>
            <label className="text-xs font-semibold text-navy/70">Pet
              <select value={species} onChange={(event) => setSpecies(event.target.value)} className="mt-2 w-full rounded-xl border border-paper-dim bg-surface px-3 py-2.5 text-sm text-navy"><option value="all">Any pet</option><option value="dog">Dog</option><option value="cat">Cat</option><option value="bird">Bird</option><option value="fish">Fish</option><option value="exotic">Other pet</option></select>
            </label>
            <label className="text-xs font-semibold text-navy/70">Sort providers
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="mt-2 w-full rounded-xl border border-paper-dim bg-surface px-3 py-2.5 text-sm text-navy"><option value="relevance">Recommended</option><option value="rating">Highest rated</option><option value="reviews">Most reviews</option></select>
            </label>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl text-navy">{selected.label} providers</h2><p aria-live="polite" className="mt-1 text-sm text-navy/60">{results.length} matching provider{results.length === 1 ? "" : "s"}</p></div><Link href={href("/vendors?view=map")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-tangerine hover:underline"><MapPin className="h-4 w-4" /> Explore all locations</Link></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {results.map((vendor) => <article key={vendor.id} className="flex min-w-0 flex-col rounded-2xl border border-paper-dim bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-tangerine">{vendor.category.replaceAll("_", " ")}</p>{vendor.badges.includes("business_verified") && <span title="Business verified" className="flex items-center gap-1 text-xs text-sage"><ShieldCheck className="h-4 w-4" /> Verified</span>}</div>
            <h3 className="mt-2 font-display text-xl text-navy">{vendor.name}</h3>
            <p className="mt-2 flex items-start gap-1.5 text-sm text-navy/65"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{[vendor.city, vendor.country].filter(Boolean).join(", ") || "Location available on profile"}</p>
            {vendor.rating > 0 && <p className="mt-2 flex items-center gap-1.5 text-sm text-navy/70"><Star className="h-4 w-4 fill-sunshine text-sunshine" />{vendor.rating.toFixed(1)} <span className="text-navy/50">({vendor.reviewCount} reviews)</span></p>}
            <div className="mt-auto flex flex-wrap gap-2 pt-5"><Link href={href(`/vendors/${vendor.slug}`)} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-tangerine px-4 py-2 text-sm font-semibold text-white">View provider <ArrowRight className="h-4 w-4" /></Link>{vendor.phone && <a href={`tel:${vendor.phone.replace(/[^+\d]/g, "")}`} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-paper-dim px-3 py-2 text-sm font-semibold text-navy"><Phone className="h-4 w-4" /> Call</a>}</div>
          </article>)}
          {results.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-paper-dim bg-surface p-8 text-center"><p className="font-semibold text-navy">No matching providers yet</p><p className="mt-2 text-sm text-navy/65">Try another country, pet, or city. You can also browse the full vendor directory.</p><Link href={href("/vendors")} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-tangerine hover:underline">Browse all vendors <ArrowRight className="h-4 w-4" /></Link></div>}
        </div>
      </div>
      <aside className="rounded-3xl border border-sage/30 bg-sage-light p-5 sm:p-6 lg:sticky lg:top-28">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sage"><CheckCircle2 className="h-4 w-4" /> Before you contact a provider</span>
        <h2 className="mt-3 font-display text-2xl text-navy">Ask better questions</h2>
        <p className="mt-2 text-sm leading-6 text-navy/70">Use these prompts to compare care options for {selected.label.toLowerCase()}.</p>
        <ol className="mt-5 space-y-4">{selected.questions.map((question, index) => <li key={question} className="flex gap-3 text-sm leading-6 text-navy"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface font-semibold text-sage">{index + 1}</span><span>{question}</span></li>)}</ol>
        <div className="mt-6 border-t border-sage/20 pt-5"><p className="flex items-start gap-2 text-sm leading-6 text-navy/75"><HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-coral" /> If your pet has urgent symptoms or trouble breathing, contact a local emergency veterinarian immediately.</p></div>
      </aside>
    </div>
  </div>;
}
