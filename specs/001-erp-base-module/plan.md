# Plan de Implementación: Módulo ERP de Manufactura y Operaciones

**Rama**: `001-erp-base-module` | **Fecha**: 2026-07-08 | **Actualizado**: 2026-11-17 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md`

## Resumen

Construir una aplicación web ligera con Vite que sirva como módulo ERP de manufactura y operaciones, apoyada en el módulo base de planificación de recursos empresariales. El módulo base proporciona lo común a todo módulo ERP: gestión de datos maestros (**Entidades**), documentos transaccionales vinculados (**Documentos**), flujos de crear, editar, eliminar y buscar, validación y persistencia local, construido con HTML, CSS y JavaScript vanilla.

La aplicación se presenta como un espacio de trabajo ERP coherente: una barra superior con marca (logotipo derivado y nombre del módulo) y una barra lateral persistente de botones de módulo envuelven cada pantalla. La pantalla de entrada es un panel con acciones rápidas y estadísticas de registros en vivo.

La adaptación a manufactura se realiza mediante el único archivo de configuración `src/module-config.js`; el código central permanece intacto:

| Concepto base | En Manufactura y Operaciones |
|---|---|
| Entidad | Producto (producto terminado, materia prima o insumo) |
| Documento | Orden de Producción |

El archivo de configuración cubre terminología, campos personalizados del dominio (etapa del proceso, máquina, lote, prioridad, cantidad producida, merma, resultado de calidad, entre otros), ciclo de vida de la orden, color de acento, vistas de lista/detalle, indicadores, umbrales y reglas del dominio. El detalle está en [data-model.md](data-model.md) y en el contrato de extensión [contracts/module-extension.md](contracts/module-extension.md).

### Decisiones de clarificación aplicadas

- **SC-008 aplica a US1-US5**: todo el perfil de manufactura se implementa mediante configuración y puntos de extensión declarativos, sin modificar archivos fuente centrales.
- **Lista y detalle de órdenes**: viven dentro del módulo Documentos; la barra lateral mantiene cuatro módulos y no se añade navegación específica de dominio.
- **Sanitización XSS**: FR-050 exige escapar todo valor introducido por el usuario antes de insertarlo en el DOM.
- **Referencias a "la lista"**: en las historias de usuario de entidades y criterios de éxito significan los resultados de la pantalla Buscar; la pantalla de gestión no muestra la lista de entidades.
- **Stock bajo el mínimo**: se marca solo si ambos valores existen y `currentStock < minStock`; si falta alguno, se muestra "sin dato" sin insignia.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS
**Dependencias Principales**: Vite 8, sin framework de interfaz pesado
**Pruebas**: Vitest 4 con jsdom para unitarias e integración; Playwright para E2E (5 archivos, 11 recorridos)
**Almacenamiento**: localStorage del navegador para una instancia del módulo de espacio único
**Plataforma Objetivo**: Navegadores modernos de escritorio y móviles
**Tipo de Proyecto**: Aplicación web de página única
**Objetivos de Rendimiento**: listas y búsqueda responsivas con 500 entidades y 300 órdenes; umbrales automatizados en `tests/e2e/performance.spec.js`: render de lista < 5 s, filtro < 3 s, búsqueda < 3 s y apertura de detalle < 3 s; agregaciones en una sola pasada
**Restricciones**: huella mínima de librerías, despliegue simple, sin backend; la lógica de dominio debe declararse en configuración y ejecutarse mediante un motor genérico, sin código específico de manufactura en archivos centrales (SC-008, XR-006)
**Alcance/Escala**: CRUD de datos maestros (Producto) y documentos transaccionales (Orden de Producción), búsqueda, lista/detalle configurable, indicadores, costos por moneda, reglas de dominio declarativas y 15 historias de usuario

No quedan elementos `NEEDS CLARIFICATION` en el contexto técnico: todas las decisiones están resueltas en [research.md](research.md).

## Verificación de la Constitución

*GATE: debe pasar antes de la investigación de la Fase 0. Se reevalúa tras el diseño de la Fase 1.*

| Principio | Cómo se cumple | Puerta de verificación | Resultado |
|---|---|---|---|
| **I. Calidad y mantenibilidad** | La lógica de dominio se concentra en un motor declarativo pequeño (`src/domain/`) con operaciones explícitas y validadas; no se usa `eval` ni expresiones arbitrarias. Los límites entre almacenamiento, configuración, vistas y reglas están separados. | Prueba estructural automática en `tests/unit/domain-boundary.test.js` complementa la inspección: los términos de manufactura (`itemType`, `producedQty`, `qualityResult`, etc.) aparecen solo en `src/module-config.js` y en datos de demostración (`src/demo-data.js`); `app.js`, `storage.js`, `shell.js` y los componentes son genéricos. | Pasa |
| **II. Pruebas y verificación** | Unitarias del motor, integración por vista y E2E por recorrido crítico. `npm test`: 37 archivos / 271 pruebas en verde; `npm run test:e2e`: 11/11 en verde. Las pruebas de integración T072 (US14) y T075 (US15) existen y pasan; la puerta T086 está cerrada. | Ejecución de `npm test` y `npm run test:e2e`; ninguna historia se cierra sin sus pruebas. | Pasa |
| **III. Consistencia de experiencia** | Todas las vistas usan el marco y los tokens existentes; estados vacíos, errores, insignias y filtros siguen los mismos patrones; se conservan foco y etiquetas accesibles (incluida la barra contraída a 390 px). | Revisión de estados vacíos/error, `aria-*`, foco y comportamiento responsivo; recorrido `demo.spec.js`. | Pasa |
| **IV. Rendimiento y fiabilidad** | Listas y búsqueda con 500 registros; indicadores y costos calculados en una pasada; sin round-trips ni recálculos por render. | `tests/e2e/performance.spec.js` con 500 productos y 300 órdenes y umbrales documentados en [quickstart.md](quickstart.md). | Pasa |
| **Estándares de calidad** | Lint, compilación y formato en verde. Se fijó `"endOfLine": "auto"` en `.prettierrc.json` y se aplicó Prettier a los archivos con diferencias reales de estilo; `npm run format:check` pasa. | `npm run lint`, `npm run format:check`, `npm run build`. | Pasa |
| **Flujo de trabajo** | Incrementos con criterios de aceptación, pruebas y notas de validación; decisiones registradas en este plan y en `research.md`. | Revisión por incremento y verificación de regresiones. | Pasa |

**Resultado de la puerta**: pasa sin condiciones pendientes. No hay violaciones de los principios de la constitución; T072/T075, la corrección de formato y la guarda estructural de SC-008/XR-006 están cerradas. La complejidad adicional del motor declarativo y de Playwright está justificada en *Seguimiento de complejidad*.

**Nota resuelta (I6)**: los dos literales de interfaz que quedaban en `src/app.js` (`'Producto: '` y `'No se pudo actualizar la orden.'`) ahora se derivan de `labelFor('entity')` y `labelFor('document')`, completando FR-029.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-erp-base-module/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   ├── entity-storage.md
│   └── module-extension.md
└── tasks.md             # /speckit.tasks (no generado por /speckit.plan)
```

