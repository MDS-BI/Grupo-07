# Investigación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Decisión: Usar Vite con HTML, CSS y JavaScript vanilla

**Justificación**: La solicitud enfatiza un enfoque de mínimas librerías y una implementación ligera. Vite proporciona una experiencia de desarrollo rápida y un pipeline de construcción simple sin requerir un framework más pesado. JavaScript vanilla mantiene la aplicación fácil de entender, fácil de probar y fácil de mantener para una pequeña aplicación de página única, y deja a los módulos personalizados libres de adoptar cualquier enfoque de interfaz por encima de ella.

**Alternativas consideradas**:

- React o Vue: Ecosistema de componentes más sólido, pero añade más abstracción y sobrecarga de dependencias de las necesarias para este alcance.
- HTML estático plano sin Vite: Más simple, pero Vite ofrece un mejor flujo de trabajo de desarrollo local y paso de construcción para crecimiento futuro.
- Persistencia en backend con base de datos: No es necesaria para un módulo base de espacio único y añadiría complejidad innecesaria; el contrato de almacenamiento está aislado, por lo que un backend puede introducirse más tarde sin cambiar la lógica del módulo.

## Decisión: Extensión de dominio declarativa, sin código en la configuración

**Justificación**: SC-008 y XR-006 exigen que el perfil de manufactura completo (HU1-HU5) se implemente con el archivo de configuración y sin modificar archivos fuente centrales. Para lograrlo sin permitir código arbitrario, la configuración declara datos que un motor genérico interpreta: columnas, filtros, secciones de detalle, indicadores, insignias, guardas y mensajes.

**Forma de la decisión**:

- `src/domain/config-schema.js` valida la forma de la configuración y rechaza operaciones, campos o tipos desconocidos.
- `src/domain/views.js` resuelve columnas, filtros y secciones de detalle.
- `src/domain/metrics.js` calcula conteos, ratios, retrasos y agregaciones por moneda.
- `src/domain/rules.js` evalúa predicados de lista blanca (`eq`, `neq`, `in`, `notIn`, `lt`, `lte`, `gt`, `gte`, `exists`, `blank`) y guardas antes de persistir.
- `module-config.js` contiene únicamente datos de configuración; no contiene funciones de dominio.

**Alternativas consideradas**:

- Funciones JavaScript dentro de `module-config.js`: potente, pero rompe la validación, permite ejecución arbitraria y dificulta las pruebas.
- Un plugin o módulo separado por dominio: requeriría modificar el punto de entrada central y contradice SC-008.
- Un DSL con `eval`: descartado por seguridad (FR-050) y mantenibilidad.

## Decisión: Playwright para pruebas E2E

**Justificación**: La constitución exige cobertura E2E de recorridos críticos. Vitest + jsdom cubre lógica e interacción, pero no valida el recorrido real en navegador, la navegación, el foco ni la persistencia entre recargas.

**Alternativas consideradas**:

- Solo Vitest + jsdom: insuficiente para la puerta de la constitución.
- Cypress: viable, pero Playwright ofrece ejecución más simple en el entorno actual y soporte de múltiples navegadores sin configuración adicional.

**Alcance E2E mínimo**: crear/editar/eliminar/buscar entidad; crear y gestionar documento; confirmar/rechazar pedido; registrar ejecución; completar inspección de calidad; verificar sanitización XSS.

## Decisión: Escape centralizado y renderizado seguro

**Justificación**: FR-050 exige neutralizar payloads XSS en todos los valores introducidos por el usuario. La aplicación ya usa `textContent` en la mayoría de las vistas, pero también existen plantillas con `innerHTML`.

**Forma de la decisión**:

- `src/security.js` centraliza `escapeHtml` y ayudantes de inserción segura.
- Los datos de usuario nunca se interpolan en `innerHTML`; solo se usan para texto, atributos escapados o `textContent`.
- Las pruebas incluyen `<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>` y `javascript:`.
- No se usan manejadores inline ni `eval`; el motor declarativo no evalúa expresiones.

