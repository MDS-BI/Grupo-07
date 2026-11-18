import { describe, it, expect } from 'vitest';
import { validateDomainConfig } from '../../../src/domain/config-schema.js';
import { BASE_FIELDS, manufacturingConfig, normalizeConfig } from '../../../src/module-config.js';

function configWith(domain) {
  return validateDomainConfig(
    { domain, customFields: manufacturingConfig.customFields, statusLifecycle: null },
    BASE_FIELDS
  );
}

describe('domain.charts configuration', () => {
  it('accepts the manufacturing chart declarations', () => {
    const result = normalizeConfig(manufacturingConfig);

    expect(result.errors).toEqual([]);
    expect(result.config.domain.charts.map((chart) => chart.id)).toEqual([
      'orders-by-status',
      'orders-by-priority',
      'stock-vs-minimum',
      'scrap-by-stage'
    ]);
    expect(result.config.domain.charts[0].display).toBe('donut');
    expect(result.config.domain.charts[2].series).toEqual([
      { key: 'currentStock', label: 'Stock actual' },
      { key: 'minStock', label: 'Stock mínimo' }
    ]);
  });

  it('applies generic defaults for display, source, limit and other label', () => {
    const result = configWith({
      charts: [{ id: 'c', type: 'countByField', label: 'Conteo', field: 'name' }]
    });

    expect(result.errors).toEqual([]);
    expect(result.domain.charts[0]).toMatchObject({
      display: 'bars',
      source: 'document',
      limit: 8,
      otherLabel: 'Otros',
      valueLabels: {}
    });
  });

  it('rejects unknown types, displays, sources, fields and duplicate ids', () => {
    const result = configWith({
      charts: [
        { id: 'a', type: 'unknown', label: 'A', field: 'name' },
        { id: 'b', type: 'countByField', label: 'B', field: 'missing', display: 'bars' },
        { id: 'c', type: 'countByField', label: 'C', field: 'name', display: 'pie' },
        { id: 'd', type: 'countByField', label: 'D', field: 'name', source: 'orders' },
        { id: 'e', type: 'countByField', label: 'E', field: 'name' },
        { id: 'e', type: 'countByField', label: 'E2', field: 'name' }
      ]
    });

    expect(result.domain).toBeNull();
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });

  it('requires a label field and at least one valid series for comparisons', () => {
    const result = configWith({
      charts: [{ id: 'c', type: 'compareFields', label: 'Comparar', labelField: 'name', series: [{ key: 'missing' }] }]
    });

    expect(result.domain).toBeNull();
    expect(result.errors).toContain('domain.charts[0].series[0]: el campo "missing" no existe.');
  });

  it('accepts the generic charts capability in access grants', () => {
    const result = normalizeConfig({
      ...manufacturingConfig,
      domain: {
        ...manufacturingConfig.domain,
        access: {
          ...manufacturingConfig.domain.access,
          roles: manufacturingConfig.domain.access.roles.map((role, index) =>
            index === 0 ? { ...role, grants: { ...role.grants, charts: ['orders-by-status'] } } : role
          )
        }
      }
    });

    expect(result.errors).toEqual([]);
    expect(result.config.domain.access.roles[0].grants.charts).toEqual(['orders-by-status']);
  });
});