### Código Fuente (raíz del repositorio)

```text
index.html                 (punto de entrada único; marco, panel, formularios y selectores)
src/
├── main.js
├── styles.css
├── storage.js             (persistencia, validación base y reglas declarativas)
├── security.js            (escape centralizado y renderizado seguro)
├── demo-data.js           (datos de demostración)
├── module-config.js       (userConfig = manufacturingConfig; perfil declarativo)
├── app.js                 (cableado de vistas, navegación y acciones)
├── components/
│   ├── shell.js           (barra superior, logotipo SVG, barra lateral, módulo activo)
│   ├── dashboard.js       (acciones rápidas y tarjetas de estadísticas)
│   ├── custom-fields.js   (campos declarados)
│   ├── document-list.js   (lista con filtros y detalle configurable)
│   └── indicators.js      (indicadores, insignias y costos por moneda)
└── domain/
    ├── config-schema.js   (validación y valores por defecto)
    ├── fields.js          (resolución de campos base y personalizados)
    ├── views.js           (columnas, filtros, secciones y formato "sin dato")
    ├── metrics.js         (conteos, ratios, retrasos y agregación por moneda)
    └── rules.js           (predicados, guardas de transición y reglas)

tests/
├── unit/
├── integration/
├── e2e/
└── setup/
```

