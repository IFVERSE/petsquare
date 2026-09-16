import { readProductFeed } from '@/lib/products/feed';
export const dynamic = 'force-dynamic';
export async function GET() {
  const feed = await readProductFeed();
  const unavailable = feed.sources.every(source => source.status === 'unavailable');
  return Response.json(feed, { status: unavailable ? 503 : 200, headers: { 'Cache-Control': 'no-store' } });
}
