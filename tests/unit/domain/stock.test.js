import { describe, it, expect } from 'vitest';
import { normalizeConfig, manufacturingConfig } from '../../../src/module-config.js';
import { evaluatePredicate } from '../../../src/domain/rules.js';
import { formatValue } from '../../../src/domain/views.js';

const { config, errors } = normalizeConfig(manufacturingConfig);
const lowStockBadge = config.domain.badges.find((badge) => badge.target === 'entity');

describe('low stock rule', () => {
  it('is configured with the three required conditions', () => {
    expect(errors).toEqual([]);
    expect(lowStockBadge).toBeDefined();
    expect(lowStockBadge.when.all).toHaveLength(3);
  });

  it('marks an item only when both values exist and current stock is strictly lower', () => {
    expect(evaluatePredicate(lowStockBadge.when, { currentStock: 5, minStock: 10 })).toBe(true);
  });

  it('does not mark an item when current stock equals or exceeds the minimum', () => {
    expect(evaluatePredicate(lowStockBadge.when, { currentStock: 10, minStock: 10 })).toBe(false);
    expect(evaluatePredicate(lowStockBadge.when, { currentStock: 11, minStock: 10 })).toBe(false);
  });

  it('does not mark an item when either value is missing', () => {
    expect(evaluatePredicate(lowStockBadge.when, { currentStock: 5 })).toBe(false);
    expect(evaluatePredicate(lowStockBadge.when, { minStock: 10 })).toBe(false);
    expect(evaluatePredicate(lowStockBadge.when, {})).toBe(false);
    expect(evaluatePredicate(lowStockBadge.when, { currentStock: '', minStock: 10 })).toBe(false);
  });

  it('shows "sin dato" rather than zero for a missing stock value', () => {
    expect(formatValue(undefined)).toBe('sin dato');
    expect(formatValue(0)).toBe('0');
  });
});
