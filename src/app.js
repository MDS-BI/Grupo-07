import { loadModuleConfig, normalizeConfig, setActiveConfig } from './module-config.js';
import {
  loadEntities,
  addEntity,
  updateEntity,
  deleteEntity,
  validateEntity,
  searchEntities,
  loadDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  validateDocument
} from './storage.js';
import { applyShell, showView, articleFor, lowerLabel, selectedSuffix } from './components/shell.js';
import { applyDashboard, refreshStats } from './components/dashboard.js';
import { renderCustomFields, collectCustomValues, fillCustomValues } from './components/custom-fields.js';
import {
  resolveColumns,
  resolveFilters,
  resolveDetailSections,
  resolveForm,
  resolveFieldLabels,
  applyFilters,
  formatValue
} from './domain/views.js';
import { evaluatePredicate } from './domain/rules.js';
import {
  renderDocumentList,
  renderDocumentDetail,
  renderBadges,
  renderDomainForm,
  fillDomainForm,
  collectDomainForm
} from './components/document-list.js';
import { renderIndicators, renderCostSummary } from './components/indicators.js';

const ENTITY_INPUTS = [
  'name',
  'code',
  'taxId',
  'email',
  'phone',
  'address',
  'category',
  'description',
  'targetDate',
  'creditLimit',
  'paymentTerms'
];
const DOCUMENT_INPUTS = [
  'series',
  'folio',
  'startDate',
  'endDate',
  'quantity',
  'subtotal',
  'discount',
  'taxAmount',
  'totalAmount',
  'currency',
  'notes'
];

let currentConfig = null;
let selectedDocumentId = null;
const domainFilterState = { values: {}, toggles: {} };

function $(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const element = $(id);
  if (element) {
    element.textContent = text;
  }
}

function entityCustomFields() {
  return (currentConfig && currentConfig.customFields ? currentConfig.customFields : []).filter(
    (field) => field.target === 'entity'
  );
}

function documentCustomFields() {
  return (currentConfig && currentConfig.customFields ? currentConfig.customFields : []).filter(
    (field) => field.target === 'document'
  );
}

function clearErrors(root) {
  if (!root) {
    return;
  }
  root.querySelectorAll('.error').forEach((element) => {
    element.textContent = '';
  });
}

function applyViewLabels() {
  const labels = currentConfig.labels;

  setText('entities-view-heading', labels.entities);
  setText('entity-form-heading', `Agregar / Editar ${labels.entity}`);
  setText('edit-entity-heading', `Editar o eliminar ${articleFor(labels.entity)} ${lowerLabel(labels.entity)}`);
  setText(
    'delete-entity',
    `Eliminar ${articleFor(labels.entity)} ${lowerLabel(labels.entity)} ${selectedSuffix(labels.entity)}`
  );

  setText('documents-view-heading', labels.documents);
  setText('document-form-heading', `Agregar / Editar ${labels.document}`);
  setText('edit-document-heading', `Editar o eliminar ${articleFor(labels.document)} ${lowerLabel(labels.document)}`);
  setText(
    'delete-document',
    `Eliminar ${articleFor(labels.document)} ${lowerLabel(labels.document)} ${selectedSuffix(labels.document)}`
  );

  setText('search-view-heading', `Buscar ${labels.entities}`);
  setText('search-empty', `No hay coincidencias con la búsqueda.`);
}

function showConfigErrors(errors) {
  const banner = $('config-banner');
  if (!banner) {
    return;
  }
  if (!errors || errors.length === 0) {
    banner.hidden = true;
    banner.textContent = '';
    return;
  }
  banner.hidden = false;
  banner.textContent = `Configuración inválida: ${errors.join(' ')}`;
}

function renderEntitySelects() {
  const entities = loadEntities();

  const editSelect = $('edit-entity');
  if (editSelect) {
    const previous = editSelect.value;
    editSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
    for (const entity of entities) {
      const option = document.createElement('option');
      option.value = entity.id;
      option.textContent = `${entity.name} — ${entity.code}`;
      editSelect.appendChild(option);
    }
    if ([...editSelect.options].some((option) => option.value === previous)) {
      editSelect.value = previous;
    }
  }

  const documentSelect = $('document-entity');
  if (documentSelect) {
    const previous = documentSelect.value;
    documentSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
    for (const entity of entities) {
      const option = document.createElement('option');
      option.value = entity.entity_id;
      option.textContent = `${entity.name} — ${entity.code}`;
      documentSelect.appendChild(option);
    }
    if ([...documentSelect.options].some((option) => option.value === previous)) {
      documentSelect.value = previous;
    }
  }
}

