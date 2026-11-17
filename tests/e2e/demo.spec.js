import { expect, test } from '@playwright/test';
import { openDocuments } from './fixtures.js';

test('keeps the search icon clear of the input and makes demo orders filterable without duplicates', async ({
  page
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#brand-name')).toHaveText('Manufactura y Operaciones');
  await page.locator('#nav-search').click();

  const input = page.locator('#search-input');
  await input.fill('Guantes');
  await expect(page.locator('#search-results-list .entity-title')).toHaveText([
    'Guantes de protección — DEMO-GUA',
    'DEMO — 9004'
  ]);
  const icon = await page.locator('.search-input-wrap > svg').boundingBox();
  const field = await input.boundingBox();
  expect(icon.x + icon.width).toBeLessThan(field.x);

  const lowStock = page.getByRole('checkbox', { name: 'Solo stock bajo' });
  await lowStock.check();
  await expect(page.locator('#search-empty')).toBeVisible();
  await input.fill('Lentes');
  await expect(page.locator('#search-results-list .entity-title')).toHaveText('Lentes de seguridad — DEMO-LEN');
  await input.fill('');
  await expect(page.locator('#search-results-list .entity-title')).toHaveText([
    'Estante industrial — DEMO-EST',
    'Lentes de seguridad — DEMO-LEN'
  ]);
  const clearSearch = page.getByRole('button', { name: 'Limpiar búsqueda' });
  await clearSearch.focus();
  await clearSearch.press('Enter');
  await expect(input).toBeFocused();
  await expect(lowStock).not.toBeChecked();
  await expect(page.locator('#search-results-list .entity-title')).toHaveCount(6);

  await page.evaluate(() => {
    const key = 'erp_base_module:documents';
    const orders = JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify([...orders, { ...orders[0], id: 'duplicate-demo-order' }]));
  });
  await page.reload();
  await expect(page.locator('#brand-name')).toHaveText('Manufactura y Operaciones');
  await openDocuments(page);

  const rows = page.locator('#document-list tbody .document-row');
  await expect(rows).toHaveCount(6);
  await expect(rows.filter({ hasText: 'Guantes de protección' })).toHaveCount(1);
  await page.locator('#document-filter-1').selectOption('Urgente');
  await expect(rows).toHaveCount(2);
  await page.locator('#document-filter-2').selectOption('Corrección');
  await page.locator('#document-filter-0').selectOption('en control de calidad');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('9002');
  await expect(rows.first()).toContainText('En control de calidad');
  await page.locator('#document-filter-1').selectOption('');
  await expect(rows).toHaveCount(2);
  await page.locator('#document-filter-2').selectOption('');
  await expect(rows).toHaveCount(2);
  await page.locator('#document-filter-0').selectOption('');
  await expect(rows).toHaveCount(6);
  await expect(rows.filter({ hasText: 'Casco de seguridad' })).toContainText('sin dato');
  expect(errors).toEqual([]);
});
