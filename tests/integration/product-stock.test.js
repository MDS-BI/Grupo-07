import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupManufacturingDom, bootManufacturing, searchFor, seedProduct, storage } from './support/manufacturing.js';

let dom;

beforeEach(async () => {
  dom = setupManufacturingDom();
  await bootManufacturing();
});

afterEach(() => {
  dom.window.close();
});

function firstResult() {
  return document.querySelector('#search-results-list .entity-item');
}

describe('User Story 3 - stock, locations, suppliers and lead times', () => {
  it('shows the low stock badge when current stock is strictly below the minimum', () => {
    seedProduct({ currentStock: 5, minStock: 10 });
    searchFor('SKU-001', dom);

    const result = firstResult();
    expect(result.textContent).toContain('Stock actual: 5');
    expect(result.textContent).toContain('Stock mínimo: 10');
    expect(result.querySelector('.badge-warning').textContent).toBe('Stock bajo el mínimo');
  });

  it('does not flag stock when current stock equals the minimum', () => {
    seedProduct({ currentStock: 10, minStock: 10 });
    searchFor('SKU-001', dom);

    expect(firstResult().querySelector('.badge-warning')).toBeNull();
  });

  it('shows "sin dato" and no badge when the minimum stock is missing', () => {
    seedProduct({ currentStock: 3, minStock: undefined });
    searchFor('SKU-001', dom);

    const result = firstResult();
    expect(result.textContent).toContain('Stock mínimo: sin dato');
    expect(result.querySelector('.badge-warning')).toBeNull();
  });

  it('shows "sin dato" when the current stock is missing', () => {
    seedProduct({ currentStock: undefined, minStock: 10 });
    searchFor('SKU-001', dom);

    const result = firstResult();
    expect(result.textContent).toContain('Stock actual: sin dato');
    expect(result.querySelector('.badge-warning')).toBeNull();
  });

  it('reflects an edited stock value in the search results', () => {
    const product = seedProduct({ currentStock: 20, minStock: 10 });
    storage.updateEntity(product.id, { currentStock: 2 });

    searchFor('SKU-001', dom);

    expect(firstResult().textContent).toContain('Stock actual: 2');
    expect(firstResult().querySelector('.badge-warning').textContent).toBe('Stock bajo el mínimo');
  });

  it('shows supplier and lead time in search results', () => {
    seedProduct({
      address: 'Almacén B',
      supplier: 'Aceros del Bajío',
      leadTimeDays: 14
    });
    searchFor('Almacén B', dom);

    const result = firstResult();
    expect(result).not.toBeNull();
    expect(result.textContent).toContain('Proveedor: Aceros del Bajío');
    expect(result.textContent).toContain('Plazo de reposición (días): 14');
  });
});
