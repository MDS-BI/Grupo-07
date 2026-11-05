# Tareas: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Entrada**: Documentos de diseño desde `/specs/001-erp-base-module/`
**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario), research.md, data-model.md, contracts/

> **Trazabilidad**: las Fases 1-18 cubren el núcleo base (FR-001 a FR-039, XR-001 a XR-005) y las Historias de Usuario 6-13 de la especificación. Las Historias de Usuario 1-5 describen el perfil de manufactura y se planifican en la Fase 19; están pendientes. Las etiquetas `[BASE-E]`, `[LEGACY]`, `[CFG]` y `[DASH]` identifican trabajo base/histórico para no confundirlo con las historias de dominio.

## Formato: `[ID] [P?] [Historia] Descripción`

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Inicializar la estructura del proyecto Vite y las herramientas compartidas.

- [X] T001 Crear la estructura de la aplicación Vite con src/, tests/, y archivos de configuración
- [X] T002 Instalar las dependencias Vite y Vitest para el proyecto
- [X] T003 [P] Configurar el linting y formateo para la aplicación JavaScript ligera

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Crear la capa de almacenamiento y el esqueleto de la aplicación de los que dependen todas las historias.

- [X] T004 Crear el modelo de datos de entidad y los ayudantes de validación en src/storage.js
- [X] T005 Implementar la persistencia en localStorage del navegador para registros de entidad en src/storage.js
- [X] T006 Crear el esqueleto principal de la aplicación y renderizar el estado vacío inicial en src/app.js
- [X] T007 [P] Construir una base de hoja de estilos compartida para diseño, formularios y estados de retroalimentación en src/styles.css

---

## Fase 3: Historia Base 1 - Crear y organizar entidades (FR-001, FR-005 a FR-007) 🎯 MVP

**Objetivo**: Permitir a los usuarios añadir entidades y verlas en el selector de gestión y en la búsqueda.

**Prueba Independiente**: Un usuario puede abrir la aplicación, enviar un formulario de entidad y ver la nueva entidad aparecer en el selector de gestión.

### Pruebas para la Historia de Usuario 1

- [X] T008 [P] [BASE-E] Añadir pruebas unitarias para la validación de entidades en tests/unit/storage.test.js
- [X] T009 [P] [BASE-E] Añadir pruebas de integración para crear una entidad en tests/integration/create-entity.test.js

### Implementación de la Historia de Usuario 1

- [X] T010 [P] [BASE-E] Crear el marcado del formulario de entidad en index.html y el renderizado de campos personalizados en src/components/custom-fields.js
- [X] T011 [BASE-E] Conectar el envío del formulario para crear y persistir una nueva entidad en src/app.js
- [X] T012 [BASE-E] Mostrar retroalimentación de validación y refrescar el selector de entidades sin mostrar una lista de entidades en src/app.js (FR-016)

**Punto de control**: La Historia de Usuario 1 debe estar completamente funcional y ser comprobable de forma independiente.

---

## Fase 4: Historia Base 2 - Editar y eliminar entidades (FR-002, FR-003, FR-007)

**Objetivo**: Permitir a los usuarios actualizar o eliminar entidades almacenadas, manteniendo la capacidad de respuesta con conjuntos de datos grandes.

**Prueba Independiente**: Un usuario puede editar una entidad existente o eliminarla, y el selector de gestión se actualiza correctamente.

### Pruebas para la Historia de Usuario 2

- [X] T013 [P] [BASE-E] Añadir pruebas unitarias para actualizar y eliminar entidades en tests/unit/storage.test.js
- [X] T014 [P] [BASE-E] Añadir pruebas de integración para editar y eliminar una entidad en tests/integration/edit-delete-entity.test.js

### Implementación de la Historia de Usuario 2

- [X] T015 [P] [BASE-E] Añadir controles de edición y eliminación mediante selector de entidades en index.html y src/app.js
- [X] T016 [BASE-E] Conectar las acciones de edición para poblar el formulario y actualizar los datos persistidos en src/app.js
- [X] T017 [BASE-E] Gestionar las acciones de eliminación y quitar registros del almacenamiento y la interfaz en src/app.js

