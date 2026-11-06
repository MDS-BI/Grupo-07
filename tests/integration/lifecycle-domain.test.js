import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupManufacturingDom,
  bootManufacturing,
  qs,
  submit,
  change,
  seedProduct,
  seedOrder,
  openDocuments,
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

describe('User Story 12 - document status lifecycle', () => {
  it('offers only the configured statuses when creating an order', () => {
    qs('nav-documents').click();
    const options = [...qs('status').options].map((option) => option.value);
    expect(options).toEqual([
      '',
      'planificada',
      'liberada',
      'en producción',
      'en control de calidad',
      'terminada',
      'cancelada'
    ]);
  });

  it('offers only the reachable transitions for an existing order', () => {
    const product = seedProduct();
    const order = seedOrder(product, { status: 'liberada' });
    openDocuments();

    qs('edit-document').value = order.id;
    change(qs('edit-document'), dom);

    const options = [...qs('status').options].map((option) => option.value);
    expect(options).toEqual(['liberada', 'en producción', 'cancelada']);
  });

  it('applies a valid lifecycle transition and rejects an unreachable one', () => {
    const product = seedProduct();
    const order = seedOrder(product, { status: 'liberada' });

    const updated = storage.updateDocument(order.id, { status: 'en producción' });
    expect(updated.status).toBe('en producción');

    expect(() => storage.updateDocument(order.id, { status: 'terminada' })).toThrow(/Transición de estado inválida/);
    expect(storage.loadDocuments()[0].status).toBe('en producción');
  });

  it('keeps status free-form when no lifecycle is configured', async () => {
    dom.window.close();
    dom = setupManufacturingDom();
    await bootManufacturing({ moduleName: 'Módulo libre', statusLifecycle: null });

    qs('nav-entities').click();
    qs('name').value = 'Registro libre';
    qs('code').value = 'LIB-001';
    submit(qs('entity-form'), dom);
    const entity = storage.loadEntities()[0];
    expect(entity).toBeDefined();

    qs('nav-documents').click();
    expect(qs('status').tagName).toBe('INPUT');
    expect(qs('status').getAttribute('type')).toBe('text');

    qs('document-entity').value = entity.entity_id;
    qs('folio').value = '1';
    qs('startDate').value = '2030-01-01';
    qs('endDate').value = '2030-01-05';
    qs('status').value = 'borrador';
    submit(qs('document-form'), dom);

    expect(storage.loadDocuments()[0].status).toBe('borrador');
  });
});
