import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { signIn } from '../../src/app.js';
import {
  setupManufacturingDom,
  bootManufacturing,
  qs,
  seedProduct,
  seedOrder,
  openDocuments,
  change
} from './support/manufacturing.js';

let dom;

beforeEach(async () => {
  dom = setupManufacturingDom();
  await bootManufacturing();
});

afterEach(() => {
  dom.window.close();
});

function card(id) {
  return document.querySelector(`#document-charts [data-chart-id="${id}"]`);
}

function openCharts() {
  openDocuments();
  qs('document-tab-charts').click();
}

describe('HU17-HU20 - visual charts', () => {
  it('renders the four declared charts from stored records', () => {
    const mesa = seedProduct();
    seedProduct({ name: 'Silla', code: 'SKU-002', currentStock: 3, minStock: undefined });
    seedOrder(mesa, { status: 'planificada', priority: 'Urgente', processStage: 'Corte', scrapQty: 4 });
    seedOrder(mesa, { status: 'liberada', priority: 'Media', processStage: 'Pintura', scrapQty: 6 });
    openCharts();

    expect(document.querySelectorAll('#document-charts .chart-card').length).toBe(4);
    expect(qs('document-tabpanel-charts').hidden).toBe(false);

    const donut = card('orders-by-status').querySelector('svg.chart-donut');
    expect(donut).not.toBeNull();
    expect(donut.getAttribute('aria-label')).toContain('Planificada, 1');
    expect(donut.querySelectorAll('.chart-segment').length).toBe(2);
    expect(donut.querySelector('.chart-donut-value').textContent).toBe('2');

    expect(card('orders-by-priority').querySelectorAll('.chart-bar-row').length).toBe(2);

    const stock = card('stock-vs-minimum');
    expect(stock.textContent).toContain('Stock actual: 20');
    expect(stock.textContent).toContain('Stock mínimo: 5');
    expect(stock.textContent).toContain('Stock mínimo: sin dato');

    const scrap = card('scrap-by-stage');
    expect(scrap.textContent).toContain('6 unidades');
    expect(scrap.textContent).toContain('4 unidades');
  });

  it('recomputes the charts from the documents matching the active filters', () => {
    const mesa = seedProduct();
    seedOrder(mesa, { status: 'planificada', priority: 'Urgente' });
    seedOrder(mesa, { status: 'liberada', priority: 'Baja' });
    openCharts();

    expect(card('orders-by-status').querySelector('.chart-donut-value').textContent).toBe('2');

    qs('document-filter-1').value = 'Urgente';
    change(qs('document-filter-1'), dom);

    expect(card('orders-by-status').querySelector('.chart-donut-value').textContent).toBe('1');
    expect(card('orders-by-priority').textContent).toContain('Urgente');
    expect(card('orders-by-priority').textContent).not.toContain('Baja');
  });

  it('shows only the charts granted to the active role', () => {
    const result = signIn('qualityInspector', 'QA-2026');
    expect(result.ok).toBe(true);
    openCharts();

    const ids = [...document.querySelectorAll('#document-charts .chart-card')].map((item) => item.dataset.chartId);
    expect(ids).toEqual(['orders-by-status', 'scrap-by-stage']);
    expect(qs('document-tab-charts').hidden).toBe(false);
  });

  it('renders user supplied labels as text and never as markup', () => {
    const payload = '<script>alert(1)</script>';
    seedProduct({ name: payload });
    openCharts();

    expect(card('stock-vs-minimum').querySelector('.chart-bar-label').textContent).toBe(payload);
    expect(card('stock-vs-minimum').innerHTML).not.toContain('<script>');
  });

  it('shows a clear empty state when the source records are missing', () => {
    openCharts();

    expect(card('scrap-by-stage').textContent).toContain('No hay merma registrada por etapa.');
    expect(card('stock-vs-minimum').querySelector('.chart-bar-row')).toBeNull();
  });
});
