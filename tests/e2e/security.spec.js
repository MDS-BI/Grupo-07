import { test, expect } from '@playwright/test';
import { makeProduct, makeOrder, seedApp, openDocuments } from './fixtures.js';

test('renders persisted XSS payloads as text without executing them', async ({ page }) => {
  const dialogs = [];
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.message());
    dialog.dismiss();
  });

  const product = makeProduct({
    name: '<script>alert(1)</script>',
    code: 'XSS-E2E',
    supplier: 'javascript:alert(2)'
  });
  const order = makeOrder(product, {
    status: 'planificada',
    folio: 7001,
    notes: '"><img src=x onerror=alert(3)>'
  });
  await seedApp(page, { products: [product], orders: [order] });

  await page.click('#nav-search');
  await page.fill('#search-input', 'script');

  const results = page.locator('#search-results-list');
  await expect(results).toContainText('<script>alert(1)</script>');
  await expect(results.locator('script')).toHaveCount(0);
  await expect(results.locator('a')).toHaveCount(0);

  await openDocuments(page);
  await page.locator('#document-list tbody .document-row').first().click();

  const detail = page.locator('#document-detail');
  await expect(detail).toContainText('"><img src=x onerror=alert(3)>');
  await expect(detail.locator('img')).toHaveCount(0);
  await expect(detail.locator('script')).toHaveCount(0);

  expect(dialogs).toEqual([]);
});
