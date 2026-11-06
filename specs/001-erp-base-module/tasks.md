# Tareas: Módulo ERP de Manufactura y Operaciones

**Entrada**: Documentos de diseño desde `/specs/001-erp-base-module/`
**Prerrequisitos**: [plan.md](plan.md) (obligatorio), [spec.md](spec.md) (obligatorio para las historias de usuario), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Pruebas**: La constitución y el plan exigen pruebas unitarias, de integración y E2E. Las tareas de prueba se incluyen y deben escribirse antes de la implementación correspondiente.

**Estado de partida**: el núcleo base (FR-001 a FR-039, HU6-HU13) está implementado con 12 archivos y 111 pruebas en verde; `npm run build` compila. El trabajo pendiente es el motor declarativo y el perfil de manufactura (HU1-HU5), más las puertas de seguridad, E2E y lint.

**Estado final (2026-11-05)**: las 78 tareas están completadas. Motor declarativo, perfil de manufactura (HU1-HU5), regresiones de HU6-HU13, seguridad, E2E y documentación entregados. Puerta de calidad: `npm test` 35 archivos / 263 pruebas en verde, `npm run lint` sin errores, `npm run format:check` conforme, `npm run build` compila y `npm run test:e2e` 10/10 en verde. El perfil se activa desde `userConfig = manufacturingConfig` sin aviso de configuración inválida.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencia de tareas incompletas).
- **[Historia]**: `[US1]`…`[US13]` para tareas de historia; sin etiqueta en configuración, fundacional y pulido.
- Todas las tareas incluyen la ruta de archivo exacta.

## Convenciones de rutas

- Código: `src/` y `index.html` en la raíz del repositorio.
- Pruebas: `tests/unit/`, `tests/integration/` y `tests/e2e/`.
- Documentación de la funcionalidad: `specs/001-erp-base-module/`.

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Añadir las herramientas de calidad que hoy no existen (lint, formato y E2E) sin alterar el comportamiento de la aplicación.

- [X] T001 Añadir ESLint y Prettier como dependencias de desarrollo y los scripts `lint`, `format` y `format:check` en `package.json`
- [X] T002 [P] Crear la configuración de ESLint en `eslint.config.js` y la de Prettier en `.prettierrc.json` y `.prettierignore`
- [X] T003 [P] Añadir `@playwright/test` como dependencia de desarrollo, el script `test:e2e` en `package.json` y la configuración de Playwright en `playwright.config.js` con servidor Vite en el puerto 4173 (`npm run dev -- --port 4173`)
- [X] T004 [P] Crear `tests/e2e/` y `tests/e2e/fixtures.js` con ayudantes para limpiar `localStorage` y sembrar productos y órdenes de prueba

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Implementar el motor declarativo, la seguridad de renderizado y la validación de configuración de los que dependen todas las historias de manufactura.