**Punto de control**: Las Historias de Usuario 1 y 2 deben funcionar de forma independiente.

---

## Fase 5: Historia de Usuario 3 (original) - Pantalla de bienvenida con navegación (Prioridad: P1)

**Objetivo**: Proporcionar la pantalla de punto de entrada con dos botones claramente etiquetados que llevan a gestión y búsqueda. *(Sustituida por el rediseño del panel de la Fase 17; se conserva como historial del trabajo entregado.)*

**Prueba Independiente**: Un usuario abre la aplicación, ve la pantalla de bienvenida y llega a ambas pantallas desde sus botones.

### Implementación de la Historia de Usuario 3

- [x] T018 [P] [LEGACY] [SUPERSEDIDA por Fase 17] Añadir una vista de pantalla de bienvenida con dos botones de navegación claramente etiquetados en index.html
- [x] T019 [P] [LEGACY] [SUPERSEDIDA por Fase 17] Añadir lógica de cambio de vista para las pantallas de bienvenida, gestión y búsqueda en src/app.js

**Punto de control**: La Historia de Usuario 3 debe estar completamente funcional y ser comprobable de forma independiente.

---

## Fase 6: Historia de Usuario 4 (pestañas originales) - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

**Objetivo**: Proporcionar la pantalla de gestión con la pestaña de navegación horizontal Entidades/Documentos/Inicio y formularios de gestión completos, sin mostrar la lista de entidades. *(La navegación por pestañas fue sustituida por el marco de barra lateral de la Fase 16; los flujos de gestión siguen vigentes.)*

**Prueba Independiente**: Desde la pantalla de bienvenida, un usuario llega a la pantalla de gestión, cambia de pestaña y añade, edita y elimina una entidad y un documento.

### Implementación de la Historia de Usuario 4

- [x] T020 [P] [LEGACY] [SUPERSEDIDA por Fase 16] Añadir una pestaña de navegación horizontal con botones Entidades, Documentos e Inicio a la vista de gestión en index.html
- [x] T021 [P] [LEGACY] [SUPERSEDIDA por Fase 16] Organizar la vista de gestión en paneles de entidades y documentos y eliminar la lista de entidades en index.html
- [x] T022 [LEGACY] [SUPERSEDIDA por Fase 16] Añadir lógica de cambio de pestaña y navegación a Inicio desde la pantalla de gestión en src/app.js
- [x] T023 [LEGACY] [SUPERSEDIDA por Fase 16] Añadir edición y eliminación mediante selectores para entidades y documentos en src/app.js
- [x] T024 [P] [LEGACY] [SUPERSEDIDA por Fase 16] Añadir pruebas de integración para la pestaña de navegación de gestión en tests/integration/manage-tabs.test.js
- [x] T025 [P] [LEGACY] [SUPERSEDIDA por Fase 16] Añadir estilos para la pestaña de navegación horizontal en src/styles.css

**Punto de control**: Las Historias de Usuario 1-4 deben estar completamente funcionales y ser comprobables de forma independiente.

---

## Fase 7: Historia Base 3 - Definir un perfil de configuración del módulo (FR-023 a FR-025)

**Objetivo**: Introducir `src/module-config.js` para que los desarrolladores puedan adaptar la identidad del módulo sin editar el código central, con valores predeterminados seguros e informes de error claros.

**Prueba Independiente**: Un desarrollador suministra una configuración de Ventas; la aplicación carga mostrándola. Al quitar el archivo se restauran los valores predeterminados Entidad/Documento sin errores.

### Pruebas para la Historia Base 3

- [X] T026 [P] [CFG] Añadir pruebas unitarias para carga de configuración, retroceso a predeterminados e informes de configuración inválida en tests/unit/module-config.test.js

### Implementación de la Historia Base 3

