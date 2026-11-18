# Módulo ERP: Manufactura y Operaciones | ERP Module: Manufacturing & Operations

**Grupo 7 / Team 7**

Aplicación de una sola página (Vite + Vanilla JS) que sirve como módulo base de un ERP enfocado en **manufactura y operaciones**. Proporciona la base común para construir módulos ERP personalizados: gestión de datos maestros (Entidades) y documentos transaccionales vinculados (Documentos), con creación, edición, eliminación, búsqueda, validación y persistencia en `localStorage` — usando Vite y HTML, CSS y JavaScript vanilla.

Single-page app (Vite + Vanilla JS) serving as an ERP base module focused on **manufacturing & operations**. It provides the common foundation for building custom ERP modules: master data management (Entities) and linked transactional documents (Documents) with create/edit/delete/search, validation, and browser `localStorage` persistence — using Vite and vanilla HTML, CSS, and JavaScript.

La interfaz está totalmente en **español** (con el perfil de manufactura activo: Producto / Orden de Producción; nombre del módulo: Manufactura y Operaciones), incluyendo etiquetas, mensajes de validación, estados vacíos y diálogos. / The user interface is fully in **Spanish** (with the manufacturing profile active: Producto / Orden de Producción; module name: Manufactura y Operaciones), including labels, validation messages, empty states, and dialogs.

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

- **Workspace shell** — every screen lives inside a branded chrome: a top bar with a logo (an SVG monogram derived from the module name) and module name, plus a persistent sidebar of module buttons (with the manufacturing profile: Panel, Productos, Órdenes de Producción, Búsqueda). The active module is highlighted (`aria-current="page"`), and the sidebar collapses to an icon rail on narrow viewports.
- **Home dashboard** — the entry screen offers quick-action buttons for key ERP tasks (new entity, new document, open management areas, find records) and live statistic cards showing record counts.
- **Visual charts** — the Documentos module includes a Gráficos tab with an order-status donut, priority bars, a stock-vs-minimum comparison and scrap-by-stage bars. They are computed in the browser from the same records and filters, with accessible legends and role-based visibility.
- **Design tokens** — styling is driven by CSS custom properties in `src/styles.css`, so branding changes apply globally.

### Setup

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the URL Vite prints).

### Acceso por cargo | Role-based login

Sin sesión, la aplicación muestra la pantalla **Acceso por cargo** antes del Panel. Selecciona un cargo e introduce su clave ficticia: / Without a session, the app shows the **Acceso por cargo** sign-in screen before the dashboard. Pick a role and enter its fictitious key:

| Cargo / Role | Clave / Key | Acceso principal / Main access |
|---|---|---|
| Jefe de planta / Gerente de operaciones (`plantManager`) | `PLANT-2026` | Todos los módulos y transiciones; recorrido completo de US1-US15. / All modules and transitions; full US1-US15 workflow. |
| Encargado de bodega y logística (`warehouseLead`) | `WH-2026` | Catálogo de productos y stock; sin transiciones de calidad. / Product catalogue and stock; no quality transitions. |
| Supervisor de producción / Jefe de turno (`productionSupervisor`) | `PROD-2026` | Ejecución, envío a control de calidad y re-trabajo. / Execution, send to quality control and rework. |
| Inspector de calidad (QA) (`qualityInspector`) | `QA-2026` | Campos y filtro de calidad; aprobar, devolver o rechazar lotes. / Quality fields and filter; approve, return or reject batches. |

- Cada cargo declara qué gráficos puede ver en `grants.charts` (`orders-by-status`, `orders-by-priority`, `stock-vs-minimum`, `scrap-by-stage`); la pestaña Gráficos solo muestra esos gráficos. / Each role declares which charts it may see under `grants.charts`; the Gráficos tab only renders those charts.
- Las claves son **ficticias** y la comprobación ocurre únicamente en el navegador: no hay backend ni credenciales reales. / The keys are **fictitious** and checked entirely in the browser: no backend and no real credentials.
- Se declaran en `src/module-config.js`, en `manufacturingConfig.domain.access.roles[].secret`, junto a los permisos de cada cargo. / They are declared in `src/module-config.js`, under `manufacturingConfig.domain.access.roles[].secret`, alongside each role's grants.
- La sesión se guarda en `localStorage` como `erp_base_module:session` y contiene solo el cargo y sus permisos, nunca la clave. Cerrar sesión no borra productos ni órdenes. / The session is stored in `localStorage` as `erp_base_module:session` and holds only the role and its grants, never the key. Signing out does not delete products or orders.
- Para volver al acceso directo al Panel (comportamiento de US1-US15), elimina `domain.access` de la configuración o usa `userConfig = null`. / To skip sign-in and go straight to the dashboard (US1-US15 behaviour), remove `domain.access` from the config or set `userConfig = null`.

### Tests

Run the full test suite (unit + integration) with:

```bash
npm test
```

Other quality gates:

```bash
npm run lint          # ESLint over src/ and tests/
npm run format:check  # Prettier check
npm run build         # Vite production build
npm run test:e2e      # Playwright E2E (installs a local Chromium if needed)
```

The E2E suite starts Vite on `http://localhost:4173` automatically. Install the browser once with `npx playwright install chromium`.

Current gate result (2026-11-05): `npm test` 35 files / 263 tests green, `npm run lint` clean, `npm run format:check` clean, `npm run build` succeeds, `npm run test:e2e` 10/10 green.

### Manufacturing profile (active by default)

The shipped `userConfig` is `manufacturingConfig`, so the app runs the manufacturing and operations profile with no core changes:

