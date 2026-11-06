import { describe, it, expect } from 'vitest';
import { computeIndicator, computeIndicators, isOverdue, summarizeCosts } from '../../../src/domain/metrics.js';

describe('isOverdue', () => {
  const context = { today: '2026-06-01' };

  it('marks open orders with a past end date as overdue', () => {
    expect(isOverdue({ endDate: '2026-05-31', status: 'en producción' }, context)).toBe(true);
  });

  it('does not mark future, missing or terminal orders as overdue', () => {
    expect(isOverdue({ endDate: '2026-06-02', status: 'en producción' }, context)).toBe(false);
    expect(isOverdue({ status: 'en producción' }, context)).toBe(false);
    expect(isOverdue({ endDate: '2026-05-31', status: 'terminada' }, context)).toBe(false);
    expect(isOverdue({ endDate: '2026-05-31', status: 'cancelada' }, context)).toBe(false);
  });
});

describe('computeIndicator', () => {
  it('counts records grouped by a field, ignoring missing values', () => {
    const result = computeIndicator(
      { id: 'by-status', type: 'countByField', field: 'status', label: 'Órdenes por estado' },
      [{ status: 'liberada' }, { status: 'liberada' }, { status: 'terminada' }, { status: '' }]
    );

    expect(result.total).toBe(3);
    expect(result.groups).toEqual([
      { value: 'liberada', count: 2 },
      { value: 'terminada', count: 1 }
    ]);
  });

  it('counts records that satisfy a declarative condition', () => {
    const indicator = {
      id: 'overdue',
      type: 'countWhere',
      label: 'Retrasadas',
      where: {
        all: [
          { field: 'endDate', op: 'exists' },
          { field: 'endDate', op: 'lt', value: 'today' },
          { field: 'status', op: 'notIn', value: ['terminada', 'cancelada'] }
        ]
      }
    };

    const result = computeIndicator(
      indicator,
      [
        { endDate: '2026-05-01', status: 'en producción' },
        { endDate: '2026-05-01', status: 'terminada' },
        { endDate: '2026-07-01', status: 'en producción' }
      ],
      { today: '2026-06-01' }
    );

    expect(result.count).toBe(1);
  });

  it('computes a scrap ratio without inventing a denominator', () => {
    const result = computeIndicator(
      { id: 'scrap', type: 'ratio', numerator: 'scrapQty', denominator: 'producedQty', label: 'Merma' },
      [
        { id: '1', scrapQty: 2, producedQty: 10 },
        { id: '2', scrapQty: 3, producedQty: 0 },
        { id: '3', scrapQty: 5 }
      ]
    );

    expect(result.numerator).toBe(10);
    expect(result.denominator).toBe(10);
    expect(result.ratio).toBeCloseTo(1);
    expect(result.hasData).toBe(true);
    expect(result.entries[1].ratio).toBeNull();
    expect(result.entries[1].hasData).toBe(false);
    expect(result.entries[2].ratio).toBeNull();
  });

  it('reports no data when both ratio values are absent', () => {
    const result = computeIndicator(
      { id: 'scrap', type: 'ratio', numerator: 'scrapQty', denominator: 'producedQty', label: 'Merma' },
      [{ id: '1' }]
    );

    expect(result.ratio).toBeNull();
    expect(result.hasData).toBe(false);
    expect(result.entries).toEqual([]);
  });
});

describe('computeIndicators', () => {
  it('returns one computed card per configured indicator', () => {
    const result = computeIndicators(
      [
        { id: 'a', type: 'countByField', field: 'status', label: 'A' },
        { id: 'b', type: 'countWhere', where: { field: 'status', op: 'eq', value: 'x' }, label: 'B' }
      ],
      [{ status: 'x' }, { status: 'y' }]
    );

    expect(result).toHaveLength(2);
    expect(result[0].total).toBe(2);
    expect(result[1].count).toBe(1);
  });
});

describe('summarizeCosts', () => {
  const costSummary = {
    groupBy: 'currency',
    fields: [
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'totalAmount', label: 'Total' }
    ]
  };

  it('sums each field per currency without mixing currencies', () => {
    const result = summarizeCosts(
      [
        { currency: 'MXN', subtotal: 100, totalAmount: 116 },
        { currency: 'MXN', subtotal: 200, totalAmount: 232 },
        { currency: 'USD', subtotal: 50, totalAmount: 58 }
      ],
      costSummary
    );

    expect(result.groups).toHaveLength(2);
    const mxn = result.groups.find((group) => group.key === 'MXN');
    const usd = result.groups.find((group) => group.key === 'USD');
    expect(mxn.fields[0].total).toBe(300);
    expect(mxn.fields[1].total).toBe(348);
    expect(usd.fields[0].total).toBe(50);
  });

  it('keeps missing amounts as "sin dato" instead of zero', () => {
    const result = summarizeCosts([{ currency: 'MXN', subtotal: 100 }], costSummary);
    const group = result.groups[0];
    expect(group.fields[0].total).toBe(100);
    expect(group.fields[1].hasData).toBe(false);
    expect(group.fields[1].total).toBeNull();
  });

  it('groups records without a currency under "sin dato"', () => {
    const result = summarizeCosts([{ subtotal: 100 }], costSummary);
    expect(result.groups[0].key).toBe('sin dato');
  });
});