- [X] T027 [CFG] Crear el cargador de configuración con valores predeterminados, validación e informes de error claros en src/module-config.js
- [X] T028 [CFG] Cargar la configuración al arrancar y pasarla a todas las vistas en src/main.js y src/app.js

**Punto de control**: La configuración aún no impulsa nada visible, pero carga de forma fiable y valida limpiamente.

---

## Fase 8: Historia de Usuario 6 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

**Objetivo**: Derivar todas las etiquetas visibles para el usuario de la configuración para que los módulos adaptados hablen su idioma de dominio en todo momento.

**Prueba Independiente**: Con mapeos Entidad→Cliente y Documento→Pedido de Venta, cada pestaña, botón, etiqueta de formulario, encabezado y mensaje muestra los términos mapeados en las tres pantallas; el comportamiento no cambia.

### Pruebas para la Historia de Usuario 6

- [X] T029 [P] [US6] Añadir pruebas de integración que verifiquen las etiquetas configuradas en las pantallas de bienvenida, gestión y búsqueda en tests/integration/relabeling.test.js

### Implementación de la Historia de Usuario 6

- [X] T030 [US6] Derivar todas las etiquetas visibles para el usuario de la configuración en lugar de texto codificado en index.html, src/app.js y los archivos de componentes

**Punto de control**: Un módulo configurado se presenta completamente bajo su propia terminología.

---

## Fase 9: Historia de Usuario 7 - Declarar campos personalizados para los registros (Prioridad: P1)

**Objetivo**: Permitir que los campos personalizados declarados fluyan automáticamente por formularios, validación, persistencia, listas y búsqueda.

**Prueba Independiente**: Declarar un campo numérico obligatorio en las entidades renderiza una entrada numérica que bloquea guardados en blanco, muestra valores en listas y coincide en búsquedas; sin declaraciones la aplicación se comporta como la base sin modificar.

### Pruebas para la Historia de Usuario 7

- [X] T031 [P] [US7] Añadir pruebas unitarias para validación y persistencia de campos personalizados en tests/unit/storage.test.js
- [X] T032 [P] [US7] Añadir pruebas de integración para el renderizado de campos personalizados en formularios, listas y búsqueda en tests/integration/custom-fields.test.js

### Implementación de la Historia de Usuario 7

- [X] T033 [P] [US7] Renderizar dinámicamente los campos personalizados declarados en los formularios de entidad y documento en src/components/custom-fields.js
- [X] T034 [US7] Incluir los campos personalizados en validación, persistencia, listas y búsqueda en src/storage.js y src/app.js

**Punto de control**: Los datos específicos del módulo requieren cero cambios de código de interfaz.

---

## Fase 10: Historia de Usuario 8 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

**Objetivo**: Permitir a los usuarios buscar y filtrar entidades rápidamente, manteniendo la capacidad de respuesta con conjuntos de datos grandes.

**Prueba Independiente**: Un usuario puede introducir un término de búsqueda y ver solo las entidades coincidentes.

### Pruebas para la Historia de Usuario 8

- [X] T035 [P] [US8] Añadir pruebas unitarias para la lógica de filtrado de búsqueda en tests/unit/storage.test.js
- [X] T036 [P] [US8] Añadir pruebas de integración para el comportamiento de búsqueda en tests/integration/search-entities.test.js

### Implementación de la Historia de Usuario 8

- [X] T037 [P] [US8] Crear la interfaz de la pantalla de búsqueda dedicada en index.html
- [X] T038 [US8] Conectar la entrada de búsqueda al filtrado y al comportamiento de estado vacío en src/app.js
- [X] T039 [US8] Asegurar que los resultados de búsqueda permanecen sincronizados con las acciones de crear, editar y eliminar en src/app.js

**Punto de control**: Las historias centrales de datos y la búsqueda deben estar ahora funcionalmente independientes.

---

## Fase 11: Historia de Usuario 9 - Registrar una fecha objetivo (Prioridad: P2)

