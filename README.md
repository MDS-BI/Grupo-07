# Módulo ERP: Manufactura y Operaciones | ERP Module: Manufacturing & Operations

**Grupo 7 / Team 7**

Aplicación de una sola página (Vite + Vanilla JS) que sirve como módulo base de un ERP enfocado en **manufactura y operaciones**. Proporciona la base común para construir módulos ERP personalizados: gestión de datos maestros (Entidades) y documentos transaccionales vinculados (Documentos), con creación, edición, eliminación, búsqueda, validación y persistencia en `localStorage` — usando Vite y HTML, CSS y JavaScript vanilla.

Single-page app (Vite + Vanilla JS) serving as an ERP base module focused on **manufacturing & operations**. It provides the common foundation for building custom ERP modules: master data management (Entities) and linked transactional documents (Documents) with create/edit/delete/search, validation, and browser `localStorage` persistence — using Vite and vanilla HTML, CSS, and JavaScript.

La interfaz está totalmente en **español** (términos por defecto: Entidad / Documento; nombre del módulo: Módulo Base ERP), incluyendo etiquetas, mensajes de validación, estados vacíos y diálogos. / The user interface is fully in **Spanish** (default terms: Entidad / Documento; module name: Módulo Base ERP), including labels, validation messages, empty states, and dialogs.

## Visión de producto | Product Vision

> Ser la base sobre la cual la planta pase de registrar órdenes en papel o en hojas de cálculo a tener **trazabilidad real**: desde la materia prima que entra, pasando por en qué máquina y en qué etapa se transforma, hasta el producto terminado y su calidad. Un ERP que responda rápido la pregunta de cualquier jefe de planta: ***¿qué se está produciendo ahora, con qué, y qué está retrasado?***

> To be the foundation that takes the plant from recording orders on paper or spreadsheets to **real traceability**: from the raw material that comes in, through which machine and which stage it is transformed in, until the finished product and its quality. An ERP that answers fast any plant manager's question: ***what is being produced right now, with what, and what is delayed?***

## Módulo: Manufactura y Operaciones | Module: Manufacturing & Operations

Manufactura y operaciones es un **sistema de información básico**: sostiene la operación del negocio (el "core"), del mismo modo en que un módulo de ventas sostiene la operación comercial. Su base es operativa, con un toque de **control de gestión** a través de indicadores de calidad y eficiencia.

Manufacturing & operations is a **basic information system**: it supports the business operation (the "core"), in the same way a sales module supports the commercial operation. Its foundation is operational, with a **management control** angle through quality and efficiency indicators.

### Entidades del modelo | Model entities

Partimos por las necesidades mínimas del módulo. Entidades typicas del dominio:

We start from the module's minimum needs. Typical domain entities:

| Entidad | Entity | Descripción | Description |
|---|---|---|---|
| Producto | Product | Bien terminado que fabrica y vende la planta. | Finished good the plant produces and sells. |
| Materia prima / Insumo | Raw material / Supply | Material que se consume en la producción. | Material consumed during production. |
| Orden de producción | Production order | Instrucción de fabricar X unidades de un producto en un plazo. | Instruction to produce X units of a product by a date. |
| Proceso / Etapa | Process / Stage | Paso de la transformación (corte, ensamblaje, pintura…). | Transformation step (cutting, assembly, painting…). |
| Máquina / Recurso | Machine / Resource | Activo que ejecuta un proceso; capacidad y disponibilidad. | Asset that runs a process; capacity and availability. |
| Inventario | Inventory | Existencias de insumos y productos terminados. | Stock of supplies and finished goods. |
| Proveedor | Supplier | Quién entrega materia prima. | Who supplies raw material. |
| Lote | Batch | Grupo trazable de producción o de material recibido. | Traceable production or received-material group. |
| Control de calidad | Quality control | Resultado de una inspección sobre un lote o etapa. | Result of an inspection on a batch or stage. |

### Metodología | Methodology

Un buen diseño conceptual funciona como un buen prompt: primero el **plan conceptual**, luego las **specs** (historias de usuario) y recién después las **tareas** (features). Ejemplo:

A good conceptual design works like a good prompt: first the conceptual **plan**, then the **specs** (user stories), and only after that the **tasks** (features). Example:

> *Como jefe de planta, quiero registrar una orden de producción para asignar recursos y fechas.*

> *As a plant manager, I want to register a production order to assign resources and dates.*

La especificación completa vive en `specs/001-erp-base-module/`. No se trata de programar primero, sino de conceptualizar; una vez de acuerdo, se reparten tareas y todos contribuyen.

