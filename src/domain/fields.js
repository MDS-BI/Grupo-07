/**
 * Etiquetas legibles para los campos base y virtuales.
 * Se usan para resolver columnas, secciones de detalle e indicadores sin
 * codificar etiquetas de dominio en los componentes.
 */
export const BASE_FIELD_LABELS = {
  name: 'Nombre',
  code: 'Código',
  taxId: 'Identificación fiscal',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  address: 'Ubicación',
  category: 'Categoría',
  description: 'Descripción',
  targetDate: 'Fecha objetivo',
  creditLimit: 'Límite de crédito',
  paymentTerms: 'Condiciones de pago',
  entity_id: 'Producto',
  series: 'Serie',
  folio: 'Folio',
  startDate: 'Fecha de inicio',
  endDate: 'Fecha de fin',
  quantity: 'Cantidad solicitada',
  subtotal: 'Subtotal',
  discount: 'Descuento',
  taxAmount: 'Impuesto',
  totalAmount: 'Total',
  currency: 'Moneda',
  notes: 'Notas',
  status: 'Estado'
};

export const VIRTUAL_FIELDS = {
  entityName: 'Producto',
  entityCode: 'Código de producto',
  entityDescription: 'Descripción del producto',
  entityCategory: 'Categoría del producto',
  scrapRatio: 'Merma / producción',
  statusLabel: 'Estado'
};

export function buildFieldLabels(config) {
  const labels = { ...BASE_FIELD_LABELS, ...VIRTUAL_FIELDS };
  const fields = config && Array.isArray(config.customFields) ? config.customFields : [];

  for (const field of fields) {
    if (field && typeof field.key === 'string' && field.key !== '') {
      labels[field.key] = typeof field.label === 'string' && field.label.trim() !== '' ? field.label : field.key;
    }
  }

  return labels;
}

export function resolveFieldLabel(config, key) {
  const labels = buildFieldLabels(config);
  return labels[key] || key;
}

export function isVirtualField(key) {
  return Object.prototype.hasOwnProperty.call(VIRTUAL_FIELDS, key);
}