**⚠️ CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [X] T005 Crear `src/domain/config-schema.js` con `validateDomainConfig(config, baseFields)` para validar `documentList`, `indicators`, `costSummary`, `badges` y `rules`: operadores de lista blanca, campos existentes, tipos permitidos, estados del ciclo de vida y secciones no vacías
- [X] T006 Extender `normalizeConfig` en `src/module-config.js` para validar y fusionar la sección `domain` mediante `src/domain/config-schema.js`, conservando compatibilidad cuando `domain` no existe
- [X] T007 [P] Crear `src/security.js` con `escapeHtml`, `setSafeText`, `safeAttribute` y `isSafeUrl`; prohibir la interpolación de datos de usuario en `innerHTML`
- [X] T008 [P] Crear `src/domain/views.js` con `resolveColumns`, `resolveFilters`, `resolveDetailSections`, `applyFilters` y `formatValue` (incluido "sin dato" para valores ausentes)
- [X] T009 [P] Crear `src/domain/metrics.js` con `computeIndicator`, `computeIndicators`, `isOverdue` y `summarizeCosts`; calcular en una sola pasada y nunca sumar monedas distintas
- [X] T010 [P] Crear `src/domain/rules.js` con `evaluatePredicate` (operadores `eq`, `neq`, `in`, `notIn`, `lt`, `lte`, `gt`, `gte`, `exists`, `blank`), `evaluateRules` y `guardTransition`
- [X] T011 [P] Añadir pruebas unitarias de validación de configuración, operadores desconocidos, campos inexistentes y estados inválidos en `tests/unit/domain/config-schema.test.js`
- [X] T012 [P] Añadir pruebas unitarias de columnas, filtros, secciones y formato "sin dato" en `tests/unit/domain/views.test.js`
- [X] T013 [P] Añadir pruebas unitarias de conteos por estado, retrasos, ratio de merma con denominador ausente o cero y costos por moneda en `tests/unit/domain/metrics.test.js`
- [X] T014 [P] Añadir pruebas unitarias de predicados, reglas incumplidas y guardas de transición en `tests/unit/domain/rules.test.js`
- [X] T015 [P] Añadir pruebas unitarias de escape de HTML, atributos y URLs `javascript:` en `tests/unit/security.test.js`
- [X] T016 Extender `src/storage.js` para validar campos personalizados numéricos (finitos y no negativos cuando la configuración lo declare) y evaluar `evaluateRules` antes de persistir entidades y documentos
- [X] T017 [P] Añadir pruebas unitarias de restricciones numéricas, valores ausentes y rechazo por regla en `tests/unit/storage-domain.test.js`
- [X] T018 Añadir los contenedores de lista/detalle de documentos e indicadores en `index.html` y cargar la configuración `domain` al arrancar en `src/app.js`
- [X] T019 [P] Añadir estilos base para lista, detalle por secciones, tarjetas de indicadores, insignias y estados vacíos en `src/styles.css`
- [X] T020 Declarar el perfil de manufactura en `src/module-config.js`: `domain.documentList`, `domain.indicators`, `domain.costSummary` y `domain.badges` para HU1-HU5, sin funciones ni código ejecutable; las reglas específicas de calidad se añaden en T049

**Punto de control**: el motor declarativo valida la configuración, calcula vistas/métricas/reglas y la aplicación sigue arrancando con los valores predeterminados cuando `userConfig` es `null`.

---

## Fase 3: Historia de Usuario 1 - Evaluar pedidos, confirmar/rechazar y supervisar indicadores y costos (Prioridad: P1) 🎯 MVP

**Objetivo**: Permitir que el jefe de planta consulte la lista y el detalle de órdenes, confirme o rechace pedidos planificados y revise indicadores y costos dentro del módulo Documentos.

**Prueba Independiente**: Abrir la lista de órdenes, filtrar `planificada`, revisar el detalle, confirmar una orden y verla en `liberada`, rechazar otra y verla en `cancelada`; abrir la sección de indicadores y comprobar conteos, retrasos, merma y costos por moneda.

### Pruebas para la Historia de Usuario 1

- [X] T021 [P] [US1] Añadir pruebas de integración de lista con columnas configuradas, filtro por estado, detalle por secciones y estado vacío en `tests/integration/document-list.test.js`
- [X] T022 [P] [US1] Añadir pruebas de integración de confirmar/rechazar, nota opcional y rechazo de transiciones inválidas en `tests/integration/order-actions.test.js`
- [X] T023 [P] [US1] Añadir pruebas de integración de indicadores por estado, retrasos, merma y costos agrupados por moneda, incluido el estado vacío, en `tests/integration/indicators.test.js`

### Implementación para la Historia de Usuario 1

- [X] T024 [P] [US1] Implementar `src/components/document-list.js` para renderizar la lista con columnas y filtros declarados, el detalle por secciones y un estado vacío claro
- [X] T025 [P] [US1] Implementar `src/components/indicators.js` para renderizar conteos por estado, retrasos, merma por orden y resumen de costos por moneda
- [X] T026 [US1] Integrar lista, filtros, detalle e indicadores dentro del módulo Documentos en `index.html` y `src/app.js`, sin añadir un quinto módulo a la barra lateral
- [X] T027 [US1] Implementar las acciones confirmar y rechazar pedidos con guardas de ciclo de vida y nota opcional en `src/app.js`, reutilizando `guardTransition` de `src/domain/rules.js`
- [X] T028 [US1] Mostrar stock actual y stock mínimo del producto en el detalle de la orden, con "sin dato" cuando falte algún valor, en `src/app.js` usando `formatValue` de `src/domain/views.js`
- [X] T029 [P] [US1] Añadir estilos de lista, detalle, indicadores, costos e insignias en `src/styles.css`

