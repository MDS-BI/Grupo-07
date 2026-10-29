# Especificación de la Funcionalidad: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama de la funcionalidad**: 001-erp-base-module  
**Creada**: 2026-07-08  
**Estado**: Borrador  
**Entrada**: Descripción del usuario: "Construir un módulo base de software de planificación de recursos empresariales (ERP) que pueda extenderse en módulos ERP personalizados. Debe proporcionar gestión de datos maestros (entidades) y documentos transaccionales vinculados con capacidades de crear/editar/eliminar/buscar."

## Propósito

Este proyecto sirve como módulo base reutilizable para construir módulos ERP personalizados. Establece los patrones comunes que todo módulo ERP necesita: gestionar registros de datos maestros (**Entidades**) y sus **Documentos** transaccionales asociados, con navegación, validación, persistencia y búsqueda ya implementadas, de modo que los módulos personalizados solo necesiten definir sus campos y reglas específicos del dominio.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 0 - Ejemplo

### Historia de Usuario 1 - Evaluar el pedido desde el módulo de ventas, confirmarlo o rechazarlo y supervisar indicadpres y costos. (Prioridad: P1)
Como jefe de planta o gerente de operaciones, quiero evaluar si la planta es capaz de producir el pedido que llega de Ventas, confirmarlo o rechazarlo, y supervisar los indicadores y costos de las órdenes, para no afecrar a la planta con pedidos que no puede cumplir y para tener control de cómo está funcionando la operación.

**Por qué esta prioridad**: Es la puerta de entrada al recorrido de toda orden: nada se fabrica hasta que alguien decide que la planta puede hacerlo. Aceptar un pedido sin evaluarlo genera atrasos, sobrecarga de máquinas y problemas con el cliente; rechazarlo por error significa perder una venta. Además, sin una forma de supervisar indicadores y costos, la decisión se toma a ciegas y no se puede saber si la planta está cumpliendo.

**Prueba Independiente**:  Un usuario abre la lista de órdenes y ubica un pedido pendiente de decisión; revisa su detalle y la carga actual de la planta; confirma el pedido y comprueba que pasa a liberada; rechaza otro y comprueba que pasa a cancelada y ya no se puede avanzar; por último, abre la vista de indicadores y costos y ve los datos reflejando las órdenes almacenadas.

**Escenarios de Aceptación**:

1. **Dado** que Ventas ha enviado pedidos a la planta, **cuando** el usuario abre la lista de órdenes y filtra las que están en estado *planificada*, **entonces** ve los pedidos pendientes de decisión, cada uno con su número (serie y folio), producto, cantidad, fecha de inicio, fecha de entrega y estado.
2. **Dada** una orden pendiente de decisión, **cuando** el usuario abre su detalle, **entonces** ve todos los datos del pedido, incluidos los importes registrados
y las notas, para poder evaluarlo.
3. **Dado** que el usuario está evaluando un pedido, **cuando** consulta las órdenes que están *en producción*, **entonces** ve qué se está fabricando en ese momento y en qué máquina, para juzgar si la planta tiene capacidad.
4. **Dado** que el usuario está evaluando un pedido, **cuando** consulta el producto del pedido, **entonces** ve su stock actual junto al stock mínimo; si el producto no tiene stock registrado, se indica "sin dato" y no cero.
*Confirmar el pedido*
 
6. **Dada** una orden *planificada*, **cuando** el usuario la confirma, **entonces** la orden pasa a *liberada*, el cambio se refleja en la lista y la orden queda disponible para continuar con su ejecución.
7. **Dada** una orden confirmada, **cuando** el usuario vuelve a la lista, **entonces** la orden aparece como *liberada* y deja de figurar entre los pedidos pendientes de decisión.
*Rechazar el pedido*
 
8. **Dada** una orden *planificada*, **cuando** el usuario la rechaza, **entonces** la orden pasa a *cancelada* y el cambio se refleja en la lista.
9. **Dado** que el usuario rechaza un pedido, **cuando** quiere dejar constancia del motivo, **entonces** puede anotarlo en las notas de la orden; el motivo es opcional.
10. **Dada** una orden *cancelada*, **cuando** el usuario intenta cambiar su estado (por ejemplo, volver a liberarla), **entonces** el sistema indica que es un
estado final y no lo permite.
11. **Dado** que se intenta una transición no permitida por cualquier vía (por ejemplo, de *planificada* directamente a *en producción*), **cuando** se envía, **entonces** el sistema la rechaza con una explicación clara.
*Supervisar indicadores y costos*
 
