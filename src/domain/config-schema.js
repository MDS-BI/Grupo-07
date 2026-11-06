import { PREDICATE_OPERATORS } from './rules.js';
import { VIRTUAL_FIELDS, buildFieldLabels } from './fields.js';

const INDICATOR_TYPES = ['countByField', 'countWhere', 'ratio'];
const BADGE_TARGETS = ['entity', 'document'];
const TONES = ['info', 'warning', 'danger'];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function fieldUniverse(baseFields, customFields) {
  const fields = new Set([
    ...(baseFields && Array.isArray(baseFields.entity) ? baseFields.entity : []),
    ...(baseFields && Array.isArray(baseFields.document) ? baseFields.document : []),
    ...Object.keys(VIRTUAL_FIELDS)
  ]);

  for (const field of customFields) {
    if (field && typeof field.key === 'string') {
      fields.add(field.key);
    }
  }

  return fields;
}

function validatePredicate(predicate, fields, path, errors) {
  if (!isObject(predicate)) {
    errors.push(`${path}: el predicado debe ser un objeto.`);
    return;
  }

  if (predicate.all !== undefined || predicate.any !== undefined) {
    const key = predicate.all !== undefined ? 'all' : 'any';
    const list = predicate[key];
    if (!Array.isArray(list) || list.length === 0) {
      errors.push(`${path}.${key}: debe ser una lista no vacía de predicados.`);
      return;
    }
    list.forEach((item, index) => validatePredicate(item, fields, `${path}.${key}[${index}]`, errors));
    return;
  }

  if (!isNonEmptyString(predicate.field)) {
    errors.push(`${path}: field es obligatorio.`);
  } else if (!fields.has(predicate.field)) {
    errors.push(`${path}: el campo "${predicate.field}" no existe en los campos base ni personalizados.`);
  }

  if (!PREDICATE_OPERATORS.includes(predicate.op)) {
    errors.push(`${path}: operador desconocido "${predicate.op}".`);
  }

  if (predicate.ref !== undefined) {
    if (!isNonEmptyString(predicate.ref) || !fields.has(predicate.ref)) {
      errors.push(`${path}: ref "${predicate.ref}" no existe en los campos base ni personalizados.`);
    }
  }

  if ((predicate.op === 'in' || predicate.op === 'notIn') && !Array.isArray(predicate.value)) {
    errors.push(`${path}: el operador ${predicate.op} requiere una lista en value.`);
  }
}

function normalizeColumns(raw, fields, labels, path, errors) {
  if (!Array.isArray(raw) || raw.length === 0) {
    errors.push(`${path}: columns debe declarar al menos una columna.`);
    return [];
  }

  const columns = [];

  raw.forEach((entry, index) => {
    let key;
    let label;
    let source = 'document';

    if (typeof entry === 'string') {
      key = entry.trim();
      label = labels[key] || key;
    } else if (isObject(entry)) {
      key = isNonEmptyString(entry.key) ? entry.key.trim() : '';
      label = isNonEmptyString(entry.label) ? entry.label.trim() : labels[key] || key;
      source = entry.source === 'entity' ? 'entity' : 'document';
    } else {
      errors.push(`${path}.columns[${index}]: debe ser una cadena o un objeto.`);
      return;
    }

    if (key === '') {
      errors.push(`${path}.columns[${index}]: key es obligatorio.`);
      return;
    }

    if (!fields.has(key)) {
      errors.push(`${path}.columns[${index}]: el campo "${key}" no existe.`);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(VIRTUAL_FIELDS, key) && key.startsWith('entity')) {
      source = 'entity';
    }

    columns.push({ key, label, source });
  });

  return columns;
}

function normalizeFields(raw, fields, labels, path, errors) {
  if (!Array.isArray(raw) || raw.length === 0) {
    errors.push(`${path}: debe declarar al menos un campo.`);
    return [];
  }

  const normalized = [];

  raw.forEach((entry, index) => {
    let key;
    let label;

    if (typeof entry === 'string') {
      key = entry.trim();
      label = labels[key] || key;
    } else if (isObject(entry)) {
      key = isNonEmptyString(entry.key) ? entry.key.trim() : '';
      label = isNonEmptyString(entry.label) ? entry.label.trim() : labels[key] || key;
    } else {
      errors.push(`${path}[${index}]: debe ser una cadena o un objeto.`);
      return;
    }

    if (key === '') {
      errors.push(`${path}[${index}]: key es obligatorio.`);
      return;
    }

    if (!fields.has(key)) {
      errors.push(`${path}[${index}]: el campo "${key}" no existe.`);
      return;
    }

    normalized.push({ key, label });
  });

  return normalized;
}

