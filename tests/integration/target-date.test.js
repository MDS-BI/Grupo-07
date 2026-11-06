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

describe('User Story 9 - optional target date', () => {
  it('shows the target date in search results when present', () => {
    seedProduct({ targetDate: '2030-05-01' });
    searchFor('SKU-001', dom);

    const result = document.querySelector('#search-results-list .entity-item');
    expect(result.textContent).toContain('Fecha objetivo: 2030-05-01');
  });

  it('saves a product without a target date and omits the line', () => {
    const product = seedProduct({ targetDate: undefined });
    expect(product.targetDate).toBeUndefined();

    searchFor('SKU-001', dom);

    const result = document.querySelector('#search-results-list .entity-item');
    expect(result).not.toBeNull();
    expect(result.textContent).not.toContain('Fecha objetivo:');
  });

  it('rejects an invalid target date', () => {
    const result = storage.validateEntity({
      name: 'Mesa de roble',
      code: 'SKU-001',
      itemType: 'Producto terminado',
      unitOfMeasure: 'Unidad',
      targetDate: '31/12/2030'
    });

    expect(result.valid).toBe(false);
    expect(result.errors.targetDate).toContain('no es válida');
  });

  it('accepts an empty target date', () => {
    const result = storage.validateEntity({
      name: 'Mesa de roble',
      code: 'SKU-001',
      itemType: 'Producto terminado',
      unitOfMeasure: 'Unidad',
      targetDate: ''
    });

    expect(result.valid).toBe(true);
  });

  it('updates the target date and reflects it in search', () => {
    const product = seedProduct({ targetDate: '2030-05-01' });
    storage.updateEntity(product.id, { targetDate: '2031-06-15' });

    searchFor('SKU-001', dom);

    const result = document.querySelector('#search-results-list .entity-item');
    expect(result.textContent).toContain('Fecha objetivo: 2031-06-15');
  });
});
