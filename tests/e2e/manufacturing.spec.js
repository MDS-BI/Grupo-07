import { test, expect } from '@playwright/test';
import { makeProduct, makeOrder, seedApp, openDocuments } from './fixtures.js';

async function waitForReady(page) {
  await page.waitForSelector('#view-dashboard');
  await page.waitForFunction(() => document.querySelector('#brand-name')?.textContent === 'Manufactura y Operaciones');
}

test('runs the full production and quality workflow and survives a reload', async ({ page }) => {
  const product = makeProduct({ name: 'Mesa de roble', code: 'SKU-FLOW' });
  const order = makeOrder(product, { status: 'planificada', folio: 6001 });
  await seedApp(page, { products: [product], orders: [order] });

  await expect(page.locator('#config-banner')).toBeHidden();
  await openDocuments(page);
  await page.locator('#document-list tbody .document-row').first().click();

  await page.locator('#document-detail button[data-transition-to="liberada"]').click();
  await expect(page.locator('#document-detail')).toContainText('liberada');

  await page.locator('#document-detail button[data-transition-to="en producción"]').click();
  await page.selectOption('#document-execution-processStage', 'Ensamblaje');
  await page.fill('#document-execution-machine', 'CNC-01');
  await page.fill('#document-execution-batchCode', 'LOTE-E2E');
  await page.fill('#document-execution-producedQty', '8');
  await page.fill('#document-execution-scrapQty', '2');
  await page.fill('#document-execution-responsible', 'Ana Torres');
  await page.click('#document-execution-submit');
  await expect(page.locator('#document-detail')).toContainText('CNC-01');

  await page.locator('#document-detail button[data-transition-to="en control de calidad"]').click();
  await page.fill('#document-quality-producedQty', '8');
  await page.fill('#document-quality-scrapQty', '2');
  await page.selectOption('#document-quality-qualityResult', 'Aprobado');
  await page.fill('#document-quality-notes', 'Lote conforme');
  await page.click('#document-quality-submit');

  await page.locator('#document-detail button[data-transition-to="terminada"]').click();
  await expect(page.locator('#document-detail')).toContainText('terminada');

  await page.reload();
  await waitForReady(page);
  await openDocuments(page);
  await page.locator('#document-list tbody .document-row').first().click();

  const detail = page.locator('#document-detail');
  await expect(detail).toContainText('terminada');
  await expect(detail).toContainText('CNC-01');
  await expect(detail).toContainText('LOTE-E2E');
  await expect(detail).toContainText('Aprobado');
  await expect(detail).toContainText('Lote conforme');
});

test('rejects a planned order and keeps the rejection after a reload', async ({ page }) => {
  const product = makeProduct({ name: 'Silla metálica', code: 'SKU-REJECT' });
  const order = makeOrder(product, { status: 'planificada', folio: 6002 });
  await seedApp(page, { products: [product], orders: [order] });

  await openDocuments(page);
  await page.locator('#document-list tbody .document-row').first().click();
  await page.locator('#document-detail button[data-transition-to="cancelada"]').click();
  await expect(page.locator('#document-detail')).toContainText('cancelada');

  await page.reload();
  await waitForReady(page);
  await openDocuments(page);
  await page.locator('#document-list tbody .document-row').first().click();
  await expect(page.locator('#document-detail')).toContainText('cancelada');
});

test('blocks finishing an order until quality is approved', async ({ page }) => {
  const product = makeProduct({ name: 'Banco de taller', code: 'SKU-QA' });
  const order = makeOrder(product, {
    status: 'en control de calidad',
    folio: 6003,
    qualityResult: 'Pendiente'
  });
  await seedApp(page, { products: [product], orders: [order] });

  await openDocuments(page);
  await page.locator('#document-list tbody .document-row').first().click();

  const approve = page.locator('#document-detail button[data-transition-to="terminada"]');
  await expect(approve).toBeDisabled();

  await page.selectOption('#document-quality-qualityResult', 'Aprobado');
  await page.click('#document-quality-submit');
  await expect(approve).toBeEnabled();
});
