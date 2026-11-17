import { labelFor, loadModuleConfig, normalizeConfig, setActiveConfig } from './module-config.js';
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
import {
  applyShell,
  showView,
  showDocumentTab,
  DOCUMENT_TAB_NAMES,
  articleFor,
  lowerLabel,
  selectedSuffix
} from './components/shell.js';
import { applyDashboard, refreshStats } from './components/dashboard.js';
import { renderCustomFields, collectCustomValues, fillCustomValues } from './components/custom-fields.js';
import {
  resolveColumns,
  resolveFilters,
  resolveDetailSections,
  resolveForm,
  resolveFieldLabels,
  applyFilters,
  formatStatus,
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
import { normalizeAccess, authenticate, authenticationError, can } from './domain/access.js';
import { loadSession, saveSession, clearSession } from './session.js';
import { renderLogin, setLoginError } from './components/login.js';

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
let activeDocumentTab = 'orders';
let activeAccess = null;
let activeSession = null;
const domainFilterState = { values: {}, toggles: {} };

const VIEW_ORDER = ['dashboard', 'entities', 'documents', 'search'];
const ENTITY_ACTION_IDS = ['entity.create', 'entity.update', 'entity.delete'];
const DOCUMENT_ACTION_IDS = ['document.create', 'document.update', 'document.delete'];

function accessEnabled() {
  return Boolean(activeAccess && activeAccess.enabled);
}

/** true cuando no hay control de acceso o el rol activo concede la capacidad. */
function granted(capability, context) {
  if (!accessEnabled() || !activeSession) {
    return true;
  }
  return can(activeSession.grants, capability, context);
}

function grantedAny(capability, contexts) {
  return contexts.some((context) => granted(capability, context));
}

function accessMessage() {
  return (
    (activeAccess && activeAccess.labels && activeAccess.labels.denied) ||
    'Su rol actual no tiene permisos para realizar esta acción.'
  );
}

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
  setText('document-tab-orders-label', labels.documents);
  setText('document-tab-form-label', `Agregar / Editar ${labels.document}`);
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
        option.textContent = formatStatus(status);
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
        option.textContent = formatStatus(status);
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

function setDocumentTab(name, focusTab = false) {
  if (!DOCUMENT_TAB_NAMES.includes(name)) {
    return;
  }
  activeDocumentTab = name;
  showDocumentTab(name);
  if (focusTab) {
    document.getElementById(`document-tab-${name}`)?.focus();
  }
}

function applyDocumentTabLabels() {
  for (const name of ['execution', 'quality']) {
    const formSpec = resolveForm(currentConfig, name);
    setText(`document-tab-${name}-label`, formSpec ? formSpec.title : name);
    const tab = $(`document-tab-${name}`);
    if (tab) {
      tab.dataset.formMissing = String(!formSpec);
      tab.hidden = !formSpec;
    }
  }
}

function wireDocumentTabs() {
  const tablist = $('document-tabs');
  if (!tablist) {
    return;
  }

  tablist.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-document-tab]');
    if (tab) {
      setDocumentTab(tab.dataset.documentTab, true);
    }
  });

  tablist.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }
    const tabs = [...tablist.querySelectorAll('[data-document-tab]')].filter((tab) => !tab.hidden);
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) {
      return;
    }
    event.preventDefault();

    let next;
    if (event.key === 'ArrowRight') {
      next = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      next = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else {
      next = tabs.length - 1;
    }
    setDocumentTab(tabs[next].dataset.documentTab, true);
  });
}

