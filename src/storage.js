import { getConfig } from './module-config.js';

const ENTITIES_KEY = 'erp_base_module:entities';
const DOCUMENTS_KEY = 'erp_base_module:documents';

const ENTITY_TEXT_FIELDS = ['name', 'code', 'taxId', 'email', 'phone', 'address', 'category', 'description', 'targetDate', 'paymentTerms'];
const DOCUMENT_TEXT_FIELDS = ['series', 'startDate', 'endDate', 'currency', 'paymentTerms', 'notes', 'status'];
const DOCUMENT_NUMBER_FIELDS = ['folio', 'quantity', 'subtotal', 'discount', 'taxAmount', 'totalAmount'];

let sequence = 0;

function store() {
  return globalThis.localStorage;
}

function readList(key) {
  try {
    const raw = store().getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, value) {
  store().setItem(key, JSON.stringify(value));
}

function uid(prefix) {
  sequence += 1;
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `${prefix}_${cryptoApi.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${sequence}_${Math.random().toString(36).slice(2, 10)}`;
}

function now() {
  return new Date().toISOString();
}

function getCustomFields(target) {
  const config = getConfig();
  const fields = Array.isArray(config.customFields) ? config.customFields : [];
  return fields.filter((field) => field.target === target);
}

function getLifecycle() {
  const config = getConfig();
  return config && config.statusLifecycle ? config.statusLifecycle : null;
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function coerce(field, value) {
  if (isBlank(value)) {
    return undefined;
  }
  if (field.type === 'number') {
    return Number(value);
  }
  return String(value);
}

function coerceNumber(value) {
  if (isBlank(value)) {
    return undefined;
  }
  return Number(value);
}

function validateCustomFields(target, record, errors) {
  for (const field of getCustomFields(target)) {
    const value = record[field.key];

    if (field.required && isBlank(value)) {
      errors[field.key] = `${field.label} es obligatorio.`;
      continue;
    }

    if (isBlank(value)) {
      continue;
    }

    if (field.type === 'number' && Number.isNaN(Number(value))) {
      errors[field.key] = `${field.label} debe ser un número.`;
    } else if (field.type === 'date' && !isValidDate(String(value))) {
      errors[field.key] = `${field.label} debe ser una fecha válida.`;
    } else if (field.type === 'select' && Array.isArray(field.options) && !field.options.includes(String(value))) {
      errors[field.key] = `${field.label} debe ser uno de: ${field.options.join(', ')}.`;
    }
  }
}

export function loadEntities() {
  return readList(ENTITIES_KEY);
}

export function saveEntities(entities) {
  writeList(ENTITIES_KEY, entities);
}

export function addEntity(data = {}) {
  const entity = {
    id: uid('ent'),
    entity_id: uid('eid')
  };

  for (const field of ENTITY_TEXT_FIELDS) {
    if (data[field] !== undefined) {
      entity[field] = String(data[field]);
    }
  }

  if (data.creditLimit !== undefined && !isBlank(data.creditLimit)) {
    entity.creditLimit = Number(data.creditLimit);
  }

  for (const field of getCustomFields('entity')) {
    if (data[field.key] !== undefined) {
      const value = coerce(field, data[field.key]);
      if (value !== undefined) {
        entity[field.key] = value;
      }
    }
  }

  entity.createdAt = now();
  entity.updatedAt = entity.createdAt;

  const entities = loadEntities();
  entities.push(entity);
  saveEntities(entities);
  return entity;
}

export function updateEntity(id, updates = {}) {
  const entities = loadEntities();
  const index = entities.findIndex((item) => item.id === id);
  if (index === -1) {
    return undefined;
  }

  const entity = entities[index];

  for (const field of ENTITY_TEXT_FIELDS) {
    if (updates[field] !== undefined) {
      entity[field] = String(updates[field]);
    }
  }

  if (updates.creditLimit !== undefined) {
    if (isBlank(updates.creditLimit)) {
      delete entity.creditLimit;
    } else {
      entity.creditLimit = Number(updates.creditLimit);
    }
  }

  for (const field of getCustomFields('entity')) {
    if (updates[field.key] !== undefined) {
      const value = coerce(field, updates[field.key]);
      if (value === undefined) {
        delete entity[field.key];
      } else {
        entity[field.key] = value;
      }
    }
  }

  entity.updatedAt = now();
  saveEntities(entities);
  return entity;
}

export function deleteEntity(id) {
  const entities = loadEntities();
  const entity = entities.find((item) => item.id === id);
  if (!entity) {
    return false;
  }

  saveEntities(entities.filter((item) => item.id !== id));
  deleteDocumentsForEntity(entity.entity_id);
  return true;
}

export function validateEntity(entity = {}) {
  const errors = {};

  if (isBlank(entity.name)) {
    errors.name = 'El nombre es obligatorio.';
  }

  if (isBlank(entity.code)) {
    errors.code = 'El código es obligatorio.';
  }

  if (!isBlank(entity.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(entity.email))) {
    errors.email = 'El correo electrónico no es válido.';
  }

  if (!isBlank(entity.creditLimit) && (Number.isNaN(Number(entity.creditLimit)) || Number(entity.creditLimit) < 0)) {
    errors.creditLimit = 'El límite de crédito debe ser un número no negativo.';
  }

  if (!isBlank(entity.targetDate) && !isValidDate(String(entity.targetDate))) {
    errors.targetDate = 'La fecha objetivo no es válida.';
  }

  validateCustomFields('entity', entity, errors);

  return { valid: Object.keys(errors).length === 0, errors };
}

export function searchEntities(term) {
  const query = String(term ?? '').trim().toLowerCase();
  if (query === '') {
    return [];
  }

  return loadEntities().filter((entity) =>
    Object.values(entity).some((value) => String(value ?? '').toLowerCase().includes(query))
  );
}

function normalizeDocument(data = {}) {
  const document = {
    id: uid('doc'),
    entity_id: data.entity_id ?? data.entityId ?? ''
  };

  for (const field of DOCUMENT_TEXT_FIELDS) {
    if (data[field] !== undefined) {
      document[field] = String(data[field]);
    }
  }

  for (const field of DOCUMENT_NUMBER_FIELDS) {
    if (data[field] !== undefined) {
      const value = coerceNumber(data[field]);
      if (value !== undefined) {
        document[field] = value;
      }
    }
  }

  for (const field of getCustomFields('document')) {
    if (data[field.key] !== undefined) {
      const value = coerce(field, data[field.key]);
      if (value !== undefined) {
        document[field.key] = value;
      }
    }
  }

  document.createdAt = now();
  document.updatedAt = document.createdAt;
  return document;
}

export function loadDocuments() {
  return readList(DOCUMENTS_KEY);
}

export function saveDocuments(documents) {
  writeList(DOCUMENTS_KEY, documents);
}

export function addDocument(data = {}) {
  const document = normalizeDocument(data);
  const documents = loadDocuments();
  documents.push(document);
  saveDocuments(documents);
  return document;
}

export function updateDocument(id, updates = {}) {
  const documents = loadDocuments();
  const index = documents.findIndex((item) => item.id === id);
  if (index === -1) {
    return undefined;
  }

  const document = documents[index];
  const lifecycle = getLifecycle();

  if (
    lifecycle &&
    updates.status !== undefined &&
    String(updates.status) !== String(document.status ?? '') &&
    !isBlank(updates.status)
  ) {
    const allowed = lifecycle.transitions[document.status] || [];
    if (!allowed.includes(String(updates.status))) {
      throw new Error(`Transición de estado inválida: ${document.status} → ${updates.status}.`);
    }
  }

  if (updates.entity_id !== undefined || updates.entityId !== undefined) {
    document.entity_id = updates.entity_id ?? updates.entityId;
  }

  for (const field of DOCUMENT_TEXT_FIELDS) {
    if (updates[field] !== undefined) {
      document[field] = String(updates[field]);
    }
  }

  for (const field of DOCUMENT_NUMBER_FIELDS) {
    if (updates[field] !== undefined) {
      if (isBlank(updates[field])) {
        delete document[field];
      } else {
        document[field] = Number(updates[field]);
      }
    }
  }

  for (const field of getCustomFields('document')) {
    if (updates[field.key] !== undefined) {
      const value = coerce(field, updates[field.key]);
      if (value === undefined) {
        delete document[field.key];
      } else {
        document[field.key] = value;
      }
    }
  }

  document.updatedAt = now();
  saveDocuments(documents);
  return document;
}

export function deleteDocument(id) {
  const documents = loadDocuments();
  const next = documents.filter((item) => item.id !== id);
  if (next.length === documents.length) {
    return false;
  }
  saveDocuments(next);
  return true;
}

export function deleteDocumentsForEntity(entityId) {
  const documents = loadDocuments();
  saveDocuments(documents.filter((item) => item.entity_id !== entityId));
}

export function validateDocument(document = {}) {
  const errors = {};
  const entityId = document.entity_id ?? document.entityId;
  const lifecycle = getLifecycle();

  if (isBlank(entityId)) {
    errors['document-entity'] = 'La entidad es obligatoria.';
  } else if (!loadEntities().some((entity) => entity.entity_id === entityId)) {
    errors['document-entity'] = 'La entidad seleccionada no existe.';
  }

  if (isBlank(document.folio)) {
    errors.folio = 'El folio es obligatorio.';
  } else if (!Number.isInteger(Number(document.folio)) || Number(document.folio) <= 0) {
    errors.folio = 'El folio debe ser un entero positivo.';
  }

  if (isBlank(document.startDate)) {
    errors.startDate = 'La fecha de inicio es obligatoria.';
  } else if (!isValidDate(String(document.startDate))) {
    errors.startDate = 'La fecha de inicio no es válida.';
  }

  if (isBlank(document.endDate)) {
    errors.endDate = 'La fecha de fin es obligatoria.';
  } else if (!isValidDate(String(document.endDate))) {
    errors.endDate = 'La fecha de fin no es válida.';
  } else if (!isBlank(document.startDate) && isValidDate(String(document.startDate)) && String(document.endDate) < String(document.startDate)) {
    errors.endDate = 'La fecha de fin debe ser igual o posterior a la de inicio.';
  }

  if (!isBlank(document.quantity) && (!Number.isInteger(Number(document.quantity)) || Number(document.quantity) <= 0)) {
    errors.quantity = 'La cantidad debe ser un entero positivo.';
  }

  for (const field of ['subtotal', 'discount', 'taxAmount', 'totalAmount']) {
    if (!isBlank(document[field]) && (Number.isNaN(Number(document[field])) || Number(document[field]) < 0)) {
      errors[field] = 'Debe ser un número no negativo.';
    }
  }

  if (
    !isBlank(document.subtotal) &&
    !isBlank(document.discount) &&
    Number(document.discount) > Number(document.subtotal)
  ) {
    errors.discount = 'El descuento no puede superar el subtotal.';
  }

  if (lifecycle && !isBlank(document.status) && !lifecycle.statuses.includes(String(document.status))) {
    errors.status = `El estado debe ser uno de: ${lifecycle.statuses.join(', ')}.`;
  }

  validateCustomFields('document', document, errors);

  return { valid: Object.keys(errors).length === 0, errors };
}

export function clearAll() {
  store().removeItem(ENTITIES_KEY);
  store().removeItem(DOCUMENTS_KEY);
}
