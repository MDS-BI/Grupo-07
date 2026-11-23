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

describe('User Story 13 - branded ERP workspace shell', () => {
  it('shows the configured brand, logo and accent color', () => {
    expect(qs('brand-name').textContent).toBe('Manufactura y Operaciones');
    const brandImage = qs('brand-logo');
    brandImage.dispatchEvent(new window.Event('load'));
    expect(qs('brand-logo-frame').hidden).toBe(false);
    expect(qs('logo-mark').hidden).toBe(true);

    brandImage.dispatchEvent(new window.Event('error'));
    expect(qs('brand-logo-frame').hidden).toBe(true);
    expect(qs('logo-mark').hidden).toBe(false);
    const logo = qs('logo-mark').querySelector('svg');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute('aria-label')).toBe('Manufactura y Operaciones');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#294765');
    expect(document.title).toBe('Manufactura y Operaciones');
    expect(qs('config-banner').hidden).toBe(true);
    expect(qs('config-banner').textContent).toBe('');
  });

  it('keeps exactly four modules and marks the active one', () => {
    const buttons = [...document.querySelectorAll('.nav-module')];
    expect(buttons).toHaveLength(4);
    expect(buttons.map((button) => button.dataset.module)).toEqual(['dashboard', 'entities', 'documents', 'search']);

    qs('nav-entities').click();
    expect(qs('nav-entities').getAttribute('aria-current')).toBe('page');
    expect(qs('nav-dashboard').hasAttribute('aria-current')).toBe(false);

    qs('nav-documents').click();
    expect(qs('nav-documents').getAttribute('aria-current')).toBe('page');
    expect(qs('nav-entities').hasAttribute('aria-current')).toBe(false);
    expect(qs('view-documents').hidden).toBe(false);

    qs('brand-home').click();
    expect(qs('nav-dashboard').getAttribute('aria-current')).toBe('page');
    expect(qs('view-dashboard').hidden).toBe(false);
  });

  it('keeps the order list and detail inside the documents module', () => {
    const product = seedProduct();
    seedOrder(product);
    openDocuments();
    selectFirstRow();

    expect(qs('view-documents').contains(qs('document-list'))).toBe(true);
    expect(qs('view-documents').contains(qs('document-detail'))).toBe(true);
    expect(qs('view-documents').contains(qs('document-indicators'))).toBe(true);
    expect(qs('view-entities').contains(qs('document-list'))).toBe(false);
    expect(qs('view-search').contains(qs('document-list'))).toBe(false);
  });
});
