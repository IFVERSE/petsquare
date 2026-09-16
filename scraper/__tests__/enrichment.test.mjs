import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractWebsiteDetails, deadline } from '../lib/website-enrichment.js';
import { activeOffers } from '../../shared/offers.js';
import { normalizePlace, discoverOsmPlaces, osmCategories, seedLocations } from '../lib/osm-places.js';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';

const now = Date.parse('2026-09-16T12:00:00Z');
test('extracts website gallery and advertised offer with a real deadline', () => {
  const details = extractWebsiteDetails(`<meta property="og:image" content="/hero.jpg"><main><img width="800" height="400" src="/grooming.jpg"><img src="/logo.png"><div class="promotion" data-end-date="2026-09-17T18:00:00+02:00">Flash sale: up to 25% off grooming packages!</div><a href="/offers">Offers</a><a href="https://other.example/sale">Sale</a></main>`, 'https://pet.example/', now);
  assert.deepEqual(details.images, ['https://pet.example/hero.jpg', 'https://pet.example/grooming.jpg']);
  assert.equal(details.offers[0].discountPercent, 25);
  assert.equal(details.offers[0].discountKind, 'up_to');
  assert.equal(details.offers[0].endsAt, '2026-09-17T16:00:00.000Z');
  assert.deepEqual(details.links, ['https://pet.example/offers']);
});
test('does not invent discounts or deadlines, ignores stale and hidden offers', () => {
  const details = extractWebsiteDetails(`<main><div class="countdown">Flash sale ends soon! 02:59:00</div><div class="promotion" data-end-date="2026-09-15T00:00:00Z">Save 50% on treats</div><div hidden><div class="promotion">Save 90% today</div></div><nav><h2>Sale and offers</h2></nav></main>`, 'https://pet.example', now);
  assert.equal(details.offers.length, 1);
  assert.equal(details.offers[0].discountPercent, null);
  assert.equal(details.offers[0].endsAt, null);
  assert.equal(details.offers[0].timerSeen, true);
  assert.equal(deadline('2026-09-17T18:00:00', now), null);
  assert.equal(activeOffers(details.offers, now).length, 1);
  assert.equal(activeOffers(details.offers, now + 49 * 3600000).length, 0);
  assert.equal(activeOffers([{ ...details.offers[0], endsAt: '2026-09-16T11:00:00Z' }], now).length, 0);
});
test('all supported categories normalize and national queries stay bounded', async () => {
  const tags = [{ shop: 'pet' }, { amenity: 'veterinary' }, { shop: 'pet_grooming' }, { amenity: 'animal_boarding' }, { amenity: 'animal_training' }, { craft: 'dog_walker' }, { amenity: 'animal_shelter' }, { landuse: 'cemetery', animal: 'yes' }, { amenity: 'animal_breeding' }];
  assert.equal(Object.keys(osmCategories).length, tags.length);
  assert.equal(Object.keys(seedLocations).length, 44);
  for (const tag of tags) assert.ok(normalizePlace({ type: 'node', id: 1, tags: { name: 'Business', ...tag } }, 'DE'));
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => {
      const query = options.body.get('data');
      assert.match(query, /shop=pet_grooming/);
      assert.doesNotMatch(query, /around:/);
      assert.match(query, /out center 5/);
      return Response.json({ elements: [] });
    };
    await discoverOsmPlaces({ country: 'IE', category: 'grooming', nationwide: true, limit: 5 });
  } finally { globalThis.fetch = original; }
});
test('discovery migration preserves existing vendors and is idempotent', async () => {
  const db = new PGlite();
  try {
    await db.exec("create table vendors(id int primary key,country_id int,category text,last_scraped timestamptz,status text,place_id text); insert into vendors(id,status,place_id) values(1,'verified','osm:node:1');");
    const sql = await readFile(new URL('../../supabase/migrations/202609160002_vendor_discovery.sql', import.meta.url), 'utf8');
    await db.exec(sql); await db.exec(sql);
    const { rows } = await db.query('select discovery from vendors where id=1');
    assert.deepEqual(rows[0].discovery, { images: [], offers: [] });
  } finally { await db.close(); }
});
