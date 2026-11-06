import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { vi } from 'vitest';
import { normalizeConfig, manufacturingConfig } from '../../../src/module-config.js';
import { initApp } from '../../../src/app.js';
import * as storage from '../../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../../index.html', import.meta.url)), 'utf8');

export { storage };

export function setupManufacturingDom() {
  const dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();
  return dom;
}

export async function bootManufacturing(configOverride = manufacturingConfig) {
  const result = normalizeConfig(configOverride);
  await initApp(result);
  return result;
}

export function qs(id) {
  return document.getElementById(id);
}

export function submit(form, dom) {
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

export function change(element, dom) {
  element.dispatchEvent(new dom.window.Event('change', { bubbles: true, cancelable: true }));
}

export function input(element, dom) {
  element.dispatchEvent(new dom.window.Event('input', { bubbles: true, cancelable: true }));
}

export function seedProduct(overrides = {}) {
  return storage.addEntity({
    name: 'Mesa de roble',
    code: 'SKU-001',
    itemType: 'Producto terminado',
    unitOfMeasure: 'Unidad',
    currentStock: 20,
    minStock: 5,
    supplier: 'Maderas del Norte',
    address: 'Almacén A',
    leadTimeDays: 7,
    ...overrides
  });
}

export function seedOrder(product, overrides = {}) {
  return storage.addDocument({
    entity_id: product.entity_id,
    series: 'OP',
    folio: 1001,
    startDate: '2030-01-01',
    endDate: '2030-01-10',
    quantity: 10,
    subtotal: 1000,
    discount: 0,
    taxAmount: 160,
    totalAmount: 1160,
    currency: 'MXN',
    priority: 'Media',
    processStage: 'Corte',
    ...overrides
  });
}

export function openDocuments() {
  qs('nav-documents').click();
}

export function selectFirstRow() {
  const row = document.querySelector('#document-list .document-row');
  if (row) {
    row.click();
  }
  return row;
}

export function actionButton(to) {
  return document.querySelector(`#document-detail .document-actions button[data-transition-to="${to}"]`);
}

export function searchFor(term, dom) {
  qs('nav-search').click();
  qs('search-input').value = term;
  input(qs('search-input'), dom);
}
