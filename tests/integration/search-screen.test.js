import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupManufacturingDom, bootManufacturing, qs, input, seedProduct, storage } from './support/manufacturing.js';

let dom;

beforeEach(async () => {
  dom = setupManufacturingDom();
  await bootManufacturing();
});

afterEach(() => {
  dom.window.close();
});

function search(term) {
  qs('search-input').value = term;
  input(qs('search-input'), dom);
}

describe('User Story 11 - dedicated search screen', () => {
  it('opens from the sidebar and returns to the dashboard', () => {
    qs('nav-search').click();
    expect(qs('view-search').hidden).toBe(false);
    expect(qs('view-dashboard').hidden).toBe(true);
    expect(qs('nav-search').getAttribute('aria-current')).toBe('page');

    qs('nav-dashboard').click();
    expect(qs('view-dashboard').hidden).toBe(false);
    expect(qs('view-search').hidden).toBe(true);
    expect(qs('nav-dashboard').getAttribute('aria-current')).toBe('page');
  });

  it('opens from the dashboard quick action', () => {
    seedProduct();
    qs('action-find').click();

    expect(qs('view-search').hidden).toBe(false);
  });

  it('shows only matching results and the empty state', () => {
    seedProduct({ name: 'Mesa de roble', code: 'SKU-001' });
    seedProduct({ name: 'Silla metálica', code: 'SKU-002' });
    qs('nav-search').click();

    search('silla');
    let items = [...document.querySelectorAll('#search-results-list .entity-item')];
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Silla metálica');
    expect(qs('search-empty').hidden).toBe(true);

    search('martillo');
    items = [...document.querySelectorAll('#search-results-list .entity-item')];
    expect(items).toHaveLength(0);
    expect(qs('search-empty').hidden).toBe(false);
  });

  it('searches a large catalog without a perceptible delay', () => {
    const products = Array.from({ length: 500 }, (_, index) => ({
      id: `ent-${index}`,
      entity_id: `eid-${index}`,
      name: `Producto ${index}`,
      code: `SKU-${String(index).padStart(4, '0')}`,
      itemType: 'Producto terminado',
      unitOfMeasure: 'Unidad'
    }));
    storage.saveEntities(products);
    qs('nav-search').click();

    const start = performance.now();
    search('Producto 499');
    const elapsed = performance.now() - start;

    const items = [...document.querySelectorAll('#search-results-list .entity-item')];
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Producto 499');
    expect(elapsed).toBeLessThan(2000);
  });
});
