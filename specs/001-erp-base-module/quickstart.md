# Inicio Rápido y Validación: Módulo ERP de Manufactura y Operaciones

Guía para ejecutar y validar la funcionalidad `001-erp-base-module` sobre el módulo base ERP. Los escenarios de manufactura comprueban las Historias de Usuario 1-5 y el criterio SC-008 (todo el perfil se configura sin tocar el código central). La sección de acceso por cargo describe la validación manual de la US16, implementada en la Fase 19 de `tasks.md`. El detalle de datos está en [data-model.md](data-model.md) y el contrato de extensión en [contracts/module-extension.md](contracts/module-extension.md).

## Requisitos previos

- Node.js y npm instalados.
- Dependencias instaladas con `npm install`.
- Navegador moderno de escritorio para los recorridos manuales.
- Navegador de Playwright instalado una vez con `npx playwright install chromium` para la capa E2E.

## Comandos

| Comando | Estado | Uso |
|---|---|---|
| `npm run dev` | Disponible | Servidor de desarrollo de Vite. |
| `npm run build` | Disponible | Compilación de producción. |
| `npm test` | Disponible | Pruebas unitarias y de integración con Vitest + jsdom. |
| `npm run test:watch` | Disponible | Vitest en modo watch. |
| `npm run lint` | Disponible | ESLint sobre `src/` y `tests/`. |
| `npm run format` | Disponible | Prettier sobre código, pruebas, HTML y configuración. |
| `npm run format:check` | Disponible | Verificación de formato sin escribir; pasa con `"endOfLine": "auto"` y el estilo normalizado. |
| `npm run test:e2e` | Disponible | Pruebas E2E con Playwright; levanta Vite en el puerto 4173. |

## Activación del perfil de manufactura

El perfil ya está activo: `userConfig = manufacturingConfig` en `src/module-config.js`. La activación sigue siendo un cambio de configuración, no de código central.

1. Abra `src/module-config.js` y confirme `export const userConfig = manufacturingConfig;`.
2. Inicie `npm run dev` y confirme que:
   - El nombre del módulo es "Manufactura y Operaciones" y el color de acento es el declarado.
   - Las etiquetas de la barra lateral y el logotipo muestran Producto/Productos y Orden de Producción/Órdenes de Producción.
   - No aparece el aviso de configuración inválida (FR-025).
3. Confirme que el perfil (incluidos cargos y permisos de la US16) es declarativo: `app.js`, `storage.js`, `shell.js` y los componentes genéricos solo interpretan la configuración (SC-008, XR-006, XR-007). `tests/unit/domain-boundary.test.js` fallaría si aparecieran claves de manufactura, cargos o claves ficticias en esos archivos.
4. Para volver al módulo base genérico, asigne `userConfig = null`; no hace falta tocar código central. Sin `domain.access`, la aplicación entra directo al Panel, como en US1-US15.

## Flujo base (regresión)

1. Ingrese con el cargo «Jefe de planta / Gerente de operaciones» y la clave `PLANT-2026`; aterrice en el panel y use una acción rápida (nuevo producto, nueva orden, gestión o buscar).
2. Cree un producto con los campos obligatorios.
3. Búsquelo desde la pantalla Buscar y compruebe que los resultados se actualizan mientras escribe.
4. Edite y elimine un producto desde el área de gestión; confirme que la eliminación arrastra sus órdenes.
5. Recargue la página y confirme que los datos persisten y que el marco con marca (logotipo, nombre, barra lateral) es consistente.
6. Verifique que los campos obligatorios muestran errores, que un correo inválido se rechaza con explicación y que las estadísticas del panel coinciden con los registros guardados.

## Escenarios de manufactura (HU1-HU5)

### HU1 · Productos e inventario

- Cree un producto terminado, una materia prima y un insumo usando `itemType` y `unitOfMeasure`.
- Verifique que los campos de dominio aparecen en el formulario, en la búsqueda y en la vista correspondiente sin cambios de código.
- **Stock bajo**: con `currentStock = 5` y `minStock = 10`, el producto muestra la insignia "Stock bajo el mínimo".
- **Sin dato**: si falta `currentStock` o `minStock`, se muestra "sin dato" y **no** aparece la insignia. Confirme que un valor ausente no se trata como cero.
- **Frontera**: `currentStock = minStock` no activa la insignia; solo lo hace un valor estrictamente menor.

### HU2 · Órdenes de producción

