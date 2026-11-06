import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupManufacturingDom,
  bootManufacturing,
  qs,
  seedProduct,
  seedOrder,
  openDocuments
} from './support/manufacturing.js';

let dom;

beforeEach(async () => {
  dom = setupManufacturingDom();
  await bootManufacturing();
});

afterEach(() => {
  dom.window.close();
});

function indicator(id) {
  return document.querySelector(`[data-indicator-id="${id}"]`);
}

describe('User Story 1 - indicators and costs', () => {
  it('shows order counts by status and the number of overdue orders', () => {
    const product = seedProduct();
    seedOrder(product, { status: 'planificada', endDate: '2999-01-10' });
    seedOrder(product, { status: 'liberada', endDate: '2020-01-10' });
    seedOrder(product, { status: 'liberada', endDate: '2999-02-10' });
    openDocuments();

    const byStatus = indicator('orders-by-status');
    expect(byStatus.querySelector('.indicator-value').textContent).toBe('3');
    const groups = [...byStatus.querySelectorAll('.indicator-groups li')].map((item) => item.textContent);
    expect(groups).toEqual(['planificada1', 'liberada2']);

    expect(indicator('overdue-orders').querySelector('.indicator-value').textContent).toBe('1');
  });

  it('computes the scrap ratio and shows the underlying quantities', () => {
    const product = seedProduct();
    seedOrder(product, { status: 'liberada', producedQty: 10, scrapQty: 2 });
    seedOrder(product, { status: 'liberada', producedQty: 20, scrapQty: 5 });
    seedOrder(product, { status: 'liberada' });
    openDocuments();

    const ratio = indicator('scrap-ratio');
    expect(ratio.querySelector('.indicator-value').textContent).toBe('23.3 %');
    expect(ratio.querySelector('.indicator-note').textContent).toBe('7 / 30');
  });

  it('shows "sin dato" when no production quantities exist', () => {
    const product = seedProduct();
    seedOrder(product, { status: 'liberada' });
    openDocuments();

    const ratio = indicator('scrap-ratio');
    expect(ratio.querySelector('.indicator-value').textContent).toBe('sin dato');
    expect(ratio.querySelector('.indicator-note').textContent).toBe('sin dato / sin dato');
  });

  it('summarizes each cost field per currency without mixing currencies', () => {
    const product = seedProduct();
    seedOrder(product, {
      status: 'liberada',
      currency: 'MXN',
      subtotal: 100,
      discount: 10,
      taxAmount: 14,
      totalAmount: 124
    });
    seedOrder(product, {
      status: 'liberada',
      currency: 'MXN',
      subtotal: 200,
      discount: 0,
      taxAmount: 32,
      totalAmount: 232
    });
    seedOrder(product, {
      status: 'liberada',
      currency: 'USD',
      subtotal: 50,
      discount: 0,
      taxAmount: 8,
      totalAmount: 58
    });
    openDocuments();

    const mxn = document.querySelector('[data-cost-group="MXN"]');
    const usd = document.querySelector('[data-cost-group="USD"]');
    expect(mxn).not.toBeNull();
    expect(usd).not.toBeNull();
    expect(mxn.textContent).toContain('300');
    expect(mxn.textContent).toContain('10');
    expect(mxn.textContent).toContain('46');
    expect(mxn.textContent).toContain('356');
    expect(usd.textContent).toContain('50');
    expect(usd.textContent).toContain('58');
  });

  it('shows the empty state when there are no orders', () => {
    openDocuments();

    expect(qs('indicators-empty').textContent).toBe('Sin indicadores configurados.');
    expect(qs('costs-empty').textContent).toBe('Sin costos registrados.');
  });
});
