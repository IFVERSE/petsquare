import { createClient } from '@/lib/supabase/server';
import { europe, vendorCategories } from '../../../../../shared/europe.js';
import { activeOffers } from '../../../../../shared/offers.js';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const country = params.get('country') || 'all', category = params.get('category') || 'all';
  const page = Number(params.get('page') || 0), offersOnly = params.get('offers') === 'true';
  if ((country !== 'all' && !Object.hasOwn(europe, country)) || (category !== 'all' && !Object.hasOwn(vendorCategories, category)) || !Number.isInteger(page) || page < 0 || page > 100) return Response.json({ error: 'Invalid filters' }, { status: 400 });
  try {
    const db = await createClient();
    async function query(withDiscovery: boolean) {
      let q = db.from('vendors').select(`id,slug,name,category,address,website,cover_image_url,place_id,last_scraped,cities(name),countries!inner(name,code)${withDiscovery ? ',discovery' : ''}`)
        .eq('status', 'verified').eq('source', 'scraped').like('place_id', 'osm:%').not('last_scraped', 'is', null);
      if (country !== 'all') q = q.eq('countries.code', country);
      if (category !== 'all') q = q.eq('category', category);
      if (offersOnly && withDiscovery) q = q.neq('discovery->offers', '[]').gte('last_scraped', new Date(Date.now() - 48 * 3600000).toISOString());
      return q.order('last_scraped', { ascending: false }).order('id', { ascending: true }).range(page * 24, page * 24 + 24);
    }
    let result = await query(true);
    if (result.error?.code === '42703' || result.error?.code === 'PGRST204') result = await query(false);
    if (result.error) throw result.error;
    type Row = { id: string; slug: string; name: string; category: string; address: string | null; website: string | null; cover_image_url: string | null; place_id: string; last_scraped: string; cities: { name: string }[] | { name: string } | null; countries: { name: string; code: string }[] | { name: string; code: string }; discovery?: { images?: string[]; offers?: unknown[] } };
    const rows = (result.data ?? []) as unknown as Row[];
    const places = rows.slice(0, 24).flatMap(row => {
      const identity = /^osm:(node|way|relation):(\d+)$/.exec(row.place_id ?? '');
      if (!identity) return [];
      const city = Array.isArray(row.cities) ? row.cities[0] : row.cities;
      const nation = Array.isArray(row.countries) ? row.countries[0] : row.countries;
      const offers = activeOffers(row.discovery?.offers);
      if (offersOnly && !offers.length) return [];
      return [{ id: row.id, slug: row.slug, name: row.name, category: row.category,
        location: [city?.name || row.address, nation?.name].filter(Boolean).join(', '), country: nation?.code,
        website: /^https?:\/\//i.test(row.website ?? '') ? row.website : null,
        images: [...new Set([...(Array.isArray(row.discovery?.images) ? row.discovery.images : []), row.cover_image_url].filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url)))].slice(0, 3),
        offers, lastScraped: row.last_scraped, sourceUrl: `https://www.openstreetmap.org/${identity[1]}/${identity[2]}` }];
    });
    return Response.json({ places, hasMore: rows.length > 24 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Recent OSM results are temporarily unavailable.' }, { status: 503 }); }
}
