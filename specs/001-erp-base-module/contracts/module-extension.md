# Contrato de Extensión del Módulo

## Propósito

Definir el contrato que permite adaptar el módulo base a un dominio —incluido el perfil de manufactura de las Historias de Usuario 1-5— sin modificar archivos fuente centrales. La adaptación se expresa como datos declarativos en `src/module-config.js`; el motor genérico de `src/domain/` los interpreta.

Este contrato satisface SC-008 y XR-006.

## Forma de la Configuración

```js
{
  moduleName: string,
  labels: {
    entity: string,
    entities: string,
    document: string,
    documents: string
  },
  customFields: [
    {
      target: 'entity' | 'document',
      key: string,
      label: string,
      type: 'text' | 'number' | 'date' | 'select',
      required?: boolean,
      options?: string[] // obligatorio para type 'select'
    }
  ],
  statusLifecycle: null | {
    statuses: string[],
    transitions: Record<string, string[]>
  },
  theme: {
    accentColor?: string // hexadecimal #RGB o #RRGGBB
  },
  domain: {
    documentList: {
      columns: string[],
      filters: Array<{
        key: string,
        op: string,
        optionsFrom?: string,
        value?: unknown
      }>,
      detailSections: Array<{
        title: string,
        fields: string[]
      }>
    },
    indicators: Array<{
      id: string,
      type: 'countByField' | 'countWhere' | 'ratio',
      label: string,
      field?: string,
      numerator?: string,
      denominator?: string,
      where?: Predicate
    }>,
    costSummary?: {
      groupBy: string,
      fields: string[]
    },
    badges: Array<{
      target: 'entity' | 'document',
      when: Predicate,
      label: string,
      tone?: 'info' | 'warning' | 'danger'
    }>,
    rules: Array<{
      target: 'entity' | 'document',
      when?: Predicate,
      require: Predicate,
      message: string
    }>
  }
}
```

### Predicados

```js
type Predicate =
  | { field: string, op: Operator, value?: unknown, ref?: string }
  | { all: Predicate[] }
  | { any: Predicate[] }
```

Operadores permitidos: `eq`, `neq`, `in`, `notIn`, `lt`, `lte`, `gt`, `gte`, `exists`, `blank`.

`ref` permite comparar dos campos del mismo registro, por ejemplo `{ field: 'currentStock', op: 'lt', ref: 'minStock' }`. `value: 'today'` se interpreta como la fecha actual en formato `YYYY-MM-DD`.

## Reglas del Contrato

1. La configuración no contiene funciones, `eval`, `Function` ni expresiones arbitrarias.
2. Toda clave de campo debe existir en los campos base o en `customFields`; de lo contrario la configuración es inválida.
3. Los tipos de indicador, operador, tono y tipo de campo deben pertenecer a las listas permitidas.
4. Los estados de filtros y transiciones deben existir en `statusLifecycle`.
5. Las vistas deben declarar al menos una columna y las secciones de detalle al menos un campo.
6. Los campos ausentes no se convierten en cero. Las métricas e insignias dependientes de valores ausentes muestran "sin dato" o se omiten según corresponda.
7. Si hay errores, la aplicación muestra el aviso de configuración inválida (FR-025) y usa los valores predeterminados seguros.

## Operaciones del Motor

- `validateDomainConfig(config)`: devuelve la configuración normalizada y la lista de errores.
- `resolveColumns(config, target)`: devuelve las columnas visibles y sus etiquetas.
- `applyFilters(records, filters)`: filtra registros sin mutar la lista original.
- `computeIndicator(indicator, records)`: calcula conteos, retrasos o ratios.
- `summarizeCosts(records, costSummary)`: agrupa importes por moneda sin sumar monedas distintas.
- `evaluatePredicate(predicate, record)`: evalúa un predicado de lista blanca.
- `evaluateRules(target, record, config)`: devuelve los mensajes de las reglas incumplidas antes de persistir.

## Garantía de Extensibilidad

- Cambiar de dominio requiere editar `module-config.js` o reemplazar su contenido, no los archivos de `src/` que implementan el motor.
- `manufacturingConfig` es un ejemplo completo del perfil de manufactura; activarlo consiste en asignarlo a `userConfig`.
- Añadir un campo, una columna, un filtro, un indicador, una insignia o una guarda no requiere tocar `app.js`, `storage.js`, `shell.js` ni los componentes genéricos.

## Seguridad de Renderizado

- Los valores de usuario se escapan antes de insertarse en el DOM (FR-050).
- Las plantillas con `innerHTML` solo pueden contener marcado estático controlado por el código.
- Los valores de configuración también se escapan al mostrarse en mensajes de error.
- No se permiten manejadores de eventos inline ni URLs `javascript:` en datos de usuario.
- Las pruebas deben cubrir payloads como `<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>` y `javascript:alert(1)`.

## Compatibilidad

- Sin configuración, la aplicación usa los valores predeterminados Entidad/Documento y el comportamiento del módulo base.
- Las configuraciones existentes que solo usan `moduleName`, `labels`, `customFields`, `statusLifecycle` y `theme` siguen siendo válidas; `domain` es opcional.
- Las claves de campos personalizados no pueden chocar con campos base ni repetirse dentro del mismo target.