12. **Dadas** órdenes en distintos estados, **cuando** el usuario abre la vista de indicadores, **entonces** ve cuántas órdenes hay en cada estado.
13. **Dada** una orden cuya fecha de entrega ya pasó y cuyo estado no es *terminada* ni *cancelada*, **cuando** el usuario consulta los indicadores, **entonces** la orden se identifica como retrasada y se muestra cuántas hay.
14. **Dada** una orden con cantidad producida y merma registradas, **cuando** el usuario consulta los indicadores, **entonces** ve el porcentaje de merma de la orden, calculado como la merma dividida por la cantidad producida.
15. **Dadas** órdenes con subtotal, descuento, impuesto y total registrados, **cuando** el usuario consulta los costos, **entonces** ve esos importes por orden, con su moneda.
16. **Dadas** órdenes en distintas monedas, **cuando** el usuario consulta los costos totales, **entonces** el sistema muestra un total por cada moneda y no los suma entre sí.
17. **Dado** que no hay órdenes almacenadas, **cuando** el usuario abre la vista de indicadores y costos, **entonces** se muestran valores en cero y un estado vacío claro, sin errores.

---

### Historia de Usuario 2 - Editar y eliminar productos (Prioridad: P1)

Como jefe de planta, quiero poder corregir o modificar los datos de un producto o borrarlo
cuando ya no lo usamos, para que el catálogo siempre esté al día.

**Por qué esta prioridad**: Si el catálogo tiene datos viejos o productos que ya
no existen, alguien puede emitir una orden de producción con información
equivocada o inexistente, y eso se arrastra a todo lo demás.

**Prueba Independiente**: Un usuario cambia el stock de un producto y ve el
cambio en la lista; después elimina otro producto y comprueba que ya no aparece
ni en la lista ni al buscarlo.

**Escenarios de Aceptación**:

1. **Dado** un producto que ya existe, **cuando** el usuario cambia sus datos
   (por ejemplo, el stock o el proveedor) y guarda, **entonces** los cambios se
   guardan y se ven reflejados en la lista.
2. **Dado** un producto que se está editando, **cuando** el usuario borra el
   nombre, el código, el tipo de ítem o la unidad de medida y trata de guardar,
   **entonces** el sistema no lo deja y explica qué dato falta.
3. **Dado** un producto que se está editando, **cuando** el usuario escribe un
   valor no válido en el stock o en el plazo de reposición (por ejemplo, un
   número negativo), **entonces** el sistema no guarda y avisa cuál es el error.
4. **Dado** un producto que ya no se usa y no tiene órdenes, **cuando** el
   usuario lo elimina, **entonces** desaparece de la lista y deja de salir en
   los resultados de búsqueda.
5. **Dado** un producto que tiene órdenes de producción, **cuando** el usuario
   intenta eliminarlo, **entonces** el sistema le avisa que también se borrarán
   esas órdenes y pide confirmación antes de hacerlo.
6. **Dado** el aviso del escenario anterior, **cuando** el usuario confirma,
   **entonces** se elimina el producto junto con todas sus órdenes; si cancela,
   no se borra nada.

### Historia de Usuario 3 - Administrar el catalogo de stock, ubicaciones, proveedores, plazos de reposicion, controlar cuanto hay en bodega y que el minimo no deba bajar (Prioridad: P1)

Como encargado de bodega y logistica, quiero administrar el catalogo de stock de materias primas, insumo y productos terminados, la ubicacion, los proveedores y plazos de reposicion, para asi saber cuanto hay en bodega y reponer si esta bajo el minimo de stock.

**Por qué esta prioridad**: Sin un control de stock ni un catalogo actualizado, la planta no puede planificar ni producir ordenes. Si se realiza una actualizacion y mandencion del stock y cantidades en bodega se puede llevar un buen proceso de manofactura.

**Prueba Independiente**: Un usuario registra un item con nombre, stock actual, stock minimo, ubicacion, proveedor y plazo de reposicion; se ve en la lista, edita su stock, comprueba si queda señalado por estar bajo el minimo y lo elimina.

**Escenarios de Aceptación**:

1. **Dado** que un usuario esta viendo en la lista de items, **cuando** crea un nuebvo item con nombre, codigo, tipo (Materia prima, Insumo o Producto terminado), stock actual, stock minimo, proveeder, plazo de reposicion y ubicacion, **entonces** el nuevo item se guarda y aparece en la lista con esos datos.
2. **Dado** que un usuario esta creando un item, **cuando** deja algun espacio o dato sin rellenar, **entonces** el sistema no lo guarda y le explica lo que falta para guardar correctamente.
3. **Dado** un campo personalizado tipo numerico (stock actual, stock minimo o plazo de reposicion), **cuando** un usuario ingresa un valor que no es un numero, **entonces** el sistema no lo guarda y explica el error.
4. **Dado** un item ya existente en la lista, **cuando** un usuario edita su stock actual, stock minimo, plazo de reposicion, ubicacion o proveedor, **entonces** la informacion se actualiza en la lista correctamente.
5. **Dado** un item con stock actual bajo el stock minimo, **cuando** el usuario ve la lista, **entonces** le aparece que el item se encuentra con "stock bajo el minimo". 
6. **Dado** que un usuario deja el sock minimo o stock actual en blanco, **cuando** guarde el item en la lista, **entonces** quedara guardado igualmente y la lista mostrara en ese apartado "sin datos".
7. **Dado** un item que ya no se utiliza **cuando** el usuario lo elimina **entonces** desaparecera de la lista y no aparecera en los resultados de busqueda.