**Objetivo**: Permitir a los usuarios adjuntar una fecha objetivo opcional a una entidad.

**Prueba Independiente**: Un usuario puede fijar una fecha en una entidad y verla mostrada en la lista.

### Pruebas para la Historia de Usuario 9

- [X] T040 [P] [US9] Añadir pruebas unitarias para validación y persistencia de la fecha objetivo en tests/unit/storage.test.js

### Implementación de la Historia de Usuario 9

- [X] T041 [P] [US9] Añadir la entrada de fecha objetivo al formulario de entidad en index.html
- [X] T042 [US9] Incluir targetDate en la lógica de validación, creación, actualización y búsqueda en src/storage.js
- [X] T043 [US9] Conectar targetDate al envío del formulario, poblado de edición y visualización de errores en src/app.js
- [X] T044 [US9] Exponer la fecha objetivo en el formulario de edición y en la búsqueda de entidades en src/app.js

**Punto de control**: La Historia de Usuario 9 debe estar completamente funcional y ser comprobable de forma independiente.

---

## Fase 12: Historia de Usuario 10 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

**Objetivo**: Permitir a los usuarios registrar detalles de documentos para una entidad y verlos juntos, con la eliminación en cascada protegiendo la integridad referencial.

**Prueba Independiente**: Un usuario puede añadir un documento a una entidad y ver los detalles mostrados con esa entidad; eliminar la entidad elimina sus documentos.

### Pruebas para la Historia de Usuario 10

- [X] T045 [P] [US10] Añadir pruebas unitarias para generación de entity_id y validación de documentos en tests/unit/storage.test.js
- [X] T046 [P] [US10] Añadir pruebas de integración para añadir un documento a una entidad en tests/integration/add-document.test.js
- [X] T047 [P] [US10] Añadir pruebas de integración para edición, eliminación y eliminación en cascada de documentos en tests/integration/manage-document.test.js

### Implementación de la Historia de Usuario 10

- [X] T048 [P] [US10] Crear el marcado del formulario de documento en index.html y reutilizar src/components/custom-fields.js
- [X] T049 [P] [US10] Añadir el selector de documentos para edición y eliminación en index.html y src/app.js
- [X] T050 [US10] Conectar las acciones de crear, editar y eliminar documentos para persistirlos en src/app.js
- [X] T051 [US10] Añadir entity_id a la creación de entidades y mostrar los documentos con su entidad en src/app.js
- [X] T052 [US10] Eliminar en cascada los documentos cuando se elimina una entidad en src/storage.js

**Punto de control**: Los datos maestros y los documentos transaccionales deben estar completamente vinculados.

---

## Fase 13: Historia de Usuario 11 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Proporcionar la pantalla de búsqueda dedicada accesible desde la pantalla de bienvenida, manteniendo la edición en la pantalla de gestión.

**Prueba Independiente**: Un usuario navega desde la pantalla de bienvenida a la pantalla de búsqueda, busca, ve resultados o un estado vacío, y vuelve a Inicio.

### Implementación de la Historia de Usuario 11

- [x] T053 [P] [US11] Añadir la entrada de búsqueda y la lista de resultados a la vista de búsqueda dedicada en index.html
- [x] T054 [US11] Conectar la entrada de búsqueda al filtrado de resultados y mostrar un estado vacío en la pantalla de búsqueda en src/app.js
- [x] T055 [US11] Añadir navegación al Panel desde la pantalla de búsqueda en index.html

**Punto de control**: Todas las historias del usuario de negocio deben estar completamente funcionales y ser comprobables de forma independiente.

---

## Fase 14: Historia de Usuario 12 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

**Objetivo**: Aplicar los estados y transiciones configurados en los documentos manteniendo el estado de texto libre cuando no hay configuración.

**Prueba Independiente**: Con cotización→pedido→facturado configurado, solo se ofrecen los estados siguientes válidos, los inválidos se rechazan con explicaciones, y el estado es visible de un vistazo; sin configuración, el estado permanece como texto libre.

