/**
 * Sesión ficticia de la US16. Guarda solo `{ roleId, grants }` bajo la clave
 * declarada en `domain.access.sessionKey`; no conoce cargos ni claves concretos
 * y nunca toca las claves de entidades ni documentos (SC-015).
 */
const memory = new Map();

function store() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function isValidSession(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof value.roleId === 'string' &&
    value.roleId.trim() !== '' &&
    value.grants &&
    typeof value.grants === 'object'
  );
}

function normalizeSession(value) {
  if (!isValidSession(value)) {
    return null;
  }
  return { roleId: value.roleId.trim(), grants: value.grants };
}

export function saveSession(sessionKey, session) {
  const normalized = normalizeSession(session);
  if (!sessionKey || !normalized) {
    return null;
  }

  memory.set(sessionKey, normalized);
  const storage = store();
  if (storage) {
    try {
      storage.setItem(sessionKey, JSON.stringify(normalized));
    } catch {
      // La copia en memoria sigue siendo válida aunque localStorage no esté disponible.
    }
  }
  return normalized;
}

export function loadSession(sessionKey) {
  if (!sessionKey) {
    return null;
  }

  const storage = store();
  if (!storage) {
    const cached = memory.get(sessionKey);
    return isValidSession(cached) ? cached : null;
  }

  try {
    const raw = storage.getItem(sessionKey);
    if (!raw) {
      memory.delete(sessionKey);
      return null;
    }
    const session = normalizeSession(JSON.parse(raw));
    if (session) {
      memory.set(sessionKey, session);
    } else {
      memory.delete(sessionKey);
    }
    return session;
  } catch {
    memory.delete(sessionKey);
    return null;
  }
}

export function clearSession(sessionKey) {
  if (!sessionKey) {
    return;
  }
  memory.delete(sessionKey);
  const storage = store();
  if (storage) {
    try {
      storage.removeItem(sessionKey);
    } catch {
      // Nada más que limpiar.
    }
  }
}

export function activeSession(sessionKey) {
  return loadSession(sessionKey);
}

export function activeGrants(sessionKey) {
  const session = loadSession(sessionKey);
  return session ? session.grants : null;
}