---

### Historia de Usuario 4 - Supervisar la ejecución de las órdenes de producción durante el turno (Prioridad: P1)

Como supervisor de producción o jefe de turno, quiero consultar las órdenes liberadas, asignar la máquina y registrar la etapa del proceso, el lote y las cantidades producidas, para coordinar el trabajo del turno y enviar los lotes fabricados a control de calidad.

**Por qué esta prioridad**: Una vez que el jefe de planta confirma un pedido, es necesario organizar y supervisar su fabricación. Mantener actualizada la información permite saber qué se está produciendo, en qué máquina y en qué etapa se encuentra cada orden, facilitando la continuidad entre turnos y la posterior inspección de calidad.

**Prueba Independiente**: Un usuario consulta las órdenes liberadas, selecciona una, registra la máquina y el lote e inicia su producción. Luego actualiza la etapa del proceso y la cantidad producida, registra una incidencia en las notas y envía la orden a control de calidad. Al abrirla nuevamente, comprueba que los datos y el estado quedaron guardados.

**Escenarios de Aceptación**:

1. **Dado** que existen órdenes confirmadas por el jefe de planta, **cuando** el usuario consulta las órdenes en estado liberada, **entonces** puede identificar su número, producto, cantidad solicitada, prioridad y fechas de inicio y entrega.
2. **Dada** una orden liberada, **cuando** el usuario abre su detalle, **entonces** puede consultar las instrucciones y registrar o actualizar la máquina asignada, el lote y la etapa del proceso.
3. **Dada** una orden liberada, **cuando** el usuario inicia su fabricación, **entonces** la orden cambia a en producción y el cambio se refleja en su detalle y en la lista.
4. **Dado** una orden en producción, **cuando** el usuario actualiza la etapa del proceso y la cantidad producida y guarda los cambios, **entonces** el sistema conserva la información y la muestra al volver a consultar la orden.
5. **Dado** una orden en producción que presenta una detención, falla de máquina u otra incidencia, **cuando** el usuario describe lo ocurrido en las notas y guarda, **entonces** la observación queda asociada a la orden para informar al siguiente turno y al inspector de calidad.
6. **Dada** que el usuario registra una cantidad producida o una merma, **cuando** introduce un valor negativo o no numérico, **entonces** el sistema impide guardar e indica qué valor debe corregirse.
7. **Dada** una orden cuya fabricación ha concluido, **cuando** el usuario cambia su estado de en producción a en control de calidad, **entonces** la orden queda disponible para la inspección, conservando el producto, la máquina, el lote, las cantidades y las notas registradas.
8. **Dada** una orden devuelta por el inspector de calidad a en producción, **cuando** el supervisor abre su detalle, **entonces** puede consultar las observaciones de calidad y actualizar los datos de fabricación para realizar la corrección solicitada.
9. **Dado** una orden corregida que se encuentra en producción, **cuando** el supervisor la envía nuevamente a en control de calidad, **entonces** el sistema conserva los datos actualizados para una nueva revisión del inspector.
10. **Dado** una orden planificada, terminada o cancelada, **cuando** se intenta una transición no permitida para iniciar o retomar su producción, **entonces** el sistema rechaza el cambio y muestra una explicación clara.

---

### Historia de Usuario 5 - Inspeccionar los lotes fabricados, registrar la merma y determinadad del producto (Prioridad: P1-P2)

Como inspector de calidad (QA), quiero poder inspeccionar y registrar: 
1.-  El lote fabricado, contra las especificaiones que solicita mi entrada.
2.-  La cantidad producida de producto ('CantidadQA').
3.- La merma del producto ('MermaQA').
4.- La calidad del producto ('CalidadQA').
Además de poder aprobar el cierre de la orden 'Aprobada' (dejarla como termianda), devolverla a producción si no se cumple alguno de los estandares de calidad, para la corrección del producto 'Corrección' además de dejar una nota ('nota') o un si es necesario solicitar un nuevo lote por defectos incorregibles 'Rechazado'.

**Por qué esta prioridad**: ES EL ÚLTIMO FILTRO para dar por finalizado una orden de un lote de cualquier orden que esté produciendo la planta, además de verificar que los productos cumplan al menos con la calidad mínima requerida y si no lo hace, corregir o solicitar un nuevo lote, cuantificar las perdidas (mermas).