- Cree una orden asociada a un producto, con serie, folio, fechas y cantidad.
- Verifique lista, filtros y detalle **dentro del módulo Documentos**; la barra lateral mantiene cuatro módulos.
- Compruebe que la lista y el detalle muestran las secciones declaradas de pedido, ejecución y calidad.
- Confirme que folio no entero o no positivo, fecha fin anterior a inicio y cantidad no entera se rechazan.
- Confirme que `producedQty` y `scrapQty` aceptan números no negativos y rechazan negativos o texto.

### HU3 · Búsqueda de órdenes

- Busque por producto, folio, serie, lote, máquina o estado.
- Verifique que los resultados incluyen los campos personalizados y que la lista de resultados de la pantalla Buscar es la única "lista" de referencia.

### HU4 · Indicadores y costos

- Con varias órdenes, verifique:
  - Conteo por estado según el ciclo de vida configurado.
  - Órdenes retrasadas: `endDate` anterior a hoy y estado distinto de `terminada`/`cancelada`.
  - Merma por orden calculada como `scrapQty / producedQty`; con `producedQty = 0` o ausente se muestra "sin dato", no una división inválida.
  - Resumen de costos con subtotal, descuento, impuesto y total **agrupado por moneda**; nunca se suman monedas distintas.
- Verifique estados vacíos: cero órdenes o cero resultados muestran cero y un mensaje claro.

### HU5 · Ciclo de vida y calidad

- Recorra las transiciones: planificada → liberada → en producción → en control de calidad → terminada.
- Confirme que las transiciones no declaradas se rechazan.
- En control de calidad, confirme que no se puede terminar sin un `qualityResult` válido (`Aprobado`, `Corrección`, `Rechazado`).
- Confirme que las etiquetas de interfaz son "Cantidad QA", "Merma QA" y "Calidad QA", mapeadas a `producedQty`, `scrapQty` y `qualityResult`.

## Acceso por cargo (US16)

Validar manualmente con la Fase 19 implementada:

1. **Pantalla previa al Panel**: abrir la aplicación sin sesión (o en una pestaña nueva) y comprobar que aparece `view-login` con selector de cargo, campo de clave y botón de ingreso antes de cualquier módulo; `app-shell` permanece oculto.
2. **Cargos disponibles**: verificar que el selector ofrece una opción inicial «Seleccione un cargo» y, a continuación, «Jefe de planta / Gerente de operaciones», «Encargado de bodega y logística», «Supervisor de producción / Jefe de turno» e «Inspector de calidad (QA)».
3. **Acceso correcto**: elegir «Inspector de calidad (QA)», introducir la clave ficticia `QA-2026` y confirmar; comprobar que se entra al Panel y que el marco muestra el rol activo.
4. **Errores claros**: intentar entrar sin cargo, con la clave vacía o con una clave de otro cargo; esperar el mensaje explicativo y el bloqueo del ingreso (escenario 4).
5. **Permisos QA**: con la sesión de QA, editar `producedQty`, `scrapQty`, `qualityResult` y notas, usar el filtro de resultado de calidad y mover órdenes desde *en control de calidad* (aprobar, devolver a producción o rechazar); comprobar que las secciones, campos, filtros y transiciones de otros cargos están deshabilitados o rechazan la acción con un mensaje (escenario 7). Las secciones de ejecución y los campos de máquina/lote no aparecen.
6. **Otros cargos**: cerrar sesión, entrar como jefe de planta (`PLANT-2026`), bodega (`WH-2026`) o supervisor (`PROD-2026`) y comprobar que solo pueden ver y modificar lo que su cargo permite; el jefe de planta conserva el recorrido completo de US1-US15.
7. **Persistencia y cierre**: cerrar o cambiar de sesión, volver a `view-login` y entrar con otro cargo; verificar que productos y órdenes siguen intactos (SC-015). Recargar con sesión activa conserva el rol; abrir sin sesión muestra el acceso. La sesión se guarda únicamente en `erp_base_module:session`.
8. **Aislamiento XR-007**: comprobar que cargos, claves y permisos aparecen solo en `src/module-config.js` y que `tests/unit/domain-boundary.test.js` (T099) fallaría si se filtraran a archivos centrales.

La verificación automatizada correspondiente está en T087-T101: validación centralizada en `src/domain/config-schema.js`, motor genérico en `src/domain/access.js`, sesión en `src/session.js`, integración del recorrido y E2E `tests/e2e/access.spec.js`. Los fixtures E2E heredados inician sesión automáticamente como jefe de planta para preservar US1-US15.

## Seguridad de renderizado (FR-050)

Introduzca estos payloads en nombre, código, notas y campos de texto, guárdelos y visualícelos en lista, detalle, insignias y mensajes de error:

- `<script>alert(1)</script>`
- `"><img src=x onerror=alert(1)>`
- `javascript:alert(1)` en un campo que pueda mostrarse como enlace

