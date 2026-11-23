import { escapeHtml } from '../security.js';

/** Aplica las etiquetas declaradas en `domain.access.labels`. */
export function applyLoginLabels(access) {
  const labels = (access && access.labels) || {};
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element && typeof value === 'string') {
      element.textContent = value;
    }
  };

  setText('login-title', labels.loginTitle);
  setText('login-role-label', labels.role);
  setText('login-secret-label', labels.secret);
  setText('active-role-label', labels.activeRole);
  setText('logout', labels.logout);
}

export function setLoginError(message) {
  const error = document.getElementById('login-error');
  if (error) {
    error.textContent = message || '';
  }
}

/**
 * Renderiza el formulario de acceso. El componente no conoce cargos concretos:
 * recibe la declaración normalizada y delega la decisión en `onSubmit`.
 */
export function renderLogin(container, access, onSubmit) {
  if (!container) {
    return;
  }

  const roles = access && Array.isArray(access.roles) ? access.roles : [];
  const labels = (access && access.labels) || {};
  const options = roles
    .map((role) => `<option value="${escapeHtml(role.id)}">${escapeHtml(role.label)}</option>`)
    .join('');

  container.innerHTML = `
    <div class="login-card">
    <p class="eyebrow">ERP · Grupo 07</p>
    <h1 id="login-title">${escapeHtml(labels.loginTitle || 'Acceso por cargo')}</h1>
    <p class="view-subtitle">Seleccione su cargo e introduzca su clave de verificación.</p>
    <form id="login-form" class="login-form">
      <div class="field">
        <label id="login-role-label" for="login-role">${escapeHtml(labels.role || 'Cargo')}</label>
        <select id="login-role" name="role">
          <option value="">${escapeHtml(labels.chooseRole || 'Seleccione un cargo')}</option>
          ${options}
        </select>
      </div>
      <div class="field">
        <label id="login-secret-label" for="login-secret">${escapeHtml(labels.secret || 'Clave de verificación')}</label>
        <input id="login-secret" name="secret" type="password" autocomplete="current-password" />
      </div>
      <p id="login-error" class="login-error" role="alert" aria-live="polite"></p>
      <button id="login-submit" class="primary" type="submit">${escapeHtml(labels.loginAction || 'Ingresar')}</button>
    </form>
    </div>
  `;

  const form = container.querySelector('#login-form');
  if (form && typeof onSubmit === 'function') {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const roleId = container.querySelector('#login-role')?.value || '';
      const secret = container.querySelector('#login-secret')?.value || '';
      onSubmit(roleId, secret);
    });
  }

  applyLoginLabels(access);
  container.querySelector('#login-role')?.focus();
}