**Prueba Independiente**: El usuario selecciona la orden de producción que se encuentra en estado 'en control de calidad', ingresa la cantidad producida y la merma, selecciona si cumple con la calidad la aprueba 'Aprobada', redirige a corrección si no cumple 'Corrección' o solicita que se rehaga el lote 'Rechazado'.

**Escenarios de Aceptación**:

1. **Dada** la orden de producción que finalizo su estapa de fabricación y pasó a 'en control de calidad', **Cuando** el inspector de calidad abre la orden para su revisión, **entonces** puede comparar el lote contra las especificaciónes de entrada, registrar la cantidad producida de producto ('CantidadQA'), la merma del producto C y La calidad del producto ('CalidadQA': 'Pendiente', 'Aprobado', 'Correción' o 'Rechazado').
2. **Dada** una orden en estado 'en control de calidad' cuyo lote cumple las espicificaciones de entrada, **Cuando** el inspector registra el resultado ('Aprobado'), guarda los datos 'CantidadQA' y 'MermaQA' y cambia el estado de la orden de 'en control de calidad' a 'finalizada', **entonces** el sistema actualiza la orden y la marca a su fase final. 
3. **Dada** una orden en estado 'en control de calidad' cuyo lote presenta defectos o discrepancias respecto a las especificaciones de entrada, **Cuando** el inspector registra el resultado ('Correción'), anota las observaciones en ('notas') y cambia el estado de 'en control de calidad' a 'en producción',  **entonces** el sistema actualiza la orden y permite que regrese a producción conservando los datos y enviandolos para que la planta realice la correción, manteniendo el registro de la merma ('MermaQA') para su gestión.
4. **Dada** una orden en estado 'en control de calidad' con fallas graves o irreparables, **Cuando** el inspector registra el resultado ('Rechazado') y cambia el estado de 'en control de calidad' a 'cancelada',  **entonces** el sistema cierra la orden de en estado final 'cancelada' manteniendo el registro de la merma ('MermaQA') para su gestión.
5. **Dada**  una orden en estado 'en control de calidad'  **Cuando**  el inspector introduce un valor incorrecto ya sea negativo (<0) o un valor no numérico en 'CantidadQA' o 'MermaQA' o intenta cambiar el estado a otro distinto de 'finalizada', 'en producción' o 'cancelada'  **entonces** el sistema impide guardar y muestra un mensaje explicando el error cometido.

---

### Historia de Usuario 6 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

Como desarrollador de módulos, quiero que todas las etiquetas visibles para el usuario deriven de la configuración, para que un módulo adaptado hable su idioma de dominio de forma consistente en todo momento.

**Por qué esta prioridad**: Los usuarios confían en un módulo que dice consistentemente "Cliente" y "Pedido de Venta" en lugar de dejar filtrarse una "Entidad" genérica por media interfaz; la terminología inconsistente hace que los módulos adaptados parezcan rotos. Esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador mapea Entidad→Cliente y Documento→Pedido de Venta en la configuración, y cada pestaña, botón, etiqueta de formulario, encabezado y mensaje en las tres pantallas usa los términos mapeados.

**Escenarios de Aceptación**:

1. **Dados** mapeos de términos definidos en la configuración, **cuando** cualquier pantalla carga, **entonces** pestañas, botones, etiquetas de formulario, encabezados y mensajes de estado vacío muestran los términos configurados.
2. **Dado** que las etiquetas han sido remapeadas, **cuando** el usuario navega entre pantallas, **entonces** el comportamiento de navegación no cambia.
3. **Dado** que no se proporcionan mapeos, **cuando** cualquier pantalla carga, **entonces** se muestran los términos predeterminados Entidad/Documento.

---

### Historia de Usuario 7 - Declarar campos personalizados para los registros (Prioridad: P1)

Como desarrollador de módulos, quiero declarar campos adicionales para entidades y documentos en la configuración, para que aparezcan automáticamente en formularios, listas, validación y búsqueda sin escribir código de interfaz.

**Por qué esta prioridad**: Los módulos personalizados existen porque sus registros contienen datos específicos del dominio (el límite de crédito de un cliente, la fecha de vencimiento de una factura). Si añadir campos requiere editar formularios y validación a mano, la adaptación es propensa a errores y no escala. Esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador declara un campo numérico obligatorio personalizado en las entidades; se muestra como entrada numérica en el formulario, bloquea el guardado cuando está en blanco, muestra los valores guardados en las listas y coincide en las búsquedas.

**Escenarios de Aceptación**:

