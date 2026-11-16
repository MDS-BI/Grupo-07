Feedback Avance 01 (26/10/26)

- no hay avance en plan ni data-model

Proximos pasos:
 
- rectificar puntos anteriores 
- trabajar en los specs (historias de usuario, US) para definir tareas
- dividirse las US y tareas para una siguiente iteracion (avances cada semana)
- ejecutar una version integrada de prueba

 Feedback Avance 02 (2/11/26)

- Se observa importante avance incremental
- Se observan historias de usuario por cada miembro del grupo, muy bien.
- Evitar trabajar con modelos de IA fuera de speckit en local, porque crean ramas nuevas y se pierde la integridad del proyecto

Proximos pasos:

- crear tareas a partir de los specs nuevos
- hacer primera implmentacion, registar modificaciones/incremental y volver al spec
- dividir el grupo entre modificaciones (ajustes previos) e incremental (nueva funcionalidad)
- integrar nueva version en 2 semanas

Feedback Avance 03 (16/11/26)

**Cambios en la especificación**

- spec.md se reescribió: se añadió la sección Clarifications (05/11), se corrigieron las HU2/HU3 ("la lista" pasa a ser los resultados de Buscar) y se añadieron HU6-HU13 y escenarios nuevos (p. ej. «Solo stock bajo»). tasks.md pasó de 28 a 88 tareas, con fases por historia y dependencias.
- Hay incoherencias: el encabezado de spec.md aún dice "perfil de manufactura pendiente (Fases 1-16)", pero tasks.md declara las 78 tareas completadas. Además, las Fases 17-18 (HU14/HU15) y T081-T088 no tienen historia en spec.md (en lo visible).

**Consistencia sitio–especificación**

- T082 y T085 (pruebas de filtros de prioridad y calidad en `tests/integration/document-list.test.js`) están sin marcar. No verificable si ya existen, porque el archivo no se incluyó.
- T083/T086 piden registrar resultados en `quickstart.md`, que no se incluyó: no verificable.
- `index.html` mantiene textos fijos ("Entidades", "Nueva Entidad", "Buscar registros") y fallas de etiqueta ("Producto:", "Indicadores" en `app.js`), lo que contradice T054 y HU6.
- `index.html` repite `error-paymentTerms` en entidad y documento (ID duplicado).
- `src/main.js` carga datos demo (`demo-data.js`), que no figuran en la especificación.
- hacer mejoras de funcionalidad e interfaz de usuario, incluir data simulada para probar campos, incluir mejoras de estilo, transicion, navegacion, etcetera.

Presentacion de MVP final en 2 semanas.