function renderDocumentSelects() {
  const documents = loadDocuments();
  const select = $('edit-document');
  if (!select) {
    return;
  }

  const previous = select.value;
  select.innerHTML = '<option value="">-- Seleccionar --</option>';
  for (const record of documents) {
    const option = document.createElement('option');
    option.value = record.id;
    const number = record.series ? `${record.series} — ${record.folio}` : String(record.folio ?? '');
    option.textContent = number;
    select.appendChild(option);
  }
  if ([...select.options].some((option) => option.value === previous)) {
    select.value = previous;
  }
}

function buildStatusControl(current) {
  const container = $('status-container');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  const lifecycle = currentConfig.statusLifecycle;
  let control;

  if (lifecycle) {
    control = document.createElement('select');
    control.id = 'status';

    if (current) {
      const options = [current, ...(lifecycle.transitions[current] || [])];
      for (const status of options) {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        control.appendChild(option);
      }
      control.value = current;
    } else {
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = '--';
      control.appendChild(blank);
      for (const status of lifecycle.statuses) {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        control.appendChild(option);
      }
    }
  } else {
    control = document.createElement('input');
    control.type = 'text';
    control.id = 'status';
    control.autocomplete = 'off';
    if (current) {
      control.value = current;
    }
  }

  container.appendChild(control);
}

function statusValue() {
  const control = $('status');
  return control ? control.value : '';
}

function domainConfig() {
  return currentConfig && currentConfig.domain ? currentConfig.domain : null;
}

function resetDomainState() {
  selectedDocumentId = null;
  domainFilterState.values = {};
  domainFilterState.toggles = {};
}

function findDocumentById(id) {
  if (!id) {
    return null;
  }
  return loadDocuments().find((record) => record.id === id) || null;
}

function findEntityForDocument(record) {
  if (!record) {
    return null;
  }
  return loadEntities().find((entity) => entity.entity_id === record.entity_id) || null;
}

function collectPredicateFields(predicate, keys) {
  if (!predicate || typeof predicate !== 'object') {
    return;
  }

  if (Array.isArray(predicate.all)) {
    predicate.all.forEach((item) => collectPredicateFields(item, keys));
  }

  if (Array.isArray(predicate.any)) {
    predicate.any.forEach((item) => collectPredicateFields(item, keys));
  }

  if (typeof predicate.field === 'string') {
    keys.add(predicate.field);
  }

  if (typeof predicate.ref === 'string') {
    keys.add(predicate.ref);
  }
}

function entityBadgeFieldKeys() {
  const domain = domainConfig();
  const badges = domain && Array.isArray(domain.badges) ? domain.badges : [];
  const keys = new Set();

  for (const badge of badges) {
    if (badge.target === 'entity') {
      collectPredicateFields(badge.when, keys);
    }
  }

  return [...keys];
}

function showDomainFeedback(message) {
  setText('domain-feedback', message || '');
}

function activeDomainFilters(filters) {
  const active = [];

  filters.forEach((filter, index) => {
    if (filter.toggle) {
      if (domainFilterState.toggles[index]) {
        active.push({ predicate: filter.predicate });
      }
      return;
    }

    const value = domainFilterState.values[index] ?? filter.value ?? '';
    if (value === '') {
      return;
    }

    active.push({ key: filter.key, op: filter.op || 'eq', value });
  });

  return active;
}

