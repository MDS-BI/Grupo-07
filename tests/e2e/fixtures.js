export const ENTITIES_KEY = 'erp_base_module:entities';
export const DOCUMENTS_KEY = 'erp_base_module:documents';

let sequence = 0;

function stamp() {
  sequence += 1;
  return `${Date.now()}-${sequence}`;
}

function today(offsetDays = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function makeProduct(overrides = {}) {
  const id = stamp();
  return {
    id: `ent-e2e-${id}`,
    entity_id: `eid-e2e-${id}`,
    name: `Producto ${id}`,
    code: `SKU-${id}`,
    itemType: 'Producto terminado',
    unitOfMeasure: 'Unidad',
    currentStock: 10,
    minStock: 5,
    supplier: 'Proveedor E2E',
    address: 'Almacén A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

export function makeOrder(product, overrides = {}) {
  const id = stamp();
  return {
    id: `doc-e2e-${id}`,
    entity_id: product.entity_id,
    series: 'OP',
    folio: 1000 + sequence,
    startDate: today(0),
    endDate: today(7),
    quantity: 10,
    subtotal: 1000,
    discount: 0,
    taxAmount: 160,
    totalAmount: 1160,
    currency: 'MXN',
    status: 'planificada',
    processStage: 'Corte',
    priority: 'Media',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

export async function waitForApp(page) {
  await page.goto('/');
  await page.waitForSelector('#view-dashboard');
  await page.waitForFunction(() => document.querySelector('#brand-name')?.textContent !== 'Módulo Base ERP');
}

export async function resetApp(page) {
  await waitForApp(page);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await waitForReady(page);
}

async function waitForReady(page) {
  await page.waitForSelector('#view-dashboard');
  await page.waitForFunction(() => document.querySelector('#brand-name')?.textContent !== 'Módulo Base ERP');
}

export async function seedApp(page, { products = [], orders = [] } = {}) {
  await resetApp(page);
  await page.evaluate(
    ({ entitiesKey, documentsKey, productList, orderList }) => {
      window.localStorage.setItem(entitiesKey, JSON.stringify(productList));
      window.localStorage.setItem(documentsKey, JSON.stringify(orderList));
    },
    {
      entitiesKey: ENTITIES_KEY,
      documentsKey: DOCUMENTS_KEY,
      productList: products,
      orderList: orders
    }
  );
  await page.reload();
  await waitForReady(page);
}

export async function openDocuments(page) {
  await page.locator('#nav-documents').click();
  await page.waitForSelector('#documents-domain:not([hidden])');
}

export function todayWithOffset(offsetDays) {
  return today(offsetDays);
}
