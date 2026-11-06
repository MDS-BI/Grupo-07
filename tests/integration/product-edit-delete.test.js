import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupManufacturingDom,
  bootManufacturing,
  qs,
  submit,
  change,
  searchFor,
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

function fillProduct(overrides = {}) {
  const values = {
    name: 'Mesa de roble',
    code: 'SKU-001',
    itemType: 'Producto terminado',
    unitOfMeasure: 'Unidad',
    currentStock: '20',
    minStock: '5',
    leadTimeDays: '7',
    supplier: 'Maderas del Norte',
    address: 'Almacén A',
    ...overrides
  };

  qs('name').value = values.name;
  qs('code').value = values.code;
  qs('cf-itemType').value = values.itemType;
  qs('cf-unitOfMeasure').value = values.unitOfMeasure;
  qs('cf-currentStock').value = values.currentStock;
  qs('cf-minStock').value = values.minStock;
  qs('cf-leadTimeDays').value = values.leadTimeDays;
  qs('cf-supplier').value = values.supplier;
  qs('address').value = values.address;
}

function createProduct(overrides = {}) {
  qs('nav-entities').click();
  fillProduct(overrides);
  submit(qs('entity-form'), dom);
  return storage.loadEntities()[0];
}

describe('User Story 2 - edit and delete products', () => {
  it('blocks saving when required product fields are missing', () => {
    qs('nav-entities').click();
    qs('name').value = 'Mesa de roble';
    qs('code').value = 'SKU-001';
    submit(qs('entity-form'), dom);

    expect(storage.loadEntities()).toHaveLength(0);
    expect(qs('error-cf-itemType').textContent).toContain('obligatorio');
    expect(qs('error-cf-unitOfMeasure').textContent).toContain('obligatorio');
  });

  it('rejects negative stock values and keeps the form open', () => {
    qs('nav-entities').click();
    fillProduct({ currentStock: '-3' });
    submit(qs('entity-form'), dom);

    expect(storage.loadEntities()).toHaveLength(0);
    expect(qs('error-cf-currentStock').textContent).toContain('no negativo');
  });

  it('edits a product and refreshes the search results', () => {
    const product = createProduct();

    qs('edit-entity').value = product.id;
    change(qs('edit-entity'), dom);
    expect(qs('cf-currentStock').value).toBe('20');

    qs('cf-currentStock').value = '25';
    submit(qs('entity-form'), dom);

    expect(storage.loadEntities()[0].currentStock).toBe(25);
    expect(qs('entity-id').value).toBe('');

    searchFor('Mesa de roble', dom);
    const result = document.querySelector('#search-results-list .entity-item');
    expect(result.textContent).toContain('Stock actual: 25');
  });

  it('warns about associated orders and cancels deletion when the user refuses', () => {
    const product = createProduct();
    storage.addDocument({
      entity_id: product.entity_id,
      folio: 1001,
      startDate: '2030-01-01',
      endDate: '2030-01-10',
      processStage: 'Corte'
    });

    qs('edit-entity').value = product.id;
    change(qs('edit-entity'), dom);
    globalThis.confirm.mockReturnValueOnce(false);
    qs('delete-entity').click();

    expect(globalThis.confirm).toHaveBeenCalled();
    expect(globalThis.confirm.mock.calls[0][0]).toContain('órdenes de producción');
    expect(storage.loadEntities()).toHaveLength(1);
    expect(storage.loadDocuments()).toHaveLength(1);
  });

  it('deletes the product and its orders in cascade when confirmed', () => {
    const product = createProduct();
    storage.addDocument({
      entity_id: product.entity_id,
      folio: 1001,
      startDate: '2030-01-01',
      endDate: '2030-01-10',
      processStage: 'Corte'
    });

    qs('edit-entity').value = product.id;
    change(qs('edit-entity'), dom);
    qs('delete-entity').click();

    expect(storage.loadEntities()).toHaveLength(0);
    expect(storage.loadDocuments()).toHaveLength(0);
  });
});