### Pruebas para la Historia de Usuario 12

- [X] T056 [P] [US12] Añadir pruebas unitarias para la aplicación de transiciones de estado en tests/unit/storage.test.js

### Implementación de la Historia de Usuario 12

- [X] T057 [US12] Restringir las opciones de estado de documento a las transiciones permitidas y aplicarlas al guardar en src/app.js y src/storage.js

**Punto de control**: La cadena de personalización (HU5 → HU6/HU7/HU12) está completa de extremo a extremo.

---

## Fase 15: Pulido y Preocupaciones Transversales

**Propósito**: Mejorar la calidad, accesibilidad, fiabilidad y el comportamiento con conjuntos de datos grandes en todas las historias.

- [X] T058 [P] Añadir refinamientos de accesibilidad para etiquetas, foco de teclado y estructura semántica
- [X] T059 [P] Añadir pulido final de UX para estados vacíos, mensajes de validación y diseño responsivo
- [X] T060 Verificar que el renderizado de listas y la búsqueda permanecen responsivos y correctos con 500 registros (FR-032, SC-004)
- [X] T061 Ejecutar la suite completa de pruebas y probar manualmente los flujos principales de usuario
- [X] T062 [P] Añadir estilos para la pantalla de bienvenida y la navegación de vistas en src/styles.css
- [X] T063 Ejecutar la suite completa de pruebas y la compilación de producción para verificar que no hay regresiones

---

## Fase 16: Historia de Usuario 13 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

**Objetivo**: Envolver cada pantalla en un marco ERP persistente: una barra superior con logotipo derivado y nombre del módulo, más una barra lateral de botones de módulo con resaltado de módulo activo y contracción responsiva.

**Prueba Independiente**: En cada pantalla la barra superior y la barra lateral son visibles, el módulo activo está resaltado, la navegación entre módulos preserva los datos, y la barra lateral se contrae a una columna de iconos en ventanas gráficas estrechas.

### Pruebas para la Historia de Usuario 13

- [X] T064 [P] [US13] Añadir pruebas unitarias para validación del color de acento en tests/unit/module-config.test.js
- [X] T065 [P] [US13] Añadir pruebas de integración que afirmen que el marco (logotipo, nombre del módulo, botones de barra lateral, resaltado activo) aparece en todas las pantallas en tests/integration/workspace-shell.test.js

### Implementación de la Historia de Usuario 13

- [X] T066 [P] [US13] Añadir el marcado del marco del espacio de trabajo (barra superior, montaje de logotipo SVG en línea, botones de módulo en barra lateral, región de contenido principal) a index.html
- [X] T067 [P] [US13] Crear src/components/shell.js para renderizar el logotipo monograma SVG a partir del nombre del módulo, aplicar las etiquetas configuradas a los botones de módulo, gestionar el resaltado de módulo activo y exponer eventos de navegación
- [X] T068 [US13] Reemplazar las pestañas horizontales de gestión y la navegación independiente hacia atrás por enrutamiento de módulos mediante la barra lateral en src/app.js
- [X] T069 [P] [US13] Construir la hoja de estilos de tokens de diseño ERP (variables de color, escala de espaciado, tipografía) más estilos de barra superior, barra lateral y tarjetas en src/styles.css
- [X] T070 [US13] Soportar un theme.accentColor opcional en la validación de src/module-config.js y aplicarlo como propiedad personalizada de CSS en src/app.js
- [X] T071 [US13] Contraer la barra lateral a una columna de iconos en ventanas gráficas estrechas en src/styles.css
- [X] T072 [P] [US13] Actualizar las pruebas de integración existentes (manage-tabs.test.js, relabeling.test.js) para apuntar al marco de barra lateral en lugar de los botones de pestañas/bienvenida

**Punto de control**: Todas las pantallas se renderizan dentro del marco con marca con navegación por barra lateral funcional y sin pérdida de datos.

---

## Fase 17: Historia Base 4 - Panel de inicio con acciones rápidas y estadísticas (FR-010, FR-033 a FR-035)

