import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupManufacturingDom,
  bootManufacturing,
  qs,
  searchFor,
  seedProduct,
  seedOrder,
  storage
} from './support/manufacturing.js';

let dom;

beforeEach(async () => {
  dom = setupManufacturingDom();
  await bootManufacturing();
});

afterEach(() => {
  dom.window.close();
});

function resultItems() {
  return [...document.querySelectorAll('#search-results-list .entity-item')];
}

describe('User Story 8 - search records quickly', () => {
  it('finds products case-insensitively by name, code and custom values', () => {
    seedProduct({ name: 'Mesa de Roble', code: 'SKU-100', supplier: 'Maderas del Norte' });
    seedProduct({ name: 'Silla metálica', code: 'SKU-200', supplier: 'Aceros del Bajío' });

    searchFor('mesa', dom);
    expect(resultItems()).toHaveLength(1);
    expect(resultItems()[0].textContent).toContain('Mesa de Roble');

    searchFor('sku-200', dom);
    expect(resultItems()).toHaveLength(1);
    expect(resultItems()[0].textContent).toContain('Silla metálica');

    searchFor('aceros', dom);
    expect(resultItems()).toHaveLength(1);
    expect(resultItems()[0].textContent).toContain('Silla metálica');
  });

  it('shows a clear empty state when there is no match', () => {
    seedProduct();
    searchFor('no-existe', dom);

    expect(resultItems()).toHaveLength(0);
    expect(qs('search-empty').hidden).toBe(false);
  });

  it('also finds production orders by their own data', () => {
    const product = seedProduct({ name: 'Mesa de Roble' });
    seedOrder(product, { series: 'OP', folio: 7777, status: 'liberada' });

    searchFor('7777', dom);

    const orderItem = document.querySelector('#search-results-list .document-item');
    expect(orderItem).not.toBeNull();
    expect(orderItem.dataset.documentId).toBeTruthy();
    expect(orderItem.textContent).toContain('7777');
    expect(orderItem.textContent).toContain('Mesa de Roble');
  });

  it('returns matching orders when the search term matches their product', () => {
    const product = seedProduct({ name: 'Mesa de Roble' });
    seedOrder(product, { folio: 8001 });

    searchFor('Mesa de Roble', dom);

    expect(resultItems()[0].textContent).toContain('Mesa de Roble');
    expect(document.querySelector('#search-results-list .document-item')).not.toBeNull();
  });

  it('searches 500 products in a single fast pass', () => {
    const products = Array.from({ length: 500 }, (_, index) => ({
      id: `ent-${index}`,
      entity_id: `eid-${index}`,
      name: `Producto ${index}`,
      code: `SKU-${String(index).padStart(4, '0')}`,
      itemType: 'Producto terminado',
      unitOfMeasure: 'Unidad',
      supplier: index === 321 ? 'Proveedor objetivo' : 'Proveedor genérico'
    }));
    storage.saveEntities(products);

    const start = performance.now();
    searchFor('objetivo', dom);
    const elapsed = performance.now() - start;

    const items = resultItems();
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Producto 321');
    expect(elapsed).toBeLessThan(2000);
  });
});
