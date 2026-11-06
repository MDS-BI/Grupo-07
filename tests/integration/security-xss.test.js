import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupManufacturingDom,
  bootManufacturing,
  searchFor,
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

describe('Cross-cutting security - persisted XSS payloads are rendered as text', () => {
  it('does not execute or inject a script payload stored in a product name', () => {
    seedProduct({ name: '<script>alert(1)</script>', code: 'XSS-001' });
    searchFor('script', dom);

    const results = document.querySelector('#search-results-list');
    expect(results.textContent).toContain('<script>alert(1)</script>');
    expect(results.querySelectorAll('script')).toHaveLength(0);
    expect(globalThis.alert).not.toHaveBeenCalled();
  });

  it('does not inject an image payload stored in order notes', () => {
    const payload = '"><img src=x onerror=alert(1)>';
    const product = seedProduct();
    seedOrder(product, { notes: payload });
    openDocuments();
    selectFirstRow();

    const detail = document.querySelector('#document-detail');
    expect(detail.textContent).toContain(payload);
    expect(detail.querySelectorAll('img')).toHaveLength(0);
    expect(globalThis.alert).not.toHaveBeenCalled();
  });

  it('renders javascript URLs from custom fields as plain text', () => {
    seedProduct({ supplier: 'javascript:alert(1)', code: 'XSS-002' });
    searchFor('XSS-002', dom);

    const results = document.querySelector('#search-results-list');
    expect(results.textContent).toContain('javascript:alert(1)');
    expect(results.querySelectorAll('a')).toHaveLength(0);
    expect(globalThis.alert).not.toHaveBeenCalled();
  });

  it('escapes payloads stored in the product code inside the order list', () => {
    const product = seedProduct({ name: '<img src=x onerror=alert(1)>' });
    seedOrder(product);
    openDocuments();

    const list = document.querySelector('#document-list');
    expect(list.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(list.querySelectorAll('img')).toHaveLength(0);
    expect(globalThis.alert).not.toHaveBeenCalled();
  });
});
