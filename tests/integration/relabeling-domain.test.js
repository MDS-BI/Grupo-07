import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupManufacturingDom, bootManufacturing, qs, openDocuments } from './support/manufacturing.js';

let dom;

beforeEach(async () => {
  dom = setupManufacturingDom();
  await bootManufacturing();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 6 - relabel the workspace from configuration', () => {
  it('applies the module name and navigation labels', () => {
    expect(document.title).toBe('Manufactura y Operaciones');
    expect(qs('brand-name').textContent).toBe('Manufactura y Operaciones');
    expect(qs('nav-dashboard-label').textContent).toBe('Panel');
    expect(qs('nav-entities-label').textContent).toBe('Productos');
    expect(qs('nav-documents-label').textContent).toBe('Órdenes de Producción');
    expect(qs('nav-search-label').textContent).toBe('Búsqueda');
  });

  it('applies the labels to dashboard actions and counters', () => {
    expect(qs('dashboard-heading').textContent).toBe('Manufactura y Operaciones');
    expect(qs('action-new-entity-title').textContent).toBe('Nuevo Producto');
    expect(qs('action-new-document-title').textContent).toBe('Nueva Orden de Producción');
    expect(qs('action-open-entities-title').textContent).toBe('Productos');
    expect(qs('stat-entities-label').textContent).toBe('Productos');
    expect(qs('stat-documents-label').textContent).toBe('Órdenes de Producción');
  });

  it('applies the labels to management views, forms and buttons', () => {
    expect(qs('entities-view-heading').textContent).toBe('Productos');
    expect(qs('entity-form-heading').textContent).toBe('Agregar / Editar Producto');
    expect(qs('edit-entity-heading').textContent).toBe('Editar o eliminar el producto');

    expect(qs('documents-view-heading').textContent).toBe('Órdenes de Producción');
    expect(qs('document-form-heading').textContent).toBe('Agregar / Editar Orden de Producción');
    expect(qs('edit-document-heading').textContent).toBe('Editar o eliminar la orden de producción');
    expect(qs('delete-document').textContent).toBe('Eliminar la orden de producción seleccionada');

    expect(qs('search-view-heading').textContent).toBe('Buscar Productos');
  });

  it('applies the labels to the domain list, detail and empty states', () => {
    openDocuments();

    expect(qs('document-list-heading').textContent).toBe('Órdenes de Producción');
    expect(qs('document-list-empty').textContent).toBe('No hay órdenes de producción para los filtros seleccionados.');
    expect(qs('document-detail-empty').textContent).toBe('Seleccione la orden de producción para ver el detalle.');
  });
});
