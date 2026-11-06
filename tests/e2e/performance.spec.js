import { test, expect } from '@playwright/test';
import { makeProduct, makeOrder, seedApp, openDocuments } from './fixtures.js';

const BULK_PRODUCTS = 500;
const BULK_ORDERS = 300;

function bulkProducts() {
  return Array.from({ length: BULK_PRODUCTS }, (_, index) =>
    makeProduct({
      id: `ent-bulk-${index}`,
      entity_id: `eid-bulk-${index}`,
      name: `Producto de catálogo ${index}`,
      code: `SKU-BULK-${String(index).padStart(4, '0')}`,
      currentStock: index % 3 === 0 ? 1 : 20,
      minStock: 5
    })
  );
}

function bulkOrders(products) {
  return Array.from({ length: BULK_ORDERS }, (_, index) => {
    const product = products[index % products.length];
    return makeOrder(product, {
      id: `doc-bulk-${index}`,
      folio: 10_000 + index,
      status: index % 4 === 0 ? 'terminada' : 'planificada',
      priority: index % 2 === 0 ? 'Alta' : 'Baja'
    });
  });
}

test('keeps the order list responsive with 500 products and 300 orders', async ({ page }) => {
  const products = bulkProducts();
  const orders = bulkOrders(products);
  await seedApp(page, { products, orders });

  const listStart = Date.now();
  await openDocuments(page);
  await expect(page.locator('#document-list tbody .document-row')).toHaveCount(BULK_ORDERS);
  const listRenderMs = Date.now() - listStart;

  const filterStart = Date.now();
  await page.selectOption('#document-filter-0', 'terminada');
  await expect(page.locator('#document-list tbody .document-row')).toHaveCount(
    orders.filter((order) => order.status === 'terminada').length
  );
  const filterMs = Date.now() - filterStart;

  expect(listRenderMs).toBeLessThan(5_000);
  expect(filterMs).toBeLessThan(3_000);
});

test('searches 500 products without a perceptible delay', async ({ page }) => {
  const products = bulkProducts();
  products[321] = makeProduct({
    id: 'ent-target',
    entity_id: 'eid-target',
    name: 'Producto objetivo de búsqueda',
    code: 'SKU-TARGET',
    supplier: 'Proveedor objetivo'
  });
  await seedApp(page, { products, orders: [] });

  await page.click('#nav-search');
  await page.waitForSelector('#view-search:not([hidden])');

  const searchStart = Date.now();
  await page.fill('#search-input', 'Proveedor objetivo');
  const item = page.locator('#search-results-list .entity-item');
  await expect(item).toHaveCount(1);
  await expect(item.first()).toContainText('Producto objetivo de búsqueda');
  const searchMs = Date.now() - searchStart;
  expect(searchMs).toBeLessThan(3_000);

  const missStart = Date.now();
  await page.fill('#search-input', 'término inexistente');
  await expect(page.locator('#search-results-list .entity-item')).toHaveCount(0);
  await expect(page.locator('#search-empty')).toBeVisible();
  const missMs = Date.now() - missStart;
  expect(missMs).toBeLessThan(3_000);
});

test('opens a detail view from a large order list without losing data', async ({ page }) => {
  const products = bulkProducts();
  const orders = bulkOrders(products);
  await seedApp(page, { products, orders });

  await openDocuments(page);
  await expect(page.locator('#document-list tbody .document-row')).toHaveCount(BULK_ORDERS);

  const openStart = Date.now();
  await page.locator('#document-list tbody .document-row').nth(150).click();
  await expect(page.locator('#document-detail .detail-section').first()).toBeVisible();
  const openMs = Date.now() - openStart;

  await expect(page.locator('#document-detail')).toContainText('Producto de catálogo');
  await expect(page.locator('#document-indicators')).not.toHaveText('');
  expect(openMs).toBeLessThan(3_000);
});