**Punto de control**: la HU1 funciona de forma independiente y es la primera entrega demostrable del perfil de manufactura.

---

## Fase 4: Historia de Usuario 2 - Editar y eliminar productos (Prioridad: P1)

**Objetivo**: Corregir o eliminar productos validando nombre, código, tipo de ítem, unidad de medida, stock y plazo de reposición, con confirmación de borrado en cascada.

**Prueba Independiente**: Cambiar el stock de un producto y verlo en los resultados de Buscar; intentar guardar sin tipo de ítem o con stock negativo; eliminar un producto con órdenes y comprobar el aviso y la eliminación en cascada.

- [X] T030 [P] [US2] Añadir pruebas de integración de edición, campos obligatorios, valores negativos, confirmación de borrado y cascada en `tests/integration/product-edit-delete.test.js`
- [X] T031 [US2] Reforzar en `src/storage.js` la validación de `itemType`, `unitOfMeasure`, `currentStock`, `minStock` y `leadTimeDays` como obligatorios o numéricos no negativos según la configuración
- [X] T032 [US2] Actualizar la confirmación de borrado en `src/app.js` para advertir que se eliminarán las órdenes asociadas y abortar si el usuario cancela
- [X] T033 [US2] Refrescar los resultados de búsqueda y limpiar la selección tras editar o eliminar un producto en `src/app.js`
- [X] T034 [P] [US2] Añadir pruebas unitarias de regresión de validación de entidad en `tests/unit/storage.test.js`

**Punto de control**: la HU2 funciona de forma independiente sobre el catálogo de productos.

---

## Fase 5: Historia de Usuario 3 - Administrar stock, ubicaciones, proveedores y plazos de reposición (Prioridad: P1)

**Objetivo**: Mantener el catálogo de stock y señalar "stock bajo el mínimo" solo cuando ambos valores existen y el actual es estrictamente menor; mostrar "sin dato" cuando falte alguno.

**Prueba Independiente**: Crear un ítem con stock actual 5 y mínimo 10 y verlo marcado; dejar el mínimo vacío y comprobar que se guarda con "sin dato" y sin insignia; editar el stock y ver el cambio en Buscar.

- [X] T035 [P] [US3] Añadir pruebas unitarias de la regla de stock bajo (ambos valores presentes, comparación estricta, valores ausentes y frontera `actual = mínimo`) en `tests/unit/domain/stock.test.js`
- [X] T036 [P] [US3] Añadir pruebas de integración de creación/edición de stock, búsqueda, insignia de stock bajo y "sin dato" en `tests/integration/product-stock.test.js`
- [X] T037 [US3] Implementar la insignia de stock bajo y la visualización de stock con "sin dato" en los resultados de Buscar en `src/app.js`, usando `src/domain/rules.js` y `formatValue`
- [X] T038 [US3] Declarar etiquetas y campos de stock, ubicación, proveedor y plazo de reposición en `manufacturingConfig` en `src/module-config.js`, usando `address` para la ubicación de almacenamiento
- [X] T039 [P] [US3] Asegurar que la búsqueda recorre campos base y personalizados de stock sin convertir valores ausentes en cero en `src/storage.js`
- [X] T040 [P] [US3] Añadir estilos de insignia de advertencia y texto "sin dato" en `src/styles.css`

**Punto de control**: la HU3 funciona de forma independiente y la regla de stock queda cubierta por pruebas unitarias y de integración.

---

## Fase 6: Historia de Usuario 4 - Supervisar la ejecución de órdenes durante el turno (Prioridad: P1)

**Objetivo**: Consultar órdenes liberadas, asignar máquina, lote y etapa, registrar cantidades producidas y merma, guardar notas y enviar la orden a control de calidad.