Resultado esperado: el texto se muestra literalmente, no se ejecuta ningún script, no se crean nodos `img`/`script` inesperados y no se abren URLs `javascript:`. Repita tras recargar para cubrir datos persistidos.

## Configuración inválida

- Introduzca temporalmente en `module-config.js` una operación de regla no permitida, una referencia a un campo inexistente o un filtro con un estado fuera del ciclo de vida.
- Esperado: aviso visible de configuración inválida (FR-025) y vuelta a valores predeterminados seguros, sin romper la aplicación.

## Rendimiento

- La prueba E2E `tests/e2e/performance.spec.js` siembra 500 productos y 300 órdenes y mide la interacción.
- Verifique que la lista, los filtros, la búsqueda y los indicadores responden sin bloqueo perceptible y que las agregaciones no se recalculan por cada render.
- Umbrales automatizados: render de la lista < 5 s, filtro < 3 s, primera búsqueda < 3 s, búsqueda sin coincidencias < 3 s y apertura de detalle < 3 s.
- Confirme que la búsqueda no provoca recarga completa de la página.

## Automatización implementada

- **Unitarias**: evaluación de predicados, operaciones del motor, cálculo de indicadores/merma, agrupación de costos, validación de configuración, escape/URLs seguras, regla de stock bajo (incluido el caso "sin dato") y guarda estructural de SC-008/XR-006 (`tests/unit/domain-boundary.test.js`).
- **Integración**: lista/detalle de documentos, insignias, secciones de indicadores, guardas de transición, formularios de ejecución y calidad, edición/borrado en cascada, búsqueda con 500 registros, renderizado seguro de payloads y filtros por prioridad (US14) y resultado de calidad (US15), incluida su combinación con el filtro de estado.
- **E2E (Playwright)**: crear/editar/eliminar/buscar producto; crear/gestionar orden; confirmar/rechazar pedido; registrar ejecución; completar control de calidad; verificar sanitización, persistencia tras recarga y rendimiento con 500 productos y 300 órdenes.
- **US16 (Fase 19)**: unitarias de validación centralizada y motor de permisos (`tests/unit/domain/access.test.js`, `tests/unit/access.test.js`), integración del recorrido (`tests/integration/role-access.test.js`), E2E `tests/e2e/access.spec.js` y ampliación de la guarda XR-007 en `tests/unit/domain-boundary.test.js`. Los fixtures heredados autentican como jefe de planta para preservar US1-US15.

## Resultados de validación (2026-11-17)

| Puerta | Resultado |
|---|---|
| `npm test` | 40 archivos / 294 pruebas en verde (incluye US1-US15, T087-T090 y la guarda de SC-008/XR-006/XR-007) |
| `npm run lint` | Sin errores |
| `npm run format:check` | Pasa: `"endOfLine": "auto"` en `.prettierrc.json` y estilo normalizado con Prettier |
| `npm run build` | Compilación de producción correcta (24 módulos, 4 archivos generados) |
| `npm run test:e2e` | 14/14 pruebas en verde (11 heredadas + 3 de US16) |
| Aviso de configuración inválida | No aparece con `userConfig = manufacturingConfig` |
| Cambios en código central para el perfil | Ninguno; todo el perfil es declarativo (SC-008, XR-006, XR-007) |
| US16 (acceso por cargo) | Implementada en la Fase 19 (T087-T101); recorrido manual verificado y puertas en verde |

Los recorridos manuales de esta guía siguen siendo la referencia para validar la experiencia de usuario; la puerta automatizada debe ejecutarse antes de cerrar cada incremento. La línea base de US1-US15 se preserva: los fixtures E2E y de integración inician sesión automáticamente como jefe de planta.

## Validación de la demo de manufactura

- Compilación, lint y formato correctos. Pasaron 294 pruebas unitarias y de integración y 14 recorridos en Chrome.
- El recorrido de la demo comprueba que la lupa queda fuera del área de texto a 390 px, encuentra los guantes y su orden, y elimina una copia de una orden ficticia al recargar.
- Los filtros de prioridad y calidad se pueden combinar con el estado y limpiar individualmente. Al limpiar todos los filtros reaparecen los seis folios, incluido el casco con prioridad sin dato.

**Cobertura resuelta (C1)**: los filtros de prioridad (US14) y resultado de calidad (US15) tienen pruebas de integración (T072 y T075 en `tasks.md`) que verifican coincidencias, combinación con el filtro de estado y limpieza individual. Ambas pasan dentro de las 294 pruebas; US14, US15 y la puerta T086 están cerrados. `npm run format:check` también pasa con `endOfLine: "auto"`.
