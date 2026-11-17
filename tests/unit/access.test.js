import { describe, it, expect } from 'vitest';
import {
  authenticate,
  authenticationError,
  can,
  isFieldEditable,
  isSectionVisible,
  isFilterAllowed,
  isTransitionAllowed
} from '../../src/domain/access.js';

const grants = {
  views: ['dashboard', 'documents'],
  actions: ['document.update'],
  sections: ['quality'],
  fields: { document: ['producedQty', 'scrapQty', 'qualityResult', 'notes'] },
  filters: ['qualityResult'],
  transitions: [
    { from: 'en control de calidad', to: 'terminada' },
    { from: 'en control de calidad', to: 'en producción' }
  ]
};

const access = {
  enabled: true,
  sessionKey: 'erp_base_module:session',
  labels: {
    loginTitle: 'Acceso por cargo',
    role: 'Cargo',
    secret: 'Clave',
    activeRole: 'Rol activo',
    logout: 'Cerrar sesión',
    missingRole: 'Seleccione un cargo.',
    emptySecret: 'Introduzca la clave.',
    invalidSecret: 'La clave no corresponde al cargo.'
  },
  roles: [
    { id: 'qa', label: 'Inspector', secret: 'QA-2026', grants },
    { id: 'manager', label: 'Responsable', secret: 'PLANT-2026', grants: { ...grants, actions: ['document.create'] } }
  ]
};

describe('US16 - authenticate', () => {
  it('autentica cuando el cargo y la clave coinciden', () => {
    expect(authenticate(access, 'qa', 'QA-2026')).toEqual({
      roleId: 'qa',
      label: 'Inspector',
      grants
    });
  });

  it('devuelve null cuando el cargo no existe', () => {
    expect(authenticate(access, 'unknown', 'QA-2026')).toBeNull();
  });

  it('devuelve null cuando falta el cargo o la clave', () => {
    expect(authenticate(access, '', 'QA-2026')).toBeNull();
    expect(authenticate(access, 'qa', '')).toBeNull();
  });

  it('devuelve null cuando la clave no corresponde al cargo', () => {
    expect(authenticate(access, 'qa', 'PLANT-2026')).toBeNull();
  });

  it('explica si falla el cargo, la clave o la clave vacía', () => {
    expect(authenticationError(access, '', 'QA-2026')).toMatch(/cargo/i);
    expect(authenticationError(access, 'qa', '')).toMatch(/clave/i);
    expect(authenticationError(access, 'qa', 'incorrecta')).toMatch(/clave/i);
    expect(authenticationError(access, 'qa', 'QA-2026')).toBeNull();
  });
});

describe('US16 - decisiones de permiso genéricas', () => {
  it('can resuelve vistas, acciones, secciones y filtros', () => {
    expect(can(grants, 'views', 'documents')).toBe(true);
    expect(can(grants, 'views', 'entities')).toBe(false);
    expect(can(grants, 'actions', 'document.update')).toBe(true);
    expect(can(grants, 'actions', 'document.delete')).toBe(false);
    expect(can(grants, 'sections', 'quality')).toBe(true);
    expect(can(grants, 'filters', 'qualityResult')).toBe(true);
  });

  it('can resuelve campos por destino y transiciones por par', () => {
    expect(can(grants, 'fields', { target: 'document', field: 'qualityResult' })).toBe(true);
    expect(can(grants, 'fields', { target: 'entity', field: 'qualityResult' })).toBe(false);
    expect(can(grants, 'transitions', { from: 'en control de calidad', to: 'terminada' })).toBe(true);
    expect(can(grants, 'transitions', { from: 'planificada', to: 'liberada' })).toBe(false);
  });

  it('atajos cubren campos, secciones, filtros y transiciones', () => {
    expect(isFieldEditable(grants, 'document', 'notes')).toBe(true);
    expect(isFieldEditable(grants, 'document', 'machine')).toBe(false);
    expect(isSectionVisible(grants, 'quality')).toBe(true);
    expect(isSectionVisible(grants, 'execution')).toBe(false);
    expect(isFilterAllowed(grants, 'qualityResult')).toBe(true);
    expect(isFilterAllowed(grants, 'priority')).toBe(false);
    expect(isTransitionAllowed(grants, 'en control de calidad', 'en producción')).toBe(true);
    expect(isTransitionAllowed(grants, 'liberada', 'en producción')).toBe(false);
  });
});
