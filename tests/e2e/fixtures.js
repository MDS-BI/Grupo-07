export const ENTITIES_KEY = 'erp_base_module:entities';
export const DOCUMENTS_KEY = 'erp_base_module:documents';
export const SESSION_KEY = 'erp_base_module:session';

export const ROLE_IDS = {
  manager: 'plantManager',
  warehouse: 'warehouseLead',
  supervisor: 'productionSupervisor',
  quality: 'qualityInspector'
};

export const ROLE_SECRETS = {
  [ROLE_IDS.manager]: 'PLANT-2026',
  [ROLE_IDS.warehouse]: 'WH-2026',
  [ROLE_IDS.supervisor]: 'PROD-2026',
  [ROLE_IDS.quality]: 'QA-2026'
};

async function waitForLogin(page) {
  await page.waitForSelector('#view-login:not([hidden])');
  await page.waitForFunction(() => document.querySelector('#login-role')?.options.length > 1);
}

/** Abre la aplicación sin sesión, con datos opcionales sembrados en localStorage. */
export async function openLogin(page, { products = [], orders = [] } = {}) {
  await page.goto('/?demo=0');
  await page.evaluate(
    ({ entitiesKey, documentsKey, sessionKey, productList, orderList }) => {
      window.localStorage.clear();
      window.localStorage.setItem(entitiesKey, JSON.stringify(productList));
      window.localStorage.setItem(documentsKey, JSON.stringify(orderList));
      window.localStorage.removeItem(sessionKey);
    },
    {
      entitiesKey: ENTITIES_KEY,
      documentsKey: DOCUMENTS_KEY,
      sessionKey: SESSION_KEY,
      productList: products,
      orderList: orders
    }
  );
  await page.reload();
  await waitForLogin(page);
}

export async function loginAs(page, roleId, secret) {
  await page.selectOption('#login-role', roleId);
  await page.fill('#login-secret', secret);
  await page.click('#login-submit');
  await page.waitForSelector('#view-dashboard:not([hidden])');
}

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

export async function ensureWorkspace(page) {
  await page.waitForFunction(
    () =>
      document.querySelector('#brand-name')?.textContent !== 'Módulo Base ERP' &&
      (!document.querySelector('#view-login')?.hidden || !document.querySelector('#view-dashboard')?.hidden)
  );
  const loginVisible = await page.locator('#view-login').isVisible();
  if (loginVisible) {
    await loginAs(page, ROLE_IDS.manager, ROLE_SECRETS[ROLE_IDS.manager]);
  }
  await page.waitForSelector('#view-dashboard:not([hidden])');
}

/** Espera a que la app termine de arrancar y garantiza una sesión de jefe de planta. */
export async function waitForApp(page) {
  await page.goto('/?demo=0');
  await ensureWorkspace(page);
}

export async function resetApp(page) {
  await waitForApp(page);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await ensureWorkspace(page);
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
  await ensureWorkspace(page);
}

export async function openDocuments(page) {
  await page.locator('#nav-documents').click();
  await page.waitForSelector('#documents-domain:not([hidden])');
}

export async function openDocumentTab(page, name) {
  await page.locator(`[data-document-tab="${name}"]`).click();
  await page.waitForSelector(`#document-tabpanel-${name}:not([hidden])`);
}

export function todayWithOffset(offsetDays) {
  return today(offsetDays);
}
