// Run against a running app: node tests/browser/discovery-ui.mjs
import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const now = Date.now();
  const offer = { title: 'Flash sale: up to 25% off grooming', sourceUrl: 'https://vendor.example/offers', endsAt: new Date(now + 86400000).toISOString(), observedAt: new Date(now - 1000).toISOString(), timerSeen: true, discountPercent: 25, discountKind: 'up_to' };
  const fixture = { id: 'test', slug: 'test-vendor', name: 'Happy Paws Grooming', category: 'grooming', location: 'Berlin, Germany', lastScraped: new Date(now).toISOString(), website: 'https://vendor.example', sourceUrl: 'https://www.openstreetmap.org/node/123', images: ['https://vendor.example/broken.jpg'], offers: [offer] };
  const requests = [];
  await page.route('https://vendor.example/**', route => route.fulfill({ status: 404, body: '' }));
  await page.route('**/api/places/recent?**', route => {
    const url = new URL(route.request().url());
    requests.push(url.searchParams);
    const category = url.searchParams.get('category');
    return route.fulfill({ json: { places: category === 'all' || category === 'grooming' ? [fixture] : [], hasMore: url.searchParams.get('page') === '0' } });
  });
  await page.goto(process.env.TEST_URL || 'http://localhost:3100/en', { waitUntil: 'domcontentloaded' });
  const feed = page.locator('section[aria-labelledby="recent-osm-heading"]');
  await expect(feed.getByRole('heading', { name: fixture.name })).toBeVisible();
  await expect(feed.getByText('Illustrative photo', { exact: true })).toBeVisible();
  await expect(feed.locator('img')).toHaveAttribute('src', '/images/categories/grooming.jpg');
  await expect.poll(() => feed.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(feed.getByText('Up to 25% advertised', { exact: true })).toBeVisible();
  await expect(feed.getByText(/Ends in/)).toBeVisible();
  await expect(feed.getByRole('link', { name: /Check offer and final savings/ })).toHaveAttribute('href', offer.sourceUrl);
  await feed.getByRole('combobox', { name: 'Preferred country' }).selectOption('FR');
  await expect.poll(() => requests.some(p => p.get('country') === 'FR')).toBe(true);
  await expect.poll(() => page.context().cookies().then(cookies => cookies.find(c => c.name === 'petsquare-country')?.value)).toBe('FR');
  await feed.getByRole('button', { name: 'Grooming', exact: true }).click();
  await expect.poll(() => requests.some(p => p.get('category') === 'grooming')).toBe(true);
  await feed.getByRole('button', { name: /More discoveries/ }).click();
  await expect.poll(() => requests.some(p => p.get('page') === '1')).toBe(true);
  await feed.getByRole('button', { name: 'Training', exact: true }).click();
  await expect(feed.getByText(/No recent results for these filters/)).toBeVisible();
  await feed.getByRole('button', { name: 'Grooming', exact: true }).click();
  await expect(feed.getByRole('heading', { name: fixture.name })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => feed.locator('img').evaluate(img => getComputedStyle(img).animationName)).toBe('none');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  console.log('Passed: gallery fallback, local photo loading, offers, real countdown, country persistence, category filters, pagination, reduced motion, mobile layout.');
} finally { await browser.close(); }
