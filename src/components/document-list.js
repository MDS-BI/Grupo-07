import { evaluatePredicate } from '../domain/rules.js';
import { formatValue, resolveFieldValue } from '../domain/views.js';

const TONE_CLASS = {
  info: 'badge-info',
  warning: 'badge-warning',
  danger: 'badge-danger'
};

function badgeClass(tone) {
  return TONE_CLASS[tone] || TONE_CLASS.info;
}

export function renderBadges(container, record, config, target, context = {}) {
  if (!container) {
    return;
  }

  const badges =
    config && config.domain && Array.isArray(config.domain.badges)
      ? config.domain.badges.filter((badge) => badge.target === target)
      : [];

  for (const badge of badges) {
    if (!evaluatePredicate(badge.when, record, context)) {
      continue;
    }
    const element = document.createElement('span');
    element.className = `badge ${badgeClass(badge.tone)}`;
    element.textContent = badge.label;
    container.appendChild(element);
  }
}

function displayNumber(record) {
  if (!record) {
    return '';
  }
  const series = record.series ? `${record.series} — ` : '';
  return `${series}${record.folio ?? ''}`.trim();
}

/**
 * Renderiza la lista declarativa de documentos. Las columnas y etiquetas
 * provienen de la configuración; el componente no conoce el dominio.
 */
export function renderDocumentList(container, options = {}) {
  const {
    documents = [],
    entities = [],
    columns = [],
    selectedId = null,
    emptyLabel = 'No hay registros.',
    config = null,
    onSelect = null
  } = options;

  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (documents.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.id = 'document-list-empty';
    empty.textContent = emptyLabel;
    container.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'document-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const column of columns) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = column.label;
    headerRow.appendChild(th);
  }
  const badgeHeader = document.createElement('th');
  badgeHeader.scope = 'col';
  badgeHeader.textContent = 'Alertas';
  headerRow.appendChild(badgeHeader);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (const record of documents) {
    const entity = entities.find((item) => item.entity_id === record.entity_id) || null;
    const row = document.createElement('tr');
    row.className = 'document-row';
    row.dataset.documentId = record.id;
    row.tabIndex = 0;

    if (selectedId && record.id === selectedId) {
      row.classList.add('selected');
      row.setAttribute('aria-selected', 'true');
    }

    for (const column of columns) {
      const cell = document.createElement('td');
      cell.textContent = formatValue(resolveFieldValue(record, column.key, { entity }), { fallback: 'sin dato' });
      row.appendChild(cell);
    }

    const badgeCell = document.createElement('td');
    badgeCell.className = 'badge-cell';
    renderBadges(badgeCell, record, config, 'document');
    row.appendChild(badgeCell);

    if (typeof onSelect === 'function') {
      row.addEventListener('click', () => onSelect(record.id));
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(record.id);
        }
      });
    }

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.appendChild(table);
}

/**
 * Renderiza el detalle por secciones declaradas y las acciones de transición
 * disponibles para el documento seleccionado.
 */
export function renderDocumentDetail(container, options = {}) {
  const {
    documentRecord = null,
    entity = null,
    sections = [],
    config = null,
    actions = [],
    emptyLabel = 'Seleccione un registro para ver el detalle.',
    onAction = null
  } = options;

  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!documentRecord) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.id = 'document-detail-empty';
    empty.textContent = emptyLabel;
    container.appendChild(empty);
    return;
  }

  const header = document.createElement('div');
  header.className = 'detail-header';

  const title = document.createElement('h3');
  title.id = 'document-detail-title';
  title.textContent = displayNumber(documentRecord);
  header.appendChild(title);

  const badgeBox = document.createElement('div');
  badgeBox.className = 'badge-row';
  renderBadges(badgeBox, documentRecord, config, 'document');
  header.appendChild(badgeBox);
  container.appendChild(header);

  for (const section of sections) {
    const sectionElement = document.createElement('section');
    sectionElement.className = 'detail-section';

    const heading = document.createElement('h4');
    heading.textContent = section.title;
    sectionElement.appendChild(heading);

    const list = document.createElement('dl');
    list.className = 'detail-list';

    for (const field of section.fields) {
      const term = document.createElement('dt');
      term.textContent = field.label;
      const value = document.createElement('dd');
      value.textContent = formatValue(resolveFieldValue(documentRecord, field.key, { entity }), {
        fallback: 'sin dato'
      });
      list.appendChild(term);
      list.appendChild(value);
    }

    sectionElement.appendChild(list);
    container.appendChild(sectionElement);
  }

  if (Array.isArray(actions) && actions.length > 0) {
    const actionsBox = document.createElement('div');
    actionsBox.className = 'document-actions';

    const heading = document.createElement('h4');
    heading.textContent = 'Acciones';
    actionsBox.appendChild(heading);

    for (const action of actions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `action-button ${badgeClass(action.tone)}`;
      button.dataset.transitionTo = action.to;
      button.textContent = action.label;
      if (action.blocked) {
        button.disabled = true;
        button.classList.add('is-blocked');
        if (action.blockedReason) {
          button.title = action.blockedReason;
        }
      }
      if (typeof onAction === 'function') {
        button.addEventListener('click', () => onAction(action));
      }
      actionsBox.appendChild(button);
    }

    container.appendChild(actionsBox);
  }
}

/**
 * Construye los controles de un formulario declarativo de dominio a partir de
 * los tipos de campo configurados.
 */
export function renderDomainForm(container, formSpec, fieldDefinitions = [], options = {}) {
  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!formSpec) {
    return;
  }

  const prefix = options.idPrefix || formSpec.name || 'domain';
  const definitions = new Map(fieldDefinitions.map((field) => [field.key, field]));

  for (const field of formSpec.fields) {
    const definition = definitions.get(field.key) || { type: 'text' };
    const wrapper = document.createElement('div');
    wrapper.className = 'field';

    const label = document.createElement('label');
    label.htmlFor = `${prefix}-${field.key}`;
    label.textContent = field.label;
    wrapper.appendChild(label);

    let control;
    if (definition.type === 'select') {
      control = document.createElement('select');
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = '--';
      control.appendChild(blank);
      for (const optionValue of definition.options || []) {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        control.appendChild(option);
      }
    } else {
      control = document.createElement('input');
      control.type = definition.type === 'number' ? 'number' : definition.type === 'date' ? 'date' : 'text';
      if (definition.type === 'number') {
        control.step = 'any';
      }
      control.autocomplete = 'off';
    }

    control.id = `${prefix}-${field.key}`;
    control.name = `${prefix}-${field.key}`;
    control.dataset.field = field.key;
    wrapper.appendChild(control);
    container.appendChild(wrapper);
  }
}

export function fillDomainForm(container, record) {
  if (!container) {
    return;
  }

  container.querySelectorAll('[data-field]').forEach((control) => {
    const key = control.dataset.field;
    const value = record ? record[key] : undefined;
    control.value = value === undefined || value === null ? '' : String(value);
  });
}

export function collectDomainForm(container) {
  const data = {};
  if (!container) {
    return data;
  }

  container.querySelectorAll('[data-field]').forEach((control) => {
    data[control.dataset.field] = control.value;
  });

  return data;
}
