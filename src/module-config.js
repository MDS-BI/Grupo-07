import { validateDomainConfig } from './domain/config-schema.js';

export const BASE_FIELDS = {
  entity: [
    'id',
    'entity_id',
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
    'paymentTerms',
    'createdAt',
    'updatedAt'
  ],
  document: [
    'id',
    'entity_id',
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
    'paymentTerms',
    'notes',
    'status',
    'createdAt',
    'updatedAt'
  ]
};

export const FIELD_TYPES = ['text', 'number', 'date', 'select'];

export const DEFAULT_CONFIG = {
  moduleName: 'Módulo Base ERP',
  labels: {
    entity: 'Entidad',
    entities: 'Entidades',
    document: 'Documento',
    documents: 'Documentos'
  },
  customFields: [],
  statusLifecycle: null,
  theme: { accentColor: '#2563eb' },
  domain: null
};

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function defaultConfig() {
  return {
    moduleName: DEFAULT_CONFIG.moduleName,
    labels: { ...DEFAULT_CONFIG.labels },
    customFields: [],
    statusLifecycle: null,
    theme: { ...DEFAULT_CONFIG.theme },
    domain: null
  };
}

export function normalizeConfig(input) {
  const errors = [];
  const config = defaultConfig();

  if (input == null) {
    return { config, errors };
  }

  if (typeof input !== 'object' || Array.isArray(input)) {
    errors.push('La configuración debe ser un objeto.');
    return { config, errors };
  }

  if (input.moduleName !== undefined) {
    if (typeof input.moduleName !== 'string' || input.moduleName.trim() === '') {
      errors.push('moduleName debe ser una cadena no vacía.');
    } else {
      config.moduleName = input.moduleName.trim();
    }
  }

  if (input.labels !== undefined && input.labels !== null) {
    if (typeof input.labels !== 'object' || Array.isArray(input.labels)) {
      errors.push('labels debe ser un objeto.');
    } else {
      for (const key of ['entity', 'entities', 'document', 'documents']) {
        if (input.labels[key] !== undefined) {
          if (typeof input.labels[key] !== 'string' || input.labels[key].trim() === '') {
            errors.push(`labels.${key} debe ser una cadena no vacía.`);
          } else {
            config.labels[key] = input.labels[key].trim();
          }
        }
      }
    }
  }

  if (input.customFields !== undefined && input.customFields !== null) {
    if (!Array.isArray(input.customFields)) {
      errors.push('customFields debe ser una lista.');
    } else {
      const seen = { entity: new Set(), document: new Set() };

      for (const raw of input.customFields) {
        if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
          errors.push('Cada campo personalizado debe ser un objeto.');
          continue;
        }

        const target = raw.target;
        if (target !== 'entity' && target !== 'document') {
          errors.push('customFields: target debe ser "entity" o "document".');
          continue;
        }

        const key = typeof raw.key === 'string' ? raw.key.trim() : '';
        if (key === '') {
          errors.push('customFields: key es obligatorio.');
          continue;
        }

        if (BASE_FIELDS[target].includes(key)) {
          errors.push(`customFields: la clave "${key}" choca con un campo base.`);
          continue;
        }

        if (seen[target].has(key)) {
          errors.push(`customFields: la clave "${key}" se declara más de una vez para ${target}.`);
          continue;
        }
        seen[target].add(key);

        const label = typeof raw.label === 'string' && raw.label.trim() !== '' ? raw.label.trim() : key;
        const type = raw.type;

        if (!FIELD_TYPES.includes(type)) {
          errors.push(`customFields: type desconocido "${type}" en "${key}".`);
          continue;
        }

        const field = { target, key, label, type, required: raw.required === true };

        if (type === 'select') {
          if (!Array.isArray(raw.options) || raw.options.length === 0) {
            errors.push(`customFields: el campo select "${key}" requiere options.`);
            continue;
          }
          field.options = raw.options.map(String);
        }

        if (raw.nonNegative === true) {
          field.nonNegative = true;
        }

        if (typeof raw.min === 'number' && Number.isFinite(raw.min)) {
          field.min = raw.min;
        }

        config.customFields.push(field);
      }
    }
  }

  if (input.statusLifecycle !== undefined) {
    if (input.statusLifecycle === null) {
      config.statusLifecycle = null;
    } else if (typeof input.statusLifecycle !== 'object' || Array.isArray(input.statusLifecycle)) {
      errors.push('statusLifecycle debe ser un objeto o null.');
    } else {
      const statuses = Array.isArray(input.statusLifecycle.statuses) ? input.statusLifecycle.statuses.slice() : [];
      const rawTransitions = input.statusLifecycle.transitions;

      if (statuses.length === 0) {
        errors.push('statusLifecycle.statuses debe tener al menos un estado.');
      }

      const transitions =
        rawTransitions && typeof rawTransitions === 'object' && !Array.isArray(rawTransitions) ? rawTransitions : {};
      const known = new Set(statuses);

      for (const [from, list] of Object.entries(transitions)) {
        if (!known.has(from)) {
          errors.push(`statusLifecycle: transición desde estado desconocido "${from}".`);
        }
        if (!Array.isArray(list)) {
          errors.push(`statusLifecycle: las transiciones de "${from}" deben ser una lista.`);
          continue;
        }
        for (const to of list) {
          if (!known.has(to)) {
            errors.push(`statusLifecycle: transición hacia estado desconocido "${to}".`);
          }
        }
      }

      const normalizedTransitions = {};
      for (const status of statuses) {
        const list = Array.isArray(transitions[status]) ? transitions[status] : [];
        normalizedTransitions[status] = list.slice();
      }

      if (statuses.length > 0) {
        config.statusLifecycle = { statuses: statuses.slice(), transitions: normalizedTransitions };
      }
    }
  }

  if (input.theme !== undefined && input.theme !== null) {
    if (typeof input.theme !== 'object' || Array.isArray(input.theme)) {
      errors.push('theme debe ser un objeto.');
    } else if (input.theme.accentColor !== undefined) {
      if (typeof input.theme.accentColor !== 'string' || !HEX_COLOR.test(input.theme.accentColor)) {
        errors.push('theme.accentColor debe ser un color hexadecimal válido.');
      } else {
        config.theme.accentColor = input.theme.accentColor;
      }
    }
  }

  if (input.domain !== undefined) {
    const domainResult = validateDomainConfig(
      {
        domain: input.domain,
        customFields: config.customFields,
        statusLifecycle: config.statusLifecycle
      },
      BASE_FIELDS
    );

    errors.push(...domainResult.errors);

    if (domainResult.errors.length === 0) {
      config.domain = domainResult.domain;
    }
  }

  return { config, errors };
}