function renderDomainFilters(filters) {
  const container = $('document-filters');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!Array.isArray(filters) || filters.length === 0) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  filters.forEach((filter, index) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'filter-control';

    if (filter.toggle) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `document-filter-toggle-${index}`;
      checkbox.checked = domainFilterState.toggles[index] === true;
      checkbox.addEventListener('change', () => {
        domainFilterState.toggles[index] = checkbox.checked;
        renderDocumentsDomain();
      });

      const text = document.createElement('span');
      text.textContent = filter.label;
      wrapper.appendChild(checkbox);
      wrapper.appendChild(text);
      container.appendChild(wrapper);
      return;
    }

    const text = document.createElement('span');
    text.textContent = filter.label;
    wrapper.appendChild(text);

    let control;
    if (Array.isArray(filter.options)) {
      control = document.createElement('select');
      const all = document.createElement('option');
      all.value = '';
      all.textContent = 'Todos';
      control.appendChild(all);

      for (const optionValue of filter.options) {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        control.appendChild(option);
      }
    } else {
      control = document.createElement('input');
      control.type = 'text';
      control.autocomplete = 'off';
    }

    control.id = `document-filter-${index}`;
    control.value = domainFilterState.values[index] ?? filter.value ?? '';
    control.addEventListener('change', () => {
      domainFilterState.values[index] = control.value;
      renderDocumentsDomain();
    });

    wrapper.appendChild(control);
    container.appendChild(wrapper);
  });
}

function documentActionsFor(record) {
  const domain = domainConfig();
  const actions = domain && Array.isArray(domain.transitionActions) ? domain.transitionActions : [];

  return actions
    .filter((action) => action.from === record.status)
    .map((action) => {
      const blocked = action.requires ? !evaluatePredicate(action.requires, record) : false;
      return {
        ...action,
        blocked,
        blockedReason: blocked ? action.message || 'Complete los datos requeridos antes de ejecutar esta acción.' : ''
      };
    });
}

function renderDomainForms(record) {
  for (const name of ['execution', 'quality']) {
    const panel = $(`document-${name}-panel`);
    const title = $(`document-${name}-title`);
    const submit = $(`document-${name}-submit`);
    const fields = $(`document-${name}-fields`);
    const formSpec = resolveForm(currentConfig, name);

    if (!formSpec || !record) {
      if (panel) {
        panel.hidden = true;
      }
      continue;
    }

    if (panel) {
      panel.hidden = false;
    }

    if (title) {
      title.textContent = formSpec.title;
    }

    if (submit) {
      submit.textContent = formSpec.submitLabel;
    }

    renderDomainForm(fields, formSpec, documentCustomFields(), { idPrefix: `document-${name}` });
    fillDomainForm(fields, record);
  }
}

function selectDocument(id) {
  selectedDocumentId = id;
  renderDocumentsDomain();
}

function renderDocumentsDomain() {
  const section = $('documents-domain');
  const domain = domainConfig();

  if (!domain) {
    if (section) {
      section.hidden = true;
    }
    return;
  }

  if (section) {
    section.hidden = false;
  }

  setText('document-list-heading', currentConfig.labels.documents);
  setText('document-indicators-heading', 'Indicadores');

  const filters = resolveFilters(currentConfig);
  renderDomainFilters(filters);

  const entities = loadEntities();
  const allDocuments = loadDocuments();
  const visibleDocuments = applyFilters(allDocuments, activeDomainFilters(filters));

  if (selectedDocumentId && !allDocuments.some((record) => record.id === selectedDocumentId)) {
    selectedDocumentId = null;
  }

  renderDocumentList($('document-list'), {
    documents: visibleDocuments,
    entities,
    columns: resolveColumns(currentConfig),
    selectedId: selectedDocumentId,
    config: currentConfig,
    emptyLabel: `No hay ${lowerLabel(currentConfig.labels.documents)} para los filtros seleccionados.`,
    onSelect: selectDocument
  });

  const selected = findDocumentById(selectedDocumentId);

  renderDocumentDetail($('document-detail'), {
    documentRecord: selected,
    entity: findEntityForDocument(selected),
    sections: resolveDetailSections(currentConfig),
    config: currentConfig,
    actions: selected ? documentActionsFor(selected) : [],
    onAction: runDocumentAction,
    emptyLabel: `Seleccione ${articleFor(currentConfig.labels.document)} ${lowerLabel(currentConfig.labels.document)} para ver el detalle.`
  });

  renderDomainForms(selected);

  renderIndicators($('document-indicators'), {
    indicators: Array.isArray(domain.indicators) ? domain.indicators : [],
    records: allDocuments
  });

  renderCostSummary($('document-costs'), {
    costSummary: domain.costSummary || null,
    records: allDocuments
  });
}