1. **Dado** un campo personalizado de entidad de tipo número declarado como obligatorio, **cuando** el usuario crea o edita una entidad, **entonces** el campo se muestra como entrada numérica y un valor en blanco impide guardar con una explicación clara.
2. **Dado** un campo personalizado con un valor guardado, **cuando** el usuario ve la lista o la vista de detalle, **entonces** el valor se muestra.
3. **Dados** campos personalizados declarados, **cuando** el usuario busca usando un término que coincide con un valor de campo personalizado, **entonces** se devuelven los registros coincidentes.
4. **Dado** que no hay campos personalizados declarados, **cuando** la aplicación se ejecuta, **entonces** el comportamiento es idéntico al del módulo base sin modificar.

---

### Historia de Usuario 8 - Buscar y encontrar entidades rápidamente (Prioridad: P2)
Como usuario de negocio, quiero buscar mis entidades por detalles clave para encontrar rápidamente el registro que necesito.

**Por qué esta prioridad**: La recuperación rápida mejora la utilidad cuando el conjunto de datos crece más allá de un pequeño número de entradas.

**Prueba Independiente**: Un usuario puede introducir un término de búsqueda y ver solo las entidades coincidentes.

**Escenarios de Aceptación**:

1. **Dadas** múltiples entidades almacenadas, **cuando** el usuario busca con un término coincidente, **entonces** solo se muestran las entidades coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** el sistema muestra un estado vacío claro y permite volver a intentarlo.
3. **Dadas** cientos de entidades almacenadas, **cuando** el usuario busca, **entonces** los resultados coincidentes aparecen con prontitud sin retraso perceptible.

---

### Historia de Usuario 9 - Registrar una fecha objetivo (Prioridad: P2)
Como usuario de negocio, quiero adjuntar una fecha objetivo opcional a una entidad para planificar y ordenar los registros según cuándo vence algo.

**Por qué esta prioridad**: La planificación consciente de fechas mejora el valor central cuando el conjunto de datos crece, pero no es necesaria para la gestión básica.

**Prueba Independiente**: Un usuario puede fijar una fecha en una entidad y verla mostrada en la lista.

**Escenarios de Aceptación**:

1. **Dado** que un usuario está creando o editando una entidad, **cuando** introduce una fecha objetivo, **entonces** la fecha se guarda y se muestra en la lista.
2. **Dada** una entidad con fecha fijada, **cuando** el usuario ve la lista, **entonces** las entidades con fechas pueden identificarse de un vistazo.
3. **Dado** que un usuario deja la fecha en blanco, **cuando** guarda la entidad, **entonces** la entidad igualmente se guarda sin fecha (campo opcional).

---

### Historia de Usuario 10 - Registrar los detalles de documentos de una entidad (Prioridad: P2)
Como usuario de negocio, quiero registrar detalles de documentos para una entidad, para mantener la actividad transaccional organizada junto a cada registro de datos maestros.

**Por qué esta prioridad**: Los documentos aportan valor operativo práctico una vez que las entidades están gestionadas, pero no son necesarios para la gestión central.

**Prueba Independiente**: Un usuario puede añadir un documento a una entidad y ver los detalles del documento mostrados junto a esa entidad.

**Escenarios de Aceptación**:

1. **Dada** una entidad en la lista, **cuando** el usuario añade un documento con detalles, **entonces** el documento se guarda y queda asociado a esa entidad.
2. **Dado** un documento existente para una entidad, **cuando** el usuario selecciona esa entidad en la pantalla de gestión, **entonces** los detalles del documento se muestran en la vista de gestión de documentos.
3. **Dada** una entidad eliminada, **cuando** se confirma la eliminación, **entonces** sus documentos asociados también se eliminan.
4. **Dado** que un usuario está creando un documento, **cuando** deja la información obligatoria del documento en blanco, **entonces** el sistema impide guardar y explica qué se necesita.

---

### Historia de Usuario 11 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

Como usuario de negocio, quiero una pantalla de búsqueda dedicada para encontrar rápidamente entidades sin que los formularios de edición saturen la vista.

**Por qué esta prioridad**: La recuperación rápida es valiosa cuando el conjunto de datos crece, y una pantalla separada mantiene enfocada la experiencia de gestión, pero la búsqueda no es necesaria para la gestión básica.

**Prueba Independiente**: Un usuario puede abrir la pantalla de búsqueda desde la barra lateral o una acción rápida, introducir un término de búsqueda y ver solo las entidades coincidentes.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** introduce un término coincidente, **entonces** solo se muestran las entidades coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** se muestra un estado vacío claro y puede volver a intentarlo.
3. **Dadas** cientos de entidades almacenadas, **cuando** el usuario busca desde la pantalla de búsqueda, **entonces** los resultados aparecen con prontitud sin retraso perceptible.
4. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** activa el botón Panel en la barra lateral, **entonces** vuelve al panel de inicio.

---

### Historia de Usuario 12 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

Como desarrollador de módulos, quiero definir los estados permitidos de los documentos y las transiciones permitidas, para que los documentos sigan el ciclo de vida del dominio en lugar de aceptar texto de estado arbitrario.