**Alternativas consideradas**:

- Confiar solo en `textContent`: reduce el riesgo, pero no cubre atributos ni plantillas existentes; se necesita una auditoría y un ayudante único.
- Usar una librería de sanitización: añade dependencia innecesaria para datos que deben mostrarse como texto plano.

## Decisión: Claves canónicas de calidad

**Justificación**: La especificación usa `CantidadQA`, `MermaQA` y `CalidadQA`, mientras que `data-model.md` y la configuración usan `producedQty`, `scrapQty` y `qualityResult`. Mantener dos modelos dificulta las pruebas y la búsqueda.

**Forma de la decisión**:

- Claves de datos canónicas: `producedQty`, `scrapQty`, `qualityResult`.
- Etiquetas de interfaz alineadas a la especificación: "Cantidad QA", "Merma QA", "Calidad QA".
- El mapeo se documenta en `data-model.md`; no se renombran los campos base.

**Alternativas consideradas**:

- Renombrar la especificación a las claves técnicas: rompe la trazabilidad con las historias de usuario.
- Mantener ambos nombres como campos distintos: duplica datos y genera inconsistencias.

## Decisión: Umbral de stock bajo

**Justificación**: La especificación exige mostrar "sin dato" cuando falta un valor y evitar tratar valores ausentes como cero. El criterio debe ser verificable.

**Forma de la decisión**:

- Un producto se marca con "stock bajo el mínimo" solo si `currentStock` y `minStock` existen y `currentStock < minStock`.
- Si falta cualquiera de los dos, se muestra "sin dato" y no se aplica la insignia.
- La regla se declara como insignia configurable y se prueba en unitarias e integración.

## Decisión: Lista y detalle de órdenes en el módulo Documentos

**Justificación**: La barra lateral mantiene cuatro módulos (Panel, Entidades, Documentos y Buscar). HU1 y HU4 necesitan lista, filtros y detalle de órdenes; añadir un quinto módulo contradice la navegación base y aumenta el alcance.

**Forma de la decisión**:

- `document-list.js` renderiza la lista con filtros y el detalle dentro del módulo Documentos.
- La configuración declara columnas, filtros y secciones de detalle.
- Los indicadores y costos se muestran como sección configurable dentro de ese mismo módulo.
- La pantalla de gestión sigue sin mostrar la lista de entidades (FR-016).

**Alternativas consideradas**:

- Quinto módulo "Órdenes": más visible, pero amplía la navegación base y duplica el concepto de documento.
- Búsqueda ampliada a documentos: mezcla recuperación con gestión y no ofrece el detalle operativo requerido.

## Decisiones adicionales

- Se usará localStorage del navegador para la persistencia porque el módulo base es de espacio único y no necesita almacenamiento del lado servidor.
- La interfaz inicial será una experiencia de página única con un panel, campo de búsqueda y lista de resultados de entidades.
- La aplicación favorecerá la mejora progresiva y los controles de formulario nativos accesibles sobre widgets personalizados complejos.
- El modelo de datos separa los datos maestros (Entidad) de los registros transaccionales (Documento), vinculados por un identificador público autogenerado (`entity_id`), de modo que los módulos personalizados puedan adjuntar cualquier significado de dominio a ambos lados sin cambios estructurales.
- Las preocupaciones base (generación de identidad, marcas de tiempo, integridad referencial, eliminación en cascada) residen en la capa de almacenamiento, manteniendo los módulos personalizados limitados a configuración declarativa.
- Las referencias a "la lista" de entidades corresponden a los resultados de la pantalla Buscar; la pantalla de gestión no muestra la lista de entidades.
- El perfil de manufactura se activa cambiando `userConfig` a `manufacturingConfig`; la activación es un cambio de configuración, no de código central.