function runDocumentAction(action) {
  const record = findDocumentById(selectedDocumentId);

  if (!record || !action) {
    return;
  }

  if (action.blocked || (action.requires && !evaluatePredicate(action.requires, record))) {
    showDomainFeedback(
      action.blockedReason || action.message || 'Complete los datos requeridos antes de ejecutar esta acción.'
    );
    return;
  }

  const noteControl = $('document-action-note');
  const note = noteControl ? noteControl.value.trim() : '';
  const updates = { status: action.to };

  if (note !== '') {
    updates.notes = record.notes ? `${record.notes}\n${note}` : note;
  }

  try {
    updateDocument(record.id, updates);
  } catch (error) {
    showDomainFeedback(error.message || 'No se pudo actualizar la orden.');
    return;
  }

  if (noteControl) {
    noteControl.value = '';
  }

  showDomainFeedback('');
  renderDocumentSelects();
  refreshStats();
  renderDocumentsDomain();
  runSearch();
}

function saveDomainForm(name) {
  const record = findDocumentById(selectedDocumentId);
  const formSpec = resolveForm(currentConfig, name);

  if (!record || !formSpec) {
    return;
  }

  const values = collectDomainForm($(`document-${name}-fields`));
  const merged = { ...record, ...values };
  const validation = validateDocument(merged);

  if (!validation.valid) {
    showDomainFeedback(Object.values(validation.errors).join(' '));
    return;
  }

  try {
    updateDocument(record.id, values);
  } catch (error) {
    showDomainFeedback(error.message || 'No se pudo guardar la información.');
    return;
  }

  showDomainFeedback('');
  renderDocumentSelects();
  refreshStats();
  renderDocumentsDomain();
  runSearch();
}

function wireDomainForms() {
  for (const name of ['execution', 'quality']) {
    const form = $(`document-${name}-form`);
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        saveDomainForm(name);
      });
    }
  }
}

function resetEntityForm() {
  setText('entity-form-heading', `Agregar / Editar ${currentConfig.labels.entity}`);
  setText('submit-button', 'Guardar');

  if ($('entity-id')) {
    $('entity-id').value = '';
  }

  for (const id of ENTITY_INPUTS) {
    if ($(id)) {
      $(id).value = '';
    }
  }

  fillCustomValues(entityCustomFields(), {});
  clearErrors($('entity-form'));
}

function fillEntityForm(entity) {
  $('entity-id').value = entity.id;

  for (const id of ENTITY_INPUTS) {
    if ($(id)) {
      $(id).value = entity[id] === undefined || entity[id] === null ? '' : String(entity[id]);
    }
  }

  fillCustomValues(entityCustomFields(), entity);
  setText('submit-button', 'Actualizar');
  clearErrors($('entity-form'));
}

function collectEntityForm() {
  const data = {};
  for (const id of ENTITY_INPUTS) {
    if ($(id)) {
      data[id] = $(id).value;
    }
  }
  Object.assign(data, collectCustomValues(entityCustomFields()));
  return data;
}

function showEntityErrors(errors) {
  clearErrors($('entity-form'));
  const customKeys = new Set(entityCustomFields().map((field) => field.key));

  for (const [key, message] of Object.entries(errors)) {
    const id = customKeys.has(key) ? `error-cf-${key}` : `error-${key}`;
    const element = $(id);
    if (element) {
      element.textContent = message;
    }
  }
}

function resetDocumentForm() {
  setText('document-form-heading', `Agregar / Editar ${currentConfig.labels.document}`);
  setText('document-submit-button', 'Guardar Documento');

  if ($('document-id')) {
    $('document-id').value = '';
  }

  for (const id of DOCUMENT_INPUTS) {
    if ($(id)) {
      $(id).value = '';
    }
  }

  if ($('docPaymentTerms')) {
    $('docPaymentTerms').value = '';
  }

  if ($('document-entity')) {
    $('document-entity').value = '';
  }

  buildStatusControl(null);
  fillCustomValues(documentCustomFields(), {});
  clearErrors($('document-form'));
}

