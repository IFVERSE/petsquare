'use client';
import { formatPrice, type Product } from '@/lib/products/model';
export default function ProductComparison({ products, remove, clear }: { products: Product[]; remove: (id: string) => void; clear: () => void }) {
  if (!products.length) return null;
  const rows = [
    ['Price', (p: Product) => formatPrice(p.price, p.currency)],
    ['Pack size', (p: Product) => p.pack || 'Not supplied'],
    ['Unit price', (p: Product) => p.unitPrice !== null && p.currency ? `${formatPrice(p.unitPrice, p.currency)} / ${p.unit}` : 'Not enough size or price information'],
    ['Saving', (p: Product) => p.discount ? `${p.discount}% from listed prices` : 'No confirmed reduction'],
    ['Retailer', (p: Product) => p.retailer],
    ['Availability', (p: Product) => p.availability === 'in_stock' ? 'Listed in stock' : p.availability === 'out_of_stock' ? 'Out of stock' : 'Check retailer'],
    ['Last checked', (p: Product) => p.checkedAt ? `${p.checkedAt.slice(0, 10)}${p.snapshot ? ' · saved snapshot' : ''}` : 'Unknown'],
  ] as const;
  return <section id="product-comparison" aria-labelledby="comparison-heading" className="mt-10 scroll-mt-6 rounded-3xl border border-sage/25 bg-surface p-5 sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-sage">Make a considered choice</p><h2 id="comparison-heading" className="mt-1 font-display text-2xl text-navy">Compare your picks ({products.length}/3)</h2></div><button onClick={clear} className="text-sm text-tangerine underline">Clear comparison</button></div>
    <p className="mb-5 mt-2 text-sm text-navy/60">Check pack sizes and currencies before comparing. Unit prices use the supplied pack size; delivery and eligibility are not included.</p>
    <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><caption className="sr-only">Product price and package comparison</caption><thead><tr><th scope="col" className="p-3">Details</th>{products.map(p => <th key={p.id} scope="col" className="max-w-64 p-3 align-top"><span className="block font-medium text-navy">{p.name}</span><button aria-label={`Remove ${p.name} from comparison`} onClick={() => remove(p.id)} className="mt-2 text-xs font-normal text-tangerine underline">Remove</button></th>)}</tr></thead><tbody>{rows.map(([label, value]) => <tr key={label} className="border-t border-paper-dim"><th scope="row" className="p-3 font-medium text-navy/60">{label}</th>{products.map(p => <td key={p.id} className="p-3 text-navy">{value(p)}</td>)}</tr>)}<tr className="border-t border-paper-dim"><th scope="row" className="p-3 font-medium text-navy/60">Source</th>{products.map(p => <td key={p.id} className="p-3"><a href={p.url} target="_blank" rel="noopener noreferrer" className="font-medium text-tangerine underline">Check retailer ↗</a></td>)}</tr></tbody></table></div>
  </section>;
}
