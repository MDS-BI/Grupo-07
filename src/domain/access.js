import { validateAccessConfig } from './config-schema.js';

/**
 * Construye las estructuras de consulta en memoria. La validación de la forma
 * no se repite aquí: `config-schema.js` es la única fuente de verdad (T091).
 * El motor no conoce cargos, claves ni reglas de un dominio concreto (XR-007).
 */
export function normalizeAccess(access, statusLifecycle = null) {
  const result = validateAccessConfig(access, statusLifecycle);
  if (!result.access) {
    return null;
  }

  const normalized = result.access;
  const index = {
    roles: new Map(normalized.roles.map((role) => [role.id, role])),
    grants: new Map(),
    fields: new Map(),
    transitions: new Set()
  };

  for (const role of normalized.roles) {
    const grants = role.grants;
    index.grants.set(role.id, {
      views: new Set(grants.views),
      actions: new Set(grants.actions),
      sections: new Set(grants.sections),
      filters: new Set(grants.filters),
      charts: new Set(grants.charts)
    });
    index.fields.set(role.id, {
      entity: new Set(grants.fields.entity),
      document: new Set(grants.fields.document)
    });
    for (const transition of grants.transitions) {
      index.transitions.add(`${role.id}\u0000${transition.from}\u0000${transition.to}`);
    }
  }

  Object.defineProperty(normalized, '_index', {
    value: index,
    enumerable: false,
    writable: false
  });

  return normalized;
}

function findRole(access, roleId) {
  if (!access || !Array.isArray(access.roles) || typeof roleId !== 'string' || roleId.trim() === '') {
    return null;
  }
  const index = access._index && access._index.roles;
  if (index instanceof Map) {
    return index.get(roleId.trim()) || null;
  }
  return access.roles.find((role) => role.id === roleId.trim()) || null;
}

/** Devuelve la sesión de rol cuando cargo y clave coinciden, o null. */
export function authenticate(access, roleId, secret) {
  const role = findRole(access, roleId);
  if (!role || typeof secret !== 'string' || secret.trim() === '' || secret.trim() !== role.secret) {
    return null;
  }
  return { roleId: role.id, label: role.label, grants: role.grants };
}

/** Devuelve un mensaje derivado de las etiquetas de configuración, o null si es válido. */
export function authenticationError(access, roleId, secret) {
  const labels = (access && access.labels) || {};
  const role = findRole(access, roleId);
  if (!role) {
    return labels.missingRole || 'Seleccione un cargo.';
  }
  if (typeof secret !== 'string' || secret.trim() === '') {
    return labels.emptySecret || 'Introduzca la clave de verificación.';
  }
  if (secret.trim() !== role.secret) {
    return labels.invalidSecret || 'La clave no corresponde al cargo seleccionado.';
  }
  return null;
}

/** Decisión genérica para las seis capacidades declarativas. */
export function can(grants, capability, context) {
  if (!grants || typeof grants !== 'object') {
    return false;
  }

  if (capability === 'fields') {
    const target = context && context.target;
    const field = context && context.field;
    return Boolean(
      target && field && grants.fields && Array.isArray(grants.fields[target]) && grants.fields[target].includes(field)
    );
  }

  if (capability === 'transitions') {
    const from = context && context.from;
    const to = context && context.to;
    return Boolean(
      from &&
      to &&
      Array.isArray(grants.transitions) &&
      grants.transitions.some((item) => item.from === from && item.to === to)
    );
  }

  const key = typeof context === 'string' ? context : context && context.key;
  if (!key || !Array.isArray(grants[capability])) {
    return false;
  }
  return grants[capability].includes(key);
}

export function isFieldEditable(grants, target, field) {
  return can(grants, 'fields', { target, field });
}

export function isSectionVisible(grants, section) {
  return can(grants, 'sections', section);
}

export function isFilterAllowed(grants, filterKey) {
  return can(grants, 'filters', filterKey);
}

export function isTransitionAllowed(grants, from, to) {
  return can(grants, 'transitions', { from, to });
}
