import { europe } from '../../../shared/europe.js';
export type Product = {
  id: string; name: string; description: string; brand: string; retailer: string;
  url: string; image: string; price: number | null; originalPrice: number | null;
  currency: string; discount: number | null; species: string[]; category: string;
  country: string; city: string; availability: 'in_stock' | 'out_of_stock' | 'unknown';
  checkedAt: string | null; endsAt: string | null; pack: string;
  unitPrice: number | null; unit: string; lat: number | null; lng: number | null;
  source: 'vendor' | 'zooplus'; snapshot?: boolean;
};
export type ProductFeed = { items: Product[]; sources: { name: string; status: 'ready' | 'empty' | 'unavailable' }[]; capped: boolean };
export const petLabels: Record<string, string> = { dog: 'Dogs', cat: 'Cats', bird: 'Birds', fish: 'Fish', exotic: 'Small pets' };
export const categoryLabels: Record<string, string> = { food: 'Food & treats', care: 'Care & grooming', play: 'Toys & enrichment', home: 'Beds & habitats', travel: 'Walking & travel', other: 'Other essentials' };

export function safeUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
function text(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function first(data: Record<string, unknown>, keys: string[]): unknown {
  return keys.map(key => data[key]).find(value => value !== undefined && value !== null && value !== '');
}
export function money(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (value && typeof value === 'object') return money((value as Record<string, unknown>).value ?? (value as Record<string, unknown>).amount);
  if (typeof value !== 'string') return null;
  const stripped = value.replace(/(?:EUR|GBP|USD|CHF|PLN|CZK|SEK|NOK|DKK|RON|HUF|€|£|\$)/gi, '').replace(/[\s\u00a0]/g, '');
  if (!/^\d+(?:[.,]\d+)*$/.test(stripped)) return null;
  let normalized = stripped;
  if (stripped.includes(',') && stripped.includes('.')) {
    const decimal = stripped.lastIndexOf(',') > stripped.lastIndexOf('.') ? ',' : '.';
    normalized = stripped.replace(decimal === ',' ? /\./g : /,/g, '').replace(',', '.');
  } else if (/[.,]/.test(stripped)) {
    if (!/^\d+[.,]\d{1,2}$/.test(stripped)) return null; // Ambiguous thousands/decimal formatting.
    normalized = stripped.replace(',', '.');
  }
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
function timestamp(value: unknown): string | null {
  const date = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(date) ? new Date(date).toISOString() : null;
}
export function unitCost(pack: string, price: number | null): { unitPrice: number | null; unit: string } {
  // Use only an explicit package field, never a guessed size from a product name.
  const match = /^(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)$/i.exec(pack.trim());
  if (!match || price === null) return { unitPrice: null, unit: '' };
  const quantity = Number(match[1] || 1) * Number(match[2].replace(',', '.')) / (/^(g|ml)$/i.test(match[3]) ? 1000 : 1);
  return quantity > 0 ? { unitPrice: price / quantity, unit: /^(kg|g)$/i.test(match[3]) ? 'kg' : 'L' } : { unitPrice: null, unit: '' };
}
export function normalizeProduct(id: string, data: Record<string, unknown>, checkedAt: string, source: Product['source'], now = Date.now()): Product | null {
  const name = text(first(data, ['name', 'title', 'productName', 'product_name']));
  const url = safeUrl(first(data, ['url', 'productUrl', 'product_url', 'source_url']));
  if (!name || !url) return null;
  const endsAt = timestamp(first(data, ['deal_ends_at', 'endsAt']));
  const startsAt = timestamp(data.deal_starts_at);
  if ((endsAt && Date.parse(endsAt) <= now) || (startsAt && Date.parse(startsAt) > now)) return null;
  const description = text(first(data, ['description', 'subtitle'])).replace(/<[^>]*>/g, ' ').slice(0, 1000);
  const priceRaw = first(data, ['discount_price', 'currentPrice', 'current_price', 'salePrice', 'price']);
  const price = money(priceRaw);
  const regular = money(first(data, ['original_price', 'regular_price', 'regularPrice', 'originalPrice']));
  const currencyRaw = text(first(data, ['currency', 'currencyCode', 'currency_code'])) || (priceRaw && typeof priceRaw === 'object' ? text((priceRaw as Record<string, unknown>).currency) : '');
  const symbol = typeof priceRaw === 'string' ? (priceRaw.includes('€') ? 'EUR' : priceRaw.includes('£') ? 'GBP' : '') : '';
  const currency = /^[A-Z]{3}$/.test(currencyRaw.toUpperCase()) ? currencyRaw.toUpperCase() : symbol;
  const originalPrice = regular !== null && price !== null && regular > price ? regular : null;
  const words = `${name} ${description} ${text(data.category)}`.toLowerCase();
  const species = Array.isArray(data.species) ? data.species.filter((pet): pet is string => typeof pet === 'string' && Object.hasOwn(petLabels, pet)) : Object.entries({ dog: /\bdog|puppy|hunde|chien/, cat: /\bcat|kitten|katzen|chat\b/, bird: /bird|vogel|oiseau/, fish: /fish|aquarium/, exotic: /rabbit|hamster|guinea pig|kaninchen|reptile/ }).filter(([, pattern]) => (pattern as RegExp).test(words)).map(([pet]) => pet);
  const category = /food|treat|futter|croquette|kibble|snack/.test(words) ? 'food' : /shampoo|groom|brush|litter|hygien/.test(words) ? 'care' : /toy|ball|spielzeug|enrichment/.test(words) ? 'play' : /bed|cage|habitat|aquarium|cushion/.test(words) ? 'home' : /lead|leash|collar|harness|carrier/.test(words) ? 'travel' : 'other';
  const rawImage = first(data, ['image_url', 'imageUrl', 'main_image', 'image', 'images']);
  const img = Array.isArray(rawImage) ? rawImage[0] : rawImage;
  const image = safeUrl(img && typeof img === 'object' ? (img as Record<string, unknown>).url : img);
  const explicitCountry = text(first(data, ['countryCode', 'country_code', 'country'])).toUpperCase();
  const tld = new URL(url).hostname.split('.').at(-1)?.toUpperCase() || '';
  const knownTlds = new Set(['DE','FR','ES','IT','PL','NL','BE','AT','IE','PT','SE','DK','FI','NO','CZ','HU','RO','SK','CH','GR']);
  const country = /^[A-Z]{2}$/.test(explicitCountry) ? explicitCountry : new URL(url).hostname.endsWith('.co.uk') ? 'GB' : knownTlds.has(tld) ? tld : '';
  const rawStock = first(data, ['availability', 'inStock', 'in_stock', 'stockStatus']);
  const stock = String(rawStock ?? '').toLowerCase().replace(/[\s_-]/g, '');
  const availability = rawStock === false || /outofstock|soldout/.test(stock) ? 'out_of_stock' : rawStock === true || /instock|limitedavailability/.test(stock) ? 'in_stock' : 'unknown';
  const pack = text(first(data, ['pack', 'packSize', 'package_size', 'size', 'weight']));
  const lat = typeof data.lat === 'number' && Math.abs(data.lat) <= 90 ? data.lat : null;
  const lng = typeof data.lng === 'number' && Math.abs(data.lng) <= 180 ? data.lng : null;
  return { id: `${source}:${id}`, name, description, brand: text(data.brand), retailer: text(data.retailer) || (source === 'zooplus' ? 'Zooplus' : new URL(url).hostname.replace(/^www\./, '')), url, image, price, originalPrice, currency,
    discount: originalPrice && price !== null ? Math.round((originalPrice - price) / originalPrice * 100) : null,
    species, category, country, city: text(data.city), availability, checkedAt: timestamp(checkedAt), endsAt, pack, ...unitCost(pack, price), lat, lng, source };
}
export function deduplicateProducts(items: Product[]): Product[] {
  const unique = new Map<string, Product>();
  for (const item of items) {
    const url = new URL(item.url); url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (key.startsWith('utm_')) url.searchParams.delete(key);
    const key = `${url.href}|${item.pack}`;
    const previous = unique.get(key);
    if (!previous || (Date.parse(item.checkedAt || '') || 0) > (Date.parse(previous.checkedAt || '') || 0)) unique.set(key, item);
  }
  return [...unique.values()];
}
export type Filters = { query: string; pet: string; category: string; country: string; currency: string; budget: string; offers: boolean; fresh: boolean; stock: boolean; sort: string };
export const defaultFilters: Filters = { query: '', pet: 'all', category: 'all', country: '', currency: 'all', budget: '', offers: false, fresh: false, stock: false, sort: 'recent' };
export function parseFilters(params: Record<string, string>): Filters {
  const currency = /^[A-Z]{3}$/.test(params.currency || '') ? params.currency : 'all';
  return { ...defaultFilters, query: (params.q || '').slice(0, 160), pet: Object.hasOwn(petLabels, params.pet || '') ? params.pet : 'all',
    category: Object.hasOwn(categoryLabels, params.category || '') ? params.category : 'all',
    country: params.country === 'all' || Object.hasOwn(europe, params.country || '') ? params.country : '', currency,
    budget: currency !== 'all' && /^\d+(?:\.\d{1,2})?$/.test(params.budget || '') ? params.budget : '',
    offers: params.offers === 'true', fresh: params.fresh === 'true', stock: params.stock === 'true',
    sort: ['recent', 'saving', ...(currency !== 'all' ? ['price-low', 'price-high'] : [])].includes(params.sort) ? params.sort : 'recent' };
}
export function filterProducts(items: Product[], filters: Filters, now = Date.now()): Product[] {
  const budget = filters.budget.trim() === '' ? null : Number(filters.budget);
  const found = items.filter(item => {
    if (filters.query && !`${item.name} ${item.brand} ${item.description} ${item.retailer}`.toLowerCase().includes(filters.query.trim().toLowerCase())) return false;
    if (filters.pet !== 'all' && !item.species.includes(filters.pet)) return false;
    if (filters.category !== 'all' && filters.category !== item.category) return false;
    if (filters.country && filters.country !== 'all' && filters.country !== item.country) return false;
    if (filters.currency !== 'all' && filters.currency !== item.currency) return false;
    if (budget !== null && (!Number.isFinite(budget) || budget < 0 || filters.currency === 'all' || item.price === null || item.price > budget)) return false;
    if (filters.offers && (!item.discount || (item.endsAt && Date.parse(item.endsAt) <= now))) return false;
    if (filters.stock && item.availability !== 'in_stock') return false;
    if (filters.fresh && (!item.checkedAt || now - Date.parse(item.checkedAt) > 48 * 3600000 || item.snapshot)) return false;
    return true;
  });
  return found.sort((a, b) => {
    if (filters.sort.startsWith('price') && filters.currency !== 'all') {
      if (a.price === null) return b.price === null ? 0 : 1;
      if (b.price === null) return -1;
      return filters.sort === 'price-low' ? a.price - b.price : b.price - a.price;
    }
    if (filters.sort === 'saving') return (b.discount || 0) - (a.discount || 0);
    return (Date.parse(b.checkedAt || '') || 0) - (Date.parse(a.checkedAt || '') || 0);
  });
}
export function formatPrice(amount: number | null, currency: string) {
  if (amount === null) return 'Check retailer price';
  if (!currency) return `${amount.toFixed(2)} · currency unconfirmed`;
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount); } catch { return `${amount.toFixed(2)} ${currency}`; }
}
