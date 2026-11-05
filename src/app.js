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

const ENTITY_INPUTS = ['name', 'code', 'taxId', 'email', 'phone', 'address', 'category', 'description', 'targetDate', 'creditLimit', 'paymentTerms'];
const DOCUMENT_INPUTS = ['series', 'folio', 'startDate', 'endDate', 'quantity', 'subtotal', 'discount', 'taxAmount', 'totalAmount', 'currency', 'notes'];

let currentConfig = null;

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
  return (currentConfig && currentConfig.customFields ? currentConfig.customFields : []).filter((field) => field.target === 'entity');
}

function documentCustomFields() {
  return (currentConfig && currentConfig.customFields ? currentConfig.customFields : []).filter((field) => field.target === 'document');
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
  setText('delete-entity', `Eliminar ${articleFor(labels.entity)} ${lowerLabel(labels.entity)} ${selectedSuffix(labels.entity)}`);

  setText('documents-view-heading', labels.documents);
  setText('document-form-heading', `Agregar / Editar ${labels.document}`);
  setText('edit-document-heading', `Editar o eliminar ${articleFor(labels.document)} ${lowerLabel(labels.document)}`);
  setText('delete-document', `Eliminar ${articleFor(labels.document)} ${lowerLabel(labels.document)} ${selectedSuffix(labels.document)}`);

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
    $('docPaymentTerms').value = documentRecord.paymentTerms === undefined || documentRecord.paymentTerms === null ? '' : String(documentRecord.paymentTerms);
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

function runSearch() {
  const input = $('search-input');
  const list = $('search-results-list');
  const empty = $('search-empty');
  if (!input || !list || !empty) {
    return;
  }

  const term = input.value;
  const results = searchEntities(term);
  const documents = loadDocuments();
  const fields = entityCustomFields();

  list.innerHTML = '';

  if (String(term).trim() === '' || results.length === 0) {
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

    for (const field of fields) {
      const value = entity[field.key];
      if (value !== undefined && value !== null && value !== '') {
        const line = document.createElement('div');
        line.className = 'entity-custom';
        line.textContent = `${field.label}: ${value}`;
        item.appendChild(line);
      }
    }

    for (const documentRecord of documents.filter((document) => document.entity_id === entity.entity_id)) {
      const badge = document.createElement('span');
      badge.className = 'status-badge';
      badge.textContent = documentRecord.status || '';
      item.appendChild(badge);
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
      if (id) {
        updateEntity(id, data);
      } else {
        addEntity(data);
      }

      resetEntityForm();
      renderEntitySelects();
      refreshStats();
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
      const message = `¿Eliminar "${entity.name}" y todos sus documentos asociados?`;
      const confirmed = typeof confirm === 'function' ? confirm(message) : true;
      if (!confirmed) {
        return;
      }
      deleteEntity(id);
      resetEntityForm();
      renderEntitySelects();
      renderDocumentSelects();
      refreshStats();
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
      refreshStats();
    });
  }

  const edit = $('edit-document');
  if (edit) {
    edit.addEventListener('change', () => {
      const id = edit.value;
      if (!id) {
        resetDocumentForm();
        return;
      }
      const documentRecord = loadDocuments().find((item) => item.id === id);
      if (documentRecord) {
        fillDocumentForm(documentRecord);
      } else {
        resetDocumentForm();
      }
    });
  }

  const remove = $('delete-document');
  if (remove) {
    remove.addEventListener('click', () => {
      const id = ($('document-id') ? $('document-id').value : '') || ($('edit-document') ? $('edit-document').value : '');
      if (!id) {
        return;
      }
      const confirmed = typeof confirm === 'function' ? confirm('¿Eliminar el documento seleccionado?') : true;
      if (!confirmed) {
        return;
      }
      deleteDocument(id);
      resetDocumentForm();
      renderDocumentSelects();
      refreshStats();
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
  wireSearch();

  renderEntitySelects();
  renderDocumentSelects();
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