**Decisión de estructura**: aplicación Vite simple con un único punto de entrada HTML, módulos JavaScript pequeños y CSS en un archivo separado. La persistencia es `localStorage`. Las capacidades específicas del dominio se resuelven con un motor declarativo en `src/domain/` que interpreta `module-config.js`, de modo que adaptar el módulo a otro dominio requiere editar la configuración y no los archivos centrales (SC-008).

## Extensión Declarativa del Dominio

La configuración de manufactura no contiene funciones ni código ejecutable; declara datos que el motor genérico interpreta:

```js
domain: {
  documentList: {
    columns: ['series', 'folio', 'entity_id', 'quantity', 'startDate', 'endDate', 'status'],
    filters: [{ key: 'status', op: 'in', optionsFrom: 'statusLifecycle.statuses' }],
    detailSections: [
      { title: 'Pedido', fields: ['series', 'folio', 'entity_id', 'quantity', 'startDate', 'endDate'] },
      { title: 'Ejecución', fields: ['machine', 'batchCode', 'processStage', 'producedQty', 'scrapQty'] },
      { title: 'Calidad', fields: ['qualityResult', 'notes'] }
    ]
  },
  indicators: [
    { id: 'byStatus', type: 'countByField', field: 'status', label: 'Órdenes por estado' },
    { id: 'overdue', type: 'countWhere', where: { all: [
      { field: 'endDate', op: 'lt', value: 'today' },
      { field: 'status', op: 'notIn', value: ['terminada', 'cancelada'] }
    ] }, label: 'Órdenes retrasadas' },
    { id: 'scrapRate', type: 'ratio', numerator: 'scrapQty', denominator: 'producedQty', label: 'Merma' }
  ],
  costSummary: { groupBy: 'currency', fields: ['subtotal', 'discount', 'taxAmount', 'totalAmount'] },
  badges: [
    { target: 'entity', when: { field: 'currentStock', op: 'lt', ref: 'minStock' }, label: 'Stock bajo el mínimo', tone: 'warning' }
  ],
  rules: [
    { target: 'document', when: { field: 'status', op: 'in', value: ['en control de calidad'] },
      require: { field: 'qualityResult', op: 'in', value: ['Aprobado', 'Corrección', 'Rechazado'] },
      message: 'Registre el resultado de calidad antes de cerrar la orden.' }
  ]
}
```

**Reglas del contrato**:

- Las operaciones permitidas se limitan a una lista blanca (`eq`, `neq`, `in`, `notIn`, `lt`, `lte`, `gt`, `gte`, `exists`, `blank`).
- Toda referencia a campo debe existir en los campos base o en `customFields`; si no, la configuración es inválida y se informa (FR-025).
- Las insignias y métricas que dependen de valores ausentes se omiten y muestran "sin dato"; no se convierten en cero.
- Las reglas no ejecutan código: son predicados y mensajes declarativos evaluados por `src/domain/rules.js`.
- El ciclo de vida de estados es la fuente de verdad para las transiciones; las guardas de dominio se evalúan antes de persistir.
- Añadir o cambiar el perfil de dominio se hace en `module-config.js`; los archivos centrales no cambian (SC-008, XR-006).

## Seguridad de Renderizado (FR-050)

- `src/security.js` expone `escapeHtml`, `setSafeText`, `safeAttribute` e `isSafeUrl`; los datos de usuario nunca se interpolan en `innerHTML`.
- Las plantillas estáticas pueden usar `innerHTML` solo con contenido controlado por el código.
- Los valores se escapan al mostrar listas, detalles, insignias, mensajes de error y configuración inválida, así como al construir atributos.
- Las pruebas incluyen `<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>` y URLs `javascript:`; `tests/e2e/security.spec.js` verifica payloads persistidos.
- No se usan manejadores de eventos inline ni `eval`; el motor declarativo no ejecuta expresiones arbitrarias.

## Fase 0: Investigación

**Objetivo**: resolver las decisiones técnicas y dejar constancia de alternativas.

Decisiones registradas en [research.md](research.md):