**Por qué esta prioridad**: Los módulos reales necesitan ciclos de vida controlados (p. ej., cotización → pedido → facturado), pero el estado de texto libre sigue siendo aceptable para extensiones simples, así que esto mejora la base sin ser necesario para la adaptación básica. Esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador configura un ciclo de vida cotización→pedido→facturado; el control de estado ofrece solo estados siguientes válidos, las transiciones inválidas se rechazan con una explicación, y el estado es visible de un vistazo en las listas.

**Escenarios de Aceptación**:

1. **Dado** un ciclo de vida configurado, **cuando** el usuario edita el estado de un documento, **entonces** solo se ofrecen los estados alcanzables mediante transiciones permitidas.
2. **Dado** que se intenta una transición inválida por cualquier vía, **cuando** se envía, **entonces** el sistema la rechaza con una explicación clara.
3. **Dado** un ciclo de vida configurado, **cuando** el usuario ve listas o detalles de documentos, **entonces** el estado actual es identificable de un vistazo.
4. **Dado** que no hay ciclo de vida configurado, **cuando** se editan documentos, **entonces** el estado permanece como texto libre igual que en el módulo base sin modificar.

---

### Historia de Usuario 13 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

Como usuario de negocio, quiero un espacio de trabajo estilo ERP consistente, con una barra superior con marca y una barra lateral de módulos presentes en cada pantalla, para que la aplicación se sienta como un sistema empresarial coherente en lugar de páginas sueltas.

**Por qué esta prioridad**: El marco aporta la marca y la navegación de todas las demás pantallas; construirlo como envoltorio evita tocar cada historia por separado y da al módulo su identidad ERP. Depende del perfil de configuración (Historia de Usuario 5) para el nombre del módulo y la terminología, y reestructura la navegación antes proporcionada por los botones de bienvenida y las pestañas de gestión (Historias de Usuario 3 y 4).

**Prueba Independiente**: En cada pantalla, una barra superior muestra un logotipo derivado del nombre del módulo junto al nombre del módulo, una barra lateral ofrece botones de módulo para Panel, Entidades, Documentos y Buscar con el módulo activo resaltado visualmente, y navegar entre módulos nunca pierde datos.

**Escenarios de Aceptación**:

1. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la página, **entonces** es visible una barra superior que contiene un logotipo SVG en línea derivado del nombre del módulo y el nombre del módulo configurado.
2. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la barra lateral, **entonces** se muestran botones de módulo para Panel, Entidades, Documentos y Buscar usando la terminología configurada.
3. **Dado** que el usuario está en cualquier pantalla, **cuando** mira la barra lateral, **entonces** el botón del módulo activo está resaltado visualmente.
4. **Dado** que la ventana gráfica es estrecha, **cuando** se usa la aplicación en una pantalla pequeña, **entonces** la barra lateral se contrae a una columna de iconos manteniéndose utilizable y etiquetada de forma accesible.
5. **Dada** una configuración que define un color de acento, **cuando** cualquier pantalla carga, **entonces** el marco lo usa consistentemente para resaltados y controles principales; sin valor configurado o con un valor inválido, se usan los valores predeterminados integrados sin errores.
6. **Dado** que el usuario navega entre módulos mediante la barra lateral, **cuando** inspecciona sus datos después, **entonces** todas las entidades y documentos almacenados permanecen intactos.

---

### Casos Límite

