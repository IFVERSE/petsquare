import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { readCachedPetData } from '@/lib/apify/pet-data';
import { deduplicateProducts, normalizeProduct, type Product, type ProductFeed } from './model';

async function readVendorProducts(): Promise<{ items: Product[]; capped: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Product source unavailable');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from('products')
    .select('id,name,description,image_url,species,original_price,discount_price,currency,availability,deal_starts_at,deal_ends_at,source_url,last_checked,vendors!inner(name,status,lat,lng,cities(name),countries(code))')
    .eq('status', 'active').eq('vendors.status', 'verified')
    .order('last_checked', { ascending: false }).limit(501).abortSignal(AbortSignal.timeout(12000));
  if (error) throw error;
  const items = (data ?? []).slice(0, 500).flatMap(row => {
    const vendor = Array.isArray(row.vendors) ? row.vendors[0] : row.vendors;
    const city = Array.isArray(vendor?.cities) ? vendor.cities[0] : vendor?.cities;
    const country = Array.isArray(vendor?.countries) ? vendor.countries[0] : vendor?.countries;
    const item = normalizeProduct(row.id, { ...row, retailer: vendor?.name, country_code: country?.code, city: city?.name, lat: vendor?.lat, lng: vendor?.lng }, row.last_checked, 'vendor');
    return item ? [item] : [];
  });
  return { items, capped: (data?.length ?? 0) > 500 };
}

export async function readProductFeed(): Promise<ProductFeed> {
  const results = await Promise.allSettled([readCachedPetData(100), readVendorProducts()]);
  const items: Product[] = [];
  const sources: ProductFeed['sources'] = [];
  const [cache, vendors] = results;
  if (cache.status === 'fulfilled') {
    const normalized = cache.value.flatMap(row => {
      const item = normalizeProduct(row.id, row.data, row.syncedAt, 'zooplus');
      return item ? [item] : [];
    });
    items.push(...normalized);
    sources.push({ name: 'Zooplus', status: normalized.length ? 'ready' : 'empty' });
  } else sources.push({ name: 'Zooplus', status: 'unavailable' });
  if (vendors.status === 'fulfilled') {
    items.push(...vendors.value.items);
    sources.push({ name: 'PetSquare vendors', status: vendors.value.items.length ? 'ready' : 'empty' });
  } else sources.push({ name: 'PetSquare vendors', status: 'unavailable' });
  return { items: deduplicateProducts(items), sources, capped: (cache.status === 'fulfilled' && cache.value.length === 100) || (vendors.status === 'fulfilled' && vendors.value.capped) };
}
