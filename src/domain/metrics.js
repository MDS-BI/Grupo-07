import { evaluatePredicate } from './rules.js';
import { isBlankValue } from './views.js';

function toFiniteNumber(value) {
  if (isBlankValue(value)) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function today(context) {
  return context && context.today ? context.today : new Date().toISOString().slice(0, 10);
}

/**
 * Una orden está retrasada cuando tiene fecha de fin anterior a hoy y no está
 * en un estado terminal. El estado terminal se declara en la configuración de
 * indicadores; por defecto se usan los valores del perfil de manufactura.
 */
export function isOverdue(record, context = {}) {
  if (!record || isBlankValue(record.endDate)) {
    return false;
  }

  const terminal = Array.isArray(context.terminalStatuses) ? context.terminalStatuses : ['terminada', 'cancelada'];

  if (terminal.includes(record.status)) {
    return false;
  }

  return String(record.endDate) < today(context);
}

function computeCountByField(indicator, records) {
  const counts = new Map();

  for (const record of records) {
    const value = record ? record[indicator.field] : undefined;
    if (isBlankValue(value)) {
      continue;
    }
    const key = String(value);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const groups = [...counts.entries()].map(([value, count]) => ({ value, count }));
  return {
    id: indicator.id,
    type: indicator.type,
    label: indicator.label,
    field: indicator.field,
    total: groups.reduce((sum, group) => sum + group.count, 0),
    groups
  };
}

function computeCountWhere(indicator, records, context) {
  const count = records.filter((record) => evaluatePredicate(indicator.where, record, context)).length;
  return {
    id: indicator.id,
    type: indicator.type,
    label: indicator.label,
    count
  };
}

function computeRatio(indicator, records) {
  let numeratorTotal = 0;
  let denominatorTotal = 0;
  const entries = [];

  for (const record of records) {
    const numerator = toFiniteNumber(record ? record[indicator.numerator] : undefined);
    const denominator = toFiniteNumber(record ? record[indicator.denominator] : undefined);

    if (numerator === undefined && denominator === undefined) {
      continue;
    }

    const ratio =
      denominator !== undefined && denominator > 0 && numerator !== undefined ? numerator / denominator : null;

    entries.push({
      id: record ? record.id : undefined,
      numerator,
      denominator,
      ratio,
      hasData: ratio !== null
    });

    if (numerator !== undefined) {
      numeratorTotal += numerator;
    }
    if (denominator !== undefined) {
      denominatorTotal += denominator;
    }
  }

  const ratio = denominatorTotal > 0 ? numeratorTotal / denominatorTotal : null;

  return {
    id: indicator.id,
    type: indicator.type,
    label: indicator.label,
    numerator: numeratorTotal,
    denominator: denominatorTotal,
    ratio,
    hasData: ratio !== null,
    entries
  };
}

export function computeIndicator(indicator, records, context = {}) {
  const list = Array.isArray(records) ? records : [];

  if (!indicator) {
    return null;
  }

  switch (indicator.type) {
    case 'countByField':
      return computeCountByField(indicator, list);
    case 'countWhere':
      return computeCountWhere(indicator, list, context);
    case 'ratio':
      return computeRatio(indicator, list);
    default:
      return null;
  }
}

export function computeIndicators(indicators, records, context = {}) {
  if (!Array.isArray(indicators)) {
    return [];
  }

  return indicators.map((indicator) => computeIndicator(indicator, records, context)).filter(Boolean);
}

/**
 * Agrupa importes por moneda (o el campo configurado) sin sumar monedas
 * distintas. Un importe ausente no se trata como cero: se marca sin dato.
 */
export function summarizeCosts(records, costSummary, _context = {}) {
  if (!costSummary || !costSummary.groupBy || !Array.isArray(costSummary.fields)) {
    return { groupBy: null, groups: [] };
  }

  const list = Array.isArray(records) ? records : [];
  const groups = new Map();

  for (const record of list) {
    const rawGroup = record ? record[costSummary.groupBy] : undefined;
    const groupKey = isBlankValue(rawGroup) ? 'sin dato' : String(rawGroup);

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        count: 0,
        totals: new Map()
      });
    }

    const group = groups.get(groupKey);
    group.count += 1;

    for (const field of costSummary.fields) {
      const value = toFiniteNumber(record ? record[field.key] : undefined);
      if (value === undefined) {
        continue;
      }
      if (!group.totals.has(field.key)) {
        group.totals.set(field.key, { key: field.key, label: field.label, total: 0, hasData: true });
      }
      group.totals.get(field.key).total += value;
    }
  }

  return {
    groupBy: costSummary.groupBy,
    groups: [...groups.values()].map((group) => ({
      key: group.key,
      count: group.count,
      fields: costSummary.fields.map(
        (field) => group.totals.get(field.key) || { key: field.key, label: field.label, total: null, hasData: false }
      )
    }))
  };
}