function fillDocumentForm(documentRecord) {
  $('document-id').value = documentRecord.id;

  if ($('document-entity')) {
    $('document-entity').value = documentRecord.entity_id || '';
  }

  for (const id of DOCUMENT_INPUTS) {
    if ($(id)) {
      $(id).value = documentRecord[id] === undefined || documentRecord[id] === null ? '' : String(documentRecord[id]);
    }
  }

  if ($('docPaymentTerms')) {
    $('docPaymentTerms').value =
      documentRecord.paymentTerms === undefined || documentRecord.paymentTerms === null
        ? ''
        : String(documentRecord.paymentTerms);
  }

  buildStatusControl(documentRecord.status || null);
  fillCustomValues(documentCustomFields(), documentRecord);
  setText('document-submit-button', 'Actualizar Documento');
  clearErrors($('document-form'));
}

function collectDocumentForm() {
  const data = {
    entity_id: $('document-entity') ? $('document-entity').value : '',
    status: statusValue(),
    paymentTerms: $('docPaymentTerms') ? $('docPaymentTerms').value : ''
  };

  for (const id of DOCUMENT_INPUTS) {
    if ($(id)) {
      data[id] = $(id).value;
    }
  }

  Object.assign(data, collectCustomValues(documentCustomFields()));
  return data;
}

function showDocumentErrors(errors) {
  clearErrors($('document-form'));
  const customKeys = new Set(documentCustomFields().map((field) => field.key));

  for (const [key, message] of Object.entries(errors)) {
    const id = customKeys.has(key) ? `error-cf-${key}` : `error-${key}`;
    const element = $(id);
    if (element) {
      element.textContent = message;
    }
  }
}

function matchesQuery(record, query, extraValues = []) {
  if (query === '') {
    return false;
  }

  const values = [...Object.values(record || {}), ...extraValues];
  return values.some((value) =>
    String(value ?? '')
      .toLowerCase()
      .includes(query)
  );
}

function runSearch() {
  const input = $('search-input');
  const list = $('search-results-list');
  const empty = $('search-empty');
  if (!input || !list || !empty) {
    return;
  }

  const term = input.value;
  const query = String(term ?? '')
    .trim()
    .toLowerCase();
  const entities = loadEntities();
  const documents = loadDocuments();
  const results = searchEntities(term);
  const labels = resolveFieldLabels(currentConfig);
  const fields = entityCustomFields();
  const badgeKeys = entityBadgeFieldKeys();
  const matchedEntityIds = new Set(results.map((entity) => entity.entity_id));
  const matchedDocuments = [];

  if (query !== '') {
    for (const record of documents) {
      const entity = entities.find((item) => item.entity_id === record.entity_id) || null;
      if (
        matchedEntityIds.has(record.entity_id) ||
        matchesQuery(record, query, [entity ? entity.name : '', entity ? entity.code : ''])
      ) {
        matchedDocuments.push({ record, entity });
      }
    }
  }

  list.innerHTML = '';

  if (query === '' || (results.length === 0 && matchedDocuments.length === 0)) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  for (const entity of results) {
    const item = document.createElement('div');
    item.className = 'entity-item';

    const title = document.createElement('div');
    title.className = 'entity-title';
    title.textContent = `${entity.name} — ${entity.code}`;
    item.appendChild(title);

    const displayed = new Set();

    for (const field of fields) {
      const value = entity[field.key];
      if (value !== undefined && value !== null && value !== '') {
        const line = document.createElement('div');
        line.className = 'entity-custom';
        line.textContent = `${field.label}: ${value}`;
        item.appendChild(line);
        displayed.add(field.key);
      }
    }

    for (const key of badgeKeys) {
      if (displayed.has(key)) {
        continue;
      }
      const line = document.createElement('div');
      line.className = 'entity-custom';
      line.textContent = `${labels[key] || key}: ${formatValue(entity[key])}`;
      item.appendChild(line);
      displayed.add(key);
    }

    if (entity.targetDate !== undefined && entity.targetDate !== null && entity.targetDate !== '') {
      const line = document.createElement('div');
      line.className = 'entity-custom';
      line.textContent = `${labels.targetDate}: ${formatValue(entity.targetDate)}`;
      item.appendChild(line);
    }

    const badgeBox = document.createElement('div');
    badgeBox.className = 'badge-row';
    renderBadges(badgeBox, entity, currentConfig, 'entity');
    if (badgeBox.childNodes.length > 0) {
      item.appendChild(badgeBox);
    }

    for (const documentRecord of documents.filter((document) => document.entity_id === entity.entity_id)) {
      const badge = document.createElement('span');
      badge.className = 'status-badge';
      badge.textContent = documentRecord.status || '';
      item.appendChild(badge);
    }

    list.appendChild(item);
  }

  for (const { record, entity } of matchedDocuments) {
    const item = document.createElement('div');
    item.className = 'entity-item document-item';
    item.dataset.documentId = record.id;

    const title = document.createElement('div');
    title.className = 'entity-title';
    const series = record.series ? `${record.series} — ` : '';
    title.textContent = `${series}${formatValue(record.folio)}`;
    item.appendChild(title);

    const product = document.createElement('div');
    product.className = 'entity-custom';
    product.textContent = `Producto: ${entity ? `${entity.name} — ${entity.code}` : formatValue(record.entity_id)}`;
    item.appendChild(product);

    const status = document.createElement('div');
    status.className = 'entity-custom';
    status.textContent = `Estado: ${formatValue(record.status)}`;
    item.appendChild(status);

    const dates = document.createElement('div');
    dates.className = 'entity-custom';
    dates.textContent = `Fecha de fin: ${formatValue(record.endDate)}`;
    item.appendChild(dates);

    const badgeBox = document.createElement('div');
    badgeBox.className = 'badge-row';
    renderBadges(badgeBox, record, currentConfig, 'document');
    if (badgeBox.childNodes.length > 0) {
      item.appendChild(badgeBox);
    }

    list.appendChild(item);
  }
}

