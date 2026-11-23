const VIEWS = {
  dashboard: 'view-dashboard',
  entities: 'view-entities',
  documents: 'view-documents',
  search: 'view-search'
};

const DOCUMENT_TABS = {
  orders: 'document-tabpanel-orders',
  indicators: 'document-tabpanel-indicators',
  charts: 'document-tabpanel-charts',
  execution: 'document-tabpanel-execution',
  quality: 'document-tabpanel-quality',
  form: 'document-tabpanel-form'
};

export const DOCUMENT_TAB_NAMES = Object.keys(DOCUMENT_TABS);

export function monogram(name) {
  const words = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = words[0] ? words[0][0] : '';
  const second = words[1] ? words[1][0] : '';
  return `${first}${second}`.toUpperCase();
}

export function renderLogo(container, name) {
  if (!container) {
    return;
  }

  const letters = monogram(name);
  container.innerHTML = `<svg viewBox="0 0 40 40" role="img" aria-label="${escapeHtml(name)}"><rect width="40" height="40" rx="10" fill="currentColor" opacity="0.12"></rect><text x="20" y="26" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">${escapeHtml(letters)}</text></svg>`;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function lowerLabel(value) {
  return String(value ?? '').toLowerCase();
}

export function isFeminine(term) {
  const first = String(term ?? '')
    .trim()
    .split(/\s+/)[0]
    .toLowerCase();
  if (first === '' || first.startsWith('entidad') || first === 'orden') {
    return true;
  }
  return first.endsWith('a');
}

export function articleFor(term) {
  return isFeminine(term) ? 'la' : 'el';
}

export function selectedSuffix(term) {
  return isFeminine(term) ? 'seleccionada' : 'seleccionado';
}

export function applyShell(config) {
  const labels = config.labels;

  document.title = config.moduleName;
  setText('brand-name', config.moduleName);
  setText('nav-dashboard-label', 'Panel');
  setText('nav-entities-label', labels.entities);
  setText('nav-documents-label', labels.documents);
  setText('nav-search-label', 'Búsqueda');

  renderLogo(document.getElementById('logo-mark'), config.moduleName);

  if (document.documentElement && document.documentElement.style) {
    const accent = config.theme.accentColor;
    const useManufacturingPalette = config.moduleName === 'Manufactura y Operaciones' && accent === '#0f766e';
    document.documentElement.style.setProperty('--accent', useManufacturingPalette ? '#294765' : accent);
  }
}

export function showView(name) {
  for (const [key, id] of Object.entries(VIEWS)) {
    const view = document.getElementById(id);
    if (view) {
      view.hidden = key !== name;
    }
  }

  const buttons = document.querySelectorAll('.nav-module');
  buttons.forEach((button) => {
    if (button.dataset.module === name) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

/** Muestra una subventana del apartado de documentos y sincroniza sus pestañas. */
export function showDocumentTab(name) {
  if (!DOCUMENT_TABS[name]) {
    return;
  }

  for (const [tabName, panelId] of Object.entries(DOCUMENT_TABS)) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.hidden = tabName !== name;
    }

    const button = document.getElementById(`document-tab-${tabName}`);
    if (button) {
      const selected = tabName === name;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      button.classList.toggle('is-active', selected);
    }
  }
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}