function normalizeFilters(raw, fields, lifecycle, labels, path, errors) {
  if (!Array.isArray(raw)) {
    errors.push(`${path}: filters debe ser una lista.`);
    return [];
  }

  const filters = [];

  raw.forEach((entry, index) => {
    const entryPath = `${path}.filters[${index}]`;

    if (!isObject(entry)) {
      errors.push(`${entryPath}: debe ser un objeto.`);
      return;
    }

    if (entry.predicate !== undefined) {
      validatePredicate(entry.predicate, fields, `${entryPath}.predicate`, errors);
      filters.push({
        label: isNonEmptyString(entry.label) ? entry.label.trim() : 'Filtro',
        predicate: entry.predicate,
        toggle: entry.toggle === true
      });
      return;
    }

    const key = isNonEmptyString(entry.key) ? entry.key.trim() : '';
    if (key === '' || !fields.has(key)) {
      errors.push(`${entryPath}: el campo "${key}" no existe.`);
      return;
    }

    const op = entry.op === undefined ? 'eq' : entry.op;
    if (!PREDICATE_OPERATORS.includes(op)) {
      errors.push(`${entryPath}: operador desconocido "${op}".`);
      return;
    }

    let options = Array.isArray(entry.options) ? entry.options.map(String) : null;

    if (entry.optionsFrom === 'statuses') {
      if (!lifecycle || !Array.isArray(lifecycle.statuses) || lifecycle.statuses.length === 0) {
        errors.push(`${entryPath}: optionsFrom "statuses" requiere un ciclo de vida configurado.`);
        return;
      }
      options = lifecycle.statuses.slice();
    }

    filters.push({
      key,
      label: isNonEmptyString(entry.label) ? entry.label.trim() : labels[key] || key,
      op,
      optionsFrom: entry.optionsFrom === 'statuses' ? 'statuses' : undefined,
      options,
      value: entry.value,
      toggle: entry.toggle === true
    });
  });

  return filters;
}

function normalizeIndicators(raw, fields, labels, path, errors) {
  if (!Array.isArray(raw)) {
    errors.push(`${path}: indicators debe ser una lista.`);
    return [];
  }

  const indicators = [];

  raw.forEach((entry, index) => {
    const entryPath = `${path}.indicators[${index}]`;

    if (!isObject(entry)) {
      errors.push(`${entryPath}: debe ser un objeto.`);
      return;
    }

    if (!isNonEmptyString(entry.id)) {
      errors.push(`${entryPath}: id es obligatorio.`);
    }

    if (!INDICATOR_TYPES.includes(entry.type)) {
      errors.push(`${entryPath}: tipo de indicador desconocido "${entry.type}".`);
      return;
    }

    if (!isNonEmptyString(entry.label)) {
      errors.push(`${entryPath}: label es obligatorio.`);
    }

    if (entry.type === 'countByField') {
      if (!isNonEmptyString(entry.field) || !fields.has(entry.field)) {
        errors.push(`${entryPath}: el campo "${entry.field}" no existe.`);
        return;
      }
    }

    if (entry.type === 'ratio') {
      for (const key of ['numerator', 'denominator']) {
        if (!isNonEmptyString(entry[key]) || !fields.has(entry[key])) {
          errors.push(`${entryPath}: ${key} "${entry[key]}" no existe.`);
          return;
        }
      }
    }

    if (entry.where !== undefined) {
      validatePredicate(entry.where, fields, `${entryPath}.where`, errors);
    } else if (entry.type === 'countWhere') {
      errors.push(`${entryPath}: countWhere requiere where.`);
    }

    indicators.push({
      id: entry.id,
      type: entry.type,
      label: isNonEmptyString(entry.label) ? entry.label.trim() : labels[entry.field] || entry.type,
      field: entry.field,
      numerator: entry.numerator,
      denominator: entry.denominator,
      where: entry.where
    });
  });

  return indicators;
}

function normalizeForms(raw, fields, labels, path, errors) {
  if (!isObject(raw)) {
    errors.push(`${path}: forms debe ser un objeto.`);
    return {};
  }

  const forms = {};

  for (const [name, spec] of Object.entries(raw)) {
    const formPath = `${path}.forms.${name}`;

    if (!isObject(spec)) {
      errors.push(`${formPath}: debe ser un objeto.`);
      continue;
    }

    const formFields = normalizeFields(spec.fields, fields, labels, `${formPath}.fields`, errors);
    forms[name] = {
      title: isNonEmptyString(spec.title) ? spec.title.trim() : name,
      submitLabel: isNonEmptyString(spec.submitLabel) ? spec.submitLabel.trim() : 'Guardar',
      fields: formFields
    };
  }

  return forms;
}