function wireNavigation() {
  document.querySelectorAll('.nav-module').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.module;

      if (target === 'entities') {
        renderEntitySelects();
      }

      if (target === 'documents') {
        renderEntitySelects();
        renderDocumentSelects();
        renderDocumentsDomain();
      }

      showView(target);

      if (target === 'dashboard') {
        refreshStats();
      }

      if (target === 'search') {
        runSearch();
      }
    });
  });
}

function wireQuickActions() {
  const newEntity = $('action-new-entity');
  if (newEntity) {
    newEntity.addEventListener('click', () => {
      showView('entities');
      renderEntitySelects();
      resetEntityForm();
      if ($('name')) {
        $('name').focus();
      }
    });
  }

  const newDocument = $('action-new-document');
  if (newDocument) {
    newDocument.addEventListener('click', () => {
      showView('documents');
      renderEntitySelects();
      renderDocumentSelects();
      renderDocumentsDomain();
      resetDocumentForm();
      if ($('document-entity')) {
        $('document-entity').focus();
      }
    });
  }

  const openEntities = $('action-open-entities');
  if (openEntities) {
    openEntities.addEventListener('click', () => {
      showView('entities');
      renderEntitySelects();
    });
  }

  const find = $('action-find');
  if (find) {
    find.addEventListener('click', () => {
      showView('search');
      if ($('search-input')) {
        $('search-input').focus();
      }
      runSearch();
    });
  }
}

