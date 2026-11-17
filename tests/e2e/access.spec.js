import { test, expect } from '@playwright/test';
import {
  openLogin,
  loginAs,
  makeProduct,
  makeOrder,
  ENTITIES_KEY,
  DOCUMENTS_KEY,
  SESSION_KEY,
  ROLE_IDS,
  ROLE_SECRETS,
  openDocuments
} from './fixtures.js';

test('muestra la pantalla de acceso y valida cargo y clave ficticia', async ({ page }) => {
  await openLogin(page);

  await expect(page.locator('#view-login')).toBeVisible();
  await expect(page.locator('#app-shell')).toBeHidden();
  await expect(page.locator('#login-role option')).toHaveCount(5);

  await page.click('#login-submit');
  await expect(page.locator('#login-error')).toContainText('cargo');

  await page.selectOption('#login-role', ROLE_IDS.quality);
  await page.fill('#login-secret', 'incorrecta');
  await page.click('#login-submit');
  await expect(page.locator('#login-error')).toContainText('clave');
  await expect(page.locator('#view-login')).toBeVisible();
});

test('el inspector de calidad solo ve y modifica lo de su cargo', async ({ page }) => {
  const product = makeProduct();
  const order = makeOrder(product, {
    folio: 5100,
    status: 'en control de calidad',
    qualityResult: 'Aprobado',
    producedQty: 8,
    scrapQty: 1
  });
  await openLogin(page, { products: [product], orders: [order] });
  await loginAs(page, ROLE_IDS.quality, ROLE_SECRETS[ROLE_IDS.quality]);

  await expect(page.locator('#view-dashboard')).toBeVisible();
  await expect(page.locator('#active-role')).toContainText('Inspector de calidad');
  await expect(page.locator('#nav-entities')).toBeHidden();
  await expect(page.locator('#nav-documents')).toBeVisible();

  await openDocuments(page);
  await expect(page.locator('#document-list .document-row').filter({ hasText: '5100' })).toBeVisible();
  await expect(page.locator('#document-tab-execution')).toBeHidden();
  await expect(page.locator('#document-tab-quality')).toBeVisible();
  await expect(page.locator('#document-filters')).toContainText('Resultado de calidad');
  await expect(page.locator('#document-filters')).not.toContainText('Prioridad');

  await page.locator('#document-list .document-row').first().click();
  await expect(page.locator('#document-detail')).toContainText('Calidad QA');
  await expect(page.locator('#document-detail')).not.toContainText('Máquina / Recurso');
  await expect(page.locator('#document-detail')).toContainText('Aprobar y terminar');
  await expect(page.locator('#document-detail')).toContainText('Rechazar orden');
  await expect(page.locator('#document-detail')).not.toContainText('Iniciar producción');
});

test('cerrar sesión conserva datos, permite cambiar de cargo y la recarga mantiene el rol', async ({ page }) => {
  const product = makeProduct();
  const order = makeOrder(product, { folio: 5200, status: 'planificada' });
  await openLogin(page, { products: [product], orders: [order] });
  await loginAs(page, ROLE_IDS.quality, ROLE_SECRETS[ROLE_IDS.quality]);

  await page.click('#logout');
  await expect(page.locator('#view-login')).toBeVisible();

  const stored = await page.evaluate(
    ({ entitiesKey, documentsKey, sessionKey }) => ({
      products: JSON.parse(localStorage.getItem(entitiesKey) || '[]'),
      orders: JSON.parse(localStorage.getItem(documentsKey) || '[]'),
      session: localStorage.getItem(sessionKey)
    }),
    { entitiesKey: ENTITIES_KEY, documentsKey: DOCUMENTS_KEY, sessionKey: SESSION_KEY }
  );
  expect(stored.products).toHaveLength(1);
  expect(stored.orders).toHaveLength(1);
  expect(stored.session).toBeNull();

  await loginAs(page, ROLE_IDS.manager, ROLE_SECRETS[ROLE_IDS.manager]);
  await expect(page.locator('#active-role')).toContainText('Jefe de planta');
  await expect(page.locator('#nav-entities')).toBeVisible();

  await page.reload();
  await expect(page.locator('#view-dashboard')).toBeVisible();
  await expect(page.locator('#view-login')).toBeHidden();
  await expect(page.locator('#active-role')).toContainText('Jefe de planta');
  await openDocuments(page);
  await expect(page.locator('#document-list .document-row').filter({ hasText: '5200' })).toBeVisible();
});