**Prueba Independiente**: Seleccionar una orden liberada, registrar máquina y lote, iniciar producción, actualizar etapa y cantidad, guardar una incidencia y enviarla a control de calidad; reabrirla y comprobar que los datos y el estado persisten.

**Dependencia**: requiere la lista y el detalle de documentos de la HU1.

- [X] T041 [P] [US4] Añadir pruebas de integración de órdenes liberadas, asignación de máquina/lote/etapa, inicio de producción, actualización de cantidades y notas, envío a calidad y rechazo de valores inválidos en `tests/integration/production-execution.test.js`
- [X] T042 [US4] Implementar la sección de ejecución editable (máquina, lote, etapa, cantidades producidas y merma, notas) en `src/components/document-list.js`
- [X] T043 [US4] Implementar el guardado de ejecución y las transiciones `liberada → en producción → en control de calidad` en `src/app.js`, reutilizando `guardTransition`
- [X] T044 [US4] Validar `processStage` obligatorio y `producedQty`/`scrapQty` finitos y no negativos en `src/storage.js`
- [X] T045 [US4] Mostrar número, producto, cantidad solicitada, prioridad y fechas en la lista de órdenes liberadas en `src/components/document-list.js`
- [X] T046 [P] [US4] Añadir estilos del formulario de ejecución y de las acciones de turno en `src/styles.css`

**Punto de control**: la HU4 funciona sobre el detalle de la HU1 y conserva los datos entre turnos.

---

## Fase 7: Historia de Usuario 5 - Inspeccionar lotes, registrar merma y determinar calidad (Prioridad: P1-P2)

**Objetivo**: Registrar "Cantidad QA", "Merma QA", "Calidad QA" y notas, y mover la orden a terminada, de vuelta a producción o a cancelada según el resultado.

**Prueba Independiente**: Abrir una orden en control de calidad, registrar los tres valores QA y aprobar para terminarla; repetir con corrección y con rechazo; comprobar que los valores negativos o no numéricos y las transiciones no permitidas se rechazan.

**Dependencia**: requiere la lista y el detalle de documentos de la HU1.

- [X] T047 [P] [US5] Añadir pruebas de integración de etiquetas QA, aprobación, corrección, rechazo, valores inválidos y guarda por resultado en `tests/integration/quality-inspection.test.js`
- [X] T048 [US5] Implementar la sección de calidad con las etiquetas "Cantidad QA", "Merma QA" y "Calidad QA" sobre las claves `producedQty`, `scrapQty` y `qualityResult` en `src/components/document-list.js`
- [X] T049 [US5] Declarar en `manufacturingConfig.domain.rules` las guardas de calidad: resultado obligatorio antes de cerrar y correspondencia entre resultado y estado destino en `src/module-config.js`
- [X] T050 [US5] Evaluar las reglas de calidad declaradas (resultado → estado destino) en `src/domain/rules.js` y aplicarlas en `src/app.js`, sin codificar los estados de manufactura en el motor
- [X] T051 [US5] Conservar `scrapQty`, `qualityResult` y notas al devolver a producción o cancelar en `src/storage.js` y `src/app.js`
- [X] T052 [P] [US5] Añadir estilos de la sección y las insignias de calidad en `src/styles.css`

**Punto de control**: la HU5 cierra el recorrido de la orden y mantiene la trazabilidad de merma y calidad.

---

## Fase 8: Historia de Usuario 6 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

**Objetivo**: Confirmar que todas las etiquetas visibles, incluidas las nuevas vistas de dominio, provienen de la configuración.

**Prueba Independiente**: Activar `manufacturingConfig` y comprobar que pestañas, botones, formularios, encabezados, listas, indicadores y estados vacíos usan Producto/Productos y Orden de Producción/Órdenes de Producción.

- [X] T053 [P] [US6] Añadir una prueba de regresión de etiquetas configurables en todas las pantallas, incluidas lista, detalle, indicadores y estados vacíos, en `tests/integration/relabeling-domain.test.js`
- [X] T054 [US6] Sustituir cualquier texto fijo de las vistas nuevas por `labelFor`/configuración en `src/components/document-list.js`, `src/components/indicators.js` y `src/app.js`