function wireEntityForm() {
  const form = $('entity-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = collectEntityForm();
      const result = validateEntity(data);

      if (!result.valid) {
        showEntityErrors(result.errors);
        return;
      }

      const id = $('entity-id') ? $('entity-id').value : '';
      try {
        if (id) {
          updateEntity(id, data);
        } else {
          addEntity(data);
        }
      } catch (error) {
        showEntityErrors(error.errors || { name: error.message || 'No se pudo guardar.' });
        return;
      }

      resetEntityForm();
      renderEntitySelects();
      renderDocumentSelects();
      renderDocumentsDomain();
      refreshStats();
      runSearch();
    });
  }

  const edit = $('edit-entity');
  if (edit) {
    edit.addEventListener('change', () => {
      const id = edit.value;
      if (!id) {
        resetEntityForm();
        return;
      }
      const entity = loadEntities().find((item) => item.id === id);
      if (entity) {
        fillEntityForm(entity);
      } else {
        resetEntityForm();
      }
    });
  }

  const remove = $('delete-entity');
  if (remove) {
    remove.addEventListener('click', () => {
      const id = ($('entity-id') ? $('entity-id').value : '') || ($('edit-entity') ? $('edit-entity').value : '');
      if (!id) {
        return;
      }
      const entity = loadEntities().find((item) => item.id === id);
      if (!entity) {
        return;
      }
      const message = `¿Eliminar "${entity.name}" y todos sus ${lowerLabel(currentConfig.labels.documents)} asociados?`;
      const confirmed = typeof confirm === 'function' ? confirm(message) : true;
      if (!confirmed) {
        return;
      }
      deleteEntity(id);
      resetEntityForm();
      renderEntitySelects();
      renderDocumentSelects();
      renderDocumentsDomain();
      refreshStats();
      runSearch();
    });
  }
}

function wireDocumentForm() {
  const form = $('document-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = collectDocumentForm();
      const result = validateDocument(data);

      if (!result.valid) {
        showDocumentErrors(result.errors);
        return;
      }

      const id = $('document-id') ? $('document-id').value : '';

      try {
        if (id) {
          updateDocument(id, data);
        } else {
          addDocument(data);
        }
      } catch (error) {
        showDocumentErrors({ status: error.message });
        return;
      }

      resetDocumentForm();
      renderDocumentSelects();
      renderEntitySelects();
      renderDocumentsDomain();
      refreshStats();
      runSearch();
    });
  }

  const edit = $('edit-document');
  if (edit) {
    edit.addEventListener('change', () => {
      const id = edit.value;
      if (!id) {
        resetDocumentForm();
        selectedDocumentId = null;
        renderDocumentsDomain();
        return;
      }
      const documentRecord = loadDocuments().find((item) => item.id === id);
      if (documentRecord) {
        fillDocumentForm(documentRecord);
        selectedDocumentId = id;
        renderDocumentsDomain();
      } else {
        resetDocumentForm();
      }
    });
  }

  const remove = $('delete-document');
  if (remove) {
    remove.addEventListener('click', () => {
      const id =
        ($('document-id') ? $('document-id').value : '') || ($('edit-document') ? $('edit-document').value : '');
      if (!id) {
        return;
      }
      const confirmed =
        typeof confirm === 'function'
          ? confirm(
              `¿Eliminar ${articleFor(currentConfig.labels.document)} ${lowerLabel(currentConfig.labels.document)} ${selectedSuffix(currentConfig.labels.document)}?`
            )
          : true;
      if (!confirmed) {
        return;
      }
      deleteDocument(id);
      if (selectedDocumentId === id) {
        selectedDocumentId = null;
      }
      resetDocumentForm();
      renderDocumentSelects();
      renderDocumentsDomain();
      refreshStats();
      runSearch();
    });
  }
}

function wireSearch() {
  const input = $('search-input');
  if (input) {
    input.addEventListener('input', runSearch);
  }
}

export async function initApp(result) {
  let config;
  let errors;

  if (result && result.config) {
    config = result.config;
    errors = result.errors || [];
  } else {
    const normalized = normalizeConfig(result);
    config = normalized.config;
    errors = normalized.errors;
  }

  currentConfig = config;
  setActiveConfig(config);
  resetDomainState();

  applyShell(config);
  applyDashboard(config);
  applyViewLabels();

  renderCustomFields($('entity-custom-fields'), entityCustomFields());
  renderCustomFields($('document-custom-fields'), documentCustomFields());

  buildStatusControl(null);

  wireNavigation();
  wireQuickActions();
  wireEntityForm();
  wireDocumentForm();
  wireDomainForms();
  wireSearch();

  renderEntitySelects();
  renderDocumentSelects();
  renderDocumentsDomain();
  resetEntityForm();
  resetDocumentForm();
  refreshStats();
  showView('dashboard');
  showConfigErrors(errors);

  return config;
}

export async function boot() {
  const result = await loadModuleConfig();
  return initApp(result);
}