**Objetivo**: Reemplazar la vista de bienvenida de dos botones por un panel ERP que ofrece múltiples botones de acción rápida y estadísticas de registros en vivo.

**Prueba Independiente**: La aplicación abre en un panel con acciones rápidas para nueva entidad, nuevo documento, gestión de entidades y buscar registros; activarlas aterriza en el lugar correcto listo para introducir datos, y las tarjetas de estadísticas coinciden con los registros almacenados.

### Pruebas para la Historia Base 4

- [X] T073 [P] [DASH] Añadir pruebas de integración para las acciones rápidas del panel y las estadísticas en vivo en tests/integration/dashboard.test.js

### Implementación de la Historia Base 4

- [X] T074 [P] [DASH] Añadir el marcado del panel (encabezado, cuadrícula de acciones rápidas, tarjetas de estadísticas) a index.html reemplazando la vista de bienvenida de dos botones
- [X] T075 [DASH] Conectar los botones de acción rápida para abrir la gestión de entidades, la gestión de documentos (formularios limpiados) y la búsqueda (entrada enfocada) en src/app.js
- [X] T076 [DASH] Renderizar y refrescar los recuentos de entidades/documentos desde el almacenamiento cada vez que se muestra el panel en src/components/dashboard.js
- [X] T077 [P] [DASH] Dar estilo al encabezado del panel, las tarjetas de acción rápida y los mosaicos de estadísticas en src/styles.css

**Punto de control**: La aplicación abre en un panel funcional; cada tarea ERP clave está a un clic.

---

## Fase 18: Pulido y Regresión (Aspecto ERP)

**Propósito**: Unificar el estilo visual en toda la aplicación rediseñada y protegerse contra regresiones.

- [X] T078 [P] Rediseñar formularios, listas, insignias, mensajes de error y estados vacíos según el sistema de tokens de diseño en src/styles.css
- [X] T079 [P] Verificar el orden de foco del teclado y aria-current en los botones de módulo de la barra lateral (pase de accesibilidad del nuevo marco)
- [X] T080 Actualizar README.md con las secciones del marco del espacio de trabajo, panel y tematización
- [X] T081 Ejecutar la suite completa de pruebas y la compilación de producción para verificar que no hay regresiones (FR-032, SC-004)

---

## Fase 19: Perfil de dominio de manufactura - Historias de Usuario 1-5 (Prioridad: P1-P2)

**Estado**: Pendiente. El módulo base ya entrega entidades, documentos, campos personalizados, ciclo de vida, búsqueda, panel y marco. Estas tareas implementan la lógica de dominio que la especificación atribuye a las Historias de Usuario 1-5; no forman parte del núcleo base entregado.

**Prueba Independiente**: Con `userConfig = manufacturingConfig`, un usuario evalúa y confirma/rechaza un pedido, corrige stock bajo mínimo, registra máquina/lote/etapa y completa una inspección de calidad con sus transiciones.