export const manufacturingConfig = {
  moduleName: 'Manufactura y Operaciones',
  labels: {
    entity: 'Producto',
    entities: 'Productos',
    document: 'Orden de Producción',
    documents: 'Órdenes de Producción'
  },
  customFields: [
    {
      target: 'entity',
      key: 'itemType',
      label: 'Tipo de ítem',
      type: 'select',
      required: true,
      options: ['Producto terminado', 'Materia prima', 'Insumo']
    },
    {
      target: 'entity',
      key: 'unitOfMeasure',
      label: 'Unidad de medida',
      type: 'select',
      required: true,
      options: ['Unidad', 'Kg', 'Litro', 'Metro', 'Caja']
    },
    { target: 'entity', key: 'currentStock', label: 'Stock actual', type: 'number', nonNegative: true },
    { target: 'entity', key: 'minStock', label: 'Stock mínimo', type: 'number', nonNegative: true },
    { target: 'entity', key: 'leadTimeDays', label: 'Plazo de reposición (días)', type: 'number', nonNegative: true },
    { target: 'entity', key: 'supplier', label: 'Proveedor', type: 'text' },
    {
      target: 'document',
      key: 'processStage',
      label: 'Proceso / Etapa',
      type: 'select',
      required: true,
      options: ['Corte', 'Ensamblaje', 'Pintura', 'Empaque']
    },
    { target: 'document', key: 'machine', label: 'Máquina / Recurso', type: 'text' },
    { target: 'document', key: 'batchCode', label: 'Lote', type: 'text' },
    {
      target: 'document',
      key: 'priority',
      label: 'Prioridad',
      type: 'select',
      options: ['Baja', 'Media', 'Alta', 'Urgente']
    },
    { target: 'document', key: 'producedQty', label: 'Cantidad producida', type: 'number', nonNegative: true },
    { target: 'document', key: 'scrapQty', label: 'Cantidad de merma', type: 'number', nonNegative: true },
    {
      target: 'document',
      key: 'qualityResult',
      label: 'Resultado de calidad',
      type: 'select',
      options: ['Pendiente', 'Aprobado', 'Corrección', 'Rechazado']
    },
    { target: 'document', key: 'responsible', label: 'Responsable', type: 'text' }
  ],
  statusLifecycle: {
    statuses: ['planificada', 'liberada', 'en producción', 'en control de calidad', 'terminada', 'cancelada'],
    transitions: {
      planificada: ['liberada', 'cancelada'],
      liberada: ['en producción', 'cancelada'],
      'en producción': ['en control de calidad', 'cancelada'],
      'en control de calidad': ['terminada', 'en producción', 'cancelada'],
      terminada: [],
      cancelada: []
    }
  },
  theme: { accentColor: '#0f766e' },
  domain: {
    documentList: {
      columns: [
        { key: 'series', label: 'Serie' },
        { key: 'folio', label: 'Orden' },
        { key: 'entityName', label: 'Producto', source: 'entity' },
        { key: 'quantity', label: 'Cantidad solicitada' },
        { key: 'priority', label: 'Prioridad' },
        { key: 'startDate', label: 'Inicio' },
        { key: 'endDate', label: 'Fin' },
        { key: 'status', label: 'Estado' }
      ],
      filters: [
        { key: 'status', label: 'Estado', op: 'eq', optionsFrom: 'statuses' },
        {
          label: 'Solo retrasadas',
          toggle: true,
          predicate: {
            all: [
              { field: 'endDate', op: 'exists' },
              { field: 'endDate', op: 'lt', value: 'today' },
              { field: 'status', op: 'notIn', value: ['terminada', 'cancelada'] }
            ]
          }
        }
      ],
      detailSections: [
        {
          title: 'Pedido',
          fields: [
            'series',
            'folio',
            'entityName',
            'quantity',
            'priority',
            'startDate',
            'endDate',
            'status',
            'currency',
            'subtotal',
            'totalAmount'
          ]
        },
        {
          title: 'Producto',
          fields: [
            { key: 'entityCode', label: 'Código de producto' },
            { key: 'itemType', label: 'Tipo de ítem' },
            { key: 'unitOfMeasure', label: 'Unidad de medida' },
            'currentStock',
            'minStock',
            'supplier',
            'leadTimeDays',
            { key: 'address', label: 'Ubicación de almacenamiento' }
          ]
        },
        {
          title: 'Ejecución',
          fields: ['processStage', 'machine', 'batchCode', 'producedQty', 'scrapQty', 'responsible', 'notes']
        },
        {
          title: 'Calidad',
          fields: [
            { key: 'producedQty', label: 'Cantidad QA' },
            { key: 'scrapQty', label: 'Merma QA' },
            { key: 'qualityResult', label: 'Calidad QA' },
            'notes'
          ]
        }
      ]
    },
    indicators: [
      { id: 'orders-by-status', type: 'countByField', field: 'status', label: 'Órdenes por estado' },
      {
        id: 'overdue-orders',
        type: 'countWhere',
        label: 'Órdenes retrasadas',
        where: {
          all: [
            { field: 'endDate', op: 'exists' },
            { field: 'endDate', op: 'lt', value: 'today' },
            { field: 'status', op: 'notIn', value: ['terminada', 'cancelada'] }
          ]
        }
      },
      {
        id: 'scrap-ratio',
        type: 'ratio',
        numerator: 'scrapQty',
        denominator: 'producedQty',
        label: 'Merma sobre producción'
      }
    ],
    costSummary: {
      groupBy: 'currency',
      fields: ['subtotal', 'discount', 'taxAmount', 'totalAmount']
    },
    forms: {
      execution: {
        title: 'Ejecución en planta',
        submitLabel: 'Guardar ejecución',
        fields: ['processStage', 'machine', 'batchCode', 'producedQty', 'scrapQty', 'responsible', 'notes']
      },
      quality: {
        title: 'Control de calidad',
        submitLabel: 'Guardar inspección',
        fields: [
          { key: 'producedQty', label: 'Cantidad QA' },
          { key: 'scrapQty', label: 'Merma QA' },
          { key: 'qualityResult', label: 'Calidad QA' },
          { key: 'notes', label: 'Nota' }
        ]
      }
    },
    badges: [
      {
        target: 'entity',
        when: {
          all: [
            { field: 'currentStock', op: 'exists' },
            { field: 'minStock', op: 'exists' },
            { field: 'currentStock', op: 'lt', ref: 'minStock' }
          ]
        },
        label: 'Stock bajo el mínimo',
        tone: 'warning'
      },
      {
        target: 'document',
        when: {
          all: [
            { field: 'endDate', op: 'exists' },
            { field: 'endDate', op: 'lt', value: 'today' },
            { field: 'status', op: 'notIn', value: ['terminada', 'cancelada'] }
          ]
        },
        label: 'Retrasada',
        tone: 'danger'
      }
    ],
    rules: [
      { target: 'entity', require: { field: 'itemType', op: 'exists' }, message: 'El tipo de ítem es obligatorio.' },
      {
        target: 'entity',
        require: { field: 'unitOfMeasure', op: 'exists' },
        message: 'La unidad de medida es obligatoria.'
      },
      {
        target: 'document',
        require: { field: 'processStage', op: 'exists' },
        message: 'La etapa del proceso es obligatoria.'
      },
      {
        target: 'document',
        when: { field: 'status', op: 'eq', value: 'terminada' },
        require: { field: 'qualityResult', op: 'eq', value: 'Aprobado' },
        message: 'Una orden terminada debe tener calidad Aprobada.'
      }
    ],
    transitionActions: [
      { from: 'planificada', to: 'liberada', label: 'Confirmar pedido', tone: 'info' },
      { from: 'planificada', to: 'cancelada', label: 'Rechazar pedido', tone: 'danger' },
      { from: 'liberada', to: 'en producción', label: 'Iniciar producción', tone: 'info' },
      { from: 'liberada', to: 'cancelada', label: 'Cancelar orden', tone: 'danger' },
      { from: 'en producción', to: 'en control de calidad', label: 'Enviar a control de calidad', tone: 'info' },
      { from: 'en producción', to: 'cancelada', label: 'Cancelar orden', tone: 'danger' },
      {
        from: 'en control de calidad',
        to: 'terminada',
        label: 'Aprobar y terminar',
        tone: 'info',
        requires: { field: 'qualityResult', op: 'eq', value: 'Aprobado' }
      },
      {
        from: 'en control de calidad',
        to: 'en producción',
        label: 'Devolver a producción',
        tone: 'warning',
        requires: { field: 'qualityResult', op: 'eq', value: 'Corrección' }
      },
      {
        from: 'en control de calidad',
        to: 'cancelada',
        label: 'Rechazar orden',
        tone: 'danger',
        requires: { field: 'qualityResult', op: 'eq', value: 'Rechazado' }
      }
    ],
    transitionGuards: [
      {
        from: 'en control de calidad',
        to: 'terminada',
        require: { field: 'qualityResult', op: 'eq', value: 'Aprobado' },
        message: 'Solo se puede terminar una orden con calidad Aprobada.'
      },
      {
        from: 'en control de calidad',
        to: 'en producción',
        require: { field: 'qualityResult', op: 'eq', value: 'Corrección' },
        message: 'Solo se puede devolver a producción con resultado Corrección.'
      },
      {
        from: 'en control de calidad',
        to: 'cancelada',
        require: { field: 'qualityResult', op: 'eq', value: 'Rechazado' },
        message: 'Solo se puede rechazar una orden con resultado Rechazado.'
      }
    ]
  }
};

export const userConfig = manufacturingConfig;

export async function loadModuleConfig() {
  return normalizeConfig(userConfig);
}

let activeConfig = null;

export function setActiveConfig(config) {
  activeConfig = config || null;
}

export function getConfig() {
  return activeConfig || DEFAULT_CONFIG;
}

export function labelFor(key) {
  const config = getConfig();
  if (config && config.labels && config.labels[key] !== undefined) {
    return config.labels[key];
  }
  return DEFAULT_CONFIG.labels[key];
}