---

## Fase 9: Historia de Usuario 7 - Declarar campos personalizados para los registros (Prioridad: P1)

**Objetivo**: Confirmar que los campos personalizados aparecen en formularios, validación, listas, detalle y búsqueda, incluidos los campos de manufactura.

**Prueba Independiente**: Declarar un campo numérico obligatorio, comprobar que se muestra como número, bloquea el guardado vacío, aparece en lista/detalle y coincide en la búsqueda.

- [X] T055 [P] [US7] Añadir una prueba de regresión de campo numérico obligatorio, visualización en lista/detalle y búsqueda por valor personalizado en `tests/integration/custom-fields-domain.test.js`
- [X] T056 [US7] Incluir los campos personalizados declarados en columnas, secciones de detalle y búsqueda, respetando tipos y valores ausentes, en `src/domain/views.js` y `src/storage.js`

---

## Fase 10: Historia de Usuario 13 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

**Objetivo**: Confirmar que el marco con logotipo, nombre, cuatro módulos, módulo activo y color de acento se mantiene con el perfil de manufactura.

**Prueba Independiente**: En cada pantalla se ven el logotipo y el nombre configurado, la barra lateral mantiene Panel/Productos/Órdenes/Buscar, el módulo activo está resaltado y el color de acento se aplica.

- [X] T057 [P] [US13] Añadir una prueba de regresión de logotipo, nombre, cuatro módulos, módulo activo, color de acento y ausencia de quinto módulo en `tests/integration/workspace-shell-domain.test.js`
- [X] T058 [US13] Ajustar `src/components/shell.js` e `index.html` si las etiquetas de manufactura rompen el logotipo, el artículo gramatical o la navegación; la lista/detalle de órdenes permanece dentro de Documentos

---

## Fase 11: Historia de Usuario 8 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

**Objetivo**: Mantener la búsqueda por nombre, código, categoría y palabras clave, incluidos campos personalizados, con estado vacío claro y respuesta ágil.

**Prueba Independiente**: Con múltiples productos, buscar un término coincidente y ver solo coincidencias; buscar algo inexistente y ver el estado vacío; repetir con 500 registros sin retraso perceptible.

- [X] T059 [P] [US8] Añadir una prueba de regresión de coincidencias, estado vacío y 500 registros en `tests/integration/search-domain.test.js`
- [X] T060 [US8] Asegurar una búsqueda insensible a mayúsculas en una sola pasada sobre campos base y personalizados en `src/storage.js`

---

## Fase 12: Historia de Usuario 9 - Registrar una fecha objetivo (Prioridad: P2)

**Objetivo**: Mantener la fecha objetivo opcional y visible en los resultados de búsqueda.

**Prueba Independiente**: Guardar una entidad con fecha objetivo y verla en la lista de resultados; guardarla sin fecha y comprobar que se guarda igualmente.

- [X] T061 [P] [US9] Añadir una prueba de regresión de fecha objetivo opcional, válida y visible en `tests/integration/target-date.test.js`
- [X] T062 [US9] Mostrar `targetDate` en los resultados de búsqueda cuando exista en `src/app.js`

---

## Fase 13: Historia de Usuario 10 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

**Objetivo**: Mantener el alta, edición, eliminación y cascada de documentos, ahora con detalle de dominio dentro del módulo Documentos.

**Prueba Independiente**: Añadir un documento a un producto, verlo en la gestión de documentos, editarlo, eliminarlo y comprobar que al borrar el producto se eliminan sus órdenes.

- [X] T063 [P] [US10] Añadir pruebas de integración de creación, edición, eliminación, validación obligatoria y cascada de documentos en `tests/integration/document-management.test.js`
- [X] T064 [US10] Asegurar que la gestión de documentos sigue dentro del módulo Documentos y reutiliza la lista/detalle de dominio en `src/app.js`

---

## Fase 14: Historia de Usuario 11 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Mantener la pantalla Buscar accesible desde la barra lateral y la acción rápida, con resultados y estado vacío.

