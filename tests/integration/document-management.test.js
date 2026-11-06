import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupManufacturingDom, bootManufacturing, qs, submit, change, storage } from './support/manufacturing.js';

let dom;

beforeEach(async () => {
  dom = setupManufacturingDom();
  await bootManufacturing();
});

afterEach(() => {
  dom.window.close();
});

function createProduct() {
  qs('nav-entities').click();
  qs('name').value = 'Mesa de roble';
  qs('code').value = 'SKU-001';
  qs('cf-itemType').value = 'Producto terminado';
  qs('cf-unitOfMeasure').value = 'Unidad';
  qs('cf-currentStock').value = '20';
  qs('cf-minStock').value = '5';
  submit(qs('entity-form'), dom);
  return storage.loadEntities()[0];
}

function fillOrder(entityId, overrides = {}) {
  const values = {
    series: 'OP',
    folio: '3001',
    startDate: '2030-01-01',
    endDate: '2030-01-10',
    quantity: '5',
    subtotal: '500',
    discount: '0',
    taxAmount: '80',
    totalAmount: '580',
    currency: 'MXN',
    processStage: 'Corte',
    status: 'planificada',
    ...overrides
  };

  qs('document-entity').value = entityId;
  qs('series').value = values.series;
  qs('folio').value = values.folio;
  qs('startDate').value = values.startDate;
  qs('endDate').value = values.endDate;
  qs('quantity').value = values.quantity;
  qs('subtotal').value = values.subtotal;
  qs('discount').value = values.discount;
  qs('taxAmount').value = values.taxAmount;
  qs('totalAmount').value = values.totalAmount;
  qs('currency').value = values.currency;
  qs('cf-processStage').value = values.processStage;
  qs('status').value = values.status;
}

function createOrder(entityId, overrides = {}) {
  qs('nav-documents').click();
  fillOrder(entityId, overrides);
  submit(qs('document-form'), dom);
  return storage.loadDocuments()[0];
}

describe('User Story 10 - document management', () => {
  it('adds an order to a product from the documents module', () => {
    const product = createProduct();
    qs('nav-documents').click();
    fillOrder(product.entity_id);
    submit(qs('document-form'), dom);

    const documents = storage.loadDocuments();
    expect(documents).toHaveLength(1);
    expect(documents[0].entity_id).toBe(product.entity_id);
    expect(documents[0].series).toBe('OP');
    expect(documents[0].folio).toBe(3001);
    expect(documents[0].status).toBe('planificada');
    expect(documents[0].processStage).toBe('Corte');

    expect(document.querySelectorAll('#document-list tbody .document-row')).toHaveLength(1);
    expect(qs('document-list').textContent).toContain('Mesa de roble');
  });

  it('blocks an order when required base or domain fields are missing', () => {
    const product = createProduct();
    qs('nav-documents').click();
    fillOrder(product.entity_id, { folio: '', startDate: '', endDate: '', processStage: '' });
    submit(qs('document-form'), dom);

    expect(storage.loadDocuments()).toHaveLength(0);
    expect(qs('error-folio').textContent).toContain('obligatorio');
    expect(qs('error-startDate').textContent).toContain('obligatoria');
    expect(qs('error-endDate').textContent).toContain('obligatoria');
    expect(qs('error-cf-processStage').textContent).toContain('obligatorio');
  });

  it('edits an existing order', () => {
    const product = createProduct();
    const order = createOrder(product.entity_id);

    qs('edit-document').value = order.id;
    change(qs('edit-document'), dom);
    expect(qs('quantity').value).toBe('5');

    qs('quantity').value = '9';
    qs('notes').value = 'Cantidad ajustada';
    submit(qs('document-form'), dom);

    const saved = storage.loadDocuments()[0];
    expect(saved.quantity).toBe(9);
    expect(saved.notes).toBe('Cantidad ajustada');
  });

  it('deletes an order after confirmation', () => {
    const product = createProduct();
    const order = createOrder(product.entity_id);

    qs('edit-document').value = order.id;
    change(qs('edit-document'), dom);
    qs('delete-document').click();

    expect(storage.loadDocuments()).toHaveLength(0);
    expect(qs('document-list-empty')).not.toBeNull();
  });

  it('cancels order deletion when the user refuses', () => {
    const product = createProduct();
    const order = createOrder(product.entity_id);

    qs('edit-document').value = order.id;
    change(qs('edit-document'), dom);
    globalThis.confirm.mockReturnValueOnce(false);
    qs('delete-document').click();

    expect(storage.loadDocuments()).toHaveLength(1);
  });

  it('deletes the product orders in cascade', () => {
    const product = createProduct();
    createOrder(product.entity_id);
    expect(storage.loadDocuments()).toHaveLength(1);

    qs('nav-entities').click();
    qs('edit-entity').value = product.id;
    change(qs('edit-entity'), dom);
    qs('delete-entity').click();

    expect(storage.loadEntities()).toHaveLength(0);
    expect(storage.loadDocuments()).toHaveLength(0);
  });
});
