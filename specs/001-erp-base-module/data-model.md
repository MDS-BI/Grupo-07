// Configuración del módulo: Manufactura y Operaciones
// Reemplaza el objeto `userConfig` al inicio de src/module-config.js.
// No se requieren cambios en el código central.

export const userConfig = {
  moduleName: "Manufactura y Operaciones",

  labels: {
    entity: "Producto",
    entities: "Productos",
    document: "Orden de Producción",
    documents: "Órdenes de Producción",
  },

  customFields: [
    // ───────── Producto (datos maestros) ─────────
    {
      target: "entity",
      key: "itemType",
      label: "Tipo de ítem",
      type: "select",
      required: true,
      options: ["Producto terminado", "Materia prima", "Insumo"],
    },
    {
      target: "entity",
      key: "unitOfMeasure",
      label: "Unidad de medida",
      type: "select",
      required: true,
      options: ["Unidad", "Kg", "Litro", "Metro", "Caja"],
    },
    {
      target: "entity",
      key: "currentStock",
      label: "Stock actual",
      type: "number",
      required: false,
    },
    {
      target: "entity",
      key: "minStock",
      label: "Stock mínimo",
      type: "number",
      required: false,
    },
    {
      target: "entity",
      key: "leadTimeDays",
      label: "Plazo de reposición (días)",
      type: "number",
      required: false,
    },
    {
      target: "entity",
      key: "supplier",
      label: "Proveedor",
      type: "text",
      required: false,
    },

    // ───────── Orden de Producción (transaccional) ─────────
    {
      target: "document",
      key: "processStage",
      label: "Proceso / Etapa",
      type: "select",
      required: true,
      options: ["Corte", "Ensamblaje", "Pintura", "Empaque"],
    },
    {
      target: "document",
      key: "machine",
      label: "Máquina / Recurso",
      type: "text",
      required: false,
    },
    {
      target: "document",
      key: "batchCode",
      label: "Lote",
      type: "text",
      required: false,
    },
    {
      target: "document",
      key: "priority",
      label: "Prioridad",
      type: "select",
      required: false,
      options: ["Baja", "Media", "Alta", "Urgente"],
    },
    {
      target: "document",
      key: "producedQty",
      label: "Cantidad producida",
      type: "number",
      required: false,
    },
    {
      target: "document",
      key: "scrapQty",
      label: "Cantidad de merma",
      type: "number",
      required: false,
    },
    {
      target: "document",
      key: "qualityResult",
      label: "Resultado de calidad",
      type: "select",
      required: false,
      options: ["Pendiente", "Aprobado", "Aprobado con observaciones", "Rechazado"],
    },
    {
      target: "document",
      key: "responsible",
      label: "Responsable",
      type: "text",
      required: false,
    },
  ],

  statusLifecycle: {
    statuses: [
      "planificada",
      "liberada",
      "en producción",
      "en control de calidad",
      "terminada",
      "cancelada",
    ],
    transitions: {
      "planificada": ["liberada", "cancelada"],
      "liberada": ["en producción", "cancelada"],
      "en producción": ["en control de calidad", "cancelada"],
      "en control de calidad": ["terminada", "en producción", "cancelada"], // re-trabajo si falla calidad
      "terminada": [],
      "cancelada": [],
    },
  },

  theme: {
    accentColor: "#0f766e",
  },
};
## Adaptación: Manufactura y Operaciones

| Concepto base | Término del módulo | Uso |
|---|---|---|
| Entity | Producto | Producto terminado, materia prima o insumo |
| Document | Orden de Producción | Instrucción de fabricar X unidades de un producto en un plazo |

### Campos personalizados de Producto
`itemType`, `unitOfMeasure`, `currentStock`, `minStock`, `leadTimeDays`, `supplier`

### Campos personalizados de Orden de Producción
`processStage`, `machine`, `batchCode`, `priority`, `producedQty`, `scrapQty`, `qualityResult`, `responsible`

### Ciclo de vida
planificada → liberada → en producción → en control de calidad → terminada
(cancelada desde cualquier estado previo a terminada; calidad puede devolver a producción)