**Prueba Independiente**: Abrir Buscar desde la barra lateral y desde el panel, buscar un término y ver solo coincidencias; comprobar el estado vacío y el regreso al Panel.

- [X] T065 [P] [US11] Añadir una prueba de regresión de acceso a Buscar, resultados, estado vacío, regreso al Panel y 500 registros en `tests/integration/search-screen.test.js`
- [X] T066 [US11] Asegurar la navegación y el estado vacío de la pantalla Buscar en `src/app.js`

---

## Fase 15: Historia de Usuario 12 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

**Objetivo**: Mantener las transiciones configuradas, el rechazo de transiciones inválidas y el estado de texto libre cuando no hay ciclo de vida.

**Prueba Independiente**: Configurar un ciclo de vida, comprobar que solo se ofrecen estados alcanzables y que una transición inválida se rechaza; sin ciclo de vida, el estado sigue siendo texto libre.

- [X] T067 [P] [US12] Añadir pruebas de integración de estados alcanzables, transiciones inválidas y texto libre sin ciclo de vida en `tests/integration/lifecycle-domain.test.js`
- [X] T068 [US12] Integrar las guardas de dominio con el ciclo de vida antes de persistir en `src/domain/rules.js` y `src/storage.js`

---

## Fase 16: Pulido y Preocupaciones Transversales

**Propósito**: Cerrar seguridad, E2E, rendimiento, documentación y puertas de calidad.

- [X] T069 [P] Añadir pruebas de integración con payloads `<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>` y `javascript:` en nombre, notas y campos personalizados en `tests/integration/security-xss.test.js`
- [X] T070 [P] Añadir el recorrido E2E base (crear/editar/eliminar/buscar entidad y gestionar documento) en `tests/e2e/base-module.spec.js`
- [X] T071 [P] Añadir el recorrido E2E de manufactura (confirmar/rechazar, ejecutar, control de calidad y persistencia tras recarga) en `tests/e2e/manufacturing.spec.js`
- [X] T072 [P] Añadir el recorrido E2E de seguridad con payloads persistidos en `tests/e2e/security.spec.js`
- [X] T073 [P] Añadir la prueba E2E de rendimiento con 500 registros y medición de interacción en `tests/e2e/performance.spec.js`
- [X] T074 Ejecutar `npm run lint` y corregir las violaciones de `src/` y `tests/` sin cambiar comportamiento
- [X] T075 [P] Actualizar `README.md` con el contrato de extensión, el perfil de manufactura, la activación por configuración y los comandos de prueba
- [X] T076 [P] Actualizar el estado final en `specs/001-erp-base-module/data-model.md` y registrar los resultados de validación en `specs/001-erp-base-module/quickstart.md`
- [X] T077 Activar `manufacturingConfig` en `userConfig` dentro de `src/module-config.js` y verificar que no aparece el aviso de configuración inválida
- [X] T078 Ejecutar la puerta completa `npm test`, `npm run lint`, `npm run build` y `npm run test:e2e` definida en `package.json`; corregir regresiones en `src/` y `tests/` y dejar constancia del resultado

---

## Dependencias y Orden de Ejecución

### Dependencias por fase

- **Fase 1 (Configuración)**: sin dependencias; puede empezar de inmediato.
- **Fase 2 (Fundacional)**: depende de la Fase 1; bloquea todas las historias.
- **Fases 3-15 (Historias)**: dependen de la Fase 2.
  - **HU1** es el MVP y debe completarse primero porque aporta la lista/detalle de documentos.
  - **HU2, HU3, HU6, HU7, HU8, HU9, HU10, HU11, HU12 y HU13** pueden ejecutarse en paralelo tras la Fase 2.
  - **HU4 y HU5** dependen de la lista/detalle de la HU1.
- **Fase 16 (Pulido)**: depende de todas las historias deseadas.

### Dependencias entre historias