function normalizeCostSummary(raw, fields, labels, path, errors) {
  if (!isObject(raw)) {
    errors.push(`${path}: costSummary debe ser un objeto.`);
    return null;
  }

  if (!isNonEmptyString(raw.groupBy) || !fields.has(raw.groupBy)) {
    errors.push(`${path}: groupBy "${raw.groupBy}" no existe.`);
    return null;
  }

  if (!Array.isArray(raw.fields) || raw.fields.length === 0) {
    errors.push(`${path}: fields debe declarar al menos un campo.`);
    return null;
  }

  const costFields = [];
  for (const key of raw.fields) {
    if (!isNonEmptyString(key) || !fields.has(key)) {
      errors.push(`${path}: el campo de costo "${key}" no existe.`);
      continue;
    }
    costFields.push({ key, label: labels[key] || key });
  }

  return { groupBy: raw.groupBy, fields: costFields };
}

function normalizeBadges(raw, fields, path, errors) {
  if (!Array.isArray(raw)) {
    errors.push(`${path}: badges debe ser una lista.`);
    return [];
  }

  const badges = [];

  raw.forEach((entry, index) => {
    const entryPath = `${path}.badges[${index}]`;

    if (!isObject(entry)) {
      errors.push(`${entryPath}: debe ser un objeto.`);
      return;
    }

    if (!BADGE_TARGETS.includes(entry.target)) {
      errors.push(`${entryPath}: target debe ser "entity" o "document".`);
      return;
    }

    validatePredicate(entry.when, fields, `${entryPath}.when`, errors);

    if (!isNonEmptyString(entry.label)) {
      errors.push(`${entryPath}: label es obligatorio.`);
      return;
    }

    const tone = entry.tone === undefined ? 'info' : entry.tone;
    if (!TONES.includes(tone)) {
      errors.push(`${entryPath}: tone desconocido "${tone}".`);
      return;
    }

    badges.push({ target: entry.target, when: entry.when, label: entry.label.trim(), tone });
  });

  return badges;
}

function normalizeRules(raw, fields, path, errors) {
  if (!Array.isArray(raw)) {
    errors.push(`${path}: rules debe ser una lista.`);
    return [];
  }

  const rules = [];

  raw.forEach((entry, index) => {
    const entryPath = `${path}.rules[${index}]`;

    if (!isObject(entry)) {
      errors.push(`${entryPath}: debe ser un objeto.`);
      return;
    }

    if (!BADGE_TARGETS.includes(entry.target)) {
      errors.push(`${entryPath}: target debe ser "entity" o "document".`);
      return;
    }

    if (!isObject(entry.require)) {
      errors.push(`${entryPath}: require es obligatorio.`);
      return;
    }

    validatePredicate(entry.require, fields, `${entryPath}.require`, errors);

    if (entry.when !== undefined) {
      validatePredicate(entry.when, fields, `${entryPath}.when`, errors);
    }

    if (!isNonEmptyString(entry.message)) {
      errors.push(`${entryPath}: message es obligatorio.`);
      return;
    }

    rules.push({
      target: entry.target,
      when: entry.when,
      require: entry.require,
      message: entry.message.trim(),
      field: isNonEmptyString(entry.field) ? entry.field : undefined
    });
  });

  return rules;
}

function normalizeTransitionEntries(raw, statuses, kind, fields, path, errors) {
  if (!Array.isArray(raw)) {
    errors.push(`${path}: ${kind} debe ser una lista.`);
    return [];
  }

  const entries = [];

  raw.forEach((entry, index) => {
    const entryPath = `${path}.${kind}[${index}]`;

    if (!isObject(entry)) {
      errors.push(`${entryPath}: debe ser un objeto.`);
      return;
    }

    if (!statuses.includes(entry.from)) {
      errors.push(`${entryPath}: el estado de origen "${entry.from}" no existe en el ciclo de vida.`);
      return;
    }

    if (!statuses.includes(entry.to)) {
      errors.push(`${entryPath}: el estado de destino "${entry.to}" no existe en el ciclo de vida.`);
      return;
    }

    if (kind !== 'transitionGuards' && !isNonEmptyString(entry.label)) {
      errors.push(`${entryPath}: label es obligatorio.`);
      return;
    }

    if (kind === 'transitionGuards' && !isNonEmptyString(entry.message)) {
      errors.push(`${entryPath}: message es obligatorio.`);
      return;
    }

    if (entry.requires !== undefined) {
      validatePredicate(entry.requires, fields, `${entryPath}.requires`, errors);
    }

    if (entry.require !== undefined) {
      validatePredicate(entry.require, fields, `${entryPath}.require`, errors);
    }

    const tone = entry.tone === undefined ? 'info' : entry.tone;
    if (!TONES.includes(tone)) {
      errors.push(`${entryPath}: tone desconocido "${tone}".`);
      return;
    }

    entries.push({
      from: entry.from,
      to: entry.to,
      label: isNonEmptyString(entry.label) ? entry.label.trim() : undefined,
      tone,
      requires: entry.requires,
      require: entry.require,
      message: isNonEmptyString(entry.message) ? entry.message.trim() : undefined
    });
  });

  return entries;
}