- ¿Qué ocurre cuando un usuario intenta guardar una entidad sin nombre o código obligatorio?
- ¿Cómo gestiona el sistema una búsqueda que no devuelve coincidencias?
- ¿Qué ocurre si un usuario intenta editar o eliminar una entidad que ya no existe?
- ¿Qué ocurre cuando un usuario introduce una fecha objetivo que no es una fecha de calendario válida?
- ¿Qué ocurre con los documentos de una entidad cuando esta se elimina?
- ¿Qué ocurre cuando un usuario introduce una fecha final anterior a la fecha inicial en un documento?
- ¿Qué ocurre cuando la configuración declara un campo personalizado cuya clave choca con un nombre de campo base?
- ¿Qué ocurre cuando la configuración referencia un tipo de campo desconocido o una definición de transición de ciclo de vida inválida?
- ¿Qué ocurre cuando los registros almacenados contienen valores de campos personalizados que ya no están declarados en la configuración?
- ¿Qué ocurre cuando un usuario abre la aplicación directamente en la pantalla de gestión o búsqueda (p. ej., vía enlace profundo o recarga del navegador) sin pasar por el panel de inicio?
- ¿Qué ocurre cuando un usuario pulsa el botón atrás del navegador estando en la pantalla de gestión o búsqueda?
- ¿Qué ocurre si un usuario navega fuera de la pantalla de gestión mientras un formulario aún tiene cambios sin guardar?
- ¿Permanecen intactas las entidades y los documentos al navegar entre el panel, la gestión y la búsqueda?
- ¿Qué ocurre cuando el panel se abre con cero entidades o cero documentos (valores estadísticos)?
- ¿Qué ocurre cuando el color de acento configurado no es un valor de color válido?
- ¿Cómo mantiene la barra lateral contraída las etiquetas de módulo accesibles en ventanas gráficas estrechas?

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE permitir a los usuarios crear un registro de entidad con al menos un nombre y un código.
- **FR-002**: El sistema DEBE permitir a los usuarios editar los detalles de un registro de entidad existente.
- **FR-003**: El sistema DEBE permitir a los usuarios eliminar un registro de entidad existente.
- **FR-004**: El sistema DEBE permitir a los usuarios buscar registros de entidad por nombre, código, categoría u otras palabras clave descriptivas.
- **FR-005**: El sistema DEBE mostrar una lista clara de entidades e indicar cuándo ningún resultado coincide con una búsqueda.
- **FR-006**: El sistema DEBE presentar retroalimentación clara cuando falta información obligatoria o no se puede completar una acción.
- **FR-007**: El sistema DEBE mantener los datos de entidad consistentes tras operaciones de creación, edición y eliminación.
- **FR-008**: El sistema DEBE permitir a los usuarios añadir, editar y eliminar detalles de documentos de una entidad.
- **FR-009**: El sistema DEBE asociar cada documento exactamente a una entidad y eliminar los documentos asociados cuando la entidad se elimina.
- **FR-010**: El sistema DEBE mostrar un panel de inicio como vista inicial, con botones de acción rápida claramente etiquetados para las tareas ERP clave.
- **FR-011**: El sistema DEBE envolver cada pantalla en un marco de espacio de trabajo persistente compuesto por una barra superior con marca y una barra lateral de navegación de módulos.
- **FR-012**: La barra lateral DEBE proporcionar botones de módulo para Panel, Entidades, Documentos y Buscar, etiquetados desde la configuración del módulo.
- **FR-013**: El botón de módulo Entidades DEBE mostrar el contenido de gestión de entidades.
- **FR-014**: El botón de módulo Documentos DEBE mostrar el contenido de gestión de documentos en la pantalla de gestión.
- **FR-015**: El botón de módulo Panel DEBE devolver al usuario al panel de inicio.
- **FR-016**: La pantalla de gestión NO DEBE mostrar la lista de entidades.
- **FR-017**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar entidades.
- **FR-018**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar documentos.
- **FR-019**: El sistema DEBE navegar a una pantalla de búsqueda dedicada cuando se selecciona el botón Buscar en la barra lateral.
- **FR-020**: La pantalla de búsqueda DEBE permitir buscar entidades por nombre, código, categoría, descripción o fecha objetivo.
- **FR-021**: La pantalla de búsqueda DEBE ser accesible tanto desde la barra lateral como desde la acción rápida de buscar registros del panel.
- **FR-022**: El sistema DEBE mantener los datos de entidades y documentos intactos y consistentes durante la navegación entre pantallas.
- **FR-023**: El sistema DEBE cargar la configuración del módulo al arrancar y aplicarla en todas las pantallas.
- **FR-024**: El sistema DEBE retroceder a los valores predeterminados integrados (terminología Entidad/Documento, sin campos personalizados, sin ciclo de vida) cuando no se proporciona configuración.
- **FR-025**: El sistema DEBE informar claramente de una configuración inválida o conflictiva en lugar de fallar silenciosamente.
- **FR-026**: El sistema DEBE mostrar los campos personalizados declarados en los formularios de creación/edición con tipos de entrada que coincidan con sus tipos declarados.
- **FR-027**: El sistema DEBE validar los valores de campos personalizados, incluidos los obligatorios, antes de guardar, usando la misma experiencia de retroalimentación que la validación base.
- **FR-028**: El sistema DEBE incluir los valores de campos personalizados en los resultados de búsqueda y mostrarlos en listas y vistas de detalle.
- **FR-029**: El sistema DEBE derivar todas las etiquetas visibles para el usuario de la configuración del módulo en lugar de texto fijo en el código.
- **FR-030**: El sistema DEBE aplicar las transiciones de estado configuradas en los documentos independientemente de cómo se envíe un cambio.
- **FR-031**: El sistema DEBE mantener el estado del documento como texto libre cuando no hay ciclo de vida configurado.
- **FR-032**: El sistema DEBE mantener el renderizado de listas y la búsqueda ágiles y correctos para conjuntos de datos de al menos 500 registros de entidad.
- **FR-033**: El panel DEBE ofrecer al menos cuatro botones de acción rápida: nueva entidad, nuevo documento, abrir gestión de entidades y buscar registros.
- **FR-034**: Activar la acción rápida de nueva entidad o nuevo documento DEBE abrir el área de gestión correspondiente con un formulario vacío listo para introducir datos.
- **FR-035**: El panel DEBE mostrar tarjetas de estadísticas con el número de entidades y documentos almacenados, actualizadas cada vez que se muestra el panel.
- **FR-036**: La barra superior DEBE mostrar un logotipo derivado del nombre del módulo junto con el nombre del módulo configurado en cada pantalla.
- **FR-037**: La barra lateral DEBE resaltar visualmente el módulo activo en cada pantalla.
- **FR-038**: La configuración PUEDE definir un color de acento; el sistema DEBE aplicarlo consistentemente en todo el marco y retroceder de forma segura a los valores integrados cuando esté ausente o sea inválido.
- **FR-039**: En ventanas gráficas estrechas, la barra lateral DEBE contraerse a una columna de iconos manteniéndose operable.

