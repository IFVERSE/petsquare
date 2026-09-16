import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discoverOsmPlaces, normalizePlace } from '../lib/osm-places.js';
import { validateVendor } from '../validate.js';

const element = { type: 'way', id: 123, center: { lat: 52.5, lon: 13.4 }, tags: { name: 'Pet Shop', shop: 'pet', 'contact:website': 'example.com' } };
test('OSM preserves identity, centers and unknown facts', () => {
  const p = normalizePlace(element, 'DE');
  assert.equal(p.placeId, 'osm:way:123');
  assert.equal(p.lat, 52.5);
  assert.equal(p.website, 'https://example.com/');
  assert.equal(p.rating, null);
  assert.equal(p.businessStatus, 'UNKNOWN');
  assert.equal(normalizePlace({ ...element, tags: { ...element.tags, disused: 'yes' } }, 'DE'), null);
});
test('bounded search, deduplication, upstream failures and validation', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => {
      assert.match(options.body.get('data'), /shop=pet/);
      return Response.json({ elements: [element, element] });
    };
    assert.equal((await discoverOsmPlaces()).length, 1);
    await assert.rejects(discoverOsmPlaces({ country: 'XX' }));
    await assert.rejects(discoverOsmPlaces({ radius: 999999 }));
    globalThis.fetch = async () => Response.json({ remark: 'timeout', elements: [] });
    await assert.rejects(discoverOsmPlaces(), /incomplete/);
    globalThis.fetch = async () => new Response('', { status: 429 });
    await assert.rejects(discoverOsmPlaces(), /429/);
    const rejected = await validateVendor({ ...normalizePlace(element, 'DE'), website: null });
    assert.deepEqual(rejected.reasons, ['no_website_listed']);
  } finally { globalThis.fetch = original; }
});
