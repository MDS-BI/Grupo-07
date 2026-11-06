import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupManufacturingDom,
  bootManufacturing,
  qs,
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

function refreshSelection() {
  selectFirstRow();
}

describe('User Story 1 - confirm and reject orders', () => {
  it('confirms a planned order and stores an optional action note', () => {
    const product = seedProduct();
    seedOrder(product, { status: 'planificada' });
    openDocuments();
    refreshSelection();

    qs('document-action-note').value = 'Revisado por el jefe de planta';
    const button = actionButton('liberada');
    expect(button).not.toBeNull();
    expect(button.textContent).toBe('Confirmar pedido');
    button.click();

    const saved = storage.loadDocuments()[0];
    expect(saved.status).toBe('liberada');
    expect(saved.notes).toContain('Revisado por el jefe de planta');
    expect(qs('document-action-note').value).toBe('');
    expect(qs('domain-feedback').textContent).toBe('');
    expect(qs('document-detail').textContent).toContain('liberada');
  });

  it('rejects a planned order and moves it to cancelada', () => {
    const product = seedProduct();
    seedOrder(product, { status: 'planificada' });
    openDocuments();
    refreshSelection();

    actionButton('cancelada').click();

    expect(storage.loadDocuments()[0].status).toBe('cancelada');
    expect(qs('document-detail').textContent).toContain('cancelada');
  });

  it('does not add notes when the optional note is blank', () => {
    const product = seedProduct();
    seedOrder(product, { status: 'planificada' });
    openDocuments();
    refreshSelection();

    actionButton('liberada').click();

    expect(storage.loadDocuments()[0].notes).toBeUndefined();
  });

  it('rejects transitions that are not declared in the lifecycle', () => {
    const product = seedProduct();
    const order = seedOrder(product, { status: 'planificada' });
    openDocuments();
    refreshSelection();

    expect(() => storage.updateDocument(order.id, { status: 'terminada' })).toThrow(/Transición de estado inválida/);
    expect(storage.loadDocuments()[0].status).toBe('planificada');
  });

  it('blocks terminal quality actions until the quality result matches', () => {
    const product = seedProduct();
    const order = seedOrder(product, { status: 'en control de calidad', qualityResult: 'Pendiente' });
    openDocuments();
    refreshSelection();

    const approve = actionButton('terminada');
    expect(approve).not.toBeNull();
    expect(approve.disabled).toBe(true);
    expect(approve.title).toContain('Complete los datos requeridos');

    expect(() => storage.updateDocument(order.id, { status: 'terminada' })).toThrow(/calidad Aprobada/);
    expect(storage.loadDocuments()[0].status).toBe('en control de calidad');
  });
});
