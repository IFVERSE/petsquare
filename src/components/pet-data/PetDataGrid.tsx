"use client";
import { Heart, Plus, Check, ExternalLink } from "lucide-react";
import { formatPrice, type Product } from "@/lib/products/model";
import ProductPhoto from "./ProductPhoto";
import CountdownTimer from "@/components/ui/CountdownTimer";

export default function PetDataGrid({ items, savedIds, compareIds, onSave, onCompare }: { items: Product[]; savedIds: Set<string>; compareIds: string[]; onSave: (product: Product) => void; onCompare: (product: Product) => void }) {
  return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
    {items.map(item => <article key={item.id} className="group flex flex-col rounded-3xl border border-paper-dim bg-surface p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="relative"><ProductPhoto src={item.image} name={item.name} />
        {item.discount !== null && item.discount > 0 && <span className="absolute left-3 top-3 rounded-full bg-coral px-3 py-1 font-data text-xs font-semibold text-white">{item.discount}% off</span>}
        <button type="button" aria-label={`${savedIds.has(item.id) ? 'Unsave' : 'Save'} ${item.name}`} aria-pressed={savedIds.has(item.id)} onClick={() => onSave(item)} className="absolute right-3 top-3 rounded-full bg-white p-2.5 text-navy shadow-sm"><Heart className={`h-4 w-4 ${savedIds.has(item.id) ? 'fill-coral text-coral' : ''}`} /></button>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sage">{item.retailer}{item.country ? ` · ${item.country}` : ' · Market unspecified'}</p>
        <h2 className="mt-2 font-display text-lg leading-snug text-navy">{item.name}</h2>
        {item.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-navy/60">{item.description}</p>}
        {item.pack && <p className="mt-2 text-xs text-navy/60">Pack: {item.pack}</p>}
        <div className="mt-4 flex flex-wrap items-baseline gap-2"><p className="font-data text-xl font-semibold text-navy">{formatPrice(item.price, item.currency)}</p>{item.originalPrice !== null && <del className="text-xs text-navy/45">{formatPrice(item.originalPrice, item.currency)}</del>}</div>
        {item.unitPrice !== null && item.currency && <p className="mt-1 text-xs font-medium text-sage">{formatPrice(item.unitPrice, item.currency)} / {item.unit}</p>}
        <p className="mt-2 text-xs text-navy/60">{item.availability === 'in_stock' ? 'Listed in stock' : item.availability === 'out_of_stock' ? 'Listed out of stock' : 'Availability: check retailer'}</p>
        {item.endsAt && <div className="mt-2"><CountdownTimer endsAt={item.endsAt} /></div>}
        <p className="mb-4 mt-2 text-[11px] text-navy/45">{item.snapshot ? 'Previously saved · ' : ''}{item.checkedAt ? `Checked ${item.checkedAt.slice(0, 10)}` : 'Check time unavailable'}. Confirm current price and delivery.</p>
        <div className="mt-auto flex gap-2 border-t border-paper-dim pt-3"><a href={item.url} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sage px-3 py-2.5 text-xs font-medium text-white">Check retailer <ExternalLink className="h-3 w-3" /></a><button type="button" aria-label={`Compare ${item.name}`} aria-pressed={compareIds.includes(item.id)} onClick={() => onCompare(item)} disabled={compareIds.length === 3 && !compareIds.includes(item.id)} className="flex items-center gap-1 rounded-xl border border-paper-dim px-3 py-2 text-xs text-navy disabled:opacity-40">{compareIds.includes(item.id) ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Compare</button></div>
      </div>
    </article>)}
  </div>;
}
