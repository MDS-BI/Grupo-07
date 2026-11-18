import { describe, it, expect } from 'vitest';
import { computeChart, computeCharts } from '../../../src/domain/charts.js';

function base(overrides = {}) {
  return {
    id: 'chart',
    label: 'Gráfico',
    type: 'countByField',
    display: 'bars',
    source: 'document',
    valueLabels: {},
    otherLabel: 'Otros',
    limit: 8,
    ...overrides
  };
}

describe('domain/charts', () => {
  it('counts records by field and applies configured value labels', () => {
    const chart = base({
      field: 'status',
      valueLabels: { done: 'Terminada', open: 'Abierta' }
    });
    const result = computeChart(chart, {
      document: [{ status: 'open' }, { status: 'done' }, { status: 'open' }, {}]
    });

    expect(result.categories).toEqual([
      { label: 'Abierta', value: 2, series: null },
      { label: 'Terminada', value: 1, series: null }
    ]);
    expect(result.total).toBe(3);
    expect(result.hasData).toBe(true);
  });

  it('groups the remaining categories into the configured other label', () => {
    const chart = base({ field: 'status', limit: 2, otherLabel: 'Resto' });
    const result = computeChart(chart, {
      document: [{ status: 'a' }, { status: 'a' }, { status: 'b' }, { status: 'c' }]
    });

    expect(result.categories.map((category) => category.label)).toEqual(['a', 'Resto']);
    expect(result.categories[1].value).toBe(2);
    expect(result.total).toBe(4);
  });

  it('sums numeric values by field ignoring blank and non numeric data', () => {
    const chart = base({ type: 'sumByField', field: 'stage', valueField: 'scrap', unit: 'unidades' });
    const result = computeChart(chart, {
      document: [
        { stage: 'corte', scrap: 2 },
        { stage: 'corte', scrap: 3 },
        { stage: 'pintura', scrap: 'no-number' },
        { stage: 'pintura' },
        { scrap: 9 }
      ]
    });

    expect(result.categories).toEqual([{ label: 'corte', value: 5, series: null }]);
    expect(result.unit).toBe('unidades');
  });

  it('compares two series per category without turning missing values into zero', () => {
    const chart = base({
      type: 'compareFields',
      source: 'entity',
      labelField: 'name',
      series: [
        { key: 'actual', label: 'Actual' },
        { key: 'minimum', label: 'Mínimo' }
      ]
    });
    const result = computeChart(chart, {
      entity: [{ name: 'Mesa', actual: 20, minimum: 5 }, { name: 'Silla', actual: 3 }, { name: 'Sin stock' }]
    });

    expect(result.categories.map((category) => category.label)).toEqual(['Mesa', 'Silla', 'Sin stock']);
    expect(result.categories[2].series.every((item) => item.hasData === false)).toBe(true);
    expect(result.categories[1].series).toEqual([
      { key: 'actual', label: 'Actual', value: 3, hasData: true },
      { key: 'minimum', label: 'Mínimo', value: 0, hasData: false }
    ]);
    expect(result.total).toBe(0);
  });

  it('reports no data when there are no records or only blank values', () => {
    const result = computeChart(base({ field: 'status' }), { document: [{ status: '' }] });

    expect(result.categories).toEqual([]);
    expect(result.hasData).toBe(false);
  });

  it('returns an empty list for invalid chart declarations', () => {
    expect(computeCharts(null, {})).toEqual([]);
  });
});