- [X] T082 [US1] Definir el perfil `manufacturingConfig` (etiquetas, 14 campos personalizados y ciclo de vida de 6 estados) en src/module-config.js
- [ ] T083 [US1] Crear la vista de evaluación con órdenes por estado, pedidos retrasados, merma y costos por moneda (FR-042 a FR-044)
- [ ] T084 [US1] Implementar confirmar/rechazar pedidos con transiciones *planificada* → *liberada*/*cancelada* (FR-040)
- [ ] T085 [US2] Implementar la edición/eliminación de productos con validación de tipo de ítem, unidad de medida, stock y plazo de reposición, y cascada de órdenes (FR-045)
- [ ] T086 [US3] Implementar el indicador de stock bajo el mínimo y el valor "sin dato" cuando falte stock (FR-046)
- [ ] T087 [US3] Exponer ubicación, proveedor, plazo de reposición y stocks como campos del perfil de producto (FR-046)
- [ ] T088 [US4] Implementar la asignación de máquina, lote y etapa, el registro de cantidades y el envío a control de calidad (FR-047)
- [ ] T089 [US4] Rechazar cantidades producidas o merma negativas/no numéricas y transiciones no permitidas (FR-049)
- [ ] T090 [US5] Implementar el registro de `CantidadQA`, `MermaQA`, `CalidadQA` y las transiciones de calidad a *terminada*, *en producción* o *cancelada* (FR-048)
- [ ] T091 [US5] Añadir pruebas de integración del perfil de manufactura (evaluación, inventario, ejecución y calidad)

**Punto de control**: El perfil de manufactura cumple los requisitos FR-040 a FR-049 y los criterios SC-011 a SC-014.

---

## Dependencias y Orden de Ejecución

### Dependencias entre Fases

- Configuración (Fase 1): Sin dependencias
- Fundacional (Fase 2): Depende de completar Configuración
- Historia Base 1 (Fase 3): Depende de completar Fundacional
- Historia Base 2 (Fase 4): Depende de completar la implementación de la Historia Base 1
- Legado de bienvenida (Fase 5): Depende de completar Fundacional; fue sustituido por el panel
- Legado de pestañas (Fase 6): Depende del legado de bienvenida y de los formularios de las Historias Base 1-2
- Historia Base 3 (Fase 7): Depende de completar Fundacional; desbloquea HU6, HU7, HU12
- Historia de Usuario 6 (Fase 8): Depende de completar la Historia de Usuario 5
- Historia de Usuario 7 (Fase 9): Depende de completar la Historia de Usuario 5
- Historia de Usuario 8 (Fase 10): Depende de completar Fundacional y puede proceder después de la Historia de Usuario 1
- Historia de Usuario 9 (Fase 11): Depende de completar Fundacional y puede proceder después de la Historia de Usuario 1
- Historia de Usuario 10 (Fase 12): Depende de completar la implementación de la Historia de Usuario 1 y del campo entity_id
- Historia de Usuario 11 (Fase 13): Depende de la Historia de Usuario 8 (lógica de búsqueda) y la Historia de Usuario 3 (navegación)
- Historia de Usuario 12 (Fase 14): Depende de la Historia de Usuario 5 (configuración) y la Historia de Usuario 10 (documentos)
- Pulido (Fase 15): Depende de que todas las historias de usuario deseadas estén completas
- Historia de Usuario 13 (Fase 16): Depende de que las Fases 1-15 estén completas; reestructura la navegación entregada por HU3/HU4 dentro del marco
- Historia Base 4 - Panel (Fase 17): Depende de la Fase 16 (el enrutamiento por barra lateral debe existir antes de que las acciones del panel lo usen)
- Pulido Aspecto ERP (Fase 18): Depende de que las Fases 16 y 17 estén completas
- Perfil de manufactura (Fase 19): Depende de las Fases 1-18 y de activar `manufacturingConfig`; sus tareas están pendientes

### Oportunidades Paralelas

- T003 puede ejecutarse en paralelo con las tareas de configuración
- T007 puede completarse junto al trabajo de almacenamiento y esqueleto de la aplicación
- Las pruebas de cada historia pueden crearse en paralelo con las tareas de implementación de la misma historia
- Después de la Fase 7 (perfil de configuración), HU6 (Fase 8) y HU7 (Fase 9) pueden proceder en paralelo
- HU8 (Fase 10) y HU9 (Fase 11) son independientes y pueden proceder en paralelo después de la Historia de Usuario 1
- En la Fase 15, T058-T060 pueden ejecutarse en paralelo antes de las tareas finales de verificación T061-T063
- En la Fase 16, T064-T067 y T069 pueden ejecutarse en paralelo; T072 aterriza junto al cambio de enrutamiento T068
- En la Fase 17, T073/T074/T077 pueden ejecutarse en paralelo con T075/T076
- En la Fase 18, T078 y T079 pueden ejecutarse en paralelo antes de la verificación final T080-T081
