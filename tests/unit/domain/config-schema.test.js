import { describe, it, expect } from 'vitest';
import { normalizeConfig, manufacturingConfig } from '../../../src/module-config.js';
import { validateDomainConfig } from '../../../src/domain/config-schema.js';
import { BASE_FIELDS } from '../../../src/module-config.js';

function baseConfig(domain) {
  return {
    moduleName: 'Prueba',
    statusLifecycle: {
      statuses: ['a', 'b'],
      transitions: { a: ['b'], b: [] }
    },
    customFields: [{ target: 'document', key: 'stage', label: 'Etapa', type: 'text' }],
    domain
  };
}

describe('validateDomainConfig', () => {
  it('accepts the complete manufacturing profile without errors', () => {
    const result = validateDomainConfig(manufacturingConfig, BASE_FIELDS);
    expect(result.errors).toEqual([]);
    expect(result.domain.documentList.columns.length).toBeGreaterThan(0);
    expect(result.domain.indicators.length).toBeGreaterThan(0);
    expect(result.domain.transitionGuards.length).toBeGreaterThan(0);
  });

  it('requires at least one column', () => {
    const result = validateDomainConfig(baseConfig({ documentList: { columns: [] } }), BASE_FIELDS);
    expect(result.errors.some((error) => error.includes('al menos una columna'))).toBe(true);
    expect(result.domain).toBeNull();
  });

  it('rejects columns that reference unknown fields', () => {
    const result = validateDomainConfig(baseConfig({ documentList: { columns: ['ghost'] } }), BASE_FIELDS);
    expect(result.errors.some((error) => error.includes('ghost'))).toBe(true);
  });

  it('rejects unknown predicate operators', () => {
    const result = validateDomainConfig(
      baseConfig({
        documentList: { columns: ['folio'] },
        badges: [{ target: 'document', when: { field: 'status', op: 'warp' }, label: 'X' }]
      }),
      BASE_FIELDS
    );
    expect(result.errors.some((error) => error.includes('operador desconocido'))).toBe(true);
  });

  it('rejects filters that point to unknown fields', () => {
    const result = validateDomainConfig(
      baseConfig({
        documentList: { columns: ['folio'], filters: [{ key: 'ghost', label: 'Fantasma' }] }
      }),
      BASE_FIELDS
    );
    expect(result.errors.some((error) => error.includes('ghost'))).toBe(true);
  });

  it('requires a configured lifecycle for status filters and transition actions', () => {
    const noLifecycle = {
      customFields: [],
      statusLifecycle: null,
      domain: {
        documentList: { columns: ['folio'], filters: [{ key: 'status', optionsFrom: 'statuses' }] },
        transitionActions: [{ from: 'a', to: 'b', label: 'Avanzar' }]
      }
    };

    const result = validateDomainConfig(noLifecycle, BASE_FIELDS);
    expect(result.errors.some((error) => error.includes('ciclo de vida'))).toBe(true);
  });

  it('rejects transition actions that reference statuses outside the lifecycle', () => {
    const result = validateDomainConfig(
      baseConfig({
        documentList: { columns: ['folio'] },
        transitionActions: [{ from: 'a', to: 'ghost', label: 'Avanzar' }]
      }),
      BASE_FIELDS
    );
    expect(result.errors.some((error) => error.includes('ghost'))).toBe(true);
  });

  it('requires guards to declare a message', () => {
    const result = validateDomainConfig(
      baseConfig({
        documentList: { columns: ['folio'] },
        transitionGuards: [{ from: 'a', to: 'b', require: { field: 'stage', op: 'exists' } }]
      }),
      BASE_FIELDS
    );
    expect(result.errors.some((error) => error.includes('message es obligatorio'))).toBe(true);
  });

  it('accepts declarative filter predicates and indicators', () => {
    const result = validateDomainConfig(
      baseConfig({
        documentList: {
          columns: ['folio'],
          filters: [{ label: 'Solo etapa', toggle: true, predicate: { field: 'stage', op: 'exists' } }]
        },
        indicators: [
          { id: 'total', type: 'countByField', field: 'status', label: 'Total' },
          { id: 'ratio', type: 'ratio', numerator: 'quantity', denominator: 'quantity', label: 'Ratio' }
        ],
        costSummary: { groupBy: 'currency', fields: ['subtotal'] }
      }),
      BASE_FIELDS
    );

    expect(result.errors).toEqual([]);
    expect(result.domain.documentList.filters[0].predicate).toBeDefined();
    expect(result.domain.indicators).toHaveLength(2);
  });

  it('rejects unknown indicator types and fields', () => {
    const result = validateDomainConfig(
      baseConfig({
        documentList: { columns: ['folio'] },
        indicators: [{ id: 'x', type: 'magic', label: 'Mágico' }]
      }),
      BASE_FIELDS
    );
    expect(result.errors.some((error) => error.includes('tipo de indicador desconocido'))).toBe(true);
  });

  it('returns null domain without errors when no domain is provided', () => {
    expect(validateDomainConfig(null, BASE_FIELDS)).toEqual({ domain: null, errors: [] });
  });
});

describe('normalizeConfig with a domain section', () => {
  it('merges a valid domain and keeps the base profile working', () => {
    const { config, errors } = normalizeConfig(baseConfig({ documentList: { columns: ['folio'] } }));
    expect(errors).toEqual([]);
    expect(config.domain.documentList.columns).toEqual([{ key: 'folio', label: 'Folio', source: 'document' }]);
  });

  it('keeps domain null when the section is absent', () => {
    const { config, errors } = normalizeConfig({ moduleName: 'Ventas' });
    expect(errors).toEqual([]);
    expect(config.domain).toBeNull();
  });

  it('reports invalid domain configuration through errors', () => {
    const { config, errors } = normalizeConfig(baseConfig({ documentList: { columns: ['ghost'] } }));
    expect(errors.length).toBeGreaterThan(0);
    expect(config.domain).toBeNull();
  });

  it('retains numeric custom field constraints', () => {
    const { config, errors } = normalizeConfig({
      customFields: [{ target: 'entity', key: 'stock', label: 'Stock', type: 'number', nonNegative: true, min: 2 }]
    });
    expect(errors).toEqual([]);
    expect(config.customFields[0].nonNegative).toBe(true);
    expect(config.customFields[0].min).toBe(2);
  });
});
