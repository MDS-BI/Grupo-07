export const PREDICATE_OPERATORS = ['eq', 'neq', 'in', 'notIn', 'lt', 'lte', 'gt', 'gte', 'exists', 'blank'];

export function isBlankValue(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function toComparable(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return value;
}

function looseEqual(left, right) {
  if (isBlankValue(left) && isBlankValue(right)) {
    return true;
  }
  const a = toComparable(left);
  const b = toComparable(right);
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b;
  }
  return String(left) === String(right);
}

function compare(left, right) {
  const a = toComparable(left);
  const b = toComparable(right);
  if (typeof a === 'number' && typeof b === 'number') {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  const textA = String(left);
  const textB = String(right);
  return textA < textB ? -1 : textA > textB ? 1 : 0;
}

function currentDate(context) {
  if (context && context.today) {
    return context.today;
  }
  return new Date().toISOString().slice(0, 10);
}

function resolveRight(predicate, record, context) {
  if (predicate.ref !== undefined) {
    return record ? record[predicate.ref] : undefined;
  }
  if (predicate.value === 'today') {
    return currentDate(context);
  }
  return predicate.value;
}

/**
 * Evalúa un predicado declarativo de lista blanca.
 * Un predicado ausente se considera verdadero (sin condición).
 */
export function evaluatePredicate(predicate, record, context = {}) {
  if (predicate === undefined || predicate === null) {
    return true;
  }

  if (Array.isArray(predicate.all)) {
    return predicate.all.every((item) => evaluatePredicate(item, record, context));
  }

  if (Array.isArray(predicate.any)) {
    return predicate.any.some((item) => evaluatePredicate(item, record, context));
  }

  if (typeof predicate !== 'object' || typeof predicate.field !== 'string') {
    return false;
  }

  const left = record ? record[predicate.field] : undefined;
  const right = resolveRight(predicate, record, context);

  switch (predicate.op) {
    case 'eq':
      return looseEqual(left, right);
    case 'neq':
      return !looseEqual(left, right);
    case 'in':
      return Array.isArray(right) && right.some((item) => looseEqual(left, item));
    case 'notIn':
      return Array.isArray(right) && !right.some((item) => looseEqual(left, item));
    case 'lt':
      return !isBlankValue(left) && !isBlankValue(right) && compare(left, right) < 0;
    case 'lte':
      return !isBlankValue(left) && !isBlankValue(right) && compare(left, right) <= 0;
    case 'gt':
      return !isBlankValue(left) && !isBlankValue(right) && compare(left, right) > 0;
    case 'gte':
      return !isBlankValue(left) && !isBlankValue(right) && compare(left, right) >= 0;
    case 'exists':
      return !isBlankValue(left);
    case 'blank':
      return isBlankValue(left);
    default:
      return false;
  }
}

function fieldOf(predicate) {
  if (!predicate || typeof predicate !== 'object') {
    return 'domain';
  }
  if (typeof predicate.field === 'string') {
    return predicate.field;
  }
  const children = [...(predicate.all || []), ...(predicate.any || [])];
  for (const child of children) {
    const key = fieldOf(child);
    if (key !== 'domain') {
      return key;
    }
  }
  return 'domain';
}

/**
 * Devuelve las violaciones de las reglas de dominio configuradas.
 * Cada violación incluye el campo implicado y el mensaje configurado.
 */
export function evaluateRules(target, record, config, context = {}) {
  const rules =
    config && config.domain && Array.isArray(config.domain.rules)
      ? config.domain.rules.filter((rule) => rule.target === target)
      : [];

  const violations = [];

  for (const rule of rules) {
    if (rule.when && !evaluatePredicate(rule.when, record, context)) {
      continue;
    }
    if (!evaluatePredicate(rule.require, record, context)) {
      violations.push({
        field: rule.field || fieldOf(rule.require),
        message: rule.message
      });
    }
  }

  return violations;
}

/**
 * Comprueba que una transición de estado sea válida según el ciclo de vida
 * y las guardas declarativas de la configuración.
 */
export function guardTransition(from, to, record, config, context = {}) {
  const lifecycle = config ? config.statusLifecycle : null;

  if (lifecycle) {
    const allowed = lifecycle.transitions[from] || [];
    if (!allowed.includes(to)) {
      return {
        ok: false,
        message: `Transición de estado inválida: ${from || 'sin estado'} → ${to}.`
      };
    }
  }

  const guards =
    config && config.domain && Array.isArray(config.domain.transitionGuards) ? config.domain.transitionGuards : [];

  for (const guard of guards) {
    if (guard.from !== from || guard.to !== to) {
      continue;
    }
    if (!evaluatePredicate(guard.require, record, context)) {
      return { ok: false, message: guard.message };
    }
  }

  return { ok: true };
}
