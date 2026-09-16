// Shared by the Next.js Places route and the background scraper.
import { europe } from '../../shared/europe.js';
export const seedLocations = Object.fromEntries(Object.entries(europe).map(([code, value]) => [code, value.slice(1, 3)]));
export const osmCategories = {
  retailer: '[shop=pet]', veterinary: '[amenity=veterinary]', grooming: '[shop=pet_grooming]',
  boarding: '[amenity=animal_boarding]', training: '[amenity=animal_training]',
  walking: '[craft=dog_walker]', shelter: '[amenity=animal_shelter]',
  memorial: '[landuse=cemetery][animal=yes]', breeding: '[amenity=animal_breeding]',
};

export function normalizePlace(element, country) {
  const t = element.tags ?? {};
  if (!t.name || !['node', 'way', 'relation'].includes(element.type) || !Number.isInteger(element.id)) return null;
  const category = t.amenity === 'veterinary' ? 'veterinary' : t.shop === 'pet' ? 'retailer'
    : t.shop === 'pet_grooming' ? 'grooming' : t.amenity === 'animal_boarding' ? 'boarding'
    : t.amenity === 'animal_training' ? 'training' : t.amenity === 'animal_shelter' ? 'shelter'
    : t.amenity === 'animal_breeding' ? 'breeding' : t.craft === 'dog_walker' ? 'walking'
    : t.landuse === 'cemetery' && t.animal === 'yes' ? 'memorial' : null;
  const types = category ? [category === 'veterinary' ? 'veterinary_care' : category === 'retailer' ? 'pet_store' : `pet_${category}`] : [];
  if (!types.length || t.disused === 'yes' || t.abandoned === 'yes') return null;
  let website = null;
  try {
    const raw = t.website || t['contact:website'];
    if (raw) { const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); if (['http:', 'https:'].includes(url.protocol)) website = url.href; }
  } catch { /* Missing or invalid websites are rejected by validation. */ }
  return {
    discoverySource: 'osm', placeId: `osm:${element.type}:${element.id}`, name: t.name,
    address: [t['addr:housenumber'], t['addr:street'], t['addr:postcode'], t['addr:city']].filter(Boolean).join(' ') || null,
    city: t['addr:city'] || null, country: t['addr:country']?.toUpperCase() || country,
    lat: element.lat ?? element.center?.lat ?? null, lng: element.lon ?? element.center?.lon ?? null,
    phone: t.phone || t['contact:phone'] || null, website,
    rating: null, reviewCount: 0, businessStatus: 'UNKNOWN', types,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  };
}

export async function discoverOsmPlaces({ country = 'DE', radius = 10000, limit = 50, category = 'all', nationwide = false } = {}) {
  const center = seedLocations[country];
  if (!Object.hasOwn(seedLocations, country) || !center || !Number.isInteger(radius) || radius < 100 || radius > 25000 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid OSM search parameters');
  if (category !== 'all' && !Object.hasOwn(osmCategories, category)) throw new Error('Invalid OSM category');
  const area = `around:${radius},${center[0]},${center[1]}`;
  const filters = category === 'all' ? Object.values(osmCategories) : [osmCategories[category]];
  const clauses = filters.map(filter => `nwr${filter}(area.country)${nationwide ? '' : `(${area})`};`).join('');
  const query = `[out:json][timeout:25];area["ISO3166-1"="${country}"][admin_level=2]->.country;(${clauses});out center ${limit};`;

  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(process.env.OSM_OVERPASS_URL || 'https://overpass-api.de/api/interpreter', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'PetSquare/0.1 (OSM vendor discovery)' },
    body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(30000),
    });
    if (![429, 502, 503, 504].includes(response.status) || attempt === 2) break;
    const retry = Number(response.headers.get('retry-after'));
    await response.body?.cancel();
    await new Promise(resolve => setTimeout(resolve, Math.min(10000, retry > 0 ? retry * 1000 : (attempt + 1) * 2000)));
  }
  if (!response.ok) throw new Error(`OSM discovery failed (${response.status})`);
  const data = await response.json();
  if (data.remark || !Array.isArray(data.elements)) throw new Error('OSM returned an incomplete response');
  const seen = new Set();
  return data.elements.map(e => normalizePlace(e, country)).filter(p => {
    if (!p || p.country !== country || seen.has(p.placeId)) return false;
    seen.add(p.placeId); return true;
  }).slice(0, limit);
}
