# Contrato de Almacenamiento de Entidades y Documentos

## Propósito

La aplicación almacena los registros de entidad (datos maestros) y de documento (transaccionales) localmente en el navegador usando `localStorage`. Este contrato define la forma persistida, las operaciones y las expectativas de validación. El comportamiento de los campos personalizados y de las reglas de dominio se complementa con [module-extension.md](module-extension.md).

## Forma de los Datos

Cada registro de entidad debe incluir:

- `id`: cadena única
- `entity_id`: cadena única, generada automáticamente, usada para vincular documentos
- `name`: cadena no vacía
- `code`: cadena no vacía
- `taxId`: cadena opcional (identificación fiscal)
- `email`: cadena opcional con formato de correo válido cuando está presente
- `phone`: cadena opcional
- `address`: cadena opcional
- `category`: cadena opcional
- `description`: cadena opcional
- `targetDate`: cadena de fecha opcional (YYYY-MM-DD) válida cuando está presente
- `creditLimit`: número opcional no negativo
- `paymentTerms`: cadena opcional
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

A estos campos base se añaden los campos personalizados declarados en `module-config.js` para el target `entity` (por ejemplo, en manufactura: `itemType`, `unitOfMeasure`, `currentStock`, `minStock`, `leadTimeDays`, `supplier`).

## Operaciones

- `loadEntities()`: devuelve todas las entidades almacenadas.
- `saveEntities(entities)`: persiste la lista completa.
- `addEntity(entity)`: añade una nueva entidad.
- `updateEntity(id, updates)`: actualiza una entidad existente.
- `deleteEntity(id)`: elimina una entidad por id.
- `searchEntities(term)`: devuelve las entidades que coinciden en campos base y personalizados.
- `validateEntity(entity)`: devuelve los errores de validación antes de persistir.

## Almacenamiento de Documentos

Cada registro de documento debe incluir:

- `id`: cadena única
- `entity_id`: el entity_id autogenerado de la entidad vinculada
- `series`: cadena opcional que agrupa folios consecutivos
- `folio`: entero positivo obligatorio; junto con la serie forma el número oficial del documento
- `startDate`: cadena de fecha de calendario válida
- `endDate`: cadena de fecha de calendario válida, igual o posterior a startDate
- `quantity`: entero positivo opcional
- `subtotal`: número no negativo opcional
- `discount`: número no negativo opcional; no puede superar el subtotal
- `taxAmount`: número no negativo opcional
- `totalAmount`: número no negativo opcional
- `currency`: cadena opcional
- `paymentTerms`: cadena opcional
- `notes`: cadena opcional
- `status`: cadena opcional
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

A estos campos base se añaden los campos personalizados declarados para el target `document` (por ejemplo, en manufactura: `processStage`, `machine`, `batchCode`, `priority`, `producedQty`, `scrapQty`, `qualityResult`, `responsible`).

Operaciones:

- `loadDocuments()`: devuelve todos los documentos almacenados.
- `saveDocuments(documents)`: persiste la lista completa.
- `addDocument(document)`: añade un nuevo documento.
- `updateDocument(id, updates)`: actualiza un documento existente.
- `deleteDocument(id)`: elimina un documento por id.
- `deleteDocumentsForEntity(entityId)`: elimina todos los documentos vinculados a una entidad eliminada.
- `validateDocument(document)`: devuelve los errores de validación antes de persistir.

## Campos Personalizados

- Los campos personalizados se guardan como propiedades del mismo registro, junto a los campos base, sin tablas ni claves separadas.
- La clave de cada campo personalizado no puede coincidir con un campo base ni repetirse dentro del mismo target; la validación de configuración lo impide (ver [module-extension.md](module-extension.md)).
- El tipo declarado guía la validación y el control de formulario: `text`, `number`, `date` o `select`.
- Un campo personalizado opcional ausente se guarda como ausente o cadena vacía; nunca se convierte implícitamente en `0`.
- Un campo personalizado obligatorio ausente o vacío se rechaza antes de persistir.
- Los campos personalizados participan en la búsqueda y en las vistas declaradas (columnas, filtros, detalle, indicadores y reglas).

## Valores Ausentes y Cálculos

- Un valor ausente no equivale a cero para métricas, insignias ni reglas.
- Las métricas que dependen de valores ausentes muestran "sin dato" o se omiten, según se declare.
- Ejemplo: la insignia de stock bajo se aplica solo si `currentStock` y `minStock` existen y `currentStock < minStock`.
- Los totales de costo se agrupan por moneda; nunca se suman importes de monedas distintas.

## Expectativas de Validación

- Un `name` o `code` faltante debe rechazarse antes de la persistencia.
- Un `email` presente debe tener formato de correo válido y un `creditLimit` presente debe ser un número no negativo.
- Un documento sin `folio` entero positivo debe rechazarse; un `discount` mayor que el `subtotal` debe rechazarse.
- Un entity_id debe generarse automáticamente y debe ser único.
- Un documento sin un `entity_id` que coincida con una entidad existente debe rechazarse.
- Un campo personalizado de tipo `number` debe contener un número finito; los valores negativos se rechazan cuando la configuración lo declara (stock, cantidades producidas, merma, plazo de reposición).
- Un campo personalizado de tipo `select` debe contener una de las opciones declaradas.
- Un campo personalizado de tipo `date` debe ser una fecha válida `YYYY-MM-DD`.
- Las reglas y guardas declaradas en `module-config.js` se evalúan antes de persistir; si una guarda falla, la operación se rechaza con el mensaje configurado.
- Eliminar una entidad también debe eliminar todos los documentos vinculados a su entity_id.
- Las operaciones de almacenamiento deben preservar el orden actual de la lista y actualizar las marcas de tiempo.

## Expectativas de Extensibilidad

- Los campos adicionales añadidos por módulos personalizados deben persistirse junto a los campos base sin manejo especial en la capa de almacenamiento.
- Las operaciones base anteriores permanecen estables para que los módulos personalizados puedan construir sobre ellas sin modificación.
- La lógica de dominio (predicados, indicadores, insignias y guardas) no vive en la capa de almacenamiento; se declara en `module-config.js` y se evalúa en `src/domain/`.
- Añadir un campo, una regla o un indicador no debe requerir cambios en `storage.js`.