- **Products (Entidades)** — item type, unit of measure, current/minimum stock, storage location, supplier and replenishment lead time. Low stock is flagged only when both stock values exist and `currentStock < minStock`; otherwise the UI shows "sin dato" without a badge.
- **Production orders (Documentos)** — the order list, filters, detail, indicators and cost summary live inside the Documentos module; the sidebar keeps exactly four modules.
- **Order sub-windows** — the Documentos module is split into six tabs: Órdenes de Producción, Indicadores, Gráficos, Ejecución de planta, Control de calidad and Agregar / Editar Orden de Producción.
- **Order workflow** — confirm/reject with optional notes; the configured lifecycle drives which transitions are offered and reject unreachable ones.
- **Execution** — released orders record stage, machine, batch, produced quantity, scrap, responsible and notes, then move to `en producción` and `en control de calidad`.
- **Quality** — the inspection uses the labels "Cantidad QA", "Merma QA" and "Calidad QA" over the `producedQty`, `scrapQty` and `qualityResult` keys; approval closes the order, correction returns it to production and rejection cancels it.
- **Indicators and costs** — order counts by status, overdue orders and scrap ratio, plus subtotal/discount/tax/total summaries grouped by currency (currencies are never mixed).
- **Charts (US17-US20)** — the Gráficos tab shows a donut of orders by status, bars by priority, grouped bars of current vs minimum stock per product, and summed scrap by process stage. Charts follow the active document filters and the `charts` grants of the signed-in role; missing values are shown as "sin dato", never as zero.

### Building Custom Modules

Custom ERP modules built on this base define:

- What an **Entity** represents (e.g., customer, product, asset) plus domain-specific fields.
- What a **Document** represents (e.g., order, invoice, contract).
- Module-specific labels and validation rules.

The base module handles identity generation, timestamps, referential integrity between entities and documents, cascade deletion, navigation, and search. See `specs/001-erp-base-module/` for the full specification.

### Domain extension contract

The `domain` section of `src/module-config.js` is a **declarative** contract interpreted by `src/domain/`. It may contain data only — functions, `eval` and arbitrary code are rejected by validation.

| Key | Purpose |
|---|---|
| `documentList.columns` | Columns shown in the order list, with `key`, `label`, optional `target: 'document' \| 'entity' \| 'virtual'` and formatting hints. |
| `documentList.filters` | Select filters for the order list, driven by a field and optional options. |
| `documentList.detailSections` | Ordered detail sections with a title and fields resolved from the document and its linked product. |
| `documentList.forms` | Config-driven execution and quality forms (`execution`, `quality`) with field lists and submit labels. |
| `indicators` | `countByField`, `countWhere` and `ratio` cards computed in one pass. |
| `charts` | Declarative visualizations (`countByField`, `sumByField`, `compareFields`) with `display` (`bars`/`donut`), `source` (`entity`/`document`), fields, value labels, unit, limit and per-role grants. |
| `costSummary` | Cost fields and the `groupBy` dimension (currency in the manufacturing profile). |
| `badges` | Conditional labels with `when` predicates and `tone` (`info`, `warning`, `danger`), scoped by `target`. |
| `rules` | Validation rules enforced by `src/storage.js` before persisting. |
| `transitionActions` / `transitionGuards` | Labels and guards for lifecycle transitions, including quality-result guards. |
| `access` | Declarative roles, fictitious keys, labels and grants (`views`, `actions`, `sections`, `fields`, `filters`, `charts`, `transitions`) enforced by `src/domain/access.js` and `src/session.js`. |

Predicates support `eq`, `neq`, `in`, `notIn`, `lt`, `lte`, `gt`, `gte`, `exists` and `blank`, combined with `all`/`any`/`not`. Unknown operators, fields or lifecycle states fail configuration validation and are reported in the banner.

### Security

All user data is rendered as text or escaped: `src/security.js` provides `escapeHtml`, `setSafeText`, `safeAttribute` and `isSafeUrl`. Persisted payloads such as `<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>` and `javascript:` URLs are displayed as text, never executed or injected (FR-050).

### Tailoring via Configuration

All tailoring lives in one place: `src/module-config.js`. The file ships with `userConfig = manufacturingConfig` so the manufacturing profile is active, and includes the base defaults for reference. To return to the generic base module, set `userConfig = null`. No core code changes are required either way. Available knobs:

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

## Datos ficticios para probar los filtros

Desde esta carpeta, ejecuta `npm run dev -- --port 5175 --strictPort` y abre
[la demo local](http://localhost:5175/). Los ejemplos se guardan en el
navegador al cargar esa dirección. Volver a abrirla conserva tus cambios y
evita duplicar los ejemplos. Para abrir la aplicación sin cargar ejemplos
automáticamente, usa `?demo=0`.

En **Órdenes de Producción**, usa los filtros y compara los folios de la serie DEMO.

| Filtros activos | Folios esperados |
| --- | --- |
| Prioridad = Urgente | 9001, 9002 |
| Resultado de calidad = Corrección | 9002, 9003 |
| Urgente + Corrección + en control de calidad | 9002 |
| Solo retrasadas | 9001 |
| Sin filtros | 9001 a 9006 |

En **Buscar**, el estante industrial muestra stock bajo (5 de 12). El carro
de traslado tiene stock actual, pero carece de mínimo.

En **Buscar**, marca **Solo stock bajo** para combinar el filtro con el texto.
**Limpiar búsqueda** quita ambos filtros, muestra todos los productos y devuelve
el foco al campo.
