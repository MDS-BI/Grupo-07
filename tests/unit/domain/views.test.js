import { describe, it, expect } from 'vitest';
import {
  resolveColumns,
  resolveFilters,
  resolveDetailSections,
  resolveForm,
  resolveFieldValue,
  formatValue,
  applyFilters,
  MISSING_VALUE
} from '../../../src/domain/views.js';

const config = {
  customFields: [{ target: 'document', key: 'priority', label: 'Prioridad', type: 'select', options: ['Alta'] }],
  domain: {
    documentList: {
      columns: [
        { key: 'folio', label: 'Orden', source: 'document' },
        { key: 'entityName', label: 'Producto', source: 'entity' },
        { key: 'priority', label: 'Prioridad', source: 'document' }
      ],
      filters: [
        { key: 'status', label: 'Estado', op: 'eq', options: ['liberada'], optionsFrom: 'statuses' },
        {
          label: 'Solo retrasadas',
          toggle: true,
          predicate: { field: 'endDate', op: 'lt', value: '2026-06-01' }
        }
      ],
      detailSections: [
        { title: 'Pedido', fields: [{ key: 'folio', label: 'Orden' }] },
        { title: 'Ejecución', fields: [{ key: 'priority', label: 'Prioridad' }] }
      ]
    },
    forms: {
      quality: {
        title: 'Control de calidad',
        submitLabel: 'Guardar',
        fields: [{ key: 'priority', label: 'Prioridad' }]
      }
    }
  }
};

describe('resolveColumns', () => {
  it('returns every declared column, including values resolved from the linked entity', () => {
    const columns = resolveColumns(config);
    expect(columns.map((column) => column.key)).toEqual(['folio', 'entityName', 'priority']);
    expect(columns[1].source).toBe('entity');
  });

  it('can filter by source when a target is provided', () => {
    expect(resolveColumns(config, 'entity').map((column) => column.key)).toEqual(['entityName']);
    expect(resolveColumns(config, 'document').map((column) => column.key)).toEqual(['folio', 'priority']);
  });

  it('returns an empty list when no domain is configured', () => {
    expect(resolveColumns({ domain: null })).toEqual([]);
  });
});

describe('resolveFilters', () => {
  it('exposes configured options without sharing the original array', () => {
    const filters = resolveFilters(config);
    expect(filters).toHaveLength(2);
    expect(filters[0].label).toBe('Estado');
    expect(filters[0].options).toEqual(['liberada']);
    expect(filters[1].toggle).toBe(true);
  });
});

describe('resolveDetailSections', () => {
  it('returns titled sections with their fields', () => {
    const sections = resolveDetailSections(config);
    expect(sections.map((section) => section.title)).toEqual(['Pedido', 'Ejecución']);
    expect(sections[0].fields[0]).toEqual({ key: 'folio', label: 'Orden' });
  });
});

describe('resolveForm', () => {
  it('returns a declarative form definition', () => {
    expect(resolveForm(config, 'quality')).toEqual({
      name: 'quality',
      title: 'Control de calidad',
      submitLabel: 'Guardar',
      fields: [{ key: 'priority', label: 'Prioridad' }]
    });
    expect(resolveForm(config, 'execution')).toBeNull();
  });
});

describe('resolveFieldValue', () => {
  it('resolves product data for virtual fields', () => {
    const entity = { name: 'Mesa', code: 'M-1', description: 'Roble', category: 'Mueble' };
    expect(resolveFieldValue({}, 'entityName', { entity })).toBe('Mesa');
    expect(resolveFieldValue({}, 'entityCode', { entity })).toBe('M-1');
    expect(resolveFieldValue({}, 'entityDescription', { entity })).toBe('Roble');
    expect(resolveFieldValue({}, 'entityCategory', { entity })).toBe('Mueble');
  });

  it('prefers the linked product name for entity_id', () => {
    expect(resolveFieldValue({ entity_id: 'eid-1' }, 'entity_id', { entity: { name: 'Mesa' } })).toBe('Mesa');
    expect(resolveFieldValue({ entity_id: 'eid-1' }, 'entity_id')).toBe('eid-1');
  });

  it('reads regular fields directly', () => {
    expect(resolveFieldValue({ folio: 7 }, 'folio')).toBe(7);
  });
});

describe('formatValue', () => {
  it('uses "sin dato" for absent values without turning them into zero', () => {
    expect(formatValue(undefined)).toBe(MISSING_VALUE);
    expect(formatValue(null)).toBe(MISSING_VALUE);
    expect(formatValue('')).toBe(MISSING_VALUE);
    expect(formatValue('   ')).toBe(MISSING_VALUE);
    expect(formatValue(Number.NaN)).toBe(MISSING_VALUE);
  });

  it('keeps zero, false and real text', () => {
    expect(formatValue(0)).toBe('0');
    expect(formatValue(false)).toBe('No');
    expect(formatValue(true)).toBe('Sí');
    expect(formatValue('Corte')).toBe('Corte');
  });

  it('accepts a custom fallback', () => {
    expect(formatValue(undefined, { fallback: '—' })).toBe('—');
  });
});

describe('applyFilters', () => {
  const records = [
    { id: '1', status: 'liberada', endDate: '2026-05-01' },
    { id: '2', status: 'terminada', endDate: '2026-07-01' },
    { id: '3', status: 'liberada', endDate: '2026-07-01' }
  ];

  it('returns a copy when there are no active filters', () => {
    const result = applyFilters(records, []);
    expect(result).toEqual(records);
    expect(result).not.toBe(records);
  });

  it('filters by field, operator and value', () => {
    expect(applyFilters(records, [{ key: 'status', op: 'eq', value: 'liberada' }]).map((record) => record.id)).toEqual([
      '1',
      '3'
    ]);
  });

  it('ignores filters with a blank value', () => {
    expect(applyFilters(records, [{ key: 'status', op: 'eq', value: '' }])).toHaveLength(3);
  });

  it('filters with declarative predicates', () => {
    const result = applyFilters(records, [
      { predicate: { field: 'endDate', op: 'lt', value: '2026-06-01' } },
      { predicate: { field: 'status', op: 'eq', value: 'liberada' } }
    ]);
    expect(result.map((record) => record.id)).toEqual(['1']);
  });
});