- **US1 (P1)**: sin dependencia de otras historias; habilita US4 y US5.
- **US4 (P1)**: depende de US1 por el detalle de documentos.
- **US5 (P1-P2)**: depende de US1 y comparte las guardas de US4.
- **US2 (P1) y US3 (P1)**: independientes entre sí y de US1.
- **US6, US7, US13 (P1)**: verificaciones de regresión sobre capacidades base ya implementadas; independientes.
- **US8-US12 (P2)**: verificaciones de regresión sobre capacidades base ya implementadas; independientes.

### Dentro de cada historia

- Las pruebas se escriben primero y deben fallar antes de la implementación.
- Primero el motor/vistas, luego los componentes y por último el cableado en `src/app.js`.
- Completar y validar una historia antes de pasar a la siguiente prioridad cuando se trabaja en secuencia.

---

## Oportunidades de Paralelización

- **Fase 1**: T002, T003 y T004 en paralelo tras T001.
- **Fase 2**: T007, T008, T009 y T010 en paralelo; sus pruebas T011-T015 también en paralelo; T016 depende de T010; T019 puede ejecutarse en paralelo con T016-T018.
- **Tras la Fase 2**: US1, US2, US3, US6, US7, US8, US9, US10, US11, US12 y US13 pueden repartirse entre desarrolladores.
- **Pruebas**: las tareas de prueba de una misma historia marcadas `[P]` pueden escribirse en paralelo.
- **US4 y US5**: pueden avanzar en paralelo una vez que US1 entregue el detalle de documentos, coordinando `src/app.js` y `src/components/document-list.js`.
- **Fase 16**: T069-T073 y T075-T076 en paralelo; T074, T077 y T078 al final.

### Ejemplo de paralelización: Historia de Usuario 1

```text
Tarea: "Pruebas de lista/detalle en tests/integration/document-list.test.js"
Tarea: "Pruebas de confirmar/rechazar en tests/integration/order-actions.test.js"
Tarea: "Pruebas de indicadores/costos en tests/integration/indicators.test.js"
```

```text
Tarea: "Implementar src/components/document-list.js"
Tarea: "Implementar src/components/indicators.js"
Tarea: "Añadir estilos en src/styles.css"
```

---

## Estrategia de Implementación

### MVP del trabajo pendiente (solo HU1)

1. Completar Fase 1: herramientas de lint, formato y E2E.
2. Completar Fase 2: motor declarativo, seguridad y perfil de configuración.
3. Completar Fase 3 (HU1): lista/detalle, confirmar/rechazar, indicadores y costos.
4. **DETENERSE Y VALIDAR**: ejecutar las pruebas de HU1 y revisar el recorrido en el navegador.
5. Demostrar el MVP si está listo.

### Entrega incremental

1. Configuración + Fundacional → motor declarativo listo.
2. HU1 → validar → demostrar (MVP de manufactura).
3. HU2 y HU3 → validar catálogo y stock → demostrar.
4. HU4 → validar ejecución → demostrar.
5. HU5 → validar calidad → demostrar el recorrido completo.
6. HU6-HU13 → validar regresiones del núcleo base.
7. Fase 16 → seguridad, E2E, rendimiento, documentación y puerta de calidad.

### Estrategia de equipo en paralelo

1. El equipo completa Fase 1 y Fase 2.
2. Tras la Fase 2:
   - Desarrollador A: HU1 y luego HU4/HU5.
   - Desarrollador B: HU2 y HU3.
   - Desarrollador C: HU6-HU13 (regresiones) y documentación.
3. Integrar y ejecutar la puerta completa antes de cerrar.

---

## Notas

- `[P]` indica archivos distintos y ausencia de dependencias incompletas.
- Cada tarea de prueba debe fallar antes de implementar.
- No se debe modificar `app.js`, `storage.js`, `shell.js` ni los componentes genéricos para añadir lógica específica de manufactura; esa lógica se declara en `src/module-config.js` y la interpreta `src/domain/`.
- La barra lateral mantiene cuatro módulos; la lista/detalle de órdenes vive dentro de Documentos.
- Los valores ausentes nunca se convierten en cero: se muestran como "sin dato" o se omiten según la regla.
- La documentación y las pruebas se actualizan junto con el comportamiento, conforme a la constitución.