1. Motor declarativo con operaciones de lista blanca en lugar de funciones o `eval` en la configuración.
2. Playwright para E2E, manteniendo Vitest + jsdom para unitarias e integración.
3. Escape centralizado en `security.js` y prohibición de `innerHTML` con datos de usuario.
4. Claves canónicas `producedQty`, `scrapQty` y `qualityResult` para calidad, con etiquetas de interfaz alineadas a la especificación.
5. Umbral estricto de stock bajo y comportamiento "sin dato" cuando falta un valor.
6. Lista y detalle de órdenes dentro del módulo Documentos, sin quinto módulo de navegación.
7. Activación del perfil `manufacturingConfig` como cambio de configuración, no de código.
8. Verificación automatizada (`tests/unit/domain-boundary.test.js`) de que los literales de dominio quedan confinados a la configuración y a datos de demostración.
9. Normalización del fin de línea aplicada con `"endOfLine": "auto"` para que `format:check` sea reproducible en checkout de Windows (`core.autocrlf=true`).

**Salida**: `research.md` sin `NEEDS CLARIFICATION`.

## Fase 1: Diseño y Contratos

**Prerrequisitos**: `research.md` completo.

1. **Modelo de datos**: [data-model.md](data-model.md) documenta entidades, campos base y personalizados, reglas de validación, ciclo de vida y vistas de dominio.
2. **Contratos**:
   - [contracts/entity-storage.md](contracts/entity-storage.md): forma persistida, operaciones y expectativas de validación.
   - [contracts/module-extension.md](contracts/module-extension.md): esquema de configuración, validación, operaciones permitidas y garantía de no modificar archivos centrales.
3. **Guía de validación**: [quickstart.md](quickstart.md) con escenarios de manufactura, seguridad, stock, rendimiento y resultados de las puertas.

**Salida**: `data-model.md`, `contracts/*` y `quickstart.md` actualizados.

## Estado del Avance

| Entregable | Estado verificado (2026-11-17) |
|---|---|
| Especificación funcional | Completada; 5 clarificaciones integradas, 15 historias de usuario |
| Modelo de datos y contratos | Completados y alineados con la configuración declarativa |
| Perfil `manufacturingConfig` | Activo (`export const userConfig = manufacturingConfig`) y sin aviso de configuración inválida |
| Motor declarativo (`src/domain/`) | Completado; sin código ejecutable en la configuración |
| Lógica de dominio US1-US5 | Implementada de forma declarativa; sin lógica de manufactura en archivos centrales |
| Regresiones US6-US13 | Completadas |
| Filtros US14/US15 | Declaración, verificación manual y pruebas de integración T072 y T075 completas y en verde |
| `npm test` | 37 archivos / 271 pruebas en verde |
| `npm run test:e2e` | 11/11 recorridos en verde |
| `npm run lint` | Sin errores |
| `npm run build` | Compilación de producción correcta |
| `npm run format:check` | Pasa: `"endOfLine": "auto"` aplicado y estilo normalizado con Prettier |
| Guarda SC-008/XR-006 | `tests/unit/domain-boundary.test.js` incluida en `npm test` |
| Tareas | 86/86 completadas; puerta T086 cerrada |

**Nota sobre el avance**: el estado anterior del plan indicaba elementos como pendientes que ya están terminados (E2E, lint, lógica de dominio, documentación, formato y las pruebas T072/T075 del hallazgo C1). Esa información se considera obsoleta; la fuente de verdad es `tasks.md` y las ejecuciones de las puertas registradas arriba.

## Seguimiento de Complejidad

> Informativo: no hay violaciones de la constitución que justificar.

| Decisión | Justificación | Coste / mitigación |
|---|---|---|
| Motor declarativo de dominio | Única forma de cumplir SC-008/XR-006 sin duplicar código de manufactura en archivos centrales. | Mayor complejidad de validación; mitigada con lista blanca de operaciones y pruebas unitarias del esquema. |
| Playwright como dependencia de desarrollo | La constitución exige cobertura E2E de recorridos críticos. | Dependencia solo de desarrollo; no afecta al bundle de producción. |
| Escape centralizado y prohibición de `innerHTML` con datos de usuario | FR-050 exige prevenir XSS de forma verificable. | Auditoría de vistas cubierta con pruebas de payloads. |
| Indicadores calculados en una pasada | Mantiene la responsividad con 500 registros y evita recálculos por render. | Lógica de agregación aislada en `src/domain/metrics.js`. |
| `endOfLine: "auto"` en Prettier | Hace `format:check` reproducible tanto en checkout CRLF (Windows) como LF. | Ajuste de configuración sin impacto en el código; se verifica con `npm run format:check`. |
