import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupManufacturingDom,
  bootManufacturing,
  qs,
  change,
  seedProduct,
  seedOrder,
  openDocuments,
  selectFirstRow
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
    expect(rows[0].textContent).toContain('planificada');
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