The full specification lives in `specs/001-erp-base-module/`. It's not about coding first, but conceptualizing; once agreed, tasks are split and everyone contributes.

## Equipo | Team

| Integrante | Member | Rol | Role |
|---|---|---|---|
| Vicente Javier Seguel Fuentes | vixhoseguel | Líder de producto | Product lead |
| Rafael Antonio Machuca López | Rmachuca26 | Arquitecto de datos (MER) | Data architect (ERM) |
| Constanza Andrea Chavarría Ortiz | Constanza-Chavarria | Diseño de experiencia y usuario | UX/UI design |
| Francisca Belén Torres Torres | frantorres006 | Control de calidad del producto | Product QA |
| Alonso Javier Romero Gutiérrez | alonsoromeroguti | Desarrollo e infraestructura | Development & infrastructure |

Los roles organizan, no limitan: las tareas se reparten y todos contribuyen al código, los specs y el README.

Roles organize, they don't restrict: tasks are shared and everyone contributes to code, specs, and the README.

---

## Detalles técnicos | Technical Details

Las entidades llevan campos estándar de datos maestros ERP (nombre, código, identificación tributaria, email, teléfono, dirección, categoría, fecha objetivo, límite de crédito, condiciones de pago). Los documentos usan numeración serie + folio y llevan un desglose monetario (subtotal, descuento, impuesto, total), moneda, condiciones de pago, notas, cantidad, fechas y estado.

Entities carry standard ERP master-data fields (name, code, tax ID, email, phone, address, category, target date, credit limit, payment terms). Documents use series + folio numbering and carry a monetary breakdown (subtotal, discount, tax, total), currency, payment terms, notes, quantity, dates, and status.

La app se presenta como un workspace ERP coherente:

The app presents itself as a coherent ERP workspace:

- **Workspace shell** — every screen lives inside a branded chrome: a top bar with a logo (an SVG monogram derived from the module name) and module name, plus a persistent sidebar of module buttons (Panel, Entidades, Documentos, Búsqueda). The active module is highlighted (`aria-current="page"`), and the sidebar collapses to an icon rail on narrow viewports.
- **Home dashboard** — the entry screen offers quick-action buttons for key ERP tasks (new entity, new document, open management areas, find records) and live statistic cards showing record counts.
- **Design tokens** — styling is driven by CSS custom properties in `src/styles.css`, so branding changes apply globally.

### Setup

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the URL Vite prints).

### Tests

Run the full test suite (unit + integration) with:

```bash
npm test
```

Or a one-off run without watch mode:

```bash
npx vitest run
```

### Building Custom Modules

Custom ERP modules built on this base define:

- What an **Entity** represents (e.g., customer, product, asset) plus domain-specific fields.
- What a **Document** represents (e.g., order, invoice, contract).
- Module-specific labels and validation rules.

The base module handles identity generation, timestamps, referential integrity between entities and documents, cascade deletion, navigation, and search. See `specs/001-erp-base-module/` for the full specification.

### Tailoring via Configuration

All tailoring lives in one place: the `userConfig` object at the top of `src/module-config.js`. Developers edit this single export; no core code changes are required. Available knobs:

- `moduleName` — display name shown in the top bar, dashboard, and document title; also derives the logo monogram.
- `labels` — rename Entity/Document terms across every screen, including sidebar buttons, quick actions, forms, and messages. Spanish articles and agreements (el/la, seleccionado/a) are derived from the first word of each configured term.
- `customFields` — declare extra fields per record type with `target` (`entity` or `document`), `key`, `label`, `type` (`text`, `number`, `date`, or `select`), optional `required`, and `options` for selects. Keys must not collide with base field names (see `specs/001-erp-base-module/data-model.md`). Values persist alongside records and appear in search results.
- `statusLifecycle` — restrict document statuses to a configured list of `statuses` with permitted `transitions` between them. Without it, status stays a free-form field.
- `theme.accentColor` — a hex color (e.g., `"#0f62fe"`) applied across the shell as highlights and primary controls. Invalid values fall back to the default.

If the configuration is invalid (unknown types, bad keys, transitions referencing unknown statuses, non-hex accent colors), the app shows the problems in a banner and falls back to defaults instead of breaking.

### Notes

- Data is persisted to `localStorage` under the keys `erp_base_module:entities` and `erp_base_module:documents`.
- Deleting an entity also deletes its documents (cascade).
- This project intentionally uses vanilla HTML, CSS, and JavaScript for simplicity.