/**
 * Valida y normaliza la sección `domain` de la configuración.
 *
 * @param {object} config configuración completa con `domain`, `customFields` y `statusLifecycle`,
 *   o directamente la sección `domain`.
 * @param {{entity: string[], document: string[]}} baseFields campos base disponibles.
 * @returns {{domain: object|null, errors: string[]}}
 */
export function validateDomainConfig(config, baseFields = { entity: [], document: [] }) {
  const errors = [];

  if (config === undefined || config === null) {
    return { domain: null, errors };
  }

  if (!isObject(config)) {
    errors.push('domain debe ser un objeto.');
    return { domain: null, errors };
  }

  const rawDomain = Object.prototype.hasOwnProperty.call(config, 'domain') ? config.domain : config;
  const customFields = Array.isArray(config.customFields) ? config.customFields : [];
  const lifecycle = config.statusLifecycle || null;

  if (rawDomain === null || rawDomain === undefined) {
    return { domain: null, errors };
  }

  if (!isObject(rawDomain)) {
    errors.push('domain debe ser un objeto.');
    return { domain: null, errors };
  }

  const fields = fieldUniverse(baseFields, customFields);
  const labels = buildFieldLabels({ customFields });
  const domain = {};

  if (rawDomain.documentList !== undefined) {
    if (!isObject(rawDomain.documentList)) {
      errors.push('domain.documentList debe ser un objeto.');
    } else {
      const list = rawDomain.documentList;
      const columns = normalizeColumns(list.columns, fields, labels, 'domain.documentList', errors);
      const filters =
        list.filters === undefined
          ? []
          : normalizeFilters(list.filters, fields, lifecycle, labels, 'domain.documentList', errors);
      const detailSections = [];

      if (list.detailSections !== undefined) {
        if (!Array.isArray(list.detailSections)) {
          errors.push('domain.documentList.detailSections debe ser una lista.');
        } else {
          list.detailSections.forEach((section, index) => {
            const sectionPath = `domain.documentList.detailSections[${index}]`;
            if (!isObject(section)) {
              errors.push(`${sectionPath}: debe ser un objeto.`);
              return;
            }
            if (!isNonEmptyString(section.title)) {
              errors.push(`${sectionPath}: title es obligatorio.`);
              return;
            }
            const sectionFields = normalizeFields(section.fields, fields, labels, `${sectionPath}.fields`, errors);
            detailSections.push({ title: section.title.trim(), fields: sectionFields });
          });
        }
      }

      domain.documentList = { columns, filters, detailSections };
    }
  }

  if (rawDomain.indicators !== undefined) {
    domain.indicators = normalizeIndicators(rawDomain.indicators, fields, labels, 'domain', errors);
  }

  if (rawDomain.costSummary !== undefined) {
    domain.costSummary = normalizeCostSummary(rawDomain.costSummary, fields, labels, 'domain', errors);
  }

  if (rawDomain.badges !== undefined) {
    domain.badges = normalizeBadges(rawDomain.badges, fields, 'domain', errors);
  }

  if (rawDomain.rules !== undefined) {
    domain.rules = normalizeRules(rawDomain.rules, fields, 'domain', errors);
  }

  if (rawDomain.forms !== undefined) {
    domain.forms = normalizeForms(rawDomain.forms, fields, labels, 'domain', errors);
  }

  if (rawDomain.transitionActions !== undefined || rawDomain.transitionGuards !== undefined) {
    if (!lifecycle || !Array.isArray(lifecycle.statuses) || lifecycle.statuses.length === 0) {
      errors.push('domain.transitionActions y domain.transitionGuards requieren un ciclo de vida configurado.');
    } else {
      if (rawDomain.transitionActions !== undefined) {
        domain.transitionActions = normalizeTransitionEntries(
          rawDomain.transitionActions,
          lifecycle.statuses,
          'transitionActions',
          fields,
          'domain',
          errors
        );
      }
      if (rawDomain.transitionGuards !== undefined) {
        domain.transitionGuards = normalizeTransitionEntries(
          rawDomain.transitionGuards,
          lifecycle.statuses,
          'transitionGuards',
          fields,
          'domain',
          errors
        );
      }
    }
  }

  return { domain: errors.length === 0 ? domain : null, errors };
}
