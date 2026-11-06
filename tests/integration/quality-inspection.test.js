import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupManufacturingDom,
  bootManufacturing,
  qs,
  submit,
  seedProduct,
  seedOrder,
  openDocuments,
  selectFirstRow,
  actionButton,
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

function qualityForm() {
  return {
    form: qs('document-quality-form'),
    produced: qs('document-quality-producedQty'),
    scrap: qs('document-quality-scrapQty'),
    result: qs('document-quality-qualityResult'),
    notes: qs('document-quality-notes')
  };
}

describe('User Story 5 - quality inspection', () => {
  it('uses the QA labels over the production quantity keys', () => {
    const product = seedProduct();
    seedOrder(product, { status: 'en control de calidad', qualityResult: 'Pendiente' });
    openDocuments();
    selectFirstRow();

    expect(qs('document-quality-panel').hidden).toBe(false);
    expect(qs('document-quality-title').textContent).toBe('Control de calidad');
    expect(qs('document-quality-submit').textContent).toBe('Guardar inspección');

    const labels = [...document.querySelectorAll('#document-quality-fields label')].map((label) => label.textContent);
    expect(labels).toEqual(['Cantidad QA', 'Merma QA', 'Calidad QA', 'Nota']);
  });

  it('records the QA values and approves the order so it can be finished', () => {
    const product = seedProduct();
    const order = seedOrder(product, { status: 'en control de calidad', qualityResult: 'Pendiente' });
    openDocuments();
    selectFirstRow();

    const fields = qualityForm();
    fields.produced.value = '8';
    fields.scrap.value = '2';
    fields.result.value = 'Aprobado';
    fields.notes.value = 'Lote conforme';
    submit(fields.form, dom);

    const saved = storage.loadDocuments().find((record) => record.id === order.id);
    expect(saved.producedQty).toBe(8);
    expect(saved.scrapQty).toBe(2);
    expect(saved.qualityResult).toBe('Aprobado');
    expect(saved.notes).toBe('Lote conforme');

    const approve = actionButton('terminada');
    expect(approve.disabled).toBe(false);
    approve.click();

    expect(storage.loadDocuments().find((record) => record.id === order.id).status).toBe('terminada');
    expect(qs('domain-feedback').textContent).toBe('');
  });

  it('returns a corrected order to production preserving QA data', () => {
    const product = seedProduct();
    const order = seedOrder(product, {
      status: 'en control de calidad',
      qualityResult: 'Corrección',
      producedQty: 7,
      scrapQty: 3,
      notes: 'Revisar acabado'
    });
    openDocuments();
    selectFirstRow();

    const back = actionButton('en producción');
    expect(back).not.toBeNull();
    expect(back.disabled).toBe(false);
    back.click();

    const saved = storage.loadDocuments().find((record) => record.id === order.id);
    expect(saved.status).toBe('en producción');
    expect(saved.producedQty).toBe(7);
    expect(saved.scrapQty).toBe(3);
    expect(saved.qualityResult).toBe('Corrección');
    expect(saved.notes).toBe('Revisar acabado');
  });

  it('rejects an order when the inspector marks it as rejected', () => {
    const product = seedProduct();
    const order = seedOrder(product, {
      status: 'en control de calidad',
      qualityResult: 'Rechazado',
      scrapQty: 9
    });
    openDocuments();
    selectFirstRow();

    const reject = actionButton('cancelada');
    expect(reject).not.toBeNull();
    expect(reject.disabled).toBe(false);
    reject.click();

    const saved = storage.loadDocuments().find((record) => record.id === order.id);
    expect(saved.status).toBe('cancelada');
    expect(saved.scrapQty).toBe(9);
    expect(saved.qualityResult).toBe('Rechazado');
  });

  it('refuses to finish an order whose quality is still pending', () => {
    const product = seedProduct();
    const order = seedOrder(product, { status: 'en control de calidad', qualityResult: 'Pendiente' });
    openDocuments();
    selectFirstRow();

    const approve = actionButton('terminada');
    expect(approve.disabled).toBe(true);
    expect(approve.title).toContain('Complete los datos requeridos');

    expect(() => storage.updateDocument(order.id, { status: 'terminada' })).toThrow(/calidad Aprobada/);
  });

  it('rejects negative QA quantities', () => {
    const product = seedProduct();
    const order = seedOrder(product, { status: 'en control de calidad', producedQty: 5 });
    openDocuments();
    selectFirstRow();

    const fields = qualityForm();
    fields.scrap.value = '-1';
    submit(fields.form, dom);

    expect(qs('domain-feedback').textContent).toContain('no negativo');
    expect(storage.loadDocuments().find((record) => record.id === order.id).scrapQty).toBeUndefined();
  });
});