### Requisitos de Extensibilidad *(obligaciones del módulo base)*

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de entidad y documento con campos adicionales específicos del dominio sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, pestañas, formularios y listas con terminología específica del módulo sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, y eliminación en cascada.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

- **Entidad**: Un registro de datos maestros gestionado por el módulo, que incluye su nombre, código de negocio, detalles descriptivos, categoría de clasificación, una fecha objetivo opcional y un entity_id autogenerado. Los módulos personalizados definen qué representa una Entidad en el mundo real (p. ej., cliente, producto, activo).
- **Documento**: Detalles transaccionales adjuntos a una entidad, vinculados a ella por el entity_id de la entidad. Los módulos personalizados definen qué representa un Documento (p. ej., pedido, factura, contrato).
- **ModuleConfig**: El objeto de adaptación cargado al arrancar que define el nombre del módulo, las etiquetas de terminología, las definiciones de campos personalizados y el ciclo de vida de estados de documentos. Consulte data-model.md para su forma completa.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Los usuarios pueden crear una nueva entidad y verla en la lista en menos de 2 minutos.
- **SC-002**: Los usuarios pueden encontrar una entidad existente mediante la búsqueda en menos de 10 segundos tras introducir un término relevante.
- **SC-003**: Al menos el 90% de los usuarios de prueba pueden completar tareas de crear, editar, eliminar y buscar sin ayuda.
- **SC-004**: El sistema sigue siendo utilizable para un conjunto de datos de al menos 500 registros de entidad sin pérdida de funcionalidad central.
- **SC-005**: Un usuario puede alcanzar las pantallas de gestión y búsqueda desde el panel o la barra lateral en menos de 10 segundos en el primer uso.
- **SC-006**: Toda la funcionalidad existente de gestión de entidades y documentos sigue operativa tras el rediseño del marco ERP y el panel (sin regresiones).
- **SC-007**: Los usuarios pueden navegar entre las pantallas de panel, gestión y búsqueda sin perder ninguna entidad ni documento almacenado.
- **SC-008**: Un desarrollador puede producir un módulo adaptado usando solo el archivo de configuración, con cero modificaciones en archivos fuente centrales.
- **SC-009**: Cada pantalla presenta el mismo marco con marca, y los usuarios pueden identificar en qué módulo están de un vistazo.
- **SC-010**: Las estadísticas de registros mostradas en el panel siempre coinciden con el número de entidades y documentos almacenados.

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo en lugar de una base de datos multiinquilino compartida.
- La adaptación a un módulo específico se realiza mediante un archivo de configuración del módulo en lugar de editando archivos fuente centrales.
- Cada entidad incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan los campos específicos del dominio.
- La versión inicial se centra en la gestión central de datos maestros y documentos en lugar de capacidades ERP avanzadas como flujos de aprobación, períodos de contabilización o informes.
- La búsqueda se realiza sobre los registros de entidad almacenados.
- La pantalla de gestión consolida los formularios de añadir/editar entidad y añadir/editar documento en una sola pantalla de gestión.
- La navegación entre áreas ocurre mediante una barra lateral persistente; la pantalla de gestión aloja ambos paneles de gestión y no muestra la lista de entidades.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una pantalla a la vez; no hay diseño lado a lado del contenido de gestión y búsqueda.
- La navegación entre pantallas se maneja dentro de la aplicación (p. ej., cambio de vistas), y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos siguen persistiéndose en el localStorage del navegador y no se ven afectados por la navegación entre pantallas.
- La pantalla de búsqueda se centra en encontrar y ver entidades; la edición permanece en la pantalla de gestión.
- El contenido del usuario introducido por el usuario (nombres, descripciones, notas de documentos) DEBE sanitizarse antes de renderizarse en el DOM para prevenir ataques de inyección de scripts (XSS). El módulo base DEBE escapar HTML y atributos de eventos al mostrar datos de localStorage.

