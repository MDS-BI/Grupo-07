import { describe, it, expect } from 'vitest';
import { validateAccessConfig, validateDomainConfig } from '../../../src/domain/config-schema.js';

const lifecycle = {
  statuses: ['planificada', 'liberada', 'en control de calidad', 'terminada', 'cancelada'],
  transitions: {
    planificada: ['liberada', 'cancelada'],
    liberada: ['en control de calidad', 'cancelada'],
    'en control de calidad': ['terminada', 'en producción', 'cancelada'],
    terminada: [],
    cancelada: []
  }
};

function role(overrides = {}) {
  return {
    id: 'inspector',
    label: 'Inspector',
    secret: 'QA-2026',
    grants: {
      views: ['dashboard', 'documents'],
      actions: ['document.update'],
      sections: ['quality'],
      fields: { document: ['producedQty', 'qualityResult'] },
      filters: ['qualityResult'],
      transitions: [{ from: 'en control de calidad', to: 'terminada' }],
      ...overrides.grants
    },
    ...overrides
  };
}

function access(overrides = {}) {
  return {
    enabled: true,
    sessionKey: 'erp_base_module:session',
    labels: {
      loginTitle: 'Acceso por cargo',
      role: 'Cargo',
      secret: 'Clave',
      activeRole: 'Rol activo',
      logout: 'Cerrar sesión'
    },
    roles: [role()],
    ...overrides
  };
}

describe('FR-025 / US16 - validateAccessConfig', () => {
  it('devuelve la forma normalizada cuando la declaración es válida', () => {
    const result = validateAccessConfig(access(), lifecycle);

    expect(result.errors).toEqual([]);
    expect(result.access).not.toBeNull();
    expect(result.access.enabled).toBe(true);
    expect(result.access.sessionKey).toBe('erp_base_module:session');
    expect(result.access.roles).toHaveLength(1);
    expect(result.access.roles[0].grants.fields.document).toEqual(['producedQty', 'qualityResult']);
    expect(result.access.roles[0].grants.transitions).toEqual([{ from: 'en control de calidad', to: 'terminada' }]);
  });

  it('rechaza una lista de roles vacía', () => {
    const result = validateAccessConfig(access({ roles: [] }), lifecycle);

    expect(result.access).toBeNull();
    expect(result.errors.join(' ')).toMatch(/roles/i);
  });

  it('rechaza identificadores de rol duplicados', () => {
    const result = validateAccessConfig(access({ roles: [role(), role()] }), lifecycle);

    expect(result.access).toBeNull();
    expect(result.errors.join(' ')).toMatch(/duplicad/i);
  });

  it('rechaza una clave de verificación en blanco', () => {
    const result = validateAccessConfig(access({ roles: [role({ secret: '   ' })] }), lifecycle);

    expect(result.access).toBeNull();
    expect(result.errors.join(' ')).toMatch(/clave|secret/i);
  });

  it('rechaza una capacidad desconocida en grants', () => {
    const result = validateAccessConfig(
      access({ roles: [role({ grants: { views: ['dashboard'], deleteEverything: true } })] }),
      lifecycle
    );

    expect(result.access).toBeNull();
    expect(result.errors.join(' ')).toMatch(/desconocid|no permitid/i);
  });

  it('rechaza una transición que no existe en el ciclo de vida', () => {
    const result = validateAccessConfig(
      access({
        roles: [role({ grants: { transitions: [{ from: 'terminada', to: 'planificada' }] } })]
      }),
      lifecycle
    );

    expect(result.access).toBeNull();
    expect(result.errors.join(' ')).toMatch(/transición|transicion/i);
  });

  it('propaga los errores de access a la validación del dominio', () => {
    const result = validateDomainConfig(
      {
        domain: { access: access({ roles: [] }) },
        statusLifecycle: lifecycle
      },
      { entity: [], document: [] }
    );

    expect(result.domain).toBeNull();
    expect(result.errors.join(' ')).toMatch(/domain\.access.*roles|roles.*domain\.access/i);
  });
});
