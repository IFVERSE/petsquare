import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'chrome', headless: true });
const base = process.env.TEST_URL || 'http://localhost:3100/en/pet-data';
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const sources = [{ name: 'Zooplus', status: 'ready' }, { name: 'PetSquare vendors', status: 'ready' }];
  const checkedAt = new Date().toISOString();
  const sample = { name: 'Dog food starter', description: 'Dry dog food for your shortlist', brand: 'Pet food', retailer: 'Test retailer', url: 'https://retailer.example/product', image: 'https://retailer.example/broken.jpg', price: 20, originalPrice: 25, currency: 'EUR', discount: 20, species: ['dog'], category: 'food', country: 'DE', city: 'Berlin', availability: 'in_stock', checkedAt, endsAt: null, pack: '2 kg', unitPrice: 10, unit: 'kg', lat: null, lng: null, source: 'vendor' };
  const items = [
    { ...sample, id: 'vendor:one' },
    { ...sample, id: 'vendor:two', name: 'Dog food large', price: 32, pack: '4 kg', unitPrice: 8 },
    { ...sample, id: 'vendor:three', name: 'Cat treats', species: ['cat'], country: 'FR', price: 8 },
    { ...sample, id: 'zooplus:four', name: 'Dog toy', category: 'play', currency: 'GBP', price: 5, pack: '', unitPrice: null, unit: '', source: 'zooplus' },
  ];
  let mode = 'ok';
  await page.route('https://retailer.example/**', route => route.fulfill({ status: 404, body: '' }));
  await page.route('**/api/pet-data', route => route.fulfill({ status: mode === 'error' ? 503 : 200, json: { items: mode === 'empty' ? [] : items, sources, capped: false } }));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Good finds. Happier pets.' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(4);
  await expect(page.locator('article').first().getByText('Illustrative photo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save Dog food starter', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unsave Dog food starter', exact: true })).toHaveAttribute('aria-pressed', 'true');
  for (const name of ['Dog food starter', 'Dog food large', 'Cat treats']) await page.getByRole('button', { name: `Compare ${name}`, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Compare Dog toy', exact: true })).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'Compare your picks (3/3)' })).toBeVisible();
  await expect(page.locator('#product-comparison')).toContainText('€8.00 / kg');
  await page.getByRole('button', { name: 'Clear comparison', exact: true }).click();
  await page.getByRole('button', { name: 'Dogs', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(3);
  await page.getByLabel('Currency', { exact: true }).selectOption('EUR');
  await page.getByRole('spinbutton', { name: 'Maximum price' }).fill('25');
  await expect(page.locator('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Share search', exact: true }).click();
  const shared = await page.getByRole('textbox', { name: 'Shareable search link' }).inputValue();
  expect(shared).toContain('pet=dog'); expect(shared).toContain('budget=25');
  await page.goto(shared, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('spinbutton', { name: 'Maximum price' })).toHaveValue('25');
  await expect(page.getByRole('button', { name: 'Unsave Dog food starter', exact: true })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(1);
  mode = 'error';
  await page.getByRole('button', { name: 'Refresh products', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Could not update products');
  await expect(page.locator('article')).toHaveCount(1);
  mode = 'empty';
  await page.getByRole('button', { name: 'Refresh products', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your next good find is on its way' })).toBeVisible();
  await page.getByRole('button', { name: 'Shortlist (1)', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.locator('article')).toContainText('Previously saved');
  await page.getByRole('button', { name: 'Unsave Dog food starter', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make room for a few favourites' })).toBeVisible();
  mode = 'ok';
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await page.getByRole('button', { name: 'Browse', exact: true }).click();
  await page.getByRole('button', { name: 'Refresh products', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(4);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  console.log('Passed: images, three-item comparison, pet/currency/budget filters, saved persistence, shared filters, failure retention, empty recovery, mobile layout.');
  // Real-data screenshot, without test fixtures.
  const live = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await live.goto(base, { waitUntil: 'domcontentloaded' });
  await expect(live.getByRole('heading', { name: 'Good finds. Happier pets.' })).toBeVisible();
  await mkdir('test-results', { recursive: true });
  await live.screenshot({ path: 'test-results/product-finder-desktop.png' });
  console.log('Saved real-data screenshot: test-results/product-finder-desktop.png');
} finally { await browser.close(); }
