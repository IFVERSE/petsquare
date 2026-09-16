import { discoverOsmPlaces, seedLocations, osmCategories } from '../../../../scraper/lib/osm-places.js';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: allowed, error } = await db.rpc('has_admin_permission', { perm: 'scraper.manage' });
  if (error || allowed !== true) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const country = (params.get('country') ?? 'DE').toUpperCase();
  const category = params.get('category') ?? 'all';
  if (category !== 'all' && !Object.hasOwn(osmCategories, category)) return Response.json({ error: 'Unsupported category' }, { status: 400 });
  const radius = Number(params.get('radius') ?? 10000);
  const limit = Number(params.get('limit') ?? 50);
  if (!Object.hasOwn(seedLocations, country) || !Number.isInteger(radius) || radius < 100 || radius > 25000 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return Response.json({ error: 'Use a supported country, radius 100–25000 metres and limit 1–100.' }, { status: 400 });
  }
  try {
    const places = await discoverOsmPlaces({ country, radius, limit, category });
    return Response.json({ places, attribution: '© OpenStreetMap contributors', license: 'https://www.openstreetmap.org/copyright' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return Response.json({ error: 'OSM discovery is temporarily unavailable.' }, { status: 503 });
  }
}
