import { loadEntities, loadDocuments } from '../storage.js';
import { isFeminine } from './shell.js';

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}

export function applyDashboard(config) {
  const labels = config.labels;
  const nuevo = isFeminine(labels.entity) ? 'Nueva' : 'Nuevo';
  const nuevoDocumento = isFeminine(labels.document) ? 'Nueva' : 'Nuevo';

  setText('dashboard-heading', config.moduleName);
  setText('action-new-entity-title', `${nuevo} ${labels.entity}`);
  setText('action-new-document-title', `${nuevoDocumento} ${labels.document}`);
  setText('action-open-entities-title', labels.entities);
  setText('action-find-title', 'Buscar registros');
  setText('stat-entities-label', labels.entities);
  setText('stat-documents-label', labels.documents);
}

export function refreshStats() {
  setText('stat-entities', String(loadEntities().length));
  setText('stat-documents', String(loadDocuments().length));
}
