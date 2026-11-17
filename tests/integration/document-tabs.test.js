import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupManufacturingDom,
  bootManufacturing,
  qs,
  seedProduct,
  seedOrder,
  openDocuments,
  selectFirstRow
} from './support/manufacturing.js';

let dom;

beforeEach(async () => {
  dom = setupManufacturingDom();
  await bootManufacturing();
});

afterEach(() => {
  dom.window.close();
});

function visibleTabs() {
  return [...document.querySelectorAll('[data-document-tab]')]
    .filter((tab) => !tab.hidden)
    .map((tab) => tab.dataset.documentTab);
}

describe('Production orders sub-windows', () => {
  it('splits the documents view into five tabs with the orders list active by default', () => {
    expect(visibleTabs()).toEqual(['orders', 'indicators', 'execution', 'quality', 'form']);
    expect(qs('document-tab-orders-label').textContent).toBe('Órdenes de Producción');
    expect(qs('document-tab-form-label').textContent).toBe('Agregar / Editar Orden de Producción');

    openDocuments();
    expect(qs('document-tabpanel-orders').hidden).toBe(false);
    expect(qs('document-tab-orders').getAttribute('aria-selected')).toBe('true');
    expect(qs('document-tabpanel-indicators').hidden).toBe(true);
    expect(qs('document-tabpanel-form').hidden).toBe(true);
  });

  it('switches between indicators, execution, quality and the order form', () => {
    openDocuments();

    for (const name of ['indicators', 'execution', 'quality', 'form']) {
      qs(`document-tab-${name}`).click();
      expect(qs(`document-tabpanel-${name}`).hidden).toBe(false);
      expect(qs(`document-tab-${name}`).getAttribute('aria-selected')).toBe('true');
      expect(qs('document-tabpanel-orders').hidden).toBe(true);
    }

    qs('document-tab-orders').click();
    expect(qs('document-tabpanel-orders').hidden).toBe(false);
    expect(qs('document-tab-orders').getAttribute('aria-selected')).toBe('true');
  });

  it('asks for a selected order before showing the execution and quality forms', () => {
    openDocuments();

    qs('document-tab-execution').click();
    expect(qs('document-execution-panel').hidden).toBe(true);
    expect(qs('document-execution-empty').hidden).toBe(false);

    qs('document-tab-quality').click();
    expect(qs('document-quality-panel').hidden).toBe(true);
    expect(qs('document-quality-empty').hidden).toBe(false);

    const product = seedProduct();
    seedOrder(product, { status: 'liberada' });
    qs('nav-documents').click();
    selectFirstRow();

    expect(qs('document-execution-panel').hidden).toBe(false);
    expect(qs('document-execution-empty').hidden).toBe(true);
    expect(qs('document-quality-panel').hidden).toBe(false);
    expect(qs('document-quality-empty').hidden).toBe(true);
  });

  it('opens the order form tab from the dashboard quick action', () => {
    qs('action-new-document').click();

    expect(qs('view-documents').hidden).toBe(false);
    expect(qs('document-tabpanel-form').hidden).toBe(false);
    expect(qs('document-tab-form').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(qs('document-entity'));
  });
});
