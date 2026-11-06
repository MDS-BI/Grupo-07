import { evaluatePredicate } from './rules.js';
import { buildFieldLabels, isVirtualField } from './fields.js';

export const MISSING_VALUE = 'sin dato';

export function isBlankValue(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

/**
 * Resuelve el valor visible de un campo, incluyendo campos virtuales que
 * provienen del producto vinculado a la orden.
 */
export function resolveFieldValue(record, key, context = {}) {
  if (!record) {
    return undefined;
  }

  const entity = context.entity || null;

  switch (key) {
    case 'entityName':
      return entity ? entity.name : context.entityName;
    case 'entityCode':
      return entity ? entity.code : context.entityCode;
    case 'entityDescription':
      return entity ? entity.description : context.entityDescription;
    case 'entityCategory':
      return entity ? entity.category : context.entityCategory;
    case 'entity_id':
      return entity && entity.name ? entity.name : record.entity_id;
    case 'statusLabel':
      return record.status;
    default:
      if (record[key] !== undefined && record[key] !== null) {
        return record[key];
      }
      return entity ? entity[key] : record[key];
  }
}

/** Formatea un valor para mostrarlo; los valores ausentes nunca se vuelven cero. */
export function formatValue(value, options = {}) {
  const fallback = options.fallback === undefined ? MISSING_VALUE : options.fallback;

  if (isBlankValue(value)) {
    return fallback;
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  return String(value);
}

export function resolveColumns(config, target) {
  const list = config && config.domain ? config.domain.documentList : null;
  if (!list || !Array.isArray(list.columns)) {
    return [];
  }

  return list.columns
    .filter((column) => column && (target === undefined || target === column.source || column.source === undefined))
    .map((column) => ({ key: column.key, label: column.label, source: column.source }));
}

export function resolveFilters(config) {
  const list = config && config.domain ? config.domain.documentList : null;
  if (!list || !Array.isArray(list.filters)) {
    return [];
  }

  return list.filters.map((filter) => ({
    ...filter,
    options: Array.isArray(filter.options) ? filter.options.slice() : null
  }));
}

export function resolveDetailSections(config) {
  const list = config && config.domain ? config.domain.documentList : null;
  if (!list || !Array.isArray(list.detailSections)) {
    return [];
  }

  return list.detailSections.map((section) => ({
    title: section.title,
    fields: Array.isArray(section.fields) ? section.fields.map((field) => ({ key: field.key, label: field.label })) : []
  }));
}

function filterToPredicate(filter) {
  if (!filter) {
    return null;
  }

  if (filter.predicate) {
    return filter.predicate;
  }

  if (filter.value === undefined || filter.value === null || filter.value === '') {
    return null;
  }

  if (filter.op === 'in' && !Array.isArray(filter.value)) {
    return { field: filter.key, op: 'in', value: [filter.value] };
  }

  return { field: filter.key, op: filter.op || 'eq', value: filter.value };
}

/** Aplica filtros declarativos sin mutar la lista original. */
export function applyFilters(records, filters, context = {}) {
  const list = Array.isArray(records) ? records : [];
  const active = Array.isArray(filters) ? filters : [];

  if (active.length === 0) {
    return list.slice();
  }

  return list.filter((record) =>
    active.every((filter) => {
      const predicate = filterToPredicate(filter);
      if (!predicate) {
        return true;
      }
      return evaluatePredicate(predicate, record, context);
    })
  );
}

export function fieldLabel(config, key) {
  if (isVirtualField(key)) {
    return buildFieldLabels(config)[key] || key;
  }
  return buildFieldLabels(config)[key] || key;
}

export function resolveFieldLabels(config) {
  return buildFieldLabels(config);
}

/** Devuelve la definición de un formulario declarativo de dominio. */
export function resolveForm(config, name) {
  const forms = config && config.domain && config.domain.forms ? config.domain.forms : {};
  const form = forms[name];
  if (!form) {
    return null;
  }
  return {
    name,
    title: form.title,
    submitLabel: form.submitLabel,
    fields: Array.isArray(form.fields) ? form.fields.map((field) => ({ key: field.key, label: field.label })) : []
  };
}
