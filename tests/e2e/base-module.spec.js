import { test, expect } from '@playwright/test';
import { makeProduct, resetApp, seedApp, openDocuments } from './fixtures.js';

test.beforeEach(async ({ page }) => {
  await resetApp(page);
});

test('creates, searches, edits and deletes a product', async ({ page }) => {
  await page.click('#nav-entities');
  await page.fill('#name', 'Mesa de roble');
  await page.fill('#code', 'SKU-E2E-1');
  await page.selectOption('#cf-itemType', 'Producto terminado');
  await page.selectOption('#cf-unitOfMeasure', 'Unidad');
  await page.fill('#cf-currentStock', '20');
  await page.fill('#cf-minStock', '5');
  await page.click('#submit-button');

  await expect(page.locator('#edit-entity option')).toHaveCount(2);
  const value = await page.locator('#edit-entity option').nth(1).getAttribute('value');

  await page.click('#nav-search');
  await page.fill('#search-input', 'Mesa de roble');
  await expect(page.locator('#search-results-list .entity-item').first()).toContainText('Mesa de roble');

  await page.click('#nav-entities');
  await page.selectOption('#edit-entity', value);
  await page.fill('#cf-currentStock', '3');
  await page.click('#submit-button');

  await page.click('#nav-search');
  await page.fill('#search-input', 'Mesa de roble');
  await expect(page.locator('#search-results-list .entity-item').first()).toContainText('Stock actual: 3');
  await expect(page.locator('#search-results-list .badge-warning')).toContainText('Stock bajo el mínimo');

  page.once('dialog', (dialog) => dialog.accept());
  await page.click('#nav-entities');
  await page.selectOption('#edit-entity', value);
  await page.click('#delete-entity');
  await expect(page.locator('#edit-entity option')).toHaveCount(1);
});

test('manages an order from the documents module', async ({ page }) => {
  const product = makeProduct({ name: 'Silla E2E', code: 'SILLA-E2E' });
  await seedApp(page, { products: [product] });

  await openDocuments(page);
  await page.selectOption('#document-entity', product.entity_id);
  await page.fill('#series', 'OP');
  await page.fill('#folio', '5001');
  await page.fill('#startDate', '2030-01-01');
  await page.fill('#endDate', '2030-01-10');
  await page.fill('#quantity', '5');
  await page.selectOption('#cf-processStage', 'Corte');
  await page.selectOption('#status', 'planificada');
  await page.click('#document-submit-button');

  await expect(page.locator('#document-list tbody .document-row')).toHaveCount(1);
  await expect(page.locator('#document-list')).toContainText('Silla E2E');

  const documentValue = await page.locator('#edit-document option').nth(1).getAttribute('value');
  await page.selectOption('#edit-document', documentValue);
  await page.fill('#quantity', '9');
  await page.click('#document-submit-button');
  await expect(page.locator('#document-list tbody .document-row')).toContainText('9');

  page.once('dialog', (dialog) => dialog.accept());
  await page.selectOption('#edit-document', documentValue);
  await page.click('#delete-document');
  await expect(page.locator('#document-list-empty')).toBeVisible();
});

test('opens search from the dashboard quick action and shows the empty state', async ({ page }) => {
  const product = makeProduct({ name: 'Mesa de roble', code: 'SKU-E2E-2' });
  await seedApp(page, { products: [product] });

  await page.click('#action-find');
  await expect(page.locator('#view-search')).toBeVisible();

  await page.fill('#search-input', 'mesa');
  await expect(page.locator('#search-results-list .entity-item')).toHaveCount(1);

  await page.fill('#search-input', 'martillo');
  await expect(page.locator('#search-empty')).toBeVisible();
  await expect(page.locator('#search-results-list .entity-item')).toHaveCount(0);
});
