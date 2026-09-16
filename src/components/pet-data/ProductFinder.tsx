'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Search, RefreshCw, Heart, SlidersHorizontal, ArrowUpRight, Scale, Share2, MapPin, PackageSearch } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useCountry } from '@/lib/hooks/use-country';
import { coordinates, type MapLocation } from '@/lib/map-data';
import { defaultFilters, parseFilters, filterProducts, petLabels, categoryLabels, type Filters, type Product, type ProductFeed } from '@/lib/products/model';
import { europe } from '../../../shared/europe.js';
import PetDataGrid from './PetDataGrid';
import ProductComparison from './ProductComparison';
import useProductShortlist from './useProductShortlist';

const LocationMap = dynamic(() => import('@/components/maps/LocationMap'), { ssr: false });
const inputClass = 'w-full rounded-xl border border-paper-dim bg-surface px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-sage/40';

export default function ProductFinder({ initialFeed }: { initialFeed: ProductFeed }) {
  const params = useSearchParams();
  const { href } = useI18n();
  const { country, setCountry } = useCountry();
  const [feed, setFeed] = useState(initialFeed);
  const [filters, setFilters] = useState(() => parseFilters(Object.fromEntries(params.entries())));
  const [view, setView] = useState('browse');
  const [visibleCount, setVisibleCount] = useState(24);
  const [compare, setCompare] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [shareLink, setShareLink] = useState('');
  const request = useRef<AbortController | null>(null);
  const { saved, toggle, storageError } = useProductShortlist();
  const savedIds = useMemo(() => new Set(saved.map(product => product.id)), [saved]);
  const effectiveCountry = filters.country || country || 'all';
  const effectiveFilters = useMemo(() => ({ ...filters, country: effectiveCountry }), [filters, effectiveCountry]);
  const currentById = useMemo(() => new Map(feed.items.map(item => [item.id, item])), [feed.items]);
  const available = useMemo(() => view === 'saved' ? saved.map(item => currentById.get(item.id) || { ...item, snapshot: true }) : feed.items, [view, saved, currentById, feed.items]);
  const filtered = useMemo(() => filterProducts(available, effectiveFilters), [available, effectiveFilters]);
  const compared = compare.map(item => currentById.get(item.id) || { ...item, snapshot: true });
  const currencies = [...new Set(['EUR', 'GBP', ...feed.items.map(item => item.currency).filter(Boolean), ...saved.map(item => item.currency).filter(Boolean)])].sort();
  const locations: MapLocation[] = filtered.flatMap(item => {
    const point = coordinates(item.lat, item.lng);
    return point ? [{ id: item.id, name: item.retailer, lat: point[0], lng: point[1], description: item.city || 'Retailer location', href: item.url, products: [{ name: item.name, href: item.url }] }] : [];
  });

  const refresh = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    setRefreshing(true);
    try {
      const response = await fetch('/api/pet-data', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Source unavailable');
      const next: ProductFeed = await response.json();
      if (!Array.isArray(next.items) || !Array.isArray(next.sources)) throw new Error('Invalid response');
      if (controller.signal.aborted) return;
      setFeed(previous => {
        const unavailable = new Set(next.sources.filter(source => source.status === 'unavailable').map(source => source.name));
        const retained = previous.items.filter(item => unavailable.has(item.source === 'zooplus' ? 'Zooplus' : 'PetSquare vendors')).map(item => ({ ...item, snapshot: true }));
        return { ...next, items: [...next.items, ...retained] };
      });
      setError('');
    } catch { if (!controller.signal.aborted) setError('Could not update products. Your last loaded results and shortlist are still available.'); }
    finally { if (request.current === controller) { request.current = null; if (!controller.signal.aborted) setRefreshing(false); } }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 60000);
    return () => { clearTimeout(initial); clearInterval(timer); request.current?.abort(); request.current = null; };
  }, [refresh]);

  function change<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(previous => ({ ...previous, [key]: value, ...(key === 'currency' && value === 'all' ? { budget: '', sort: 'recent' } : {}) }));
    setVisibleCount(24); setShareLink('');
  }
  function reset() { setFilters({ ...defaultFilters, country: 'all' }); setCountry('all'); setVisibleCount(24); }
  function toggleCompare(item: Product) {
    setCompare(previous => previous.some(p => p.id === item.id) ? previous.filter(p => p.id !== item.id) : previous.length < 3 ? [...previous, item] : previous);
  }
  async function share() {
    const url = new URL(window.location.href); url.search = ''; url.hash = '';
    for (const [key, value] of Object.entries(effectiveFilters)) if (value !== '' && value !== false && value !== 'all') url.searchParams.set(key === 'query' ? 'q' : key, String(value));
    url.searchParams.set('country', effectiveCountry);
    setShareLink(url.href);
    try { await navigator.clipboard.writeText(url.href); setNotice('Search link copied. It shares your filters, not your private shortlist.'); }
    catch { setNotice('Copy the search link below.'); }
  }

  return <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] bg-abyss text-white">
      <div className="relative z-10 grid md:grid-cols-[1.35fr_0.65fr]">
        <div className="p-7 sm:p-10"><p className="font-data text-xs uppercase tracking-[0.2em] text-white/65">The PetSquare product finder</p>
          <h1 className="mt-4 max-w-xl font-display text-4xl leading-tight sm:text-5xl">Good finds.<br /><span className="text-[#d3e6b4]">Happier pets.</span></h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70">Find their favourites, compare the details, and keep a little list for later. Recently checked products from pet retailers, all in one place.</p>
          <div className="mt-6 flex flex-wrap gap-3"><a href="#product-filters" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-abyss">Find something for my pet</a><button onClick={() => { setView('saved'); document.getElementById('product-results')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm"><Heart className="h-4 w-4" /> My shortlist ({saved.length})</button></div>
        </div>
        <div className="relative hidden min-h-72 md:block"><Image src="/images/categories/boarding.jpg" alt="Two dogs enjoying time outdoors" fill priority sizes="(min-width: 768px) 35vw, 1px" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-abyss via-transparent to-transparent" /><span className="absolute bottom-5 right-5 rounded-full bg-abyss/70 px-3 py-2 text-xs">A little care. A lot of joy.</span></div>
      </div>
    </section>

    <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[[feed.items.length, 'Products to explore'], [new Set(feed.items.map(p => p.retailer)).size, 'Retailers represented'], [feed.items.filter(p => p.discount).length, 'Listed price reductions'], [saved.length, 'In your shortlist']].map(([count, label]) => <div key={label} className="rounded-2xl border border-paper-dim bg-surface px-5 py-4"><p className="font-data text-2xl font-semibold text-navy">{count}</p><p className="mt-1 text-xs text-navy/55">{label}</p></div>)}</div>

    <section id="product-filters" aria-labelledby="finder-heading" className="scroll-mt-4 rounded-3xl border border-paper-dim bg-surface p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 id="finder-heading" className="flex items-center gap-2 font-display text-xl text-navy"><SlidersHorizontal className="h-4 w-4 text-sage" /> Make it personal</h2><p className="mt-1 text-xs text-navy/55">{!country && !filters.country ? 'Choose your country to find a better fit for you and your pet.' : 'Country filters show the retailer market, not a delivery guarantee.'}</p></div><button onClick={reset} className="text-xs font-medium text-tangerine underline">Reset filters</button></div>
      <div className="flex flex-wrap gap-2" aria-label="Shop by pet">{Object.entries({ all: 'All pets', ...petLabels }).map(([value, label]) => <button key={value} aria-pressed={filters.pet === value} onClick={() => change('pet', value)} className={`rounded-full px-4 py-2 text-sm ${filters.pet === value ? 'bg-sage text-white' : 'bg-paper text-navy/70'}`}>{label}</button>)}</div>
      <div className="mt-5 grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <label className="text-xs font-medium text-navy">Search products<span className="relative mt-2 block"><Search className="absolute left-3 top-3 h-4 w-4 text-navy/40" /><input aria-label="Search products" type="search" value={filters.query} maxLength={160} onChange={event => change('query', event.target.value)} placeholder="Try a brand, favourite food or a new toy" className={`${inputClass} pl-9`} /></span></label>
        <label className="text-xs font-medium text-navy">Retailer country<select aria-label="Retailer country" value={effectiveCountry} onChange={event => { change('country', event.target.value); setCountry(event.target.value); }} className={`${inputClass} mt-2`}><option value="all">All countries</option>{Object.entries(europe).map(([code, [name]]) => <option key={code} value={code}>{name}</option>)}</select></label>
        <label className="text-xs font-medium text-navy">Product category<select aria-label="Product category" value={filters.category} onChange={event => change('category', event.target.value)} className={`${inputClass} mt-2`}><option value="all">All essentials</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <div className="mt-4 grid items-end gap-4 sm:grid-cols-3"><label className="text-xs font-medium text-navy">Currency<select aria-label="Currency" value={filters.currency} onChange={event => change('currency', event.target.value)} className={`${inputClass} mt-2`}><option value="all">All currencies</option>{currencies.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs font-medium text-navy">Maximum price<input aria-label="Maximum price" type="number" min="0" step="0.01" value={filters.budget} disabled={filters.currency === 'all'} onChange={event => change('budget', event.target.value)} placeholder={filters.currency === 'all' ? 'Choose a currency first' : `Any price in ${filters.currency}`} className={`${inputClass} mt-2 disabled:opacity-50`} /></label>
        <label className="text-xs font-medium text-navy">Sort by<select aria-label="Sort by" value={filters.sort} onChange={event => change('sort', event.target.value)} className={`${inputClass} mt-2`}><option value="recent">Most recently checked</option><option value="saving">Biggest listed saving</option><option value="price-low" disabled={filters.currency === 'all'}>Price: low to high</option><option value="price-high" disabled={filters.currency === 'all'}>Price: high to low</option></select></label>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs text-navy/70">{([['offers', 'Price reductions only'], ['stock', 'Listed in stock'], ['fresh', 'Checked in the last 48 hours']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={filters[key]} onChange={event => change(key, event.target.checked)} className="accent-sage" />{label}</label>)}</div>
    </section>

    <div id="product-results" className="mb-5 mt-8 flex flex-wrap items-center justify-between gap-4"><div className="flex rounded-full border border-paper-dim bg-surface p-1" aria-label="Product view">{[['browse', 'Browse'], ['saved', `Shortlist (${saved.length})`], ['map', 'Retailer map']].map(([value, label]) => <button key={value} aria-pressed={view === value} onClick={() => { setView(value); setVisibleCount(24); }} className={`rounded-full px-4 py-2 text-xs font-medium ${view === value ? 'bg-abyss text-white' : 'text-navy/60'}`}>{label}</button>)}</div>
      <div className="flex gap-4"><button onClick={() => void share()} className="flex items-center gap-1.5 text-xs text-navy/70"><Share2 className="h-3.5 w-3.5" /> Share search</button><button disabled={refreshing} onClick={() => void refresh()} className="flex items-center gap-1.5 text-xs text-sage disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} />{refreshing ? 'Updating…' : 'Refresh products'}</button></div>
    </div>
    <div role="status" aria-live="polite" className="mb-4 text-sm text-navy/60">{filtered.length} matching {filtered.length === 1 ? 'product' : 'products'}{view === 'saved' ? ' in your shortlist' : ''}. {compare.length > 0 && <a href="#product-comparison" className="ml-2 font-medium text-tangerine underline">Compare {compare.length} selected</a>}</div>
    {(error || storageError) && <p role="alert" className="mb-4 rounded-xl bg-coral/10 p-3 text-sm text-navy">{error || storageError}</p>}
    {notice && <p role="status" className="mb-3 text-sm text-sage">{notice}</p>}
    {shareLink && <label className="mb-4 block text-xs text-navy/60">Your shareable search link<input aria-label="Shareable search link" readOnly value={shareLink} onFocus={event => event.target.select()} className={`${inputClass} mt-1`} /></label>}
    {feed.sources.some(source => source.status === 'unavailable') && <p className="mb-4 text-xs text-navy/60">Some retailers could not be updated. Available results are shown; please check each retailer before buying.</p>}
    {view === 'saved' && <p className="mb-4 text-xs text-navy/60">Saved on this browser, without an account. Items missing from current results are shown as saved snapshots.</p>}
    {filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-sage/30 bg-surface p-8 text-center sm:p-12"><PackageSearch className="mx-auto h-10 w-10 text-sage/60" /><h2 className="mt-4 font-display text-2xl text-navy">{view === 'saved' && !saved.length ? 'Make room for a few favourites' : feed.items.length ? 'A different filter might be the perfect fit' : 'Your next good find is on its way'}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-navy/60">{view === 'saved' && !saved.length ? 'Tap a heart on any product to keep it here for later. Compare up to three picks before deciding.' : feed.items.length ? 'Try another pet, country or budget. Products with an unknown market appear under All countries.' : 'There are no product listings available right now. You can still explore pet businesses and recently spotted offers in your country.'}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button onClick={() => { reset(); setView('browse'); }} className="rounded-full bg-sage px-5 py-3 text-sm font-medium text-white">{feed.items.length ? 'Show all products' : 'Reset search'}</button><Link href={href('/deals')} className="rounded-full border border-paper-dim px-5 py-3 text-sm text-navy">Explore pet offers ↗</Link><Link href={href('/vendors')} className="rounded-full border border-paper-dim px-5 py-3 text-sm text-navy">Find a pet business ↗</Link></div></div> : view === 'map' ? <><p className="mb-3 flex items-center gap-2 text-xs text-navy/60"><MapPin className="h-3 w-3" />Retailer locations, not delivery coverage. Only supplied coordinates are mapped.</p><LocationMap locations={locations} missing={filtered.length - locations.length} /></> : <PetDataGrid items={filtered.slice(0, visibleCount)} savedIds={savedIds} compareIds={compare.map(p => p.id)} onSave={toggle} onCompare={toggleCompare} />}
    {view !== 'map' && filtered.length > visibleCount && <div className="mt-6 text-center"><button onClick={() => setVisibleCount(count => count + 24)} className="rounded-full border border-sage px-6 py-3 text-sm text-sage">Show more products ({filtered.length - visibleCount} remaining)</button></div>}
    {compare.length > 0 && <div className="sticky bottom-4 z-20 mx-auto mt-6 flex max-w-lg items-center justify-between gap-3 rounded-2xl bg-abyss px-5 py-3 text-white shadow-lg"><span className="flex items-center gap-2 text-sm"><Scale className="h-4 w-4" />{compare.length}/3 picks</span><a href="#product-comparison" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-abyss">Compare details</a><button aria-label="Clear selected products" onClick={() => setCompare([])} className="text-xs text-white/70 underline">Clear</button></div>}
    <ProductComparison products={compared} remove={id => setCompare(previous => previous.filter(p => p.id !== id))} clear={() => setCompare([])} />

    <section className="mb-4 mt-10 grid gap-4 sm:grid-cols-3">{[
      ['Compare the pack, not just the price', 'Use the per-kilo or per-litre price when provided. A bigger pack is not always better value.'],
      ['Check what fits your pet', 'Confirm size, life stage and product details with the retailer. Search labels help you browse; they are not suitability guarantees.'],
      ['Keep the full cost in view', 'Before buying, check delivery costs, minimum orders and any promotion conditions on the retailer website.'],
    ].map(([title, body]) => <div key={title} className="rounded-2xl bg-sage/5 p-5"><ArrowUpRight className="mb-3 h-4 w-4 text-sage" /><h2 className="font-display text-base text-navy">{title}</h2><p className="mt-2 text-xs leading-relaxed text-navy/60">{body}</p></div>)}</section>
    <p className="pb-4 text-xs leading-relaxed text-navy/45">Product details are collected from retailer websites and may change. Refresh retrieves the latest saved results; it does not check out or place an order. {feed.capped ? 'Showing the most recent saved listings; this is not an exhaustive catalogue.' : ''} Prices in different currencies are not ranked against each other.</p>
  </div>;
}
