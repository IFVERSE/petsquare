'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useCountry } from '@/lib/hooks/use-country';
import CountryPreference from '@/components/ui/CountryPreference';
import VendorImagery from '@/components/ui/VendorImagery';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { vendorCategories } from '../../../shared/europe.js';
import { activeOffers } from '../../../shared/offers.js';

type Offer = { title: string; sourceUrl: string; endsAt: string | null; observedAt: string; timerSeen: boolean; discountPercent: number | null; discountKind: string };
type Place = { id: string; slug: string; name: string; category: string; location: string; lastScraped: string; sourceUrl: string; website?: string; images?: string[]; offers?: Offer[] };

export default function DiscoveryFeed({ dealsOnly = false }: { dealsOnly?: boolean }) {
  const { href } = useI18n();
  const { country } = useCountry();
  const [category, setCategory] = useState('all');
  const [pageState, setPage] = useState({ filter: '', page: 0 });
  const filter = `${country}:${category}`;
  const page = pageState.filter === filter ? pageState.page : 0;
  const [result, setResult] = useState<{ key: string; places: Place[]; hasMore: boolean } | null>(null);
  const [errorKey, setErrorKey] = useState('');
  const key = `${country || 'all'}:${category}:${page}:${dealsOnly}`;
  const places = result?.key === key ? result.places : [];
  const loading = result?.key !== key && errorKey !== key;
  const error = errorKey === key;

  useEffect(() => {
    let disposed = false, pending = false;
    const controller = new AbortController();
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const params = new URLSearchParams({ country: country || 'all', category, page: String(page), offers: String(dealsOnly) });
        const response = await fetch(`/api/places/recent?${params}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Unavailable');
        const data = await response.json();
        if (!disposed) { setResult({ key, places: data.places, hasMore: data.hasMore }); setErrorKey(''); }
      } catch { if (!disposed) setErrorKey(key); }
      finally { pending = false; }
    }
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 60000);
    return () => { disposed = true; controller.abort(); clearInterval(timer); };
  }, [country, category, page, dealsOnly, key]);

  const headingId = dealsOnly ? 'osm-offers-heading' : 'recent-osm-heading';
  return <section aria-labelledby={headingId} className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><p className="font-data text-xs uppercase tracking-widest text-sage">{dealsOnly ? 'Offers from vendor websites' : 'Discover their world'}</p>
        <h2 id={headingId} className="mt-1 font-display text-3xl text-navy">{dealsOnly ? 'Flash sales & pet offers' : 'Pet shops, care & services across Europe'}</h2>
        <p className="mt-2 text-sm text-navy/60">{dealsOnly ? 'Recently spotted promotions. Confirm prices, eligibility and availability with the vendor.' : 'Explore products and services from recently checked vendor websites.'}</p></div>
      <Link href={href(dealsOnly ? '/deals' : '/vendors')} className="text-sm font-medium text-tangerine hover:underline">{dealsOnly ? 'All deals' : 'All vendors'} →</Link>
    </div>
    <CountryPreference />
    <div className="my-5 flex flex-wrap gap-2" aria-label="Vendor category">
      {Object.entries({ all: 'All categories', ...vendorCategories }).map(([value, label]) => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={`rounded-full border px-3 py-2 text-xs ${category === value ? 'border-sage bg-sage text-white' : 'border-paper-dim bg-surface text-navy'}`}>{label}</button>)}
    </div>
    <p role="status" className="mb-4 text-sm text-navy/60">{loading ? 'Loading discoveries…' : error ? 'Updates are temporarily unavailable. Please try again shortly.' : !places.length ? 'No recent results for these filters yet. Try another country or category.' : 'Fresh discoveries · updates every minute'}</p>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {places.map(place => <article key={place.id} className="overflow-hidden rounded-3xl border border-paper-dim bg-surface shadow-sm">
        <VendorImagery images={place.images} category={place.category} name={place.name} />
        <div className="p-5">
          <p className="text-xs uppercase tracking-wide text-sage">{vendorCategories[place.category as keyof typeof vendorCategories] || 'Pet services'}</p>
          <h3 className="mt-2 font-display text-xl text-navy"><Link href={href(`/vendors/${place.slug}`)} className="hover:underline">{place.name}</Link></h3>
          {place.location && <p className="mt-2 flex items-start gap-2 text-sm text-navy/60"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{place.location}</p>}
          {activeOffers(place.offers).slice(0, 3).map((offer: Offer, index: number) => <div key={index} className="mt-4 rounded-2xl border border-coral/20 bg-coral/5 p-3">
            <span className="inline-block rounded-full bg-coral px-2 py-1 text-xs font-semibold text-white">{offer.discountPercent ? `${offer.discountKind === 'up_to' ? 'Up to ' : ''}${offer.discountPercent}% advertised` : offer.timerSeen ? 'Timed offer spotted' : 'Offer spotted'}</span>
            <p className="mt-2 text-sm text-navy">{offer.title}</p>
            {offer.endsAt ? <CountdownTimer endsAt={offer.endsAt} /> : offer.timerSeen ? <p className="mt-1 text-xs text-navy/60">Timer detected; end time unconfirmed.</p> : null}
            <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs font-medium text-tangerine underline">Check offer and final savings on vendor website ↗</a>
          </div>)}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {place.website && <a href={place.website} target="_blank" rel="noopener noreferrer" className="rounded-full bg-sage px-4 py-2 text-xs font-medium text-white">Explore website ↗</a>}
            <a href={place.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-navy/60 underline">OSM source</a>
          </div>
          <p className="mt-3 text-[11px] text-navy/50">Checked <time dateTime={place.lastScraped}>{new Date(place.lastScraped).toLocaleString()}</time></p>
        </div>
      </article>)}
    </div>
    <div className="mt-5 flex gap-3">
      {page > 0 && <button onClick={() => setPage({ filter, page: page - 1 })} className="rounded-full border border-paper-dim px-4 py-2 text-sm">Previous</button>}
      {result?.key === key && result.hasMore && <button onClick={() => setPage({ filter, page: page + 1 })} className="rounded-full border border-paper-dim px-4 py-2 text-sm">More discoveries →</button>}
    </div>
    <p className="mt-5 text-xs text-navy/50">Location data © <a href="https://www.openstreetmap.org/copyright" className="underline">OpenStreetMap contributors</a>. Illustrative photos are not photographs of the listed business.</p>
  </section>;
}
