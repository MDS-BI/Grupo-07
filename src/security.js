const UNSAFE_URL = /^\s*(?:javascript|vbscript|data:text\/html|data:application\/xhtml\+xml):/i;
const SAFE_URL = /^(?:https?:|mailto:|tel:|\/|\.\/|\.\.\/|#)/i;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Escapa un valor para insertarlo como texto dentro de marcado HTML.
 * Los datos de usuario nunca deben interpolarse sin escapar en `innerHTML`.
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

/** Asigna texto plano a un elemento sin interpretar HTML. */
export function setSafeText(element, value) {
  if (element) {
    element.textContent = value === undefined || value === null ? '' : String(value);
  }
  return element;
}

/** Devuelve un valor seguro para usarse dentro de un atributo HTML. */
export function safeAttribute(value) {
  return escapeHtml(value).replace(/=/g, '&#61;');
}

/**
 * Indica si una URL puede usarse en un enlace. Se aceptan rutas relativas y
 * los esquemas http(s), mailto y tel; se rechazan `javascript:`, `vbscript:`
 * y cualquier esquema desconocido.
 */
export function isSafeUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return false;
  }

  if (UNSAFE_URL.test(trimmed)) {
    return false;
  }

  if (SAFE_URL.test(trimmed)) {
    return true;
  }

  return !HAS_SCHEME.test(trimmed);
}
