import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeConfig } from '../../src/module-config.js';
import { setActiveConfig } from '../../src/module-config.js';
import {
  addEntity,
  addDocument,
  updateDocument,
  validateEntity,
  validateDocument,
  loadEntities,
  loadDocuments,
  clearAll
} from '../../src/storage.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

const { config, errors } = normalizeConfig({
  statusLifecycle: null,
  customFields: [
    {
      target: 'entity',
      key: 'itemType',
      label: 'Tipo de ítem',
      type: 'select',
      required: true,
      options: ['Producto terminado']
    },
    { target: 'entity', key: 'currentStock', label: 'Stock actual', type: 'number', nonNegative: true },
    { target: 'entity', key: 'minStock', label: 'Stock mínimo', type: 'number', nonNegative: true },
    { target: 'document', key: 'processStage', label: 'Etapa', type: 'select', required: true, options: ['Corte'] },
    {
      target: 'document',
      key: 'qualityResult',
      label: 'Resultado de calidad',
      type: 'select',
      options: ['Aprobado', 'Rechazado']
    }
  ],
  domain: {
    rules: [
      { target: 'entity', require: { field: 'itemType', op: 'exists' }, message: 'El tipo de ítem es obligatorio.' },
      {
        target: 'document',
        require: { field: 'processStage', op: 'exists' },
        message: 'La etapa del proceso es obligatoria.'
      },
      {
        target: 'document',
        when: { field: 'status', op: 'eq', value: 'terminada' },
        require: { field: 'qualityResult', op: 'eq', value: 'Aprobado' },
        message: 'Una orden terminada debe tener calidad Aprobada.'
      }
    ]
  }
});

function newEntity() {
  return addEntity({ name: 'Mesa', code: 'M-1', itemType: 'Producto terminado' });
}

beforeEach(() => {
  store.clear();
  expect(errors).toEqual([]);
  setActiveConfig(config);
});

describe('storage with domain rules', () => {
  it('rejects an entity that does not satisfy a domain rule', () => {
    const result = validateEntity({ name: 'Mesa', code: 'M-1' });
    expect(result.valid).toBe(false);
    expect(result.errors.itemType).toContain('obligatorio');
    expect(() => addEntity({ name: 'Mesa', code: 'M-1' })).toThrow(/obligatorio/);
    expect(loadEntities()).toHaveLength(0);
  });

  it('persists an entity when required domain fields are present', () => {
    const entity = newEntity();
    expect(entity.itemType).toBe('Producto terminado');
    expect(loadEntities()).toHaveLength(1);
  });

  it('accepts absent numeric values without converting them to zero', () => {
    const entity = newEntity();
    expect(entity.currentStock).toBeUndefined();
    expect(entity.minStock).toBeUndefined();
  });

  it('rejects non-finite and negative numeric custom fields', () => {
    expect(
      validateEntity({ name: 'Mesa', code: 'M-1', itemType: 'Producto terminado', currentStock: 'abc' }).errors
    ).toHaveProperty('currentStock');
    expect(
      validateEntity({ name: 'Mesa', code: 'M-1', itemType: 'Producto terminado', currentStock: -1 }).errors
    ).toHaveProperty('currentStock');
    expect(() => addEntity({ name: 'Mesa', code: 'M-1', itemType: 'Producto terminado', currentStock: -1 })).toThrow(
      /no negativo/
    );
  });

  it('accepts zero stock', () => {
    const entity = addEntity({ name: 'Mesa', code: 'M-1', itemType: 'Producto terminado', currentStock: 0 });
    expect(entity.currentStock).toBe(0);
  });

  it('rejects documents without required domain fields', () => {
    const entity = newEntity();
    expect(() =>
      addDocument({ entity_id: entity.entity_id, folio: 1, startDate: '2026-08-01', endDate: '2026-08-05' })
    ).toThrow(/obligatori/);
    expect(loadDocuments()).toHaveLength(0);
  });

  it('persists a document that satisfies required fields', () => {
    const entity = newEntity();
    const document = addDocument({
      entity_id: entity.entity_id,
      folio: 1,
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      processStage: 'Corte'
    });
    expect(document.processStage).toBe('Corte');
    expect(loadDocuments()).toHaveLength(1);
  });

  it('rejects invalid select values for custom fields', () => {
    const entity = newEntity();
    const result = validateDocument({
      entity_id: entity.entity_id,
      folio: 1,
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      processStage: 'Corte',
      qualityResult: 'Inventado'
    });
    expect(result.valid).toBe(false);
    expect(result.errors.qualityResult).toContain('debe ser uno de');
  });

  it('applies conditional rules before persisting an update', () => {
    const entity = newEntity();
    const document = addDocument({
      entity_id: entity.entity_id,
      folio: 1,
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      processStage: 'Corte'
    });

    expect(() => updateDocument(document.id, { status: 'terminada', qualityResult: 'Rechazado' })).toThrow(
      /calidad Aprobada/
    );
    expect(loadDocuments()[0].status).toBeUndefined();

    const updated = updateDocument(document.id, { status: 'terminada', qualityResult: 'Aprobado' });
    expect(updated.status).toBe('terminada');
    expect(loadDocuments()[0].qualityResult).toBe('Aprobado');
  });

  it('clears storage between scenarios', () => {
    newEntity();
    expect(loadEntities()).toHaveLength(1);
    clearAll();
    expect(loadEntities()).toHaveLength(0);
  });
});
