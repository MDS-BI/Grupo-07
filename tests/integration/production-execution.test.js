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

function executionForm() {
  return {
    form: qs('document-execution-form'),
    machine: qs('document-execution-machine'),
    batch: qs('document-execution-batchCode'),
    stage: qs('document-execution-processStage'),
    produced: qs('document-execution-producedQty'),
    scrap: qs('document-execution-scrapQty'),
    responsible: qs('document-execution-responsible'),
    notes: qs('document-execution-notes')
  };
}

describe('User Story 4 - production execution during the shift', () => {
  it('shows the declared execution fields for a released order', () => {
    const product = seedProduct();
    seedOrder(product, { status: 'liberada' });
    openDocuments();
    selectFirstRow();

    expect(qs('document-execution-panel').hidden).toBe(false);
    expect(qs('document-execution-title').textContent).toBe('Ejecución en planta');
    expect(qs('document-execution-submit').textContent).toBe('Guardar ejecución');

    const labels = [...document.querySelectorAll('#document-execution-fields label')].map((label) => label.textContent);
    expect(labels).toEqual([
      'Proceso / Etapa',
      'Máquina / Recurso',
      'Lote',
      'Cantidad producida',
      'Cantidad de merma',
      'Responsable',
      'Notas'
    ]);
  });

  it('saves machine, batch, stage, quantities and notes and persists them', () => {
    const product = seedProduct();
    const order = seedOrder(product, { status: 'liberada' });
    openDocuments();
    selectFirstRow();

    const fields = executionForm();
    expect(fields.stage.value).toBe('Corte');
    fields.machine.value = 'CNC-01';
    fields.batch.value = 'LOTE-2026-01';
    fields.produced.value = '8';
    fields.scrap.value = '2';
    fields.responsible.value = 'Ana Torres';
    fields.notes.value = 'Turno matutino';
    submit(fields.form, dom);

    const saved = storage.loadDocuments().find((record) => record.id === order.id);
    expect(saved.machine).toBe('CNC-01');
    expect(saved.batchCode).toBe('LOTE-2026-01');
    expect(saved.processStage).toBe('Corte');
    expect(saved.producedQty).toBe(8);
    expect(saved.scrapQty).toBe(2);
    expect(saved.responsible).toBe('Ana Torres');
    expect(saved.notes).toBe('Turno matutino');
  });

  it('starts production, updates quantities and sends the order to quality control', () => {
    const product = seedProduct();
    const order = seedOrder(product, { status: 'liberada' });
    openDocuments();
    selectFirstRow();

    const start = actionButton('en producción');
    expect(start).not.toBeNull();
    expect(start.textContent).toBe('Iniciar producción');
    start.click();
    expect(storage.loadDocuments().find((record) => record.id === order.id).status).toBe('en producción');

    const fields = executionForm();
    fields.produced.value = '12';
    fields.scrap.value = '1';
    submit(fields.form, dom);
    expect(storage.loadDocuments().find((record) => record.id === order.id).producedQty).toBe(12);

    const send = actionButton('en control de calidad');
    expect(send).not.toBeNull();
    expect(send.textContent).toBe('Enviar a control de calidad');
    send.click();

    expect(storage.loadDocuments().find((record) => record.id === order.id).status).toBe('en control de calidad');
  });

  it('rejects negative production quantities', () => {
    const product = seedProduct();
    const order = seedOrder(product, { status: 'liberada', producedQty: 5 });
    openDocuments();
    selectFirstRow();

    const fields = executionForm();
    fields.produced.value = '-5';
    submit(fields.form, dom);

    expect(qs('domain-feedback').textContent).toContain('no negativo');
    expect(storage.loadDocuments().find((record) => record.id === order.id).producedQty).toBe(5);
  });

  it('keeps quantities and notes when the order moves between production stages', () => {
    const product = seedProduct();
    const order = seedOrder(product, { status: 'liberada' });
    openDocuments();
    selectFirstRow();

    const fields = executionForm();
    fields.machine.value = 'CNC-02';
    fields.batch.value = 'LOTE-9';
    fields.produced.value = '4';
    fields.scrap.value = '1';
    fields.notes.value = 'Incidencia menor';
    submit(fields.form, dom);

    actionButton('en producción').click();
    actionButton('en control de calidad').click();

    const saved = storage.loadDocuments().find((record) => record.id === order.id);
    expect(saved.status).toBe('en control de calidad');
    expect(saved.machine).toBe('CNC-02');
    expect(saved.batchCode).toBe('LOTE-9');
    expect(saved.producedQty).toBe(4);
    expect(saved.scrapQty).toBe(1);
    expect(saved.notes).toBe('Incidencia menor');
  });
});
