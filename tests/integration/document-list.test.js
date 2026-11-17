import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupManufacturingDom,
  bootManufacturing,
  qs,
  change,
  seedProduct,
  seedOrder,
  openDocuments,
  selectFirstRow,
  documentRowFolios
} from './support/manufacturing.js';

let dom;

beforeEach(async () => {
  dom = setupManufacturingDom();
  await bootManufacturing();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 1 - order list and detail', () => {
  it('renders the configured columns with product data resolved from the entity', () => {
    const product = seedProduct({ name: 'Silla ensamblada', code: 'SIL-01' });
    seedOrder(product, { series: 'OP', folio: 2001, quantity: 7, priority: 'Alta' });
    openDocuments();

    const headers = [...document.querySelectorAll('#document-list thead th')].map((th) => th.textContent);
    expect(headers).toEqual([
      'Serie',
      'Orden',
      'Producto',
      'Cantidad solicitada',
      'Prioridad',
      'Inicio',
      'Fin',
      'Estado',
      'Alertas'
    ]);

    const cells = [...document.querySelectorAll('#document-list tbody tr td')].map((cell) => cell.textContent);
    expect(cells).toContain('OP');
    expect(cells).toContain('2001');
    expect(cells).toContain('Silla ensamblada');
    expect(cells).toContain('7');
    expect(cells).toContain('Alta');
  });

  it('filters the order list by the configured status filter', () => {
    const product = seedProduct();
    seedOrder(product, { status: 'planificada' });
    seedOrder(product, { status: 'terminada', qualityResult: 'Aprobado' });
    openDocuments();

    expect(document.querySelectorAll('#document-list tbody .document-row')).toHaveLength(2);

    const filter = qs('document-filter-0');
    filter.value = 'planificada';
    change(filter, dom);

    const rows = document.querySelectorAll('#document-list tbody .document-row');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Planificada');
  });

  it('shows the configured sections and stock data in the detail panel', () => {
    const product = seedProduct({ name: 'Mesa de roble', currentStock: 4, minStock: 10 });
    seedOrder(product, { status: 'planificada' });
    openDocuments();
    selectFirstRow();

    const titles = [...document.querySelectorAll('#document-detail .detail-section h4')].map((h4) => h4.textContent);
    expect(titles).toEqual(['Pedido', 'Producto', 'Ejecución', 'Calidad']);

    const detail = qs('document-detail').textContent;
    expect(detail).toContain('Mesa de roble');
    expect(detail).toContain('Stock actual');
    expect(detail).toContain('4');
    expect(detail).toContain('Stock mínimo');
    expect(detail).toContain('10');
  });

  it('uses "sin dato" when the product has no stock values', () => {
    const product = seedProduct({ currentStock: undefined, minStock: undefined });
    seedOrder(product);
    openDocuments();
    selectFirstRow();

    const productSection = [...document.querySelectorAll('#document-detail .detail-section')].find((section) =>
      section.textContent.startsWith('Producto')
    );
    expect(productSection.textContent).toContain('Stock actualsin dato');
    expect(productSection.textContent).toContain('Stock mínimosin dato');
  });

  it('shows a clear empty state when no order matches the filters', () => {
    const product = seedProduct();
    seedOrder(product, { status: 'planificada' });
    openDocuments();

    const filter = qs('document-filter-0');
    filter.value = 'cancelada';
    change(filter, dom);

    expect(qs('document-list-empty').textContent).toBe('No hay órdenes de producción para los filtros seleccionados.');
    expect(qs('document-detail-empty').textContent).toBe('Seleccione la orden de producción para ver el detalle.');
  });
});

describe('User Story 14 - filter orders by priority', () => {
  it('matches priority values, combines with status and restores the status filter when cleared', () => {
    const product = seedProduct();
    seedOrder(product, { folio: 3001, status: 'planificada', priority: 'Urgente' });
    seedOrder(product, { folio: 3002, status: 'planificada', priority: 'Alta' });
    seedOrder(product, { folio: 3003, status: 'cancelada', priority: 'Urgente' });
    seedOrder(product, { folio: 3004, status: 'planificada', priority: undefined });
    openDocuments();

    const statusFilter = qs('document-filter-0');
    const priorityFilter = qs('document-filter-1');

    priorityFilter.value = 'Urgente';
    change(priorityFilter, dom);
    expect(documentRowFolios()).toEqual(['3001', '3003']);

    statusFilter.value = 'planificada';
    change(statusFilter, dom);
    expect(documentRowFolios()).toEqual(['3001']);

    priorityFilter.value = '';
    change(priorityFilter, dom);
    expect(documentRowFolios()).toEqual(['3001', '3002', '3004']);
  });
});

describe('User Story 15 - filter orders by quality result', () => {
  it('matches quality results, combines with status and restores the status filter when cleared', () => {
    const product = seedProduct();
    seedOrder(product, { folio: 4001, status: 'planificada', qualityResult: 'Corrección' });
    seedOrder(product, { folio: 4002, status: 'planificada', qualityResult: 'Aprobado' });
    seedOrder(product, { folio: 4003, status: 'cancelada', qualityResult: 'Corrección' });
    seedOrder(product, { folio: 4004, status: 'planificada', qualityResult: undefined });
    openDocuments();

    const statusFilter = qs('document-filter-0');
    const qualityFilter = qs('document-filter-2');

    qualityFilter.value = 'Corrección';
    change(qualityFilter, dom);
    expect(documentRowFolios()).toEqual(['4001', '4003']);

    statusFilter.value = 'planificada';
    change(statusFilter, dom);
    expect(documentRowFolios()).toEqual(['4001']);

    qualityFilter.value = '';
    change(qualityFilter, dom);
    expect(documentRowFolios()).toEqual(['4001', '4002', '4004']);
  });
});
