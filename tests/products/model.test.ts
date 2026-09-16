import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProduct, money, unitCost, deduplicateProducts, filterProducts, defaultFilters, parseFilters, safeUrl } from '../../src/lib/products/model.ts';

const now = Date.parse('2026-09-17T10:00:00Z');
const checked = '2026-09-17T08:00:00Z';
function product(id = '1', extra: Record<string, unknown> = {}) {
  return normalizeProduct(id, { name: 'Dog food', url: `https://shop.de/products/${id}`, price: '€19,99', regularPrice: '€24,99', currency: 'EUR', packSize: '2 x 2 kg', inStock: true, ...extra }, checked, 'vendor', now)!;
}
test('normalizes both feeds without guessing missing price, stock or currency', () => {
  const p = product();
  assert.equal(p.price, 19.99); assert.equal(p.originalPrice, 24.99);
  assert.equal(p.discount, 20); assert.equal(p.country, 'DE');
  assert.equal(p.unitPrice, 19.99 / 4); assert.equal(p.unit, 'kg');
  assert.deepEqual(p.species, ['dog']); assert.equal(p.availability, 'in_stock');
  const unknown = normalizeProduct('2', { name: 'Pet toy', url: 'https://shop.com/p/2' }, checked, 'zooplus', now)!;
  assert.equal(unknown.price, null); assert.equal(unknown.currency, '');
  assert.equal(unknown.availability, 'unknown'); assert.equal(unknown.country, '');
  assert.equal(product('3', { price: 0 }).price, 0);
});
test('rejects unsafe links, expired/future offers and misleading discounts', () => {
  assert.equal(safeUrl('javascript:alert(1)'), ''); assert.equal(safeUrl('https://user:secret@example.com'), '');
  assert.equal(normalizeProduct('1', { name: 'Pet food', url: 'data:text/html,test' }, checked, 'vendor', now), null);
  assert.equal(product('1', { deal_ends_at: '2026-09-16T00:00:00Z' }), null);
  assert.equal(product('1', { deal_starts_at: '2026-09-18T00:00:00Z' }), null);
  assert.equal(product('1', { regularPrice: 10 }).discount, null);
});
test('price and unit arithmetic avoid ambiguous ranges and thousands', () => {
  assert.equal(money('1.234,56 EUR'), 1234.56); assert.equal(money('£1,234.56'), 1234.56);
  assert.equal(money('10–20'), null); assert.equal(money('1.234'), null); assert.equal(money(-1), null);
  assert.equal(money({ value: '12,50' }), 12.5);
  assert.deepEqual(unitCost('6 x 400 g', 12), { unitPrice: 5, unit: 'kg' });
  assert.deepEqual(unitCost('500 ml', 3), { unitPrice: 6, unit: 'L' });
  assert.deepEqual(unitCost('small', 3), { unitPrice: null, unit: '' });
});
test('deduplicates tracking URLs, preserves variants and keeps freshest evidence', () => {
  const a = product(), b = { ...a, id: 'new', url: a.url + '?utm_source=mail', checkedAt: '2026-09-17T09:00:00Z' };
  assert.equal(deduplicateProducts([a, b])[0].id, 'new');
  assert.equal(deduplicateProducts([a, { ...a, url: a.url + '?variant=large' }]).length, 2);
});
test('combined filters support pet, market, budget, saving, availability and freshness', () => {
  const items = [product('1'), product('2', { price: 40, country: 'FR' }), product('3', { name: 'Cat toy', inStock: false })];
  assert.equal(filterProducts(items, { ...defaultFilters, pet: 'dog', country: 'DE', currency: 'EUR', budget: '20', offers: true, stock: true, fresh: true }, now).length, 1);
  assert.equal(filterProducts(items, { ...defaultFilters, budget: '20' }, now).length, 0);
  assert.equal(filterProducts([{ ...items[0], checkedAt: '2026-09-01T00:00:00Z' }], { ...defaultFilters, fresh: true }, now).length, 0);
  const sorted = filterProducts([product('4', { price: 0 }), product('5', { price: 10 }), product('6', { price: undefined })], { ...defaultFilters, currency: 'EUR', sort: 'price-low' }, now);
  assert.equal(sorted[0].price, 0); assert.equal(sorted.at(-1)?.price, null);
});
test('shared searches validate filters and cannot sort mixed currencies by price', () => {
  const parsed = parseFilters({ q: 'food', pet: 'dragon', currency: 'all', budget: '15', sort: 'price-low', stock: 'true' });
  assert.equal(parsed.pet, 'all'); assert.equal(parsed.sort, 'recent'); assert.equal(parsed.budget, ''); assert.equal(parsed.stock, true);
  assert.equal(parseFilters({ currency: 'GBP', budget: '20', sort: 'price-low' }).sort, 'price-low');
});