function resetDomainState() {
  selectedDocumentId = null;
  activeDocumentTab = 'orders';
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
    if (filter.key && !granted('filters', filter.key)) {
      return;
    }

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
        option.textContent = filter.key === 'status' ? formatStatus(optionValue) : optionValue;
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
    .filter((action) => action.from === record.status && granted('transitions', { from: action.from, to: action.to }))
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
    const sectionAllowed = granted('sections', name);
    const tab = $(`document-tab-${name}`);
    if (tab) {
      tab.hidden = !sectionAllowed || tab.dataset.formMissing === 'true';
    }

    const panel = $(`document-${name}-panel`);
    if (!sectionAllowed) {
      if (panel) {
        panel.hidden = true;
      }
      continue;
    }
    const empty = $(`document-${name}-empty`);
    const title = $(`document-${name}-title`);
    const submit = $(`document-${name}-submit`);
    const fields = $(`document-${name}-fields`);
    const formSpec = resolveForm(currentConfig, name);

    if (empty) {
      empty.hidden = !formSpec || Boolean(record);
    }

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
    renderDomainFormPermissions(name, record);
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
    showDocumentTab('form');
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
  const sections = resolveDetailSections(currentConfig).filter((section) =>
    granted('sections', section.id || String(section.title || '').toLowerCase())
  );

  renderDocumentDetail($('document-detail'), {
    documentRecord: selected,
    entity: findEntityForDocument(selected),
    sections,
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

  if (!granted('views', 'documents')) {
    return;
  }
  if (['execution', 'quality'].includes(activeDocumentTab) && !granted('sections', activeDocumentTab)) {
    activeDocumentTab = 'orders';
  }
  showDocumentTab(activeDocumentTab);
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

  if (!granted('transitions', { from: record.status, to: action.to })) {
    showDomainFeedback(accessMessage());
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
    const documentLabel = labelFor('document');
    showDomainFeedback(
      error.message || `No se pudo actualizar ${articleFor(documentLabel)} ${lowerLabel(documentLabel)}.`
    );
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

  if (!granted('sections', name) || !granted('actions', 'document.update')) {
    showDomainFeedback(accessMessage());
    return;
  }

  const values = collectDomainForm($(`document-${name}-fields`));
  const deniedField = Object.keys(values).find((field) => !granted('fields', { target: 'document', field }));
  if (deniedField) {
    showDomainFeedback(accessMessage());
    return;
  }

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
  const stockFilter = $('search-stock-only');
  const searchBadge = domainConfig()?.badges?.find((badge) => badge.searchLabel);
  const stockOnly = stockFilter?.checked && searchBadge;
  const matchingEntities = query === '' ? entities : searchEntities(term);
  const results = stockOnly
    ? matchingEntities.filter((entity) => evaluatePredicate(searchBadge.when, entity))
    : matchingEntities;
  const labels = resolveFieldLabels(currentConfig);
  const fields = entityCustomFields();
  const badgeKeys = entityBadgeFieldKeys();
  const matchedEntityIds = new Set(results.map((entity) => entity.entity_id));
  const matchedDocuments = [];

  if (query !== '' && !stockOnly) {
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

  if (results.length === 0 && matchedDocuments.length === 0) {
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
      badge.textContent = documentRecord.status ? formatStatus(documentRecord.status) : '';
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
    product.textContent = `${labelFor('entity')}: ${entity ? `${entity.name} — ${entity.code}` : formatValue(record.entity_id)}`;
    item.appendChild(product);

    const status = document.createElement('div');
    status.className = 'entity-custom';
    status.textContent = `Estado: ${formatStatus(record.status)}`;
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
      if (!granted('views', target)) {
        showDomainFeedback(accessMessage());
        return;
      }

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
      setDocumentTab('form');
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
  if (!input) {
    return;
  }

  const stockFilter = $('search-stock-only');
  const searchBadge = domainConfig()?.badges?.find((badge) => badge.searchLabel);
  if (searchBadge && stockFilter) {
    $('search-stock-filter').hidden = false;
    setText('search-stock-label', searchBadge.searchLabel);
    stockFilter.addEventListener('change', runSearch);
  }

  input.addEventListener('input', runSearch);
  $('search-clear')?.addEventListener('click', () => {
    input.value = '';
    if (stockFilter) {
      stockFilter.checked = false;
    }
    runSearch();
    input.focus();
  });
}

function renderDomainFormPermissions(name, record) {
  if (!record) {
    return;
  }
  const formSpec = resolveForm(currentConfig, name);
  if (!formSpec) {
    return;
  }
  for (const field of formSpec.fields) {
    const control = $(`document-${name}-${field.key}`);
    if (control) {
      control.disabled = !granted('fields', { target: 'document', field: field.key });
    }
  }
}

function updateActiveRole() {
  const role =
    activeSession && activeAccess ? activeAccess.roles.find((item) => item.id === activeSession.roleId) : null;
  setText('active-role', role ? role.label : '');
  const indicator = $('session-indicator');
  if (indicator) {
    indicator.hidden = !role;
  }
}

function firstAllowedView() {
  return VIEW_ORDER.find((view) => granted('views', view)) || 'dashboard';
}

function applyPermissions() {
  document.querySelectorAll('.nav-module').forEach((button) => {
    button.hidden = !granted('views', button.dataset.module);
  });

  const viewActions = {
    'action-new-entity': 'entities',
    'action-open-entities': 'entities',
    'action-find': 'search'
  };
  for (const [id, view] of Object.entries(viewActions)) {
    const button = $(id);
    if (button) {
      button.hidden = !granted('views', view);
    }
  }

  const newDocument = $('action-new-document');
  if (newDocument) {
    newDocument.hidden = !granted('views', 'documents') || !granted('actions', 'document.create');
  }

  const buttonGuards = [
    ['submit-button', grantedAny('actions', ENTITY_ACTION_IDS)],
    ['delete-entity', granted('actions', 'entity.delete')],
    ['delete-document', granted('actions', 'document.delete')]
  ];
  for (const [id, allowed] of buttonGuards) {
    const button = $(id);
    if (button) {
      button.disabled = !allowed;
    }
  }

  for (const formId of ['document-form']) {
    const form = $(formId);
    if (form) {
      form.querySelectorAll('button[type="submit"]').forEach((button) => {
        button.disabled = !grantedAny('actions', DOCUMENT_ACTION_IDS);
      });
    }
  }

  for (const name of ['execution', 'quality']) {
    const form = $(`document-${name}-form`);
    if (form) {
      form.querySelectorAll('button[type="submit"]').forEach((button) => {
        button.disabled = !granted('actions', 'document.update') || !granted('sections', name);
      });
    }
    const tab = $(`document-tab-${name}`);
    if (tab) {
      tab.hidden = !granted('sections', name) || tab.dataset.formMissing === 'true';
    }
  }

  for (const field of entityCustomFields()) {
    const control = $(`cf-${field.key}`);
    if (control) {
      control.disabled = !granted('fields', { target: 'entity', field: field.key });
    }
  }
  for (const field of documentCustomFields()) {
    const control = $(`cf-${field.key}`);
    if (control) {
      control.disabled = !granted('fields', { target: 'document', field: field.key });
    }
  }
  for (const id of ENTITY_INPUTS) {
    const control = $(id);
    if (control) {
      control.disabled = !granted('fields', { target: 'entity', field: id });
    }
  }
  for (const id of DOCUMENT_INPUTS) {
    const control = $(id);
    if (control) {
      control.disabled = !granted('fields', { target: 'document', field: id });
    }
  }
  const status = $('status');
  if (status) {
    status.disabled = !granted('fields', { target: 'document', field: 'status' });
  }
}

function showWorkspace() {
  const shell = $('app-shell');
  const login = $('view-login');
  if (shell) {
    shell.hidden = false;
  }
  if (login) {
    login.hidden = true;
  }

  updateActiveRole();
  applyPermissions();
  showView(firstAllowedView());
  renderEntitySelects();
  renderDocumentSelects();
  renderDocumentsDomain();
  resetEntityForm();
  resetDocumentForm();
  refreshStats();
}

function showLoginScreen(message = '') {
  const shell = $('app-shell');
  const login = $('view-login');
  for (const id of ['view-dashboard', 'view-entities', 'view-documents', 'view-search']) {
    const view = $(id);
    if (view) {
      view.hidden = true;
    }
  }
  if (shell) {
    shell.hidden = true;
  }
  if (login) {
    login.hidden = false;
    renderLogin(login, activeAccess, (roleId, secret) => {
      const result = signIn(roleId, secret);
      if (!result.ok) {
        setLoginError(result.message);
      }
    });
  }
  setLoginError(message);
}

function enterApp() {
  if (!accessEnabled()) {
    activeSession = null;
    showWorkspace();
    return;
  }

  const stored = loadSession(activeAccess.sessionKey);
  const role = stored ? activeAccess.roles.find((item) => item.id === stored.roleId) : null;
  if (!role) {
    if (stored) {
      clearSession(activeAccess.sessionKey);
    }
    activeSession = null;
    showLoginScreen();
    return;
  }

  activeSession = saveSession(activeAccess.sessionKey, { roleId: role.id, grants: role.grants });
  showWorkspace();
}

export function signIn(roleId, secret) {
  if (!accessEnabled()) {
    return { ok: false, message: 'El acceso por cargo no está disponible.' };
  }
  const session = authenticate(activeAccess, roleId, secret);
  if (!session) {
    return { ok: false, message: authenticationError(activeAccess, roleId, secret) };
  }
  activeSession = saveSession(activeAccess.sessionKey, { roleId: session.roleId, grants: session.grants });
  showWorkspace();
  return { ok: true, session: activeSession };
}

export function signOut() {
  if (activeAccess) {
    clearSession(activeAccess.sessionKey);
  }
  activeSession = null;
  showLoginScreen();
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
  activeAccess = normalizeAccess(config.domain && config.domain.access, config.statusLifecycle);

  applyShell(config);
  applyDashboard(config);
  applyViewLabels();
  applyDocumentTabLabels();

  renderCustomFields($('entity-custom-fields'), entityCustomFields());
  renderCustomFields($('document-custom-fields'), documentCustomFields());

  buildStatusControl(null);

  wireNavigation();
  wireDocumentTabs();
  wireQuickActions();
  wireEntityForm();
  wireDocumentForm();
  wireDomainForms();
  wireSearch();

  const logout = $('logout');
  if (logout) {
    logout.addEventListener('click', signOut);
  }

  renderEntitySelects();
  renderDocumentSelects();
  renderDocumentsDomain();
  resetEntityForm();
  resetDocumentForm();
  refreshStats();
  enterApp();
  showConfigErrors(errors);

  return config;
}

export async function boot() {
  const result = await loadModuleConfig();
  return initApp(result);
}
