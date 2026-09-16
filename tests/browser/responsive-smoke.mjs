import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'chrome', headless: true });
const base = process.env.TEST_ORIGIN || 'http://localhost:3100';
try {
  await mkdir('test-results', { recursive: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/en', '/en/deals', '/en/vendors', '/en/pet-data', '/en/auth/sign-in', '/en/auth/sign-up']) {
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `${path} overflows at ${width}px` }).toBe(true);
    }
    if (path.includes('/auth/')) {
      const password = page.getByLabel('Password', { exact: true });
      await password.fill('Test-only-password');
      await page.getByRole('button', { name: 'Show password', exact: true }).click();
      await expect(password).toHaveAttribute('type', 'text');
      await page.getByRole('button', { name: 'Hide password', exact: true }).click();
      await expect(password).toHaveAttribute('type', 'password');
      await expect(password).toHaveValue('Test-only-password');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const menu = page.locator('button[aria-controls="mobile-navigation"]');
    if (await menu.count()) {
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'Saved', exact: true })).toHaveAttribute('href', '/en/dashboard/saved');
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
    }
    await page.screenshot({ path: `test-results/mobile-${path.split('/').filter(Boolean).join('-')}.png`, fullPage: true });
    console.log(`Passed: ${path}, four viewport widths${path.includes('/auth/') ? ', password toggle' : ''}`);
  }
  expect(errors).toEqual([]);
} finally { await browser.close(); }
